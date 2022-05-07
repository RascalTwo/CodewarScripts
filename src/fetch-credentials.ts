import { chromium } from 'playwright';
import { EMAIL, PASSWORD } from './constants';

(async () => {
  if (!EMAIL || !PASSWORD) return console.log('EMAIL & PASSWORD environment variables are required');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto('https://www.codewars.com/users/sign_in', { waitUntil: 'networkidle' });
  await page.locator('[name="user[email]"]').type(EMAIL);
  await page.locator('[name="user[password]"]').type(PASSWORD);
  await page.locator('[type="submit"]').click();

  const { value: remember_user_token } = (await context.cookies()).find(
    cookie => cookie.name === 'remember_user_token',
  )!;
  const username = (await page.locator('#header_profile_link').getAttribute('href'))!.split('/').slice(-1)[0];

  await browser.close();

  console.log(`REMEMBER_USER_TOKEN=${remember_user_token}`);
  console.log(`USER_NAME=${username}`);
})().catch(console.error);
