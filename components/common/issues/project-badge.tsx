import type { Project } from '@/lib/models';
import { Link } from '@tanstack/react-router';
import { IssueChip, issueChipIconClassName } from './issue-chip';
import { ProjectIconGlyph } from '@/components/common/projects/project-icon';

export function ProjectBadge({ project }: { project: Project }) {
   return (
      <Link
         to="/projects/$projectSlug"
         params={{ projectSlug: project.slug ?? project.id }}
         className="inline-flex max-w-full"
      >
         <IssueChip>
            <ProjectIconGlyph icon={project.iconConfig} className={issueChipIconClassName} />
            <span className="truncate">{project.name}</span>
         </IssueChip>
      </Link>
   );
}
