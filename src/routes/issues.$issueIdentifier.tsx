import { createFileRoute, notFound } from '@tanstack/react-router';
import { IssuesWorkspace } from '@/components/common/issues/issues-workspace';
import { getIssuesPage } from '@/src/server/issues';

export const Route = createFileRoute('/issues/$issueIdentifier')({
   loader: async ({ params }) => {
      const result = await getIssuesPage();
      const issue = result.issues.find((item) => item.identifier === params.issueIdentifier);

      if (!issue) {
         throw notFound();
      }

      return result;
   },
   head: ({ params }) => ({
      meta: [{ title: `${params.issueIdentifier} | Circle Personal Fork` }],
   }),
   component: IssueDetailPage,
});

function IssueDetailPage() {
   const { issues, databaseError } = Route.useLoaderData();
   const { issueIdentifier } = Route.useParams();

   return (
      <IssuesWorkspace
         initialIssues={issues}
         databaseError={databaseError}
         selectedIssueIdentifier={issueIdentifier}
      />
   );
}
