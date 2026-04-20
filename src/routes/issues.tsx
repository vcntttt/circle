import { Outlet, createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';
import Header from '@/components/layout/headers/issues/header';
import MainLayout from '@/components/layout/main-layout';
import { getIssuesPage } from '@/src/server/issues';

const issuesSearchSchema = z.object({
   projectId: z.string().optional(),
});

export const Route = createFileRoute('/issues')({
   loader: () => getIssuesPage(),
   validateSearch: (search) => issuesSearchSchema.parse(search),
   head: () => ({
      meta: [
         { title: 'Issues | Circle' },
         { name: 'description', content: 'Issue tracking for the personal Circle workspace.' },
      ],
   }),
   component: IssuesLayout,
});

function IssuesLayout() {
   const { issues, isConnected } = Route.useLoaderData();

   return (
      <MainLayout header={<Header count={issues.length} isConnected={isConnected} />}>
         <Outlet />
      </MainLayout>
   );
}
