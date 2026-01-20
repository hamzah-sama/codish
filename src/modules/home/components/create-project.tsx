import { Button } from "@/components/ui/button";
import { useUser } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { SparkleIcon } from "lucide-react";
import { Kbd } from "@/components/ui/kbd";
import {
  adjectives,
  animals,
  colors,
  uniqueNamesGenerator,
} from "unique-names-generator";
import { Id } from "../../../../convex/_generated/dataModel";

interface Props {
  setOpenDialog: (open: boolean) => void;
}

export const CreateProject = ({ setOpenDialog }: Props) => {
  const { isSignedIn } = useUser();
  const createProjects = useMutation(api.projects.create).withOptimisticUpdate(
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

  const handleSubmit = async () => {
    if (!isSignedIn) {
      setOpenDialog(true);
      return;
    }
    const projectName = uniqueNamesGenerator({
      dictionaries: [adjectives, animals, colors],
      separator: "-",
      length: 3,
    });
    await createProjects({ name: projectName });
  };
  return (
    <Button
      onClick={handleSubmit}
      variant="outline"
      className="h-full flex flex-col justify-start items-start p-4  gap-6 bg-background border rounded-none"
    >
      <div className="flex items-center justify-between w-full">
        <SparkleIcon className="size-4" />
        <Kbd className="border">⌘J</Kbd>
      </div>
      <div>
        <span className="text-sm">New Project</span>
      </div>
    </Button>
  );
};
