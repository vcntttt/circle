import * as React from 'react';
import { cn } from '@/lib/utils';

export const issueChipClassName =
   'inline-flex h-[26px] max-w-full shrink-0 items-center gap-1.5 rounded-full border border-zinc-700/80 bg-zinc-950/80 px-2.5 text-sm font-medium leading-none text-zinc-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.045),0_1px_1px_rgba(0,0,0,0.25)] transition-colors hover:border-zinc-600 hover:bg-zinc-900 hover:text-zinc-50 dark:border-zinc-700/80 dark:bg-zinc-950/80';

export const issueChipIconClassName = 'size-3.5 shrink-0 text-zinc-400';

export const issueChipDotClassName = 'size-1.5 shrink-0 rounded-full';

export function IssueChip({ className, children, ...props }: React.ComponentProps<'span'>) {
   return (
      <span className={cn(issueChipClassName, className)} {...props}>
         {children}
      </span>
   );
}
