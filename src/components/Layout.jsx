import React from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import './Layout.css';

export default function Layout({ role, title, children }) {
  return (
    <div className="layout-container" style={{ position: 'relative' }}>
      <Sidebar role={role} />
      <div className="main-content">
        <Header title={title} />
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
        مصمم الموقع : محمد عبدالله جمعة | جوال : 0545841974
      </div>
    </div>
  );
}
