import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, AlertCircle } from 'lucide-react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../firebase';
import './Login.css';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('student');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      if (role === 'admin') {
        // Admin logs in normally with password
        await signInWithEmailAndPassword(auth, email, password);
        navigate('/admin');
      } else {
        // Teacher or Student logs in without password
        // First check if email exists in users collection for that specific role
        const q = query(collection(db, 'users'), where('email', '==', email), where('role', '==', role));
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
          setError('هذا البريد غير مسجل في النظام كـ ' + (role === 'teacher' ? 'معلم' : 'طالب') + '. تواصل مع الإدارة.');
          setLoading(false);
          return;
        }

        try {
          await signInWithEmailAndPassword(auth, email, 'Auto@Pass1234');
        } catch (authError) {
          // If user not found in Firebase Auth, create it
          if (authError.code === 'auth/user-not-found' || authError.code === 'auth/invalid-credential' || authError.code === 'auth/invalid-login-credentials') {
             await createUserWithEmailAndPassword(auth, email, 'Auto@Pass1234');
          } else {
             throw authError; // Re-throw other errors
          }
        }
        
        if (role === 'teacher') navigate('/teacher');
        if (role === 'student') navigate('/student');
      }
    } catch (err) {
      console.error("Login Error:", err);
      if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential' || err.code === 'auth/invalid-login-credentials') {
         setError('البيانات غير صحيحة');
      } else if (err.code === 'auth/email-already-in-use') {
         // Should not happen since we handle it, but just in case
         setError('حدث خطأ في النظام. يرجى المحاولة لاحقاً.');
      } else {
         setError('حدث خطأ أثناء محاولة تسجيل الدخول');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card glass-panel">
        <div className="login-header">
          <div className="logo-container" style={{ width: '140px', height: '140px', background: 'transparent', boxShadow: 'none' }}>
            <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
              {/* Teal 'A' shape */}
              <path d="M100 20 L40 140 H70 L100 80 L130 140 H160 Z" fill="#63B2C6" />
              {/* Green book/wavy shape across the middle */}
              <path d="M50 110 Q100 80 150 110 L140 130 Q100 100 60 130 Z" fill="#B4D396" />
              <text x="100" y="155" fontFamily="Arial" fontSize="12" fill="#B4D396" textAnchor="middle" fontWeight="bold">1995 - 1416</text>
            </svg>
          </div>
          <h1>المدارس المتقدمة للتعلم الذكي بجدة</h1>
          <p>بوابة الدخول الموحدة</p>
        </div>

        <div className="role-selector">
          <button 
            type="button"
            className={`role-btn ${role === 'student' ? 'active' : ''}`}
            onClick={() => { setRole('student'); setError(''); }}
          >طالب</button>
          <button 
            type="button"
            className={`role-btn ${role === 'teacher' ? 'active' : ''}`}
            onClick={() => { setRole('teacher'); setError(''); }}
          >معلم</button>
          <button 
            type="button"
            className={`role-btn ${role === 'admin' ? 'active' : ''}`}
            onClick={() => { setRole('admin'); setError(''); }}
          >إدارة</button>
        </div>

        {error && (
          <div className="error-message">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form className="login-form" onSubmit={handleLogin}>
          <div className="form-group">
            <label>البريد الإلكتروني</label>
            <input 
              type="email" 
              placeholder="example@school.edu.sa" 
              required 
              dir="ltr"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          
          {role === 'admin' && (
            <div className="form-group">
              <label>كلمة المرور</label>
              <input 
                type="password" 
                placeholder="••••••••" 
                required 
                dir="ltr"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          )}

          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            {loading ? 'جاري التحقق...' : (
              <><LogIn size={18} /> تسجيل الدخول كـ {role === 'admin' ? 'مدير' : role === 'teacher' ? 'معلم' : 'طالب'}</>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
