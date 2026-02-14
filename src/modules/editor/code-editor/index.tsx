import { Allotment } from "allotment";
import { Id } from "../../../../convex/_generated/dataModel";
import { FileExplorerView } from "@/modules/files/file-explorer-view";
import { CodeTabs } from "./code-tabs";
import { FilePath } from "./file-path";
import { useEditorStore } from "../store/use-editor-store";
import { BackgroundLogo } from "@/components/backgroundLogo";
import { CodeContent } from "./code-content";
import { useGetFileName } from "@/modules/files/utils/useFile";

interface Props {
  projectId: Id<"projects">;
}

export const CodeEditorView = ({ projectId }: Props) => {
  const { getTabs } = useEditorStore();
  const isActiveTab = getTabs(projectId).activeTabId !== null;
  const fileName = useGetFileName({ id: getTabs(projectId).activeTabId });
  return (
    <Allotment defaultSizes={[400, 1000]}>
      <Allotment.Pane snap minSize={200} maxSize={800} preferredSize={400}>
        <FileExplorerView projectId={projectId} />
      </Allotment.Pane>
      <Allotment.Pane>
        <div className="flex flex-col min-h-0 h-full">
          <div className="flex items-center bg-sidebar border-b h-7">
            <CodeTabs projectId={projectId} />
          </div>
          <div className="shrink-0">
            <FilePath projectId={projectId} />
          </div>
          {!isActiveTab && (
            <div className="size-full flex justify-center items-center">
              <BackgroundLogo />
            </div>
          )}
          {isActiveTab && (
            <div className="flex-1 min-h-0 overflow-hidden">
              <CodeContent />
            </div>
          )}
        </div>
      </Allotment.Pane>
    </Allotment>
  );
};
