export interface CompletedKata {
  slug: string;
  title: string;
  rank: string;
  solutions: Solution[];
}

export interface Solution {
  content: string;
  language: string;
  when: number;
}

export type CompletedKataFormatter = (katas: Record<string, CompletedKata>, directory: string) => Promise<void>