'use client';

import { Button } from '@/components/ui/button';
import {
   Command,
   CommandEmpty,
   CommandGroup,
   CommandInput,
   CommandItem,
   CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useIssuesStore } from '@/store/issues-store';
import { priorities, type Priority } from '@/lib/ui-catalog';
import { CheckIcon } from 'lucide-react';
import { useEffect, useId, useState } from 'react';
import { cn } from '@/lib/utils';
import { issueChipClassName, issueChipIconClassName } from './issue-chip';

interface PrioritySelectorProps {
   priority: Priority;
   issueId?: string;
   display?: 'icon' | 'chip';
}

export function PrioritySelector({ priority, issueId, display = 'icon' }: PrioritySelectorProps) {
   const id = useId();
   const [open, setOpen] = useState<boolean>(false);
   const [value, setValue] = useState<string>(priority.id);

   const { filterByPriority, updateIssuePriority } = useIssuesStore();

   useEffect(() => {
      setValue(priority.id);
   }, [priority.id]);

   const handlePriorityChange = (priorityId: string) => {
      setValue(priorityId);
      setOpen(false);

      if (issueId) {
         const newPriority = priorities.find((p) => p.id === priorityId);
         if (newPriority) {
            updateIssuePriority(issueId, newPriority);
         }
      }
   };

   const selectedItem = priorities.find((item) => item.id === value);
   const SelectedIcon = selectedItem?.icon;

   return (
      <div className="*:not-first:mt-2">
         <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
               <Button
                  id={id}
                  className={cn(
                     display === 'icon'
                        ? 'size-7 flex items-center justify-center'
                        : issueChipClassName
                  )}
                  size={display === 'icon' ? 'icon' : 'xs'}
                  variant={display === 'icon' ? 'ghost' : 'outline'}
                  role="combobox"
                  aria-expanded={open}
               >
                  {SelectedIcon && (
                     <SelectedIcon
                        className={
                           display === 'icon'
                              ? 'text-muted-foreground size-4'
                              : issueChipIconClassName
                        }
                     />
                  )}
                  {display === 'chip' && (
                     <span className="max-w-[160px] truncate">
                        {selectedItem?.name ?? 'No priority'}
                     </span>
                  )}
               </Button>
            </PopoverTrigger>
            <PopoverContent
               className="border-input w-full min-w-[var(--radix-popper-anchor-width)] p-0"
               align="start"
            >
               <Command>
                  <CommandInput placeholder="Set priority..." />
                  <CommandList>
                     <CommandEmpty>No priority found.</CommandEmpty>
                     <CommandGroup>
                        {priorities.map((item) => (
                           <CommandItem
                              key={item.id}
                              value={item.id}
                              onSelect={handlePriorityChange}
                              className="flex items-center justify-between"
                           >
                              <div className="flex items-center gap-2">
                                 <item.icon className="text-muted-foreground size-4" />
                                 {item.name}
                              </div>
                              {value === item.id && <CheckIcon size={16} className="ml-auto" />}
                              <span className="text-muted-foreground text-xs">
                                 {filterByPriority(item.id).length}
                              </span>
                           </CommandItem>
                        ))}
                     </CommandGroup>
                  </CommandList>
               </Command>
            </PopoverContent>
         </Popover>
      </div>
   );
}
