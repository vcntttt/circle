'use client';

import { useEffect, useMemo, useState, type ComponentType } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { DndProvider, useDragLayer } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import type { Project, ProjectUpdate } from '@/lib/models';
import type { ProjectOptionLike } from '@/lib/projects-presentation';
import type { ProjectDisplayProperty, ProjectBoardGroupBy } from '@/store/projects-view-store';
import { useProjectsViewStore } from '@/store/projects-view-store';
import { persistProjectUpdate } from './project-update';
import { ProjectBoardCardPreview, ProjectDragType } from './project-board-card';
import { ProjectBoardColumn } from './project-board-column';
import { health as allHealth, priorities, status as allStatuses } from '@/lib/ui-catalog';
import { CheckCircle2, CircleAlert, CircleDashed, CircleHelp } from 'lucide-react';

interface ProjectBoardProps {
   projects: Project[];
   statusOptions: ProjectOptionLike[];
   priorityOptions: ProjectOptionLike[];
}

interface ProjectGroup {
   id: string;
   name: string;
   color: string;
   icon: ComponentType<{ className?: string; size?: string | number }>;
}

const statusIconMap = Object.fromEntries(allStatuses.map((item) => [item.id, item.icon]));
const priorityIconMap = Object.fromEntries(priorities.map((item) => [item.id, item.icon]));
const healthIconMap = {
   'no-update': CircleHelp,
   'off-track': CircleAlert,
   'on-track': CheckCircle2,
   'at-risk': CircleDashed,
};

export function ProjectBoard({ projects, statusOptions, priorityOptions }: ProjectBoardProps) {
   const { groupBy, showEmptyGroups, visibleProperties } = useProjectsViewStore();
   const navigate = useNavigate();
   const [boardProjects, setBoardProjects] = useState(projects);

   useEffect(() => {
      setBoardProjects(projects);
   }, [projects]);

   const groups = useMemo(() => {
      const definitions = getGroupDefinitions(groupBy, statusOptions, priorityOptions);
      const grouped = new Map<string, Project[]>();

      definitions.forEach((group) => grouped.set(group.id, []));

      for (const project of boardProjects) {
         const targetGroupId = getProjectGroupId(project, groupBy);
         const currentGroup = grouped.get(targetGroupId);

         if (currentGroup) {
            currentGroup.push(project);
            continue;
         }

         grouped.set(targetGroupId, [project]);
      }

      return definitions
         .map((group) => ({
            ...group,
            projects: grouped.get(group.id) ?? [],
         }))
         .filter((group) => showEmptyGroups || group.projects.length > 0);
   }, [boardProjects, groupBy, priorityOptions, showEmptyGroups, statusOptions]);

   const handleStatusChange = async (projectId: string, statusId: string) => {
      await updateLocalProjectField(projectId, 'status', statusId, 'Project status updated');
   };

   const handlePriorityChange = async (projectId: string, priorityId: string) => {
      await updateLocalProjectField(projectId, 'priority', priorityId, 'Project priority updated');
   };

   const handleProjectUpdate = (projectId: string, update: ProjectUpdate) => {
      const nextHealth = allHealth.find((item) => item.id === update.health) ?? allHealth[0];

      setBoardProjects((currentProjects) =>
         currentProjects.map((project) =>
            project.id === projectId
               ? { ...project, latestUpdate: update, health: nextHealth }
               : project
         )
      );
   };

   const handleMoveProject = async (projectId: string, targetGroupId: string) => {
      if (groupBy === 'health') {
         return;
      }

      const project = boardProjects.find((item) => item.id === projectId);
      if (!project) {
         return;
      }

      const field = groupBy === 'status' ? 'status' : 'priority';
      const currentValue = field === 'status' ? project.status.id : project.priority.id;

      if (currentValue === targetGroupId) {
         return;
      }

      await updateLocalProjectField(
         projectId,
         field,
         targetGroupId,
         field === 'status' ? 'Project status updated' : 'Project priority updated'
      );
   };

   async function updateLocalProjectField(
      projectId: string,
      field: 'status' | 'priority',
      value: string,
      successMessage: string
   ) {
      const previousProjects = boardProjects;
      const nextProjects = boardProjects.map((project) => {
         if (project.id !== projectId) {
            return project;
         }

         if (field === 'status') {
            const nextStatus = statusOptions.find((option) => option.id === value);
            if (!nextStatus) {
               return project;
            }

            return {
               ...project,
               status: {
                  ...project.status,
                  id: value,
                  name: nextStatus.name,
               },
            };
         }

         const nextPriority = priorityOptions.find((option) => option.id === value);
         if (!nextPriority) {
            return project;
         }

         return {
            ...project,
            priority: {
               ...project.priority,
               id: value,
               name: nextPriority.name,
            },
         };
      });

      setBoardProjects(nextProjects);

      try {
         await persistProjectUpdate(
            projectId,
            field === 'status' ? { status: value } : { priority: value }
         );
         toast.success(successMessage);
      } catch (error) {
         console.error(`Failed to update project ${field}.`, error);
         setBoardProjects(previousProjects);
         toast.error(`Project ${field} could not be updated`);
      }
   }

   return (
      <DndProvider backend={HTML5Backend}>
         <ProjectBoardDragLayer groupBy={groupBy} visibleProperties={visibleProperties} />
         <div className="h-full w-full overflow-auto">
            <div className="flex h-full min-w-max gap-3 px-3 py-3">
               {groups.map((group) => (
                  <ProjectBoardColumn
                     key={group.id}
                     group={group}
                     projects={group.projects}
                     groupBy={groupBy}
                     visibleProperties={visibleProperties}
                     statusOptions={statusOptions}
                     priorityOptions={priorityOptions}
                     isReadOnly={groupBy === 'health'}
                     onOpenIssues={handleOpenIssues}
                     onStatusChange={handleStatusChange}
                     onPriorityChange={handlePriorityChange}
                     onProjectUpdate={handleProjectUpdate}
                     onMoveProject={handleMoveProject}
                  />
               ))}
            </div>
         </div>
      </DndProvider>
   );

   function handleOpenIssues(project: Project) {
      void navigate({
         to: '/issues',
         search: { projectId: project.id },
      });
   }
}

