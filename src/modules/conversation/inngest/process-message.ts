import { inngest } from "@/inngest/client";
import { Id } from "../../../../convex/_generated/dataModel";
import { NonRetriableError } from "inngest";
import { convex } from "@/lib/convex-client";
import { api } from "../../../../convex/_generated/api";

interface MessageEvent {
  messageId: Id<"message">;
}

// event name : message/sent , id : process-message function to process message when message is sent and update message content to "Failed to process message" when processing fails
export const processMessage = inngest.createFunction(
  {
    id: "process-message",
    cancelOn: [
      {
        event: "message/cancel",
        if: "event.data.messageId == async.data.messageId",
      },
    ],

    // onFailure handler to update message content to "Failed to process message" when processing fails
    onFailure: async ({ event, step }) => {
      const { messageId } = event.data.event.data as MessageEvent;
      const internalKey = process.env.CODISH_CONVEX_INTERNAL_KEY;

      if (internalKey) {
        await step.run("update-message-on-failure", async () => {
          await convex.mutation(api.system.updateMessageContent, {
            internalKey,
            messageId,
            content:
              "My apologies, but I was unable to process your message. Please try again later.",
          });
        });
      }
    },
  },
  {
    event: "message/sent",
  },

  async ({ event, step }) => {
    const { messageId } = event.data as MessageEvent;

    const internalKey = process.env.CODISH_CONVEX_INTERNAL_KEY;
    if (!internalKey) {
      throw new NonRetriableError("Internal key not found");
    }

    await step.sleep("waiting for db-sync", "10s");

    await step.run("update-message-content", async () => {
      await convex.mutation(api.system.updateMessageContent, {
        internalKey,
        messageId,
        content: "hardcoded response from inngest function",
      });
    });
    return {
      messageId,
    };
  },
);
