// [[ARABIC_HEADER]] هذا الملف (services/lotteAuctionSync.js) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.

const puppeteer = require('puppeteer');
const SiteSetting = require('../models/SiteSetting');

let intervalHandle = null;
let lastRunAt = null;
let lastError = null;
let isRunning = false;

async function saveSetting(key, value) {
  await SiteSetting.findOneAndUpdate(
    { key },
    { value: String(value || '') },
    { upsert: true, new: true }
  );
}

async function loadSetting(key) {
  const s = await SiteSetting.findOne({ key });
  return s ? String(s.value || '') : '';
}

function safeJsonParse(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

async function writeSnapshot(snapshot) {
  await saveSetting('externalAuctionSnapshot', JSON.stringify(snapshot || {}));
}

async function readSnapshot() {
  const raw = await loadSetting('externalAuctionSnapshot');
  return safeJsonParse(raw) || { cars: [], source: 'lotte', updatedAt: null };
}

async function scrapeLotte(auctionUrl, username, password) {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 720 });

    await page.goto('https://m.lotteautoauction.net/mo/pub/cmm/viewLoginUsr.do?isTabMove=Y', {
      waitUntil: 'domcontentloaded',
      timeout: 45000
    });

    await page.waitForTimeout(800);

    const filled = await page.evaluate((u, p) => {
      const inputs = Array.from(document.querySelectorAll('input'));
      const userInput = inputs.find(i => /id|user|login|userid|아이디/i.test((i.name || '') + ' ' + (i.id || '') + ' ' + (i.placeholder || '')));
      const passInput = inputs.find(i => (i.type === 'password') || /pass|pw|비밀번호/i.test((i.name || '') + ' ' + (i.id || '') + ' ' + (i.placeholder || '')));
      if (!userInput || !passInput) return { ok: false, reason: 'missing_inputs' };
      userInput.focus();
      userInput.value = u;
      userInput.dispatchEvent(new Event('input', { bubbles: true }));
      passInput.focus();
      passInput.value = p;
      passInput.dispatchEvent(new Event('input', { bubbles: true }));
      return { ok: true };
    }, username, password);

    if (!filled || !filled.ok) {
      throw new Error('تعذر العثور على حقول تسجيل الدخول في Lotte.');
    }

    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button, input[type="submit"], a'));
      const btn = buttons.find(b => /로그인|login/i.test((b.innerText || '') + ' ' + (b.value || '') + ' ' + (b.id || '') + ' ' + (b.name || '')));
      if (btn) btn.click();
    });

    await page.waitForTimeout(2500);

    if (auctionUrl) {
      await page.goto(auctionUrl, { waitUntil: 'domcontentloaded', timeout: 45000 });
      await page.waitForTimeout(1200);
    }

    const cars = await page.evaluate(() => {
      const normalize = (s) => String(s || '').replace(/\s+/g, ' ').trim();
      const uniq = (arr) => {
        const seen = new Set();
        const out = [];
        for (const x of arr) {
          const k = JSON.stringify(x);
          if (seen.has(k)) continue;
          seen.add(k);
          out.push(x);
        }
        return out;
      };

      const items = [];
      const anchors = Array.from(document.querySelectorAll('a'));
      for (const a of anchors) {
        const href = a.getAttribute('href') || '';
        if (!href) continue;
        const text = normalize(a.innerText);
        const img = a.querySelector('img');
        const imgSrc = img ? (img.getAttribute('src') || '') : '';

        const looksLikeCar = (imgSrc && imgSrc.length > 5) || /\d{4}/.test(text);
        if (!looksLikeCar) continue;

        items.push({
          title: text || 'سيارة',
          externalUrl: href.startsWith('http') ? href : href,
          imageUrl: imgSrc,
          currentPriceText: ''
        });
      }

      return uniq(items).slice(0, 200);
    });

    return { cars };
  } finally {
    await browser.close();
  }
}

async function runOnce({ auctionUrl, username, password, endsAt, io }) {
  if (isRunning) return;
  isRunning = true;
  try {
    const now = Date.now();
    const endMs = endsAt ? new Date(endsAt).getTime() : 0;
    if (endMs && now > endMs) {
      const snap = await readSnapshot();
      snap.status = 'ended';
      snap.updatedAt = new Date().toISOString();
      await writeSnapshot(snap);
      if (io) io.emit('externalAuction:snapshot', snap);
      return;
    }

    const result = await scrapeLotte(auctionUrl, username, password);
    const snapshot = {
      source: 'lotte',
      status: 'running',
      auctionUrl: auctionUrl || '',
      updatedAt: new Date().toISOString(),
      cars: Array.isArray(result.cars) ? result.cars : []
    };

    lastRunAt = new Date();
    await saveSetting('externalAuctionLastSync', lastRunAt.toISOString());
    lastError = null;

    await writeSnapshot(snapshot);
    if (io) io.emit('externalAuction:snapshot', snapshot);
  } catch (e) {
    lastError = e;
    const snap = await readSnapshot();
    snap.status = snap.status || 'running';
    snap.updatedAt = new Date().toISOString();
    snap.error = String(e && e.message ? e.message : e);
    await writeSnapshot(snap);
    if (io) io.emit('externalAuction:snapshot', snap);
  } finally {
    isRunning = false;
  }
}

function stopSync() {
  if (intervalHandle) {
    clearInterval(intervalHandle);
    intervalHandle = null;
  }
}

async function startOrUpdateSync({ auctionUrl, username, password, endsAt, io }) {
  stopSync();

  const endValue = endsAt ? new Date(endsAt).toISOString() : '';
  await saveSetting('externalAuctionEndsAt', endValue);
  await saveSetting('liveAuctionUrl', auctionUrl || '');

  await runOnce({ auctionUrl, username, password, endsAt: endValue, io });

  intervalHandle = setInterval(() => {
    runOnce({ auctionUrl, username, password, endsAt: endValue, io });
  }, 60 * 1000);

  return true;
}

function getRuntimeInfo() {
  return {
    running: Boolean(intervalHandle),
    lastRunAt: lastRunAt ? lastRunAt.toISOString() : null,
    lastError: lastError ? String(lastError.message || lastError) : null
  };
}

module.exports = {
  startOrUpdateSync,
  stopSync,
  readSnapshot,
  getRuntimeInfo
};
