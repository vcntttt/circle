'use client';

import { IssueListItem } from '@/lib/db/issues';
import { toPresentationIssue } from '@/lib/issues-presentation';
import { Issue } from '@/mock-data/issues';
import { status } from '@/mock-data/status';
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

interface AllIssuesProps {
   initialIssues: IssueListItem[];
   databaseError: string | null;
}

export default function AllIssues({ initialIssues, databaseError }: AllIssuesProps) {
   const { replaceIssues } = useIssuesStore();
   const { isSearchOpen, searchQuery } = useSearchStore();
   const { viewType } = useViewStore();
   const { hasActiveFilters } = useFilterStore();

   const hydratedIssues = useMemo(
      () => initialIssues.map((issue) => toPresentationIssue(issue)),
      [initialIssues]
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
               <div className="mt-4 rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground font-mono">
                  cd ~/dev/postgres && docker compose up -d
               </div>
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
                  The database is ready, but there are no issues yet. Seed the sample data to
                  restore the current board and list views.
               </p>
               <div className="mt-4 rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground font-mono">
                  pnpm db:seed
               </div>
            </div>
         </div>
      );
   }

   const isSearching = isSearchOpen && searchQuery.trim() !== '';
   const isViewTypeGrid = viewType === 'grid';
   const isFiltering = hasActiveFilters();

   return (
      <div className={cn('w-full h-full', isViewTypeGrid && 'overflow-x-auto')}>
         {isSearching ? (
            <SearchIssuesView />
         ) : isFiltering ? (
            <FilteredIssuesView isViewTypeGrid={isViewTypeGrid} />
         ) : (
            <GroupIssuesListView isViewTypeGrid={isViewTypeGrid} />
         )}
      </div>
   );
}

const SearchIssuesView = () => (
   <div className="px-6 mb-6">
      <SearchIssues />
   </div>
);

const FilteredIssuesView: FC<{
   isViewTypeGrid: boolean;
}> = ({ isViewTypeGrid = false }) => {
   const { filters } = useFilterStore();
   const { filterIssues } = useIssuesStore();

   // Apply filters to get filtered issues
   const filteredIssues = useMemo(() => {
      return filterIssues(filters);
   }, [filterIssues, filters]);

   // Group filtered issues by status
   const filteredIssuesByStatus = useMemo(() => {
      const result: Record<string, Issue[]> = {};

      status.forEach((statusItem) => {
         result[statusItem.id] = filteredIssues.filter(
            (issue) => issue.status.id === statusItem.id
         );
      });

      return result;
   }, [filteredIssues]);

   return (
      <DndProvider backend={HTML5Backend}>
         <CustomDragLayer />
         <div className={cn(isViewTypeGrid && 'flex h-full gap-3 px-2 py-2 min-w-max')}>
            {status.map((statusItem) => (
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
}> = ({ isViewTypeGrid = false }) => {
   const { issuesByStatus } = useIssuesStore();
   return (
      <DndProvider backend={HTML5Backend}>
         <CustomDragLayer />
         <div className={cn(isViewTypeGrid && 'flex h-full gap-3 px-2 py-2 min-w-max')}>
            {status.map((statusItem) => (
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
