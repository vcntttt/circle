import { Box } from 'lucide-react';
import { priorities } from '@/mock-data/priorities';
import {
   health,
   type Project as PresentationProject,
   projects as mockProjects,
} from '@/mock-data/projects';
import { status } from '@/mock-data/status';
import { users } from '@/mock-data/users';

export interface ProjectLike {
   id: string;
   name: string;
   slug: string;
   status: string;
   description?: string | null;
   createdAt: string;
}

const slugify = (value: string) =>
   value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

export const toPresentationProject = (project: ProjectLike): PresentationProject => {
   const matchedProject = mockProjects.find((item) => slugify(item.name) === project.slug);

   if (matchedProject) {
      return {
         ...matchedProject,
         id: project.id,
         name: project.name,
         status: status.find((item) => item.id === project.status) ?? matchedProject.status,
         startDate: project.createdAt,
      };
   }

   return {
      id: project.id,
      name: project.name,
      icon: Box,
      status: status.find((item) => item.id === project.status) ?? status[0],
      percentComplete: 0,
      startDate: project.createdAt,
      lead: users[0],
      priority: priorities[0],
      health: health[0],
   };
};
