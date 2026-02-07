import { api } from "../../../../convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { Id } from "../../../../convex/_generated/dataModel";
import { getFilebyId } from "../../../../convex/utils";

const sortFiles = <T extends { type: "file" | "folder"; name: string }>(
  files: T[],
): T[] => {
  return files.sort((a, b) => {
    if (a.type === "folder" && b.type === "file") return -1;
    if (a.type === "file" && b.type === "folder") return 1;
    return a.name.localeCompare(b.name);
  });
};

export const useCreateFile = () => {
  return useMutation(api.files.createFile).withOptimisticUpdate(
    (localStore, args) => {
      const { parentId, name, content, projectId } = args;
      const existing = localStore.getQuery(api.files.getFolderContents, {
        parentId,
        projectId,
      });
      if (existing === undefined) return;

      const files = existing ?? [];

      const newFile = {
        _id: crypto.randomUUID() as Id<"files">,
        _creationTime: Date.now(),
        projectId,
        parentId,
        name,
        content,
        type: "file" as const,
        updatedAt: Date.now(),
      };
      localStore.setQuery(
        api.files.getFolderContents,
        { parentId, projectId },
        sortFiles([...files, newFile]),
      );
    },
  );
};

export const useCreateFolder = () => {
  return useMutation(api.files.createFolder).withOptimisticUpdate(
    (localStore, args) => {
      const { parentId, name, projectId } = args;
      const existing = localStore.getQuery(api.files.getFolderContents, {
        parentId,
        projectId,
      });
      if (existing === undefined) return;

      const files = existing ?? [];

      const newFolder = {
        _id: crypto.randomUUID() as Id<"files">,
        _creationTime: Date.now(),
        projectId,
        parentId,
        name,
        type: "folder" as const,
        updatedAt: Date.now(),
      };
      localStore.setQuery(
        api.files.getFolderContents,
        { parentId, projectId },
        sortFiles([...files, newFolder]),
      );
    },
  );
};

export const useDeleteFile = ({
  projectId,
  parentId,
}: {
  projectId: Id<"projects">;
  parentId?: Id<"files">;
}) => {
  return useMutation(api.files.deleteById).withOptimisticUpdate(
    (localStore, args) => {
      const existing = localStore.getQuery(api.files.getFolderContents, {
        projectId,
        parentId,
      });
      if (existing !== undefined) {
        localStore.setQuery(
          api.files.getFolderContents,
          { projectId, parentId },
          existing.filter((file) => file._id !== args.fileId),
        );
      }
    },
  );
};

export const useRenameFile = ({
  projectId,
  parentId,
}: {
  projectId: Id<"projects">;
  parentId?: Id<"files">;
}) => {
  return useMutation(api.files.rename).withOptimisticUpdate(
    (localStore, args) => {
      const existing = localStore.getQuery(api.files.getFolderContents, {
        projectId,
        parentId,
      });

      if (existing !== undefined) {
        const updateFile = existing.map((file) =>
          file._id === args.fileId ? { ...file, name: args.newName } : file,
        );

        localStore.setQuery(
          api.files.getFolderContents,
          {
            projectId,
            parentId,
          },
          sortFiles(updateFile),
        );
      }
    },
  );
};

export const useGetFolderContents = ({
  projectId,
  parentId,
  enabled,
}: {
  projectId: Id<"projects">;
  parentId?: Id<"files">;
  enabled?: boolean;
}) => {
  return useQuery(
    api.files.getFolderContents,
    enabled ? { parentId, projectId } : "skip",
  );
};

export const useGetFileName = ({ id: fileId }: { id: Id<"files"> }) =>
  useQuery(api.files.getFileName, { id: fileId });

export const useGetFilePath = ({ id }: { id: Id<"files"> | null }) =>
  useQuery(api.files.getFilePath, id ? { id } : "skip");

export const useGetFileSiblings = ({
  projectId,
  fileId,
}: {
  projectId: Id<"projects">;
  fileId: Id<"files">;
}) => {
  return useQuery(api.files.getFileSiblings, { fileId, projectId });
};
