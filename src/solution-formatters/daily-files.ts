import fs from 'fs';
import path from 'path';
import {
  generateCommentLine,
  getKataURL,
  getLanguageExtension,
  getLanguageName,
  getLastNArgument,
  setEnvironmentVariable,
} from '../helpers';
import { FORMATTERS__DISABLE_GIT, FORMATTER__DAILY_FILES__COMMIT_PER_KATA } from '../constants';

import simpleGit from 'simple-git';

import type { CompletedKata, CompletedKataFormatter, Solution } from '../types';

const formatDay = (date: Date) =>
  `${date.getFullYear()}_${(date.getMonth() + 1).toString().padStart(2, '0')}_${date
    .getDate()
    .toString()
    .padStart(2, '0')}`;

const getSolutionLines = (solution: Solution, kata: CompletedKata) => {
  return [
    ...[kata.rank, kata.title, getKataURL(kata)].map(generateCommentLine.bind(null, solution.language)),
    solution.content,
  ];
};

const dailyFiles: CompletedKataFormatter = async function dailyFiles(katas, directory) {
  const git = simpleGit({ baseDir: directory });
  if (!FORMATTERS__DISABLE_GIT) await git.init();

  let done = 0;
  let total = 0;

  const solutionKatas = new Map<number, CompletedKata>();
  const dates: Record<string, Solution[]> = {};
  for (const kata of Object.values(katas)) {
    for (const solution of kata.solutions) {
      total++;

      const date = formatDay(new Date(solution.when));
      dates[date] = [...(dates[date] || []), solution];
      solutionKatas.set(solution.when, kata);
    }
  }

  const sortAndAddKatas = (solutions: Solution[]) =>
    solutions.sort((a, b) => a.when - b.when).map(solution => ({ solution, kata: solutionKatas.get(solution.when)! }));

  const getFilenameAndPath = (date: string, language: string) => {
    const filename = date + '.' + getLanguageExtension(language);
    return { filename, filepath: path.join(directory, filename) };
  };

  for (const [date, solutions] of Object.entries(dates).sort((a, b) => a[0].localeCompare(b[0]))) {
    if (FORMATTER__DAILY_FILES__COMMIT_PER_KATA) {
      for (const { solution, kata } of sortAndAddKatas(solutions).slice(getLastNArgument())) {
        process.stdout.write(`${((done++ / total) * 100).toFixed(2)}%       \r`);
        const { filename, filepath } = getFilenameAndPath(date, solution.language);
        const lines = getSolutionLines(solution, kata);
        if (!fs.existsSync(filepath)) {
          await fs.promises.writeFile(filepath, lines.join('\n') + '\n');
        } else {
          await fs.promises.appendFile(filepath, '\n\n\n' + lines.join('\n') + '\n');
        }

        if (FORMATTERS__DISABLE_GIT) continue;

        const writeTime = new Date(solution.when).toISOString();

        await setEnvironmentVariable('GIT_COMMITTER_DATE', writeTime, () =>
          git.add(filename).commit(`Add ${date} "${kata.title}" ${getLanguageName(solution.language)} solution`, [], {
            '--date': writeTime,
          }),
        );
      }
    } else {
      const languageSolutions = solutions.reduce((languages, solution) => {
        return {
          ...languages,
          [solution.language]: [...(languages[solution.language] ?? []), solution],
        };
      }, {} as Record<string, Solution[]>);
      for (const [language, solutions] of Object.entries(languageSolutions).sort(
        (a, b) => Math.max(...a[1].map(s => s.when)) - Math.max(...b[1].map(s => s.when)),
      )) {
        const { filename, filepath } = getFilenameAndPath(date, language);

        let solutionLines = [];
        const sortedWithKatas = sortAndAddKatas(solutions).slice(getLastNArgument());
        for (const { solution, kata } of sortedWithKatas) {
          process.stdout.write(`${((done++ / total) * 100).toFixed(2)}%       \r`);

          solutionLines.push(getSolutionLines(solution, kata));
        }
        await fs.promises.writeFile(filepath, solutionLines.join('\n\n\n'));

        if (FORMATTERS__DISABLE_GIT) continue;

        const writeTime = new Date(sortedWithKatas.slice(-1)[0]!.solution.when).toISOString();
        await setEnvironmentVariable('GIT_COMMITTER_DATE', writeTime, () =>
          git
            .add(filename)
            .commit(
              `Add ${date} ${getLanguageName(language)} challenge${sortedWithKatas.length === 1 ? '' : 's'}`,
              [],
              {
                '--date': writeTime,
              },
            ),
        );
      }
    }
  }

  console.log();
};

export const DIRECTORY_NAME = 'daily-files';
export default dailyFiles;
