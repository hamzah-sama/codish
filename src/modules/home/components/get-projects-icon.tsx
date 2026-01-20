import { AlertCircleIcon, GlobeIcon, Loader2Icon } from "lucide-react";
import { FaGithub } from "react-icons/fa";

export const getIcon = (status: string | undefined) => {
  if (status === "completed") {
    return <FaGithub className="size-4 text-muted-foreground" />;
  } else if (status === "importing") {
    return (
      <Loader2Icon className="size-4 text-muted-foreground animate-spin" />
    );
  } else if (status === "failed") {
    return <AlertCircleIcon className="size-4 text-muted-foreground" />;
  } else {
    return <GlobeIcon className="size-4 text-muted-foreground" />;
  }
};
