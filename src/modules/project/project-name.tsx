import { Id } from "../../../convex/_generated/dataModel";
import { BreadcrumbItem, BreadcrumbPage } from "@/components/ui/breadcrumb";
import { Spinner } from "@/components/ui/spinner";
import { useEffect, useRef, useState } from "react";
import { useGetProjectName, useRenameProject } from "../utils/useProject";

interface Props {
  projectId: Id<"projects">;
}

export const ProjectName = ({ projectId }: Props) => {
  const projectName = useGetProjectName(projectId);
  const renameProject = useRenameProject();

  const inputRef = useRef<HTMLInputElement>(null);

  const [openInput, setOpenInput] = useState(false);
  const [name, setName] = useState("");

  const handleOpenInput = () => {
    setOpenInput(true);
    setName(projectName ?? "");
  };

  const handleSubmit = () => {
    const trimmedName = name.trim();
    if (trimmedName === "" || trimmedName === projectName) return;
    renameProject({ id: projectId, name: trimmedName });
    setOpenInput(false);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      handleSubmit();
    } else if (event.key === "Escape") {
      setOpenInput(false);
    }
  };

  useEffect(() => {
    if (openInput && inputRef.current) {
      inputRef.current.focus();
    }
  }, [openInput]);
  return (
    <BreadcrumbItem className="cursor-pointer" onClick={handleOpenInput}>
      {openInput ? (
        <input
          type="text"
          ref={inputRef}
          value={name}
          onKeyDown={handleKeyDown}
          onChange={(e) => setName(e.target.value)}
          onFocus={(e) => e.currentTarget.select()}
          onBlur={() => setOpenInput(false)}
          className="text-sm bg-transparent text-foreground outline-none focus:ring-1 focus:ring-inset focus:ring-ring max-w-40 truncate font-medium p-2"
        />
      ) : (
        <BreadcrumbPage>
          <span className="flex items-center">
            {projectName ?? <Spinner />}
          </span>
        </BreadcrumbPage>
      )}
    </BreadcrumbItem>
  );
};
