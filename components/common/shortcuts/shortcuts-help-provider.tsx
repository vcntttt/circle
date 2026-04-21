'use client';

import {
   Dialog,
   DialogContent,
   DialogDescription,
   DialogHeader,
   DialogTitle,
} from '@/components/ui/dialog';
import { useShortcutsHelpStore } from '@/store/shortcuts-help-store';

const shortcuts = [
   {
      action: 'Create issue',
      keys: 'C',
      context: 'Issues',
   },
   {
      action: 'Search issues',
      keys: '/',
      context: 'Issues',
   },
   {
      action: 'Open shortcuts help',
      keys: '?',
      context: 'Issues',
   },
   {
      action: 'Toggle sidebar',
      keys: 'Cmd/Ctrl + B',
      context: 'Global',
   },
   {
      action: 'Save issue title/description',
      keys: 'Cmd/Ctrl + Enter',
      context: 'Issue detail',
   },
   {
      action: 'Cancel issue editing',
      keys: 'Esc',
      context: 'Issue detail',
   },
];

export function ShortcutsHelpProvider() {
   const { isOpen, close } = useShortcutsHelpStore();

   return (
      <Dialog
         open={isOpen}
         onOpenChange={(value) => {
            if (!value) {
               close();
            }
         }}
      >
         <DialogContent className="sm:max-w-lg">
            <DialogHeader>
               <DialogTitle>Keyboard shortcuts</DialogTitle>
               <DialogDescription>
                  Quick actions currently available in the personal Circle workspace.
               </DialogDescription>
            </DialogHeader>

            <div className="space-y-2">
               {shortcuts.map((shortcut) => (
                  <div
                     key={`${shortcut.action}-${shortcut.keys}`}
                     className="flex items-center justify-between rounded-md border px-3 py-2"
                  >
                     <div className="min-w-0">
                        <p className="text-sm font-medium">{shortcut.action}</p>
                        <p className="text-xs text-muted-foreground">{shortcut.context}</p>
                     </div>
                     <kbd className="rounded border bg-muted px-2 py-1 text-xs font-medium">
                        {shortcut.keys}
                     </kbd>
                  </div>
               ))}
            </div>
         </DialogContent>
      </Dialog>
   );
}
