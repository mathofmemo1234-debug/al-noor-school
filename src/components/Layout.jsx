import React from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import './Layout.css';

export default function Layout({ role, title, children }) {
  return (
    <div className="layout-container">
      <Sidebar role={role} />
      <div className="main-content">
        <Header title={title} />
        <div className="page-container">
          {children}
        </div>
      </div>
    </div>
  );
}
