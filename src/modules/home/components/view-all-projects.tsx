import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Doc } from "../../../../convex/_generated/dataModel";
import { useRouter } from "next/navigation";
import { getIcon } from "./get-projects-icon";

interface Props {
  open: boolean;
  onOPenChange: (open: boolean) => void;
  projects: Doc<"projects">[];
}

export const ViewAllProjects = ({ open, onOPenChange, projects }: Props) => {
  const router = useRouter();

  return (
    <CommandDialog open={open} onOpenChange={onOPenChange} title="all projects">
      <CommandInput placeholder="Seach projects..." />
      <CommandList>
        <CommandEmpty>No projects found</CommandEmpty>
        <CommandGroup heading="Projects">
          {projects.map((project) => (
            <CommandItem
              key={project._id}
              value={`${project.name}-${project._id}`}
              onSelect={() => {
                router.push(`/projects/${project._id}`);
                onOPenChange(false);
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
