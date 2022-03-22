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
    case 'csharp':
      return 'cs';
    default:
      throw new Error(`Unhandled language extension: ${language}`);
  }
}

export const getLanguageName = (language: string) => {
  switch (language) {
    case 'javascript':
      return 'JavaScript'
    case 'java':
      return 'Java'
    case 'python':
      return 'Python'
    case 'csharp':
      return 'C#'
    default:
      throw new Error(`Unhandled language name: ${language}`);
  }
};

export const generateCommentLine = (language: string, content: string) => {
  switch (language) {
    case 'javascript':
      return '//\t' + content;
    case 'java':
      return '//\t' + content;
    case 'python':
      return '#\t' + content;
    case 'csharp':
      return '//\t' + content;
    default:
      throw new Error(`Unhandled language comment: ${language}`);
  }
};

export const languageFilename = (language: string) =>
  `${language}.${getLanguageExtension(language)}`;

export const capitalize = (string: string) => string[0].toUpperCase() + string.slice(1);

export const getKataURL = (kata: CompletedKata) => `https://www.codewars.com/kata/${kata.slug}`;

export const setEnvironmentVariable = async (key: string, value: string, callback: () => Promise<any>) => {
  const previousValue = process.env[key];
  process.env[key] = value;
  await callback();
  process.env[key] = previousValue;
}