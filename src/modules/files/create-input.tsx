import { useEffect, useRef, useState } from "react";
import { FileIcon, FolderIcon } from "@react-symbols/icons/utils";
import { setPadding } from "./utils/set-padding";

interface Props {
  type: "file" | "folder";
  handleSubmit: (name: string) => void;
  onCancel: () => void;
  level: number;
}

export const CreateInput = ({ type, handleSubmit, onCancel, level }: Props) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("");
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      if (name.trim() !== "") {
        handleSubmit(name);
      } else {
        onCancel();
      }
    } else if (e.key === "Escape") {
      onCancel();
    }
  };

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <div
      className="w-full flex items-center gap-1 h-6"
      style={{ paddingLeft: setPadding(level) }}
    >
      <div className="flex items-center">
        {type === "file" ? (
          <FileIcon fileName={name} autoAssign className="size-4" />
        ) : (
          <FolderIcon className="size-4" folderName={name} />
        )}
      </div>
      <input
        ref={inputRef}
        onBlur={() => onCancel()}
        className="focus:ring-1 focus:ring-inset focus:ring-blue-500 outline-none bg-transparent px-2 py-1 rounded text-xs flex-1"
        placeholder={
          type === "file" ? "Creating new file..." : "Creating new folder..."
        }
        key={type}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={handleKeyDown}
      />
    </div>
  );
};
