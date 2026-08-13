import React from 'react';
import Layout from '../components/Layout';

export default function TeacherDashboard() {
  return (
    <Layout role="teacher" title="لوحة تحكم المعلم">
      <div className="glass-panel" style={{ padding: '24px' }}>
        <h2>أهلاً بك في بوابة المعلم</h2>
        <p>هنا ستتمكن من إدارة الجداول، الواجبات، والحضور.</p>
      </div>
    </Layout>
  );
}
