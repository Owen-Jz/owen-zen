const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const SESSION_ID = process.env.INSTAGRAM_SESSION_ID || '54003903307%3AJdz6NWVSESaxos%3A29%3AAYher7eD_nqkQiDUyyWgXQYGyhqMOJ-t5Z8k5XpJVw';
const CSRF_TOKEN = process.env.INSTAGRAM_CSRFTOKEN || 'xWAxQhvHf4rNuWUEoUstC7DDozTP0xsm';
const DS_USER_ID = process.env.INSTAGRAM_DS_USER_ID || '54003903307';
const INSTAGRAM_USERNAME = process.env.INSTAGRAM_USERNAME || 'closetfullofcoco_';
const INSTAGRAM_URL = `https://www.instagram.com/${INSTAGRAM_USERNAME}/`;
const OUTPUT_FILE = 'instagram-posts.csv';

const ANTI_BAN = {
  MIN_SCROLL_DELAY_MS: 4000,
  MAX_SCROLL_DELAY_MS: 8000,
  MIN_SCROLL_STEPS: 5,
  MAX_SCROLL_STEPS: 10,
  POST_NAVIGATE_DELAY_MS: 3000,
  COOKIE_TO_NAVIGATE_DELAY_MS: 2000,
  MAX_SCROLLS: 100,
  MAX_CONSECUTIVE_EMPTY_SCROLLS: 3,
};

const MAX_RETRIES = 3;
const RETRY_BACKOFF_MS = 3000;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function withRetry(fn, description) {
  let lastError;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      console.error(`Attempt ${attempt}/${MAX_RETRIES} for "${description}": ${err.message}`);
      if (attempt < MAX_RETRIES) {
        const delay = RETRY_BACKOFF_MS * attempt;
        console.error(`Retrying in ${delay}ms...`);
        await sleep(delay);
      }
    }
  }
  throw lastError;
}

async function evaluateWithTimeout(page, fn, timeoutMs = 5000) {
  return Promise.race([
    page.evaluate(fn),
    new Promise((_, reject) => setTimeout(() => reject(new Error('evaluate timeout')), timeoutMs)),
  ]);
}

async function humanScroll(page) {
  const scrollSteps = randomBetween(ANTI_BAN.MIN_SCROLL_STEPS, ANTI_BAN.MAX_SCROLL_STEPS);
  const totalHeight = await evaluateWithTimeout(page, () => document.body.scrollHeight);
  const viewportHeight = await evaluateWithTimeout(page, () => window.innerHeight);

  for (let i = 1; i <= scrollSteps; i++) {
    const progress = i / scrollSteps;
    const eased = 1 - Math.pow(1 - progress, 3);
    const targetY = Math.floor(totalHeight * 0.3 * eased + viewportHeight * (1 - eased * 0.3));
    await evaluateWithTimeout(page, (y) => window.scrollTo(0, y), targetY);
    await sleep(100 + Math.floor(Math.random() * 300));
  }
  await sleep(200 + Math.floor(Math.random() * 400));
}

function checkRateLimit(pageText) {
  for (const phrase of ['Too Many Requests', 'Please wait a few minutes', 'Try again later']) {
    if (pageText.includes(phrase)) return phrase;
  }
  return null;
}

