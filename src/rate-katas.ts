import path from 'path';
import fs from 'fs';
import { fetchKataLanguageInfo, getKataLanguageInfo, getKataURL, parseKataLanguageInfo } from './helpers';
import type { CompletedKata } from './types';
import { EMAIL, PASSWORD, USER_NAME } from './constants';
import { chromium } from 'playwright';
import formatKatas from './solution-formatters';

(async () => {
  if (!EMAIL || !PASSWORD) return console.log('EMAIL & PASSWORD environment variables are required');

  const jsonOutputDirectory = path.join('solutions_output', 'json');
  if (!fs.existsSync(jsonOutputDirectory)) return console.error('JSON output does not exist');

  const filenames = await fs.promises.readdir(jsonOutputDirectory);
  if (!filenames.length) return console.error('JSON output directory is empty');

  const katas: CompletedKata[] = JSON.parse(
    (await fs.promises.readFile(path.join(jsonOutputDirectory, filenames[0]))).toString(),
  );

  const unratedKatas = katas.filter(({ vote }) => vote === null);
  if (!unratedKatas.length) return console.log('No unrated katas found');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto('https://www.codewars.com/users/sign_in', { waitUntil: 'networkidle' });
  await page.locator('[name="user[email]"]').type(EMAIL);
  await page.locator('[name="user[password]"]').type(PASSWORD);
  await page.locator('[type="submit"]').click();

  for (const kata of unratedKatas) {
    console.log('\t' + kata.title);
    const url = getKataURL(kata) + '/solutions/' + kata.solutions[0].language
    console.log(url);
    await page.goto(url);

    await page.locator('#solutions').click();

    await page.locator(`.vote-assessment li[data-value="${1}"]`).click();
  }

  await browser.close();

  for (const kata of unratedKatas) {
    kata.vote = (await getKataLanguageInfo(kata.slug, kata.solutions[0].language, USER_NAME, false)).vote;
  }

  process.argv.unshift('--formatters=json');
  return formatKatas(
    katas.reduce((map, kata) => ({ ...map, [kata.slug]: kata }), {}),
    './solutions_output',
  );
})().catch(console.error);
