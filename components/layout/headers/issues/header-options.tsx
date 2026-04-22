'use client';

import { Button } from '@/components/ui/button';
import {
   DropdownMenuCheckboxItem,
   DropdownMenu,
   DropdownMenuContent,
   DropdownMenuItem,
   DropdownMenuLabel,
   DropdownMenuSeparator,
   DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { IssueDisplayProperty, useViewStore, ViewType } from '@/store/view-store';
import { LayoutGrid, LayoutList, SlidersHorizontal } from 'lucide-react';
import { Filter } from './filter';

const propertyLabels: Record<IssueDisplayProperty, string> = {
   labels: 'Tags',
   project: 'Project',
   assignee: 'Assignee',
   createdAt: 'Created',
};

export default function HeaderOptions() {
   const {
      viewType,
      setViewType,
      visibleProperties,
      toggleProperty,
      showEmptyStatuses,
      setShowEmptyStatuses,
   } = useViewStore();

   const handleViewChange = (type: ViewType) => {
      setViewType(type);
   };

   return (
      <div className="w-full flex justify-between items-center border-b py-1.5 px-6 h-10">
         <Filter />
         <DropdownMenu>
            <DropdownMenuTrigger asChild>
               <Button className="relative" size="xs" variant="secondary">
                  <SlidersHorizontal className="size-4 mr-1" />
                  Display
                  {viewType === 'grid' && (
                     <span className="absolute right-0 top-0 w-2 h-2 bg-orange-500 rounded-full" />
                  )}
               </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-72 p-3 space-y-3" align="end">
               <div className="flex gap-2">
                  <DropdownMenuItem
                     onClick={() => handleViewChange('list')}
                     className={cn(
                        'w-full text-xs border border-accent flex flex-col gap-1',
                        viewType === 'list' ? 'bg-accent' : ''
                     )}
                  >
                     <LayoutList className="size-4" />
                     List
                  </DropdownMenuItem>
                  <DropdownMenuItem
                     onClick={() => handleViewChange('grid')}
                     className={cn(
                        'w-full text-xs border border-accent flex flex-col gap-1',
                        viewType === 'grid' ? 'bg-accent' : ''
                     )}
                  >
                     <LayoutGrid className="size-4" />
                     Board
                  </DropdownMenuItem>
               </div>

               <DropdownMenuSeparator />

               <div className="space-y-1">
                  <DropdownMenuLabel className="px-2 text-xs text-muted-foreground">
                     Display properties
                  </DropdownMenuLabel>
                  {(Object.keys(propertyLabels) as IssueDisplayProperty[]).map((property) => (
                     <DropdownMenuCheckboxItem
                        key={property}
                        checked={visibleProperties[property]}
                        onCheckedChange={() => toggleProperty(property)}
                     >
                        {propertyLabels[property]}
                     </DropdownMenuCheckboxItem>
                  ))}
               </div>

               <DropdownMenuSeparator />

               <div className="space-y-1">
                  <DropdownMenuLabel className="px-0 text-xs text-muted-foreground">
                     Statuses without issues
                  </DropdownMenuLabel>
                  <DropdownMenuCheckboxItem
                     checked={showEmptyStatuses}
                     onCheckedChange={setShowEmptyStatuses}
                  >
                     Show empty statuses
                  </DropdownMenuCheckboxItem>
               </div>
            </DropdownMenuContent>
         </DropdownMenu>
      </div>
   );
}
