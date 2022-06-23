import fs from 'fs';
import path from 'path';
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
    case 'kotlin':
      return 'tkt'
    case 'c':
      return 'c'
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
    case 'kotlin':
      return 'Kotlin'
    case 'c':
      return 'C'
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
    case 'kotlin':
      return '//\t' + content
    case 'c':
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

export async function getKataLanguageInfo(slug: string, language: string, username: string, cache: boolean = true) {
  let html;
  const cachePath = path.join('cache', `${slug}-${language}.html`);
  if (!cache || !fs.existsSync(cachePath)) {
    html = await fetchKataLanguageInfo(slug, language);
    await fs.promises.writeFile(cachePath, html);
  } else {
    html = (await fs.promises.readFile(cachePath)).toString();
  }

  return parseKataLanguageInfo(html, username);
}

export async function fetchKataLanguageInfo(slug: string, language: string) {
  return await fetch(`https://www.codewars.com/kata/${slug}/solutions/${language}/me`, {
    headers: {
      'User-Agent': USER_AGENT,
      Cookie: 'remember_user_token=' + REMEMBER_USER_TOKEN,
    },
  })
    .then((r: any) => r.status === 429 ? 'Retry later' : r.text())
    .then((html: string) =>
      html === 'Retry later'
        ? delay(10000).then(() => fetchKataLanguageInfo(slug, language))
        : html,
    );
}

export function parseKataLanguageInfo(html: string, username: string) {
  const jsdom = new JSDOM(html);
  const testCode = jsdom.window.document.querySelector('pre code')!.textContent!;
  const script = Array.from(jsdom.window.document.querySelectorAll('script')).find(script =>
    script.textContent?.includes('data: JSON.parse('),
  )!;
  const data = JSON.parse(JSON.parse(script.textContent!.match(/JSON\.parse\("(.*)"\)/g)![1].match(/JSON\.parse\((.*)\)/)![1]!));

  return {
    testCode,
    description: data.description,
    vote: data.vote,
    voteID: script.textContent!.split('"challenge_vote":"')[1].split('"')[0].split('/').slice(-1)[0],
    csrfToken: jsdom.window.document.querySelector('[name="csrf-token"]')!.getAttribute('content')!,
    linkedSolutions: [...jsdom.window.document.querySelectorAll('#solutions_list > li')]
      .map(li => ({
        code: li.querySelector('code')!.textContent!,
        link: [...li.querySelectorAll('a')].find(a => a.href.includes('/kata/reviews/'))!.href
      })),
    upvotes: [...jsdom.window.document.querySelectorAll('#solutions_list > li')]
      .filter(li => li.querySelector('.font-semibold')!.textContent === username)
      .reduce(
        (upvotes, li) =>
          [...li.querySelectorAll('.vote-label')]
            .map(({ childNodes }) => +childNodes[childNodes.length - 1].textContent!)
            .map((count, i) => upvotes[i] + count) as [number, number],
        [0, 0] as [number, number],
      ),
  };
}

export const getLastNArgument = () => -(process.argv.find(arg => arg.startsWith('--last-n-solutions=')) || '=').split('=')[1] || undefined

export const languageFilename = (language: string, suffix: string = '') =>
  `${language}${suffix}.${getLanguageExtension(language)}`;

export const capitalize = (string: string) => string[0].toUpperCase() + string.slice(1);

export const getKataURL = (kata: CompletedKata) => `https://www.codewars.com/kata/${kata.slug}`;

export const setEnvironmentVariable = async (key: string, value: string, callback: () => Promise<any>) => {
  const previousValue = process.env[key];
  process.env[key] = value;
  await callback();
  process.env[key] = previousValue;
}

export const delay = (ms: number) => new Promise(r => setTimeout(r, ms))

const RANK_STYLES = [
  {
    rank: -8,
    name: '8 kyu',
    color: 'white',
  },
  {
    name: '7 kyu',
    color: 'white',
    rank: -7,
  },
  {
    rank: -6,
    name: '6 kyu',
    color: 'yellow',
  },
  {
    rank: -5,
    name: '5 kyu',
    color: 'yellow',
  },
  {
    rank: -4,
    name: '4 kyu',
    color: 'blue',
  },
  {
    rank: -3,
    name: '3 kyu',
    color: 'blue',
  },
  {
    rank: -2,
    name: '2 kyu',
    color: 'purple',
  },
  {
    rank: -1,
    name: '1 kyu',
    color: 'purple',
  },
];

export const numericRankToName = (number: number) => {
  return RANK_STYLES.find(rank => rank.rank === number)!.name;
}

export const rankNameToNumber = (name: string) => {
  return RANK_STYLES.find(rank => rank.name === name)!.rank;
}