import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { collection, addDoc, onSnapshot, doc, setDoc, query, where, getDocs, deleteDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { Building2, UserPlus, Save, Trash2, CheckSquare } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';
import ChangePassword from '../components/ChangePassword';

export default function SuperAdminDashboard() {
  const { userData } = useAuth();
  
  const [schools, setSchools] = useState([]);
  const [admins, setAdmins] = useState([]);
  
  // New School State
  const [schoolName, setSchoolName] = useState('');
  const [isAddingSchool, setIsAddingSchool] = useState(false);

  // New Admin State
  const [adminName, setAdminName] = useState('');
  const [adminNationalId, setAdminNationalId] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [selectedSchool, setSelectedSchool] = useState('');
  const [isAddingAdmin, setIsAddingAdmin] = useState(false);
  const [adminMessage, setAdminMessage] = useState('');
  const [adminError, setAdminError] = useState('');

  useEffect(() => {
    // Fetch schools
    const unsubSchools = onSnapshot(collection(db, 'schools'), snap => {
      const s = [];
      snap.forEach(d => s.push({ id: d.id, ...d.data() }));
      setSchools(s);
    });

    // Fetch admins
    const q = query(collection(db, 'users'), where('role', '==', 'admin'));
    const unsubAdmins = onSnapshot(q, snap => {
      const a = [];
      snap.forEach(d => a.push({ id: d.id, ...d.data() }));
      setAdmins(a);
    });

    return () => {
      unsubSchools();
      unsubAdmins();
    };
  }, []);

  const handleAddSchool = async (e) => {
    e.preventDefault();
    if (!schoolName) return;
    setIsAddingSchool(true);
    try {
      await addDoc(collection(db, 'schools'), {
        name: schoolName,
        createdAt: new Date()
      });
      setSchoolName('');
      alert('تمت إضافة المجمع بنجاح');
    } catch (error) {
      console.error(error);
      alert('حدث خطأ أثناء إضافة المجمع');
    } finally {
      setIsAddingSchool(false);
    }
  };

  const handleAddAdmin = async (e) => {
    e.preventDefault();
    setAdminMessage('');
    setAdminError('');

    if (adminNationalId.length < 10) {
      setAdminError('رقم الهوية يجب أن يكون 10 أرقام على الأقل');
      return;
    }
    if (adminPassword.length < 6) {
      setAdminError('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      return;
    }

    setIsAddingAdmin(true);
    try {
      // Create user in Auth using nationalId as email if no email is needed
      const adminEmail = adminNationalId.includes('@') ? adminNationalId : `${adminNationalId}@school.local`;
      
      const userCredential = await createUserWithEmailAndPassword(auth, adminEmail, adminPassword);
      const user = userCredential.user;

      // Save admin in users collection
      await setDoc(doc(db, 'users', user.uid), {
        name: adminName,
        nationalId: adminNationalId,
        email: adminEmail,
        role: 'admin',
        schoolId: selectedSchool,
        createdAt: new Date()
      });

      setAdminMessage('تم إنشاء حساب المدير بنجاح');
      setAdminName('');
      setAdminNationalId('');
      setAdminPassword('');
      setSelectedSchool('');
    } catch (error) {
      console.error(error);
      if (error.code === 'auth/email-already-in-use') {
        setAdminError('رقم الهوية مستخدم مسبقاً');
      } else {
        setAdminError('حدث خطأ أثناء إنشاء المدير: ' + error.message);
      }
    } finally {
      setIsAddingAdmin(false);
    }
  };

  const handleDeleteAdmin = async (id) => {
    if (window.confirm('هل أنت متأكد من حذف حساب هذا المدير؟')) {
      try {
        await deleteDoc(doc(db, 'users', id));
        alert('تم الحذف من قاعدة البيانات بنجاح (سيظل حسابه معلقاً في قائمة المصادقة Firebase Auth).');
      } catch (error) {
        alert('حدث خطأ أثناء الحذف');
      }
    }
  };

  return (
    <Layout role="superadmin" title="لوحة تحكم النظام (المدير العام)">
      <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Building2 size={32} color="var(--color-primary-dark)" />
          <h1 style={{ margin: 0, color: 'var(--color-primary-dark)' }}>إدارة النظام الشاملة</h1>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          
          {/* المجمعات */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}><Building2 size={20}/> المجمعات التعليمية</h2>
            
            <form onSubmit={handleAddSchool} style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
              <input 
                type="text" 
                className="input-field" 
                value={schoolName} 
                onChange={e => setSchoolName(e.target.value)} 
                placeholder="اسم المجمع التعليمي..." 
                required 
              />
              <button type="submit" className="btn btn-primary" disabled={isAddingSchool}>
                {isAddingSchool ? 'جاري الإضافة...' : 'إضافة مجمع'}
              </button>
            </form>

            <table className="data-table">
              <thead>
                <tr>
                  <th>اسم المجمع</th>
                  <th>معرف المجمع (ID)</th>
                </tr>
              </thead>
              <tbody>
                {schools.map(s => (
                  <tr key={s.id}>
                    <td>{s.name}</td>
                    <td style={{ fontSize: '12px', color: '#64748b' }}>{s.id}</td>
                  </tr>
                ))}
                {schools.length === 0 && <tr><td colSpan="2" style={{ textAlign: 'center' }}>لا يوجد مجمعات بعد</td></tr>}
              </tbody>
            </table>
          </div>

          {/* مدراء المجمعات */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}><UserPlus size={20}/> إدارة المدراء (Admins)</h2>
            
            {adminMessage && <div style={{ background: '#dcfce7', color: '#166534', padding: '10px', borderRadius: '8px', marginBottom: '15px' }}>{adminMessage}</div>}
            {adminError && <div style={{ background: '#fee2e2', color: '#991b1b', padding: '10px', borderRadius: '8px', marginBottom: '15px' }}>{adminError}</div>}

            <form onSubmit={handleAddAdmin} style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '20px', background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px' }}>اسم المدير</label>
                <input type="text" className="input-field" value={adminName} onChange={e => setAdminName(e.target.value)} required />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px' }}>رقم الهوية (اسم المستخدم)</label>
                <input type="text" className="input-field" value={adminNationalId} onChange={e => setAdminNationalId(e.target.value)} required dir="ltr" />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px' }}>كلمة المرور</label>
                <input type="password" className="input-field" value={adminPassword} onChange={e => setAdminPassword(e.target.value)} required dir="ltr" />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px' }}>المجمع التعليمي</label>
                <select className="input-field" value={selectedSchool} onChange={e => setSelectedSchool(e.target.value)} required>
                  <option value="">اختر المجمع...</option>
                  {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <button type="submit" className="btn btn-primary" disabled={isAddingAdmin}>
                {isAddingAdmin ? 'جاري الإنشاء...' : 'إنشاء حساب مدير'}
              </button>
            </form>

            <table className="data-table">
              <thead>
                <tr>
                  <th>اسم المدير</th>
                  <th>رقم الهوية</th>
                  <th>المجمع</th>
                  <th>إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {admins.map(a => (
                  <tr key={a.id}>
                    <td>{a.name}</td>
                    <td>{a.nationalId}</td>
                    <td style={{ fontSize: '12px', color: '#64748b' }}>
                      {schools.find(s => s.id === a.schoolId)?.name || 'غير معروف'}
                    </td>
                    <td>
                      <button onClick={() => handleDeleteAdmin(a.id)} className="btn-icon delete">
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
                {admins.length === 0 && <tr><td colSpan="4" style={{ textAlign: 'center' }}>لا يوجد مدراء بعد</td></tr>}
              </tbody>
            </table>
          </div>

        </div>

        <div style={{ marginTop: '24px' }}>
          <ChangePassword />
        </div>
      </div>
    </Layout>
  );
}
