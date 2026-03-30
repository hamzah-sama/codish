import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";

export const useGetConversationById = (id: Id<"conversations"> | null) => {
  return useQuery(api.conversations.getById, id ? { id } : "skip");
};

export const useGetConversationByProject = (projectId: Id<"projects">) => {
  return useQuery(api.conversations.getByProject, { projectId });
};

export const useGetMessages = (conversationId: Id<"conversations"> | null) => {
  return useQuery(api.conversations.getMessages, conversationId ?  { conversationId } : 'skip');
};

export const useCreateConversation = () =>
  useMutation(api.conversations.create);