async function main() {
  console.log('Launching headless Chromium...');
  const browser = await withRetry(async () => {
    return await chromium.launch({ headless: true });
  }, 'browser launch');

  const viewportWidth = 1280 + Math.floor(Math.random() * 200 - 100);
  const viewportHeight = 800 + Math.floor(Math.random() * 200 - 100);
  const context = await browser.newContext({
    viewport: { width: viewportWidth, height: viewportHeight },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  });
  const page = await context.newPage();

  // WebDriver stealth
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => false });
    window.chrome = { runtime: { onConnect: { addListener: () => {} } } };
    Object.defineProperty(navigator, 'plugins', {
      get: () => [
        { name: 'Chrome PDF Plugin', filename: 'internal-pdf-viewer' },
        { name: 'Chrome PDF Viewer', filename: 'mhjfbmdgcfjbbpaejoof' },
        { name: 'Native Client', filename: 'internal-nacl-plugin' },
      ],
    });
    Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en', 'en-GB'] });
    const originalQuery = window.navigator.permissions.query;
    window.navigator.permissions.query = (parameters) =>
      parameters.name === 'notifications'
        ? Promise.resolve({ state: Notification.permission })
        : originalQuery(parameters);
    delete window.cdc_adoQpoasnfa76pfcZLmcfl_Array;
    delete window.cdc_adoQpoasnfa76pfcZLmcfl_Promise;
    delete window.cdc_adoQpoasnfa76pfcZLmcfl_Symbol;
  });

  // Realistic HTTP headers
  await page.setExtraHTTPHeaders({
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br',
    'DNT': '1',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1',
  });

  console.log('Injecting session cookies...');
  await context.addCookies([
    { name: 'sessionid', value: SESSION_ID, domain: '.instagram.com', path: '/', httpOnly: true, secure: true },
    { name: 'csrftoken', value: CSRF_TOKEN, domain: '.instagram.com', path: '/', httpOnly: false, secure: true },
    { name: 'ds_user_id', value: DS_USER_ID, domain: '.instagram.com', path: '/', httpOnly: false, secure: true },
  ]);

  const cookieDelay = randomBetween(ANTI_BAN.COOKIE_TO_NAVIGATE_DELAY_MS, ANTI_BAN.COOKIE_TO_NAVIGATE_DELAY_MS + 1000);
  console.log(`Waiting ${cookieDelay}ms before navigating...`);
  await sleep(cookieDelay);

  console.log(`Navigating to ${INSTAGRAM_URL}...`);
  let response;
  try {
    response = await page.goto(INSTAGRAM_URL, { waitUntil: 'networkidle', timeout: 60000 });
  } catch (navErr) {
    await browser.close();
    console.error(`Navigation failed: ${navErr.message}`);
    process.exit(1);
  }

  const finalUrl = page.url();
  console.log(`Final URL: ${finalUrl}`);

  if (finalUrl.includes('login') || finalUrl.includes('accounts/login')) {
    await browser.close();
    console.error('ERROR: Session expired. Please refresh your Instagram session cookies.');
    process.exit(1);
  }

  if (response && response.status() === 404) {
    await browser.close();
    console.error(`ERROR: Profile not found (404) for "${INSTAGRAM_USERNAME}".`);
    process.exit(1);
  }

  const postNavDelay = randomBetween(ANTI_BAN.POST_NAVIGATE_DELAY_MS, ANTI_BAN.POST_NAVIGATE_DELAY_MS + 2000);
  console.log(`Waiting ${postNavDelay}ms for JS bootstrap...`);
  await sleep(postNavDelay);

  const pageText = await page.textContent('body').catch(() => '');
  if (pageText.includes('Sorry, this page') || pageText.includes('Page Not Found') || pageText.includes('no longer available')) {
    await browser.close();
    console.error('ERROR: Profile not found — Instagram shows "Sorry, this page".');
    process.exit(1);
  }

  const rateLimit = checkRateLimit(pageText);
  if (rateLimit) {
    await browser.close();
    console.error(`ERROR: Rate limit detected ("${rateLimit}"). Exiting to protect your account.`);
    process.exit(1);
  }

  // Poll for post grid to appear (up to 60s)
  console.log('Waiting for post grid to appear...');
  let postGridFound = false;
  for (let i = 1; i <= 30; i++) {
    const links = await page.$$eval('a[href*="/p/"]', els => els.slice(0, 3).map(e => e.getAttribute('href'))).catch(() => []);
    if (links.length > 0) {
      console.log(`Post grid found after ${i} checks (${links.length} initial links)`);
      postGridFound = true;
      break;
    }
    if (i % 5 === 0) console.log(`Still waiting... ${i}/30 checks done`);
    await sleep(2000);
  }

  if (!postGridFound) {
    await browser.close();
    console.error('ERROR: Post grid never appeared. The profile may be private or Instagram is blocking this session.');
    process.exit(1);
  }

  console.log('Scrolling through posts...');
  const seenPostUrls = new Set();
  let prevTotal = 0;
  // Track how many consecutive scrolls failed to add ANY new posts to the set
  let scrollsWithNoGrowth = 0;
  // Stop only when the TOTAL collected count hasn't grown for 5 consecutive scrolls
  // (not just when a single scroll finds 0 new posts)
  const NO_GROWTH_THRESHOLD = 5;

  for (let scrollNum = 1; scrollNum <= ANTI_BAN.MAX_SCROLLS; scrollNum++) {
    await humanScroll(page);

    const postLinks = await page.$$eval('a[href*="/p/"]', links =>
      links.map(link => link.getAttribute('href'))
    ).catch(() => []);

    let newPostsFound = 0;
    for (const href of postLinks) {
      const match = href.match(/\/p\/([A-Za-z0-9_-]+)\//);
      if (match) {
        const fullUrl = `https://www.instagram.com/p/${match[1]}/`;
        if (!seenPostUrls.has(fullUrl)) {
          seenPostUrls.add(fullUrl);
          newPostsFound++;
        }
      }
    }

    console.log(`Scroll ${scrollNum}/${ANTI_BAN.MAX_SCROLLS}: ${seenPostUrls.size} unique posts (${newPostsFound} new)`);

    if (seenPostUrls.size === prevTotal) {
      scrollsWithNoGrowth++;
    } else {
      scrollsWithNoGrowth = 0;
    }
    prevTotal = seenPostUrls.size;

    // Only stop when the total count hasn't grown for NO_GROWTH_THRESHOLD scrolls in a row
    if (scrollsWithNoGrowth >= NO_GROWTH_THRESHOLD) {
      console.log(`Stopping: No growth for ${NO_GROWTH_THRESHOLD} consecutive scrolls (total: ${seenPostUrls.size}).`);
      break;
    }

    if (scrollNum < ANTI_BAN.MAX_SCROLLS) {
      const scrollDelay = randomBetween(ANTI_BAN.MIN_SCROLL_DELAY_MS, ANTI_BAN.MAX_SCROLL_DELAY_MS);
      await sleep(scrollDelay);
    }
  }

  await browser.close();

  if (seenPostUrls.size === 0) {
    console.error(`ERROR: No posts extracted. Profile may be empty or private.`);
    process.exit(1);
  }

  const sortedUrls = Array.from(seenPostUrls).sort();
  const csvContent = ['post_url', ...sortedUrls].join('\n');
  const outputPath = path.join(process.cwd(), OUTPUT_FILE);
  fs.writeFileSync(outputPath, csvContent, 'utf8');

  console.log(`\nDone! Extracted ${seenPostUrls.size} unique post URLs.`);
  console.log(`Written to: ${outputPath}`);
}

main().catch(err => {
  console.error('Unhandled error:', err.message);
  process.exit(1);
});