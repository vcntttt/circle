'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from '@tanstack/react-router';
import { Plus } from 'lucide-react';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { ProjectOptionLike } from '@/lib/projects-presentation';
import { toast } from 'sonner';
import {
   createProject as createProjectMutation,
   getProjectPriorityList,
   getProjectStatusList,
} from '@/src/server/projects';

interface CreateProjectDialogProps {
   disabled?: boolean;
}

export function CreateProjectDialog({ disabled = false }: CreateProjectDialogProps) {
   const router = useRouter();
   const [open, setOpen] = useState(false);
   const [isPending, setIsPending] = useState(false);
   const [error, setError] = useState<string | null>(null);
   const [statusOptions, setStatusOptions] = useState<ProjectOptionLike[]>([]);
   const [priorityOptions, setPriorityOptions] = useState<ProjectOptionLike[]>([]);
   const formRef = useRef<HTMLFormElement>(null);

   useEffect(() => {
      if (open) {
         setError(null);
      }
   }, [open]);

   useEffect(() => {
      let isMounted = true;

      void Promise.all([getProjectStatusList(), getProjectPriorityList()])
         .then(([statusesResult, prioritiesResult]) => {
            if (!isMounted) return;
            setStatusOptions(statusesResult as ProjectOptionLike[]);
            setPriorityOptions(prioritiesResult as ProjectOptionLike[]);
         })
         .catch((loadError) => {
            console.error('Failed to load project options.', loadError);
         });

      return () => {
         isMounted = false;
      };
   }, []);

   const createProject = async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setIsPending(true);
      setError(null);

      const formData = new FormData(event.currentTarget);

      try {
         await createProjectMutation({
            data: {
               name: formData.get('name'),
               description: formData.get('description') ?? '',
               status: formData.get('status'),
               priority: formData.get('priority') ?? 'no-priority',
            },
         });

         formRef.current?.reset();
         setOpen(false);
         await router.invalidate();
         toast.success('Project created');
      } catch (createError) {
         const message =
            createError instanceof Error ? createError.message : 'Failed to create project.';
         setError(message);
      } finally {
         setIsPending(false);
      }
   };

   return (
      <Dialog open={open} onOpenChange={setOpen}>
         <DialogTrigger asChild>
            <Button className="relative" size="xs" variant="secondary" disabled={disabled}>
               <Plus className="size-4" />
               <span className="hidden sm:inline ml-1">Create project</span>
            </Button>
         </DialogTrigger>
         <DialogContent>
            <DialogHeader>
               <DialogTitle>Create project</DialogTitle>
               <DialogDescription>
                  Add a project to PostgreSQL so the projects view stops depending on the old mock
                  dataset.
               </DialogDescription>
            </DialogHeader>

            <form ref={formRef} onSubmit={createProject} className="space-y-4">
               <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" name="name" placeholder="Personal tracker MVP" required />
               </div>

               <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                     id="description"
                     name="description"
                     placeholder="Short summary of what this project is about."
                     rows={4}
                  />
               </div>

               <div className="space-y-2">
                  <Label htmlFor="status">Initial status</Label>
                  <select
                     id="status"
                     name="status"
                     defaultValue={statusOptions[0]?.id ?? 'backlog'}
                     className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors outline-none"
                  >
                     {statusOptions.map((statusOption) => (
                        <option key={statusOption.id} value={statusOption.id}>
                           {statusOption.name}
                        </option>
                     ))}
                  </select>
               </div>

               <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <select
                     id="priority"
                     name="priority"
                     defaultValue={priorityOptions[0]?.id ?? 'no-priority'}
                     className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors outline-none"
                  >
                     {priorityOptions.map((priorityOption) => (
                        <option key={priorityOption.id} value={priorityOption.id}>
                           {priorityOption.name}
                        </option>
                     ))}
                  </select>
               </div>

               {error && <p className="text-sm text-destructive">{error}</p>}

               <DialogFooter>
                  <Button
                     type="submit"
                     disabled={
                        isPending || statusOptions.length === 0 || priorityOptions.length === 0
                     }
                  >
                     {isPending ? 'Creating...' : 'Create project'}
                  </Button>
               </DialogFooter>
            </form>
         </DialogContent>
      </Dialog>
   );
}
