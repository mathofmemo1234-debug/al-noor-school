import React, { useState, useMemo } from 'react';
import { 
  Printer, 
  Download, 
  X, 
  Check, 
  Award, 
  Layers, 
  CheckCircle2, 
  Clock, 
  Search, 
  FileText, 
  Settings, 
  Edit3, 
  Eye, 
  ExternalLink, 
  Image as ImageIcon,
  Sparkles,
  Building,
  UserCheck,
  Filter
} from 'lucide-react';
import { SCHOOL_NAME } from '../data/excellenceData';

export default function PrintExcellenceModal({
  excellenceData,
  evidences = {},
  schoolName = SCHOOL_NAME,
  userData = {},
  onClose
}) {
  // --- Print Header & Metadata States (Editable) ---
  const [reportTitle, setReportTitle] = useState('تقرير توثيق شواهد التميز المدرسي والاعتماد');
  const [customSchoolName, setCustomSchoolName] = useState(schoolName || SCHOOL_NAME);
  const [academicYear, setAcademicYear] = useState('1447 - 1448 هـ');
  const [principalName, setPrincipalName] = useState(userData?.principalName || 'أنس الجهني');
  const [coordinatorName, setCoordinatorName] = useState(userData?.name || 'منسق الجودة والتميز');
  const [closingNotes, setClosingNotes] = useState('تمت مراجعة وتدقيق كافة الشواهد والأدلة المرفقة وفق المعايير والضوابط المعتمدة لتقويم وتطوير الأداء المدرسي.');

  // --- Display / Layout Options ---
  const [includeEmptyIndicators, setIncludeEmptyIndicators] = useState(true);
  const [includeImages, setIncludeImages] = useState(true);
  const [includeLinks, setIncludeLinks] = useState(true);
  const [includeStatsSummary, setIncludeStatsSummary] = useState(true);
  const [includeSignatures, setIncludeSignatures] = useState(true);
  const [isLiveEditMode, setIsLiveEditMode] = useState(false);

  // --- Search & Tab in Control Bar ---
  const [activeTab, setActiveTab] = useState('selection'); // 'selection' | 'settings'
  const [searchQuery, setSearchQuery] = useState('');

  // --- Editable Overrides for Evidences (Live editing directly in preview) ---
  const [evidenceOverrides, setEvidenceOverrides] = useState({});

  // --- Indicator Selection State ---
  // Default: All indicators selected
  const [selectedIndicatorIds, setSelectedIndicatorIds] = useState(() => {
    const allIds = [];
    excellenceData.forEach(d => {
      d.criteria.forEach(c => {
        c.indicators.forEach(ind => allIds.push(ind.id));
      });
    });
    return allIds;
  });

  // Flat list of all indicators with metadata
  const allIndicatorsList = useMemo(() => {
    const list = [];
    excellenceData.forEach(domain => {
      domain.criteria.forEach(criteria => {
        criteria.indicators.forEach(ind => {
          list.push({
            ...ind,
            domainId: domain.id,
            domainTitle: domain.title,
            criteriaId: criteria.id,
            criteriaTitle: criteria.title
          });
        });
      });
    });
    return list;
  }, [excellenceData]);

  // Quick Selection Helpers
  const selectAll = () => {
    setSelectedIndicatorIds(allIndicatorsList.map(i => i.id));
  };

  const clearAll = () => {
    setSelectedIndicatorIds([]);
  };

  const selectOfficialOnly = () => {
    setSelectedIndicatorIds(allIndicatorsList.filter(i => i.isOfficial).map(i => i.id));
  };

  const selectReserveOnly = () => {
    setSelectedIndicatorIds(allIndicatorsList.filter(i => i.isReserve).map(i => i.id));
  };

  const selectCompletedOnly = () => {
    setSelectedIndicatorIds(
      allIndicatorsList
        .filter(i => {
          const ev = evidenceOverrides[i.id] || evidences[i.id];
          return Boolean(ev && (ev.isCompleted || ev.description?.trim() || ev.fileName || ev.linkUrl));
        })
        .map(i => i.id)
    );
  };

  const toggleIndicator = (id) => {
    setSelectedIndicatorIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const toggleDomain = (domainId) => {
    const domainIndicators = allIndicatorsList.filter(i => i.domainId === domainId).map(i => i.id);
    const allSelected = domainIndicators.every(id => selectedIndicatorIds.includes(id));
    if (allSelected) {
      setSelectedIndicatorIds(prev => prev.filter(id => !domainIndicators.includes(id)));
    } else {
      setSelectedIndicatorIds(prev => Array.from(new Set([...prev, ...domainIndicators])));
    }
  };

  const toggleCriteria = (criteriaId) => {
    const critIndicators = allIndicatorsList.filter(i => i.criteriaId === criteriaId).map(i => i.id);
    const allSelected = critIndicators.every(id => selectedIndicatorIds.includes(id));
    if (allSelected) {
      setSelectedIndicatorIds(prev => prev.filter(id => !critIndicators.includes(id)));
    } else {
      setSelectedIndicatorIds(prev => Array.from(new Set([...prev, ...critIndicators])));
    }
  };

  // Filtered indicators based on selection and empty-indicators option
  const filteredData = useMemo(() => {
    return excellenceData.map(domain => {
      const filteredCriteria = domain.criteria.map(crit => {
        const matchingIndicators = crit.indicators.filter(ind => {
          if (!selectedIndicatorIds.includes(ind.id)) return false;
          const currentEvidence = evidenceOverrides[ind.id] || evidences[ind.id];
          const hasEvidence = Boolean(currentEvidence && (currentEvidence.description?.trim() || currentEvidence.fileName || currentEvidence.linkUrl));
          if (!includeEmptyIndicators && !hasEvidence) return false;
          return true;
        });
        return {
          ...crit,
          indicators: matchingIndicators
        };
      }).filter(crit => crit.indicators.length > 0);

      return {
        ...domain,
        criteria: filteredCriteria
      };
    }).filter(domain => domain.criteria.length > 0);
  }, [excellenceData, selectedIndicatorIds, includeEmptyIndicators, evidenceOverrides, evidences]);

  // Statistics for selected report
  const selectedCount = selectedIndicatorIds.length;
  const printableIndicatorsCount = useMemo(() => {
    return filteredData.reduce((acc, d) => acc + d.criteria.reduce((cAcc, c) => cAcc + c.indicators.length, 0), 0);
  }, [filteredData]);

  const printableCompletedCount = useMemo(() => {
    let count = 0;
    filteredData.forEach(d => {
      d.criteria.forEach(c => {
        c.indicators.forEach(i => {
          const ev = evidenceOverrides[i.id] || evidences[i.id];
          if (ev && (ev.isCompleted || ev.description?.trim() || ev.fileName || ev.linkUrl)) count++;
        });
      });
    });
    return count;
  }, [filteredData, evidenceOverrides, evidences]);

  const handlePrint = () => {
    window.print();
  };

  // Helper to handle live edits in preview
  const handleInlineEdit = (indicatorId, field, value) => {
    setEvidenceOverrides(prev => ({
      ...prev,
      [indicatorId]: {
        ...(evidences[indicatorId] || {}),
        ...(prev[indicatorId] || {}),
        [field]: value
      }
    }));
  };

  // Export to Microsoft Word (.doc)
  const exportToWord = () => {
    const printContent = document.getElementById('excellence-printable-document');
    if (!printContent) return;

    const htmlContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>${reportTitle}</title>
        <style>
          @page Section1 {
            size: A4 portrait;
            margin: 1.5cm 1.5cm 1.5cm 1.5cm;
            mso-header-margin: 36pt;
            mso-footer-margin: 36pt;
          }
          div.Section1 { page: Section1; }
          body {
            font-family: 'Traditional Arabic', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            direction: rtl;
            text-align: right;
            color: #1e293b;
            line-height: 1.6;
          }
          table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
          th, td { border: 1px solid #cbd5e1; padding: 8px 10px; text-align: right; font-size: 11pt; }
          th { background-color: #f1f5f9; font-weight: bold; }
          .header-box { text-align: center; border-bottom: 2px solid #0284c7; padding-bottom: 12px; margin-bottom: 20px; }
          .domain-header { background-color: #e0f2fe; color: #0369a1; padding: 10px; font-weight: bold; font-size: 14pt; margin-top: 15px; border-radius: 6px; }
          .criteria-header { background-color: #f8fafc; color: #334155; padding: 6px 10px; font-weight: bold; font-size: 12pt; margin-top: 10px; border-right: 4px solid #0ea5e9; }
          .indicator-card { border: 1px solid #e2e8f0; padding: 12px; margin-bottom: 12px; border-radius: 8px; }
          .badge { display: inline-block; padding: 2px 8px; font-size: 9pt; border-radius: 4px; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="Section1">
          ${printContent.innerHTML}
        </div>
      </body>
      </html>
    `;

    const blob = new Blob(['\ufeff', htmlContent], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${customSchoolName} - ${reportTitle}.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(15, 23, 42, 0.75)',
      backdropFilter: 'blur(6px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 99999,
      padding: '16px',
      overflowY: 'auto'
    }} dir="rtl">
      
      {/* Printable CSS Injection */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #excellence-printable-document, #excellence-printable-document * {
            visibility: visible !important;
          }
          #excellence-printable-document {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            color: #0f172a !important;
            box-shadow: none !important;
          }
          .no-print {
            display: none !important;
          }
          .page-break-before {
            page-break-before: always !important;
            break-before: page !important;
          }
          .avoid-break {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          @page {
            size: A4 portrait;
            margin: 1.2cm 1.2cm 1.2cm 1.2cm;
          }
        }
      `}</style>

      <div className="glass-panel" style={{
        width: '1200px',
        maxWidth: '100%',
        maxHeight: '94vh',
        background: '#f8fafc',
        borderRadius: '24px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        border: '1px solid #cbd5e1'
      }}>
        
        {/* ================= CONTROLS & SETTINGS BAR (NO-PRINT) ================= */}
        <div className="no-print" style={{
          padding: '16px 24px',
          background: '#0f172a',
          color: '#f8fafc',
          borderBottom: '1px solid #334155',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px'
        }}>
          
          {/* Main Top Header in Modal */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'linear-gradient(135deg, #0284c7, #0ea5e9)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                <Printer size={22} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 'bold', color: '#38bdf8' }}>
                  معاينة وطباعة وتخصيص ملف التميز المدرسي
                </h3>
                <p style={{ margin: '2px 0 0 0', fontSize: '0.8rem', color: '#94a3b8' }}>
                  اختيار المؤشرات، التعديل المباشر، وطباعة الشواهد مرتبة وفق المجالات والمعايير
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              
              <button
                onClick={() => setIsLiveEditMode(!isLiveEditMode)}
                style={{
                  background: isLiveEditMode ? '#d97706' : 'rgba(255,255,255,0.08)',
                  border: isLiveEditMode ? '1px solid #f59e0b' : '1px solid #334155',
                  color: isLiveEditMode ? '#fff' : '#cbd5e1',
                  padding: '8px 14px',
                  borderRadius: '10px',
                  fontSize: '0.85rem',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
                title="تفعيل وضع تحرير النصوص والشواهد مباشرة في المعاينة"
              >
                <Edit3 size={16} />
                <span>{isLiveEditMode ? 'إيقاف التحرير المباشر ✍️' : 'تفعيل التحرير المباشر ✍️'}</span>
              </button>

              <button
                onClick={exportToWord}
                style={{
                  background: 'rgba(59, 130, 246, 0.15)',
                  border: '1px solid rgba(59, 130, 246, 0.4)',
                  color: '#60a5fa',
                  padding: '8px 14px',
                  borderRadius: '10px',
                  fontSize: '0.85rem',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Download size={16} />
                <span>تصدير Word (.doc)</span>
              </button>

              <button
                onClick={handlePrint}
                className="btn btn-primary"
                style={{
                  background: 'linear-gradient(135deg, #0284c7, #0369a1)',
                  color: '#fff',
                  padding: '8px 20px',
                  borderRadius: '10px',
                  fontSize: '0.9rem',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 12px rgba(2, 132, 199, 0.3)'
                }}
              >
                <Printer size={18} />
                <span>طباعة التقرير (PDF)</span>
              </button>

              <button
                onClick={onClose}
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid #334155',
                  borderRadius: '10px',
                  padding: '8px',
                  cursor: 'pointer',
                  color: '#94a3b8'
                }}
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Sub Navigation Tabs */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #1e293b', paddingTop: '10px', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setActiveTab('selection')}
                style={{
                  background: activeTab === 'selection' ? '#0284c7' : 'transparent',
                  color: activeTab === 'selection' ? '#fff' : '#94a3b8',
                  border: 'none',
                  padding: '6px 14px',
                  borderRadius: '8px',
                  fontSize: '0.85rem',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Filter size={16} />
                <span>تحديد واختيار المؤشرات ({selectedCount})</span>
              </button>

              <button
                onClick={() => setActiveTab('settings')}
                style={{
                  background: activeTab === 'settings' ? '#0284c7' : 'transparent',
                  color: activeTab === 'settings' ? '#fff' : '#94a3b8',
                  border: 'none',
                  padding: '6px 14px',
                  borderRadius: '8px',
                  fontSize: '0.85rem',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Settings size={16} />
                <span>تخصيص الترويسة والخيارات</span>
              </button>
            </div>

            <div style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>
              المؤشرات المشمولة بالمعاينة: <strong style={{ color: '#38bdf8' }}>{printableIndicatorsCount}</strong> (مكتمل منها: <strong style={{ color: '#4ade80' }}>{printableCompletedCount}</strong>)
            </div>
          </div>

          {/* Panel for Indicator Selection */}
          {activeTab === 'selection' && (
            <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              
              {/* Quick Filter Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  <button onClick={selectAll} style={{ background: 'rgba(2, 132, 199, 0.2)', border: '1px solid #0284c7', color: '#38bdf8', padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 'bold' }}>
                    تحديد الكل ({allIndicatorsList.length})
                  </button>
                  <button onClick={selectOfficialOnly} style={{ background: 'rgba(59, 130, 246, 0.2)', border: '1px solid #3b82f6', color: '#60a5fa', padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 'bold' }}>
                    المعتمدة الـ 56 فقط
                  </button>
                  <button onClick={selectReserveOnly} style={{ background: 'rgba(245, 158, 11, 0.2)', border: '1px solid #f59e0b', color: '#fde047', padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 'bold' }}>
                    الاحتياطية الـ 13 فقط
                  </button>
                  <button onClick={selectCompletedOnly} style={{ background: 'rgba(34, 197, 94, 0.2)', border: '1px solid #22c55e', color: '#86efac', padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 'bold' }}>
                    المكتملة الشواهد فقط
                  </button>
                  <button onClick={clearAll} style={{ background: 'rgba(239, 68, 68, 0.2)', border: '1px solid #ef4444', color: '#fca5a5', padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 'bold' }}>
                    إلغاء التحديد
                  </button>
                </div>

                <div style={{ position: 'relative', width: '220px' }}>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="بحث في المؤشرات..."
                    style={{
                      width: '100%',
                      padding: '4px 28px 4px 8px',
                      background: '#0f172a',
                      border: '1px solid #475569',
                      borderRadius: '6px',
                      color: '#fff',
                      fontSize: '0.75rem'
                    }}
                  />
                  <Search size={14} color="#94a3b8" style={{ position: 'absolute', right: '8px', top: '8px' }} />
                </div>
              </div>

              {/* Accordion Selection Tree */}
              <div style={{ maxHeight: '160px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px', paddingRight: '4px' }}>
                {excellenceData.map(domain => {
                  const domainIndicators = allIndicatorsList.filter(i => i.domainId === domain.id);
                  const isDomainSelected = domainIndicators.every(i => selectedIndicatorIds.includes(i.id));

                  return (
                    <div key={domain.id} style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', padding: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8rem', color: '#38bdf8' }}>
                          <input
                            type="checkbox"
                            checked={isDomainSelected}
                            onChange={() => toggleDomain(domain.id)}
                            style={{ accentColor: '#0284c7', cursor: 'pointer' }}
                          />
                          <span>{domain.title}</span>
                        </label>
                      </div>

                      <div style={{ paddingRight: '20px', marginTop: '6px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '4px' }}>
                        {domain.criteria.map(crit => {
                          const critIndicators = crit.indicators;
                          const isCritSelected = critIndicators.every(i => selectedIndicatorIds.includes(i.id));

                          return (
                            <div key={crit.id} style={{ background: 'rgba(255,255,255,0.03)', padding: '4px 6px', borderRadius: '6px' }}>
                              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '0.75rem', color: '#e2e8f0', fontWeight: 'bold' }}>
                                <input
                                  type="checkbox"
                                  checked={isCritSelected}
                                  onChange={() => toggleCriteria(crit.id)}
                                  style={{ accentColor: '#0ea5e9', cursor: 'pointer' }}
                                />
                                <span>{crit.title} ({critIndicators.length})</span>
                              </label>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>
          )}

          {/* Panel for Settings & Customization */}
          {activeTab === 'settings' && (
            <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '12px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
              
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '4px' }}>عنوان التقرير</label>
                <input
                  type="text"
                  value={reportTitle}
                  onChange={e => setReportTitle(e.target.value)}
                  style={{ width: '100%', padding: '6px 10px', background: '#0f172a', border: '1px solid #475569', borderRadius: '6px', color: '#fff', fontSize: '0.8rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '4px' }}>اسم المدرسة</label>
                <input
                  type="text"
                  value={customSchoolName}
                  onChange={e => setCustomSchoolName(e.target.value)}
                  style={{ width: '100%', padding: '6px 10px', background: '#0f172a', border: '1px solid #475569', borderRadius: '6px', color: '#fff', fontSize: '0.8rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '4px' }}>العام الدراسي</label>
                <input
                  type="text"
                  value={academicYear}
                  onChange={e => setAcademicYear(e.target.value)}
                  style={{ width: '100%', padding: '6px 10px', background: '#0f172a', border: '1px solid #475569', borderRadius: '6px', color: '#fff', fontSize: '0.8rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '4px' }}>مدير المدرسة</label>
                <input
                  type="text"
                  value={principalName}
                  onChange={e => setPrincipalName(e.target.value)}
                  style={{ width: '100%', padding: '6px 10px', background: '#0f172a', border: '1px solid #475569', borderRadius: '6px', color: '#fff', fontSize: '0.8rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '4px' }}>منسق التميز المدرسي</label>
                <input
                  type="text"
                  value={coordinatorName}
                  onChange={e => setCoordinatorName(e.target.value)}
                  style={{ width: '100%', padding: '6px 10px', background: '#0f172a', border: '1px solid #475569', borderRadius: '6px', color: '#fff', fontSize: '0.8rem' }}
                />
              </div>

              {/* Toggles */}
              <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '14px', flexWrap: 'wrap', borderTop: '1px solid #334155', paddingTop: '8px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: '#cbd5e1', cursor: 'pointer' }}>
                  <input type="checkbox" checked={includeEmptyIndicators} onChange={e => setIncludeEmptyIndicators(e.target.checked)} style={{ accentColor: '#0284c7' }} />
                  <span>تضمين المؤشرات الفارغة (غير المكتملة)</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: '#cbd5e1', cursor: 'pointer' }}>
                  <input type="checkbox" checked={includeImages} onChange={e => setIncludeImages(e.target.checked)} style={{ accentColor: '#0284c7' }} />
                  <span>تضمين صور الشواهد المرفقة</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: '#cbd5e1', cursor: 'pointer' }}>
                  <input type="checkbox" checked={includeLinks} onChange={e => setIncludeLinks(e.target.checked)} style={{ accentColor: '#0284c7' }} />
                  <span>تضمين الروابط السحابية</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: '#cbd5e1', cursor: 'pointer' }}>
                  <input type="checkbox" checked={includeStatsSummary} onChange={e => setIncludeStatsSummary(e.target.checked)} style={{ accentColor: '#0284c7' }} />
                  <span>إظهار ملخص الإحصائيات العامة</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: '#cbd5e1', cursor: 'pointer' }}>
                  <input type="checkbox" checked={includeSignatures} onChange={e => setIncludeSignatures(e.target.checked)} style={{ accentColor: '#0284c7' }} />
                  <span>إظهار التوقيعات والختم الرسمي</span>
                </label>
              </div>

            </div>
          )}

        </div>

        {/* ================= DOCUMENT PREVIEW AREA (PRINTABLE) ================= */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '24px',
          background: '#e2e8f0',
          display: 'flex',
          justifyContent: 'center'
        }}>
          
          <div
            id="excellence-printable-document"
            style={{
              width: '210mm',
              minHeight: '297mm',
              background: '#fff',
              color: '#0f172a',
              padding: '20mm 15mm',
              boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
              borderRadius: '4px',
              fontFamily: "'Cairo', 'Traditional Arabic', sans-serif"
            }}
          >
            
            {/* Header: Kingdom & Ministry */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '2px solid #0284c7', paddingBottom: '14px', marginBottom: '20px' }}>
              
              <div style={{ textAlign: 'right', fontSize: '0.85rem', lineHeight: '1.5', color: '#1e293b' }}>
                <strong style={{ fontSize: '0.95rem' }}>المملكة العربية السعودية</strong><br />
                <span>وزارة التعليم</span><br />
                <span>الإدارة العامة للتعليم بمنطقة مكة المكرمة</span><br />
                <strong>{customSchoolName}</strong>
              </div>

              <div style={{ textAlign: 'center' }}>
                <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'linear-gradient(135deg, #0284c7, #0369a1)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 6px auto', boxShadow: '0 4px 10px rgba(2, 132, 199, 0.3)' }}>
                  <Award size={32} />
                </div>
                <strong style={{ fontSize: '0.85rem', color: '#0369a1', display: 'block' }}>برنامج التقويم والتميز المدرسي</strong>
              </div>

              <div style={{ textAlign: 'left', fontSize: '0.85rem', lineHeight: '1.5', color: '#475569' }}>
                <span>العام الدراسي: <strong>{academicYear}</strong></span><br />
                <span>التاريخ: {new Date().toLocaleDateString('ar-SA')}</span><br />
                <span>المدينة: جدة</span>
              </div>

            </div>

            {/* Title Banner */}
            <div style={{
              background: 'linear-gradient(135deg, #0369a1, #0284c7)',
              color: '#fff',
              padding: '16px',
              borderRadius: '10px',
              textAlign: 'center',
              marginBottom: '20px'
            }}>
              {isLiveEditMode ? (
                <input
                  type="text"
                  value={reportTitle}
                  onChange={e => setReportTitle(e.target.value)}
                  style={{ width: '100%', textAlign: 'center', fontSize: '1.3rem', fontWeight: 'bold', background: 'rgba(255,255,255,0.2)', border: '1px dashed #fff', color: '#fff', borderRadius: '6px', padding: '4px' }}
                />
              ) : (
                <h1 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 'bold', color: '#fff' }}>
                  {reportTitle}
                </h1>
              )}
              <p style={{ margin: '4px 0 0 0', fontSize: '0.9rem', color: '#e0f2fe' }}>
                {customSchoolName} — وثيقة الشواهد والأدلة الداعمة لمعايير الاعتماد المدرسي
              </p>
            </div>

            {/* Summary Statistics Table */}
            {includeStatsSummary && (
              <div className="avoid-break" style={{ marginBottom: '24px', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '10px', padding: '12px 16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', textAlign: 'center' }}>
                  <div style={{ borderLeft: '1px solid #e2e8f0', paddingLeft: '8px' }}>
                    <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>إجمالي المؤشرات المشمولة</span>
                    <strong style={{ fontSize: '1.2rem', color: '#0369a1' }}>{printableIndicatorsCount}</strong>
                  </div>
                  <div style={{ borderLeft: '1px solid #e2e8f0', paddingLeft: '8px' }}>
                    <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>المؤشرات المكتملة</span>
                    <strong style={{ fontSize: '1.2rem', color: '#16a34a' }}>{printableCompletedCount}</strong>
                  </div>
                  <div style={{ borderLeft: '1px solid #e2e8f0', paddingLeft: '8px' }}>
                    <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>نسبة الإنجاز الإجمالية</span>
                    <strong style={{ fontSize: '1.2rem', color: '#0284c7' }}>
                      {printableIndicatorsCount > 0 ? Math.round((printableCompletedCount / printableIndicatorsCount) * 100) : 0}%
                    </strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>حالة الاعتماد</span>
                    <strong style={{ fontSize: '1rem', color: '#0369a1' }}>جاهز للتقويم</strong>
                  </div>
                </div>
              </div>
            )}

            {/* ================= HIERARCHICAL INDICATORS LIST ================= */}
            {filteredData.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#64748b', background: '#f8fafc', borderRadius: '12px' }}>
                <p style={{ margin: 0, fontSize: '1rem' }}>لا توجد مؤشرات مختارة للطباعة حالياً. يرجى تعديل خيارات التحديد أعلاه.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {filteredData.map((domain, dIdx) => (
                  <div key={domain.id} className="avoid-break" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    
                    {/* Domain Banner */}
                    <div style={{
                      background: '#0284c7',
                      color: '#fff',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontWeight: 'bold',
                      fontSize: '1.05rem',
                      marginTop: dIdx > 0 ? '12px' : 0
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Layers size={20} />
                        <span>{domain.title}</span>
                      </div>
                      <span style={{ fontSize: '0.8rem', background: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: '6px' }}>
                        {domain.criteria.reduce((sum, c) => sum + c.indicators.length, 0)} مؤشرات
                      </span>
                    </div>

                    {/* Criteria and Indicators */}
                    {domain.criteria.map(criteria => (
                      <div key={criteria.id} style={{ display: 'flex', flexDirection: 'column', gap: '10px', paddingRight: '6px' }}>
                        
                        {/* Criterion Subheader */}
                        <div style={{
                          background: '#f1f5f9',
                          borderRight: '4px solid #0284c7',
                          padding: '6px 12px',
                          borderRadius: '4px',
                          color: '#0f172a',
                          fontWeight: 'bold',
                          fontSize: '0.95rem'
                        }}>
                          {criteria.title}
                        </div>

                        {/* Indicators Rows */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          {criteria.indicators.map(indicator => {
                            const rawEvidence = evidenceOverrides[indicator.id] || evidences[indicator.id] || {};
                            const hasEvidence = Boolean(rawEvidence.description?.trim() || rawEvidence.fileName || rawEvidence.linkUrl);

                            return (
                              <div
                                key={indicator.id}
                                className="avoid-break"
                                style={{
                                  border: '1px solid #cbd5e1',
                                  borderRadius: '8px',
                                  padding: '12px 14px',
                                  background: hasEvidence ? '#ffffff' : '#f8fafc',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: '8px'
                                }}
                              >
                                
                                {/* Indicator Header */}
                                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px' }}>
                                  
                                  <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
                                      
                                      <strong style={{ fontSize: '0.95rem', color: '#0369a1' }}>
                                        {indicator.title}
                                      </strong>

                                      {indicator.isReserve && (
                                        <span style={{ fontSize: '0.65rem', background: '#fef3c7', color: '#b45309', border: '1px solid #fde047', padding: '1px 6px', borderRadius: '4px', fontWeight: 'bold' }}>
                                          احتياطي مساند
                                        </span>
                                      )}

                                      {indicator.isOfficial && (
                                        <span style={{ fontSize: '0.65rem', background: '#e0f2fe', color: '#0369a1', border: '1px solid #bae6fd', padding: '1px 6px', borderRadius: '4px', fontWeight: 'bold' }}>
                                          معتمد (56)
                                        </span>
                                      )}
                                    </div>

                                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#475569' }}>
                                      {indicator.description}
                                    </p>
                                  </div>

                                  <div>
                                    {hasEvidence ? (
                                      <span style={{ fontSize: '0.75rem', background: '#dcfce7', color: '#15803d', border: '1px solid #86efac', padding: '2px 8px', borderRadius: '6px', fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                                        ✓ مكتمل التوثيق
                                      </span>
                                    ) : (
                                      <span style={{ fontSize: '0.75rem', background: '#fef3c7', color: '#b45309', border: '1px solid #fde047', padding: '2px 8px', borderRadius: '6px', fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                                        في انتظار الإرفاق
                                      </span>
                                    )}
                                  </div>

                                </div>

                                {/* Evidence Details Table/Box */}
                                {hasEvidence ? (
                                  <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '8px 12px', marginTop: '4px' }}>
                                    
                                    <div style={{ marginBottom: '6px' }}>
                                      <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#0369a1', display: 'block', marginBottom: '2px' }}>
                                        وصف وإجراءات الشاهد المرفق:
                                      </span>
                                      {isLiveEditMode ? (
                                        <textarea
                                          rows={2}
                                          value={rawEvidence.description || ''}
                                          onChange={e => handleInlineEdit(indicator.id, 'description', e.target.value)}
                                          style={{ width: '100%', padding: '6px', fontSize: '0.85rem', borderRadius: '4px', border: '1px dashed #0284c7' }}
                                        />
                                      ) : (
                                        <p style={{ margin: 0, fontSize: '0.85rem', color: '#1e293b', lineHeight: '1.5' }}>
                                          {rawEvidence.description || 'تم استيفاء الشاهد وفق المتطلبات النظامية.'}
                                        </p>
                                      )}
                                    </div>

                                    {/* Meta Row */}
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', fontSize: '0.75rem', color: '#64748b', borderTop: '1px solid #e2e8f0', paddingTop: '6px' }}>
                                      
                                      {rawEvidence.targetGroup && (
                                        <span>الفئة المستهدفة: <strong style={{ color: '#1e293b' }}>{rawEvidence.targetGroup}</strong></span>
                                      )}

                                      {rawEvidence.docDate && (
                                        <span>تاريخ التوثيق: <strong>{rawEvidence.docDate}</strong></span>
                                      )}

                                      {rawEvidence.teacherName && (
                                        <span>الموثق: <strong>{rawEvidence.teacherName}</strong></span>
                                      )}

                                      {includeLinks && rawEvidence.linkUrl && (
                                        <span>الرابط: <a href={rawEvidence.linkUrl} target="_blank" rel="noreferrer" style={{ color: '#0284c7', textDecoration: 'underline' }}>{rawEvidence.linkUrl}</a></span>
                                      )}

                                      {rawEvidence.fileName && (
                                        <span>المرفق: <strong>{rawEvidence.fileName}</strong></span>
                                      )}
                                    </div>

                                    {/* Attached Image Preview if available */}
                                    {includeImages && rawEvidence.fileData && rawEvidence.fileType === 'image' && (
                                      <div style={{ marginTop: '8px', textAlign: 'center' }}>
                                        <img 
                                          src={rawEvidence.fileData} 
                                          alt={rawEvidence.fileName || 'شاهد مرفق'} 
                                          style={{ maxHeight: '180px', maxWidth: '100%', borderRadius: '6px', border: '1px solid #cbd5e1', objectFit: 'contain' }} 
                                        />
                                      </div>
                                    )}

                                  </div>
                                ) : (
                                  <div style={{ fontSize: '0.8rem', color: '#94a3b8', fontStyle: 'italic', padding: '4px 0' }}>
                                    لم يتم إدراج وصف الشواهد لهذا المؤشر بعد.
                                  </div>
                                )}

                              </div>
                            );
                          })}
                        </div>

                      </div>
                    ))}

                  </div>
                ))}
              </div>
            )}

            {/* Closing Notes & Official Signatures */}
            {includeSignatures && (
              <div className="avoid-break" style={{ marginTop: '30px', borderTop: '2px solid #0284c7', paddingTop: '16px' }}>
                
                <div style={{ marginBottom: '20px' }}>
                  <strong style={{ fontSize: '0.85rem', color: '#0369a1', display: 'block', marginBottom: '4px' }}>توصيات وملاحظات لجنة التميز والجودة:</strong>
                  {isLiveEditMode ? (
                    <textarea
                      rows={2}
                      value={closingNotes}
                      onChange={e => setClosingNotes(e.target.value)}
                      style={{ width: '100%', padding: '6px', fontSize: '0.85rem', borderRadius: '4px', border: '1px dashed #0284c7' }}
                    />
                  ) : (
                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#334155', lineHeight: '1.5' }}>
                      {closingNotes}
                    </p>
                  )}
                </div>

                {/* Signatures Table */}
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center', marginTop: '14px' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc' }}>
                      <th style={{ border: '1px solid #cbd5e1', padding: '8px', fontSize: '0.85rem', color: '#0369a1' }}>منسق التميز المدرسي</th>
                      <th style={{ border: '1px solid #cbd5e1', padding: '8px', fontSize: '0.85rem', color: '#0369a1' }}>وكيل الشؤون التعليمية</th>
                      <th style={{ border: '1px solid #cbd5e1', padding: '8px', fontSize: '0.85rem', color: '#0369a1' }}>مدير المدرسة (والختم الرسمي)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ border: '1px solid #cbd5e1', padding: '24px 8px 12px 8px', fontSize: '0.85rem' }}>
                        <strong>{coordinatorName}</strong>
                        <div style={{ height: '30px' }} />
                        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>التوقيع: .....................</span>
                      </td>
                      <td style={{ border: '1px solid #cbd5e1', padding: '24px 8px 12px 8px', fontSize: '0.85rem' }}>
                        <strong>وكيل المدرسة</strong>
                        <div style={{ height: '30px' }} />
                        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>التوقيع: .....................</span>
                      </td>
                      <td style={{ border: '1px solid #cbd5e1', padding: '24px 8px 12px 8px', fontSize: '0.85rem' }}>
                        <strong>{principalName}</strong>
                        <div style={{ height: '30px' }} />
                        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>التوقيع والختم: .....................</span>
                      </td>
                    </tr>
                  </tbody>
                </table>

              </div>
            )}

          </div>

        </div>

      </div>

    </div>
  );
}
