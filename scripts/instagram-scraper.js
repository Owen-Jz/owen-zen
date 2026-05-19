const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const SESSION_ID = '54003903307%3AJdz6NWVSESaxos%3A29%3AAYg0wCNPvWI2zhF93SkQCmFnzIAjzZ5BHlP9MjCm3A';
const CSRF_TOKEN = 'xWAxQhvHf4rNuWUEoUstC7DDozTP0xsm';
const DS_USER_ID = '54003903307';
const INSTAGRAM_USERNAME = 'closetfullofcoco_';
const INSTAGRAM_URL = `https://www.instagram.com/${INSTAGRAM_USERNAME}/`;
const OUTPUT_FILE = 'instagram-posts.csv';

const MAX_SCROLLS = 100;
const MAX_CONSECUTIVE_EMPTY_SCROLLS = 3;
const MAX_RETRIES = 3;
const RETRY_BACKOFF_MS = 3000;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function withRetry(fn, description) {
  let lastError;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      console.error(`Attempt ${attempt}/${MAX_RETRIES} failed for ${description}: ${err.message}`);
      if (attempt < MAX_RETRIES) {
        console.error(`Retrying in ${RETRY_BACKOFF_MS}ms...`);
        await sleep(RETRY_BACKOFF_MS);
      }
    }
  }
  throw lastError;
}

async function main() {
  console.log('Launching headless Chromium...');
  const browser = await withRetry(async () => {
    return await chromium.launch({ headless: true });
  }, 'browser launch');

  const context = await browser.newContext();
  const page = await context.newPage();

  // Set a realistic user agent
  await page.setExtraHTTPHeaders({
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  });

  console.log('Injecting session cookies...');
  await page.context().addCookies([
    {
      name: 'sessionid',
      value: SESSION_ID,
      domain: '.instagram.com',
      path: '/',
      httpOnly: true,
      secure: true,
    },
    {
      name: 'csrftoken',
      value: CSRF_TOKEN,
      domain: '.instagram.com',
      path: '/',
      httpOnly: false,
      secure: true,
    },
    {
      name: 'ds_user_id',
      value: DS_USER_ID,
      domain: '.instagram.com',
      path: '/',
      httpOnly: false,
      secure: true,
    },
  ]);

  console.log(`Navigating to ${INSTAGRAM_URL}...`);
  const response = await withRetry(async () => {
    return await page.goto(INSTAGRAM_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
  }, 'page navigation');

  const finalUrl = page.url();
  console.log(`Final URL after navigation: ${finalUrl}`);

  // Check for session expiry (redirected to login)
  if (finalUrl.includes('login') || finalUrl.includes('accounts/login')) {
    await browser.close();
    console.error('ERROR: Session expired — Instagram redirected to login page. Please refresh your session cookies and try again.');
    process.exit(1);
  }

  // Check for profile not found (404)
  if (response && response.status() === 404) {
    await browser.close();
    console.error(`ERROR: Profile not found (404) for username "${INSTAGRAM_USERNAME}". Please check the username and try again.`);
    process.exit(1);
  }

  // Wait a bit for JS to bootstrap
  await sleep(3000);

  // Check for special "not found" text on page
  const pageText = await page.textContent('body').catch(() => '');
  if (pageText.includes('Sorry, this page') || pageText.includes('Page Not Found') || pageText.includes('no longer available')) {
    await browser.close();
    console.error(`ERROR: Profile not found — Instagram shows "Sorry, this page" for "${INSTAGRAM_USERNAME}".`);
    process.exit(1);
  }

  console.log('Scrolling through posts...');
  const seenPostUrls = new Set();
  let consecutiveEmptyScrolls = 0;

  for (let scrollNum = 1; scrollNum <= MAX_SCROLLS; scrollNum++) {
    // Scroll to bottom
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });
    await sleep(2000);

    // Extract post URLs from the grid (look for links matching /p/[ID]/)
    const postLinks = await page.$$eval('a[href*="/p/"]', links =>
      links.map(link => link.getAttribute('href'))
    ).catch(() => []);

    let newPostsFound = 0;
    for (const href of postLinks) {
      // Match /p/[ID]/ pattern
      const match = href.match(/\/p\/([A-Za-z0-9_-]+)\//);
      if (match) {
        const postId = match[1];
        const fullUrl = `https://www.instagram.com/p/${postId}/`;
        if (!seenPostUrls.has(fullUrl)) {
          seenPostUrls.add(fullUrl);
          newPostsFound++;
        }
      }
    }

    console.log(`Scroll ${scrollNum}/${MAX_SCROLLS}: found ${seenPostUrls.size} unique posts (${newPostsFound} new this scroll)`);

    // Track consecutive empty scrolls
    if (newPostsFound === 0) {
      consecutiveEmptyScrolls++;
    } else {
      consecutiveEmptyScrolls = 0;
    }

    // Stop after 3 consecutive scrolls with no new posts
    if (consecutiveEmptyScrolls >= MAX_CONSECUTIVE_EMPTY_SCROLLS) {
      console.log(`Stopping: ${MAX_CONSECUTIVE_EMPTY_SCROLLS} consecutive scrolls with no new posts.`);
      break;
    }

    // Quick check: if no post links at all and we've scrolled at least once, we might be at an empty/private profile
    if (postLinks.length === 0 && seenPostUrls.size === 0 && scrollNum >= 3) {
      await browser.close();
      console.error(`ERROR: Empty profile — no posts found for "${INSTAGRAM_USERNAME}". The profile may have no posts or be private.`);
      process.exit(1);
    }
  }

  await browser.close();

  if (seenPostUrls.size === 0) {
    console.error(`ERROR: No posts extracted from "${INSTAGRAM_USERNAME}". The profile may be empty or private.`);
    process.exit(1);
  }

  // Write CSV
  const sortedUrls = Array.from(seenPostUrls).sort();
  const csvLines = ['post_url', ...sortedUrls];
  const csvContent = csvLines.join('\n');

  const outputPath = path.join(process.cwd(), OUTPUT_FILE);
  fs.writeFileSync(outputPath, csvContent, 'utf8');

  console.log(`\nDone! Extracted ${seenPostUrls.size} unique post URLs.`);
  console.log(`Written to: ${outputPath}`);
}

main().catch(err => {
  console.error('Unhandled error:', err);
  process.exit(1);
});