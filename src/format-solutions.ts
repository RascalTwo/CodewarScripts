import fs from 'fs';
import path from 'path';

import formatKatas from './solution-formatters';

(async () => {
  const jsonOutputDirectory = path.join('solutions_output', 'json');
  if (!fs.existsSync(jsonOutputDirectory)) return console.error('JSON output does not exist');

  const filenames = await fs.promises.readdir(jsonOutputDirectory);
  if (!filenames.length) return console.error('JSON output directory is empty');

  const katas = JSON.parse((await fs.promises.readFile(path.join(jsonOutputDirectory, filenames[0]))).toString());
  return formatKatas(katas, './solutions_output');
})().catch(console.error);
