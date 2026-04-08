'use client';

import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { CreateNewIssue } from './create-new-issue';
import { ThemeToggle } from '../theme-toggle';

export function WorkspaceHeader() {
   return (
      <SidebarMenu>
         <SidebarMenuItem>
            <div className="w-full flex gap-1 items-center pt-2">
               <SidebarMenuButton size="lg" className="h-8 p-1 pointer-events-none">
                  <div className="flex aspect-square size-6 items-center justify-center rounded bg-orange-500 text-sidebar-primary-foreground">
                     VC
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                     <span className="truncate font-semibold">Workspace</span>
                  </div>
               </SidebarMenuButton>
               <ThemeToggle />
               <CreateNewIssue />
            </div>
         </SidebarMenuItem>
      </SidebarMenu>
   );
}
