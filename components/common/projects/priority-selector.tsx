'use client';

import { useEffect, useId, useState } from 'react';
import { CheckIcon } from 'lucide-react';
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
import { type ProjectOptionLike } from '@/lib/projects-presentation';
import { priorities, type Priority } from '@/lib/ui-catalog';

interface PrioritySelectorProps {
   priority: Priority;
   options: ProjectOptionLike[];
   onPriorityChange?: (priorityId: string) => void;
}

const priorityIconMap: Record<string, Priority['icon']> = Object.fromEntries(
   priorities.map((item) => [item.id, item.icon])
);

export function PrioritySelector({ priority, options, onPriorityChange }: PrioritySelectorProps) {
   const id = useId();
   const [open, setOpen] = useState<boolean>(false);
   const [value, setValue] = useState<string>(priority.id);

   useEffect(() => {
      setValue(priority.id);
   }, [priority.id]);

   const handlePriorityChange = (priorityId: string) => {
      setValue(priorityId);
      setOpen(false);

      onPriorityChange?.(priorityId);
   };

   const selectedOption = options.find((item) => item.id === value);
   const SelectedIcon = priorityIconMap[value] ?? priorities[0].icon;

   return (
      <Popover open={open} onOpenChange={setOpen}>
         <PopoverTrigger asChild>
            <Button
               id={id}
               className="flex items-center justify-center"
               size="icon"
               variant="ghost"
               role="combobox"
               aria-expanded={open}
            >
               {selectedOption ? (
                  <SelectedIcon className="text-muted-foreground size-4" />
               ) : (
                  <span className="size-2 rounded-full bg-muted-foreground/60" />
               )}
            </Button>
         </PopoverTrigger>
         <PopoverContent className="border-input w-56 p-0" align="start">
            <Command>
               <CommandInput placeholder="Set priority..." />
               <CommandList>
                  <CommandEmpty>No priority found.</CommandEmpty>
                  <CommandGroup>
                     {options.map((item) => {
                        const Icon = priorityIconMap[item.id] ?? priorities[0].icon;
                        return (
                           <CommandItem
                              key={item.id}
                              value={`${item.id} ${item.name}`}
                              onSelect={() => handlePriorityChange(item.id)}
                              className="flex items-center justify-between"
                           >
                              <div className="flex items-center gap-2">
                                 <Icon className="text-muted-foreground size-4" />
                                 <span className="text-xs">{item.name}</span>
                              </div>
                              {value === item.id && <CheckIcon size={14} className="ml-auto" />}
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
