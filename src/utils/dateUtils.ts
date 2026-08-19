/**
 * Date Cleaning, Normalization, Formatting, Leave & Increment Calculations
 * Blood Bank Central Al-Marj HR System - Version 3 Standards
 */

import { Employee, IncrementRecord, HrRule, PublicHoliday } from '../types';
import { parseGradeNumber } from './hrCalculations';

// Default Libyan Public Holidays (YYYY-MM-DD)
export const DEFAULT_PUBLIC_HOLIDAYS: string[] = [
  '2026-01-01', // رأس السنة الميلادية
  '2026-02-17', // ثورة 17 فبراير
  '2026-03-20', // عيد الفطر (تقديري)
  '2026-03-21',
  '2026-03-22',
  '2026-05-01', // عيد العمال
  '2026-05-27', // عيد الأضحى (تقديري)
  '2026-05-28',
  '2026-05-29',
  '2026-09-16', // يوم الشهيد
  '2026-10-23', // يوم التحرير
  '2026-12-24', // عيد الاستقلال
];

export const DEFAULT_PUBLIC_HOLIDAYS_OBJECTS: PublicHoliday[] = [
  { id: 'HOL-1', name: 'رأس السنة الميلادية', date: '2026-01-01', active: true },
  { id: 'HOL-2', name: 'ذكرى ثورة 17 فبراير', date: '2026-02-17', active: true },
  { id: 'HOL-3', name: 'عيد الفطر المبارك', date: '2026-03-20', active: true },
  { id: 'HOL-4', name: 'عطلة عيد الفطر 2', date: '2026-03-21', active: true },
  { id: 'HOL-5', name: 'عطلة عيد الفطر 3', date: '2026-03-22', active: true },
  { id: 'HOL-6', name: 'عيد العمال العالمي', date: '2026-05-01', active: true },
  { id: 'HOL-7', name: 'عيد الأضحى المبارك', date: '2026-05-27', active: true },
  { id: 'HOL-8', name: 'عطلة عيد الأضحى 2', date: '2026-05-28', active: true },
  { id: 'HOL-9', name: 'عطلة عيد الأضحى 3', date: '2026-05-29', active: true },
  { id: 'HOL-10', name: 'يوم الشهيد', date: '2026-09-16', active: true },
  { id: 'HOL-11', name: 'عيد التحرير', date: '2026-10-23', active: true },
  { id: 'HOL-12', name: 'عيد الاستقلال', date: '2026-12-24', active: true },
];

/**
 * Generate PDF filename e.g., Leave_1054_11-08-2026.pdf
 */
