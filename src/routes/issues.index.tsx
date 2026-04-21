import { createFileRoute } from '@tanstack/react-router';
import { IssuesWorkspace } from '@/components/common/issues/issues-workspace';
import { getIssuesPage } from '@/src/server/issues';

export const Route = createFileRoute('/issues/')({
   loader: () => getIssuesPage(),
   component: IssuesIndexPage,
});

function IssuesIndexPage() {
   const { issues, databaseError } = Route.useLoaderData();
   const { projectId } = Route.useSearch();
   const filteredIssues = projectId
      ? issues.filter((issue) => issue.project?.id === projectId)
      : issues;

   return (
      <IssuesWorkspace
         initialIssues={filteredIssues}
         databaseError={databaseError}
         projectFilterId={projectId}
      />
   );
}
