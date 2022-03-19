import { CompletedKata, CompletedKataFormatter, Solution } from './types';

export function getLanguageExtension(language: string) {
  switch (language) {
    case 'javascript':
      return 'js';
    case 'typescript':
      return 'ts';
    case 'python':
      return 'py';
    case 'java':
      return 'java';
    default:
      throw new Error(`Unhandled language extension: ${language}`);
  }
}

export const generateCommentLine = (language: string, content: string) => {
  switch (language) {
    case 'javascript':
      return '//\t' + content;
    case 'java':
      return '//\t' + content;
    case 'python':
      return '#\t' + content;
    default:
      throw new Error(`Unhandled language comment: ${language}`);
  }
};

export const solutionFilename = (solution: Solution) =>
  `${solution.language}.${getLanguageExtension(solution.language)}`;

export const capitalize = (string: string) => string[0].toUpperCase() + string.slice(1);

export const getKataURL = (kata: CompletedKata) => `https://www.codewars.com/kata/${kata.slug}`;
