import fs from 'fs';
import path from 'path';

import { CompletedKata, CompletedKataFormatter } from '../types';

const ORDER = ['jsonify.js', 'jsonify.ts']

export default async function formatKatas(katas: Record<string, CompletedKata>, output: string) {
  const formattersDirectory = path.dirname(__filename);
  const requestedSolutionFormatters = (process.argv.find(arg => arg.startsWith('--formatters=')) ?? '=')
    .split('=')[1]
    .split(',')
    .filter(Boolean);
  for (const filename of (await fs.promises.readdir(formattersDirectory)).sort((a, b) => ORDER.indexOf(b) - ORDER.indexOf(a))) {
    if (filename.startsWith('index') || filename.endsWith('.d.ts') || filename.endsWith('.map')) continue;

    const { DIRECTORY_NAME, default: format }: { DIRECTORY_NAME: string; default: CompletedKataFormatter } =
      await import(path.join(formattersDirectory, filename));
    if (requestedSolutionFormatters.length && !requestedSolutionFormatters.includes(DIRECTORY_NAME)) continue;

    const formattedOutputDirectory = path.join(output, DIRECTORY_NAME);
    console.log('Starting', filename.split('.')[0], '...');
    if (fs.existsSync(formattedOutputDirectory)) await fs.promises.rm(formattedOutputDirectory, { recursive: true });
    await fs.promises.mkdir(formattedOutputDirectory);

    await format(katas, formattedOutputDirectory);
    console.log('Finished', filename.split('.')[0]);
  }
}
