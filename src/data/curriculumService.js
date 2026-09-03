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
    // Secondary Pathways Specific Subjects
    'الرياضيات 1-1': ['رياضيات 1-1', 'رياضيات 1', 'رياضيات1-1', '1-1', 'رياضيات 1ث ف1', 'الرياضيات 1-1', 'math 1-1', 'math 1'],
    'الرياضيات 1-2': ['رياضيات 1-2', 'رياضيات1-2', '1-2', 'رياضيات 1ث ف2', 'الرياضيات 1-2', 'math 1-2'],
    'الرياضيات 2-1': ['رياضيات 2-1', 'رياضيات 2', 'رياضيات2-1', '2-1', 'رياضيات 2ث ف1', 'الرياضيات 2-1', 'math 2-1', 'math 2'],
    'الرياضيات 2-2': ['رياضيات 2-2', 'رياضيات2-2', '2-2', 'رياضيات 2ث ف2', 'الرياضيات 2-2', 'math 2-2'],
    'الرياضيات': ['رياضيات', 'الرياضيات', 'math', 'maths', 'mathematics', 'حساب'],

    'الكفايات اللغوية 1-1': ['كفايات 1-1', 'كفايات 1', 'الكفايات اللغوية 1-1', 'كفايات 1ث ف1', 'عربي 1-1'],
    'الكفايات اللغوية 1-2': ['كفايات 1-2', 'الكفايات اللغوية 1-2', 'كفايات 1ث ف2', 'عربي 1-2'],
    'الكفايات اللغوية': ['كفايات', 'الكفايات', 'الكفايات اللغوية'],
    'لغتي الجميلة': ['لغتي الجميلة', 'لغتي ابتدائى', 'لغتي صفوف أولية', 'لغتي'],
    'لغتي الخالدة': ['لغتي الخالدة', 'لغتي متوسط', 'لغتي'],
    'اللغة العربية': ['لغة عربية', 'اللغة العربية', 'عربي', 'نحو', 'إملاء', 'املاء', 'قراءة', 'arabic', 'ela'],

    'الفيزياء 1': ['فيزياء 1', 'فيزياء 1-1', 'الفيزياء 1', 'physics 1'],
    'الفيزياء 2-1': ['فيزياء 2-1', 'فيزياء 2', 'الفيزياء 2-1', 'physics 2-1'],
    'الفيزياء 2-2': ['فيزياء 2-2', 'الفيزياء 2-2', 'physics 2-2'],
    'الفيزياء': ['فيزياء', 'الفيزياء', 'physics'],

    'الكيمياء 1': ['كيمياء 1', 'كيمياء 1-1', 'الكيمياء 1', 'chemistry 1'],
    'الكيمياء 2-1': ['كيمياء 2-1', 'كيمياء 2', 'الكيمياء 2-1', 'chemistry 2-1'],
    'الكيمياء 2-2': ['كيمياء 2-2', 'الكيمياء 2-2', 'chemistry 2-2'],
    'الكيمياء': ['كيمياء', 'الكيمياء', 'chemistry'],

    'الأحياء 2-1': ['أحياء 2-1', 'احياء 2-1', 'الأحياء 2-1', 'biology 2-1'],
    'الأحياء 2-2': ['أحياء 2-2', 'احياء 2-2', 'الأحياء 2-2', 'biology 2-2'],
    'الأحياء': ['أحياء', 'احياء', 'الأحياء', 'الاحياء', 'biology', 'علم الأحياء', 'life science'],

    'علم البيئة 1-1': ['علم البيئة 1-1', 'بيئة 1-1', 'علم البيئة', 'بيئة', 'البيئة', 'ecology', 'environmental'],
    'علوم الأرض والفضاء': ['علوم الأرض', 'علوم الارض', 'فضاء', 'الفضاء', 'جيولوجيا', 'earth science', 'astronomy', 'earth & space', 'جيولوجيا وفلك'],

    'التقنية الرقمية 1-1': ['تقنية رقمية 1-1', 'تقنية 1-1', 'التقنية الرقمية 1-1', 'حاسب 1-1'],
    'التقنية الرقمية 1-2': ['تقنية رقمية 1-2', 'تقنية 1-2', 'التقنية الرقمية 1-2', 'حاسب 1-2'],
    'التقنية الرقمية 2-1': ['تقنية رقمية 2-1', 'تقنية 2-1', 'التقنية الرقمية 2-1', 'حاسب 2-1'],
    'التقنية الرقمية': ['تقنية', 'التقنية', 'تقنية رقمية', 'التقنية الرقمية', 'حاسب', 'حاسب آلي', 'حاسوب', 'computer', 'ict', 'it', 'digital skills'],
    'المهارات الرقمية': ['مهارات رقمية', 'المهارات الرقمية', 'حاسب ابتدائي', 'حاسب متوسط', 'حاسوب', 'برمجة', 'سكراتش', 'scratch'],

    'الذكاء الاصطناعي 1-1 وعلم البيانات': ['ذكاء اصطناعي', 'الذكاء الاصطناعي', 'علم البيانات', 'بيانات وذكاء', 'ai', 'data science', 'artificial intelligence'],
    'مبادئ الإدارة والأعمال': ['إدارة أعمال', 'مبادئ الإدارة', 'ادارة اعمال', 'إدارة', 'اعمال', 'business', 'management'],
    'مبادئ العلوم الصحية': ['علوم صحية', 'العلوم الصحية', 'صحة وحياة', 'صحة', 'health science', 'health'],
    'الهندسة البرمجية وإنترنت الأشياء': ['هندسة برمجية', 'إنترنت الأشياء', 'انترنت الاشياء', 'iot', 'software engineering'],
    'أنظمة جسم الإنسان والرعاية الصحية': ['أنظمة جسم الإنسان', 'انظمة جسم الانسان', 'رعاية صحية', 'تشريح', 'human body', 'anatomy'],
    'المحاسبة والمالية والقانون': ['محاسبة', 'مالية', 'قانون', 'المحاسبة', 'accounting', 'finance', 'law'],
    'الدراسات البلاغية والنقدية والقرآنية': ['بلاغة ونقد', 'دراسات بلاغية', 'أصول فقه', 'اصول الفقه', 'بلاغة'],

    'اللغة الإنجليزية 1-1': ['انجليزي 1-1', 'إنجليزي 1-1', 'mega goal 1.1', 'mega goal 1', 'english 1-1', 'اللغة الإنجليزية 1-1'],
    'اللغة الإنجليزية 1-2': ['انجليزي 1-2', 'إنجليزي 1-2', 'mega goal 1.2', 'english 1-2', 'اللغة الإنجليزية 1-2'],
    'اللغة الإنجليزية 2-1': ['انجليزي 2-1', 'إنجليزي 2-1', 'mega goal 2.1', 'mega goal 2', 'english 2-1', 'اللغة الإنجليزية 2-1'],
    'اللغة الإنجليزية 2-2': ['انجليزي 2-2', 'إنجليزي 2-2', 'mega goal 2.2', 'english 2-2', 'اللغة الإنجليزية 2-2'],
    'اللغة الإنجليزية': ['إنجليزي', 'انجليزي', 'الانجليزي', 'الإنجليزي', 'اللغة الإنجليزية', 'اللغة الانجليزية', 'english', 'mega goal', 'super goal', 'we can', 'top goal'],

    'الدراسات الإسلامية 1-1': ['دراسات إسلامية 1-1', 'إسلاميات 1-1', 'دين 1-1', 'الدراسات الإسلامية 1-1'],
    'الدراسات الإسلامية التخصصية': ['دراسات إسلامية تخصصية', 'توحيد 2', 'حديث 2', 'علوم شرعية', 'تخصصي شرعي'],
    'القرآن الكريم والدراسات الإسلامية': ['دراسات إسلامية', 'الدراسات الإسلامية', 'دراسات اسلامية', 'إسلاميات', 'تربية إسلامية', 'دين', 'القرآن', 'القرآن الكريم', 'قرآن', 'توحيد', 'فقه', 'حديث', 'تفسير', 'تجويد', 'islamic'],

    'التاريخ والدراسات الاجتماعية': ['تاريخ واجتماعيات', 'تاريخ ثانوي', 'تاريخ', 'التاريخ والدراسات الاجتماعية'],
    'الدراسات الاجتماعية': ['اجتماعيات', 'الاجتماعيات', 'دراسات اجتماعية', 'الدراسات الاجتماعية', 'تاريخ', 'التاريخ', 'جغرافيا', 'الجغرافيا', 'وطنية', 'تربية وطنية', 'social studies', 'history', 'geography'],

    'العلوم': ['علوم', 'العلوم', 'science', 'general science', 'physical science'],
    'التفكير الناقد': ['تفكير ناقد', 'التفكير الناقد', 'critical thinking'],
    'التربية الصحية والبدنية 1-1': ['تربية صحية وبدنية', 'صحي وبدني', 'بدنية 1-1', 'التربية الصحية والبدنية 1-1'],
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
 * الكشف والمطابقة الذكية للفصل الدراسي لدعم كافة التنسيقات (ف1، ف2، الفصل الأول، الفصل الثاني، إلخ)
 */
