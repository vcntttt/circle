'use client';

import { RiGithubLine } from '@remixicon/react';

import { HelpButton } from '@/components/layout/sidebar/help-button';
import { NavInbox } from '@/components/layout/sidebar/nav-inbox';
import { NavWorkspace } from '@/components/layout/sidebar/nav-workspace';
import { NavAccount } from '@/components/layout/sidebar/nav-account';
import { NavFeatures } from '@/components/layout/sidebar/nav-features';
import { WorkspaceHeader } from '@/components/layout/sidebar/workspace-header';
import { Button } from '@/components/ui/button';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader } from '@/components/ui/sidebar';
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
                  <NavInbox />
                  <NavWorkspace />
               </>
            )}
         </SidebarContent>
         <SidebarFooter>
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
         </SidebarFooter>
      </Sidebar>
   );
}
