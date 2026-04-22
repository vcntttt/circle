'use client';

import { Badge } from '@/components/ui/badge';
import { Kbd } from '@/components/ui/kbd';
import { PopoverContent } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import type {
   InlineTokenSuggestion,
   InlineTokenSuggestionContext,
} from '@/lib/issue-inline-suggestions';
import { FolderIcon } from 'lucide-react';

interface InlineTokenSuggestionsProps {
   suggestion: InlineTokenSuggestionContext | null;
   activeIndex: number;
   onSelect: (suggestion: InlineTokenSuggestion) => void;
}

export function InlineTokenSuggestions({
   suggestion,
   activeIndex,
   onSelect,
}: InlineTokenSuggestionsProps) {
   if (!suggestion || suggestion.items.length === 0) {
      return null;
   }

   return (
      <PopoverContent
         className="w-[var(--radix-popper-anchor-width)] p-2"
         align="start"
         sideOffset={8}
         onOpenAutoFocus={(event) => event.preventDefault()}
      >
         <div className="mb-2 flex items-center justify-between gap-3 text-xs text-muted-foreground">
            <span>{suggestion.kind === 'project' ? 'Projects' : 'Tags'} while typing</span>
            <span className="flex items-center gap-1">
               <Kbd>Enter</Kbd>
               <span>to insert</span>
            </span>
         </div>

         <div className="flex max-h-60 flex-col gap-1 overflow-y-auto">
            {suggestion.items.map((item, index) => {
               const isActive = index === activeIndex;

               return (
                  <button
                     key={`${item.kind}-${item.id}`}
                     type="button"
                     className={cn(
                        'flex w-full items-center gap-2 rounded-md px-2 py-2 text-left transition-colors',
                        isActive ? 'bg-accent text-accent-foreground' : 'hover:bg-muted'
                     )}
                     onMouseDown={(event) => event.preventDefault()}
                     onClick={() => onSelect(item)}
                  >
                     {item.kind === 'project' ? (
                        <FolderIcon className="size-4 shrink-0 text-muted-foreground" />
                     ) : (
                        <span
                           className="size-3 shrink-0 rounded-full"
                           style={{ backgroundColor: item.label.color }}
                        />
                     )}

                     <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium">{item.name}</div>
                        <div className="truncate text-xs text-muted-foreground">
                           {item.kind === 'project' ? 'Project' : 'Tag'}
                        </div>
                     </div>

                     <Badge variant="outline" className="rounded-full px-2 py-0.5 text-[10px]">
                        {item.kind === 'project' ? '@' : '#'}
                        {item.token}
                     </Badge>
                  </button>
               );
            })}
         </div>

         <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
            <span>Use arrows to navigate.</span>
            <span className="flex items-center gap-1">
               <Kbd>Tab</Kbd>
               <span>also inserts</span>
            </span>
         </div>
      </PopoverContent>
   );
}
