import { Allotment } from "allotment";
import { Id } from "../../../../convex/_generated/dataModel";
import { FileExplorerView } from "@/modules/files/file-explorer-view";
import { CodeTabs } from "./code-tabs";
import { FilePath } from "./file-path";

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
        <FilePath projectId={projectId} />
      </Allotment.Pane>
    </Allotment>
  );
};
