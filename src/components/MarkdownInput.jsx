import React, { useState, useRef } from 'react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase';
import MarkdownViewer from './MarkdownViewer';
import { Image as ImageIcon, Loader } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

export default function MarkdownInput({ label, value, onChange, placeholder, height = '200px' }) {
  const { t } = useLanguage();
  const textareaRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);

  const insertTextAtCursor = (textToInsert) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      onChange(value + textToInsert);
      return;
    }
    const startPos = textarea.selectionStart;
    const endPos = textarea.selectionEnd;
    const newText = value.substring(0, startPos) + textToInsert + value.substring(endPos);
    onChange(newText);
    
    setTimeout(() => {
      textarea.selectionStart = startPos + textToInsert.length;
      textarea.selectionEnd = startPos + textToInsert.length;
      textarea.focus();
    }, 0);
  };

  const uploadImage = async (file) => {
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert(t('markdownInput.imageSizeError'));
      return;
    }

    setIsUploading(true);
    try {
      const storageRef = ref(storage, `inline_images/${Date.now()}_${file.name || 'image.png'}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      insertTextAtCursor(`\n![${t('markdownInput.image')}](${url})\n`);
    } catch (error) {
      console.error('Error uploading inline image:', error);
      alert('حدث خطأ أثناء الرفع');
    } finally {
      setIsUploading(false);
    }
  };

  const handlePaste = (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        e.preventDefault();
        const file = items[i].getAsFile();
        uploadImage(file);
        break;
      }
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadImage(file);
    }
    e.target.value = null;
  };

  return (
    <div className="form-group" style={{ marginBottom: 0 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <label style={{ margin: 0 }}>{label} <span style={{fontSize:'12px', color:'#666'}}>{t('markdownInput.latexSupport')}</span></label>
        <div style={{ position: 'relative' }}>
          <input 
            type="file" 
            accept="image/*" 
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
            onChange={handleFileSelect}
            title={t('markdownInput.insertImage')}
          />
          <button type="button" className="btn" style={{ padding: '6px 12px', fontSize: '12px', background: '#e2e8f0', color: '#334155', display: 'flex', alignItems: 'center', gap: '6px', borderRadius: '6px' }}>
            {isUploading ? <Loader size={14} className="spin" /> : <ImageIcon size={14} />}
            {isUploading ? t('markdownInput.uploading') : t('markdownInput.insertImage')}
          </button>
        </div>
      </div>
      <div style={{ display: 'flex', gap: '20px', height }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <textarea 
            ref={textareaRef}
            className="input-field" 
            style={{ width: '100%', resize: 'none', height: '100%', fontFamily: 'monospace', margin: 0 }}
            value={value}
            onChange={e => onChange(e.target.value)}
            onPaste={handlePaste}
            placeholder={placeholder + "\n" + t('markdownInput.pasteImageHint')}
          />
          {isUploading && (
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(255,255,255,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10, borderRadius: '8px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: 'var(--color-primary)' }}>
                <Loader className="spin" size={24} style={{ marginBottom: '8px' }} />
                <span style={{ fontWeight: 'bold' }}>{t('markdownInput.uploading')}</span>
              </div>
            </div>
          )}
        </div>
        <div style={{ flex: 1, border: '1px solid var(--color-border)', borderRadius: '8px', padding: '16px', background: '#fff', overflowY: 'auto' }}>
          <h4 style={{ margin: '0 0 10px 0', color: 'var(--color-text-muted)' }}>{t('markdownInput.livePreview')}</h4>
          <MarkdownViewer content={value || t('markdownInput.empty')} />
        </div>
      </div>
    </div>
  );
}
