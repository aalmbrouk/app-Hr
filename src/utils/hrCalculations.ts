import { Employee, LeaveTransaction, IncrementRecord, HrRule } from '../types';
import { calculateWorkingDaysBetween, calculateYearsDifference } from './dateUtils';

export const DEFAULT_HR_RULES: HrRule[] = [
  {
    id: 'RUL-001',
    ruleName: 'استحقاق الإجازة السنوية القياسية',
    key: 'standard_leave_days',
    value: 30,
    unit: 'يوم/سنة',
    description: 'عدد أيام الإجازة السنوية للموظفين الذين لم تتجاوز خدمتهم 20 سنة بمصرف الدم',
    category: 'إجازات',
    effectiveDate: '2020-01-01',
    isActive: true
  },
  {
    id: 'RUL-002',
    ruleName: 'عتبة خدمة الإجازة الإضافية (طويلة الخدمة)',
    key: 'long_service_years_threshold',
    value: 20,
    unit: 'سنوات',
    description: 'عدد سنوات الخدمة بمصرف الدم لمنح الإجازة السنوية الإضافية',
    category: 'إجازات',
    effectiveDate: '2020-01-01',
    isActive: true
  },
  {
    id: 'RUL-003',
    ruleName: 'استحقاق الإجازة السنوية لطويلي الخدمة',
    key: 'long_service_leave_days',
    value: 45,
    unit: 'يوم/سنة',
    description: 'عدد أيام الإجازة السنوية للموظفين الذين تجاوزت خدمتهم 20 سنة بمصرف الدم',
    category: 'إجازات',
    effectiveDate: '2020-01-01',
    isActive: true
  },
  {
    id: 'RUL-004',
    ruleName: 'سنوات الترقية للدرجات (1 إلى 10)',
    key: 'promotion_years_grade_1_10',
    value: 4,
    unit: 'سنوات أو علاوات',
    description: 'عدد السنوات أو العلاوات المستحقة للترقية من الدرجة 1 حتى 10',
    category: 'ترقيات',
    effectiveDate: '2020-01-01',
    isActive: true
  },
  {
    id: 'RUL-005',
    ruleName: 'سنوات الترقية للدرجات فوق 10',
    key: 'promotion_years_above_10',
    value: 5,
    unit: 'سنوات أو علاوات',
    description: 'عدد السنوات أو العلاوات المستحقة للترقية بعد الدرجة 10',
    category: 'ترقيات',
    effectiveDate: '2020-01-01',
    isActive: true
  }
];

/**
 * Calculates total full service years from Blood Bank Start Date (تاريخ المباشرة في مصرف الدم)
 */
export function calculateBloodBankServiceYears(employee: Partial<Employee>): number {
  const startDateStr = employee.bloodBankStartDate || employee.directingDate || employee.hireDate;
  if (!startDateStr) return 0;
  return calculateYearsDifference(startDateStr);
}

export function calculateServiceYears(directingDate?: string): number {
  if (!directingDate) return 0;
  return calculateYearsDifference(directingDate);
}

/**
 * Calculate annual leave entitlement based on Blood Bank service years and active HR rules
 */
export function calculateAnnualLeaveEntitlement(serviceYears: number, rules?: HrRule[]): number {
  const activeRules = rules || DEFAULT_HR_RULES;
  
  const standardRule = activeRules.find((r) => r.key === 'standard_leave_days');
  const thresholdRule = activeRules.find((r) => r.key === 'long_service_years_threshold');
  const longServiceRule = activeRules.find((r) => r.key === 'long_service_leave_days');

  const standardDays = standardRule ? Number(standardRule.value) : 30;
  const thresholdYears = thresholdRule ? Number(thresholdRule.value) : 20;
  const longServiceDays = longServiceRule ? Number(longServiceRule.value) : 45;

  return serviceYears > thresholdYears ? longServiceDays : standardDays;
}

/**
 * Helper to check if a leave type is deductible from annual leave
 */
export function isLeaveTypeDeductible(leaveType: string): boolean {
  if (leaveType === 'إجازة الوضع والأمومة' || leaveType === 'إجازة مرضية') {
    return false;
  }
  if (leaveType === 'إجازة سنوية' || leaveType === 'إجازة طارئة') {
    return true;
  }
  return false;
}

/**
 * Calculate Leave Summary for an employee according to Requirement #12 & #13
 */
export function calculateLeaveSummary(
  employee: Employee, 
  leaveTransactions: LeaveTransaction[], 
  rules?: HrRule[]
) {
  const serviceYears = calculateBloodBankServiceYears(employee);
  const entitlement = calculateAnnualLeaveEntitlement(serviceYears, rules);
  
  const approvedLeaves = leaveTransactions.filter(
    (lt) => lt.employeeId === employee.id && lt.status === 'مقبولة'
  );

  // Deductible leaves reduce the annual leave balance
  const deductibleLeaves = approvedLeaves.filter((lt) => {
    if (lt.deductsFromAnnualLeave !== undefined) return lt.deductsFromAnnualLeave;
    return isLeaveTypeDeductible(lt.leaveType);
  });

  // Non-deductible leaves (e.g. Maternity / Childbirth, Sick leave)
  const nonDeductibleLeaves = approvedLeaves.filter((lt) => {
    if (lt.deductsFromAnnualLeave !== undefined) return !lt.deductsFromAnnualLeave;
    return !isLeaveTypeDeductible(lt.leaveType);
  });

  const usedDays = deductibleLeaves.reduce((acc, curr) => acc + (curr.numberOfDays || 0), 0);
  const nonDeductibleDays = nonDeductibleLeaves.reduce((acc, curr) => acc + (curr.numberOfDays || 0), 0);
  const remainingDays = Math.max(0, entitlement - usedDays);

  return {
    serviceYears,
    isLongService: serviceYears > 20,
    entitlement,
    usedDays,
    remainingDays,
    nonDeductibleDays,
    approvedCount: approvedLeaves.length
  };
}

