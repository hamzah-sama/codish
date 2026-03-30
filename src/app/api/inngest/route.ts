import { serve } from "inngest/next";
import { inngest } from "../../../inngest/client";
import { demoGenerate } from "@/inngest/function";
import { processMessage } from "@/modules/conversation/inngest/process-message";

// Create an API that serves zero functions
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [processMessage],
});
1;
