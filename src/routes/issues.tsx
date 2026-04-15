import { Outlet, createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';
import Header from '@/components/layout/headers/issues/header';
import MainLayout from '@/components/layout/main-layout';

const issuesSearchSchema = z.object({
   projectId: z.string().optional(),
});

export const Route = createFileRoute('/issues')({
   validateSearch: (search) => issuesSearchSchema.parse(search),
   head: () => ({
      meta: [
         { title: 'Issues | Circle Personal Fork' },
         { name: 'description', content: 'Issue tracking for the personal Circle workspace.' },
      ],
   }),
   component: IssuesLayout,
});

function IssuesLayout() {
   return (
      <MainLayout header={<Header />}>
         <Outlet />
      </MainLayout>
   );
}
