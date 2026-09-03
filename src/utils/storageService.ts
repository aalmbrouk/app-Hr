import { FullAppDatabase, ElectronStorageAPI } from './storageTypes';
import { Employee } from '../types';
import { DEFAULT_PROMOTION_RULES } from './promotionEngine';
import {
  INITIAL_EMPLOYEES,
  INITIAL_USERS,
  INITIAL_LOGS,
  INITIAL_SETTINGS,
  INITIAL_LEAVES,
  INITIAL_PROMOTIONS,
  INITIAL_INCREMENTS,
  INITIAL_SECONDMENTS,
  INITIAL_TRANSFERS,
  INITIAL_DISCIPLINARY,
  INITIAL_RESIGNATIONS,
  INITIAL_SETTLEMENTS,
  INITIAL_GENERAL_PROCEDURES,
  INITIAL_ORG_UNITS,
  INITIAL_JOB_TITLES,
  DEFAULT_HR_RULES,
  INITIAL_BULK_OPERATIONS,
  INITIAL_ANNUAL_EVALUATIONS
} from '../data/initialData';

const STORAGE_KEY = 'blood_bank_hr_database_v1';

/**
 * Ensures legacy records without nationality or documentType are safely migrated
 * without data loss, marking records needing verification for review.
 */
export function migrateEmployeeRecord(emp: any): Employee {
  const hasNationality = typeof emp.nationality === 'string' && emp.nationality.trim().length > 0;
  const is12DigitNationalId = typeof emp.nationalId === 'string' && /^[0-9]{12}$/.test(emp.nationalId.trim());
  
  let nationality = emp.nationality;
  let documentType = emp.documentType;
  let needsNationalityReview = emp.needsNationalityReview ?? false;
  let passportNumber = emp.passportNumber || '';
  let nationalId = emp.nationalId || '';

  if (!hasNationality) {
    if (is12DigitNationalId) {
      nationality = 'ليبي';
      documentType = 'الرقم الوطني';
      needsNationalityReview = false;
    } else {
      // Legacy record with missing nationality and non-standard national ID -> mark for review
      nationality = 'غير محدد';
      documentType = passportNumber ? 'رقم جواز السفر' : 'الرقم الوطني';
      needsNationalityReview = true;
    }
  } else {
    if (!documentType) {
      documentType = nationality === 'ليبي' ? 'الرقم الوطني' : 'رقم جواز السفر';
    }
  }

  return {
    ...emp,
    nationality: nationality || 'غير محدد',
    documentType: documentType || (nationality === 'ليبي' ? 'الرقم الوطني' : 'رقم جواز السفر'),
    nationalId,
    passportNumber,
    needsNationalityReview
  };
}

export function sanitizeDatabase(raw: Partial<FullAppDatabase>): FullAppDatabase {
  const base = getDefaultDatabase();
  const sanitizedEmployees = Array.isArray(raw.employees)
    ? raw.employees.map(migrateEmployeeRecord)
    : base.employees;

  return {
    ...base,
    ...raw,
    employees: sanitizedEmployees,
    annualEvaluations: Array.isArray(raw.annualEvaluations) ? raw.annualEvaluations : base.annualEvaluations,
    promotionRules: Array.isArray(raw.promotionRules) && raw.promotionRules.length > 0 ? raw.promotionRules : base.promotionRules
  };
}

export function getDefaultDatabase(): FullAppDatabase {
  return {
    version: 1,
    lastUpdated: new Date().toISOString(),
    employees: INITIAL_EMPLOYEES,
    users: INITIAL_USERS,
    logs: INITIAL_LOGS,
    settings: INITIAL_SETTINGS,
    leaves: INITIAL_LEAVES,
    promotions: INITIAL_PROMOTIONS,
    increments: INITIAL_INCREMENTS,
    secondments: INITIAL_SECONDMENTS,
    transfers: INITIAL_TRANSFERS,
    disciplinary: INITIAL_DISCIPLINARY,
    resignations: INITIAL_RESIGNATIONS,
    settlements: INITIAL_SETTLEMENTS,
    generalProcedures: INITIAL_GENERAL_PROCEDURES,
    orgUnits: INITIAL_ORG_UNITS,
    jobTitles: INITIAL_JOB_TITLES,
    hrRules: DEFAULT_HR_RULES,
    promotionRules: DEFAULT_PROMOTION_RULES,
    bulkOperations: INITIAL_BULK_OPERATIONS,
    annualEvaluations: INITIAL_ANNUAL_EVALUATIONS
  };
}

