import fs from 'fs';
import path from 'path';
// @ts-ignore
import fetch from 'node-fetch';

import { USER_NAME, USER_AGENT, REMEMBER_USER_TOKEN, IGNORE_SOLUTIONS } from './constants';
import type { CompletedKata } from './types';
import { JSDOM } from 'jsdom';
import formatKatas from './solution-formatters';
import { fetchKataLanguageInfo, parseKataLanguageInfo } from './helpers';

async function getKataLanguageInfo(slug: string, language: string, cache: boolean = true) {
  let html;
  const cachePath = path.join('cache', `${slug}-${language}.html`);
  if (!cache || !fs.existsSync(cachePath)) {
    html = await fetchKataLanguageInfo(slug, language);
    await fs.promises.writeFile(cachePath, html);
  } else {
    html = (await fs.promises.readFile(cachePath)).toString();
  }

  return parseKataLanguageInfo(html);
}

function parseHTMLSolutions(html: string): Record<string, CompletedKata> {
  const { document } = new JSDOM(html).window;
  return Array.from(document.querySelectorAll('.list-item-solutions, .items-list'))
    .map(rawSolutions => {
      const anchor = rawSolutions.querySelector('a')!;

      return {
        slug: anchor.href.split('/').at(-1)!,
        title: anchor.textContent!,
        rank: anchor.parentNode?.children[0].textContent!,
        solutions: Array.from(rawSolutions.querySelectorAll('.markdown'))
          .map(div => ({ div, datetime: div.nextElementSibling!.querySelector('time-ago')!.getAttribute('datetime')! }))
          .filter(({ datetime }) => !IGNORE_SOLUTIONS.has(datetime))
          .map(({ div, datetime }) => {
            return {
              content: div.textContent!,
              language: div.querySelector('code')?.dataset.language!,
              when: new Date(datetime)!.getTime(),
            };
          })
          .sort((a, b) => a.when - b.when),
      };
    })
    .reduce(
      (katas, completedKata) => ({
        ...katas,
        [completedKata.slug]: completedKata,
      }),
      {},
    );
}

const fetchFirstPage = async (cache: boolean) => {
  const cachePath = path.join('cache', `page-${0}.html`);

  let html;
  if (!fs.existsSync(cachePath)) {
    html = await fetch(`https://www.codewars.com/users/${USER_NAME}/completed_solutions`, {
      headers: {
        'User-Agent': USER_AGENT,
        Cookie: 'remember_user_token=' + REMEMBER_USER_TOKEN,
      },
    }).then((response: any) => response.text());
    await fs.promises.writeFile(cachePath, html);
  } else {
    html = (await fs.promises.readFile(cachePath)).toString();
  }

  return parseHTMLSolutions(html);
};

const fetchPage = async (page: number, cache: boolean) => {
  const cachePath = path.join('cache', `page-${page}.html`);

  let html;
  if (!cache || !fs.existsSync(cachePath)) {
    html = await fetch(`https://www.codewars.com/users/${USER_NAME}/completed_solutions?page=${page++}`, {
      headers: {
        'User-Agent': USER_AGENT,
        'x-requested-with': 'XMLHttpRequest',
        Cookie: 'remember_user_token=' + REMEMBER_USER_TOKEN,
      },
    }).then((response: any) => response.text());
    await fs.promises.writeFile(cachePath, html);
  } else {
    html = (await fs.promises.readFile(cachePath)).toString();
  }

  return parseHTMLSolutions(html);
};

(async () => {
  if (!USER_NAME) return console.error('USER_NAME environment variable not set');
  if (!USER_AGENT) return console.error('USER_AGENT environment variable not set');
  if (!REMEMBER_USER_TOKEN) return console.error('REMEMBER_USER_TOKEN environment variable not set');

  const CACHE_PAGES = process.argv.includes('--cache-pages');
  console.log(`Downloading ${USER_NAME} solutions...`, CACHE_PAGES ? '(Using Cache)' : '');

  const katas = await fetchFirstPage(CACHE_PAGES);

  let page = 1;
  while (true) {
    process.stdout.write(`Page #${page.toString().padStart(2, '0')} \r`);
    const newRows = await fetchPage(page++, CACHE_PAGES);
    Object.assign(katas, newRows);
    const length = Object.keys(newRows).length;
    if (!length) break;
  }

  console.log('Downloading Katas...');

  let total = 0;
  for (const kata of Object.values(katas)) {
    total += kata.solutions.length;
  }
  let current = 0;
  for (const kata of Object.values(katas)) {
    kata.info = {};
    for (const solution of kata.solutions) {
      process.stdout.write(`${((current++ / total) * 100).toFixed(2)}%      \r`);
      const { description, testCode, upvotes, vote, voteID, csrfToken } = await getKataLanguageInfo(
        kata.slug,
        solution.language,
      );
      kata.info[solution.language] = { description, testCode };
      kata.vote = vote;
      if (voteID) kata.voteID = voteID;
      kata.csrfToken = csrfToken;
      kata.upvotes = upvotes;
    }
  }

  console.log();

  process.argv.unshift('--formatters=json');
  return formatKatas(katas, './solutions_output');
})().catch(console.error);
