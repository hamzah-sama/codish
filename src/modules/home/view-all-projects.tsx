import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useRouter } from "next/navigation";
import { getIcon } from "./get-projects-icon";
import { Doc } from "../../../convex/_generated/dataModel";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projects: Doc<"projects">[];
}

export const ViewAllProjects = ({ open, onOpenChange, projects }: Props) => {
  const router = useRouter();

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange} title="all projects">
      <CommandInput placeholder="Search projects..." />
      <CommandList>
        <CommandEmpty>No projects found</CommandEmpty>
        <CommandGroup heading="Projects">
          {projects.map((project) => (
            <CommandItem
              key={project._id}
              value={`${project.name}-${project._id}`}
              onSelect={() => {
                router.push(`/projects/${project._id}`);
                onOpenChange(false);
              }}
            >
              {getIcon(project.importStatus)}
              <span>{project.name}</span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
};
