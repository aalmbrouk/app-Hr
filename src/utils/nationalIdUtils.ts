import { Employee, Gender } from '../types';

/**
 * Normalizes a National ID string by trimming whitespace and
 * converting Eastern Arabic-Indic numerals (٠-٩) to standard digits (0-9).
 */
export function normalizeNationalId(nationalId: any): string {
  if (nationalId === undefined || nationalId === null) return '';
  let str = String(nationalId).trim();

  // Convert Eastern Arabic-Indic digits (٠-٩) to Western Arabic digits (0-9)
  const arabicIndicDigits: Record<string, string> = {
    '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4',
    '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9'
  };
  str = str.replace(/[٠-٩]/g, (d) => arabicIndicDigits[d] || d);

  // Strip spaces, dashes, slashes, dots
  str = str.replace(/[\s\-_/.]/g, '');

  // Keep only digit characters
  str = str.replace(/\D/g, '');

  return str;
}

/**
 * Simple Automatic Gender Rule:
 * - National ID starts with 1 -> 'ذكر' (Male)
 * - National ID starts with 2 -> 'أنثى' (Female)
 */
export function getGenderFromNationalId(nationalId: any): Gender {
  const cleanId = normalizeNationalId(nationalId);
  const firstDigit = cleanId.charAt(0);
  if (firstDigit === '1') return 'ذكر';
  if (firstDigit === '2') return 'أنثى';
  return 'ذكر';
}

/**
 * Helper to get an employee's gender based on National ID rule
 */
export function getGenderFromEmployee(emp: Partial<Employee> | null | undefined): Gender {
  if (!emp) return 'ذكر';
  if (emp.nationalId) {
    const cleanId = normalizeNationalId(emp.nationalId);
    const firstDigit = cleanId.charAt(0);
    if (firstDigit === '1') return 'ذكر';
    if (firstDigit === '2') return 'أنثى';
  }
  return emp.gender === 'أنثى' ? 'أنثى' : 'ذكر';
}

/**
 * Formats gender display label:
 * "الجنس: ذكر" or "الجنس: أنثى"
 */
export function formatGenderDisplay(emp: Partial<Employee> | null | undefined): string {
  const gender = getGenderFromEmployee(emp);
  return gender === 'أنثى' ? 'الجنس: أنثى' : 'الجنس: ذكر';
}
