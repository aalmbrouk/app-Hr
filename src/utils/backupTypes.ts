import { FullAppDatabase } from './storageTypes';

export interface BackupHistoryRecord {
  id: string;
  fileName: string;
  backupDate: string;
  backupDateFormatted: string;
  fileSizeBytes: number;
  fileSizeFormatted: string;
  backupType: 'يدوية' | 'تلقائية' | 'قبل الاستعادة' | 'تصدير كامل' | 'قبل تصفير قاعدة بيانات الموظفين' | string;
  format: 'ZIP' | 'BAK' | 'JSON' | 'DB';
  createdBy: string;
  status: 'ناجحة' | 'فاشلة';
  location: string;
  validationStatus: 'تم التحقق بنجاح' | 'تحذير' | 'فشل التحقق';
  recordCounts: {
    employees: number;
    leaves: number;
    promotions: number;
    increments: number;
    users: number;
    procedures: number;
    totalRecords: number;
  };
  checksum: string;
  errorMessage?: string;
  blobDataUrl?: string; // Optional cached object/data URL for immediate re-download in same session
}

export interface BackupPackageMetadata {
  appName: string;
  appTitle: string;
  appVersion: string;
  databaseVersion: number;
  databaseEngine: string;
  backupId: string;
  backupDate: string;
  backupType: string;
  createdBy: string;
  checksum: string;
  counts: {
    employees: number;
    leaves: number;
    promotions: number;
    increments: number;
    secondments: number;
    transfers: number;
    disciplinary: number;
    resignations: number;
    settlements: number;
    generalProcedures: number;
    orgUnits: number;
    jobTitles: number;
    hrRules: number;
    users: number;
    logs: number;
    totalRecords: number;
    documentsCount: number;
  };
  tablesList: string[];
}

export interface DatabaseTableSummary {
  tableName: string;
  arabicName: string;
  count: number;
  status: 'سليم' | 'فارغ';
  iconName?: string;
}

export interface DatabaseInfo {
  engine: string;
  name: string;
  version: number;
  location: string;
  status: 'متصل وجاهز' | 'خطأ' | 'غير متصل';
  totalSizeFormatted: string;
  totalSizeBytes: number;
  lastModified: string;
  tablesCount: number;
  totalRecordsCount: number;
  tableSummaries: DatabaseTableSummary[];
}

export interface DiagnosticCheckResult {
  id: string;
  stepName: string;
  status: 'passed' | 'warning' | 'failed' | 'pending';
  message: string;
  details?: string;
  timestamp?: string;
}
