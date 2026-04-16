import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { FaGithub } from "react-icons/fa";
import { Id } from "../../../convex/_generated/dataModel";
import {
  useGetProjectExportResult,
  useGetProjectName,
} from "../utils/useProject";
import {
  CheckCheckIcon,
  ExternalLinkIcon,
  Loader2Icon,
  XCircleIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import z from "zod";
import { useForm } from "@tanstack/react-form";
import ky, { HTTPError } from "ky";
import { toast } from "sonner";
import { useClerk } from "@clerk/nextjs";
import { useState } from "react";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectValue,
  SelectTrigger,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import Link from "next/link";

interface Props {
  projectId: Id<"projects">;
}

const formSchema = z.object({
  repoName: z
    .string()
    .min(1, "Repo name cannot be empty")
    .max(100, "Repo name cannot be longer than 100 characters")
    .regex(
      /^[a-zA-Z0-9._-]+$/,
      "Only alphanumeric characters, hyphens, underscores, and dots are allowed",
    ),
  description: z
    .string()
    .max(350, "Description cannot be longer than 350 characters"),
  visibility: z.enum(["public", "private"]),
});
export const ExportPopover = ({ projectId }: Props) => {
  const exportResult = useGetProjectExportResult(projectId);
  const projectName = useGetProjectName(projectId);
  const { openUserProfile } = useClerk();
  const [open, setOpen] = useState(false);

  const form = useForm({
    defaultValues: {
      repoName: projectName?.replace(/[^a-zA-Z0-9._-]/g, "-") ?? "",
      description: "",
      visibility: "private",
    },
    validators: {
      onSubmit: formSchema,
    },
    onSubmit: async ({ value }) => {
      try {
        await ky.post("/api/github/export", {
          json: {
            projectId,
            repoName: value.repoName,
            description: value.description || undefined,
            visibility: value.visibility,
          },
        });

        toast.success("Export started...");
      } catch (error) {
        if (error instanceof HTTPError) {
          const body = await error.response.json<{ error: string }>();

          if (body.error.includes("GitHub not connected")) {
            toast.error(
              "GitHub not connected, please reconnect to your gitHub account",
              {
                action: {
                  label: "Connect",
                  onClick: () => openUserProfile(),
                },
              },
            );
            setOpen(false);
            return;
          }
        }
        toast.error("Failed to export project");
      }
    },
  });

  const handleResetExport = async () => {
    await ky.post("/api/github/export/reset", {
      json: {
        projectId,
      },
    });
    setOpen(false);
  };

  const handleCancelExport = async () => {
    await ky.post("/api/github/export/cancel", {
      json: {
        projectId,
      },
    });
    setOpen(false);
  };
  const getStatusIcon = () => {
    if (exportResult?.status === "exporting") {
      return <Loader2Icon className="size-3.5 animate-spin" />;
    }
    if (exportResult?.status === "completed") {
      return <CheckCheckIcon className="size-3.5 text-emerald-500" />;
    }
    if (exportResult?.status === "failed") {
      return <XCircleIcon className="size-3.5 text-red-500" />;
    }
    return <FaGithub className=" text-muted-foreground" />;
  };

  const renderContent = () => {
    if (exportResult?.status === "completed" && exportResult.url) {
      return (
        <div className="flex flex-col items-center gap-3">
          <XCircleIcon className="size-6 text-emerald-500" />
          <p className="text-sm font-medium">Repository created</p>
          <p className="text-xs text-muted-foreground">
            Your project has been exported to GitHub
          </p>
          <div className="flex flex-col gap-2">
            <Button asChild className="w-full">
              <Link href={exportResult.url} target="_blank">
                <ExternalLinkIcon className="size-3 mr-1" />
                <span>View on GitHub</span>
              </Link>
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="w-full"
              onClick={handleResetExport}
            >
              Reset
            </Button>
          </div>
        </div>
      );
    }
    if (exportResult?.status === "exporting") {
      return (
        <div className="flex flex-col items-center gap-3">
          <Loader2Icon className="size-6 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Exporting to GitHub</p>
          <Button
            size="sm"
            variant="outline"
            className="w-full"
            onClick={handleCancelExport}
          >
            Cancel
          </Button>
        </div>
      );
    }

    if (exportResult?.status === "failed") {
      return (
        <div className="flex flex-col items-center gap-3">
          <XCircleIcon className="size-6 text-rose-500" />
          <p className="text-sm font-medium">Export failed</p>
          <p className="text-xs text-muted-foreground text-center">
            The repository name may already be taken or invalid. Please try a
            different name and retry.
          </p>
          <Button
            size="sm"
            variant="outline"
            className="w-full"
            onClick={handleResetExport}
          >
            Retry
          </Button>
        </div>
      );
    }

    return (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          form.handleSubmit();
        }}
      >
        <div className="space-y-4">
          <div className="space-y-1">
            <h4 className="text-sm font-medium">Export to github</h4>
            <p className="text-xs text-muted-foreground">
              Export your project to GitHub repository
            </p>
          </div>
          <form.Field name="repoName">
            {(field) => {
              const isInvalid =
                field.state.meta.isTouched && !field.state.meta.isValid;

              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor={field.name}>Repository Name</FieldLabel>
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onChange={(e) => {
                      field.handleChange(e.target.value);
                    }}
                    onBlur={field.handleBlur}
                    aria-invalid={isInvalid}
                    placeholder="my-project"
                  />
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              );
            }}
          </form.Field>
          <form.Field name="description">
            {(field) => {
              const isInvalid =
                field.state.meta.isTouched && !field.state.meta.isValid;

              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor={field.name}>Description</FieldLabel>
                  <Textarea
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onChange={(e) => {
                      field.handleChange(e.target.value);
                    }}
                    onBlur={field.handleBlur}
                    aria-invalid={isInvalid}
                    placeholder="short description about your project"
                    rows={6}
                  />
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              );
            }}
          </form.Field>
          <form.Field name="visibility">
            {(field) => {
              return (
                <Field>
                  <FieldLabel htmlFor={field.name}>Visibility</FieldLabel>
                  <Select
                    value={field.state.value}
                    onValueChange={(value: "private" | "public") =>
                      field.handleChange(value)
                    }
                  >
                    <SelectTrigger
                      className=" bg-accent/10 rounded py-1 border"
                      id={field.name}
                    >
                      <SelectValue placeholder="Select a visibility" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="private">Private</SelectItem>
                      <SelectItem value="public">Public</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              );
            }}
          </form.Field>
          <form.Subscribe
            selector={(state) => [state.canSubmit, state.isSubmitting]}
          >
            {([canSubmit, isSubmitting]) => (
              <Button disabled={!canSubmit || isSubmitting} type="submit">
                {isSubmitting ? "Exporting..." : "Export"}
              </Button>
            )}
          </form.Subscribe>
        </div>
      </form>
    );
  };
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          className="flex items-center gap-2 pl-2 pr-4 py-1 border-l cursor-pointer rounded-none "
        >
          {getStatusIcon()}
          <span className="text-sm">Export</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">{renderContent()}</PopoverContent>
    </Popover>
  );
};
