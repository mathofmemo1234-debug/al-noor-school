import React, { useState, useEffect, useMemo } from 'react';
import { excellenceData, SCHOOL_NAME, PAGE_TITLE } from '../data/excellenceData';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  setDoc, 
  doc, 
  deleteDoc,
  getDocs
} from 'firebase/firestore';

import { 
  Award, 
  Search, 
  ChevronDown, 
  ChevronLeft, 
  CheckCircle2, 
  Clock, 
  FileText, 
  Upload, 
  Link as LinkIcon, 
  Save, 
  Trash2, 
  Printer, 
  Shield, 
  Lock, 
  Unlock,
  Users,
  Filter,
  X
} from 'lucide-react';

import ExcellencePermissionsModal from '../components/ExcellencePermissionsModal';

export default function SchoolExcellenceDashboard() {
  const { userData, userRole } = useAuth();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'completed', 'pending'
  const [expandedDomains, setExpandedDomains] = useState({ 'domain-1': true });
  const [expandedCriteria, setExpandedCriteria] = useState({ 'c1-1': true });
  
  // Selected indicator (default to first indicator)
  const [selectedIndicator, setSelectedIndicator] = useState(
    excellenceData[0].criteria[0].indicators[0]
  );

  // Admin filter by teacher (default 'all')
  const [selectedTeacherId, setSelectedTeacherId] = useState('all');
  const [teachersList, setTeachersList] = useState([]);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  
  // Evidences store: { [indicatorId]: { description, targetGroup, linkUrl, fileName, fileData, fileType, docDate, isCompleted, teacherName, teacherId } }
  const [evidences, setEvidences] = useState(() => {
    try {
      const saved = localStorage.getItem('school_excellence_evidences');
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      console.error('Failed to load saved evidences', e);
      return {};
    }
  });

  // Current Form state for selected indicator
  const [formData, setFormData] = useState({
    description: '',
    targetGroup: '',
    linkUrl: '',
    fileName: '',
    fileData: '',
    fileType: '',
    docDate: new Date().toISOString().split('T')[0]
  });

  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');
  const [isSavingFirestore, setIsSavingFirestore] = useState(false);

  const schoolId = userData?.schoolId || 'default_school_1';
  const isAdmin = userRole === 'admin' || userRole === 'superadmin';

  // Allowed domains & criteria for current teacher
  const allowedDomains = userData?.excellenceAllowedDomains || [];
  const allowedCriteria = userData?.excellenceAllowedCriteria || [];

  // Check if current user has permission to edit selected domain/criteria
  const canEditSelectedIndicator = useMemo(() => {
    if (isAdmin) return true;
    if (!selectedIndicator) return false;
    
    // If no specific restrictions set for teacher, default to allowed
    if (allowedDomains.length === 0 && allowedCriteria.length === 0) return true;

    // Find domain and criterion for selected indicator
    for (const domain of excellenceData) {
      for (const criteria of domain.criteria) {
        for (const ind of criteria.indicators) {
          if (ind.id === selectedIndicator.id) {
            if (allowedDomains.includes(domain.id) || allowedCriteria.includes(criteria.id)) {
              return true;
            }
            return false;
          }
        }
      }
    }
    return true;
  }, [isAdmin, selectedIndicator, allowedDomains, allowedCriteria]);

  // Fetch teachers for Admin filter dropdown
  useEffect(() => {
    if (!isAdmin || !schoolId) return;
    const fetchTeachers = async () => {
      try {
        const q = query(collection(db, 'teachers'), where('schoolId', '==', schoolId));
        const snap = await getDocs(q);
        setTeachersList(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.warn('Could not fetch teachers list', err);
      }
    };
    fetchTeachers();
  }, [isAdmin, schoolId]);

  // Sync with Firestore collection 'excellence_evidences'
  useEffect(() => {
    if (!schoolId) return;

    let q = query(collection(db, 'excellence_evidences'), where('schoolId', '==', schoolId));
    
    const unsub = onSnapshot(q, (snap) => {
      const remoteData = {};
      snap.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.indicatorId) {
          remoteData[data.indicatorId] = data;
        }
      });
      
      // Merge with local storage
      setEvidences(prev => {
        const merged = { ...prev, ...remoteData };
        try {
          localStorage.setItem('school_excellence_evidences', JSON.stringify(merged));
        } catch (e) {
          console.warn('localStorage save warning', e);
        }
        return merged;
      });
    }, (err) => {
      console.warn('Firestore onSnapshot error', err);
    });

    return () => unsub();
  }, [schoolId]);

  // Sync form when selected indicator changes or evidence store updates
  useEffect(() => {
    if (!selectedIndicator) return;
    const existing = evidences[selectedIndicator.id];
    if (existing) {
      setFormData({
        description: existing.description || '',
        targetGroup: existing.targetGroup || '',
        linkUrl: existing.linkUrl || '',
        fileName: existing.fileName || '',
        fileData: existing.fileData || '',
        fileType: existing.fileType || '',
        docDate: existing.docDate || new Date().toISOString().split('T')[0]
      });
    } else {
      setFormData({
        description: '',
        targetGroup: '',
        linkUrl: '',
        fileName: '',
        fileData: '',
        fileType: '',
        docDate: new Date().toISOString().split('T')[0]
      });
    }
    setSaveSuccessMsg('');
  }, [selectedIndicator, evidences]);

  // Toggle domain accordion
  const toggleDomain = (domainId) => {
    setExpandedDomains(prev => ({
      ...prev,
      [domainId]: !prev[domainId]
    }));
  };

  // Toggle criteria accordion
  const toggleCriteria = (criteriaId) => {
    setExpandedCriteria(prev => ({
      ...prev,
      [criteriaId]: !prev[criteriaId]
    }));
  };

  // Calculate overall stats
  const totalIndicatorsCount = 54;
  const completedCount = useMemo(() => {
    return Object.values(evidences).filter(item => item && item.isCompleted).length;
  }, [evidences]);
  
  const completionPercentage = Math.round((completedCount / totalIndicatorsCount) * 100);

  // Handle search & expansion
  useEffect(() => {
    if (searchQuery.trim() === '') return;
    const queryStr = searchQuery.toLowerCase();
    
    const newExpandedDomains = { ...expandedDomains };
    const newExpandedCriteria = { ...expandedCriteria };

    excellenceData.forEach(domain => {
      let domainMatches = false;
      domain.criteria.forEach(criteria => {
        let criteriaMatches = false;
        criteria.indicators.forEach(ind => {
          if (
            ind.title.toLowerCase().includes(queryStr) ||
            ind.description.toLowerCase().includes(queryStr) ||
            `مؤشر ${ind.id}`.includes(queryStr)
          ) {
            criteriaMatches = true;
            domainMatches = true;
          }
        });
        if (criteriaMatches) {
          newExpandedCriteria[criteria.id] = true;
        }
      });
      if (domainMatches) {
        newExpandedDomains[domain.id] = true;
      }
    });

    setExpandedDomains(newExpandedDomains);
    setExpandedCriteria(newExpandedCriteria);
  }, [searchQuery]);

  // Find parent domain & criterion for an indicator
  const getIndicatorContext = (indicatorId) => {
    for (const domain of excellenceData) {
      for (const criteria of domain.criteria) {
        for (const ind of criteria.indicators) {
          if (ind.id === indicatorId) {
            return { domain, criteria, indicator: ind };
          }
        }
      }
    }
    return null;
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('حجم الملف كبير جداً. يرجى اختيار ملف بحجم أقل من 5 ميجابايت.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData(prev => ({
        ...prev,
        fileName: file.name,
        fileData: reader.result,
        fileType: file.type.startsWith('image/') ? 'image' : 'document'
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleSaveForm = async (e) => {
    e.preventDefault();
    if (!selectedIndicator || !canEditSelectedIndicator) return;

    setIsSavingFirestore(true);

    const isCompleted = Boolean(
      formData.description.trim() || formData.fileName || formData.linkUrl.trim()
    );

    const updatedRecord = {
      indicatorId: selectedIndicator.id,
      schoolId: schoolId,
      teacherId: userData?.nationalId || 'admin',
      teacherName: userData?.name || 'المدير',
      description: formData.description,
      targetGroup: formData.targetGroup,
      linkUrl: formData.linkUrl,
      fileName: formData.fileName,
      fileData: formData.fileData,
      fileType: formData.fileType,
      docDate: formData.docDate,
      isCompleted,
      updatedAt: new Date().toISOString()
    };

    // 1. Update local state & localStorage
    setEvidences(prev => ({
      ...prev,
      [selectedIndicator.id]: updatedRecord
    }));

    // 2. Persist to Firestore
    try {
      await setDoc(
        doc(db, 'excellence_evidences', `${schoolId}_ind_${selectedIndicator.id}`),
        updatedRecord,
        { merge: true }
      );
      setSaveSuccessMsg('تم حفظ ومزامنة الشواهد والأدلة مع النظام الرئيسي بنجاح!');
    } catch (err) {
      console.error('Error saving to Firestore', err);
      setSaveSuccessMsg('تم حفظ الشواهد محلياً وفي انتظار المزامنة.');
    } finally {
      setIsSavingFirestore(false);
      setTimeout(() => setSaveSuccessMsg(''), 4000);
    }
  };

  const handleClearForm = async () => {
    if (!selectedIndicator || !canEditSelectedIndicator) return;
    if (window.confirm('هل أنت تأكد من إزالة جميع الشواهد المرفقة لهذا المؤشر؟')) {
      setEvidences(prev => {
        const next = { ...prev };
        delete next[selectedIndicator.id];
        return next;
      });

      try {
        await deleteDoc(
          doc(db, 'excellence_evidences', `${schoolId}_ind_${selectedIndicator.id}`)
        );
      } catch (err) {
        console.warn('Could not delete from Firestore', err);
      }

      setFormData({
        description: '',
        targetGroup: '',
        linkUrl: '',
        fileName: '',
        fileData: '',
        fileType: '',
        docDate: new Date().toISOString().split('T')[0]
      });
      setSaveSuccessMsg('تم مسح الشواهد بنجاح.');
      setTimeout(() => setSaveSuccessMsg(''), 3000);
    }
  };

  const currentContext = getIndicatorContext(selectedIndicator?.id);

  return (
    <div dir="rtl" className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-900">
      
      {/* Top Header */}
      <header className="bg-slate-950/90 border-b border-slate-800 backdrop-blur-md sticky top-0 z-30 px-4 py-3 shadow-xl">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center text-slate-950 font-bold shadow-lg shadow-amber-500/20">
              <Award className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold tracking-tight text-amber-400 flex items-center gap-2">
                {PAGE_TITLE}
                <span className="text-xs bg-amber-500/10 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-normal">
                  SPA
                </span>
              </h1>
              <p className="text-xs md:text-sm text-slate-400 font-medium">
                {SCHOOL_NAME}
              </p>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-4 bg-slate-900/90 border border-slate-800 rounded-2xl px-4 py-2 text-xs md:text-sm">
            <div className="flex flex-col items-center border-l border-slate-800 pl-4">
              <span className="text-slate-400">إجمالي المؤشرات</span>
              <span className="font-bold text-amber-400 text-base">{totalIndicatorsCount}</span>
            </div>
            <div className="flex flex-col items-center border-l border-slate-800 pl-4">
              <span className="text-slate-400">المؤشرات المكتملة</span>
              <span className="font-bold text-emerald-400 text-base">{completedCount}</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-slate-400">نسبة التميز</span>
              <span className="font-bold text-sky-400 text-base">{completionPercentage}%</span>
            </div>
          </div>

          {/* Action Header Controls */}
          <div className="flex items-center gap-2">
            {isAdmin && (
              <button
                onClick={() => setShowPermissionsModal(true)}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-blue-500/15 hover:bg-blue-500/25 text-blue-300 text-xs md:text-sm font-semibold transition border border-blue-500/30"
                title="إدارة صلاحيات التحرير للمعلمين"
              >
                <Shield className="w-4 h-4 text-blue-400" />
                <span className="hidden sm:inline">صلاحيات المعلمين</span>
              </button>
            )}

            <button 
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs md:text-sm font-medium transition border border-slate-700 shadow-sm"
              title="طباعة التقرير"
            >
              <Printer className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline">طباعة التقرير</span>
            </button>
          </div>
        </div>

        {/* Global Progress Bar */}
        <div className="w-full bg-slate-800 h-1.5 mt-3 rounded-full overflow-hidden">
          <div 
            className="bg-gradient-to-r from-amber-500 via-emerald-400 to-sky-400 h-full transition-all duration-500"
            style={{ width: `${completionPercentage}%` }}
          />
        </div>
      </header>

      {/* Main Body Layout */}
      <div className="flex-1 flex flex-col md:flex-row max-w-7xl w-full mx-auto p-4 md:p-6 gap-6">
        
        {/* Sidebar Accordion & Filter Area */}
        <aside className="w-full md:w-96 flex-shrink-0 bg-slate-950/70 border border-slate-800 rounded-3xl p-4 flex flex-col gap-4 shadow-xl max-h-[85vh] overflow-hidden">
          
          {/* Search Header */}
          <div className="space-y-3">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="ابحث عن مؤشر أو معيار..."
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pr-10 pl-9 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/60 transition"
              />
              <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute left-3 top-3 text-slate-400 hover:text-slate-200"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Filter Tabs */}
            <div className="grid grid-cols-3 gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
              <button
                onClick={() => setFilterStatus('all')}
                className={`py-1.5 rounded-lg font-medium transition ${
                  filterStatus === 'all' 
                    ? 'bg-amber-500 text-slate-950 font-bold shadow' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                الكل ({totalIndicatorsCount})
              </button>
              <button
                onClick={() => setFilterStatus('completed')}
                className={`py-1.5 rounded-lg font-medium transition ${
                  filterStatus === 'completed' 
                    ? 'bg-emerald-500 text-slate-950 font-bold shadow' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                المكتملة ({completedCount})
              </button>
              <button
                onClick={() => setFilterStatus('pending')}
                className={`py-1.5 rounded-lg font-medium transition ${
                  filterStatus === 'pending' 
                    ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                المتبقية ({totalIndicatorsCount - completedCount})
              </button>
            </div>
          </div>

          {/* Accordion List */}
          <div className="flex-1 overflow-y-auto pr-1 space-y-3 custom-scrollbar">
            {excellenceData.map(domain => {
              const isDomainExpanded = expandedDomains[domain.id];
              const isDomainAllowed = isAdmin || allowedDomains.length === 0 || allowedDomains.includes(domain.id);
              
              // Count domain completion
              let domainCompleted = 0;
              let domainTotal = 0;
              domain.criteria.forEach(c => {
                c.indicators.forEach(ind => {
                  domainTotal++;
                  if (evidences[ind.id]?.isCompleted) domainCompleted++;
                });
              });

              return (
                <div key={domain.id} className="border border-slate-800/80 rounded-2xl overflow-hidden bg-slate-900/60">
                  {/* Domain Header */}
                  <button
                    onClick={() => toggleDomain(domain.id)}
                    className="w-full flex items-center justify-between p-3.5 bg-slate-900/90 hover:bg-slate-800/80 text-right transition border-b border-slate-800/50"
                  >
                    <div className="flex items-center gap-2.5 flex-1 min-w-0 pr-1">
                      <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${isDomainAllowed ? 'bg-amber-400' : 'bg-slate-600'}`} />
                      <h2 className="text-sm font-bold text-amber-300 truncate flex items-center gap-1.5">
                        <span>{domain.title}</span>
                        {!isDomainAllowed && (
                          <Lock className="w-3.5 h-3.5 text-slate-500" title="عرض فقط" />
                        )}
                      </h2>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                        {domainCompleted}/{domainTotal}
                      </span>
                      <ChevronDown 
                        className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                          isDomainExpanded ? 'rotate-180' : ''
                        }`} 
                      />
                    </div>
                  </button>

                  {/* Domain Criteria List */}
                  {isDomainExpanded && (
                    <div className="p-2 space-y-2 bg-slate-950/40">
                      {domain.criteria.map(criteria => {
                        const isCriteriaExpanded = expandedCriteria[criteria.id];
                        const isCriteriaAllowed = isDomainAllowed || allowedCriteria.includes(criteria.id);
                        
                        // Count criteria completion
                        const critCompleted = criteria.indicators.filter(
                          ind => evidences[ind.id]?.isCompleted
                        ).length;

                        return (
                          <div key={criteria.id} className="border border-slate-800/60 rounded-xl overflow-hidden bg-slate-900/40">
                            {/* Criteria Header */}
                            <button
                              onClick={() => toggleCriteria(criteria.id)}
                              className="w-full flex items-center justify-between p-2.5 hover:bg-slate-800/60 text-right text-xs font-semibold text-slate-300 transition"
                            >
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <ChevronLeft className={`w-3.5 h-3.5 text-slate-500 transition-transform ${isCriteriaExpanded ? '-rotate-90' : ''}`} />
                                <span className="truncate">{criteria.title}</span>
                              </div>
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                                {critCompleted}/{criteria.indicators.length}
                              </span>
                            </button>

                            {/* Indicators List */}
                            {isCriteriaExpanded && (
                              <div className="pr-3 pl-1 py-1 space-y-1 bg-slate-950/60 border-t border-slate-800/40">
                                {criteria.indicators
                                  .filter(ind => {
                                    const isDone = evidences[ind.id]?.isCompleted;
                                    if (filterStatus === 'completed') return isDone;
                                    if (filterStatus === 'pending') return !isDone;
                                    if (searchQuery.trim()) {
                                      const q = searchQuery.toLowerCase();
                                      return (
                                        ind.title.toLowerCase().includes(q) ||
                                        ind.description.toLowerCase().includes(q) ||
                                        `مؤشر ${ind.id}`.includes(q)
                                      );
                                    }
                                    return true;
                                  })
                                  .map(ind => {
                                    const isSelected = selectedIndicator?.id === ind.id;
                                    const isDone = evidences[ind.id]?.isCompleted;

                                    return (
                                      <button
                                        key={ind.id}
                                        onClick={() => setSelectedIndicator(ind)}
                                        className={`w-full text-right p-2 rounded-lg text-xs flex items-start gap-2 transition ${
                                          isSelected 
                                            ? 'bg-amber-500/20 text-amber-200 border border-amber-500/40 font-semibold' 
                                            : 'hover:bg-slate-800/60 text-slate-300'
                                        }`}
                                      >
                                        <div className="mt-0.5 flex-shrink-0">
                                          {isDone ? (
                                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                          ) : (
                                            <Clock className="w-3.5 h-3.5 text-slate-500" />
                                          )}
                                        </div>
                                        <span className="line-clamp-2 leading-relaxed flex-1">
                                          {ind.title}
                                        </span>
                                      </button>
                                    );
                                  })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </aside>

        {/* Main Workspace Display Area */}
        <main className="flex-1 bg-slate-950/70 border border-slate-800 rounded-3xl p-5 md:p-7 flex flex-col gap-6 shadow-xl">
          
          {selectedIndicator && currentContext ? (
            <>
              {/* Header Context Breadcrumbs */}
              <div className="space-y-3 border-b border-slate-800 pb-5">
                <div className="flex flex-wrap items-center gap-2 text-xs text-amber-400 font-medium">
                  <span className="bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-lg">
                    {currentContext.domain.title}
                  </span>
                  <span>/</span>
                  <span className="text-slate-400">
                    {currentContext.criteria.title}
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <h2 className="text-lg md:text-xl font-bold text-slate-100 flex items-center gap-2">
                    <span>{selectedIndicator.title}</span>
                  </h2>

                  {/* Status & Permission Badges */}
                  <div className="flex items-center gap-2">
                    {canEditSelectedIndicator ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-300 text-xs font-medium">
                        <Unlock className="w-3 h-3 text-blue-400" />
                        مسموح بالتحرير
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-400 text-xs font-medium">
                        <Lock className="w-3 h-3 text-slate-500" />
                        عرض فقط
                      </span>
                    )}

                    {evidences[selectedIndicator.id]?.isCompleted ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
                        <CheckCircle2 className="w-4 h-4" />
                        تم رفع الشواهد
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold">
                        <Clock className="w-4 h-4" />
                        في انتظار الإرفاق
                      </span>
                    )}
                  </div>
                </div>

                <p className="text-sm text-slate-400 leading-relaxed bg-slate-900/60 border border-slate-800/80 p-3 rounded-xl">
                  {selectedIndicator.description}
                </p>
              </div>

              {/* Permission Locked Banner */}
              {!canEditSelectedIndicator && (
                <div className="bg-amber-500/10 border border-amber-500/30 text-amber-200 p-3.5 rounded-2xl text-xs md:text-sm font-medium flex items-center gap-3">
                  <Lock className="w-5 h-5 text-amber-400 flex-shrink-0" />
                  <div>
                    <span className="font-bold block">تحرير هذا المجال/المعيار مخصص لمعلمين آخرين</span>
                    <span className="text-slate-400 text-xs">تم تخصيص هذه الصلاحية من قِبل إدارة المدرسة، يمكنك الاطلاع على الشواهد دون تعديل.</span>
                  </div>
                </div>
              )}

              {/* Toast Feedback */}
              {saveSuccessMsg && (
                <div className="bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 p-3 rounded-2xl text-xs md:text-sm font-medium flex items-center justify-between animate-fade-in">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    <span>{saveSuccessMsg}</span>
                  </div>
                  <button onClick={() => setSaveSuccessMsg('')} className="text-emerald-400 hover:text-emerald-200">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Evidence Form */}
              <form onSubmit={handleSaveForm} className="space-y-5 flex-1 flex flex-col">
                <div className="flex items-center gap-2 text-sm font-bold text-amber-400">
                  <FileText className="w-4 h-4" />
                  <h3>نموذج توثيق الشواهد والأدلة للمؤشر</h3>
                </div>

                <fieldset disabled={!canEditSelectedIndicator} className="space-y-4 disabled:opacity-80">
                  
                  {/* Description / Achievement Text */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-300">
                      وصف الإنجاز والشواهد المنجزة <span className="text-amber-400">*</span>
                    </label>
                    <textarea
                      rows={4}
                      value={formData.description}
                      onChange={e => setFormData({ ...formData, description: e.target.value })}
                      placeholder="أدخل تفاصيل التوثيق، الخطوات الإجرائية المتبعة ومخرجات تحقيق هذا المؤشر..."
                      disabled={!canEditSelectedIndicator}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/60 transition resize-y disabled:bg-slate-950 disabled:cursor-not-allowed"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Target Group */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-slate-300">
                        الفئة المستهدفة / الجهة المشرفة
                      </label>
                      <input
                        type="text"
                        value={formData.targetGroup}
                        onChange={e => setFormData({ ...formData, targetGroup: e.target.value })}
                        placeholder="مثال: المعلمون، الطلاب، أولياء الأمور، قسم التوجيه"
                        disabled={!canEditSelectedIndicator}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/60 transition disabled:bg-slate-950 disabled:cursor-not-allowed"
                      />
                    </div>

                    {/* Date */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-slate-300">
                        تاريخ التوثيق / الإنجاز
                      </label>
                      <input
                        type="date"
                        value={formData.docDate}
                        onChange={e => setFormData({ ...formData, docDate: e.target.value })}
                        disabled={!canEditSelectedIndicator}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/60 transition disabled:bg-slate-950 disabled:cursor-not-allowed"
                      />
                    </div>
                  </div>

                  {/* External Link */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                      <LinkIcon className="w-3.5 h-3.5 text-sky-400" />
                      رابط خارجي للشواهد (Google Drive / cloud link)
                    </label>
                    <input
                      type="url"
                      value={formData.linkUrl}
                      onChange={e => setFormData({ ...formData, linkUrl: e.target.value })}
                      placeholder="https://drive.google.com/file/d/..."
                      disabled={!canEditSelectedIndicator}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/60 transition ltr text-left disabled:bg-slate-950 disabled:cursor-not-allowed"
                    />
                  </div>

                  {/* File Upload Attachment */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                      <Upload className="w-3.5 h-3.5 text-emerald-400" />
                      رفع ملف الشاهد (صور، مستندات PDF)
                    </label>
                    
                    <div className="flex flex-col sm:flex-row items-center gap-3 bg-slate-900 border border-dashed border-slate-700 p-4 rounded-xl transition text-center sm:text-right">
                      {canEditSelectedIndicator && (
                        <label className="cursor-pointer bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2 rounded-xl text-xs font-semibold border border-slate-700 transition inline-flex items-center gap-2 flex-shrink-0">
                          <Upload className="w-4 h-4 text-amber-400" />
                          استعراض الملفات
                          <input
                            type="file"
                            onChange={handleFileChange}
                            accept="image/*,application/pdf,.doc,.docx,.ppt,.pptx"
                            className="hidden"
                          />
                        </label>
                      )}

                      <div className="flex-1 min-w-0">
                        {formData.fileName ? (
                          <div className="flex items-center justify-between bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 text-xs">
                            <span className="truncate text-emerald-400 font-medium">{formData.fileName}</span>
                            {canEditSelectedIndicator && (
                              <button
                                type="button"
                                onClick={() => setFormData({ ...formData, fileName: '', fileData: '', fileType: '' })}
                                className="text-slate-400 hover:text-rose-400 pr-2"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-500">لم يتم اختيار ملف بعد (أقل من 5 ميجابايت)</span>
                        )}
                      </div>
                    </div>
                  </div>
                </fieldset>

                {/* Submit & Reset Buttons */}
                {canEditSelectedIndicator && (
                  <div className="pt-4 border-t border-slate-800 mt-auto flex flex-col sm:flex-row items-center justify-between gap-3">
                    <button
                      type="submit"
                      disabled={isSavingFirestore}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold px-6 py-3 rounded-xl text-sm shadow-lg shadow-amber-500/20 transition active:scale-95 disabled:opacity-50"
                    >
                      <Save className="w-4 h-4" />
                      {isSavingFirestore ? 'جاري الحفظ والمزامنة...' : 'حفظ ومصادقة الشاهد'}
                    </button>

                    {evidences[selectedIndicator.id]?.isCompleted && (
                      <button
                        type="button"
                        onClick={handleClearForm}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 px-4 py-2.5 rounded-xl text-xs font-semibold transition"
                      >
                        <Trash2 className="w-4 h-4 text-rose-400" />
                        إزالة الشواهد لهذا المؤشر
                      </button>
                    )}
                  </div>
                )}
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-slate-500">
              <Award className="w-16 h-16 text-slate-700 mb-3" />
              <p className="text-sm">قم باختيار مؤشر من الشريط الجانبي لعرض تفاصيله وإرفاق الشواهد.</p>
            </div>
          )}
        </main>
      </div>

      {/* Admin Excellence Permissions Modal */}
      {showPermissionsModal && (
        <ExcellencePermissionsModal
          schoolId={schoolId}
          onClose={() => setShowPermissionsModal(false)}
        />
      )}

      {/* Print View Stylesheet */}
      <style>{`
        @media print {
          header, aside, button, form {
            display: none !important;
          }
          body {
            background: white !important;
            color: black !important;
          }
          main {
            border: none !important;
            box-shadow: none !important;
            background: white !important;
            color: black !important;
            width: 100% !important;
          }
        }
      `}</style>
    </div>
  );
}
