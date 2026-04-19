import { createFileRoute } from '@tanstack/react-router';
import Projects from '@/components/common/projects/projects';
import Header from '@/components/layout/headers/projects/header';
import MainLayout from '@/components/layout/main-layout';
import { getProjectsPage } from '@/src/server/projects';

export const Route = createFileRoute('/projects')({
   loader: () => getProjectsPage(),
   head: () => ({
      meta: [
         { title: 'Projects | Circle Personal Fork' },
         {
            name: 'description',
            content: 'Projects backed by PostgreSQL for the personal Circle tracker.',
         },
      ],
   }),
   component: ProjectsPage,
});

function ProjectsPage() {
   const { projects, statusOptions, priorityOptions, databaseError, isConnected } =
      Route.useLoaderData();

   return (
      <MainLayout header={<Header count={projects.length} isConnected={isConnected} />}>
         <Projects
            projects={projects}
            statusOptions={statusOptions}
            priorityOptions={priorityOptions}
            databaseError={databaseError}
         />
      </MainLayout>
   );
}
