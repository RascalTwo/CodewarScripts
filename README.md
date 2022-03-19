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
REMEMBER_USER_TOKEN=Value of `remember_user_token` Cookie
USER_AGENT=Your User Agent
USER_NAME=Your Username
```

## Scripts

### Download Solutions

Download all your solutions to `solutions_output` in various formats

```shell
npm run download-solutions
```

### Download Clan Stats

Download your clan stats as a new JSON to `clan_output`

```shell
npm run download-clan-stats
```
