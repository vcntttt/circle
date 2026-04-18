import type { IssueListItem } from '@/lib/db/issues';
import { resolveCurrentAssignee } from '@/lib/current-user';
import { type Issue, priorities, status } from '@/lib/ui-catalog';
import { toPresentationProject } from './projects-presentation';

export const toPresentationIssue = (issue: IssueListItem): Issue => ({
   id: issue.id,
   identifier: issue.identifier,
   title: issue.title,
   description: issue.description ?? '',
   status: status.find((item) => item.id === issue.status) ?? status[status.length - 1],
   assignee: resolveCurrentAssignee(issue.assigneeId),
   priority: priorities.find((item) => item.id === issue.priority) ?? priorities[0],
   labels: issue.labels,
   createdAt: issue.createdAt,
   cycleId: '',
   project: issue.project ? toPresentationProject(issue.project) : undefined,
   subissues: [],
   rank: issue.rank,
   dueDate: issue.dueDate ?? undefined,
});
