import { Outlet, createFileRoute } from '@tanstack/react-router';
import Header from '@/components/layout/headers/projects/header';
import MainLayout from '@/components/layout/main-layout';
import { getProjectsPage } from '@/src/server/projects';

export const Route = createFileRoute('/projects')({
   loader: () => getProjectsPage(),
   head: () => ({
      meta: [
         { title: 'Projects | Circle' },
         {
            name: 'description',
            content: 'Projects backed by PostgreSQL for the personal Circle tracker.',
         },
      ],
   }),
   component: ProjectsPage,
});

function ProjectsPage() {
   const { projects, isConnected } = Route.useLoaderData();

   return (
      <MainLayout header={<Header count={projects.length} isConnected={isConnected} />}>
         <Outlet />
      </MainLayout>
   );
}
