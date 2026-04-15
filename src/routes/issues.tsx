import { createFileRoute } from '@tanstack/react-router';
import AllIssues from '@/components/common/issues/all-issues';
import Header from '@/components/layout/headers/issues/header';
import MainLayout from '@/components/layout/main-layout';
import { getIssuesPage } from '@/src/server/issues';

export const Route = createFileRoute('/issues')({
   loader: () => getIssuesPage(),
   head: () => ({
      meta: [
         { title: 'Issues | Circle Personal Fork' },
         { name: 'description', content: 'Issue tracking for the personal Circle workspace.' },
      ],
   }),
   component: IssuesPage,
});

function IssuesPage() {
   const { issues, databaseError } = Route.useLoaderData();

   return (
      <MainLayout header={<Header />}>
         <AllIssues initialIssues={issues} databaseError={databaseError} />
      </MainLayout>
   );
}
