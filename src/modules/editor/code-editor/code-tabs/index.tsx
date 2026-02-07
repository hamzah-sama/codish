import { Hint } from "@/components/hint";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { XIcon } from "lucide-react";
import { useEditorStore } from "../../store/use-editor-store";
import { useEffect, useRef } from "react";
import { Id } from "../../../../../convex/_generated/dataModel";
import { TabsItem } from "./tabs-item";

interface Props {
  projectId: Id<"projects">;
}

export const CodeTabs = ({ projectId }: Props) => {
  const { getTabs, closeAllTabs, setActiveTab, closeTab } = useEditorStore();
  const tabs = getTabs(projectId);
  const tabRefs = useRef<Record<string, HTMLDivElement | null>>({});
  useEffect(() => {
    if (!tabs.activeTabId) return;
    const el = tabRefs.current[tabs.activeTabId];
    if (!el) return;
    el.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "nearest",
    });
  }, [tabs.activeTabId]);
  return (
    <div className="flex items-center w-full min-w-0">
      <ScrollArea className="flex-1 min-w-0 whitespace-nowrap">
        <div className="flex items-center w-max">
          {tabs.openTabs.map((fileId) => (
            <TabsItem
              key={fileId}
              ref={(e) => {
                tabRefs.current[fileId] = e;
              }}
              fileId={fileId}
              projectId={projectId}
              setActiveTab={setActiveTab}
              closeTab={closeTab}
              isActiveTab={tabs.activeTabId === fileId}
              isPreviewTab={tabs.previewTabId === fileId}
            />
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
      {tabs.openTabs.length > 0 && (
        <div className="hover:bg-muted-foreground rounded cursor-pointer mr-2 ml-auto">
          <Hint text="Close all tabs" side="bottom" align="end">
            <XIcon className="size-4" onClick={() => closeAllTabs(projectId)} />
          </Hint>
        </div>
      )}
    </div>
  );
};
