import { SAUDI_CURRICULUM_DATA } from './saudiCurriculumData';
import { AMERICAN_CURRICULUM_DATA } from './americanCurriculumData';
import { POPULAR_TEACHING_STRATEGIES } from './teachingStrategies';

// النظام معتمد على فصلين دراسيين فقط
export const SEMESTERS = [
  'الفصل الدراسي الأول',
  'الفصل الدراسي الثاني'
];

export const CURRICULUM_TYPES = {
  SAUDI: 'saudi',
  AMERICAN: 'american',
  DUAL: 'dual'
};

/**
 * الكشف الذكي عن نوع المنهج للمدرسة
 * إذا كان اسم المجمع يحتوي على كلمة (عالمي / عالمية / International / American) يتم اعتماد المنهج الأمريكي افتراضياً
 */
export function detectCurriculumType(schoolName = '', configuredType = null) {
  if (configuredType && Object.values(CURRICULUM_TYPES).includes(configuredType)) {
    return configuredType;
  }
  
  const name = (schoolName || '').toLowerCase();
  if (
    name.includes('عالمي') || 
    name.includes('عالمية') || 
    name.includes('international') || 
    name.includes('american') ||
    name.includes('intl')
  ) {
    return CURRICULUM_TYPES.AMERICAN;
  }

  return CURRICULUM_TYPES.SAUDI;
}

/**
 * الحصول على مصفوفة بيانات المنهج المناسبة
 */
export function getCurriculumData(curriculumType = CURRICULUM_TYPES.SAUDI) {
  if (curriculumType === CURRICULUM_TYPES.AMERICAN) {
    return AMERICAN_CURRICULUM_DATA;
  }
  return SAUDI_CURRICULUM_DATA;
}

/**
 * استخراج قائمة المواد المتاحة لفصل دراسي معين
 */
export function getAvailableCurriculumSubjects(curriculumType, semester) {
  const data = getCurriculumData(curriculumType);
  const matchedSemester = Object.keys(data).find(s => s.includes(semester) || semester.includes(s)) || Object.keys(data)[0];
  
  if (!data[matchedSemester]) return [];
  return Object.keys(data[matchedSemester]);
}

/**
 * استخراج الدروس المعتمدة لمادة معينة في فصل دراسي معين
 */
export function getLessonsForSubject(curriculumType, semester, subjectName, className = '') {
  const data = getCurriculumData(curriculumType);
  const matchedSemester = Object.keys(data).find(s => s.includes(semester) || semester.includes(s)) || Object.keys(data)[0];
  const semesterData = data[matchedSemester] || {};

  // Find matching subject key (exact match or includes)
  let matchedSubjectKey = Object.keys(semesterData).find(s => s === subjectName || s.includes(subjectName) || subjectName.includes(s));
  
  if (!matchedSubjectKey) {
    // If not found directly, check if any subject category matches
    const lowerSub = (subjectName || '').toLowerCase();
    matchedSubjectKey = Object.keys(semesterData).find(k => {
      const lowerK = k.toLowerCase();
      return lowerK.includes(lowerSub) || lowerSub.includes(lowerK);
    });
  }

  if (!matchedSubjectKey || !semesterData[matchedSubjectKey]) {
    // Return empty if no match
    return [];
  }

  const list = semesterData[matchedSubjectKey];
  return list.map(item => ({
    grade: item.grade,
    unit: item.unit,
    lesson: item.lesson,
    displayTitle: `${item.lesson} (${item.unit} - ${item.grade})`,
    objectives: item.objectives || []
  }));
}

/**
 * استخراج أهداف درس معين
 */
export function getObjectivesForLesson(curriculumType, semester, subjectName, lessonTitle) {
  const lessons = getLessonsForSubject(curriculumType, semester, subjectName);
  const found = lessons.find(l => l.lesson === lessonTitle || l.displayTitle === lessonTitle || lessonTitle.includes(l.lesson));
  return found ? found.objectives : [];
}

/**
 * تنسيق الأهداف المحددة والمضافة يدوياً إلى نص Markdown
 */
export function formatGoalsToMarkdown(selectedObjectives = [], customObjectives = []) {
  const all = [...selectedObjectives, ...customObjectives].filter(Boolean);
  if (all.length === 0) return '';
  return all.map((obj, i) => `${i + 1}. ${obj}`).join('\n');
}

/**
 * تنسيق استراتيجيات التدريس المختارة والمضافة يدوياً إلى نص Markdown
 */
export function formatStrategiesToMarkdown(selectedStrategies = [], customStrategies = []) {
  const all = [...selectedStrategies, ...customStrategies].filter(Boolean);
  if (all.length === 0) return '';
  return all.map(s => `- ${s}`).join('\n');
}

export { POPULAR_TEACHING_STRATEGIES };
