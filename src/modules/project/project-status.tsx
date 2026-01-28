import { Id } from "../../../convex/_generated/dataModel";
import { useGetProjectStatus } from "../utils/useProject";
import { Spinner } from "@/components/ui/spinner";
import { CloudCheckIcon } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Hint } from "@/components/hint";

interface Props {
  projectId: Id<"projects">;
}

export const ProjectStatus = ({ projectId }: Props) => {
  const project = useGetProjectStatus(projectId);

  return (
    <>
      {project?.status === "importing" ? (
        <Hint text="Importing..." align="center" side="top">
          <Spinner />
        </Hint>
      ) : (
        <Hint
          text={
            project?.updatedAt ? (
              `saved ${formatDistanceToNow(project?.updatedAt, { addSuffix: true })}`
            ) : (
              <Spinner />
            )
          }
        >
          <CloudCheckIcon />
        </Hint>
      )}
    </>
  );
};
