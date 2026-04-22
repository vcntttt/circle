import type { IssueListItem } from '@/lib/db/issues';
import { resolveCurrentAssignee } from '@/lib/current-user';
import { priorities, type Issue, status as fallbackStatuses } from '@/lib/ui-catalog';
import { toPresentationProject } from './projects-presentation';
import type { ProjectOptionLike } from './projects-presentation';

export const toPresentationIssue = (
   issue: IssueListItem,
   statusOptions?: ProjectOptionLike[]
): Issue => ({
   id: issue.id,
   identifier: issue.identifier,
   title: issue.title,
   description: issue.description ?? '',
   status:
      statusOptions?.find((item) => item.id === issue.status) ??
      fallbackStatuses.find((item) => item.id === issue.status) ??
      fallbackStatuses[fallbackStatuses.length - 1],
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
