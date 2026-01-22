"use client";

import { Allotment } from "allotment";
import { Id } from "../../../convex/_generated/dataModel";
import "allotment/dist/style.css";
import { WorkspaceSection } from "./workspace-section";

interface Props {
  projectId: Id<"projects">;
}

export const ProjectView = ({ projectId }: Props) => {
  return (
    <Allotment className="flex-1" defaultSizes={[400, 1000]}>
      <Allotment.Pane snap minSize={200} maxSize={800} preferredSize={400}>
        conversation section
      </Allotment.Pane>
      <Allotment.Pane>
        <WorkspaceSection projectId={projectId} />
      </Allotment.Pane>
    </Allotment>
  );
};
