import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, getDocs, orderBy } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { Star, FileText, Image as ImageIcon, Shield, ExternalLink, Award, Users } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

import SchoolExcellenceButton from '../components/SchoolExcellenceButton';
import ExcellencePermissionsModal from '../components/ExcellencePermissionsModal';

export default function AdminExcellence({ schoolId }) {
  const { t } = useLanguage();
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState(null);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);

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
        alert(t('adminExcellence.fileNotFound'));
        return;
      }

      const link = document.createElement('a');
      link.href = finalBase64;
      link.download = f.fileName || t('adminExcellence.excellenceFile');
      link.click();
    } catch (error) {
      console.error(error);
      alert(t('adminExcellence.downloadError'));
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1000px', margin: '0 auto' }}>
      
      {/* Top Action Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: 'rgba(245, 158, 11, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b' }}>
            <Award size={28} />
          </div>
          <div>
            <h1 style={{ margin: 0, color: 'var(--color-primary-dark)', fontSize: '1.6rem' }}>
              {t('adminExcellence.title')}
            </h1>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
              المدارس المتقدمة للتعلم الذكي بجدة
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          {/* Admin Manage Teacher Permissions Button */}
          <button
            onClick={() => setShowPermissionsModal(true)}
            className="btn"
            style={{
              background: 'rgba(59, 130, 246, 0.15)',
              color: '#3b82f6',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              fontWeight: 'bold',
              borderRadius: '12px',
              padding: '10px 16px',
              cursor: 'pointer'
            }}
          >
            <Shield size={18} />
            <span>صلاحيات تحرير التميز للمعلمين</span>
          </button>

          {/* School Excellence SPA Button */}
          <SchoolExcellenceButton variant="gold" />
        </div>
      </div>

      {/* Excellence Files List */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
        {loading ? (
          <p>{t('adminExcellence.loading')}</p>
        ) : files.length === 0 ? (
          <p style={{ color: 'var(--color-text-muted)', gridColumn: '1 / -1', textAlign: 'center', padding: '40px' }}>
            {t('adminExcellence.noFiles')}
          </p>
        ) : (
          files.map(f => (
            <div key={f.id} className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: '12px', marginBottom: '8px' }}>
                <h3 style={{ margin: '0 0 8px 0', color: 'var(--color-primary-dark)' }}>{f.title}</h3>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85em', color: 'var(--color-text-muted)' }}>
                  <span>{t('adminExcellence.by')}<strong>{f.teacherName}</strong></span>
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
                  {downloadingId === f.id ? t('adminExcellence.preparingFile') : `${t('adminExcellence.downloadViewPrefix')}${f.fileName || t('adminExcellence.attachment')}${t('adminExcellence.downloadViewSuffix')}`}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Permissions Modal */}
      {showPermissionsModal && (
        <ExcellencePermissionsModal
          schoolId={schoolId}
          onClose={() => setShowPermissionsModal(false)}
        />
      )}
    </div>
  );
}
