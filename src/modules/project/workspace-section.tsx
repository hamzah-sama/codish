import { AppWindowIcon, CodeIcon } from "lucide-react";
import { Id } from "../../../convex/_generated/dataModel";
import { FaGithub } from "react-icons/fa";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { CodeSection } from "./code-section";

interface Props {
  projectId: Id<"projects">;
}

export const WorkspaceSection = ({ projectId }: Props) => {
  const [tab, setTab] = useState<"code" | "preview">("code");

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center border-y bg-background">
        <div className="flex items-centers">
          <div
            onClick={() => setTab("code")}
            className={cn(
              "flex items-center gap-2 pl-4 pr-2 py-1 border-r cursor-pointer hover:bg-muted",
              tab === "code" &&
                "bg-muted border-t-2 border-t-blue-500 cursor-default",
            )}
          >
            <CodeIcon className=" text-muted-foreground" /> Code
          </div>
          <div
            onClick={() => setTab("preview")}
            className={cn(
              "flex items-center gap-2 pl-4 pr-2 py-1 border-r cursor-pointer hover:bg-muted",
              tab === "preview" &&
                "bg-muted border-t-2 border-t-blue-500 cursor-default",
            )}
          >
            <AppWindowIcon className=" text-muted-foreground" /> Preview
          </div>
        </div>
        <div className="flex items-center gap-2 pl-2 pr-4 py-1 border-l cursor-pointer hover:bg-muted">
          <FaGithub className=" text-muted-foreground" /> Export
        </div>
      </div>
      {tab === "code" ? (
        <CodeSection projectId={projectId} />
      ) : (
        <div className="p-4">Preview Section for project {projectId}</div>
      )}
    </div>
  );
};
