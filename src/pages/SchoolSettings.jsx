import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { Save, Upload, Image as ImageIcon, Mail, ShieldCheck, CheckSquare, Square, Users, FileText, Bell, Sparkles, BookOpen, Globe } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import ChangePassword from '../components/ChangePassword';
import { useLanguage } from '../contexts/LanguageContext';
import { detectCurriculumType, CURRICULUM_TYPES } from '../data/curriculumService';

export default function SchoolSettings({ schoolId }) {
  const { t } = useLanguage();
  const { userData, userRole } = useAuth();
  const [logoBase64, setLogoBase64] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingMsgSettings, setIsSavingMsgSettings] = useState(false);
  const [isSavingCurriculum, setIsSavingCurriculum] = useState(false);
  const [isSavingLang, setIsSavingLang] = useState(false);
  const [preview, setPreview] = useState(null);
  const [curriculumType, setCurriculumType] = useState(CURRICULUM_TYPES.SAUDI);
  const [defaultLanguage, setDefaultLanguage] = useState('ar');
  const [schoolName, setSchoolName] = useState('');

  // Messaging Permissions State (All enabled by default for open communication)
  const [msgSettings, setMsgSettings] = useState({
    allowStudentsToMessageAll: true,
    allowStudentsToMessageTeachers: true,
    allowTeachersToBroadcast: true,
    allowStaffToBroadcast: true,
    allowSupervisorsToBroadcast: true,
    allowAttachments: true,
    allowReadReceipts: true,
    allowDirectReplies: true
  });

  const effectiveSchoolId = schoolId || userData?.schoolId || 'main_school';
  const isAdmin = userRole === 'admin' || userData?.role === 'admin' || userRole === 'superadmin';

  useEffect(() => {
    if (!effectiveSchoolId) return;
    const fetchSchool = async () => {
      try {
        const d = await getDoc(doc(db, 'schools', effectiveSchoolId));
        if (d.exists()) {
          const data = d.data();
          if (data.logoUrl) setPreview(data.logoUrl);
          if (data.name) setSchoolName(data.name);
          if (data.messagingSettings) {
            setMsgSettings(prev => ({ ...prev, ...data.messagingSettings }));
          }
          if (data.curriculumType) {
            setCurriculumType(data.curriculumType);
          } else {
            // Auto detect from school name
            const detected = detectCurriculumType(data.name || userData?.schoolName);
            setCurriculumType(detected);
          }

          if (data.defaultLanguage) {
            setDefaultLanguage(data.defaultLanguage);
          } else {
            // Auto-detect: if contains 'عالمي' or 'international' -> 'en'
            const isIntl = (data.name || userData?.schoolName || '').toLowerCase().includes('عالمي') ||
              (data.name || userData?.schoolName || '').toLowerCase().includes('عالمية') ||
              (data.name || userData?.schoolName || '').toLowerCase().includes('international') ||
              (data.name || userData?.schoolName || '').toLowerCase().includes('american');
            setDefaultLanguage(isIntl ? 'en' : 'ar');
          }
        } else {
          const detected = detectCurriculumType(userData?.schoolName || '');
          setCurriculumType(detected);
          const isIntl = (userData?.schoolName || '').toLowerCase().includes('عالمي') ||
            (userData?.schoolName || '').toLowerCase().includes('international');
          setDefaultLanguage(isIntl ? 'en' : 'ar');
        }
      } catch (err) {
        console.error('Error fetching school settings:', err);
      }
    };
    fetchSchool();
  }, [effectiveSchoolId, userData]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (file.size > 1024 * 1024) {
      alert(t('schoolSettings.imageTooLarge'));
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setLogoBase64(reader.result);
      setPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveLogo = async () => {
    if (!effectiveSchoolId) return;
    setIsSaving(true);
    try {
      if (logoBase64) {
        await updateDoc(doc(db, 'schools', effectiveSchoolId), {
          logoUrl: logoBase64
        });
        alert(t('schoolSettings.settingsSaved'));
      }
    } catch (error) {
      console.error(error);
      alert(t('schoolSettings.saveError'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveCurriculum = async () => {
    if (!effectiveSchoolId) return;
    setIsSavingCurriculum(true);
    try {
      await setDoc(doc(db, 'schools', effectiveSchoolId), {
        curriculumType: curriculumType
      }, { merge: true });
      alert('✓ تم حفظ واعتماد نوع المنهج الدراسي للمجمع التعليمي بنجاح.');
    } catch (error) {
      console.error('Error saving curriculum settings:', error);
      alert('حدث خطأ أثناء حفظ نوع المنهج، يرجى المحاولة مرة أخرى.');
    } finally {
      setIsSavingCurriculum(false);
    }
  };

  const handleSaveLanguage = async () => {
    if (!effectiveSchoolId) return;
    setIsSavingLang(true);
    try {
      await setDoc(doc(db, 'schools', effectiveSchoolId), {
        defaultLanguage: defaultLanguage
      }, { merge: true });
      alert('✓ تم حفظ واعتماد لغة واجهة النظام الافتراضية للمجمع بنجاح.');
    } catch (error) {
      console.error('Error saving language settings:', error);
      alert('حدث خطأ أثناء حفظ إعدادات اللغة، يرجى المحاولة مرة أخرى.');
    } finally {
      setIsSavingLang(false);
    }
  };

  const handleSaveMessagingSettings = async () => {
    if (!effectiveSchoolId) return;
    setIsSavingMsgSettings(true);
    try {
      await setDoc(doc(db, 'schools', effectiveSchoolId), {
        messagingSettings: msgSettings
      }, { merge: true });
      alert('✓ تم حفظ واعتماد صلاحيات نظام المراسلات والتعاميم بنجاح.');
    } catch (error) {
      console.error('Error saving messaging settings:', error);
      alert('حدث خطأ أثناء حفظ الإعدادات، يرجى المحاولة مرة أخرى.');
    } finally {
      setIsSavingMsgSettings(false);
    }
  };

  const toggleMsgSetting = (key) => {
    setMsgSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const isAutoDetectedInternational = (schoolName || userData?.schoolName || '').toLowerCase().includes('عالمي') ||
    (schoolName || userData?.schoolName || '').toLowerCase().includes('عالمية') ||
    (schoolName || userData?.schoolName || '').toLowerCase().includes('international') ||
    (schoolName || userData?.schoolName || '').toLowerCase().includes('american');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '750px', margin: '0 auto' }}>
      
      {/* 1. School Logo Settings */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <h2 style={{ color: 'var(--color-primary-dark)', marginBottom: '20px', fontSize: '20px' }}>
          {t('schoolSettings.title')}
        </h2>
        
        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ fontSize: '1.05em', marginBottom: '14px', color: '#0f172a' }}>{t('schoolSettings.logoTitle')}</h3>
          
          <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
            <div style={{ 
              width: '140px', height: '140px', 
              borderRadius: '12px', border: '2px dashed var(--color-border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(255,255,255,0.7)', overflow: 'hidden'
            }}>
              {preview ? (
                <img src={preview} alt="Preview" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
              ) : (
                <ImageIcon size={44} color="var(--color-text-muted)" />
              )}
            </div>
            
            <div style={{ flex: 1, minWidth: '240px' }}>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.88em', marginBottom: '12px', lineHeight: '1.6' }}>
                {t('schoolSettings.logoDescription1')}
                <br/>
                {t('schoolSettings.logoDescription2')}
              </p>
              <label className="btn" style={{ background: 'var(--color-secondary)', display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px' }}>
                <Upload size={16} />
                {t('schoolSettings.chooseImage')}
                <input type="file" accept="image/png, image/jpeg, image/webp" style={{ display: 'none' }} onChange={handleImageChange} />
              </label>
            </div>
          </div>
        </div>

        <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn btn-primary" onClick={handleSaveLogo} disabled={isSaving || !logoBase64} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
            <Save size={16} />
            {isSaving ? t('schoolSettings.saving') : t('schoolSettings.saveChanges')}
          </button>
        </div>
      </div>

      {/* 2. School Curriculum System Settings (Admin / Principal Level) */}
      {isAdmin && (
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #0e7490, #63B2C6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white'
              }}>
                <BookOpen size={22} />
              </div>
              <div>
                <h3 style={{ margin: '0 0 2px 0', color: 'var(--color-primary-dark)', fontSize: '18px' }}>
                  نظام ونوع المنهج الدراسي للمجمع (School Curriculum)
                </h3>
                <p style={{ margin: 0, fontSize: '12px', color: 'var(--color-text-muted)' }}>
                  تحديد المنهج المعتمد لتحضير الدروس، المقررات، والخطط الأسبوعية
                </p>
              </div>
            </div>

            {isAutoDetectedInternational && (
              <span style={{
                fontSize: '11px',
                fontWeight: 'bold',
                color: '#0e7490',
                background: 'rgba(14, 116, 144, 0.12)',
                padding: '4px 10px',
                borderRadius: '8px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                <Globe size={13} /> مجمع عالمي (منهج أمريكي معتمد)
              </span>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginBottom: '20px' }}>
            
            {/* Option 1: Saudi National / Ahli */}
            <div 
              onClick={() => setCurriculumType(CURRICULUM_TYPES.SAUDI)}
              style={{
                border: curriculumType === CURRICULUM_TYPES.SAUDI ? '2px solid #0e7490' : '1px solid #e2e8f0',
                background: curriculumType === CURRICULUM_TYPES.SAUDI ? '#f0fdfa' : 'white',
                borderRadius: '12px',
                padding: '16px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 'bold', color: '#0f172a', fontSize: '14px' }}>🇸🇦 المنهج الوطني والأهلي</span>
                {curriculumType === CURRICULUM_TYPES.SAUDI ? <CheckSquare size={18} color="#0e7490" /> : <Square size={18} color="#94a3b8" />}
              </div>
              <p style={{ margin: 0, fontSize: '12px', color: '#64748b', lineHeight: '1.5' }}>
                مناهج وزارة التعليم بالمملكة العربية السعودية المطورة (الابتدائي، المتوسط، مسارات الثانوي)
              </p>
            </div>

            {/* Option 2: American International */}
            <div 
              onClick={() => setCurriculumType(CURRICULUM_TYPES.AMERICAN)}
              style={{
                border: curriculumType === CURRICULUM_TYPES.AMERICAN ? '2px solid #0e7490' : '1px solid #e2e8f0',
                background: curriculumType === CURRICULUM_TYPES.AMERICAN ? '#f0fdfa' : 'white',
                borderRadius: '12px',
                padding: '16px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 'bold', color: '#0f172a', fontSize: '14px' }}>🇺🇸 المنهج الأمريكي (العالمي)</span>
                {curriculumType === CURRICULUM_TYPES.AMERICAN ? <CheckSquare size={18} color="#0e7490" /> : <Square size={18} color="#94a3b8" />}
              </div>
              <p style={{ margin: 0, fontSize: '12px', color: '#64748b', lineHeight: '1.5' }}>
                معايير المدارس العالمية (American Curriculum - CCSS & NGSS) لجميع المواد بالإنجليزية والعربية
              </p>
            </div>

            {/* Option 3: Dual Track */}
            <div 
              onClick={() => setCurriculumType(CURRICULUM_TYPES.DUAL)}
              style={{
                border: curriculumType === CURRICULUM_TYPES.DUAL ? '2px solid #0e7490' : '1px solid #e2e8f0',
                background: curriculumType === CURRICULUM_TYPES.DUAL ? '#f0fdfa' : 'white',
                borderRadius: '12px',
                padding: '16px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 'bold', color: '#0f172a', fontSize: '14px' }}>🌐 مسار ثنائي (وطني وعالمي)</span>
                {curriculumType === CURRICULUM_TYPES.DUAL ? <CheckSquare size={18} color="#0e7490" /> : <Square size={18} color="#94a3b8" />}
              </div>
              <p style={{ margin: 0, fontSize: '12px', color: '#64748b', lineHeight: '1.5' }}>
                إتاحة كلا المنهجين للمعلمين لاختيار المناسب حسب القسم والمسار المسند إليهم
              </p>
            </div>

          </div>

          <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
            <button 
              className="btn btn-primary" 
              onClick={handleSaveCurriculum} 
              disabled={isSavingCurriculum} 
              style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'linear-gradient(135deg, #0e7490, #63B2C6)', fontSize: '13px', fontWeight: 'bold' }}
            >
              <Save size={16} />
              {isSavingCurriculum ? 'جاري الحفظ...' : 'حفظ واعتماد نوع المنهج'}
            </button>
          </div>
        </div>
      )}

      {/* 3. School Default Language Settings (Admin / Director Level) */}
      {isAdmin && (
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #0e7490, #63B2C6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white'
              }}>
                <Globe size={22} />
              </div>
              <div>
                <h3 style={{ margin: '0 0 2px 0', color: 'var(--color-primary-dark)', fontSize: '18px' }}>
                  لغة واجهة النظام الافتراضية للمجمع (Default Complex Language)
                </h3>
                <p style={{ margin: 0, fontSize: '12px', color: 'var(--color-text-muted)' }}>
                  تحديد اللغة الرسمية الأساسية لواجهات النظام لكافة المعلمين والطلاب ومنسوبي المدرسة
                </p>
              </div>
            </div>

            {isAutoDetectedInternational && (
              <span style={{
                fontSize: '11px',
                fontWeight: 'bold',
                color: '#0e7490',
                background: 'rgba(14, 116, 144, 0.12)',
                padding: '4px 10px',
                borderRadius: '8px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                ✨ مجمع عالمي ➔ الإنجليزية افتراضياً
              </span>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginBottom: '20px' }}>
            
            {/* Arabic Language */}
            <div 
              onClick={() => setDefaultLanguage('ar')}
              style={{
                border: defaultLanguage === 'ar' ? '2px solid #0e7490' : '1px solid #e2e8f0',
                background: defaultLanguage === 'ar' ? '#f0fdfa' : 'white',
                borderRadius: '12px',
                padding: '16px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 'bold', color: '#0f172a', fontSize: '14px' }}>🇸🇦 اللغة العربية (Arabic - RTL)</span>
                {defaultLanguage === 'ar' ? <CheckSquare size={18} color="#0e7490" /> : <Square size={18} color="#94a3b8" />}
              </div>
              <p style={{ margin: 0, fontSize: '12px', color: '#64748b', lineHeight: '1.5' }}>
                واجهة عربية متكاملة من اليمين لليسار، مثالية للمدارس الأهلية والوطنية
              </p>
            </div>

            {/* English Language */}
            <div 
              onClick={() => setDefaultLanguage('en')}
              style={{
                border: defaultLanguage === 'en' ? '2px solid #0e7490' : '1px solid #e2e8f0',
                background: defaultLanguage === 'en' ? '#f0fdfa' : 'white',
                borderRadius: '12px',
                padding: '16px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 'bold', color: '#0f172a', fontSize: '14px' }}>🇺🇸 English (الإنجليزية - LTR)</span>
                {defaultLanguage === 'en' ? <CheckSquare size={18} color="#0e7490" /> : <Square size={18} color="#94a3b8" />}
              </div>
              <p style={{ margin: 0, fontSize: '12px', color: '#64748b', lineHeight: '1.5' }}>
                Full English interface (Left-to-Right), optimal for International & American Curriculum Schools
              </p>
            </div>

          </div>

          <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
            <button 
              className="btn btn-primary" 
              onClick={handleSaveLanguage} 
              disabled={isSavingLang} 
              style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'linear-gradient(135deg, #0e7490, #63B2C6)', fontSize: '13px', fontWeight: 'bold' }}
            >
              <Save size={16} />
              {isSavingLang ? 'جاري الحفظ...' : 'حفظ واعتماد لغة المجمع'}
            </button>
          </div>
        </div>
      )}

      {/* 4. Messaging & Communication Policies (Admin / Director Level) */}
      {isAdmin && (
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #0e7490, #63B2C6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white'
              }}>
                <Mail size={22} />
              </div>
              <div>
                <h3 style={{ margin: '0 0 2px 0', color: 'var(--color-primary-dark)', fontSize: '18px' }}>
                  صلاحيات وإعدادات نظام المراسلات والتعاميم
                </h3>
                <p style={{ margin: 0, fontSize: '12px', color: 'var(--color-text-muted)' }}>
                  إدارة سياسات التواصل المدرسي وحرية المراسلة بين الطلاب والمعلمين والإدارة
                </p>
              </div>
            </div>

            <span style={{
              fontSize: '11px',
              fontWeight: 'bold',
              color: '#0e7490',
              background: 'rgba(14, 116, 144, 0.1)',
              padding: '4px 10px',
              borderRadius: '8px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <ShieldCheck size={14} /> صلاحيات المدير
            </span>
          </div>

          <p style={{ fontSize: '13px', color: '#475569', marginBottom: '16px', background: '#f8fafc', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', lineHeight: '1.6' }}>
            💡 <strong>توجيه الإدارة:</strong> النظام مفعل افتراضياً لإتاحة المراسلة لجميع المعلمين والطلاب لمراسلة أي منسوب دون قيود. يمكنك التحكم في الخيارات أدناه بحسب سياسة المدرسة:
          </p>

          {/* Permissions Toggle List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
            
            {/* Student messaging */}
            <div 
              onClick={() => toggleMsgSetting('allowStudentsToMessageAll')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 14px',
                borderRadius: '8px',
                border: msgSettings.allowStudentsToMessageAll ? '1px solid #bbf7d0' : '1px solid #e2e8f0',
                background: msgSettings.allowStudentsToMessageAll ? '#f0fdf4' : 'white',
                cursor: 'pointer',
                transition: 'all 0.15s'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {msgSettings.allowStudentsToMessageAll ? <CheckSquare size={18} color="#16a34a" /> : <Square size={18} color="#94a3b8" />}
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#0f172a' }}>
                    السماح للطلاب بمراسلة أي منسوب (معلمين، كادر إداري، ومشرفين)
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>
                    تمكين الطالب من التواصل المباشر مع معلميه وإدارة المدرسة لطلب المساعدة والاستفسارات
                  </div>
                </div>
              </div>
              <span style={{ fontSize: '11px', fontWeight: 'bold', color: msgSettings.allowStudentsToMessageAll ? '#16a34a' : '#94a3b8' }}>
                {msgSettings.allowStudentsToMessageAll ? 'مفعل ✓' : 'معطل'}
              </span>
            </div>

            {/* Teacher broadcast */}
            <div 
              onClick={() => toggleMsgSetting('allowTeachersToBroadcast')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 14px',
                borderRadius: '8px',
                border: msgSettings.allowTeachersToBroadcast ? '1px solid #bbf7d0' : '1px solid #e2e8f0',
                background: msgSettings.allowTeachersToBroadcast ? '#f0fdf4' : 'white',
                cursor: 'pointer',
                transition: 'all 0.15s'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {msgSettings.allowTeachersToBroadcast ? <CheckSquare size={18} color="#16a34a" /> : <Square size={18} color="#94a3b8" />}
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#0f172a' }}>
                    السماح للمعلمين بإرسال التعاميم والتوجيهات الجماعية للفصول
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>
                    إتاحة إرسال الواجبات والتنبيهات الموحدة لجميع طلاب فصل معين بنقرة واحدة
                  </div>
                </div>
              </div>
              <span style={{ fontSize: '11px', fontWeight: 'bold', color: msgSettings.allowTeachersToBroadcast ? '#16a34a' : '#94a3b8' }}>
                {msgSettings.allowTeachersToBroadcast ? 'مفعل ✓' : 'معطل'}
              </span>
            </div>

            {/* Staff & Supervisors broadcast */}
            <div 
              onClick={() => toggleMsgSetting('allowStaffToBroadcast')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 14px',
                borderRadius: '8px',
                border: msgSettings.allowStaffToBroadcast ? '1px solid #bbf7d0' : '1px solid #e2e8f0',
                background: msgSettings.allowStaffToBroadcast ? '#f0fdf4' : 'white',
                cursor: 'pointer',
                transition: 'all 0.15s'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {msgSettings.allowStaffToBroadcast ? <CheckSquare size={18} color="#16a34a" /> : <Square size={18} color="#94a3b8" />}
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#0f172a' }}>
                    السماح للكادر الإداري والمشرفين بإصدار التعاميم المدرسية
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>
                    إتاحة إرسال التعاميم الرسمية لكافة المعلمين أو المدرسة من قِبل الوكلاء والمشرفين
                  </div>
                </div>
              </div>
              <span style={{ fontSize: '11px', fontWeight: 'bold', color: msgSettings.allowStaffToBroadcast ? '#16a34a' : '#94a3b8' }}>
                {msgSettings.allowStaffToBroadcast ? 'مفعل ✓' : 'معطل'}
              </span>
            </div>

            {/* Attachments */}
            <div 
              onClick={() => toggleMsgSetting('allowAttachments')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 14px',
                borderRadius: '8px',
                border: msgSettings.allowAttachments ? '1px solid #bbf7d0' : '1px solid #e2e8f0',
                background: msgSettings.allowAttachments ? '#f0fdf4' : 'white',
                cursor: 'pointer',
                transition: 'all 0.15s'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {msgSettings.allowAttachments ? <CheckSquare size={18} color="#16a34a" /> : <Square size={18} color="#94a3b8" />}
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#0f172a' }}>
                    إتاحة إرفاق الصور والمستندات (PDF) في المراسلات
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>
                    تمكين الجميع من إرفاق الشروحات والصور وخطابات الـ PDF مع المعاينة والتحميل
                  </div>
                </div>
              </div>
              <span style={{ fontSize: '11px', fontWeight: 'bold', color: msgSettings.allowAttachments ? '#16a34a' : '#94a3b8' }}>
                {msgSettings.allowAttachments ? 'مفعل ✓' : 'معطل'}
              </span>
            </div>

            {/* Read Receipts Audit */}
            <div 
              onClick={() => toggleMsgSetting('allowReadReceipts')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 14px',
                borderRadius: '8px',
                border: msgSettings.allowReadReceipts ? '1px solid #bbf7d0' : '1px solid #e2e8f0',
                background: msgSettings.allowReadReceipts ? '#f0fdf4' : 'white',
                cursor: 'pointer',
                transition: 'all 0.15s'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {msgSettings.allowReadReceipts ? <CheckSquare size={18} color="#16a34a" /> : <Square size={18} color="#94a3b8" />}
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#0f172a' }}>
                    تفعيل كشف وتتبع قراءة الرسائل والتعاميم (Read Receipts)
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>
                    إظهار وقت وتاريخ فتح الرسالة وكشف بأسماء من قرأ ومن لم يقرأ التعميم
                  </div>
                </div>
              </div>
              <span style={{ fontSize: '11px', fontWeight: 'bold', color: msgSettings.allowReadReceipts ? '#16a34a' : '#94a3b8' }}>
                {msgSettings.allowReadReceipts ? 'مفعل ✓' : 'معطل'}
              </span>
            </div>

          </div>

          <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
            <button 
              className="btn btn-primary" 
              onClick={handleSaveMessagingSettings} 
              disabled={isSavingMsgSettings} 
              style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'linear-gradient(135deg, #0e7490, #63B2C6)', fontSize: '13px', fontWeight: 'bold' }}
            >
              <Save size={16} />
              {isSavingMsgSettings ? 'جاري الحفظ...' : 'حفظ واعتماد صلاحيات المراسلات'}
            </button>
          </div>
        </div>
      )}
      
      {/* 3. Change Password Panel */}
      <ChangePassword />
    </div>
  );
}
