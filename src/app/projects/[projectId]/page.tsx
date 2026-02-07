import { ProjectView } from "@/modules/project/project-view";
import { Id } from "../../../../convex/_generated/dataModel";

interface Props {
  params: Promise<{ projectId: Id<"projects"> }>;
}

const Page = async ({ params }: Props) => {
  const { projectId } = await params;
  return (
    <div className="flex flex-col h-full w-full">
      <ProjectView projectId={projectId} />
    </div>
  );
};

export default Page;
