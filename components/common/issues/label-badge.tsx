import type { LabelInterface } from '@/lib/models';
import { IssueChip, issueChipDotClassName } from './issue-chip';

export function LabelBadge({ label }: { label: LabelInterface[] }) {
   return (
      <>
         {label.map((l) => (
            <IssueChip key={l.id}>
               <span
                  className={issueChipDotClassName}
                  style={{ backgroundColor: l.color }}
                  aria-hidden="true"
               ></span>
               <span className="truncate">{l.name}</span>
            </IssueChip>
         ))}
      </>
   );
}
