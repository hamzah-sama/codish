import { inngest } from "@/inngest/client";
import { convex } from "@/lib/convex-client";
import { api } from "../../../../convex/_generated/api";
import { Doc, Id } from "../../../../convex/_generated/dataModel";
import { NonRetriableError } from "inngest";
import { clerkClient } from "@clerk/nextjs/server";
import { Octokit } from "octokit";
import ky from "ky";

interface ExportGithubRepoEvent {
  projectId: Id<"projects">;
  userId: string;
  description?: string;
  visibility: "public" | "private";
  repoName: string;
}

type FileWithUrl = Doc<"files"> & { storageUrl: string };

export const githubExport = inngest.createFunction(
  {
    id: "export-github",
    cancelOn: [
      {
        event: "github/export.cancel",
        if: "event.data.projectId == async.data.projectId",
      },
    ],
    onFailure: async ({ event, step }) => {
      const internalKey = process.env.CODISH_CONVEX_INTERNAL_KEY;
      if (!internalKey) return;

      const { projectId } = event.data.event.data as ExportGithubRepoEvent;

      await step.run("update-project-on-failure", async () => {
        await convex.mutation(api.system.updateExportStatus, {
          internalKey,
          projectId: projectId as Id<"projects">,
          status: "failed",
        });
      });
    },
  },
  {
    event: "github/export",
  },
  async ({ event, step }) => {
    const { projectId, userId, repoName, visibility, description } =
      event.data as ExportGithubRepoEvent;

    const internalKey = process.env.CODISH_CONVEX_INTERNAL_KEY;
    if (!internalKey) {
      throw new NonRetriableError("Internal key is not configured");
    }

    const githubToken = await step.run("get-github-token", async () => {
      const client = await clerkClient();
      const tokens = await client.users.getUserOauthAccessToken(
        userId,
        "github",
      );

      return tokens.data?.[0]?.token;
    });

    if (!githubToken) {
      throw new NonRetriableError("GitHub not connected");
    }

    await step.run("set-export-status", async () => {
      await convex.mutation(api.system.updateExportStatus, {
        internalKey,
        projectId: projectId as Id<"projects">,
        status: "exporting",
      });
    });

    const octokit = new Octokit({ auth: githubToken });

    const { data: user } = await step.run("get-github-user", async () => {
      return await octokit.rest.users.getAuthenticated();
    });

    const { data: repo } = await step.run("create-github-repo", async () => {
      return await octokit.rest.repos.createForAuthenticatedUser({
        name: repoName,
        private: visibility === "private",
        description: description || "Exported from Codish",
        auto_init: true,
      });
    });

    await step.sleep("waiting for repo-init", "3s");

    // get the initial commit sha (we need this as parent for our commit)
    const initialCommitSha = await step.run("get-initial-commit", async () => {
      const { data: ref } = await octokit.rest.git.getRef({
        owner: user.login,
        repo: repoName,
        ref: "heads/main",
      });
      return ref.object.sha;
    });

    // fetch all files with storage url
    const files = await step.run("fetch-project-files", async () => {
      return (await convex.query(api.system.getProjectwithUrl, {
        internalKey,
        projectId: projectId as Id<"projects">,
      })) as FileWithUrl[];
    });

    const buildFilePath = (files: FileWithUrl[]) => {
      const fileMap = new Map<Id<"files">, FileWithUrl>();
      files.forEach((file) => fileMap.set(file._id, file));

      //   purpose : create path for each file exc: 'src/components/test.tsx'
      const getFullPath = (file: FileWithUrl): string => {
        if (!file.parentId) {
          return file.name;
        }

        const parent = fileMap.get(file.parentId);

        if (!parent) {
          return file.name;
        }

        return `${getFullPath(parent)}/${file.name}`;
      };

      const paths: Record<string, FileWithUrl> = {};

      files.forEach((file) => {
        paths[getFullPath(file)] = file;
      });

      return paths;
    };

    const filePaths = buildFilePath(files);

    // filter to only actula file (not folder)
    const fileEntries = Object.entries(filePaths).filter(
      ([, file]) => file.type === "file",
    );

    if (fileEntries.length === 0) {
      throw new NonRetriableError("No files to export");
    }

    const treeItems = await step.run("create-blobs", async () => {
      const items: {
        path: string;
        mode: "100644";
        type: "blob";
        sha: string;
      }[] = [];

      for (const [path, file] of fileEntries) {
        let content: string;
        let encoding: "base64" | "utf-8" = "utf-8";

        if (file.content !== undefined) {
          content = file.content;
        } else if (file.storageUrl) {
          const response = await ky.get(file.storageUrl);
          const buffer = Buffer.from(await response.arrayBuffer());
          content = buffer.toString("base64");
          encoding = "base64";
        } else {
          continue;
        }

        const { data: blob } = await octokit.rest.git.createBlob({
          owner: user.login,
          repo: repoName,
          content,
          encoding,
        });
        items.push({ path, mode: "100644", type: "blob", sha: blob.sha });
      }

      return items;
    });

    if (treeItems.length === 0) {
      throw new NonRetriableError("failed to created any file blobs");
    }

    // create the tree
    const { data: tree } = await step.run("create-tree", async () => {
      return await octokit.rest.git.createTree({
        owner: user.login,
        repo: repoName,
        tree: treeItems,
      });
    });

    // create the commit with initial commit as parent
    const { data: commit } = await step.run("create-commit", async () => {
      return await octokit.rest.git.createCommit({
        owner: user.login,
        repo: repoName,
        message: "Initial commit from Codish",
        tree: tree.sha,
        parents: [initialCommitSha],
      });
    });

    await step.run("update-branch-ref", async () => {
      return await octokit.rest.git.updateRef({
        owner: user.login,
        repo: repoName,
        ref: "heads/main",
        sha: commit.sha,
        force: true,
      });
    });

    await step.run("set-completed-status", async () => {
      await convex.mutation(api.system.updateExportStatus, {
        internalKey,
        projectId: projectId as Id<"projects">,
        status: "completed",
        exportRepoUrl: repo.html_url,
      });
    });

    return {
      success: true,
      url: repo.html_url,
      filesExported: treeItems.length,
    };
  },
);
