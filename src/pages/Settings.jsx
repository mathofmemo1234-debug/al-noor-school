import React, { useState, useEffect } from 'react';
import { updatePassword } from 'firebase/auth';
import { auth, db } from '../firebase';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { Key, Phone } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';

export default function Settings() {
  const { userData } = useAuth();
  const { t } = useLanguage();
  
  // Password State
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // WhatsApp State
  const [whatsapp, setWhatsapp] = useState('');
  const [teacherDocId, setTeacherDocId] = useState(null);
  const [waMessage, setWaMessage] = useState('');
  const [waError, setWaError] = useState('');
  const [waLoading, setWaLoading] = useState(false);

  // Fetch teacher document if the user is a teacher
  useEffect(() => {
    if (userData?.role === 'teacher' && userData?.nationalId) {
      const q = query(collection(db, 'teachers'), where('nationalId', '==', userData.nationalId));
      const unsub = onSnapshot(q, snap => {
        if (!snap.empty) {
          setTeacherDocId(snap.docs[0].id);
          setWhatsapp(snap.docs[0].data().whatsapp || '');
        }
      });
      return () => unsub();
    }
  }, [userData]);

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    
    if (newPassword.length < 6) {
      setError(t('settings.passwordLengthError'));
      return;
    }

    setLoading(true);
    try {
      if (auth.currentUser) {
        await updatePassword(auth.currentUser, newPassword);
        setMessage(t('settings.passwordUpdated'));
        setNewPassword('');
      } else {
        setError(t('settings.noUser'));
      }
    } catch (err) {
      console.error(err);
      if (err.code === 'auth/requires-recent-login') {
        setError(t('settings.reloginRequired'));
      } else {
        setError(t('settings.updateError'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateWhatsapp = async (e) => {
    e.preventDefault();
    setWaMessage('');
    setWaError('');

    if (!teacherDocId) {
      setWaError(t('settings.teacherNotFound'));
      return;
    }

    setWaLoading(true);
    try {
      await updateDoc(doc(db, 'teachers', teacherDocId), { whatsapp });
      setWaMessage(t('settings.whatsappUpdated'));
    } catch (err) {
      console.error(err);
      setWaError(t('settings.whatsappUpdateError'));
    } finally {
      setWaLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '500px', margin: '0 auto' }}>
      
      {/* Password Update Panel */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
          <Key size={24} color="var(--color-primary)" />
          <h2 style={{ margin: 0 }}>{t('settings.changePasswordTitle')}</h2>
        </div>
        
        <p style={{ color: 'var(--color-text-muted)', marginBottom: '20px' }}>
          {t('settings.passwordAdvice')}
        </p>

        {message && <div style={{ background: '#dcfce7', color: '#166534', padding: '10px', borderRadius: '8px', marginBottom: '15px' }}>{message}</div>}
        {error && <div style={{ background: '#fee2e2', color: '#991b1b', padding: '10px', borderRadius: '8px', marginBottom: '15px' }}>{error}</div>}

        <form onSubmit={handleUpdatePassword} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px' }}>{t('settings.newPassword')}</label>
            <input 
              type="password" 
              className="input-field" 
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
              required
              dir="ltr"
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? t('settings.updating') : t('settings.updatePasswordBtn')}
          </button>
        </form>
      </div>

      {/* WhatsApp Update Panel (Only for Teachers) */}
      {userData?.role === 'teacher' && (
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <Phone size={24} color="#25D366" />
            <h2 style={{ margin: 0 }}>{t('settings.updateWhatsappTitle')}</h2>
          </div>
          
          <p style={{ color: 'var(--color-text-muted)', marginBottom: '20px' }}>
            {t('settings.whatsappAdvice')}
          </p>

          {waMessage && <div style={{ background: '#dcfce7', color: '#166534', padding: '10px', borderRadius: '8px', marginBottom: '15px' }}>{waMessage}</div>}
          {waError && <div style={{ background: '#fee2e2', color: '#991b1b', padding: '10px', borderRadius: '8px', marginBottom: '15px' }}>{waError}</div>}

          <form onSubmit={handleUpdateWhatsapp} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px' }}>{t('settings.whatsappNumber')}</label>
              <input 
                type="text" 
                className="input-field" 
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="9665xxxxxxxx"
                dir="ltr"
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={waLoading} style={{ background: '#25D366', borderColor: '#25D366' }}>
              {waLoading ? t('settings.updating') : t('settings.saveNumberBtn')}
            </button>
          </form>
        </div>
      )}

    </div>
  );
}
