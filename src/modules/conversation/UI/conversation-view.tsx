import { useState } from "react";
import { Id } from "../../../../convex/_generated/dataModel";
import {
  useCreateConversation,
  useGetConversationById,
  useGetConversationByProject,
  useGetMessages,
} from "../hooks/use-conversation";
import { DEFAULT_CONVERSATION_TITLE } from "../constant";
import {
  CheckIcon,
  CopyIcon,
  HistoryIcon,
  Loader2Icon,
  PlusIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  PromptInput,
  PromptInputBody,
  PromptInputFooter,
  PromptInputMessage,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
} from "@/components/ai-elements/prompt-input";
import { toast } from "sonner";
import { Hint } from "@/components/hint";
import ky from "ky";
import {
  Conversation,
  ConversationContent,
} from "@/components/ai-elements/conversation";
import {
  Message,
  MessageAction,
  MessageActions,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";
import { HistoryConversation } from "./history-conversation";

interface Props {
  projectId: Id<"projects">;
}
export const ConversationView = ({ projectId }: Props) => {
  // copy message from AI assistant functionality
  const [copied, setCopied] = useState(false);
  const [copiedId, setCopiedId] = useState<Id<"message"> | null>(null);
  const handleCopyMessage = async (message: string, id: Id<"message">) => {
    if (copied) return;
    if (copiedId === id) return;

    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      setCopiedId(id);
      toast.success("Message copied to clipboard");
      setTimeout(() => setCopied(false), 1500);
    } catch (error) {
      toast.error("Failed to copy message");
    }
  };

  const [selectedConversationId, setselectedConversationId] =
    useState<Id<"conversations"> | null>(null);

  const [input, setInput] = useState("");
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // get all conversation for the project and set the first conversation as active conversation by default.
  const conversations = useGetConversationByProject(projectId);
  const activeConversationId =
    selectedConversationId ?? conversations?.[0]?._id ?? null;

  // get active conversation details by id.
  const activeConversation = useGetConversationById(activeConversationId);

  // get all processing message
  const getMessage = useGetMessages(activeConversationId);
  const isProcessing = getMessage?.some(
    (message) => message.status === "processing",
  );

  // create conversation functionality.
  const createConversation = useCreateConversation();
  const handleCreateConversation = async () => {
    try {
      const newConversationId = await createConversation({
        title: DEFAULT_CONVERSATION_TITLE,
        projectId,
      });
      setselectedConversationId(newConversationId);
      return newConversationId;
    } catch (error) {
      toast.error("failed to create conversation");
      return null;
    }
  };

  // submit button functionality is used for both submit and cancel request or message while processing. if there is no conversation, it will create a new conversation and still submit the message.
  const cancelMessage = async () => {
    try {
      await ky.post("/api/message/cancel", {
        json: {
          projectId,
        },
      });
    } catch (error) {
      toast.error("failed to cancel message");
    }
  };

  const handleSubmitMessage = async (message: PromptInputMessage) => {
    if (!message.text || isProcessing) {
      await cancelMessage();
      setInput("");
      return;
    }

    let conversationId = activeConversationId;
    if (!conversationId) {
      conversationId = await handleCreateConversation();
      if (!conversationId) return;
    }

    try {
      await ky.post("/api/message", {
        json: {
          conversationId,
          message: message.text,
        },
      });
      setInput("");
      return;
    } catch (error) {
      toast.error("failed to send message");
      setInput("");
    }
  };

  return (
    <>
      <HistoryConversation
        open={isHistoryOpen}
        onOpenChange={setIsHistoryOpen}
        projectId={projectId}
        onSelect={setselectedConversationId}
      />
      <div className="flex flex-col h-full">
        <div className="h-8.75 flex items-center justify-between border-b">
          <div className="text-sm truncate pl-3">
            {activeConversation?.title ?? DEFAULT_CONVERSATION_TITLE}
          </div>

          <div className="flex items-center px-1 gap-1">
            <Button
              size="icon-xs"
              variant="highlight"
              onClick={() => setIsHistoryOpen(true)}
            >
              <HistoryIcon className="size-3.5" />
            </Button>
            <Hint text="start new conversation" side="bottom" align="end">
              <Button
                size="icon-xs"
                variant="highlight"
                onClick={handleCreateConversation}
              >
                <PlusIcon className="size-3.5" />
              </Button>
            </Hint>
          </div>
        </div>
        <Conversation className="flex-1">
          <ConversationContent>
            {getMessage?.map((message, index) => (
              <Message
                from={message.role}
                className="flex flex-col gap-2"
                key={message._id}
              >
                <MessageContent>
                  {message.status === "processing" ? (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Loader2Icon className="size-3.5 animate-spin" />
                      <span>Thinking . . . </span>
                    </div>
                  ) : message.status === "cancelled" ? (
                    <span className="text-muted-foreground italic">
                      Request Cancelled
                    </span>
                  ) : (
                    <MessageResponse>{message.content}</MessageResponse>
                  )}
                </MessageContent>
                {message.status === "completed" &&
                  message.role === "assistant" && (
                    <MessageActions>
                      <MessageAction
                        onClick={() =>
                          handleCopyMessage(message.content, message._id)
                        }
                        label="copy"
                      >
                        {copied && copiedId === message._id ? (
                          <CheckIcon className="size-3.5 text-green-500" />
                        ) : (
                          <CopyIcon className="size-3.5" />
                        )}
                      </MessageAction>
                    </MessageActions>
                  )}
              </Message>
            ))}
          </ConversationContent>
        </Conversation>
        <div className="p-3">
          <PromptInput className="mt-2" onSubmit={handleSubmitMessage}>
            <PromptInputBody>
              <PromptInputTextarea
                placeholder="Ask codish anything..."
                className="mt-2"
                onChange={(e) => setInput(e.target.value)}
                value={input}
                disabled={isProcessing}
              />
            </PromptInputBody>
            <PromptInputFooter>
              <PromptInputTools />
              <PromptInputSubmit
                disabled={isProcessing ? false : input.trim() === ""}
                status={isProcessing ? "streaming" : undefined}
              />
            </PromptInputFooter>
          </PromptInput>
        </div>
      </div>
    </>
  );
};
