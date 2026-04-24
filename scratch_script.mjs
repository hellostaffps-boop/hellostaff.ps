import fs from 'fs';
import path from 'path';

const srcDir = 'c:/Users/goats/Desktop/HELLO projict/src';
const i18nContent = fs.readFileSync(path.join(srcDir, 'lib/i18n.js'), 'utf8');

// Extract all t('section', 'key') usages
let usages = new Set();
function walk(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walk(fullPath);
    } else if (fullPath.endsWith('.jsx') || fullPath.endsWith('.js')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      const regex = /t\s*\(\s*['"]([^'"]+)['"]\s*,\s*['"]([^'"]+)['"]\s*\)/g;
      let match;
      while ((match = regex.exec(content)) !== null) {
        usages.add(match[1] + '.' + match[2]);
      }
    }
  }
}
walk(srcDir);

// Quick hack: extract keys per section from i18n
const enKeys = new Set();
const arKeys = new Set();

const enBlock = i18nContent.substring(i18nContent.indexOf('en: {'), i18nContent.indexOf('ar: {'));
let currentSection = '';
enBlock.split('\n').forEach(line => {
  const secMatch = line.match(/^    ([a-zA-Z0-9_]+):\s*\{/);
  if (secMatch) currentSection = secMatch[1];
  else {
    const keyMatch = line.match(/^      ([a-zA-Z0-9_]+):\s*/);
    if (keyMatch && currentSection) {
      enKeys.add(currentSection + '.' + keyMatch[1]);
    }
  }
});

const arBlock = i18nContent.substring(i18nContent.indexOf('ar: {'));
currentSection = '';
arBlock.split('\n').forEach(line => {
  const secMatch = line.match(/^    ([a-zA-Z0-9_]+):\s*\{/);
  if (secMatch) currentSection = secMatch[1];
  else {
    const keyMatch = line.match(/^      ([a-zA-Z0-9_]+):\s*/);
    if (keyMatch && currentSection) {
      arKeys.add(currentSection + '.' + keyMatch[1]);
    }
  }
});

const missingInEn = [];
const missingInAr = [];

for (const use of usages) {
  if (!enKeys.has(use)) missingInEn.push(use);
  if (!arKeys.has(use)) missingInAr.push(use);
}

console.log('--- MISSING IN ENGLISH ---');
console.log(missingInEn.join(', '));
console.log('--- MISSING IN ARABIC ---');
console.log(missingInAr.join(', '));
