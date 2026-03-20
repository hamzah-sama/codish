import z from "zod";
import ky from "ky";
import { toast } from "sonner";

const quickEditRequestSchema = z.object({
  selectedCode: z.string(),
  fullCode: z.string(),
  instruction: z.string(),
});

const quickEditResponseSchema = z.object({
  editedCode: z.string(),
});

type QuickEditRequest = z.infer<typeof quickEditRequestSchema>;
type QuickEditResponse = z.infer<typeof quickEditResponseSchema>;

export const fetcher = async (
  payload: QuickEditRequest,
  signal: AbortSignal,
): Promise<string | null> => {
  try {
    const validatedPayload = quickEditRequestSchema.parse(payload);
    const response = await ky
      .post("/api/quick-edit", {
        json: validatedPayload,
        signal,
        timeout: 30_000, // 30 seconds timeout
        retry: 0, // disable retries to avoid multiple requests in case of failure
      })
      .json<QuickEditResponse>();

    const validatedResponse = quickEditResponseSchema.parse(response);
    return validatedResponse.editedCode || null;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return null; // Return null if the request was aborted
    }
    toast.error("failed to fetch AI quick edit");
    return null; // Return null for any other errors (validation, network, etc.)
  }
};
