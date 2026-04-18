'use client';

import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { format } from 'date-fns';
import { Archive, ArrowLeft, Paperclip, Send, Trash2 } from 'lucide-react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { LabelSelector } from './label-selector';
import { PrioritySelector } from './priority-selector';
import { StatusSelector } from './status-selector';
import { AssigneeUser } from './assignee-user';
import { useIssuesStore } from '@/store/issues-store';
import { toast } from 'sonner';
import type { Issue } from '@/lib/models';
import { ProjectSelector } from '@/components/layout/sidebar/create-new-issue/project-selector';

export function IssueDetail({
   issueId,
   initialIssue,
   onDelete,
   onArchive,
   mobileBack = false,
}: {
   issueId: string;
   initialIssue?: Issue;
   onDelete?: (issueId: string) => void;
   onArchive?: (issueId: string) => void;
   mobileBack?: boolean;
}) {
   const navigate = useNavigate();
   const { getIssueById, updateIssueContent, deleteIssue, archiveIssue, updateIssueProject } =
      useIssuesStore();
   const presentationIssue = useMemo(
      () => getIssueById(issueId) ?? initialIssue ?? null,
      [getIssueById, issueId, initialIssue]
   );
   const [title, setTitle] = useState(presentationIssue?.title ?? '');
   const [description, setDescription] = useState(presentationIssue?.description ?? '');

   useEffect(() => {
      setTitle(presentationIssue?.title ?? '');
      setDescription(presentationIssue?.description ?? '');
   }, [presentationIssue?.title, presentationIssue?.description]);

   if (!presentationIssue) {
      return (
         <div className="flex h-full items-center justify-center p-8 text-center bg-background">
            <div className="space-y-2">
               <h3 className="text-lg font-semibold">Issue not found</h3>
               <p className="text-sm text-muted-foreground">
                  The selected issue is no longer available in the workspace.
               </p>
            </div>
         </div>
      );
   }

   const persistTitle = () => {
      const nextTitle = title.trim();

      if (!nextTitle || nextTitle === presentationIssue.title) {
         setTitle(presentationIssue.title);
         return;
      }

      updateIssueContent(issueId, { title: nextTitle });
      toast.success('Title updated');
   };

   const persistDescription = () => {
      const nextDescription = description.trim();
      const normalizedCurrentDescription = presentationIssue.description.trim();

      if (nextDescription === normalizedCurrentDescription) {
         return;
      }

      updateIssueContent(issueId, { description: nextDescription });
      toast.success('Description updated');
   };

   const handleEditorShortcuts = (
      event: React.KeyboardEvent<HTMLTextAreaElement>,
      callback: () => void
   ) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
         event.preventDefault();
         callback();
         return;
      }

      if (event.key === 'Escape') {
         event.preventDefault();
         setTitle(presentationIssue.title);
         setDescription(presentationIssue.description);
         event.currentTarget.blur();
      }
   };

   const handleDelete = () => {
      if (!window.confirm(`Delete ${presentationIssue.identifier}? This cannot be undone.`)) {
         return;
      }

      deleteIssue(issueId);
      toast.success('Issue deleted');
      onDelete?.(issueId);
      void navigate({ to: '/issues', replace: true });
   };

   const handleArchive = () => {
      archiveIssue(issueId);
      toast.success('Issue archived');
      onArchive?.(issueId);
      void navigate({ to: '/issues', replace: true });
   };

   return (
      <div className="flex h-full flex-col bg-background">
         <div className="flex items-center justify-between px-4 h-10 border-b border-border">
            <div className="flex items-center gap-3 min-w-0">
               <SidebarTrigger className="inline-flex lg:hidden" />
               {mobileBack && (
                  <Button variant="ghost" size="xs" asChild>
                     <Link to="/issues">
                        <ArrowLeft className="size-4" />
                        Back
                     </Link>
                  </Button>
               )}
               <span className="text-sm font-medium truncate">{presentationIssue.identifier}</span>
               <span className="text-xs text-muted-foreground hidden sm:inline-block">
                  Created {format(new Date(presentationIssue.createdAt), 'MMM dd, yyyy')}
               </span>
            </div>

            <div className="flex items-center gap-2">
               <PrioritySelector
                  priority={presentationIssue.priority}
                  issueId={presentationIssue.id}
               />
               <StatusSelector status={presentationIssue.status} issueId={presentationIssue.id} />
               <Button variant="ghost" size="icon" className="size-7" onClick={handleArchive}>
                  <Archive className="size-4 text-muted-foreground" />
               </Button>
               <Button variant="ghost" size="icon" className="size-7" onClick={handleDelete}>
                  <Trash2 className="size-4 text-muted-foreground" />
               </Button>
            </div>
         </div>

         <div className="pt-8 pb-6 px-5 space-y-6 w-full max-w-4xl mx-auto overflow-y-auto h-full">
            <div className="space-y-3">
               <Textarea
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  onBlur={persistTitle}
                  onKeyDown={(event) => handleEditorShortcuts(event, persistTitle)}
                  rows={1}
                  className="min-h-0 resize-none border-none bg-transparent px-0 text-[26px] font-semibold leading-tight shadow-none focus-visible:ring-0"
               />
               <div className="flex flex-wrap items-center gap-2">
                  <PrioritySelector
                     priority={presentationIssue.priority}
                     issueId={presentationIssue.id}
                  />
                  <StatusSelector
                     status={presentationIssue.status}
                     issueId={presentationIssue.id}
                  />
                  <AssigneeUser user={presentationIssue.assignee} issueId={presentationIssue.id} />
                  <ProjectSelector
                     project={presentationIssue.project}
                     onChange={(project) => updateIssueProject(presentationIssue.id, project)}
                  />
                  <LabelSelector issueId={presentationIssue.id} />
                  {presentationIssue.dueDate && (
                     <span className="text-xs text-muted-foreground rounded-full border px-2.5 py-1 bg-background">
                        Due {format(new Date(presentationIssue.dueDate), 'MMM dd')}
                     </span>
                  )}
               </div>
            </div>

            <div className="prose prose-sm max-w-none">
               <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
                  <span>Description</span>
                  <span>Save with Cmd/Ctrl+Enter</span>
               </div>
               <Textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  onBlur={persistDescription}
                  onKeyDown={(event) => handleEditorShortcuts(event, persistDescription)}
                  placeholder="Add a description..."
                  rows={12}
                  className="min-h-[260px] resize-none rounded-lg border bg-card px-4 py-4 text-sm leading-relaxed"
               />
            </div>

            <div className="relative w-full flex flex-col mt-8">
               <Textarea
                  className="w-full rounded-lg border px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent pb-14 resize-none"
                  placeholder="Leave a note..."
                  rows={3}
               />
               <div className="absolute right-3 bottom-3 flex items-center gap-3">
                  <Button size="icon" variant="ghost">
                     <Paperclip className="w-4 h-4" />
                  </Button>
                  <Button size="icon" variant="secondary">
                     <Send className="w-4 h-4" />
                  </Button>
               </div>
            </div>
         </div>
      </div>
   );
}
