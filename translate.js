const fs = require('fs');
const path = require('path');
const translationKeys = {};

function extractTextFromComponent(content) {
  const textRegex = /<Text[^>]*>([^<]+)<\/Text>/g;
  const labelRegex = /label="([^"]+)"/g;
  const titleRegex = /title="([^"]+)"/g;
  
  let match;
  let matches = [];
  
  while ((match = textRegex.exec(content)) !== null) {
    matches.push(match[1].trim());
  }
  while ((match = labelRegex.exec(content)) !== null) {
    matches.push(match[1].trim());
  }
  while ((match = titleRegex.exec(content)) !== null) {
    matches.push(match[1].trim());
  }
  
  return matches;
}

function generateTranslationKey(text) {
  return text.toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '_');
}

function processFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const texts = extractTextFromComponent(content);
  
  texts.forEach(text => {
    const key = generateTranslationKey(text);
    translationKeys[key] = text;
  });
}

// Usage:
const componentsDir = './app';
const outputDir = './locales';

// Process all tsx files
function processDirectory(dir) {
  fs.readdirSync(dir).forEach(file => {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDirectory(fullPath);
    } else if (file.endsWith('.tsx')) {
      processFile(fullPath);
    }
  });
}

processDirectory(componentsDir);

// Generate translation files
const languages = ['en', 'es', 'fr', 'de', 'it', 'pt', 'ja', 'ko', 'zh'];

languages.forEach(lang => {
  const translations = {};
  Object.entries(translationKeys).forEach(([key, value]) => {
    translations[key] = lang === 'en' ? value : `[${lang}] ${value}`;
  });
  
  fs.writeFileSync(
    path.join(outputDir, `${lang}.ts`),
    `export default ${JSON.stringify(translations, null, 2)};`
  );
});