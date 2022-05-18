# Codewars Scripts

Various scripts for saving data from your Codewars account.

> Exclusively Tested with Node v16

## Guides

I just want to...

- [Download my Solutions](./guide/download-solutions.md)
- [Get my Solution Files](./guide/get-solution-files.md)
- [Download clan stats](./guide/download-clan-stats.md)
- [Generate my dated `git` repository](./guide/create-solutions-repo.md)

## Setup

To get the scripts ready to run, execute:

```shell
npm install
npm run build
```

***

These environment variables are needed to allow the scripts to access your pages:

```shell
USER_AGENT=Your User Agent
REMEMBER_USER_TOKEN=Value of `remember_user_token` Cookie
USER_NAME=Your Username
```

> There exists a `.env.example` you can use as a template for your own `.env` file, which the program will read environment variables from automatically.

## Scripts

The argument `--last-n-solutions=X` can be used to only process the last N solutions.

### Fetch Credentials

If you'd rather not manually obtain your `USER_NAME` and `REMEMBER_USER_TOKEN` values, you can instead set the `EMAIL` and `PASSWORD` environment variables to have these fetched for you.

> npm run fetch-credentials

This generates the output in this format:

> REMEMBER_USER_TOKEN=hfbasoluihbfadsihbfaidsiajkbfidsayhufasdbihyfasdbfiuyhasdbfihuyadbfaidsuyvaiusbfiasduhfbasdiufbadsiuyfbasdiufsduaisuhiahbiuadbsaidbsfukhibisadubfisadbfisadfsdafsadjbfajksibfasdkijbsdalfhuvbadgsfhyavdsfhavbadvhbflahgbqwiyhufdsafsdfdassfadsfasdfdasfsdfasdfsadfasdfasdfasdfasdfrpqiuwyreieqwhjksabf
> USER_NAME=YourUserName

which you can then copy to your environment variables to allow other scripts to execute.

### Download Solutions

Download all your solutions to `solutions_output` in JSON format.

```shell
npm run download-solutions
```

> Automatically runs solution formatter script after

***

To ignore some solutions, you can copy the `datetime` from it's `<time-ago>` HTML element:

```html
<time-ago datetime="2000-01-01T05:00:00.000+0000" ...>XYZ ago</time-ago>
```

and add these to the `IGNORE_SOLUTIONS` environment variable comma-separated.

### Format Solutions

Formats the raw solutions into various formats, each in a directory within `solutions_output`.

```shell
npm run format-solutions
```

> The `--formatters=` CLI argument can be used to supply a comma-separated list of solutions to generate, based on the output directory names.

#### Formats

If the formatters are running too slow, or you wish to not create git repositories, you can set the `FORMATTERS__DISABLE_GIT` environment variable.

When applicable, formatters will append the test code from the Kata to the solution code; this can be disabled by clearing the `FORMATTERS__SUFFIX_TEST_CODE` environment variable.

Another configurable is the `FORMATTERS__SEPARATE_FILE_PER_SOLUTION` environment variable, which for applicable formatters, creates a separate file for each different solution of the same language, instead of overriding the first solutions with the latest one.

##### `json`

A epoch-names JSON file with the raw solution data.

Internally used for caching of solutions, allowing re-execution without redownloading solution data.

##### `daily-files`

A `YYYY_MM_DD.EXT` named file for every day a kata was done, with the latest solutions at the bottom.

Creates a git repo with all commits properly dated to match the solution creation time.

The `FORMATTER__DAILY_FILES__COMMIT_PER_KATA` environment variable determines if it's a single commit per file, or a commit per kata.

##### `katas`

- `kata-id`
  - `language.ext`
  - `README.md`
    - The basic Kata information, relative markdown links to each solution file, and description from the first language the Fata was solved in.

Creates a git repo with all commits properly dated to match the solution creation time.

### Download Clan Stats

Download your clan stats as a new JSON to `clan_output`

```shell
npm run download-clan-stats
```

### Estimate Honor & Score

Attempt to calculate using only publicly-available information, therefore requires no credentials.

```shell
npm run estimate-honor-and-score <Username> [When]
```

If time is not provided, then it estimates the users Honor & Score at the current time.

### List Unrated Katas

As rating a kata gains you an honor per kata, knowing which katas you have not rated is useful information to know.

```shell
npm run list-unrated-kata
```

This will traverse all your downloaded solutions, outputting the ones that have not been rated.

### Rate Katas

Rating a large number of katas can be tedious, with this script you can programmatically select your rating for each kata individually.

> Run [List Unrated Katas](###List-Unrated-Katas) with caching disabled to get an accurate updated list of katas to rate.

```shell
npm run rate-katas
```

This will traverse all your downloaded solutions, rating the katas you select.
