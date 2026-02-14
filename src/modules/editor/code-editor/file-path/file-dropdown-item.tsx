import {
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useEditorStore } from "../../store/use-editor-store";
import { FileIcon } from "@react-symbols/icons/utils";
import { Id } from "../../../../../convex/_generated/dataModel";
import { useGetFolderContents } from "@/modules/files/utils/useFile";

interface Props {
  projectId: Id<"projects">;
  activeFileId: Id<"files">;
  fileId: Id<"files">;
  fileType: "file" | "folder";
  fileName: string;
}

export const FileDropDownItem = ({
  projectId,
  activeFileId,
  fileId,
  fileType,
  fileName,
}: Props) => {
  const { openFile } = useEditorStore();

  const getFolderContents = useGetFolderContents({
    projectId,
    parentId: fileId,
    enabled: fileType === "folder",
  });

  if (fileType === "file") {
    return (
      <DropdownMenuItem
        className={cn(
          "flex items-center gap-2 cursor-pointer hover:bg-muted! rounded-none w-full",
          fileId === activeFileId &&
            "outline-none ring-blue-500 ring-1 hover:bg-transparent!",
        )}
        onClick={() => {
          openFile(projectId, fileId, { pinned: false });
        }}
      >
        <FileIcon fileName={fileName} />
        <span>{fileName}</span>
      </DropdownMenuItem>
    );
  }
  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger
        className={cn(
          "flex items-center gap-2 cursor-pointer hover:bg-muted! rounded-none w-full",
          fileId === activeFileId &&
            "outline-none ring-blue-500 ring-1 hover:bg-transparent!",
        )}
      >
        <span>{fileName}</span>
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent className="rounded-none">
        {getFolderContents?.map((file) => (
          <FileDropDownItem
            key={file._id}
            projectId={projectId}
            activeFileId={activeFileId}
            fileId={file._id}
            fileType={file.type}
            fileName={file.name}
          />
        ))}
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  );
};
