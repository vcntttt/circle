'use client';

import { createContext, useContext } from 'react';
import { archivedStatus, status as baseStatus } from '@/lib/ui-catalog';
import type { ProjectOptionLike } from '@/lib/projects-presentation';
import type { Status } from '@/lib/models';

const IssuesStatusContext = createContext<Status[]>([]);
const baseStatusById = Object.fromEntries(baseStatus.map((item) => [item.id, item]));

export function IssuesStatusProvider({
   statuses,
   children,
}: {
   statuses: ProjectOptionLike[];
   children: React.ReactNode;
}) {
   const issueStatuses: Status[] = statuses.map((item) => {
      const fallback = baseStatusById[item.id] ?? archivedStatus;

      return {
         id: item.id,
         name: item.name,
         color: item.color,
         icon: fallback.icon,
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
