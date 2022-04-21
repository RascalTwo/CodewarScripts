# Obtain Credentials

- Rename `.env.example` to `.env`.

There are two ways to obtain the needed credentials:

## Manually

- Go to your Codewars profile page
- Add your Username to `.env` as `USER_NAME=Username`
  - Username is last path of the URL: `https://www.codewars.com/users/Username`
- Add your `remember_user_token` cookie value to `.env` as `REMEMBER_USER_TOKEN=remember_user_token`
  - Open DevTools
  - In Firefox
    - Navigate to the `Storage` tab
    - Open the `Cookies` tree
    - Select `https://www.codewars.com`
    - Click the row with `remember_user_token` in the `Name` column
    - Right click the `remember_user_token` that appeared in the pane below
    - Click Copy
  - In Chrome
    - Navigate to the `Application` tab
    - Open the `Cookies` tree
    - Select `https://www.codewars.com`
    - Click the row with `remember_user_token` in the `Name` column
    - Copy the text in the `Cookie Value` pane that appeared below

## `fetch-credentials`

- Add your Email address to `.env` as `EMAIL=<Email Address>`
- Add your Password to `.env` as `PASSWORD=Password`
- Run the command:
  - `npm run fetch-credentials`
- Copy the generated output to the bottom of the `.env` file