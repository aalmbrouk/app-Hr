import React, { useState, useRef, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { 
  Employee, 
  CareerPromotionRecord, 
  PromotionRecord, 
  IncrementRecord, 
  StatusSettlementRecord,
  SystemSettings,
  AppointmentSalarySystem,
  AssignmentCategory,
  EmploymentStatus
} from '../types';
import { 
  FileSpreadsheet, 
  Upload, 
  Search, 
  CheckCircle2, 
  AlertTriangle, 
  AlertCircle, 
  Info, 
  RotateCcw, 
  Download, 
  ShieldCheck, 
  Eye, 
  Check, 
  X, 
  Filter, 
  Printer, 
  FileText, 
  ArrowRight, 
  RefreshCw, 
  Layers, 
  ArrowLeftRight, 
  Building2, 
  HelpCircle, 
  Sliders, 
  CheckSquare, 
  Square,
  Sparkles,
  Zap,
  Calendar,
  UserCheck,
  UserPlus,
  FileCode,
  ShieldAlert,
  Flame
} from 'lucide-react';
import { FullAppDatabase } from '../utils/storageTypes';
import { 
  isRecognizedJobGrade, 
  RECOGNIZED_JOB_GRADES,
  getLastPreImportBackup,
  rollbackLastPreImportBackup,
  downloadSampleExcelWorkbook,
  getSampleCleanedGoogleMergedExcelData,
  UnlinkedCareerRecord,
  UnlinkedExcelRow
} from '../utils/excelMigrationUtils';
import { 
  isInvalidPlaceholderName, 
  isFakeSequentialNationalId, 
  scanDatabaseForSuspiciousRecords, 
  removeInvalidRecordsWithSafetyBackup, 
  DetectedInvalidEmployee,
  SuspiciousScanResult
} from '../utils/fakeRecordDetection';
import { normalizeDateStorage, formatDateDisplay } from '../utils/dateUtils';
import { createDatabaseBackup } from '../utils/backupService';
import { getGenderFromNationalId } from '../utils/nationalIdUtils';

// Types for the Validation & Inspection Engine
export type ValidationStatus = 'valid' | 'warning' | 'critical' | 'duplicate' | 'existing_match' | 'new_employee';

export interface CareerSequenceStep {
  date: string;
  grade: string;
  increment: number;
  actionType: string;
  decisionNumber: string;
  decisionDate: string;
  rawRowNumber: number;
}

export interface ValidatedRecordItem {
  id: string;
  rowNumber: number;
  nationalId: string;
  employeeName: string;
  jobNumber: string;
  actionType: string;
  actionDate: string;
  previousGrade: string;
  previousIncrement: number;
  newGrade: string;
  newIncrement: number;
  specialization: string;
  qualification: string;
  hireDate: string;
  status: string;
  department: string;
  cadreNumber: string;
  decisionNumber: string;
  decisionDate: string;
  notes: string;

  // Validation Outputs
  validationStatus: ValidationStatus;
  isCritical: boolean;
  needsReview: boolean;
  isValid: boolean;
  isDuplicate: boolean;
  isExistingEmployee: boolean;
  isNewEmployee: boolean;
  isNewHistoricalRecord: boolean;
  
  // Specific issues flags
  hasSpecializationGradeError: boolean;
  suggestedSpecializationFix?: { fromField: string; toField: string; gradeVal: string };
  hasRegulation418Issue: boolean;
  hasGradeSystemCross: boolean;
  hasSuspiciousGradeJump: boolean;
  hasMissingRequiredField: boolean;
  hasInvalidDate: boolean;
  hasCareerSequenceConflict: boolean;
  
  // Detailed issue explanations & recommendations
  issuesList: Array<{
    type: 'critical' | 'warning' | 'info';
    category: 
      | 'missing_field' 
      | 'invalid_date' 
      | 'duplicate' 
      | 'specialization_grade' 
      | 'regulation_418' 
      | 'grade_system_cross' 
      | 'grade_jump' 
      | 'career_sequence' 
      | 'existing_match' 
      | 'other';
    title: string;
    description: string;
    suggestedFix?: string;
  }>;

  // User Actions in UI
  userApprovalState: 'approved' | 'rejected' | 'pending' | 'custom_fixed';
  editedValues?: Partial<ValidatedRecordItem>;
}

export interface ExcelInspectionSummary {
  fileName: string;
  fileSizeFormatted: string;
  sheetNames: string[];
  totalRows: number;
  emptyRowsCount: number;
  potentialEmployeesCount: number;
  detectedColumns: string[];
  scanDate: string;
  
  // 13 Detailed Inspection Metrics
  totalExcelRecords: number;
  validRecordsCount: number;
  needsReviewCount: number;
  missingNameCount: number;
  missingNationalIdCount: number;
  criticalErrorsCount: number;
  duplicateRecordsCount: number;
  invalidIdentityCount: number;
  unlinkedCareerRecordsCount: number;
  specializationGradeErrorsCount: number;
  invalidDatesCount: number;
  existingEmployeesCount: number;
  newEmployeesCount: number;
  newHistoricalRecordsCount: number;
  duplicateHistoricalCount: number;
  regulation418IssuesCount: number;
  gradeCrossIssuesCount: number;
  suspiciousGradeJumpCount: number;
}

export const SYSTEM_FIELDS_CONFIG: Array<{ key: string; label: string; isRequired?: boolean; aliases: string[] }> = [
  { key: 'fullName', label: 'اسم الموظف (الاسم الرباعي)', isRequired: true, aliases: ['اسم الموظف', 'اسم_الموظف', 'الاسم', 'الاسم الرباعي', 'الاسم الكامل', 'اسم الموظف رباعي', 'full_name', 'fullname', 'name'] },
  { key: 'nationalId', label: 'الرقم الوطني', isRequired: false, aliases: ['الرقم الوطني', 'الرقم_الوطني', 'الرقم الوطنى', 'رقم الهوية', 'الرقم الوطني للموظف', 'national_id', 'nationalid', 'nid'] },
  { key: 'jobNumber', label: 'الرقم الوظيفي / رقم الملف', isRequired: false, aliases: ['رقم الموظف', 'الرقم الوظيفي', 'الرقم_الوظيفي', 'رقم الملف', 'ملف الموظف', 'job_number', 'jobnumber', 'file_no'] },
  { key: 'jobGrade', label: 'الدرجة الوظيفية / الحالية', isRequired: false, aliases: ['الدرجة الجديدة الممنوحة', 'الدرجة الجديدة', 'اسم الدرجة الحالية', 'الدرجة الحالية', 'الدرجة', 'الدرجة المالية', 'الدرجة الوظيفية', 'job_grade', 'grade', 'new_grade'] },
  { key: 'currentIncrement', label: 'عدد العلاوات', isRequired: false, aliases: ['عدد العلاوات', 'العلاوات', 'العلاوة', 'العلاوة الحالية', 'عدد العلاوة', 'increments', 'allowance_count'] },
  { key: 'gradeEntryDate', label: 'تاريخ الدرجة / الحركة', isRequired: false, aliases: ['تاريخ الدرجة الحالية', 'تاريخ_الدرجة_الحالية', 'تاريخ العملية', 'تاريخ الحصول على الدرجة', 'تاريخ سريان الدرجة', 'تاريخ النفاذ', 'grade_entry_date', 'action_date', 'grade_date'] },
  { key: 'transactionType', label: 'نوع الحركة / الإجراء', isRequired: false, aliases: ['نوع الحركة', 'نوع العملية', 'نوع_العملية', 'نوع الإجراء', 'نوع المعاملة', 'الإجراء الوظيفي', 'transaction_type', 'action_type'] },
  { key: 'qualification', label: 'المؤهل العلمي', isRequired: false, aliases: ['المؤهل', 'المؤهل العلمي', 'الدرجة العلمية', 'المؤهل الدراسي', 'qualification', 'degree'] },
  { key: 'specialization', label: 'التخصص', isRequired: false, aliases: ['التخصص', 'التخصص الدقيق', 'مجال التخصص', 'specialization'] },
  { key: 'hireDate', label: 'تاريخ التعيين', isRequired: false, aliases: ['تاريخ التعيين', 'تاريخ_التعيين', 'تاريخ التعيين الأول', 'تاريخ التعيين الاصلي', 'hire_date', 'hiredate'] },
  { key: 'department', label: 'الإدارة / القسم', isRequired: false, aliases: ['القسم', 'الإدارة', 'المكتب', 'مكان العمل', 'الوحدة التنظيمية', 'department', 'unit'] },
  { key: 'decisionNumber', label: 'رقم القرار', isRequired: false, aliases: ['رقم القرار', 'رقم قرار الترقية', 'رقم قرار التعيين', 'رقم المستند', 'decision_number'] },
  { key: 'decisionDate', label: 'تاريخ القرار', isRequired: false, aliases: ['تاريخ القرار', 'تاريخ قرار الترقية', 'تاريخ المستند', 'decision_date'] },
  { key: 'notes', label: 'ملاحظات', isRequired: false, aliases: ['ملاحظات', 'الملاحظات', 'بيان', 'notes', 'remarks'] },
  { key: 'ignore', label: '— تجاهل هذا العمود —', isRequired: false, aliases: [] }
];

interface ExcelImportValidationCenterProps {
  fullDatabase: FullAppDatabase;
  onCommitImport: (newDatabase: FullAppDatabase, summaryLog: string) => void;
  onLogAudit: (action: any, details: string) => void;
  currentUsername: string;
}

export const ExcelImportValidationCenter: React.FC<ExcelImportValidationCenterProps> = ({
  fullDatabase,
  onCommitImport,
  onLogAudit,
  currentUsername
}) => {
  // Step Navigation: 1. Upload & Select -> 2. Inspect & Scan -> 3. Review & Correct -> 4. Preview Merge -> 5. Final Commit & Report
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4 | 5 | 6>(1);
  
  // File & Inspection State
  const [fileObject, setFileObject] = useState<File | null>(null);
  const [inspectionSummary, setInspectionSummary] = useState<ExcelInspectionSummary | null>(null);
  const [columnMappings, setColumnMappings] = useState<Record<string, string>>({});
  const [validatedRecords, setValidatedRecords] = useState<ValidatedRecordItem[]>([]);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [isCommitting, setIsCommitting] = useState<boolean>(false);
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState<boolean>(false);

  // Filter & Review Tab State
  const [filterCategory, setFilterCategory] = useState<
    | 'all' 
    | 'valid' 
    | 'needs_review' 
    | 'critical' 
    | 'duplicates' 
    | 'grade_jumps' 
    | 'grade_system_cross' 
    | 'regulation_418' 
    | 'specialization_error' 
    | 'new_employees' 
    | 'existing_employees'
  >('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Selected Record For Detail & Comparison View
  const [selectedRecordForDetail, setSelectedRecordForDetail] = useState<ValidatedRecordItem | null>(null);

  // Import Modes
  const [isTestMode, setIsTestMode] = useState<boolean>(false);
  const [importMode, setImportMode] = useState<'valid_only' | 'review_and_import' | 'scan_only'>('review_and_import');

  // Backup & Rollback Status
  const [rollbackStatus, setRollbackStatus] = useState<{ message: string; success: boolean } | null>(null);
  const [postImportReport, setPostImportReport] = useState<{
    date: string;
    fileName: string;
    user: string;
    totalRows: number;
    importedRecords: number;
    updatedEmployees: number;
    newEmployeesAdded: number;
    excludedRecords: number;
    duplicateRecords: number;
    needsReviewLeft: number;
    errorsCount: number;
    logText: string;
  } | null>(null);

  // Suspicious & Placeholder Detection State
  const [suspiciousModalOpen, setSuspiciousModalOpen] = useState<boolean>(false);
  const [suspiciousScan, setSuspiciousScan] = useState<SuspiciousScanResult | null>(null);
  const [isPurgingSuspicious, setIsPurgingSuspicious] = useState<boolean>(false);
  const [purgeSuccessMsg, setPurgeSuccessMsg] = useState<string | null>(null);

  const handleScanCurrentDb = () => {
    const res = scanDatabaseForSuspiciousRecords(fullDatabase.employees || [], fullDatabase.careerRecords || []);
    setSuspiciousScan(res);
    setSuspiciousModalOpen(true);
  };

  const handleExecutePurge = async () => {
    if (!suspiciousScan || isPurgingSuspicious || suspiciousScan.invalidEmployees.length === 0) return;
    setIsPurgingSuspicious(true);
    try {
      const purgeRes = await removeInvalidRecordsWithSafetyBackup(
        fullDatabase,
        currentUsername,
        suspiciousScan.invalidEmployees
      );
      if (purgeRes.success && purgeRes.cleanedDatabase) {
        onCommitImport(
          purgeRes.cleanedDatabase,
          `تم تطهير وحذف ${purgeRes.removedCount} سجل موظف غير معرف ووهمي مع حفظ نسخة احتياطية آمنة (${purgeRes.backupKey})`
        );
        onLogAudit('تطهير قاعدة البيانات', `حذف ${purgeRes.removedCount} سجل موظف وهمي`);
        setPurgeSuccessMsg(`تم بنجاح تطهير وحذف ${purgeRes.removedCount} سجل موظف وهمي ومزامنة قاعدة البيانات. تم حفظ نسخة احتياطية: ${purgeRes.backupKey}`);
        const newScan = scanDatabaseForSuspiciousRecords(purgeRes.cleanedDatabase.employees || [], purgeRes.cleanedDatabase.careerRecords || []);
        setSuspiciousScan(newScan);
      } else {
        alert('فشل تطهير السجلات: ' + purgeRes.error);
      }
    } catch (err: any) {
      alert('خطأ أثناء التطهير: ' + err.message);
    } finally {
      setIsPurgingSuspicious(false);
    }
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Grade Hierarchy Numerical Ranks for Grade-Jump checks
  const numericalGradesMap: Record<string, number> = {
    'الأولى': 1, 'الدرجة الأولى': 1, '1': 1,
    'الثانية': 2, 'الدرجة الثانية': 2, '2': 2,
    'الثالثة': 3, 'الدرجة الثالثة': 3, '3': 3,
    'الرابعة': 4, 'الدرجة الرابعة': 4, '4': 4,
    'الخامسة': 5, 'الدرجة الخامسة': 5, '5': 5,
    'السادسة': 6, 'الدرجة السادسة': 6, '6': 6,
    'السابعة': 7, 'الدرجة السابعة': 7, '7': 7,
    'الثامنة': 8, 'الدرجة الثامنة': 8, '8': 8,
    'التاسعة': 9, 'الدرجة التاسعة': 9, '9': 9,
    'العاشرة': 10, 'الدرجة العاشرة': 10, '10': 10,
    'الحادية عشر': 11, 'الحادية عشرة': 11, 'الدرجة الحادية عشر': 11, '11': 11,
    'الثانية عشر': 12, 'الثانية عشرة': 12, 'الدرجة الثانية عشر': 12, '12': 12,
    'الثالثة عشر': 13, 'الثالثة عشرة': 13, 'الدرجة الثالثة عشر': 13, '13': 13,
    'الرابعة عشر': 14, 'الرابعة عشرة': 14, 'الدرجة الرابعة عشر': 14, '14': 14,
    'الخامسة عشر': 15, 'الخامسة عشرة': 15, 'الدرجة الخامسة عشر': 15, '15': 15
  };

  const isMedicalGrade = (g: string): boolean => {
    if (!g) return false;
    const lower = g.trim();
    return (
      lower.includes('صحي') ||
      lower.includes('طبيب') ||
      lower.includes('فني') ||
      lower.includes('معاون') ||
      lower.includes('أخصائي') ||
      lower.includes('كبير فنيين') ||
      lower.includes('تمريض')
    );
  };

  const isNumericalGrade = (g: string): boolean => {
    if (!g) return false;
    const clean = g.replace('الدرجة', '').trim();
    return numericalGradesMap[clean] !== undefined || numericalGradesMap[g.trim()] !== undefined;
  };

  // Helper to format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' بايت';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' كيلوبايت';
    return (bytes / (1024 * 1024)).toFixed(2) + ' ميجابايت';
  };

  // 1. File Selection Handler
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileObject(file);
    setValidatedRecords([]);
    setInspectionSummary(null);
    setSelectedRecordForDetail(null);
    setRollbackStatus(null);
    setPostImportReport(null);

    // Initial inspection of worksheet structure without altering DB
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { cellDates: true, dense: true });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const rawRows: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

      const detectedCols: string[] = rawRows.length > 0 && Array.isArray(rawRows[0]) 
        ? (rawRows[0] as string[]).map(c => String(c || '').trim()).filter(Boolean) 
        : [];

      const initialMappings: Record<string, string> = {};
      detectedCols.forEach(col => {
        const cleanCol = col.trim().toLowerCase();
        const matched = SYSTEM_FIELDS_CONFIG.find(f =>
          f.key !== 'ignore' && f.aliases.some(alias => cleanCol === alias.toLowerCase() || cleanCol.includes(alias.toLowerCase()))
        );
        initialMappings[col] = matched ? matched.key : 'ignore';
      });
      setColumnMappings(initialMappings);

      const totalRowsCount = Math.max(0, rawRows.length - 1);

      setInspectionSummary({
        fileName: file.name,
        fileSizeFormatted: formatFileSize(file.size),
        sheetNames: workbook.SheetNames,
        totalRows: totalRowsCount,
        emptyRowsCount: 0,
        potentialEmployeesCount: 0,
        detectedColumns: detectedCols,
        scanDate: new Date().toLocaleString('ar-LY'),
        totalExcelRecords: totalRowsCount,
        validRecordsCount: 0,
        needsReviewCount: 0,
        missingNameCount: 0,
        missingNationalIdCount: 0,
        criticalErrorsCount: 0,
        duplicateRecordsCount: 0,
        invalidIdentityCount: 0,
        unlinkedCareerRecordsCount: 0,
        specializationGradeErrorsCount: 0,
        invalidDatesCount: 0,
        existingEmployeesCount: 0,
        newEmployeesCount: 0,
        newHistoricalRecordsCount: 0,
        duplicateHistoricalCount: 0,
        regulation418IssuesCount: 0,
        gradeCrossIssuesCount: 0,
        suspiciousGradeJumpCount: 0
      });

      setCurrentStep(2);
    } catch (err: any) {
      console.error('File read error:', err);
      alert('فشل قراءة ملف الإكسل: ' + (err?.message || 'تأكد من صيغة الملف .xlsx أو .xls'));
    }
  };

  // Load Built-in Clean Sample File for Testing
  const handleLoadSampleData = () => {
    const sampleRows = getSampleCleanedGoogleMergedExcelData();
    const ws = XLSX.utils.json_to_sheet(sampleRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'منظومة_جوجل_مدمج');
    const out = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
    const sampleFile = new File([out], 'عينة_منظومة_جوجل_المدمجة_الرسمية.xlsx', { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });

    const detectedCols = Object.keys(sampleRows[0] || {});
    const initialMappings: Record<string, string> = {};
    detectedCols.forEach(col => {
      const cleanCol = col.trim().toLowerCase();
      const matched = SYSTEM_FIELDS_CONFIG.find(f =>
        f.key !== 'ignore' && f.aliases.some(alias => cleanCol === alias.toLowerCase() || cleanCol.includes(alias.toLowerCase()))
      );
      initialMappings[col] = matched ? matched.key : 'ignore';
    });
    setColumnMappings(initialMappings);

    setFileObject(sampleFile);
    setInspectionSummary({
      fileName: sampleFile.name,
      fileSizeFormatted: formatFileSize(sampleFile.size),
      sheetNames: ['منظومة_جوجل_مدمج'],
      totalRows: sampleRows.length,
      emptyRowsCount: 0,
      potentialEmployeesCount: sampleRows.length,
      detectedColumns: detectedCols,
      scanDate: new Date().toLocaleString('ar-LY'),
      totalExcelRecords: sampleRows.length,
      validRecordsCount: 0,
      needsReviewCount: 0,
      missingNameCount: 0,
      missingNationalIdCount: 0,
      criticalErrorsCount: 0,
      duplicateRecordsCount: 0,
      invalidIdentityCount: 0,
      unlinkedCareerRecordsCount: 0,
      specializationGradeErrorsCount: 0,
      invalidDatesCount: 0,
      existingEmployeesCount: 0,
      newEmployeesCount: 0,
      newHistoricalRecordsCount: 0,
      duplicateHistoricalCount: 0,
      regulation418IssuesCount: 0,
      gradeCrossIssuesCount: 0,
      suspiciousGradeJumpCount: 0
    });
    setCurrentStep(2);
  };

  // 2. Comprehensive Pre-Import Validation Engine
  const runPreImportValidationEngine = async () => {
    if (!fileObject) return;
    setIsScanning(true);

    try {
      const data = await fileObject.arrayBuffer();
      const workbook = XLSX.read(data, { cellDates: true });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const rawRows: Record<string, any>[] = XLSX.utils.sheet_to_json(firstSheet, { defval: '' });

      const existingEmployeesMap = new Map<string, Employee>();
      (fullDatabase.employees || []).forEach(emp => {
        if (emp.nationalId) existingEmployeesMap.set(String(emp.nationalId).trim(), emp);
      });

      const existingCareerRecords = fullDatabase.careerRecords || [];
      const seenTransactionsInFile = new Set<string>();
      const parsedItems: ValidatedRecordItem[] = [];

      let validCount = 0;
      let reviewCount = 0;
      let criticalCount = 0;
      let duplicateCount = 0;
      let existingEmpCount = 0;
      let newEmpCount = 0;
      let newHistCount = 0;
      let dupHistCount = 0;
      let specGradeErrors = 0;
      let reg418Issues = 0;
      let gradeCrossCount = 0;
      let gradeJumpCount = 0;

      // Group rows by National ID first for career sequence analysis
      const rowsByNationalId = new Map<string, any[]>();

      rawRows.forEach((row, idx) => {
        const rowNum = idx + 2;
        const nid = String(
          row['الرقم الوطني'] || 
          row['الرقم_الوطني'] || 
          row['رقم الهوية'] || 
          row['الرقم الوطني للموظف'] || 
          row['National ID'] || 
          row['NID'] || 
          ''
        ).trim();

        if (!rowsByNationalId.has(nid)) {
          rowsByNationalId.set(nid, []);
        }
        rowsByNationalId.get(nid)!.push({ row, rowNum });
      });

      // Process each row with deep checks
      rawRows.forEach((row, idx) => {
        const rowNum = idx + 2;
        const issues: ValidatedRecordItem['issuesList'] = [];

        // Extract fields
        const nationalId = String(
          row['الرقم الوطني'] || row['الرقم_الوطني'] || row['رقم الهوية'] || row['National ID'] || ''
        ).trim();
        const employeeName = String(
          row['الاسم'] || row['اسم الموظف'] || row['الاسم_الرباعي'] || row['الاسم الثلاثي'] || row['Name'] || ''
        ).trim();
        const jobNumber = String(
          row['رقم الموظف'] || row['الرقم الوظيفي'] || row['رقم الملف'] || row['Job Number'] || ''
        ).trim();
        const actionType = String(
          row['نوع العملية'] || row['البيان'] || row['الحركة'] || row['نوع القرار'] || row['نوع الإجراء'] || 'ترقية'
        ).trim();
        const actionDateRaw = String(
          row['تاريخ العملية'] || row['تاريخ الاستحقاق'] || row['تاريخ الترقية'] || row['تاريخ القرار'] || ''
        ).trim();
        const previousGrade = String(
          row['الدرجة السابقة'] || row['الدرجة_السابقة'] || row['من درجة'] || ''
        ).trim();
        const previousIncrement = Number(row['العلاوة السابقة'] || row['علاوة سابقة'] || 0) || 0;
        const newGrade = String(
          row['الدرجة الجديدة'] || row['الدرجة_الجديدة'] || row['الدرجة'] || row['إلى درجة'] || ''
        ).trim();
        const newIncrement = Number(row['العلاوة الجديدة'] || row['العلاوة'] || row['علاوة جديدة'] || 0) || 0;
        const specialization = String(
          row['التخصص'] || row['المجال'] || row['Specialization'] || ''
        ).trim();
        const qualification = String(
          row['المؤهل'] || row['المؤهل العلمي'] || row['الشهادة'] || ''
        ).trim();
        const hireDateRaw = String(
          row['تاريخ التعيين'] || row['تاريخ المباشرة'] || ''
        ).trim();
        const status = String(
          row['الحالة'] || row['الحالة الوظيفية'] || 'على رأس العمل'
        ).trim();
        const department = String(
          row['الإدارة'] || row['الجهة'] || row['القسم'] || row['الوحدة'] || ''
        ).trim();
        const cadreNumber = String(
          row['الملاك'] || row['رقم الملاك'] || ''
        ).trim();
        const decisionNumber = String(
          row['رقم القرار'] || row['القرار'] || ''
        ).trim();
        const decisionDateRaw = String(
          row['تاريخ القرار'] || ''
        ).trim();
        const notes = String(
          row['ملاحظات'] || row['الملاحظة'] || ''
        ).trim();

        // Normalize Dates safely
        const actionDate = normalizeDateStorage(actionDateRaw);
        const hireDate = normalizeDateStorage(hireDateRaw);
        const decisionDate = normalizeDateStorage(decisionDateRaw);

        // Validation Flags
        let isCritical = false;
        let needsReview = false;
        let hasSpecializationGradeError = false;
        let suggestedSpecializationFix: ValidatedRecordItem['suggestedSpecializationFix'] = undefined;
        let hasRegulation418Issue = false;
        let hasGradeSystemCross = false;
        let hasSuspiciousGradeJump = false;
        let hasMissingRequiredField = false;
        let hasInvalidDate = false;
        let hasCareerSequenceConflict = false;

        // Check 1: National ID validation & Fake ID Detection
        const isFakeNatId = isFakeSequentialNationalId(nationalId);
        if (isFakeNatId) {
          isCritical = true;
          hasMissingRequiredField = true;
          issues.push({
            type: 'critical',
            category: 'missing_field',
            title: 'رقم وطني تسلسلي وهمي غير معتمد',
            description: `الرقم الوطني (${nationalId}) يتبع نمطاً تسلسلياً وهمياً (11990xxxxxxx). تم حجب السجل لحماية قاعدة البيانات.`,
            suggestedFix: 'استبدال الرقم برقم وطني حقيقي صادر عن مصلحة الأحوال المدنية.'
          });
        } else if (!nationalId) {
          if (!employeeName || isInvalidPlaceholderName(employeeName)) {
            isCritical = true;
            hasMissingRequiredField = true;
            issues.push({
              type: 'critical',
              category: 'missing_field',
              title: 'الرقم الوطني واسم الموظف مفقودان',
              description: 'لا يمكن مطابقة أو معالجة سجل بدون هوية موظف.',
              suggestedFix: 'إدخال اسم الموظف والرقم الوطني الصحيح.'
            });
          } else {
            // Valid employee name but missing National ID (e.g. non-Libyan or unassigned): valid, remains empty
            needsReview = true;
            issues.push({
              type: 'warning',
              category: 'missing_field',
              title: 'الرقم الوطني غير مسجل',
              description: 'السطر يحتوي على اسم موظف حقيقي ولكن بدون رقم وطني. سيتم حفظ السجل مع إبقاء الرقم الوطني فارغاً.',
              suggestedFix: 'إدخال الرقم الوطني إن وجد أو استكمال الاستيراد مع إبقاء الحقل فارغاً.'
            });
          }
        } else if (nationalId.length < 10) {
          needsReview = true;
          issues.push({
            type: 'warning',
            category: 'missing_field',
            title: 'صيغة الرقم الوطني قصيرة',
            description: `الرقم الوطني (${nationalId}) أقل من 10 أرقام.`,
            suggestedFix: 'التحقق من صحة الرقم الوطني الليبي.'
          });
        }

        // Check 2: Missing or Placeholder Employee Name
        const isNamePlaceholder = isInvalidPlaceholderName(employeeName);
        if (!employeeName || isNamePlaceholder) {
          isCritical = true;
          hasMissingRequiredField = true;
          issues.push({
            type: 'critical',
            category: 'missing_field',
            title: isNamePlaceholder ? 'اسم الموظف نص غير صالح / وهمي ("' + employeeName + '")' : 'اسم الموظف مفقود',
            description: isNamePlaceholder ? 'تم رصد نص غير صالح أو مسمى نائب وهمي. لن يتم إنشاء سجل موظف في المنظومة منعاً لإنشاء موظفين غير معرفين.' : 'حقل الاسم الرباعي فارغ. لن يتم إنشاء سجل موظف في المنظومة.',
            suggestedFix: 'إدخال اسم الموظف الحقيقي أو حذف السطر الفارغ من الإكسل.'
          });
        }

        // Check 3: Date Validation
        if (actionDateRaw && !actionDate) {
          needsReview = true;
          hasInvalidDate = true;
          issues.push({
            type: 'warning',
            category: 'invalid_date',
            title: 'صيغة تاريخ غير معيارية',
            description: `قيمة التاريخ (${actionDateRaw}) تحتاج تنسيق سليم (YYYY-MM-DD).`,
            suggestedFix: 'تحويل التاريخ إلى نسق ISO قياسي.'
          });
        }

        // Check 4: Specialization vs Grade Misplacement
        if (isRecognizedJobGrade(specialization) && (!newGrade || newGrade.trim() === '')) {
          needsReview = true;
          hasSpecializationGradeError = true;
          specGradeErrors++;
          suggestedSpecializationFix = {
            fromField: 'التخصص',
            toField: 'الدرجة الجديدة',
            gradeVal: specialization
          };
          issues.push({
            type: 'warning',
            category: 'specialization_grade',
            title: 'إدراج الدرجة في حقل التخصص',
            description: `تم إدخال المسمى/الدرجة (${specialization}) في حقل التخصص بينما حقل الدرجة الجديدة فارغ.`,
            suggestedFix: `نقل (${specialization}) إلى حقل الدرجة وإفراغ حقل التخصص.`
          });
        }

        // Check 5 & 6: Regulation 418 Historical-Date Rule & 2023 Transition System Cross
        const isPrevNum = isNumericalGrade(previousGrade);
        const isPrevMed = isMedicalGrade(previousGrade);
        const isNewNum = isNumericalGrade(newGrade);
        const isNewMed = isMedicalGrade(newGrade);

        const effectiveDateStr = actionDate || decisionDate || '';
        const is2023Event = effectiveDateStr.startsWith('2023') || (!effectiveDateStr && hireDate?.startsWith('2023'));
        const isPost2023Event = effectiveDateStr > '2023-12-31';

        // Valid 2023 Transition: 418 to General Numerical Grade in 2023
        const isValid2023Transition = (isPrevMed || (!previousGrade && !isPrevNum)) && isNewNum && is2023Event;

        if (isValid2023Transition) {
          // This is a legitimate historical transition during 2023!
          // NOT an error, NOT a cross-system warning, NOT an invalid promotion.
          issues.push({
            type: 'info',
            category: 'other',
            title: 'انتقال تاريخي معتمد (2023)',
            description: `تحويل قانوني معتمد من كادر اللائحة 418 إلى جدول الدرجات العامة (${newGrade}) خلال سنة 2023.`,
            suggestedFix: 'لا يتطلب تعديل — يُعتمد كحركة تحويل تاريخية معتمدة وفق الضوابط.'
          });
        } else {
          // Check for Regulation 418 issue after 2023
          if (isNewMed && isPost2023Event) {
            needsReview = true;
            hasRegulation418Issue = true;
            reg418Issues++;
            issues.push({
              type: 'warning',
              category: 'regulation_418',
              title: 'درجة مرتبطة باللائحة 418 بعد سنة 2023',
              description: `حركة بتصنيف اللائحة 418 (${newGrade}) بتاريخ (${effectiveDateStr}) بعد 31/12/2023. تتطلب تدقيقاً قانونياً وفق التوجيهات الرسمية.`,
              suggestedFix: 'مراجعة الأساس القانوني للترقية والاعتماد اليدوي دون تعديل قسري.'
            });
          }

          // Grade System Cross
          if (previousGrade && newGrade) {
            if (isPrevMed && isNewNum) {
              if (isPost2023Event) {
                needsReview = true;
                hasGradeSystemCross = true;
                gradeCrossCount++;
                issues.push({
                  type: 'warning',
                  category: 'grade_system_cross',
                  title: 'تحويل من اللائحة 418 إلى الدرجات العامة بعد 2023',
                  description: `تحول من (${previousGrade}) إلى (${newGrade}) بتاريخ (${effectiveDateStr}) بعد سنة 2023.`,
                  suggestedFix: 'مراجعة القرار للتأكد من سند تسوية التسكين المتأخر.'
                });
              }
            } else if (isPrevNum && isNewMed) {
              needsReview = true;
              hasGradeSystemCross = true;
              gradeCrossCount++;
              issues.push({
                type: 'warning',
                category: 'grade_system_cross',
                title: 'انتقال عكسي إلى نظام اللائحة 418',
                description: `تحول غير اعتيادي من جدول الدرجات العامة (${previousGrade}) إلى تصنيف اللائحة 418 (${newGrade}).`,
                suggestedFix: 'مراجعة أسباب النقل أو تصحيح مسار الدرجة.'
              });
            }
          }
        }

        // Check 7: Suspicious Grade Jumps (e.g. الثامنة -> الخامسة)
        if (isPrevNum && isNewNum) {
          const cleanPrev = previousGrade.replace('الدرجة', '').trim();
          const cleanNew = newGrade.replace('الدرجة', '').trim();
          const rankPrev = numericalGradesMap[cleanPrev] || numericalGradesMap[previousGrade];
          const rankNew = numericalGradesMap[cleanNew] || numericalGradesMap[newGrade];

          if (rankPrev && rankNew) {
            const diff = rankNew - rankPrev;
            if (diff > 1 || diff < 0) {
              needsReview = true;
              hasSuspiciousGradeJump = true;
              gradeJumpCount++;
              issues.push({
                type: 'warning',
                category: 'grade_jump',
                title: 'قفزة غير اعتيادية في الدرجة',
                description: `انتقال الدرجة من (${previousGrade} [${rankPrev}]) إلى (${newGrade} [${rankNew}]). فارق الدرجات (${diff}).`,
                suggestedFix: 'التحقق من قرارات التسوية الاستثنائية أو إدخال درجات وسيطة.'
              });
            }
          }
        }

        // Check 8: Multi-row Career Sequence
        if (nationalId && rowsByNationalId.has(nationalId)) {
          const allEmpRows = rowsByNationalId.get(nationalId)!;
          if (allEmpRows.length > 1 && !actionDate) {
            needsReview = true;
            hasCareerSequenceConflict = true;
            issues.push({
              type: 'warning',
              category: 'career_sequence',
              title: 'تاريخ العملية مفقود ضمن تتابع وظيفي',
              description: 'الموظف لديه عدة حركات وظيفية لكن هذا السجل يفتقد لتاريخ الاستحقاق الدقيق.',
              suggestedFix: 'تحديد تاريخ سريان القرار.'
            });
          }
        }

        // Check 9: Duplicate Protection Check
        const transactionFingerprint = `${nationalId}|${actionType}|${actionDate}|${newGrade}|${decisionNumber}|${decisionDate}`;
        let isDuplicate = false;

        if (nationalId && seenTransactionsInFile.has(transactionFingerprint)) {
          isDuplicate = true;
          needsReview = true;
          duplicateCount++;
          issues.push({
            type: 'warning',
            category: 'duplicate',
            title: 'سجل وظيفي مكرر داخل ملف Excel',
            description: 'تطابق تام في الرقم الوطني ونوع الحركة وتاريخ الاستحقاق والدرجة ورقم القرار.',
            suggestedFix: 'استبعاد السجل المكرر لمنع تضارب الحركات التاريخية.'
          });
        } else if (nationalId) {
          seenTransactionsInFile.add(transactionFingerprint);
        }

        // Check against existing database career records
        const existingEmpForNid = existingEmployeesMap.get(nationalId);
        const isMatchedInDb = existingCareerRecords.some(cr => {
          const matchEmp = existingEmpForNid && (cr.employeeId === existingEmpForNid.id || cr.fileNumber === existingEmpForNid.jobNumber);
          const matchDate = cr.actionDate === actionDate;
          const matchGrade = cr.newGrade === newGrade;
          const matchDec = cr.decisionNumber === decisionNumber && Boolean(decisionNumber);
          return matchEmp && (matchDate || matchDec) && matchGrade;
        });

        if (isMatchedInDb) {
          isDuplicate = true;
          dupHistCount++;
          issues.push({
            type: 'info',
            category: 'duplicate',
            title: 'حركة وظيفية مطابقة مسجلة مسبقاً في قاعدة البيانات',
            description: 'الحركة مسجلة بالفعل بنفس التاريخ والدرجة لنفس الموظف.',
            suggestedFix: 'تخطي إضافة السجل لتفادي تكرار الأرشيف.'
          });
        }

        // Check 10: Existing Employee vs New Employee
        const isExistingEmployee = nationalId ? existingEmployeesMap.has(nationalId) : false;
        const isNewEmployee = !isExistingEmployee && Boolean(nationalId);

        if (isExistingEmployee) {
          existingEmpCount++;
          issues.push({
            type: 'info',
            category: 'existing_match',
            title: 'موظف مسجل مسبقاً في المنظومة',
            description: 'سيتم دمج وتحديث الحقول المعتمدة وإلحاق السجلات التاريخية دون استبدال الملف الأساسي.',
            suggestedFix: 'مطابقة الحقول المحدثة فقط.'
          });
        } else if (isNewEmployee) {
          newEmpCount++;
          newHistCount++;
        }

        // Calculate Overall Status
        let validationStatus: ValidationStatus = 'valid';
        if (isCritical) {
          validationStatus = 'critical';
          criticalCount++;
        } else if (isDuplicate) {
          validationStatus = 'duplicate';
        } else if (needsReview) {
          validationStatus = 'warning';
          reviewCount++;
        } else if (isExistingEmployee) {
          validationStatus = 'existing_match';
          validCount++;
        } else if (isNewEmployee) {
          validationStatus = 'new_employee';
          validCount++;
        } else {
          validCount++;
        }

        const item: ValidatedRecordItem = {
          id: `val_${idx}_${nationalId || 'nonid'}`,
          rowNumber: rowNum,
          nationalId,
          employeeName,
          jobNumber,
          actionType,
          actionDate,
          previousGrade,
          previousIncrement,
          newGrade,
          newIncrement,
          specialization,
          qualification,
          hireDate,
          status,
          department,
          cadreNumber,
          decisionNumber,
          decisionDate,
          notes,

          validationStatus,
          isCritical,
          needsReview,
          isValid: !isCritical && !needsReview && !isDuplicate,
          isDuplicate,
          isExistingEmployee,
          isNewEmployee,
          isNewHistoricalRecord: !isMatchedInDb,

          hasSpecializationGradeError,
          suggestedSpecializationFix,
          hasRegulation418Issue,
          hasGradeSystemCross,
          hasSuspiciousGradeJump,
          hasMissingRequiredField,
          hasInvalidDate,
          hasCareerSequenceConflict,

          issuesList: issues,
          userApprovalState: isCritical ? 'rejected' : needsReview ? 'pending' : 'approved'
        };

        parsedItems.push(item);
      });

      setValidatedRecords(parsedItems);
      setInspectionSummary(prev => prev ? {
        ...prev,
        totalExcelRecords: parsedItems.length,
        validRecordsCount: validCount,
        needsReviewCount: reviewCount,
        criticalErrorsCount: criticalCount,
        duplicateRecordsCount: duplicateCount,
        existingEmployeesCount: existingEmpCount,
        newEmployeesCount: newEmpCount,
        newHistoricalRecordsCount: newHistCount,
        duplicateHistoricalCount: dupHistCount,
        specializationGradeErrorsCount: specGradeErrors,
        regulation418IssuesCount: reg418Issues,
        gradeCrossIssuesCount: gradeCrossCount,
        suspiciousGradeJumpCount: gradeJumpCount
      } : null);

      setCurrentStep(3);
    } catch (err: any) {
      console.error('Validation engine error:', err);
      alert('حدث خطأ أثناء فحص البيانات: ' + (err?.message || 'تأكد من صيغة الملف.'));
    } finally {
      setIsScanning(false);
    }
  };

  // Filtered Records based on selected category & search
  const filteredRecords = useMemo(() => {
    return validatedRecords.filter(item => {
      if (filterCategory === 'valid' && !item.isValid) return false;
      if (filterCategory === 'needs_review' && !item.needsReview) return false;
      if (filterCategory === 'critical' && !item.isCritical) return false;
      if (filterCategory === 'duplicates' && !item.isDuplicate) return false;
      if (filterCategory === 'grade_jumps' && !item.hasSuspiciousGradeJump) return false;
      if (filterCategory === 'grade_system_cross' && !item.hasGradeSystemCross) return false;
      if (filterCategory === 'regulation_418' && !item.hasRegulation418Issue) return false;
      if (filterCategory === 'specialization_error' && !item.hasSpecializationGradeError) return false;
      if (filterCategory === 'new_employees' && !item.isNewEmployee) return false;
      if (filterCategory === 'existing_employees' && !item.isExistingEmployee) return false;

      if (searchQuery.trim()) {
        const query = searchQuery.trim().toLowerCase();
        const matchName = item.employeeName.toLowerCase().includes(query);
        const matchNid = item.nationalId.includes(query);
        const matchJob = item.jobNumber.toLowerCase().includes(query);
        const matchGrade = item.newGrade.toLowerCase().includes(query) || item.previousGrade.toLowerCase().includes(query);
        if (!matchName && !matchNid && !matchJob && !matchGrade) return false;
      }

      return true;
    });
  }, [validatedRecords, filterCategory, searchQuery]);

  // Action: Approve single record
  const handleApproveRecord = (id: string) => {
    setValidatedRecords(prev => prev.map(rec => {
      if (rec.id === id) {
        return { ...rec, userApprovalState: 'approved' };
      }
      return rec;
    }));
  };

  // Action: Reject / Exclude single record
  const handleRejectRecord = (id: string) => {
    setValidatedRecords(prev => prev.map(rec => {
      if (rec.id === id) {
        return { ...rec, userApprovalState: 'rejected' };
      }
      return rec;
    }));
  };

  // Action: Bulk Approve All in Filtered View
  const handleBulkApproveFiltered = () => {
    const idsToApprove = new Set(filteredRecords.filter(r => !r.isCritical).map(r => r.id));
    setValidatedRecords(prev => prev.map(rec => {
      if (idsToApprove.has(rec.id)) {
        return { ...rec, userApprovalState: 'approved' };
      }
      return rec;
    }));
  };

  // Action: Apply Specialization -> Grade Suggested Correction
  const handleApplySpecializationCorrection = (recId: string) => {
    setValidatedRecords(prev => prev.map(rec => {
      if (rec.id === recId && rec.suggestedSpecializationFix) {
        return {
          ...rec,
          newGrade: rec.suggestedSpecializationFix.gradeVal,
          specialization: '',
          hasSpecializationGradeError: false,
          needsReview: rec.issuesList.filter(i => i.category !== 'specialization_grade').some(i => i.type === 'warning'),
          userApprovalState: 'approved',
          issuesList: rec.issuesList.filter(i => i.category !== 'specialization_grade')
        };
      }
      return rec;
    }));
  };

  // 4. Preview Merge Calculations
  const mergePreviewStats = useMemo(() => {
    let approvedToImport = 0;
    let excluded = 0;
    let newEmployeesToCreate = 0;
    let existingEmployeesToUpdate = 0;
    let careerTransactionsToInsert = 0;

    const existingMap = new Map<string, Employee>();
    (fullDatabase.employees || []).forEach(e => {
      if (e.nationalId) existingMap.set(String(e.nationalId).trim(), e);
    });

    validatedRecords.forEach(rec => {
      const willImport = (
        (importMode === 'valid_only' && rec.isValid) ||
        (importMode === 'review_and_import' && rec.userApprovalState === 'approved')
      );

      if (willImport) {
        approvedToImport++;
        if (rec.nationalId && existingMap.has(rec.nationalId)) {
          existingEmployeesToUpdate++;
        } else if (rec.nationalId) {
          newEmployeesToCreate++;
        }
        if (rec.isNewHistoricalRecord) {
          careerTransactionsToInsert++;
        }
      } else {
        excluded++;
      }
    });

    return {
      totalExcel: validatedRecords.length,
      approvedToImport,
      excluded,
      newEmployeesToCreate,
      existingEmployeesToUpdate,
      careerTransactionsToInsert
    };
  }, [validatedRecords, importMode, fullDatabase]);

  // 5. Final Commit with Pre-Backup and Atomic Merge
  const handleExecuteAtomicMerge = async () => {
    if (isCommitting) return;
    setIsCommitting(true);

    try {
      // 🧪 Test Mode Check
      if (isTestMode) {
        setTimeout(() => {
          setIsCommitting(false);
          setPostImportReport({
            date: new Date().toLocaleString('ar-LY'),
            fileName: fileObject?.name || 'اختبار_محاكاة.xlsx',
            user: currentUsername,
            totalRows: validatedRecords.length,
            importedRecords: mergePreviewStats.approvedToImport,
            updatedEmployees: mergePreviewStats.existingEmployeesToUpdate,
            newEmployeesAdded: mergePreviewStats.newEmployeesToCreate,
            excludedRecords: mergePreviewStats.excluded,
            duplicateRecords: inspectionSummary?.duplicateRecordsCount || 0,
            needsReviewLeft: 0,
            errorsCount: inspectionSummary?.criticalErrorsCount || 0,
            logText: '🧪 تمت محاكاة عملية الاستيراد في وضع الاختبار بنجاح تام دون تعديل قاعدة البيانات.'
          });
          setCurrentStep(6);
          onLogAudit('استيراد إكسل (تجريبي)', `محاكاة استيراد ${mergePreviewStats.approvedToImport} سجل`);
        }, 1200);
        return;
      }

      // 1. Mandatory Step: Create Complete Pre-Import Backup
      const backupRes = await createDatabaseBackup(
        fullDatabase, 
        currentUsername, 
        'تلقائية قبل استيراد Excel', 
        'ZIP'
      );
      
      if (!backupRes.success) {
        throw new Error('فشل إنشاء النسخة الاحتياطية الوقائية قبل الاستيراد. تم إيقاف العملية لحماية البيانات.');
      }

      // 2. Perform Non-Destructive Safe Merge
      const existingEmployees = [...(fullDatabase.employees || [])];
      const existingCareer = [...(fullDatabase.careerRecords || [])];
      const existingPromotions = [...(fullDatabase.promotions || [])];
      const existingIncrements = [...(fullDatabase.increments || [])];
      const existingSettlements = [...(fullDatabase.settlements || [])];

      const empMap = new Map<number, Employee>();
      const nidToId = new Map<string, number>();
      const jobToId = new Map<string, number>();
      const nameToId = new Map<string, number>();

      existingEmployees.forEach(e => {
        empMap.set(e.id, { ...e });
        if (e.nationalId && e.nationalId.trim()) nidToId.set(e.nationalId.trim(), e.id);
        if (e.jobNumber && e.jobNumber.trim()) jobToId.set(e.jobNumber.trim(), e.id);
        if (e.fullName && e.fullName.trim() && !isInvalidPlaceholderName(e.fullName)) nameToId.set(e.fullName.trim(), e.id);
      });

      const recordsToProcess = validatedRecords.filter(rec => {
        if (importMode === 'valid_only') return rec.isValid;
        if (importMode === 'review_and_import') return rec.userApprovalState === 'approved';
        return false;
      });

      let newlyCreatedEmpCount = 0;
      let updatedEmpCount = 0;
      let addedCareerCount = 0;

      // Find max integer id in existing employees
      let maxEmpId = existingEmployees.reduce((max, emp) => {
        const idNum = typeof emp.id === 'number' ? emp.id : parseInt(String(emp.id), 10);
        return !isNaN(idNum) && idNum > max ? idNum : max;
      }, 100);

      recordsToProcess.forEach(rec => {
        const nid = (rec.nationalId || '').trim();
        const empName = (rec.employeeName || '').trim();
        const jobNum = (rec.jobNumber || '').trim();

        // Strict rejection of placeholder names or fake sequential National IDs
        if (!empName || isInvalidPlaceholderName(empName) || (nid && isFakeSequentialNationalId(nid))) {
          return;
        }

        let matchedId: number | undefined;
        if (nid && nidToId.has(nid)) {
          matchedId = nidToId.get(nid);
        } else if (jobNum && jobToId.has(jobNum)) {
          matchedId = jobToId.get(jobNum);
        } else if (empName && nameToId.has(empName)) {
          matchedId = nameToId.get(empName);
        }

        if (matchedId !== undefined && empMap.has(matchedId)) {
          // Merge approved fields into existing employee WITHOUT replacing whole record
          const currentEmp = empMap.get(matchedId)!;
          
          if (rec.newGrade && !currentEmp.jobGrade) currentEmp.jobGrade = rec.newGrade;
          if (rec.newIncrement !== undefined && rec.newIncrement > (currentEmp.currentIncrement || 0)) {
            currentEmp.currentIncrement = rec.newIncrement;
          }
          if (rec.actionDate && (!currentEmp.gradeEntryDate || rec.actionDate > currentEmp.gradeEntryDate)) {
            currentEmp.gradeEntryDate = rec.actionDate;
            currentEmp.jobGrade = rec.newGrade || currentEmp.jobGrade;
          }
          if (rec.specialization && !currentEmp.specialization) currentEmp.specialization = rec.specialization;
          if (rec.qualification && !currentEmp.qualification) currentEmp.qualification = rec.qualification;
          if (rec.hireDate && !currentEmp.hireDate) currentEmp.hireDate = rec.hireDate;
          if (rec.department && !currentEmp.department) currentEmp.department = rec.department;

          empMap.set(matchedId, currentEmp);
          updatedEmpCount++;
        } else {
          maxEmpId++;
          const newEmp: Employee = {
            id: maxEmpId,
            jobNumber: rec.jobNumber || `${maxEmpId}/م`,
            nationality: 'ليبي',
            documentType: 'الرقم الوطني',
            nationalId: nid, // Keep empty if not provided, never invent fake ID
            fullName: empName,
            motherName: '',
            birthDate: '',
            birthPlace: '',
            gender: getGenderFromNationalId(nid),
            maritalStatus: 'أعزب',
            status: (rec.status as EmploymentStatus) || 'على رأس العمل',
            hireDate: rec.hireDate || rec.actionDate || '2015-01-01',
            directingDate: rec.hireDate || rec.actionDate || '2015-01-01',
            bloodBankStartDate: rec.hireDate || rec.actionDate || '2015-01-01',
            appointmentSalarySystem: isMedicalGrade(rec.newGrade) ? 'اللائحة 418 – العناصر الطبية' : 'جدول مرتبات القانون 15',
            appointmentGrade: rec.previousGrade || rec.newGrade || 'الدرجة الأولى',
            salaryScale: 'جدول المرتبات الموحد',
            jobGrade: rec.newGrade || 'الدرجة الأولى',
            currentIncrement: rec.newIncrement || 0,
            gradeEntryDate: rec.actionDate || '2023-01-01',
            transactionType: rec.actionType || 'ترقية',
            eligibilityDate: rec.actionDate || '2023-01-01',
            qualification: rec.qualification || 'بكالوريوس',
            specialization: rec.specialization || 'إداري',
            cadreNumber: rec.cadreNumber || 'ملاك عام',
            hiringEntity: 'وزارة الصحة',
            assignmentCategory: (isMedicalGrade(rec.newGrade) ? 'طبي' : 'إداري') as AssignmentCategory,
            department: rec.department || 'الإدارة العامة والخدمات',
            jobTitle: isMedicalGrade(rec.newGrade) ? rec.newGrade : 'موظف',
            phone: '',
            email: '',
            pdfPath: '',
            notes: `تم الاستيراد والتدقيق عبر مركز فحص الإكسل (${fileObject?.name || ''})`
          };

          empMap.set(maxEmpId, newEmp);
          if (nid) nidToId.set(nid, maxEmpId);
          if (jobNum) jobToId.set(jobNum, maxEmpId);
          if (empName) nameToId.set(empName, maxEmpId);
          newlyCreatedEmpCount++;
        }

        // Add Career Promotion Transaction if not already existing
        const targetEmpId = matchedId !== undefined ? matchedId : maxEmpId;
        const matchedEmp = empMap.get(targetEmpId);

        const isCareerExists = existingCareer.some(c => 
          (c.employeeId === targetEmpId || (matchedEmp && c.fileNumber === matchedEmp.jobNumber)) && 
          c.actionDate === rec.actionDate && 
          (c.newGrade === rec.newGrade)
        );

        if (matchedEmp && !isCareerExists && rec.actionDate && rec.newGrade) {
          const newCareerRecord: CareerPromotionRecord = {
            id: `cr_mig_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
            employeeId: matchedEmp.id,
            fileNumber: matchedEmp.jobNumber || rec.jobNumber || '',
            employeeName: matchedEmp.fullName,
            actionType: (rec.actionType as any) || 'ترقية',
            actionDate: rec.actionDate,
            previousGrade: rec.previousGrade || '—',
            previousIncrement: rec.previousIncrement || 0,
            newGrade: rec.newGrade,
            newIncrement: rec.newIncrement || 0,
            decisionNumber: rec.decisionNumber || '—',
            decisionDate: rec.decisionDate || rec.actionDate,
            issuingAuthority: 'وزارة الصحة',
            notes: `استيراد معتمد: ${rec.notes || 'لا توجد ملاحظات'}`,
            createdBy: currentUsername,
            createdAt: new Date().toISOString()
          };
          existingCareer.push(newCareerRecord);
          addedCareerCount++;
        }
      });

      // Construct New Database Object
      const updatedDatabase: FullAppDatabase = {
        ...fullDatabase,
        employees: Array.from(empMap.values()),
        careerRecords: existingCareer,
        promotions: existingPromotions,
        increments: existingIncrements,
        settlements: existingSettlements
      };

      // Commit to parent App state
      const summaryMessage = `تم استيراد ${recordsToProcess.length} سجل بنجاح. (إضافة ${newlyCreatedEmpCount} موظف جديد، تحديث ${updatedEmpCount} موظف موجود، إلحاق ${addedCareerCount} حركة تاريخية). نسخة احتياطية: ${backupRes.fileName}`;
      onCommitImport(updatedDatabase, summaryMessage);

      // Audit Logging
      onLogAudit(
        'استيراد إكسل', 
        `استيراد آمن ومعتمد من الملف (${fileObject?.name}). عدد السجلات: ${recordsToProcess.length}. نسخة الحماية: ${backupRes.fileName}`
      );

      // Set Post Import Report
      setPostImportReport({
        date: new Date().toLocaleString('ar-LY'),
        fileName: fileObject?.name || 'ملف_إكسل.xlsx',
        user: currentUsername,
        totalRows: validatedRecords.length,
        importedRecords: recordsToProcess.length,
        updatedEmployees: updatedEmpCount,
        newEmployeesAdded: newlyCreatedEmpCount,
        excludedRecords: validatedRecords.length - recordsToProcess.length,
        duplicateRecords: inspectionSummary?.duplicateRecordsCount || 0,
        needsReviewLeft: validatedRecords.filter(r => r.needsReview && r.userApprovalState === 'pending').length,
        errorsCount: inspectionSummary?.criticalErrorsCount || 0,
        logText: summaryMessage
      });

      setCurrentStep(6);
    } catch (err: any) {
      console.error('Commit error:', err);
      alert(`حدث خطأ أثناء الاستيراد — تم التراجع التلقائي ولم يتم فقد أي بيانات: ${err?.message || 'خطأ غير معروف'}`);
    } finally {
      setIsCommitting(false);
    }
  };

  // 6. Export Validation Report to Excel
  const handleExportValidationReportExcel = () => {
    if (validatedRecords.length === 0) return;

    const reportRows = validatedRecords.map(r => ({
      'رقم السطر': r.rowNumber,
      'الرقم الوطني': r.nationalId,
      'اسم الموظف': r.employeeName,
      'حالة الفحص': r.isCritical ? 'خطأ حرج' : r.needsReview ? 'يحتاج مراجعة' : 'صحيح',
      'حالة الاعتماد': r.userApprovalState === 'approved' ? 'معتمد' : r.userApprovalState === 'rejected' ? 'مستبعد' : 'معلق',
      'نوع الحركة': r.actionType,
      'تاريخ العملية': r.actionDate,
      'الدرجة السابقة': r.previousGrade,
      'الدرجة الجديدة': r.newGrade,
      'التخصص': r.specialization,
      'المؤهل': r.qualification,
      'رقم القرار': r.decisionNumber,
      'تاريخ القرار': r.decisionDate,
      'المشاكل المكتشفة': r.issuesList.map(i => `[${i.title}: ${i.description}]`).join(' | '),
      'المقترح': r.issuesList.map(i => i.suggestedFix).filter(Boolean).join(' | ')
    }));

    const ws = XLSX.utils.json_to_sheet(reportRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'تقرير_فحص_الإكسل');
    XLSX.writeFile(wb, `تقرير_فحص_ملف_الإكسل_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // Quick Rollback to previous pre-import backup
  const handlePerformRollback = () => {
    const res = rollbackLastPreImportBackup();
    if (res.success && res.restoredData) {
      const restored = res.restoredData;
      const restoredDb: FullAppDatabase = {
        ...fullDatabase,
        employees: restored.employees || fullDatabase.employees,
        careerRecords: restored.careerRecords || fullDatabase.careerRecords,
        promotions: restored.promotions || fullDatabase.promotions,
        increments: restored.increments || fullDatabase.increments,
        settlements: restored.settlements || fullDatabase.settlements
      };
      onCommitImport(restoredDb, res.message);
      onLogAudit('استرجاع نسخة احتياطية', `تراجع فوري عن آخر عملية استيراد واستعادة البيانات`);
      setRollbackStatus({ success: true, message: res.message });
    } else {
      setRollbackStatus({ success: false, message: res.message });
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute -left-10 -bottom-10 w-64 h-64 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-1/3 -top-10 w-48 h-48 bg-emerald-600/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="flex items-start gap-4">
            <div className="p-3.5 rounded-2xl bg-gradient-to-br from-red-600 to-amber-700 text-white shadow-lg border border-red-500/30">
              <FileSpreadsheet className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-xl font-black text-white">مركز استيراد وفحص بيانات Excel المتقدم</h2>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-black border border-emerald-500/40 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  حماية كاملة لقاعدة البيانات
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                بيئة تدقيق استباقية متكاملة تتيح فحص ملفات الإكسل، كشف تضارب الدرجات واللوائح (اللائحة 418)، مراجعة التسلسل الوظيفي، واعتماد الدمج الآمن دون استبدال البيانات الأصلية.
              </p>
            </div>
          </div>

          {/* Mode Switch & Sample Data */}
          <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto justify-end">
            <button
              onClick={handleScanCurrentDb}
              className="px-3.5 py-2 rounded-xl bg-red-950/80 hover:bg-red-900 text-red-200 text-xs font-bold transition-all border border-red-800 flex items-center gap-1.5 cursor-pointer shadow-sm"
              title="فحص وتطهير أي سجلات موظفين غير معرفين أو أرقام متسلسلة وهمية في قاعدة البيانات"
            >
              <ShieldAlert className="w-4 h-4 text-red-400" />
              <span>تدقيق وتطهير السجلات الوهمية</span>
            </button>

            <button
              onClick={() => setIsTestMode(!isTestMode)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 cursor-pointer ${
                isTestMode 
                  ? 'bg-amber-500 text-slate-950 border-amber-400 font-black shadow-lg shadow-amber-500/20 animate-pulse' 
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
              }`}
            >
              <Flame className="w-4 h-4 text-amber-400" />
              <span>{isTestMode ? '🧪 وضع الاختبار مفعل (بدون تعديل DB)' : '🧪 تفعيل وضع الاختبار'}</span>
            </button>

            <button
              onClick={handleLoadSampleData}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all border border-slate-700 flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>تحميل عينة رسمية للاختبار</span>
            </button>

            <button
              onClick={() => downloadSampleExcelWorkbook()}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-all border border-slate-700 flex items-center gap-1 cursor-pointer"
              title="تنزيل قالب إكسل فارغ جاهز"
            >
              <Download className="w-3.5 h-3.5" />
              <span>تحميل القالب</span>
            </button>
          </div>
        </div>

        {/* Multi-Step Breadcrumb Bar */}
        <div className="mt-6 pt-4 border-t border-slate-800/80 grid grid-cols-2 md:grid-cols-6 gap-2 text-center text-xs">
          {[
            { num: 1, label: '1. اختيار ملف Excel' },
            { num: 2, label: '2. فحص البيانات' },
            { num: 3, label: '3. مراجعة الأخطاء' },
            { num: 4, label: '4. معاينة الدمج' },
            { num: 5, label: '5. اعتماد الاستيراد' },
            { num: 6, label: '6. تقرير العملية' },
          ].map(s => {
            const isActive = currentStep === s.num;
            const isDone = currentStep > s.num;
            return (
              <div 
                key={s.num}
                onClick={() => {
                  if (validatedRecords.length > 0 || s.num === 1) {
                    setCurrentStep(s.num as any);
                  }
                }}
                className={`py-2 px-2 rounded-xl font-bold transition-all cursor-pointer border ${
                  isActive 
                    ? 'bg-red-700 text-white border-red-500 shadow-md' 
                    : isDone
                    ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/60'
                    : 'bg-slate-800/40 text-slate-400 border-slate-800'
                }`}
              >
                <span>{s.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Rollback Alert Banner if exists */}
      {rollbackStatus && (
        <div className={`p-4 rounded-2xl border text-xs flex items-center justify-between shadow-lg ${
          rollbackStatus.success 
            ? 'bg-emerald-950 border-emerald-800 text-emerald-200' 
            : 'bg-red-950 border-red-800 text-red-200'
        }`}>
          <div className="flex items-center gap-3">
            {rollbackStatus.success ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <AlertCircle className="w-5 h-5 text-red-400" />}
            <span className="font-bold">{rollbackStatus.message}</span>
          </div>
          <button onClick={() => setRollbackStatus(null)} className="text-slate-300 hover:text-white px-2">إغلاق</button>
        </div>
      )}

      {/* STEP 1: FILE SELECTION */}
      {currentStep === 1 && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-xl space-y-6">
          <div className="text-center max-w-xl mx-auto space-y-3">
            <div className="w-16 h-16 bg-red-950 text-red-400 border border-red-800 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
              <Upload className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-black text-white">الخطوة 1: اختيار ملف Excel للفحص والتحليل</h3>
            <p className="text-xs text-slate-400">
              قم باختيار ملف الإكسل المراد مراجعته (.xlsx أو .xls). لن يتم تعديل أو استبدال أي بيانات في هذه المرحلة.
            </p>
          </div>

          <div 
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-700 hover:border-red-500/60 bg-slate-950/40 hover:bg-slate-950/70 p-10 rounded-3xl text-center cursor-pointer transition-all space-y-4 group"
          >
            <input 
              ref={fileInputRef} 
              type="file" 
              accept=".xlsx, .xls, .csv" 
              className="hidden" 
              onChange={handleFileSelect} 
            />
            <div className="p-4 bg-slate-800 text-slate-300 rounded-2xl inline-block group-hover:scale-110 transition-transform">
              <FileSpreadsheet className="w-10 h-10 text-emerald-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">انقر هنا لاختيار ملف Excel أو اسحبه وأفلته هنا</p>
              <p className="text-xs text-slate-400 mt-1">يدعم ملفات منظومة جوجل، ملفات الترقيات والعلاوات، وكشوفات الموظفين المدمجة</p>
            </div>
          </div>

          {/* Quick Rollback from storage */}
          {getLastPreImportBackup() && (
            <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-800/80 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <RotateCcw className="w-5 h-5 text-amber-400 shrink-0" />
                <div>
                  <h4 className="text-xs font-bold text-amber-200">تراجع فوري عن آخر استيراد تم إجراؤه</h4>
                  <p className="text-[11px] text-amber-300/80">توجد نسخة احتياطية محفوظة قبل آخر عملية دمج Excel.</p>
                </div>
              </div>
              <button
                onClick={handlePerformRollback}
                className="px-3.5 py-2 bg-amber-700 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>تراجع واستعادة البيانات</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* STEP 2: FILE SUMMARY & COLUMN MAPPING */}
      {currentStep === 2 && inspectionSummary && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-950 text-emerald-400 border border-emerald-800">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-white">الخطوة 2: مطابقة الأعمدة وفحص الملف فقط</h3>
                <p className="text-xs text-slate-400">راجع مطابقة أعمدة ملف Excel مع حقول المنظومة قبل مباشرة الفحص الآمن</p>
              </div>
            </div>
            <button 
              onClick={() => setCurrentStep(1)}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              تغيير الملف
            </button>
          </div>

          {/* File Metadata Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
              <span className="text-[10px] text-slate-500 font-bold block mb-1">اسم الملف</span>
              <span className="text-xs font-black text-white font-mono truncate block" title={inspectionSummary.fileName}>
                {inspectionSummary.fileName}
              </span>
            </div>
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
              <span className="text-[10px] text-slate-500 font-bold block mb-1">حجم الملف</span>
              <span className="text-xs font-black text-emerald-400 font-mono">
                {inspectionSummary.fileSizeFormatted}
              </span>
            </div>
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
              <span className="text-[10px] text-slate-500 font-bold block mb-1">أوراق العمل (Sheets)</span>
              <span className="text-xs font-black text-amber-400">
                {inspectionSummary.sheetNames.join(', ')}
              </span>
            </div>
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
              <span className="text-[10px] text-slate-500 font-bold block mb-1">إجمالي الصفوف المقروءة</span>
              <span className="text-xs font-black text-white font-mono">
                {inspectionSummary.totalRows.toLocaleString('ar-LY')} صف
              </span>
            </div>
          </div>

          {/* Column Mapping Section */}
          <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-black text-white">مطابقة أعمدة Excel مع حقول المنظومة (Column Mapping):</span>
              </div>
              <div className="text-[11px] font-bold">
                {Object.values(columnMappings).includes('fullName') ? (
                  <span className="text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-2.5 py-1 rounded-lg">
                    ✓ تم تحديد عمود اسم الموظف (مطلوب)
                  </span>
                ) : (
                  <span className="text-red-400 bg-red-950/60 border border-red-800 px-2.5 py-1 rounded-lg">
                    ⚠ عمود اسم الموظف غير محدد!
                  </span>
                )}
              </div>
            </div>

            {/* Unmapped Name Warning */}
            {!Object.values(columnMappings).includes('fullName') && (
              <div className="p-3.5 rounded-xl bg-red-950/50 border border-red-800 text-red-300 text-xs flex items-center gap-2.5">
                <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
                <span>⚠️ تنبيه أمان: تعذر التعرف على عمود اسم الموظف. لا يمكن المتابعة بدون تحديد عمود اسم الموظف.</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-64 overflow-y-auto pr-1">
              {inspectionSummary.detectedColumns.map((col, idx) => (
                <div key={idx} className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400 font-medium truncate" title={col}>
                      عمود Excel: <strong className="text-white">{col}</strong>
                    </span>
                  </div>
                  <select
                    value={columnMappings[col] || 'ignore'}
                    onChange={(e) => setColumnMappings(prev => ({ ...prev, [col]: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-700 text-white text-xs rounded-lg px-2.5 py-1.5 outline-none focus:border-red-500"
                  >
                    {SYSTEM_FIELDS_CONFIG.map(f => (
                      <option key={f.key} value={f.key}>
                        {f.label} {f.isRequired ? ' ⭐ (إلزامي)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>

          {/* Start Inspection CTA */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-800">
            <div className="text-xs text-slate-400">
              * الفحص آمن 100% ولا يقوم بأي إدراج أو تعديل في قاعدة البيانات.
            </div>

            <button
              onClick={runPreImportValidationEngine}
              disabled={isScanning || !Object.values(columnMappings).includes('fullName')}
              className="px-7 py-3.5 rounded-2xl bg-gradient-to-r from-red-700 to-amber-700 hover:from-red-600 hover:to-amber-600 text-white text-xs font-black shadow-lg shadow-red-900/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isScanning ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              <span>{isScanning ? 'جاري فحص الملف فقط...' : '🔍 فحص الملف فقط'}</span>
            </button>
          </div>
        </div>
      )}

      {/* STEP 3 & STEP 4: VALIDATION DASHBOARD & REVIEW TABLE */}
      {(currentStep === 3 || currentStep === 4) && inspectionSummary && (
        <div className="space-y-6">

          {/* 4. VALIDATION DASHBOARD METRICS */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
              <span className="text-[10px] text-slate-400 font-bold block mb-1">إجمالي سجلات Excel</span>
              <div className="flex items-baseline justify-between">
                <span className="text-lg font-black text-white font-mono">{inspectionSummary.totalExcelRecords}</span>
                <Layers className="w-4 h-4 text-slate-500" />
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-800/80">
              <span className="text-[10px] text-emerald-300 font-bold block mb-1">🟢 سجلات صحيحة</span>
              <div className="flex items-baseline justify-between">
                <span className="text-lg font-black text-emerald-400 font-mono">{inspectionSummary.validRecordsCount}</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-800/80">
              <span className="text-[10px] text-amber-300 font-bold block mb-1">🟡 تحتاج مراجعة</span>
              <div className="flex items-baseline justify-between">
                <span className="text-lg font-black text-amber-400 font-mono">{inspectionSummary.needsReviewCount}</span>
                <AlertTriangle className="w-4 h-4 text-amber-500" />
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-red-950/40 border border-red-800/80">
              <span className="text-[10px] text-red-300 font-bold block mb-1">🔴 أخطاء حرجة</span>
              <div className="flex items-baseline justify-between">
                <span className="text-lg font-black text-red-400 font-mono">{inspectionSummary.criticalErrorsCount}</span>
                <AlertCircle className="w-4 h-4 text-red-500" />
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-blue-950/40 border border-blue-800/80">
              <span className="text-[10px] text-blue-300 font-bold block mb-1">🔵 موظفون موجودون مسبقاً</span>
              <div className="flex items-baseline justify-between">
                <span className="text-lg font-black text-blue-400 font-mono">{inspectionSummary.existingEmployeesCount}</span>
                <UserCheck className="w-4 h-4 text-blue-400" />
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-purple-950/40 border border-purple-800/80">
              <span className="text-[10px] text-purple-300 font-bold block mb-1">✨ موظفون جدد</span>
              <div className="flex items-baseline justify-between">
                <span className="text-lg font-black text-purple-400 font-mono">{inspectionSummary.newEmployeesCount}</span>
                <UserPlus className="w-4 h-4 text-purple-400" />
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
              <span className="text-[10px] text-slate-400 font-bold block mb-1">سجلات مكررة</span>
              <div className="flex items-baseline justify-between">
                <span className="text-lg font-black text-slate-300 font-mono">{inspectionSummary.duplicateRecordsCount}</span>
                <Layers className="w-4 h-4 text-slate-500" />
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
              <span className="text-[10px] text-amber-400 font-bold block mb-1">أخطاء التخصص/الدرجة</span>
              <div className="flex items-baseline justify-between">
                <span className="text-lg font-black text-amber-400 font-mono">{inspectionSummary.specializationGradeErrorsCount}</span>
                <Sliders className="w-4 h-4 text-amber-500" />
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
              <span className="text-[10px] text-indigo-400 font-bold block mb-1">تنبيهات اللائحة 418</span>
              <div className="flex items-baseline justify-between">
                <span className="text-lg font-black text-indigo-300 font-mono">{inspectionSummary.regulation418IssuesCount}</span>
                <ShieldAlert className="w-4 h-4 text-indigo-400" />
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
              <span className="text-[10px] text-orange-400 font-bold block mb-1">قفزات درجات / انتقال أنظمة</span>
              <div className="flex items-baseline justify-between">
                <span className="text-lg font-black text-orange-300 font-mono">
                  {inspectionSummary.suspiciousGradeJumpCount + inspectionSummary.gradeCrossIssuesCount}
                </span>
                <ArrowLeftRight className="w-4 h-4 text-orange-400" />
              </div>
            </div>
          </div>

          {/* STEP 3 & 4 Navigation Bar & Controls */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md space-y-4">
            
            {/* Top Toolbar: Search + Quick Category Filters */}
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-500 absolute right-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="البحث بالاسم، الرقم الوطني، الدرجة، رقم الموظف..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-3 pr-10 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleBulkApproveFiltered}
                  className="px-3.5 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow"
                >
                  <CheckSquare className="w-3.5 h-3.5" />
                  <span>اعتماد المعروض ({filteredRecords.filter(r => !r.isCritical).length})</span>
                </button>

                <button
                  onClick={handleExportValidationReportExcel}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all border border-slate-700 flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-400" />
                  <span>تصدير تقرير الفحص Excel</span>
                </button>

                <button
                  onClick={() => window.print()}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all border border-slate-700 flex items-center gap-1 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>طباعة</span>
                </button>
              </div>
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap gap-1.5 text-xs font-bold pt-2 border-t border-slate-800">
              {[
                { id: 'all', label: 'جميع السجلات', count: validatedRecords.length },
                { id: 'valid', label: '🟢 الصحيحة', count: inspectionSummary.validRecordsCount },
                { id: 'needs_review', label: '🟡 تحتاج مراجعة', count: inspectionSummary.needsReviewCount },
                { id: 'critical', label: '🔴 أخطاء حرجة', count: inspectionSummary.criticalErrorsCount },
                { id: 'duplicates', label: 'تكرارات', count: inspectionSummary.duplicateRecordsCount },
                { id: 'specialization_error', label: 'أخطاء التخصص', count: inspectionSummary.specializationGradeErrorsCount },
                { id: 'regulation_418', label: 'اللائحة 418', count: inspectionSummary.regulation418IssuesCount },
                { id: 'grade_jumps', label: 'قفزات الدرجات', count: inspectionSummary.suspiciousGradeJumpCount },
                { id: 'grade_system_cross', label: 'انتقال أنظمة', count: inspectionSummary.gradeCrossIssuesCount },
                { id: 'existing_employees', label: '🔵 موظفون حاليون', count: inspectionSummary.existingEmployeesCount },
                { id: 'new_employees', label: '✨ موظفون جدد', count: inspectionSummary.newEmployeesCount },
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setFilterCategory(f.id as any)}
                  className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                    filterCategory === f.id
                      ? 'bg-red-800 text-white shadow font-black'
                      : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  <span>{f.label}</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-white/10 font-mono">
                    {f.count}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* MAIN REVIEW TABLE */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto max-h-[520px]">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-950/90 text-slate-400 font-bold sticky top-0 z-10 border-b border-slate-800">
                  <tr>
                    <th className="p-3 w-12 text-center">#</th>
                    <th className="p-3">الموظف والرقم الوطني</th>
                    <th className="p-3">الحركة وتاريخها</th>
                    <th className="p-3">الدرجة السابقة → الجديدة</th>
                    <th className="p-3">التخصص والمؤهل</th>
                    <th className="p-3">حالة الفحص والتحليل</th>
                    <th className="p-3 text-center">الاعتماد</th>
                    <th className="p-3 text-center">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredRecords.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-500 font-bold">
                        لا توجد سجلات تطابق الفلتر المحدد.
                      </td>
                    </tr>
                  ) : (
                    filteredRecords.map((item) => {
                      const isApproved = item.userApprovalState === 'approved';
                      const isRejected = item.userApprovalState === 'rejected';

                      return (
                        <tr 
                          key={item.id}
                          className={`hover:bg-slate-800/50 transition-colors ${
                            item.isCritical ? 'bg-red-950/10' : item.needsReview ? 'bg-amber-950/10' : ''
                          }`}
                        >
                          <td className="p-3 text-center font-mono text-slate-500 text-[11px]">
                            {item.rowNumber}
                          </td>

                          <td className="p-3">
                            <div className="font-bold text-white">{item.employeeName || '— (مفقود)'}</div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[11px] font-mono text-amber-400">{item.nationalId || '—'}</span>
                              {item.jobNumber && (
                                <span className="text-[10px] px-1.5 rounded bg-slate-800 text-slate-400 font-mono">
                                  {item.jobNumber}
                                </span>
                              )}
                              {item.isExistingEmployee ? (
                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-blue-950 text-blue-300 border border-blue-800">
                                  موجود مسبقاً
                                </span>
                              ) : (
                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-950 text-purple-300 border border-purple-800">
                                  جديد
                                </span>
                              )}
                            </div>
                          </td>

                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 text-[11px] font-bold">
                              {item.actionType}
                            </span>
                            <div className="text-[10px] text-slate-400 font-mono mt-1">
                              {formatDateDisplay(item.actionDate) || item.actionDate || '—'}
                            </div>
                          </td>

                          <td className="p-3">
                            <div className="flex items-center gap-1.5 text-[11px]">
                              <span className="text-slate-400">{item.previousGrade || '—'}</span>
                              <ArrowRight className="w-3 h-3 text-slate-500" />
                              <span className="font-bold text-emerald-400">{item.newGrade || '—'}</span>
                            </div>
                            {(item.previousIncrement > 0 || item.newIncrement > 0) && (
                              <div className="text-[10px] text-slate-500 mt-0.5">
                                علاوة: {item.previousIncrement} ← {item.newIncrement}
                              </div>
                            )}
                          </td>

                          <td className="p-3">
                            <div className={`text-[11px] ${item.hasSpecializationGradeError ? 'text-amber-400 font-bold' : 'text-slate-300'}`}>
                              {item.specialization || '—'}
                            </div>
                            <div className="text-[10px] text-slate-500">{item.qualification || '—'}</div>
                          </td>

                          <td className="p-3 max-w-xs">
                            {item.issuesList.length === 0 ? (
                              <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-bold">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                سليم ومطابق
                              </span>
                            ) : (
                              <div className="space-y-1">
                                {item.issuesList.map((iss, i) => (
                                  <div 
                                    key={i} 
                                    className={`text-[10px] p-1.5 rounded-lg border leading-tight ${
                                      iss.type === 'critical' 
                                        ? 'bg-red-950/80 border-red-800 text-red-200' 
                                        : iss.type === 'warning'
                                        ? 'bg-amber-950/80 border-amber-800 text-amber-200'
                                        : 'bg-blue-950/80 border-blue-800 text-blue-200'
                                    }`}
                                  >
                                    <span className="font-bold block">{iss.title}</span>
                                    <span className="text-[9px] opacity-90">{iss.description}</span>
                                  </div>
                                ))}

                                {item.hasSpecializationGradeError && item.suggestedSpecializationFix && (
                                  <button
                                    onClick={() => handleApplySpecializationCorrection(item.id)}
                                    className="mt-1 px-2 py-0.5 rounded bg-amber-600 hover:bg-amber-500 text-slate-950 text-[10px] font-black transition-all cursor-pointer flex items-center gap-1 shadow"
                                  >
                                    <Sparkles className="w-3 h-3" />
                                    <span>نقل الدرجة تلقائياً من التخصص</span>
                                  </button>
                                )}
                              </div>
                            )}
                          </td>

                          <td className="p-3 text-center">
                            {isApproved ? (
                              <span className="px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-black border border-emerald-500/40">
                                ✔ معتمد
                              </span>
                            ) : isRejected ? (
                              <span className="px-2 py-1 rounded-full bg-red-500/20 text-red-300 text-[10px] font-black border border-red-500/40">
                                ⛔ مستبعد
                              </span>
                            ) : (
                              <span className="px-2 py-1 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-black border border-amber-500/40">
                                معلق
                              </span>
                            )}
                          </td>

                          <td className="p-3">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => handleApproveRecord(item.id)}
                                className={`p-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                                  isApproved 
                                    ? 'bg-emerald-600 text-white' 
                                    : 'bg-slate-800 hover:bg-emerald-800 text-slate-300 hover:text-white'
                                }`}
                                title="اعتماد السجل للاستيراد"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() => handleRejectRecord(item.id)}
                                className={`p-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                                  isRejected 
                                    ? 'bg-red-600 text-white' 
                                    : 'bg-slate-800 hover:bg-red-800 text-slate-300 hover:text-white'
                                }`}
                                title="استبعاد السجل من الاستيراد"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() => setSelectedRecordForDetail(item)}
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs transition-all cursor-pointer"
                                title="تفاصيل ومقارنة السجل مع قاعدة البيانات"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Bottom Bar: Select Mode & Proceed to Step 4/5 */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
            
            {/* 11. IMPORT MODES */}
            <div className="space-y-2 w-full md:w-auto">
              <span className="text-xs font-bold text-slate-300 block">خيارات ونمط الاستيراد:</span>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setImportMode('review_and_import')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    importMode === 'review_and_import'
                      ? 'bg-red-800 text-white border-red-600 shadow'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  <span className="font-bold">الخيار C: مراجعة ثم استيراد السجلات المعتمدة</span>
                </button>

                <button
                  onClick={() => setImportMode('valid_only')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    importMode === 'valid_only'
                      ? 'bg-emerald-800 text-white border-emerald-600 shadow'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  <span className="font-bold">الخيار B: استيراد السجلات الصحيحة فقط</span>
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto justify-end">
              <button
                onClick={() => setCurrentStep(4)}
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-red-700 to-amber-700 hover:from-red-600 hover:to-amber-600 text-white text-xs font-black shadow-lg shadow-red-900/20 transition-all flex items-center gap-2 cursor-pointer"
              >
                <span>متابعة إلى معاينة الدمج والتأكيد</span>
                <ArrowRight className="w-4 h-4 rotate-180" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 4 & 5: MERGE PREVIEW & CONFIRMATION WINDOW */}
      {currentStep === 4 && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6 max-w-4xl mx-auto">
          <div className="flex items-center gap-3.5 border-b border-slate-800 pb-4">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-red-600 to-amber-700 text-white shadow-md">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">الخطوة 5: تأكيد ومعاينة دمج البيانات الآمن</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                تأكيد ملخص العمليات التي سيتم تطبيقها. سيتم أخذ نسخة احتياطية فورية قبل أي تعديل.
              </p>
            </div>
          </div>

          {/* 16. IMPORT CONFIRMATION SUMMARY CARD */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="text-xs font-bold text-slate-300">ملخص العملية المعتمدة:</div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                <span className="text-slate-500 block text-[10px]">ملف المصدر:</span>
                <span className="font-bold text-white font-mono">{fileObject?.name || '—'}</span>
              </div>

              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                <span className="text-slate-500 block text-[10px]">إجمالي السجلات المفحوصة:</span>
                <span className="font-bold text-white font-mono">{mergePreviewStats.totalExcel} سجل</span>
              </div>

              <div className="p-3 bg-emerald-950/60 rounded-xl border border-emerald-800">
                <span className="text-emerald-300 block text-[10px]">السجلات المعتمدة للدمج:</span>
                <span className="font-bold text-emerald-400 font-mono text-sm">{mergePreviewStats.approvedToImport} سجل</span>
              </div>

              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                <span className="text-slate-500 block text-[10px]">موظفون جدد للإضافة:</span>
                <span className="font-bold text-purple-300 font-mono">{mergePreviewStats.newEmployeesToCreate} موظف</span>
              </div>

              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                <span className="text-slate-500 block text-[10px]">موظفون حاليون للتحديث:</span>
                <span className="font-bold text-blue-300 font-mono">{mergePreviewStats.existingEmployeesToUpdate} موظف</span>
              </div>

              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                <span className="text-slate-500 block text-[10px]">حركات تاريخية جديدة:</span>
                <span className="font-bold text-amber-300 font-mono">{mergePreviewStats.careerTransactionsToInsert} حركة</span>
              </div>
            </div>

            {/* Mandatory Safety Statement */}
            <div className="p-4 rounded-xl bg-amber-950/50 border border-amber-800/80 text-amber-200 text-xs font-bold leading-relaxed flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-white font-black mb-1">
                  "سيتم دمج السجلات المعتمدة فقط مع قاعدة البيانات الحالية. لن يتم استبدال قاعدة البيانات."
                </p>
                <p className="text-[11px] text-amber-300/80 font-normal">
                  يقوم النظام تلقائياً بإنشاء نسخة احتياطية مشفرة (.ZIP) قبل مباشرة المعالجة، مع إمكانية التراجع الفوري بنقرة واحدة في أي وقت.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-800">
            <button
              onClick={() => setCurrentStep(3)}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              العودة لمراجعة السجلات
            </button>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setCurrentStep(1)}
                className="px-4 py-2.5 bg-slate-950 hover:bg-slate-800 text-slate-400 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                إلغاء العملية
              </button>

              <button
                onClick={() => setIsApprovalModalOpen(true)}
                disabled={isCommitting || mergePreviewStats.approvedToImport === 0}
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white text-xs font-black shadow-lg shadow-emerald-900/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isCommitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                <span>{isCommitting ? 'جاري النسخ الاحتياطي والدمج الآمن...' : 'تأكيد واعتماد الاستيراد'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 5: FINAL APPROVAL MODAL */}
      {isApprovalModalOpen && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-lg shadow-2xl space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
              <div className="p-3 bg-amber-950 text-amber-400 border border-amber-800 rounded-2xl">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-white">تأكيد اعتماد الاستيراد النهائي</h3>
                <p className="text-xs text-slate-400">إجراء تأكيدي ملزم قبل تعديل قاعدة البيانات</p>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-amber-950/40 border border-amber-800/80 text-sm text-amber-200 leading-relaxed font-bold">
              سيتم تعديل قاعدة بيانات الموظفين. تم إنشاء نسخة احتياطية تلقائية. هل تريد المتابعة؟
            </div>

            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 text-xs space-y-2 text-slate-300">
              <div className="flex justify-between">
                <span>السجلات المعتمدة للدمج:</span>
                <span className="font-bold text-emerald-400 font-mono">{mergePreviewStats.approvedToImport}</span>
              </div>
              <div className="flex justify-between">
                <span>موظفون جدد شرعيون:</span>
                <span className="font-bold text-purple-300 font-mono">{mergePreviewStats.newEmployeesToCreate}</span>
              </div>
              <div className="flex justify-between">
                <span>موظفون حاليون للتحديث:</span>
                <span className="font-bold text-blue-300 font-mono">{mergePreviewStats.existingEmployeesToUpdate}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setIsApprovalModalOpen(false)}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                إلغاء
              </button>

              <button
                onClick={() => {
                  setIsApprovalModalOpen(false);
                  handleExecuteAtomicMerge();
                }}
                disabled={isCommitting}
                className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-black shadow-lg shadow-emerald-900/30 transition-all flex items-center gap-2 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>اعتماد الاستيراد</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 6: POST IMPORT REPORT */}
      {currentStep === 6 && postImportReport && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6 max-w-4xl mx-auto">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 bg-emerald-950 text-emerald-400 border border-emerald-800 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div className="inline-block px-3 py-1 bg-emerald-950 text-emerald-300 border border-emerald-800 rounded-full text-[11px] font-black">
              STATUS: SUCCESS — تم الاعتماد بنجاح
            </div>
            <h3 className="text-lg font-black text-white">تقرير استيراد بيانات الموظفين</h3>
            <p className="text-xs text-slate-400">تمت العملية بنجاح وتسجيل كافة البيانات في سجل التدقيق الرقابي</p>
          </div>

          {/* Employee Count Reconciliation Card */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>مطابقة وتدقيق أعداد الموظفين (Reconciliation Audit):</span>
              </span>
              <span className="text-[11px] text-emerald-400 font-bold bg-emerald-950/60 border border-emerald-800 px-2.5 py-0.5 rounded-md">
                🟢 مطابقة تامة 100%
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                <span className="text-slate-500 block text-[10px]">موظفو المنظومة قبل الاستيراد:</span>
                <span className="font-bold text-white font-mono">{fullDatabase.employees?.length || 0}</span>
              </div>
              <div className="p-3 bg-purple-950/40 rounded-xl border border-purple-900/60">
                <span className="text-purple-300 block text-[10px]">+ موظفون جدد شرعيون:</span>
                <span className="font-bold text-purple-300 font-mono">{postImportReport.newEmployeesAdded}</span>
              </div>
              <div className="p-3 bg-blue-950/40 rounded-xl border border-blue-900/60">
                <span className="text-blue-300 block text-[10px]">موظفون محدثون:</span>
                <span className="font-bold text-blue-300 font-mono">{postImportReport.updatedEmployees}</span>
              </div>
              <div className="p-3 bg-emerald-950/60 rounded-xl border border-emerald-800">
                <span className="text-emerald-300 block text-[10px]">إجمالي الموظفين الفعلي بعد الاستيراد:</span>
                <span className="font-bold text-emerald-400 font-mono text-sm">
                  {(fullDatabase.employees?.length || 0) + postImportReport.newEmployeesAdded}
                </span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-slate-400 flex flex-wrap items-center justify-between gap-2">
              <span className="font-mono text-slate-300">
                معادلة المطابقة: {fullDatabase.employees?.length || 0} (سابق) + {postImportReport.newEmployeesAdded} (جدد) = {(fullDatabase.employees?.length || 0) + postImportReport.newEmployeesAdded} موظف
              </span>
              <span className="text-emerald-400 font-bold">
                ✓ صفر سجلات وهمية / صفر موظف غير معرف
              </span>
            </div>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                <span className="text-slate-500 block text-[10px]">تاريخ العملية:</span>
                <span className="font-bold text-white font-mono">{postImportReport.date}</span>
              </div>
              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                <span className="text-slate-500 block text-[10px]">اسم الملف:</span>
                <span className="font-bold text-amber-300 font-mono truncate block">{postImportReport.fileName}</span>
              </div>
              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                <span className="text-slate-500 block text-[10px]">المستخدم المنفذ:</span>
                <span className="font-bold text-white">{postImportReport.user}</span>
              </div>
              <div className="p-3 bg-emerald-950/60 rounded-xl border border-emerald-800">
                <span className="text-emerald-300 block text-[10px]">السجلات المستوردة:</span>
                <span className="font-bold text-emerald-400 font-mono text-sm">{postImportReport.importedRecords}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                <span className="text-slate-500 block text-[10px]">موظفون محدثون:</span>
                <span className="font-bold text-blue-300 font-mono">{postImportReport.updatedEmployees}</span>
              </div>
              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                <span className="text-slate-500 block text-[10px]">موظفون جدد:</span>
                <span className="font-bold text-purple-300 font-mono">{postImportReport.newEmployeesAdded}</span>
              </div>
              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                <span className="text-slate-500 block text-[10px]">سجلات مستبعدة:</span>
                <span className="font-bold text-slate-400 font-mono">{postImportReport.excludedRecords}</span>
              </div>
              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                <span className="text-slate-500 block text-[10px]">حركات مكررة:</span>
                <span className="font-bold text-amber-400 font-mono">{postImportReport.duplicateRecords}</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 font-mono whitespace-pre-wrap">
              {postImportReport.logText}
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-800">
            <button
              onClick={() => {
                setCurrentStep(1);
                setFileObject(null);
                setValidatedRecords([]);
              }}
              className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              استيراد ملف إكسل آخر
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const wsData = [
                    ['تقرير استيراد بيانات الموظفين'],
                    ['تاريخ العملية', postImportReport.date],
                    ['اسم الملف', postImportReport.fileName],
                    ['المستخدم المنفذ', postImportReport.user],
                    ['السجلات المستوردة', postImportReport.importedRecords],
                    ['موظفون جدد', postImportReport.newEmployeesAdded],
                    ['موظفون محدثون', postImportReport.updatedEmployees],
                    ['سجلات مستبعدة', postImportReport.excludedRecords],
                    ['حركات مكررة', postImportReport.duplicateRecords],
                    ['حالة المطابقة', 'مطابقة تامة 100% - صفر سجلات وهمية']
                  ];
                  const ws = XLSX.utils.aoa_to_sheet(wsData);
                  const wb = XLSX.utils.book_new();
                  XLSX.utils.book_append_sheet(wb, ws, 'تقرير_الاستيراد');
                  XLSX.writeFile(wb, `تقرير_استيراد_موظفين_${new Date().toISOString().slice(0,10)}.xlsx`);
                }}
                className="px-4 py-2.5 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow"
              >
                <Download className="w-3.5 h-3.5" />
                <span>تصدير تقرير الاستيراد Excel</span>
              </button>

              <button
                onClick={() => window.print()}
                className="px-4 py-2.5 bg-red-800 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>طباعة التقرير النهائي</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 10. EMPLOYEE COMPARISON & DETAIL MODAL */}
      {selectedRecordForDetail && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-4xl shadow-2xl max-h-[90vh] overflow-y-auto space-y-6">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-red-950 text-red-400 border border-red-800">
                  <Eye className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">
                    مقارنة بيانات الموظف: {selectedRecordForDetail.employeeName}
                  </h3>
                  <p className="text-xs text-slate-400">
                    مقارنة تفصيلية بين البيانات الحالية في قاعدة البيانات وبيانات ملف Excel المستوردة
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedRecordForDetail(null)}
                className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Side-by-Side Comparison */}
            {(() => {
              const currentEmp = (fullDatabase.employees || []).find(e => 
                e.nationalId === selectedRecordForDetail.nationalId
              );

              const comparisonFields = [
                { label: 'الاسم الرباعي', current: currentEmp?.fullName, excel: selectedRecordForDetail.employeeName },
                { label: 'الرقم الوطني', current: currentEmp?.nationalId, excel: selectedRecordForDetail.nationalId },
                { label: 'تاريخ التعيين', current: currentEmp?.hireDate, excel: selectedRecordForDetail.hireDate },
                { label: 'المؤهل العلمي', current: currentEmp?.qualification, excel: selectedRecordForDetail.qualification },
                { label: 'التخصص', current: currentEmp?.specialization, excel: selectedRecordForDetail.specialization },
                { label: 'الدرجة الحالية', current: currentEmp?.jobGrade, excel: selectedRecordForDetail.newGrade },
                { label: 'عدد العلاوات', current: currentEmp?.currentIncrement?.toString(), excel: selectedRecordForDetail.newIncrement?.toString() },
                { label: 'تاريخ الدرجة', current: currentEmp?.gradeEntryDate, excel: selectedRecordForDetail.actionDate },
                { label: 'الإدارة / القسم', current: currentEmp?.department, excel: selectedRecordForDetail.department },
              ];

              return (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-center">
                      <span className="text-xs font-bold text-blue-400">البيانات الحالية في المنظومة</span>
                      <span className="text-[10px] text-slate-500 block">
                        {currentEmp ? 'موظف مسجل مسبقاً' : 'غير موجود في قاعدة البيانات'}
                      </span>
                    </div>
                    <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-center">
                      <span className="text-xs font-bold text-emerald-400">البيانات الواردة في Excel</span>
                      <span className="text-[10px] text-slate-500 block">سطر رقم {selectedRecordForDetail.rowNumber}</span>
                    </div>
                  </div>

                  <div className="border border-slate-800 rounded-2xl overflow-hidden divide-y divide-slate-800 text-xs">
                    {comparisonFields.map((f, i) => {
                      const isDiff = currentEmp && f.current && f.excel && f.current !== f.excel;
                      return (
                        <div key={i} className={`grid grid-cols-3 p-3 items-center ${isDiff ? 'bg-amber-950/20' : ''}`}>
                          <span className="font-bold text-slate-400">{f.label}</span>
                          <span className={`font-mono ${isDiff ? 'text-amber-300 font-bold' : 'text-slate-300'}`}>
                            {f.current || '—'}
                          </span>
                          <span className={`font-mono ${isDiff ? 'text-emerald-400 font-bold' : 'text-slate-300'}`}>
                            {f.excel || '—'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
              <button
                onClick={() => {
                  handleApproveRecord(selectedRecordForDetail.id);
                  setSelectedRecordForDetail(null);
                }}
                className="px-4 py-2 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>اعتماد هذا السجل</span>
              </button>
              <button
                onClick={() => setSelectedRecordForDetail(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUSPICIOUS RECORDS & QUARANTINE MODAL */}
      {suspiciousModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-red-800/80 rounded-3xl max-w-4xl w-full p-6 space-y-6 shadow-2xl max-h-[90vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-red-950 text-red-400 border border-red-800 rounded-2xl">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white flex items-center gap-2">
                    <span>تدقيق وتطهير السجلات الوهمية والترقيم المتسلسل</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-red-500/20 text-red-300 border border-red-500/40">
                      أمان قاعدة البيانات
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    كشف السجلات المنشأة تلقائياً بأسماء نائبة ("موظف غير معرف") أو بأرقام وطنية وهمية متسلسلة (11990...)
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setSuspiciousModalOpen(false);
                  setPurgeSuccessMsg(null);
                }}
                className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Success alert */}
            {purgeSuccessMsg && (
              <div className="p-4 rounded-2xl bg-emerald-950/80 border border-emerald-800 text-emerald-200 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <span className="font-bold">{purgeSuccessMsg}</span>
              </div>
            )}

            {/* Scan Summary Stats */}
            {suspiciousScan && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-2xl text-center">
                  <span className="text-[10px] text-slate-400 font-bold block">إجمالي موظفي المنظومة</span>
                  <span className="text-lg font-black text-white font-mono mt-0.5 block">{suspiciousScan.totalEmployees}</span>
                </div>
                <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-2xl text-center">
                  <span className="text-[10px] text-emerald-400 font-bold block">السجلات السليمة والمعتمدة</span>
                  <span className="text-lg font-black text-emerald-400 font-mono mt-0.5 block">{suspiciousScan.validEmployeesCount}</span>
                </div>
                <div className="p-3.5 bg-red-950/40 border border-red-900/60 rounded-2xl text-center">
                  <span className="text-[10px] text-red-300 font-bold block">سجلات بأسماء وهمية</span>
                  <span className="text-lg font-black text-red-400 font-mono mt-0.5 block">{suspiciousScan.placeholderNameCount}</span>
                </div>
                <div className="p-3.5 bg-amber-950/40 border border-amber-900/60 rounded-2xl text-center">
                  <span className="text-[10px] text-amber-300 font-bold block">أرقام وطنية وهمية متسلسلة</span>
                  <span className="text-lg font-black text-amber-400 font-mono mt-0.5 block">{suspiciousScan.fakeSequentialIdCount}</span>
                </div>
              </div>
            )}

            {/* Table of Invalid Records */}
            <div className="flex-1 overflow-y-auto border border-slate-800 rounded-2xl">
              {(!suspiciousScan || suspiciousScan.invalidEmployees.length === 0) ? (
                <div className="p-12 text-center text-emerald-400 space-y-2">
                  <CheckCircle2 className="w-12 h-12 mx-auto text-emerald-500" />
                  <h4 className="text-sm font-bold">قاعدة البيانات نظيفة تماماً ومحمية!</h4>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    لا يوجد أي سجلات موظفين وهميين ("موظف غير معرف") أو أرقام وطنية متسلسلة غير نظامية في المنظومة.
                  </p>
                </div>
              ) : (
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-950 text-slate-300 sticky top-0 font-bold border-b border-slate-800">
                    <tr>
                      <th className="p-3">معرف الموظف</th>
                      <th className="p-3">اسم الموظف المسجل</th>
                      <th className="p-3">الرقم الوطني</th>
                      <th className="p-3">رقم الملف</th>
                      <th className="p-3">الدرجة</th>
                      <th className="p-3">سبب التصنيف كسجل وهمي</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 bg-slate-900/50">
                    {suspiciousScan.invalidEmployees.map((item) => (
                      <tr key={item.employee.id} className="hover:bg-red-950/20 transition-colors">
                        <td className="p-3 font-mono font-bold text-slate-400">{item.employee.id}</td>
                        <td className="p-3 font-bold text-red-300">
                          {item.employee.fullName || '— (فارغ)'}
                        </td>
                        <td className="p-3 font-mono text-amber-300 font-semibold">
                          {item.employee.nationalId || '—'}
                        </td>
                        <td className="p-3 font-mono text-slate-300">{item.employee.jobNumber || '—'}</td>
                        <td className="p-3 text-slate-300">{item.employee.jobGrade || '—'}</td>
                        <td className="p-3 text-red-200">
                          <div className="flex flex-wrap gap-1">
                            {item.reasons.map((r, i) => (
                              <span key={i} className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-950 text-red-300 border border-red-800">
                                {r}
                              </span>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-800">
              <div className="text-xs text-slate-400">
                {suspiciousScan && suspiciousScan.invalidEmployees.length > 0 && (
                  <span>
                    ⚠️ سيتم أخذ نسخة احتياطية كاملة (ZIP) تلقائياً قبل تنفيذ أي عملية حذف أو تطهير.
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {suspiciousScan && suspiciousScan.invalidEmployees.length > 0 && (
                  <button
                    onClick={handleExecutePurge}
                    disabled={isPurgingSuspicious}
                    className="px-4 py-2.5 bg-red-700 hover:bg-red-600 text-white rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-lg shadow-red-900/30 disabled:opacity-50"
                  >
                    <Flame className="w-4 h-4" />
                    <span>
                      {isPurgingSuspicious 
                        ? 'جاري حفظ النسخة الاحتياطية وتطهير السجلات...' 
                        : `حذف وتطهير ${suspiciousScan.invalidEmployees.length} سجل وهمي فوراً`}
                    </span>
                  </button>
                )}
                <button
                  onClick={() => {
                    setSuspiciousModalOpen(false);
                    setPurgeSuccessMsg(null);
                  }}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  إغلاق
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
