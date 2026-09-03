import { Employee, CareerPromotionRecord, FullAppDatabase } from '../types';
import { createPreImportBackup } from './excelMigrationUtils';

export interface SuspiciousEmployeeRecord {
  employee: Employee;
  reason: string;
  reasons: string[];
  evidence: string[];
  isPlaceholderName: boolean;
  isFakeSequentialNatId: boolean;
  isMissingIdentity: boolean;
  relatedDataCounts: {
    careerRecords: number;
    promotions: number;
    increments: number;
    leaves: number;
    disciplinary: number;
    secondments: number;
    transfers: number;
    resignations: number;
    settlements: number;
    generalProcedures: number;
    qualifications: number;
    annualEvaluations: number;
    totalRelated: number;
  };
  isQuarantined?: boolean;
}

export type DetectedInvalidEmployee = SuspiciousEmployeeRecord;

export interface DetectionReport {
  totalEmployees: number;
  totalBefore: number;
  suspiciousCount: number;
  placeholderNameCount: number;
  fakeSequentialIdCount: number;
  validEmployeesCount: number;
  realEmployeesCount: number;
  quarantinedCount: number;
  totalAfterProjected: number;
  suspiciousRecords: SuspiciousEmployeeRecord[];
  invalidEmployees: SuspiciousEmployeeRecord[];
}

export type SuspiciousScanResult = DetectionReport;

export const INVALID_PLACEHOLDER_NAMES = [
  'موظف غير معرف',
  'غير معرف',
  'موظف غير محدد',
  'غير محدد',
  'بدون اسم',
  'مجهول',
  'مجهول الهوية',
  'اسم غير مسجل',
  'سجل فارغ',
  'لا يوجد اسم',
  'لا يوجد',
  'بدون موظف',
  'غير متوفر',
  'unknown',
  'unknown employee',
  'undefined',
  'undefined employee',
  'employee unknown',
  'employee',
  'null',
  'none',
  'n/a'
];

/**
 * Checks if a given name string matches any placeholder / undefined pattern
 */
export function isInvalidPlaceholderName(name?: string | null): boolean {
  if (!name) return true;
  const trimmed = name.trim().toLowerCase();
  if (trimmed === '' || trimmed === 'null' || trimmed === 'undefined' || trimmed === 'none' || trimmed === 'n/a') return true;

  return INVALID_PLACEHOLDER_NAMES.some((placeholder) => {
    return trimmed === placeholder || trimmed.includes(placeholder);
  });
}

/**
 * Centralized Strict Employee Identity Validation Guard
 * Every single employee creation path MUST pass through this validation.
 */
export interface EmployeeValidationResult {
  isValid: boolean;
  error?: string;
  isPlaceholderName: boolean;
  isFakeSequentialNatId: boolean;
  isEmptyName: boolean;
}

export function validateEmployeeIdentityStrict(emp: Partial<Employee>): EmployeeValidationResult {
  const fullName = (emp.fullName || '').trim();
  const nationalId = (emp.nationalId || '').trim();

  if (!fullName) {
    return {
      isValid: false,
      error: 'اسم الموظف مفقود أو فارغ تماماً',
      isEmptyName: true,
      isPlaceholderName: false,
      isFakeSequentialNatId: false
    };
  }

  if (isInvalidPlaceholderName(fullName)) {
    return {
      isValid: false,
      error: `اسم الموظف نص غير صالح أو اسم نائب وهمي ("${fullName}")`,
      isEmptyName: false,
      isPlaceholderName: true,
      isFakeSequentialNatId: false
    };
  }

  if (nationalId && isFakeSequentialNationalId(nationalId, emp.id)) {
    return {
      isValid: false,
      error: `الرقم الوطني (${nationalId}) مولد بنمط تسلسلي وهمي غير معتمد`,
      isEmptyName: false,
      isPlaceholderName: false,
      isFakeSequentialNatId: true
    };
  }

  return {
    isValid: true,
    isEmptyName: false,
    isPlaceholderName: false,
    isFakeSequentialNatId: false
  };
}

/**
 * Detects whether a National ID was auto-generated sequentially or as a placeholder
 */
