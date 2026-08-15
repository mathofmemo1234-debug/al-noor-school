import React, { useState, useEffect } from 'react';
import { updatePassword } from 'firebase/auth';
import { auth, db } from '../firebase';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { Key, Phone } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function Settings() {
  const { userData } = useAuth();
  
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
      setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل.');
      return;
    }

    setLoading(true);
    try {
      if (auth.currentUser) {
        await updatePassword(auth.currentUser, newPassword);
        setMessage('تم تحديث كلمة المرور بنجاح.');
        setNewPassword('');
      } else {
        setError('لا يوجد مستخدم مسجل الدخول.');
      }
    } catch (err) {
      console.error(err);
      if (err.code === 'auth/requires-recent-login') {
        setError('يرجى تسجيل الخروج وتسجيل الدخول مرة أخرى لإتمام هذا الإجراء.');
      } else {
        setError('حدث خطأ أثناء التحديث.');
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
      setWaError('تعذر العثور على بيانات المعلم.');
      return;
    }

    setWaLoading(true);
    try {
      await updateDoc(doc(db, 'teachers', teacherDocId), { whatsapp });
      setWaMessage('تم تحديث رقم الواتساب بنجاح.');
    } catch (err) {
      console.error(err);
      setWaError('حدث خطأ أثناء تحديث رقم الواتساب.');
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
          <h2 style={{ margin: 0 }}>تغيير كلمة المرور</h2>
        </div>
        
        <p style={{ color: 'var(--color-text-muted)', marginBottom: '20px' }}>
          ينصح بتغيير كلمة المرور بشكل دوري للحفاظ على أمان حسابك (للمعلمين والطلاب).
        </p>

        {message && <div style={{ background: '#dcfce7', color: '#166534', padding: '10px', borderRadius: '8px', marginBottom: '15px' }}>{message}</div>}
        {error && <div style={{ background: '#fee2e2', color: '#991b1b', padding: '10px', borderRadius: '8px', marginBottom: '15px' }}>{error}</div>}

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
            {loading ? 'جاري التحديث...' : 'تحديث كلمة المرور'}
          </button>
        </form>
      </div>

      {/* WhatsApp Update Panel (Only for Teachers) */}
      {userData?.role === 'teacher' && (
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <Phone size={24} color="#25D366" />
            <h2 style={{ margin: 0 }}>تحديث رقم الواتساب</h2>
          </div>
          
          <p style={{ color: 'var(--color-text-muted)', marginBottom: '20px' }}>
            أدخل رقم الواتساب الخاص بك ليتمكن الطلاب من التواصل معك. يفضل إدخال الرقم مع رمز الدولة (مثال: 966500000000).
          </p>

          {waMessage && <div style={{ background: '#dcfce7', color: '#166534', padding: '10px', borderRadius: '8px', marginBottom: '15px' }}>{waMessage}</div>}
          {waError && <div style={{ background: '#fee2e2', color: '#991b1b', padding: '10px', borderRadius: '8px', marginBottom: '15px' }}>{waError}</div>}

          <form onSubmit={handleUpdateWhatsapp} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px' }}>رقم الواتساب</label>
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
              {waLoading ? 'جاري التحديث...' : 'حفظ الرقم'}
            </button>
          </form>
        </div>
      )}

    </div>
  );
}
