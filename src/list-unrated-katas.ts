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

  const disableCache = process.argv.includes('--disable-cache')
  console.log()
  for (const [i, kata] of katas.entries()) {
    process.stdout.write(`${((i / katas.length) * 100).toFixed(2)}%      \r`);

    if (!disableCache && kata.vote !== null) continue;

    const cachePath = path.join('cache', `${kata.slug}-${kata.solutions[0].language}.html`);
    const html = await fetchKataLanguageInfo(kata.slug, kata.solutions[0].language);

    await fs.promises.writeFile(cachePath, html);
    const info = parseKataLanguageInfo(html, USER_NAME);
    if (info.vote !== null) continue;

    console.log()
    console.log('\t' + kata.title);
    console.log('https://www.codewars.com/kata/' + kata.slug);
    console.log()
  }
})().catch(console.error);
