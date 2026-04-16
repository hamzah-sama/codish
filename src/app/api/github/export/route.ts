import { inngest } from "@/inngest/client";
import { convex } from "@/lib/convex-client";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import z from "zod";
import { api } from "../../../../../convex/_generated/api";
import { Id } from "../../../../../convex/_generated/dataModel";

const requestSchema = z.object({
  repoName: z
    .string()
    .min(1, "Repo name cannot be empty")
    .max(100, "Repo name cannot be longer than 100 characters"),
  projectId: z.string(),
  description: z.string().max(350).optional(),
  visibility: z.enum(["public", "private"]).default("private"),
});

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { projectId, description, visibility, repoName } =
    requestSchema.parse(body);

  const internalKey = process.env.CODISH_CONVEX_INTERNAL_KEY;
  if (!internalKey) {
    return NextResponse.json(
      { error: "server configuration error" },
      { status: 500 },
    );
  }
  const project = await convex.query(api.system.getProjectById, {
    internalKey,
    projectId: projectId as Id<"projects">,
  });

  if (!project || project.ownerId !== userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const event = await inngest.send({
    name: "github/export",
    data: {
      projectId,
      description,
      visibility,
      repoName,
      userId,
    },
  });

  return NextResponse.json({
    success: true,
    projectId,
    eventId: event.ids[0],
  });
}
