'use client';

import ProjectLine from '@/components/common/projects/project-line';
import { ProjectListItem } from '@/lib/db/projects';
import { Box } from 'lucide-react';
import {
   health,
   type Project as PresentationProject,
   projects as mockProjects,
} from '@/mock-data/projects';
import { priorities } from '@/mock-data/priorities';
import { status as projectStatuses } from '@/mock-data/status';
import { users } from '@/mock-data/users';

interface ProjectsProps {
   projects: ProjectListItem[];
   databaseError: string | null;
}

const slugify = (value: string) =>
   value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

const statusToPercent: Record<string, number> = {
   'backlog': 0,
   'to-do': 10,
   'in-progress': 55,
   'technical-review': 75,
   'paused': 40,
   'completed': 100,
};

const statusToHealth = {
   'backlog': health.find((item) => item.id === 'no-update') ?? health[0],
   'to-do': health.find((item) => item.id === 'no-update') ?? health[0],
   'in-progress': health.find((item) => item.id === 'on-track') ?? health[0],
   'technical-review': health.find((item) => item.id === 'at-risk') ?? health[0],
   'paused': health.find((item) => item.id === 'off-track') ?? health[0],
   'completed': health.find((item) => item.id === 'on-track') ?? health[0],
};

const toPresentationProject = (project: ProjectListItem): PresentationProject => {
   const matchedMockProject = mockProjects.find((item) => slugify(item.name) === project.slug);

   if (matchedMockProject) {
      return {
         ...matchedMockProject,
         id: project.id,
         name: project.name,
         startDate: new Date(project.createdAt).toISOString(),
         status:
            projectStatuses.find((item) => item.id === project.status) ?? matchedMockProject.status,
         percentComplete: statusToPercent[project.status] ?? matchedMockProject.percentComplete,
      };
   }

   return {
      id: project.id,
      name: project.name,
      icon: Box,
      status: projectStatuses.find((item) => item.id === project.status) ?? projectStatuses[0],
      percentComplete: statusToPercent[project.status] ?? 0,
      startDate: new Date(project.createdAt).toISOString(),
      lead: users[0],
      priority: priorities[0],
      health: statusToHealth[project.status as keyof typeof statusToHealth] ?? health[0],
   };
};

export default function Projects({ projects, databaseError }: ProjectsProps) {
   if (databaseError) {
      return (
         <div className="w-full p-6">
            <div className="rounded-lg border bg-container p-6 max-w-2xl">
               <h2 className="text-sm font-semibold">Database unavailable</h2>
               <p className="mt-2 text-sm text-muted-foreground">{databaseError}</p>
               <div className="mt-4 rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground font-mono">
                  cd ~/dev/postgres && docker compose up -d
               </div>
            </div>
         </div>
      );
   }

   if (projects.length === 0) {
      return (
         <div className="w-full p-6">
            <div className="rounded-lg border bg-container p-6 max-w-2xl">
               <h2 className="text-sm font-semibold">No projects yet</h2>
               <p className="mt-2 text-sm text-muted-foreground">
                  The schema is ready, but the database is empty. Seed the sample projects or start
                  adding your own data next.
               </p>
               <div className="mt-4 rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground font-mono">
                  pnpm db:seed
               </div>
            </div>
         </div>
      );
   }

   return (
      <div className="w-full">
         <div className="bg-container px-6 py-1.5 text-sm flex items-center text-muted-foreground border-b sticky top-0 z-10">
            <div className="w-[60%] sm:w-[70%] xl:w-[46%]">Title</div>
            <div className="w-[20%] sm:w-[10%] xl:w-[13%] pl-2.5">Health</div>
            <div className="hidden w-[10%] sm:block pl-2">Priority</div>
            <div className="hidden xl:block xl:w-[13%] pl-2">Lead</div>
            <div className="hidden xl:block xl:w-[13%] pl-2.5">Target date</div>
            <div className="w-[20%] sm:w-[10%] pl-2">Status</div>
         </div>

         <div className="w-full">
            {projects.map((project) => (
               <ProjectLine key={project.id} project={toPresentationProject(project)} />
            ))}
         </div>
      </div>
   );
}
