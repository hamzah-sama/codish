import { Spinner } from "@/components/ui/spinner";
import { AlertCircleIcon, GlobeIcon } from "lucide-react";
import { FaGithub } from "react-icons/fa";

export const getIcon = (status: string | undefined) => {
  if (status === "completed") {
    return <FaGithub className="size-4 text-muted-foreground" />;
  } else if (status === "importing") {
    return <Spinner />;
  } else if (status === "failed") {
    return <AlertCircleIcon className="size-4 text-muted-foreground" />;
  } else {
    return <GlobeIcon className="size-4 text-muted-foreground" />;
  }
};
