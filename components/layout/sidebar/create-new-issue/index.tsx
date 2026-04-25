import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverAnchor } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { IssueListItem } from '@/lib/db/issues';
import { currentUser } from '@/lib/current-user';
import { LexoRank } from '@/lib/utils';
import { toPresentationIssue } from '@/lib/issues-presentation';
import { Switch } from '@/components/ui/switch';
import { GitBranchPlus } from 'lucide-react';
import {
   useState,
   useEffect,
   useCallback,
   useMemo,
   useRef,
   type KeyboardEvent,
   type ReactNode,
} from 'react';
import { priorities, status, type Issue } from '@/lib/ui-catalog';
import { useIssuesStore } from '@/store/issues-store';
import { useCreateIssueStore } from '@/store/create-issue-store';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import { createIssue as createIssueMutation } from '@/src/server/issues';
import { useProjectOptions } from '@/hooks/use-project-options';
import { useLabelOptions } from '@/hooks/use-label-options';
import { normalizeInlineToken, parseIssueInlineTokens } from '@/lib/issue-inline-tokens';
import {
   applyInlineTokenSuggestion,
   getInlineTokenSuggestionContext,
} from '@/lib/issue-inline-suggestions';
import type { LabelInterface } from '@/lib/models';
import type { Project } from '@/lib/projects-presentation';
import { StatusSelector } from './status-selector';
import { PrioritySelector } from './priority-selector';
import { AssigneeSelector } from './assignee-selector';
import { ProjectSelector } from './project-selector';
import { LabelSelector } from './label-selector';
import { EstimatedHoursSelector } from './estimated-hours-selector';
import { InlineTokenSuggestions } from './inline-token-suggestions';

type TitlePreviewSegment =
   | {
        type: 'text';
        value: string;
     }
   | {
        type: 'project';
        value: string;
        project: Project;
     }
   | {
        type: 'label';
        value: string;
        label: LabelInterface;
     };

const trailingTokenPunctuation = /[.,;:!?]+$/;

function buildTitlePreviewSegments(
   title: string,
   projects: Project[],
   labels: LabelInterface[]
): TitlePreviewSegment[] {
   if (!title.trim()) {
      return [];
   }

   const projectLookup = new Map(
      projects.map((project) => [normalizeInlineToken(project.name), project])
   );
   const labelLookup = new Map(labels.map((label) => [normalizeInlineToken(label.name), label]));

   return title.split(/(\s+)/).flatMap((chunk) => {
      if (!chunk) {
         return [];
      }

      if (/^\s+$/.test(chunk)) {
         return [{ type: 'text', value: chunk } satisfies TitlePreviewSegment];
      }

      const cleanChunk = chunk.replace(trailingTokenPunctuation, '');
      const suffix = chunk.slice(cleanChunk.length);
      const prefix = cleanChunk[0];
      const token = cleanChunk.slice(1);

      if ((prefix === '@' || prefix === '#') && token) {
         const normalizedToken = normalizeInlineToken(token);
         const matchedItem =
            prefix === '@' ? projectLookup.get(normalizedToken) : labelLookup.get(normalizedToken);

         if (matchedItem) {
            const displayToken = normalizeInlineToken(matchedItem.name);

            return [
               prefix === '@'
                  ? ({
                       type: 'project',
                       value: `@${displayToken}`,
                       project: matchedItem,
                    } satisfies TitlePreviewSegment)
                  : ({
                       type: 'label',
                       value: `#${displayToken}`,
                       label: matchedItem,
                    } satisfies TitlePreviewSegment),
               ...(suffix ? [{ type: 'text', value: suffix } satisfies TitlePreviewSegment] : []),
            ];
         }
      }

      return [{ type: 'text', value: chunk } satisfies TitlePreviewSegment];
   });
}

function renderTitlePreviewSegment(segment: TitlePreviewSegment, index: number): ReactNode {
   if (segment.type === 'text') {
      return <span key={`text-${index}`}>{segment.value}</span>;
   }

   const accentColor =
      segment.type === 'project'
         ? 'color-mix(in oklab, var(--secondary) 88%, transparent)'
         : `color-mix(in srgb, ${segment.label.color} 24%, transparent)`;
   const borderColor =
      segment.type === 'project'
         ? 'color-mix(in oklab, var(--border) 85%, transparent)'
         : `color-mix(in srgb, ${segment.label.color} 58%, var(--border))`;

   return (
      <span
         key={`${segment.type}-${segment.value}-${index}`}
         className="rounded-[0.65em] text-foreground"
         style={{
            backgroundColor: accentColor,
            boxShadow: `inset 0 0 0 1px ${borderColor}`,
            boxDecorationBreak: 'clone',
            WebkitBoxDecorationBreak: 'clone',
         }}
      >
         {segment.value}
      </span>
   );
}

