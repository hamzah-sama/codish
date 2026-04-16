import { convex } from "@/lib/convex-client";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import z from "zod";
import { api } from "../../../../convex/_generated/api";
import {
  adjectives,
  animals,
  colors,
  uniqueNamesGenerator,
} from "unique-names-generator";
import { DEFAULT_CONVERSATION_TITLE } from "@/modules/conversation/constant";
import { inngest } from "@/inngest/client";

const requestSchema = z.object({
  prompt: z.string(),
});
export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { prompt } = requestSchema.parse(body);

  const internalKey = process.env.CODISH_CONVEX_INTERNAL_KEY;
  if (!internalKey) {
    return NextResponse.json(
      { error: "server configuration error" },
      { status: 500 },
    );
  }

  const projectName = uniqueNamesGenerator({
    dictionaries: [adjectives, animals, colors],
    separator: "-",
    length: 3,
  });

  const { projectId, conversationId } = await convex.mutation(
    api.system.createProjectWithPrompt,
    {
      internalKey,
      ownerId: userId,
      projectName,
      conversationTitle: DEFAULT_CONVERSATION_TITLE,
    },
  );

  await convex.mutation(api.system.createMessage, {
    internalKey,
    projectId,
    conversationId,
    role: "user",
    content: prompt,
  });

  const assistantMessageId = await convex.mutation(api.system.createMessage, {
    internalKey,
    projectId,
    conversationId,
    role: "assistant",
    content: "",
    status: "processing",
  });

  await inngest.send({
    name: "message/sent",
    data: {
      messageId: assistantMessageId,
      conversationId,
      message: prompt,
      projectId,
    },
  });

  return NextResponse.json({ projectId });
}
