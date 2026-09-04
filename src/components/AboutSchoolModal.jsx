import React from 'react';
import { 
  Building2, Globe, ExternalLink, X, BookOpen, Award, 
  Sparkles, CheckCircle2, MapPin, Compass, Users, Phone, Mail, ShieldCheck 
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';

export default function AboutSchoolModal({ isOpen, onClose }) {
  const { isRTL } = useLanguage();
  const { userData } = useAuth();

  if (!isOpen) return null;

  const currentSchoolName = userData?.schoolName && userData.schoolName !== 'ALL' 
    ? userData.schoolName 
    : 'مدارس النور الأهلية للتعلم الذكي';

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(5px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        animation: 'fadeIn 0.2s ease-out'
      }}
      onClick={onClose}
    >
      <div 
        className="glass-panel"
        style={{
          background: '#ffffff',
          width: '680px',
          maxWidth: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          borderRadius: '20px',
          padding: '28px',
          position: 'relative',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          border: '1px solid rgba(226, 232, 240, 0.8)',
          direction: 'rtl'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '18px',
            left: '18px',
            background: '#f1f5f9',
            border: 'none',
            borderRadius: '50%',
            width: '34px',
            height: '34px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: '#64748b',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#e2e8f0';
            e.currentTarget.style.color = '#0f172a';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#f1f5f9';
            e.currentTarget.style.color = '#64748b';
          }}
          title="إغلاق"
        >
          <X size={18} />
        </button>

        {/* Header Branding Banner */}
        <div style={{
          background: 'linear-gradient(135deg, #0e7490 0%, #0284c7 50%, #0369a1 100%)',
          borderRadius: '16px',
          padding: '22px 24px',
          color: '#ffffff',
          marginBottom: '20px',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 4px 14px rgba(14, 116, 144, 0.25)'
        }}>
          <div style={{
            position: 'absolute',
            top: '-20px',
            left: '-20px',
            width: '120px',
            height: '120px',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.1)',
            pointerEvents: 'none'
          }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', position: 'relative', zIndex: 1 }}>
            <div style={{
              width: '52px',
              height: '52px',
              borderRadius: '12px',
              background: 'rgba(255, 255, 255, 0.2)',
              backdropFilter: 'blur(4px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid rgba(255, 255, 255, 0.3)'
            }}>
              {userData?.logoUrl ? (
                <img src={userData.logoUrl} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              ) : (
                <Building2 size={28} color="#ffffff" />
              )}
            </div>
            <div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(255, 255, 255, 0.85)', letterSpacing: '0.5px' }}>
                المملكة العربية السعودية • بيئة تعليمية ذكية متكاملة
              </div>
              <h2 style={{ margin: '2px 0 0 0', fontSize: '22px', fontWeight: 800, color: '#ffffff' }}>
                {currentSchoolName}
              </h2>
            </div>
          </div>
        </div>

        {/* Introduction Text */}
        <div style={{ marginBottom: '22px', lineHeight: 1.7, color: '#334155', fontSize: '14px' }}>
          <p style={{ margin: 0, fontWeight: 500 }}>
            تُعد <strong>{currentSchoolName}</strong> صرحاً تعليمياً متميزاً يقدم نموذجاً تعليمياً وإدارياً رائداً يجمع بين الأصالة وأحدث التقنيات والتحول الرقمي، موفراً للطلاب والطالبات والمعلمين بيئة تفاعلية محفزة على الإبداع والتميز الأكاديمي.
          </p>
        </div>

        {/* Vision & Mission Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px', marginBottom: '22px' }}>
          <div style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '14px',
            padding: '16px',
            display: 'flex',
            gap: '12px'
          }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: '#ecfdf5',
              color: '#059669',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <Compass size={20} />
            </div>
            <div>
              <h4 style={{ margin: '0 0 4px 0', fontSize: '14px', color: '#0f172a', fontWeight: 700 }}>رؤيتنا</h4>
              <p style={{ margin: 0, fontSize: '12px', color: '#64748b', lineHeight: 1.6 }}>
                الريادة في تقديم تعليم تطبيقي منافس يسهم في بناء أجيال مبدعة تواكب مستهدفات رؤية المملكة 2030.
              </p>
            </div>
          </div>

          <div style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '14px',
            padding: '16px',
            display: 'flex',
            gap: '12px'
          }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: '#eff6ff',
              color: '#2563eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <Award size={20} />
            </div>
            <div>
              <h4 style={{ margin: '0 0 4px 0', fontSize: '14px', color: '#0f172a', fontWeight: 700 }}>رسالتنا</h4>
              <p style={{ margin: 0, fontSize: '12px', color: '#64748b', lineHeight: 1.6 }}>
                توفير بيئة تعليمية محفزة لغرس القيم وتنمية المهارات وتطوير الكفايات المعرفية والتطبيقية.
              </p>
            </div>
          </div>
        </div>

        {/* Educational Tracks Grid */}
        <div style={{ marginBottom: '22px' }}>
          <h4 style={{ margin: '0 0 12px 0', fontSize: '15px', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BookOpen size={18} color="#0e7490" /> المسارات التعليمية المعتمدة
          </h4>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '10px' }}>
            
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', background: '#ffffff', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <CheckCircle2 size={16} color="#059669" style={{ marginTop: '2px', flexShrink: 0 }} />
              <div>
                <div style={{ fontWeight: 700, fontSize: '13px', color: '#0f172a' }}>المسار الأهلي المعتمد</div>
                <div style={{ fontSize: '11px', color: '#64748b' }}>مناهج وزارة التعليم مدعومة ببرامج إثرائية مكثفة في العلوم واللغة الإنجليزية</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', background: '#ffffff', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <CheckCircle2 size={16} color="#0284c7" style={{ marginTop: '2px', flexShrink: 0 }} />
              <div>
                <div style={{ fontWeight: 700, fontSize: '13px', color: '#0f172a' }}>المسار العالمي (International Track)</div>
                <div style={{ fontSize: '11px', color: '#64748b' }}>برامج الدبلومة الأمريكية والاعتمادات الأكاديمية الدولية</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', background: '#ffffff', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <CheckCircle2 size={16} color="#9333ea" style={{ marginTop: '2px', flexShrink: 0 }} />
              <div>
                <div style={{ fontWeight: 700, fontSize: '13px', color: '#0f172a' }}>التعلم الذكي ومنهجية STEM</div>
                <div style={{ fontSize: '11px', color: '#64748b' }}>ريادة متكاملة في دمج العلوم، التكنولوجيا، الهندسة، والرياضيات التطبيقية</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', background: '#ffffff', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <CheckCircle2 size={16} color="#d97706" style={{ marginTop: '2px', flexShrink: 0 }} />
              <div>
                <div style={{ fontWeight: 700, fontSize: '13px', color: '#0f172a' }}>أقسام تحفيظ القرآن الكريم</div>
                <div style={{ fontSize: '11px', color: '#64748b' }}>عناية بالقرآن الكريم وعلومه مع مناهج تفاعلية حديثة</div>
              </div>
            </div>

          </div>
        </div>

        {/* School Complexes and Branches */}
        <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '14px', border: '1px solid #e2e8f0', marginBottom: '22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#0e7490', fontWeight: 800, fontSize: '14px' }}>
              <MapPin size={18} color="#0e7490" /> مجمعات وأقسام مدارس النور الأهلية:
            </div>
            <div style={{ fontSize: '11px', color: '#059669', fontWeight: 700, background: '#ecfdf5', padding: '2px 8px', borderRadius: '10px' }}>
              بيئة تعليمية رائدة
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '8px', fontSize: '12px' }}>
            <div style={{ background: '#ffffff', padding: '8px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '14px' }}>🏢</span>
              <div>
                <strong style={{ color: '#0f172a' }}>مجمع البنين:</strong>
                <span style={{ color: '#64748b', fontSize: '11px', display: 'block' }}>المراحل الابتدائية، المتوسطة، والثانوية</span>
              </div>
            </div>

            <div style={{ background: '#ffffff', padding: '8px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '14px' }}>🏢</span>
              <div>
                <strong style={{ color: '#0f172a' }}>مجمع البنات:</strong>
                <span style={{ color: '#64748b', fontSize: '11px', display: 'block' }}>المراحل الابتدائية، المتوسطة، والثانوية</span>
              </div>
            </div>

            <div style={{ background: '#ffffff', padding: '8px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '14px' }}>🌐</span>
              <div>
                <strong style={{ color: '#0f172a' }}>مدارس النور العالمية:</strong>
                <span style={{ color: '#64748b', fontSize: '11px', display: 'block' }}>المسار الدولي والدبلومة الأمريكية</span>
              </div>
            </div>

            <div style={{ background: '#ffffff', padding: '8px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '14px' }}>🌱</span>
              <div>
                <strong style={{ color: '#0f172a' }}>روضة وحضانة النور:</strong>
                <span style={{ color: '#64748b', fontSize: '11px', display: 'block' }}>الطفولة المبكرة والتعليم التأسيسي التفاعلي</span>
              </div>
            </div>
          </div>

          {/* Unified Contact and Support */}
          <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', fontSize: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#475569' }}>
              <Phone size={15} color="#0e7490" />
              <span>خدمة أولياء الأمور والدعم الفني: <strong style={{ color: '#0e7490', letterSpacing: '0.5px' }} dir="ltr">مدارس النور الأهلية</strong></span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b', fontSize: '11px' }}>
              <ShieldCheck size={14} color="#059669" />
              <span>نظام إدارة مدرسي مستقل وآمن</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={onClose}
            className="btn btn-primary"
            style={{
              padding: '12px 28px',
              fontSize: '14px',
              fontWeight: 700,
              borderRadius: '12px'
            }}
          >
            إغلاق النافذة
          </button>
        </div>

      </div>
    </div>
  );
}