export function CreateNewIssue() {
   const [createMore, setCreateMore] = useState<boolean>(false);
   const [isCreating, setIsCreating] = useState(false);
   const [projectSelectorOpen, setProjectSelectorOpen] = useState(false);
   const [labelSelectorOpen, setLabelSelectorOpen] = useState(false);
   const [titleFocused, setTitleFocused] = useState(false);
   const [titleCaretPosition, setTitleCaretPosition] = useState(0);
   const [pendingCaretPosition, setPendingCaretPosition] = useState<number | null>(null);
   const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(0);
   const titleInputRef = useRef<HTMLInputElement | null>(null);
   const { isOpen, defaultStatus, defaultProject, defaultParentIssue, openModal, closeModal } =
      useCreateIssueStore();
   const { addIssue, getAllIssues } = useIssuesStore();
   const projectOptions = useProjectOptions();
   const labelOptions = useLabelOptions();

   const createDefaultData = useCallback(() => {
      const currentIssues = getAllIssues();
      const latestRank = currentIssues
         .map((issue) => issue.rank)
         .sort((a, b) => a.localeCompare(b))
         .at(-1);

      return {
         id: uuidv4(),
         identifier: '',
         title: '',
         description: '',
         status: defaultStatus || status.find((s) => s.id === 'to-do')!,
         assignee: currentUser,
         priority: priorities.find((p) => p.id === 'no-priority')!,
         labels: [],
         estimatedHours: undefined,
         createdAt: new Date().toISOString(),
         cycleId: '',
         project: defaultProject ?? undefined,
         parentIssueId: defaultParentIssue?.id ?? null,
         parent: defaultParentIssue ?? null,
         subissues: [],
         rank: latestRank
            ? LexoRank.from(latestRank).increment().toString()
            : new LexoRank('a3c').toString(),
      };
   }, [defaultParentIssue, defaultProject, defaultStatus, getAllIssues]);

   const [addIssueForm, setAddIssueForm] = useState<Issue>(createDefaultData());

   useEffect(() => {
      setAddIssueForm(createDefaultData());
   }, [createDefaultData]);

   const inlineDraft = useMemo(
      () => parseIssueInlineTokens(addIssueForm.title, projectOptions, labelOptions),
      [addIssueForm.title, projectOptions, labelOptions]
   );

   const inlineSuggestion = useMemo(
      () =>
         titleFocused
            ? getInlineTokenSuggestionContext(
                 addIssueForm.title,
                 titleCaretPosition,
                 projectOptions,
                 labelOptions
              )
            : null,
      [addIssueForm.title, labelOptions, projectOptions, titleCaretPosition, titleFocused]
   );

   const titlePreviewSegments = useMemo(
      () => buildTitlePreviewSegments(addIssueForm.title, projectOptions, labelOptions),
      [addIssueForm.title, labelOptions, projectOptions]
   );

   useEffect(() => {
      setActiveSuggestionIndex(0);
   }, [inlineSuggestion?.kind, inlineSuggestion?.query, inlineSuggestion?.tokenStart]);

   useEffect(() => {
      if (pendingCaretPosition === null) {
         return;
      }

      const input = titleInputRef.current;
      if (input) {
         input.focus();
         input.setSelectionRange(pendingCaretPosition, pendingCaretPosition);
      }

      setTitleCaretPosition(pendingCaretPosition);
      setPendingCaretPosition(null);
   }, [pendingCaretPosition]);

   useEffect(() => {
      if (!isOpen) {
         setProjectSelectorOpen(false);
         setLabelSelectorOpen(false);
         setTitleFocused(false);
         setPendingCaretPosition(null);
         setActiveSuggestionIndex(0);
      }
   }, [isOpen]);

   useEffect(() => {
      if (!isOpen || pendingCaretPosition !== null) {
         return;
      }

      const input = titleInputRef.current;
      if (!input) {
         return;
      }

      const frame = window.requestAnimationFrame(() => {
         input.focus();
         input.setSelectionRange(addIssueForm.title.length, addIssueForm.title.length);
      });

      return () => window.cancelAnimationFrame(frame);
   }, [isOpen, pendingCaretPosition]);

   useEffect(() => {
      if (!isOpen) {
         return;
      }

      const handleKeyDown = (event: KeyboardEvent) => {
         if (event.defaultPrevented || event.repeat) {
            return;
         }

         if (event.metaKey || event.ctrlKey || !event.altKey || event.shiftKey) {
            return;
         }

         const key = event.key.toLowerCase();

         if (key === 'p') {
            event.preventDefault();
            setLabelSelectorOpen(false);
            setProjectSelectorOpen(true);
            return;
         }

         if (key === 'l') {
            event.preventDefault();
            setProjectSelectorOpen(false);
            setLabelSelectorOpen(true);
         }
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
   }, [isOpen]);

   const handleTitleCaretChange = (value: string, selectionStart?: number | null) => {
      setAddIssueForm((current) => ({ ...current, title: value }));
      setTitleCaretPosition(selectionStart ?? value.length);
   };

   const handleInlineSuggestionSelect = (index: number) => {
      const suggestion = inlineSuggestion;

      if (!suggestion) {
         return;
      }

      const item = suggestion.items[index];
      if (!item) {
         return;
      }

      const next = applyInlineTokenSuggestion(
         addIssueForm.title,
         suggestion.tokenStart,
         suggestion.tokenEnd,
         item
      );

      setAddIssueForm((current) => ({ ...current, title: next.title }));
      setPendingCaretPosition(next.cursor);
      setTitleFocused(true);
      setActiveSuggestionIndex(0);
   };

   const handleTitleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
      if (!inlineSuggestion || inlineSuggestion.items.length === 0) {
         return;
      }

      if (event.key === 'ArrowDown') {
         event.preventDefault();
         setActiveSuggestionIndex((current) => (current + 1) % inlineSuggestion.items.length);
         return;
      }

      if (event.key === 'ArrowUp') {
         event.preventDefault();
         setActiveSuggestionIndex(
            (current) =>
               (current - 1 + inlineSuggestion.items.length) % inlineSuggestion.items.length
         );
         return;
      }

      if (event.key === 'Enter' || event.key === 'Tab') {
         event.preventDefault();
         handleInlineSuggestionSelect(activeSuggestionIndex);
         return;
      }

      if (event.key === 'Escape') {
         event.preventDefault();
         setTitleFocused(false);
      }
   };

   const createIssue = useCallback(async () => {
      if (isCreating) {
         return;
      }

      const finalTitle = inlineDraft.title || addIssueForm.title.trim();
      const finalProject = inlineDraft.project ?? addIssueForm.project;
      const finalLabels = [...addIssueForm.labels, ...inlineDraft.labels].filter(
         (label, index, currentLabels) =>
            currentLabels.findIndex((item) => item.id === label.id) === index
      );

      if (!finalTitle) {
         toast.error('Title is required');
         return;
      }

      try {
         setIsCreating(true);
         const createdIssue = await createIssueMutation({
            data: {
               title: finalTitle,
               description: addIssueForm.description,
               status: addIssueForm.status.id,
               priority: addIssueForm.priority.id,
               assigneeId: addIssueForm.assignee?.id ?? null,
               estimatedHours: addIssueForm.estimatedHours ?? null,
               rank: addIssueForm.rank,
               dueDate: addIssueForm.dueDate ?? null,
               parentIssueId: addIssueForm.parent?.id ?? null,
               projectName: finalProject?.name ?? null,
               // Keep the server contract aligned with project-by-name creation.
               labelNames: finalLabels.map((label) => label.name),
            },
         });

         addIssue(toPresentationIssue(createdIssue as IssueListItem));
         toast.success('Issue created');

         if (!createMore) {
            closeModal();
         }

         setAddIssueForm(createDefaultData());
         setProjectSelectorOpen(false);
         setLabelSelectorOpen(false);
      } catch (error) {
         console.error('Failed to create issue.', error);
         toast.error('Issue could not be created');
      } finally {
         setIsCreating(false);
      }
   }, [addIssue, addIssueForm, closeModal, createDefaultData, createMore, inlineDraft, isCreating]);

   useEffect(() => {
      if (!isOpen) {
         return;
      }

      const handleSubmitShortcut = (event: globalThis.KeyboardEvent) => {
         if (event.defaultPrevented || event.repeat) {
            return;
         }

         if (!(event.metaKey || event.ctrlKey) || event.altKey || event.shiftKey) {
            return;
         }

         if (event.key !== 'Enter') {
            return;
         }

         event.preventDefault();
         void createIssue();
      };

      window.addEventListener('keydown', handleSubmitShortcut);
      return () => window.removeEventListener('keydown', handleSubmitShortcut);
   }, [createIssue, isOpen]);

   return (
      <Dialog open={isOpen} onOpenChange={(value) => (value ? openModal() : closeModal())}>
         <DialogContent className="w-full sm:max-w-[750px] p-0 shadow-xl top-[30%]">
            <div className="px-4 pt-4 pb-0 space-y-3 w-full">
               <Popover open={Boolean(inlineSuggestion)}>
                  <PopoverAnchor asChild>
                     <div className="relative w-full">
                        <div
                           aria-hidden="true"
                           className="pointer-events-none absolute inset-0 flex items-center overflow-hidden px-0 py-1 text-2xl font-medium leading-tight"
                        >
                           {titlePreviewSegments.length > 0 ? (
                              <div className="whitespace-pre-wrap break-words text-foreground">
                                 {titlePreviewSegments.map(renderTitlePreviewSegment)}
                              </div>
                           ) : (
                              <span className="text-muted-foreground">Issue title</span>
                           )}
                        </div>
                        <Input
                           ref={titleInputRef}
                           className="relative z-10 w-full border-none bg-transparent px-0 py-1 text-2xl md:text-2xl font-medium leading-tight text-transparent shadow-none outline-none caret-foreground placeholder:text-transparent focus-visible:ring-0 overflow-hidden text-ellipsis whitespace-normal break-words"
                           placeholder="Issue title"
                           value={addIssueForm.title}
                           onChange={(event) =>
                              handleTitleCaretChange(
                                 event.target.value,
                                 event.currentTarget.selectionStart
                              )
                           }
                           onClick={(event) =>
                              setTitleCaretPosition(event.currentTarget.selectionStart ?? 0)
                           }
                           onKeyUp={(event) =>
                              setTitleCaretPosition(event.currentTarget.selectionStart ?? 0)
                           }
                           onSelect={(event) =>
                              setTitleCaretPosition(event.currentTarget.selectionStart ?? 0)
                           }
                           onFocus={() => setTitleFocused(true)}
                           onBlur={() => setTitleFocused(false)}
                           onKeyDown={handleTitleKeyDown}
                        />
                     </div>
                  </PopoverAnchor>
                  <InlineTokenSuggestions
                     suggestion={inlineSuggestion}
                     activeIndex={activeSuggestionIndex}
                     onSelect={(suggestion) => {
                        const index = inlineSuggestion?.items.findIndex(
                           (item) => item.kind === suggestion.kind && item.id === suggestion.id
                        );

                        if (index !== undefined && index >= 0) {
                           handleInlineSuggestionSelect(index);
                        }
                     }}
                  />
               </Popover>

               <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  {addIssueForm.parent && (
                     <Badge variant="outline" className="gap-1 rounded-full px-2 py-0.5">
                        <GitBranchPlus className="size-3" />
                        Sub-issue of {addIssueForm.parent.identifier}
                     </Badge>
                  )}
                  <span>Inline tokens:</span>
                  <Badge variant="outline" className="rounded-full px-2 py-0.5">
                     @project
                  </Badge>
                  <Badge variant="outline" className="rounded-full px-2 py-0.5">
                     #tag
                  </Badge>
                  <span>Press space after the token to keep typing.</span>
               </div>

               <Textarea
                  className="border-none w-full shadow-none outline-none resize-none px-0 min-h-16 focus-visible:ring-0 break-words whitespace-normal overflow-wrap"
                  placeholder="Add description..."
                  value={addIssueForm.description}
                  onChange={(e) =>
                     setAddIssueForm({ ...addIssueForm, description: e.target.value })
                  }
               />

               <div className="w-full flex items-center justify-start gap-1.5 flex-wrap">
                  <ProjectSelector
                     project={addIssueForm.project}
                     onChange={(newProject) =>
                        setAddIssueForm({ ...addIssueForm, project: newProject })
                     }
                     open={projectSelectorOpen}
                     onOpenChange={setProjectSelectorOpen}
                  />
                  <LabelSelector
                     selectedLabels={addIssueForm.labels}
                     onChange={(newLabels) =>
                        setAddIssueForm({ ...addIssueForm, labels: newLabels })
                     }
                     open={labelSelectorOpen}
                     onOpenChange={setLabelSelectorOpen}
                  />
                  <StatusSelector
                     status={addIssueForm.status}
                     onChange={(newStatus) =>
                        setAddIssueForm({ ...addIssueForm, status: newStatus })
                     }
                  />
                  <PrioritySelector
                     priority={addIssueForm.priority}
                     onChange={(newPriority) =>
                        setAddIssueForm({ ...addIssueForm, priority: newPriority })
                     }
                  />
                  <AssigneeSelector
                     assignee={addIssueForm.assignee}
                     onChange={(newAssignee) =>
                        setAddIssueForm({ ...addIssueForm, assignee: newAssignee })
                     }
                  />
                  <EstimatedHoursSelector
                     estimatedHours={addIssueForm.estimatedHours}
                     onChange={(estimatedHours) =>
                        setAddIssueForm({ ...addIssueForm, estimatedHours })
                     }
                  />
               </div>
            </div>
            <div className="flex items-center justify-between py-2.5 px-4 w-full border-t">
               <div className="flex items-center gap-2">
                  <div className="flex items-center space-x-2">
                     <Switch
                        id="create-more"
                        checked={createMore}
                        onCheckedChange={setCreateMore}
                     />
                     <Label htmlFor="create-more">Create more</Label>
                  </div>
               </div>
               <Button
                  size="sm"
                  disabled={isCreating}
                  onClick={() => {
                     void createIssue();
                  }}
               >
                  Create issue
               </Button>
            </div>
         </DialogContent>
      </Dialog>
   );
}
