import { Button } from "@/components/ui/button";
import { useUser } from "@clerk/nextjs";
import { SparkleIcon } from "lucide-react";
import { Kbd } from "@/components/ui/kbd";
import {
  adjectives,
  animals,
  colors,
  uniqueNamesGenerator,
} from "unique-names-generator";
import { useCreateProjects } from "../utils/useProject";
import { useEffect } from "react";

interface Props {
  setOpenDialog: (open: boolean) => void;
}

export const CreateProject = ({ setOpenDialog }: Props) => {
  const { isSignedIn } = useUser();
  const createProject = useCreateProjects();

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
    await createProject({ name: projectName });
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "j" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        handleSubmit();
      }
    };
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleSubmit]);
  return (
    <Button
      onClick={handleSubmit}
      variant="outline"
      className="h-full flex flex-col justify-start items-start p-4  gap-6 bg-background border rounded-none cursor-pointer"
    >
      <div className="flex items-center justify-between w-full">
        <SparkleIcon className="size-4" />
        <Kbd className="border">ctrl+J</Kbd>
      </div>
      <div>
        <span className="text-sm">New Project</span>
      </div>
    </Button>
  );
};
