'use client';

import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { format } from 'date-fns';
import { Archive, ArrowLeft, GitBranchPlus, Link2, Paperclip, Send, Trash2 } from 'lucide-react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
   Command,
   CommandEmpty,
   CommandGroup,
   CommandInput,
   CommandItem,
   CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { LabelSelector } from './label-selector';
import { PrioritySelector } from './priority-selector';
import { StatusSelector } from './status-selector';
import { AssigneeUser } from './assignee-user';
import { useIssuesStore } from '@/store/issues-store';
import { useCreateIssueStore } from '@/store/create-issue-store';
import { toast } from 'sonner';
import type { Issue } from '@/lib/models';
import { ProjectSelector } from '@/components/layout/sidebar/create-new-issue/project-selector';
import { ParentIssueSelector } from './parent-issue-selector';

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
   const {
      getIssueById,
      getRootIssues,
      getIssueChildrenCount,
      addIssue,
      updateIssueContent,
      updateIssueEstimatedHours,
      deleteIssue,
      archiveIssue,
      updateIssueProject,
      updateIssueParent,
   } = useIssuesStore();
   const { openModal } = useCreateIssueStore();
   const presentationIssue = useMemo(
      () => getIssueById(issueId) ?? initialIssue ?? null,
      [getIssueById, issueId, initialIssue]
   );
   const [title, setTitle] = useState(presentationIssue?.title ?? '');
   const [description, setDescription] = useState(presentationIssue?.description ?? '');
   const [estimatedHours, setEstimatedHours] = useState(
      presentationIssue?.estimatedHours !== undefined
         ? String(presentationIssue.estimatedHours)
         : ''
   );
   const [attachOpen, setAttachOpen] = useState(false);

   useEffect(() => {
      setTitle(presentationIssue?.title ?? '');
      setDescription(presentationIssue?.description ?? '');
      setEstimatedHours(
         presentationIssue?.estimatedHours !== undefined
            ? String(presentationIssue.estimatedHours)
            : ''
      );
   }, [
      presentationIssue?.estimatedHours,
      presentationIssue?.title,
      presentationIssue?.description,
   ]);

   useEffect(() => {
      if (!presentationIssue) return;
      if (getIssueById(issueId)) return;

      // Seed the detail view issue into the store so label edits can persist immediately.
      addIssue(presentationIssue);
   }, [addIssue, getIssueById, issueId, presentationIssue]);

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

   const persistEstimatedHours = () => {
      const nextValue = estimatedHours.trim();
      const currentValue =
         presentationIssue.estimatedHours !== undefined
            ? String(presentationIssue.estimatedHours)
            : '';

      if (nextValue === currentValue) {
         return;
      }

      if (nextValue === '') {
         updateIssueEstimatedHours(issueId, undefined);
         toast.success('Estimate cleared');
         return;
      }

      const parsed = Number.parseFloat(nextValue);

      if (!Number.isFinite(parsed) || parsed < 0) {
         setEstimatedHours(currentValue);
         toast.error('Enter a valid hour estimate');
         return;
      }

      updateIssueEstimatedHours(issueId, parsed);
      toast.success('Estimate updated');
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

   const canBecomeSubissue = presentationIssue.subissues.length === 0;
   const attachableIssues = getRootIssues().filter(
      (issue) =>
         issue.id !== presentationIssue.id &&
         getIssueChildrenCount(issue.id) === 0 &&
         !presentationIssue.subissues.some((subissue) => subissue.id === issue.id)
   );

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
                  <ParentIssueSelector
                     issueId={presentationIssue.id}
                     parent={presentationIssue.parent ?? null}
                     onChange={(parent) => {
                        if (!canBecomeSubissue && parent) {
                           toast.error('Issues with subissues cannot become subissues');
                           return;
                        }

                        updateIssueParent(presentationIssue.id, parent);
                        toast.success(
                           parent ? `Parent set to ${parent.identifier}` : 'Parent removed'
                        );
                     }}
                  />
                  <LabelSelector issueId={presentationIssue.id} />
                  <div className="flex items-center gap-2 rounded-full border px-2.5 py-1 bg-background">
                     <span className="text-xs text-muted-foreground">Estimate</span>
                     <Input
                        value={estimatedHours}
                        onChange={(event) => setEstimatedHours(event.target.value)}
                        onBlur={persistEstimatedHours}
                        onKeyDown={(event) => {
                           if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
                              event.preventDefault();
                              persistEstimatedHours();
                           }

                           if (event.key === 'Escape') {
                              event.preventDefault();
                              setEstimatedHours(
                                 presentationIssue.estimatedHours !== undefined
                                    ? String(presentationIssue.estimatedHours)
                                    : ''
                              );
                              event.currentTarget.blur();
                           }
                        }}
                        type="number"
                        min="0"
                        step="0.25"
                        inputMode="decimal"
                        className="h-7 w-20 border-none bg-transparent px-0 text-xs shadow-none focus-visible:ring-0"
                        placeholder="0"
                     />
                     <span className="text-xs text-muted-foreground">h</span>
                  </div>
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

            <div className="grid gap-4 md:grid-cols-2">
               <div className="rounded-xl border bg-card p-4 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                     <div>
                        <div className="text-sm font-medium">Parent</div>
                        <div className="text-xs text-muted-foreground">
                           Link this issue under a larger mission or feature.
                        </div>
                     </div>
                  </div>
                  {presentationIssue.parent ? (
                     <Button variant="secondary" size="sm" asChild className="justify-start">
                        <Link
                           to="/issues/$issueIdentifier"
                           params={{ issueIdentifier: presentationIssue.parent.identifier }}
                        >
                           <Link2 className="size-4" />
                           {presentationIssue.parent.identifier}
                        </Link>
                     </Button>
                  ) : (
                     <p className="text-sm text-muted-foreground">
                        This issue is currently top-level.
                     </p>
                  )}
                  {!canBecomeSubissue && (
                     <p className="text-xs text-muted-foreground">
                        This issue already has subissues, so it cannot be attached under another
                        parent.
                     </p>
                  )}
               </div>

               <div className="rounded-xl border bg-card p-4 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                     <div>
                        <div className="text-sm font-medium">Subissues</div>
                        <div className="text-xs text-muted-foreground">
                           Break this work into smaller issues without leaving the detail view.
                        </div>
                     </div>
                     <span className="text-xs text-muted-foreground">
                        {presentationIssue.subissues.length} total
                     </span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                     <Button
                        size="sm"
                        variant="secondary"
                        onClick={() =>
                           openModal(undefined, presentationIssue.project, {
                              id: presentationIssue.id,
                              identifier: presentationIssue.identifier,
                              title: presentationIssue.title,
                           })
                        }
                     >
                        <GitBranchPlus className="size-4" />
                        Add subissue
                     </Button>
                     <Popover open={attachOpen} onOpenChange={setAttachOpen}>
                        <PopoverTrigger asChild>
                           <Button size="sm" variant="outline">
                              Attach existing issue
                           </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[320px] p-0" align="start">
                           <Command>
                              <CommandInput placeholder="Attach existing issue..." />
                              <CommandList>
                                 <CommandEmpty>No eligible issues found.</CommandEmpty>
                                 <CommandGroup>
                                    {attachableIssues.map((issue) => (
                                       <CommandItem
                                          key={issue.id}
                                          value={`${issue.identifier} ${issue.title}`}
                                          onSelect={() => {
                                             updateIssueParent(issue.id, {
                                                id: presentationIssue.id,
                                                identifier: presentationIssue.identifier,
                                                title: presentationIssue.title,
                                             });
                                             toast.success(
                                                `${issue.identifier} attached as subissue`
                                             );
                                             setAttachOpen(false);
                                          }}
                                       >
                                          <div className="min-w-0">
                                             <div className="text-xs text-muted-foreground">
                                                {issue.identifier}
                                             </div>
                                             <div className="truncate">{issue.title}</div>
                                          </div>
                                       </CommandItem>
                                    ))}
                                 </CommandGroup>
                              </CommandList>
                           </Command>
                        </PopoverContent>
                     </Popover>
                  </div>

                  {presentationIssue.subissues.length > 0 ? (
                     <div className="space-y-2">
                        {presentationIssue.subissues.map((subissue) => (
                           <Button
                              key={subissue.id}
                              variant="ghost"
                              size="sm"
                              className="h-auto w-full justify-start rounded-lg border px-3 py-2"
                              asChild
                           >
                              <Link
                                 to="/issues/$issueIdentifier"
                                 params={{ issueIdentifier: subissue.identifier }}
                              >
                                 <div className="min-w-0 text-left">
                                    <div className="text-xs text-muted-foreground">
                                       {subissue.identifier}
                                    </div>
                                    <div className="truncate text-sm font-medium">
                                       {subissue.title}
                                    </div>
                                 </div>
                              </Link>
                           </Button>
                        ))}
                     </div>
                  ) : (
                     <p className="text-sm text-muted-foreground">
                        No subissues yet. Add one or attach an existing issue.
                     </p>
                  )}
               </div>
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
