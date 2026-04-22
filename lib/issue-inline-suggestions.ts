import type { LabelInterface } from '@/lib/models';
import type { Project } from '@/lib/projects-presentation';
import { normalizeInlineToken } from './issue-inline-tokens';

export type InlineTokenKind = 'project' | 'label';

export type InlineTokenSuggestion =
   | {
        kind: 'project';
        id: string;
        name: string;
        token: string;
        project: Project;
     }
   | {
        kind: 'label';
        id: string;
        name: string;
        token: string;
        label: LabelInterface;
     };

export interface InlineTokenSuggestionContext {
   kind: InlineTokenKind;
   query: string;
   tokenStart: number;
   tokenEnd: number;
   items: InlineTokenSuggestion[];
}

function getInlineTokenMatch(title: string, cursorPosition: number) {
   const beforeCursor = title.slice(0, cursorPosition);
   const match = beforeCursor.match(/(^|\s)([@#])([^\s@#]*)$/);

   if (!match) {
      return null;
   }

   const tokenStart = (match.index ?? 0) + match[1].length;
   return {
      kind: match[2] === '@' ? ('project' as const) : ('label' as const),
      query: match[3] ?? '',
      tokenStart,
      tokenEnd: cursorPosition,
   };
}

function buildSuggestionToken(name: string) {
   return normalizeInlineToken(name);
}

function filterSuggestions<T extends { name: string }>(
   items: T[],
   query: string
): Array<T & { token: string }> {
   const normalizedQuery = normalizeInlineToken(query);

   return items
      .map((item) => ({
         ...item,
         token: buildSuggestionToken(item.name),
      }))
      .filter((item) => {
         if (!normalizedQuery) {
            return true;
         }

         const normalizedName = normalizeInlineToken(item.name);
         return normalizedName.includes(normalizedQuery) || item.token.includes(normalizedQuery);
      })
      .sort((a, b) => {
         const aName = normalizeInlineToken(a.name);
         const bName = normalizeInlineToken(b.name);
         const aStarts = normalizedQuery && aName.startsWith(normalizedQuery) ? 0 : 1;
         const bStarts = normalizedQuery && bName.startsWith(normalizedQuery) ? 0 : 1;

         if (aStarts !== bStarts) {
            return aStarts - bStarts;
         }

         return a.name.localeCompare(b.name);
      });
}

export function getInlineTokenSuggestionContext(
   title: string,
   cursorPosition: number,
   projects: Project[],
   labels: LabelInterface[]
): InlineTokenSuggestionContext | null {
   const match = getInlineTokenMatch(title, cursorPosition);

   if (!match) {
      return null;
   }

   if (match.kind === 'project') {
      const items = filterSuggestions(projects, match.query).map((project) => ({
         kind: 'project' as const,
         id: project.id,
         name: project.name,
         token: project.token,
         project,
      }));

      if (items.length === 0) {
         return null;
      }

      return {
         kind: 'project',
         query: match.query,
         tokenStart: match.tokenStart,
         tokenEnd: match.tokenEnd,
         items: items.slice(0, 6),
      };
   }

   const items = filterSuggestions(labels, match.query).map((label) => ({
      kind: 'label' as const,
      id: label.id,
      name: label.name,
      token: label.token,
      label,
   }));

   if (items.length === 0) {
      return null;
   }

   return {
      kind: 'label',
      query: match.query,
      tokenStart: match.tokenStart,
      tokenEnd: match.tokenEnd,
      items: items.slice(0, 6),
   };
}

export function applyInlineTokenSuggestion(
   title: string,
   tokenStart: number,
   tokenEnd: number,
   suggestion: InlineTokenSuggestion
): { title: string; cursor: number } {
   const replacement = `${suggestion.kind === 'project' ? '@' : '#'}${suggestion.token}`;
   const nextTitle = `${title.slice(0, tokenStart)}${replacement} ${title.slice(tokenEnd)}`;
   return {
      title: nextTitle,
      cursor: tokenStart + replacement.length + 1,
   };
}
