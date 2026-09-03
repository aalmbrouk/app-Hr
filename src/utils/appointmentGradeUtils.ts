import { AppointmentSalarySystem, AppointmentGradeConfig } from '../types';

export const APPOINTMENT_SALARY_SYSTEMS: AppointmentSalarySystem[] = [
  'جدول مرتبات القانون 15',
  'اللائحة 418 – العناصر الطبية'
];

/**
 * Standard Law 15 Appointment Grades (الدرجة الأولى إلى الدرجة الخامسة عشرة)
 */
export const LAW_15_DEFAULT_GRADES = [
  'الدرجة الأولى',
  'الدرجة الثانية',
  'الدرجة الثالثة',
  'الدرجة الرابعة',
  'الدرجة الخامسة',
  'الدرجة السادسة',
  'الدرجة السابعة',
  'الدرجة الثامنة',
  'الدرجة التاسعة',
  'الدرجة العاشرة',
  'الدرجة الحادية عشرة',
  'الدرجة الثانية عشرة',
  'الدرجة الثالثة عشرة',
  'الدرجة الرابعة عشرة',
  'الدرجة الخامسة عشرة'
];

/**
 * Standard Regulation 418 Medical Classifications (اللائحة 418 – العناصر الطبية)
 */
export const REGULATION_418_DEFAULT_GRADES = [
  'معاون صحي رابع',
  'معاون صحي ثالث',
  'معاون صحي ثاني',
  'معاون صحي أول',
  'فني رابع',
  'فني ثالث',
  'فني ثاني',
  'فني أول',
  'كبير فنيين',
  'طبيب ثالث',
  'طبيب ثاني',
  'طبيب أول',
  'أخصائي'
];

/**
 * Initial standard configuration for appointment grades and their configurable increments
 */
export const DEFAULT_APPOINTMENT_GRADE_CONFIGS: AppointmentGradeConfig[] = [
  // Law 15
  ...LAW_15_DEFAULT_GRADES.map((grade, index) => ({
    id: `LAW15-${index + 1}`,
    salarySystem: 'جدول مرتبات القانون 15' as AppointmentSalarySystem,
    gradeName: grade,
    maxIncrements: 10,
    availableIncrements: Array.from({ length: 11 }, (_, i) => i), // 0 to 10
    sortOrder: index + 1,
    active: true,
    notes: 'جدول مرتبات الموظفين العام - القانون 15'
  })),

  // Regulation 418
  ...REGULATION_418_DEFAULT_GRADES.map((grade, index) => ({
    id: `REG418-${index + 1}`,
    salarySystem: 'اللائحة 418 – العناصر الطبية' as AppointmentSalarySystem,
    gradeName: grade,
    maxIncrements: 10,
    availableIncrements: Array.from({ length: 11 }, (_, i) => i), // 0 to 10
    sortOrder: index + 1,
    active: true,
    notes: 'جدول مرتبات الكوادر الطبية والطبية المساعدة - اللائحة 418'
  }))
];

/**
 * Returns the list of active appointment grades for the selected salary system.
 * Filters by salary system strictly and ensures no mixing of grades.
 */
export function getAvailableAppointmentGrades(
  salarySystem?: string,
  configs: AppointmentGradeConfig[] = DEFAULT_APPOINTMENT_GRADE_CONFIGS
): AppointmentGradeConfig[] {
  if (!salarySystem) return [];

  const activeConfigs = (configs && configs.length > 0 ? configs : DEFAULT_APPOINTMENT_GRADE_CONFIGS)
    .filter((c) => c.active && c.salarySystem === salarySystem)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  return activeConfigs;
}

/**
 * Returns available increments for a given salary system and grade
 */
export function getAvailableIncrementsForGrade(
  salarySystem?: string,
  gradeName?: string,
  configs: AppointmentGradeConfig[] = DEFAULT_APPOINTMENT_GRADE_CONFIGS
): number[] {
  if (!salarySystem || !gradeName) return [0, 1, 2, 3, 4, 5];

  const allConfigs = configs && configs.length > 0 ? configs : DEFAULT_APPOINTMENT_GRADE_CONFIGS;
  const match = allConfigs.find(
    (c) => c.salarySystem === salarySystem && normalizeGradeString(c.gradeName) === normalizeGradeString(gradeName)
  );

  if (match) {
    if (match.availableIncrements && match.availableIncrements.length > 0) {
      return match.availableIncrements;
    }
    const max = Math.max(0, match.maxIncrements || 10);
    return Array.from({ length: max + 1 }, (_, i) => i);
  }

  return Array.from({ length: 11 }, (_, i) => i); // default 0..10
}

