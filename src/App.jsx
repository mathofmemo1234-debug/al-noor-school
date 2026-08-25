import React, { Suspense, lazy } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';
import Login from './pages/Login';
import ProtectedRoute from './components/ProtectedRoute';
import './index.css';

const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const SupervisorDashboard = lazy(() => import('./pages/SupervisorDashboard'));
const StaffDashboard = lazy(() => import('./pages/StaffDashboard'));
const TeacherDashboard = lazy(() => import('./pages/TeacherDashboard'));
const StudentDashboard = lazy(() => import('./pages/StudentDashboard'));
const SuperAdminDashboard = lazy(() => import('./pages/SuperAdminDashboard'));
const Migration = lazy(() => import('./pages/Migration'));

const ParentDashboard = lazy(() => import('./pages/ParentDashboard'));
const SchoolExcellenceDashboard = lazy(() => import('./pages/SchoolExcellenceDashboard'));

function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <Router>
          <Suspense fallback={<div className="flex h-screen items-center justify-center">Loading...</div>}>
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
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;
