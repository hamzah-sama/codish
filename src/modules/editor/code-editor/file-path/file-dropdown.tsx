import {
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Id } from "../../../../../convex/_generated/dataModel";
import { useGetFileSiblings } from "@/modules/files/utils/useFile";
import { useEditorStore } from "../../store/use-editor-store";
import { FileDropDownItem } from "./file-dropdown-item";

interface Props {
  fileId: Id<"files">;
  projectId: Id<"projects">;
}

export const FileDropdown = ({ projectId, fileId }: Props) => {
  const { openFile } = useEditorStore();
  const fileSibling = useGetFileSiblings({ projectId, fileId });
  if (!fileSibling) return null;

  return (
    <DropdownMenuContent align="start" className="max-h-80 rounded-none">
      <DropdownMenuGroup>
        {fileSibling.map((file) => (
          <FileDropDownItem
            key={file.id}
            projectId={projectId}
            activeFileId={fileId}
            fileId={file.id}
            fileType={file.type}
            fileName={file.name}
          />
        ))}
      </DropdownMenuGroup>
    </DropdownMenuContent>
  );
};