/**
 * Parse grade string into numeric grade
 */
export function parseGradeNumber(gradeStr?: string): number {
  if (!gradeStr) return 1;
  const matched = gradeStr.match(/\d+/);
  if (matched) return parseInt(matched[0], 10);
  
  if (gradeStr.includes('أولى') || gradeStr.includes('اولى') || gradeStr.includes('1')) return 1;
  if (gradeStr.includes('ثانية') || gradeStr.includes('2')) return 2;
  if (gradeStr.includes('ثالثة') || gradeStr.includes('3')) return 3;
  if (gradeStr.includes('رابعة') || gradeStr.includes('4')) return 4;
  if (gradeStr.includes('خامسة') || gradeStr.includes('5')) return 5;
  if (gradeStr.includes('سادسة') || gradeStr.includes('6')) return 6;
  if (gradeStr.includes('سابعة') || gradeStr.includes('7')) return 7;
  if (gradeStr.includes('ثامنة') || gradeStr.includes('8')) return 8;
  if (gradeStr.includes('تاسعة') || gradeStr.includes('9')) return 9;
  if (gradeStr.includes('عاشرة') || gradeStr.includes('10')) return 10;
  
  return 4; // fallback
}

/**
 * Calculate Annual Increment & Next Increment Date (#8)
 */
export function calculateNextIncrementDetails(employee: Employee) {
  const currentIncrement = employee.currentIncrement || 1;
  const gradeEntryDateStr = employee.gradeEntryDate || employee.directingDate || employee.hireDate;
  const gradeEntryDate = new Date(gradeEntryDateStr);
  const now = new Date();

  let yearsInGrade = 0;
  if (!isNaN(gradeEntryDate.getTime())) {
    yearsInGrade = (now.getTime() - gradeEntryDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
  }

  // Next increment expected 1 year after current increment eligibility or grade entry date + currentIncrement
  const nextIncrementDate = new Date(gradeEntryDate);
  nextIncrementDate.setFullYear(nextIncrementDate.getFullYear() + currentIncrement);

  const isIncrementDue = now >= nextIncrementDate && currentIncrement < 15;

  return {
    currentIncrement,
    nextIncrement: Math.min(15, currentIncrement + 1),
    nextIncrementDate: nextIncrementDate.toISOString().slice(0, 10),
    yearsInGrade: parseFloat(yearsInGrade.toFixed(1)),
    isIncrementDue
  };
}

/**
 * Promotion Eligibility Calculation based on Requirement #9 & #10
 */
export function calculatePromotionEligibility(
  employee: Employee, 
  _increments: IncrementRecord[], 
  rules?: HrRule[]
) {
  const activeRules = rules || DEFAULT_HR_RULES;
  const gradeNum = parseGradeNumber(employee.jobGrade);
  
  const rule1to10 = activeRules.find((r) => r.key === 'promotion_years_grade_1_10');
  const ruleAbove10 = activeRules.find((r) => r.key === 'promotion_years_above_10');

  const requiredYears1to10 = rule1to10 ? Number(rule1to10.value) : 4;
  const requiredYearsAbove10 = ruleAbove10 ? Number(ruleAbove10.value) : 5;

  const requiredYears = gradeNum > 10 ? requiredYearsAbove10 : requiredYears1to10;
  
  // Grade entry date (تاريخ الدرجة الحالية) - Requirement #9!
  const gradeStartDateStr = employee.gradeEntryDate || employee.eligibilityDate || employee.directingDate || employee.hireDate;
  const gradeStartDate = new Date(gradeStartDateStr);
  const now = new Date();

  let yearsSpent = 0;
  if (!isNaN(gradeStartDate.getTime())) {
    yearsSpent = (now.getTime() - gradeStartDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
  }
  
  const currentIncrement = employee.currentIncrement || 1;
  const remainingYears = Math.max(0, requiredYears - yearsSpent);
  // Promotion eligibility based on Current Grade Date + Current Grade + Number of Increments
  const isEligible = yearsSpent >= requiredYears || currentIncrement >= requiredYears;

  const expectedDate = new Date(gradeStartDate);
  expectedDate.setFullYear(expectedDate.getFullYear() + requiredYears);

  return {
    currentGrade: employee.jobGrade,
    gradeNum,
    currentIncrement,
    requiredYears,
    yearsSpent: parseFloat(yearsSpent.toFixed(1)),
    remainingYears: parseFloat(remainingYears.toFixed(1)),
    isEligible,
    expectedEligibilityDate: expectedDate.toISOString().slice(0, 10)
  };
}

/**
 * Calculates working days between start Date and end Date.
 * Forwards to the canonical `calculateWorkingDaysBetween` in dateUtils (which accounts for Libyan weekends and public holidays).
 */
export function calculateWorkingDays(startDateStr: string, endDateStr: string): number {
  return calculateWorkingDaysBetween(startDateStr, endDateStr).workingDays;
}

