import React from 'react';
import { AlertCircle, ShieldAlert, Printer } from 'lucide-react';
import { sanitizeForVisitor, calculateRating } from '../../services/evaluationService';

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

  const header = evaluation.headerData || {};
  const criteria = evaluation.criteriaSnapshots || [];
  const rating = calculateRating(evaluation.percentage || 0);

  const domains = ['التخطيط', 'بناء خبرات التعلم', 'تقويم التعلم'];
  const otherDomains = [...new Set(criteria.map(c => c.domain))].filter(d => !domains.includes(d));
  const allDomains = [...domains, ...otherDomains];

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
          <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#64748b' }}>تقرير الزيارة الصفية: {visitId}</span>
          <h2 style={{ fontSize: '18px', fontWeight: 800, margin: '4px 0 0 0' }}>سجل الملاحظة والتقييم الفني للمعلم: {header.teacherName || 'المعلم'}</h2>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            type="button"
            onClick={() => window.print()}
            className="btn"
            style={{ background: 'white', border: '1px solid var(--color-border)', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <Printer size={16} /> طباعة التقرير
          </button>
          
          <div style={{ background: rating.bg, padding: '6px 14px', borderRadius: '10px', border: `1px solid ${rating.color}`, textAlign: 'center' }}>
            <div style={{ fontSize: '18px', fontWeight: 900, color: rating.color }}>{evaluation.percentage}% ({rating.label})</div>
          </div>
        </div>
      </div>

      {/* Header Metadata Info */}
      <div style={{ border: '1px solid #cbd5e1', borderRadius: '10px', background: '#f8fafc', padding: '12px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', fontSize: '12px' }}>
        <div><strong>المادة:</strong> {header.subject}</div>
        <div><strong>المرحلة والصف:</strong> {header.stage} - {header.classroom}</div>
        <div><strong>الحصة:</strong> {header.period}</div>
        <div><strong>تاريخ الزيارة:</strong> {header.visitDate}</div>
      </div>

      {/* Allowed Criteria Table */}
      <div style={{ border: '2px solid #cbd5e1', borderRadius: '12px', overflow: 'hidden' }}>
        <div style={{ background: '#0284c7', color: 'white', padding: '10px 16px', fontWeight: 800, fontSize: '14px' }}>
          بنود الممارسات الأدائية
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
            <thead>
              <tr style={{ background: '#f1f5f9', borderBottom: '2px solid #cbd5e1', fontSize: '12px', color: '#475569' }}>
                <th style={{ padding: '10px', width: '35px', textAlign: 'center' }}>م</th>
                <th style={{ padding: '10px', width: '110px' }}>المجال</th>
                <th style={{ padding: '10px' }}>الممارسات الأدائية</th>
                <th style={{ padding: '10px', textAlign: 'center', width: '100px' }}>الدرجة</th>
              </tr>
            </thead>
            <tbody style={{ fontSize: '13px' }}>
              {allDomains.map((dom) => {
                const domainItems = criteria.filter(c => c.domain === dom);
                if (domainItems.length === 0) return null;

                return domainItems.map((item, itemIdx) => (
                  <tr key={item.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '10px', textAlign: 'center', fontWeight: 'bold', color: '#64748b' }}>
                      {item.number || itemIdx + 1}
                    </td>
                    {itemIdx === 0 && (
                      <td
                        rowSpan={domainItems.length}
                        style={{
                          padding: '10px',
                          fontWeight: 800,
                          color: '#0369a1',
                          background: '#f0f9ff',
                          borderLeft: '1px solid #cbd5e1',
                          borderRight: '1px solid #cbd5e1',
                          verticalAlign: 'middle',
                          textAlign: 'center',
                          fontSize: '12px'
                        }}
                      >
                        {dom}
                      </td>
                    )}
                    <td style={{ padding: '10px', fontWeight: 600, color: '#1e293b' }}>
                      {item.name}
                    </td>
                    <td style={{ padding: '10px', textAlign: 'center', fontWeight: 'bold', color: '#0f172a', background: 'rgba(0,0,0,0.02)' }}>
                      {item.earnedScore} / {item.maxScore}
                    </td>
                  </tr>
                ));
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Deliberation Successes */}
      {evaluation.successes?.length > 0 && (
        <div style={{ border: '1px solid #cbd5e1', borderRadius: '10px', padding: '14px', background: 'white' }}>
          <h4 style={{ margin: '0 0 6px 0', fontSize: '13px', fontWeight: 800, color: '#065f46' }}>
            النجاحات ومواطن التميز:
          </h4>
          <ul style={{ margin: 0, paddingRight: '20px', fontSize: '13px', lineHeight: '1.7' }}>
            {evaluation.successes.filter(s => s.trim()).map((s, idx) => (
              <li key={idx}>{s}</li>
            ))}
          </ul>
        </div>
      )}

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
