import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const indexJsPath = path.join(__dirname, 'src', 'translations', 'index.js');

const module = await import('file://' + indexJsPath.replace(/\\/g, '/'));
const currentTranslations = module.translations;

currentTranslations.ar['adminPreparations.portfolio'] = 'الحقبنة:';
currentTranslations.ar['lessonPreparation.portfolio'] = 'الحقبنة';
currentTranslations.ar['lessonPreparation.portfolioPlaceholder'] = 'اربط الدرس بالمعارف السابقة للطالب...';

currentTranslations.en['adminPreparations.portfolio'] = 'Al-Haqbana:';
currentTranslations.en['lessonPreparation.portfolio'] = 'Al-Haqbana';
currentTranslations.en['lessonPreparation.portfolioPlaceholder'] = "Connect the lesson to the student's previous knowledge...";

const newContent = 'export const translations = ' + JSON.stringify(currentTranslations, null, 2) + ';\n';
fs.writeFileSync(indexJsPath, newContent, 'utf8');
console.log("Haqbana translations updated successfully.");
