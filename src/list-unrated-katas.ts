import path from 'path';
import fs from 'fs';
import { fetchKataLanguageInfo, parseKataLanguageInfo } from './helpers';
import type { CompletedKata } from './types';
import { USER_NAME } from './constants';

(async () => {
  const jsonOutputDirectory = path.join('solutions_output', 'json');
  if (!fs.existsSync(jsonOutputDirectory)) return console.error('JSON output does not exist');

  const filenames = await fs.promises.readdir(jsonOutputDirectory);
  if (!filenames.length) return console.error('JSON output directory is empty');

  const katas: CompletedKata[] = JSON.parse(
    (await fs.promises.readFile(path.join(jsonOutputDirectory, filenames[0]))).toString(),
  );

  for (const kata of katas) {
    if (kata.vote) continue;

    const info = parseKataLanguageInfo(await fetchKataLanguageInfo(kata.slug, kata.solutions[0].language), USER_NAME);
    if (info.vote !== null) continue;

    console.log('\t' + kata.title);
    console.log('https://www.codewars.com/kata/' + kata.slug);
  }
})().catch(console.error);
