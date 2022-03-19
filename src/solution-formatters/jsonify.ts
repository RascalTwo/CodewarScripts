import fs from 'fs';
import path from 'path';

import { CompletedKataFormatter } from '../types';

const jsonify: CompletedKataFormatter = async function jsonify(katas, directory) {
  return fs.promises.writeFile(
    path.join(directory, `${Date.now()}.json`),
    JSON.stringify(
      Object.values(katas).sort((a, b) => {
        const [at, bt] = [a, b].map(c => Math.min(...c.solutions.map(s => s.when.getTime())));
        return at - bt;
      }),
      undefined,
      '  ',
    ),
  );
};

export const DIRECTORY_NAME = 'json';
export default jsonify;
