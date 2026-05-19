const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const SESSION_ID = process.env.INSTAGRAM_SESSION_ID || '54003903307%3AJdz6NWVSESaxos%3A29%3AAYg0wCNPvWI2zhF93SkQCmFnzIAjzZ5BHlP9MjCm3A';
const CSRF_TOKEN = process.env.INSTAGRAM_CSRF_TOKEN || 'xWAxQhvHf4rNuWUEoUstC7DDozTP0xsm';
const DS_USER_ID = process.env.INSTAGRAM_DS_USER_ID || '54003903307';
const INSTAGRAM_USERNAME = process.env.INSTAGRAM_USERNAME || 'closetfullofcoco_';
const INSTAGRAM_URL = `https://www.instagram.com/${INSTAGRAM_USERNAME}/`;
const OUTPUT_FILE = 'instagram-posts.csv';

const ANTI_BAN = {
  MIN_SCROLL_DELAY_MS: 4000,
  MAX_SCROLL_DELAY_MS: 8000,
  MIN_SCROLL_STEPS: 5,
  MAX_SCROLL_STEPS: 10,
  POST_NAVIGATE_DELAY_MS: 2500,
  COOKIE_TO_NAVIGATE_DELAY_MS: 1500,
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
      console.error(`Attempt ${attempt}/${MAX_RETRIES} failed for ${description}: ${err.message}`);
      if (attempt < MAX_RETRIES) {
        console.error(`Retrying in ${RETRY_BACKOFF_MS}ms...`);
        await sleep(RETRY_BACKOFF_MS);
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
  const rateLimitPhrases = [
    'Too Many Requests',
    'Please wait a few minutes',
    'Try again later',
  ];
  for (const phrase of rateLimitPhrases) {
    if (pageText.includes(phrase)) {
      return phrase;
    }
  }
  return null;
}

async function main() {
  console.log('Launching headless Chromium...');
  const browser = await withRetry(async () => {
    return await chromium.launch({ headless: true });
  }, 'browser launch');

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  });
  const page = await context.newPage();

  // WebDriver stealth - must run before any page interaction
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => false });
    window.chrome = {
      runtime: { onConnect: { addListener: () => {} } },
    };
    Object.defineProperty(navigator, 'plugins', {
      get: () => [
        { name: 'Chrome PDF Plugin', filename: 'internal-pdf-viewer' },
        { name: 'Chrome PDF Viewer', filename: 'mhjfbmdgcfjbbpaejoof' },
        { name: 'Native Client', filename: 'internal-nacl-plugin' },
      ],
    });
    Object.defineProperty(navigator, 'languages', {
      get: () => ['en-US', 'en', 'en-GB'],
    });
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

  // Staggered delay after cookie injection before navigation
  const cookieToNavigateDelay = randomBetween(
    ANTI_BAN.COOKIE_TO_NAVIGATE_DELAY_MS,
    ANTI_BAN.COOKIE_TO_NAVIGATE_DELAY_MS * 2 + 500
  );
  console.log(`Waiting ${cookieToNavigateDelay}ms before navigating...`);
  await sleep(cookieToNavigateDelay);

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

  // Staggered delay after page load before first scroll
  const postNavigateDelay = randomBetween(
    ANTI_BAN.POST_NAVIGATE_DELAY_MS,
    ANTI_BAN.POST_NAVIGATE_DELAY_MS + 2000
  );
  console.log(`Waiting ${postNavigateDelay}ms for JS bootstrap...`);
  await sleep(postNavigateDelay);

  // Check for special "not found" text on page
  const pageText = await page.textContent('body').catch(() => '');
  if (pageText.includes('Sorry, this page') || pageText.includes('Page Not Found') || pageText.includes('no longer available')) {
    await browser.close();
    console.error(`ERROR: Profile not found — Instagram shows "Sorry, this page" for "${INSTAGRAM_USERNAME}".`);
    process.exit(1);
  }

  // Rate limit detection
  const matchedRateLimit = checkRateLimit(pageText);
  if (matchedRateLimit) {
    await browser.close();
    console.error(`ERROR: Rate limit detected — Instagram returned "${matchedRateLimit}". Exiting safely to avoid further restrictions.`);
    process.exit(1);
  }

  console.log('Scrolling through posts...');
  const seenPostUrls = new Set();
  let consecutiveEmptyScrolls = 0;

  for (let scrollNum = 1; scrollNum <= ANTI_BAN.MAX_SCROLLS; scrollNum++) {
    // Human-like stepped scroll
    await humanScroll(page);

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

    console.log(`Scroll ${scrollNum}/${ANTI_BAN.MAX_SCROLLS}: found ${seenPostUrls.size} unique posts (${newPostsFound} new this scroll)`);

    // Track consecutive empty scrolls
    if (newPostsFound === 0) {
      consecutiveEmptyScrolls++;
    } else {
      consecutiveEmptyScrolls = 0;
    }

    // Stop after 3 consecutive scrolls with no new posts
    if (consecutiveEmptyScrolls >= ANTI_BAN.MAX_CONSECUTIVE_EMPTY_SCROLLS) {
      console.log(`Stopping: ${ANTI_BAN.MAX_CONSECUTIVE_EMPTY_SCROLLS} consecutive scrolls with no new posts.`);
      break;
    }

    // Quick check: if no post links at all and we've scrolled at least once, we might be at an empty/private profile
    if (postLinks.length === 0 && seenPostUrls.size === 0 && scrollNum >= 3) {
      await browser.close();
      console.error(`ERROR: Empty profile — no posts found for "${INSTAGRAM_USERNAME}". The profile may have no posts or be private.`);
      process.exit(1);
    }

    // Variable delay between scrolls (4-8 seconds)
    if (scrollNum < ANTI_BAN.MAX_SCROLLS) {
      const scrollDelay = randomBetween(ANTI_BAN.MIN_SCROLL_DELAY_MS, ANTI_BAN.MAX_SCROLL_DELAY_MS);
      await sleep(scrollDelay);
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