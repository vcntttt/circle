import type { IssueListItem } from '@/lib/db/issues';
import { Issue } from '@/mock-data/issues';
import { priorities } from '@/mock-data/priorities';
import { status } from '@/mock-data/status';
import { users } from '@/mock-data/users';
import { toPresentationProject } from './projects-presentation';

export const toPresentationIssue = (issue: IssueListItem): Issue => ({
   id: issue.id,
   identifier: issue.identifier,
   title: issue.title,
   description: issue.description ?? '',
   status: status.find((item) => item.id === issue.status) ?? status[status.length - 1],
   assignee: issue.assigneeId ? (users.find((item) => item.id === issue.assigneeId) ?? null) : null,
   priority: priorities.find((item) => item.id === issue.priority) ?? priorities[0],
   labels: issue.labels,
   createdAt: issue.createdAt,
   cycleId: '',
   project: issue.project ? toPresentationProject(issue.project) : undefined,
   subissues: [],
   rank: issue.rank,
   dueDate: issue.dueDate ?? undefined,
});
