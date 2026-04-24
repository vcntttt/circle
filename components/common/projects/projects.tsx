'use client';

import { useEffect, useState } from 'react';
import ProjectLine from '@/components/common/projects/project-line';
import { ProjectBoard } from '@/components/common/projects/project-board';
import {
   type ProjectLike,
   type ProjectOptionLike,
   toPresentationProject,
} from '@/lib/projects-presentation';
import type { ProjectUpdate } from '@/lib/models';
import { useProjectsFilterStore } from '@/store/projects-filter-store';
import { useProjectsViewStore } from '@/store/projects-view-store';

interface ProjectsProps {
   projects: ProjectLike[];
   statusOptions: ProjectOptionLike[];
   priorityOptions: ProjectOptionLike[];
   databaseError: string | null;
}

export default function Projects({
   projects,
   statusOptions,
   priorityOptions,
   databaseError,
}: ProjectsProps) {
   const { viewType, visibleProperties } = useProjectsViewStore();
   const { filters, sort } = useProjectsFilterStore();
   const [projectRows, setProjectRows] = useState(projects);

   useEffect(() => {
      setProjectRows(projects);
   }, [projects]);

   const handleProjectUpdate = (projectId: string, update: ProjectUpdate) => {
      setProjectRows((rows) =>
         rows.map((project) =>
            project.id === projectId ? { ...project, latestUpdate: update } : project
         )
      );
   };

   const presentationProjects = projectRows.map((project) =>
      toPresentationProject(project, statusOptions, priorityOptions)
   );

   const visibleProjects = presentationProjects
      .filter((project) => {
         if (filters.health.length > 0 && !filters.health.includes(project.health.id)) {
            return false;
         }

         if (filters.priority.length > 0 && !filters.priority.includes(project.priority.id)) {
            return false;
         }

         return true;
      })
      .sort((a, b) => {
         if (sort === 'title-asc') return a.name.localeCompare(b.name);
         if (sort === 'title-desc') return b.name.localeCompare(a.name);
         if (sort === 'date-asc')
            return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
         if (sort === 'date-desc')
            return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
         if (sort === 'status-asc') return a.status.name.localeCompare(b.status.name);
         if (sort === 'status-desc') return b.status.name.localeCompare(a.status.name);
         return 0;
      });

   if (databaseError) {
      return (
         <div className="w-full p-6">
            <div className="rounded-lg border bg-container p-6 max-w-2xl">
               <h2 className="text-sm font-semibold">Database unavailable</h2>
               <p className="mt-2 text-sm text-muted-foreground">{databaseError}</p>
            </div>
         </div>
      );
   }

   if (projectRows.length === 0) {
      return (
         <div className="w-full p-6">
            <div className="rounded-lg border bg-container p-6 max-w-2xl">
               <h2 className="text-sm font-semibold">No projects yet</h2>
               <p className="mt-2 text-sm text-muted-foreground">
                  There are no projects yet. Create your first project and it will appear here.
               </p>
            </div>
         </div>
      );
   }

   if (visibleProjects.length === 0) {
      return (
         <div className="w-full p-6">
            <div className="rounded-lg border bg-container p-6 max-w-2xl">
               <h2 className="text-sm font-semibold">No projects match these filters</h2>
               <p className="mt-2 text-sm text-muted-foreground">
                  Try clearing one or more project filters.
               </p>
            </div>
         </div>
      );
   }

   return viewType === 'board' ? (
      <ProjectBoard
         projects={visibleProjects}
         statusOptions={statusOptions}
         priorityOptions={priorityOptions}
      />
   ) : (
      <div className="w-full">
         <div className="bg-container px-6 py-1.5 text-sm flex items-center text-muted-foreground border-b sticky top-0 z-10">
            <div className="flex-1 min-w-0">Title</div>
            {visibleProperties.health && (
               <div className="w-[20%] sm:w-[10%] xl:w-[13%] pl-2.5 shrink-0">Health</div>
            )}
            {visibleProperties.priority && (
               <div className="hidden w-[10%] sm:block pl-2 shrink-0">Priority</div>
            )}
            {visibleProperties.lead && (
               <div className="hidden xl:block xl:w-[13%] pl-2 shrink-0">Lead</div>
            )}
            {visibleProperties.targetDate && (
               <div className="hidden xl:block xl:w-[13%] pl-2.5 shrink-0">Target date</div>
            )}
            {visibleProperties.status && (
               <div className="w-[20%] sm:w-[10%] pl-2 shrink-0">Status</div>
            )}
         </div>

         <div className="w-full">
            {visibleProjects.map((project) => (
               <ProjectLine
                  key={project.id}
                  project={project}
                  visibleProperties={visibleProperties}
                  statusOptions={statusOptions}
                  priorityOptions={priorityOptions}
                  onProjectUpdate={handleProjectUpdate}
               />
            ))}
         </div>
      </div>
   );
}
