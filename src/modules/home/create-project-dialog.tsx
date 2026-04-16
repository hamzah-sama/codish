import {
  PromptInput,
  PromptInputBody,
  PromptInputFooter,
  PromptInputMessage,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
} from "@/components/ai-elements/prompt-input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import ky from "ky";
import { useState } from "react";
import { Id } from "../../../convex/_generated/dataModel";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}
export const CreateProjectDialog = ({ open, onOpenChange }: Props) => {
  const [prompt, setPrompt] = useState("");
  const [isSubmitting, setISSubmitting] = useState(false);
  const router = useRouter();

  const handleSubmit = async (message: PromptInputMessage) => {
    if (!message.text) return;
    setISSubmitting(true);
    try {
      const { projectId } = await ky
        .post("/api/create-project-with-prompt", {
          json: {
            prompt: message.text.trim(),
          },
        })
        .json<{ projectId: Id<"projects"> }>();

      toast.success("Project created...");
      onOpenChange(false);
      setPrompt("");
      router.push(`/projects/${projectId}`);
    } catch (error) {
      toast.error("failed to create project");
    } finally {
      setISSubmitting(false);
    }
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>What do you want to build?</DialogTitle>
          <DialogDescription>
            Describe your project you want to build and codish will help you
            create it.
          </DialogDescription>
        </DialogHeader>
        <PromptInput className="mt-2" onSubmit={handleSubmit}>
          <PromptInputBody>
            <PromptInputTextarea
              placeholder="Ask codish anything..."
              className="mt-2"
              onChange={(e) => setPrompt(e.target.value)}
              value={prompt}
              disabled={isSubmitting}
            />
          </PromptInputBody>
          <PromptInputFooter>
            <PromptInputTools />
            <PromptInputSubmit disabled={isSubmitting || !prompt} />
          </PromptInputFooter>
        </PromptInput>
      </DialogContent>
    </Dialog>
  );
};
