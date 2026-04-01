import { convex } from "@/lib/convex-client";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import z from "zod";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { inngest } from "@/inngest/client";

const requestSchema = z.object({
  conversationId: z.string(),
  message: z.string(),
});

// function to handle POST request to create a new message for a conversation
export async function POST(request: Request) {
  // authenticate user using clerk auth
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // get internal key from environment variable if not found return error
  const internalKey = process.env.CODISH_CONVEX_INTERNAL_KEY;
  if (!internalKey) {
    return NextResponse.json(
      { error: "Internal key not found" },
      { status: 500 },
    );
  }

  // parse request body and validate using zod schema if invalid return error
  const body = await request.json();
  const { conversationId, message } = requestSchema.parse(body);
  

  // get conversation by id using convex query if not found return error
  const conversation = await convex.query(api.system.getConversationById, {
    internalKey,
    conversationId: conversationId as Id<"conversations">,
  });

  if (!conversation) {
    return NextResponse.json(
      { error: "Conversation not found" },
      { status: 404 },
    );
  }

  // get project id from conversation
  const projectId = conversation.projectId;

  // create message for the conversation using convex mutation if error return error
  await convex.mutation(api.system.createMessage, {
    internalKey,
    conversationId: conversationId as Id<"conversations">,
    content: message,
    projectId: projectId as Id<"projects">,
    role: "user",
  });

  const assistantMessageId = await convex.mutation(api.system.createMessage, {
    internalKey,
    conversationId: conversationId as Id<"conversations">,
    content: "",
    projectId: projectId as Id<"projects">,
    status: "processing",
    role: "assistant",
  });



  const event = await inngest.send({
    name: "message/sent",
    data: {
      conversationId,
      message,
      projectId,
      messageId: assistantMessageId,
    },
  });

  return NextResponse.json({
    success: true,
    messageId: assistantMessageId,
    eventId: event.ids[0],
  });
}
