import React, { useState, useEffect } from 'react';
import { db, auth, storage } from '../firebase';
import { collection, addDoc, query, where, onSnapshot, doc, deleteDoc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { UploadCloud, Link as LinkIcon, Trash2 } from 'lucide-react';

export default function MaterialsUpload() {
  const [classesList, setClassesList] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [teacherDocId, setTeacherDocId] = useState(null);
  const [materials, setMaterials] = useState([]);
  
  // Upload states
  const [uploadType, setUploadType] = useState('file'); // 'file' or 'link'
  const [title, setTitle] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  // Fetch teacher doc ID based on nationalId
  useEffect(() => {
    if (auth.currentUser?.email) {
      const unsub = onSnapshot(query(collection(db, 'teachers')), (snap) => {
        let found = false;
        snap.docs.forEach(d => {
          if (d.data().email === auth.currentUser.email || d.data().uid === auth.currentUser.uid) {
            setTeacherDocId(d.id);
            found = true;
          }
        });
      });
      return () => unsub();
    }
  }, []);

  // Fetch classes and subjects
  useEffect(() => {
    if (!teacherDocId) return;
    const unsubClasses = onSnapshot(collection(db, 'classes'), (classesSnap) => {
      const classNames = {};
      classesSnap.docs.forEach(d => classNames[d.id] = d.data().name);
      
      const unsubSchedules = onSnapshot(collection(db, 'schedules'), (schedulesSnap) => {
        const myClassNames = new Set();
        const mySubjects = new Set();
        
        schedulesSnap.docs.forEach(docSnap => {
          const matrix = docSnap.data().matrix || {};
          let isTeaching = false;
          Object.values(matrix).forEach(cell => {
            if (cell.teacherId === teacherDocId) {
              isTeaching = true;
              if (cell.subject) mySubjects.add(cell.subject);
            }
          });
          if (isTeaching && classNames[docSnap.id]) {
            myClassNames.add(classNames[docSnap.id]);
          }
        });
        setClassesList(Array.from(myClassNames));
        setSubjects(Array.from(mySubjects));
      });
      return () => unsubSchedules();
    });
    return () => unsubClasses();
  }, [teacherDocId]);

  // Fetch materials for selected class & subject
  useEffect(() => {
    if (!teacherDocId || !selectedClass || !selectedSubject) {
      setMaterials([]);
      return;
    }
    const q = query(
      collection(db, 'materials'),
      where('teacherId', '==', teacherDocId),
      where('className', '==', selectedClass),
      where('subject', '==', selectedSubject)
    );
    const unsub = onSnapshot(q, (snapshot) => {
      const data = [];
      snapshot.forEach(doc => data.push({ id: doc.id, ...doc.data() }));
      setMaterials(data);
    });
    return () => unsub();
  }, [selectedClass, selectedSubject, teacherDocId]);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!auth.currentUser || !selectedClass || !selectedSubject) return;
    if (!title.trim()) return alert('يرجى إدخال عنوان الملخص');
    
    if (uploadType === 'link' && !linkUrl.trim()) return alert('يرجى إدخال الرابط');
    if (uploadType === 'file' && !file) return alert('يرجى اختيار ملف');

    setIsUploading(true);

    try {
      let finalUrl = linkUrl;
      
      if (uploadType === 'file') {
        const storageRef = ref(storage, `materials/${Date.now()}_${file.name}`);
        const uploadTask = uploadBytesResumable(storageRef, file);
        
        await new Promise((resolve, reject) => {
          uploadTask.on(
            'state_changed',
            (snapshot) => {
              const p = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
              setProgress(p);
            },
            (error) => reject(error),
            async () => {
              finalUrl = await getDownloadURL(uploadTask.snapshot.ref);
              resolve();
            }
          );
        });
      }

      await addDoc(collection(db, 'materials'), {
        teacherId: teacherDocId,
        teacherEmail: auth.currentUser.email,
        className: selectedClass,
        subject: selectedSubject,
        title,
        url: finalUrl,
        type: uploadType,
        fileName: file ? file.name : null,
        createdAt: new Date().toISOString()
      });

      setTitle('');
      setLinkUrl('');
      setFile(null);
      setProgress(0);
      alert('تم إضافة الملخص بنجاح!');
    } catch (error) {
      console.error("Error adding material:", error);
      alert('حدث خطأ أثناء الإضافة. تأكد من إعدادات Firebase Storage.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if(window.confirm('هل أنت متأكد من حذف هذا الملخص؟')) {
      await deleteDoc(doc(db, 'materials', id));
    }
  };

  return (
    <div className="glass-panel" style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2>الملخصات والمصادر الإضافية</h2>
      </div>

      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
        <select 
          className="input-field" 
          style={{ maxWidth: '200px' }}
          value={selectedClass} 
          onChange={(e) => setSelectedClass(e.target.value)}
        >
          <option value="">اختر الفصل...</option>
          {classesList.map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        <select 
          className="input-field" 
          style={{ maxWidth: '200px' }}
          value={selectedSubject} 
          onChange={(e) => setSelectedSubject(e.target.value)}
        >
          <option value="">اختر المادة...</option>
          {subjects.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      
      {!selectedClass || !selectedSubject ? (
        <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: '40px' }}>
          يرجى اختيار الفصل والمادة لعرض وإضافة الملخصات.
        </p>
      ) : (
        <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
          
          {/* Upload Form */}
          <div style={{ flex: '1 1 300px', background: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <h3 style={{ margin: '0 0 16px 0', color: 'var(--color-primary-dark)' }}>إضافة ملخص جديد</h3>
            <form onSubmit={handleUpload} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>نوع المصدر</label>
                <div style={{ display: 'flex', gap: '16px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input type="radio" name="type" checked={uploadType === 'file'} onChange={() => setUploadType('file')} />
                    رفع ملف
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input type="radio" name="type" checked={uploadType === 'link'} onChange={() => setUploadType('link')} />
                    رابط خارجي
                  </label>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>عنوان الملخص</label>
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="مثال: ملخص الفصل الأول" 
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  required
                />
              </div>

              {uploadType === 'file' ? (
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>اختر الملف (PDF, صور)</label>
                  <input 
                    type="file" 
                    className="input-field" 
                    onChange={e => setFile(e.target.files[0])}
                    accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                    required
                  />
                </div>
              ) : (
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>رابط المصدر (YouTube, Drive...)</label>
                  <input 
                    type="url" 
                    className="input-field" 
                    placeholder="https://..." 
                    value={linkUrl}
                    onChange={e => setLinkUrl(e.target.value)}
                    required
                  />
                </div>
              )}

              {isUploading && uploadType === 'file' && (
                <div style={{ width: '100%', background: '#e2e8f0', borderRadius: '4px', height: '8px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', background: 'var(--color-primary)', width: `${progress}%`, transition: 'width 0.3s' }}></div>
                </div>
              )}

              <button type="submit" className="btn btn-primary" disabled={isUploading}>
                {uploadType === 'file' ? <UploadCloud size={18} /> : <LinkIcon size={18} />}
                {isUploading ? 'جاري الرفع...' : 'إضافة المصدر'}
              </button>
            </form>
          </div>

          {/* List of Materials */}
          <div style={{ flex: '2 1 400px' }}>
            {materials.length === 0 ? (
              <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: '40px', background: 'white', borderRadius: '12px' }}>
                لا توجد ملخصات مضافة لهذه المادة في هذا الفصل.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {materials.map(m => (
                  <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      {m.type === 'file' ? <UploadCloud color="var(--color-primary)" /> : <LinkIcon color="var(--color-secondary)" />}
                      <div>
                        <div style={{ fontWeight: 'bold' }}>{m.title}</div>
                        {m.fileName && <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>{m.fileName}</div>}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <a href={m.url} target="_blank" rel="noopener noreferrer" className="btn btn-primary" style={{ padding: '6px 12px' }}>
                        فتح
                      </a>
                      <button className="btn btn-danger" style={{ padding: '6px 12px' }} onClick={() => handleDelete(m.id)}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
}
