const fs = require('fs');

const indexJsPath = './src/translations/index.js';
const genericJsonPath = '../../brain/1c1ed698-c7eb-4486-bd5e-03ad9e4a7478/scratch/translations_generic.json';
const adminJsonPath = '../../brain/90930898-4831-4c3d-b481-b25905be288e/scratch/translations_admin.json';
const teacherStudentJsonPath = '../../brain/3113ccc1-5344-4dcd-bf2e-bb2f44532148/scratch/translations_teacher_student.json';

try {
  let indexContent = fs.readFileSync(indexJsPath, 'utf8');
  fs.writeFileSync('./temp_trans.cjs', indexContent.replace('export const translations = ', 'module.exports = ').trim().replace(/;$/, ''));
  const currentTranslations = require('./temp_trans.cjs');
  
  if (fs.existsSync(genericJsonPath)) {
    const genericData = JSON.parse(fs.readFileSync(genericJsonPath, 'utf8'));
    Object.assign(currentTranslations.ar, genericData.ar);
    Object.assign(currentTranslations.en, genericData.en);
  }

  if (fs.existsSync(adminJsonPath)) {
    const adminData = JSON.parse(fs.readFileSync(adminJsonPath, 'utf8'));
    Object.assign(currentTranslations.ar, adminData.ar);
    Object.assign(currentTranslations.en, adminData.en);
  }

  if (fs.existsSync(teacherStudentJsonPath)) {
    const tsData = JSON.parse(fs.readFileSync(teacherStudentJsonPath, 'utf8'));
    Object.assign(currentTranslations.ar, tsData.ar);
    Object.assign(currentTranslations.en, tsData.en);
  }

  const newContent = 'export const translations = ' + JSON.stringify(currentTranslations, null, 2) + ';\n';
  fs.writeFileSync(indexJsPath, newContent, 'utf8');
  console.log("Merged successfully.");
  
} catch (e) {
  console.error(e);
}
