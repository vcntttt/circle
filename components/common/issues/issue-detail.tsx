'use client';

import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { format } from 'date-fns';
import { ArrowLeft, Paperclip, Send, Trash2 } from 'lucide-react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { LabelBadge } from './label-badge';
import { ProjectBadge } from './project-badge';
import { PrioritySelector } from './priority-selector';
import { StatusSelector } from './status-selector';
import { AssigneeUser } from './assignee-user';
import { useIssuesStore } from '@/store/issues-store';
import { toast } from 'sonner';

export function IssueDetail({
   issueId,
   onDelete,
   mobileBack = false,
}: {
   issueId: string;
   onDelete?: (issueId: string) => void;
   mobileBack?: boolean;
}) {
   const navigate = useNavigate();
   const { getIssueById, updateIssueContent, deleteIssue } = useIssuesStore();
   const presentationIssue = useMemo(() => getIssueById(issueId) ?? null, [getIssueById, issueId]);
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

   const handleDelete = () => {
      if (!window.confirm(`Delete ${presentationIssue.identifier}? This cannot be undone.`)) {
         return;
      }

      deleteIssue(issueId);
      toast.success('Issue deleted');
      onDelete?.(issueId);
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
            </div>

            <div className="flex items-center gap-2">
               <PrioritySelector
                  priority={presentationIssue.priority}
                  issueId={presentationIssue.id}
               />
               <StatusSelector status={presentationIssue.status} issueId={presentationIssue.id} />
               <Button variant="ghost" size="icon" className="size-7" onClick={handleDelete}>
                  <Trash2 className="size-4 text-muted-foreground" />
               </Button>
            </div>
         </div>

         <div className="pt-10 pb-6 px-4 space-y-6 w-full max-w-4xl mx-auto overflow-y-auto h-full">
            <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
               <span className="text-sm font-medium text-muted-foreground">
                  {presentationIssue.identifier}
               </span>
               <div className="flex items-center gap-2 ml-auto">
                  <span className="text-xs text-muted-foreground">
                     Created {format(new Date(presentationIssue.createdAt), 'MMM dd, yyyy')}
                  </span>
               </div>
            </div>

            <div className="space-y-3">
               <Textarea
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  onBlur={persistTitle}
                  rows={1}
                  className="min-h-0 resize-none border-none bg-transparent px-0 text-2xl font-semibold shadow-none focus-visible:ring-0"
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
                  {presentationIssue.project && (
                     <ProjectBadge project={presentationIssue.project} />
                  )}
                  <LabelBadge label={presentationIssue.labels} />
               </div>
            </div>

            <div className="prose prose-sm max-w-none">
               <Textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  onBlur={persistDescription}
                  placeholder="Add a description..."
                  rows={10}
                  className="min-h-[220px] resize-none rounded-lg border bg-card px-4 py-3 text-sm leading-relaxed"
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
