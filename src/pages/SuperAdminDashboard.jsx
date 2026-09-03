import React, { useState, useEffect, useMemo } from 'react';
import { db, auth } from '../firebase';
import { 
  collection, addDoc, onSnapshot, doc, setDoc, updateDoc, 
  query, where, getDocs, deleteDoc 
} from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { 
  Building2, UserPlus, Save, Trash2, Edit3, CheckCircle, 
  AlertCircle, ShieldCheck, Users, BookOpen, GraduationCap, 
  Search, ExternalLink, Image as ImageIcon, Globe, MapPin, 
  Phone, Mail, CheckSquare, RefreshCw, PlusCircle, ArrowRight,
  Layers, Lock, Eye, Download, Award, Sparkles
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import ChangePassword from '../components/ChangePassword';

// Available curriculum choices
const CURRICULUM_OPTIONS = [
  { id: 'saudi', label: 'المنهج السعودي العام (وزارة التعليم)', enLabel: 'Saudi National Curriculum' },
  { id: 'american', label: 'الدبلومة الأمريكية (American Diploma / STEM)', enLabel: 'American Curriculum' },
  { id: 'british', label: 'المنهج البريطاني (British IGCSE)', enLabel: 'British Curriculum' },
  { id: 'international', label: 'المسار العالمي الدولي (International Track)', enLabel: 'International Track' },
  { id: 'holy_quran', label: 'مدارس تحفيظ القرآن الكريم', enLabel: 'Holy Quran Memorization' }
];

// Major Saudi cities for quick selection
const CITIES_LIST = [
  'الرياض', 'جدة', 'مكة المكرمة', 'المدينة المنورة', 'الدمام', 
  'الخبر', 'الجبيل', 'الأحساء', 'الطائف', 'القصيم (بريدة)', 
  'عنيزة', 'خميس مشيط', 'أبها', 'تبوك', 'حائل', 
  'جازان', 'نجران', 'الخرج', 'ينبع', 'عرعر', 
  'سكاكا (الجوف)', 'الباحة', 'أخرى'
];

export default function SuperAdminDashboard() {
  const { userData, switchSchoolContext } = useAuth();
  const { t, lang } = useLanguage();
  const navigate = useNavigate();

  // Active navigation tab: 'schools' | 'admins' | 'masters' | 'reports'
  const [activeTab, setActiveTab] = useState('schools');

  // Core Data States
  const [schools, setSchools] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [supervisorsList, setSupervisorsList] = useState([]);
  const [classesList, setClassesList] = useState([]);
  const [superMasters, setSuperMasters] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  // Search & Filter States
  const [schoolSearch, setSchoolSearch] = useState('');
  const [cityFilter, setCityFilter] = useState('ALL');
  const [curriculumFilter, setCurriculumFilter] = useState('ALL');
  const [adminSearch, setAdminSearch] = useState('');
  const [adminSchoolFilter, setAdminSchoolFilter] = useState('ALL');

  // School Form State
  const [editingSchoolId, setEditingSchoolId] = useState(null);
  const [showSchoolModal, setShowSchoolModal] = useState(false);
  const [schoolName, setSchoolName] = useState('');
  const [schoolCustomId, setSchoolCustomId] = useState('');
  const [schoolCurriculum, setSchoolCurriculum] = useState('saudi');
  const [schoolDefaultLang, setSchoolDefaultLang] = useState('ar');
  const [schoolCity, setSchoolCity] = useState('الرياض');
  const [schoolLogoBase64, setSchoolLogoBase64] = useState('');
  const [schoolPrincipal, setSchoolPrincipal] = useState('');
  const [schoolPhone, setSchoolPhone] = useState('');
  const [schoolEmail, setSchoolEmail] = useState('');
  const [schoolStages, setSchoolStages] = useState(['primary', 'intermediate', 'secondary']);
  const [schoolStatus, setSchoolStatus] = useState('active');
  const [schoolNotes, setSchoolNotes] = useState('');
  const [isSavingSchool, setIsSavingSchool] = useState(false);
  const [schoolFormMsg, setSchoolFormMsg] = useState({ text: '', type: '' });

  // Admin Form State
  const [editingAdminId, setEditingAdminId] = useState(null);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminName, setAdminName] = useState('');
  const [adminNationalId, setAdminNationalId] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [selectedSchoolId, setSelectedSchoolId] = useState('');
  const [adminPhone, setAdminPhone] = useState('');
  const [isSavingAdmin, setIsSavingAdmin] = useState(false);
  const [adminFormMsg, setAdminFormMsg] = useState({ text: '', type: '' });

  // Super Master Account Form State
  const [masterName, setMasterName] = useState('');
  const [masterEmail, setMasterEmail] = useState('');
  const [masterPassword, setMasterPassword] = useState('');
  const [isSavingMaster, setIsSavingMaster] = useState(false);
  const [masterFormMsg, setMasterFormMsg] = useState({ text: '', type: '' });

  // Real-time Data Listeners
  useEffect(() => {
    // 1. Fetch Schools
    const unsubSchools = onSnapshot(collection(db, 'schools'), snap => {
      const list = [];
      snap.forEach(d => list.push({ id: d.id, ...d.data() }));
      setSchools(list);
    });

    // 2. Fetch Users (Admins, SuperMasters)
    const unsubUsers = onSnapshot(collection(db, 'users'), snap => {
      const adm = [];
      const masters = [];
      snap.forEach(d => {
        const u = { id: d.id, ...d.data() };
        if (u.role === 'admin') adm.push(u);
        if (u.role === 'superadmin' || u.email === 'super@admin.com') masters.push(u);
      });
      setAdmins(adm);
      setSuperMasters(masters);
    });

    // 3. Fetch Teachers
    const unsubTeachers = onSnapshot(collection(db, 'teachers'), snap => {
      const list = [];
      snap.forEach(d => list.push({ id: d.id, ...d.data() }));
      setTeachers(list);
    });

    // 4. Fetch Students
    const unsubStudents = onSnapshot(collection(db, 'students'), snap => {
      const list = [];
      snap.forEach(d => list.push({ id: d.id, ...d.data() }));
      setStudents(list);
    });

    // 5. Fetch Staff & Supervisors
    const unsubStaff = onSnapshot(collection(db, 'staff'), snap => {
      const list = [];
      snap.forEach(d => list.push({ id: d.id, ...d.data() }));
      setStaffList(list);
    });

    const unsubSupervisors = onSnapshot(collection(db, 'supervisors'), snap => {
      const list = [];
      snap.forEach(d => list.push({ id: d.id, ...d.data() }));
      setSupervisorsList(list);
    });

    // 6. Fetch Classes
    const unsubClasses = onSnapshot(collection(db, 'classes'), snap => {
      const list = [];
      snap.forEach(d => list.push({ id: d.id, ...d.data() }));
      setClassesList(list);
      setLoadingData(false);
    });

    return () => {
      unsubSchools();
      unsubUsers();
      unsubTeachers();
      unsubStudents();
      unsubStaff();
      unsubSupervisors();
      unsubClasses();
    };
  }, []);

  // Compute Per-School Statistics
  const schoolStatsMap = useMemo(() => {
    const map = {};
    schools.forEach(s => {
      map[s.id] = {
        adminsCount: 0,
        teachersCount: 0,
        studentsCount: 0,
        staffCount: 0,
        classesCount: 0
      };
    });

    admins.forEach(a => {
      if (a.schoolId && map[a.schoolId]) map[a.schoolId].adminsCount++;
    });

    teachers.forEach(t => {
      const sid = t.schoolId || 'default_school_1';
      if (map[sid]) map[sid].teachersCount++;
    });

    students.forEach(st => {
      const sid = st.schoolId || 'default_school_1';
      if (map[sid]) map[sid].studentsCount++;
    });

    staffList.forEach(sf => {
      const sid = sf.schoolId || 'default_school_1';
      if (map[sid]) map[sid].staffCount++;
    });

    supervisorsList.forEach(sp => {
      const sid = sp.schoolId || 'default_school_1';
      if (map[sid]) map[sid].staffCount++;
    });

    classesList.forEach(c => {
      const sid = c.schoolId || 'default_school_1';
      if (map[sid]) map[sid].classesCount++;
    });

    return map;
  }, [schools, admins, teachers, students, staffList, supervisorsList, classesList]);

  // Overall Global Statistics
  const globalStats = useMemo(() => {
    return {
      totalSchools: schools.length,
      totalAdmins: admins.length,
      totalTeachers: teachers.length,
      totalStudents: students.length,
      totalStaffAndSupervisors: staffList.length + supervisorsList.length,
      totalClasses: classesList.length,
      totalMasters: superMasters.length
    };
  }, [schools, admins, teachers, students, staffList, supervisorsList, classesList, superMasters]);

  // Filtered Schools
  const filteredSchools = useMemo(() => {
    return schools.filter(s => {
      const matchesSearch = !schoolSearch.trim() || 
        (s.name || '').toLowerCase().includes(schoolSearch.toLowerCase()) ||
        (s.id || '').toLowerCase().includes(schoolSearch.toLowerCase()) ||
        (s.city || '').toLowerCase().includes(schoolSearch.toLowerCase());
      
      const matchesCity = cityFilter === 'ALL' || s.city === cityFilter;
      const matchesCurriculum = curriculumFilter === 'ALL' || s.curriculumType === curriculumFilter;

      return matchesSearch && matchesCity && matchesCurriculum;
    });
  }, [schools, schoolSearch, cityFilter, curriculumFilter]);

  // Filtered Admins
  const filteredAdmins = useMemo(() => {
    return admins.filter(a => {
      const matchesSearch = !adminSearch.trim() || 
        (a.name || '').toLowerCase().includes(adminSearch.toLowerCase()) ||
        (String(a.nationalId || '')).includes(adminSearch.trim());
      
      const matchesSchool = adminSchoolFilter === 'ALL' || a.schoolId === adminSchoolFilter;

      return matchesSearch && matchesSchool;
    });
  }, [admins, adminSearch, adminSchoolFilter]);

  // Handle Logo Upload in School Form
  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 1.5 * 1024 * 1024) {
      alert('حجم الصورة كبير جداً، يرجى اختيار صورة أقل من 1.5 ميجابايت.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setSchoolLogoBase64(reader.result);
    };
    reader.readAsDataURL(file);
  };

  // Open School Modal for New School
  const handleOpenAddSchool = () => {
    setEditingSchoolId(null);
    setSchoolName('');
    setSchoolCustomId('');
    setSchoolCurriculum('saudi');
    setSchoolDefaultLang('ar');
    setSchoolCity('الرياض');
    setSchoolLogoBase64('');
    setSchoolPrincipal('');
    setSchoolPhone('');
    setSchoolEmail('');
    setSchoolStages(['primary', 'intermediate', 'secondary']);
    setSchoolStatus('active');
    setSchoolNotes('');
    setSchoolFormMsg({ text: '', type: '' });
    setShowSchoolModal(true);
  };

  // Open School Modal for Editing
  const handleOpenEditSchool = (school) => {
    setEditingSchoolId(school.id);
    setSchoolName(school.name || '');
    setSchoolCustomId(school.id || '');
    setSchoolCurriculum(school.curriculumType || 'saudi');
    setSchoolDefaultLang(school.defaultLanguage || 'ar');
    setSchoolCity(school.city || 'الرياض');
    setSchoolLogoBase64(school.logoUrl || '');
    setSchoolPrincipal(school.principalName || '');
    setSchoolPhone(school.phone || '');
    setSchoolEmail(school.email || '');
    setSchoolStages(school.stages || ['primary', 'intermediate', 'secondary']);
    setSchoolStatus(school.status || 'active');
    setSchoolNotes(school.notes || '');
    setSchoolFormMsg({ text: '', type: '' });
    setShowSchoolModal(true);
  };

  // Save / Update School
  const handleSaveSchool = async (e) => {
    e.preventDefault();
    setSchoolFormMsg({ text: '', type: '' });

    if (!schoolName.trim()) {
      setSchoolFormMsg({ text: 'يرجى إدخال اسم المدرسة أو المجمع التعليمي.', type: 'error' });
      return;
    }

    setIsSavingSchool(true);
    try {
      const payload = {
        name: schoolName.trim(),
        curriculumType: schoolCurriculum,
        defaultLanguage: schoolDefaultLang,
        city: schoolCity,
        logoUrl: schoolLogoBase64 || null,
        principalName: schoolPrincipal.trim(),
        phone: schoolPhone.trim(),
        email: schoolEmail.trim(),
        stages: schoolStages,
        status: schoolStatus,
        notes: schoolNotes.trim(),
        updatedAt: new Date()
      };

      if (editingSchoolId) {
        // Update existing school
        await updateDoc(doc(db, 'schools', editingSchoolId), payload);
        setSchoolFormMsg({ text: '✓ تم تحديث بيانات المدرسة بنجاح!', type: 'success' });
      } else {
        // Add new school
        payload.createdAt = new Date();
        
        if (schoolCustomId.trim()) {
          // Custom ID provided
          const cleanId = schoolCustomId.trim().replace(/\s+/g, '_');
          await setDoc(doc(db, 'schools', cleanId), payload);
        } else {
          // Auto-generated ID
          await addDoc(collection(db, 'schools'), payload);
        }
        setSchoolFormMsg({ text: '✓ تمت إضافة المدرسة/المجمع الجديد بنجاح!', type: 'success' });
      }

      setTimeout(() => {
        setShowSchoolModal(false);
      }, 1200);
    } catch (err) {
      console.error('Error saving school:', err);
      setSchoolFormMsg({ text: 'حدث خطأ أثناء حفظ المدرسة: ' + err.message, type: 'error' });
    } finally {
      setIsSavingSchool(false);
    }
  };

  // Delete School
  const handleDeleteSchool = async (schoolId, sName) => {
    const confirmMsg = `هل أنت متأكد تماماً من حذف "${sName}" (${schoolId}) من قائمة المدارس؟\n\nتنبيه: سيتم إزالة ملف المدرسة من النظام.`;
    if (!window.confirm(confirmMsg)) return;

    try {
      await deleteDoc(doc(db, 'schools', schoolId));
      alert(`✓ تم حذف مدرسة "${sName}" بنجاح.`);
    } catch (err) {
      console.error('Error deleting school:', err);
      alert('حدث خطأ أثناء حذف المدرسة: ' + err.message);
    }
  };

  // Jump into / Manage School as Admin
  const handleManageSchoolAsAdmin = async (school) => {
    if (switchSchoolContext) {
      await switchSchoolContext(school.id, school.name, school.logoUrl);
    }
    navigate('/admin');
  };

  // Open Admin Modal for New Admin
  const handleOpenAddAdmin = (defaultSchoolId = '') => {
    setEditingAdminId(null);
    setAdminName('');
    setAdminNationalId('');
    setAdminPassword('');
    setSelectedSchoolId(defaultSchoolId || (schools[0]?.id || ''));
    setAdminPhone('');
    setAdminFormMsg({ text: '', type: '' });
    setShowAdminModal(true);
  };

  // Save / Create School Admin
  const handleSaveAdmin = async (e) => {
    e.preventDefault();
    setAdminFormMsg({ text: '', type: '' });

    const trimmedNid = adminNationalId.trim().replace(/\s+/g, '');
    const trimmedPass = adminPassword.trim();

    if (!adminName.trim()) {
      setAdminFormMsg({ text: 'يرجى إدخال اسم المدير.', type: 'error' });
      return;
    }

    if (trimmedNid.length < 5) {
      setAdminFormMsg({ text: 'رقم الهوية أو اسم المستخدم يجب ألا يقل عن 5 خانات.', type: 'error' });
      return;
    }

    if (!selectedSchoolId) {
      setAdminFormMsg({ text: 'يرجى اختيار المدرسة التابع لها المدير.', type: 'error' });
      return;
    }

    if (!editingAdminId && trimmedPass.length < 6) {
      setAdminFormMsg({ text: 'كلمة المرور يجب ألا تقل عن 6 أحرف/أرقام.', type: 'error' });
      return;
    }

    setIsSavingAdmin(true);
    try {
      const email = trimmedNid.includes('@') ? trimmedNid : `${trimmedNid}@school.local`;
      const sObj = schools.find(s => s.id === selectedSchoolId);
      const sName = sObj?.name || 'مدرسة';

      if (editingAdminId) {
        // Update existing admin in Firestore
        await updateDoc(doc(db, 'users', editingAdminId), {
          name: adminName.trim(),
          nationalId: trimmedNid,
          schoolId: selectedSchoolId,
          schoolName: sName,
          phone: adminPhone.trim(),
          updatedAt: new Date()
        });
        setAdminFormMsg({ text: '✓ تم تحديث بيانات المدير بنجاح!', type: 'success' });
      } else {
        // Create user in Auth
        let uid = null;
        try {
          const cred = await createUserWithEmailAndPassword(auth, email, trimmedPass);
          uid = cred.user.uid;
        } catch (authErr) {
          if (authErr.code !== 'auth/email-already-in-use') {
            throw authErr;
          }
        }

        // Save Admin in users collection
        const adminPayload = {
          name: adminName.trim(),
          nationalId: trimmedNid,
          email: email,
          role: 'admin',
          schoolId: selectedSchoolId,
          schoolName: sName,
          phone: adminPhone.trim(),
          createdAt: new Date()
        };

        if (uid) {
          await setDoc(doc(db, 'users', uid), adminPayload);
        } else {
          await addDoc(collection(db, 'users'), adminPayload);
        }

        setAdminFormMsg({ text: '✓ تم إنشاء حساب المدير بنجاح!', type: 'success' });
      }

      setTimeout(() => {
        setShowAdminModal(false);
      }, 1200);
    } catch (err) {
      console.error('Error saving admin:', err);
      if (err.code === 'auth/email-already-in-use') {
        setAdminFormMsg({ text: 'رقم الهوية / البريد مسجل مسبقاً في النظام.', type: 'error' });
      } else {
        setAdminFormMsg({ text: 'حدث خطأ: ' + err.message, type: 'error' });
      }
    } finally {
      setIsSavingAdmin(false);
    }
  };

  // Delete School Admin
  const handleDeleteAdmin = async (adminId, aName) => {
    if (!window.confirm(`هل أنت متأكد من حذف حساب المدير "${aName}"؟`)) return;

    try {
      await deleteDoc(doc(db, 'users', adminId));
      alert(`✓ تم حذف المدير "${aName}" بنجاح.`);
    } catch (err) {
      console.error('Error deleting admin:', err);
      alert('حدث خطأ أثناء الحذف: ' + err.message);
    }
  };

  // Add Additional Super Master Account
  const handleAddSuperMaster = async (e) => {
    e.preventDefault();
    setMasterFormMsg({ text: '', type: '' });

    if (!masterEmail.trim() || masterPassword.length < 6) {
      setMasterFormMsg({ text: 'يرجى إدخال البريد الإلكتروني وكلمة مرور لا تقل عن 6 أحرف.', type: 'error' });
      return;
    }

    setIsSavingMaster(true);
    try {
      const email = masterEmail.trim().toLowerCase();
      let uid = null;
      try {
        const cred = await createUserWithEmailAndPassword(auth, email, masterPassword.trim());
        uid = cred.user.uid;
      } catch (authErr) {
        if (authErr.code !== 'auth/email-already-in-use') {
          throw authErr;
        }
      }

      const masterDoc = {
        name: masterName.trim() || 'الماستر العام',
        email: email,
        nationalId: email.split('@')[0],
        role: 'superadmin',
        schoolId: 'ALL',
        schoolName: 'جميع المدارس (الماستر العام)',
        createdAt: new Date()
      };

      if (uid) {
        await setDoc(doc(db, 'users', uid), masterDoc);
      } else {
        await addDoc(collection(db, 'users'), masterDoc);
      }

      setMasterFormMsg({ text: '✓ تم إنشاء حساب الماستر العام الجديد بنجاح!', type: 'success' });
      setMasterName('');
      setMasterEmail('');
      setMasterPassword('');
    } catch (err) {
      console.error('Error creating super master:', err);
      setMasterFormMsg({ text: 'حدث خطأ: ' + err.message, type: 'error' });
    } finally {
      setIsSavingMaster(false);
    }
  };

  // Export Comprehensive System Report to CSV
  const handleExportCSV = () => {
    const rows = [
      ['اسم المدرسة / المجمع', 'معرف المدرسة', 'المدينة', 'المنهج الدراسي', 'اللغة', 'المدراء', 'المعلمين', 'الطلاب', 'الكوادر', 'الفصول', 'الحالة']
    ];

    schools.forEach(s => {
      const st = schoolStatsMap[s.id] || { adminsCount: 0, teachersCount: 0, studentsCount: 0, staffCount: 0, classesCount: 0 };
      const curLabel = CURRICULUM_OPTIONS.find(c => c.id === s.curriculumType)?.label || s.curriculumType || 'سعودي';
      rows.push([
        s.name || '',
        s.id || '',
        s.city || '',
        curLabel,
        s.defaultLanguage === 'en' ? 'English' : 'العربية',
        st.adminsCount,
        st.teachersCount,
        st.studentsCount,
        st.staffCount,
        st.classesCount,
        s.status === 'inactive' ? 'معطلة' : 'نشطة'
      ]);
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + rows.map(r => r.map(cell => `"${cell}"`).join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `system_schools_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Layout role="superadmin" title={t('superAdmin.title')}>
      <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Top Header Banner */}
        <div style={{
          background: 'linear-gradient(135deg, #0e7490 0%, #0369a1 50%, #0284c7 100%)',
          borderRadius: '18px',
          padding: '24px 28px',
          color: '#ffffff',
          boxShadow: '0 10px 25px -5px rgba(14, 116, 144, 0.3)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
              <ShieldCheck size={32} color="#38bdf8" />
              <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 800 }}>
                لوحة تحكم الماستر العام (Super Master Portal)
              </h1>
            </div>
            <p style={{ margin: 0, color: 'rgba(255, 255, 255, 0.85)', fontSize: '14px', maxWidth: '650px' }}>
              إدارة المنظومة التعليمية الشاملة متعددة المدارس — إضافة وتخصيص أي مدرسة أو مجمع تعليمي، تعيين وتوزيع المدراء، والمتابعة المركزية لكافة الحسابات والإحصائيات.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button
              onClick={handleOpenAddSchool}
              className="btn"
              style={{
                background: '#ffffff',
                color: '#0e7490',
                fontWeight: 800,
                fontSize: '14px',
                padding: '10px 20px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              <PlusCircle size={18} color="#0e7490" />
              <span>إضافة مدرسة جديدة</span>
            </button>

            <button
              onClick={() => handleOpenAddAdmin()}
              className="btn"
              style={{
                background: 'rgba(255, 255, 255, 0.15)',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '14px',
                padding: '10px 18px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                cursor: 'pointer'
              }}
            >
              <UserPlus size={18} />
              <span>إنشاء حساب مدير</span>
            </button>
          </div>
        </div>

        {/* KPI Global Statistics Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
          
          <div className="glass-panel" style={{ padding: '18px', borderRadius: '14px', display: 'flex', alignItems: 'center', gap: '14px', borderLeft: '4px solid #0e7490' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(14, 116, 144, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0e7490' }}>
              <Building2 size={26} />
            </div>
            <div>
              <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>إجمالي المدارس</div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a' }}>{globalStats.totalSchools}</div>
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '18px', borderRadius: '14px', display: 'flex', alignItems: 'center', gap: '14px', borderLeft: '4px solid #2563eb' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(37, 99, 235, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb' }}>
              <ShieldCheck size={26} />
            </div>
            <div>
              <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>مدراء المدارس</div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a' }}>{globalStats.totalAdmins}</div>
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '18px', borderRadius: '14px', display: 'flex', alignItems: 'center', gap: '14px', borderLeft: '4px solid #10b981' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
              <BookOpen size={26} />
            </div>
            <div>
              <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>إجمالي المعلمين</div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a' }}>{globalStats.totalTeachers}</div>
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '18px', borderRadius: '14px', display: 'flex', alignItems: 'center', gap: '14px', borderLeft: '4px solid #8b5cf6' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(139, 92, 246, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8b5cf6' }}>
              <GraduationCap size={26} />
            </div>
            <div>
              <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>إجمالي الطلاب</div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a' }}>{globalStats.totalStudents}</div>
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '18px', borderRadius: '14px', display: 'flex', alignItems: 'center', gap: '14px', borderLeft: '4px solid #f59e0b' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(245, 158, 11, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b' }}>
              <Users size={26} />
            </div>
            <div>
              <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>الكوادر والمشرفين</div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a' }}>{globalStats.totalStaffAndSupervisors}</div>
            </div>
          </div>

        </div>

        {/* Navigation Tabs */}
        <div style={{ display: 'flex', gap: '8px', borderBottom: '2px solid #e2e8f0', paddingBottom: '4px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => setActiveTab('schools')}
            style={{
              padding: '12px 20px',
              borderRadius: '10px 10px 0 0',
              border: 'none',
              background: activeTab === 'schools' ? '#0e7490' : 'transparent',
              color: activeTab === 'schools' ? '#ffffff' : '#64748b',
              fontWeight: 700,
              fontSize: '14px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s'
            }}
          >
            <Building2 size={18} />
            <span>المدارس والمجمعات ({schools.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('admins')}
            style={{
              padding: '12px 20px',
              borderRadius: '10px 10px 0 0',
              border: 'none',
              background: activeTab === 'admins' ? '#0e7490' : 'transparent',
              color: activeTab === 'admins' ? '#ffffff' : '#64748b',
              fontWeight: 700,
              fontSize: '14px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s'
            }}
          >
            <ShieldCheck size={18} />
            <span>مدراء المدارس ({admins.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('masters')}
            style={{
              padding: '12px 20px',
              borderRadius: '10px 10px 0 0',
              border: 'none',
              background: activeTab === 'masters' ? '#0e7490' : 'transparent',
              color: activeTab === 'masters' ? '#ffffff' : '#64748b',
              fontWeight: 700,
              fontSize: '14px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s'
            }}
          >
            <Lock size={18} />
            <span>حسابات الماستر العام ({superMasters.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('reports')}
            style={{
              padding: '12px 20px',
              borderRadius: '10px 10px 0 0',
              border: 'none',
              background: activeTab === 'reports' ? '#0e7490' : 'transparent',
              color: activeTab === 'reports' ? '#ffffff' : '#64748b',
              fontWeight: 700,
              fontSize: '14px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s'
            }}
          >
            <Download size={18} />
            <span>التقارير والتصدير</span>
          </button>
        </div>

        {/* TAB 1: SCHOOLS MANAGEMENT */}
        {activeTab === 'schools' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Search & Filter Bar */}
            <div className="glass-panel" style={{ padding: '16px', display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
                <Search size={18} style={{ position: 'absolute', top: '12px', right: '12px', color: '#94a3b8' }} />
                <input
                  type="text"
                  className="input-field"
                  placeholder="البحث عن مدرسة بالاسم، المعرف، أو المدينة..."
                  value={schoolSearch}
                  onChange={e => setSchoolSearch(e.target.value)}
                  style={{ paddingRight: '38px' }}
                />
              </div>

              <div style={{ width: '180px' }}>
                <select 
                  className="input-field"
                  value={cityFilter}
                  onChange={e => setCityFilter(e.target.value)}
                >
                  <option value="ALL">جميع المدن</option>
                  {CITIES_LIST.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div style={{ width: '220px' }}>
                <select 
                  className="input-field"
                  value={curriculumFilter}
                  onChange={e => setCurriculumFilter(e.target.value)}
                >
                  <option value="ALL">جميع المناهج الدراسية</option>
                  {CURRICULUM_OPTIONS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                </select>
              </div>

              <button
                onClick={handleOpenAddSchool}
                className="btn btn-primary"
                style={{ display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}
              >
                <PlusCircle size={18} />
                <span>إضافة مدرسة</span>
              </button>
            </div>

            {/* Schools Grid / Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '20px' }}>
              {filteredSchools.map(school => {
                const stats = schoolStatsMap[school.id] || { adminsCount: 0, teachersCount: 0, studentsCount: 0, staffCount: 0, classesCount: 0 };
                const curObj = CURRICULUM_OPTIONS.find(c => c.id === school.curriculumType);

                return (
                  <div 
                    key={school.id} 
                    className="glass-panel"
                    style={{
                      padding: '22px',
                      borderRadius: '16px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      border: '1px solid rgba(226, 232, 240, 0.9)',
                      position: 'relative',
                      boxShadow: '0 4px 15px rgba(0, 0, 0, 0.03)',
                      transition: 'transform 0.2s, box-shadow 0.2s'
                    }}
                  >
                    {/* Card Header */}
                    <div>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{
                            width: '56px',
                            height: '56px',
                            borderRadius: '12px',
                            background: '#f8fafc',
                            border: '1px solid #e2e8f0',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            overflow: 'hidden',
                            flexShrink: 0
                          }}>
                            {school.logoUrl ? (
                              <img src={school.logoUrl} alt={school.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                            ) : (
                              <Building2 size={28} color="#0e7490" />
                            )}
                          </div>

                          <div>
                            <h3 style={{ margin: '0 0 4px 0', fontSize: '17px', fontWeight: 800, color: '#0f172a' }}>
                              {school.name}
                            </h3>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                              <span style={{ fontSize: '11px', color: '#64748b', background: '#f1f5f9', padding: '2px 8px', borderRadius: '6px', fontFamily: 'monospace' }}>
                                ID: {school.id}
                              </span>
                              {school.city && (
                                <span style={{ fontSize: '11px', color: '#0e7490', background: 'rgba(14, 116, 144, 0.08)', padding: '2px 8px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  <MapPin size={11} /> {school.city}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <span style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          padding: '3px 8px',
                          borderRadius: '8px',
                          background: school.status === 'inactive' ? '#fee2e2' : '#dcfce7',
                          color: school.status === 'inactive' ? '#991b1b' : '#166534'
                        }}>
                          {school.status === 'inactive' ? 'معطلة' : 'نشطة'}
                        </span>
                      </div>

                      {/* Badges: Curriculum & Language */}
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '16px' }}>
                        <span style={{
                          fontSize: '12px',
                          background: '#f0f9ff',
                          color: '#0369a1',
                          border: '1px solid #bae6fd',
                          padding: '3px 10px',
                          borderRadius: '8px',
                          fontWeight: 600,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          <BookOpen size={13} />
                          {curObj?.label || 'المنهج السعودي'}
                        </span>

                        <span style={{
                          fontSize: '12px',
                          background: school.defaultLanguage === 'en' ? '#fdf4ff' : '#ecfdf5',
                          color: school.defaultLanguage === 'en' ? '#86198f' : '#047857',
                          border: `1px solid ${school.defaultLanguage === 'en' ? '#f5d0fe' : '#a7f3d0'}`,
                          padding: '3px 10px',
                          borderRadius: '8px',
                          fontWeight: 600,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          <Globe size={13} />
                          {school.defaultLanguage === 'en' ? 'English (EN)' : 'العربية (AR)'}
                        </span>
                      </div>

                      {/* Stats Counter Bar */}
                      <div style={{
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: '12px',
                        padding: '10px 14px',
                        display: 'grid',
                        gridTemplateColumns: 'repeat(4, 1fr)',
                        gap: '6px',
                        textAlign: 'center',
                        marginBottom: '16px'
                      }}>
                        <div>
                          <div style={{ fontSize: '15px', fontWeight: 800, color: '#2563eb' }}>{stats.adminsCount}</div>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>المدراء</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '15px', fontWeight: 800, color: '#10b981' }}>{stats.teachersCount}</div>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>المعلمين</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '15px', fontWeight: 800, color: '#8b5cf6' }}>{stats.studentsCount}</div>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>الطلاب</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '15px', fontWeight: 800, color: '#f59e0b' }}>{stats.staffCount}</div>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>الكوادر</div>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', borderTop: '1px solid #e2e8f0', paddingTop: '14px' }}>
                      <button
                        type="button"
                        onClick={() => handleManageSchoolAsAdmin(school)}
                        className="btn"
                        style={{
                          flex: 1,
                          background: 'linear-gradient(135deg, #0e7490, #0284c7)',
                          color: '#ffffff',
                          fontWeight: 700,
                          fontSize: '13px',
                          padding: '8px 12px',
                          borderRadius: '10px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          border: 'none',
                          cursor: 'pointer'
                        }}
                        title="الدخول إلى لوحة إدارة هذه المدرسة كمدير"
                      >
                        <ExternalLink size={15} />
                        <span>إدارة المدرسة</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenAddAdmin(school.id)}
                        className="btn"
                        style={{
                          background: '#f1f5f9',
                          color: '#334155',
                          fontWeight: 600,
                          fontSize: '12px',
                          padding: '8px 10px',
                          borderRadius: '10px',
                          border: '1px solid #cbd5e1',
                          cursor: 'pointer'
                        }}
                        title="إضافة مدير جديد لهذه المدرسة"
                      >
                        <UserPlus size={15} />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenEditSchool(school)}
                        className="btn"
                        style={{
                          background: '#f1f5f9',
                          color: '#334155',
                          fontWeight: 600,
                          fontSize: '12px',
                          padding: '8px 10px',
                          borderRadius: '10px',
                          border: '1px solid #cbd5e1',
                          cursor: 'pointer'
                        }}
                        title="تعديل بيانات وإعدادات المدرسة"
                      >
                        <Edit3 size={15} />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteSchool(school.id, school.name)}
                        className="btn-icon delete"
                        style={{ padding: '8px', borderRadius: '10px' }}
                        title="حذف المدرسة"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                  </div>
                );
              })}

              {filteredSchools.length === 0 && (
                <div className="glass-panel" style={{ gridColumn: '1 / -1', padding: '48px', textAlign: 'center', color: '#64748b' }}>
                  <Building2 size={48} color="#94a3b8" style={{ marginBottom: '12px' }} />
                  <h3 style={{ margin: '0 0 8px 0', color: '#334155' }}>لا توجد مدارس مطابقة للبحث</h3>
                  <p style={{ margin: '0 0 16px 0', fontSize: '14px' }}>يمكنك إضافة مدرسة أو مجمع تعليمي جديد في أي وقت.</p>
                  <button onClick={handleOpenAddSchool} className="btn btn-primary">
                    <PlusCircle size={16} style={{ marginLeft: '6px' }} /> إضافة مدرسة جديدة
                  </button>
                </div>
              )}
            </div>

          </div>
        )}

        {/* TAB 2: SCHOOL ADMINS MANAGEMENT */}
        {activeTab === 'admins' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            <div className="glass-panel" style={{ padding: '16px', display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
                <Search size={18} style={{ position: 'absolute', top: '12px', right: '12px', color: '#94a3b8' }} />
                <input
                  type="text"
                  className="input-field"
                  placeholder="البحث باسم المدير أو رقم الهوية..."
                  value={adminSearch}
                  onChange={e => setAdminSearch(e.target.value)}
                  style={{ paddingRight: '38px' }}
                />
              </div>

              <div style={{ width: '250px' }}>
                <select
                  className="input-field"
                  value={adminSchoolFilter}
                  onChange={e => setAdminSchoolFilter(e.target.value)}
                >
                  <option value="ALL">جميع المدارس والمجمعات</option>
                  {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>

              <button
                onClick={() => handleOpenAddAdmin()}
                className="btn btn-primary"
                style={{ display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}
              >
                <UserPlus size={18} />
                <span>إنشاء حساب مدير جديد</span>
              </button>
            </div>

            <div className="glass-panel" style={{ padding: '20px', overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>اسم المدير</th>
                    <th>رقم الهوية / اسم المستخدم</th>
                    <th>المدرسة التابع لها</th>
                    <th>البريد الإلكتروني</th>
                    <th>الهاتف</th>
                    <th>الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAdmins.map(admin => {
                    const matchedSchool = schools.find(s => s.id === admin.schoolId);

                    return (
                      <tr key={admin.id}>
                        <td style={{ fontWeight: 700, color: '#0f172a' }}>{admin.name}</td>
                        <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{admin.nationalId}</td>
                        <td>
                          <span style={{
                            fontSize: '12px',
                            fontWeight: 700,
                            padding: '3px 10px',
                            borderRadius: '8px',
                            background: 'rgba(14, 116, 144, 0.08)',
                            color: '#0e7490'
                          }}>
                            {matchedSchool?.name || admin.schoolName || 'غير محدد'}
                          </span>
                        </td>
                        <td style={{ fontSize: '13px', color: '#64748b' }} dir="ltr">{admin.email || '-'}</td>
                        <td style={{ fontSize: '13px', color: '#64748b' }} dir="ltr">{admin.phone || '-'}</td>
                        <td>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button
                              onClick={() => {
                                setEditingAdminId(admin.id);
                                setAdminName(admin.name || '');
                                setAdminNationalId(admin.nationalId || '');
                                setAdminPassword('');
                                setSelectedSchoolId(admin.schoolId || '');
                                setAdminPhone(admin.phone || '');
                                setAdminFormMsg({ text: '', type: '' });
                                setShowAdminModal(true);
                              }}
                              className="btn-icon"
                              style={{ color: '#0e7490', background: 'rgba(14, 116, 144, 0.1)' }}
                              title="تعديل بيانات المدير"
                            >
                              <Edit3 size={16} />
                            </button>

                            <button
                              onClick={() => handleDeleteAdmin(admin.id, admin.name)}
                              className="btn-icon delete"
                              title="حذف حساب المدير"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {filteredAdmins.length === 0 && (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: '32px', color: '#64748b' }}>
                        لا يوجد مدراء مسجلين يطابقون خيارات البحث الحالية.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

          </div>
        )}

        {/* TAB 3: SUPER MASTERS ACCOUNTS */}
        {activeTab === 'masters' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            
            {/* Create Additional Super Master */}
            <div className="glass-panel" style={{ padding: '24px' }}>
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 16px 0', fontSize: '18px', color: '#0f172a' }}>
                <ShieldCheck size={22} color="#0e7490" />
                <span>إضافة ماستر عام جديد (Super Master)</span>
              </h2>

              {masterFormMsg.text && (
                <div style={{
                  padding: '12px',
                  borderRadius: '8px',
                  marginBottom: '16px',
                  background: masterFormMsg.type === 'success' ? '#dcfce7' : '#fee2e2',
                  color: masterFormMsg.type === 'success' ? '#166534' : '#991b1b',
                  fontSize: '13px'
                }}>
                  {masterFormMsg.text}
                </div>
              )}

              <form onSubmit={handleAddSuperMaster} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600, fontSize: '13px' }}>اسم الماستر</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="مثال: الإدارة العامة للمنظومة"
                    value={masterName}
                    onChange={e => setMasterName(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600, fontSize: '13px' }}>البريد الإلكتروني للماستر</label>
                  <input
                    type="email"
                    className="input-field"
                    placeholder="super2@admin.com"
                    value={masterEmail}
                    onChange={e => setMasterEmail(e.target.value)}
                    required
                    dir="ltr"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600, fontSize: '13px' }}>كلمة المرور (6 خانات على الأقل)</label>
                  <input
                    type="password"
                    className="input-field"
                    placeholder="••••••••"
                    value={masterPassword}
                    onChange={e => setMasterPassword(e.target.value)}
                    required
                    dir="ltr"
                  />
                </div>

                <button type="submit" className="btn btn-primary" disabled={isSavingMaster} style={{ marginTop: '8px' }}>
                  {isSavingMaster ? 'جاري الإنشاء...' : 'إنشاء حساب ماستر عام'}
                </button>
              </form>
            </div>

            {/* List Existing Super Masters & Change Password */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div className="glass-panel" style={{ padding: '24px' }}>
                <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 16px 0', fontSize: '18px', color: '#0f172a' }}>
                  <Lock size={22} color="#0e7490" />
                  <span>حسابات الماستر المسجلة</span>
                </h2>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {superMasters.map(m => (
                    <div 
                      key={m.id}
                      style={{
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: '10px',
                        padding: '12px 16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '14px' }}>{m.name || 'حساب الماستر'}</div>
                        <div style={{ fontSize: '12px', color: '#64748b' }} dir="ltr">{m.email}</div>
                      </div>
                      <span style={{ fontSize: '11px', fontWeight: 700, background: '#dcfce7', color: '#166534', padding: '3px 8px', borderRadius: '6px' }}>
                        صلاحية كاملة (Super Master)
                      </span>
                    </div>
                  ))}
                  {superMasters.length === 0 && (
                    <div style={{ color: '#64748b', fontSize: '13px', textAlign: 'center', padding: '16px' }}>
                      الحساب الرئيسي الافتراضي: super@admin.com
                    </div>
                  )}
                </div>
              </div>

              <div>
                <ChangePassword />
              </div>
            </div>

          </div>
        )}

        {/* TAB 4: REPORTS & EXPORT */}
        {activeTab === 'reports' && (
          <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
              <div>
                <h2 style={{ margin: '0 0 4px 0', fontSize: '18px', color: '#0f172a' }}>التقرير الإحصائي الشامل لكافة المدارس</h2>
                <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
                  معاينة وتصدير قائمة المدارس والمجمعات المسجلة مع نسب المعلمين والطلاب والمدراء.
                </p>
              </div>

              <button 
                onClick={handleExportCSV}
                className="btn btn-primary"
                style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <Download size={18} />
                <span>تصدير التقرير (Excel / CSV)</span>
              </button>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>المدرسة / المجمع</th>
                    <th>المدينة</th>
                    <th>المنهج</th>
                    <th>اللغة</th>
                    <th>المدراء</th>
                    <th>المعلمين</th>
                    <th>الطلاب</th>
                    <th>الكوادر</th>
                    <th>الفصول</th>
                    <th>الحالة</th>
                  </tr>
                </thead>
                <tbody>
                  {schools.map(s => {
                    const st = schoolStatsMap[s.id] || { adminsCount: 0, teachersCount: 0, studentsCount: 0, staffCount: 0, classesCount: 0 };
                    const curObj = CURRICULUM_OPTIONS.find(c => c.id === s.curriculumType);

                    return (
                      <tr key={s.id}>
                        <td style={{ fontWeight: 700, color: '#0f172a' }}>{s.name}</td>
                        <td>{s.city || '-'}</td>
                        <td style={{ fontSize: '12px' }}>{curObj?.label || 'المنهج السعودي'}</td>
                        <td>{s.defaultLanguage === 'en' ? 'English' : 'العربية'}</td>
                        <td style={{ fontWeight: 700, color: '#2563eb' }}>{st.adminsCount}</td>
                        <td style={{ fontWeight: 700, color: '#10b981' }}>{st.teachersCount}</td>
                        <td style={{ fontWeight: 700, color: '#8b5cf6' }}>{st.studentsCount}</td>
                        <td style={{ fontWeight: 700, color: '#f59e0b' }}>{st.staffCount}</td>
                        <td style={{ fontWeight: 700, color: '#0f172a' }}>{st.classesCount}</td>
                        <td>
                          <span style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: '6px',
                            background: s.status === 'inactive' ? '#fee2e2' : '#dcfce7',
                            color: s.status === 'inactive' ? '#991b1b' : '#166534'
                          }}>
                            {s.status === 'inactive' ? 'معطلة' : 'نشطة'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>

      {/* MODAL: ADD / EDIT SCHOOL */}
      {showSchoolModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(5px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px'
        }}>
          <div 
            className="glass-panel"
            style={{
              background: '#ffffff',
              width: '720px',
              maxWidth: '100%',
              maxHeight: '92vh',
              overflowY: 'auto',
              borderRadius: '20px',
              padding: '28px',
              position: 'relative',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              direction: 'rtl'
            }}
          >
            <h2 style={{ margin: '0 0 18px 0', fontSize: '20px', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Building2 size={24} color="#0e7490" />
              <span>{editingSchoolId ? 'تعديل بيانات المدرسة / المجمع' : 'إضافة مدرسة / مجمع تعليمي جديد'}</span>
            </h2>

            {schoolFormMsg.text && (
              <div style={{
                padding: '12px',
                borderRadius: '8px',
                marginBottom: '16px',
                background: schoolFormMsg.type === 'success' ? '#dcfce7' : '#fee2e2',
                color: schoolFormMsg.type === 'success' ? '#166534' : '#991b1b',
                fontSize: '13px'
              }}>
                {schoolFormMsg.text}
              </div>
            )}

            <form onSubmit={handleSaveSchool} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: 700, fontSize: '13px' }}>
                    اسم المدرسة / المجمع التعليمي <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="مثال: مدارس النور الأهلية، مدارس الفرسان العالمية..."
                    value={schoolName}
                    onChange={e => setSchoolName(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: 700, fontSize: '13px' }}>
                    معرف المدرسة (School Code / ID) <span style={{ fontSize: '11px', color: '#64748b' }}>(اختياري)</span>
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="مثال: al_noor_school_1"
                    value={schoolCustomId}
                    onChange={e => setSchoolCustomId(e.target.value)}
                    disabled={!!editingSchoolId}
                    dir="ltr"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: 700, fontSize: '13px' }}>
                    نوع المنهج الدراسي المعتمد <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <select
                    className="input-field"
                    value={schoolCurriculum}
                    onChange={e => setSchoolCurriculum(e.target.value)}
                    required
                  >
                    {CURRICULUM_OPTIONS.map(c => (
                      <option key={c.id} value={c.id}>{c.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: 700, fontSize: '13px' }}>
                    لغة واجهة النظام الافتراضية
                  </label>
                  <select
                    className="input-field"
                    value={schoolDefaultLang}
                    onChange={e => setSchoolDefaultLang(e.target.value)}
                  >
                    <option value="ar">العربية (Arabic - RTL)</option>
                    <option value="en">English (الإنجليزية - LTR)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: 700, fontSize: '13px' }}>
                    المدينة / الإدارة التعليمية
                  </label>
                  <select
                    className="input-field"
                    value={schoolCity}
                    onChange={e => setSchoolCity(e.target.value)}
                  >
                    {CITIES_LIST.map(city => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: 700, fontSize: '13px' }}>
                    حالة المدرسة
                  </label>
                  <select
                    className="input-field"
                    value={schoolStatus}
                    onChange={e => setSchoolStatus(e.target.value)}
                  >
                    <option value="active">نشطة (Active)</option>
                    <option value="inactive">معطلة مؤقتاً (Inactive)</option>
                  </select>
                </div>
              </div>

              {/* Logo Upload */}
              <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 700, fontSize: '13px' }}>
                  شعار المدرسة الخاص (Logo)
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                  <div style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '12px',
                    background: '#ffffff',
                    border: '1px solid #cbd5e1',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden'
                  }}>
                    {schoolLogoBase64 ? (
                      <img src={schoolLogoBase64} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    ) : (
                      <ImageIcon size={28} color="#94a3b8" />
                    )}
                  </div>

                  <div style={{ flex: 1 }}>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      style={{ fontSize: '13px' }}
                    />
                    <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                      يدعم صور PNG, JPG, WebP بحجم أقصى 1.5 ميجابايت.
                    </div>
                  </div>

                  {schoolLogoBase64 && (
                    <button
                      type="button"
                      onClick={() => setSchoolLogoBase64('')}
                      className="btn-icon delete"
                      title="حذف الشعار"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>

              {/* Contact Information */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600, fontSize: '12px' }}>اسم مدير المجمع</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="مثال: أ. محمد العتيبي"
                    value={schoolPrincipal}
                    onChange={e => setSchoolPrincipal(e.target.value)}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600, fontSize: '12px' }}>هاتف المدرسة</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="011xxxxxxx / 05xxxxxxxx"
                    value={schoolPhone}
                    onChange={e => setSchoolPhone(e.target.value)}
                    dir="ltr"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600, fontSize: '12px' }}>البريد الإلكتروني</label>
                  <input
                    type="email"
                    className="input-field"
                    placeholder="info@school.edu.sa"
                    value={schoolEmail}
                    onChange={e => setSchoolEmail(e.target.value)}
                    dir="ltr"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowSchoolModal(false)}
                  className="btn btn-outline"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isSavingSchool}
                  style={{ minWidth: '140px' }}
                >
                  {isSavingSchool ? 'جاري الحفظ...' : (editingSchoolId ? 'حفظ التعديلات' : 'إضافة المدرسة')}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD / EDIT SCHOOL ADMIN */}
      {showAdminModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(5px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px'
        }}>
          <div 
            className="glass-panel"
            style={{
              background: '#ffffff',
              width: '560px',
              maxWidth: '100%',
              borderRadius: '20px',
              padding: '28px',
              position: 'relative',
              direction: 'rtl'
            }}
          >
            <h2 style={{ margin: '0 0 18px 0', fontSize: '20px', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <UserPlus size={24} color="#0e7490" />
              <span>{editingAdminId ? 'تعديل بيانات المدير' : 'إنشاء حساب مدير مدرسة جديد'}</span>
            </h2>

            {adminFormMsg.text && (
              <div style={{
                padding: '12px',
                borderRadius: '8px',
                marginBottom: '16px',
                background: adminFormMsg.type === 'success' ? '#dcfce7' : '#fee2e2',
                color: adminFormMsg.type === 'success' ? '#166534' : '#991b1b',
                fontSize: '13px'
              }}>
                {adminFormMsg.text}
              </div>
            )}

            <form onSubmit={handleSaveAdmin} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 700, fontSize: '13px' }}>
                  اسم المدير الكامل <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="مثال: أ. عبدالله المنصور"
                  value={adminName}
                  onChange={e => setAdminName(e.target.value)}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 700, fontSize: '13px' }}>
                  رقم الهوية الوطنية / اسم الدخول <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="10 أرقام أو بريد إلكتروني"
                  value={adminNationalId}
                  onChange={e => setAdminNationalId(e.target.value)}
                  required
                  dir="ltr"
                />
              </div>

              {!editingAdminId && (
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: 700, fontSize: '13px' }}>
                    كلمة المرور <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="password"
                    className="input-field"
                    placeholder="••••••••"
                    value={adminPassword}
                    onChange={e => setAdminPassword(e.target.value)}
                    required
                    dir="ltr"
                  />
                </div>
              )}

              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 700, fontSize: '13px' }}>
                  المدرسة / المجمع التابع له المدير <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <select
                  className="input-field"
                  value={selectedSchoolId}
                  onChange={e => setSelectedSchoolId(e.target.value)}
                  required
                >
                  <option value="">-- اختر المدرسة أو المجمع --</option>
                  {schools.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.city || 'عام'})</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600, fontSize: '12px' }}>
                  رقم الجوال (اختياري)
                </label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="05xxxxxxxx"
                  value={adminPhone}
                  onChange={e => setAdminPhone(e.target.value)}
                  dir="ltr"
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowAdminModal(false)}
                  className="btn btn-outline"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isSavingAdmin}
                  style={{ minWidth: '130px' }}
                >
                  {isSavingAdmin ? 'جاري الحفظ...' : (editingAdminId ? 'تحديث البيانات' : 'إنشاء الحساب')}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </Layout>
  );
}