/**
 * Normalizes grade strings for reliable comparison (strips extra spaces, hamza, taa marbuta)
 */
export function normalizeGradeString(str?: string): string {
  if (!str) return '';
  return str
    .trim()
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/\s+/g, ' ')
    .toLowerCase();
}

/**
 * Infers the salary system from raw appointment grade name.
 * Prevents unsafe assumptions: if it cannot be determined with certainty, flags for review.
 */
export function inferSalarySystemFromGrade(
  rawGrade?: string,
  configs: AppointmentGradeConfig[] = DEFAULT_APPOINTMENT_GRADE_CONFIGS
): {
  system?: AppointmentSalarySystem;
  matchedGrade?: string;
  needsReview: boolean;
} {
  if (!rawGrade || !rawGrade.trim()) {
    return { system: undefined, matchedGrade: '', needsReview: true };
  }

  const normalized = normalizeGradeString(rawGrade);

  // Check Regulation 418 Medical Elements
  const regMatch = REGULATION_418_DEFAULT_GRADES.find(
    (g) => normalizeGradeString(g) === normalized || normalized.includes(normalizeGradeString(g))
  );

  if (regMatch) {
    return {
      system: 'اللائحة 418 – العناصر الطبية',
      matchedGrade: regMatch,
      needsReview: false
    };
  }

  // Check Law 15 General Grades
  // e.g. "الدرجة السادسة", "السادسة", "الدرجة 6", "درجة 6"
  const lawMatch = LAW_15_DEFAULT_GRADES.find(
    (g) => normalizeGradeString(g) === normalized || normalized.includes(normalizeGradeString(g))
  );

  if (lawMatch) {
    return {
      system: 'جدول مرتبات القانون 15',
      matchedGrade: lawMatch,
      needsReview: false
    };
  }

  // Number based Law 15 matching (e.g., "الدرجة 1", "الدرجة 6", "6")
  const numMatch = rawGrade.match(/\b(1[0-5]|[1-9])\b/);
  if (numMatch && (rawGrade.includes('درجة') || rawGrade.includes('الدرجة'))) {
    const gradeIdx = parseInt(numMatch[1], 10) - 1;
    if (gradeIdx >= 0 && gradeIdx < LAW_15_DEFAULT_GRADES.length) {
      return {
        system: 'جدول مرتبات القانون 15',
        matchedGrade: LAW_15_DEFAULT_GRADES[gradeIdx],
        needsReview: false
      };
    }
  }

  // Ambiguous or unknown grade string - Do NOT make an unsafe assumption
  return {
    system: undefined,
    matchedGrade: rawGrade.trim(),
    needsReview: true
  };
}

/**
 * Validates that an appointment grade matches its salary system correctly
 */
export function validateAppointmentGrade(
  salarySystem?: string,
  gradeName?: string,
  configs: AppointmentGradeConfig[] = DEFAULT_APPOINTMENT_GRADE_CONFIGS
): { isValid: boolean; error?: string } {
  if (!salarySystem && !gradeName) {
    return { isValid: true };
  }

  if (!salarySystem && gradeName) {
    return {
      isValid: false,
      error: 'يرجى تحديد نظام الدرجة المعين عليها (جدول مرتبات القانون 15 أو اللائحة 418).'
    };
  }

  if (salarySystem && !gradeName) {
    return {
      isValid: false,
      error: 'يرجى اختيار الدرجة المعين عليها من القائمة.'
    };
  }

  const validGrades = getAvailableAppointmentGrades(salarySystem, configs);
  const exists = validGrades.some(
    (g) => normalizeGradeString(g.gradeName) === normalizeGradeString(gradeName)
  );

  if (!exists) {
    return {
      isValid: false,
      error: `الدرجة "${gradeName}" غير مطابقة لنظام "${salarySystem}". يرجى اختيار درجة صحيحة من القائمة المتاحة.`
    };
  }

  return { isValid: true };
}
