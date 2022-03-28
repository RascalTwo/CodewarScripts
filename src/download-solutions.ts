import fs from 'fs';
import path from 'path';
// @ts-ignore
import fetch from 'node-fetch';

import { USER_NAME, USER_AGENT, REMEMBER_USER_TOKEN } from './constants';
import type { CompletedKata } from './types';
import { JSDOM } from 'jsdom';
import formatKatas from './solution-formatters';


async function getKataLanguageInfo(slug: string, language: string) {
	let html;
	const cachePath = path.join('cache', `${slug}-${language}.html`)
	if (!fs.existsSync(cachePath)) {
		html = await fetch(`https://www.codewars.com/kata/${slug}/solutions/${language}`, {
			headers: {
				'User-Agent': USER_AGENT,
				Cookie: 'remember_user_token=' + REMEMBER_USER_TOKEN,
			},
		}).then((r: any) => r.text());
		await fs.promises.writeFile(cachePath, html);
	} else {
		html = (await fs.promises.readFile(cachePath)).toString()
	}
  const jsdom = new JSDOM(html);
  const testCode = jsdom.window.document.querySelector('#fixture_panel code')!.textContent!;
  const script = Array.from(jsdom.window.document.querySelectorAll('script')).find(script =>
    script.textContent?.includes('data: JSON.parse('),
  );
  const { description } = JSON.parse(JSON.parse(script?.textContent?.match(/JSON\.parse\("(.*)"\)/g)![1].match(/JSON\.parse\((.*)\)/)![1]!));
  return { testCode, description };
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
  console.log('Downloading solutions...');
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

  console.log('Downloading Katas...');

  let total = 0;
  for (const kata of Object.values(katas)) {
    total += kata.solutions.length;
  }
  let current = 0;
  for (const kata of Object.values(katas)) {
    kata.info = {}
    for (const solution of kata.solutions) {
      process.stdout.write(
        `${((current++ / total) * 100).toFixed(2)}%      \r`,
      );
      kata.info[solution.language] = await getKataLanguageInfo(kata.slug, solution.language);
    }
  }

  console.log()

  return formatKatas(katas, './solutions_output');
})().catch(console.error);
