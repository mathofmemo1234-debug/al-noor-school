import React, { Suspense } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';
import Login from './pages/Login';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';
import { lazyWithRetry } from './utils/lazyWithRetry';
import './index.css';

const AdminDashboard = lazyWithRetry(() => import('./pages/AdminDashboard'));
const SupervisorDashboard = lazyWithRetry(() => import('./pages/SupervisorDashboard'));
const StaffDashboard = lazyWithRetry(() => import('./pages/StaffDashboard'));
const TeacherDashboard = lazyWithRetry(() => import('./pages/TeacherDashboard'));
const StudentDashboard = lazyWithRetry(() => import('./pages/StudentDashboard'));
const SuperAdminDashboard = lazyWithRetry(() => import('./pages/SuperAdminDashboard'));
const Migration = lazyWithRetry(() => import('./pages/Migration'));

const ParentDashboard = lazyWithRetry(() => import('./pages/ParentDashboard'));
const SchoolExcellenceDashboard = lazyWithRetry(() => import('./pages/SchoolExcellenceDashboard'));

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <LanguageProvider>
          <Router>
            <Suspense fallback={
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '100vh',
                background: 'var(--color-bg, #F4F8F9)',
                fontFamily: 'Cairo, sans-serif',
                direction: 'rtl'
              }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  border: '4px solid rgba(99, 178, 198, 0.2)',
                  borderTopColor: '#63B2C6',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }} />
                <p style={{ marginTop: '16px', color: '#4A93A6', fontWeight: 700, fontSize: '1rem' }}>
                  جاري تحميل الصفحة...
                </p>
              </div>
            }>
            <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/admin/*" element={
            <ProtectedRoute allowedRole="admin">
              <AdminDashboard />
            </ProtectedRoute>
          } />
          <Route path="/staff/*" element={
            <ProtectedRoute allowedRole="staff">
              <StaffDashboard />
            </ProtectedRoute>
          } />
          <Route path="/supervisor/*" element={
            <ProtectedRoute allowedRole="supervisor">
              <SupervisorDashboard />
            </ProtectedRoute>
          } />
          <Route path="/superadmin/*" element={
            <ProtectedRoute allowedRole="superadmin">
              <SuperAdminDashboard />
            </ProtectedRoute>
          } />
          <Route path="/migrate" element={<Migration />} />
          <Route path="/teacher/*" element={
            <ProtectedRoute allowedRole="teacher">
              <TeacherDashboard />
            </ProtectedRoute>
          } />
          <Route path="/student/*" element={
            <ProtectedRoute allowedRole="student">
              <StudentDashboard />
            </ProtectedRoute>
          } />
          <Route path="/parent/*" element={
            <ProtectedRoute allowedRole="parent">
              <ParentDashboard />
            </ProtectedRoute>
          } />
          <Route path="/school-excellence" element={<SchoolExcellenceDashboard />} />
            </Routes>
          </Suspense>
        </Router>
        </LanguageProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
