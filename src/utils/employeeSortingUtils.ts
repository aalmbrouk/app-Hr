import { Employee } from '../types';

/**
 * Extracts the integer numeric value from an employee's job number / file number.
 * Handles formats like:
 * - "1" -> 1
 * - "1/م" -> 1
 * - "001" -> 1
 * - "10" -> 10
 * - "142" -> 142
 * - "MLK-142" -> 142
 * - "FILE_050" -> 50
 * Returns null if no valid digits exist or if string is empty.
 */
export function parseNumericJobNumber(jobNumber?: string | null): number | null {
  if (!jobNumber) return null;
  const trimmed = String(jobNumber).trim();
  if (!trimmed) return null;

  // Match first contiguous sequence of digits
  const match = trimmed.match(/\d+/);
  if (!match) return null;

  const num = parseInt(match[0], 10);
  return isNaN(num) ? null : num;
}

/**
 * Checks whether an employee record is missing a valid numeric file number
 */
export function isMissingOrInvalidJobNumber(emp: Employee): boolean {
  return parseNumericJobNumber(emp.jobNumber) === null;
}

/**
 * Primary Ascending Numeric Comparator for Employees:
 * Guarantees numerical sorting: 1, 2, 3, ... 10, 11, 20, 100, 142.
 * Strictly prevents alphabetical sorting (1, 10, 100, 11, 2, 20, 3).
 * Employees without valid numeric numbers are placed at the end of the list.
 */
export function compareEmployeesByJobNumber(a: Employee, b: Employee): number {
  const numA = parseNumericJobNumber(a.jobNumber);
  const numB = parseNumericJobNumber(b.jobNumber);

  // Both have valid numeric values
  if (numA !== null && numB !== null) {
    if (numA !== numB) {
      return numA - numB;
    }
    // Tie-breaker on raw string with natural numeric collation
    const jobCompare = (a.jobNumber || '').localeCompare(b.jobNumber || '', 'ar', { numeric: true });
    if (jobCompare !== 0) return jobCompare;
    return (a.fullName || '').localeCompare(b.fullName || '', 'ar');
  }

  // A has numeric, B does not -> A comes first
  if (numA !== null && numB === null) {
    return -1;
  }

  // B has numeric, A does not -> B comes first
  if (numA === null && numB !== null) {
    return 1;
  }

  // Neither has numeric -> sort by name
  return (a.fullName || '').localeCompare(b.fullName || '', 'ar');
}

/**
 * Sorts an array of employees numerically ascending by job number.
 */
export function sortEmployeesNumerically(employees: Employee[]): Employee[] {
  return [...employees].sort(compareEmployeesByJobNumber);
}
