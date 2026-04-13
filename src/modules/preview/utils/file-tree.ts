import { Doc, Id } from "../../../../convex/_generated/dataModel";
import { FileSystemTree } from "@webcontainer/api";

type fileDoc = Doc<"files">;

// convert flat convex files to nestes fileSystemTree for webContainer
export const buildFileTree = (files: fileDoc[]): FileSystemTree => {
  const tree: FileSystemTree = {};

  const filesMap = new Map(files.map((file) => [file._id, file]));

  //   create path , result: [ "parent", "child", "grandchild" ]
  const getPath = (file: fileDoc): string[] => {
    const parts: string[] = [file.name];
    let parentId = file.parentId;
    while (parentId) {
      const parent = filesMap.get(parentId);
      if (!parent) break;
      parts.unshift(parent.name);
      parentId = parent.parentId;
    }
    return parts;
  };

  for (const file of files) {
    const pathParts = getPath(file);
    let current = tree;

    for (let i = 0; i < pathParts.length; i++) {
      const part = pathParts[i];
      const isLast = i === pathParts.length - 1;

      if (isLast) {
        if (file.type === "folder") {
          if (!current[part]) {
            current[part] = { directory: {} };
          }
        } else if (!file.storageId && file.content !== undefined) {
          current[part] = { file: { contents: file.content } };
        }
      } else {
        if (!current[part]) {
          current[part] = { directory: {} };
        }
        const node = current[part];
        if ("directory" in node) {
          current = node.directory;
        }
      }
    }
  }

  return tree;
};

// get full path for a file by traversing parent chain
export const getFilePath = (
  file: fileDoc,
  filesMap: Map<Id<"files">, fileDoc>,
): string => {
  const parts: string[] = [file.name];
  let parentId = file.parentId;

  while (parentId) {
    const parent = filesMap.get(parentId);
    if (!parent) break;
    parts.unshift(parent.name);
    parentId = parent.parentId;
  }

  return parts.join("/");
};
