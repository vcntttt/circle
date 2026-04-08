'use client';

import { RiGithubLine } from '@remixicon/react';
import { Settings } from 'lucide-react';

import { HelpButton } from '@/components/layout/sidebar/help-button';
import { NavWorkspace } from '@/components/layout/sidebar/nav-workspace';
import { NavAccount } from '@/components/layout/sidebar/nav-account';
import { NavFeatures } from '@/components/layout/sidebar/nav-features';
import { WorkspaceHeader } from '@/components/layout/sidebar/workspace-header';
import { Button } from '@/components/ui/button';
import {
   Sidebar,
   SidebarContent,
   SidebarFooter,
   SidebarHeader,
   SidebarMenu,
   SidebarMenuButton,
   SidebarMenuItem,
} from '@/components/ui/sidebar';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BackToApp } from '@/components/layout/sidebar/back-to-app';

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
   const pathname = usePathname();
   const isSettings = pathname.includes('/settings');
   return (
      <Sidebar collapsible="offcanvas" {...props}>
         <SidebarHeader>{isSettings ? <BackToApp /> : <WorkspaceHeader />}</SidebarHeader>
         <SidebarContent>
            {isSettings ? (
               <>
                  <NavAccount />
                  <NavFeatures />
               </>
            ) : (
               <>
                  <NavWorkspace />
               </>
            )}
         </SidebarContent>
         <SidebarFooter>
            <div className="w-full flex flex-col gap-2">
               <SidebarMenu>
                  <SidebarMenuItem>
                     <SidebarMenuButton asChild>
                        <Link href="/settings">
                           <Settings className="size-4" />
                           <span>Settings</span>
                        </Link>
                     </SidebarMenuButton>
                  </SidebarMenuItem>
               </SidebarMenu>
               <div className="w-full flex items-center justify-between">
                  <HelpButton />
                  <Button size="icon" variant="secondary" asChild>
                     <Link
                        href="https://github.com/vcntttt/circle"
                        target="_blank"
                        rel="noopener noreferrer"
                     >
                        <RiGithubLine className="size-4" />
                     </Link>
                  </Button>
               </div>
            </div>
         </SidebarFooter>
      </Sidebar>
   );
}
