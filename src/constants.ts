require('dotenv').config();

export const USER_AGENT = process.env.USER_AGENT!;
export const REMEMBER_USER_TOKEN = process.env.REMEMBER_USER_TOKEN!;
export const USER_NAME = process.env.USER_NAME!;
export const CLAN = process.env.CLAN!;
export const EMAIL = process.env.EMAIL!;
export const PASSWORD = process.env.PASSWORD!;
export const FORMATTER__DAILY_FILES__COMMIT_PER_KATA = process.env.FORMATTER__DAILY_FILES__COMMIT_PER_KATA!
export const FORMATTERS__DISABLE_GIT = process.env.FORMATTERS__DISABLE_GIT!
export const FORMATTERS__SUFFIX_TEST_CODE = process.env.FORMATTERS__SUFFIX_TEST_CODE!
export const FORMATTERS__SEPARATE_FILE_PER_SOLUTION = process.env.FORMATTERS__SEPARATE_FILE_PER_SOLUTION!
export const IGNORE_SOLUTIONS = new Set((process.env.IGNORE_SOLUTIONS! || '').split(',').filter(Boolean))
export const DATABASE_URL = process.env.DATABASE_URL!
export const IS_MONGODB = !!process.env.IS_MONGODB!