export function isFakeSequentialNationalId(nationalId?: string | null, employeeId?: number | string): boolean {
  if (!nationalId) return false;
  const trimmed = String(nationalId).trim();
  if (!trimmed) return false;

  // 1. Buggy pattern from old importer: 11990 + 7 padded digits (e.g. 119900000149 through 119900000680)
  if (/^11990\d{7}$/.test(trimmed)) {
    // If the last digits match the employee ID, it's 100% generated
    if (employeeId !== undefined) {
      const suffixNum = parseInt(trimmed.slice(5), 10);
      const empNum = typeof employeeId === 'number' ? employeeId : parseInt(String(employeeId), 10);
      if (!isNaN(suffixNum) && !isNaN(empNum) && suffixNum === empNum) {
        return true;
      }
    }
    return true;
  }

  // 2. Sequential / placeholder fake national IDs (e.g. 1000000001, 1000000002, 0000000001, 001, 002)
  if (/^10{7,9}\d{1,3}$/.test(trimmed)) return true;
  if (/^0{6,11}\d{1,4}$/.test(trimmed)) return true;
  if (/^0{1,3}[0-9]$/.test(trimmed)) return true;

  // 3. Repeated digits (e.g. 111111111111, 000000000000, 123456789012)
  if (/^(\d)\1{11}$/.test(trimmed)) return true;
  if (trimmed === '123456789012' || trimmed === '012345678901') return true;

  return false;
}

/**
 * Scans the database and detects suspicious records using multi-factor evidence.
 * CRITICAL RULE: Valid employees with missing National IDs or incomplete fields
 * MUST NOT be flagged if their names and records are authentic.
 */
