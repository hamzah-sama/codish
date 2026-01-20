import Link from "next/link";
import { Doc } from "../../../../convex/_generated/dataModel";
import {
  ArrowRightIcon,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { getIcon } from "./get-projects-icon";

interface Props {
  project: Doc<"projects">;
}

export const MostRecentProject = ({ project }: Props) => {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs text-muted-foreground">Last updated</p>
      <Button
        variant="outline"
        asChild
        className="flex flex-col gap-4 border rounded-none h-auto items-start justify-start p-4"
      >
        <Link href={`/projects/${project._id}`} className="group">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              {getIcon(project.importStatus)}
              <span className="truncate font-medium">{project.name}</span>
            </div>
            <ArrowRightIcon className="size-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
          </div>
          <span className="text-sm text-muted-foreground">
            {formatDistanceToNow(project.updatedAt, {
              addSuffix: true,
            })}
          </span>
        </Link>
      </Button>
    </div>
  );
};

export const RestProjects = ({ project }: Props) => {
  return (
    <Link
      href={`/projects/${project._id}`}
      className="flex justify-between items-center py-1 text-foreground/60 hover:text-foreground transition-colors font-medium w-full group"
    >
      <div className="flex gap-2 items-center">
        {getIcon(project.importStatus)}
        <span className="truncate">{project.name}</span>
      </div>
      <div className="text-xs text-muted-foreground group-hover:text-foreground/60 transition-colors">
        {formatDistanceToNow(project.updatedAt, {
          addSuffix: true,
        })}
      </div>
    </Link>
  );
};
