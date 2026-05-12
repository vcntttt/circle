import type { LabelInterface, Project } from '@/lib/models';

export interface ParsedIssueInlineTokens {
   title: string;
   project: Project | undefined;
   labels: LabelInterface[];
   hasInlineTokens: boolean;
}

export function normalizeInlineToken(value: string): string {
   return value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
}

function stripTokenPunctuation(value: string): string {
   return value.replace(/[.,;:!?]+$/g, '');
}

export function parseIssueInlineTokens(
   rawTitle: string,
   projects: Project[],
   labels: LabelInterface[]
): ParsedIssueInlineTokens {
   const words = rawTitle.split(/\s+/).filter(Boolean);
   const keptWords: string[] = [];
   let inlineProject: Project | undefined;
   const inlineLabels: LabelInterface[] = [];
   const selectedLabelIds = new Set<string>();
   const projectsByToken = new Map(
      projects.map((project) => [normalizeInlineToken(project.name), project])
   );
   const labelsByToken = new Map(labels.map((label) => [normalizeInlineToken(label.name), label]));

   for (const word of words) {
      const cleanWord = stripTokenPunctuation(word);
      const prefix = cleanWord[0];
      const tokenValue = cleanWord.slice(1);

      if ((prefix === '@' || prefix === '#') && tokenValue.length > 0) {
         if (prefix === '@') {
            const matchedProject = projectsByToken.get(normalizeInlineToken(tokenValue));
            if (matchedProject) {
               inlineProject = matchedProject;
               continue;
            }
         }

         if (prefix === '#') {
            const matchedLabel = labelsByToken.get(normalizeInlineToken(tokenValue));
            if (matchedLabel && !selectedLabelIds.has(matchedLabel.id)) {
               inlineLabels.push(matchedLabel);
               selectedLabelIds.add(matchedLabel.id);
               continue;
            }
         }
      }

      keptWords.push(word);
   }

   return {
      title: keptWords.join(' ').trim(),
      project: inlineProject,
      labels: inlineLabels,
      hasInlineTokens: Boolean(inlineProject || inlineLabels.length > 0),
   };
}
