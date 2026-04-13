import { useUpdateProjectSettings } from "@/modules/utils/useProject";
import { useState } from "react";
import { useForm } from "@tanstack/react-form";
import z from "zod";
import { Doc, Id } from "../../../../convex/_generated/dataModel";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { SettingsIcon } from "lucide-react";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";

const formSchema = z.object({
  installCommand: z.string(),
  devCommand: z.string(),
});

interface Props {
  id: Id<"projects">;
  initialValue: Doc<"projects">["settings"];
  onSave?: () => void;
}
export const PreviewSettingsPopover = ({ initialValue, id, onSave }: Props) => {
  const [open, setOPen] = useState(false);
  const updateProjectSettings = useUpdateProjectSettings();

  const form = useForm({
    defaultValues: {
      installCommand: initialValue?.installCommand || "",
      devCommand: initialValue?.devCommand || "",
    },
    validators: {
      onSubmit: formSchema,
    },

    onSubmit: async ({ value }) => {
      await updateProjectSettings({
        id,
        settings: {
          installCommand: value.installCommand,
          devCommand: value.devCommand,
        },
      });

      setOPen(false);
      onSave?.();
    },
  });

  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      form.reset({
        installCommand: initialValue?.installCommand || "",
        devCommand: initialValue?.devCommand || "",
      });
    }
    setOPen(isOpen);
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          size="sm"
          variant="ghost"
          className="h-full rounded-none"
          title="preview settings"
        >
          <SettingsIcon className="size-3" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit();
          }}
        >
          <div className="space-y-4">
            <div className="space-y-1">
              <h4 className="font-medium text-sm">Preview settings</h4>
              <p className="text-muted-foreground text-xs">
                Configure how your project run in preview
              </p>
            </div>

            <form.Field name="installCommand">
              {(field) => (
                <Field>
                  <FieldLabel htmlFor={field.name}>Install command</FieldLabel>
                  <input
                    id={Field.name}
                    name={field.name}
                    value={field.state.value}
                    className="px-2 py-1"
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="npm install"
                  />
                  <FieldDescription>
                    Command to install dependencies
                  </FieldDescription>
                </Field>
              )}
            </form.Field>
            <form.Field name="devCommand">
              {(field) => (
                <Field>
                  <FieldLabel htmlFor={field.name}>Start Command</FieldLabel>
                  <input
                    id={Field.name}
                    name={field.name}
                    className="px-2 py-1"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="npm run dev"
                  />
                  <FieldDescription>
                    Command to start development server
                  </FieldDescription>
                </Field>
              )}
            </form.Field>
            <form.Subscribe
              selector={(state) => [state.canSubmit, state.isSubmitting]}
            >
              {([canSubmit, isSubmitting]) => (
                <Button
                  type="submit"
                  size="sm"
                  className="w-full"
                  disabled={!canSubmit || isSubmitting}
                >
                  {isSubmitting ? "Saving..." : "Save changes"}
                </Button>
              )}
            </form.Subscribe>
          </div>
        </form>
      </PopoverContent>
    </Popover>
  );
};
