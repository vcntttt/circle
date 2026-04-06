'use client';

import { Layers } from 'lucide-react';
import {
   SidebarGroup,
   SidebarGroupLabel,
   SidebarMenu,
   SidebarMenuButton,
   SidebarMenuItem,
} from '@/components/ui/sidebar';
import Link from 'next/link';
import { workspaceItems } from '@/mock-data/side-bar-nav';
import { RiPresentationLine } from '@remixicon/react';

const secondaryWorkspaceItems = [
   {
      name: 'Initiatives',
      icon: RiPresentationLine,
   },
   {
      name: 'Views',
      icon: Layers,
   },
];

export function NavWorkspace() {
   return (
      <SidebarGroup className="group-data-[collapsible=icon]:hidden">
         <SidebarGroupLabel>Workspace</SidebarGroupLabel>
         <SidebarMenu>
            {workspaceItems.map((item) => (
               <SidebarMenuItem key={item.name}>
                  <SidebarMenuButton asChild>
                     <Link href={item.url}>
                        <item.icon />
                        <span>{item.name}</span>
                     </Link>
                  </SidebarMenuButton>
               </SidebarMenuItem>
            ))}
            {secondaryWorkspaceItems.map((item) => (
               <SidebarMenuItem key={item.name}>
                  <SidebarMenuButton>
                     <item.icon />
                     <span>{item.name}</span>
                  </SidebarMenuButton>
               </SidebarMenuItem>
            ))}
         </SidebarMenu>
      </SidebarGroup>
   );
}
