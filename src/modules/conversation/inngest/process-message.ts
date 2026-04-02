import { inngest } from "@/inngest/client";
import { createAgent, openai } from "@inngest/agent-kit";
import { Id } from "../../../../convex/_generated/dataModel";
import { NonRetriableError } from "inngest";
import { convex } from "@/lib/convex-client";
import { api } from "../../../../convex/_generated/api";
import { DEFAULT_CONVERSATION_TITLE } from "../constant";
import { TITLE_GENERATOR_SYSTEM_PROMPT } from "./constant";
import { text } from "stream/consumers";
import { success } from "zod";

interface MessageEvent {
  messageId: Id<"message">;
  conversationId: Id<"conversations">;
  message: string;
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
    const { messageId, conversationId, message } = event.data as MessageEvent;

    const internalKey = process.env.CODISH_CONVEX_INTERNAL_KEY;
    if (!internalKey) {
      throw new NonRetriableError("Internal key not found");
    }

    await step.sleep("waiting for db-sync", "30s");

    const conversation = await step.run("get-conversation", async () => {
      return await convex.query(api.system.getConversationById, {
        internalKey,
        conversationId,
      });
    });

    if (!conversation) {
      throw new NonRetriableError("Conversation not found");
    }

    // update message content to "Processing..." when message is sent
    await step.run("update-message-content", async () => {
      await convex.mutation(api.system.updateMessageContent, {
        internalKey,
        messageId,
        content: "hardcoded response from inngest function",
      });
    });

    // create auto generation title
    const shouldGenerateTitle =
      conversation.title === DEFAULT_CONVERSATION_TITLE;

    if (shouldGenerateTitle) {
      try {
        const generateTitle = createAgent({
          name: "generate-conversation-title",
          system: TITLE_GENERATOR_SYSTEM_PROMPT,
          model: openai({ model: "gpt-4.1-mini" }),
        });

        const { output } = await generateTitle.run(message, { step });

        const text = output.find(
          (t) => t.role === "assistant" && t.type === "text",
        );

        if (text?.type === "text") {
          const title =
            typeof text.content === "string"
              ? text.content.trim()
              : text.content
                  .map((t) => t.text)
                  .join("")
                  .trim();

          if (title) {
            await step.run("update-conversation-title", async () => {
              await convex.mutation(api.system.updateConversationTitle, {
                internalKey,
                conversationId,
                title,
              });
            });
          }
        }
      } catch (error) {
        console.error("Failed to generate title", error);
      }
    }

    return {
      success: true,
      messageId,
    };
  },
);
