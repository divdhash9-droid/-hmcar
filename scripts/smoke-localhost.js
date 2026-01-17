// [[ARABIC_HEADER]] هذا الملف (scripts/smoke-localhost.js) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.

const base = process.env.SMOKE_BASE_URL || 'http://localhost:4001';
const baseUrl = new URL(base);
const httpModule = baseUrl.protocol === 'https:' ? require('https') : require('http');
const paths = [
  '/',
  '/auth/login',
  '/search?q=%D8%AA%D9%88%D9%8A%D9%88%D8%AA%D8%A7',
  '/search?format=json&q=%D8%AA%D9%88%D9%8A%D9%88%D8%AA%D8%A7',
  '/manifest.json',
  '/sw.js',
  '/public/css/modern-design.css'
];

function get(path) {
  return new Promise((resolve) => {
    const req = httpModule.request({
      protocol: baseUrl.protocol,
      hostname: baseUrl.hostname,
      port: baseUrl.port || (baseUrl.protocol === 'https:' ? 443 : 80),
      method: 'GET',
      path
    }, (res) => {
      res.resume();
      resolve({ path, statusCode: res.statusCode });
    });

    req.on('error', (err) => resolve({ path, error: err.message }));
    req.setTimeout(10_000, () => req.destroy(new Error('timeout')));

    req.end();
  });
}

(async () => {
  let failed = false;

  console.log(`SMOKE TEST -> ${base}`);
  console.log(`Node -> ${process.version}`);
  console.log(`Time -> ${new Date().toISOString()}`);

  for (const path of paths) {
    const result = await get(path);

    if (result.error) {
      failed = true;
      console.log(`FAIL ${path} -> ${result.error}`);
      continue;
    }

    const ok = typeof result.statusCode === 'number' && result.statusCode >= 200 && result.statusCode < 400;
    console.log(`${ok ? 'OK  ' : 'BAD '} ${path} -> ${String(result.statusCode)}`);
    if (!ok) failed = true;
  }

  process.exit(failed ? 1 : 0);
})();