export function scanDatabaseForSuspiciousRecords(
  dbOrEmployees: FullAppDatabase | Employee[],
  quarantinedOrCareer?: Set<number | string> | any[]
): DetectionReport {
  let allEmployees: Employee[] = [];
  let careerRecords: any[] = [];
  let promotions: any[] = [];
  let increments: any[] = [];
  let leaves: any[] = [];
  let disciplinary: any[] = [];
  let secondments: any[] = [];
  let transfers: any[] = [];
  let resignations: any[] = [];
  let settlements: any[] = [];
  let generalProcedures: any[] = [];
  let qualifications: any[] = [];
  let annualEvaluations: any[] = [];
  let quarantinedIdSet = new Set<number | string>();

  if (Array.isArray(dbOrEmployees)) {
    allEmployees = dbOrEmployees;
    if (Array.isArray(quarantinedOrCareer)) {
      careerRecords = quarantinedOrCareer;
    }
  } else if (dbOrEmployees && typeof dbOrEmployees === 'object') {
    allEmployees = dbOrEmployees.employees || [];
    careerRecords = dbOrEmployees.careerRecords || [];
    promotions = dbOrEmployees.promotions || [];
    increments = dbOrEmployees.increments || [];
    leaves = dbOrEmployees.leaves || [];
    disciplinary = dbOrEmployees.disciplinary || [];
    secondments = dbOrEmployees.secondments || [];
    transfers = dbOrEmployees.transfers || [];
    resignations = dbOrEmployees.resignations || [];
    settlements = dbOrEmployees.settlements || [];
    generalProcedures = dbOrEmployees.generalProcedures || [];
    qualifications = dbOrEmployees.qualifications || [];
    annualEvaluations = dbOrEmployees.annualEvaluations || [];
    if (quarantinedOrCareer instanceof Set) {
      quarantinedIdSet = quarantinedOrCareer;
    }
  }

  const suspiciousRecords: SuspiciousEmployeeRecord[] = [];

  allEmployees.forEach((emp) => {
    const isPlaceholder = isInvalidPlaceholderName(emp.fullName);
    const isFakeNatId = isFakeSequentialNationalId(emp.nationalId, emp.id);
    const isJobNumberPlaceholder = emp.jobNumber?.includes('ROW_') || emp.jobNumber?.includes('SYS_');
    const isMissingIdentity = !emp.fullName || emp.fullName.trim() === '';

    // Evidence aggregation
    const evidence: string[] = [];

    if (isPlaceholder) {
      evidence.push(`اسم الموظف نص وهمي/غير معرف ("${emp.fullName || 'فارغ'}")`);
    }
    if (isFakeNatId) {
      evidence.push(`الرقم الوطني (${emp.nationalId}) مولد آلياً بنمط تسلسلي وهمي (11990xxxxxxx)`);
    }
    if (isJobNumberPlaceholder) {
      evidence.push(`رقم الملف/الوظيفي (${emp.jobNumber}) مولد تلقائياً من رقم السطر`);
    }
    if (emp.notes?.includes('موظف غير معرف') || emp.notes?.includes('ROW_')) {
      evidence.push(`ملاحظات السجل تشير لخلل استيراد سابق`);
    }

    // Only classify as suspicious if there is clear evidence of being an invalid auto-generated record
    const isSuspicious = isPlaceholder || (isFakeNatId && (isPlaceholder || !emp.fullName || emp.fullName.length < 5));

    if (isSuspicious) {
      // Calculate count of related records in all tables
      const empIdStr = String(emp.id);
      const empJobStr = emp.jobNumber || '';

      const matchId = (itemEmpId?: any, itemJob?: any) => {
        if (itemEmpId !== undefined && (String(itemEmpId) === empIdStr || itemEmpId === emp.id)) return true;
        if (itemJob && empJobStr && itemJob === empJobStr) return true;
        return false;
      };

      const cCount = careerRecords.filter((c) => matchId(c.employeeId, c.fileNumber)).length;
      const pCount = promotions.filter((p) => matchId(p.employeeId, p.fileNumber)).length;
      const iCount = increments.filter((i) => matchId(i.employeeId, i.fileNumber)).length;
      const lCount = leaves.filter((l) => matchId(l.employeeId)).length;
      const dCount = disciplinary.filter((d) => matchId(d.employeeId)).length;
      const sCount = secondments.filter((s) => matchId(s.employeeId)).length;
      const tCount = transfers.filter((t) => matchId(t.employeeId)).length;
      const rCount = resignations.filter((r) => matchId(r.employeeId)).length;
      const setCount = settlements.filter((st) => matchId(st.employeeId)).length;
      const gpCount = generalProcedures.filter((g) => matchId(g.employeeId)).length;
      const qCount = qualifications.filter((q) => matchId(q.employeeId)).length;
      const aeCount = annualEvaluations.filter((a) => matchId(a.employeeId)).length;

      const totalRelated = cCount + pCount + iCount + lCount + dCount + sCount + tCount + rCount + setCount + gpCount + qCount + aeCount;

      let reason = 'سجل مولد آلياً وغير صالح ناتج عن استيراد خاطئ';
      if (isPlaceholder && isFakeNatId) {
        reason = 'اسم موظف غير معرف ورقم وطني تسلسلي وهمي';
      } else if (isPlaceholder) {
        reason = 'اسم موظف وهمي (موظف غير معرف)';
      } else if (isFakeNatId) {
        reason = 'رقم وطني مولد آلياً — غير صالح';
      }

      suspiciousRecords.push({
        employee: emp,
        reason,
        reasons: evidence.length > 0 ? evidence : [reason],
        evidence,
        isPlaceholderName: isPlaceholder,
        isFakeSequentialNatId: isFakeNatId,
        isMissingIdentity,
        relatedDataCounts: {
          careerRecords: cCount,
          promotions: pCount,
          increments: iCount,
          leaves: lCount,
          disciplinary: dCount,
          secondments: sCount,
          transfers: tCount,
          resignations: rCount,
          settlements: setCount,
          generalProcedures: gpCount,
          qualifications: qCount,
          annualEvaluations: aeCount,
          totalRelated
        },
        isQuarantined: quarantinedIdSet.has(emp.id)
      });
    }
  });

  const totalBefore = allEmployees.length;
  const suspiciousCount = suspiciousRecords.length;
  const realEmployeesCount = totalBefore - suspiciousCount;
  const quarantinedCount = suspiciousRecords.filter((s) => s.isQuarantined).length;
  const placeholderNameCount = suspiciousRecords.filter((s) => s.isPlaceholderName).length;
  const fakeSequentialIdCount = suspiciousRecords.filter((s) => s.isFakeSequentialNatId).length;

  return {
    totalEmployees: totalBefore,
    totalBefore,
    suspiciousCount,
    placeholderNameCount,
    fakeSequentialIdCount,
    validEmployeesCount: realEmployeesCount,
    realEmployeesCount,
    quarantinedCount,
    totalAfterProjected: realEmployeesCount,
    suspiciousRecords,
    invalidEmployees: suspiciousRecords
  };
}

/**
 * Safely removes selected invalid records after creating a mandatory snapshot backup.
 */