export function matchSemesterKey(semester = '', availableSemesterKeys = []) {
  if (!availableSemesterKeys || availableSemesterKeys.length === 0) return 'الفصل الدراسي الأول';
  const semClean = (semester || '').toLowerCase().trim();
  
  if (
    semClean.includes('ثان') || 
    semClean.includes('ف2') || 
    semClean.includes('ف 2') || 
    semClean.includes('term 2') || 
    semClean.includes('semester 2') || 
    semClean.includes('2') || 
    semClean.includes('second') || 
    semClean.includes('2nd')
  ) {
    const matchedSecond = availableSemesterKeys.find(k => 
      k.includes('ثان') || k.includes('2') || k.toLowerCase().includes('second')
    );
    if (matchedSecond) return matchedSecond;
  }
  
  const matchedFirst = availableSemesterKeys.find(k => 
    k.includes('أول') || k.includes('ف1') || k.includes('ف 1') || k.includes('1') || k.toLowerCase().includes('first')
  );
  if (matchedFirst) return matchedFirst;

  return availableSemesterKeys[0];
}

/**
 * استخراج قائمة المواد المتاحة لفصل دراسي ومرحلة معينة بدقة صارمة
 */
export function getAvailableCurriculumSubjects(curriculumType, semester, className = '', explicitStage = null) {
  const data = getCurriculumData(curriculumType);
  const stage = explicitStage || detectStageFromClassName(className, curriculumType);
  
  const stageData = data[stage];
  if (!stageData) return [];

  // Match Semester with intelligent flexibility
  const matchedSemesterKey = matchSemesterKey(semester, Object.keys(stageData));
  if (!matchedSemesterKey || !stageData[matchedSemesterKey]) return [];

  return Object.keys(stageData[matchedSemesterKey]);
}

