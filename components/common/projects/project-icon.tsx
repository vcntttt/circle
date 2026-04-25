'use client';

import { DynamicIcon, iconNames, type IconName } from 'lucide-react/dynamic.mjs';
import type { Project, ProjectIconConfig } from '@/lib/models';
import { cn } from '@/lib/utils';

const lucideIconNames = new Set<string>(iconNames);

interface ProjectIconProps {
   project?: Pick<Project, 'iconConfig'>;
   icon?: ProjectIconConfig;
   className?: string;
   iconClassName?: string;
}

export function ProjectIcon({ project, icon, className, iconClassName }: ProjectIconProps) {
   const iconConfig = icon ?? project?.iconConfig ?? { type: 'lucide', value: 'box' };

   return (
      <span
         className={cn(
            'inline-flex size-6 shrink-0 items-center justify-center rounded bg-muted/50 text-muted-foreground',
            className
         )}
      >
         <ProjectIconGlyph icon={iconConfig} className={cn('size-4', iconClassName)} />
      </span>
   );
}

export function ProjectIconGlyph({
   icon,
   className,
}: {
   icon: ProjectIconConfig;
   className?: string;
}) {
   if (icon.type === 'emoji') {
      return (
         <span className={cn('text-sm leading-none', className)} aria-hidden="true">
            {icon.value || '📦'}
         </span>
      );
   }

   const iconName = lucideIconNames.has(icon.value) ? icon.value : 'box';

   return (
      <DynamicIcon
         name={iconName as IconName}
         className={className}
         fallback={() => <DynamicIcon name="box" className={className} />}
      />
   );
}
