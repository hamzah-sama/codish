import { inngest } from "@/inngest/client";

export async function POST() {
  await inngest.send({
    name: "demo/generate",
  });

  return Response.json({ message: "backgroundjob started" });
}
