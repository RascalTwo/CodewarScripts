export interface KataLanguageInfo {
  description: string;
  testCode: string
}

export type KataVote = -1 | 0 | 1 | null;

export interface CompletedKata {
  slug: string;
  title: string;
  rank: string;
  solutions: Solution[];
  info: Record<string, KataLanguageInfo>
  vote: KataVote
  voteID: string
  csrfToken: string
  upvotes: [number, number]
}

export interface Solution {
  content: string;
  language: string;
  when: number;
}

export type CompletedKataFormatter = (katas: Record<string, CompletedKata>, directory: string) => Promise<void>