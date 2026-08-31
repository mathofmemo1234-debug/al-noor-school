import React from 'react';
import { AlertCircle, ShieldAlert } from 'lucide-react';
import { sanitizeForVisitor } from '../../services/evaluationService';

export default function VisitorEvaluationView({ rawEvaluation, visitId }) {
  const evaluation = sanitizeForVisitor(rawEvaluation);

  // If draft or no access
  if (!evaluation) {
    return (
      <div className="glass-panel" style={{ padding: '32px', borderRadius: '16px', textAlign: 'center', background: '#fffbeb', border: '1px solid #fef3c7', color: '#92400e' }} dir="rtl">
        <ShieldAlert size={40} style={{ margin: '0 auto 12px auto', color: '#d97706' }} />
        <h3 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 6px 0' }}>التقرير غير متاح حالياً</h3>
        <p style={{ margin: 0, fontSize: '13px', color: '#b45309' }}>التقييم الخاص بهذه الزيارة قيد الإعداد والمراجعة من قِبل المقيم.</p>
      </div>
    );
  }

  return (
    <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px', background: 'var(--color-bg-card)', color: 'var(--color-text)', display: 'flex', flexDirection: 'column', gap: '20px' }} dir="rtl">
      {/* 2. Review Banner if teacher rejected evaluation */}
      {(rawEvaluation?.status === 'rejected' || evaluation.isUnderReview) && (
        <div style={{ background: '#fffbeb', borderRight: '4px solid #f59e0b', padding: '16px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '12px', color: '#92400e' }}>
          <AlertCircle size={24} style={{ color: '#d97706', flexShrink: 0 }} />
          <div>
            <div style={{ fontWeight: 800, fontSize: '14px', color: '#78350f' }}>التقييم قيد المراجعة الإدارية</div>
            <div style={{ fontSize: '12px', color: '#92400e', marginTop: '2px' }}>
              هذا التقييم يخضع حالياً لتدقيق الإدارة التعليمية وسيتم تحديثه عند الاعتماد النهائي.
            </div>
          </div>
        </div>
      )}

      {/* Header Info */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-border)', paddingBottom: '14px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#64748b' }}>تقرير الزيارة الصفية رقم: {visitId}</span>
          <h2 style={{ fontSize: '18px', fontWeight: 800, margin: '4px 0 0 0' }}>سجل التقييم الفني والأكاديمي</h2>
        </div>
        <div style={{ background: 'rgba(0,0,0,0.03)', padding: '8px 18px', borderRadius: '12px', border: '1px solid var(--color-border)', textAlign: 'center' }}>
          <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>المعدل العام</div>
          <div style={{ fontSize: '20px', fontWeight: 900, color: 'var(--color-primary-dark)' }}>{evaluation.percentage}%</div>
        </div>
      </div>

      {/* Allowed Criteria Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
          <thead>
            <tr style={{ background: 'rgba(0,0,0,0.03)', borderBottom: '2px solid var(--color-border)', fontSize: '13px', color: '#475569' }}>
              <th style={{ padding: '12px 10px' }}>#</th>
              <th style={{ padding: '12px 10px' }}>المعيار</th>
              <th style={{ padding: '12px 10px' }}>المجال</th>
              <th style={{ padding: '12px 10px', textAlign: 'center', width: '120px' }}>الدرجة</th>
            </tr>
          </thead>
          <tbody style={{ fontSize: '13px' }}>
            {evaluation.criteriaSnapshots?.map((item, idx) => (
              <tr key={idx} style={{ borderBottom: '1px solid var(--color-border)' }}>
                <td style={{ padding: '10px', color: '#94a3b8', fontWeight: 'bold' }}>{idx + 1}</td>
                <td style={{ padding: '10px', fontWeight: 600 }}>{item.name}</td>
                <td style={{ padding: '10px', color: '#64748b', fontSize: '12px' }}>{item.category}</td>
                <td style={{ padding: '10px', textAlign: 'center', fontWeight: 'bold', color: 'var(--color-text)' }}>
                  {item.earnedScore} / {item.maxScore}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* General Notes (Confidential rejection reasons strictly removed) */}
      {evaluation.evaluatorNotes && (
        <div style={{ background: 'rgba(0,0,0,0.02)', padding: '14px', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
          <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#64748b', marginBottom: '4px' }}>الملاحظات والتوجيهات العامة للزيارة:</div>
          <p style={{ margin: 0, fontSize: '13px', lineHeight: '1.6' }}>{evaluation.evaluatorNotes}</p>
        </div>
      )}
    </div>
  );
}
