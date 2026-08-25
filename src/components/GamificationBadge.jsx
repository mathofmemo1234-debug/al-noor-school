import React, { useState } from 'react';
import { Star, Award, Zap, Sparkles } from 'lucide-react';

export default function GamificationBadge({
  points = 0,
  stars = 1,
  levelTitle = '',
  levelBadge = '',
  size = 'sm', // 'xs' | 'sm' | 'md' | 'lg'
  showStars = true,
  showPoints = true,
  showTitle = false,
  breakdown = null,
  isTeacher = false,
  style = {}
}) {
  const [showTooltip, setShowTooltip] = useState(false);

  // Compute stars array (max 5)
  const starCount = Math.max(1, Math.min(5, stars || 1));
  const starsArray = Array.from({ length: 5 }, (_, i) => i < starCount);

  // Size configurations
  const config = {
    xs: {
      starSize: 11,
      fontSize: '0.72rem',
      padding: '1px 6px',
      gap: '3px'
    },
    sm: {
      starSize: 13,
      fontSize: '0.78rem',
      padding: '2px 8px',
      gap: '4px'
    },
    md: {
      starSize: 16,
      fontSize: '0.88rem',
      padding: '4px 12px',
      gap: '6px'
    },
    lg: {
      starSize: 22,
      fontSize: '1.05rem',
      padding: '8px 18px',
      gap: '8px'
    }
  }[size] || config.sm;

  return (
    <div
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        gap: config.gap,
        verticalAlign: 'middle',
        userSelect: 'none',
        ...style
      }}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {/* Stars Container */}
      {showStars && (
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '1px' }}>
          {starsArray.map((isFilled, idx) => (
            <Star
              key={idx}
              size={config.starSize}
              fill={isFilled ? '#eab308' : '#e2e8f0'}
              color={isFilled ? '#ca8a04' : '#cbd5e1'}
              style={{
                filter: isFilled ? 'drop-shadow(0 1px 2px rgba(234, 179, 8, 0.4))' : 'none',
                transition: 'transform 0.2s'
              }}
            />
          ))}
        </div>
      )}

      {/* Points Pill */}
      {showPoints && (
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '3px',
          background: 'linear-gradient(135deg, #fef9c3 0%, #fef08a 100%)',
          color: '#854d0e',
          border: '1px solid #fde047',
          padding: config.padding,
          borderRadius: '20px',
          fontWeight: 700,
          fontSize: config.fontSize,
          boxShadow: '0 1px 3px rgba(234, 179, 8, 0.15)',
          whiteSpace: 'nowrap'
        }}>
          <Zap size={config.starSize - 1} color="#ca8a04" fill="#eab308" />
          <span>{points} ن</span>
        </div>
      )}

      {/* Optional Level Title */}
      {showTitle && levelTitle && (
        <span style={{
          fontSize: config.fontSize,
          fontWeight: 600,
          color: '#475569',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '3px'
        }}>
          {levelBadge} {levelTitle}
        </span>
      )}

      {/* Breakdown Tooltip */}
      {showTooltip && (
        <div style={{
          position: 'absolute',
          bottom: '100%',
          left: '50%',
          transform: 'translateX(-50%)',
          marginBottom: '8px',
          background: '#0f172a',
          color: '#ffffff',
          padding: '10px 14px',
          borderRadius: '10px',
          fontSize: '0.8rem',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3)',
          zIndex: 10000,
          minWidth: '200px',
          pointerEvents: 'none',
          direction: 'rtl',
          lineHeight: 1.4
        }}>
          <div style={{ fontWeight: 'bold', color: '#fde047', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px', borderBottom: '1px solid rgba(255,255,255,0.15)', paddingBottom: '4px' }}>
            <Sparkles size={14} />
            {levelBadge} {levelTitle || (isTeacher ? 'مستوى التميز المهني' : 'مستوى تفاعل الطالب')}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
            <span style={{ color: '#94a3b8' }}>إجمالي النقاط:</span>
            <strong style={{ color: '#38bdf8' }}>{points} نقطة</strong>
          </div>

          {breakdown && !isTeacher && (
            <div style={{ marginTop: '4px', fontSize: '0.75rem', color: '#cbd5e1', display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <div>• حضور وانضباط: <strong>{breakdown.presentDaysCount || 0}</strong> يوم ({breakdown.attendancePoints || 0} نقطة)</div>
              <div>• واجبات منجزة: <strong>{breakdown.completedAssignmentsCount || 0}</strong> واجب ({breakdown.assignmentPoints || 0} نقطة)</div>
              <div>• اختبارات منجزة: <strong>{breakdown.completedExamsCount || 0}</strong> اختبار ({breakdown.examPoints || 0} نقطة)</div>
            </div>
          )}

          {breakdown && isTeacher && (
            <div style={{ marginTop: '4px', fontSize: '0.75rem', color: '#cbd5e1', display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <div>• تحاضير دروس: <strong>{breakdown.preparationsCount || 0}</strong> ({breakdown.prepPoints || 0} ن)</div>
              <div>• خطط أسبوعية: <strong>{breakdown.weeklyPlansCount || 0}</strong> ({breakdown.planPoints || 0} ن)</div>
              <div>• واجبات منشورة: <strong>{breakdown.assignmentsCount || 0}</strong> ({breakdown.assignmentPoints || 0} ن)</div>
              <div>• اختبارات منشأة: <strong>{breakdown.examsCount || 0}</strong> ({breakdown.examPoints || 0} ن)</div>
              <div>• رصد حضور: <strong>{breakdown.attendanceSessionsCount || 0}</strong> ({breakdown.attendancePoints || 0} ن)</div>
              <div>• مواد إثرائية: <strong>{breakdown.materialsCount || 0}</strong> ({breakdown.materialPoints || 0} ن)</div>
            </div>
          )}

          <div style={{
            position: 'absolute',
            top: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            borderWidth: '5px',
            borderStyle: 'solid',
            borderColor: '#0f172a transparent transparent transparent'
          }} />
        </div>
      )}
    </div>
  );
}
