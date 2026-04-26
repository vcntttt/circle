'use client';

import { createContext, useContext } from 'react';
import { archivedStatus, status as baseStatus } from '@/lib/ui-catalog';
import type { ProjectOptionLike } from '@/lib/projects-presentation';
import type { Status } from '@/lib/models';

const IssuesStatusContext = createContext<Status[]>([]);
const baseStatusById = Object.fromEntries(baseStatus.map((item) => [item.id, item]));
const statusIconAliases: Record<string, string> = {
   'review': 'technical-review',
   'in-review': 'technical-review',
   'tech-review': 'technical-review',
   'done': 'completed',
   'complete': 'completed',
   'todo': 'to-do',
};

function toStatusKey(value: string): string {
   return value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
}

function resolveStatusIcon(statusId: string, statusName: string): Status['icon'] {
   const directMatch = baseStatusById[statusId];
   if (directMatch) {
      return directMatch.icon;
   }

   const normalizedId = toStatusKey(statusId);
   const aliasedId = statusIconAliases[normalizedId];
   if (aliasedId && baseStatusById[aliasedId]) {
      return baseStatusById[aliasedId].icon;
   }

   const normalizedName = toStatusKey(statusName);
   if (baseStatusById[normalizedName]) {
      return baseStatusById[normalizedName].icon;
   }

   const aliasedNameId = statusIconAliases[normalizedName];
   if (aliasedNameId && baseStatusById[aliasedNameId]) {
      return baseStatusById[aliasedNameId].icon;
   }

   return archivedStatus.icon;
}

export function IssuesStatusProvider({
   statuses,
   children,
}: {
   statuses: ProjectOptionLike[];
   children: React.ReactNode;
}) {
   const issueStatuses: Status[] = statuses.map((item) => {
      return {
         id: item.id,
         name: item.name,
         color: item.color,
         icon: resolveStatusIcon(item.id, item.name),
      };
   });

   return (
      <IssuesStatusContext.Provider value={[...issueStatuses, archivedStatus]}>
         {children}
      </IssuesStatusContext.Provider>
   );
}

export function useIssuesStatuses() {
   const statuses = useContext(IssuesStatusContext);
   return statuses.length > 0 ? statuses : [archivedStatus];
}
