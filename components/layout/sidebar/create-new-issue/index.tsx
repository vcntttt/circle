import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Popover, PopoverAnchor } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { IssueListItem } from '@/lib/db/issues';
import { currentUser } from '@/lib/current-user';
import { LexoRank } from '@/lib/utils';
import { toPresentationIssue } from '@/lib/issues-presentation';
import { Switch } from '@/components/ui/switch';
import { RiEditLine } from '@remixicon/react';
import {
   useState,
   useEffect,
   useCallback,
   useMemo,
   useRef,
   type ClipboardEvent,
   type FormEvent,
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

   const Icon = segment.type === 'project' ? segment.project.icon : undefined;
   const accentColor = segment.type === 'project' ? undefined : segment.label.color;

   return (
      <Badge
         key={`${segment.type}-${segment.value}-${index}`}
         variant="secondary"
         className="mx-0.5 inline-flex h-9 max-w-[14rem] shrink-0 items-center gap-1.5 rounded-full border border-border/70 bg-background/85 px-3 text-xl font-medium text-foreground shadow-sm backdrop-blur-sm overflow-hidden"
      >
         {segment.type === 'project' ? (
            Icon ? (
               <Icon className="size-4 shrink-0" />
            ) : (
               <span className="size-2.5 rounded-full bg-foreground/60" />
            )
         ) : (
            <span
               className="size-2.5 shrink-0 rounded-full"
               style={{ backgroundColor: accentColor }}
               aria-hidden="true"
            />
         )}
         <span className="min-w-0 truncate">{segment.value}</span>
      </Badge>
   );
}

function getEditorSelectionOffset(root: HTMLElement): number {
   const selection = window.getSelection();

   if (!selection || selection.rangeCount === 0) {
      return root.textContent?.length ?? 0;
   }

   const range = selection.getRangeAt(0);

   if (!root.contains(range.startContainer)) {
      return root.textContent?.length ?? 0;
   }

   const currentRange = range.cloneRange();
   currentRange.selectNodeContents(root);
   currentRange.setEnd(range.startContainer, range.startOffset);
   return currentRange.toString().length;
}

function setEditorSelectionOffset(root: HTMLElement, offset: number) {
   const selection = window.getSelection();

   if (!selection) {
      return;
   }

   const boundedOffset = Math.max(0, Math.min(offset, root.textContent?.length ?? 0));
   const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
   let currentNode = walker.nextNode();
   let currentOffset = boundedOffset;

   while (currentNode) {
      const nodeLength = currentNode.textContent?.length ?? 0;

      if (currentOffset <= nodeLength) {
         const range = document.createRange();
         range.setStart(currentNode, currentOffset);
         range.collapse(true);
         selection.removeAllRanges();
         selection.addRange(range);
         return;
      }

      currentOffset -= nodeLength;
      currentNode = walker.nextNode();
   }

   const range = document.createRange();
   range.selectNodeContents(root);
   range.collapse(false);
   selection.removeAllRanges();
   selection.addRange(range);
}

export function CreateNewIssue() {
   const [createMore, setCreateMore] = useState<boolean>(false);
   const [projectSelectorOpen, setProjectSelectorOpen] = useState(false);
   const [labelSelectorOpen, setLabelSelectorOpen] = useState(false);
   const [titleFocused, setTitleFocused] = useState(false);
   const [titleCaretPosition, setTitleCaretPosition] = useState(0);
   const [pendingCaretPosition, setPendingCaretPosition] = useState<number | null>(null);
   const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(0);
   const titleEditorRef = useRef<HTMLDivElement | null>(null);
   const { isOpen, defaultStatus, defaultProject, openModal, closeModal } = useCreateIssueStore();
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
         createdAt: new Date().toISOString(),
         cycleId: '',
         project: defaultProject ?? undefined,
         subissues: [],
         rank: latestRank
            ? LexoRank.from(latestRank).increment().toString()
            : new LexoRank('a3c').toString(),
      };
   }, [defaultProject, defaultStatus, getAllIssues]);

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

      const editor = titleEditorRef.current;
      if (editor) {
         editor.focus();
         setEditorSelectionOffset(editor, pendingCaretPosition);
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

      const editor = titleEditorRef.current;

      if (!editor) {
         return;
      }

      const frame = window.requestAnimationFrame(() => {
         editor.focus();
         setEditorSelectionOffset(editor, addIssueForm.title.length);
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

   const syncTitleSelection = () => {
      const editor = titleEditorRef.current;

      if (!editor) {
         return;
      }

      setTitleCaretPosition(getEditorSelectionOffset(editor));
   };

   const handleTitleInput = (event: FormEvent<HTMLDivElement>) => {
      const selectionOffset = getEditorSelectionOffset(event.currentTarget);
      const value = event.currentTarget.textContent?.replace(/\n/g, ' ') ?? '';
      handleTitleCaretChange(value, selectionOffset);
      setPendingCaretPosition(selectionOffset);
   };

   const handleTitlePaste = (event: ClipboardEvent<HTMLDivElement>) => {
      event.preventDefault();
      const text = event.clipboardData.getData('text/plain').replace(/\s+/g, ' ');
      document.execCommand('insertText', false, text);
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

   const handleTitleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
      if (event.key === 'Enter') {
         event.preventDefault();
      }

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

   const createIssue = async () => {
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
         const createdIssue = await createIssueMutation({
            data: {
               title: finalTitle,
               description: addIssueForm.description,
               status: addIssueForm.status.id,
               priority: addIssueForm.priority.id,
               assigneeId: addIssueForm.assignee?.id ?? null,
               rank: addIssueForm.rank,
               dueDate: addIssueForm.dueDate ?? null,
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
      }
   };

   return (
      <Dialog open={isOpen} onOpenChange={(value) => (value ? openModal() : closeModal())}>
         <DialogTrigger asChild>
            <Button className="size-8 shrink-0" variant="secondary" size="icon">
               <RiEditLine />
            </Button>
         </DialogTrigger>
         <DialogContent className="w-full sm:max-w-[750px] p-0 shadow-xl top-[30%]">
            <div className="px-4 pt-4 pb-0 space-y-3 w-full">
               <Popover open={Boolean(inlineSuggestion)}>
                  <PopoverAnchor asChild>
                     <div className="relative w-full">
                        {addIssueForm.title.length === 0 && (
                           <span
                              aria-hidden="true"
                              className="pointer-events-none absolute left-0 top-1 text-2xl font-medium leading-tight text-muted-foreground"
                           >
                              Issue title
                           </span>
                        )}
                        <div
                           ref={titleEditorRef}
                           role="textbox"
                           contentEditable
                           suppressContentEditableWarning
                           aria-label="Issue title"
                           className="relative z-10 min-h-10 w-full bg-transparent py-1 text-2xl font-medium leading-tight text-foreground outline-none focus-visible:ring-0 whitespace-pre-wrap break-words"
                           onInput={handleTitleInput}
                           onPaste={handleTitlePaste}
                           onClick={syncTitleSelection}
                           onKeyUp={syncTitleSelection}
                           onMouseUp={syncTitleSelection}
                           onFocus={() => setTitleFocused(true)}
                           onBlur={() => setTitleFocused(false)}
                           onKeyDown={handleTitleKeyDown}
                        >
                           {titlePreviewSegments.map(renderTitlePreviewSegment)}
                        </div>
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
