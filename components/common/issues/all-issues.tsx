'use client';

import { IssueListItem } from '@/lib/db/issues';
import { toPresentationIssue } from '@/lib/issues-presentation';
import { type Issue } from '@/lib/ui-catalog';
import { useIssuesStore } from '@/store/issues-store';
import { useSearchStore } from '@/store/search-store';
import { useViewStore } from '@/store/view-store';
import { useFilterStore } from '@/store/filter-store';
import { FC, useLayoutEffect, useMemo } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { GroupIssues } from './group-issues';
import { SearchIssues } from './search-issues';
import { CustomDragLayer } from './issue-grid';
import { cn } from '@/lib/utils';
import { IssuesStatusProvider, useIssuesStatuses } from './issues-status-context';
import type { ProjectOptionLike } from '@/lib/projects-presentation';

interface AllIssuesProps {
   initialIssues: IssueListItem[];
   initialStatuses: ProjectOptionLike[];
   databaseError: string | null;
}

export default function AllIssues({
   initialIssues,
   initialStatuses,
   databaseError,
}: AllIssuesProps) {
   const { replaceIssues } = useIssuesStore();
   const { isSearchOpen, searchQuery } = useSearchStore();
   const { viewType, showEmptyStatuses } = useViewStore();
   const { hasActiveFilters } = useFilterStore();
   const hydratedIssues = useMemo(
      () => initialIssues.map((issue) => toPresentationIssue(issue, initialStatuses)),
      [initialIssues, initialStatuses]
   );

   useLayoutEffect(() => {
      replaceIssues(hydratedIssues);
   }, [hydratedIssues, replaceIssues]);

   if (databaseError) {
      return (
         <div className="w-full p-6">
            <div className="rounded-lg border bg-container p-6 max-w-2xl">
               <h2 className="text-sm font-semibold">Database unavailable</h2>
               <p className="mt-2 text-sm text-muted-foreground">{databaseError}</p>
            </div>
         </div>
      );
   }

   if (hydratedIssues.length === 0) {
      return (
         <div className="w-full p-6">
            <div className="rounded-lg border bg-container p-6 max-w-2xl">
               <h2 className="text-sm font-semibold">No issues yet</h2>
               <p className="mt-2 text-sm text-muted-foreground">
                  There are no issues yet. Create your first issue from the composer in the sidebar.
               </p>
            </div>
         </div>
      );
   }

   const isSearching = isSearchOpen && searchQuery.trim() !== '';
   const isViewTypeGrid = viewType === 'grid';
   const isFiltering = hasActiveFilters();

   return (
      <IssuesStatusProvider statuses={initialStatuses}>
         <div className={cn('w-full h-full', isViewTypeGrid && 'overflow-x-auto')}>
            {isSearching ? (
               <SearchIssuesView />
            ) : isFiltering ? (
               <FilteredIssuesView
                  isViewTypeGrid={isViewTypeGrid}
                  showEmptyStatuses={showEmptyStatuses}
               />
            ) : (
               <GroupIssuesListView
                  isViewTypeGrid={isViewTypeGrid}
                  showEmptyStatuses={showEmptyStatuses}
               />
            )}
         </div>
      </IssuesStatusProvider>
   );
}

const SearchIssuesView = () => (
   <div className="px-6 mb-6">
      <SearchIssues />
   </div>
);

const FilteredIssuesView: FC<{
   isViewTypeGrid: boolean;
   showEmptyStatuses: boolean;
}> = ({ isViewTypeGrid = false, showEmptyStatuses }) => {
   const { filters } = useFilterStore();
   const { filterIssues } = useIssuesStore();
   const statuses = useIssuesStatuses();

   // Apply filters to get filtered issues
   const filteredIssues = useMemo(() => {
      return filterIssues(filters);
   }, [filterIssues, filters]);
   const displayedStatuses = useMemo(() => {
      if (showEmptyStatuses) {
         return statuses;
      }

      return statuses.filter((status) =>
         filteredIssues.some((issue) => issue.status.id === status.id)
      );
   }, [filteredIssues, showEmptyStatuses, statuses]);

   // Group filtered issues by status
   const filteredIssuesByStatus = useMemo(() => {
      const result: Record<string, Issue[]> = {};

      displayedStatuses.forEach((statusItem) => {
         result[statusItem.id] = filteredIssues.filter(
            (issue) => issue.status.id === statusItem.id
         );
      });

      return result;
   }, [displayedStatuses, filteredIssues]);

   return (
      <DndProvider backend={HTML5Backend}>
         <CustomDragLayer />
         <div className={cn(isViewTypeGrid && 'flex h-full gap-3 px-2 py-2 min-w-max')}>
            {displayedStatuses.map((statusItem) => (
               <GroupIssues
                  key={statusItem.id}
                  status={statusItem}
                  issues={filteredIssuesByStatus[statusItem.id] || []}
                  count={filteredIssuesByStatus[statusItem.id]?.length || 0}
               />
            ))}
         </div>
      </DndProvider>
   );
};

const GroupIssuesListView: FC<{
   isViewTypeGrid: boolean;
   showEmptyStatuses: boolean;
}> = ({ isViewTypeGrid = false, showEmptyStatuses }) => {
   const { issuesByStatus } = useIssuesStore();
   const statuses = useIssuesStatuses();
   const displayedStatuses = useMemo(() => {
      if (showEmptyStatuses) {
         return statuses;
      }

      return statuses.filter((status) => (issuesByStatus[status.id] || []).length > 0);
   }, [issuesByStatus, showEmptyStatuses, statuses]);

   return (
      <DndProvider backend={HTML5Backend}>
         <CustomDragLayer />
         <div className={cn(isViewTypeGrid && 'flex h-full gap-3 px-2 py-2 min-w-max')}>
            {displayedStatuses.map((statusItem) => (
               <GroupIssues
                  key={statusItem.id}
                  status={statusItem}
                  issues={issuesByStatus[statusItem.id] || []}
                  count={issuesByStatus[statusItem.id]?.length || 0}
               />
            ))}
         </div>
      </DndProvider>
   );
};
