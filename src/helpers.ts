import { CompletedKata, CompletedKataFormatter, Solution } from './types';

export function formatLanguageTestCode(language: string, code: string){
  switch (language){
    case 'javascript':
      return `;(() => {\n\t${code.split('\n').join('\n\t')}\n})();`
    case 'typescript':
      return `;(() => {\n\t${code.split('\n').join('\n\t')}\n})();`
    default:
      return code;
  }
}

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
    case 'cpp':
      return 'cpp'
    case 'lua':
      return 'lua'
    case 'shell':
      return 'sh'
    case 'php':
      return 'php'
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
    case 'cpp':
      return 'C++'
    case 'lua':
      return 'Lua'
    case 'shell':
      return 'Shell'
    case 'php':
      return 'PHP'
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
    case 'cpp':
      return '//\t' + content
    case 'lua':
      return '--\t' + content
    case 'shell':
      return '#\t' + content
    case 'php':
      return '//\t' + content
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