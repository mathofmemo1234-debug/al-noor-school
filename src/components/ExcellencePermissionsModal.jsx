import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { excellenceData } from '../data/excellenceData';
import { Shield, Check, X, UserCheck, Award, Lock, Unlock, Save } from 'lucide-react';

export default function ExcellencePermissionsModal({ schoolId, onClose }) {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [allowedDomains, setAllowedDomains] = useState([]);
  const [allowedCriteria, setAllowedCriteria] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');

  useEffect(() => {
    if (!schoolId) return;
    const fetchTeachers = async () => {
      try {
        const q = query(collection(db, 'teachers'), where('schoolId', '==', schoolId));
        const snap = await getDocs(q);
        const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setTeachers(list);
        if (list.length > 0) {
          selectTeacher(list[0]);
        }
      } catch (err) {
        console.error('Error fetching teachers:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTeachers();
  }, [schoolId]);

  const selectTeacher = (t) => {
    setSelectedTeacher(t);
    setAllowedDomains(t.excellenceAllowedDomains || []);
    setAllowedCriteria(t.excellenceAllowedCriteria || []);
    setSaveSuccessMsg('');
  };

  const toggleDomain = (domainId) => {
    if (allowedDomains.includes(domainId)) {
      setAllowedDomains(prev => prev.filter(d => d !== domainId));
    } else {
      setAllowedDomains(prev => [...prev, domainId]);
    }
  };

  const toggleCriteria = (criteriaId) => {
    if (allowedCriteria.includes(criteriaId)) {
      setAllowedCriteria(prev => prev.filter(c => c !== criteriaId));
    } else {
      setAllowedCriteria(prev => [...prev, criteriaId]);
    }
  };

  const selectAllDomains = () => {
    const allD = excellenceData.map(d => d.id);
    const allC = excellenceData.flatMap(d => d.criteria.map(c => c.id));
    setAllowedDomains(allD);
    setAllowedCriteria(allC);
  };

  const clearAllDomains = () => {
    setAllowedDomains([]);
    setAllowedCriteria([]);
  };

  const handleSavePermissions = async () => {
    if (!selectedTeacher) return;
    setIsSaving(true);
    try {
      // 1. Update teacher document
      await updateDoc(doc(db, 'teachers', selectedTeacher.id), {
        excellenceAllowedDomains: allowedDomains,
        excellenceAllowedCriteria: allowedCriteria
      });

      // 2. Sync to users collection if matching nationalId
      if (selectedTeacher.nationalId) {
        const uSnap = await getDocs(
          query(collection(db, 'users'), where('nationalId', '==', selectedTeacher.nationalId))
        );
        uSnap.forEach(async (uDoc) => {
          await updateDoc(doc(db, 'users', uDoc.id), {
            excellenceAllowedDomains: allowedDomains,
            excellenceAllowedCriteria: allowedCriteria
          });
        });
      }

      // Update local state list
      setTeachers(prev =>
        prev.map(t =>
          t.id === selectedTeacher.id
            ? { ...t, excellenceAllowedDomains: allowedDomains, excellenceAllowedCriteria: allowedCriteria }
            : t
        )
      );

      setSaveSuccessMsg(`تم حفظ وتعيين صلاحيات التحرير للمعلم (${selectedTeacher.name}) بنجاح!`);
      setTimeout(() => setSaveSuccessMsg(''), 4000);
    } catch (err) {
      console.error(err);
      alert('حدث خطأ أثناء حفظ الصلاحيات');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '16px' }} dir="rtl">
      <div className="glass-panel" style={{ width: '100%', maxWidth: '850px', maxHeight: '90vh', background: '#0f172a', border: '1px solid #334155', borderRadius: '24px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', color: '#f8fafc', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyBetween: 'space-between', borderBottom: '1px solid #1e293b', pb: '16px', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '14px', background: 'rgba(217, 119, 6, 0.15)', border: '1px solid rgba(217, 119, 6, 0.3)', display: 'flex', alignItems: 'center', justifyCenter: 'center', color: '#f59e0b' }}>
              <Shield size={24} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 'bold', color: '#fbbf24' }}>
                إدارة صلاحيات التحرير للتميز المدرسي للمعلمين
              </h2>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: '#94a3b8' }}>
                تحديد المجالات والمعايير المسموح لكل معلم بتحرير وإدراج الشواهد والأدلة لها
              </p>
            </div>
          </div>

          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid #334155', borderRadius: '10px', padding: '8px', cursor: 'pointer', color: '#94a3b8' }}>
            <X size={20} />
          </button>
        </div>

        {saveSuccessMsg && (
          <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.4)', color: '#6ee7b7', padding: '12px 16px', borderRadius: '12px', fontSize: '0.9rem', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Check size={18} color="#34d399" />
            <span>{saveSuccessMsg}</span>
          </div>
        )}

        {/* Content Body */}
        {loading ? (
          <p style={{ textAlign: 'center', color: '#94a3b8', padding: '30px' }}>جاري تحميل قائمة المعلمين...</p>
        ) : teachers.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#94a3b8', padding: '30px' }}>لا يوجد معلمون مسجلون في هذه المدرسة حتى الآن.</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '20px', flex: 1, minHeight: 0, overflow: 'hidden' }}>
            
            {/* Teachers Sidebar */}
            <div style={{ background: '#1e293b', borderRadius: '16px', padding: '12px', border: '1px solid #334155', display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#94a3b8', paddingBottom: '8px', borderBottom: '1px solid #334155' }}>
                اختر المعلم ({teachers.length})
              </div>
              {teachers.map(t => {
                const isSel = selectedTeacher?.id === t.id;
                const domCount = t.excellenceAllowedDomains?.length || 0;
                return (
                  <button
                    key={t.id}
                    onClick={() => selectTeacher(t)}
                    style={{
                      textAlign: 'right',
                      padding: '10px 12px',
                      borderRadius: '12px',
                      background: isSel ? 'rgba(245, 158, 11, 0.2)' : 'transparent',
                      border: isSel ? '1px solid rgba(245, 158, 11, 0.4)' : '1px solid transparent',
                      color: isSel ? '#fef08a' : '#cbd5e1',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      fontWeight: isSel ? 'bold' : 'normal',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                      transition: 'all 0.15s'
                    }}
                  >
                    <span style={{ truncate: true }}>{t.name}</span>
                    <span style={{ fontSize: '0.75rem', color: isSel ? '#fde047' : '#64748b' }}>
                      {t.subject || 'معلم'} {domCount > 0 ? `(${domCount} مجالات مخصصة)` : '(جميع المجالات)'}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Domains & Criteria Checkbox Options */}
            <div style={{ background: '#1e293b', borderRadius: '16px', padding: '16px', border: '1px solid #334155', display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto' }}>
              
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #334155', paddingBottom: '12px' }}>
                <span style={{ fontWeight: 'bold', color: '#fbbf24', fontSize: '0.95rem' }}>
                  تخصيص صلاحيات التحرير لـ: {selectedTeacher?.name}
                </span>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={selectAllDomains}
                    style={{ background: 'rgba(59, 130, 246, 0.15)', border: '1px solid rgba(59, 130, 246, 0.3)', color: '#60a5fa', padding: '4px 10px', borderRadius: '8px', fontSize: '0.75rem', cursor: 'pointer' }}
                  >
                    تحديد الكل
                  </button>
                  <button
                    type="button"
                    onClick={clearAllDomains}
                    style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171', padding: '4px 10px', borderRadius: '8px', fontSize: '0.75rem', cursor: 'pointer' }}
                  >
                    إلغاء الكل
                  </button>
                </div>
              </div>

              {/* Domain list with criteria checkboxes */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {excellenceData.map(domain => {
                  const isDomainChecked = allowedDomains.includes(domain.id);

                  return (
                    <div key={domain.id} style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '14px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      
                      {/* Domain Header Checkbox */}
                      <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontWeight: 'bold', color: isDomainChecked ? '#fde047' : '#e2e8f0', fontSize: '0.9rem' }}>
                        <input
                          type="checkbox"
                          checked={isDomainChecked}
                          onChange={() => toggleDomain(domain.id)}
                          style={{ width: '18px', height: '18px', accentColor: '#f59e0b', cursor: 'pointer' }}
                        />
                        <Award size={18} color="#f59e0b" />
                        <span>{domain.title}</span>
                      </label>

                      {/* Criteria Child Checkboxes */}
                      <div style={{ paddingRight: '28px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        {domain.criteria.map(crit => {
                          const isCriteriaChecked = allowedCriteria.includes(crit.id) || isDomainChecked;
                          return (
                            <label key={crit.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.8rem', color: isCriteriaChecked ? '#cbd5e1' : '#64748b' }}>
                              <input
                                type="checkbox"
                                checked={isCriteriaChecked}
                                onChange={() => toggleCriteria(crit.id)}
                                disabled={isDomainChecked}
                                style={{ accentColor: '#3b82f6', cursor: 'pointer' }}
                              />
                              <span>{crit.title}</span>
                            </label>
                          );
                        })}
                      </div>

                    </div>
                  );
                })}
              </div>

            </div>

          </div>
        )}

        {/* Modal Footer */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #1e293b', pt: '16px' }}>
          <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>
            * عند عدم تحديد مجالات معينة لمعلم، سيكون مسموحاً له بتحرير جميع المجالات افتراضياً.
          </p>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={onClose}
              style={{ background: 'transparent', border: '1px solid #334155', color: '#94a3b8', padding: '8px 18px', borderRadius: '12px', cursor: 'pointer', fontSize: '0.85rem' }}
            >
              إلغاء
            </button>
            <button
              onClick={handleSavePermissions}
              disabled={isSaving || !selectedTeacher}
              style={{ background: 'linear-gradient(to right, #f59e0b, #d97706)', border: 'none', color: '#0f172a', fontWeight: 'bold', padding: '8px 22px', borderRadius: '12px', cursor: 'pointer', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(245, 158, 11, 0.2)' }}
            >
              <Save size={16} />
              {isSaving ? 'جاري الحفظ...' : 'حفظ الصلاحيات'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
