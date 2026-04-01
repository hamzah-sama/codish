import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import z from "zod";
import { convex } from "@/lib/convex-client";
import { api } from "../../../../../convex/_generated/api";
import { Id } from "../../../../../convex/_generated/dataModel";
import { inngest } from "@/inngest/client";

const requestSchema = z.object({
  projectId: z.string(),
});

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
  const { projectId } = requestSchema.parse(body);

  const processingMessages = await convex.query(
    api.system.getProcessingMessage,
    {
      internalKey,
      projectId: projectId as Id<"projects">,
    },
  );

  if (processingMessages.length === 0) {
    return NextResponse.json({ succes: true, cancelled: false });
  }

  const cancellesdMessageIds = await Promise.all(
    processingMessages.map(async (msg) => {
      await inngest.send({
        name: "message/cancel",
        data: {
          messageId: msg._id,
        },
      });

      await convex.mutation(api.system.updateMessageStatus, {
        internalKey,
        messageId: msg._id,
        status: "cancelled",
      });

      return msg._id;
    }),
  );

  return NextResponse.json({
    success: true,
    cancelled: true,
    messageIds: cancellesdMessageIds,
  });
}
