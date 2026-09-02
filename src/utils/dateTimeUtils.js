/**
 * Utility functions for precise cross-browser date and time handling in exams and assignments.
 */

/**
 * Parses date string (YYYY-MM-DD) and time string (HH:mm) into a reliable Date object in local time.
 * Overcomes cross-browser ISO parsing quirks and handles single or double digit hours and minutes.
 */
export function parseExamDateTime(dateStr, timeStr) {
  if (!dateStr) return null;
  const t = timeStr || '00:00';
  const timeParts = t.split(':').map(n => parseInt(n, 10));
  const hour = isNaN(timeParts[0]) ? 0 : timeParts[0];
  const min = isNaN(timeParts[1]) ? 0 : timeParts[1];

  const dateParts = dateStr.split('-').map(n => parseInt(n, 10));
  if (dateParts.length === 3 && !isNaN(dateParts[0]) && !isNaN(dateParts[1]) && !isNaN(dateParts[2])) {
    return new Date(dateParts[0], dateParts[1] - 1, dateParts[2], hour, min, 0, 0);
  }

  return new Date(`${dateStr}T${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}:00`);
}

/**
 * Formats a Date object or ISO string into localized Arabic time (e.g. "09:15 ص" or "02:30 م").
 */
export function formatArabicTime(dateInput) {
  if (!dateInput) return '—';
  const date = typeof dateInput === 'string' ? new Date(dateInput) : (dateInput.toDate ? dateInput.toDate() : dateInput);
  if (isNaN(date.getTime())) return '—';

  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const period = hours >= 12 ? 'م' : 'ص';
  hours = hours % 12;
  hours = hours ? hours : 12; // 0 becomes 12
  const formattedHours = String(hours).padStart(2, '0');

  return `${formattedHours}:${minutes} ${period}`;
}

/**
 * Calculates cutoff time string (HH:mm) given a start time string. Defaults to +30 minutes.
 */
export function calculateDefaultCutoff(timeStr, offsetMinutes = 30) {
  if (!timeStr) return '';
  const parts = timeStr.split(':').map(Number);
  if (parts.length < 2 || isNaN(parts[0]) || isNaN(parts[1])) return '';
  const totalMins = parts[0] * 60 + parts[1] + offsetMinutes;
  const newH = Math.floor(totalMins / 60) % 24;
  const newM = totalMins % 60;
  return `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`;
}
