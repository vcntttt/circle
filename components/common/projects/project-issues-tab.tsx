'use client';

import { useLayoutEffect, useMemo, useRef } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import type { IssueListItem } from '@/lib/db/issues';
import { toPresentationIssue } from '@/lib/issues-presentation';
import type { Project } from '@/lib/models';
import type { ProjectOptionLike } from '@/lib/projects-presentation';
import { groupIssuesForDisplayByStatus } from '@/lib/issue-status-groups';
import { useCreateIssueStore } from '@/store/create-issue-store';
import { useIssuesStore } from '@/store/issues-store';
import { useViewStore } from '@/store/view-store';
import { Button } from '@/components/ui/button';
import { CustomDragLayer } from '@/components/common/issues/issue-grid';
import { GroupIssues } from '@/components/common/issues/group-issues';
import {
   IssuesStatusProvider,
   useIssuesStatuses,
} from '@/components/common/issues/issues-status-context';
import { Plus } from 'lucide-react';

interface ProjectIssuesTabProps {
   project: Project;
   initialIssues: IssueListItem[];
   initialStatuses: ProjectOptionLike[];
}

const getIssuesHydrationKey = (issues: IssueListItem[]) =>
   issues
      .map((issue) =>
         [
            issue.id,
            issue.status,
            issue.priority,
            issue.assigneeId ?? '',
            issue.project?.id ?? '',
            issue.parentIssueId ?? '',
            issue.labels.map((label) => label.id).join(','),
         ].join(':')
      )
      .join('|');

export function ProjectIssuesTab({
   project,
   initialIssues,
   initialStatuses,
}: ProjectIssuesTabProps) {
   const hydratedIssues = useMemo(
      () => initialIssues.map((issue) => toPresentationIssue(issue, initialStatuses)),
      [initialIssues, initialStatuses]
   );
   const hydrationKey = useMemo(() => getIssuesHydrationKey(initialIssues), [initialIssues]);
   const lastHydrationKeyRef = useRef<string | null>(null);
   const { replaceIssues } = useIssuesStore();

   useLayoutEffect(() => {
      if (lastHydrationKeyRef.current === hydrationKey) {
         return;
      }

      lastHydrationKeyRef.current = hydrationKey;
      replaceIssues(hydratedIssues);
   }, [hydratedIssues, hydrationKey, replaceIssues]);

   return (
      <IssuesStatusProvider statuses={initialStatuses}>
         <ProjectIssuesTabContent project={project} />
      </IssuesStatusProvider>
   );
}

function ProjectIssuesTabContent({ project }: { project: Project }) {
   const { issues } = useIssuesStore();
   const { showEmptyStatuses, viewType } = useViewStore();
   const statuses = useIssuesStatuses();
   const { openModal } = useCreateIssueStore();
   const issuesByStatus = useMemo(() => groupIssuesForDisplayByStatus(issues), [issues]);
   const displayedStatuses = useMemo(() => {
      if (showEmptyStatuses) {
         return statuses;
      }

      return statuses.filter((status) => (issuesByStatus[status.id] ?? []).length > 0);
   }, [issuesByStatus, showEmptyStatuses, statuses]);
   const isViewTypeGrid = viewType === 'grid';

   return (
      <section className="mx-auto max-w-[1030px] px-6 py-10">
         <div className="mb-4 flex items-center justify-between gap-3">
            <div>
               <h2 className="text-sm font-medium">Issues</h2>
               <p className="mt-1 text-sm text-muted-foreground">
                  {issues.length} {issues.length === 1 ? 'issue' : 'issues'} in {project.name}
               </p>
            </div>
            <Button size="sm" className="gap-1.5" onClick={() => openModal(null, project, null)}>
               <Plus className="size-4" />
               New issue
            </Button>
         </div>

         {issues.length === 0 ? (
            <div className="rounded-md border bg-background/40 p-8 text-center">
               <h3 className="text-sm font-medium">No issues yet</h3>
               <p className="mt-1 text-sm text-muted-foreground">
                  Create the first issue for this project from here.
               </p>
            </div>
         ) : (
            <DndProvider backend={HTML5Backend}>
               <CustomDragLayer />
               <div className={isViewTypeGrid ? 'overflow-x-auto' : 'rounded-md border'}>
                  <div className={isViewTypeGrid ? 'flex h-full min-w-max gap-3 py-2' : ''}>
                     {displayedStatuses.map((statusItem) => {
                        const statusIssues = issuesByStatus[statusItem.id] ?? [];

                        return (
                           <GroupIssues
                              key={statusItem.id}
                              status={statusItem}
                              issues={statusIssues}
                              count={statusIssues.length}
                           />
                        );
                     })}
                  </div>
               </div>
            </DndProvider>
         )}
      </section>
   );
}
