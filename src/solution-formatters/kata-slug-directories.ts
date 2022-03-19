import fs from 'fs';
import path from 'path';

import { CompletedKataFormatter, Solution } from '../types';

const LANGUAGE_EXTENSIONS: Record<string, string> = {
  javascript: 'js',
  typescript: 'ts',
  python: 'py',
  java: 'java',
};

const solutionFilename = (solution: Solution) => `${solution.language}.${LANGUAGE_EXTENSIONS[solution.language]}`;

const capitalize = (string: string) => string[0].toUpperCase() + string.slice(1);

const kataSlugDirectories: CompletedKataFormatter = async function kataSlugDirectories(katas, directory) {
  for (const dir of await fs.promises.readdir(directory)) {
    await fs.promises.rm(path.join(directory, dir), { recursive: true });
  }

  for (const kata of Object.values(katas)) {
    const kataDir = path.join(directory, kata.slug);
    await fs.promises.mkdir(kataDir);
    for (const solution of Object.values(
      kata.solutions.reduce((lang, sol) => {
        const existing = lang[sol.language];
        return {
          ...lang,
          [sol.language]: existing && existing.when > sol.when ? existing : sol,
        };
      }, {} as Record<string, Solution>),
    )) {
      await fs.promises.writeFile(path.join(kataDir, solutionFilename(solution)), solution.content);
    }
    await fs.promises.writeFile(
      path.join(kataDir, 'README.md'),
      `# ${kata.rank} [${kata.title}]((https://www.codewars.com/kata/${kata.slug}))\n\n` +
        [...new Set(kata.solutions.map(sol => `[${capitalize(sol.language)}](./${solutionFilename(sol)})`))].join('\n'),
    );
  }
};

export const DIRECTORY_NAME = 'katas';
export default kataSlugDirectories;
