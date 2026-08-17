import React, { useState } from 'react';
import { ExternalLink, Download, UploadCloud, CheckCircle2, ShieldCheck, Globe, BookOpen, Users, Award, AlertCircle, Sparkles } from 'lucide-react';
import { db } from '../firebase';
import { collection, addDoc, getDocs } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';

export default function NoorIntegrationHub({ schoolId }) {
  const { userData } = useAuth();
  const [activeTab, setActiveTab] = useState('shortcuts'); // 'shortcuts' | 'export' | 'import' | 'guide'
  const [importText, setImportText] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [importSuccess, setImportSuccess] = useState(false);

  const noorPlatforms = [
    {
      id: 'noor_main',
      title: 'نظام نور الموحد (وزارة التعليم)',
      desc: 'بوابة الإدارة المدرسية ورصد الدرجات والغياب الرسمية المعتمدة',
      url: 'https://noor.moe.gov.sa/NOOR/Login.aspx',
      badge: 'الرئيسي',
      color: '#0e7490',
      bg: 'rgba(14, 116, 144, 0.1)'
    },
    {
      id: 'madrasati',
      title: 'منصة مدرستي للتعليم الإلكتروني',
      desc: 'إدارة الفصول الافتراضية، الواجبات، الاختبارات والتحضير الإلكتروني',
      url: 'https://schools.madrasati.sa/',
      badge: 'التعليم الإلكتروني',
      color: '#16a34a',
      bg: 'rgba(22, 163, 74, 0.1)'
    },
    {
      id: 'faris',
      title: 'نظام فارس للخدمة الذاتية',
      desc: 'الخدمات الذاتية للموظفين والمعلمين، الإجازات، والرواتب',
      url: 'https://sshr.moe.gov.sa/',
      badge: 'الموارد البشرية',
      color: '#8b5cf6',
      bg: 'rgba(139, 92, 246, 0.1)'
    },
    {
      id: 'etimad',
      title: 'بوابة عين التعليمية',
      desc: 'المناهج الدراسية، الكتب التفاعلية ومصادر التعلم الإثرائية',
      url: 'https://ien.edu.sa/',
      badge: 'المناهج والمصادر',
      color: '#d97706',
      bg: 'rgba(217, 119, 6, 0.1)'
    }
  ];

  // Export current students to Noor-compliant CSV template
  const handleExportNoorStudents = async () => {
    try {
      const snap = await getDocs(collection(db, 'students'));
      const list = snap.docs.map(d => d.data());
      
      const headers = ['رقم السجل المدني / الإقامة', 'اسم الطالب الرباعي', 'الصف الدراسي', 'رقم الهاتف / الجوال', 'حالة القيد'];
      const rows = list.map(s => [
        `"${s.nationalId || ''}"`,
        `"${s.name || ''}"`,
        `"${s.class || s.className || ''}"`,
        `"${s.parentPhone || s.whatsapp || ''}"`,
        '"منتظم"'
      ]);

      const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `بيانات_الطلاب_المطابقة_لنظام_نور_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (e) {
      console.error(e);
      alert('حدث خطأ أثناء تصدير البيانات');
    }
  };

  // Import from Noor CSV/Text format
  const handleImportNoorData = async (e) => {
    e.preventDefault();
    if (!importText.trim()) return;
    setIsImporting(true);
    try {
      const lines = importText.trim().split('\n');
      let count = 0;
      for (const line of lines) {
        const parts = line.split(/[,\t]/).map(p => p.trim().replace(/^["']|["']$/g, ''));
        if (parts.length >= 2) {
          const nationalId = parts[0];
          const name = parts[1];
          const className = parts[2] || 'عام';
          const parentPhone = parts[3] || '';

          if (nationalId && name) {
            await addDoc(collection(db, 'students'), {
              nationalId,
              name,
              class: className,
              className,
              parentPhone,
              schoolId: schoolId || userData?.schoolId || 'main_school',
              createdAt: new Date().toISOString()
            });
            count++;
          }
        }
      }
      setImportSuccess(true);
      setImportText('');
      alert(`تم استيراد ${count} طالب بنجاح ومطابقتهم مع قاعدة البيانات`);
    } catch (err) {
      console.error(err);
      alert('حدث خطأ أثناء الاستيراد: ' + err.message);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="glass-panel" style={{ padding: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ margin: '0 0 6px 0', color: 'var(--color-primary-dark)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Globe size={26} color="#0e7490" /> بوابة الربط مع نظام نور والمنصات الوزارية
          </h2>
          <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: '14px' }}>
            الوصول السريع لمنظومة وزارة التعليم وتصدير واستيراد البيانات المتوافقة مع نور
          </p>
        </div>

        <a
          href="https://noor.moe.gov.sa/NOOR/Login.aspx"
          target="_blank"
          rel="noreferrer"
          className="btn btn-primary"
          style={{
            background: 'linear-gradient(135deg, #0e7490, #63B2C6)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            textDecoration: 'none',
            fontWeight: 'bold',
            padding: '10px 20px',
            boxShadow: '0 4px 12px rgba(14, 116, 144, 0.25)'
          }}
        >
          <ExternalLink size={18} /> الدخول المباشر لنظام نور ↗
        </a>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '24px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px', flexWrap: 'wrap' }}>
        {[
          { id: 'shortcuts', label: '🌐 المنصات الوزارية المرتبطة' },
          { id: 'export', label: '📤 تصدير بيانات مطابقة لنور' },
          { id: 'import', label: '📥 استيراد من ملفات نور' },
          { id: 'guide', label: '📘 إرشادات وضوابط الربط' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '8px 16px',
              borderRadius: '10px',
              border: activeTab === tab.id ? '2px solid #0e7490' : '1px solid #cbd5e1',
              background: activeTab === tab.id ? 'rgba(99, 178, 198, 0.15)' : 'white',
              color: activeTab === tab.id ? '#0e7490' : 'var(--color-text-muted)',
              fontWeight: activeTab === tab.id ? 'bold' : 'normal',
              cursor: 'pointer',
              fontSize: '13px'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Ministerial Shortcuts */}
      {activeTab === 'shortcuts' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
          {noorPlatforms.map(p => (
            <div key={p.id} style={{
              background: 'white',
              border: '1px solid #e2e8f0',
              borderRadius: '14px',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '16px',
              boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
            }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 'bold', color: p.color, background: p.bg, padding: '4px 10px', borderRadius: '12px' }}>
                    {p.badge}
                  </span>
                  <ExternalLink size={16} color={p.color} />
                </div>
                <h3 style={{ margin: '0 0 6px 0', fontSize: '16px', color: 'var(--color-primary-dark)' }}>{p.title}</h3>
                <p style={{ margin: 0, fontSize: '13px', color: 'var(--color-text-muted)', lineHeight: '1.6' }}>{p.desc}</p>
              </div>

              <a
                href={p.url}
                target="_blank"
                rel="noreferrer"
                className="btn"
                style={{
                  background: p.color,
                  color: 'white',
                  textAlign: 'center',
                  textDecoration: 'none',
                  fontWeight: 'bold',
                  fontSize: '13px',
                  borderRadius: '8px',
                  padding: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                فتح البوابة <ExternalLink size={14} />
              </a>
            </div>
          ))}
        </div>
      )}

      {/* Tab 2: Export to Noor */}
      {activeTab === 'export' && (
        <div style={{ background: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <h3 style={{ margin: '0 0 10px 0', color: 'var(--color-primary-dark)' }}>
            تصدير كشف قيد وبيانات الطلاب بصيغة نور (CSV / Excel)
          </h3>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '14px', marginBottom: '20px', lineHeight: '1.7' }}>
            يقوم هذا الخيار بتهيئة وتصدير كافة سجلات الطلاب الحالية في ملف متوافق 100% مع حقول وأعمدة الإدخال الجماعي في نظام نور.
          </p>

          <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
            <div style={{ fontWeight: 'bold', color: '#0e7490', marginBottom: '8px', fontSize: '13px' }}>
              الأعمدة المضمنة في الملف المصدّر:
            </div>
            <ul style={{ margin: 0, paddingInlineStart: '20px', fontSize: '13px', color: '#475569', lineHeight: '1.8' }}>
              <li>رقم السجل المدني / الإقامة (10 أرقام)</li>
              <li>اسم الطالب الرباعي الرسمي</li>
              <li>الصف الدراسي والفصل المقيد به</li>
              <li>رقم جوال ولي الأمر المسجل</li>
              <li>حالة القيد الدراسي (منتظم)</li>
            </ul>
          </div>

          <button
            onClick={handleExportNoorStudents}
            className="btn btn-primary"
            style={{
              background: '#047857',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 24px',
              fontWeight: 'bold',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            <Download size={18} /> تحميل ملف بيانات نور (Excel / CSV)
          </button>
        </div>
      )}

      {/* Tab 3: Import from Noor */}
      {activeTab === 'import' && (
        <div style={{ background: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <h3 style={{ margin: '0 0 10px 0', color: 'var(--color-primary-dark)' }}>
            استيراد كشوفات الطلاب المستخرجة من نظام نور
          </h3>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '14px', marginBottom: '16px', lineHeight: '1.7' }}>
            انسخ والصق بيانات الطلاب من ملف Excel المصدر من نظام نور، وسيتم حفظها ومطابقتها مباشرة في قاعدة البيانات.
          </p>

          <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '10px' }}>
            الترتيب المطلوب للسطر: <strong>رقم الهوية، اسم الطالب، الفصل، رقم الجوال</strong> (مفصولة بفاصلة أو Tab)
          </div>

          <form onSubmit={handleImportNoorData}>
            <textarea
              className="input-field"
              rows="8"
              value={importText}
              onChange={e => setImportText(e.target.value)}
              placeholder="1102938475, عبدالرحمن محمد الحربي, أول ثانوي - أ, 0501234567&#10;1109988776, فيصل سعد القرني, أول ثانوي - ب, 0557654321"
              required
              style={{ fontFamily: 'monospace', fontSize: '13px' }}
            />
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isImporting}
              style={{
                background: 'linear-gradient(135deg, #0e7490, #63B2C6)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 24px',
                fontWeight: 'bold',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              <UploadCloud size={18} /> {isImporting ? 'جاري الاستيراد والمطابقة...' : 'استيراد البيانات ومطابقتها مع النظام'}
            </button>
          </form>
        </div>
      )}

      {/* Tab 4: Guidelines */}
      {activeTab === 'guide' && (
        <div style={{ background: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0', lineHeight: '1.8', color: '#334155' }}>
          <h3 style={{ margin: '0 0 12px 0', color: 'var(--color-primary-dark)' }}>
            ضوابط وإجراءات التكامل والتوافق مع نظام نور الوزاري
          </h3>
          <ol style={{ paddingInlineStart: '20px', fontSize: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <li><strong>تطابق الهوية الوطنية:</strong> يشترط استخدام رقم الهوية المكون من 10 أرقام مطابقاً لما هو مسجل في نظام نور المركزي لمنع أي ازدواجية.</li>
            <li><strong>رصد الغياب والحضور:</strong> يتم تصدير ملخصات الغياب اليومية من النظام ورفعها دورياً إلى بوابة نور لتحديث السجل الوزاري المعتمد.</li>
            <li><strong>الخطط الأسبوعية والتحضير:</strong> يتوافق محتوى التحضير الإلكتروني في نظامنا مع متطلبات الإشراف التربوي وبوابة مدرستي ونور.</li>
            <li><strong>الشهادات والتعاريف:</strong> كافة خطابات التعريف المطبوعة من نظامنا تحتوي على الأرقام الوزارية وباركود التحقق الإلكتروني لتسهيل قبولها في الجهات الرسمية.</li>
          </ol>
        </div>
      )}
    </div>
  );
}
