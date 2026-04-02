"use client";

import { Allotment } from "allotment";
import { Id } from "../../../convex/_generated/dataModel";
import "allotment/dist/style.css";
import { WorkspaceSection } from "./workspace-section";
import { useEffect, useState } from "react";
import { ConversationView } from "../conversation/UI/conversation-view";

interface Props {
  projectId: Id<"projects">;
}

export const ProjectView = ({ projectId }: Props) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;
  return (
    <Allotment className="flex-1" defaultSizes={[400, 1000]}>
      <Allotment.Pane snap minSize={200} maxSize={800} preferredSize={400}>
        <ConversationView projectId={projectId} />
      </Allotment.Pane>
      <Allotment.Pane>
        <WorkspaceSection projectId={projectId} />
      </Allotment.Pane>
    </Allotment>
  );
};