import { getSubjectColorTheme, SUBJECT_COLOR_PALETTES } from './subjectThemes';

/**
 * استخراج الدروس المعتمدة لمادة معينة في فصل دراسي ومرحلة محددة مع دعم المواد المخصصة
 */
export function getLessonsForSubject(curriculumType, semester, subjectName = '', className = '', explicitStage = null, customSubjectsList = []) {
  // 1. Check custom subjects list first
  if (subjectName && Array.isArray(customSubjectsList) && customSubjectsList.length > 0) {
    const custom = customSubjectsList.find(cs => cs.name?.trim() === subjectName.trim() || cs.name?.toLowerCase().trim() === subjectName.toLowerCase().trim());
    if (custom && Array.isArray(custom.lessons) && custom.lessons.length > 0) {
      return custom.lessons.map(item => {
        const lessonTitle = typeof item === 'string' ? item : (item.lesson || item.title || '');
        const unitTitle = typeof item === 'object' && item.unit ? item.unit : 'وحدة تعليمية';
        const objs = typeof item === 'object' && Array.isArray(item.objectives) ? item.objectives : [];
        return {
          subject: custom.name,
          grade: custom.grade || custom.stage || 'مادة مخصصة',
          unit: unitTitle,
          lesson: lessonTitle,
          displayTitle: `[${custom.name}] ${lessonTitle} (${unitTitle})`,
          shortTitle: `${lessonTitle}`,
          objectives: objs
        };
      });
    }
  }

  const data = getCurriculumData(curriculumType);
  const stage = explicitStage || detectStageFromClassName(className, curriculumType);
  
  const stageData = data[stage];
  if (!stageData) return [];

  const matchedSemesterKey = matchSemesterKey(semester, Object.keys(stageData));
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
export function getObjectivesForLesson(curriculumType, semester, subjectName, lessonTitle, className = '', customSubjectsList = []) {
  const lessons = getLessonsForSubject(curriculumType, semester, subjectName, className, null, customSubjectsList);
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

export { 
  POPULAR_TEACHING_STRATEGIES, 
  POPULAR_LEARNING_RESOURCES, 
  SAUDI_STAGES, 
  AMERICAN_STAGES,
  getSubjectColorTheme,
  SUBJECT_COLOR_PALETTES
};

