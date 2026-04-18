import { Box } from 'lucide-react';
import { currentUser } from '@/lib/current-user';
import { health, priorities, status, type Project as PresentationProject } from '@/lib/ui-catalog';

export interface ProjectLike {
   id: string;
   name: string;
   slug: string;
   status: string;
   description?: string | null;
   createdAt: string;
}

export type Project = PresentationProject;

export const toPresentationProject = (project: ProjectLike): PresentationProject => {
   return {
      id: project.id,
      name: project.name,
      icon: Box,
      status: status.find((item) => item.id === project.status) ?? status[0],
      percentComplete: 0,
      startDate: project.createdAt,
      lead: currentUser,
      priority: priorities[0],
      health: health[0],
   };
};
