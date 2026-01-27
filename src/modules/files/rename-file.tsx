import { useEffect, useRef, useState } from "react";
import { useRenameFile } from "./utils/useFile";
import { Id } from "../../../convex/_generated/dataModel";
import { setPadding } from "./utils/set-padding";

interface Props {
  fileId: Id<"files">;
  projectId: Id<"projects">;
  parentId: Id<"files">;
  projectName: string;
  setOpenInput: (open: boolean) => void;
  openInput: boolean;
  level: number;
}

export const RenameFile = ({
  projectId,
  parentId,
  fileId,
  projectName,
  setOpenInput,
  openInput,
  level,
}: Props) => {
  const [name, setName] = useState(projectName ?? "");
  const inputRef = useRef<HTMLInputElement>(null);
  const renameFile = useRenameFile({ projectId, parentId });
  const handleSubmit = () => {
    const trimmedName = name.trim();
    if (trimmedName === "" || trimmedName === projectName) return;
    renameFile({ fileId, newName: trimmedName });
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
    <div className="w-full" style={{ paddingLeft: setPadding(level) }}>
      <input
        type="text"
        ref={inputRef}
        value={name}
        onKeyDown={handleKeyDown}
        onChange={(e) => setName(e.target.value)}
        onFocus={(e) => e.currentTarget.select()}
        onBlur={() => setOpenInput(false)}
        className="text-sm bg-transparent text-foreground outline-none focus:ring-1 focus:ring-inset focus:ring-ring max-w-40 truncate font-medium p-1 pl-2"
      />
    </div>
  );
};
