import { WebContainer } from "@webcontainer/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { useCallback, useEffect, useRef, useState } from "react";
import { useGetFiles } from "@/modules/files/utils/useFile";
import { buildFileTree, getFilePath } from "../utils/file-tree";

/* 
big picture:
        1. get files from database (convex)
        2. run nodejs on browser
        3. install dependencies (npm install)
        4. run dev command (npm run dev)
        5. show preview + terminal output
        inside a Next.js JSX block.
*/

// because webContainer is hard to boot, so we use single webContainer instance
let webContainerInstance: WebContainer | null = null;
let bootPromise: Promise<WebContainer> | null = null;

/*
1. if there is an instance, reuse it
2. if there is no instance, boot it once
3. it can prevent booting multiple times
*/
const getWebContainer = async (): Promise<WebContainer> => {
  if (webContainerInstance) {
    return webContainerInstance;
  }

  if (!bootPromise) {
    bootPromise = WebContainer.boot({ coep: "credentialless" });
  }

  webContainerInstance = await bootPromise;
  return webContainerInstance;
};

// used to restart environment and clear memory
const teardownWebContainer = () => {
  if (webContainerInstance) {
    webContainerInstance.teardown();
    webContainerInstance = null;
  }
  bootPromise = null;
};

interface Props {
  projectId: Id<"projects">;
  enabled: boolean;
  settings?: {
    installCommand?: string;
    devCommand?: string;
  };
}

export const useWebContainer = ({ projectId, enabled, settings }: Props) => {
  // the status of webContainer, iddle = not running, booting = start container, installing - npm i , running = server is up, error = failed
  const [status, setStatus] = useState<
    "idle" | "booting" | "running" | "error" | "installing"
  >("idle");

  const [previewUrl, setPreviewUrl] = useState<string | null>(null); // URL from sever (localhost on browser sandbox)
  const [error, setError] = useState<string | null>(null);
  const [restartKey, setRestartKey] = useState(0);
  const [terminalOutput, setTerminalOuput] = useState(""); // simulate terminal output(npm install, npm run dev, logs, etc.)

  const containerRef = useRef<WebContainer | null>(null);
  const hasStartedRef = useRef(false);

  //   fetch files from convex
  const files = useGetFiles(projectId); //get files from backend (convex)

  // start webContainer, start if enabled = true , files is not empty, not started yet
  useEffect(() => {
    if (!enabled || !files || files.length === 0 || hasStartedRef.current)
      return;

    hasStartedRef.current = true;
    const start = async () => {
      try {
        setStatus("booting");
        setError(null);
        setTerminalOuput("");

        const appendOutput = (data: string) => {
          setTerminalOuput((prev) => prev + data);
        };

        const container = await getWebContainer(); // boot webContainer
        containerRef.current = container; // save instance webContainer to containerRef

        const fileTree = buildFileTree(files); // convert flat convex files to nestes fileSystemTree

        await container.mount(fileTree); // mount files, write files to container

        container.on("server-ready", (ports, url) => {
          setPreviewUrl(url);
          setStatus("running");
        }); // when server is ready (npm run dev is success), preview URl is ready

        setStatus("installing");

        // parse install command (default : 'npm install')
        const installCmd = settings?.installCommand || "npm install";

        const [installBin, ...installArgs] = installCmd.split(" ");

        appendOutput(`$ ${installCmd}\n`);

        const installProcess = await container.spawn(installBin, installArgs); // install dependencies ( npm i)

        installProcess.output.pipeTo(
          new WritableStream({
            write(data) {
              appendOutput(data);
            },
          }),
        ); // all stdout is go to state react

        const installExitCode = await installProcess.exit;

        if (installExitCode !== 0) {
          throw new Error(
            `Error: ${installCmd} failed with code ${installExitCode}`,
          );
        } //if its fail, throw an error

        const devCmd = settings?.devCommand || "npm run dev";

        const [devBin, ...devArgs] = devCmd.split(" ");

        appendOutput(`$ ${devCmd}\n`);

        const devProcess = await container.spawn(devBin, devArgs); // run dev

        devProcess.output.pipeTo(
          new WritableStream({
            write(data) {
              appendOutput(data);
            },
          }),
        );
      } catch (error) {
        setError(error instanceof Error ? error.message : String(error));
        setStatus("error");
      }
    };

    start();
  }, [
    enabled,
    files,
    restartKey,
    settings?.devCommand,
    settings?.installCommand,
  ]);

  //   sync file change (hot reload), it will trigger when files change while webContainer is running
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !files || status !== "running") return;

    const filesMap = new Map(files.map((file) => [file._id, file]));

    for (const file of files) {
      if (file.type !== "file" || file.storageId || !file.content) continue;

      const filePath = getFilePath(file, filesMap);
      container.fs.writeFile(filePath, file.content); // update files directly in container , so it will hot reload
    }
  }, [files, status]);

  //   reset when disabled, when user close preview / tab, reset state but container is not destroyed
  useEffect(() => {
    if (!enabled) {
      hasStartedRef.current = false;
      setStatus("idle");
      setPreviewUrl(null);
      setError(null);
    }
  }, [enabled]);

  //   restart the entire web container process (restart manual, teardown container, retrigger useeffect via restartKey, clear all states)
  const restart = useCallback(() => {
    teardownWebContainer();
    setRestartKey((prev) => prev + 1);
    setStatus("idle");
    containerRef.current = null;
    hasStartedRef.current = false;
    setPreviewUrl(null);
    setError(null);
  }, []);

  return {
    status,
    previewUrl,
    error,
    restart,
    terminalOutput,
  };
};

/*
the workflow : 
enabled = true
   ↓
get files (Convex)
   ↓
boot WebContainer
   ↓
mount file system
   ↓
npm install
   ↓
npm run dev
   ↓
server-ready → get URL
   ↓
preview is running
   ↓
file changes → writeFile → hot reload */
