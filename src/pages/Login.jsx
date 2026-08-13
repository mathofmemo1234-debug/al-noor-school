import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, AlertCircle } from 'lucide-react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
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
      await signInWithEmailAndPassword(auth, email, password);
      // User role should dictate navigation, but for now we'll respect the UI selection
      // Once Firestore is properly populated, this will pull from the user document
      if (role === 'admin') navigate('/admin');
      if (role === 'teacher') navigate('/teacher');
      if (role === 'student') navigate('/student');
    } catch (err) {
      console.error(err);
      setError('البريد الإلكتروني أو كلمة المرور غير صحيحة');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card glass-panel">
        <div className="login-header">
          <div className="logo-container">
            {/* The user can place the actual logo image in public folder and link here */}
            {/* <img src="/logo.png" alt="شعار المدارس" /> */}
            <div style={{ color: 'var(--color-primary)', fontWeight: 'bold', fontSize: '2rem' }}>A</div>
          </div>
          <h1>المدارس المتقدمة للتعلم الذكي</h1>
          <p>بوابة الدخول الموحدة</p>
        </div>

        <div className="role-selector">
          <button 
            type="button"
            className={`role-btn ${role === 'student' ? 'active' : ''}`}
            onClick={() => setRole('student')}
          >طالب</button>
          <button 
            type="button"
            className={`role-btn ${role === 'teacher' ? 'active' : ''}`}
            onClick={() => setRole('teacher')}
          >معلم</button>
          <button 
            type="button"
            className={`role-btn ${role === 'admin' ? 'active' : ''}`}
            onClick={() => setRole('admin')}
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

          <button type="submit" className="btn btn-primary btn-block">
            <LogIn size={18} /> تسجيل الدخول كـ {role === 'admin' ? 'مدير' : role === 'teacher' ? 'معلم' : 'طالب'}
          </button>
        </form>
      </div>
    </div>
  );
}
