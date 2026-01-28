import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Props {
  children: React.ReactNode;
  text: React.ReactNode | string;
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
}

export const Hint = ({ children, text, side, align }: Props) => {
  return (
    <Tooltip disableHoverableContent>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side={side} align={align} className="max-w-sm">
        <p>{typeof text === "string" ? <p>{text}</p> : text}</p>
      </TooltipContent>
    </Tooltip>
  );
};
