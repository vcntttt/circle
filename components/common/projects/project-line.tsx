import { useEffect, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import type { Project } from '@/lib/models';
import type { ProjectOptionLike } from '@/lib/projects-presentation';
import { ContextMenu, ContextMenuTrigger } from '@/components/ui/context-menu';
import { usePinnedProjectsStore } from '@/store/pinned-projects-store';
import type { ProjectDisplayProperty } from '@/store/projects-view-store';
import { toast } from 'sonner';
import { updateProject as updateProjectMutation } from '@/src/server/projects';
import { HealthPopover } from './health-popover';
import { LeadSelector } from './lead-selector';
import { ProjectContextMenu } from './project-context-menu';
import { PrioritySelector } from './priority-selector';
import { StatusWithPercent } from './status-with-percent';
import { DatePicker } from './date-picker';

interface ProjectLineProps {
   project: Project;
   visibleProperties: Record<ProjectDisplayProperty, boolean>;
   statusOptions: ProjectOptionLike[];
   priorityOptions: ProjectOptionLike[];
}

export default function ProjectLine({
   project,
   visibleProperties,
   statusOptions,
   priorityOptions,
}: ProjectLineProps) {
   const navigate = useNavigate();
   const { pinnedProjectIds, togglePinnedProject } = usePinnedProjectsStore();
   const [currentStatus, setCurrentStatus] = useState(project.status);
   const [currentPriority, setCurrentPriority] = useState(project.priority);

   useEffect(() => {
      setCurrentStatus(project.status);
      setCurrentPriority(project.priority);
   }, [project.status.id, project.status.name, project.priority.id, project.priority.name]);

   const handleStatusChange = async (statusId: string) => {
      if (statusId === currentStatus.id) {
         return;
      }

      const nextStatus = statusOptions.find((option) => option.id === statusId);
      if (!nextStatus) {
         return;
      }

      const previousStatus = currentStatus;
      setCurrentStatus((state) => ({ ...state, id: statusId, name: nextStatus.name }));

      try {
         await updateProjectMutation({ data: { projectId: project.id, status: statusId } });
         toast.success('Project status updated');
      } catch (error) {
         console.error('Failed to update project status.', error);
         setCurrentStatus(previousStatus);
         toast.error('Project status could not be updated');
      }
   };

   const handlePriorityChange = async (priorityId: string) => {
      if (priorityId === currentPriority.id) {
         return;
      }

      const nextPriority = priorityOptions.find((option) => option.id === priorityId);
      if (!nextPriority) {
         return;
      }

      const previousPriority = currentPriority;
      setCurrentPriority((state) => ({ ...state, id: priorityId, name: nextPriority.name }));

      try {
         await updateProjectMutation({ data: { projectId: project.id, priority: priorityId } });
         toast.success('Project priority updated');
      } catch (error) {
         console.error('Failed to update project priority.', error);
         setCurrentPriority(previousPriority);
         toast.error('Project priority could not be updated');
      }
   };

   const handleOpenIssues = () => {
      void navigate({ to: '/issues', search: { projectId: project.id } });
   };

   const isPinned = pinnedProjectIds.includes(project.id);

   return (
      <ContextMenu>
         <ContextMenuTrigger asChild>
            <div className="w-full flex items-center py-3 px-6 border-b hover:bg-sidebar/50 border-muted-foreground/5 text-sm">
               <div className="flex-1 min-w-0 flex items-center gap-2">
                  <div className="relative">
                     <div className="inline-flex size-6 bg-muted/50 items-center justify-center rounded shrink-0">
                        <project.icon className="size-4" />
                     </div>
                  </div>
                  <button
                     className="flex flex-col items-start overflow-hidden text-left"
                     onClick={handleOpenIssues}
                  >
                     <span className="font-medium truncate w-full hover:underline">
                        {project.name}
                     </span>
                  </button>
               </div>

               {visibleProperties.health && (
                  <div className="w-[20%] sm:w-[10%] xl:w-[13%] shrink-0">
                     <HealthPopover
                        project={{ ...project, status: currentStatus, priority: currentPriority }}
                     />
                  </div>
               )}

               {visibleProperties.priority && (
                  <div className="hidden w-[10%] sm:block shrink-0">
                     <PrioritySelector
                        priority={currentPriority}
                        options={priorityOptions}
                        onPriorityChange={(priorityId) => {
                           void handlePriorityChange(priorityId);
                        }}
                     />
                  </div>
               )}

               {visibleProperties.lead && (
                  <div className="hidden xl:block xl:w-[13%] shrink-0">
                     <LeadSelector lead={project.lead} />
                  </div>
               )}

               {visibleProperties.targetDate && (
                  <div className="hidden xl:block xl:w-[13%] shrink-0">
                     <DatePicker
                        date={project.startDate ? new Date(project.startDate) : undefined}
                     />
                  </div>
               )}

               {visibleProperties.status && (
                  <div className="w-[20%] sm:w-[10%] shrink-0">
                     <StatusWithPercent
                        status={currentStatus}
                        options={statusOptions}
                        onStatusChange={(statusId) => {
                           void handleStatusChange(statusId);
                        }}
                     />
                  </div>
               )}
            </div>
         </ContextMenuTrigger>
         <ProjectContextMenu
            isPinned={isPinned}
            statusId={currentStatus.id}
            priorityId={currentPriority.id}
            statusOptions={statusOptions}
            priorityOptions={priorityOptions}
            onOpenIssues={handleOpenIssues}
            onTogglePin={() => togglePinnedProject(project.id)}
            onStatusChange={(statusId) => {
               void handleStatusChange(statusId);
            }}
            onPriorityChange={(priorityId) => {
               void handlePriorityChange(priorityId);
            }}
         />
      </ContextMenu>
   );
}
