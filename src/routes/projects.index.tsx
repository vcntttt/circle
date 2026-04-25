import { createFileRoute } from '@tanstack/react-router';
import Projects from '@/components/common/projects/projects';
import { Route as ProjectsRoute } from './projects';

export const Route = createFileRoute('/projects/')({
   component: ProjectsIndexPage,
});

function ProjectsIndexPage() {
   const { projects, statusOptions, priorityOptions, databaseError } =
      ProjectsRoute.useLoaderData();

   return (
      <Projects
         projects={projects}
         statusOptions={statusOptions}
         priorityOptions={priorityOptions}
         databaseError={databaseError}
      />
   );
}
