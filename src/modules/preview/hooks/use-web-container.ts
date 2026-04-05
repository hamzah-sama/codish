import { WebContainer } from "@webcontainer/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { useCallback, useEffect, useRef, useState } from "react";
import { useGetFiles } from "@/modules/files/utils/useFile";
import { buildFileTree, getFilePath } from "../utils/file-tree";
import { WritableStream } from "stream/web";

// single webContainer instance
let webContainerInstance: WebContainer | null = null;
let bootPromise: Promise<WebContainer> | null = null;

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

export const useWebContainer = async ({
  projectId,
  enabled,
  settings,
}: Props) => {
  const [status, setStatus] = useState<
    "idle" | "booting" | "running" | "error" | "installing"
  >("idle");

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [restartKey, setRestartKey] = useState(0);
  const [terminalOuput, setTerminalOuput] = useState("");

  const containerRef = useRef<WebContainer | null>(null);
  const hasStartedRef = useRef(false);

  //   fetch files from convex
  const files = useGetFiles(projectId);

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

        const container = await getWebContainer();
        containerRef.current = container;

        const fileTree = buildFileTree(files);

        await container.mount(fileTree);

        container.on("server-ready", (ports, url) => {
          setPreviewUrl(url);
          setStatus("running");
        });

        setStatus("installing");

        // parse install command (default : 'npm install')
        const installCmd = settings?.installCommand || "npm install";

        const [installBin, ...installArgs] = installCmd.split(" ");

        appendOutput(`$ ${installCmd}\n`);

        const installProcess = await container.spawn(installBin, installArgs);

        installProcess.output.pipeTo(
          new WritableStream({
            write(data) {
              appendOutput(data);
            },
          }),
        );

        const installExitCode = await installProcess.exit;

        if (installExitCode !== 0) {
          throw new Error(
            `Error: ${installCmd} failed with code ${installExitCode}`,
          );
        }

        const devCmd = settings?.devCommand || "npm run dev";

        const [devBin, ...devArgs] = devCmd.split(" ");

        appendOutput(`$ ${devCmd}\n`);

        const devProcess = await container.spawn(devBin, devArgs);

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

  //   sync file change (hot reload)
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !files || status !== "running") return;

    const filesMap = new Map(files.map((file) => [file._id, file]));

    for (const file of files) {
      if (file.type !== "file" || file.storageId || !file.content) continue;

      const filePath = getFilePath(file, filesMap);
      container.fs.writeFile(filePath, file.content);
    }
  }, [files, status]);

  //   reset when disabled
  useEffect(() => {
    if (!enabled) {
      hasStartedRef.current = false;
      setStatus("idle");
      setPreviewUrl(null);
      setError(null);
    }
  }, [enabled]);

  //   restart the entire web container process
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
    terminalOuput,
  };
};
