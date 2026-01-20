"use client";

import { useEffect, useState } from "react";
import { UnathorizedDialog } from "@/components/unathorized-dialog";
import { Poppins } from "next/font/google";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { FaGithub } from "react-icons/fa";
import { ProjectList } from "./project-lists";
import { CreateProject } from "./create-project";

const font = Poppins({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
});
export const HomeView = () => {
  const [openDialog, setOpenDialog] = useState(false);
  const [openViewAllProject, setOpenViewAllProject] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setOpenViewAllProject(true);
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <>
      <UnathorizedDialog open={openDialog} onOpenChange={setOpenDialog} />
      <div className="flex flex-col justify-center items-center h-full p-6 md:p-16  bg-sidebar">
        <div className="flex flex-col w-full max-w-sm mx-auto items-center gap-4">
          <div className="flex items-center justify-between gap-4 w-full">
            <div className="flex items-center gap-2 w-full group/logo">
              <img
                src="/logo.svg"
                alt="Logo"
                className="size-8  md:size-12"
              />
              <h1
                className={cn(
                  "text-4xl md:text-5xl font-semibold",
                  font.className,
                )}
              >
                Codish
              </h1>
            </div>
          </div>
          <div className="flex flex-col gap-4 w-full">
            <div className="grid grid-cols-2 gap-2">
              <CreateProject setOpenDialog={setOpenDialog} />
              <Button
                variant="outline"
                className="h-full flex flex-col justify-start items-start p-4  gap-6 bg-background border rounded-none"
              >
                <div className="flex items-center justify-between w-full">
                  <FaGithub className="size-4" />
                  <Kbd className="border">⌘I</Kbd>
                </div>
                <div>
                  <span className="text-sm">Import</span>
                </div>
              </Button>
            </div>
            <ProjectList
              openViewAllProject={openViewAllProject}
              setOpenViewAllProject={setOpenViewAllProject}
            />
          </div>
        </div>
      </div>
    </>
  );
};
