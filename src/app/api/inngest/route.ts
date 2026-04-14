import { serve } from "inngest/next";
import { inngest } from "../../../inngest/client";
import { processMessage } from "@/modules/conversation/inngest/process-message";
import { githubImport } from "@/modules/project/inngest/github-import";

// Create an API that serves zero functions
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [processMessage, githubImport],
});
