import React from 'react';
import { Printer, X, BookOpen, Calendar, Clock, User, CheckCircle2, FileText, Building } from 'lucide-react';
import MarkdownViewer from './MarkdownViewer';
import { useAuth } from '../contexts/AuthContext';

export default function PrintLessonPreparationModal({ prep, onClose }) {
  const { userData } = useAuth();
  if (!prep) return null;

  const schoolName = userData?.schoolName || 'مجمع المدارس المتقدمة للتعلم الذكي';
  const principalName = userData?.principalName || 'أنس الجهني';

  const handlePrint = () => {
    window.print();
  };

  const sections = [
    { key: 'goals', title: 'الأهداف التعليمية والسلوكية' },
    { key: 'portfolio', title: 'ملف الإنجاز والمخرجات المتوقعة' },
    { key: 'warmup', title: 'التمهيد والتهيئة الحافزة' },
    { key: 'strategy', title: 'استراتيجيات التدريس المتبعة' },
    { key: 'content', title: 'المحتوى والإجراءات التعليمية' },
    { key: 'resources', title: 'الوسائل والتقنيات ومصادر التعلم' },
    { key: 'formativeEval', title: 'التقويم المرحلي التكويني' },
    { key: 'summativeEval', title: 'التقويم الختامي النهائي' },
    { key: 'homework', title: 'الواجبات والأنشطة الإثرائية' },
  ];

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(15, 23, 42, 0.65)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2000,
      padding: '16px',
      overflowY: 'auto'
    }}>
      <div className="glass-panel" style={{
        width: '900px',
        maxWidth: '100%',
        maxHeight: '92vh',
        overflowY: 'auto',
        background: 'white',
        borderRadius: '16px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column'
      }}>
        
        {/* Controls Bar (Hidden during Print) */}
        <div className="no-print" style={{
          padding: '18px 24px',
          borderBottom: '1px solid #e2e8f0',
          background: '#f8fafc',
          borderTopLeftRadius: '16px',
          borderTopRightRadius: '16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div>
            <h3 style={{ margin: '0 0 4px 0', color: 'var(--color-primary-dark)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BookOpen size={22} color="#0e7490" /> طباعة بطاقة تحضير الدرس - {prep.subject}
            </h3>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--color-text-muted)' }}>
              الصف: {prep.className} • {prep.week || 'الأسبوع 1'} • {prep.date || 'اليوم'}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button
              onClick={handlePrint}
              className="btn btn-primary"
              style={{
                background: 'linear-gradient(135deg, #0e7490, #63B2C6)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 20px',
                fontWeight: 'bold',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              <Printer size={18} /> طباعة التحضير (PDF)
            </button>

            <button
              onClick={onClose}
              style={{
                background: '#f1f5f9',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                padding: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <X size={20} color="#475569" />
            </button>
          </div>
        </div>

        {/* Printable Area */}
        <div className="printable-prep-page" style={{
          padding: '36px 44px',
          background: 'white',
          color: '#0f172a',
          fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
        }}>
          
          {/* Header */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '2px solid #0e7490',
            paddingBottom: '16px',
            marginBottom: '24px'
          }}>
            <div style={{ textAlign: 'right', fontSize: '12px', lineHeight: '1.6' }}>
              <div style={{ fontWeight: 'bold', fontSize: '14px', color: '#0e7490' }}>المملكة العربية السعودية - وزارة التعليم</div>
              <div>الإدارة العامة للتعليم بمحافظة جدة</div>
              <div style={{ fontWeight: 'bold' }}>{schoolName}</div>
            </div>

            <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '14px', marginBottom: '6px' }}>
                <img
                  src={`${import.meta.env.BASE_URL}minst.svg`}
                  alt="وزارة التعليم"
                  style={{ height: '65px', width: 'auto', maxWidth: '110px', objectFit: 'contain', display: 'block' }}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = `${import.meta.env.BASE_URL}default_logo.png`;
                  }}
                />
                <div style={{ width: '1.5px', height: '38px', background: '#cbd5e1' }}></div>
                <img
                  src={userData?.logoUrl || `${import.meta.env.BASE_URL}logo.webp`}
                  alt="شعار المدرسة"
                  style={{ height: '58px', width: 'auto', maxWidth: '90px', objectFit: 'contain', display: 'block' }}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = `${import.meta.env.BASE_URL}default_logo.png`;
                  }}
                />
              </div>
              <h2 style={{ margin: '0 0 4px 0', color: '#0e7490', fontSize: '17px' }}>
                بطاقة وخطة تحضير الدرس اليومي
              </h2>
              <div style={{ fontSize: '12px', color: '#64748b' }}>
                العام الدراسي: 1447 / 1448 هـ
              </div>
            </div>

            <div style={{ textAlign: 'left', fontSize: '12px', lineHeight: '1.6' }}>
              <div><strong>تاريخ التحضير:</strong> {prep.date || new Date().toISOString().split('T')[0]}</div>
              <div><strong>الأسبوع:</strong> {prep.week || 'الأسبوع الأول'}</div>
              <div><strong>الحصة:</strong> {prep.period || 'الحصة الأولى'}</div>
            </div>
          </div>

          {/* Prep Key Info Box */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: '12px',
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '10px',
            padding: '14px 18px',
            marginBottom: '24px',
            fontSize: '13px'
          }}>
            <div>
              <span style={{ color: '#64748b' }}>المادة الدراسية:</span>
              <div style={{ fontWeight: 'bold', color: '#0e7490', fontSize: '15px' }}>{prep.subject}</div>
            </div>
            <div>
              <span style={{ color: '#64748b' }}>الصف / الفصل:</span>
              <div style={{ fontWeight: 'bold', color: '#0f172a', fontSize: '15px' }}>{prep.className}</div>
            </div>
            <div>
              <span style={{ color: '#64748b' }}>اسم المعلم:</span>
              <div style={{ fontWeight: 'bold', color: '#0f172a', fontSize: '15px' }}>
                {prep.teacherName || userData?.name || 'معلم المادة'}
              </div>
            </div>
            {prep.fileName && (
              <div>
                <span style={{ color: '#64748b' }}>المرفق:</span>
                <div style={{ fontWeight: 'bold', color: '#0369a1' }}>{prep.fileName}</div>
              </div>
            )}
          </div>

          {/* Sections List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {sections.map(sec => {
              const content = prep[sec.key];
              if (!content) return null;
              return (
                <div key={sec.key} style={{
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  pageBreakInside: 'avoid'
                }}>
                  <div style={{
                    background: '#f1f5f9',
                    padding: '8px 14px',
                    fontSize: '13px',
                    fontWeight: 'bold',
                    color: '#0e7490',
                    borderBottom: '1px solid #e2e8f0'
                  }}>
                    ✦ {sec.title}
                  </div>
                  <div style={{ padding: '12px 16px', fontSize: '14px', lineHeight: '1.7', background: 'white' }}>
                    <MarkdownViewer content={content} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Signatures & Approvals Box */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: '36px',
            paddingTop: '20px',
            borderTop: '2px dashed #cbd5e1',
            pageBreakInside: 'avoid'
          }}>
            <div style={{ textAlign: 'center', minWidth: '150px' }}>
              <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>معلم المادة</div>
              <div style={{ fontWeight: 'bold', color: '#0f172a', fontSize: '14px' }}>{prep.teacherName || userData?.name}</div>
              <div style={{ height: '35px', borderBottom: '1px solid #94a3b8', margin: '4px auto', width: '120px' }}></div>
            </div>

            <div style={{ textAlign: 'center', minWidth: '150px' }}>
              <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>المشرف التعليمي</div>
              <div style={{ fontWeight: 'bold', color: '#0f172a', fontSize: '14px' }}>الاعتماد الإشرافي</div>
              <div style={{ height: '35px', borderBottom: '1px solid #94a3b8', margin: '4px auto', width: '120px' }}></div>
            </div>

            <div style={{ textAlign: 'center', minWidth: '150px' }}>
              <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>مدير المدرسة</div>
              <div style={{ fontWeight: 'bold', color: '#0e7490', fontSize: '14px' }}>{principalName}</div>
              <div style={{ height: '35px', borderBottom: '1px solid #94a3b8', margin: '4px auto', width: '120px' }}></div>
            </div>
          </div>

        </div>

      </div>

      {/* Print CSS */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          .printable-prep-page, .printable-prep-page * {
            visibility: visible !important;
          }
          .printable-prep-page {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            height: 100% !important;
            padding: 20mm 15mm !important;
            box-shadow: none !important;
            border: none !important;
            background: white !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
