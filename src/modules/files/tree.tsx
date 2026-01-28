import { Doc } from "../../../convex/_generated/dataModel";
import { ChevronRightIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Spinner } from "@/components/ui/spinner";
import React, { useState } from "react";
import { TreeItemWrapper } from "./tree-item-wrapper";
import {
  useCreateFile,
  useCreateFolder,
  useDeleteFile,
  useGetFolderContents,
} from "./utils/useFile";
import { CreateInput } from "./create-input";
import { LoadingRow } from "./loading-row";
import { DeleteConfirmationModal } from "@/components/confirmation-modal";
import { RenameFile } from "./rename-file";
import { FileTree } from "./file-tree";

interface Props {
  level: number;
  file: Doc<"files">;
}

export const Tree = ({ level, file }: Props) => {
  const [isOpenFolder, setIsOpenFolder] = useState(false);
  const [openDeleteModal, setOPenDeleteModal] = useState(false);
  const [creating, setCreating] = useState<"file" | "folder" | null>(null);
  const [renaming, setRenaming] = useState(false);
  const deleteFile = useDeleteFile({
    projectId: file.projectId,
    parentId: file._id,
  });
  const folderContent = useGetFolderContents({
    projectId: file.projectId,
    parentId: file._id,
    enabled: isOpenFolder && file.type === "folder",
  });
  const createFile = useCreateFile();
  const createFolder = useCreateFolder();

  const handleCreate = (name: string) => {
    setCreating(null);
    if (creating === "file") {
      createFile({
        name,
        projectId: file.projectId,
        parentId: file._id,
        content: "",
      });
    } else if (creating === "folder") {
      createFolder({ name, projectId: file.projectId, parentId: file._id });
    }
  };

  const startCreating = (type: "file" | "folder") => {
    setIsOpenFolder(true);
    setCreating(type);
  };

  if (file.type === "file") {
    return (
      <FileTree
        file={file}
        level={level}
        setOPenDeleteModal={setOPenDeleteModal}
        openDeleteModal={openDeleteModal}
        setRenaming={setRenaming}
        renaming={renaming}
        deleteFile={() => deleteFile({ fileId: file._id })}
      />
    );
  }

  const folderName = file.name;

  return (
    <>
      {renaming ? (
        <RenameFile
          projectId={file.projectId}
          parentId={file.parentId}
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
          onCreateFolder={() => startCreating("folder")}
          onCreateFile={() => startCreating("file")}
          onRenaming={() => setRenaming(true)}
        >
          <div
            className="w-full flex items-center gap-1"
            role="treeitem"
            tabIndex={0}
            onClick={() => setIsOpenFolder((value) => !value)}
            onKeyDown={(e: React.KeyboardEvent) => {
              if (e.key === "Delete") setOPenDeleteModal(true);
              if (e.key === "F2") setRenaming(true);
            }}
          >
            <ChevronRightIcon
              className={cn(
                "text-muted-foreground size-4",
                isOpenFolder && "rotate-90",
              )}
            />
            <p className="text-sm line-clamp-1">
              {folderName ?? <Spinner className="text-blue-500 size-4" />}
            </p>
          </div>
        </TreeItemWrapper>
      )}
      {creating && (
        <CreateInput
          type={creating}
          handleSubmit={handleCreate}
          onCancel={() => setCreating(null)}
          level={level + 1}
        />
      )}
      {isOpenFolder && (
        <div className="flex flex-col gap-1">
          {folderContent === undefined ? (
            <LoadingRow level={level + 1} />
          ) : (
            folderContent.map((file) => (
              <Tree key={file._id} level={level + 1} file={file} />
            ))
          )}
        </div>
      )}
      <DeleteConfirmationModal
        open={openDeleteModal}
        onOpenChange={setOPenDeleteModal}
        onConfirm={() => deleteFile({ fileId: file._id })}
        title={`Delete "${file.name}"?`}
        description="This file will be permanently deleted."
      />
    </>
  );
};
