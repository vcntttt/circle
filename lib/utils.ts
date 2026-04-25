import LexoRankImport from '@kayron013/lexorank';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

const LexoRank = ((LexoRankImport as unknown as { default?: unknown }).default ??
   LexoRankImport) as typeof import('@kayron013/lexorank').default;

export function cn(...inputs: ClassValue[]) {
   return twMerge(clsx(inputs));
}

export function getNextLexoRank(ranks: Array<string | null | undefined>) {
   const latestValidRank = [...ranks]
      .filter((rank): rank is string => typeof rank === 'string' && rank.trim().length > 0)
      .sort((left, right) => left.localeCompare(right))
      .reverse()
      .find((rank) => {
         try {
            LexoRank.from(rank);
            return true;
         } catch {
            return false;
         }
      });

   return latestValidRank
      ? LexoRank.from(latestValidRank).increment().toString()
      : new LexoRank('a3c').toString();
}

/**
 * Ordering system like JIRA's LexoRank algorithm.
 * @see https://youtu.be/OjQv9xMoFbg
 */
export { LexoRank };
