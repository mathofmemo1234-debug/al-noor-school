import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const indexJsPath = path.join(__dirname, 'src', 'translations', 'index.js');

const module = await import('file://' + indexJsPath.replace(/\\/g, '/'));
const currentTranslations = module.translations;

const newKeys = {
  ar: {
    "adminDashboard.addingData": "جاري إضافة البيانات...",
    "adminDashboard.seedSuccess": "تمت إضافة البيانات التجريبية بنجاح",
    "adminDashboard.errorPrefix": "خطأ:",
    "adminDashboard.addSeedData": "إضافة بيانات تجريبية",
    "adminDashboard.totalTeachers": "إجمالي المعلمين",
    "adminDashboard.totalStudents": "إجمالي الطلاب",
    "adminDashboard.totalClasses": "إجمالي الفصول",
    "adminDashboard.saveError": "حدث خطأ أثناء الحفظ",
    "adminDashboard.teachersAddedSuccess": "تمت إضافة المعلمين بنجاح",
    "adminDashboard.bulkUploadError": "خطأ في الرفع الجماعي",
    "adminDashboard.confirmDeleteTeacher": "هل أنت متأكد من حذف هذا المعلم؟",
    "adminDashboard.deleteError": "حدث خطأ أثناء الحذف",
    "adminDashboard.updateError": "حدث خطأ أثناء التحديث",
    "adminDashboard.manageTeachersTitle": "إدارة المعلمين",
    "adminDashboard.bulkUpload": "رفع جماعي",
    "adminDashboard.addNewTeacher": "إضافة معلم جديد",
    "adminDashboard.noTeachersAdded": "لا يوجد معلمون مضافون",
    "adminDashboard.nationalIdLabel": "رقم الهوية",
    "adminDashboard.whatsappLabel": "واتساب",
    "adminDashboard.teacherName": "اسم المعلم",
    "adminDashboard.fullNamePlaceholder": "الاسم الكامل",
    "adminDashboard.nationalId": "رقم الهوية",
    "adminDashboard.subject": "المادة",
    "adminDashboard.subjectPlaceholder": "مثال: الرياضيات",
    "adminDashboard.saving": "جاري الحفظ...",
    "adminDashboard.saveData": "حفظ البيانات",
    "adminDashboard.editTeacherTitle": "تعديل بيانات المعلم",
    "adminDashboard.whatsappOptional": "واتساب (اختياري)",
    "adminDashboard.whatsappPlaceholder": "966xxxxxxxxx+",
    "adminDashboard.saveChanges": "حفظ التغييرات",
    "adminDashboard.bulkUploadTeachersTitle": "رفع المعلمين جماعياً",
    "adminDashboard.bulkUploadTeachersInstruction1": "يجب أن يحتوي الملف على الأعمدة:",
    "adminDashboard.requiredOrder": "بالترتيب التالي:",
    "adminDashboard.idNameSubject": "الرقم، الاسم، المادة",
    "adminDashboard.separatedByCommaOrTab": "مفصولة بفاصلة أو tab",
    "adminDashboard.uploading": "جاري الرفع...",
    "adminDashboard.uploadData": "رفع البيانات",
    "lessonPreparation.attachedFile": "الملف المرفق"
  },
  en: {
    "adminDashboard.addingData": "Adding data...",
    "adminDashboard.seedSuccess": "Test data added successfully",
    "adminDashboard.errorPrefix": "Error:",
    "adminDashboard.addSeedData": "Add Seed Data",
    "adminDashboard.totalTeachers": "Total Teachers",
    "adminDashboard.totalStudents": "Total Students",
    "adminDashboard.totalClasses": "Total Classes",
    "adminDashboard.saveError": "Error while saving",
    "adminDashboard.teachersAddedSuccess": "Teachers added successfully",
    "adminDashboard.bulkUploadError": "Bulk upload error",
    "adminDashboard.confirmDeleteTeacher": "Are you sure you want to delete this teacher?",
    "adminDashboard.deleteError": "Error while deleting",
    "adminDashboard.updateError": "Error while updating",
    "adminDashboard.manageTeachersTitle": "Manage Teachers",
    "adminDashboard.bulkUpload": "Bulk Upload",
    "adminDashboard.addNewTeacher": "Add New Teacher",
    "adminDashboard.noTeachersAdded": "No teachers added",
    "adminDashboard.nationalIdLabel": "National ID",
    "adminDashboard.whatsappLabel": "WhatsApp",
    "adminDashboard.teacherName": "Teacher Name",
    "adminDashboard.fullNamePlaceholder": "Full Name",
    "adminDashboard.nationalId": "National ID",
    "adminDashboard.subject": "Subject",
    "adminDashboard.subjectPlaceholder": "e.g. Mathematics",
    "adminDashboard.saving": "Saving...",
    "adminDashboard.saveData": "Save Data",
    "adminDashboard.editTeacherTitle": "Edit Teacher",
    "adminDashboard.whatsappOptional": "WhatsApp (Optional)",
    "adminDashboard.whatsappPlaceholder": "+966xxxxxxxxx",
    "adminDashboard.saveChanges": "Save Changes",
    "adminDashboard.bulkUploadTeachersTitle": "Bulk Upload Teachers",
    "adminDashboard.bulkUploadTeachersInstruction1": "The file must contain columns:",
    "adminDashboard.requiredOrder": "In this order:",
    "adminDashboard.idNameSubject": "ID, Name, Subject",
    "adminDashboard.separatedByCommaOrTab": "Separated by comma or tab",
    "adminDashboard.uploading": "Uploading...",
    "adminDashboard.uploadData": "Upload Data",
    "lessonPreparation.attachedFile": "Attached File"
  }
};

Object.assign(currentTranslations.ar, newKeys.ar);
Object.assign(currentTranslations.en, newKeys.en);

const newContent = 'export const translations = ' + JSON.stringify(currentTranslations, null, 2) + ';\n';
fs.writeFileSync(indexJsPath, newContent, 'utf8');
console.log("Done! All missing admin dashboard keys added.");
