import fs from 'fs';
import path from 'path';
import { generateCommentLine, getKataURL, getLanguageExtension } from '../helpers';

import { CompletedKata, CompletedKataFormatter, Solution } from '../types';

const formatDay = (date: Date) =>
  `${date.getFullYear()}_${(date.getMonth() + 1).toString().padStart(2, '0')}_${date
    .getDate()
    .toString()
    .padStart(2, '0')}`;

const dailyFiles: CompletedKataFormatter = async function dailyFiles(katas, directory) {
  const solutionKatas = new Map<number, CompletedKata>();
  const dates: Record<string, Solution[]> = {};
  for (const kata of Object.values(katas)) {
    for (const solution of kata.solutions) {
      const date = formatDay(new Date(solution.when));
      dates[date] = [...(dates[date] || []), solution];
      solutionKatas.set(solution.when, kata);
    }
  }
  for (const [date, solutions] of Object.entries(dates)) {
    const languageSolutions = solutions.reduce((languages, solution) => {
      return {
        ...languages,
        [solution.language]: [...(languages[solution.language] ?? []), solution],
      };
    }, {} as Record<string, Solution[]>);
    for (const [language, solutions] of Object.entries(languageSolutions)) {
      let solutionLines = [];
      for (const { solution, kata } of solutions
        .sort((a, b) => a.when - b.when)
        .map(solution => ({ solution, kata: solutionKatas.get(solution.when)! }))) {
        solutionLines.push(
          [
            ...[kata.rank, kata.title, getKataURL(kata)].map(generateCommentLine.bind(null, language)),
            solution.content,
          ].join('\n'),
        );
      }

      await fs.promises.writeFile(
        path.join(directory, date + '.' + getLanguageExtension(language)),
        solutionLines.join('\n\n\n'),
      );
    }
  }
};

export const DIRECTORY_NAME = 'daily-files';
export default dailyFiles;
