import React, { useState } from 'react';
import { updatePassword } from 'firebase/auth';
import { auth } from '../firebase';
import { Key } from 'lucide-react';

export default function Settings() {
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    
    if (newPassword.length < 6) {
      setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل.');
      return;
    }

    setLoading(true);
    try {
      if (auth.currentUser) {
        await updatePassword(auth.currentUser, newPassword);
        setMessage('تم تغيير كلمة المرور بنجاح.');
        setNewPassword('');
      } else {
        setError('لا يوجد مستخدم مسجل الدخول.');
      }
    } catch (err) {
      console.error(err);
      if (err.code === 'auth/requires-recent-login') {
        setError('يرجى تسجيل الخروج والدخول مجدداً لتتمكن من تغيير كلمة المرور.');
      } else {
        setError('حدث خطأ أثناء تحديث كلمة المرور.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-panel" style={{ padding: '24px', maxWidth: '500px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
        <Key size={24} color="var(--color-primary)" />
        <h2 style={{ margin: 0 }}>تغيير كلمة المرور</h2>
      </div>
      
      <p style={{ color: 'var(--color-text-muted)', marginBottom: '20px' }}>
        يمكنك هنا تغيير كلمة المرور الخاصة بحسابك (الافتراضية هي رقم هويتك).
      </p>

      {message && <div style={{ background: '#d4edda', color: '#155724', padding: '10px', borderRadius: '5px', marginBottom: '15px' }}>{message}</div>}
      {error && <div style={{ background: '#f8d7da', color: '#721c24', padding: '10px', borderRadius: '5px', marginBottom: '15px' }}>{error}</div>}

      <form onSubmit={handleUpdatePassword} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '5px' }}>كلمة المرور الجديدة</label>
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
          {loading ? 'جاري التحديث...' : 'حفظ التغييرات'}
        </button>
      </form>
    </div>
  );
}
