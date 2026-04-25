import type { Issue, LabelInterface, Priority, Project, Status, User } from '@/lib/models';
import { archivedStatus, status } from '@/lib/ui-catalog';
import { create } from 'zustand';
import { deleteIssue as deleteIssueMutation, updateIssue } from '@/src/server/issues';

const createEmptyIssuesByStatus = () =>
   status.reduce<Record<string, Issue[]>>((acc, statusItem) => {
      acc[statusItem.id] = [];
      return acc;
   }, {});

const isArchivedIssue = (issue: Issue) => issue.status.id === archivedStatus.id;

const sortByRankDesc = (issues: Issue[]) =>
   [...issues].sort((a, b) => b.rank.localeCompare(a.rank));
const isDoneStatusId = (statusId: string) => statusId === 'completed' || statusId === 'archived';

const groupIssuesByStatus = (issues: Issue[]) => {
   const grouped = createEmptyIssuesByStatus();

   issues.forEach((issue) => {
      grouped[issue.status.id] = [...(grouped[issue.status.id] ?? []), issue];
   });

   for (const statusId of Object.keys(grouped)) {
      grouped[statusId] = sortByRankDesc(grouped[statusId] ?? []);
   }

   return grouped;
};

type IssueParentSummary = NonNullable<Issue['parent']>;

const persistIssuePatch = async (
   issueId: string,
   payload: {
      status?: string;
      priority?: string;
      assigneeId?: string | null;
      estimatedHours?: number | null;
      dueDate?: string | null;
      parentIssueId?: string | null;
      projectName?: string | null;
      labelNames?: string[];
   }
) => {
   const response = await updateIssue({ data: { issueId, ...payload } });

   if (!response) {
      throw new Error('Issue update request failed.');
   }
};

interface FilterOptions {
   status?: string[];
   assignee?: string[];
   priority?: string[];
   labels?: string[];
   project?: string[];
}

interface IssuesState {
   issues: Issue[];
   issuesByStatus: Record<string, Issue[]>;
   getAllIssues: () => Issue[];
   replaceIssues: (issues: Issue[]) => void;
   addIssue: (issue: Issue) => void;
   updateIssue: (id: string, updatedIssue: Partial<Issue>) => void;
   deleteIssue: (id: string) => void;
   archiveIssue: (id: string) => void;
   updateIssueContent: (
      issueId: string,
      content: { title?: string; description?: string; estimatedHours?: number | null }
   ) => void;
   // Filters
   filterByStatus: (statusId: string) => Issue[];
   filterByPriority: (priorityId: string) => Issue[];
   filterByAssignee: (userId: string | null) => Issue[];
   filterByLabel: (labelId: string) => Issue[];
   filterByProject: (projectId: string) => Issue[];
   searchIssues: (query: string) => Issue[];
   filterIssues: (filters: FilterOptions) => Issue[];
   updateIssueStatus: (issueId: string, newStatus: Status) => void;
   updateIssuePriority: (issueId: string, newPriority: Priority) => void;
   updateIssueAssignee: (issueId: string, newAssignee: User | null) => void;
   addIssueLabel: (issueId: string, label: LabelInterface) => void;
   removeIssueLabel: (issueId: string, labelId: string) => void;
   updateIssueProject: (issueId: string, newProject: Project | undefined) => void;
   updateIssueDueDate: (issueId: string, dueDate: string | undefined) => void;
   updateIssueEstimatedHours: (issueId: string, estimatedHours: number | undefined) => void;
   updateIssueParent: (issueId: string, parent: IssueParentSummary | null) => void;
   // Utility functions
   getIssueById: (id: string) => Issue | undefined;
   getRootIssues: () => Issue[];
   getSubissues: (parentIssueId: string) => Issue[];
   getIssueChildrenCount: (issueId: string) => number;
}

