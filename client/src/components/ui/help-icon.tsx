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
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
  delayDuration?: number;
}

export function HelpIcon({ 
  content, 
  className,
  side = "top",
  align = "center",
  delayDuration = 300,
}: HelpIconProps) {
  return (
    <TooltipProvider>
      <Tooltip delayDuration={delayDuration}>
        <TooltipTrigger className={className}>
          <HelpCircle 
            className="h-4 w-4 ml-1 inline-block text-muted-foreground hover:text-primary cursor-help transition-colors" 
          />
        </TooltipTrigger>
        <TooltipContent 
          side={side} 
          align={align}
          className="max-w-[280px] text-sm bg-white/95 border border-[#003703]/20 shadow-lg p-3 rounded-lg"
        >
          <div className="text-[#011028]">
            {content}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}