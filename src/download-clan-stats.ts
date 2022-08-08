import fs from 'fs';
// @ts-ignore
import fetch from 'node-fetch';
import { JSDOM } from 'jsdom';
import { USER_NAME, USER_AGENT, REMEMBER_USER_TOKEN, CLAN, DATABASE_URL } from './constants';
import { delay, numericRankToName } from './helpers';
import { insertNewClanStats } from './database';

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

export interface Entry {
  rank: string;
  honor: number;
  username: string;
  clan: string;
}

async function getOwnInfo(userName: string): Promise<Entry> {
  const response = await fetch(`https://www.codewars.com/users/${userName}/stats`);
  const document = new JSDOM(await response.text()).window.document;
  return {
    rank: document.querySelector('.stat-container .stat')!.childNodes[1].textContent!,
    honor: +document
      .querySelector('.stat-container .stat:nth-of-type(2)')!
      .childNodes[1].textContent!.replace(/,/g, '')!,
    username: userName,
    clan: [...document.querySelector('.user-profile .stat-box > .stat:nth-of-type(2)')?.childNodes!]
      .slice(-1)[0]
      ?.textContent!.trim()!,
  };
}

export async function useAPI(clan: string) {
  console.log('Attempting to download Clan stats using the API...');

  const rows: Record<string, Entry> = {}

  let failures: Record<number, number> = {}
  let totalPages = 1;
  for (let page = 0; page <= totalPages; page++){
    await delay(2500);
    process.stdout.write(`Page #${page.toString().padStart(2, '0')} \r`);
    const response = await fetch(`https://www.codewars.com/api/v1/clans/${encodeURIComponent(clan)}/members?page=${page}`);
    const payload: { success: false, reason: string } | {
      totalPages: number,
      totalItems: number,
      data: {
        id: string,
        username: string,
        honor: number,
        rank: number,
      }[],
    } = await response.json();
    if ('success' in payload){
      console.error('API Error:', payload.reason);

      if (!(page in failures)) failures[page] = 0;
      failures[page]++;
      if (failures[page] > 5){
        console.error('Failed on this page five times, giving up');
        return;
      }

      page--;
      await delay(10000);
      continue
    }
    totalPages = payload.totalPages;
    for (const { username, honor, rank } of payload.data) {
      rows[username] = {
        username, honor,
        clan,
        rank: numericRankToName(rank),
      };
    }
  }

  console.log();

  return rows;
}

export async function useAllies(userName: string, userAgent: string, rememberUserToken: string) {
  console.log('Attempting to download Clan stats using allies page...');

  const response = await fetch(`https://www.codewars.com/users/${userName}/followers`, {
    headers: {
      'User-Agent': userAgent,
      Cookie: 'remember_user_token=' + rememberUserToken,
    },
  });
  const rows = parseHTMLUsernames(await response.text());

  let page = 1;
  while (true) {
    await delay(2500);
    process.stdout.write(`Page #${page.toString().padStart(2, '0')} \r`);
    const response = await fetch(`https://www.codewars.com/users/${userName}/allies?page=${page++}`, {
      headers: {
        'x-requested-with': 'XMLHttpRequest',
      },
    });
    const newRows = parseHTMLUsernames(await response.text());
    Object.assign(rows, newRows);
    const length = Object.keys(newRows).length;
    if (!length || length !== 15) break;
  }

  rows[userName] = await getOwnInfo(userName);

  console.log();

  return rows;
}

export async function flattenClanStats() {
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

if (require.main === module) (async () => {
  if (!process.argv.includes('--only-flatten')) {
    const useDirective = process.argv.find(arg => arg.startsWith('--use'))

    const first = useDirective && useDirective.endsWith('allies') ? useAllies : useAPI;
    const executing = [first, first === useAPI ? useAllies : useAPI];
    for (const func of executing) {
      let data;
      if (func === useAPI) {
        if (!CLAN) console.error('CLAN environment variable not set');
        else data = await useAPI(CLAN);
      } else if (func === useAllies) {
        if (!USER_NAME) console.error('USER_NAME environment variable not set');
        else if (!USER_AGENT) console.error('USER_AGENT environment variable not set');
        else if (!REMEMBER_USER_TOKEN) console.error('REMEMBER_USER_TOKEN environment variable not set');
        else data = await useAllies(USER_NAME, USER_AGENT, REMEMBER_USER_TOKEN);
      }

      if (!data) continue;
      const now = Date.now();
      await fs.promises.writeFile(
        'clan_output/' + now + '.json',
        JSON.stringify(
          Object.values(data).sort((a, b) => b.honor - a.honor),
          null,
          '  ',
        ),
      );
      if (DATABASE_URL) await insertNewClanStats(data, now).catch(err => console.error('Database Error:', err));
      break;
    }
  }
  await flattenClanStats();
})().catch(console.error);
