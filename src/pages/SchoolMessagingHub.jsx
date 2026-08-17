import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, addDoc, updateDoc, doc, deleteDoc, arrayUnion, orderBy } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import {
  Mail, Send, Inbox, Paperclip, FileText, Image as ImageIcon, Download,
  Eye, Trash2, Reply, Check, CheckCheck, AlertCircle, AlertTriangle,
  Users, User, Search, Filter, Printer, X, Plus, Clock, Tag, ArrowRight,
  ShieldCheck, UserCheck, BookOpen, ChevronRight, ExternalLink
} from 'lucide-react';

const ROLE_BADGES = {
  admin: { label: 'مدير المدرسة', bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe', icon: '👑' },
  staff: { label: 'كادر إداري', bg: '#f0fdf4', color: '#166534', border: '#bbf7d0', icon: '👔' },
  supervisor: { label: 'مشرف تربوي', bg: '#faf5ff', color: '#6b21a8', border: '#e9d5ff', icon: '🌟' },
  teacher: { label: 'معلم', bg: '#f0fdfa', color: '#0f766e', border: '#99f6e4', icon: '👨‍🏫' },
  student: { label: 'طالب', bg: '#fffbeb', color: '#92400e', border: '#fde68a', icon: '🎓' }
};

const TARGET_GROUPS = [
  { id: 'all', label: '📢 تعميم عام لكافة منسوبي المدرسة', desc: 'يصل للمدير والمعلمين والطلاب والكادر والمشرفين' },
  { id: 'teachers', label: '👨‍🏫 كافة المعلمين والمعلمات', desc: 'يصل لجميع معلمي المدرسة' },
  { id: 'students', label: '🎓 كافة الطلاب والطالبات', desc: 'يصل لجميع طلاب المدرسة' },
  { id: 'class', label: '🏫 طلاب فصل دراسي محدد', desc: 'تحديد فصل معين لإرسال التوجيهات أو الواجبات' },
  { id: 'staff', label: '👔 كافة أعضاء الكادر الإداري والوكلاء', desc: 'يصل للوكلاء والإداريين والمشرفين الإداريين' },
  { id: 'supervisors', label: '🌟 كافة المشرفين التربويين', desc: 'يصل للمشرفين التعليميين' }
];

export default function SchoolMessagingHub() {
  const { userData, currentUser, userRole } = useAuth();
  const { t } = useLanguage();

  const [activeTab, setActiveTab] = useState('inbox'); // 'inbox' | 'sent' | 'compose'
  const [messages, setMessages] = useState([]);
  const [selectedMessage, setSelectedMessage] = useState(null);
  
  // Directories for recipient selection
  const [teachersList, setTeachersList] = useState([]);
  const [studentsList, setStudentsList] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [supervisorsList, setSupervisorsList] = useState([]);
  const [classesList, setClassesList] = useState([]);

  // Search and Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all' | 'unread' | 'individual' | 'group' | 'urgent'

  // Composer Form State
  const [messageType, setMessageType] = useState('individual'); // 'individual' | 'group'
  const [targetGroup, setTargetGroup] = useState('all');
  const [targetClassName, setTargetClassName] = useState('');
  const [recipientNid, setRecipientNid] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [priority, setPriority] = useState('normal'); // 'normal' | 'important' | 'urgent'
  const [attachment, setAttachment] = useState(null); // { name, type: 'image' | 'pdf', size, dataUrl }
  const [isSending, setIsSending] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);

  // Lightbox for attachment
  const [previewAttachment, setPreviewAttachment] = useState(null);

  const schoolId = userData?.schoolId || 'main_school';
  const myNid = (userData?.nationalId || currentUser?.email?.replace('@school.local', '') || currentUser?.uid || '').trim();
  const myName = userData?.name || 'مستخدم النظام';
  const myRole = userRole || userData?.role || 'student';
  const myRoleTitle = userData?.roleTitle || ROLE_BADGES[myRole]?.label || myRole;
  const myClass = (userData?.class || userData?.className || '')?.trim();

  // Load Recipients Directory
  useEffect(() => {
    if (!schoolId) return;

    const unsubTeachers = onSnapshot(query(collection(db, 'teachers'), where('schoolId', '==', schoolId)), snap => {
      setTeachersList(snap.docs.map(d => ({ id: d.id, ...d.data(), role: 'teacher' })));
    });

    const unsubStudents = onSnapshot(query(collection(db, 'students'), where('schoolId', '==', schoolId)), snap => {
      setStudentsList(snap.docs.map(d => ({ id: d.id, ...d.data(), role: 'student' })));
    });

    const unsubStaff = onSnapshot(query(collection(db, 'staff'), where('schoolId', '==', schoolId)), snap => {
      setStaffList(snap.docs.map(d => ({ id: d.id, ...d.data(), role: 'staff' })));
    });

    const unsubSupervisors = onSnapshot(query(collection(db, 'supervisors'), where('schoolId', '==', schoolId)), snap => {
      setSupervisorsList(snap.docs.map(d => ({ id: d.id, ...d.data(), role: 'supervisor' })));
    });

    const unsubClasses = onSnapshot(query(collection(db, 'classes'), where('schoolId', '==', schoolId)), snap => {
      const cls = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setClassesList(cls);
      if (cls.length > 0 && !targetClassName) {
        setTargetClassName(cls[0].name);
      }
    });

    return () => {
      unsubTeachers();
      unsubStudents();
      unsubStaff();
      unsubSupervisors();
      unsubClasses();
    };
  }, [schoolId]);

  // Load All Messages
  useEffect(() => {
    if (!schoolId) return;

    const q = query(collection(db, 'school_messages'), where('schoolId', '==', schoolId));
    const unsub = onSnapshot(q, snap => {
      const msgs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      // Sort newest first
      msgs.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      setMessages(msgs);
    });

    return () => unsub();
  }, [schoolId]);

  // Determine if a message is received by current user
  const isMessageForMe = (msg) => {
    if (msg.senderNationalId === myNid && msg.messageType === 'individual') {
      return false; // I am the sender of this private message
    }
    if (msg.messageType === 'individual') {
      return msg.receiverNationalId === myNid || msg.receiverId === currentUser?.uid;
    }
    if (msg.messageType === 'group') {
      if (msg.targetGroup === 'all') return true;
      if (msg.targetGroup === 'teachers' && myRole === 'teacher') return true;
      if (msg.targetGroup === 'students' && myRole === 'student') return true;
      if (msg.targetGroup === 'class' && myRole === 'student' && myClass && msg.targetClassName?.trim() === myClass) return true;
      if (msg.targetGroup === 'staff' && (myRole === 'staff' || myRole === 'admin')) return true;
      if (msg.targetGroup === 'supervisors' && myRole === 'supervisor') return true;
    }
    return false;
  };

  // Inbox Messages
  const inboxMessages = useMemo(() => {
    return messages.filter(m => isMessageForMe(m));
  }, [messages, myNid, myRole, myClass, currentUser]);

  // Sent Messages
  const sentMessages = useMemo(() => {
    return messages.filter(m => m.senderNationalId === myNid || m.senderId === currentUser?.uid);
  }, [messages, myNid, currentUser]);

  // Unread Count
  const unreadCount = useMemo(() => {
    return inboxMessages.filter(m => !m.readBy || !m.readBy.includes(myNid)).length;
  }, [inboxMessages, myNid]);

  // Filtered List based on Search & Filter
  const currentTabList = activeTab === 'inbox' ? inboxMessages : sentMessages;

  const displayedMessages = useMemo(() => {
    return currentTabList.filter(m => {
      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchSubj = m.subject?.toLowerCase().includes(q);
        const matchBody = m.body?.toLowerCase().includes(q);
        const matchSender = m.senderName?.toLowerCase().includes(q);
        const matchReceiver = m.receiverName?.toLowerCase().includes(q);
        if (!matchSubj && !matchBody && !matchSender && !matchReceiver) return false;
      }

      // Filter category
      if (filterType === 'unread') {
        if (m.readBy && m.readBy.includes(myNid)) return false;
      } else if (filterType === 'individual') {
        if (m.messageType !== 'individual') return false;
      } else if (filterType === 'group') {
        if (m.messageType !== 'group') return false;
      } else if (filterType === 'urgent') {
        if (m.priority !== 'urgent') return false;
      }

      return true;
    });
  }, [currentTabList, searchQuery, filterType, myNid]);

  // Handle Mark as Read when opening message
  const handleSelectMessage = async (msg) => {
    setSelectedMessage(msg);
    if (activeTab === 'inbox' && (!msg.readBy || !msg.readBy.includes(myNid))) {
      try {
        await updateDoc(doc(db, 'school_messages', msg.id), {
          readBy: arrayUnion(myNid)
        });
      } catch (err) {
        console.error('Error marking as read:', err);
      }
    }
  };

  // Handle File Attachment Upload
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit: 3MB
    if (file.size > 3 * 1024 * 1024) {
      alert('حجم الملف المرفق يجب ألا يتجاوز 3 ميجابايت لضمان سرعة الإرسال والتصفح.');
      return;
    }

    const isImage = file.type.startsWith('image/');
    const isPdf = file.type === 'application/pdf';

    if (!isImage && !isPdf) {
      alert('عذراً، يرجى اختيار ملف صورة (JPG / PNG / WEBP) أو مستند PDF فقط.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      setAttachment({
        name: file.name,
        type: isImage ? 'image' : 'pdf',
        mimeType: file.type,
        size: file.size,
        dataUrl: uploadEvent.target.result
      });
    };
    reader.readAsDataURL(file);
  };

  // Handle Reply to message
  const handleStartReply = (msg) => {
    setReplyingTo(msg);
    setMessageType('individual');
    setRecipientNid(msg.senderNationalId);
    setSubject(`رد على: ${msg.subject || 'الرسالة'}`);
    setBody(`\n\n--- رداً على رسالة الأستاذ/الطالب: ${msg.senderName} ---\n> ${msg.body?.slice(0, 100)}...`);
    setActiveTab('compose');
    setSelectedMessage(null);
  };

  // Send Message Handler
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!subject.trim() || !body.trim()) {
      alert('يرجى ملء موضوع ونص الرسالة.');
      return;
    }

    let recData = null;
    if (messageType === 'individual') {
      if (!recipientNid) {
        alert('يرجى اختيار المستلم من القائمة.');
        return;
      }
      // Find recipient in lists
      const allUsers = [...teachersList, ...studentsList, ...staffList, ...supervisorsList];
      const targetUser = allUsers.find(u => u.nationalId === recipientNid || u.id === recipientNid);
      if (targetUser) {
        recData = {
          receiverId: targetUser.id,
          receiverNationalId: targetUser.nationalId || targetUser.id,
          receiverName: targetUser.name,
          receiverRole: targetUser.role || 'user',
          receiverRoleTitle: targetUser.roleTitle || ROLE_BADGES[targetUser.role]?.label || targetUser.role
        };
      } else {
        recData = {
          receiverId: recipientNid,
          receiverNationalId: recipientNid,
          receiverName: 'المستلم المحدد',
          receiverRole: 'user',
          receiverRoleTitle: 'مستلم'
        };
      }
    }

    setIsSending(true);
    try {
      const payload = {
        schoolId,
        senderId: currentUser?.uid || myNid,
        senderNationalId: myNid,
        senderName: myName,
        senderRole: myRole,
        senderRoleTitle: myRoleTitle,
        messageType, // 'individual' | 'group'
        subject: subject.trim(),
        body: body.trim(),
        priority, // 'normal' | 'important' | 'urgent'
        attachment: attachment || null,
        readBy: [myNid], // Sender has read it
        createdAt: new Date().toISOString(),
        replyToId: replyingTo ? replyingTo.id : null
      };

      if (messageType === 'individual' && recData) {
        Object.assign(payload, recData);
      } else {
        payload.targetGroup = targetGroup;
        payload.targetClassName = targetGroup === 'class' ? targetClassName : '';
      }

      await addDoc(collection(db, 'school_messages'), payload);

      // Reset form
      setSubject('');
      setBody('');
      setAttachment(null);
      setRecipientNid('');
      setReplyingTo(null);
      setActiveTab('sent');
      alert('✓ تم إرسال الرسالة / التعميم بنجاح.');
    } catch (err) {
      console.error('Error sending message:', err);
      alert('حدث خطأ أثناء إرسال الرسالة، يرجى المحاولة مرة أخرى.');
    } finally {
      setIsSending(false);
    }
  };

  // Delete message
  const handleDeleteMessage = async (msgId) => {
    if (!window.confirm('هل أنت متأكد من حذف هذه الرسالة نهائياً؟')) return;
    try {
      await deleteDoc(doc(db, 'school_messages', msgId));
      if (selectedMessage?.id === msgId) {
        setSelectedMessage(null);
      }
    } catch (err) {
      console.error('Error deleting message:', err);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Header Bar */}
      <div className="glass-panel" style={{
        padding: '20px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, #0e7490, #63B2C6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            boxShadow: '0 4px 12px rgba(14, 116, 144, 0.25)'
          }}>
            <Mail size={26} />
          </div>
          <div>
            <h2 style={{ margin: '0 0 4px 0', color: 'var(--color-primary-dark)', fontSize: '20px' }}>
              نظام المراسلات والتعاميم المدرسية
            </h2>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--color-text-muted)' }}>
              تواصل داخلي فوري وفردي وجماعي بين الإدارة، المعلمين، الطلاب، الكادر، والمشرفين
            </p>
          </div>
        </div>

        {/* Action / Compose Button */}
        <button
          onClick={() => {
            setReplyingTo(null);
            setSubject('');
            setBody('');
            setAttachment(null);
            setRecipientNid('');
            setActiveTab('compose');
            setSelectedMessage(null);
          }}
          className="btn btn-primary"
          style={{
            background: 'linear-gradient(135deg, #0e7490, #63B2C6)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 20px',
            fontWeight: 'bold',
            fontSize: '14px',
            borderRadius: '10px',
            boxShadow: '0 4px 14px rgba(14, 116, 144, 0.3)'
          }}
        >
          <Plus size={18} /> إنشاء رسالة / تعميم جديد
        </button>
      </div>

      {/* Main Grid Container */}
      <div style={{ display: 'grid', gridTemplateColumns: selectedMessage ? '1fr 1.2fr' : '1fr', gap: '20px', alignItems: 'start' }}>
        
        {/* Left Column: Tabs & Messages List (or Compose Form) */}
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Navigation Tabs */}
          <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
            <button
              onClick={() => { setActiveTab('inbox'); setSelectedMessage(null); }}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: 'none',
                background: activeTab === 'inbox' ? '#0e7490' : '#f1f5f9',
                color: activeTab === 'inbox' ? 'white' : '#475569',
                fontWeight: 'bold',
                fontSize: '13px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s'
              }}
            >
              <Inbox size={16} /> البريد الوارد
              {unreadCount > 0 && (
                <span style={{
                  background: '#ef4444',
                  color: 'white',
                  fontSize: '11px',
                  padding: '2px 7px',
                  borderRadius: '10px',
                  fontWeight: '900'
                }}>
                  {unreadCount}
                </span>
              )}
            </button>

            <button
              onClick={() => { setActiveTab('sent'); setSelectedMessage(null); }}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: 'none',
                background: activeTab === 'sent' ? '#0e7490' : '#f1f5f9',
                color: activeTab === 'sent' ? 'white' : '#475569',
                fontWeight: 'bold',
                fontSize: '13px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s'
              }}
            >
              <Send size={16} /> البريد الصادر ({sentMessages.length})
            </button>

            <button
              onClick={() => { setActiveTab('compose'); setSelectedMessage(null); }}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: 'none',
                background: activeTab === 'compose' ? '#0e7490' : '#f1f5f9',
                color: activeTab === 'compose' ? 'white' : '#475569',
                fontWeight: 'bold',
                fontSize: '13px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s'
              }}
            >
              <Plus size={16} /> كتابة رسالة
            </button>
          </div>

          {/* ========================================================================= */}
          {/* TAB 1 & 2: INBOX / SENT MESSAGES LIST                                    */}
          {/* ========================================================================= */}
          {activeTab !== 'compose' && (
            <>
              {/* Search & Filter Toolbar */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ position: 'relative' }}>
                  <Search size={18} color="#94a3b8" style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="text"
                    className="input-field"
                    placeholder="البحث في موضوع الرسالة، النص، أو اسم المرسل/المستلم..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    style={{ paddingRight: '38px', marginBottom: 0, fontSize: '13px' }}
                  />
                </div>

                {/* Filter Badges */}
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 'bold' }}>تصفية:</span>
                  {[
                    { id: 'all', label: 'الكل' },
                    { id: 'unread', label: 'غير مقروء 📩' },
                    { id: 'individual', label: 'فردي 👤' },
                    { id: 'group', label: 'تعميم جماعي 📢' },
                    { id: 'urgent', label: 'عاجل 🔴' }
                  ].map(f => (
                    <button
                      key={f.id}
                      onClick={() => setFilterType(f.id)}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        border: filterType === f.id ? '1px solid #0e7490' : '1px solid #e2e8f0',
                        background: filterType === f.id ? 'rgba(14, 116, 144, 0.12)' : 'white',
                        color: filterType === f.id ? '#0e7490' : '#64748b'
                      }}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Messages Feed */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '600px', overflowY: 'auto' }}>
                {displayedMessages.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8' }}>
                    <Mail size={40} style={{ opacity: 0.3, marginBottom: '8px' }} />
                    <p style={{ margin: 0, fontSize: '14px' }}>لا توجد رسائل مطابقة لعرضها حالياً</p>
                  </div>
                ) : (
                  displayedMessages.map(msg => {
                    const isUnread = activeTab === 'inbox' && (!msg.readBy || !msg.readBy.includes(myNid));
                    const isSelected = selectedMessage?.id === msg.id;
                    const senderRoleBadge = ROLE_BADGES[msg.senderRole] || ROLE_BADGES.student;

                    return (
                      <div
                        key={msg.id}
                        onClick={() => handleSelectMessage(msg)}
                        style={{
                          padding: '14px 16px',
                          borderRadius: '12px',
                          border: isSelected ? '2px solid #0e7490' : isUnread ? '1.5px solid #38bdf8' : '1px solid #e2e8f0',
                          background: isSelected ? '#f0fdf4' : isUnread ? '#f8fafc' : 'white',
                          cursor: 'pointer',
                          transition: 'all 0.15s',
                          boxShadow: isUnread ? '0 2px 6px rgba(56, 189, 248, 0.15)' : 'none',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '8px'
                        }}
                      >
                        {/* Top Line: Sender, Date, Badges */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{
                              fontSize: '11px',
                              fontWeight: 'bold',
                              background: senderRoleBadge.bg,
                              color: senderRoleBadge.color,
                              border: `1px solid ${senderRoleBadge.border}`,
                              padding: '2px 8px',
                              borderRadius: '8px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}>
                              {senderRoleBadge.icon} {msg.senderRoleTitle || senderRoleBadge.label}
                            </span>
                            
                            <span style={{ fontWeight: isUnread ? '800' : '600', color: '#0f172a', fontSize: '14px' }}>
                              {activeTab === 'inbox' ? msg.senderName : `إلى: ${msg.messageType === 'individual' ? msg.receiverName : 'تعميم جماعي'}`}
                            </span>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {msg.priority === 'urgent' && (
                              <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#dc2626', background: '#fef2f2', border: '1px solid #fecaca', padding: '1px 6px', borderRadius: '6px' }}>
                                🔴 عاجل
                              </span>
                            )}
                            {msg.priority === 'important' && (
                              <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#d97706', background: '#fffbeb', border: '1px solid #fde68a', padding: '1px 6px', borderRadius: '6px' }}>
                                🟡 هام
                              </span>
                            )}

                            <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                              {new Date(msg.createdAt).toLocaleDateString('ar-SA')}
                            </span>
                          </div>
                        </div>

                        {/* Subject & Body Snippet */}
                        <div>
                          <div style={{
                            fontWeight: isUnread ? '800' : '700',
                            fontSize: '14px',
                            color: '#0e7490',
                            marginBottom: '3px'
                          }}>
                            {msg.subject}
                          </div>
                          <div style={{
                            fontSize: '12px',
                            color: '#64748b',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}>
                            {msg.body}
                          </div>
                        </div>

                        {/* Footer details: Group label / Attachment */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '4px', borderTop: '1px dashed #f1f5f9' }}>
                          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                            {msg.messageType === 'group' ? (
                              <span style={{ fontSize: '11px', color: '#0369a1', background: '#e0f2fe', padding: '2px 6px', borderRadius: '6px', fontWeight: 'bold' }}>
                                📢 {msg.targetGroup === 'class' ? `فصل: ${msg.targetClassName}` : TARGET_GROUPS.find(g => g.id === msg.targetGroup)?.label || 'تعميم'}
                              </span>
                            ) : (
                              <span style={{ fontSize: '11px', color: '#475569' }}>
                                👤 رسالة خاصة
                              </span>
                            )}
                          </div>

                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            {msg.attachment && (
                              <span style={{ fontSize: '11px', color: '#0e7490', display: 'flex', alignItems: 'center', gap: '3px', fontWeight: '600' }}>
                                <Paperclip size={12} /> {msg.attachment.type === 'pdf' ? 'ملف PDF' : 'صورة مرفقة'}
                              </span>
                            )}
                            {isUnread && (
                              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#0284c7' }}></span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: COMPOSE NEW MESSAGE / BROADCAST                                    */}
          {/* ========================================================================= */}
          {activeTab === 'compose' && (
            <form onSubmit={handleSendMessage} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {/* Type Switcher: Individual vs Group */}
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#0f172a', fontSize: '13px' }}>
                  نوع المراسلة:
                </label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setMessageType('individual')}
                    style={{
                      flex: 1,
                      padding: '10px',
                      borderRadius: '10px',
                      border: messageType === 'individual' ? '2px solid #0e7490' : '1px solid #cbd5e1',
                      background: messageType === 'individual' ? '#0e7490' : 'white',
                      color: messageType === 'individual' ? 'white' : '#334155',
                      fontWeight: 'bold',
                      fontSize: '13px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }}
                  >
                    <User size={16} /> مراسلة فردية لشخص محدد
                  </button>

                  <button
                    type="button"
                    onClick={() => setMessageType('group')}
                    style={{
                      flex: 1,
                      padding: '10px',
                      borderRadius: '10px',
                      border: messageType === 'group' ? '2px solid #0e7490' : '1px solid #cbd5e1',
                      background: messageType === 'group' ? '#0e7490' : 'white',
                      color: messageType === 'group' ? 'white' : '#334155',
                      fontWeight: 'bold',
                      fontSize: '13px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }}
                  >
                    <Users size={16} /> تعميم جماعي / لفئة محددة
                  </button>
                </div>
              </div>

              {/* Recipient Selection (Individual Mode) */}
              {messageType === 'individual' && (
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: 'bold', color: '#0f172a', fontSize: '13px' }}>
                    اختر المستلم (معلم / طالب / كادر / مشرف):
                  </label>
                  <select
                    className="input-field"
                    value={recipientNid}
                    onChange={e => setRecipientNid(e.target.value)}
                    required
                  >
                    <option value="">-- اضغط لاختيار الشخص المستهدف --</option>
                    <optgroup label="👑 الإدارة والكادر الإداري">
                      {staffList.map(s => (
                        <option key={s.id} value={s.nationalId || s.id}>
                          {s.name} ({s.roleTitle || 'عضو كادر'}) - هوية: {s.nationalId}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="👨‍🏫 المعلمون">
                      {teachersList.map(t => (
                        <option key={t.id} value={t.nationalId || t.id}>
                          {t.name} ({t.subject || 'معلم'}) - هوية: {t.nationalId}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="🌟 المشرفون التربويون">
                      {supervisorsList.map(sup => (
                        <option key={sup.id} value={sup.nationalId || sup.id}>
                          {sup.name} ({sup.specialty || 'مشرف تربوي'})
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="🎓 الطلاب والطالبات">
                      {studentsList.map(st => (
                        <option key={st.id} value={st.nationalId || st.id}>
                          {st.name} ({st.class || st.className || 'طالب'}) - هوية: {st.nationalId}
                        </option>
                      ))}
                    </optgroup>
                  </select>
                </div>
              )}

              {/* Target Group Selection (Group Mode) */}
              {messageType === 'group' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <label style={{ fontWeight: 'bold', color: '#0f172a', fontSize: '13px' }}>
                    الفئة المستهدفة بالتعميم:
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px' }}>
                    {TARGET_GROUPS.map(g => (
                      <div
                        key={g.id}
                        onClick={() => setTargetGroup(g.id)}
                        style={{
                          padding: '10px 12px',
                          borderRadius: '8px',
                          border: targetGroup === g.id ? '2px solid #0e7490' : '1px solid #cbd5e1',
                          background: targetGroup === g.id ? '#f0fdf4' : 'white',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '2px'
                        }}
                      >
                        <span style={{ fontWeight: 'bold', fontSize: '13px', color: targetGroup === g.id ? '#0e7490' : '#334155' }}>
                          {g.label}
                        </span>
                        <span style={{ fontSize: '11px', color: '#64748b' }}>
                          {g.desc}
                        </span>
                      </div>
                    ))}
                  </div>

                  {targetGroup === 'class' && (
                    <div style={{ marginTop: '8px' }}>
                      <label style={{ display: 'block', marginBottom: '6px', fontWeight: 'bold', color: '#0f172a', fontSize: '13px' }}>
                        اختر الفصل الدراسي المستهدف:
                      </label>
                      <select
                        className="input-field"
                        value={targetClassName}
                        onChange={e => setTargetClassName(e.target.value)}
                        required
                      >
                        {classesList.map(c => (
                          <option key={c.id} value={c.name}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              )}

              {/* Subject & Priority */}
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: '220px' }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: 'bold', color: '#0f172a', fontSize: '13px' }}>
                    موضوع الرسالة / التعميم:
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    value={subject}
                    onChange={e => setSubject(e.target.value)}
                    placeholder="مثال: موعد تسليم تقرير الأداء، تعميم الاختبارات، توجيه خاص..."
                    required
                  />
                </div>

                <div style={{ width: '150px' }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: 'bold', color: '#0f172a', fontSize: '13px' }}>
                    درجة الأهمية:
                  </label>
                  <select
                    className="input-field"
                    value={priority}
                    onChange={e => setPriority(e.target.value)}
                  >
                    <option value="normal">🔵 عادي</option>
                    <option value="important">🟡 هام</option>
                    <option value="urgent">🔴 عاجل جداً</option>
                  </select>
                </div>
              </div>

              {/* Body Text */}
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 'bold', color: '#0f172a', fontSize: '13px' }}>
                  نص الرسالة / التعميم:
                </label>
                <textarea
                  className="input-field"
                  rows={6}
                  value={body}
                  onChange={e => setBody(e.target.value)}
                  placeholder="اكتب تفاصيل ومحتوى الرسالة هنا..."
                  style={{ resize: 'vertical' }}
                  required
                />
              </div>

              {/* File Attachment: Image or PDF */}
              <div style={{
                padding: '14px',
                border: '1.5px dashed #cbd5e1',
                borderRadius: '10px',
                background: '#f8fafc'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label style={{ fontWeight: 'bold', color: '#0f172a', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Paperclip size={16} color="#0e7490" /> إرفاق صورة أو مستند PDF (اختياري):
                  </label>
                  <span style={{ fontSize: '11px', color: '#64748b' }}>الحد الأقصى: 3MB</span>
                </div>

                {!attachment ? (
                  <div>
                    <input
                      type="file"
                      id="msg-attachment-input"
                      accept="image/*,.pdf,application/pdf"
                      onChange={handleFileUpload}
                      style={{ display: 'none' }}
                    />
                    <label
                      htmlFor="msg-attachment-input"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '8px 16px',
                        background: 'white',
                        border: '1px solid #cbd5e1',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: 'bold',
                        color: '#0e7490'
                      }}
                    >
                      <Plus size={16} /> اختر صورة أو ملف PDF
                    </label>
                  </div>
                ) : (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: 'white',
                    padding: '8px 14px',
                    borderRadius: '8px',
                    border: '1px solid #bbf7d0'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {attachment.type === 'image' ? (
                        <img src={attachment.dataUrl} alt="Preview" style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '6px' }} />
                      ) : (
                        <FileText size={32} color="#dc2626" />
                      )}
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#0f172a' }}>{attachment.name}</div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>
                          {attachment.type === 'pdf' ? 'مستند PDF' : 'صورة'} • {(attachment.size / 1024).toFixed(1)} KB
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setAttachment(null)}
                      style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}
                      title="إزالة المرفق"
                    >
                      <X size={18} />
                    </button>
                  </div>
                )}
              </div>

              {/* Submit Buttons */}
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => { setActiveTab('inbox'); setReplyingTo(null); }}
                  className="btn btn-secondary"
                  disabled={isSending}
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isSending}
                  style={{
                    background: 'linear-gradient(135deg, #0e7490, #63B2C6)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 24px',
                    fontWeight: 'bold'
                  }}
                >
                  <Send size={18} /> {isSending ? 'جاري الإرسال...' : 'إرسال الرسالة / اعتماد التعميم'}
                </button>
              </div>
            </form>
          )}

        </div>

        {/* Right Column: Message Detail Viewer (when a message is selected) */}
        {selectedMessage && (
          <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative' }}>
            
            {/* Close detail viewer */}
            <button
              onClick={() => setSelectedMessage(null)}
              style={{ position: 'absolute', top: '16px', left: '16px', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              <X size={20} color="#64748b" />
            </button>

            {/* Header / Letterhead formatting */}
            <div style={{ borderBottom: '2px solid #0e7490', paddingBottom: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <span style={{
                    fontSize: '11px',
                    fontWeight: 'bold',
                    background: ROLE_BADGES[selectedMessage.senderRole]?.bg || '#f1f5f9',
                    color: ROLE_BADGES[selectedMessage.senderRole]?.color || '#0f172a',
                    border: `1px solid ${ROLE_BADGES[selectedMessage.senderRole]?.border || '#cbd5e1'}`,
                    padding: '2px 8px',
                    borderRadius: '8px',
                    display: 'inline-block',
                    marginBottom: '4px'
                  }}>
                    {ROLE_BADGES[selectedMessage.senderRole]?.icon} {selectedMessage.senderRoleTitle || 'مرسل'}
                  </span>
                  <h3 style={{ margin: '0 0 2px 0', color: '#0f172a', fontSize: '18px' }}>
                    {selectedMessage.subject}
                  </h3>
                  <div style={{ fontSize: '13px', color: '#475569' }}>
                    <strong>المرسل:</strong> {selectedMessage.senderName} • <strong>التاريخ:</strong> {new Date(selectedMessage.createdAt).toLocaleString('ar-SA')}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  {selectedMessage.priority === 'urgent' && (
                    <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#dc2626', background: '#fef2f2', border: '1px solid #fecaca', padding: '2px 8px', borderRadius: '8px' }}>
                      🔴 عاجل جداً
                    </span>
                  )}
                  {selectedMessage.priority === 'important' && (
                    <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#d97706', background: '#fffbeb', border: '1px solid #fde68a', padding: '2px 8px', borderRadius: '8px' }}>
                      🟡 هام
                    </span>
                  )}
                </div>
              </div>

              {/* Target / Recipient details */}
              <div style={{ marginTop: '10px', fontSize: '12px', color: '#64748b', background: '#f8fafc', padding: '6px 12px', borderRadius: '6px' }}>
                {selectedMessage.messageType === 'individual' ? (
                  <span><strong>المستلم الموجه له:</strong> {selectedMessage.receiverName} ({selectedMessage.receiverRoleTitle || 'مستلم'})</span>
                ) : (
                  <span><strong>الفئة المستهدفة:</strong> 📢 {selectedMessage.targetGroup === 'class' ? `طلاب فصل: ${selectedMessage.targetClassName}` : TARGET_GROUPS.find(g => g.id === selectedMessage.targetGroup)?.label || 'تعميم عام'}</span>
                )}
              </div>
            </div>

            {/* Message Body Content */}
            <div style={{
              padding: '16px',
              background: '#f8fafc',
              borderRadius: '10px',
              border: '1px solid #e2e8f0',
              fontSize: '14px',
              lineHeight: '1.8',
              color: '#1e293b',
              whiteSpace: 'pre-wrap',
              minHeight: '140px'
            }}>
              {selectedMessage.body}
            </div>

            {/* Attachment Viewer / Download */}
            {selectedMessage.attachment && (
              <div style={{
                padding: '14px',
                border: '1px solid #cbd5e1',
                borderRadius: '10px',
                background: 'white'
              }}>
                <div style={{ fontWeight: 'bold', fontSize: '13px', color: '#0e7490', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Paperclip size={16} /> الملف المرفق مع الرسالة:
                </div>

                {selectedMessage.attachment.type === 'image' ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-start' }}>
                    <img
                      src={selectedMessage.attachment.dataUrl}
                      alt={selectedMessage.attachment.name}
                      onClick={() => setPreviewAttachment(selectedMessage.attachment)}
                      style={{
                        maxWidth: '100%',
                        maxHeight: '260px',
                        objectFit: 'contain',
                        borderRadius: '8px',
                        border: '1px solid #e2e8f0',
                        cursor: 'pointer'
                      }}
                      title="اضغط للتكبير"
                    />
                    <a
                      href={selectedMessage.attachment.dataUrl}
                      download={selectedMessage.attachment.name}
                      className="btn"
                      style={{
                        background: '#f1f5f9',
                        color: '#0e7490',
                        fontSize: '12px',
                        padding: '6px 14px',
                        borderRadius: '6px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        textDecoration: 'none',
                        fontWeight: 'bold'
                      }}
                    >
                      <Download size={14} /> تحميل الصورة ({selectedMessage.attachment.name})
                    </a>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <FileText size={28} color="#dc2626" />
                      <div>
                        <div style={{ fontWeight: 'bold', fontSize: '13px', color: '#0f172a' }}>{selectedMessage.attachment.name}</div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>مستند PDF رسمي</div>
                      </div>
                    </div>

                    <a
                      href={selectedMessage.attachment.dataUrl}
                      download={selectedMessage.attachment.name}
                      className="btn"
                      style={{
                        background: '#dc2626',
                        color: 'white',
                        fontSize: '12px',
                        padding: '6px 14px',
                        borderRadius: '6px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        textDecoration: 'none',
                        fontWeight: 'bold'
                      }}
                    >
                      <Download size={14} /> تحميل ملف الـ PDF
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* Quick Actions at bottom */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px', borderTop: '1px solid #e2e8f0', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => handleStartReply(selectedMessage)}
                  className="btn btn-primary"
                  style={{
                    background: 'linear-gradient(135deg, #0e7490, #63B2C6)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '13px',
                    fontWeight: 'bold'
                  }}
                >
                  <Reply size={15} /> رد على الرسالة
                </button>

                <button
                  onClick={() => window.print()}
                  className="btn"
                  style={{
                    background: '#f1f5f9',
                    color: '#334155',
                    border: '1px solid #cbd5e1',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '13px',
                    fontWeight: 'bold',
                    padding: '8px 14px',
                    borderRadius: '8px',
                    cursor: 'pointer'
                  }}
                >
                  <Printer size={15} /> طباعة
                </button>
              </div>

              {(selectedMessage.senderNationalId === myNid || myRole === 'admin') && (
                <button
                  onClick={() => handleDeleteMessage(selectedMessage.id)}
                  style={{
                    background: '#fef2f2',
                    border: '1px solid #fecaca',
                    color: '#dc2626',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}
                >
                  <Trash2 size={15} /> حذف
                </button>
              )}
            </div>

          </div>
        )}

      </div>

      {/* Lightbox Preview Modal for Image Attachments */}
      {previewAttachment && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.85)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 3000,
          padding: '20px'
        }}>
          <div style={{ position: 'relative', maxWidth: '90vw', maxHeight: '90vh' }}>
            <button
              onClick={() => setPreviewAttachment(null)}
              style={{
                position: 'absolute',
                top: '-40px',
                right: '0',
                background: 'none',
                border: 'none',
                color: 'white',
                cursor: 'pointer'
              }}
            >
              <X size={28} />
            </button>
            <img
              src={previewAttachment.dataUrl}
              alt={previewAttachment.name}
              style={{ maxWidth: '100%', maxHeight: '85vh', objectFit: 'contain', borderRadius: '8px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)' }}
            />
          </div>
        </div>
      )}

    </div>
  );
}
