import fs from 'fs';
// @ts-ignore
import fetch from 'node-fetch';
import { JSDOM } from 'jsdom';
import { USER_NAME, USER_AGENT, REMEMBER_USER_TOKEN } from './constants';

const flattenDate = (input: any) => {
  const date = new Date(input);
  date.setUTCHours(0);
  date.setUTCMinutes(0);
  date.setUTCSeconds(0);
  date.setUTCMilliseconds(0);
  return date;
};

function parseHTMLUsernames(html: string): Record<string, Entry> {
  return Array.from(new JSDOM(html).window.document.querySelectorAll('tr')).reduce((usernames, row) => {
    const entry = {
      rank: row.querySelector('span')!.textContent!.trim(),
      username: row.dataset.username!,
      honor: +row.children.item(2)!.textContent!.replace(/,/g, ''),
      clan: row.children.item(1)!.textContent!.trim()
    };
    return {
      ...usernames,
      [entry.username]: entry,
    };
  }, {});
}

interface Entry {
  rank: string;
  honor: number;
  username: string;
  clan: string;
}

async function getOwnInfo(): Promise<Entry> {
  const response = await fetch(`https://www.codewars.com/users/${USER_NAME}/stats`);
  const document = new JSDOM(await response.text()).window.document;
  return {
    rank: document.querySelector('.stat-container .stat')!.childNodes[1].textContent!,
    honor: +document
      .querySelector('.stat-container .stat:nth-of-type(2)')!
      .childNodes[1].textContent!.replace(/,/g, '')!,
    username: USER_NAME,
    clan: [...document.querySelector('.user-profile .stat-box > .stat:nth-of-type(2)')?.childNodes!]
      .slice(-1)[0]
      ?.textContent!.trim()!,
  };
}

async function downloadClanStats() {
  if (!USER_NAME) return console.error('USER_NAME environment variable not set');
  if (!USER_AGENT) return console.error('USER_AGENT environment variable not set');
  if (!REMEMBER_USER_TOKEN) return console.error('REMEMBER_USER_TOKEN environment variable not set');

  const response = await fetch(`https://www.codewars.com/users/${USER_NAME}/followers`, {
    headers: {
      'User-Agent': USER_AGENT,
      Cookie: 'remember_user_token=' + REMEMBER_USER_TOKEN,
    },
  });
  const rows = parseHTMLUsernames(await response.text());

  let page = 1;
  while (true) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    process.stdout.write(`Page #${page.toString().padStart(2, '0')} \r`);
    const response = await fetch(`https://www.codewars.com/users/${USER_NAME}/allies?page=${page++}`, {
      headers: {
        'x-requested-with': 'XMLHttpRequest',
      },
    });
    const newRows = parseHTMLUsernames(await response.text());
    Object.assign(rows, newRows);
    const length = Object.keys(newRows).length;
    if (!length || length !== 15) break;
  }

  rows[USER_NAME] = await getOwnInfo();

  console.log();
  await fs.promises.writeFile(
    `clan_output/${Date.now()}.json`,
    JSON.stringify(
      Object.values(rows).sort((a, b) => b.honor - a.honor),
      undefined,
      '  ',
    ),
  );
}

async function flattenClanStats() {
  const times = (await fs.promises.readdir('clan_output'))
    .filter(filename => filename.endsWith('.json'))
    .sort()
    .map(filename => +filename.split('.')[0]);

  const end = flattenDate(times.slice(-1)[0]!);
  end.setDate(end.getDate() + 2);

  const collected: Record<string, any> = {};

  let current = flattenDate(times[0]);
  let last = 0;
  while (current.getTime() !== end.getTime()) {
    const currTime = current.getTime();

    for (const time of times) {
      if (time < last) continue;
      if (time > currTime) break;

      for (const user of JSON.parse((await fs.promises.readFile('clan_output/' + time + '.json')).toString())) {
        collected[user.username] = user;
      }
      last = time;
    }
    await fs.promises.writeFile(
      'clan_output/daily/' + currTime + '.json',
      JSON.stringify(
        Object.values(collected).sort((a, b) => b.honor - a.honor),
        null,
        '  ',
      ),
    );

    current.setDate(current.getDate() + 1);
  }
}

(async () => {
  if (!process.argv.includes('--only-flatten')) await downloadClanStats();
  await flattenClanStats();
})().catch(console.error);