function ProjectBoardDragLayer({
   groupBy,
   visibleProperties,
}: {
   groupBy: ProjectBoardGroupBy;
   visibleProperties: Record<ProjectDisplayProperty, boolean>;
}) {
   const { itemType, isDragging, item, currentOffset } = useDragLayer((monitor) => ({
      item: monitor.getItem() as Project,
      itemType: monitor.getItemType(),
      currentOffset: monitor.getSourceClientOffset(),
      isDragging: monitor.isDragging(),
   }));

   if (!isDragging || itemType !== ProjectDragType || !currentOffset) {
      return null;
   }

   return (
      <motion.div
         className="fixed left-0 top-0 z-50 pointer-events-none"
         style={{
            transform: `translate(${currentOffset.x}px, ${currentOffset.y}px)`,
            width: '344px',
         }}
      >
         <ProjectBoardCardPreview
            project={item}
            groupBy={groupBy}
            visibleProperties={visibleProperties}
         />
      </motion.div>
   );
}

function getProjectGroupId(project: Project, groupBy: ProjectBoardGroupBy) {
   if (groupBy === 'status') {
      return project.status.id;
   }

   if (groupBy === 'priority') {
      return project.priority.id;
   }

   return project.health.id;
}

function getGroupDefinitions(
   groupBy: ProjectBoardGroupBy,
   statusOptions: ProjectOptionLike[],
   priorityOptions: ProjectOptionLike[]
): ProjectGroup[] {
   if (groupBy === 'status') {
      return statusOptions.map((option) => ({
         id: option.id,
         name: option.name,
         color: option.color,
         icon: statusIconMap[option.id] ?? allStatuses[0].icon,
      }));
   }

   if (groupBy === 'priority') {
      return priorityOptions.map((option) => ({
         id: option.id,
         name: option.name,
         color: option.color,
         icon: priorityIconMap[option.id] ?? priorities[0].icon,
      }));
   }

   return allHealth.map((option) => ({
      id: option.id,
      name: option.name,
      color: option.color,
      icon: healthIconMap[option.id as keyof typeof healthIconMap] ?? CircleHelp,
   }));
}
