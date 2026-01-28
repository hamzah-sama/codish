import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuShortcut,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { Doc } from "../../../convex/_generated/dataModel";
import React, { useState } from "react";
import { setPadding } from "./utils/set-padding";

interface Props {
  children: React.ReactNode;
  file: Doc<"files">;
  level: number;
  onDelete: () => void;
  onCreateFile?: () => void;
  onCreateFolder?: () => void;
  onRenaming: () => void;
}

export const TreeItemWrapper = ({
  children,
  file,
  onDelete,
  level,
  onCreateFile,
  onCreateFolder,
  onRenaming,
}: Props) => {
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <button
          className="w-full flex gap-1 items-center cursor-pointer hover:bg-muted rounded pl-10"
          style={{ paddingLeft: setPadding(level) }}
        >
          {children}
        </button>
      </ContextMenuTrigger>
      <ContextMenuContent
        className="w-64"
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        {file.type === "folder" && (
          <>
            <ContextMenuItem onSelect={onCreateFile}>
              New File...
            </ContextMenuItem>
            <ContextMenuItem onSelect={onCreateFolder}>
              New Folder...
            </ContextMenuItem>
          </>
        )}
        <ContextMenuItem onSelect={onRenaming}>
          Rename...
          <ContextMenuShortcut>F2</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem onSelect={onDelete}>
          Delete permanently
          <ContextMenuShortcut>Delete</ContextMenuShortcut>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
};
