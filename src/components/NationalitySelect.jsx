import React, { useState } from 'react';
import { Globe, Edit3, List } from 'lucide-react';

export const ARAB_NATIONALITIES = [
  'سعودي',
  'مصري',
  'يمني',
  'سوري',
  'أردني',
  'سوداني',
  'فلسطيني',
  'إماراتي',
  'كويتي',
  'عماني',
  'بحريني',
  'قطري',
  'عراقي',
  'لبناني',
  'مغربي',
  'جزائري',
  'تونسي',
  'ليبي',
  'موريتاني',
  'صومالي',
  'جيبوتي',
  'قمري'
];

/**
 * NationalitySelect
 * Allows selecting from all Arab nationalities or typing custom nationality manually
 */
export default function NationalitySelect({
  value = 'سعودي',
  onChange,
  label = 'الجنسية',
  required = false,
  style = {}
}) {
  const [isManual, setIsManual] = useState(false);

  // Check if current value is outside standard list
  const isCustomValue = value && !ARAB_NATIONALITIES.includes(value);

  const handleSelectChange = (e) => {
    const val = e.target.value;
    if (val === 'CUSTOM_MANUAL') {
      setIsManual(true);
    } else {
      onChange(val);
    }
  };

  return (
    <div style={{ ...style }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 'bold', color: 'var(--color-primary-dark, #0e7490)' }}>
          <Globe size={15} />
          <span>{label}</span>
          {required && <span style={{ color: '#ef4444' }}>*</span>}
        </label>

        <button
          type="button"
          onClick={() => setIsManual(!isManual)}
          style={{
            background: 'none',
            border: 'none',
            color: '#0e7490',
            fontSize: '11px',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '2px 6px',
            borderRadius: '4px'
          }}
          title={isManual ? 'التبديل إلى القائمة المنسدلة' : 'التبديل إلى الكتابة اليدوية'}
        >
          {isManual ? <List size={13} /> : <Edit3 size={13} />}
          <span>{isManual ? 'اختيار من قائمة' : 'كتابة يدوية'}</span>
        </button>
      </div>

      {isManual || isCustomValue ? (
        <div style={{ position: 'relative' }}>
          <input
            type="text"
            className="input-field"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder="اكتب الجنسية يدوياً (مثال: سعودي، مصري، كندي...)"
            required={required}
            list="arab-nationalities-list"
            style={{ width: '100%', marginBottom: 0 }}
          />
          <datalist id="arab-nationalities-list">
            {ARAB_NATIONALITIES.map((nat) => (
              <option key={nat} value={nat} />
            ))}
          </datalist>
        </div>
      ) : (
        <select
          className="input-field"
          value={value || 'سعودي'}
          onChange={handleSelectChange}
          required={required}
          style={{ width: '100%', marginBottom: 0 }}
        >
          <optgroup label="الدول العربية">
            {ARAB_NATIONALITIES.map((nat) => (
              <option key={nat} value={nat}>
                {nat}
              </option>
            ))}
          </optgroup>
          <option value="CUSTOM_MANUAL">✏️ جنسية أخرى (كتابة يدوية)...</option>
        </select>
      )}
    </div>
  );
}
