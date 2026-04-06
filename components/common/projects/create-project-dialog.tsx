'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
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
import { createProjectAction, type CreateProjectActionState } from '@/app/[orgId]/projects/actions';

const initialState: CreateProjectActionState = {
   success: false,
   error: null,
};

interface CreateProjectDialogProps {
   disabled?: boolean;
}

export function CreateProjectDialog({ disabled = false }: CreateProjectDialogProps) {
   const [open, setOpen] = useState(false);
   const [state, formAction, isPending] = useActionState(createProjectAction, initialState);
   const formRef = useRef<HTMLFormElement>(null);
   const params = useParams<{ orgId: string }>();
   const orgId = typeof params.orgId === 'string' ? params.orgId : '';

   useEffect(() => {
      if (!state.success) return;

      formRef.current?.reset();
      setOpen(false);
   }, [state.success]);

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

            <form ref={formRef} action={formAction} className="space-y-4">
               <input type="hidden" name="orgId" value={orgId} />

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
                     defaultValue="backlog"
                     className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors outline-none"
                  >
                     <option value="backlog">Backlog</option>
                     <option value="to-do">Todo</option>
                     <option value="in-progress">In Progress</option>
                     <option value="technical-review">Technical Review</option>
                     <option value="paused">Paused</option>
                     <option value="completed">Completed</option>
                  </select>
               </div>

               {state.error && <p className="text-sm text-destructive">{state.error}</p>}

               <DialogFooter>
                  <Button type="submit" disabled={isPending}>
                     {isPending ? 'Creating...' : 'Create project'}
                  </Button>
               </DialogFooter>
            </form>
         </DialogContent>
      </Dialog>
   );
}
