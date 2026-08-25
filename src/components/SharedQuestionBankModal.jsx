import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import { 
  BookOpen, 
  Search, 
  CheckSquare, 
  Square, 
  Plus, 
  Check, 
  X, 
  Building2, 
  User, 
  Calendar, 
  HelpCircle, 
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

export default function SharedQuestionBankModal({
  isOpen,
  onClose,
  onImportQuestions,
  currentSubject = '',
  currentClass = ''
}) {
  const { t } = useLanguage();

  // Raw fetched data across ALL schools (Cross-School Central Bank)
  const [examsList, setExamsList] = useState([]);
  const [assignmentsList, setAssignmentsList] = useState([]);
  const [schoolsMap, setSchoolsMap] = useState({});
  const [teachersMap, setTeachersMap] = useState({});
  const [loading, setLoading] = useState(true);

  // Filters & Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState(currentSubject || 'ALL');
  const [selectedClass, setSelectedClass] = useState(currentClass || 'ALL');
  const [selectedSemester, setSelectedSemester] = useState('ALL');
  const [selectedSourceType, setSelectedSourceType] = useState('all'); // 'all' | 'exams' | 'assignments'
  const [selectedSchoolId, setSelectedSchoolId] = useState('ALL');

  // Selected questions mapping: { [compositeKey]: questionObject }
  const [selectedQuestions, setSelectedQuestions] = useState({});
  
  // Expanded items in accordion view: { [sourceDocId]: boolean }
  const [expandedDocs, setExpandedDocs] = useState({});

  // Reset state / initialize when opened
  useEffect(() => {
    if (isOpen) {
      if (currentSubject) setSelectedSubject(currentSubject);
      if (currentClass) setSelectedClass(currentClass);
      setSelectedQuestions({});
    }
  }, [isOpen, currentSubject, currentClass]);

  // Fetch all schools and teachers dictionary for rich metadata
  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);

    // Fetch schools
    const unsubSchools = onSnapshot(collection(db, 'schools'), (snap) => {
      const sMap = {};
      snap.docs.forEach(d => {
        sMap[d.id] = d.data().name || d.id;
      });
      setSchoolsMap(sMap);
    });

    // Fetch teachers & users for creator names
    const unsubTeachers = onSnapshot(collection(db, 'teachers'), (snap) => {
      const tMap = {};
      snap.docs.forEach(d => {
        const data = d.data();
        tMap[d.id] = data.name;
        if (data.nationalId) tMap[data.nationalId] = data.name;
        if (data.uid) tMap[data.uid] = data.name;
      });
      setTeachersMap(prev => ({ ...prev, ...tMap }));
    });

    const unsubUsers = onSnapshot(collection(db, 'users'), (snap) => {
      const uMap = {};
      snap.docs.forEach(d => {
        const data = d.data();
        if (data.name) {
          uMap[d.id] = data.name;
          if (data.nationalId) uMap[data.nationalId] = data.name;
          if (data.email) uMap[data.email] = data.name;
        }
      });
      setTeachersMap(prev => ({ ...prev, ...uMap }));
    });

    // Fetch all exams across all schools
    const unsubExams = onSnapshot(collection(db, 'exams'), (snap) => {
      const list = [];
      snap.docs.forEach(docSnap => {
        const data = docSnap.data();
        if (Array.isArray(data.questions) && data.questions.length > 0) {
          list.push({ id: docSnap.id, sourceType: 'exam', ...data });
        }
      });
      setExamsList(list);
      setLoading(false);
    });

    // Fetch all assignments across all schools
    const unsubAssignments = onSnapshot(collection(db, 'assignments'), (snap) => {
      const list = [];
      snap.docs.forEach(docSnap => {
        const data = docSnap.data();
        if (Array.isArray(data.questions) && data.questions.length > 0) {
          list.push({ id: docSnap.id, sourceType: 'assignment', ...data });
        }
      });
      setAssignmentsList(list);
      setLoading(false);
    });

    return () => {
      unsubSchools();
      unsubTeachers();
      unsubUsers();
      unsubExams();
      unsubAssignments();
    };
  }, [isOpen]);

  // Aggregate all sources and extract dynamic filter dropdown options
  const { allSources, subjectsList, classesList, availableSchools } = useMemo(() => {
    let combined = [];
    if (selectedSourceType === 'all' || selectedSourceType === 'exams') {
      combined = [...combined, ...examsList];
    }
    if (selectedSourceType === 'all' || selectedSourceType === 'assignments') {
      combined = [...combined, ...assignmentsList];
    }

    const subjs = new Set();
    const clss = new Set();
    const schs = new Map();

    [...examsList, ...assignmentsList].forEach(item => {
      if (item.subject) subjs.add(item.subject.trim());
      const clsName = item.targetClass || item.className || item.class;
      if (clsName) clss.add(clsName.trim());
      if (item.schoolId) {
        schs.set(item.schoolId, schoolsMap[item.schoolId] || item.schoolName || item.schoolId);
      }
    });

    return {
      allSources: combined,
      subjectsList: Array.from(subjs).sort(),
      classesList: Array.from(clss).sort(),
      availableSchools: Array.from(schs.entries()).map(([id, name]) => ({ id, name }))
    };
  }, [examsList, assignmentsList, selectedSourceType, schoolsMap]);

  // Filter sources and their questions based on search and filters
  const filteredSourcesWithQuestions = useMemo(() => {
    const qLower = searchQuery.trim().toLowerCase();

    return allSources.map(source => {
      // 1. Subject filter
      if (selectedSubject !== 'ALL') {
        const sSubj = (source.subject || '').trim().toLowerCase();
        const fSubj = selectedSubject.trim().toLowerCase();
        if (!sSubj.includes(fSubj) && !fSubj.includes(sSubj)) return null;
      }

      // 2. Class filter
      if (selectedClass !== 'ALL') {
        const sCls = (source.targetClass || source.className || source.class || '').trim().toLowerCase();
        const fCls = selectedClass.trim().toLowerCase();
        if (!sCls.includes(fCls) && !fCls.includes(sCls)) return null;
      }

      // 3. School filter
      if (selectedSchoolId !== 'ALL') {
        if (source.schoolId !== selectedSchoolId) return null;
      }

      // 4. Semester filter
      if (selectedSemester !== 'ALL') {
        const sSem = (source.semester || '').trim();
        if (sSem && sSem !== selectedSemester) return null;
      }

      const questions = Array.isArray(source.questions) ? source.questions : [];
      const titleMatches = (source.title || '').toLowerCase().includes(qLower);
      const subjectMatches = (source.subject || '').toLowerCase().includes(qLower);
      const teacherName = source.teacherName || teachersMap[source.teacherId] || teachersMap[source.teacherEmail] || 'معلم';
      const teacherMatches = teacherName.toLowerCase().includes(qLower);
      const schoolName = schoolsMap[source.schoolId] || source.schoolName || 'مدرسة';

      // Filter matching questions
      const matchingQuestions = questions.filter(q => {
        if (!qLower) return true;
        if (titleMatches || subjectMatches || teacherMatches) return true;
        
        const textMatches = (q.text || '').toLowerCase().includes(qLower);
        const optionsMatch = Array.isArray(q.options) && q.options.some(opt => (opt || '').toLowerCase().includes(qLower));
        return textMatches || optionsMatch;
      });

      if (matchingQuestions.length === 0) return null;

      return {
        ...source,
        teacherDisplayName: teacherName,
        schoolDisplayName: schoolName,
        filteredQuestions: matchingQuestions
      };
    }).filter(Boolean);
  }, [allSources, selectedSubject, selectedClass, selectedSchoolId, selectedSemester, searchQuery, teachersMap, schoolsMap]);

  // Total count of matching questions across filtered sources
  const totalMatchingQuestionsCount = useMemo(() => {
    return filteredSourcesWithQuestions.reduce((acc, curr) => acc + curr.filteredQuestions.length, 0);
  }, [filteredSourcesWithQuestions]);

  // Toggle individual question selection
  const handleToggleQuestion = (docId, qIndex, questionObj, sourceMeta) => {
    const key = `${docId}_${qIndex}`;
    setSelectedQuestions(prev => {
      const next = { ...prev };
      if (next[key]) {
        delete next[key];
      } else {
        next[key] = {
          ...questionObj,
          _sourceDocId: docId,
          _sourceTitle: sourceMeta.title,
          _sourceSubject: sourceMeta.subject,
          _sourceClass: sourceMeta.targetClass || sourceMeta.className,
          _sourceTeacher: sourceMeta.teacherDisplayName,
          _sourceSchool: sourceMeta.schoolDisplayName
        };
      }
      return next;
    });
  };

  // Toggle all questions in a specific source document
  const handleToggleAllInDoc = (source) => {
    const docId = source.id;
    const allSelected = source.filteredQuestions.every((_, qIdx) => Boolean(selectedQuestions[`${docId}_${qIdx}`]));

    setSelectedQuestions(prev => {
      const next = { ...prev };
      source.filteredQuestions.forEach((q, qIdx) => {
        const key = `${docId}_${qIdx}`;
        if (allSelected) {
          delete next[key];
        } else {
          next[key] = {
            ...q,
            _sourceDocId: docId,
            _sourceTitle: source.title,
            _sourceSubject: source.subject,
            _sourceClass: source.targetClass || source.className,
            _sourceTeacher: source.teacherDisplayName,
            _sourceSchool: source.schoolDisplayName
          };
        }
      });
      return next;
    });
  };

  // Select all matching questions across all filtered sources
  const handleSelectAllGlobal = () => {
    setSelectedQuestions(prev => {
      const next = { ...prev };
      filteredSourcesWithQuestions.forEach(source => {
        source.filteredQuestions.forEach((q, qIdx) => {
          const key = `${source.id}_${qIdx}`;
          next[key] = {
            ...q,
            _sourceDocId: source.id,
            _sourceTitle: source.title,
            _sourceSubject: source.subject,
            _sourceClass: source.targetClass || source.className,
            _sourceTeacher: source.teacherDisplayName,
            _sourceSchool: source.schoolDisplayName
          };
        });
      });
      return next;
    });
  };

  // Clear all selections
  const handleClearSelection = () => {
    setSelectedQuestions({});
  };

  // Toggle accordion expand
  const handleToggleExpandDoc = (docId) => {
    setExpandedDocs(prev => ({
      ...prev,
      [docId]: prev[docId] === undefined ? false : !prev[docId] // Default is expanded
    }));
  };

  // Confirm Import: deep-clone and generate independent new question IDs
  const handleConfirmImport = () => {
    const questionsToImport = Object.values(selectedQuestions).map((q, idx) => {
      return {
        id: `q_bank_${Date.now()}_${idx}_${Math.random().toString(36).substr(2, 4)}`,
        text: q.text || '',
        options: Array.isArray(q.options) ? [...q.options] : ['', '', '', ''],
        correctOption: typeof q.correctOption === 'number' ? q.correctOption : 0,
        explanation: q.explanation || ''
      };
    });

    if (questionsToImport.length === 0) {
      alert('الرجاء تحديد سؤال واحد على الأقل للاستيراد.');
      return;
    }

    onImportQuestions(questionsToImport);
    onClose();
  };

  const selectedCount = Object.keys(selectedQuestions).length;

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(15, 23, 42, 0.65)',
      backdropFilter: 'blur(6px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '16px'
    }}>
      <div style={{
        background: '#ffffff',
        width: '100%',
        maxWidth: '1100px',
        maxHeight: '92vh',
        borderRadius: '20px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        border: '1px solid #e2e8f0',
        direction: 'rtl'
      }}>
        
        {/* Modal Header */}
        <div style={{
          padding: '20px 24px',
          background: 'linear-gradient(135deg, #0f766e 0%, #0d9488 50%, #0284c7 100%)',
          color: '#ffffff',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid rgba(255, 255, 255, 0.15)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              background: 'rgba(255, 255, 255, 0.2)',
              padding: '10px',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <BookOpen size={28} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '8px' }}>
                بنك الأسئلة المركزي الشامل
                <span style={{ fontSize: '0.75rem', background: 'rgba(255, 255, 255, 0.25)', padding: '2px 8px', borderRadius: '20px', fontWeight: 'bold' }}>
                  متاح عبر كافة المدارس
                </span>
              </h2>
              <p style={{ margin: '4px 0 0', fontSize: '0.88rem', opacity: 0.9 }}>
                ابحث واستورد أسئلة متميزة من واجبات واختبارات المدارس الأخرى مع إمكانية التعديل الحر دون التأثير على الأصل
              </p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              border: 'none',
              borderRadius: '50%',
              width: '36px',
              height: '36px',
              cursor: 'pointer',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.35)'}
            onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'}
          >
            <X size={20} />
          </button>
        </div>

        {/* Search & Filter Toolbar */}
        <div style={{
          padding: '16px 24px',
          background: '#f8fafc',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          {/* Search bar */}
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div style={{
              flex: 1,
              position: 'relative',
              display: 'flex',
              alignItems: 'center'
            }}>
              <Search size={18} style={{ position: 'absolute', right: '14px', color: '#94a3b8' }} />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="ابحث بنص السؤال، عنوان الدرس، اسم الاختبار أو الواجب، أو اسم المعلم المنشئ..."
                style={{
                  width: '100%',
                  padding: '10px 42px 10px 14px',
                  borderRadius: '10px',
                  border: '1.5px solid #cbd5e1',
                  fontSize: '0.92rem',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                  background: '#ffffff'
                }}
                onFocus={e => e.target.style.borderColor = '#0d9488'}
                onBlur={e => e.target.style.borderColor = '#cbd5e1'}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  style={{
                    position: 'absolute',
                    left: '12px',
                    background: 'none',
                    border: 'none',
                    color: '#94a3b8',
                    cursor: 'pointer'
                  }}
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>

          {/* Filter dropdowns */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
            {/* Subject Filter */}
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 'bold', color: '#64748b', marginBottom: '4px' }}>
                المادة الدراسية
              </label>
              <select
                value={selectedSubject}
                onChange={e => setSelectedSubject(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.85rem',
                  background: '#ffffff'
                }}
              >
                <option value="ALL">📚 كافة المواد</option>
                {subjectsList.map(subj => (
                  <option key={subj} value={subj}>{subj}</option>
                ))}
              </select>
            </div>

            {/* Class / Grade Filter */}
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 'bold', color: '#64748b', marginBottom: '4px' }}>
                الصف / المرحلة
              </label>
              <select
                value={selectedClass}
                onChange={e => setSelectedClass(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.85rem',
                  background: '#ffffff'
                }}
              >
                <option value="ALL">🏫 كافة الفصول والصفوف</option>
                {classesList.map(cls => (
                  <option key={cls} value={cls}>{cls}</option>
                ))}
              </select>
            </div>

            {/* Source Type Filter */}
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 'bold', color: '#64748b', marginBottom: '4px' }}>
                نوع المصدر
              </label>
              <select
                value={selectedSourceType}
                onChange={e => setSelectedSourceType(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.85rem',
                  background: '#ffffff'
                }}
              >
                <option value="all">📝 كافة المصادر (اختبارات وواجبات)</option>
                <option value="exams">📋 اختبارات إلكترونية فقط</option>
                <option value="assignments">📖 واجبات إلكترونية فقط</option>
              </select>
            </div>

            {/* School Filter */}
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 'bold', color: '#64748b', marginBottom: '4px' }}>
                المدرسة / المجمع
              </label>
              <select
                value={selectedSchoolId}
                onChange={e => setSelectedSchoolId(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.85rem',
                  background: '#ffffff'
                }}
              >
                <option value="ALL">🏢 كافة المجمعات والمدارس</option>
                {availableSchools.map(sch => (
                  <option key={sch.id} value={sch.id}>{sch.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Quick stats and selection bar */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingTop: '6px',
            borderTop: '1px solid #e2e8f0',
            fontSize: '0.82rem',
            color: '#64748b'
          }}>
            <div>
              تم العثور على <strong style={{ color: '#0f766e' }}>{totalMatchingQuestionsCount}</strong> سؤال في <strong style={{ color: '#0f766e' }}>{filteredSourcesWithQuestions.length}</strong> اختبار/واجب
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button
                type="button"
                onClick={handleSelectAllGlobal}
                disabled={totalMatchingQuestionsCount === 0}
                style={{
                  background: '#f1f5f9',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  padding: '4px 10px',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  color: '#334155'
                }}
              >
                تحديد جميع الأسئلة المعروضة ({totalMatchingQuestionsCount})
              </button>
              {selectedCount > 0 && (
                <button
                  type="button"
                  onClick={handleClearSelection}
                  style={{
                    background: '#fee2e2',
                    border: '1px solid #fecaca',
                    borderRadius: '6px',
                    padding: '4px 10px',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    color: '#991b1b'
                  }}
                >
                  إلغاء التحديد
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Modal Body - Scrollable Questions List */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '20px 24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          background: '#f1f5f9'
        }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px', color: '#64748b' }}>
              <div style={{ display: 'inline-block', width: '32px', height: '32px', border: '3px solid #cbd5e1', borderTopColor: '#0d9488', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
              <p style={{ marginTop: '12px', fontSize: '0.95rem' }}>جاري تحميل ومزامنة الأسئلة من بنك الأسئلة العام...</p>
            </div>
          ) : filteredSourcesWithQuestions.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '60px 20px',
              background: '#ffffff',
              borderRadius: '16px',
              border: '1px dashed #cbd5e1',
              color: '#64748b'
            }}>
              <HelpCircle size={48} style={{ color: '#94a3b8', marginBottom: '12px' }} />
              <h3 style={{ margin: '0 0 6px', color: '#1e293b' }}>لم يتم العثور على أسئلة مطابقة</h3>
              <p style={{ margin: 0, fontSize: '0.9rem' }}>
                جرب تغيير خيارات البحث أو تصفية المادة والصف لإظهار المزيد من الأسئلة المتوفرة.
              </p>
            </div>
          ) : (
            filteredSourcesWithQuestions.map(source => {
              const docId = source.id;
              const isCollapsed = expandedDocs[docId] === false;
              const allInDocSelected = source.filteredQuestions.every((_, qIdx) => Boolean(selectedQuestions[`${docId}_${qIdx}`]));
              const someInDocSelected = source.filteredQuestions.some((_, qIdx) => Boolean(selectedQuestions[`${docId}_${qIdx}`]));

              return (
                <div
                  key={`${source.sourceType}_${docId}`}
                  style={{
                    background: '#ffffff',
                    borderRadius: '14px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                    overflow: 'hidden',
                    transition: 'all 0.2s'
                  }}
                >
                  {/* Source Document Header */}
                  <div
                    style={{
                      padding: '14px 18px',
                      background: source.sourceType === 'exam' ? 'linear-gradient(to left, #f0fdfa, #f8fafc)' : 'linear-gradient(to left, #eff6ff, #f8fafc)',
                      borderBottom: isCollapsed ? 'none' : '1px solid #e2e8f0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer'
                    }}
                    onClick={() => handleToggleExpandDoc(docId)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      {/* Checkbox for all questions in this doc */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleAllInDoc(source);
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          color: allInDocSelected ? '#0d9488' : someInDocSelected ? '#0284c7' : '#94a3b8'
                        }}
                        title={allInDocSelected ? 'إلغاء تحديد الكل في هذا المستند' : 'تحديد كافة أسئلة هذا المستند'}
                      >
                        {allInDocSelected ? <CheckSquare size={20} /> : <Square size={20} />}
                      </button>

                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <span style={{
                            fontSize: '0.72rem',
                            fontWeight: 'bold',
                            padding: '2px 8px',
                            borderRadius: '6px',
                            background: source.sourceType === 'exam' ? '#ccfbf1' : '#dbeafe',
                            color: source.sourceType === 'exam' ? '#0f766e' : '#1e40af'
                          }}>
                            {source.sourceType === 'exam' ? '📋 اختبار إلكتروني' : '📖 واجب إلكتروني'}
                          </span>

                          <strong style={{ fontSize: '1rem', color: '#0f172a' }}>
                            {source.title || 'بدون عنوان'}
                          </strong>

                          {source.subject && (
                            <span style={{ fontSize: '0.78rem', background: '#f1f5f9', color: '#475569', padding: '2px 8px', borderRadius: '6px' }}>
                              📚 {source.subject}
                            </span>
                          )}

                          {(source.targetClass || source.className) && (
                            <span style={{ fontSize: '0.78rem', background: '#f1f5f9', color: '#475569', padding: '2px 8px', borderRadius: '6px' }}>
                              🏫 {source.targetClass || source.className}
                            </span>
                          )}
                        </div>

                        {/* Origin Info (Creator & School) */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginTop: '6px', fontSize: '0.8rem', color: '#64748b' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <User size={14} color="#0d9488" />
                            المنشئ: <strong style={{ color: '#334155' }}>{source.teacherDisplayName}</strong>
                          </span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Building2 size={14} color="#0284c7" />
                            المدرسة: <strong style={{ color: '#334155' }}>{source.schoolDisplayName}</strong>
                          </span>
                          {source.createdAt && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', opacity: 0.8 }}>
                              <Calendar size={13} />
                              {typeof source.createdAt === 'string' ? source.createdAt.slice(0, 10) : 'مؤخراً'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontSize: '0.82rem', background: '#ffffff', border: '1px solid #cbd5e1', padding: '3px 10px', borderRadius: '20px', color: '#334155', fontWeight: 'bold' }}>
                        {source.filteredQuestions.length} سؤال
                      </span>
                      <button
                        type="button"
                        style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}
                      >
                        {isCollapsed ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
                      </button>
                    </div>
                  </div>

                  {/* Question Cards within this source */}
                  {!isCollapsed && (
                    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {source.filteredQuestions.map((question, qIdx) => {
                        const key = `${docId}_${qIdx}`;
                        const isSelected = Boolean(selectedQuestions[key]);

                        return (
                          <div
                            key={key}
                            onClick={() => handleToggleQuestion(docId, qIdx, question, source)}
                            style={{
                              padding: '14px 16px',
                              borderRadius: '10px',
                              border: isSelected ? '2px solid #0d9488' : '1px solid #e2e8f0',
                              background: isSelected ? '#f0fdfa' : '#ffffff',
                              cursor: 'pointer',
                              display: 'flex',
                              gap: '14px',
                              alignItems: 'flex-start',
                              transition: 'all 0.15s'
                            }}
                            onMouseOver={(e) => {
                              if (!isSelected) e.currentTarget.style.borderColor = '#94a3b8';
                            }}
                            onMouseOut={(e) => {
                              if (!isSelected) e.currentTarget.style.borderColor = '#e2e8f0';
                            }}
                          >
                            {/* Question Checkbox */}
                            <div style={{ marginTop: '2px', color: isSelected ? '#0d9488' : '#94a3b8' }}>
                              {isSelected ? <CheckSquare size={20} /> : <Square size={20} />}
                            </div>

                            {/* Question Content */}
                            <div style={{ flex: 1 }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                                <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#0d9488', background: '#ccfbf1', padding: '2px 8px', borderRadius: '6px' }}>
                                  سؤال رقم {qIdx + 1}
                                </span>
                              </div>

                              <p style={{ margin: '0 0 10px', fontSize: '0.98rem', fontWeight: 600, color: '#1e293b', lineHeight: 1.5 }}>
                                {question.text || <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>نص السؤال غير محدد</span>}
                              </p>

                              {/* Options grid */}
                              {Array.isArray(question.options) && (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px' }}>
                                  {question.options.map((opt, optIdx) => {
                                    const isCorrect = optIdx === question.correctOption;
                                    return (
                                      <div
                                        key={optIdx}
                                        style={{
                                          padding: '8px 12px',
                                          borderRadius: '8px',
                                          fontSize: '0.86rem',
                                          display: 'flex',
                                          alignItems: 'center',
                                          gap: '8px',
                                          background: isCorrect ? '#dcfce7' : '#f8fafc',
                                          border: isCorrect ? '1.5px solid #22c55e' : '1px solid #e2e8f0',
                                          color: isCorrect ? '#15803d' : '#475569',
                                          fontWeight: isCorrect ? 'bold' : 'normal'
                                        }}
                                      >
                                        <span style={{
                                          width: '20px',
                                          height: '20px',
                                          borderRadius: '50%',
                                          background: isCorrect ? '#22c55e' : '#cbd5e1',
                                          color: '#ffffff',
                                          fontSize: '0.75rem',
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          fontWeight: 'bold'
                                        }}>
                                          {optIdx + 1}
                                        </span>
                                        <span style={{ flex: 1 }}>{opt || '-'}</span>
                                        {isCorrect && <Check size={14} style={{ color: '#15803d' }} />}
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div style={{
          padding: '16px 24px',
          background: '#ffffff',
          borderTop: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '16px'
        }}>
          <div>
            {selectedCount > 0 ? (
              <span style={{ color: '#0f766e', fontWeight: 'bold', fontSize: '0.95rem' }}>
                ✓ تم تحديد {selectedCount} سؤال للاستيراد
              </span>
            ) : (
              <span style={{ color: '#64748b', fontSize: '0.88rem' }}>
                حدد الأسئلة التي تريد إدراجها بالضغط على مربعات الاختيار
              </span>
            )}
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '10px 18px',
                borderRadius: '10px',
                border: '1px solid #cbd5e1',
                background: '#ffffff',
                color: '#475569',
                fontSize: '0.9rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              إلغاء
            </button>

            <button
              type="button"
              onClick={handleConfirmImport}
              disabled={selectedCount === 0}
              style={{
                padding: '10px 24px',
                borderRadius: '10px',
                border: 'none',
                background: selectedCount > 0 ? 'linear-gradient(135deg, #0f766e 0%, #0d9488 100%)' : '#cbd5e1',
                color: '#ffffff',
                fontSize: '0.92rem',
                fontWeight: 'bold',
                cursor: selectedCount > 0 ? 'pointer' : 'not-allowed',
                boxShadow: selectedCount > 0 ? '0 4px 12px rgba(13, 148, 136, 0.3)' : 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <Plus size={18} />
              إدراج الأسئلة المختارة ({selectedCount})
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