export function removeInvalidRecordsWithSafetyBackup(
  param1: any,
  param2: any,
  param3?: any
): {
  success: boolean;
  backupKey: string;
  deletedCount: number;
  removedCount: number;
  updatedDb: FullAppDatabase;
  cleanedDatabase: FullAppDatabase;
  error?: string;
} {
  let selectedEmpIds: (number | string)[] = [];
  let currentDb: FullAppDatabase;
  let deleteRelatedData = true;

  if (Array.isArray(param1)) {
    selectedEmpIds = param1.map((item) => (typeof item === 'object' && item?.employee?.id !== undefined ? item.employee.id : typeof item === 'object' && item?.id !== undefined ? item.id : item));
    currentDb = param2;
    if (typeof param3 === 'boolean') deleteRelatedData = param3;
  } else {
    currentDb = param1;
    if (Array.isArray(param3)) {
      selectedEmpIds = param3.map((item) => (typeof item === 'object' && item?.employee?.id !== undefined ? item.employee.id : typeof item === 'object' && item?.id !== undefined ? item.id : item));
    } else if (Array.isArray(param2)) {
      selectedEmpIds = param2.map((item) => (typeof item === 'object' && item?.employee?.id !== undefined ? item.employee.id : typeof item === 'object' && item?.id !== undefined ? item.id : item));
    }
  }

  // 1. Mandatory snapshot backup
  const backupRes = createPreImportBackup(currentDb);
  if (!backupRes.success) {
    return {
      success: false,
      backupKey: '',
      deletedCount: 0,
      removedCount: 0,
      updatedDb: currentDb,
      cleanedDatabase: currentDb,
      error: 'فشل إنشاء النسخة الاحتياطية الوقائية. تم إيقاف عملية الحذف لحماية البيانات.'
    };
  }

  const selectedSet = new Set(selectedEmpIds.map(String));

  // 2. Filter employees
  const remainingEmployees = (currentDb.employees || []).filter((emp) => !selectedSet.has(String(emp.id)));
  const deletedCount = (currentDb.employees || []).length - remainingEmployees.length;

  let remainingCareer = currentDb.careerRecords || [];
  let remainingPromotions = currentDb.promotions || [];
  let remainingIncrements = currentDb.increments || [];
  let remainingLeaves = currentDb.leaves || [];
  let remainingDisciplinary = currentDb.disciplinary || [];
  let remainingSecondments = currentDb.secondments || [];
  let remainingTransfers = currentDb.transfers || [];
  let remainingResignations = currentDb.resignations || [];
  let remainingSettlements = currentDb.settlements || [];
  let remainingProcedures = currentDb.generalProcedures || [];
  let remainingQuals = currentDb.qualifications || [];
  let remainingEvals = currentDb.annualEvaluations || [];

  if (deleteRelatedData) {
    remainingCareer = remainingCareer.filter((c) => !selectedSet.has(String(c.employeeId)));
    remainingPromotions = remainingPromotions.filter((p) => !selectedSet.has(String(p.employeeId)));
    remainingIncrements = remainingIncrements.filter((i) => !selectedSet.has(String(i.employeeId)));
    remainingLeaves = remainingLeaves.filter((l) => !selectedSet.has(String(l.employeeId)));
    remainingDisciplinary = remainingDisciplinary.filter((d) => !selectedSet.has(String(d.employeeId)));
    remainingSecondments = remainingSecondments.filter((s) => !selectedSet.has(String(s.employeeId)));
    remainingTransfers = remainingTransfers.filter((t) => !selectedSet.has(String(t.employeeId)));
    remainingResignations = remainingResignations.filter((r) => !selectedSet.has(String(r.employeeId)));
    remainingSettlements = remainingSettlements.filter((st) => !selectedSet.has(String(st.employeeId)));
    remainingProcedures = remainingProcedures.filter((g) => !selectedSet.has(String(g.employeeId)));
    remainingQuals = remainingQuals.filter((q) => !selectedSet.has(String(q.employeeId)));
    remainingEvals = remainingEvals.filter((e) => !selectedSet.has(String(e.employeeId)));
  }

  const updatedDb: FullAppDatabase = {
    ...currentDb,
    lastUpdated: new Date().toISOString(),
    employees: remainingEmployees,
    careerRecords: remainingCareer,
    promotions: remainingPromotions,
    increments: remainingIncrements,
    leaves: remainingLeaves,
    disciplinary: remainingDisciplinary,
    secondments: remainingSecondments,
    transfers: remainingTransfers,
    resignations: remainingResignations,
    settlements: remainingSettlements,
    generalProcedures: remainingProcedures,
    qualifications: remainingQuals,
    annualEvaluations: remainingEvals
  };

  return {
    success: true,
    backupKey: backupRes.backupKey,
    deletedCount,
    removedCount: deletedCount,
    updatedDb,
    cleanedDatabase: updatedDb
  };
}
