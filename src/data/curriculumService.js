import { SAUDI_CURRICULUM_STRICT, SAUDI_STAGES } from './saudiCurriculumData';
import { AMERICAN_CURRICULUM_STRICT, AMERICAN_STAGES } from './americanCurriculumData';
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
 * الكشف الذكي الصارم عن المرحلة التعليمية من اسم الفصل (الصف)
 */
export function detectStageFromClassName(className = '', curriculumType = CURRICULUM_TYPES.SAUDI) {
  const name = (className || '').toLowerCase().trim();
  
  if (curriculumType === CURRICULUM_TYPES.AMERICAN) {
    if (
      name.includes('high') || name.includes('9') || name.includes('10') || 
      name.includes('11') || name.includes('12') || name.includes('secondary')
    ) {
      return AMERICAN_STAGES.HIGH;
    }
    if (
      name.includes('middle') || name.includes('6') || name.includes('7') || 
      name.includes('8') || name.includes('prep')
    ) {
      return AMERICAN_STAGES.MIDDLE;
    }
    return AMERICAN_STAGES.ELEMENTARY;
  }

  // Saudi Curriculum Stage Detection
  if (
    name.includes('ثانوي') || 
    name.includes('ثانوية') || 
    name.includes('مسار') || 
    name.includes('مسارات') ||
    name.includes('1 ثانوي') ||
    name.includes('2 ثانوي') ||
    name.includes('3 ثانوي') ||
    name.includes('أول ثانوي') ||
    name.includes('ثاني ثانوي') ||
    name.includes('ثالث ثانوي')
  ) {
    return SAUDI_STAGES.SECONDARY;
  }

  if (
    name.includes('متوسط') || 
    name.includes('متوسطة') || 
    name.includes('1 متوسط') ||
    name.includes('2 متوسط') ||
    name.includes('3 متوسط') ||
    name.includes('أول متوسط') ||
    name.includes('ثاني متوسط') ||
    name.includes('ثالث متوسط')
  ) {
    return SAUDI_STAGES.INTERMEDIATE;
  }

  if (
    name.includes('ابتدائي') || 
    name.includes('ابتدائية') ||
    name.includes('أول ابتدائي') ||
    name.includes('ثاني ابتدائي') ||
    name.includes('ثالث ابتدائي') ||
    name.includes('رابع ابتدائي') ||
    name.includes('خامس ابتدائي') ||
    name.includes('سادس ابتدائي') ||
    name.includes('أول') ||
    name.includes('ثاني') ||
    name.includes('ثالث') ||
    name.includes('رابع') ||
    name.includes('خامس') ||
    name.includes('سادس')
  ) {
    return SAUDI_STAGES.PRIMARY;
  }

  // Default to Secondary if contains 'ثانوي' else Primary
  return SAUDI_STAGES.SECONDARY;
}

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
 * الحصول على مصفوفة بيانات المنهج المناسبة للمرحلة بدقة
 */
export function getCurriculumData(curriculumType = CURRICULUM_TYPES.SAUDI) {
  if (curriculumType === CURRICULUM_TYPES.AMERICAN) {
    return AMERICAN_CURRICULUM_STRICT;
  }
  return SAUDI_CURRICULUM_STRICT;
}

/**
 * استخراج قائمة المواد المتاحة لفصل دراسي ومرحلة معينة بدقة صارمة
 */
export function getAvailableCurriculumSubjects(curriculumType, semester, className = '', explicitStage = null) {
  const data = getCurriculumData(curriculumType);
  const stage = explicitStage || detectStageFromClassName(className, curriculumType);
  
  const stageData = data[stage];
  if (!stageData) return [];

  // Match Semester
  const matchedSemesterKey = Object.keys(stageData).find(s => s.includes(semester) || semester.includes(s)) || Object.keys(stageData)[0];
  if (!matchedSemesterKey || !stageData[matchedSemesterKey]) return [];

  return Object.keys(stageData[matchedSemesterKey]);
}

/**
 * استخراج الدروس المعتمدة لمادة معينة في فصل دراسي ومرحلة محددة بدقة تامة ومنع تداخل المراحل
 */
export function getLessonsForSubject(curriculumType, semester, subjectName, className = '', explicitStage = null) {
  const data = getCurriculumData(curriculumType);
  const stage = explicitStage || detectStageFromClassName(className, curriculumType);
  
  const stageData = data[stage];
  if (!stageData) return [];

  const matchedSemesterKey = Object.keys(stageData).find(s => s.includes(semester) || semester.includes(s)) || Object.keys(stageData)[0];
  const semesterData = stageData[matchedSemesterKey] || {};

  // Find exact or closest subject match within the stage
  let matchedSubjectKey = Object.keys(semesterData).find(s => s === subjectName || s.includes(subjectName) || subjectName.includes(s));
  
  if (!matchedSubjectKey) {
    const lowerSub = (subjectName || '').toLowerCase();
    matchedSubjectKey = Object.keys(semesterData).find(k => {
      const lowerK = k.toLowerCase();
      return lowerK.includes(lowerSub) || lowerSub.includes(lowerK);
    });
  }

  // If still not matched, check if all subjects in stage have lessons
  if (!matchedSubjectKey) {
    // If subject not found directly, return all lessons for this stage's semester as fallback
    const allLessons = [];
    Object.values(semesterData).forEach(list => {
      if (Array.isArray(list)) allLessons.push(...list);
    });
    return allLessons.map(item => ({
      grade: item.grade,
      unit: item.unit,
      lesson: item.lesson,
      displayTitle: `${item.lesson} (${item.unit} - ${item.grade})`,
      objectives: item.objectives || []
    }));
  }

  const list = semesterData[matchedSubjectKey] || [];
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
export function getObjectivesForLesson(curriculumType, semester, subjectName, lessonTitle, className = '') {
  const lessons = getLessonsForSubject(curriculumType, semester, subjectName, className);
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

export { POPULAR_TEACHING_STRATEGIES, SAUDI_STAGES, AMERICAN_STAGES };
