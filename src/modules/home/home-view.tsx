"use client";

import { useEffect, useState } from "react";
import { UnauthorizedDialog } from "@/components/unauthorized-dialog";
import { ProjectList } from "./project-lists";
import { CreateProject } from "./create-project";
import { ImportProject } from "./import-project";
import { HomeHeader } from "./home-header";
import { GithubImportDialog } from "./github-import-dialog";
import { CreateProjectDialog } from "./create-project-dialog";

export const HomeView = () => {
  const [openDialog, setOpenDialog] = useState(false);
  const [openViewAllProject, setOpenViewAllProject] = useState(false);
  const [openImportDialog, setOpenImportDialog] = useState(false);
  const [openPromptDialog, setOpenPromptDialog] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setOpenViewAllProject(true);
      }
      if (event.key === "i" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setOpenImportDialog(true);
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <>
      <UnauthorizedDialog open={openDialog} onOpenChange={setOpenDialog} />
      <GithubImportDialog
        open={openImportDialog}
        onOpenChange={setOpenImportDialog}
      />
      <CreateProjectDialog
        open={openPromptDialog}
        onOpenChange={setOpenPromptDialog}
      />
      <div className="flex flex-col justify-center items-center h-full p-6 md:p-16">
        <div className="flex flex-col w-full max-w-sm mx-auto items-center gap-4">
          <HomeHeader />
          <div className="flex flex-col gap-4 w-full">
            <div className="grid grid-cols-2 gap-2">
              <CreateProject
                setOpenDialog={setOpenDialog}
                setOpenPrompt={setOpenPromptDialog}
              />
              <ImportProject setOpenImportDialog={setOpenImportDialog} />
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
