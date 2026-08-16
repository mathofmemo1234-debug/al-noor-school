import React, { useState } from 'react';
import { auth } from '../firebase';
import { updatePassword } from 'firebase/auth';
import { Key, Save } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

export default function ChangePassword() {
  const { t } = useLanguage();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    if (newPassword !== confirmPassword) {
      setError(t('changePassword.passwordMismatch'));
      return;
    }

    if (newPassword.length < 6) {
      setError(t('changePassword.passwordLengthError'));
      return;
    }

    if (!auth.currentUser) {
      setError(t('changePassword.mustLogin'));
      return;
    }

    setIsSaving(true);
    try {
      await updatePassword(auth.currentUser, newPassword);
      setMessage(t('changePassword.success'));
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      console.error(err);
      if (err.code === 'auth/requires-recent-login') {
        setError(t('changePassword.reloginRequired'));
      } else {
        setError(t('changePassword.error'));
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="glass-panel" style={{ padding: '24px', maxWidth: '600px', margin: '0 auto', marginTop: '24px' }}>
      <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
        <Key size={20} color="var(--color-primary-dark)" />
        {t('changePassword.title')}
      </h3>

      {message && <div style={{ background: '#dcfce7', color: '#166534', padding: '10px', borderRadius: '8px', marginBottom: '15px' }}>{message}</div>}
      {error && <div style={{ background: '#fee2e2', color: '#991b1b', padding: '10px', borderRadius: '8px', marginBottom: '15px' }}>{error}</div>}

      <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '5px' }}>{t('changePassword.newPassword')}</label>
          <input 
            type="password" 
            className="input-field" 
            value={newPassword} 
            onChange={e => setNewPassword(e.target.value)} 
            required 
            dir="ltr"
          />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '5px' }}>{t('changePassword.confirmPassword')}</label>
          <input 
            type="password" 
            className="input-field" 
            value={confirmPassword} 
            onChange={e => setConfirmPassword(e.target.value)} 
            required 
            dir="ltr"
          />
        </div>
        <button type="submit" className="btn btn-primary" disabled={isSaving} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '10px' }}>
          <Save size={18} />
          {isSaving ? t('changePassword.saving') : t('changePassword.saveBtn')}
        </button>
      </form>
    </div>
  );
}
