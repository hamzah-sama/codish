import { convex } from "@/lib/convex-client";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import z from "zod";
import { api } from "../../../../../convex/_generated/api";
import { inngest } from "@/inngest/client";

const requestSchema = z.object({
  url: z.url(),
});

function parseGithubUrl(url: string) {
  const parts = url.split("github.com/");
  if (parts.length < 2) {
    throw new Error("Invalid Github URL");
  }

  const path = parts[1].split("/");
  const [owner, repoRaw] = path;

  if (!owner || !repoRaw) {
    throw new Error("Invalid Github URL");
  }

  const repo = repoRaw.replace(".git", "");

  return { owner, repo };
}

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  const { url } = requestSchema.parse(body);

  const { owner, repo } = parseGithubUrl(url);

  const client = await clerkClient();
  const tokens = await client.users.getUserOauthAccessToken(userId, "github");
  const githubToken = tokens.data[0].token;

  if (!githubToken) {
    return NextResponse.json(
      {
        error: "github not connected, please reconnect to yout github account",
      },
      {
        status: 400,
      },
    );
  }

  const internalKey = process.env.CODISH_CONVEX_INTERNAL_KEY;
  if (!internalKey) {
    return NextResponse.json(
      { error: "server configuration error" },
      { status: 500 },
    );
  }

  const projectId = await convex.mutation(api.system.createProjectByImport, {
    internalKey,
    name: repo,
    ownerId: userId,
  });

  const event = await inngest.send({
    name: "github/import",
    data: {
      owner,
      repo,
      githubToken,
      projectId,
    },
  });

  return NextResponse.json({
    success: true,
    projectId,
    eventId: event.ids[0],
  });
}
