// =========================================================================
// لوحة ألوان المواد الدراسية المعتمدة لنظام المدارس
// تمنح كل مادة دراسية تدرجاً لونياً مميزاً وأنيقاً في الجداول والتحضير والبطاقات
// =========================================================================

export const SUBJECT_COLOR_PALETTES = {
  blue: {
    id: 'blue',
    name: 'أزرق ملكي',
    bg: '#eff6ff',
    border: '#3b82f6',
    text: '#1d4ed8',
    badgeBg: '#dbeafe',
    badgeText: '#1e40af',
    accent: '#2563eb'
  },
  emerald: {
    id: 'emerald',
    name: 'أخضر إسلامي/زمردي',
    bg: '#f0fdf4',
    border: '#10b981',
    text: '#047857',
    badgeBg: '#d1fae5',
    badgeText: '#065f46',
    accent: '#059669'
  },
  teal: {
    id: 'teal',
    name: 'تركواز/أحياء',
    bg: '#f0fdfa',
    border: '#14b8a6',
    text: '#0f766e',
    badgeBg: '#ccfbf1',
    badgeText: '#115e59',
    accent: '#0d9488'
  },
  cyan: {
    id: 'cyan',
    name: 'سماوي/فيزياء',
    bg: '#ecfeff',
    border: '#06b6d4',
    text: '#0e7490',
    badgeBg: '#cffafe',
    badgeText: '#155e75',
    accent: '#0891b2'
  },
  purple: {
    id: 'purple',
    name: 'بنفسجي/تقنية ورقمية',
    bg: '#faf5ff',
    border: '#a855f7',
    text: '#7e22ce',
    badgeBg: '#f3e8ff',
    badgeText: '#6b21a8',
    accent: '#9333ea'
  },
  magenta: {
    id: 'magenta',
    name: 'ماجنتا/كيمياء',
    bg: '#fdf4ff',
    border: '#d946ef',
    text: '#a21caf',
    badgeBg: '#fae8ff',
    badgeText: '#86198f',
    accent: '#c026d3'
  },
  amber: {
    id: 'amber',
    name: 'عنبري/لغتي وكفايات',
    bg: '#fffbeb',
    border: '#f59e0b',
    text: '#b45309',
    badgeBg: '#fef3c7',
    badgeText: '#92400e',
    accent: '#d97706'
  },
  sky: {
    id: 'sky',
    name: 'أزرق فاتح/إنجليزية',
    bg: '#f0f9ff',
    border: '#0ea5e9',
    text: '#0369a1',
    badgeBg: '#e0f2fe',
    badgeText: '#075985',
    accent: '#0284c7'
  },
  yellow: {
    id: 'yellow',
    name: 'أصفر/دراسات اجتماعية',
    bg: '#fefce8',
    border: '#eab308',
    text: '#a16207',
    badgeBg: '#fef9c3',
    badgeText: '#854d0e',
    accent: '#ca8a04'
  },
  rose: {
    id: 'rose',
    name: 'وردي أحمر/تربية بدنية',
    bg: '#fff1f2',
    border: '#f43f5e',
    text: '#be123c',
    badgeBg: '#ffe4e6',
    badgeText: '#9f1239',
    accent: '#e11d48'
  },
  pink: {
    id: 'pink',
    name: 'زهري/تربية فنية',
    bg: '#fdf2f8',
    border: '#ec4899',
    text: '#be185d',
    badgeBg: '#fce7f3',
    badgeText: '#9d174d',
    accent: '#db2777'
  },
  orange: {
    id: 'orange',
    name: 'برتقالي/مهارات حياتية',
    bg: '#fff7ed',
    border: '#f97316',
    text: '#c2410c',
    badgeBg: '#ffedd5',
    badgeText: '#9a3412',
    accent: '#ea580c'
  },
  violet: {
    id: 'violet',
    name: 'بنفسجي داكن/تفكير ناقد',
    bg: '#f5f3ff',
    border: '#8b5cf6',
    text: '#6d28d9',
    badgeBg: '#ede9fe',
    badgeText: '#5b21b6',
    accent: '#7c3aed'
  },
  slate: {
    id: 'slate',
    name: 'رمادي/إدارة وأعمال',
    bg: '#f8fafc',
    border: '#64748b',
    text: '#334155',
    badgeBg: '#e2e8f0',
    badgeText: '#1e293b',
    accent: '#475569'
  }
};

/**
 * تحديد هوية اللون المناسبة لأي مادة تلقائياً أو بحسب اللون المخصص
 */
