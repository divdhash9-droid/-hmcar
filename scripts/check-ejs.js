// [[ARABIC_HEADER]] هذا الملف (scripts/check-ejs.js) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.

const fs = require('fs');
const path = require('path');
const ejs = require('ejs');

function walk(dir) {
  const files = [];
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    const stat = fs.statSync(p);
    if (stat.isDirectory()) files.push(...walk(p));
    else if (p.endsWith('.ejs')) files.push(p);
  }
  return files;
}

const viewsDir = path.join(__dirname, '..', 'views');
const files = walk(viewsDir);
let failed = 0;

files.forEach(file => {
  try {
    const src = fs.readFileSync(file, 'utf8');
    ejs.compile(src, {filename: file});
    console.log('OK:', path.relative(process.cwd(), file));
  } catch (err) {
    failed++;
    console.error('\nERROR in', path.relative(process.cwd(), file));
    console.error(err.toString());
  }
});

if (failed > 0) {
  console.error(`\nFound ${failed} problematic templates.`);
  process.exit(2);
} else {
  console.log('\nAll templates compiled successfully.');
}
