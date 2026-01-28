import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { FaGithub } from "react-icons/fa";

export const ImportProject = () => {
  return (
    <Button
      variant="outline"
      className="h-full flex flex-col justify-start items-start p-4  gap-6 bg-background border rounded-none cursor-pointer"
    >
      <div className="flex items-center justify-between w-full">
        <FaGithub className="size-4" />
        <Kbd className="border">ctrl+I</Kbd>
      </div>
      <div>
        <span className="text-sm">Import</span>
      </div>
    </Button>
  );
};
