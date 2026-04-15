import LexoRankImport from '@kayron013/lexorank';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

const LexoRank = ((LexoRankImport as unknown as { default?: unknown }).default ??
   LexoRankImport) as typeof import('@kayron013/lexorank').default;

export function cn(...inputs: ClassValue[]) {
   return twMerge(clsx(inputs));
}

/**
 * Ordering system like JIRA's LexoRank algorithm.
 * @see https://youtu.be/OjQv9xMoFbg
 */
export { LexoRank };
