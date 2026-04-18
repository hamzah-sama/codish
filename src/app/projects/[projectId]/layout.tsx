import { ProjectNavbar } from "@/modules/project/project-navbar";
import { Id } from "../../../../convex/_generated/dataModel";

interface Props {
  children: React.ReactNode;
  params: Promise<{ projectId: string }>;
}

const Layout = async ({ children, params }: Props) => {
  const projectId = (await params).projectId as Id<"projects">;
  return (
    <div className="w-full h-screen flex flex-col">
      <ProjectNavbar projectId={projectId} />
      <div className="flex flex-1 overflow-hidden bg-sidebar">{children}</div>
    </div>
  );
};

export default Layout;
