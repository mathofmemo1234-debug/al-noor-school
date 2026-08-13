import React from 'react';
import Layout from '../components/Layout';

export default function StudentDashboard() {
  return (
    <Layout role="student" title="لوحة تحكم الطالب">
      <div className="glass-panel" style={{ padding: '24px' }}>
        <h2>أهلاً بك في بوابة الطالب</h2>
        <p>هنا ستتمكن من عرض جدولك، حل الواجبات، وتحميل الملخصات.</p>
      </div>
    </Layout>
  );
}
