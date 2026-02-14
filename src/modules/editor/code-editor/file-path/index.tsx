import {
  useGetFilePath,
  useGetFileSiblings,
} from "@/modules/files/utils/useFile";
import { Id } from "../../../../../convex/_generated/dataModel";
import { useEditorStore } from "../../store/use-editor-store";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

import { FileIcon } from "@react-symbols/icons/utils";
import {
  DropdownMenu,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FileDropdown } from "./file-dropdown";
import React from "react";

interface Props {
  projectId: Id<"projects">;
}

export const FilePath = ({ projectId }: Props) => {
  const { getTabs } = useEditorStore();
  const { activeTabId } = getTabs(projectId);
  const path = useGetFilePath({ id: activeTabId });

  return (
    <>
      <Breadcrumb className="px-3 pt-1 ">
        <BreadcrumbList>
          {path?.map((p, i) => (
            <React.Fragment key={p.id}>
              <BreadcrumbItem>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <div className="cursor-pointer flex items-center gap-1">
                      {i === path.length - 1 && (
                        <FileIcon
                          fileName={p.name}
                          autoAssign
                          className="size-4"
                        />
                      )}
                      <span>{p.name}</span>
                    </div>
                  </DropdownMenuTrigger>
                  <FileDropdown projectId={projectId} fileId={p.id} />
                </DropdownMenu>
              </BreadcrumbItem>
              {i < path.length - 1 && <BreadcrumbSeparator />}
            </React.Fragment>
          ))}
        </BreadcrumbList>
      </Breadcrumb>
    </>
  );
};
