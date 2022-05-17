import path from 'path';
import fs from 'fs';
import { fetchKataLanguageInfo, parseKataLanguageInfo } from './helpers';
import type { CompletedKata } from './types';
import { REMEMBER_USER_TOKEN, USER_NAME } from './constants';

async function setKataVote(kata: CompletedKata, vote: -1 | 0 | 1 | null, username: string) {
  const { csrfToken, voteID } = parseKataLanguageInfo(
    await fetchKataLanguageInfo(kata.slug, kata.solutions[0].language), username
  );
}

(async () => {
  const jsonOutputDirectory = path.join('solutions_output', 'json');
  if (!fs.existsSync(jsonOutputDirectory)) return console.error('JSON output does not exist');

  const filenames = await fs.promises.readdir(jsonOutputDirectory);
  if (!filenames.length) return console.error('JSON output directory is empty');

  const katas: CompletedKata[] = JSON.parse(
    (await fs.promises.readFile(path.join(jsonOutputDirectory, filenames[0]))).toString(),
  );

  for (const kata of katas) {
    if (kata.vote === null) {
      const html = await fetchKataLanguageInfo(kata.slug, kata.solutions[0].language);
      const info = parseKataLanguageInfo(html, USER_NAME);
      if (info.vote === null) console.log('https://www.codewars.com/kata/' + kata.slug);
    }
  }
})().catch(console.error);
