import { ProjectView } from "@/modules/project/project-view";
import { Id } from "../../../../convex/_generated/dataModel";

interface Props {
  params: Promise<{ projectId: Id<"projects"> }>;
}

const Page = async ({ params }: Props) => {
  const { projectId } = await params;
  return <ProjectView projectId={projectId} />;
};

export default Page;
