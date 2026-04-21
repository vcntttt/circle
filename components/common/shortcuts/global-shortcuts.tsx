'use client';

import { useEffect } from 'react';
import { useRouterState } from '@tanstack/react-router';
import { useCreateIssueStore } from '@/store/create-issue-store';
import { useSearchStore } from '@/store/search-store';
import { useShortcutsHelpStore } from '@/store/shortcuts-help-store';

function isEditableTarget(target: EventTarget | null) {
   if (!(target instanceof HTMLElement)) {
      return false;
   }

   if (target.isContentEditable) {
      return true;
   }

   const editableParent = target.closest('[contenteditable="true"]');
   if (editableParent) {
      return true;
   }

   return Boolean(target.closest('input, textarea, select'));
}

function hasOpenDialog() {
   return Boolean(document.querySelector('[role="dialog"]'));
}

export function GlobalShortcuts() {
   const pathname = useRouterState({ select: (state) => state.location.pathname });
   const { openModal } = useCreateIssueStore();
   const { openSearch } = useSearchStore();
   const { open } = useShortcutsHelpStore();

   useEffect(() => {
      const handleKeyDown = (event: KeyboardEvent) => {
         const isIssuesRoute = pathname === '/issues' || pathname.startsWith('/issues/');

         if (!isIssuesRoute) {
            return;
         }

         if (
            event.key === '?' &&
            !event.metaKey &&
            !event.ctrlKey &&
            !event.altKey &&
            !event.repeat
         ) {
            if (isEditableTarget(event.target) || hasOpenDialog()) {
               return;
            }

            event.preventDefault();
            open();
            return;
         }

         if (event.metaKey || event.ctrlKey || event.altKey || event.shiftKey || event.repeat) {
            return;
         }

         if (isEditableTarget(event.target) || hasOpenDialog()) {
            return;
         }

         const normalizedKey = event.key.toLowerCase();
         const isCreateIssueKey = normalizedKey === 'c' || event.code === 'KeyC';

         if (isCreateIssueKey) {
            event.preventDefault();
            openModal();
            return;
         }

         if (event.key === '/') {
            event.preventDefault();
            openSearch();
         }
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
   }, [open, openModal, openSearch, pathname]);

   return null;
}
