import fs from 'fs';
import path from 'path';
import { generateCommentLine, getKataURL, getLanguageExtension, setEnvironmentVariable } from '../helpers';
import { FORMATTER__DAILY_FILES__COMMIT_PER_KATA } from '../constants';

import simpleGit, { SimpleGit, SimpleGitOptions } from 'simple-git';

import { CompletedKata, CompletedKataFormatter, Solution } from '../types';

const formatDay = (date: Date) =>
  `${date.getFullYear()}_${(date.getMonth() + 1).toString().padStart(2, '0')}_${date
    .getDate()
    .toString()
    .padStart(2, '0')}`;

const dailyFiles: CompletedKataFormatter = async function dailyFiles(katas, directory) {
  const git = simpleGit({ baseDir: directory });
  await git.init();

  let done = 0;
  let total = 0

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

  for (const [date, solutions] of Object.entries(dates).sort((a, b) => a[0].localeCompare(b[0]))) {
    const languageSolutions = solutions.reduce((languages, solution) => {
      return {
        ...languages,
        [solution.language]: [...(languages[solution.language] ?? []), solution],
      };
    }, {} as Record<string, Solution[]>);
    for (const [language, solutions] of Object.entries(languageSolutions)) {
      const filename = date + '.' + getLanguageExtension(language);
      const filepath = path.join(directory, filename);

      let solutionLines = [];
      const sortedWithKatas = solutions
        .sort((a, b) => a.when - b.when)
        .map(solution => ({ solution, kata: solutionKatas.get(solution.when)! }));
      for (const { solution, kata } of sortedWithKatas) {
        process.stdout.write(`${((done++ / total) * 100).toFixed(2)}%       \r`);

        solutionLines.push(
          [
            ...[kata.rank, kata.title, getKataURL(kata)].map(generateCommentLine.bind(null, language)),
            solution.content,
          ].join('\n'),
        );
        if (!FORMATTER__DAILY_FILES__COMMIT_PER_KATA) continue;

        await fs.promises.writeFile(filepath, solutionLines.join('\n\n\n'));

        const writeTime = new Date(solution.when).toISOString();

        await setEnvironmentVariable('GIT_COMMITTER_DATE', writeTime, () =>
          git.add(filename).commit(`Add "${kata.title}" challenge`, [], {
            '--date': writeTime,
          }),
        );
      }

      if (FORMATTER__DAILY_FILES__COMMIT_PER_KATA) continue;

      await fs.promises.writeFile(filepath, solutionLines.join('\n\n\n'));

      const writeTime = new Date(sortedWithKatas.at(-1)!.solution.when).toISOString();
      await setEnvironmentVariable('GIT_COMMITTER_DATE', writeTime, () =>
        git.add(filename).commit(`Add ${date} challenge${sortedWithKatas.length === 1 ? '' : 's'}`, [], {
          '--date': writeTime,
        }),
      );
    }
  }

  console.log()
};

export const DIRECTORY_NAME = 'daily-files';
export default dailyFiles;
