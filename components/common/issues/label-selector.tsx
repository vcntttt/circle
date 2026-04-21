'use client';

import { useMemo, useState } from 'react';
import { CheckIcon, PlusIcon } from 'lucide-react';
import {
   Command,
   CommandEmpty,
   CommandGroup,
   CommandInput,
   CommandItem,
   CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { useLabelOptions } from '@/hooks/use-label-options';
import { useIssuesStore } from '@/store/issues-store';

export function LabelSelector({ issueId }: { issueId: string }) {
   const [open, setOpen] = useState(false);
   const allLabels = useLabelOptions();
   const currentLabels = useIssuesStore(
      (state) => state.issues.find((issue) => issue.id === issueId)?.labels ?? []
   );
   const { addIssueLabel, removeIssueLabel } = useIssuesStore();

   const selectedIds = useMemo(
      () => new Set(currentLabels.map((label) => label.id)),
      [currentLabels]
   );

   const handleToggle = (labelId: string) => {
      const label = allLabels.find((item) => item.id === labelId);
      if (!label) return;

      if (selectedIds.has(labelId)) {
         removeIssueLabel(issueId, labelId);
         return;
      }

      addIssueLabel(issueId, label);
   };

   return (
      <Popover open={open} onOpenChange={setOpen}>
         <PopoverTrigger asChild>
            <button className="flex flex-wrap items-center gap-2 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
               {currentLabels.length > 0 ? (
                  currentLabels.map((label) => (
                     <Badge
                        key={label.id}
                        variant="outline"
                        className="gap-1.5 rounded-full text-muted-foreground bg-background"
                     >
                        <span
                           className="size-1.5 rounded-full"
                           style={{ backgroundColor: label.color }}
                           aria-hidden="true"
                        ></span>
                        {label.name}
                     </Badge>
                  ))
               ) : (
                  <span className="inline-flex h-7 items-center gap-1.5 rounded-full border border-input bg-background px-3 text-sm text-muted-foreground">
                     <PlusIcon className="size-3.5" />
                     Add label
                  </span>
               )}
            </button>
         </PopoverTrigger>
         <PopoverContent className="border-input w-64 p-0" align="start">
            <Command>
               <CommandInput placeholder="Set labels..." />
               <CommandList>
                  <CommandEmpty>No labels found.</CommandEmpty>
                  <CommandGroup>
                     {allLabels.map((label) => {
                        const isSelected = selectedIds.has(label.id);

                        return (
                           <CommandItem
                              key={label.id}
                              value={label.name}
                              onSelect={() => handleToggle(label.id)}
                              className="flex items-center justify-between"
                           >
                              <div className="flex items-center gap-2">
                                 <span
                                    className="inline-block size-3 rounded-full"
                                    style={{ backgroundColor: label.color }}
                                    aria-hidden="true"
                                 />
                                 {label.name}
                              </div>
                              {isSelected && <CheckIcon size={16} className="ml-auto" />}
                           </CommandItem>
                        );
                     })}
                  </CommandGroup>
               </CommandList>
            </Command>
         </PopoverContent>
      </Popover>
   );
}
