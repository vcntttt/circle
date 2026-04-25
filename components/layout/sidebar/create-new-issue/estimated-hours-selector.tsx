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
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Kbd } from '@/components/ui/kbd';
import { Clock3, CheckIcon, XIcon } from 'lucide-react';
import { useEffect, useId, useState } from 'react';

interface EstimatedHoursSelectorProps {
   estimatedHours: number | undefined;
   onChange: (estimatedHours: number | undefined) => void;
}

const formatEstimatedHours = (estimatedHours: number | undefined) => {
   if (estimatedHours === undefined) {
      return 'No estimate';
   }

   const normalized = Number(estimatedHours.toFixed(2));
   return `${Number(normalized.toFixed(2)).toString()}h`;
};

export function EstimatedHoursSelector({ estimatedHours, onChange }: EstimatedHoursSelectorProps) {
   const id = useId();
   const [open, setOpen] = useState(false);
   const [value, setValue] = useState(estimatedHours !== undefined ? String(estimatedHours) : '');

   useEffect(() => {
      setValue(estimatedHours !== undefined ? String(estimatedHours) : '');
   }, [estimatedHours]);

   const commitValue = () => {
      const nextValue = value.trim();

      if (nextValue === '') {
         onChange(undefined);
         setOpen(false);
         return;
      }

      const parsed = Number.parseFloat(nextValue);
      if (!Number.isFinite(parsed) || parsed < 0) {
         setValue(estimatedHours !== undefined ? String(estimatedHours) : '');
         return;
      }

      onChange(parsed);
      setOpen(false);
   };

   const handlePreset = (hours: number) => {
      onChange(hours);
      setValue(String(hours));
      setOpen(false);
   };

   const handleClear = () => {
      onChange(undefined);
      setValue('');
      setOpen(false);
   };

   return (
      <div className="*:not-first:mt-2">
         <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
               <Button
                  id={id}
                  className="flex items-center gap-1.5"
                  size="xs"
                  variant="secondary"
                  role="combobox"
                  aria-expanded={open}
               >
                  <Clock3 className="size-4" />
                  <span className="max-w-[120px] truncate">
                     {formatEstimatedHours(estimatedHours)}
                  </span>
                  <Kbd className="ml-auto">Alt+H</Kbd>
               </Button>
            </PopoverTrigger>
            <PopoverContent
               className="border-input w-full min-w-[var(--radix-popper-anchor-width)] p-0"
               align="start"
            >
               <Command>
                  <CommandInput
                     autoFocus
                     placeholder="Set estimated hours..."
                     value={value}
                     onValueChange={setValue}
                     onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                           event.preventDefault();
                           commitValue();
                        }
                        if (event.key === 'Escape') {
                           setOpen(false);
                        }
                     }}
                  />
                  <CommandList>
                     <CommandEmpty>No value entered.</CommandEmpty>
                     <CommandGroup>
                        {[1, 2, 4, 8].map((hours) => (
                           <CommandItem
                              key={hours}
                              value={`${hours}`}
                              onSelect={() => handlePreset(hours)}
                              className="flex items-center justify-between"
                           >
                              <div className="flex items-center gap-2">
                                 <Clock3 className="size-4" />
                                 {hours}h
                              </div>
                              {estimatedHours === hours && (
                                 <CheckIcon size={16} className="ml-auto" />
                              )}
                           </CommandItem>
                        ))}
                        <CommandItem
                           value="clear estimate"
                           onSelect={handleClear}
                           className="flex items-center justify-between"
                        >
                           <div className="flex items-center gap-2">
                              <XIcon className="size-4" />
                              Clear estimate
                           </div>
                           {estimatedHours === undefined && (
                              <CheckIcon size={16} className="ml-auto" />
                           )}
                        </CommandItem>
                     </CommandGroup>
                  </CommandList>
               </Command>
               <div className="border-t p-3">
                  <div className="flex items-center gap-2">
                     <Input
                        type="number"
                        min="0"
                        step="0.25"
                        inputMode="decimal"
                        placeholder="Custom value"
                        value={value}
                        onChange={(event) => setValue(event.target.value)}
                        onBlur={commitValue}
                        className="h-8"
                     />
                     <Button type="button" size="sm" variant="secondary" onClick={commitValue}>
                        Apply
                     </Button>
                  </div>
               </div>
            </PopoverContent>
         </Popover>
      </div>
   );
}
