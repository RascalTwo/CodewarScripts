import fs from 'fs';
// @ts-ignore
import fetch from 'node-fetch';

import { USER_NAME, USER_AGENT, REMEMBER_USER_TOKEN } from './constants';
import type { CompletedKata } from './types';
import { JSDOM } from 'jsdom';
import formatKatas from './solution-formatters';

function parseHTMLSolutions(html: string): Record<string, CompletedKata> {
  const { document } = new JSDOM(html).window;
  return Array.from(document.querySelectorAll('.list-item-solutions, .items-list'))
    .map(rawSolutions => {
      const anchor = rawSolutions.querySelector('a')!;

      return {
        slug: anchor.href.split('/').at(-1)!,
        title: anchor.textContent!,
        rank: anchor.parentNode?.children[0].textContent!,
        solutions: Array.from(rawSolutions.querySelectorAll('.markdown')).map(div => {
          return {
            content: div.textContent!,
            language: div.querySelector('code')?.dataset.language!,
            when: new Date(div.nextElementSibling!.querySelector('time-ago')!.getAttribute('datetime')!)!.getTime(),
          };
        }).sort((a, b) => a.when - b.when),
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


(async () => {
  const response = await fetch(`https://www.codewars.com/users/${USER_NAME}/completed_solutions`, {
    headers: {
      'User-Agent': USER_AGENT,
      Cookie: 'remember_user_token=' + REMEMBER_USER_TOKEN,
    },
  });
  const katas = parseHTMLSolutions(await response.text());

  let page = 1;
  while (true) {
    process.stdout.write(`Page #${page.toString().padStart(2, '0')} \r`);
    const response = await fetch(`https://www.codewars.com/users/${USER_NAME}/completed_solutions?page=${page++}`, {
      headers: {
        'User-Agent': USER_AGENT,
        'x-requested-with': 'XMLHttpRequest',
        Cookie: 'remember_user_token=' + REMEMBER_USER_TOKEN,
      },
    });
    const newRows = parseHTMLSolutions(await response.text());
    Object.assign(katas, newRows);
    const length = Object.keys(newRows).length;
    if (!length) break;
  }

  console.log();

  return formatKatas(katas, './solutions_output');
})().catch(console.error);
