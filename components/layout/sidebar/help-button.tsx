'use client';

import * as React from 'react';
import { ExternalLink, HelpCircle, Keyboard, Search } from 'lucide-react';

import {
   DropdownMenu,
   DropdownMenuContent,
   DropdownMenuItem,
   DropdownMenuLabel,
   DropdownMenuSeparator,
   DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RiGithubLine } from '@remixicon/react';
import { useShortcutsHelpStore } from '@/store/shortcuts-help-store';

export function HelpButton() {
   const { open } = useShortcutsHelpStore();

   return (
      <DropdownMenu>
         <DropdownMenuTrigger asChild>
            <Button size="icon" variant="outline">
               <HelpCircle className="size-4" />
            </Button>
         </DropdownMenuTrigger>
         <DropdownMenuContent align="end" className="w-60">
            <div className="p-2">
               <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input type="search" placeholder="Search for help..." className="pl-8" />
               </div>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Shortcuts</DropdownMenuLabel>
            <DropdownMenuItem onSelect={() => open()}>
               <Keyboard className="mr-2 h-4 w-4" />
               <span>Keyboard shortcuts</span>
               <span className="ml-auto text-xs text-muted-foreground">?</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Resources</DropdownMenuLabel>
            <DropdownMenuItem asChild>
               <a
                  href="https://github.com/vcntttt/circle"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center"
               >
                  <RiGithubLine className="mr-2 h-4 w-4" />
                  <span>GitHub</span>
                  <ExternalLink className="ml-2 h-3 w-3 text-muted-foreground" />
               </a>
            </DropdownMenuItem>
         </DropdownMenuContent>
      </DropdownMenu>
   );
}
