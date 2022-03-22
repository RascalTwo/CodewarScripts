import fs from 'fs';
import path from 'path';
import { generateCommentLine, getKataURL, getLanguageExtension } from '../helpers';

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

  const solutionKatas = new Map<number, CompletedKata>();
  const dates: Record<string, Solution[]> = {};
  for (const kata of Object.values(katas)) {
    for (const solution of kata.solutions) {
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
      let solutionLines = [];
      const sortedWithKatas = solutions
        .sort((a, b) => a.when - b.when)
        .map(solution => ({ solution, kata: solutionKatas.get(solution.when)! }));
      for (const { solution, kata } of sortedWithKatas) {
        solutionLines.push(
          [
            ...[kata.rank, kata.title, getKataURL(kata)].map(generateCommentLine.bind(null, language)),
            solution.content,
          ].join('\n'),
        );
      }

      const filename = date + '.' + getLanguageExtension(language);
      await fs.promises.writeFile(path.join(directory, filename), solutionLines.join('\n\n\n'));

      const writeTime = new Date(sortedWithKatas.at(-1)!.solution.when).toISOString();
      const oldValue = process.env.GIT_COMMITTER_DATE;
      process.env.GIT_COMMITTER_DATE = writeTime;
      await git.add(filename).commit(`Add ${date} challenges`, [], {
        '--date': writeTime,
      });
      process.env.GIT_COMMITTER_DATE = oldValue;
    }
  }
};

export const DIRECTORY_NAME = 'daily-files';
export default dailyFiles;