export function getSubjectColorTheme(subjectName = '', customColorKey = null) {
  if (customColorKey && SUBJECT_COLOR_PALETTES[customColorKey]) {
    return SUBJECT_COLOR_PALETTES[customColorKey];
  }

  const s = (subjectName || '').toLowerCase().trim();

  // الرياضيات
  if (s.includes('رياضيات') || s.includes('math') || s.includes('algebra') || s.includes('calculus') || s.includes('geometry')) {
    return SUBJECT_COLOR_PALETTES.blue;
  }

  // الفيزياء
  if (s.includes('فيزياء') || s.includes('physics')) {
    return SUBJECT_COLOR_PALETTES.cyan;
  }

  // الكيمياء
  if (s.includes('كيمياء') || s.includes('chemistry')) {
    return SUBJECT_COLOR_PALETTES.magenta;
  }

  // الأحياء والبيئة
  if (s.includes('أحياء') || s.includes('احياء') || s.includes('biology') || s.includes('بيئة') || s.includes('ecology')) {
    return SUBJECT_COLOR_PALETTES.teal;
  }

  // العلوم العامة والفضاء
  if (s.includes('علوم أرض') || s.includes('فضاء') || s.includes('علوم') || s.includes('science') || s.includes('جيولوجيا')) {
    return SUBJECT_COLOR_PALETTES.teal;
  }

  // لغتي والكفايات واللغة العربية
  if (s.includes('لغتي') || s.includes('كفايات') || s.includes('عربي') || s.includes('عربية') || s.includes('بلاغة') || s.includes('أدب') || s.includes('نحو')) {
    return SUBJECT_COLOR_PALETTES.amber;
  }

  // القرآن الكريم والدراسات الإسلامية والشرعية
  if (s.includes('قرآن') || s.includes('إسلامي') || s.includes('اسلامي') || s.includes('توحيد') || s.includes('فقه') || s.includes('حديث') || s.includes('تفسير') || s.includes('تجويد') || s.includes('دين')) {
    return SUBJECT_COLOR_PALETTES.emerald;
  }

  // اللغة الإنجليزية و ELA
  if (s.includes('إنجليزي') || s.includes('انجليزي') || s.includes('english') || s.includes('mega') || s.includes('super') || s.includes('we can') || s.includes('ela') || s.includes('top goal')) {
    return SUBJECT_COLOR_PALETTES.sky;
  }

  // التقنية الرقمية والحاسب والبرمجة والذكاء الاصطناعي
  if (s.includes('تقنية') || s.includes('حاسب') || s.includes('برمجة') || s.includes('ذكاء') || s.includes('بيانات') || s.includes('هندسة برمجية') || s.includes('iot') || s.includes('computer') || s.includes('python') || s.includes('رقمية')) {
    return SUBJECT_COLOR_PALETTES.purple;
  }

  // الدراسات الاجتماعية والتاريخ والجغرافيا
  if (s.includes('اجتماعيات') || s.includes('تاريخ') || s.includes('جغرافيا') || s.includes('وطنية') || s.includes('social')) {
    return SUBJECT_COLOR_PALETTES.yellow;
  }

  // التربية البدنية والدفاع عن النفس والرياضة
  if (s.includes('بدنية') || s.includes('رياضة') || s.includes('دفاع عن النفس') || s.includes('pe') || s.includes('sports')) {
    return SUBJECT_COLOR_PALETTES.rose;
  }

  // التربية الفنية والرسم
  if (s.includes('فنية') || s.includes('رسم') || s.includes('art') || s.includes('design')) {
    return SUBJECT_COLOR_PALETTES.pink;
  }

  // المهارات الحياتية والأسرية
  if (s.includes('حياتية') || s.includes('أسرية') || s.includes('اسرية') || s.includes('life skills')) {
    return SUBJECT_COLOR_PALETTES.orange;
  }

  // التفكير الناقد
  if (s.includes('تفكير ناقد') || s.includes('ناقد') || s.includes('critical')) {
    return SUBJECT_COLOR_PALETTES.violet;
  }

  // إدارة الأعمال والمالية والقانون
  if (s.includes('إدارة') || s.includes('ادارة') || s.includes('محاسبة') || s.includes('قانون') || s.includes('مالية') || s.includes('business') || s.includes('finance')) {
    return SUBJECT_COLOR_PALETTES.slate;
  }

  // العلوم الصحية والتشريح
  if (s.includes('صحي') || s.includes('صحة') || s.includes('جسم الإنسان') || s.includes('رعاية') || s.includes('health')) {
    return SUBJECT_COLOR_PALETTES.teal;
  }

  return SUBJECT_COLOR_PALETTES.blue;
}
