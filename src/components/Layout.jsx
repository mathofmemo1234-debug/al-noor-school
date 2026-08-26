import React from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { useLanguage } from '../contexts/LanguageContext';
import './Layout.css';

export default function Layout({ role, title, children }) {
  const { t } = useLanguage();
  return (
    <div className="layout-container" style={{ position: 'relative' }}>
      <Sidebar role={role} />
      <div className="main-content">
        <Header title={title} role={role} />
        <div className="page-container">
          {children}
        </div>
      </div>
      <div style={{
        position: 'fixed',
        bottom: '10px',
        left: '15px',
        fontSize: '11px',
        color: 'var(--color-text-muted)',
        opacity: 0.7,
        zIndex: 1000,
        pointerEvents: 'none',
        direction: 'rtl'
      }}>
        {t('layout.designerInfo')}
      </div>
    </div>
  );
}
