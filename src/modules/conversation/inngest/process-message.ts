import { inngest } from "@/inngest/client";
import { createAgent, createNetwork, openai } from "@inngest/agent-kit";
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

    await step.sleep("waiting for db-sync", "1s");

    const conversation = await step.run("get-conversation", async () => {
      return await convex.query(api.system.getConversationById, {
        internalKey,
        conversationId,
      });
    });

    if (!conversation) {
      throw new NonRetriableError("Conversation not found");
    }

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

    // create ai agent
    const agent = createAgent({
      name: "codish",
      description:
        "An AI assistant that helps users with their questions and tasks.",
      system: `You are Codish, an AI assistant that helps users with their questions and tasks. You are integrated with various tools and APIs to provide accurate and helpful responses. Always be polite and concise in your responses. If you don't know the answer to a question, say you don't know instead of making something up.`,
      model: openai({ model: "gpt-4.1-mini" }),
      tools: [],
    });

    const network = createNetwork({
      name: "codish-network",
      agents: [agent],
      maxIter: 20,
      router: ({ network }) => {
        const lastResult = network.state.results.at(-1);
        const hasTextResponse = lastResult?.output.some(
          (t) => t.type === "text" && t.role === "assistant",
        );
        const hasToolCalls = lastResult?.output.some(
          (t) => t.type === "tool_call" && t.role === "assistant",
        );
        if (hasTextResponse && !hasToolCalls) {
          return undefined;
        }
        return agent;
      },
    });

    const result = await network.run(message);

    const lastResult = result.state.results.at(-1);
    const textMessage = lastResult?.output.find(
      (t) => t.type === "text" && t.role === "assistant",
    );

    let AgentResponse =
      "I processed your message, let me know if you need anything else.";

    if (textMessage?.type === "text") {
      AgentResponse =
        typeof textMessage.content === "string"
          ? textMessage.content.trim()
          : textMessage.content
              .map((t) => t.text)
              .join("")
              .trim();
    }

    await step.run("update-message-content-with-response", async () => {
      await convex.mutation(api.system.updateMessageContent, {
        internalKey,
        messageId,
        content: AgentResponse,
      });
    });

    return {
      success: true,
      messageId,
      conversationId,
    };
  },
);
