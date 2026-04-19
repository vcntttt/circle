import { Button } from '@/components/ui/button';
import {
   DropdownMenu,
   DropdownMenuCheckboxItem,
   DropdownMenuContent,
   DropdownMenuLabel,
   DropdownMenuSeparator,
   DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ProjectDisplayProperty, useProjectsViewStore } from '@/store/projects-view-store';
import { SlidersHorizontal } from 'lucide-react';
import { Filter } from './filter';

const propertyLabels: Record<ProjectDisplayProperty, string> = {
   health: 'Health',
   priority: 'Priority',
   lead: 'Lead',
   targetDate: 'Target date',
   status: 'Status',
};

export default function HeaderOptions() {
   const { visibleProperties, toggleProperty } = useProjectsViewStore();

   return (
      <div className="w-full flex justify-between items-center border-b py-1.5 px-6 h-10">
         <Filter />
         <DropdownMenu>
            <DropdownMenuTrigger asChild>
               <Button className="relative" size="xs" variant="secondary">
                  <SlidersHorizontal className="size-4 mr-1" />
                  Display
               </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end">
               <DropdownMenuLabel className="text-xs text-muted-foreground">
                  Display properties
               </DropdownMenuLabel>
               <DropdownMenuSeparator />
               {(Object.keys(propertyLabels) as ProjectDisplayProperty[]).map((property) => (
                  <DropdownMenuCheckboxItem
                     key={property}
                     checked={visibleProperties[property]}
                     onCheckedChange={() => toggleProperty(property)}
                  >
                     {propertyLabels[property]}
                  </DropdownMenuCheckboxItem>
               ))}
            </DropdownMenuContent>
         </DropdownMenu>
      </div>
   );
}
