import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, doc, setDoc, deleteDoc, addDoc, getDoc, getDocs, writeBatch, query, where } from 'firebase/firestore';
import { 
  Calendar, BookOpen, Plus, Trash2, Save, Printer, ShieldCheck, Lock, 
  Sparkles, CheckCircle, AlertTriangle, X, ShieldAlert, Palette, Layers, Globe,
  Check, Info
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { SAUDI_CURRICULUM_STRICT, SAUDI_STAGES } from '../data/saudiCurriculumData';
import { AMERICAN_CURRICULUM_STRICT, AMERICAN_STAGES } from '../data/americanCurriculumData';
import { CURRICULUM_TYPES, detectCurriculumType } from '../data/curriculumService';
import { getSubjectColorTheme, SUBJECT_COLOR_PALETTES } from '../data/subjectThemes';
import PrintScheduleModal from '../components/PrintScheduleModal';

export default function ManageSchedules({ schoolId }) {
  const { t } = useLanguage();
  const DAYS = [
    t('manageSchedules.sunday'),
    t('manageSchedules.monday'),
    t('manageSchedules.tuesday'),
    t('manageSchedules.wednesday'),
    t('manageSchedules.thursday')
  ];
  const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8];

  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [subjects, setSubjects] = useState([]);
  
  const [academicYear, setAcademicYear] = useState('1447-1448');
  const [semester, setSemester] = useState(t('manageSchedules.firstSemester'));
  
  // Curriculum Type State (Configured by Principal / Admin)
  const [curriculumType, setCurriculumType] = useState(CURRICULUM_TYPES.SAUDI);
  const [activeDualTrack, setActiveDualTrack] = useState('saudi'); // 'saudi' | 'american' (when in Dual mode)
  const [isSavingCurriculum, setIsSavingCurriculum] = useState(false);

  // Array of flat schedule entries
  const [entries, setEntries] = useState([]);
  const [schedulesList, setSchedulesList] = useState([]);
  const [isPrintingSchedule, setIsPrintingSchedule] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isCleaning, setIsCleaning] = useState(false);
  
  // Stage filter for core subjects display
  const [coreStageFilter, setCoreStageFilter] = useState('الكل');

  // Modal State: Add Custom Subject with Lessons & Objectives
  const [isAddSubjectModalOpen, setIsAddSubjectModalOpen] = useState(false);
  const [newSubName, setNewSubName] = useState('');
  const [newSubStage, setNewSubStage] = useState(SAUDI_STAGES.SECONDARY);
  const [newSubGrade, setNewSubGrade] = useState('');
  const [newSubColor, setNewSubColor] = useState('blue');
  const [newSubTrack, setNewSubTrack] = useState(CURRICULUM_TYPES.SAUDI);
  const [newSubLessons, setNewSubLessons] = useState([
    { lesson: '', unit: 'الوحدة الأولى', objectives: [''] }
  ]);

  // Modal State: Two-Step Delete Warning
  const [deleteWarningStep, setDeleteWarningStep] = useState(0); // 0 = closed, 1 = first warning, 2 = final confirmation
  const [subjectToDelete, setSubjectToDelete] = useState(null);

  // Modal State: Schedule Conflict Confirmation
  const [conflictModalOpen, setConflictModalOpen] = useState(false);
  const [detectedConflicts, setDetectedConflicts] = useState([]);
  const [pendingSaveAction, setPendingSaveAction] = useState(false);

  // 1. Load School Info and Curriculum Type
  useEffect(() => {
    if (!schoolId) return;
    const fetchSchool = async () => {
      try {
        const d = await getDoc(doc(db, 'schools', schoolId));
        if (d.exists()) {
          const sData = d.data();
          if (sData.curriculumType) {
            setCurriculumType(sData.curriculumType);
          } else {
            const detected = detectCurriculumType(sData.name || '');
            setCurriculumType(detected);
          }
        }
      } catch (e) {
        console.error("Error fetching school curriculum:", e);
      }
    };
    fetchSchool();
  }, [schoolId]);

  // 2. Extract Official Core Subjects based strictly on school curriculum type
  const officialCoreSubjects = useMemo(() => {
    const list = [];
    const targetCurriculum = curriculumType === CURRICULUM_TYPES.DUAL
      ? (activeDualTrack === 'american' ? AMERICAN_CURRICULUM_STRICT : SAUDI_CURRICULUM_STRICT)
      : (curriculumType === CURRICULUM_TYPES.AMERICAN ? AMERICAN_CURRICULUM_STRICT : SAUDI_CURRICULUM_STRICT);

    if (!targetCurriculum) return list;

    Object.entries(targetCurriculum).forEach(([stage, semesters]) => {
      Object.entries(semesters || {}).forEach(([semName, subjectObj]) => {
        Object.entries(subjectObj || {}).forEach(([subjName, lessonsList]) => {
          if (Array.isArray(lessonsList) && lessonsList.length > 0) {
            const sample = lessonsList[0];
            list.push({
              name: subjName,
              stage,
              semester: semName,
              grade: sample.grade || 'محدد بالمنهج',
              lessonCount: lessonsList.length
            });
          }
        });
      });
    });
    return list;
  }, [curriculumType, activeDualTrack]);

  const displayedCoreSubjects = useMemo(() => {
    if (coreStageFilter === 'الكل') return officialCoreSubjects;
    return officialCoreSubjects.filter(c => c.stage === coreStageFilter);
  }, [officialCoreSubjects, coreStageFilter]);

  const groupedOfficialCore = useMemo(() => {
    const groups = {};
    officialCoreSubjects.forEach(sub => {
      const key = sub.stage;
      if (!groups[key]) groups[key] = [];
      if (!groups[key].some(item => item.name === sub.name && item.grade === sub.grade)) {
        groups[key].push(sub);
      }
    });
    return Object.entries(groups).map(([stage, list]) => ({ stage, subjects: list }));
  }, [officialCoreSubjects]);

  // 3. Data loading for classes, teachers, custom subjects, schedules
  useEffect(() => {
    if (!schoolId) return;

    const qClasses = query(collection(db, 'classes'), where('schoolId', '==', schoolId));
    const unsubClasses = onSnapshot(qClasses, (snap) => {
      setClasses(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const qTeachers = query(collection(db, 'teachers'), where('schoolId', '==', schoolId));
    const unsubTeachers = onSnapshot(qTeachers, (snap) => {
      setTeachers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const LEGACY_MOCK_SUBJECTS = new Set([
      'القرآن الكريم', 'التفسير', 'التوحيد', 'الفقه', 'الحديث', 'لغتي', 'اللغة العربية',
      'الرياضيات', 'العلوم', 'العلوم الطبيعية', 'الدراسات الاجتماعية', 'الاجتماعيات',
      'اللغة الإنجليزية', 'التربية الفنية', 'التربية البدنية', 'كيمياء', 'فيزياء', 'أحياء'
    ]);

    const qSubjects = query(collection(db, 'subjects'), where('schoolId', '==', schoolId));
    const unsubSubjects = onSnapshot(qSubjects, async (snap) => {
      const subs = snap.docs
        .filter(docSnap => !LEGACY_MOCK_SUBJECTS.has(docSnap.data()?.name?.trim()))
        .map(d => ({ id: d.id, ...d.data() }));
      setSubjects(subs);
    });
    
    // Load existing schedules and flatten them
    const qSchedules = query(collection(db, 'schedules'), where('schoolId', '==', schoolId));
    const unsubSchedules = onSnapshot(qSchedules, (snap) => {
      setSchedulesList(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      let flatEntries = [];
      snap.docs.forEach(docSnap => {
        const data = docSnap.data();
        if (data.academicYear) setAcademicYear(data.academicYear);
        if (data.semester) setSemester(data.semester);
        
        const matrix = data.matrix || {};
        const classId = docSnap.id;
        
        Object.keys(matrix).forEach(key => {
          const [day, periodStr] = key.split('-');
          const cell = matrix[key];
          if (cell && (cell.subject || cell.teacherId)) {
            flatEntries.push({
              id: Math.random().toString(36).substr(2, 9),
              classId,
              day,
              period: parseInt(periodStr),
              subject: cell.subject,
              teacherId: cell.teacherId
            });
          }
        });
      });
      flatEntries.sort((a, b) => {
        if (DAYS.indexOf(a.day) !== DAYS.indexOf(b.day)) return DAYS.indexOf(a.day) - DAYS.indexOf(b.day);
        if (a.period !== b.period) return a.period - b.period;
        return 0;
      });
      setEntries(flatEntries);
    });

    return () => { unsubClasses(); unsubTeachers(); unsubSubjects(); unsubSchedules(); };
  }, [schoolId]);

  // Handle Changing and Saving School Curriculum Type by Principal
  const handleSaveCurriculumType = async (newType) => {
    setCurriculumType(newType);
    setIsSavingCurriculum(true);
    try {
      await setDoc(doc(db, 'schools', schoolId), {
        curriculumType: newType
      }, { merge: true });
    } catch (err) {
      console.error("Error saving curriculum type:", err);
    } finally {
      setIsSavingCurriculum(false);
    }
  };

  // Conflict Detection Engine
  const detectConflicts = (entriesList) => {
    const conflicts = [];
    const classMap = new Map(classes.map(c => [c.id, c.name]));
    const teacherMap = new Map(teachers.map(t => [t.id, t.name]));

    for (let i = 0; i < entriesList.length; i++) {
      for (let j = i + 1; j < entriesList.length; j++) {
        const a = entriesList[i];
        const b = entriesList[j];

        if (!a.day || !a.period || !b.day || !b.period) continue;
        if (a.day !== b.day || a.period !== b.period) continue;

        // 1. Same Class Double-Booking (two different subjects/teachers in same class & period)
        if (a.classId && b.classId && a.classId === b.classId) {
          conflicts.push({
            type: 'class',
            title: `تعارض في الفصل: ${classMap.get(a.classId) || a.classId}`,
            description: `يوم ${a.day} - الحصة ${a.period}: إسناد مادة (${a.subject || 'غير محدد'} - المعلم: ${teacherMap.get(a.teacherId) || 'غير محدد'}) بالتزامن مع مادة (${b.subject || 'غير محدد'} - المعلم: ${teacherMap.get(b.teacherId) || 'غير محدد'}).`
          });
        }

        // 2. Same Teacher Double-Booking (same teacher assigned to two different classes in same period)
        if (a.teacherId && b.teacherId && a.teacherId === b.teacherId && a.classId !== b.classId) {
          conflicts.push({
            type: 'teacher',
            title: `تعارض إسناد للمعلم: ${teacherMap.get(a.teacherId) || a.teacherId}`,
            description: `يوم ${a.day} - الحصة ${a.period}: مسند لفصل (${classMap.get(a.classId) || a.classId}) وفصل (${classMap.get(b.classId) || b.classId}) في نفس التوقيت.`
          });
        }
      }
    }
    return conflicts;
  };

  const handleAddRow = () => {
    setEntries([{
      id: Math.random().toString(36).substr(2, 9),
      classId: '',
      day: DAYS[0],
      period: 1,
      subject: '',
      teacherId: ''
    }, ...entries]);
  };

  const handleRemoveRow = (id) => {
    setEntries(entries.filter(e => e.id !== id));
  };

  const handleRowChange = (id, field, value) => {
    setEntries(entries.map(e => e.id === id ? { ...e, [field]: value } : e));
  };

  // Save Schedule with Conflict Verification
  const executeSaveSchedule = async () => {
    setIsSaving(true);
    setConflictModalOpen(false);
    try {
      const grouped = {};
      entries.forEach(entry => {
        if (!entry.classId || !entry.day || !entry.period) return;
        if (!grouped[entry.classId]) grouped[entry.classId] = {};
        
        const key = `${entry.day}-${entry.period}`;
        grouped[entry.classId][key] = {
          subject: entry.subject || '',
          teacherId: entry.teacherId || ''
        };
      });

      const qSchedules = query(collection(db, 'schedules'), where('schoolId', '==', schoolId));
      const oldSchedulesSnap = await getDocs(qSchedules);
      const batch = writeBatch(db);
      
      oldSchedulesSnap.docs.forEach(docSnap => {
        if (!grouped[docSnap.id]) {
          batch.delete(docSnap.ref);
        }
      });

      Object.keys(grouped).forEach(classId => {
        const docRef = doc(db, 'schedules', classId);
        batch.set(docRef, {
          classId: classId,
          schoolId,
          academicYear,
          semester,
          matrix: grouped[classId],
          updatedAt: new Date().toISOString()
        });
      });

      await batch.commit();
      alert('✓ ' + t('manageSchedules.scheduleSaved'));
    } catch (error) {
      console.error(error);
      alert(t('manageSchedules.saveError'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveSchedule = () => {
    const conflicts = detectConflicts(entries);
    if (conflicts.length > 0) {
      setDetectedConflicts(conflicts);
      setConflictModalOpen(true);
      return;
    }
    executeSaveSchedule();
  };

  // Add Custom Subject with Lessons and Objectives
  const handleAddLessonField = () => {
    setNewSubLessons([...newSubLessons, { lesson: '', unit: 'الوحدة ' + (newSubLessons.length + 1), objectives: [''] }]);
  };

  const handleAddObjectiveField = (lessonIndex) => {
    const updated = [...newSubLessons];
    updated[lessonIndex].objectives.push('');
    setNewSubLessons(updated);
  };

  const handleLessonChange = (lessonIndex, field, value) => {
    const updated = [...newSubLessons];
    updated[lessonIndex][field] = value;
    setNewSubLessons(updated);
  };

  const handleObjectiveChange = (lessonIndex, objIndex, value) => {
    const updated = [...newSubLessons];
    updated[lessonIndex].objectives[objIndex] = value;
    setNewSubLessons(updated);
  };

  const handleRemoveLessonField = (lessonIndex) => {
    if (newSubLessons.length <= 1) return;
    setNewSubLessons(newSubLessons.filter((_, i) => i !== lessonIndex));
  };

  const handleSaveCustomSubject = async (e) => {
    e.preventDefault();
    if (!newSubName.trim()) {
      alert('يرجى كتابة اسم المادة');
      return;
    }

    const cleanLessons = newSubLessons
      .filter(l => l.lesson.trim() !== '')
      .map(l => ({
        unit: l.unit.trim() || 'الوحدة الأولى',
        lesson: l.lesson.trim(),
        objectives: l.objectives.filter(o => o.trim() !== '')
      }));

    try {
      await addDoc(collection(db, 'subjects'), {
        name: newSubName.trim(),
        schoolId,
        stage: newSubStage,
        grade: newSubGrade.trim() || 'جميع الصفوف',
        color: newSubColor,
        curriculumType: newSubTrack,
        lessons: cleanLessons,
        createdAt: new Date().toISOString()
      });

      // Reset form
      setNewSubName('');
      setNewSubGrade('');
      setNewSubLessons([{ lesson: '', unit: 'الوحدة الأولى', objectives: [''] }]);
      setIsAddSubjectModalOpen(false);
      alert('✓ تم إضافة المادة وتثبيت دروسها وأهدافها بنجاح.');
    } catch (err) {
      console.error(err);
      alert('حدث خطأ أثناء حفظ المادة');
    }
  };

  // Two-Step Delete Subject Handlers
  const initiateDeleteSubject = (sub) => {
    setSubjectToDelete(sub);
    setDeleteWarningStep(1); // Open step 1 warning
  };

  const proceedToFinalDeleteWarning = () => {
    setDeleteWarningStep(2); // Open step 2 final confirmation
  };

  const executeDeleteSubject = async () => {
    if (!subjectToDelete) return;
    try {
      await deleteDoc(doc(db, 'subjects', subjectToDelete.id));
      setDeleteWarningStep(0);
      setSubjectToDelete(null);
    } catch (err) {
      console.error(err);
      alert('حدث خطأ أثناء حذف المادة');
    }
  };

  const cancelDeleteSubject = () => {
    setDeleteWarningStep(0);
    setSubjectToDelete(null);
  };

  // Filter custom subjects by current curriculum
  const customSubjects = useMemo(() => {
    const seen = new Set();
    return subjects.filter(sub => {
      const name = sub?.name?.trim();
      if (!name) return false;
      if (officialCoreSubjects.some(core => core.name.trim() === name)) return false;
      if (seen.has(name)) return false;
      seen.add(name);
      return true;
    });
  }, [subjects, officialCoreSubjects]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* 1. School Curriculum Track Selection (Admin / Principal Level) */}
      <div className="glass-panel" style={{ padding: '20px', borderLeft: '5px solid #0e7490' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', color: '#0f766e', fontSize: '16px' }}>
              <Globe size={22} color="#0d9488" /> نوع نظام التعليم المعتمد للمجمع:
            </div>
            <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--color-text-muted)' }}>
              يتم عزل مواد ودروس الدبلوما الأمريكية عن التعليم الأهلي السعودي بدقة متناهية بناءً على خيار المدير.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => handleSaveCurriculumType(CURRICULUM_TYPES.SAUDI)}
              style={{
                background: curriculumType === CURRICULUM_TYPES.SAUDI ? 'linear-gradient(135deg, #0f766e, #14b8a6)' : 'white',
                color: curriculumType === CURRICULUM_TYPES.SAUDI ? 'white' : '#0f766e',
                border: '1.5px solid #0d9488',
                padding: '8px 16px',
                borderRadius: '10px',
                fontWeight: 'bold',
                fontSize: '13px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: curriculumType === CURRICULUM_TYPES.SAUDI ? '0 3px 8px rgba(13, 148, 136, 0.3)' : 'none',
                transition: 'all 0.2s'
              }}
            >
              🇸🇦 التعليم الأهلي السعودي (المنهج الوطني)
            </button>

            <button
              type="button"
              onClick={() => handleSaveCurriculumType(CURRICULUM_TYPES.AMERICAN)}
              style={{
                background: curriculumType === CURRICULUM_TYPES.AMERICAN ? 'linear-gradient(135deg, #1e40af, #3b82f6)' : 'white',
                color: curriculumType === CURRICULUM_TYPES.AMERICAN ? 'white' : '#1e40af',
                border: '1.5px solid #3b82f6',
                padding: '8px 16px',
                borderRadius: '10px',
                fontWeight: 'bold',
                fontSize: '13px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: curriculumType === CURRICULUM_TYPES.AMERICAN ? '0 3px 8px rgba(59, 130, 246, 0.3)' : 'none',
                transition: 'all 0.2s'
              }}
            >
              🇺🇸 التعليم الدولي (الدبلوما الأمريكية - CCSS & NGSS)
            </button>

            <button
              type="button"
              onClick={() => handleSaveCurriculumType(CURRICULUM_TYPES.DUAL)}
              style={{
                background: curriculumType === CURRICULUM_TYPES.DUAL ? 'linear-gradient(135deg, #7c3aed, #a855f7)' : 'white',
                color: curriculumType === CURRICULUM_TYPES.DUAL ? 'white' : '#7c3aed',
                border: '1.5px solid #a855f7',
                padding: '8px 16px',
                borderRadius: '10px',
                fontWeight: 'bold',
                fontSize: '13px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: curriculumType === CURRICULUM_TYPES.DUAL ? '0 3px 8px rgba(168, 85, 247, 0.3)' : 'none',
                transition: 'all 0.2s'
              }}
            >
              🌐 المسار المزدوج (Dual Track)
            </button>
          </div>
        </div>

        {curriculumType === CURRICULUM_TYPES.DUAL && (
          <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#475569' }}>عرض مسار:</span>
            <button
              type="button"
              onClick={() => setActiveDualTrack('saudi')}
              style={{
                background: activeDualTrack === 'saudi' ? '#0f766e' : '#f1f5f9',
                color: activeDualTrack === 'saudi' ? 'white' : '#475569',
                border: 'none',
                padding: '4px 12px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              🇸🇦 المقررات الوطنية السعودية
            </button>
            <button
              type="button"
              onClick={() => setActiveDualTrack('american')}
              style={{
                background: activeDualTrack === 'american' ? '#1e40af' : '#f1f5f9',
                color: activeDualTrack === 'american' ? 'white' : '#475569',
                border: 'none',
                padding: '4px 12px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              🇺🇸 مقررات الدبلوما الأمريكية
            </button>
          </div>
        )}
      </div>

      {/* 2. Official Core Subjects Display Banner (Color-Coded) */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-primary-dark)', margin: 0 }}>
            <BookOpen size={24} /> {t('manageSchedules.manageSubjectsTitle')}
          </h2>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => setIsAddSubjectModalOpen(true)}
              className="btn btn-primary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}
            >
              <Plus size={16} /> إضافة مادة مخصصة مع دروسها وأهدافها
            </button>
          </div>
        </div>

        {/* Core Official Subjects Box */}
        <div style={{
          background: 'linear-gradient(135deg, #f0fdfa, #eff6ff)',
          border: '1px solid #99f6e4',
          borderRadius: '12px',
          padding: '16px',
          marginBottom: '20px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', color: '#0f766e', fontSize: '14px' }}>
              <ShieldCheck size={18} color="#0d9488" /> 
              المواد الأساسية المعتمدة ({curriculumType === CURRICULUM_TYPES.AMERICAN ? 'الدبلوما الأمريكية' : 'المنهج الرسمي المعتمد'} - غير قابلة للحذف):
            </div>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {['الكل', ...Object.values(curriculumType === CURRICULUM_TYPES.AMERICAN ? AMERICAN_STAGES : SAUDI_STAGES)].map(stg => (
                <button
                  key={stg}
                  type="button"
                  onClick={() => setCoreStageFilter(stg)}
                  style={{
                    background: coreStageFilter === stg ? '#0d9488' : 'white',
                    color: coreStageFilter === stg ? 'white' : '#0f766e',
                    border: '1px solid #0d9488',
                    padding: '3px 10px',
                    borderRadius: '16px',
                    fontSize: '11px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    transition: 'all 0.2s'
                  }}
                >
                  {stg}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', maxHeight: '250px', overflowY: 'auto', padding: '4px' }}>
            {displayedCoreSubjects.map((core, idx) => {
              const theme = getSubjectColorTheme(core.name);
              return (
                <div 
                  key={`${core.stage}-${core.semester}-${core.name}-${idx}`}
                  style={{
                    background: theme.bg,
                    border: `1px solid ${theme.border}`,
                    padding: '6px 12px',
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.04)'
                  }}
                >
                  <Lock size={13} color={theme.text} />
                  <span style={{ fontWeight: 'bold', color: theme.text, fontSize: '12px' }}>
                    {core.name}
                  </span>
                  <span style={{ 
                    background: theme.badgeBg, 
                    color: theme.badgeText, 
                    fontSize: '10px', 
                    fontWeight: 'bold',
                    padding: '2px 6px', 
                    borderRadius: '6px' 
                  }}>
                    {core.grade}
                  </span>
                  <span style={{
                    background: 'white',
                    color: theme.text,
                    border: `1px solid ${theme.border}`,
                    fontSize: '10px',
                    padding: '1px 5px',
                    borderRadius: '6px'
                  }}>
                    {core.lessonCount} درساً ({core.semester.includes('أول') || core.semester.includes('First') ? 'ف1' : 'ف2'})
                  </span>
                </div>
              );
            })}
          </div>
          <p style={{ margin: '8px 0 0 0', fontSize: '11px', color: '#0d9488' }}>
            🔒 يتم تثبيت هذه المواد تلقائياً من المنهج المعتمد وتسند فورياً للصفوف مع كامل دروسها وأهدافها للفصلين (ف1 و ف2).
          </p>
        </div>

        {/* Custom Subjects Section */}
        {customSubjects.length > 0 && (
          <div style={{ marginTop: '16px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#475569', marginBottom: '8px' }}>
              📋 المواد المخصصة والإضافية للمدرسة:
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              {customSubjects.map(sub => {
                const theme = getSubjectColorTheme(sub.name, sub.color);
                return (
                  <div 
                    key={sub.id} 
                    style={{ 
                      background: theme.bg, 
                      padding: '8px 14px', 
                      borderRadius: '10px', 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '8px', 
                      border: `1px solid ${theme.border}`,
                      boxShadow: '0 2px 4px rgba(0,0,0,0.04)'
                    }}
                  >
                    <span style={{ fontSize: '13px', fontWeight: 'bold', color: theme.text }}>{sub.name}</span>
                    {sub.grade && (
                      <span style={{ background: theme.badgeBg, color: theme.badgeText, fontSize: '10px', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>
                        {sub.grade}
                      </span>
                    )}
                    {Array.isArray(sub.lessons) && sub.lessons.length > 0 && (
                      <span style={{ background: 'white', color: theme.text, fontSize: '10px', padding: '1px 5px', borderRadius: '4px', border: `1px solid ${theme.border}` }}>
                        {sub.lessons.length} درس بأهدافه
                      </span>
                    )}
                    <button 
                      type="button"
                      onClick={() => initiateDeleteSubject(sub)}
                      style={{ background: 'none', border: 'none', color: 'var(--color-error)', cursor: 'pointer', padding: 0, display: 'flex' }}
                      title="حذف المادة مع التأكيد مرتين"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 3. Schedule Management Table */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', color: 'var(--color-primary-dark)' }}>
          <Calendar size={24} /> {t('manageSchedules.manageScheduleTitle')}
        </h2>
        
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '24px', alignItems: 'flex-end' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--color-text-muted)' }}>{t('manageSchedules.academicYear')}</label>
            <select className="input-field" value={academicYear} onChange={(e) => setAcademicYear(e.target.value)} style={{ marginBottom: 0, width: '150px' }}>
              <option value="1447-1448">1447-1448</option>
              <option value="1448-1449">1448-1449</option>
              <option value="1449-1450">1449-1450</option>
              <option value="1450-1451">1450-1451</option>
              <option value="1451-1452">1451-1452</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--color-text-muted)' }}>{t('manageSchedules.semester')}</label>
            <select className="input-field" value={semester} onChange={(e) => setSemester(e.target.value)} style={{ marginBottom: 0, width: '150px' }}>
              <option value={t('manageSchedules.firstSemester')}>{t('manageSchedules.firstSemester')}</option>
              <option value={t('manageSchedules.secondSemester')}>{t('manageSchedules.secondSemester')}</option>
            </select>
          </div>
          <div style={{ flex: 1, textAlign: 'left', display: 'flex', gap: '12px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => setIsPrintingSchedule(true)}
              className="btn"
              style={{
                background: 'linear-gradient(135deg, #0e7490, #63B2C6)',
                color: 'white',
                border: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                fontWeight: 'bold',
                padding: '8px 16px',
                borderRadius: '8px',
                boxShadow: '0 2px 8px rgba(14, 116, 144, 0.25)',
                cursor: 'pointer'
              }}
            >
              <Printer size={18} /> طباعة وتصدير الجداول (فصل / معلم / عام)
            </button>
            <button onClick={handleAddRow} className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              <Plus size={18} /> {t('manageSchedules.addNewPeriod')}
            </button>
            <button onClick={handleSaveSchedule} disabled={isSaving} className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              <Save size={18} /> {isSaving ? t('manageSchedules.saving') : t('manageSchedules.saveGeneralSchedule')}
            </button>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>{t('manageSchedules.teacher')}</th>
                <th>{t('manageSchedules.subject')}</th>
                <th>{t('manageSchedules.class')}</th>
                <th>{t('manageSchedules.day')}</th>
                <th>{t('manageSchedules.period')}</th>
                <th style={{ width: '50px' }}>{t('manageSchedules.delete')}</th>
              </tr>
            </thead>
            <tbody>
              {entries.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)' }}>
                    {t('manageSchedules.noPeriodsAdded')}
                  </td>
                </tr>
              ) : entries.map(entry => {
                const rowTheme = getSubjectColorTheme(entry.subject);
                return (
                  <tr key={entry.id} style={{ borderLeft: entry.subject ? `4px solid ${rowTheme.border}` : 'none' }}>
                    <td>
                      <select className="input-field" value={entry.teacherId} onChange={(e) => handleRowChange(entry.id, 'teacherId', e.target.value)} style={{ marginBottom: 0 }}>
                        <option value="">{t('manageSchedules.selectTeacher')}</option>
                        {teachers.map(tData => <option key={tData.id} value={tData.id}>{tData.name}</option>)}
                      </select>
                    </td>
                    <td>
                      <select className="input-field" value={entry.subject} onChange={(e) => handleRowChange(entry.id, 'subject', e.target.value)} style={{ marginBottom: 0, fontWeight: entry.subject ? 'bold' : 'normal' }}>
                        <option value="">{t('manageSchedules.selectSubject')}</option>
                        
                        {groupedOfficialCore.map(grp => (
                          <optgroup key={grp.stage} label={`🔒 ${grp.stage}`}>
                            {grp.subjects.map(c => (
                              <option key={`${c.stage}-${c.name}`} value={c.name}>
                                {c.name} ({c.grade})
                              </option>
                            ))}
                          </optgroup>
                        ))}

                        {customSubjects.length > 0 && (
                          <optgroup label="📋 المواد الإضافية المخصصة">
                            {customSubjects.map(s => (
                              <option key={s.id} value={s.name}>
                                {s.name} {s.grade ? `(${s.grade})` : ''}
                              </option>
                            ))}
                          </optgroup>
                        )}
                      </select>
                    </td>
                    <td>
                      <select className="input-field" value={entry.classId} onChange={(e) => handleRowChange(entry.id, 'classId', e.target.value)} style={{ marginBottom: 0 }}>
                        <option value="">{t('manageSchedules.selectClass')}</option>
                        {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </td>
                    <td>
                      <select className="input-field" value={entry.day} onChange={(e) => handleRowChange(entry.id, 'day', e.target.value)} style={{ marginBottom: 0 }}>
                        {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </td>
                    <td>
                      <select className="input-field" value={entry.period} onChange={(e) => handleRowChange(entry.id, 'period', parseInt(e.target.value))} style={{ marginBottom: 0 }}>
                        {PERIODS.map(p => <option key={p} value={p}>{t('manageSchedules.periodPrefix')}{p}</option>)}
                      </select>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button onClick={() => handleRemoveRow(entry.id)} style={{ background: 'none', border: 'none', color: 'var(--color-error)', cursor: 'pointer' }}>
                        <Trash2 size={20} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: Add Custom Subject with Lessons and Objectives */}
      {isAddSubjectModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '16px'
        }}>
          <div className="glass-panel" style={{ background: 'white', maxWidth: '650px', width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: '24px', borderRadius: '16px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
              <h3 style={{ margin: 0, color: 'var(--color-primary-dark)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '18px' }}>
                <Plus size={20} color="#0d9488" /> إضافة مادة مخصصة مع دروسها وأهدافها
              </h3>
              <button onClick={() => setIsAddSubjectModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveCustomSubject}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '6px', color: '#334155' }}>اسم المادة الجديدة *</label>
                  <input
                    type="text"
                    required
                    className="input-field"
                    placeholder="مثال: الروبوت والذكاء الاصطناعي"
                    value={newSubName}
                    onChange={e => setNewSubName(e.target.value)}
                    style={{ marginBottom: 0 }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '6px', color: '#334155' }}>المرحلة الدراسية</label>
                  <select
                    className="input-field"
                    value={newSubStage}
                    onChange={e => setNewSubStage(e.target.value)}
                    style={{ marginBottom: 0 }}
                  >
                    {Object.values(curriculumType === CURRICULUM_TYPES.AMERICAN ? AMERICAN_STAGES : SAUDI_STAGES).map(stg => (
                      <option key={stg} value={stg}>{stg}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '6px', color: '#334155' }}>الصف الموجه له (اختياري)</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="مثال: الصف الثاني الثانوي"
                    value={newSubGrade}
                    onChange={e => setNewSubGrade(e.target.value)}
                    style={{ marginBottom: 0 }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '6px', color: '#334155' }}>لون شارة المادة</label>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '4px' }}>
                    {Object.entries(SUBJECT_COLOR_PALETTES).map(([key, palette]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setNewSubColor(key)}
                        style={{
                          width: '26px', height: '26px', borderRadius: '50%',
                          background: palette.border, border: newSubColor === key ? '3px solid #0f172a' : '2px solid white',
                          cursor: 'pointer', outline: 'none'
                        }}
                        title={palette.name}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Lessons and Objectives Builder */}
              <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '16px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <label style={{ fontSize: '14px', fontWeight: 'bold', color: '#0f766e', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Layers size={16} /> الدروس والأهداف التعليمية للمادة:
                  </label>
                  <button
                    type="button"
                    onClick={handleAddLessonField}
                    style={{ background: '#f0fdfa', border: '1px solid #99f6e4', color: '#0d9488', borderRadius: '6px', padding: '4px 10px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}
                  >
                    + إضافة درس آخر
                  </button>
                </div>

                {newSubLessons.map((lItem, lIdx) => (
                  <div key={lIdx} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '12px', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '8px' }}>
                      <input
                        type="text"
                        placeholder="اسم الوحدة / الفصل"
                        value={lItem.unit}
                        onChange={e => handleLessonChange(lIdx, 'unit', e.target.value)}
                        style={{ width: '130px', padding: '6px 10px', fontSize: '12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                      />
                      <input
                        type="text"
                        placeholder="عنوان الدرس (مثال: درس 1: مقدمة في المستشعرات)"
                        value={lItem.lesson}
                        onChange={e => handleLessonChange(lIdx, 'lesson', e.target.value)}
                        style={{ flex: 1, padding: '6px 10px', fontSize: '12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                      />
                      {newSubLessons.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveLessonField(lIdx)}
                          style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>

                    {/* Objectives list for this lesson */}
                    <div style={{ paddingRight: '12px' }}>
                      <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b', display: 'block', marginBottom: '4px' }}>أهداف هذا الدرس:</label>
                      {lItem.objectives.map((obj, oIdx) => (
                        <div key={oIdx} style={{ display: 'flex', gap: '6px', marginBottom: '4px' }}>
                          <input
                            type="text"
                            placeholder={`هدف ${oIdx + 1} (مثال: أن يتعرف الطالب على أنواع الحساسات)`}
                            value={obj}
                            onChange={e => handleObjectiveChange(lIdx, oIdx, e.target.value)}
                            style={{ flex: 1, padding: '4px 8px', fontSize: '11px', borderRadius: '4px', border: '1px solid #e2e8f0', background: 'white' }}
                          />
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => handleAddObjectiveField(lIdx)}
                        style={{ background: 'none', border: 'none', color: '#0369a1', fontSize: '11px', cursor: 'pointer', padding: '2px 0', fontWeight: 'bold' }}
                      >
                        + إضافة هدف آخر للدرس
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" onClick={() => setIsAddSubjectModalOpen(false)} className="btn btn-secondary">إلغاء</button>
                <button type="submit" className="btn btn-primary">حفظ المادة ودروسها</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Two-Step Delete Warning Modal */}
      {deleteWarningStep > 0 && subjectToDelete && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999, padding: '16px'
        }}>
          <div className="glass-panel" style={{ background: 'white', maxWidth: '480px', width: '100%', padding: '24px', borderRadius: '16px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', borderTop: deleteWarningStep === 1 ? '6px solid #f59e0b' : '6px solid #ef4444' }}>
            
            {deleteWarningStep === 1 ? (
              // Step 1 Warning
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#b45309', marginBottom: '14px' }}>
                  <AlertTriangle size={28} />
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>تحذير (الخطوة 1 من 2): حذف المادة</h3>
                </div>
                <p style={{ fontSize: '14px', lineHeight: '1.6', color: '#334155', marginBottom: '16px' }}>
                  هل أنت متأكد من رغبتك في حذف مادة <strong style={{ color: '#0f172a' }}>"{subjectToDelete.name}"</strong>؟
                  <br />
                  <span style={{ fontSize: '12px', color: '#b45309' }}>
                    ⚠️ سيؤدي حذف المادة إلى إزالة جميع الدروس والأهداف التعليمية المرتبطة بها في المدرسة.
                  </span>
                </p>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button onClick={cancelDeleteSubject} className="btn btn-secondary">إلغاء والتراجع</button>
                  <button onClick={proceedToFinalDeleteWarning} className="btn" style={{ background: '#f59e0b', color: 'white', border: 'none', fontWeight: 'bold' }}>
                    متابعة إلى التأكيد النهائي ⬅️
                  </button>
                </div>
              </div>
            ) : (
              // Step 2 Final Danger Confirmation
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#b91c1c', marginBottom: '14px' }}>
                  <ShieldAlert size={32} />
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>تأكيد نهائي وحاسم (الخطوة 2 من 2)</h3>
                </div>
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '12px', marginBottom: '16px' }}>
                  <p style={{ margin: 0, fontSize: '13px', color: '#991b1b', lineHeight: '1.6', fontWeight: '500' }}>
                    🚨 هل تود بالفعل حذف مادة <strong>"{subjectToDelete.name}"</strong> نهائياً من قاعدة بيانات المدرسة؟
                    <br />
                    لن تتمكن من استرجاع المادة أو تحضيراتها بعد إتمام هذه الخطوة.
                  </p>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button onClick={cancelDeleteSubject} className="btn btn-secondary">إلغاء التراجع</button>
                  <button onClick={executeDeleteSubject} className="btn btn-danger" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Trash2 size={16} /> نعم، تأكيد الحذف النهائي الآن
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* MODAL 3: Schedule Conflict Warning & Confirmation */}
      {conflictModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999, padding: '16px'
        }}>
          <div className="glass-panel" style={{ background: 'white', maxWidth: '560px', width: '100%', maxHeight: '85vh', overflowY: 'auto', padding: '24px', borderRadius: '16px', borderTop: '6px solid #f59e0b', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#b45309', marginBottom: '14px' }}>
              <AlertTriangle size={28} />
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>تنبيه تعارض في الجدول المدرسي</h3>
            </div>
            
            <p style={{ fontSize: '13px', color: '#475569', marginBottom: '14px' }}>
              تم رصد <strong>{detectedConflicts.length}</strong> تعارض(ات) في جدول الحصص. يرجى مراجعة التفاصيل أدناه وتأكيد المتابعة أو الإلغاء لتعديل الحصص:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
              {detectedConflicts.map((c, idx) => (
                <div key={idx} style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', padding: '10px 12px' }}>
                  <div style={{ fontWeight: 'bold', color: '#92400e', fontSize: '13px', marginBottom: '2px' }}>{c.title}</div>
                  <div style={{ fontSize: '12px', color: '#78350f', lineHeight: '1.5' }}>{c.description}</div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', flexWrap: 'wrap' }}>
              <button onClick={() => setConflictModalOpen(false)} className="btn btn-secondary">
                إلغاء والتراجع لتعديل الجدول
              </button>
              <button 
                onClick={executeSaveSchedule} 
                className="btn btn-primary"
                style={{ background: '#d97706', borderColor: '#b45309' }}
              >
                تأكيد الإسناد وحفظ الجدول على أي حال
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Printing Modal */}
      {isPrintingSchedule && (
        <PrintScheduleModal
          classes={classes}
          teachers={teachers}
          schedules={schedulesList}
          academicYear={academicYear}
          semester={semester}
          onClose={() => setIsPrintingSchedule(false)}
        />
      )}

    </div>
  );
}
