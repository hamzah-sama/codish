import { Spinner } from "@/components/ui/spinner";
import { Kbd } from "@/components/ui/kbd";
import { MostRecentProject, RestProjects } from "./get-projects";
import { ViewAllProjects } from "./view-all-projects";
import { useGetAllProjects, useGetPartialProjects } from "../utils/useProject";

interface Props {
  openViewAllProject: boolean;
  setOpenViewAllProject: (open: boolean) => void;
}

export const ProjectList = ({
  openViewAllProject,
  setOpenViewAllProject,
}: Props) => {
  const partialProjects = useGetPartialProjects(6);
  const allProjects = useGetAllProjects();

  if (partialProjects === undefined || allProjects === undefined) {
    return (
      <div className="flex items-center justify-center">
        <Spinner className="size-4 text-ring" />
      </div>
    );
  }

  const [mostRecentProject, ...restProjects] = partialProjects;
  return (
    <>
      <ViewAllProjects
        open={openViewAllProject}
        onOpenChange={setOpenViewAllProject}
        projects={allProjects}
      />
      <div className="flex flex-col gap-4">
        {mostRecentProject && <MostRecentProject project={mostRecentProject} />}
        {restProjects.length > 0 && (
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center gap-2">
              <span className="text-xs text-muted-foreground">
                Recent projects
              </span>
              <button
                onClick={() => setOpenViewAllProject(true)}
                className="flex items-center gap-2 text-xs text-muted-foreground  hover:text-foreground transition-colors"
              >
                <span>view all</span>
                <Kbd className="border">ctrl+K</Kbd>
              </button>
            </div>
            <ul className="flex flex-col gap-2">
              {restProjects.map((project) => (
                <RestProjects project={project} key={project._id} />
              ))}
            </ul>
          </div>
        )}
      </div>
    </>
  );
};
