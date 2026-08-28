import { SAUDI_CURRICULUM_STRICT, SAUDI_STAGES } from './saudiCurriculumData';
import { AMERICAN_CURRICULUM_STRICT, AMERICAN_STAGES } from './americanCurriculumData';
import { POPULAR_TEACHING_STRATEGIES, POPULAR_LEARNING_RESOURCES } from './teachingStrategies';

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

  // Default to Secondary
  return SAUDI_STAGES.SECONDARY;
}

/**
 * الكشف الذكي عن نوع المنهج للمدرسة
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
 * تنظيف ومطابقة مسميات المواد بدقة ذكية فائقة
 */
export function matchSubjectKey(rawSubject = '', availableKeys = []) {
  if (!rawSubject || !availableKeys || availableKeys.length === 0) return null;

  const raw = rawSubject.trim();
  const rawClean = raw.replace(/^(مادة|درس|كتاب)\s+/g, '').trim().toLowerCase();

  // 1. Direct match
  const directMatch = availableKeys.find(k => k.trim() === raw || k.toLowerCase().trim() === rawClean);
  if (directMatch) return directMatch;

  // 2. Exact word inclusion
  const includeMatch = availableKeys.find(k => {
    const kClean = k.toLowerCase().trim();
    return kClean.includes(rawClean) || rawClean.includes(kClean);
  });
  if (includeMatch) return includeMatch;

  // 3. Subject aliases & keywords map
  const SUBJECT_KEYWORDS = {
    'الرياضيات 1-1': ['رياضيات 1-1', 'رياضيات 1', 'رياضيات1-1', '1-1', 'رياضيات 1ث', 'رياضيات 1ث ف1', 'رياضيات', 'الرياضيات', 'الرياضيات 1-1', 'math 1-1', 'math 1', 'math', 'maths', 'mathematics'],
    'الرياضيات': ['رياضيات 1-1', 'رياضيات 1', 'رياضيات1-1', '1-1', 'رياضيات 1ث', 'رياضيات 1ث ف1', 'رياضيات', 'الرياضيات', 'الرياضيات 1-1', 'math 1-1', 'math 1', 'math', 'maths', 'mathematics'],
    'الأحياء': ['أحياء', 'احياء', 'الأحياء', 'الاحياء', 'biology', 'علم الأحياء', 'life science'],
    'الفيزياء': ['فيزياء', 'الفيزياء', 'physics', 'فيزيائية'],
    'الكيمياء': ['كيمياء', 'الكيمياء', 'chemistry', 'كيميائية'],
    'علم البيئة': ['بيئة', 'البيئة', 'علم البيئة', 'ecology', 'environmental'],
    'علوم الأرض والفضاء': ['علوم الأرض', 'علوم الارض', 'فضاء', 'الفضاء', 'جيولوجيا', 'earth science', 'astronomy', 'earth & space'],
    'الكفايات اللغوية (اللغة العربية)': ['كفايات', 'الكفايات', 'الكفايات اللغوية', 'لغتي', 'لغتي الخالدة', 'لغتي الجميلة', 'لغة عربية', 'اللغة العربية', 'عربي', 'نحو', 'إملاء', 'املاء', 'بلاغة', 'أدب', 'ادب', 'قراءة', 'arabic', 'ela'],
    'التقنية الرقمية (الحاسب والبرمجة)': ['تقنية', 'التقنية', 'تقنية رقمية', 'التقنية الرقمية', 'مهارات رقمية', 'المهارات الرقمية', 'حاسب', 'حاسب آلي', 'الحاسب الآلي', 'حاسوب', 'الحاسوب', 'برمجة', 'بايثون', 'python', 'computer', 'ict', 'it', 'digital skills'],
    'القرآن الكريم والدراسات الإسلامية': ['دراسات إسلامية', 'الدراسات الإسلامية', 'دراسات اسلامية', 'إسلاميات', 'اسلاميات', 'تربية إسلامية', 'التربية الإسلامية', 'دين', 'القرآن', 'القرآن الكريم', 'قرآن', 'توحيد', 'التوحيد', 'فقه', 'الفقه', 'حديث', 'الحديث', 'تفسير', 'التفسير', 'تجويد', 'islamic'],
    'الدراسات الاجتماعية': ['اجتماعيات', 'الاجتماعيات', 'دراسات اجتماعية', 'الدراسات الاجتماعية', 'تاريخ', 'التاريخ', 'جغرافيا', 'الجغرافيا', 'وطنية', 'تربية وطنية', 'social studies', 'history', 'geography'],
    'اللغة الإنجليزية': ['إنجليزي', 'انجليزي', 'الانجليزي', 'الإنجليزي', 'اللغة الإنجليزية', 'اللغة الانجليزية', 'english', 'mega goal', 'super goal', 'we can', 'top goal'],
    'العلوم': ['علوم', 'العلوم', 'science', 'general science', 'physical science'],
    'التفكير الناقد': ['تفكير ناقد', 'التفكير الناقد', 'critical thinking'],
    'التربية البدنية والدفاع عن النفس': ['بدنية', 'البدنية', 'تربية بدنية', 'التربية البدنية', 'دفاع عن النفس', 'رياضة', 'pe', 'physical education', 'sports'],
    'التربية الفنية': ['فنية', 'الفنية', 'تربية فنية', 'التربية الفنية', 'رسم', 'الرسم', 'art', 'arts', 'fine arts'],
    'المهارات الحياتية والأسرية': ['مهارات حياتية', 'المهارات الحياتية', 'مهارات أسرية', 'المهارات الأسرية', 'تربية أسرية', 'life skills', 'home economics']
  };

  for (const [canonical, keywords] of Object.entries(SUBJECT_KEYWORDS)) {
    const isMatched = keywords.some(kw => rawClean.includes(kw) || kw.includes(rawClean));
    if (isMatched) {
      // Find key matching canonical or any of keywords
      const foundKey = availableKeys.find(k => {
        const kClean = k.toLowerCase().trim();
        return kClean.includes(canonical.toLowerCase()) || 
          keywords.some(kw => kClean.includes(kw));
      });
      if (foundKey) return foundKey;
    }
  }

  return null;
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
 * استخراج الدروس المعتمدة لمادة معينة في فصل دراسي ومرحلة محددة مع التمييز الواضح التام للمواد
 */
export function getLessonsForSubject(curriculumType, semester, subjectName = '', className = '', explicitStage = null) {
  const data = getCurriculumData(curriculumType);
  const stage = explicitStage || detectStageFromClassName(className, curriculumType);
  
  const stageData = data[stage];
  if (!stageData) return [];

  const matchedSemesterKey = Object.keys(stageData).find(s => s.includes(semester) || semester.includes(s)) || Object.keys(stageData)[0];
  const semesterData = stageData[matchedSemesterKey] || {};
  const availableSubjectKeys = Object.keys(semesterData);

  if (availableSubjectKeys.length === 0) return [];

  // If specific subjectName is provided and is not '__ALL__'
  if (subjectName && subjectName !== '__ALL__') {
    const matchedKey = matchSubjectKey(subjectName, availableSubjectKeys);
    if (matchedKey && semesterData[matchedKey]) {
      const list = semesterData[matchedKey] || [];
      return list.map(item => ({
        subject: item.subject || matchedKey,
        grade: item.grade,
        unit: item.unit,
        lesson: item.lesson,
        displayTitle: `[${item.subject || matchedKey}] ${item.lesson} (${item.unit} - ${item.grade})`,
        shortTitle: `${item.lesson} (${item.unit})`,
        objectives: item.objectives || []
      }));
    }
  }

  // Fallback: If no subject matched or all subjects requested, return all lessons categorized with clear subject tags
  const allLessons = [];
  Object.entries(semesterData).forEach(([subjKey, list]) => {
    if (Array.isArray(list)) {
      list.forEach(item => {
        allLessons.push({
          subject: item.subject || subjKey,
          grade: item.grade,
          unit: item.unit,
          lesson: item.lesson,
          displayTitle: `[${item.subject || subjKey}] ${item.lesson} (${item.unit} - ${item.grade})`,
          shortTitle: `${item.lesson} (${item.unit})`,
          objectives: item.objectives || []
        });
      });
    }
  });

  return allLessons;
}

/**
 * تجميع قائمة الدروس حسب المادة لتمكين الـ optgroup والعرض المصنف بدقة
 */
export function groupLessonsBySubject(lessons = []) {
  const groups = {};
  lessons.forEach(l => {
    const s = l.subject || 'دروس عامة';
    if (!groups[s]) groups[s] = [];
    groups[s].push(l);
  });
  return groups;
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

/**
 * تنسيق مصادر التعلم المختارة والمضافة يدوياً إلى نص Markdown
 */
export function formatResourcesToMarkdown(selectedResources = [], customResources = []) {
  const all = [...selectedResources, ...customResources].filter(Boolean);
  if (all.length === 0) return '';
  return all.map(r => `- ${r}`).join('\n');
}

export { POPULAR_TEACHING_STRATEGIES, POPULAR_LEARNING_RESOURCES, SAUDI_STAGES, AMERICAN_STAGES };

