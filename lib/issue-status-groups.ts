import type { Issue } from '@/lib/models';

export function groupIssuesForDisplayByStatus(issues: Issue[]) {
   const issueMap = new Map(issues.map((issue) => [issue.id, issue]));

   return issues.reduce<Record<string, Issue[]>>((groups, issue) => {
      const visibleParent = issue.parentIssueId ? issueMap.get(issue.parentIssueId) : null;
      const groupStatusId = visibleParent?.status.id ?? issue.status.id;

      groups[groupStatusId] = [...(groups[groupStatusId] ?? []), issue];

      return groups;
   }, {});
}