/**
 * Loads the complete database.
 * If running inside Electron, calls window.electronAPI.loadData().
 * If running in standard browser/preview, falls back to localStorage with initialData seed.
 */
export async function loadAppDatabase(): Promise<{ data: FullAppDatabase; isFirstRun: boolean; corrupted?: boolean; source: 'electron' | 'localStorage' }> {
  // Check for Electron IPC Bridge
  if (typeof window !== 'undefined' && window.electronAPI?.loadData) {
    try {
      const res = await window.electronAPI.loadData();
      if (res.success && res.data) {
        return { data: sanitizeDatabase(res.data), isFirstRun: !!res.isFirstRun, corrupted: !!res.corrupted, source: 'electron' };
      } else if (res.corrupted) {
        return { data: getDefaultDatabase(), isFirstRun: false, corrupted: true, source: 'electron' };
      }
    } catch (err) {
      console.error('[Storage] Electron loadData error, falling back to defaults:', err);
    }
  }

  // Browser / Preview fallback via localStorage
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && Array.isArray(parsed.employees)) {
          return { data: sanitizeDatabase(parsed), isFirstRun: false, source: 'localStorage' };
        }
      }
      // First run in browser: seed localStorage with defaults
      const defaults = getDefaultDatabase();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(defaults));
      return { data: defaults, isFirstRun: true, source: 'localStorage' };
    } catch (err) {
      console.warn('[Storage] localStorage read/parse failed, creating fresh instance:', err);
    }
  }

  return { data: getDefaultDatabase(), isFirstRun: true, source: 'localStorage' };
}

/**
 * Persists the full application state.
 * If running in Electron, dispatches saveData(data) to the main process for atomic safe write.
 * Also persists to localStorage for web/dev runtime.
 */
export async function saveAppDatabase(data: FullAppDatabase): Promise<{ success: boolean; error?: string }> {
  const updatedData: FullAppDatabase = {
    ...data,
    lastUpdated: new Date().toISOString()
  };

  let electronSuccess = false;

  // 1. Electron IPC Save
  if (typeof window !== 'undefined' && window.electronAPI?.saveData) {
    try {
      const res = await window.electronAPI.saveData(updatedData);
      electronSuccess = !!res.success;
      if (!res.success && res.error) {
        console.error('[Storage] Electron save error:', res.error);
      }
    } catch (err: any) {
      console.error('[Storage] Electron saveData call failed:', err);
    }
  }

  // 2. localStorage Mirror (guarantees persistence across web reloads / preview testing)
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedData));
    } catch (err) {
      console.warn('[Storage] localStorage write failed:', err);
    }
  }

  return { success: true };
}

/**
 * Exports a manual backup of hr-data.json with timestamp.
 * In Electron, prompts user for target path via native file dialog.
 * In browser, triggers a direct JSON download.
 */
export async function exportManualBackup(data: FullAppDatabase): Promise<{ success: boolean; message: string }> {
  let cleanData: FullAppDatabase;
  try {
    const rawJson = JSON.stringify(data);
    cleanData = JSON.parse(rawJson);
  } catch (serializationErr) {
    cleanData = data;
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const fileName = `BloodBank_HR_Backup_${timestamp}.json`;

  // Path 1: Electron Environment
  if (typeof window !== 'undefined' && window.electronAPI?.exportBackup) {
    try {
      const res = await window.electronAPI.exportBackup(fileName, cleanData);

      if (res && res.success && res.filePath) {
        return { success: true, message: `تم حفظ النسخة الاحتياطية بنجاح في: ${res.filePath}` };
      } else if (res && res.canceled) {
        return { success: false, message: 'تم إلغاء عملية حفظ النسخة الاحتياطية.' };
      } else {
        const errMsg = (res && res.error) ? res.error : (res ? 'لم يتم تحديد مسار الحفظ أو حدث خطأ أثناء الكتابة' : 'استجابة غير معرّفة من معالج سطح المكتب');
        return { success: false, message: `فشل تصدير النسخة الاحتياطية: ${errMsg}` };
      }
    } catch (err: any) {
      return { success: false, message: `حدث خطأ أثناء تصدير النسخة الاحتياطية: ${err?.message || String(err)}` };
    }
  }

  // Path 2: Browser download fallback (when window.electronAPI is not present)
  try {
    const jsonStr = JSON.stringify(cleanData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return { success: true, message: `تم تحميل ملف النسخة الاحتياطية (${fileName}) بنجاح.` };
  } catch (err: any) {
    return { success: false, message: `فشل إنشاء النسخة الاحتياطية: ${err?.message || String(err)}` };
  }
}
