import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, getDocs } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { 
  FileSpreadsheet, 
  Printer, 
  Search, 
  Calendar, 
  Filter, 
  Users, 
  UserX, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Download,
  RefreshCw
} from 'lucide-react';

export default function AttendanceSummaryExport({ schoolId }) {
  const { userData } = useAuth();
  const { t, lang } = useLanguage();
  
  const [students, setStudents] = useState([]);
  const [attendanceDocs, setAttendanceDocs] = useState([]);
  const [classesList, setClassesList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [statusFilter, setStatusFilter] = useState('absent'); // 'all' | 'absent' | 'late' | 'present'
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // 1. Fetch Students
  useEffect(() => {
    const qStudents = schoolId 
      ? query(collection(db, 'students'), where('schoolId', '==', schoolId))
      : collection(db, 'students');

    const unsubStudents = onSnapshot(qStudents, (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setStudents(list);

      // Extract unique classes
      const clsSet = new Set();
      list.forEach(s => {
        const c = s.class || s.className;
        if (c) clsSet.add(c);
      });
      setClassesList(Array.from(clsSet).sort());
    });

    return () => unsubStudents();
  }, [schoolId]);

  // 2. Fetch Attendance Documents
  useEffect(() => {
    const qAttendance = collection(db, 'attendance');
    const unsubAttendance = onSnapshot(qAttendance, (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setAttendanceDocs(list);
      setLoading(false);
    });

    return () => unsubAttendance();
  }, []);

  // 3. Map & Flatten Attendance Records with Student Details
  const allRecords = useMemo(() => {
    // Map student lookup by ID and National ID
    const studentById = new Map();
    const studentByNid = new Map();
    const studentByName = new Map();

    students.forEach(s => {
      if (s.id) studentById.set(s.id, s);
      if (s.nationalId) studentByNid.set(String(s.nationalId).trim(), s);
      if (s.name) studentByName.set(s.name.trim(), s);
    });

    const flattened = [];

    attendanceDocs.forEach(docData => {
      const docDate = docData.date || '';
      const docClass = docData.className || '';
      const records = docData.records || {};

      Object.entries(records).forEach(([studentKey, status]) => {
        // Resolve student
        let studentObj = studentById.get(studentKey) || 
                         studentByNid.get(String(studentKey).trim()) || 
                         studentByName.get(studentKey.trim());

        // If not matched directly, create fallback object
        const studentName = studentObj?.name || studentKey;
        const studentNid = studentObj?.nationalId || (studentKey.match(/^\d+$/) ? studentKey : '—');
        const studentClass = studentObj?.class || studentObj?.className || docClass || '—';

        let statusText = 'حاضر';
        let statusColor = '#16a34a'; // green
        let statusBg = '#dcfce7';

        if (status === 'absent') {
          statusText = 'غائب';
          statusColor = '#dc2626'; // red
          statusBg = '#fee2e2';
        } else if (status === 'late') {
          statusText = 'متأخر';
          statusColor = '#d97706'; // amber
          statusBg = '#fef3c7';
        } else if (status === 'excused') {
          statusText = 'غياب بعذر';
          statusColor = '#2563eb'; // blue
          statusBg = '#dbeafe';
        }

        flattened.push({
          id: `${docData.id}_${studentKey}`,
          studentName,
          nationalId: studentNid,
          className: studentClass,
          date: docDate,
          status,
          statusText,
          statusColor,
          statusBg,
          rawDate: new Date(docDate).getTime() || 0
        });
      });
    });

    // Sort newest date first
    return flattened.sort((a, b) => b.rawDate - a.rawDate);
  }, [attendanceDocs, students]);

  // 4. Apply Filters (Search by Name or National ID, Date, Class, Status)
  const filteredRecords = useMemo(() => {
    return allRecords.filter(item => {
      // Search by Name or National ID
      if (searchQuery.trim()) {
        const query = searchQuery.trim().toLowerCase();
        const matchName = item.studentName?.toLowerCase().includes(query);
        const matchNid = String(item.nationalId)?.toLowerCase().includes(query);
        if (!matchName && !matchNid) return false;
      }

      // Filter by Class
      if (selectedClass && item.className !== selectedClass) {
        return false;
      }

      // Filter by Status
      if (statusFilter !== 'all') {
        if (statusFilter === 'absent' && item.status !== 'absent' && item.status !== 'excused') return false;
        if (statusFilter === 'late' && item.status !== 'late') return false;
        if (statusFilter === 'present' && item.status !== 'present') return false;
      }

      // Filter by Date Range
      if (startDate && item.date < startDate) return false;
      if (endDate && item.date > endDate) return false;

      return true;
    });
  }, [allRecords, searchQuery, selectedClass, statusFilter, startDate, endDate]);

  // 5. Calculate Summary Metrics
  const metrics = useMemo(() => {
    let totalAbsences = 0;
    let totalLate = 0;
    let totalPresent = 0;
    let totalExcused = 0;

    filteredRecords.forEach(r => {
      if (r.status === 'absent') totalAbsences++;
      else if (r.status === 'late') totalLate++;
      else if (r.status === 'present') totalPresent++;
      else if (r.status === 'excused') totalExcused++;
    });

    return {
      total: filteredRecords.length,
      absent: totalAbsences,
      late: totalLate,
      present: totalPresent,
      excused: totalExcused
    };
  }, [filteredRecords]);

  // 6. Export to Excel / CSV with UTF-8 BOM
  const handleExportCSV = () => {
    if (filteredRecords.length === 0) {
      alert('لا توجد بيانات غياب لتصديرها وفقاً للفلاتر الحالية');
      return;
    }

    const headers = ['م', 'اسم الطالب', 'رقم الهوية', 'الصف الدراسي', 'التاريخ', 'الحالة'];
    const rows = filteredRecords.map((r, idx) => [
      idx + 1,
      `"${r.studentName || ''}"`,
      `"${r.nationalId || ''}"`,
      `"${r.className || ''}"`,
      `"${r.date || ''}"`,
      `"${r.statusText || ''}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `ملخص_غياب_الطلاب_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 7. Print / PDF Handler
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="attendance-report-container" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header & Main Actions */}
      <div className="glass-panel no-print" style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ margin: '0 0 6px 0', color: 'var(--color-primary-dark)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FileSpreadsheet size={26} color="#0e7490" /> ملخص وكشف غياب وحضور الطلاب
          </h2>
          <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: '14px' }}>
            البحث برقم الهوية أو اسم الطالب أو التاريخ، مع إمكانية التصدير والطباعة
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button 
            onClick={handleExportCSV} 
            className="btn" 
            style={{ 
              background: '#047857', 
              color: 'white', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px', 
              border: 'none',
              boxShadow: '0 2px 8px rgba(4, 120, 87, 0.25)',
              cursor: 'pointer'
            }}
          >
            <Download size={18} /> تصدير إلى Excel (CSV)
          </button>
          
          <button 
            onClick={handlePrint} 
            className="btn btn-primary" 
            style={{ 
              background: 'linear-gradient(135deg, #0e7490, #63B2C6)', 
              color: 'white', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px', 
              border: 'none',
              boxShadow: '0 2px 8px rgba(14, 116, 144, 0.25)',
              cursor: 'pointer'
            }}
          >
            <Printer size={18} /> طباعة / تصدير PDF
          </button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="stats-grid no-print" style={{ marginBottom: 0 }}>
        <div className="stat-card glass-panel" style={{ background: 'white' }}>
          <div className="stat-icon" style={{ color: '#dc2626', background: '#fee2e2' }}>
            <UserX size={28} />
          </div>
          <div className="stat-info">
            <p>إجمالي الغياب</p>
            <h3 style={{ color: '#dc2626' }}>{metrics.absent}</h3>
          </div>
        </div>

        <div className="stat-card glass-panel" style={{ background: 'white' }}>
          <div className="stat-icon" style={{ color: '#d97706', background: '#fef3c7' }}>
            <Clock size={28} />
          </div>
          <div className="stat-info">
            <p>إجمالي التأخر</p>
            <h3 style={{ color: '#d97706' }}>{metrics.late}</h3>
          </div>
        </div>

        <div className="stat-card glass-panel" style={{ background: 'white' }}>
          <div className="stat-icon" style={{ color: '#16a34a', background: '#dcfce7' }}>
            <CheckCircle2 size={28} />
          </div>
          <div className="stat-info">
            <p>إجمالي الحضور</p>
            <h3 style={{ color: '#16a34a' }}>{metrics.present}</h3>
          </div>
        </div>

        <div className="stat-card glass-panel" style={{ background: 'white' }}>
          <div className="stat-icon" style={{ color: '#0e7490', background: '#e0f2fe' }}>
            <Users size={28} />
          </div>
          <div className="stat-info">
            <p>إجمالي السجلات المفلترة</p>
            <h3 style={{ color: '#0e7490' }}>{metrics.total}</h3>
          </div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="glass-panel no-print" style={{ padding: '20px', background: 'white' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', alignItems: 'flex-end' }}>
          
          {/* Search by Name or National ID */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: 'var(--color-primary-dark)', marginBottom: '6px' }}>
              بحث باسم الطالب أو رقم الهوية
            </label>
            <div style={{ position: 'relative' }}>
              <Search size={18} color="#94a3b8" style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                className="input-field"
                placeholder="ادخل الاسم أو رقم الهوية..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ paddingRight: '38px', marginBottom: 0 }}
              />
            </div>
          </div>

          {/* Filter by Class */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: 'var(--color-primary-dark)', marginBottom: '6px' }}>
              الصف / الفصل الدراسي
            </label>
            <select
              className="input-field"
              value={selectedClass}
              onChange={e => setSelectedClass(e.target.value)}
              style={{ marginBottom: 0 }}
            >
              <option value="">جميع الفصول</option>
              {classesList.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Filter by Status */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: 'var(--color-primary-dark)', marginBottom: '6px' }}>
              حالة الحضور
            </label>
            <select
              className="input-field"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              style={{ marginBottom: 0 }}
            >
              <option value="absent">الغياب فقط (غياب / بعذر)</option>
              <option value="late">التأخر فقط</option>
              <option value="present">الحضور فقط</option>
              <option value="all">جميع الحالات</option>
            </select>
          </div>

          {/* Start Date */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: 'var(--color-primary-dark)', marginBottom: '6px' }}>
              من تاريخ
            </label>
            <input
              type="date"
              className="input-field"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              style={{ marginBottom: 0 }}
            />
          </div>

          {/* End Date */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: 'var(--color-primary-dark)', marginBottom: '6px' }}>
              إلى تاريخ
            </label>
            <input
              type="date"
              className="input-field"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              style={{ marginBottom: 0 }}
            />
          </div>

          {/* Reset Filters */}
          <div>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedClass('');
                setStatusFilter('absent');
                setStartDate('');
                setEndDate('');
              }}
              className="btn"
              style={{
                width: '100%',
                background: '#f1f5f9',
                color: 'var(--color-primary-dark)',
                border: '1px solid #cbd5e1',
                padding: '10px',
                fontSize: '13px'
              }}
            >
              إعادة ضبط الفلاتر
            </button>
          </div>
        </div>
      </div>

      {/* Printable Report View (Visible in print and screen) */}
      <div className="glass-panel print-area" style={{ padding: '24px', background: 'white' }}>
        
        {/* Printable Header (Visible only when printing) */}
        <div className="only-print" style={{ display: 'none', borderBottom: '2px solid #0e7490', paddingBottom: '16px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ textAlign: 'right', fontSize: '12px', lineHeight: '1.6' }}>
              <div style={{ fontWeight: 'bold', fontSize: '14px', color: '#0e7490' }}>المملكة العربية السعودية - وزارة التعليم</div>
              <div>الإدارة العامة للتعليم بمنطقة مكة المكرمة</div>
              <div style={{ fontWeight: 'bold' }}>{userData?.schoolName || 'مجمع المدارس المتقدمة للتعلم الذكي'}</div>
            </div>

            <div style={{ textAlign: 'center' }}>
              <img
                src={`${import.meta.env.BASE_URL}minst.svg`}
                alt="وزارة التعليم - Ministry of Education"
                style={{ maxHeight: '65px', maxWidth: '140px', objectFit: 'contain', display: 'block', margin: '0 auto 4px auto' }}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = `${import.meta.env.BASE_URL}default_logo.png`;
                }}
              />
              <h2 style={{ margin: 0, color: '#0e7490', fontSize: '17px' }}>تقرير ملخص غياب وحضور الطلاب</h2>
              <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: '#475569' }}>
                تاريخ الاستخراج: {new Date().toLocaleDateString('ar-SA')}
              </p>
            </div>

            <div style={{ textAlign: 'left', fontSize: '12px', color: '#64748b' }}>
              <div><strong>المستخرج:</strong> {userData?.name || 'الإدارة المدرسية'}</div>
              <div><strong>الصفة:</strong> {userData?.roleTitle || (userData?.role === 'admin' ? 'مدير المدرسة' : 'المعلم')}</div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '20px', marginTop: '14px', background: '#f8fafc', padding: '10px 14px', borderRadius: '8px', fontSize: '12px' }}>
            <span><strong>إجمالي السجلات:</strong> {metrics.total}</span>
            <span><strong>إجمالي الغياب:</strong> {metrics.absent}</span>
            <span><strong>إجمالي التأخر:</strong> {metrics.late}</span>
            <span><strong>إجمالي الحضور:</strong> {metrics.present}</span>
          </div>
        </div>

        {/* Results Table Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ margin: 0, color: 'var(--color-primary-dark)', fontSize: '16px' }}>
            كشف السجلات ({filteredRecords.length} سجل)
          </h3>
          {(startDate || endDate || selectedClass || searchQuery) && (
            <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', background: '#f1f5f9', padding: '4px 10px', borderRadius: '12px' }}>
              نتائج مفلترة
            </span>
          )}
        </div>

        {/* Table */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)' }}>
            جاري تحميل سجلات الغياب...
          </div>
        ) : filteredRecords.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
            <AlertCircle size={36} style={{ opacity: 0.4, marginBottom: '8px' }} />
            <p style={{ margin: 0, fontSize: '15px' }}>لا توجد سجلات مطابقة لمعايير البحث المحددة</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                  <th style={{ padding: '12px 14px', fontSize: '13px', color: 'var(--color-primary-dark)' }}>#</th>
                  <th style={{ padding: '12px 14px', fontSize: '13px', color: 'var(--color-primary-dark)' }}>اسم الطالب</th>
                  <th style={{ padding: '12px 14px', fontSize: '13px', color: 'var(--color-primary-dark)' }}>رقم الهوية</th>
                  <th style={{ padding: '12px 14px', fontSize: '13px', color: 'var(--color-primary-dark)' }}>الصف الدراسي</th>
                  <th style={{ padding: '12px 14px', fontSize: '13px', color: 'var(--color-primary-dark)' }}>التاريخ</th>
                  <th style={{ padding: '12px 14px', fontSize: '13px', color: 'var(--color-primary-dark)', textAlign: 'center' }}>الحالة</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.map((item, index) => (
                  <tr 
                    key={item.id} 
                    style={{ 
                      borderBottom: '1px solid #f1f5f9', 
                      background: index % 2 === 0 ? 'white' : '#fafafa',
                      transition: 'background 0.15s'
                    }}
                  >
                    <td style={{ padding: '12px 14px', fontSize: '13px', color: '#64748b', fontWeight: 'bold' }}>
                      {index + 1}
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: '14px', fontWeight: '700', color: '#0f172a' }}>
                      {item.studentName}
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: '13px', color: '#475569', fontFamily: 'monospace' }}>
                      {item.nationalId}
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: '13px', color: '#475569' }}>
                      <span style={{ background: 'rgba(99, 178, 198, 0.15)', color: '#0e7490', padding: '2px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: '600' }}>
                        {item.className}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: '13px', color: '#475569' }}>
                      {item.date}
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '4px 12px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '700',
                        color: item.statusColor,
                        background: item.statusBg,
                        border: `1px solid ${item.statusColor}33`
                      }}>
                        {item.statusText}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-area, .print-area * {
            visibility: visible;
          }
          .print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 20px;
            box-shadow: none !important;
            border: none !important;
          }
          .no-print {
            display: none !important;
          }
          .only-print {
            display: block !important;
          }
          table {
            width: 100% !important;
            page-break-inside: auto;
          }
          tr {
            page-break-inside: avoid;
            page-break-after: auto;
          }
        }
      `}</style>
    </div>
  );
}
