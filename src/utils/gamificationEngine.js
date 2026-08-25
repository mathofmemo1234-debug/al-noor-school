/**
 * Gamification & Activity Points Calculation Engine
 * For Students and Teachers across the school system.
 */

// ==========================================
// STUDENT GAMIFICATION
// ==========================================

export const STUDENT_LEVELS = [
  { minPoints: 0, stars: 1, title: 'طالب منطلق (مستوى برونزي)', color: '#b45309', badge: '🥉' },
  { minPoints: 30, stars: 2, title: 'طالب مجتهد (مستوى فضي)', color: '#475569', badge: '🥈' },
  { minPoints: 70, stars: 3, title: 'طالب متفاعل (مستوى ذهبي)', color: '#d97706', badge: '🥇' },
  { minPoints: 130, stars: 4, title: 'طالب متميز (مستوى بلاتيني)', color: '#0284c7', badge: '💎' },
  { minPoints: 200, stars: 5, title: 'طالب متألق استثنائي (مستوى ماسي)', color: '#7c3aed', badge: '👑' }
];

export function getStudentLevel(points = 0) {
  let current = STUDENT_LEVELS[0];
  for (const lvl of STUDENT_LEVELS) {
    if (points >= lvl.minPoints) {
      current = lvl;
    }
  }
  const nextLvl = STUDENT_LEVELS.find(lvl => lvl.minPoints > points) || null;
  const progressToNext = nextLvl 
    ? Math.min(100, Math.round(((points - current.minPoints) / (nextLvl.minPoints - current.minPoints)) * 100))
    : 100;

  return {
    ...current,
    points,
    nextLevel: nextLvl,
    progressToNext
  };
}

export function calculateStudentActivity({
  studentId,
  assignmentResults = [],
  examResults = [],
  attendanceDocs = []
}) {
  let assignmentPoints = 0;
  let examPoints = 0;
  let attendancePoints = 0;

  let completedAssignmentsCount = 0;
  let completedExamsCount = 0;
  let presentDaysCount = 0;
  let absentDaysCount = 0;

  // 1. Assignment Points
  if (Array.isArray(assignmentResults)) {
    assignmentResults.forEach(res => {
      const sid = res.studentId || res.studentDocId;
      if (sid === studentId) {
        completedAssignmentsCount++;
        // Base points per submission
        assignmentPoints += 10;
        
        const score = typeof res.score === 'number' ? res.score : parseFloat(res.score) || 0;
        const total = typeof res.totalQuestions === 'number' ? res.totalQuestions : parseFloat(res.totalQuestions) || (typeof res.maxScore === 'number' ? res.maxScore : 10);
        const ratio = total > 0 ? score / total : 0;

        if (ratio >= 0.99) {
          assignmentPoints += 10; // Perfect score bonus
        } else if (ratio >= 0.8) {
          assignmentPoints += 5; // High score bonus
        }
      }
    });
  }

  // 2. Exam Points
  if (Array.isArray(examResults)) {
    examResults.forEach(res => {
      const sid = res.studentId || res.studentDocId;
      if (sid === studentId) {
        completedExamsCount++;
        // Base points per exam completed
        examPoints += 15;

        const score = typeof res.score === 'number' ? res.score : parseFloat(res.score) || 0;
        const total = typeof res.totalQuestions === 'number' ? res.totalQuestions : parseFloat(res.totalQuestions) || (typeof res.maxScore === 'number' ? res.maxScore : 20);
        const ratio = total > 0 ? score / total : 0;

        if (ratio >= 0.99) {
          examPoints += 15; // Perfect score bonus
        } else if (ratio >= 0.8) {
          examPoints += 10; // High score bonus
        }
      }
    });
  }

  // 3. Daily Attendance Points
  if (Array.isArray(attendanceDocs)) {
    attendanceDocs.forEach(doc => {
      const records = doc.records || {};
      const status = records[studentId];
      if (status === 'present') {
        presentDaysCount++;
        attendancePoints += 5;
      } else if (status === 'absent') {
        absentDaysCount++;
      }
    });
  }

  const totalPoints = assignmentPoints + examPoints + attendancePoints;
  const levelInfo = getStudentLevel(totalPoints);

  return {
    studentId,
    totalPoints,
    stars: levelInfo.stars,
    levelTitle: levelInfo.title,
    levelBadge: levelInfo.badge,
    levelColor: levelInfo.color,
    progressToNext: levelInfo.progressToNext,
    nextLevel: levelInfo.nextLevel,
    breakdown: {
      assignmentPoints,
      completedAssignmentsCount,
      examPoints,
      completedExamsCount,
      attendancePoints,
      presentDaysCount,
      absentDaysCount
    }
  };
}

