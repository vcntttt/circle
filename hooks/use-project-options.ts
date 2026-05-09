'use client';

import { useEffect, useState } from 'react';
import {
   type Project,
   type ProjectLike,
   type ProjectOptionLike,
   toPresentationProject,
} from '@/lib/projects-presentation';
import {
   getProjectOptions,
   getProjectPriorityList,
   getProjectStatusList,
} from '@/src/server/projects';

let cachedProjectOptions: Project[] = [];
let projectOptionsRequest: Promise<Project[]> | null = null;
const projectOptionsListeners = new Set<(projects: Project[]) => void>();

function notifyProjectOptionsListeners(projects: Project[]) {
   for (const listener of projectOptionsListeners) {
      listener(projects);
   }
}

function loadProjectOptions() {
   projectOptionsRequest ??= Promise.all([
      getProjectOptions(),
      getProjectStatusList(),
      getProjectPriorityList(),
   ])
      .then(([projectsResult, statusesResult, prioritiesResult]) => {
         const statuses = statusesResult as ProjectOptionLike[];
         const priorities = prioritiesResult as ProjectOptionLike[];
         const projects = (projectsResult as ProjectLike[]).map((project) =>
            toPresentationProject(project, statuses, priorities)
         );

         cachedProjectOptions = projects;
         notifyProjectOptionsListeners(projects);

         return projects;
      })
      .catch((error) => {
         console.error('Failed to load project options.', error);
         throw error;
      })
      .finally(() => {
         projectOptionsRequest = null;
      });

   return projectOptionsRequest;
}

export function useProjectOptions() {
   const [projects, setProjects] = useState<Project[]>(cachedProjectOptions);

   useEffect(() => {
      let isMounted = true;
      const listener = (nextProjects: Project[]) => {
         if (isMounted) {
            setProjects(nextProjects);
         }
      };

      projectOptionsListeners.add(listener);
      setProjects(cachedProjectOptions);
      void loadProjectOptions().catch(() => {
         // loadProjectOptions already logs the failure.
      });

      return () => {
         isMounted = false;
         projectOptionsListeners.delete(listener);
      };
   }, []);

   return projects;
}
