import { Box } from 'lucide-react';
import { currentUser } from '@/lib/current-user';
import {
   health,
   priorities,
   status,
   type Priority,
   type Project as PresentationProject,
   type Status,
} from '@/lib/ui-catalog';

export interface ProjectOptionLike {
   id: string;
   name: string;
   color: string;
   position?: number;
}

export interface ProjectLike {
   id: string;
   name: string;
   slug: string;
   status: string;
   priority?: string;
   description?: string | null;
   createdAt: string;
}

export type Project = PresentationProject;

const fallbackStatus = status.find((item) => item.id === 'backlog') ?? status[0];
const fallbackPriority = priorities.find((item) => item.id === 'no-priority') ?? priorities[0];

const statusIconMap: Record<string, Status['icon']> = Object.fromEntries(
   status.map((item) => [item.id, item.icon])
);

const priorityIconMap: Record<string, Priority['icon']> = Object.fromEntries(
   priorities.map((item) => [item.id, item.icon])
);

const statusToHealth = {
   'backlog': health.find((item) => item.id === 'no-update') ?? health[0],
   'to-do': health.find((item) => item.id === 'no-update') ?? health[0],
   'in-progress': health.find((item) => item.id === 'on-track') ?? health[0],
   'technical-review': health.find((item) => item.id === 'at-risk') ?? health[0],
   'paused': health.find((item) => item.id === 'off-track') ?? health[0],
   'completed': health.find((item) => item.id === 'on-track') ?? health[0],
};

function resolveStatus(
   statusId: string,
   statusOptions?: ProjectOptionLike[]
): PresentationProject['status'] {
   const option = statusOptions?.find((item) => item.id === statusId);
   const fallback = status.find((item) => item.id === statusId) ?? fallbackStatus;

   return {
      id: statusId,
      name: option?.name ?? fallback.name,
      color: option?.color ?? fallback.color,
      icon: statusIconMap[statusId] ?? fallback.icon,
   };
}

function resolvePriority(
   priorityId: string | undefined,
   priorityOptions?: ProjectOptionLike[]
): PresentationProject['priority'] {
   const selectedPriorityId = priorityId ?? 'no-priority';
   const option = priorityOptions?.find((item) => item.id === selectedPriorityId);
   const fallback = priorities.find((item) => item.id === selectedPriorityId) ?? fallbackPriority;

   return {
      id: selectedPriorityId,
      name: option?.name ?? fallback.name,
      icon: priorityIconMap[selectedPriorityId] ?? fallback.icon,
   };
}

export const toPresentationProject = (
   project: ProjectLike,
   statusOptions?: ProjectOptionLike[],
   priorityOptions?: ProjectOptionLike[]
): PresentationProject => {
   const resolvedStatus = resolveStatus(project.status, statusOptions);

   return {
      id: project.id,
      name: project.name,
      icon: Box,
      status: resolvedStatus,
      percentComplete: 0,
      startDate: project.createdAt,
      lead: currentUser,
      priority: resolvePriority(project.priority, priorityOptions),
      health: statusToHealth[project.status as keyof typeof statusToHealth] ?? health[0],
   };
};
