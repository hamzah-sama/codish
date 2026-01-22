import { ProjectNavbar } from "@/modules/project/project-navbar";
import { Id } from "../../../../convex/_generated/dataModel";

interface Props {
  children: React.ReactNode;
  params: Promise<{ projectId: Id<"projects"> }>;
}

const Layout = async ({ children, params }: Props) => {
  const { projectId } = await params;
  return (
    <div className="w-full h-screen flex flex-col">
      <ProjectNavbar projectId={projectId} />
      <div className="flex flex-1 overflow-hidden bg-sidebar">
        {children}
      </div>
    </div>
  );
};

export default Layout;
