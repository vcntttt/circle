'use client';

import { useEffect, useState } from 'react';
import { ProjectLike, toPresentationProject } from '@/lib/projects-presentation';
import { projects as mockProjects } from '@/mock-data/projects';
import { getProjectOptions } from '@/src/server/projects';

export function useProjectOptions() {
   const [projects, setProjects] = useState(() => mockProjects);

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
