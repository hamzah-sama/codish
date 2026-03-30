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

interface Props {
  projectId: Id<"projects">;
}
export const ConversationView = ({ projectId }: Props) => {
  const [copied, setCopied] = useState(false);
  const [selectedConversationId, setselectedConversationId] =
    useState<Id<"conversations"> | null>(null);
  const [input, setInput] = useState("");

  const conversations = useGetConversationByProject(projectId);

  const activeConversationId =
    selectedConversationId ?? conversations?.[0]?._id ?? null;

  const activeConversation = useGetConversationById(activeConversationId);

  const getMessage = useGetMessages(activeConversationId);

  const isProcessing = getMessage?.some(
    (message) => message.status === "processing",
  );

  const createConversation = useCreateConversation();
  const handleCreateConversation = async () => {
    try {
      const newConversationId = await createConversation({
        title: "untitled",
        projectId,
      });
      setselectedConversationId(newConversationId);
      return newConversationId;
    } catch (error) {
      toast.error("failed to create conversation");
      return null;
    }
  };

  const handleSubmitMessage = async (message: PromptInputMessage) => {
    if (!message.text || isProcessing) {
      setInput("");
      return;
    }

    let conversationId = activeConversationId;
    if (!conversationId) {
      conversationId = await handleCreateConversation();
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
    }
  };

  const handleCopyMessage = (message: string) => {
    if (copied) return;
    navigator.clipboard.writeText(message);
    setCopied(true);
    toast.success("Message copied to clipboard");
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="h-8.75 flex items-center justify-between border-b">
        <div className="text-sm truncate pl-3">
          {activeConversation?.title ?? DEFAULT_CONVERSATION_TITLE}
        </div>

        <div className="flex items-center px-1 gap-1">
          <Button size="icon-xs" variant="highlight">
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
                message.role === "assistant" &&
                index === (getMessage.length ?? 0) - 1 && (
                  <MessageActions>
                    <MessageAction
                      onClick={() => handleCopyMessage(message.content)}
                      label="copy"
                    >
                      {copied ? (
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
  );
};
