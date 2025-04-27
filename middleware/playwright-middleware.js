const { chromium } = require('playwright');
const path = require('path');
const NodeCache = require('node-cache');

// Конфигурация
const MEMORY_LIMIT = 512;
const CACHE_TTL = 86400;
const MAX_PAGE_COUNT = 20;         // макс. количество открытых страниц
const BROWSER_LIFETIME_MS = 1000 * 60 * 1440; // 1440 минут(сутки)
let browserStartTime = null;
const BROWSER_ARGS = [
  '--disable-dev-shm-usage',
  '--disable-accelerated-2d-canvas',
  '--disable-gpu',
  `--js-flags=--max_old_space_size=${MEMORY_LIMIT}`,
  '--no-zygote',
  '--disable-background-timer-throttling',
  '--no-sandbox',
  '--disable-setuid-sandbox',
  '--disable-features=IsolateOrigins',
  '--disable-site-isolation-trials',
  '--disable-web-security',
];

const BOT_PATTERNS = [
  /googlebot/i, /bingbot/i, /yandexbot/i, /duckduckbot/i,
  /baiduspider/i,  /facebot/i, /twitterbot/i, /google-inspectiontool/i,
];

const ALLOWED_VUE_PATHS = [
  '/', '/place', '/places', '/trip', '/trips',
  '/excursion', '/excursions', '/index.html',
];

const botCache = new NodeCache({ stdTTL: CACHE_TTL });
let browserInstance = null;

async function getBrowser() {
  const now = Date.now();

  if (
    browserInstance &&
    browserInstance.contexts().length > 0
  ) {
    const pages = await Promise.all(
      browserInstance.contexts().map(ctx => ctx.pages())
    );
    const totalPages = pages.flat().length;

    const isOld = now - browserStartTime > BROWSER_LIFETIME_MS;
    const isTooManyPages = totalPages >= MAX_PAGE_COUNT;

    if (isOld || isTooManyPages) {
      await browserInstance.close();
      browserInstance = null;
    }
  }

  if (!browserInstance) {
    browserInstance = await chromium.launch({
      headless: true,
      args: BROWSER_ARGS,
      timeout: 30000,
    });
    browserStartTime = Date.now();
  }

  return browserInstance;
}

function isBot(userAgent = '') {
  return BOT_PATTERNS.some(pattern => pattern.test(userAgent));
}

function isApiRequest(pathname) {
  return /^\/(api|.*\/(get|refresh|create|update|delete))/.test(pathname);
}

function isVueRoute(pathname) {
  return ALLOWED_VUE_PATHS.some(route =>
    pathname === route || pathname === `${route}/`
  );
}

function sendHtmlResponse(res, content) {
  res.setHeader('Content-Type', 'text/html');
  res.send(content);
}

async function renderPage(url) {
  const browser = await getBrowser();
  const page = await browser.newPage();

  
  try {
    await page.goto(url, { waitUntil: 'networkidle' });
    await page.waitForSelector('#app :not(:empty)', { timeout: 30000 });
    // await page.screenshot({ path: `rendered-${Date.now()}.png`, fullPage: true });
    return await page.content();
  } finally {
    await page.close();
  }
}

async function playwrightMiddleware(req, res, next) {
  const userAgent = req.headers['user-agent'] || '';
  const isBotRequest = isBot(userAgent);
  const pathname = req.originalUrl.split('?')[0];
  const isGet = req.method.toLowerCase() === 'get';

  if (isBotRequest && isGet && !isApiRequest(pathname) && isVueRoute(pathname)) {
    const fullUrl = `${process.env.CLIENT_URL}${req.originalUrl}`;
    const cachedHtml = botCache.get(fullUrl);

    if (cachedHtml) {

      return sendHtmlResponse(res, cachedHtml);
    }

 
    try {
      const content = await renderPage(fullUrl);
      botCache.set(fullUrl, content);
      return sendHtmlResponse(res, content);
    } catch (error) {
      console.error('[Playwright error]', error.message);
      return next();
    }
  }

  // Обычные пользователи — дальше по цепочке
  return next();
}

process.on('SIGINT', async () => {
  if (browserInstance) {
    await browserInstance.close();
  }
  process.exit();
});

module.exports = playwrightMiddleware;