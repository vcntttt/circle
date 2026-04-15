import { createFileRoute, notFound } from '@tanstack/react-router';
import { IssueDetail } from '@/components/common/issues/issue-detail';
import MainLayout from '@/components/layout/main-layout';
import { getIssueDetail } from '@/src/server/issues';

export const Route = createFileRoute('/issues/$issueIdentifier')({
   loader: async ({ params }) => {
      const issue = await getIssueDetail({ data: { issueIdentifier: params.issueIdentifier } });

      if (!issue) {
         throw notFound();
      }

      return issue;
   },
   head: ({ params }) => ({
      meta: [{ title: `${params.issueIdentifier} | Circle Personal Fork` }],
   }),
   component: IssueDetailPage,
});

function IssueDetailPage() {
   const issue = Route.useLoaderData();

   return (
      <MainLayout headersNumber={1}>
         <IssueDetail issue={issue} />
      </MainLayout>
   );
}
