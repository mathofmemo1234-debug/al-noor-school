import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Since this is ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read index.js translations
const indexJsPath = path.join(__dirname, 'src', 'translations', 'index.js');
let indexContent = fs.readFileSync(indexJsPath, 'utf8');

// A quick hack to get the existing keys:
const keyMatch = indexContent.match(/"([^"]+)":/g) || [];
const existingKeys = new Set(keyMatch.map(k => k.replace(/"/g, '').replace(':', '')));

function walkSync(dir, filelist = []) {
  fs.readdirSync(dir).forEach(file => {
    const dirFile = path.join(dir, file);
    try {
      filelist = fs.statSync(dirFile).isDirectory() ? walkSync(dirFile, filelist) : filelist.concat(dirFile);
    } catch (err) {
      if (err.code === 'ENOENT') return;
      throw err;
    }
  });
  return filelist;
}

const files = walkSync(path.join(__dirname, 'src'));
const jsxFiles = files.filter(f => f.endsWith('.jsx'));

const missingKeys = new Set();
const keyRegex = /t\(['"]([^'"]+)['"]\)/g;

jsxFiles.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  let match;
  while ((match = keyRegex.exec(content)) !== null) {
    const key = match[1];
    if (!existingKeys.has(key)) {
      missingKeys.add(key);
    }
  }
});

console.log("Missing keys:");
console.log(Array.from(missingKeys).join('\n'));

