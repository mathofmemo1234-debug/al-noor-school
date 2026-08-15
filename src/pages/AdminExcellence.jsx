import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, getDocs, orderBy } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { Star, FileText, Image as ImageIcon } from 'lucide-react';

export default function AdminExcellence({ schoolId }) {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState(null);

  useEffect(() => {
    if (!schoolId) return;

    // Admin sees all excellence files from teachers in their school
    const q = query(
      collection(db, 'excellence_files'),
      where('schoolId', '==', schoolId)
    );

    const unsub = onSnapshot(q, snap => {
      const data = [];
      snap.forEach(doc => data.push({ id: doc.id, ...doc.data() }));
      // Sort in memory (newest first)
      data.sort((a, b) => b.createdAt?.toMillis() - a.createdAt?.toMillis());
      setFiles(data);
      setLoading(false);
    });

    return () => unsub();
  }, [schoolId]);

  const handleDownload = async (f) => {
    setDownloadingId(f.id);
    try {
      let finalBase64 = f.attachmentBase64; // Fallback for old files
      if (f.isChunked) {
        const chunksRef = collection(db, `excellence_files/${f.id}/chunks`);
        const q = query(chunksRef, orderBy('index'));
        const snap = await getDocs(q);
        finalBase64 = '';
        snap.forEach(doc => {
          finalBase64 += doc.data().data;
        });
      }

      if (!finalBase64) {
        alert('الملف غير موجود');
        return;
      }

      const link = document.createElement('a');
      link.href = finalBase64;
      link.download = f.fileName || 'ملف_تميز';
      link.click();
    } catch (error) {
      console.error(error);
      alert('حدث خطأ أثناء تحميل الملف');
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
        <Star size={32} color="var(--color-primary-dark)" />
        <h1 style={{ margin: 0, color: 'var(--color-primary-dark)' }}>ملفات التميز والمبادرات</h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
        {loading ? (
          <p>جاري التحميل...</p>
        ) : files.length === 0 ? (
          <p style={{ color: 'var(--color-text-muted)', gridColumn: '1 / -1' }}>لم يتم رفع أي ملفات تميز من قبل المعلمين بعد.</p>
        ) : (
          files.map(f => (
            <div key={f.id} className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: '12px', marginBottom: '8px' }}>
                <h3 style={{ margin: '0 0 8px 0', color: 'var(--color-primary-dark)' }}>{f.title}</h3>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85em', color: 'var(--color-text-muted)' }}>
                  <span>بواسطة: <strong>{f.teacherName}</strong></span>
                  <span>{f.createdAt?.toDate().toLocaleDateString('ar-EG')}</span>
                </div>
              </div>
              
              <p style={{ margin: 0, color: 'var(--color-text)', lineHeight: '1.6', flex: 1 }}>{f.description}</p>
              
              <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'center' }}>
                <button 
                  onClick={() => handleDownload(f)}
                  disabled={downloadingId === f.id}
                  className="btn" 
                  style={{ background: 'var(--color-secondary)', display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#fff', width: '100%', justifyContent: 'center' }}
                >
                  {f.attachmentType === 'image' ? <ImageIcon size={18} /> : <FileText size={18} />}
                  {downloadingId === f.id ? 'جاري تجهيز الملف...' : `تحميل / عرض (${f.fileName || 'المرفق'})`}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
