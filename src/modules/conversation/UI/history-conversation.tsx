import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useGetConversationByProject } from "../hooks/use-conversation";
import { Id } from "../../../../convex/_generated/dataModel";
import { formatDistanceToNow } from "date-fns";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: Id<"projects">;
  onSelect: (conversationId: Id<"conversations">) => void;
}

export const HistoryConversation = ({
  open,
  onOpenChange,
  projectId,
  onSelect,
}: Props) => {
  const conversations = useGetConversationByProject(projectId);

  const handleSelect = (conversationId: Id<"conversations">) => {
    onSelect(conversationId);
    onOpenChange(false);
  };

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title="history conversation"
      description="search and select conversations"
    >
      <CommandInput placeholder="Search conversations" />
      <CommandList>
        <CommandEmpty>No conversations found.</CommandEmpty>
        <CommandGroup>
          {conversations?.map((conversation) => (
            <CommandItem
              key={conversation._id}
              value={`${conversation._id}-${conversation.title}`}
              onSelect={() => handleSelect(conversation._id)}
            >
              <div className="flex flex-col gap-0.5">
                <span>{conversation.title}</span>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(conversation.updatedAt, {
                    addSuffix: true,
                  })}
                </span>
              </div>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
};
