'use client';

import { useEffect, useState } from 'react';
import { ProjectLike, toPresentationProject } from '@/lib/projects-presentation';
import { projects as mockProjects } from '@/mock-data/projects';

export function useProjectOptions() {
   const [projects, setProjects] = useState(() => mockProjects);

   useEffect(() => {
      let isMounted = true;

      void fetch('/api/projects')
         .then(async (response) => {
            if (!response.ok) {
               throw new Error('Project request failed.');
            }

            const result = (await response.json()) as ProjectLike[];
            if (!isMounted) return;
            setProjects(result.map((project) => toPresentationProject(project)));
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
