import { Id } from "../../../convex/_generated/dataModel";
import { useGetProjectStatus } from "../utils/useProject";
import { Spinner } from "@/components/ui/spinner";
import { CloudCheckIcon } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { UseTooltip } from "@/components/use-tooltip";

interface Props {
  projectId: Id<"projects">;
}

export const ProjectStatus = ({ projectId }: Props) => {
  const project = useGetProjectStatus(projectId);

  return (
    <>
      {project?.status === "importing" ? (
        <UseTooltip trigger={<Spinner />}>Importing...</UseTooltip>
      ) : (
        <UseTooltip trigger={<CloudCheckIcon />}>
          <>
            Saved{" "}
            {project?.updatedAt ? (
              formatDistanceToNow(project?.updatedAt, { addSuffix: true })
            ) : (
              <Spinner />
            )}
          </>
        </UseTooltip>
      )}
    </>
  );
};
