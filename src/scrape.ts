import fs from 'fs';
// @ts-ignore
import fetch from 'node-fetch';
import { JSDOM } from 'jsdom';
require('dotenv').config();

const USER_AGENT = process.env.USER_AGENT;
const REMEMBER_USER_TOKEN = process.env.REMEMBER_USER_TOKEN;
const USERNAME = process.env.USERNAME!;

function parseHTMLUsernames(html: string): Record<string, Entry> {
  return Array.from(new JSDOM(html).window.document.querySelectorAll('tr')).reduce((usernames, row) => {
    const entry = {
      rank: row.querySelector('span')!.textContent!.trim(),
      username: row.dataset.username!,
      honor: +row.children.item(2)!.textContent!,
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
}

async function getOwnInfo(): Promise<Entry> {
  const response = await fetch(`https://www.codewars.com/users/${USERNAME}/stats`);
  const document = new JSDOM(await response.text()).window.document;
  return {
    rank: document.querySelector('.stat-container .stat')!.childNodes[1].textContent!,
    honor: +document.querySelector('.stat-container .stat:nth-of-type(2)')!.childNodes[1].textContent!,
    username: USERNAME,
  };
}

(async () => {
  const response = await fetch(`https://www.codewars.com/users/${USERNAME}/allies`, {
    headers: {
      'User-Agent': USER_AGENT,
      Cookie: 'remember_user_token=' + REMEMBER_USER_TOKEN,
    },
  });
  const rows = parseHTMLUsernames(await response.text());

  let page = 1;
  while (true) {
    process.stdout.write(`${page.toString().padStart(2, '0')} \r`);
    const response = await fetch(`https://www.codewars.com/users/${USERNAME}/allies?page=${page++}`, {
      headers: {
        'x-requested-with': 'XMLHttpRequest',
      },
    });
    const newRows = parseHTMLUsernames(await response.text());
    Object.assign(rows, newRows);
    const length = Object.keys(newRows).length;
    if (!length || length !== 15) break;
  }

  rows[USERNAME] = await getOwnInfo();

  console.log();
  return fs.promises.writeFile(
    `output/${Date.now()}.json`,
    JSON.stringify(
      Object.values(rows).sort((a, b) => b.honor - a.honor),
      undefined,
      '  ',
    ),
  );
})().catch(console.error);
