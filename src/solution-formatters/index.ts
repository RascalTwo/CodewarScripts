import fs from 'fs';
import path from 'path';

import { CompletedKata, CompletedKataFormatter } from '../types';

export default async function formatKatas(katas: Record<string, CompletedKata>, output: string) {
  const formattersDirectory = path.dirname(__filename);
  const requestedSolutionFormatters = (process.argv.find(arg => arg.startsWith('--formatter=')) ?? '=')
    .split('=')[1]
    .split(',')
    .filter(Boolean);
  for (const filename of await fs.promises.readdir(formattersDirectory)) {
    if (filename.startsWith('index')) continue;

    const { DIRECTORY_NAME, default: format }: { DIRECTORY_NAME: string; default: CompletedKataFormatter } =
      await import(path.join(formattersDirectory, filename));
    if (requestedSolutionFormatters.length && !requestedSolutionFormatters.includes(DIRECTORY_NAME)) continue;

    const formattedOutputDirectory = path.join(output, DIRECTORY_NAME);
    if (fs.existsSync(formattedOutputDirectory)) await fs.promises.rm(formattedOutputDirectory, { recursive: true });
    await fs.promises.mkdir(formattedOutputDirectory);

    await format(katas, formattedOutputDirectory);
  }
}