export function getLeavePdfFilename(jobNumber: string, startDateStr: string): string {
  const normDate = formatDateDisplay(startDateStr).replace(/\//g, '-');
  return `Leave_${jobNumber || '1054'}_${normDate || '11-08-2026'}.pdf`;
}

/**
 * Normalizes any input date (ISO string, timestamp, Excel number, DD/MM/YYYY, YYYY-MM-DD)
 * to internal storage format YYYY-MM-DD, stripping all time, timezone, and ISO offset info.
 */
export function normalizeDateStorage(input: any): string {
  if (input === null || input === undefined || input === '') return '';

  // If input is already a JavaScript Date object
  if (input instanceof Date) {
    if (isNaN(input.getTime())) return '';
    const y = input.getFullYear();
    const m = String(input.getMonth() + 1).padStart(2, '0');
    const d = String(input.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  // If input is an Excel serial date number (e.g. 44700)
  if (typeof input === 'number' || (!isNaN(Number(input)) && !String(input).includes('-') && !String(input).includes('/'))) {
    const serial = Number(input);
    if (serial > 1000) {
      const utc_days = Math.floor(serial - 25569);
      const utc_value = utc_days * 86400;
      const date_info = new Date(utc_value * 1000);
      const y = date_info.getUTCFullYear();
      const m = String(date_info.getUTCMonth() + 1).padStart(2, '0');
      const d = String(date_info.getUTCDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }
  }

  const str = String(input).trim();
  if (!str) return '';

  // Strip time / timezone part e.g. "2026-08-11T00:00:00+02:00" -> "2026-08-11"
  const cleanStr = str.split('T')[0].split(' ')[0];

  // Case 1: Already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(cleanStr)) {
    return cleanStr;
  }

  // Case 2: DD/MM/YYYY or DD-MM-YYYY
  const dmyMatch = cleanStr.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (dmyMatch) {
    const d = String(dmyMatch[1]).padStart(2, '0');
    const m = String(dmyMatch[2]).padStart(2, '0');
    const y = dmyMatch[3];
    return `${y}-${m}-${d}`;
  }

  // Case 3: YYYY/MM/DD
  const ymdMatch = cleanStr.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/);
  if (ymdMatch) {
    const y = ymdMatch[1];
    const m = String(ymdMatch[2]).padStart(2, '0');
    const d = String(ymdMatch[3]).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  // Case 4: Try standard Date parsing
  const parsed = new Date(cleanStr);
  if (!isNaN(parsed.getTime())) {
    const y = parsed.getFullYear();
    const m = String(parsed.getMonth() + 1).padStart(2, '0');
    const d = String(parsed.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  return '';
}

/**
 * Returns today's date formatted as standard storage string YYYY-MM-DD.
 */
export function getTodayDateStorage(): string {
  return normalizeDateStorage(new Date());
}

/**
 * Returns current timestamp formatted as YYYY-MM-DD HH:mm:ss.
 */
export function getCurrentTimestamp(): string {
  return new Date().toISOString().replace('T', ' ').slice(0, 19);
}

/**
 * Formats a date string (YYYY-MM-DD or ISO) into Arabic UI Display format DD/MM/YYYY.
 * Example: 2026-08-11 -> 11/08/2026
 */
export function formatDateDisplay(input: any): string {
  const normalized = normalizeDateStorage(input);
  if (!normalized) return '';
  const parts = normalized.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return normalized;
}

/**
 * Calculates complete integer years difference between start date and end date (defaults to today).
 * Properly accounts for month and day boundaries.
 */
export function calculateYearsDifference(startDate: Date | string, endDate: Date | string = new Date()): number {
  if (!startDate) return 0;
  const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
  const end = typeof endDate === 'string' ? new Date(endDate) : endDate;

  if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0;

  let years = end.getFullYear() - start.getFullYear();
  const m = end.getMonth() - start.getMonth();
  if (m < 0 || (m === 0 && end.getDate() < start.getDate())) {
    years--;
  }
  return Math.max(0, years);
}

/**
 * Clean & Normalize Excel import date with full preview comparison.
 */
export function cleanExcelDate(val: any): { original: string; normalizedStorage: string; display: string } {
  const rawStr = String(val ?? '');
  const normalizedStorage = normalizeDateStorage(val);
  const display = formatDateDisplay(normalizedStorage);
  return {
    original: rawStr,
    normalizedStorage,
    display
  };
}

/**
 * Checks if a given YYYY-MM-DD date is a non-working day (Friday = 5, Saturday = 6, or Public Holiday)
 */
export function isNonWorkingDay(dateStr: string, publicHolidays: string[] = DEFAULT_PUBLIC_HOLIDAYS): boolean {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return false;
  const dayOfWeek = d.getDay(); // 0: Sun, 1: Mon, 2: Tue, 3: Wed, 4: Thu, 5: Fri, 6: Sat
  if (dayOfWeek === 5 || dayOfWeek === 6) return true;
  return publicHolidays.includes(dateStr);
}

/**
 * Calculates End Date and Return Date automatically starting from startDateStr for N working days.
 * Excludes Fridays, Saturdays, and Public Holidays.
 */
export function calculateLeaveDatesFromWorkingDays(
  startDateStr: string,
  workingDaysCount: number,
  publicHolidays: string[] = DEFAULT_PUBLIC_HOLIDAYS
): { endDateStorage: string; endDateDisplay: string; returnDateStorage: string; returnDateDisplay: string; actualCalendarDays: number } {
  const normalizedStart = normalizeDateStorage(startDateStr);
  if (!normalizedStart || workingDaysCount <= 0) {
    return {
      endDateStorage: '',
      endDateDisplay: '',
      returnDateStorage: '',
      returnDateDisplay: '',
      actualCalendarDays: 0
    };
  }

  let curr = new Date(normalizedStart);
  let accumulatedWorkingDays = 0;
  let calendarDays = 0;
  let lastWorkingDay = new Date(curr);

  while (accumulatedWorkingDays < workingDaysCount) {
    const y = curr.getFullYear();
    const m = String(curr.getMonth() + 1).padStart(2, '0');
    const d = String(curr.getDate()).padStart(2, '0');
    const formattedCurr = `${y}-${m}-${d}`;

    if (!isNonWorkingDay(formattedCurr, publicHolidays)) {
      accumulatedWorkingDays++;
      lastWorkingDay = new Date(curr);
    }

    if (accumulatedWorkingDays < workingDaysCount) {
      curr.setDate(curr.getDate() + 1);
      calendarDays++;
    }
  }

  // End Date is the last valid leave day
  const endY = lastWorkingDay.getFullYear();
  const endM = String(lastWorkingDay.getMonth() + 1).padStart(2, '0');
  const endD = String(lastWorkingDay.getDate()).padStart(2, '0');
  const endDateStorage = `${endY}-${endM}-${endD}`;

  // Return Date is the very next working day after End Date
  let nextWork = new Date(lastWorkingDay);
  nextWork.setDate(nextWork.getDate() + 1);
  while (true) {
    const ny = nextWork.getFullYear();
    const nm = String(nextWork.getMonth() + 1).padStart(2, '0');
    const nd = String(nextWork.getDate()).padStart(2, '0');
    const formattedNext = `${ny}-${nm}-${nd}`;
    if (!isNonWorkingDay(formattedNext, publicHolidays)) {
      break;
    }
    nextWork.setDate(nextWork.getDate() + 1);
  }

  const retY = nextWork.getFullYear();
  const retM = String(nextWork.getMonth() + 1).padStart(2, '0');
  const retD = String(nextWork.getDate()).padStart(2, '0');
  const returnDateStorage = `${retY}-${retM}-${retD}`;

  return {
    endDateStorage,
    endDateDisplay: formatDateDisplay(endDateStorage),
    returnDateStorage,
    returnDateDisplay: formatDateDisplay(returnDateStorage),
    actualCalendarDays: calendarDays + 1
  };
}

/**
 * Calculates working days count between start and end date excluding Fri/Sat & Public Holidays, plus Return Date
 */
export function calculateWorkingDaysBetween(
  startDateStr: string,
  endDateStr: string,
  publicHolidays: string[] = DEFAULT_PUBLIC_HOLIDAYS
): { workingDays: number; returnDateStorage: string; returnDateDisplay: string } {
  const normStart = normalizeDateStorage(startDateStr);
  const normEnd = normalizeDateStorage(endDateStr);
  if (!normStart || !normEnd) return { workingDays: 0, returnDateStorage: '', returnDateDisplay: '' };

  const start = new Date(normStart);
  const end = new Date(normEnd);
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) {
    return { workingDays: 0, returnDateStorage: '', returnDateDisplay: '' };
  }

  let count = 0;
  let curr = new Date(start);
  while (curr <= end) {
    const y = curr.getFullYear();
    const m = String(curr.getMonth() + 1).padStart(2, '0');
    const d = String(curr.getDate()).padStart(2, '0');
    const formattedCurr = `${y}-${m}-${d}`;

    if (!isNonWorkingDay(formattedCurr, publicHolidays)) {
      count++;
    }
    curr.setDate(curr.getDate() + 1);
  }

  // Find Return Date (next working day after end date)
  let nextWork = new Date(end);
  nextWork.setDate(nextWork.getDate() + 1);
  while (true) {
    const ny = nextWork.getFullYear();
    const nm = String(nextWork.getMonth() + 1).padStart(2, '0');
    const nd = String(nextWork.getDate()).padStart(2, '0');
    const formattedNext = `${ny}-${nm}-${nd}`;
    if (!isNonWorkingDay(formattedNext, publicHolidays)) {
      break;
    }
    nextWork.setDate(nextWork.getDate() + 1);
  }

  const retY = nextWork.getFullYear();
  const retM = String(nextWork.getMonth() + 1).padStart(2, '0');
  const retD = String(nextWork.getDate()).padStart(2, '0');
  const returnDateStorage = `${retY}-${retM}-${retD}`;

  return {
    workingDays: count,
    returnDateStorage,
    returnDateDisplay: formatDateDisplay(returnDateStorage)
  };
}

/**
 * Requirement #27, #28, #29, #30: Annual Increment Engine
 * Calculates increments due based on selected method:
 * 'Anniversary Date' (Same Date as Last Increment) vs 'January 1st'
 */
export function calculateAnnualIncrements(
  employee: Employee,
  method: 'Anniversary Date' | 'January 1st' = 'Anniversary Date',
  asOfDateStr?: string
): {
  currentIncrement: number;
  incrementsDue: number;
  recommendedIncrement: number;
  lastIncrementDateStorage: string;
  nextIncrementDateStorage: string;
  nextIncrementDateDisplay: string;
  incrementStatus: 'مستحقة' | 'سارية' | 'مكتملة الحد الأقصى';
} {
  const asOf = asOfDateStr ? new Date(normalizeDateStorage(asOfDateStr)) : new Date();
  const currentIncrement = Number(employee.currentIncrement || 1);
  
  // Last Increment Date or Grade Entry Date or Directing Date
  const lastIncStr = normalizeDateStorage(employee.gradeEntryDate || employee.eligibilityDate || employee.directingDate || employee.hireDate) || '2022-05-18';
  const lastIncDate = new Date(lastIncStr);

  if (isNaN(lastIncDate.getTime())) {
    return {
      currentIncrement,
      incrementsDue: 0,
      recommendedIncrement: currentIncrement,
      lastIncrementDateStorage: lastIncStr,
      nextIncrementDateStorage: '',
      nextIncrementDateDisplay: '',
      incrementStatus: 'سارية'
    };
  }

  let nextIncDate = new Date(lastIncDate);

  if (method === 'January 1st') {
    // January 1st of each subsequent year
    nextIncDate = new Date(lastIncDate.getFullYear() + 1, 0, 1);
  } else {
    // Anniversary method: same day/month next year
    nextIncDate.setFullYear(lastIncDate.getFullYear() + 1);
  }

  let incrementsDue = 0;
  let tempNext = new Date(nextIncDate);

  while (asOf >= tempNext && (currentIncrement + incrementsDue) < 15) {
    incrementsDue++;
    if (method === 'January 1st') {
      tempNext.setFullYear(tempNext.getFullYear() + 1);
    } else {
      tempNext.setFullYear(tempNext.getFullYear() + 1);
    }
  }

  const ny = tempNext.getFullYear();
  const nm = String(tempNext.getMonth() + 1).padStart(2, '0');
  const nd = String(tempNext.getDate()).padStart(2, '0');
  const nextIncrementDateStorage = `${ny}-${nm}-${nd}`;

  const recommendedIncrement = Math.min(15, currentIncrement + incrementsDue);
  const incrementStatus = currentIncrement >= 15 ? 'مكتملة الحد الأقصى' : (incrementsDue > 0 ? 'مستحقة' : 'سارية');

  return {
    currentIncrement,
    incrementsDue,
    recommendedIncrement,
    lastIncrementDateStorage: lastIncStr,
    nextIncrementDateStorage,
    nextIncrementDateDisplay: formatDateDisplay(nextIncrementDateStorage),
    incrementStatus
  };
}

/**
 * Requirement #24, #25, #26, #33: Promotion Recommendation Engine
 * Evaluates promotion eligibility based on Latest Grade Date, Increments & HR rules.
 */
export function calculatePromotionRecommendation(
  employee: Employee,
  rules?: HrRule[],
  incrementMethod: 'Anniversary Date' | 'January 1st' = 'Anniversary Date'
): {
  employeeId: number;
  jobNumber: string;
  fullName: string;
  department: string;
  currentGrade: string;
  gradeNum: number;
  currentGradeDateStorage: string;
  currentGradeDateDisplay: string;
  currentIncrement: number;
  incrementsDue: number;
  lastPromotionDateStorage: string;
  lastPromotionDateDisplay: string;
  eligibilityDateStorage: string;
  eligibilityDateDisplay: string;
  yearsInGrade: number;
  requiredYears: number;
  status: 'مستحق للترقية' | 'قريب من الاستحقاق' | 'غير مستحق' | 'مراجعة يدوية';
  recommendedNewGrade: string;
  notes: string;
} {
  const gradeNum = parseGradeNumber(employee.jobGrade);

  // Grade rules: 1-10 requires 4 years; >10 requires 5 years
  let requiredYears = gradeNum > 10 ? 5 : 4;
  if (rules && Array.isArray(rules)) {
    const r1 = rules.find((r) => r.key === 'promotion_years_grade_1_10');
    const r2 = rules.find((r) => r.key === 'promotion_years_above_10');
    if (gradeNum <= 10 && r1) requiredYears = Number(r1.value) || 4;
    if (gradeNum > 10 && r2) requiredYears = Number(r2.value) || 5;
  }

  // Requirement #25: Do NOT use original appointment date if a more recent grade date exists!
  const lastGradeDateStorage = normalizeDateStorage(
    employee.gradeEntryDate || employee.eligibilityDate || employee.directingDate || employee.hireDate
  ) || '2022-05-18';

  const gradeDate = new Date(lastGradeDateStorage);
  const now = new Date();

  let yearsInGrade = 0;
  if (!isNaN(gradeDate.getTime())) {
    yearsInGrade = (now.getTime() - gradeDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
  }

  // Calculate annual increments
  const incCalc = calculateAnnualIncrements(employee, incrementMethod);
  const currentIncrement = employee.currentIncrement || 1;

  // Expected promotion eligibility date = Grade Date + requiredYears
  const eligibilityDateObj = new Date(gradeDate);
  eligibilityDateObj.setFullYear(eligibilityDateObj.getFullYear() + requiredYears);

  const ey = eligibilityDateObj.getFullYear();
  const em = String(eligibilityDateObj.getMonth() + 1).padStart(2, '0');
  const ed = String(eligibilityDateObj.getDate()).padStart(2, '0');
  const eligibilityDateStorage = `${ey}-${em}-${ed}`;

  let status: 'مستحق للترقية' | 'قريب من الاستحقاق' | 'غير مستحق' | 'مراجعة يدوية' = 'غير مستحق';
  let notes = '';

  if (yearsInGrade >= requiredYears || currentIncrement >= requiredYears + 1) {
    status = 'مستحق للترقية';
    notes = `مستوفٍ للسنوات القانونية بالدرجة (${yearsInGrade.toFixed(1)} سنة) والعلاوات (${currentIncrement})`;
  } else if (yearsInGrade >= requiredYears - 0.5) {
    status = 'قريب من الاستحقاق';
    notes = `متبقٍ أقل من 6 أشهر لاستيفاء المدة القانونية بالدرجة`;
  } else if (employee.status !== 'على رأس العمل') {
    status = 'مراجعة يدوية';
    notes = `الموظف في حالة وظيفية خاصة: (${employee.status})`;
  } else {
    status = 'غير مستحق';
    notes = `مضي ${yearsInGrade.toFixed(1)} سنة من أصل ${requiredYears} سنوات مطلوبة`;
  }

  // Recommended next grade name
  const nextGradeNum = gradeNum + 1;
  const gradeNamesMap: { [key: number]: string } = {
    1: 'الدرجة الأولى',
    2: 'الدرجة الثانية',
    3: 'الدرجة الثالثة',
    4: 'الدرجة الرابعة',
    5: 'الدرجة الخامسة',
    6: 'الدرجة السادسة',
    7: 'الدرجة السابعة',
    8: 'الدرجة الثامنة',
    9: 'الدرجة التاسعة',
    10: 'الدرجة العاشرة',
    11: 'الدرجة الحادية عشر',
    12: 'الدرجة الثانية عشر',
    13: 'الدرجة الثالثة عشر',
    14: 'الدرجة الرابعة عشر',
    15: 'الدرجة الخامسة عشر'
  };

  const recommendedNewGrade = gradeNamesMap[nextGradeNum] || `الدرجة ${nextGradeNum}`;

  return {
    employeeId: employee.id,
    jobNumber: employee.jobNumber,
    fullName: employee.fullName,
    department: employee.department,
    currentGrade: employee.jobGrade,
    gradeNum,
    currentGradeDateStorage: lastGradeDateStorage,
    currentGradeDateDisplay: formatDateDisplay(lastGradeDateStorage),
    currentIncrement,
    incrementsDue: incCalc.incrementsDue,
    lastPromotionDateStorage: lastGradeDateStorage,
    lastPromotionDateDisplay: formatDateDisplay(lastGradeDateStorage),
    eligibilityDateStorage,
    eligibilityDateDisplay: formatDateDisplay(eligibilityDateStorage),
    yearsInGrade: parseFloat(yearsInGrade.toFixed(1)),
    requiredYears,
    status,
    recommendedNewGrade,
    notes
  };
}