function rebuildIssueHierarchy(issues: Issue[]): Issue[] {
   const issueMap = new Map(
      issues.map((issue) => [
         issue.id,
         {
            ...issue,
            subissues: [],
         },
      ])
   );

   for (const issue of issueMap.values()) {
      if (!issue.parentIssueId) {
         continue;
      }

      const parent = issueMap.get(issue.parentIssueId);

      if (!parent) {
         issue.parentIssueId = null;
         issue.parent = null;
         continue;
      }

      issue.parent = {
         id: parent.id,
         identifier: parent.identifier,
         title: parent.title,
      };

      parent.subissues.push({
         id: issue.id,
         identifier: issue.identifier,
         title: issue.title,
         status: issue.status,
         priority: issue.priority,
         assignee: issue.assignee,
         parentIssueId: parent.id,
      });
   }

   const nextIssues = sortByRankDesc(Array.from(issueMap.values()));

   nextIssues.forEach((issue) => {
      issue.subissues = [...issue.subissues].sort((left, right) => {
         const leftIssue = issueMap.get(left.id);
         const rightIssue = issueMap.get(right.id);
         return (rightIssue?.rank ?? '').localeCompare(leftIssue?.rank ?? '');
      });
   });

   return nextIssues;
}

export const useIssuesStore = create<IssuesState>((set, get) => ({
   issues: [],
   issuesByStatus: createEmptyIssuesByStatus(),

   getAllIssues: () => get().issues,

   replaceIssues: (issues: Issue[]) => {
      const nextIssues = rebuildIssueHierarchy(issues);
      set({
         issues: nextIssues,
         issuesByStatus: groupIssuesByStatus(nextIssues),
      });
   },

   addIssue: (issue: Issue) => {
      set((state) => {
         const nextIssues = rebuildIssueHierarchy([...state.issues, issue]);
         return {
            issues: nextIssues,
            issuesByStatus: groupIssuesByStatus(nextIssues),
         };
      });
   },

   updateIssue: (id: string, updatedIssue: Partial<Issue>) => {
      set((state) => {
         const nextIssues = rebuildIssueHierarchy(
            state.issues.map((issue) => (issue.id === id ? { ...issue, ...updatedIssue } : issue))
         );

         return {
            issues: nextIssues,
            issuesByStatus: groupIssuesByStatus(nextIssues),
         };
      });
   },

   deleteIssue: (id: string) => {
      set((state) => {
         const nextIssues = rebuildIssueHierarchy(
            state.issues
               .filter((issue) => issue.id !== id)
               .map((issue) =>
                  issue.parentIssueId === id
                     ? { ...issue, parentIssueId: null, parent: null }
                     : issue
               )
         );

         return {
            issues: nextIssues,
            issuesByStatus: groupIssuesByStatus(nextIssues),
         };
      });

      void deleteIssueMutation({ data: { issueId: id } }).catch((error) => {
         console.error('Failed to delete issue.', error);
      });
   },

   archiveIssue: (id: string) => {
      get().updateIssue(id, { status: archivedStatus });
      void persistIssuePatch(id, { status: archivedStatus.id }).catch((error) => {
         console.error('Failed to archive issue.', error);
      });
   },

   updateIssueContent: (
      issueId: string,
      content: { title?: string; description?: string; estimatedHours?: number | null }
   ) => {
      get().updateIssue(issueId, content);
      void updateIssue({ data: { issueId, ...content } }).catch((error) => {
         console.error('Failed to persist issue content.', error);
      });
   },

   filterByStatus: (statusId: string) =>
      get().issues.filter((issue) => issue.status.id === statusId),

   filterByPriority: (priorityId: string) =>
      get().issues.filter((issue) => issue.priority.id === priorityId),

   filterByAssignee: (userId: string | null) => {
      if (userId === null) {
         return get().issues.filter((issue) => issue.assignee === null);
      }

      return get().issues.filter((issue) => issue.assignee?.id === userId);
   },

   filterByLabel: (labelId: string) =>
      get().issues.filter((issue) => issue.labels.some((label) => label.id === labelId)),

   filterByProject: (projectId: string) =>
      get().issues.filter((issue) => issue.project?.id === projectId),

   searchIssues: (query: string) => {
      const lowerCaseQuery = query.toLowerCase();
      return get().issues.filter(
         (issue) =>
            !isArchivedIssue(issue) &&
            (issue.title.toLowerCase().includes(lowerCaseQuery) ||
               issue.identifier.toLowerCase().includes(lowerCaseQuery))
      );
   },

   filterIssues: (filters: FilterOptions) => {
      let filteredIssues = get().issues.filter((issue) => !isArchivedIssue(issue));

      if (filters.status && filters.status.length > 0) {
         filteredIssues = filteredIssues.filter((issue) =>
            filters.status!.includes(issue.status.id)
         );
      }

      if (filters.assignee && filters.assignee.length > 0) {
         filteredIssues = filteredIssues.filter((issue) => {
            if (filters.assignee!.includes('unassigned') && issue.assignee === null) {
               return true;
            }

            return issue.assignee ? filters.assignee!.includes(issue.assignee.id) : false;
         });
      }

      if (filters.priority && filters.priority.length > 0) {
         filteredIssues = filteredIssues.filter((issue) =>
            filters.priority!.includes(issue.priority.id)
         );
      }

      if (filters.labels && filters.labels.length > 0) {
         filteredIssues = filteredIssues.filter((issue) =>
            issue.labels.some((label) => filters.labels!.includes(label.id))
         );
      }

      if (filters.project && filters.project.length > 0) {
         filteredIssues = filteredIssues.filter(
            (issue) => issue.project && filters.project!.includes(issue.project.id)
         );
      }

      return filteredIssues;
   },

   updateIssueStatus: (issueId: string, newStatus: Status) => {
      const currentIssues = get().issues;
      const targetIssue = currentIssues.find((issue) => issue.id === issueId);

      if (!targetIssue) {
         return;
      }

      const updates = new Map<string, Status>();
      updates.set(issueId, newStatus);

      if (!targetIssue.parentIssueId && newStatus.id === 'completed') {
         const children = currentIssues.filter((issue) => issue.parentIssueId === targetIssue.id);
         const pendingChildren = children.filter((child) => !isDoneStatusId(child.status.id));

         if (pendingChildren.length > 0) {
            const shouldCompleteChildren = window.confirm(
               `Completing ${targetIssue.identifier} will also complete ${pendingChildren.length} sub-issue${pendingChildren.length > 1 ? 's' : ''}. Continue?`
            );

            if (!shouldCompleteChildren) {
               return;
            }
         }

         const completedStatus = status.find((statusItem) => statusItem.id === 'completed');
         if (completedStatus) {
            children
               .filter((child) => !isDoneStatusId(child.status.id))
               .forEach((child) => {
                  updates.set(child.id, completedStatus);
               });
         }
      }

      if (
         targetIssue.parentIssueId &&
         (newStatus.id === 'in-progress' || newStatus.id === 'completed')
      ) {
         const parentIssue = currentIssues.find((issue) => issue.id === targetIssue.parentIssueId);
         const inProgressStatus = status.find((statusItem) => statusItem.id === 'in-progress');

         if (parentIssue && parentIssue.status.id === 'to-do' && inProgressStatus) {
            updates.set(parentIssue.id, inProgressStatus);
         }
      }

      const updatesToApply = Array.from(updates.entries()).filter(([id, nextStatus]) => {
         const issue = currentIssues.find((item) => item.id === id);
         return issue && issue.status.id !== nextStatus.id;
      });

      if (updatesToApply.length === 0) {
         return;
      }

      set((state) => {
         const updatesByIssueId = new Map(updatesToApply);
         const nextIssues = rebuildIssueHierarchy(
            state.issues.map((issue) => {
               const nextStatus = updatesByIssueId.get(issue.id);
               return nextStatus ? { ...issue, status: nextStatus } : issue;
            })
         );

         return {
            issues: nextIssues,
            issuesByStatus: groupIssuesByStatus(nextIssues),
         };
      });

      updatesToApply.forEach(([id, nextStatus]) => {
         void persistIssuePatch(id, { status: nextStatus.id }).catch((error) => {
            console.error(`Failed to persist issue status for ${id}.`, error);
         });
      });
   },

   updateIssuePriority: (issueId: string, newPriority: Priority) => {
      get().updateIssue(issueId, { priority: newPriority });
      void persistIssuePatch(issueId, { priority: newPriority.id }).catch((error) => {
         console.error('Failed to persist issue priority.', error);
      });
   },

   updateIssueAssignee: (issueId: string, newAssignee: User | null) => {
      get().updateIssue(issueId, { assignee: newAssignee });
      void persistIssuePatch(issueId, { assigneeId: newAssignee?.id ?? null }).catch((error) => {
         console.error('Failed to persist issue assignee.', error);
      });
   },

   addIssueLabel: (issueId: string, label: LabelInterface) => {
      const issue = get().getIssueById(issueId);
      if (!issue) {
         return;
      }

      const labelMap = new Map(issue.labels.map((item) => [item.id, item]));
      labelMap.set(label.id, label);
      const updatedLabels = Array.from(labelMap.values());
      get().updateIssue(issueId, { labels: updatedLabels });
      void persistIssuePatch(issueId, {
         labelNames: updatedLabels.map((item) => item.name),
      }).catch((error) => {
         console.error('Failed to persist issue labels.', error);
      });
   },

   removeIssueLabel: (issueId: string, labelId: string) => {
      const issue = get().getIssueById(issueId);
      if (!issue) {
         return;
      }

      const updatedLabels = issue.labels.filter((label) => label.id !== labelId);
      get().updateIssue(issueId, { labels: updatedLabels });
      void persistIssuePatch(issueId, {
         labelNames: updatedLabels.map((item) => item.name),
      }).catch((error) => {
         console.error('Failed to persist issue labels.', error);
      });
   },

   updateIssueProject: (issueId: string, newProject: Project | undefined) => {
      get().updateIssue(issueId, { project: newProject });
      void persistIssuePatch(issueId, { projectName: newProject?.name ?? null }).catch((error) => {
         console.error('Failed to persist issue project.', error);
      });
   },

   updateIssueDueDate: (issueId: string, dueDate: string | undefined) => {
      get().updateIssue(issueId, { dueDate });
      void persistIssuePatch(issueId, { dueDate: dueDate ?? null }).catch((error) => {
         console.error('Failed to persist issue due date.', error);
      });
   },

   updateIssueEstimatedHours: (issueId: string, estimatedHours: number | undefined) => {
      get().updateIssue(issueId, { estimatedHours });
      void persistIssuePatch(issueId, { estimatedHours: estimatedHours ?? null }).catch((error) => {
         console.error('Failed to persist issue estimate.', error);
      });
   },

   // Utility functions
   updateIssueParent: (issueId: string, parent) => {
      get().updateIssue(issueId, {
         parentIssueId: parent?.id ?? null,
         parent,
      });
      void persistIssuePatch(issueId, { parentIssueId: parent?.id ?? null }).catch((error) => {
         console.error('Failed to persist issue parent.', error);
      });
   },

   getIssueById: (id: string) => get().issues.find((issue) => issue.id === id),

   getRootIssues: () => get().issues.filter((issue) => !issue.parentIssueId),

   getSubissues: (parentIssueId: string) =>
      sortByRankDesc(get().issues.filter((issue) => issue.parentIssueId === parentIssueId)),

   getIssueChildrenCount: (issueId: string) =>
      get().issues.filter((issue) => issue.parentIssueId === issueId).length,
}));
