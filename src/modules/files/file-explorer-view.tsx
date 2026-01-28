import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
  ChevronRightIcon,
  CopyMinusIcon,
  FilePlusCornerIcon,
  FolderPlusIcon,
} from "lucide-react";
import { useState } from "react";
import { useGetProjectName } from "../utils/useProject";
import { Id } from "../../../convex/_generated/dataModel";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { Hint } from "@/components/hint";
import { CreateInput } from "./create-input";
import {
  useCreateFile,
  useCreateFolder,
  useGetFolderContents,
} from "./utils/useFile";
import { LoadingRow } from "./loading-row";
import { Tree } from "./tree";

interface Props {
  projectId: Id<"projects">;
}

export const FileExplorerView = ({ projectId }: Props) => {
  const [isOpenFolder, setIsOpenFolder] = useState(true);
  const projectName = useGetProjectName(projectId);
  const [creating, setCreating] = useState<"file" | "folder" | null>(null);
  const createFile = useCreateFile();
  const createFolder = useCreateFolder();
  const [collapseKey, setCollapseKey] = useState(0);

  const rootFile = useGetFolderContents({
    projectId,
    enabled: true,
  });
  const handleSubmit = (name: string) => {
    setCreating(null);
    if (creating === "file") {
      createFile({ name, projectId, parentId: undefined, content: "" });
    } else if (creating === "folder") {
      createFolder({ name, projectId, parentId: undefined });
    }
  };

  return (
    <div className="h-full flex bg-background/30 pt-2 min-h-0">
      <ScrollArea className="w-full">
        <div
          className="flex items-center text-left gap-0.5 h-6 cursor-pointer w-full group pr-2"
          onClick={() => setIsOpenFolder((value) => !value)}
        >
          <ChevronRightIcon
            className={cn("text-muted-foreground", isOpenFolder && "rotate-90")}
          />
          <p className="text-sm uppercase line-clamp-1">
            {projectName ?? <Spinner />}
          </p>
          {isOpenFolder && (
            <div className="opacity-0 flex items-center gap-1 ml-auto group-hover:opacity-100 transition-none duration-0">
              <Hint text="New File" side="bottom">
                <Button
                  size="icon-xs"
                  variant="highlight"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setCreating("file");
                  }}
                >
                  <FilePlusCornerIcon />
                </Button>
              </Hint>
              <Hint text="New Folder" side="bottom">
                <Button
                  size="icon-xs"
                  variant="highlight"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setCreating("folder");
                  }}
                >
                  <FolderPlusIcon />
                </Button>
              </Hint>
              <Hint text="Collapse folder" side="bottom">
                <Button
                  size="icon-xs"
                  variant="highlight"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setCollapseKey((c) => c + 1);
                  }}
                >
                  <CopyMinusIcon />
                </Button>
              </Hint>
            </div>
          )}
        </div>
        {creating && (
          <CreateInput
            level={0}
            type={creating}
            handleSubmit={handleSubmit}
            onCancel={() => setCreating(null)}
          />
        )}
        {isOpenFolder && (
          <div className="flex flex-col gap-0.5">
            {rootFile === undefined && <LoadingRow level={0} />}
            {rootFile?.map((file) => (
              <Tree key={`${file._id}-${collapseKey}`} file={file} level={0} />
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
};
