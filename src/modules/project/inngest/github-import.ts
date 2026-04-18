import { inngest } from "@/inngest/client";
import { convex } from "@/lib/convex-client";
import { NonRetriableError } from "inngest";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { Octokit } from "octokit";
import { isBinaryFile } from "isbinaryfile";
import ky from "ky";
import { clerkClient } from "@clerk/nextjs/server";
import * as Sentry from "@sentry/node";

interface ImportGithubRepoEvent {
  projectId: string;
}

export const githubImport = inngest.createFunction(
  {
    id: "import-github",
    onFailure: async ({ event, step }) => {
      const internalKey = process.env.CODISH_CONVEX_INTERNAL_KEY;
      if (!internalKey) return;

      const { projectId } = event.data.event.data as ImportGithubRepoEvent;

      await step.run("update-project-on-failure", async () => {
        await convex.mutation(api.system.updateImportStatus, {
          internalKey,
          projectId: projectId as Id<"projects">,
          status: "failed",
        });
      });
    },
  },
  {
    event: "github/import",
  },
  async ({ event, step }) => {
    try {
      const { projectId } = event.data as ImportGithubRepoEvent;

      const internalKey = process.env.CODISH_CONVEX_INTERNAL_KEY;
      if (!internalKey) {
        throw new NonRetriableError("Internal key not found");
      }

      const project = await step.run("get-project", async () => {
        return await convex.query(api.system.getProjectById, {
          internalKey,
          projectId: projectId as Id<"projects">,
        });
      });

      if (!project) {
        throw new NonRetriableError("Project not found");
      }

      const { githubOwner: owner, githubRepo: repo, ownerId } = project;

      if (!owner || !repo) {
        throw new NonRetriableError("Missing GitHub repo info");
      }

      const githubToken = await step.run("get-github-token", async () => {
        const client = await clerkClient();
        const tokens = await client.users.getUserOauthAccessToken(
          ownerId,
          "github",
        );

        return tokens.data?.[0]?.token;
      });

      if (!githubToken) {
        throw new NonRetriableError("GitHub not connected");
      }

      const octokit = new Octokit({ auth: githubToken });

      await step.run("cleanup-existing-project", async () => {
        await convex.mutation(api.system.cleanUpFiles, {
          internalKey,
          projectId: projectId as Id<"projects">,
        });
      });

      const tree = await step.run("fetch-repo-tree", async () => {
        try {
          const { data } = await octokit.rest.git.getTree({
            owner,
            repo,
            tree_sha: "main",
            recursive: "1",
          });
          return data;
        } catch {
          const { data } = await octokit.rest.git.getTree({
            owner,
            repo,
            tree_sha: "master",
            recursive: "1",
          });
          return data;
        }
      });

      /*
    recreating a folder structure (like github repo folders) into convex db
    a. what is tree.tree ?
     frog github api, this usually looks like: 
     [
      { path: "src", type: "tree" },
      { path: "src/components", type: "tree" },
      { path: "src/components/ui", type: "tree" },
      { path: "package.json", type: "blob" }
    ]
      this filter keeps only folders (type === tree) and ignore files (type === blob)
    */

      const folders = tree.tree
        .filter((item) => item.type === "tree" && item.path)
        .sort((a, b) => {
          const aDepth = a.path ? a.path.split("/").length : 0;
          const bDepth = b.path ? b.path.split("/").length : 0;
          return aDepth - bDepth;
        });
      /*
      sort files by depth , because folder must be created from top to bottom, 
      excample:
      src (depth 1)
      src/components (depth 2)
      src/components/ui (depth 3)
    */

      const folderIdMap = await step.run("create-folder", async () => {
        const map: Record<string, Id<"files">> = {}; //purpose  excample : {src: 'abc123', src/components: 'xyz123'}

        for (const folder of folders) {
          if (!folder.path) continue;

          const pathParts = folder.path.split("/"); // purpose : 'src/components/ui' => ['src', 'components', 'ui']
          const name = pathParts.pop()!; // purpose, get folder name :  name = 'ui'
          const parentPart = pathParts.join("/"); // purpose, get parent path : 'src/components'
          const parentId = parentPart ? map[parentPart] : undefined; // purpose, find parentId : if folder has parent, get parentId from map, if root folder, parentId = undefined

          // create folder
          const folderId = await convex.mutation(api.system.createFolder, {
            name,
            parentId,
            projectId: projectId as Id<"projects">,
            internalKey,
          });

          map[folder.path] = folderId; //save folderId in map, so children can find its parent
        }
        return map;

        /*
      purpose : {
        src: 'abc123',
        src/components: 'xyz123',
        src/components/ui: 'pqr123'
      }
      */
      });

      const allFiles = tree.tree.filter(
        (item) => item.type === "blob" && item.path && item.sha,
      );

      await step.run("create-files", async () => {
        for (const file of allFiles) {
          if (!file.path || !file.sha) continue;

          try {
            const { data: blob } = await octokit.rest.git.getBlob({
              owner,
              repo,
              file_sha: file.sha,
            });

            const buffer = Buffer.from(blob.content, "base64");
            const isBinary = await isBinaryFile(buffer);

            const pathParts = file.path.split("/"); // purpose : 'src/components/test.tsx' => ['src', 'components', 'test.tsx']
            const name = pathParts.pop()!; // purpose, get folder name :  name = 'test.tsx'
            const parentPart = pathParts.join("/"); // purpose, get parent path : 'src/components'
            const parentId = parentPart ? folderIdMap[parentPart] : undefined; // purpose, find parentId : if folder has parent, get parentId from map, if root folder, parentId = undefined

            if (isBinary) {
              const uploadUrl = await convex.mutation(
                api.system.generateUploadUrl,
                {
                  internalKey,
                },
              );

              const { storageId } = await ky
                .post(uploadUrl, {
                  headers: {
                    "Content-Type": "application/octet-stream",
                  },
                  body: buffer,
                })
                .json<{ storageId: Id<"_storage"> }>();

              await convex.mutation(api.system.createBinaryFile, {
                name,
                storageId,
                parentId,
                projectId: projectId as Id<"projects">,
                internalKey,
              });
            } else {
              const content = buffer.toString("utf-8");
              await convex.mutation(api.system.createFile, {
                name,
                content,
                parentId,
                projectId: projectId as Id<"projects">,
                internalKey,
              });
            }
          } catch {
            console.error(`failed to import file ${file.path}`);
          }
        }
      });

      await step.run("set-completed-status", async () => {
        await convex.mutation(api.system.updateImportStatus, {
          internalKey,
          projectId: projectId as Id<"projects">,
          status: "completed",
        });
      });

      return { success: true, projectId };
    } catch (error) {
      Sentry.captureException(error);
      throw error;
    }
  },
);
