import fs from 'fs';
import path from 'path';
import simpleGit from 'simple-git';
import { FORMATTERS__DISABLE_GIT, FORMATTERS__SUFFIX_TEST_CODE } from '../constants';
import { languageFilename, capitalize, getKataURL, setEnvironmentVariable, getLanguageName, formatLanguageTestCode } from '../helpers';

import { CompletedKata, CompletedKataFormatter, Solution } from '../types';

const kataSlugDirectories: CompletedKataFormatter = async function kataSlugDirectories(katas, directory) {
  const git = simpleGit({ baseDir: directory });
  if (!FORMATTERS__DISABLE_GIT) await git.init();

  let done = 0;
  let total = 0;

  const solutionKatas = new Map<number, CompletedKata>();
  const solutions: Solution[] = [];
  for (const kata of Object.values(katas)) {
    for (const solution of kata.solutions) {
      total++;
      solutionKatas.set(solution.when, kata);
      solutions.push(...kata.solutions);
    }
  }

  for (const solution of solutions.sort((a, b) => a.when - b.when)) {
    process.stdout.write(`${((done++ / total) * 100).toFixed(2)}%       \r`);

    const kata = solutionKatas.get(solution.when)!;
    const kataDir = path.join(directory, kata.slug);

    const firstOfKata = !fs.existsSync(kataDir);

    const languagePath = path.join(kataDir, languageFilename(solution.language));
    const firstOfLanguage = !fs.existsSync(languagePath);
    if (firstOfKata) await fs.promises.mkdir(kataDir);
    await fs.promises.writeFile(
      languagePath,
      solution.content + (FORMATTERS__SUFFIX_TEST_CODE ? '\n\n\n' + formatLanguageTestCode(solution.language, kata.info[solution.language].testCode) : ''),
    );

    const readmePath = path.join(kataDir, 'README.md');
    const languageMarkdownLink = `[${capitalize(solution.language)}](./${languageFilename(solution.language)})`;
    if (firstOfKata) {
      await fs.promises.writeFile(
        readmePath,
        `# ${kata.rank} [${kata.title}](${getKataURL(kata)})\n\n<!-- START LANGUAGE_LINKS -->\n\n` +
          languageMarkdownLink +
          '\n\n<!-- END LANGUAGE_LINKS -->\n\n' +
          kata.info[solution.language].description,
      );
    } else if (firstOfLanguage) {
      const currentContent = (await fs.promises.readFile(readmePath)).toString();
      const oldLinks = currentContent.split('<!-- START LANGUAGE_LINKS -->')[1].split('<!-- END LANGUAGE_LINKS -->')[0];
      await fs.promises.writeFile(
        readmePath,
        currentContent.replace(oldLinks, oldLinks + languageMarkdownLink + '\n\n'),
      );
    }

    if (FORMATTERS__DISABLE_GIT) continue;
    const writeTime = new Date(solution.when).toISOString();
    await setEnvironmentVariable('GIT_COMMITTER_DATE', writeTime, () =>
      git
        .add([path.join(kata.slug, 'README.md'), path.join(kata.slug, languageFilename(solution.language))])
        .commit(`Add "${kata.title}" ${getLanguageName(solution.language)} solution`, [], {
          '--date': writeTime,
        }),
    );
  }
  console.log();
};

export const DIRECTORY_NAME = 'katas';
export default kataSlugDirectories;
