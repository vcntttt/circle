import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ContactRound } from 'lucide-react';

interface TeamsTooltipProps {
   teamIds: string[];
}

export function TeamsTooltip({ teamIds }: TeamsTooltipProps) {
   return (
      <Tooltip delayDuration={0}>
         <TooltipTrigger className="flex items-center gap-0.5 truncate">
            <ContactRound className="text-muted-foreground size-4 mr-1 shrink-0" />
            {teamIds.slice(0, 2).map((teamId, index) => (
               <span key={teamId} className="mt-0.5">
                  {teamId}
                  {index < Math.min(teamIds.length, 2) - 1 && ', '}
               </span>
            ))}
            {teamIds.length > 2 && <span className="mt-0.5">+ {teamIds.length - 2}</span>}
         </TooltipTrigger>
         <TooltipContent className="p-2">
            <div className="flex flex-col gap-1">
               {teamIds.map((teamId) => (
                  <div key={teamId} className="text-xs flex items-center gap-2">
                     <ContactRound className="text-muted-foreground size-3.5 shrink-0" />
                     <span className="font-medium">{teamId}</span>
                  </div>
               ))}
            </div>
         </TooltipContent>
      </Tooltip>
   );
}
