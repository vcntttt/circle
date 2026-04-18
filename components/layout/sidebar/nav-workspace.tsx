'use client';

import { Layers } from 'lucide-react';
import {
   SidebarGroup,
   SidebarGroupLabel,
   SidebarMenu,
   SidebarMenuButton,
   SidebarMenuItem,
} from '@/components/ui/sidebar';
import { Link } from '@tanstack/react-router';
import { workspaceItems } from '@/lib/ui-catalog';
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
                     <Link to={item.url}>
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
