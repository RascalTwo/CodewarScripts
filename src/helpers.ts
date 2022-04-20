import { JSDOM } from 'jsdom';
import { USER_AGENT, REMEMBER_USER_TOKEN } from './constants';
import { CompletedKata, CompletedKataFormatter, Solution } from './types';
// @ts-ignore
import fetch from 'node-fetch'

export function formatLanguageTestCode(language: string, code: string){
  switch (language){
    case 'javascript':
      return `;(() => {\n\t${code.split('\n').join('\n\t')}\n})();`
    case 'typescript':
      return `;(() => {\n\t${code.split('\n').join('\n\t')}\n})();`
    case 'sql':
      return '';
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
    case 'ruby':
      return 'rb'
    case 'sql':
      return 'sql'
    default:
      throw new Error(`Unhandled language extension: ${language}`);
  }
}

export const getLanguageName = (language: string) => {
  switch (language) {
    case 'javascript':
      return 'JavaScript'
    case 'typescript':
      return 'TypeScript'
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
    case 'ruby':
      return 'Ruby'
    case 'sql':
      return 'SQL'
    default:
      throw new Error(`Unhandled language name: ${language}`);
  }
};

export const generateCommentLine = (language: string, content: string) => {
  switch (language) {
    case 'javascript':
      return '//\t' + content;
    case 'typescript':
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
    case 'ruby':
      return '#\t' + content
    case 'sql':
      return '--\t' + content
    default:
      throw new Error(`Unhandled language comment: ${language}`);
  }
};


export async function fetchKataLanguageInfo(slug: string, language: string) {
  return await fetch(`https://www.codewars.com/kata/${slug}/solutions/${language}`, {
			headers: {
				'User-Agent': USER_AGENT,
				Cookie: 'remember_user_token=' + REMEMBER_USER_TOKEN,
			},
		}).then((r: any) => r.text())
}

export function parseKataLanguageInfo(html: string){
  const jsdom = new JSDOM(html);
  const testCode = jsdom.window.document.querySelector('#fixture_panel code')!.textContent!;
  const script = Array.from(jsdom.window.document.querySelectorAll('script')).find(script =>
    script.textContent?.includes('data: JSON.parse('),
  )!;
  const data = JSON.parse(JSON.parse(script.textContent!.match(/JSON\.parse\("(.*)"\)/g)![1].match(/JSON\.parse\((.*)\)/)![1]!));

  return {
    testCode,
    description: data.description,
    vote: data.vote,
    voteID: script.textContent!.split('"challenge_vote":"')[1].split('"')[0].split('/').at(-1),
    csrfToken: jsdom.window.document.querySelector('[name="csrf-token"]')!.getAttribute('content')!
  };
}

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