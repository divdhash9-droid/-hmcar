#!/usr/bin/env node

const fs = require('fs/promises');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const MARKER = '[[ARABIC_HEADER]]';
const SKIP_DIRS = new Set([
  '.git',
  'node_modules',
  'logs',
  'uploads',
  '.next',
  'dist',
  'coverage',
  '.vscode',
  '.vs'
]);

const COMMENT_STYLES = new Map();
const SPECIAL_FILES = new Map();

registerLineStyle(['.js', '.mjs', '.cjs', '.ts', '.jsx'], '// ');
registerLineStyle(['.sh', '.ps1'], '# ');
registerLineStyle(['.yml', '.yaml'], '# ');
registerLineStyle(['.md'], '> ');
registerBlockStyle(['.css', '.scss', '.less'], '/* ', ' */');
registerBlockStyle(['.jsonc'], '/* ', ' */');
registerHtmlStyle(['.ejs', '.html'], '<!-- ', ' -->');

SPECIAL_FILES.set('Dockerfile', { kind: 'line', prefix: '# ' });
SPECIAL_FILES.set('.env.example', { kind: 'line', prefix: '# ' });
SPECIAL_FILES.set('ecosystem.config.js', { kind: 'line', prefix: '// ' });

function registerLineStyle(exts, prefix) {
  exts.forEach((ext) => COMMENT_STYLES.set(ext, { kind: 'line', prefix }));
}

function registerBlockStyle(exts, start, end) {
  exts.forEach((ext) => COMMENT_STYLES.set(ext, { kind: 'block', start, end }));
}

function registerHtmlStyle(exts, start, end) {
  exts.forEach((ext) => COMMENT_STYLES.set(ext, { kind: 'html', start, end }));
}

async function run() {
  const stats = { processed: 0, skipped: 0, existing: 0, missingStyle: 0 };
  await traverse(ROOT, stats);
  console.log(
    `تمت إضافة التعليقات العربية إلى ${stats.processed} ملف، ` +
      `تخطي ${stats.skipped}، ملفات مضافة سابقاً ${stats.existing}، ` +
      `ملفات بلا نمط مدعوم ${stats.missingStyle}.`
  );
}

async function traverse(currentDir, stats) {
  const entries = await fs.readdir(currentDir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name.startsWith('.')) {
      if (!['.env', '.gitignore'].includes(entry.name)) {
        stats.skipped += 1;
        continue;
      }
    }

    const fullPath = path.join(currentDir, entry.name);
    const relativePath = path.relative(ROOT, fullPath).replace(/\\/g, '/');

    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) {
        stats.skipped += 1;
        continue;
      }
      await traverse(fullPath, stats);
    } else if (entry.isFile()) {
      await processFile(fullPath, relativePath, stats);
    }
  }
}

async function processFile(filePath, relativePath, stats) {
  const style = pickStyle(filePath, relativePath);
  if (!style) {
    stats.missingStyle += 1;
    return;
  }

  let content;
  try {
    content = await fs.readFile(filePath, 'utf8');
  } catch (error) {
    stats.skipped += 1;
    return;
  }

  if (content.includes(MARKER)) {
    stats.existing += 1;
    return;
  }

  const comment = buildComment(relativePath, style);
  const updated = insertComment(content, comment, style);

  await fs.writeFile(filePath, updated, 'utf8');
  stats.processed += 1;
}

function pickStyle(filePath, relativePath) {
  const baseName = path.basename(relativePath);
  if (SPECIAL_FILES.has(baseName)) {
    return SPECIAL_FILES.get(baseName);
  }

  const ext = path.extname(relativePath).toLowerCase();
  return COMMENT_STYLES.get(ext);
}

function buildComment(relativePath, style) {
  const shared = `${MARKER} هذا الملف (${relativePath}) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.`;
  if (style.kind === 'line') {
    return `${style.prefix}${shared}\n`;
  }
  if (style.kind === 'block') {
    return `${style.start}${shared}${style.end}\n`;
  }
  if (style.kind === 'html') {
    return `${style.start}${shared}${style.end}\n`;
  }
  return `${shared}\n`;
}

function insertComment(originalContent, comment, style) {
  if (originalContent.startsWith('#!')) {
    const firstLineBreak = originalContent.indexOf('\n');
    if (firstLineBreak !== -1) {
      return (
        originalContent.slice(0, firstLineBreak + 1) +
        comment +
        originalContent.slice(firstLineBreak + 1)
      );
    }
  }
  return `${comment}\n${originalContent}`;
}

run().catch((error) => {
  console.error('فشل تنفيذ سكربت التعليقات العربية:', error);
  process.exitCode = 1;
});
