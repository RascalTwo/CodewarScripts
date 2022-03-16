import fs from 'fs';
// @ts-ignore
import fetch from 'node-fetch';

import { USER_NAME, USER_AGENT, REMEMBER_USER_TOKEN } from './constants';
import { JSDOM } from 'jsdom';

interface CompletedKata {
  slug: string;
  title: string;
  rank: string;
  solutions: Solution[];
}

interface Solution {
  content: string;
  language: string;
  when: Date;
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
            when: new Date(div.nextElementSibling!.querySelector('time-ago')!.getAttribute('datetime')!)!,
          };
        }),
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

const LANGUAGE_EXTENSIONS: Record<string, string> = {
  javascript: 'js',
  typescript: 'ts',
  python: 'py',
  java: 'java',
};

const solutionFilename = (solution: Solution) => `${solution.language}.${LANGUAGE_EXTENSIONS[solution.language]}`;

const capitalize = (string: string) => string[0].toUpperCase() + string.slice(1);

(async () => {
  const response = await fetch(`https://www.codewars.com/users/${USER_NAME}/completed`, {
    headers: {
      'User-Agent': USER_AGENT,
      Cookie: 'remember_user_token=' + REMEMBER_USER_TOKEN,
    },
  });
  const html = await response.text();
  await fs.promises.writeFile('first.html', html);
  const katas = parseHTMLSolutions(html);

  let page = 1;
  while (true) {
    process.stdout.write(`${page.toString().padStart(2, '0')} \r`);
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

  for (const dir of await fs.promises.readdir('solutions_output')) {
    await fs.promises.rm(`solutions_output/${dir}`, { recursive: true });
  }

  for (const kata of Object.values(katas)) {
    await fs.promises.mkdir(`solutions_output/${kata.slug}`);
    for (const solution of Object.values(
      kata.solutions.reduce((lang, sol) => {
        const existing = lang[sol.language];
        return {
          ...lang,
          [sol.language]: existing && existing.when > sol.when ? existing : sol,
        };
      }, {} as Record<string, Solution>),
    )) {
      await fs.promises.writeFile(`solutions_output/${kata.slug}/${solutionFilename(solution)}`, solution.content);
    }
    await fs.promises.writeFile(
      `solutions_output/${kata.slug}/README.md`,
      `# ${kata.rank} [${kata.title}]((https://www.codewars.com/kata/${kata.slug}))\n\n` +
        kata.solutions.map(sol => `[${capitalize(sol.language)}](./${solutionFilename(sol)})`).join('\n'),
    );
  }

  return fs.promises.writeFile(
    `solutions_output/${Date.now()}.json`,
    JSON.stringify(
      Object.values(katas).sort((a, b) => {
        const [at, bt] = [a, b].map(c => Math.min(...c.solutions.map(s => s.when.getTime())));
        return at - bt;
      }),
      undefined,
      '  ',
    ),
  );
})().catch(console.error);

// generate folder
// generate readme
// generate language.extension filenames