// ==========================================
// TEACHER GAMIFICATION
// ==========================================

export const TEACHER_LEVELS = [
  { minPoints: 0, stars: 1, title: 'معلم منطلق ومبادر', color: '#0f766e', badge: '🌱' },
  { minPoints: 50, stars: 2, title: 'معلم نشط وفعّال', color: '#0284c7', badge: '⭐' },
  { minPoints: 120, stars: 3, title: 'معلم متميز ومتفاعل', color: '#d97706', badge: '🌟' },
  { minPoints: 250, stars: 4, title: 'معلم مبدع وخبير', color: '#7c3aed', badge: '💎' },
  { minPoints: 450, stars: 5, title: 'معلم قيادي واستثنائي', color: '#be123c', badge: '👑' }
];

export function getTeacherLevel(points = 0) {
  let current = TEACHER_LEVELS[0];
  for (const lvl of TEACHER_LEVELS) {
    if (points >= lvl.minPoints) {
      current = lvl;
    }
  }
  const nextLvl = TEACHER_LEVELS.find(lvl => lvl.minPoints > points) || null;
  const progressToNext = nextLvl 
    ? Math.min(100, Math.round(((points - current.minPoints) / (nextLvl.minPoints - current.minPoints)) * 100))
    : 100;

  return {
    ...current,
    points,
    nextLevel: nextLvl,
    progressToNext
  };
}

export function calculateTeacherActivity({
  teacherId,
  teacherEmail = '',
  preparations = [],
  weeklyPlans = [],
  assignments = [],
  exams = [],
  attendanceLogs = [],
  materials = []
}) {
  let prepPoints = 0;
  let planPoints = 0;
  let assignmentPoints = 0;
  let examPoints = 0;
  let attendancePoints = 0;
  let materialPoints = 0;

  const matchesTeacher = (item) => {
    if (!item) return false;
    if (teacherId && (item.teacherId === teacherId || item.teacherDocId === teacherId)) return true;
    if (teacherEmail && (item.teacherEmail === teacherEmail || item.email === teacherEmail || item.createdBy === teacherEmail)) return true;
    return false;
  };

  // 1. Preparations (+20 per prep)
  const myPreps = preparations.filter(matchesTeacher);
  prepPoints = myPreps.length * 20;

  // 2. Weekly Plans (+25 per plan)
  const myPlans = weeklyPlans.filter(matchesTeacher);
  planPoints = myPlans.length * 25;

  // 3. Published Assignments (+15 per assignment)
  const myAssignments = assignments.filter(matchesTeacher);
  assignmentPoints = myAssignments.length * 15;

  // 4. Published Exams (+20 per exam)
  const myExams = exams.filter(matchesTeacher);
  examPoints = myExams.length * 20;

  // 5. Materials Uploaded (+10 per material)
  const myMaterials = materials.filter(matchesTeacher);
  materialPoints = myMaterials.length * 10;

  // 6. Attendance Sessions Recorded (+10 per attendance recorded)
  // Attendance logs matching teacher's class or recorded by teacher
  const myAttendance = attendanceLogs.filter(matchesTeacher);
  attendancePoints = myAttendance.length * 10;

  const totalPoints = prepPoints + planPoints + assignmentPoints + examPoints + materialPoints + attendancePoints;
  const levelInfo = getTeacherLevel(totalPoints);

  return {
    teacherId,
    totalPoints,
    stars: levelInfo.stars,
    levelTitle: levelInfo.title,
    levelBadge: levelInfo.badge,
    levelColor: levelInfo.color,
    progressToNext: levelInfo.progressToNext,
    nextLevel: levelInfo.nextLevel,
    breakdown: {
      preparationsCount: myPreps.length,
      prepPoints,
      weeklyPlansCount: myPlans.length,
      planPoints,
      assignmentsCount: myAssignments.length,
      assignmentPoints,
      examsCount: myExams.length,
      examPoints,
      materialsCount: myMaterials.length,
      materialPoints,
      attendanceSessionsCount: myAttendance.length,
      attendancePoints
    }
  };
}
