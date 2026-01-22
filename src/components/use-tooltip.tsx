import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

interface Props {
  trigger: React.ReactNode;
  children: React.ReactNode;
}

export const UseTooltip = ({ trigger, children }: Props) => {
  return (
    <Tooltip>
      <TooltipTrigger>{trigger}</TooltipTrigger>
      <TooltipContent>{children}</TooltipContent>
    </Tooltip>
  );
};
