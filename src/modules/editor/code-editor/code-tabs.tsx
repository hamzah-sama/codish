import { Id } from "../../../../convex/_generated/dataModel";
import { XIcon } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { Hint } from "@/components/hint";
import { cn } from "@/lib/utils";
import { FileIcon } from "@react-symbols/icons/utils";
import { forwardRef } from "react";
import { useGetFileName } from "@/modules/files/utils/useFile";

interface Props {
  fileId: Id<"files">;
  projectId: Id<"projects">;
  setActiveTab: (projectId: Id<"projects">, fileId: Id<"files">) => void;
  closeTab: (projectId: Id<"projects">, fileId: Id<"files">) => void;
  isActiveTab: boolean;
  isPreviewTab: boolean;
}

export const CodeTabs = forwardRef<HTMLDivElement, Props>(
  (
    { fileId, projectId, setActiveTab, closeTab, isActiveTab, isPreviewTab },
    ref,
  ) => {
    const fileName = useGetFileName({ id: fileId });
    return (
      <div
        ref={ref}
        role="tab"
        onClick={() => setActiveTab(projectId, fileId)}
        className={cn(
          "flex items-center border px-2 py-1 text-sm group cursor-pointer hover:bg-muted",
          isActiveTab && "bg-muted border-t-2 border-t-blue-500 cursor-default",
          isPreviewTab && "italic",
        )}
      >
        {fileName === undefined ? (
          <Spinner />
        ) : (
          <div className="flex items-center gap-1">
            <FileIcon fileName={fileName} autoAssign className="size-4" />
            <span>{fileName}</span>
          </div>
        )}
        <Hint text="Close tab" side="bottom">
          <span className="ml-4 opacity-0 group-hover:opacity-100 hover:bg-muted-foreground rounded cursor-pointer">
            <XIcon
              className="size-4 "
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                closeTab(projectId, fileId);
              }}
            />
          </span>
        </Hint>
      </div>
    );
  },
);
