'use client';

import { useEffect, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { useRouter } from '@tanstack/react-router';
import { Activity, Plus, Send } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
   Dialog,
   DialogContent,
   DialogDescription,
   DialogFooter,
   DialogHeader,
   DialogTitle,
   DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useProjectOptions } from '@/hooks/use-project-options';
import type { Health, Project, ProjectUpdate } from '@/lib/models';
import { health as healthOptions } from '@/lib/ui-catalog';
import { createProjectUpdate } from '@/src/server/projects';

interface CreateProjectUpdateDialogProps {
   project?: Pick<Project, 'id' | 'name' | 'health'>;
   open?: boolean;
   onOpenChange?: (open: boolean) => void;
   trigger?: ReactNode;
   onProjectUpdate?: (projectId: string, update: ProjectUpdate) => void;
}

export function CreateProjectUpdateDialog({
   project,
   open,
   onOpenChange,
   trigger,
   onProjectUpdate,
}: CreateProjectUpdateDialogProps) {
   const router = useRouter();
   const projects = useProjectOptions();
   const [internalOpen, setInternalOpen] = useState(false);
   const [projectId, setProjectId] = useState(project?.id ?? '');
   const [selectedHealth, setSelectedHealth] = useState<Health['id']>(
      project?.health.id === 'no-update' || !project ? 'on-track' : project.health.id
   );
   const [body, setBody] = useState('');
   const [isSubmitting, setIsSubmitting] = useState(false);

   const isOpen = open ?? internalOpen;
   const setIsOpen = onOpenChange ?? setInternalOpen;
   const selectedProject = project ?? projects.find((item) => item.id === projectId);

   useEffect(() => {
      if (!isOpen) {
         return;
      }

      setProjectId(project?.id ?? projects[0]?.id ?? '');
      setSelectedHealth(
         project?.health.id && project.health.id !== 'no-update' ? project.health.id : 'on-track'
      );
      setBody('');
   }, [isOpen, project?.health.id, project?.id, projects]);

   const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      const trimmedBody = body.trim();
      const targetProjectId = project?.id ?? projectId;

      if (!targetProjectId) {
         toast.error('Choose a project first');
         return;
      }

      if (!trimmedBody) {
         toast.error('Project update cannot be empty');
         return;
      }

      setIsSubmitting(true);

      try {
         const update = await createProjectUpdate({
            data: {
               projectId: targetProjectId,
               health: selectedHealth,
               body: trimmedBody,
            },
         });

         onProjectUpdate?.(targetProjectId, update);
         await router.invalidate();
         setIsOpen(false);
         toast.success('Project update posted');
      } catch (error) {
         console.error('Failed to create project update.', error);
         toast.error('Project update could not be posted');
      } finally {
         setIsSubmitting(false);
      }
   };

   return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
         {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}
         <DialogContent>
            <DialogHeader>
               <DialogTitle>New project update</DialogTitle>
               <DialogDescription>
                  Publish a health update that appears in Pulse and on the project row.
               </DialogDescription>
            </DialogHeader>

            <form className="space-y-4" onSubmit={handleSubmit}>
               <div className="space-y-2">
                  <Label>Project</Label>
                  {project ? (
                     <div className="flex h-9 items-center gap-2 rounded-md border px-3 text-sm">
                        <Activity className="size-4 text-muted-foreground" />
                        <span className="truncate">{project.name}</span>
                     </div>
                  ) : (
                     <Select value={projectId} onValueChange={setProjectId}>
                        <SelectTrigger>
                           <SelectValue placeholder="Choose a project" />
                        </SelectTrigger>
                        <SelectContent>
                           {projects.map((item) => (
                              <SelectItem key={item.id} value={item.id}>
                                 {item.name}
                              </SelectItem>
                           ))}
                        </SelectContent>
                     </Select>
                  )}
               </div>

               <div className="space-y-2">
                  <Label>Health</Label>
                  <Select
                     value={selectedHealth}
                     onValueChange={(value) => setSelectedHealth(value as Health['id'])}
                  >
                     <SelectTrigger>
                        <SelectValue />
                     </SelectTrigger>
                     <SelectContent>
                        {healthOptions
                           .filter((item) => item.id !== 'no-update')
                           .map((item) => (
                              <SelectItem key={item.id} value={item.id}>
                                 {item.name}
                              </SelectItem>
                           ))}
                     </SelectContent>
                  </Select>
               </div>

               <div className="space-y-2">
                  <Label htmlFor="project-update-body">Update</Label>
                  <Textarea
                     id="project-update-body"
                     value={body}
                     onChange={(event) => setBody(event.target.value)}
                     placeholder={
                        selectedProject
                           ? `What's changed in ${selectedProject.name}?`
                           : "What's changed?"
                     }
                     className="min-h-32 resize-none"
                  />
               </div>

               <DialogFooter>
                  <Button type="submit" disabled={isSubmitting || (!project && !projectId)}>
                     {isSubmitting ? (
                        'Posting...'
                     ) : (
                        <>
                           <Send className="size-4" />
                           Post update
                        </>
                     )}
                  </Button>
               </DialogFooter>
            </form>
         </DialogContent>
      </Dialog>
   );
}

export function CreateProjectUpdateButton({ disabled = false }: { disabled?: boolean }) {
   return (
      <CreateProjectUpdateDialog
         trigger={
            <Button className="relative" size="xs" variant="secondary" disabled={disabled}>
               <Plus className="size-4" />
               <span className="hidden sm:inline ml-1">New update</span>
            </Button>
         }
      />
   );
}
