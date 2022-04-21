# Get Solution Files

- [Download Solutions](./download-solutions.md)
- Ensure `FORMATTERS__DISABLE_GIT=` has no value in `.env`
- If you don't want the test code included with your code, ensure `FORMATTERS__SUFFIX_TEST_CODE=` has no value in `.env`
- If you want only a single commit for daily commit files, enture `FORMATTER__DAILY_FILES__COMMIT_PER_KATA` has no value in `.env`
- Run the command:
  - `npm run format-solutions`
- Find your `git` repos in `solutions_output`

## Push to Remote

The repositories are deleted and created new each time, so the remote must be manually re-added and forcefully pushed.

> git remote add origin https://github.com/Username/Repository.git
> git push --force
