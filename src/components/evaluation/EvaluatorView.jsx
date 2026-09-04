import React, { useState } from 'react';
import { Plus, Save, Send, Clock, Eye, Trash2, AlertCircle, Printer, CheckCircle, ShieldAlert } from 'lucide-react';
import { OFFICIAL_CRITERIA_TEMPLATE, saveEvaluationDraft, submitEvaluation, calculateRating } from '../../services/evaluationService';

export default function EvaluatorView({ visit, initialEvaluation, currentUser, onSaved }) {
  // Page 1 Header Metadata
  const [headerData, setHeaderData] = useState(
    initialEvaluation?.headerData || {
      academicYear: '1448هـ',
      semester: 'الفصل الدراسي الأول',
      department: 'القسم التعليمي',
      educationalComplex: 'مجمع مدارس النور الأهلية',
      visitDay: 'الأحد',
      visitDate: visit?.visitDate || new Date().toISOString().split('T')[0],
      subject: visit?.subject || '',
      specialty: visit?.specialty || visit?.subject || '',
      teacherName: visit?.teacherName || '',
      nationality: visit?.nationality || 'سعودي',
      stage: visit?.stage || 'المرحلة الثانوية',
      classroom: visit?.classRoom || '',
      period: visit?.period || 'الحصة الثالثة',
      studentsCount: visit?.studentsCount || '25',
      entryTime: 'بداية', // 'بداية' | 'وسط' | 'نهاية'
      lessonTitle: visit?.lessonTitle || ''
    }
  );

  // Criteria (Dynamic & Editable)
  const [criteria, setCriteria] = useState(
    initialEvaluation?.criteriaSnapshots || OFFICIAL_CRITERIA_TEMPLATE
  );

  // Page 2 Deliberation & Support Plan
  const [successes, setSuccesses] = useState(
    initialEvaluation?.successes || [
      'التفاعل الإيجابي والمشاركة الفعالة من غالبية الطلاب أثناء الأنشطة.',
      'الاستثمار المميز للتقنيات والوسائل التعليمية الرقمية.'
    ]
  );

  const [developmentPlan, setDevelopmentPlan] = useState(
    initialEvaluation?.developmentPlan || [
      {
        id: '1',
        competency: 'تنويع استراتيجيات التقويم المرحلي أثناء الدرس',
        focusArea: 'التقويم الصفي المستمر',
        supervisoryMethod: 'حصة تطبيقية',
        suggestedWeek: 'الأسبوع الخامس'
      }
    ]
  );

  const [evaluatorNotes, setEvaluatorNotes] = useState(initialEvaluation?.evaluatorNotes || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal for new criterion
  const [newCritName, setNewCritName] = useState('');
  const [newCritDomain, setNewCritDomain] = useState('التخطيط');
  const [newCritMax, setNewCritMax] = useState(5);

  // Scoring calculations
  const totalMax = criteria.reduce((sum, c) => sum + Number(c.maxScore || 0), 0);
  const totalEarned = criteria.reduce((sum, c) => sum + Number(c.earnedScore || 0), 0);
  const percentage = totalMax > 0 ? Number(((totalEarned / totalMax) * 100).toFixed(1)) : 0;
  const rating = calculateRating(percentage);

  // Double confirmation helper
  const confirmDoubleAction = (itemTitle, onConfirm) => {
    const firstWarning = window.confirm(`تحذير (1/2): هل أنت متأكد من رغبتك في حذف "${itemTitle}"؟`);
    if (!firstWarning) return;

    const secondWarning = window.confirm(`تأكيد نهائي (2/2): سيتم حذف "${itemTitle}" بشكل نهائي وإعادة ترتيب البنود. هل تود الاستمرار بالتأكيد؟`);
    if (secondWarning) {
      onConfirm();
    }
  };

  const handleScoreLevel = (critIndex, levelScore) => {
    const updated = [...criteria];
    updated[critIndex].earnedScore = Number(levelScore);
    setCriteria(updated);
  };

  const handleCustomScoreInput = (critIndex, val) => {
    const updated = [...criteria];
    updated[critIndex].earnedScore = Number(val);
    setCriteria(updated);
  };

  const handleNotesChange = (critIndex, val) => {
    const updated = [...criteria];
    updated[critIndex].notes = val;
    setCriteria(updated);
  };

  const handleDeleteCriterion = (index) => {
    const crit = criteria[index];
    confirmDoubleAction(crit.name, () => {
      const remaining = criteria.filter((_, i) => i !== index);
      // Renumber items
      const renumbered = remaining.map((c, i) => ({ ...c, number: i + 1 }));
      setCriteria(renumbered);
    });
  };

  const handleAddCriterion = () => {
    if (!newCritName.trim()) return;
    const newEntry = {
      id: `crit_custom_${Date.now()}`,
      number: criteria.length + 1,
      domain: newCritDomain,
      name: newCritName.trim(),
      maxScore: Number(newCritMax) || 5,
      earnedScore: Number(newCritMax) || 5,
      notes: ''
    };
    setCriteria([...criteria, newEntry]);
    setNewCritName('');
  };

  // Successes handlers
  const handleAddSuccess = () => {
    setSuccesses([...successes, '']);
  };

  const handleDeleteSuccess = (idx) => {
    confirmDoubleAction(`بند النجاح رقم ${idx + 1}`, () => {
      setSuccesses(successes.filter((_, i) => i !== idx));
    });
  };

  // Development Plan handlers
  const handleAddPlanRow = () => {
    setDevelopmentPlan([
      ...developmentPlan,
      {
        id: `plan_${Date.now()}`,
        competency: '',
        focusArea: '',
        supervisoryMethod: 'حصة تطبيقية',
        suggestedWeek: ''
      }
    ]);
  };

  const handleDeletePlanRow = (idx) => {
    confirmDoubleAction(`خطة التطوير بند ${idx + 1}`, () => {
      setDevelopmentPlan(developmentPlan.filter((_, i) => i !== idx));
    });
  };

  const handleSave = async (isDraft) => {
    try {
      setIsSubmitting(true);
      const payload = {
        id: initialEvaluation?.id,
        visitId: visit?.id || '',
        schoolId: visit?.schoolId || currentUser?.schoolId || '',
        teacherId: visit?.teacherId || '',
        headerData,
        criteriaSnapshots: criteria,
        successes,
        developmentPlan,
        evaluatorNotes
      };

      if (isDraft) {
        await saveEvaluationDraft(payload, currentUser.uid);
        alert('تم حفظ التقييم كمسودة بنجاح (مخفي عن المعلم والزائر).');
      } else {
        await submitEvaluation(payload, currentUser.uid);
        alert('تم إرسال التقييم واعتماده للمعلم بنجاح.');
      }
      if (onSaved) onSaved();
    } catch (err) {
      alert('حدث خطأ أثناء الحفظ: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Group criteria by domain
  const domains = ['التخطيط', 'بناء خبرات التعلم', 'تقويم التعلم'];
  const otherDomains = [...new Set(criteria.map(c => c.domain))].filter(d => !domains.includes(d));
  const allDomains = [...domains, ...otherDomains];

  return (
    <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px', background: 'var(--color-bg-card)', color: 'var(--color-text)', display: 'flex', flexDirection: 'column', gap: '24px' }} dir="rtl">
      
      {/* Top Action Bar & Status */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', borderBottom: '1px solid var(--color-border)', paddingBottom: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '6px' }}>
            <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#0284c7', background: 'rgba(2, 132, 199, 0.1)', padding: '4px 12px', borderRadius: '20px' }}>
              رقم الزيارة: {visit?.visitNumber || visit?.id || 'VIS-1'}
            </span>
            
            {(visit?.visitType === 'supervisor' || visit?.evaluatorRole === 'supervisor') ? (
              <span style={{ fontSize: '12px', fontWeight: '900', color: '#7e22ce', background: '#f3e8ff', border: '1px solid #d8b4fe', padding: '4px 12px', borderRadius: '20px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                🎓 استمارة زيارة مشرف تربوي
              </span>
            ) : (
              <span style={{ fontSize: '12px', fontWeight: '900', color: '#0369a1', background: '#e0f2fe', border: '1px solid #7dd3fc', padding: '4px 12px', borderRadius: '20px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                👔 استمارة زيارة مدير المدرسة
              </span>
            )}
          </div>

          <h2 style={{ fontSize: '20px', fontWeight: 900, margin: '4px 0' }}>
            {(visit?.visitType === 'supervisor' || visit?.evaluatorRole === 'supervisor') 
              ? 'استمارة الملاحظة الصفية التخصصية – زيارة المشرف التربوي'
              : 'استمارة الملاحظة الصفية والتقويم الإداري – زيارة مدير المدرسة'} (عام {headerData.academicYear})
          </h2>
          <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
            مدارس النور الأهلية • إدارة ضمان التعلم والتعليم الأهلي • المقيّم: {headerData.evaluatorName || ((visit?.visitType === 'supervisor' || visit?.evaluatorRole === 'supervisor') ? 'المشرف التربوي' : 'مدير المدرسة')}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            type="button"
            onClick={() => window.print()}
            className="btn"
            style={{ background: 'white', border: '1px solid var(--color-border)', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <Printer size={16} /> طباعة الاستمارة الرسمية
          </button>

          {/* Status badge */}
          <div style={{ background: 'rgba(0,0,0,0.03)', padding: '8px 14px', borderRadius: '12px', border: '1px solid var(--color-border)', textAlign: 'center' }}>
            <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>حالة التقييم وقرار المعلم:</div>
            <div style={{ fontSize: '13px', fontWeight: 800 }}>
              {(initialEvaluation?.status === 'approved' || initialEvaluation?.teacherDecision === 'approved') ? (
                <span style={{ color: '#16a34a', background: '#dcfce7', padding: '4px 10px', borderRadius: '8px' }}>✅ معتمد من المعلم</span>
              ) : (initialEvaluation?.status === 'rejected' || initialEvaluation?.teacherDecision === 'rejected') ? (
                <span style={{ color: '#dc2626', background: '#fee2e2', padding: '4px 10px', borderRadius: '8px' }}>❌ مرفوض من المعلم</span>
              ) : initialEvaluation?.status === 'draft' ? (
                <span style={{ color: '#d97706', background: '#fef3c7', padding: '4px 10px', borderRadius: '8px' }}>📝 مسودة</span>
              ) : initialEvaluation?.status === 'sent' ? (
                <span style={{ color: '#2563eb', background: '#dbeafe', padding: '4px 10px', borderRadius: '8px' }}>📨 مُرسل للمعلم (بانتظار الرد)</span>
              ) : (
                <span style={{ color: '#94a3b8' }}>جديد قيد الإعداد</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* If approved, show teacher confirmation banner to supervisor/admin */}
      {(initialEvaluation?.status === 'approved' || initialEvaluation?.teacherDecision === 'approved') && (
        <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '12px', padding: '16px', color: '#166534', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <CheckCircle size={24} style={{ color: '#16a34a', flexShrink: 0 }} />
          <div>
            <div style={{ fontWeight: 800, fontSize: '15px' }}>✅ تم اعتماد هذا التقييم والموافقة عليه رسمياً من قِبل المعلم</div>
            <div style={{ fontSize: '12px', color: '#15803d', marginTop: '2px' }}>
              اطلع المعلم على درجات الملاحظة الصفية ونتائج المداولة الإشرافية وتم إغلاق سجل الزيارة بنجاح.
            </div>
          </div>
        </div>
      )}

      {/* If rejected, show teacher's reasons to supervisor/admin */}
      {(initialEvaluation?.status === 'rejected' || initialEvaluation?.teacherDecision === 'rejected') && (
        <div style={{ background: '#fef2f2', border: '2px solid #f87171', borderRadius: '12px', padding: '16px', color: '#991b1b' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 800, fontSize: '15px' }}>
            <AlertCircle size={20} style={{ color: '#dc2626' }} /> ❌ إشعار: لم يوافق المعلم على هذا التقييم (مرفوض مع تسجيل مبررات)
          </div>
          <div style={{ margin: '10px 0 0 0', fontSize: '13px', background: 'white', padding: '12px 16px', borderRadius: '8px', border: '1px solid #fecaca', lineHeight: '1.6', color: '#1e293b' }}>
            <strong style={{ color: '#dc2626' }}>أسباب وتحفظات المعلم المرفوعة للإدارة:</strong>
            <p style={{ margin: '6px 0 0 0', fontWeight: 600 }}>{initialEvaluation.rejectionReason || 'لم يتم إدخال تفاصيل إضافية.'}</p>
          </div>
        </div>
      )}

      {/* PAGE 1: Header Metadata Grid (استمارة الصفحة الأولى) */}
      <div style={{ border: '2px solid #cbd5e1', borderRadius: '12px', overflow: 'hidden', background: '#f8fafc' }}>
        <div style={{ background: '#0f172a', color: 'white', padding: '10px 16px', fontWeight: 800, fontSize: '14px', textAlign: 'center' }}>
          بيانات الزيارة والملاحظة الصفية
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1px', background: '#cbd5e1' }}>
          <div style={{ background: (visit?.visitType === 'supervisor' || visit?.evaluatorRole === 'supervisor') ? '#faf5ff' : '#f0f9ff', padding: '10px 14px' }}>
            <label style={{ display: 'block', fontSize: '11px', color: (visit?.visitType === 'supervisor' || visit?.evaluatorRole === 'supervisor') ? '#7e22ce' : '#0369a1', fontWeight: 'bold' }}>نوع الزيارة والجهة المقيّمة:</label>
            <div style={{ fontWeight: '900', fontSize: '13px', color: (visit?.visitType === 'supervisor' || visit?.evaluatorRole === 'supervisor') ? '#6b21a8' : '#0c4a6e', marginTop: '2px' }}>
              {(visit?.visitType === 'supervisor' || visit?.evaluatorRole === 'supervisor') ? '🎓 زيارة مشرف تربوي' : '👔 زيارة مدير المدرسة'}
            </div>
          </div>

          <div style={{ background: 'white', padding: '10px 14px' }}>
            <label style={{ display: 'block', fontSize: '11px', color: '#64748b', fontWeight: 'bold' }}>اسم المعلم:</label>
            <input
              type="text"
              value={headerData.teacherName}
              onChange={(e) => setHeaderData({ ...headerData, teacherName: e.target.value })}
              style={{ width: '100%', border: 'none', fontWeight: 'bold', fontSize: '14px', outline: 'none', background: 'transparent' }}
            />
          </div>

          <div style={{ background: 'white', padding: '10px 14px' }}>
            <label style={{ display: 'block', fontSize: '11px', color: '#64748b', fontWeight: 'bold' }}>المادة:</label>
            <input
              type="text"
              value={headerData.subject}
              onChange={(e) => setHeaderData({ ...headerData, subject: e.target.value })}
              style={{ width: '100%', border: 'none', fontWeight: 600, fontSize: '13px', outline: 'none', background: 'transparent' }}
            />
          </div>

          <div style={{ background: 'white', padding: '10px 14px' }}>
            <label style={{ display: 'block', fontSize: '11px', color: '#64748b', fontWeight: 'bold' }}>التخصص:</label>
            <input
              type="text"
              value={headerData.specialty}
              onChange={(e) => setHeaderData({ ...headerData, specialty: e.target.value })}
              style={{ width: '100%', border: 'none', fontWeight: 600, fontSize: '13px', outline: 'none', background: 'transparent' }}
            />
          </div>

          <div style={{ background: 'white', padding: '10px 14px' }}>
            <label style={{ display: 'block', fontSize: '11px', color: '#64748b', fontWeight: 'bold' }}>الجنسية:</label>
            <input
              type="text"
              value={headerData.nationality}
              onChange={(e) => setHeaderData({ ...headerData, nationality: e.target.value })}
              style={{ width: '100%', border: 'none', fontWeight: 600, fontSize: '13px', outline: 'none', background: 'transparent' }}
            />
          </div>

          <div style={{ background: 'white', padding: '10px 14px' }}>
            <label style={{ display: 'block', fontSize: '11px', color: '#64748b', fontWeight: 'bold' }}>المرحلة والصف:</label>
            <div style={{ display: 'flex', gap: '6px' }}>
              <input
                type="text"
                value={headerData.stage}
                onChange={(e) => setHeaderData({ ...headerData, stage: e.target.value })}
                style={{ width: '55%', border: 'none', fontWeight: 600, fontSize: '12px', outline: 'none', background: 'transparent' }}
              />
              <input
                type="text"
                value={headerData.classroom}
                onChange={(e) => setHeaderData({ ...headerData, classroom: e.target.value })}
                style={{ width: '45%', border: 'none', fontWeight: 600, fontSize: '12px', outline: 'none', background: 'transparent' }}
              />
            </div>
          </div>

          <div style={{ background: 'white', padding: '10px 14px' }}>
            <label style={{ display: 'block', fontSize: '11px', color: '#64748b', fontWeight: 'bold' }}>اليوم والتاريخ:</label>
            <div style={{ display: 'flex', gap: '6px' }}>
              <input
                type="text"
                value={headerData.visitDay}
                onChange={(e) => setHeaderData({ ...headerData, visitDay: e.target.value })}
                style={{ width: '40%', border: 'none', fontWeight: 600, fontSize: '13px', outline: 'none', background: 'transparent' }}
              />
              <input
                type="date"
                value={headerData.visitDate}
                onChange={(e) => setHeaderData({ ...headerData, visitDate: e.target.value })}
                style={{ width: '60%', border: 'none', fontWeight: 600, fontSize: '13px', outline: 'none', background: 'transparent' }}
              />
            </div>
          </div>

          <div style={{ background: 'white', padding: '10px 14px' }}>
            <label style={{ display: 'block', fontSize: '11px', color: '#64748b', fontWeight: 'bold' }}>الحصة وعدد الطلاب:</label>
            <div style={{ display: 'flex', gap: '6px' }}>
              <input
                type="text"
                value={headerData.period}
                onChange={(e) => setHeaderData({ ...headerData, period: e.target.value })}
                style={{ width: '60%', border: 'none', fontWeight: 600, fontSize: '13px', outline: 'none', background: 'transparent' }}
              />
              <input
                type="text"
                value={headerData.studentsCount}
                onChange={(e) => setHeaderData({ ...headerData, studentsCount: e.target.value })}
                style={{ width: '40%', border: 'none', fontWeight: 600, fontSize: '13px', outline: 'none', background: 'transparent' }}
              />
            </div>
          </div>

          <div style={{ background: 'white', padding: '10px 14px' }}>
            <label style={{ display: 'block', fontSize: '11px', color: '#64748b', fontWeight: 'bold' }}>وقت الدخول:</label>
            <div style={{ display: 'flex', gap: '12px', marginTop: '4px', fontSize: '12px', fontWeight: 'bold' }}>
              {['بداية', 'وسط', 'نهاية'].map(t => (
                <label key={t} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="entryTime"
                    value={t}
                    checked={headerData.entryTime === t}
                    onChange={() => setHeaderData({ ...headerData, entryTime: t })}
                  />
                  {t}
                </label>
              ))}
            </div>
          </div>

          <div style={{ background: 'white', padding: '10px 14px', gridColumn: 'span 2' }}>
            <label style={{ display: 'block', fontSize: '11px', color: '#64748b', fontWeight: 'bold' }}>عنوان الدرس:</label>
            <input
              type="text"
              placeholder="اكتب عنوان موضوع الدرس..."
              value={headerData.lessonTitle}
              onChange={(e) => setHeaderData({ ...headerData, lessonTitle: e.target.value })}
              style={{ width: '100%', border: 'none', fontWeight: 600, fontSize: '13px', outline: 'none', background: 'transparent' }}
            />
          </div>
        </div>
      </div>

      {/* PAGE 1: 20 Performance Criteria Table (الممارسات الأدائية) */}
      <div style={{ border: '2px solid #cbd5e1', borderRadius: '12px', overflow: 'hidden' }}>
        <div style={{ background: '#0284c7', color: 'white', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800 }}>
            الممارسات الأدائية ومستويات الأداء
          </h3>
          <div style={{ fontSize: '12px', background: 'rgba(255,255,255,0.2)', padding: '4px 12px', borderRadius: '8px' }}>
            مستويات الأداء: (5: مرتفع جداً / م ج) • (4: مرتفع) • (3: متوسط) • (2: منخفض) • (0/1: غير مرضٍ)
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
            <thead>
              <tr style={{ background: '#f1f5f9', borderBottom: '2px solid #cbd5e1', fontSize: '12px', color: '#334155' }}>
                <th style={{ padding: '10px', width: '40px', textAlign: 'center' }}>م</th>
                <th style={{ padding: '10px', width: '110px' }}>المجال</th>
                <th style={{ padding: '10px' }}>الممارسات الأدائية</th>
                <th style={{ padding: '10px', textAlign: 'center', width: '220px' }}>مستويات الأداء (الدرجة)</th>
                <th style={{ padding: '10px', width: '180px' }}>شواهد وملاحظات</th>
                <th style={{ padding: '10px', textAlign: 'center', width: '60px' }}>حذف</th>
              </tr>
            </thead>
            <tbody style={{ fontSize: '13px' }}>
              {allDomains.map((dom) => {
                const domainItems = criteria.filter(c => c.domain === dom);
                if (domainItems.length === 0) return null;

                return domainItems.map((item, itemIdx) => {
                  const globalIdx = criteria.findIndex(c => c.id === item.id);
                  return (
                    <tr key={item.id} style={{ borderBottom: '1px solid #e2e8f0', background: itemIdx % 2 === 0 ? 'white' : '#f8fafc' }}>
                      <td style={{ padding: '10px', textAlign: 'center', fontWeight: 'bold', color: '#64748b' }}>
                        {item.number || globalIdx + 1}
                      </td>

                      {itemIdx === 0 ? (
                        <td
                          rowSpan={domainItems.length}
                          style={{
                            padding: '12px 10px',
                            fontWeight: 800,
                            color: '#0369a1',
                            background: '#f0f9ff',
                            borderLeft: '1px solid #cbd5e1',
                            borderRight: '1px solid #cbd5e1',
                            verticalAlign: 'middle',
                            textAlign: 'center',
                            fontSize: '13px'
                          }}
                        >
                          {dom}
                        </td>
                      ) : null}

                      <td style={{ padding: '10px', fontWeight: 600, color: '#1e293b', lineHeight: '1.5' }}>
                        {item.name}
                      </td>

                      {/* Performance Levels Selector: 5, 4, 3, 2, 0 */}
                      <td style={{ padding: '10px', textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', gap: '4px', alignItems: 'center', background: '#f1f5f9', padding: '4px 6px', borderRadius: '8px' }}>
                          {[
                            { label: 'م ج (5)', val: 5, bg: '#16a34a' },
                            { label: 'مرتفع (4)', val: 4, bg: '#0284c7' },
                            { label: 'متوسط (3)', val: 3, bg: '#d97706' },
                            { label: 'منخفض (2)', val: 2, bg: '#ea580c' },
                            { label: 'غير مرض (0)', val: 0, bg: '#dc2626' }
                          ].map(lvl => (
                            <button
                              key={lvl.val}
                              type="button"
                              onClick={() => handleScoreLevel(globalIdx, lvl.val)}
                              style={{
                                border: 'none',
                                background: item.earnedScore === lvl.val ? lvl.bg : 'white',
                                color: item.earnedScore === lvl.val ? 'white' : '#475569',
                                fontWeight: 'bold',
                                fontSize: '11px',
                                padding: '4px 6px',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                transition: 'all 0.15s'
                              }}
                            >
                              {lvl.val}
                            </button>
                          ))}
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                          المستحقة: <strong style={{ color: '#0284c7' }}>{item.earnedScore}</strong> / {item.maxScore}
                        </div>
                      </td>

                      <td style={{ padding: '10px' }}>
                        <input
                          type="text"
                          placeholder="ملاحظات..."
                          value={item.notes}
                          onChange={(e) => handleNotesChange(globalIdx, e.target.value)}
                          style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                        />
                      </td>

                      <td style={{ padding: '10px', textAlign: 'center' }}>
                        <button
                          type="button"
                          onClick={() => handleDeleteCriterion(globalIdx)}
                          style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', padding: '4px' }}
                          title="حذف هذا المعيار (مع التحذير مرتين)"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                });
              })}
            </tbody>
          </table>
        </div>

        {/* Add custom criterion row */}
        <div style={{ background: '#f8fafc', padding: '12px 16px', borderTop: '1px solid #cbd5e1', display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
          <select
            value={newCritDomain}
            onChange={(e) => setNewCritDomain(e.target.value)}
            style={{ padding: '8px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', fontWeight: 'bold', background: 'white' }}
          >
            <option value="التخطيط">مجال التخطيط</option>
            <option value="بناء خبرات التعلم">مجال بناء خبرات التعلم</option>
            <option value="تقويم التعلم">مجال تقويم التعلم</option>
            <option value="معايير مخصصة">مجال إضافي مخصص</option>
          </select>

          <input
            type="text"
            placeholder="نص المعيار الجديد لإضافته للاستمارة..."
            value={newCritName}
            onChange={(e) => setNewCritName(e.target.value)}
            style={{ flex: 1, minWidth: '220px', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
          />

          <input
            type="number"
            min="1"
            max="10"
            value={newCritMax}
            onChange={(e) => setNewCritMax(e.target.value)}
            style={{ width: '80px', padding: '8px', borderRadius: '8px', border: '1px solid #cbd5e1', textAlign: 'center', fontWeight: 'bold', fontSize: '13px' }}
          />

          <button
            type="button"
            onClick={handleAddCriterion}
            className="btn"
            style={{ background: '#0284c7', color: 'white', fontWeight: 'bold', padding: '8px 16px', borderRadius: '8px', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <Plus size={16} /> إضافة معيار للاستمارة
          </button>
        </div>
      </div>

      {/* PAGE 1 FOOTER: Score & Rating Summary (المجموع والتقدير) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
        <div style={{ background: 'white', border: '2px solid #cbd5e1', borderRadius: '12px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 'bold' }}>المجموع الكلي للدرجات:</div>
            <div style={{ fontSize: '26px', fontWeight: 900, color: '#0f172a' }}>
              {totalEarned} <span style={{ fontSize: '14px', color: '#64748b' }}>/ {totalMax}</span>
            </div>
          </div>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 'bold' }}>النسبة المئوية:</div>
            <div style={{ fontSize: '26px', fontWeight: 900, color: '#0284c7' }}>{percentage}%</div>
          </div>
        </div>

        <div style={{ background: rating.bg, border: `2px solid ${rating.color}`, borderRadius: '12px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '12px', color: '#475569', fontWeight: 'bold' }}>التقدير العام المعتمد:</div>
            <div style={{ fontSize: '24px', fontWeight: 900, color: rating.color }}>{rating.label}</div>
          </div>
          <div style={{ fontSize: '11px', color: '#475569', textAlign: 'left', lineHeight: '1.4' }}>
            ممتاز (90-100) • جيد جداً (80-89)<br />جيد / مرض (70-79) • غير مرض (أقل من 70)
          </div>
        </div>
      </div>

      {/* PAGE 2: المداولة الإشرافية (Supervisory Deliberation) */}
      <div style={{ border: '2px solid #cbd5e1', borderRadius: '12px', overflow: 'hidden', background: 'white' }}>
        <div style={{ background: '#047857', color: 'white', padding: '12px 16px', fontWeight: 800, fontSize: '15px' }}>
          المداولة الإشرافية
        </div>

        {/* 1. النجاحات */}
        <div style={{ padding: '16px', borderBottom: '1px solid #cbd5e1' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 800, color: '#065f46' }}>
              النجاحات ومواطن التميز المرصودة:
            </h4>
            <button
              type="button"
              onClick={handleAddSuccess}
              className="btn"
              style={{ background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', fontSize: '12px', fontWeight: 'bold', padding: '4px 10px', borderRadius: '6px' }}
            >
              + إضافة بند نجاح
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {successes.map((s, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#d1fae5', color: '#047857', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '12px', flexShrink: 0 }}>
                  {idx + 1}
                </span>
                <input
                  type="text"
                  value={s}
                  placeholder={`اكتب بند النجاح رقم ${idx + 1}...`}
                  onChange={(e) => {
                    const up = [...successes];
                    up[idx] = e.target.value;
                    setSuccesses(up);
                  }}
                  style={{ flex: 1, padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                />
                <button
                  type="button"
                  onClick={() => handleDeleteSuccess(idx)}
                  style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', padding: '4px' }}
                  title="حذف البند (مع التحذير مرتين)"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* 2. جوانب التطوير وخطة الدعم والمساندة */}
        <div style={{ padding: '16px', borderBottom: '1px solid #cbd5e1' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 800, color: '#1e293b' }}>
              جوانب التطوير وخطة الدعم والمساندة:
            </h4>
            <button
              type="button"
              onClick={handleAddPlanRow}
              className="btn"
              style={{ background: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1', fontSize: '12px', fontWeight: 'bold', padding: '4px 10px', borderRadius: '6px' }}
            >
              + إضافة خطة دعم
            </button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '2px solid #cbd5e1', fontSize: '12px', color: '#475569' }}>
                  <th style={{ padding: '8px', width: '30px' }}>م</th>
                  <th style={{ padding: '8px' }}>الكفايات التي تحتاج إلى تطوير</th>
                  <th style={{ padding: '8px' }}>محور التركيز</th>
                  <th style={{ padding: '8px', width: '160px' }}>الأسلوب الإشرافي</th>
                  <th style={{ padding: '8px', width: '140px' }}>الأسبوع / التاريخ المقترح</th>
                  <th style={{ padding: '8px', textAlign: 'center', width: '50px' }}>حذف</th>
                </tr>
              </thead>
              <tbody style={{ fontSize: '12px' }}>
                {developmentPlan.map((row, idx) => (
                  <tr key={row.id || idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '8px', fontWeight: 'bold', color: '#64748b' }}>{idx + 1}</td>
                    <td style={{ padding: '8px' }}>
                      <input
                        type="text"
                        placeholder="الكفاية المستهدفة..."
                        value={row.competency}
                        onChange={(e) => {
                          const up = [...developmentPlan];
                          up[idx].competency = e.target.value;
                          setDevelopmentPlan(up);
                        }}
                        style={{ width: '100%', padding: '6px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                      />
                    </td>
                    <td style={{ padding: '8px' }}>
                      <input
                        type="text"
                        placeholder="محور التركيز..."
                        value={row.focusArea}
                        onChange={(e) => {
                          const up = [...developmentPlan];
                          up[idx].focusArea = e.target.value;
                          setDevelopmentPlan(up);
                        }}
                        style={{ width: '100%', padding: '6px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                      />
                    </td>
                    <td style={{ padding: '8px' }}>
                      <select
                        value={row.supervisoryMethod}
                        onChange={(e) => {
                          const up = [...developmentPlan];
                          up[idx].supervisoryMethod = e.target.value;
                          setDevelopmentPlan(up);
                        }}
                        style={{ width: '100%', padding: '6px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px', background: 'white' }}
                      >
                        <option value="حصة تطبيقية">حصة تطبيقية</option>
                        <option value="ورشة عمل تدريبية">ورشة عمل تدريبية</option>
                        <option value="قراءة موجهة ونقاش">قراءة موجهة ونقاش</option>
                        <option value="تدريب الأقران والزيارة المتبادلة">تدريب الأقران وزيارة متبادلة</option>
                        <option value="جلسة إرشاد فردي">جلسة إرشاد فردي</option>
                      </select>
                    </td>
                    <td style={{ padding: '8px' }}>
                      <input
                        type="text"
                        placeholder="الأسبوع المقترح..."
                        value={row.suggestedWeek}
                        onChange={(e) => {
                          const up = [...developmentPlan];
                          up[idx].suggestedWeek = e.target.value;
                          setDevelopmentPlan(up);
                        }}
                        style={{ width: '100%', padding: '6px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                      />
                    </td>
                    <td style={{ padding: '8px', textAlign: 'center' }}>
                      <button
                        type="button"
                        onClick={() => handleDeletePlanRow(idx)}
                        style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', padding: '4px' }}
                        title="حذف البند (مع التحذير مرتين)"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 3. ملاحظات ومرئيات عامة */}
        <div style={{ padding: '16px', borderBottom: '1px solid #cbd5e1' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '6px', color: '#1e293b' }}>
            ملاحظات ومرئيات عامة:
          </label>
          <textarea
            rows="3"
            value={evaluatorNotes}
            onChange={(e) => setEvaluatorNotes(e.target.value)}
            placeholder="اكتب التوصيات والملاحظات الختامية للزيارة..."
            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
          />
        </div>

        {/* 4. ملحوظة وزارية وإلزامية */}
        <div style={{ background: '#fef3c7', padding: '10px 16px', color: '#92400e', fontSize: '12px', fontWeight: 'bold' }}>
          ملحوظة: تُجرى المداولة الإشرافية عقب الزيارة الصفية مباشرةً أو خلال اليوم الدراسي نفسه، ويُمنع تأجيلها.
        </div>
      </div>

      {/* Action Buttons: Draft vs Submit */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid var(--color-border)', paddingTop: '16px', flexWrap: 'wrap' }}>
        <button
          type="button"
          disabled={isSubmitting}
          onClick={() => handleSave(true)}
          className="btn"
          style={{ background: 'white', color: '#334155', border: '1px solid var(--color-border)', fontWeight: 'bold', padding: '10px 20px', borderRadius: '10px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
        >
          <Save size={16} /> حفظ كمسودة (إخفاء عن المعلم)
        </button>
        <button
          type="button"
          disabled={isSubmitting}
          onClick={() => handleSave(false)}
          className="btn btn-primary"
          style={{ background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)', color: 'white', fontWeight: 'bold', padding: '10px 24px', borderRadius: '10px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
        >
          <Send size={16} /> إرسال واعتماد التقييم للمعلم
        </button>
      </div>
    </div>
  );
}
