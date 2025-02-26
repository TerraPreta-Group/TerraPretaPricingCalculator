import { HelpCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface HelpIconProps {
  content: string | React.ReactNode;
  className?: string;
}

export function HelpIcon({ content, className }: HelpIconProps) {
  return (
    <TooltipProvider>
      <Tooltip delayDuration={300}>
        <TooltipTrigger className={className}>
          <HelpCircle className="h-4 w-4 ml-1 inline-block text-muted-foreground hover:text-primary cursor-help" />
        </TooltipTrigger>
        <TooltipContent className="max-w-[280px] text-sm">
          {content}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
