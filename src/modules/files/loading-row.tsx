import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import { setPadding } from "./utils/set-padding";

interface Props {
  level: number;
  className?: string;
}

export const LoadingRow = ({ level, className }: Props) => {
  return (
    <div
      className={cn("h-6 flex items-center text-muted-foreground", className)}
      style={{ paddingLeft: setPadding(level) }}
    >
      <Spinner className="text-blue-500 size-4" />
    </div>
  );
};
