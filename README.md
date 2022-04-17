# Codewars Scripts

Various scripts for saving data from your Codewars account.

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

> There exists a `.env.example` you can use as a template for your own `.env` file, which will read environment variables from automatically.

## Scripts

### Fetch Credentials

If you'd rather not manually obtain your `USER_NAME` and `REMEMBER_USER_TOKEN` values, you can instead set the `EMAIL` and `PASSWORD` environment variables to have these fetched for you.

> npm run fetch-credentials

### Download Solutions

Download all your solutions to `solutions_output` in various formats

```shell
npm run download-solutions
```

> Automatically runs solution formatter script after

***

To ignore some solutions, you can copy the `datetime` from it's `<time-ago>` HTML element:

```html
<time-ago datetime="2000-01-01T05:00:00.000+0000" ...>XYZ ago</time-ago>
```

and add these to the `IGNORE_SOLUTIONS` environment variable comma-seperated.

### Download Clan Stats

Download your clan stats as a new JSON to `clan_output`

```shell
npm run download-clan-stats
```

### Format Solutions

Formats the raw solutions into various formats, each in a directory within `solutions_output`.

```shell
npm run format-solutions
```

> The `--formatters=` CLI argument can be used to supply a comma-separated list of solutions to generate, based on the output directory names.

#### Formats

If the formatters are running too slow, or you wish to not create git repositories, you can set the `FORMATTERS__DISABLE_GIT` environment variable.

When applicable, formatters will append the test code from the Kata to the solution code; this can be disabled by clearing the `FORMATTERS__SUFFIX_TEST_CODE` environment variable.

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
