import { Allotment } from "allotment";
import { FileExplorerView } from "../files/file-explorer-view";
import { Id } from "../../../convex/_generated/dataModel";
import { CodeTabs } from "./code-editor/code-tabs";

interface Props {
  projectId: Id<"projects">;
}

export const CodeEditorView = ({ projectId }: Props) => {
  return (
    <Allotment defaultSizes={[400, 1000]}>
      <Allotment.Pane snap minSize={200} maxSize={800} preferredSize={400}>
        <FileExplorerView projectId={projectId} />
      </Allotment.Pane>
      <Allotment.Pane>
        <CodeTabs projectId={projectId} />
      </Allotment.Pane>
    </Allotment>
  );
};
