import { Outlet, createFileRoute } from '@tanstack/react-router';
import Header from '@/components/layout/headers/issues/header';
import MainLayout from '@/components/layout/main-layout';

export const Route = createFileRoute('/issues')({
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
