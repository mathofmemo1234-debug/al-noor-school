import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { Save, Upload, Image as ImageIcon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import ChangePassword from '../components/ChangePassword';
import { useLanguage } from '../contexts/LanguageContext';

export default function SchoolSettings({ schoolId }) {
  const { t } = useLanguage();
  const { userData } = useAuth();
  const [logoBase64, setLogoBase64] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    if (!schoolId) return;
    const fetchSchool = async () => {
      const d = await getDoc(doc(db, 'schools', schoolId));
      if (d.exists() && d.data().logoUrl) {
        setPreview(d.data().logoUrl);
      }
    };
    fetchSchool();
  }, [schoolId]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (file.size > 1024 * 1024) { // 1MB limit
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

  const handleSave = async () => {
    if (!schoolId) return;
    setIsSaving(true);
    try {
      if (logoBase64) {
        await updateDoc(doc(db, 'schools', schoolId), {
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

  return (
    <div className="glass-panel" style={{ padding: '24px', maxWidth: '600px', margin: '0 auto' }}>
      <h2 style={{ color: 'var(--color-primary-dark)', marginBottom: '24px' }}>{t('schoolSettings.title')}</h2>
      
      <div style={{ marginBottom: '24px' }}>
        <h3 style={{ fontSize: '1.1em', marginBottom: '16px' }}>{t('schoolSettings.logoTitle')}</h3>
        
        <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
          <div style={{ 
            width: '150px', height: '150px', 
            borderRadius: '12px', border: '2px dashed var(--color-border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(255,255,255,0.5)', overflow: 'hidden'
          }}>
            {preview ? (
              <img src={preview} alt="Preview" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
            ) : (
              <ImageIcon size={48} color="var(--color-text-muted)" />
            )}
          </div>
          
          <div style={{ flex: 1 }}>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9em', marginBottom: '12px', lineHeight: '1.6' }}>
              {t('schoolSettings.logoDescription1')}
              <br/>
              {t('schoolSettings.logoDescription2')}
            </p>
            <label className="btn" style={{ background: 'var(--color-secondary)', display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <Upload size={18} />
              {t('schoolSettings.chooseImage')}
              <input type="file" accept="image/png, image/jpeg" style={{ display: 'none' }} onChange={handleImageChange} />
            </label>
          </div>
        </div>
      </div>

      <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
        <button className="btn btn-primary" onClick={handleSave} disabled={isSaving || !logoBase64} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Save size={18} />
          {isSaving ? t('schoolSettings.saving') : t('schoolSettings.saveChanges')}
        </button>
      </div>
      
      <ChangePassword />
    </div>
  );
}
