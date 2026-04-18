'use client';

import { useEffect, useState } from 'react';
import { type Project, type ProjectLike, toPresentationProject } from '@/lib/projects-presentation';
import { getProjectOptions } from '@/src/server/projects';

export function useProjectOptions() {
   const [projects, setProjects] = useState<Project[]>([]);

   useEffect(() => {
      let isMounted = true;

      void getProjectOptions()
         .then((result) => {
            if (!isMounted) return;
            setProjects((result as ProjectLike[]).map((project) => toPresentationProject(project)));
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
