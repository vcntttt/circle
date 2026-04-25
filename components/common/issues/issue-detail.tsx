'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { format } from 'date-fns';
import { Archive, ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { LabelSelector } from './label-selector';
import { PrioritySelector } from './priority-selector';
import { StatusSelector } from './status-selector';
import { AssigneeUser } from './assignee-user';
import { useIssuesStore } from '@/store/issues-store';
import { toast } from 'sonner';
import type { Issue } from '@/lib/models';
import { ProjectSelector } from '@/components/layout/sidebar/create-new-issue/project-selector';
import { ParentIssueSelector } from './parent-issue-selector';
import { createIssue as createIssueMutation } from '@/src/server/issues';
import { cn, getNextLexoRank } from '@/lib/utils';
import { priorities, status as statusOptions } from '@/lib/ui-catalog';
import { toPresentationIssue } from '@/lib/issues-presentation';
import type { IssueListItem } from '@/lib/db/issues';
import { IssueChip, issueChipClassName } from './issue-chip';
import { currentUser } from '@/lib/current-user';

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
      getAllIssues,
      addIssue,
      updateIssueContent,
      deleteIssue,
      archiveIssue,
      updateIssueProject,
      updateIssueParent,
   } = useIssuesStore();
   const presentationIssue = useMemo(
      () => getIssueById(issueId) ?? initialIssue ?? null,
      [getIssueById, issueId, initialIssue]
   );
   const [title, setTitle] = useState(presentationIssue?.title ?? '');
   const [description, setDescription] = useState(presentationIssue?.description ?? '');
   const [subissueComposerOpen, setSubissueComposerOpen] = useState(false);
   const [newSubissueTitle, setNewSubissueTitle] = useState('');
   const [newSubissueDescription, setNewSubissueDescription] = useState('');
   const [creatingSubissue, setCreatingSubissue] = useState(false);
   const newSubissueTitleRef = useRef<HTMLInputElement | null>(null);

   useEffect(() => {
      setTitle(presentationIssue?.title ?? '');
      setDescription(presentationIssue?.description ?? '');
   }, [presentationIssue?.title, presentationIssue?.description]);

   useEffect(() => {
      if (!presentationIssue) return;
      if (getIssueById(issueId)) return;
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

   const canBecomeSubissue = presentationIssue.subissues.length === 0;

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

   const handleCreateSubissue = async () => {
      const finalTitle = newSubissueTitle.trim();

      if (!finalTitle) {
         toast.error('Subissue title is required');
         return;
      }

      setCreatingSubissue(true);

      try {
         const createdIssue = await createIssueMutation({
            data: {
               title: finalTitle,
               description: newSubissueDescription.trim() || undefined,
               status: statusOptions.find((item) => item.id === 'to-do')?.id ?? statusOptions[0].id,
               priority:
                  priorities.find((item) => item.id === 'no-priority')?.id ?? priorities[0].id,
               assigneeId: currentUser.id,
               rank: getNextLexoRank(getAllIssues().map((issue) => issue.rank)),
               parentIssueId: presentationIssue.id,
               projectName: presentationIssue.project?.name ?? null,
            },
         });

         addIssue(toPresentationIssue(createdIssue as IssueListItem));
         setNewSubissueTitle('');
         setNewSubissueDescription('');
         setSubissueComposerOpen(true);
         requestAnimationFrame(() => {
            newSubissueTitleRef.current?.focus();
         });
         toast.success('Subissue created');
      } catch (error) {
         console.error('Failed to create subissue.', error);
         toast.error('Subissue could not be created');
      } finally {
         setCreatingSubissue(false);
      }
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
               <span className="text-xs text-muted-foreground hidden sm:inline-block">
                  Created {format(new Date(presentationIssue.createdAt), 'MMM dd, yyyy')}
               </span>
            </div>

            <div className="flex items-center gap-2">
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
                     display="chip"
                  />
                  <StatusSelector
                     status={presentationIssue.status}
                     issueId={presentationIssue.id}
                     display="chip"
                  />
                  <AssigneeUser user={presentationIssue.assignee} issueId={presentationIssue.id} />
                  <ProjectSelector
                     project={presentationIssue.project}
                     onChange={(project) => updateIssueProject(presentationIssue.id, project)}
                     showShortcut={false}
                     triggerClassName={issueChipClassName}
                  />
                  <LabelSelector issueId={presentationIssue.id} />
                  {presentationIssue.dueDate && (
                     <IssueChip>
                        Due {format(new Date(presentationIssue.dueDate), 'MMM dd')}
                     </IssueChip>
                  )}
                  {presentationIssue.parent ? (
                     <ParentIssueSelector
                        issueId={presentationIssue.id}
                        parent={presentationIssue.parent}
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
                        compact
                     />
                  ) : (
                     <ParentIssueSelector
                        issueId={presentationIssue.id}
                        parent={null}
                        onChange={(parent) => {
                           if (!canBecomeSubissue && parent) {
                              toast.error('Issues with subissues cannot become subissues');
                              return;
                           }

                           updateIssueParent(presentationIssue.id, parent);
                           if (parent) {
                              toast.success(`Parent set to ${parent.identifier}`);
                           }
                        }}
                        compact
                        emptyLabel="Add parent"
                     />
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
                  rows={7}
                  className="min-h-[156px] resize-none rounded-lg border bg-card px-4 py-4 text-sm leading-relaxed"
               />
            </div>

            <section className="border-t border-border/60 pt-5">
               <div className="space-y-3">
                  {presentationIssue.subissues.map((subissue) => {
                     const childIssue = getIssueById(subissue.id);
                     const subissueStatus = childIssue?.status ?? subissue.status;
                     const subissuePriority = childIssue?.priority ?? subissue.priority;
                     const subissueDescription = childIssue?.description.trim();
                     const hasSubissueDescription = Boolean(subissueDescription);

                     return (
                        <div
                           key={subissue.id}
                           className={cn(
                              'flex gap-2 rounded-lg border border-border/70 bg-card/30 px-2.5 py-2',
                              hasSubissueDescription ? 'items-start' : 'items-center'
                           )}
                        >
                           <div
                              className={cn(
                                 'flex items-center gap-0.5',
                                 hasSubissueDescription && 'pt-0.5'
                              )}
                              onMouseDownCapture={(event) => event.stopPropagation()}
                           >
                              <PrioritySelector priority={subissuePriority} issueId={subissue.id} />
                              <StatusSelector status={subissueStatus} issueId={subissue.id} />
                           </div>
                           <Link
                              to="/issues/$issueIdentifier"
                              params={{ issueIdentifier: subissue.identifier }}
                              className={cn(
                                 'min-w-0 flex-1',
                                 hasSubissueDescription && 'space-y-0.5'
                              )}
                           >
                              <div className="text-sm font-medium leading-5 text-foreground">
                                 {subissue.title}
                              </div>
                              {subissueDescription && (
                                 <p className="line-clamp-2 text-xs text-muted-foreground">
                                    {subissueDescription}
                                 </p>
                              )}
                           </Link>
                        </div>
                     );
                  })}

                  {subissueComposerOpen ? (
                     <div className="rounded-xl border bg-card">
                        <div className="px-4 pt-3">
                           <div className="flex items-start gap-3">
                              <div className="pt-2">
                                 <div className="size-4 rounded-full border border-muted-foreground/50" />
                              </div>
                              <div className="flex-1 space-y-3">
                                 <Input
                                    ref={newSubissueTitleRef}
                                    value={newSubissueTitle}
                                    onChange={(event) => setNewSubissueTitle(event.target.value)}
                                    onKeyDown={(event) => {
                                       if (event.key === 'Enter') {
                                          event.preventDefault();
                                          void handleCreateSubissue();
                                       }
                                    }}
                                    placeholder="Issue title"
                                    className="h-auto border-none bg-transparent px-0 py-0 text-base font-medium shadow-none focus-visible:ring-0"
                                 />
                                 <Textarea
                                    value={newSubissueDescription}
                                    onChange={(event) =>
                                       setNewSubissueDescription(event.target.value)
                                    }
                                    onKeyDown={(event) => {
                                       if (
                                          (event.metaKey || event.ctrlKey) &&
                                          event.key === 'Enter'
                                       ) {
                                          event.preventDefault();
                                          void handleCreateSubissue();
                                       }
                                    }}
                                    placeholder="Add description..."
                                    rows={2}
                                    className="min-h-0 resize-none border-none bg-transparent px-0 py-0 text-sm shadow-none focus-visible:ring-0"
                                 />
                              </div>
                           </div>
                        </div>
                        <div className="flex items-center justify-end gap-2 border-t px-4 py-2.5">
                           <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                 setSubissueComposerOpen(false);
                                 setNewSubissueTitle('');
                                 setNewSubissueDescription('');
                              }}
                           >
                              Cancel
                           </Button>
                           <Button
                              size="sm"
                              onClick={() => {
                                 void handleCreateSubissue();
                              }}
                              disabled={creatingSubissue}
                           >
                              Create
                           </Button>
                        </div>
                     </div>
                  ) : (
                     <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-0 text-muted-foreground hover:text-foreground"
                        onClick={() => setSubissueComposerOpen(true)}
                     >
                        <Plus className="size-4" />
                        Add sub-issues
                     </Button>
                  )}
               </div>
            </section>
         </div>
      </div>
   );
}
