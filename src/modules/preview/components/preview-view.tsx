import { useGetProjectSettings } from "@/modules/utils/useProject";
import { Id } from "../../../../convex/_generated/dataModel";
import { useWebContainer } from "../hooks/use-web-container";
import { Button } from "@/components/ui/button";
import {
  AlertTriangleIcon,
  Loader2Icon,
  RefreshCcwIcon,
  TerminalSquareIcon,
} from "lucide-react";
import { useState } from "react";
import { PreviewSettingsPopover } from "./preview-settings-popover";
import { Allotment } from "allotment";
import { PreviewTerminal } from "./preview-terminal";
interface Props {
  projectId: Id<"projects">;
}

export const PreviewView = ({ projectId }: Props) => {
  const [showTerminal, setShowTerminal] = useState(false);
  const getProjectSettings = useGetProjectSettings(projectId);

  const { status, previewUrl, error, terminalOutput, restart } =
    useWebContainer({
      projectId,
      enabled: true,
      settings: getProjectSettings!,
    });

  const isLoading = status === "booting" || status === "installing";

  return (
    <div className="flex flex-col h-full">
      <div className="h-8.75 flex items-center border-b shrink-0">
        <Button
          size="sm"
          variant="ghost"
          disabled={isLoading}
          onClick={restart}
          title="Restart container"
        >
          <RefreshCcwIcon className="size-3" />
        </Button>
        <div className="flex items-center flex-1 h-full border-x px-3 truncate text-xs text-muted-foreground font-mono">
          {isLoading && (
            <div className="flex items-center gap-1.5">
              <Loader2Icon className="size-3 animate-spin" />
              {status === "booting" ? "Starting" : "Installing"}
            </div>
          )}
          {previewUrl && <span className="truncate">{previewUrl}</span>}
          {!isLoading && !previewUrl && !error && <span>Ready to preview</span>}
        </div>
        <Button
          className="h-full rounded-none"
          size="sm"
          onClick={() => setShowTerminal((value) => !value)}
          variant="ghost"
          title="toggle terminal"
        >
          <TerminalSquareIcon className="size-3" />
        </Button>
        <PreviewSettingsPopover
          initialValue={getProjectSettings!}
          id={projectId}
          onSave={restart}
        />
      </div>
      <div className="flex-1 min-h-0">
        <Allotment vertical className="h-full">
          <Allotment.Pane>
            <div className="flex h-full min-h-0 flex-col">
              {error && (
                <div className="size-full flex items-center justify-center text-muted-foreground">
                  <div className="flex flex-col items-center gap-2 max-w-md mx-auto text-center">
                    <AlertTriangleIcon className="size-6" />
                    <p className="text-sm font-medium">{error}</p>
                    <Button onClick={restart} size="sm" variant="outline">
                      <RefreshCcwIcon className="size-3" /> Restart
                    </Button>
                  </div>
                </div>
              )}

              {isLoading && !error && (
                <div className="size-full flex items-center justify-center text-muted-foreground">
                  <div className="flex flex-col items-center gap-2 max-w-md mx-auto text-center">
                    <Loader2Icon className="size-6 animate-spin" />
                    <p className="text-sm font-medium">
                      {status === "booting" ? "Starting" : "Installing"}
                    </p>
                  </div>
                </div>
              )}

              {previewUrl && (
                <iframe src={previewUrl} className="border-0 w-full h-full" />
              )}
            </div>
          </Allotment.Pane>
          {showTerminal && (
            <Allotment.Pane minSize={100} maxSize={500} preferredSize={200}>
              <div className="h-full flex flex-col border-t">
                <div className="h-7 flex items-center px-3 text-xs gap-1.5 text-muted-foreground border-b border-border/50 shrink-0">
                  <TerminalSquareIcon className="size-3" />
                  Terminal
                </div>
                <PreviewTerminal output={terminalOutput} />
              </div>
            </Allotment.Pane>
          )}
        </Allotment>
      </div>
    </div>
  );
};
