import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";

// Query section
export const useGetAllProjects = () => {
  return useQuery(api.projects.getAll);
};

export const useGetPartialProjects = (limit: number) => {
  return useQuery(api.projects.getPartial, { limit });
};
export const useGetProjectName = (projectId: Id<"projects">) => {
  return useQuery(api.projects.getProjectName, { id: projectId });
};

export const useGetProjectStatus = (projectId: Id<"projects">) => {
  return useQuery(api.projects.getProjectStatus, { id: projectId });
};

// Mutation section
export const useCreateProjects = () => {
  return useMutation(api.projects.create).withOptimisticUpdate(
    (localStore, args) => {
      const existingProjects = localStore.getQuery(api.projects.getAll);
      if (existingProjects !== undefined) {
        const newProject = {
          _id: crypto.randomUUID() as Id<"projects">,
          name: args.name,
          ownerId: "anonymous",
          updatedAt: Date.now(),
          _creationTime: Date.now(),
        };
        localStore.setQuery(api.projects.getAll, {}, [
          newProject,
          ...existingProjects,
        ]);
      }
    },
  );
};

export const useRenameProject = () => {
  return useMutation(api.projects.renameProject).withOptimisticUpdate(
    (localStore, args) => {
      const existingProject = localStore.getQuery(api.projects.getProjectById, {
        id: args.id,
      });
      if (existingProject !== undefined && existingProject !== null) {
        localStore.setQuery(
          api.projects.getProjectById,
          { id: args.id },
          { ...existingProject, name: args.name, updatedAt: Date.now() },
        );
      }

      const existingProjects = localStore.getQuery(api.projects.getAll);
      if (existingProjects !== undefined) {
        const updatedProjects = existingProjects.map((project) => {
          if (project._id === args.id) {
            return { ...project, name: args.name, updatedAt: Date.now() };
          }
          return project;
        });
        localStore.setQuery(api.projects.getAll, {}, updatedProjects);
      }
    },
  );
};
