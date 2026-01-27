import { FileIcon } from "@react-symbols/icons/utils";
import { Doc, Id } from "../../../convex/_generated/dataModel";
import { RenameFile } from "./rename-file";
import { TreeItemWrapper } from "./tree-item-wrapper";
import { DeleteConfirmationModal } from "@/components/confirmation-modal";

interface Props {
  renaming: boolean;
  file: Doc<"files">;
  setOPenDeleteModal: (open: boolean) => void;
  level: number;
  setRenaming: (renaming: boolean) => void;
  openDeleteModal: boolean;
  deleteFile: () => void;
}

export const FileTree = ({
  renaming,
  file,
  setOPenDeleteModal,
  level,
  setRenaming,
  openDeleteModal,
  deleteFile,
}: Props) => {
  return (
    <>
      {renaming ? (
        <RenameFile
          projectId={file.projectId}
          parentId={file._id}
          fileId={file._id}
          projectName={file.name}
          setOpenInput={setRenaming}
          openInput={renaming}
          level={level}
        />
      ) : (
        <TreeItemWrapper
          file={file}
          onDelete={() => setOPenDeleteModal(true)}
          level={level}
          onRenaming={() => setRenaming(true)}
        >
          <div
            tabIndex={0}
            className="w-full flex items-center gap-1"
            role="treeitem"
            onKeyDown={(e: React.KeyboardEvent) => {
              if (e.key === "Delete") setOPenDeleteModal(true);
              if (e.key === "F2") setRenaming(true);
            }}
          >
            <FileIcon fileName={file.name} autoAssign className="size-4" />
            <span className="truncate text-sm">{file.name}</span>
          </div>
        </TreeItemWrapper>
      )}
      <DeleteConfirmationModal
        open={openDeleteModal}
        onOpenChange={setOPenDeleteModal}
        onConfirm={deleteFile}
        title={`Delete "${file.name}"?`}
        description="This file will be permanently deleted."
      />
    </>
  );
};
