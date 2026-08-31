import React, { useState } from 'react';
import { Plus, Save, Send, Clock, Eye, Trash2, AlertCircle } from 'lucide-react';
import { saveEvaluationDraft, submitEvaluation } from '../../services/evaluationService';

export default function EvaluatorView({ visit, initialEvaluation, currentUser, onSaved }) {
  const [criteria, setCriteria] = useState(
    initialEvaluation?.criteriaSnapshots || [
      { id: '1', name: 'التخطيط والإعداد الذهني والكتابي للدرس', category: 'التخطيط', maxScore: 10, earnedScore: 10, notes: '' },
      { id: '2', name: 'استخدام الوسائل والتقنيات التعليمية المناسبة', category: 'التنفيذ', maxScore: 10, earnedScore: 9, notes: '' },
      { id: '3', name: 'إدارة الصف وجذب انتباه الطلاب وتفاعلهم', category: 'الإدارة الصفية', maxScore: 10, earnedScore: 10, notes: '' },
      { id: '4', name: 'تطبيق أساليب التقويم المستمر والتغذية الراجعة', category: 'التقويم', maxScore: 10, earnedScore: 9, notes: '' }
    ]
  );
  
  const [evaluatorNotes, setEvaluatorNotes] = useState(initialEvaluation?.evaluatorNotes || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newCriterionName, setNewCriterionName] = useState('');
  const [newCriterionMax, setNewCriterionMax] = useState(10);
  const [newCriterionCat, setNewCriterionCat] = useState('معايير نوعية');

  const totalMax = criteria.reduce((sum, c) => sum + Number(c.maxScore || 0), 0);
  const totalEarned = criteria.reduce((sum, c) => sum + Number(c.earnedScore || 0), 0);
  const percentage = totalMax > 0 ? ((totalEarned / totalMax) * 100).toFixed(1) : 0;

  const handleScoreChange = (index, field, value) => {
    const updated = [...criteria];
    updated[index][field] = field === 'earnedScore' || field === 'maxScore' ? Number(value) : value;
    setCriteria(updated);
  };

  const handleAddCustomCriterion = () => {
    if (!newCriterionName.trim()) return;
    setCriteria([
      ...criteria,
      {
        id: `custom_${Date.now()}`,
        name: newCriterionName.trim(),
        category: newCriterionCat,
        maxScore: Number(newCriterionMax) || 10,
        earnedScore: 0,
        notes: ''
      }
    ]);
    setNewCriterionName('');
  };

  const handleRemoveCriterion = (index) => {
    setCriteria(criteria.filter((_, i) => i !== index));
  };

  const handleSave = async (isDraft) => {
    try {
      setIsSubmitting(true);
      const payload = {
        id: initialEvaluation?.id,
        visitId: visit?.id || '',
        schoolId: visit?.schoolId || currentUser?.schoolId || '',
        teacherId: visit?.teacherId || '',
        criteriaSnapshots: criteria,
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
      alert('حدث خطأ: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px', background: 'var(--color-bg-card)', color: 'var(--color-text)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header Info & Tracking Status */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', borderBottom: '1px solid var(--color-border)', pb: '16px', paddingBottom: '16px' }}>
        <div>
          <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#0284c7', background: 'rgba(2, 132, 199, 0.1)', padding: '4px 12px', borderRadius: '20px' }}>
            زيارة رقم: {visit?.id || 'عامة'}
          </span>
          <h2 style={{ fontSize: '20px', fontWeight: 800, margin: '8px 0 4px 0' }}>
            تقييم أداء المعلم: {visit?.teacherName || 'المعلم'}
          </h2>
          <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
            المادة: {visit?.subject || 'الكل'} | الصف: {visit?.classRoom || 'الكل'} | تاريخ الزيارة: {visit?.visitDate || 'اليوم'}
          </p>
        </div>

        {/* Status indicator & Read receipt */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', background: 'rgba(0,0,0,0.03)', padding: '10px 16px', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>حالة التقييم</div>
            <div style={{ fontSize: '13px', fontWeight: 800, marginTop: '2px' }}>
              {initialEvaluation?.status === 'draft' && <span style={{ color: '#d97706' }}>📝 مسودة</span>}
              {initialEvaluation?.status === 'sent' && <span style={{ color: '#2563eb' }}>📨 مُرسل</span>}
              {initialEvaluation?.status === 'approved' && <span style={{ color: '#16a34a' }}>✅ معتمد من المعلم</span>}
              {initialEvaluation?.status === 'rejected' && <span style={{ color: '#dc2626' }}>❌ مرفوض من المعلم</span>}
              {!initialEvaluation && <span style={{ color: '#94a3b8' }}>جديد</span>}
            </div>
          </div>

          <div style={{ width: '1px', height: '30px', background: 'var(--color-border)' }} />

          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>مؤشر القراءة (Read Receipt)</div>
            <div style={{ fontSize: '12px', fontWeight: 700, marginTop: '2px' }}>
              {initialEvaluation?.readAt ? (
                <span style={{ color: '#16a34a', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <Eye size={14} /> تم الاطلاع
                </span>
              ) : (
                <span style={{ color: '#94a3b8', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <Clock size={14} /> لم يقرأ بعد
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* If rejected, show reasons to evaluator */}
      {initialEvaluation?.status === 'rejected' && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '12px', padding: '16px', color: '#991b1b' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 800, fontSize: '14px' }}>
            <AlertCircle size={18} /> تم رفض التقييم من قِبل المعلم بالأسباب التالية:
          </div>
          <p style={{ margin: '8px 0 0 0', fontSize: '13px', background: 'white', padding: '10px 14px', borderRadius: '8px', border: '1px solid #fee2e2', lineHeight: '1.6' }}>
            {initialEvaluation.rejectionReason}
          </p>
        </div>
      )}

      {/* Dynamic Criteria Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
          <thead>
            <tr style={{ background: 'rgba(0,0,0,0.02)', borderBottom: '2px solid var(--color-border)', fontSize: '13px', color: '#475569' }}>
              <th style={{ padding: '12px 10px' }}>#</th>
              <th style={{ padding: '12px 10px' }}>المعيار التعليمي</th>
              <th style={{ padding: '12px 10px' }}>المجال</th>
              <th style={{ padding: '12px 10px', width: '110px' }}>الدرجة العظمى</th>
              <th style={{ padding: '12px 10px', width: '110px' }}>الدرجة المستحقة</th>
              <th style={{ padding: '12px 10px' }}>ملاحظات وشواهد</th>
              <th style={{ padding: '12px 10px', textAlign: 'center', width: '60px' }}>حذف</th>
            </tr>
          </thead>
          <tbody style={{ fontSize: '13px' }}>
            {criteria.map((item, idx) => (
              <tr key={item.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                <td style={{ padding: '10px', color: '#94a3b8', fontWeight: 'bold' }}>{idx + 1}</td>
                <td style={{ padding: '10px', fontWeight: 600 }}>{item.name}</td>
                <td style={{ padding: '10px', color: '#64748b', fontSize: '12px' }}>{item.category}</td>
                <td style={{ padding: '10px' }}>
                  <input
                    type="number"
                    min="1"
                    value={item.maxScore}
                    onChange={(e) => handleScoreChange(idx, 'maxScore', e.target.value)}
                    style={{ width: '80px', padding: '6px', borderRadius: '8px', border: '1px solid var(--color-border)', textAlign: 'center', fontWeight: 'bold' }}
                  />
                </td>
                <td style={{ padding: '10px' }}>
                  <input
                    type="number"
                    min="0"
                    max={item.maxScore}
                    value={item.earnedScore}
                    onChange={(e) => handleScoreChange(idx, 'earnedScore', e.target.value)}
                    style={{ width: '80px', padding: '6px', borderRadius: '8px', border: '1px solid #0284c7', background: 'rgba(2, 132, 199, 0.05)', textAlign: 'center', fontWeight: 'bold', color: '#0369a1' }}
                  />
                </td>
                <td style={{ padding: '10px' }}>
                  <input
                    type="text"
                    placeholder="ملاحظات المقيّم..."
                    value={item.notes}
                    onChange={(e) => handleScoreChange(idx, 'notes', e.target.value)}
                    style={{ width: '100%', padding: '6px 10px', borderRadius: '8px', border: '1px solid var(--color-border)', fontSize: '12px' }}
                  />
                </td>
                <td style={{ padding: '10px', textAlign: 'center' }}>
                  <button
                    type="button"
                    onClick={() => handleRemoveCriterion(idx)}
                    style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', padding: '4px' }}
                    title="حذف"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Custom Criterion Bar */}
      <div style={{ background: 'rgba(0,0,0,0.02)', padding: '14px', borderRadius: '12px', border: '1px dashed var(--color-border)', display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
        <input
          type="text"
          placeholder="نص المعيار الجديد المخصص لهذه الزيارة..."
          value={newCriterionName}
          onChange={(e) => setNewCriterionName(e.target.value)}
          style={{ flex: 1, minWidth: '220px', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--color-border)', fontSize: '13px' }}
        />
        <input
          type="number"
          min="1"
          placeholder="الدرجة"
          value={newCriterionMax}
          onChange={(e) => setNewCriterionMax(e.target.value)}
          style={{ width: '90px', padding: '8px', borderRadius: '8px', border: '1px solid var(--color-border)', textAlign: 'center', fontWeight: 'bold', fontSize: '13px' }}
        />
        <button
          type="button"
          onClick={handleAddCustomCriterion}
          className="btn"
          style={{ background: '#0f172a', color: 'white', fontWeight: 'bold', padding: '8px 16px', borderRadius: '8px', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
        >
          <Plus size={16} /> إضافة معيار
        </button>
      </div>

      {/* Notes & Summary KPI */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', borderTop: '1px solid var(--color-border)', paddingTop: '16px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '8px' }}>
            التوصيات والملاحظات الختامية للمقيم:
          </label>
          <textarea
            rows="3"
            value={evaluatorNotes}
            onChange={(e) => setEvaluatorNotes(e.target.value)}
            placeholder="اكتب التوجيهات التربوية والتغذية الراجعة للمعلم..."
            style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid var(--color-border)', fontSize: '13px', resize: 'vertical' }}
          />
        </div>

        <div style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', color: 'white', padding: '20px', borderRadius: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>النتيجة الإجمالية المحتسبة:</div>
            <div style={{ fontSize: '28px', fontWeight: 900, color: '#facc15', marginTop: '4px' }}>
              {totalEarned} <span style={{ fontSize: '15px', color: '#94a3b8', fontWeight: 'normal' }}>/ {totalMax}</span>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '10px', marginTop: '10px' }}>
            <span style={{ fontSize: '13px', color: '#cbd5e1' }}>النسبة المئوية:</span>
            <span style={{ fontSize: '20px', fontWeight: 900, color: '#4ade80' }}>{percentage}%</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid var(--color-border)', paddingTop: '16px' }}>
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
          <Send size={16} /> إرسال واعتماد التقييم
        </button>
      </div>
    </div>
  );
}
