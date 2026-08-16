import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, addDoc, onSnapshot, query, where, setDoc, doc, getDocs, orderBy } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { Star, Upload, FileText, Plus, Image as ImageIcon, Download } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

export default function TeacherExcellence() {
  const { t } = useLanguage();
  const { userData } = useAuth();
  const [files, setFiles] = useState([]);
  const [isAdding, setIsAdding] = useState(false);
  const [loading, setLoading] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [attachmentBase64, setAttachmentBase64] = useState('');
  const [attachmentType, setAttachmentType] = useState(''); // 'image' or 'pdf'
  const [fileName, setFileName] = useState('');

  useEffect(() => {
    if (!userData?.nationalId) return;
    const q = query(
      collection(db, 'excellence_files'), 
      where('teacherId', '==', userData.nationalId)
    );
    
    const unsub = onSnapshot(q, snap => {
      const data = [];
      snap.forEach(doc => data.push({ id: doc.id, ...doc.data() }));
      data.sort((a, b) => b.createdAt?.toMillis() - a.createdAt?.toMillis());
      setFiles(data);
    });
    return () => unsub();
  }, [userData]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert(t('teacherExcellence.fileTooLarge'));
      return;
    }

    const type = file.type.startsWith('image/') ? 'image' : (file.type === 'application/pdf' ? 'pdf' : 'unknown');
    if (type === 'unknown') {
      alert(t('teacherExcellence.invalidFileType'));
      return;
    }

    setFileName(file.name);
    setAttachmentType(type);

    const reader = new FileReader();
    reader.onloadend = () => {
      setAttachmentBase64(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // 1. Create the main document
      const docRef = await addDoc(collection(db, 'excellence_files'), {
        title,
        description,
        attachmentType,
        fileName,
        teacherId: userData.nationalId,
        teacherName: userData.name,
        schoolId: userData.schoolId,
        createdAt: new Date(),
        isChunked: true // Flag to indicate chunks
      });

      // 2. Chunk the base64 string and upload chunks to bypass the 1MB limit
      if (attachmentBase64) {
        const chunkSize = 800000; // ~800KB per chunk
        const totalChunks = Math.ceil(attachmentBase64.length / chunkSize);
        
        for (let i = 0; i < totalChunks; i++) {
          const chunkStr = attachmentBase64.substring(i * chunkSize, (i + 1) * chunkSize);
          await setDoc(doc(db, `excellence_files/${docRef.id}/chunks`, `chunk_${i}`), {
            index: i,
            data: chunkStr
          });
        }
      }

      setIsAdding(false);
      setTitle('');
      setDescription('');
      setAttachmentBase64('');
      setAttachmentType('');
      setFileName('');
      alert(t('teacherExcellence.uploadSuccess'));
    } catch (error) {
      console.error(error);
      alert(t('teacherExcellence.uploadFail') + ' ' + error.message);
    } finally {
      setLoading(false);
    }
  };

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
        alert(t('teacherExcellence.fileNotFound'));
        return;
      }

      const link = document.createElement('a');
      link.href = finalBase64;
      link.download = f.fileName || t('teacherExcellence.defaultFileName');
      link.click();
    } catch (error) {
      console.error(error);
      alert(t('teacherExcellence.downloadFail'));
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Star size={32} color="var(--color-primary-dark)" />
          <h1 style={{ margin: 0, color: 'var(--color-primary-dark)' }}>{t('teacherExcellence.excellenceFiles')}</h1>
        </div>
        <button className="btn btn-primary" onClick={() => setIsAdding(!isAdding)} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {isAdding ? <FileText size={18} /> : <Plus size={18} />}
          {isAdding ? t('teacherExcellence.cancel') : t('teacherExcellence.addExcellenceFile')}
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleSubmit} className="glass-panel" style={{ padding: '24px', marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>{t('teacherExcellence.initiativeTitle')}</label>
            <input 
              type="text" 
              className="input-field" 
              value={title} 
              onChange={e => setTitle(e.target.value)} 
              required 
              placeholder={t('teacherExcellence.initiativeTitlePlaceholder')} 
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>{t('teacherExcellence.excellenceDescription')}</label>
            <textarea 
              className="input-field" 
              rows="4" 
              value={description} 
              onChange={e => setDescription(e.target.value)} 
              required 
              placeholder={t('teacherExcellence.excellenceDescPlaceholder')} 
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>{t('teacherExcellence.attachments')}</label>
            <label className="btn" style={{ background: 'var(--color-secondary)', display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <Upload size={18} />
              {fileName || t('teacherExcellence.chooseFile')}
              <input type="file" accept="image/png, image/jpeg, application/pdf" style={{ display: 'none' }} onChange={handleFileChange} />
            </label>
          </div>
          
          <button type="submit" className="btn btn-primary" disabled={loading || !attachmentBase64} style={{ alignSelf: 'flex-start', marginTop: '10px' }}>
            {loading ? t('teacherExcellence.uploading') : t('teacherExcellence.saveAndSendToManager')}
          </button>
        </form>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {files.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>{t('teacherExcellence.noExcellenceFiles')}</p>
        ) : (
          files.map(f => (
            <div key={f.id} className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <h3 style={{ margin: 0, color: 'var(--color-primary-dark)' }}>{f.title}</h3>
                <span style={{ fontSize: '0.85em', color: 'var(--color-text-muted)' }}>
                  {f.createdAt?.toDate().toLocaleDateString('ar-EG')}
                </span>
              </div>
              <p style={{ margin: 0, color: 'var(--color-text)', lineHeight: '1.6' }}>{f.description}</p>
              
              <div style={{ marginTop: '10px' }}>
                <button 
                  onClick={() => handleDownload(f)}
                  disabled={downloadingId === f.id}
                  className="btn" 
                  style={{ background: 'var(--color-secondary)', display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#fff' }}
                >
                  {f.attachmentType === 'image' ? <ImageIcon size={18} /> : <FileText size={18} />}
                  {downloadingId === f.id ? t('teacherExcellence.preparingFile') : `${t('teacherExcellence.downloadView')} (${f.fileName || t('teacherExcellence.attachment')})`}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
