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

export function useProjectOptions() {
   const [projects, setProjects] = useState<Project[]>([]);

   useEffect(() => {
      let isMounted = true;

      void Promise.all([getProjectOptions(), getProjectStatusList(), getProjectPriorityList()])
         .then(([projectsResult, statusesResult, prioritiesResult]) => {
            if (!isMounted) return;
            const statuses = statusesResult as ProjectOptionLike[];
            const priorities = prioritiesResult as ProjectOptionLike[];
            setProjects(
               (projectsResult as ProjectLike[]).map((project) =>
                  toPresentationProject(project, statuses, priorities)
               )
            );
         })
         .catch((error) => {
            console.error('Failed to load project options.', error);
         });

      return () => {
         isMounted = false;
      };
   }, []);

   return projects;
}
