import * as XLSX from 'xlsx';
import { 
  Employee, 
  CareerPromotionRecord, 
  PromotionRecord, 
  IncrementRecord, 
  StatusSettlementRecord, 
  CareerActionType,
  EmploymentStatus,
  Gender,
  AssignmentCategory
} from '../types';
import { normalizeDateStorage, formatDateDisplay } from './dateUtils';
import { inferSalarySystemFromGrade } from './appointmentGradeUtils';
import { 
  normalizeCareerActionType, 
  isRegulation418Grade, 
  isGeneralNumericalGrade 
} from './careerUtils';
import { calculateEmployeeCurrentGrade } from './gradeCalculationEngine';
import { isInvalidPlaceholderName, isFakeSequentialNationalId } from './fakeRecordDetection';

export type ProposedActionType = 
  | 'لا تغيير' 
  | 'تصحيح سجل موجود' 
  | 'إضافة سجل تاريخي جديد' 
  | 'موظف جديد' 
  | 'سجل مكرر' 
  | 'تعارض يحتاج مراجعة'
  | 'سجل وظيفي غير مرتبط';

export interface MigrationRowError {
  rowNumber: number;
  nationalId: string;
  employeeName: string;
  errorType: 'خطأ حرج' | 'تنبيه تعارض' | 'بيانات ناقصة' | 'سجل مكرر' | 'تاريخ غير صالح' | 'سجل غير مرتبط';
  description: string;
  recommendedAction: string;
}

export interface UnlinkedCareerRecord {
  rowNumber: number;
  extractedName?: string;
  extractedNationalId?: string;
  extractedJobNumber?: string;
  actionType: string;
  newGrade: string;
  newIncrement: number;
  actionDate: string;
  decisionNumber: string;
  decisionDate: string;
  issuingAuthority: string;
  notes: string;
  reason: string;
  rawRow: any;
}

export interface UnlinkedExcelRow {
  rowNumber: number;
  rawRow: any;
  reason: string;
  category: 'فارغ' | 'بدون اسم' | 'اسم غير صالح' | 'رقم وطني غير صالح' | 'بيانات غير متطابقة' | 'أخرى';
}

export interface HistoricalParsedAction {
  rowNumber: number;
  nationalId: string;
  employeeName: string;
  actionType: CareerActionType;
  rawActionName: string;
  previousGrade: string;
  previousIncrement: number;
  newGrade: string;
  newIncrement: number;
  specialization: string;
  actionDate: string; // YYYY-MM-DD
  decisionDate: string;
  decisionNumber: string;
  issuingAuthority: string;
  notes: string;
  isDuplicate?: boolean;
  isCorrection?: boolean;
  matchedExistingRecordId?: string;
  proposedAction: ProposedActionType;
}

export interface HistoricalCorrectionEntry {
  rowNumber: number;
  nationalId: string;
  employeeName: string;
  actionType: string;
  
  // Existing state
  existingSpecialization?: string;
  existingGrade?: string;
  existingActionDate?: string;
  existingRecordId?: string;

  // Cleaned Excel state
  cleanedSpecialization?: string;
  cleanedGrade?: string;
  cleanedActionDate?: string;
  
  // Action details
  proposedAction: ProposedActionType;
  fieldNameCorrected?: string;
  oldValue?: string;
  newValue?: string;
  notes: string;
}

export interface EmployeeMigrationGroup {
  nationalId: string;
  employeeName: string;
  masterRecord: Employee;
  historicalActions: HistoricalParsedAction[];
  isExisting: boolean;
  hasConflicts: boolean;
  conflictNotes: string[];
  rowNumbers: number[];
}

export interface MigrationPreviewResult {
  totalExcelRows: number;
  totalRowsRead?: number;
  validRowsCount: number;
  emptyRowsCount: number;
  emptyOrCorruptRowsCount?: number;
  missingNameRowsCount: number;
  invalidNameRowsCount: number;
  missingNationalIdCount: number;
  uniqueEmployeesCount: number;
  totalHistoricalTransactions: number;
  existingEmployeesCount: number;
  newEmployeesCount: number;
  correctedRecordsCount: number;
  newHistoricalRecordsCount: number;
  duplicateRecordsCount: number;
  conflictReviewCount: number;
  errorCount: number;
  employeeGroups: EmployeeMigrationGroup[];
  allHistoricalActions: HistoricalParsedAction[];
  comparisonRows: HistoricalCorrectionEntry[];
  unlinkedCareerRecords: UnlinkedCareerRecord[];
  unlinkedExcelRows: UnlinkedExcelRow[];
  errors: MigrationRowError[];
  dryRun?: boolean;
}

export interface MigrationCommitResult {
  backupCreated: boolean;
  backupKey: string;
  backupTimestamp: string;
  matchedEmployeesCount: number;
  correctedRecordsCount: number;
  newHistoricalRecordsCount: number;
  duplicateRecordsCount: number;
  newEmployeesCount: number;
  conflictReviewCount: number;
  importedEmployeesCount: number;
  updatedEmployeesCount: number;
  importedHistoricalRecordsCount: number;
  employees: Employee[];
  careerRecords: CareerPromotionRecord[];
  promotions: PromotionRecord[];
  increments: IncrementRecord[];
  settlements: StatusSettlementRecord[];
  correctionsReport: HistoricalCorrectionEntry[];
  unlinkedCareerRecords?: UnlinkedCareerRecord[];
  unlinkedExcelRows?: UnlinkedExcelRow[];
  summaryLog: string;
}

/**
 * Known Job Grade Names that might have been mistakenly placed in 'التخصص' (Specialization)
 */
export const RECOGNIZED_JOB_GRADES = [
  'فني صحي ثاني', 'فني صحي أول', 'فني صحي ثالث', 'فني صحي رابع',
  'فني ثاني', 'فني أول', 'فني ثالث', 'فني رابع',
  'معاون صحي ثاني', 'معاون صحي أول', 'معاون صحي ثالث', 'معاون صحي رابع',
  'كبير فنيين', 'طبيب ثالث', 'طبيب ثاني', 'طبيب أول', 'أخصائي',
  'الدرجة الأولى', 'الدرجة الثانية', 'الدرجة الثالثة', 'الدرجة الرابعة', 'الدرجة الخامسة',
  'الدرجة السادسة', 'الدرجة السابعة', 'الدرجة الثامنة', 'الدرجة التاسعة', 'الدرجة العاشرة',
  'الدرجة الحادية عشر', 'الدرجة الحادية عشرة', 'الدرجة الثانية عشر', 'الدرجة الثانية عشرة',
  'الدرجة الثالثة عشر', 'الدرجة الثالثة عشرة', 'الدرجة الرابعة عشر', 'الدرجة الرابعة عشرة',
  'الدرجة الخامسة عشر', 'الدرجة الخامسة عشرة',
  'الأولى', 'الثانية', 'الثالثة', 'الرابعة', 'الخامسة', 'السادسة', 'السابعة', 'الثامنة', 'التاسعة', 'العاشرة',
  'الحادية عشر', 'الثانية عشر', 'الثالثة عشر', 'الرابعة عشر', 'الخامسة عشر'
];

/**
 * Checks if a given text string represents a recognized job grade rather than a specialization
 */
export function isRecognizedJobGrade(val: string): boolean {
  if (!val) return false;
  const trimmed = val.trim();
  return RECOGNIZED_JOB_GRADES.some((g) => trimmed === g || trimmed.includes(g));
}

// Column synonyms dictionary
const COLUMN_KEYS = {
  nationalId: ['الرقم الوطني', 'الرقم_الوطني', 'الرقم الوطنى', 'رقم الهوية', 'الرقم الوطني للموظف', 'national_id', 'nationalid', 'nid'],
  jobNumber: ['رقم الموظف', 'الرقم الوظيفي', 'الرقم_الوظيفي', 'رقم الملف', 'ملف الموظف', 'job_number', 'jobnumber', 'file_no'],
  fullName: ['اسم الموظف', 'اسم_الموظف', 'الاسم', 'الاسم الرباعي', 'الاسم الكامل', 'اسم الموظف رباعي', 'full_name', 'fullname', 'name'],
  motherName: ['إسم الأم', 'اسم الأم', 'اسم الام', 'إسم الام', 'اسم والدة الموظف', 'mother_name', 'mothername'],
  birthDate: ['تاريخ الميلاد', 'تاريخ_الميلاد', 'الميلاد', 'birth_date', 'birthdate', 'dob'],
  birthPlace: ['مكان الميلاد', 'مكان_الميلاد', 'المدينة', 'birth_place', 'birthplace'],
  gender: ['الجنس', 'النوع', 'gender', 'sex'],
  maritalStatus: ['الحالة الاجتماعية', 'الحالة_الاجتماعية', 'marital_status'],
  status: ['الوضع الوظيفي', 'الوضع_الوظيفي', 'الحالة الوظيفية', 'حالة الموظف', 'employment_status', 'status'],
  hireDate: ['تاريخ التعيين', 'تاريخ_التعيين', 'تاريخ التعيين الأول', 'تاريخ التعيين الاصلي', 'hire_date', 'hiredate'],
  directingDate: ['تاريخ المباشرة', 'تاريخ_المباشرة', 'تاريخ المباشرة الأولى', 'تاريخ مباشرة العمل', 'directing_date'],
  bloodBankStartDate: ['تاريخ المباشرة في مصرف الدم', 'تاريخ مباشرة المصرف', 'مباشرة مصرف الدم', 'تاريخ العمل بمصرف الدم'],
  appointmentSalarySystem: ['نظام الدرجة المعين عليها', 'نظام التعيين', 'نظام المرتبات للتعيين', 'جدول التعيين'],
  appointmentGrade: ['الدرجة المعين عليها', 'درجة التعيين', 'الدرجة عند التعيين', 'الدرجة الأولى المعين عليها'],
  appointmentIncrements: ['عدد العلاوات عند التعيين', 'علاوات التعيين', 'علاوة التعيين', 'علاوات عند التعيين'],
  salaryScale: ['جدول المرتبات', 'جدول_المرتبات', 'نظام المرتبات', 'الكادر المالي', 'salary_scale'],
  jobGrade: ['الدرجة الجديدة الممنوحة', 'الدرجة الجديدة', 'اسم الدرجة الحالية', 'الدرجة الحالية', 'الدرجة', 'الدرجة المالية', 'الدرجة الوظيفية', 'job_grade', 'grade', 'new_grade'],
  currentIncrement: ['عدد العلاوات', 'العلاوات', 'العلاوة', 'العلاوة الحالية', 'عدد العلاوة', 'increments', 'allowance_count'],
  gradeEntryDate: ['تاريخ الدرجة الحالية', 'تاريخ_الدرجة_الحالية', 'تاريخ العملية', 'تاريخ الحصول على الدرجة', 'تاريخ سريان الدرجة', 'تاريخ النفاذ', 'grade_entry_date', 'action_date', 'grade_date'],
  transactionType: ['نوع الحركة', 'نوع العملية', 'نوع_العملية', 'نوع الإجراء', 'نوع المعاملة', 'الإجراء الوظيفي', 'transaction_type', 'action_type'],
  eligibilityDate: ['تاريخ الاستحقاق', 'تاريخ_الاستحقاق', 'تاريخ استحقاق الترقية', 'تاريخ الترقية القادمة', 'eligibility_date'],
  qualification: ['المؤهل', 'المؤهل العلمي', 'الدرجة العلمية', 'المؤهل الدراسي', 'qualification', 'degree'],
  specialization: ['التخصص', 'التخصص الدقيق', 'مجال التخصص', 'specialization'],
  cadreNumber: ['رقم الملاك', 'رقم_الملاك', 'ملاك الموظف', 'cadre_number'],
  hiringEntity: ['جهة التعيين', 'جهة_التعيين', 'الجهة المعينة', 'hiring_entity'],
  department: ['القسم', 'الإدارة', 'المكتب', 'مكان العمل', 'الوحدة التنظيمية', 'department', 'unit'],
  jobTitle: ['الوظيفة', 'المسمى الوظيفي', 'الصفة الوظيفية', 'job_title', 'position'],
  decisionNumber: ['رقم القرار', 'رقم قرار الترقية', 'رقم قرار التعيين', 'رقم المستند', 'decision_number'],
  decisionDate: ['تاريخ القرار', 'تاريخ قرار الترقية', 'تاريخ المستند', 'decision_date'],
  issuingAuthority: ['الجهة المصدرة', 'الجهة التي أصدرت القرار', 'جهة إصدار القرار', 'issuing_authority'],
  notes: ['ملاحظات', 'الملاحظات', 'بيان', 'notes', 'remarks']
};

/**
 * Extracts normalized value from row based on column synonyms
 */
function extractFieldValue(row: any, keyNames: string[]): any {
  for (const k of keyNames) {
    if (row[k] !== undefined && row[k] !== null && String(row[k]).trim() !== '') {
      return row[k];
    }
  }
  return '';
}

/**
 * Strips any time/timezone from date string and keeps pure YYYY-MM-DD
 */
function cleanDateOnly(rawDate: any): string {
  if (!rawDate) return '';
  const normalized = normalizeDateStorage(rawDate);
  if (!normalized) return '';
  // Ensure pure YYYY-MM-DD
  return normalized.split('T')[0].split(' ')[0].trim();
}

/**
 * Parses and groups raw Excel JSON rows into Unique Employees and Historical Career Transactions
 * Performing a SAFE MERGE / UPDATE / CORRECTION against the existing database
 */
export function parseExcelMigrationData(
  jsonData: any[],
  existingEmployees: Employee[],
  existingCareerRecords: CareerPromotionRecord[] = [],
  options: { dryRun?: boolean; rejectInvalidRecords?: boolean } = {}
): MigrationPreviewResult {
  const errors: MigrationRowError[] = [];
  const comparisonRows: HistoricalCorrectionEntry[] = [];
  const unlinkedCareerRecords: UnlinkedCareerRecord[] = [];
  const unlinkedExcelRows: UnlinkedExcelRow[] = [];
  const groupsMap = new Map<string, { rows: any[]; rowIndices: number[] }>();

  // Metrics
  let validRowsCount = 0;
  let emptyRowsCount = 0;
  let missingNameRowsCount = 0;
  let invalidNameRowsCount = 0;
  let missingNationalIdCount = 0;

  // Determine starting base ID for new employees
  let baseNextId = existingEmployees.length > 0 ? Math.max(...existingEmployees.map((e) => e.id)) + 1 : 1001;

  // Step 1: Pre-process & group rows strictly by valid employee identity
  jsonData.forEach((row, idx) => {
    const rowNumber = idx + 2; // Excel row numbering (1 is header)

    // Check if row is completely empty
    const values = Object.values(row);
    const isRowEmpty = values.length === 0 || values.every((v) => v === undefined || v === null || String(v).trim() === '');
    if (isRowEmpty) {
      emptyRowsCount++;
      unlinkedExcelRows.push({
        rowNumber,
        rawRow: row,
        reason: 'سطر فارغ بالكامل في ملف الإكسل (لا يحتوي على أي بيانات).',
        category: 'فارغ'
      });
      return;
    }

    const rawNatId = String(extractFieldValue(row, COLUMN_KEYS.nationalId) || '').trim();
    const cleanNatId = rawNatId.replace(/\D/g, '');
    const rawFullName = String(extractFieldValue(row, COLUMN_KEYS.fullName) || '').trim();
    const rawJobNum = String(extractFieldValue(row, COLUMN_KEYS.jobNumber) || '').trim();
    const rawGrade = String(extractFieldValue(row, COLUMN_KEYS.jobGrade) || extractFieldValue(row, COLUMN_KEYS.appointmentGrade) || '').trim();
    const rawTransType = String(extractFieldValue(row, COLUMN_KEYS.transactionType) || '').trim();
    const rawDecNum = String(extractFieldValue(row, COLUMN_KEYS.decisionNumber) || '').trim();
    const rawDecDate = cleanDateOnly(extractFieldValue(row, COLUMN_KEYS.decisionDate));
    const rawActionDate = cleanDateOnly(extractFieldValue(row, COLUMN_KEYS.gradeEntryDate) || extractFieldValue(row, COLUMN_KEYS.hireDate));
    const rawInc = Number(extractFieldValue(row, COLUMN_KEYS.currentIncrement) || 0) || 0;

    // Check if this row matches an existing legitimate employee in current database
    const existingMatch = existingEmployees.find((e) => {
      if (cleanNatId && e.nationalId === cleanNatId) return true;
      if (rawNatId && e.nationalId === rawNatId) return true;
      if (rawJobNum && e.jobNumber === rawJobNum) return true;
      if (rawFullName && !isInvalidPlaceholderName(rawFullName) && e.fullName === rawFullName) return true;
      return false;
    });

    const isNameMissing = !rawFullName || rawFullName.trim() === '';
    const isNamePlaceholder = isInvalidPlaceholderName(rawFullName);
    const isFakeNatId = isFakeSequentialNationalId(cleanNatId || rawNatId);

    // CRITICAL SECURITY & DATA-INTEGRITY CHECK 1: Fake / Sequential National ID
    if (!existingMatch && isFakeNatId) {
      unlinkedExcelRows.push({
        rowNumber,
        rawRow: row,
        reason: `الرقم الوطني (${cleanNatId || rawNatId}) مصنف كرقم تسلسلي وهمي غير معتمد (11990xxxxxxx).`,
        category: 'رقم وطني غير صالح'
      });

      errors.push({
        rowNumber,
        nationalId: cleanNatId || rawNatId || 'وهمي',
        employeeName: rawFullName || 'غير محدد',
        errorType: 'بيانات ناقصة',
        description: `السطر يحتوي على رقم وطني تسلسلي وهمي (${cleanNatId || rawNatId}). تم حجب السجل لمنع إدراج موظف بهوية غير نظامية.`,
        recommendedAction: 'تصحيح الرقم الوطني واستبداله بالرقم الوطني الحقيقي الصادر عن مصلحة الأحوال المدنية.'
      });

      return;
    }

    // CRITICAL SECURITY & DATA-INTEGRITY CHECK 2: Missing or Placeholder Names
    // If there is NO existing employee match AND the row does NOT contain a valid real employee name:
    // WE MUST NEVER CREATE AN EMPLOYEE RECORD!
    if (!existingMatch && (isNameMissing || isNamePlaceholder)) {
      if (isNameMissing) {
        missingNameRowsCount++;
      } else {
        invalidNameRowsCount++;
      }

      // Check if this row contains career history information (grade, action type, decision, etc.)
      const hasCareerData = !!(rawGrade || rawTransType || rawDecNum || rawActionDate || rawInc > 0);

      if (hasCareerData) {
        // Capture as Unlinked Career Record
        unlinkedCareerRecords.push({
          rowNumber,
          extractedName: rawFullName || 'غير مسجل',
          extractedNationalId: cleanNatId || rawNatId || '',
          extractedJobNumber: rawJobNum || '',
          actionType: rawTransType || 'حركة وظيفية',
          newGrade: rawGrade || '—',
          newIncrement: rawInc,
          actionDate: rawActionDate || '',
          decisionNumber: rawDecNum || '—',
          decisionDate: rawDecDate || rawActionDate || '',
          issuingAuthority: 'مصرف الدم المركزي المرج',
          notes: 'سجل ترقية/علاوة بدون هوية موظف شرعي في ملف الإكسل',
          reason: isNameMissing ? 'اسم الموظف مفقود بالكامل في هذا السطر' : `اسم الموظف نص غير صالح ("${rawFullName}")`,
          rawRow: row
        });

        errors.push({
          rowNumber,
          nationalId: cleanNatId || rawNatId || 'غير متوفر',
          employeeName: rawFullName || 'مفقود',
          errorType: 'سجل غير مرتبط',
          description: `السطر يحتوي على حركة وظيفية (${rawGrade || rawTransType}) بدون هوية موظف شرعية. تم حفظها كسجل غير مرتبط بدلاً من إنشاء موظف وهمي.`,
          recommendedAction: 'مراجعة ملف الإكسل وربط الحركة الوظيفية بالموظف الحقيقي.'
        });
      } else {
        // Capture as Unlinked Excel Row
        unlinkedExcelRows.push({
          rowNumber,
          rawRow: row,
          reason: isNameMissing ? 'السطر لا يحتوي على اسم موظف أو رقم وطني صالح.' : `الاسم المدخل ("${rawFullName}") مصنف كنص غير صالح/وهمي.`,
          category: isNameMissing ? 'بدون اسم' : 'اسم غير صالح'
        });

        errors.push({
          rowNumber,
          nationalId: cleanNatId || rawNatId || 'غير متوفر',
          employeeName: rawFullName || 'غير محدد',
          errorType: 'بيانات ناقصة',
          description: isNameMissing ? 'السطر لا يحتوي على اسم موظف شرعي أو رقم وطني.' : 'اسم الموظف غير معرف أو وهمي.',
          recommendedAction: 'تعبئة بيانات الموظف الحقيقية أو إزالة السطر الفارغ من الإكسل.'
        });
      }

      // STRICTLY DO NOT ADD TO groupsMap (WILL NOT CREATE EMPLOYEE)
      return;
    }

    // Row is valid for employee grouping
    validRowsCount++;

    if (!cleanNatId && !rawNatId) {
      missingNationalIdCount++;
    }

    // Primary grouping key: Clean National ID -> Job Number -> Verified Real Name
    let groupKey = cleanNatId || rawNatId;
    if (!groupKey) {
      if (rawJobNum) {
        groupKey = `JOB_${rawJobNum}`;
      } else if (rawFullName) {
        groupKey = `NAME_${rawFullName}`;
      } else if (existingMatch) {
        groupKey = `EMP_${existingMatch.id}`;
      }
    }

    if (!groupsMap.has(groupKey!)) {
      groupsMap.set(groupKey!, { rows: [], rowIndices: [] });
    }
    groupsMap.get(groupKey!)!.rows.push(row);
    groupsMap.get(groupKey!)!.rowIndices.push(rowNumber);
  });

  const employeeGroups: EmployeeMigrationGroup[] = [];
  const allHistoricalActions: HistoricalParsedAction[] = [];
  let totalDuplicates = 0;
  let totalCorrected = 0;
  let totalNewHistorical = 0;
  let totalFlaggedReview = 0;

  // Step 2: For each unique employee group, extract Master Record and Historical Transactions
  groupsMap.forEach((groupData, groupKey) => {
    const { rows, rowIndices } = groupData;
    const firstRow = rows[0];

    const rawNatId = String(extractFieldValue(firstRow, COLUMN_KEYS.nationalId) || '').trim();
    const cleanNatId = rawNatId.replace(/\D/g, '');
    const rawFullName = String(extractFieldValue(firstRow, COLUMN_KEYS.fullName) || '').trim();
    const rawJobNum = String(extractFieldValue(firstRow, COLUMN_KEYS.jobNumber) || '').trim();

    // Check if employee exists in current database (PRIMARY MATCHING KEY: الرقم الوطني)
    const existingMatch = existingEmployees.find((e) => {
      if (cleanNatId && e.nationalId === cleanNatId) return true;
      if (rawNatId && e.nationalId === rawNatId) return true;
      if (rawJobNum && e.jobNumber === rawJobNum) return true;
      return false;
    });

    const isExisting = !!existingMatch;
    const employeeSysId = existingMatch ? existingMatch.id : (baseNextId++);
    const fileNumber = existingMatch?.jobNumber || rawJobNum || `${employeeSysId}/م`;

    // Master data field aggregation with conflict detection
    const conflictNotes: string[] = [];
    let detectedMotherName = existingMatch?.motherName || '';
    let detectedBirthDate = existingMatch?.birthDate || '';
    let detectedBirthPlace = existingMatch?.birthPlace || '';
    let detectedHireDate = existingMatch?.hireDate || '';
    let detectedDirectingDate = existingMatch?.directingDate || '';
    let detectedBloodBankStartDate = existingMatch?.bloodBankStartDate || '';
    let detectedAppointmentGrade = existingMatch?.appointmentGrade || '';
    let detectedAppointmentSystem = existingMatch?.appointmentSalarySystem || '';
    let detectedAppointmentIncrements = existingMatch?.appointmentIncrements ?? 0;
    let detectedQualification = existingMatch?.qualification || '';
    let detectedSpecialization = existingMatch?.specialization || '';
    let detectedCadreNumber = existingMatch?.cadreNumber || '';
    let detectedHiringEntity = existingMatch?.hiringEntity || '';
    let detectedDepartment = existingMatch?.department || 'قسم التبرع بالدم';
    let detectedJobTitle = existingMatch?.jobTitle || 'أخصائي شؤون وظيفية';
    let detectedStatus = existingMatch?.status || 'على رأس العمل';
    let detectedSalaryScale = existingMatch?.salaryScale || 'جدول المرتبات الموحد';

    // Clean existing misplaced specialization if needed
    if (detectedSpecialization && isRecognizedJobGrade(detectedSpecialization)) {
      // Misplaced grade detected in specialization!
      if (!detectedAppointmentGrade) {
        detectedAppointmentGrade = detectedSpecialization;
      }
      detectedSpecialization = existingMatch?.qualification ? 'تخصص عام' : '';
    }

    // Iterate across all rows for this employee to gather master fields without overwriting blindly
    rows.forEach((r, rIdx) => {
      const rNum = rowIndices[rIdx];
      const mName = String(extractFieldValue(r, COLUMN_KEYS.motherName) || '').trim();
      if (mName) {
        if (existingMatch && existingMatch.motherName && existingMatch.motherName !== mName && existingMatch.motherName !== 'غير مسجل') {
          conflictNotes.push(`تعارض في اسم الأم: في المنظومة ("${existingMatch.motherName}") مقابل الملف ("${mName}")`);
        } else if (!detectedMotherName || detectedMotherName === 'غير مسجل') {
          detectedMotherName = mName;
        }
      }

      const bDate = cleanDateOnly(extractFieldValue(r, COLUMN_KEYS.birthDate));
      if (bDate) {
        if (existingMatch && existingMatch.birthDate && existingMatch.birthDate !== bDate && existingMatch.birthDate !== '1990-01-01') {
          conflictNotes.push(`تعارض في تاريخ الميلاد: في المنظومة (${formatDateDisplay(existingMatch.birthDate)}) مقابل الملف (${formatDateDisplay(bDate)})`);
        } else if (!detectedBirthDate) {
          detectedBirthDate = bDate;
        }
      }

      const bPlace = String(extractFieldValue(r, COLUMN_KEYS.birthPlace) || '').trim();
      if (bPlace && !detectedBirthPlace) detectedBirthPlace = bPlace;

      const hDate = cleanDateOnly(extractFieldValue(r, COLUMN_KEYS.hireDate));
      if (hDate && !detectedHireDate) detectedHireDate = hDate;

      const dDate = cleanDateOnly(extractFieldValue(r, COLUMN_KEYS.directingDate));
      if (dDate && !detectedDirectingDate) detectedDirectingDate = dDate;

      const bbDate = cleanDateOnly(extractFieldValue(r, COLUMN_KEYS.bloodBankStartDate));
      if (bbDate && !detectedBloodBankStartDate) detectedBloodBankStartDate = bbDate;

      const aGrade = String(extractFieldValue(r, COLUMN_KEYS.appointmentGrade) || '').trim();
      if (aGrade && !detectedAppointmentGrade) detectedAppointmentGrade = aGrade;

      const aSys = String(extractFieldValue(r, COLUMN_KEYS.appointmentSalarySystem) || '').trim();
      if (aSys && !detectedAppointmentSystem) detectedAppointmentSystem = aSys;

      const aInc = extractFieldValue(r, COLUMN_KEYS.appointmentIncrements);
      if (aInc !== '' && detectedAppointmentIncrements === 0) {
        detectedAppointmentIncrements = parseInt(String(aInc), 10) || 0;
      }

      const qual = String(extractFieldValue(r, COLUMN_KEYS.qualification) || '').trim();
      if (qual && !detectedQualification) detectedQualification = qual;

      let spec = String(extractFieldValue(r, COLUMN_KEYS.specialization) || '').trim();
      if (spec) {
        if (isRecognizedJobGrade(spec)) {
          // If Excel cell had job grade in specialization, do NOT store in specialization
          if (!detectedAppointmentGrade) detectedAppointmentGrade = spec;
        } else if (!detectedSpecialization || detectedSpecialization === 'عام') {
          detectedSpecialization = spec;
        }
      }

      const cadre = String(extractFieldValue(r, COLUMN_KEYS.cadreNumber) || '').trim();
      if (cadre && !detectedCadreNumber) detectedCadreNumber = cadre;

      const hiring = String(extractFieldValue(r, COLUMN_KEYS.hiringEntity) || '').trim();
      if (hiring && !detectedHiringEntity) detectedHiringEntity = hiring;

      const dept = String(extractFieldValue(r, COLUMN_KEYS.department) || '').trim();
      if (dept && !existingMatch) detectedDepartment = dept;

      const job = String(extractFieldValue(r, COLUMN_KEYS.jobTitle) || '').trim();
      if (job && !existingMatch) detectedJobTitle = job;

      const stat = String(extractFieldValue(r, COLUMN_KEYS.status) || '').trim();
      if (stat && !existingMatch) detectedStatus = stat as EmploymentStatus;

      const scale = String(extractFieldValue(r, COLUMN_KEYS.salaryScale) || '').trim();
      if (scale && !existingMatch) detectedSalaryScale = scale;
    });

    // Determine Nationality & Document Type
    const is12Digit = cleanNatId.length === 12;
    const inferredNat = existingMatch?.nationality || (is12Digit ? 'ليبي' : (cleanNatId ? 'غير محدد' : 'ليبي'));
    const inferredDocType = existingMatch?.documentType || (inferredNat === 'ليبي' ? 'الرقم الوطني' : 'رقم جواز السفر');

    // Parse historical actions from each row for this employee
    const historicalActions: HistoricalParsedAction[] = [];
    const seenActionKeys = new Set<string>();

    // Existing career records for this employee in database
    const empExistingCareerRecords = existingCareerRecords.filter((cr) => cr.employeeId === employeeSysId);

    rows.forEach((r, rIdx) => {
      const rNum = rowIndices[rIdx];
      const rawTransType = String(extractFieldValue(r, COLUMN_KEYS.transactionType) || '').trim();
      let rawGrade = String(extractFieldValue(r, COLUMN_KEYS.jobGrade) || '').trim();
      let rawSpec = String(extractFieldValue(r, COLUMN_KEYS.specialization) || '').trim();
      const rawInc = extractFieldValue(r, COLUMN_KEYS.currentIncrement);
      const incCount = rawInc !== '' ? (parseInt(String(rawInc), 10) || 0) : 0;
      
      const rawGradeDate = extractFieldValue(r, COLUMN_KEYS.gradeEntryDate);
      const cleanGradeDate = cleanDateOnly(rawGradeDate);

      const rawEligDate = extractFieldValue(r, COLUMN_KEYS.eligibilityDate);
      const cleanEligDate = cleanDateOnly(rawEligDate);

      const rawDecNum = String(extractFieldValue(r, COLUMN_KEYS.decisionNumber) || '').trim();
      const rawDecDate = cleanDateOnly(extractFieldValue(r, COLUMN_KEYS.decisionDate));
      const rawIssuer = String(extractFieldValue(r, COLUMN_KEYS.issuingAuthority) || '').trim();
      const rowNotes = String(extractFieldValue(r, COLUMN_KEYS.notes) || '').trim();

      // Check if Excel specialization contains a misplaced grade
      if (rawSpec && isRecognizedJobGrade(rawSpec)) {
        if (!rawGrade) {
          rawGrade = rawSpec;
        }
        rawSpec = ''; // cleaned!
      }

      // Check if date parsing failed on non-empty date cell
      if (rawGradeDate && String(rawGradeDate).trim() !== '' && !cleanGradeDate) {
        errors.push({
          rowNumber: rNum,
          nationalId: cleanNatId || rawNatId,
          employeeName: rawFullName || existingMatch?.fullName || 'غير محدد',
          errorType: 'تاريخ غير صالح',
          description: `تعذر قراءة تاريخ العملية / الدرجة الحالية (${String(rawGradeDate)}).`,
          recommendedAction: 'مراجعة تنسيق التاريخ بالسطر (اليوم/الشهر/السنة).'
        });
      }

      // If the row contains transaction indicators
      if (rawTransType || rawGrade || cleanGradeDate || cleanEligDate || incCount > 0 || rawDecNum) {
        let normAction = normalizeCareerActionType(rawTransType || (rawGrade ? 'ترقية' : 'علاوة دورية'));
        const actionDate = cleanGradeDate || cleanEligDate || rawDecDate || detectedHireDate || '';

        // Check if this action represents the 2023 transition from 418 to General Numerical Grade
        const isYear2023 = actionDate.startsWith('2023') || (rawDecDate && rawDecDate.startsWith('2023'));
        if (
          isYear2023 &&
          isGeneralNumericalGrade(rawGrade) &&
          (isRegulation418Grade(detectedAppointmentGrade) || isRegulation418Grade(rawSpec) || normAction === 'تسوية وضع' || normAction === 'تحويل من اللائحة 418 إلى نظام الدرجات العامة')
        ) {
          normAction = 'تحويل من اللائحة 418 إلى نظام الدرجات العامة';
        }

        // Deduplication key in file: employee + actionType + actionDate + newGrade + newIncrement + decisionNumber
        const dedupKey = `${normAction}_${actionDate}_${rawGrade}_${incCount}_${rawDecNum}`;
        const isDuplicateInFile = seenActionKeys.has(dedupKey);
        seenActionKeys.add(dedupKey);

        // Check against existing database records
        // 1. Exact Match (already exists in DB)
        const exactMatchInDb = empExistingCareerRecords.find(
          (cr) => cr.actionType === normAction &&
                  (cr.actionDate === actionDate || (!cr.actionDate && !actionDate)) &&
                  (cr.newGrade === rawGrade || (!cr.newGrade && !rawGrade)) &&
                  cr.newIncrement === incCount
        );

        // 2. Correction Match (e.g. action exists but grade was misplaced, or record needs updating)
        const correctionMatchInDb = !exactMatchInDb && empExistingCareerRecords.find((cr) => {
          const sameDate = cr.actionDate === actionDate && actionDate !== '';
          const sameDec = cr.decisionNumber && rawDecNum && cr.decisionNumber === rawDecNum;
          const sameAction = cr.actionType === normAction;
          return sameAction && (sameDate || sameDec);
        });

        let proposedAction: ProposedActionType = 'إضافة سجل تاريخي جديد';
        let isDuplicate = false;
        let isCorrection = false;
        let matchedRecId: string | undefined;
        let oldValDesc = '';
        let newValDesc = '';
        let correctionNotes = '';

        if (!isExisting) {
          proposedAction = 'موظف جديد';
          totalNewHistorical++;
        } else if (isDuplicateInFile || exactMatchInDb) {
          proposedAction = isDuplicateInFile ? 'سجل مكرر' : 'لا تغيير';
          isDuplicate = true;
          totalDuplicates++;
          matchedRecId = exactMatchInDb?.id;
          correctionNotes = 'موجود مسبقاً في قاعدة البيانات — لا حاجة للاستيراد';
        } else if (correctionMatchInDb) {
          proposedAction = 'تصحيح سجل موجود';
          isCorrection = true;
          totalCorrected++;
          matchedRecId = correctionMatchInDb.id;
          oldValDesc = `الدرجة: ${correctionMatchInDb.newGrade || 'غير محددة'} | العلاوة: ${correctionMatchInDb.newIncrement}`;
          newValDesc = `الدرجة المصححة: ${rawGrade || '—'} | العلاوة: ${incCount}`;
          correctionNotes = 'تصحيح بيانات الدرجة المنقولة من حقل التخصص إلى الدرجة الجديدة الممنوحة';
        } else {
          proposedAction = 'إضافة سجل تاريخي جديد';
          totalNewHistorical++;
          correctionNotes = 'حركة وظيفية جديدة غير مسجلة مسبقاً بالمنظومة';
        }

        const parsedAction: HistoricalParsedAction = {
          rowNumber: rNum,
          nationalId: cleanNatId || rawNatId,
          employeeName: rawFullName || existingMatch?.fullName || 'غير معروف',
          actionType: normAction,
          rawActionName: rawTransType || normAction,
          previousGrade: '',
          previousIncrement: 0,
          newGrade: rawGrade || detectedAppointmentGrade || 'الدرجة السابعة',
          newIncrement: incCount,
          specialization: rawSpec || detectedSpecialization,
          actionDate: actionDate,
          decisionDate: rawDecDate || actionDate,
          decisionNumber: rawDecNum || `قرار-${rNum}`,
          issuingAuthority: rawIssuer || 'مصرف الدم المركزي المرج',
          notes: rowNotes || correctionNotes,
          isDuplicate,
          isCorrection,
          matchedExistingRecordId: matchedRecId,
          proposedAction
        };

        historicalActions.push(parsedAction);
        allHistoricalActions.push(parsedAction);

        // Add side-by-side comparison row
        comparisonRows.push({
          rowNumber: rNum,
          nationalId: cleanNatId || rawNatId,
          employeeName: rawFullName || existingMatch?.fullName || 'غير معروف',
          actionType: normAction,
          existingSpecialization: existingMatch?.specialization || '—',
          existingGrade: correctionMatchInDb?.newGrade || exactMatchInDb?.newGrade || existingMatch?.jobGrade || '—',
          existingActionDate: correctionMatchInDb?.actionDate || exactMatchInDb?.actionDate || existingMatch?.gradeEntryDate || '—',
          existingRecordId: matchedRecId,
          cleanedSpecialization: rawSpec || detectedSpecialization || '—',
          cleanedGrade: rawGrade || '—',
          cleanedActionDate: actionDate || '—',
          proposedAction,
          fieldNameCorrected: isCorrection ? 'الدرجة الجديدة الممنوحة والتخصص' : undefined,
          oldValue: oldValDesc || undefined,
          newValue: newValDesc || undefined,
          notes: correctionNotes
        });
      }
    });

    // Determine current employee grade and increment from latest valid transaction or master row
    let latestGrade = existingMatch?.jobGrade || detectedAppointmentGrade || 'الدرجة السابعة';
    let latestIncrement = existingMatch?.currentIncrement ?? 1;
    let latestGradeEntryDate = existingMatch?.gradeEntryDate || detectedHireDate || '';
    let latestEligibilityDate = existingMatch?.eligibilityDate || '2026-01-01';

    // Sort valid non-duplicate historical actions chronologically
    const nonDuplicates = historicalActions.filter((h) => !h.isDuplicate);
    if (nonDuplicates.length > 0) {
      nonDuplicates.sort((a, b) => {
        const tA = new Date(a.actionDate || '').getTime() || 0;
        const tB = new Date(b.actionDate || '').getTime() || 0;
        return tA - tB;
      });

      // Chain previous grades and increments in historical sequence
      for (let i = 0; i < nonDuplicates.length; i++) {
        if (i > 0) {
          nonDuplicates[i].previousGrade = nonDuplicates[i - 1].newGrade;
          nonDuplicates[i].previousIncrement = nonDuplicates[i - 1].newIncrement;
        } else {
          nonDuplicates[i].previousGrade = detectedAppointmentGrade || nonDuplicates[i].newGrade;
          nonDuplicates[i].previousIncrement = detectedAppointmentIncrements;
        }
      }

      // If new actions or corrections were present, calculate state without touching today's date
      const latestAction = nonDuplicates[nonDuplicates.length - 1];
      latestGrade = latestAction.newGrade || latestGrade;
      latestIncrement = latestAction.newIncrement || latestIncrement;
      const lastGradeAction = [...nonDuplicates].reverse().find(
        (a) => a.actionType === 'ترقية' || 
               a.actionType === 'ترقية استثنائية' || 
               a.actionType === 'تسوية وضع' || 
               a.actionType === 'ندب على درجة' ||
               a.actionType === 'تحويل من اللائحة 418 إلى نظام الدرجات العامة'
      );
      if (lastGradeAction && lastGradeAction.actionDate) {
        latestGradeEntryDate = lastGradeAction.actionDate;
      } else if (latestAction.actionDate) {
        latestGradeEntryDate = latestAction.actionDate;
      }
    }

    if (conflictNotes.length > 0) {
      totalFlaggedReview++;
      errors.push({
        rowNumber: rowIndices[0],
        nationalId: cleanNatId || rawNatId,
        employeeName: rawFullName || existingMatch?.fullName || 'غير معروف',
        errorType: 'تنبيه تعارض',
        description: conflictNotes.join(' | '),
        recommendedAction: 'مراجعة ملف الموظف للتأكد من البيانات الشخصية الصحيحة.'
      });
    }

    if (!rawFullName && !existingMatch) {
      errors.push({
        rowNumber: rowIndices[0],
        nationalId: cleanNatId || rawNatId,
        employeeName: 'مفقود',
        errorType: 'بيانات ناقصة',
        description: 'اسم الموظف مفقود في السجلات المستوردة.',
        recommendedAction: 'تعبئة اسم الموظف بالملف.'
      });
    }

    const isMedical = detectedDepartment.includes('طبي') || 
                      detectedDepartment.includes('مسح') || 
                      detectedDepartment.includes('أطباء') || 
                      detectedDepartment.includes('تبرع') || 
                      detectedDepartment.includes('تحضير') ||
                      detectedDepartment.includes('سيرولوجي');

    // Consolidated Master Employee Object
    // CRITICAL ABSOLUTE RULES:
    // 1. National ID comes ONLY from clean source data or verified existing match. NEVER fake sequential IDs!
    // 2. Full Name comes ONLY from clean source data or verified existing match. NEVER 'موظف غير معرف'!
    let masterRecord: Employee = {
      id: employeeSysId,
      jobNumber: fileNumber,
      nationality: inferredNat,
      documentType: inferredDocType,
      nationalId: inferredNat === 'ليبي' ? (cleanNatId || (existingMatch?.nationalId || '')) : '',
      passportNumber: inferredNat !== 'ليبي' ? (rawNatId || existingMatch?.passportNumber || '') : '',
      needsNationalityReview: existingMatch?.needsNationalityReview ?? (!is12Digit && !!rawNatId && inferredNat === 'غير محدد'),
      fullName: rawFullName || (existingMatch?.fullName || ''),
      motherName: detectedMotherName || 'غير مسجل',
      birthDate: detectedBirthDate || (existingMatch?.birthDate || '1990-01-01'),
      birthPlace: detectedBirthPlace || (existingMatch?.birthPlace || 'المرج'),
      gender: (existingMatch?.gender || 'ذكر'),
      maritalStatus: (existingMatch?.maritalStatus || 'متزوج'),
      status: (detectedStatus as EmploymentStatus) || 'على رأس العمل',
      hireDate: detectedHireDate || (existingMatch?.hireDate || '2015-01-01'),
      directingDate: detectedDirectingDate || (existingMatch?.directingDate || detectedHireDate || '2015-01-15'),
      bloodBankStartDate: detectedBloodBankStartDate || (existingMatch?.bloodBankStartDate || detectedDirectingDate || detectedHireDate || '2015-01-15'),
      appointmentSalarySystem: detectedAppointmentSystem || existingMatch?.appointmentSalarySystem || (detectedAppointmentGrade ? (inferSalarySystemFromGrade(detectedAppointmentGrade).system || 'جدول مرتبات القانون 15') : 'جدول مرتبات القانون 15'),
      appointmentGrade: detectedAppointmentGrade || (existingMatch?.appointmentGrade || 'الدرجة السادسة'),
      appointmentIncrements: detectedAppointmentIncrements,
      salaryScale: detectedSalaryScale || 'جدول المرتبات الموحد',
      jobGrade: existingMatch ? existingMatch.jobGrade : latestGrade,
      currentIncrement: existingMatch ? existingMatch.currentIncrement : latestIncrement,
      // MANDATORY CRITICAL RULE: Preserved original historical date from Excel, NEVER today's date!
      gradeEntryDate: existingMatch ? existingMatch.gradeEntryDate : (latestGradeEntryDate || detectedHireDate || ''),
      transactionType: existingMatch ? existingMatch.transactionType : (nonDuplicates.length > 0 ? nonDuplicates[nonDuplicates.length - 1].rawActionName : 'ترقية عادية'),
      eligibilityDate: existingMatch ? existingMatch.eligibilityDate : (latestEligibilityDate || '2026-01-01'),
      qualification: detectedQualification || (existingMatch?.qualification || 'بكالوريوس'),
      specialization: detectedSpecialization || (existingMatch?.specialization || 'عام'),
      cadreNumber: detectedCadreNumber || (existingMatch?.cadreNumber || `CAD-${employeeSysId}`),
      hiringEntity: detectedHiringEntity || (existingMatch?.hiringEntity || 'مصرف الدم المركزي بلدية المرج'),
      assignmentCategory: isMedical ? 'طبي' : 'إداري',
      department: detectedDepartment,
      jobTitle: detectedJobTitle,
      phone: existingMatch?.phone || '',
      email: existingMatch?.email || '',
      pdfPath: existingMatch?.pdfPath || `/docs/${employeeSysId}_doc.pdf`,
      notes: conflictNotes.length > 0 ? `تنبيه: ${conflictNotes.join(' - ')}` : (existingMatch?.notes || 'تم تدقيق ودمج السجل من ملف الإكسل المعتمد')
    };

    // Calculate true chronological current grade for master record across all combined career actions
    const combinedSyntheticCareerRecords: CareerPromotionRecord[] = [
      ...empExistingCareerRecords,
      ...nonDuplicates.map((nd, idx) => ({
        id: `import-${employeeSysId}-${idx}`,
        employeeId: employeeSysId,
        fileNumber: fileNumber,
        employeeName: masterRecord.fullName,
        actionType: nd.actionType,
        previousGrade: nd.previousGrade,
        previousIncrement: nd.previousIncrement,
        newGrade: nd.newGrade,
        newIncrement: nd.newIncrement,
        actionDate: nd.actionDate,
        decisionDate: nd.decisionDate,
        decisionNumber: nd.decisionNumber,
        issuingAuthority: nd.issuingAuthority,
        notes: nd.notes,
        createdBy: 'استيراد إكسل',
        createdAt: new Date().toISOString()
      }))
    ];

    const chronoCalculation = calculateEmployeeCurrentGrade(masterRecord, combinedSyntheticCareerRecords);
    if (!existingMatch || chronoCalculation.isGradeChanged) {
      masterRecord.jobGrade = chronoCalculation.calculatedJobGrade;
      masterRecord.currentIncrement = chronoCalculation.calculatedIncrement;
      masterRecord.gradeEntryDate = chronoCalculation.calculatedGradeEntryDate || masterRecord.gradeEntryDate;
      masterRecord.salaryScale = chronoCalculation.calculatedSalaryScale;
      if (chronoCalculation.isAmbiguous || chronoCalculation.hasInconsistency) {
        masterRecord.reviewStatus = 'تحتاج إلى تصحيح';
        if (chronoCalculation.anomalyReason) {
          masterRecord.reviewNotes = `استيراد إكسل: ${chronoCalculation.anomalyReason}`;
        }
      }
    }

    // CRITICAL: Double safety check - only include group if fullName is genuine
    if (masterRecord.fullName && !isInvalidPlaceholderName(masterRecord.fullName)) {
      employeeGroups.push({
        nationalId: cleanNatId || rawNatId || '',
        employeeName: masterRecord.fullName,
        masterRecord,
        historicalActions,
        isExisting,
        hasConflicts: conflictNotes.length > 0,
        conflictNotes,
        rowNumbers: rowIndices
      });
    }
  });

  const uniqueEmployeesCount = employeeGroups.length;
  const existingEmployeesCount = employeeGroups.filter((g) => g.isExisting).length;
  const newEmployeesCount = uniqueEmployeesCount - existingEmployeesCount;

  return {
    totalExcelRows: jsonData.length,
    validRowsCount,
    emptyRowsCount,
    missingNameRowsCount,
    invalidNameRowsCount,
    missingNationalIdCount,
    uniqueEmployeesCount,
    totalHistoricalTransactions: allHistoricalActions.length,
    existingEmployeesCount,
    newEmployeesCount,
    correctedRecordsCount: totalCorrected,
    newHistoricalRecordsCount: totalNewHistorical,
    duplicateRecordsCount: totalDuplicates,
    conflictReviewCount: totalFlaggedReview,
    errorCount: errors.length,
    employeeGroups,
    allHistoricalActions,
    comparisonRows,
    unlinkedCareerRecords,
    unlinkedExcelRows,
    errors,
    dryRun: options.dryRun ?? false
  };
}

/**
 * Creates an automatic pre-import full snapshot backup in localStorage
 */
export function createPreImportBackup(currentFullDb: any): { success: boolean; backupKey: string; timestamp: string } {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupKey = `backup_pre_migration_${timestamp}`;
  try {
    const backupPayload = {
      backupKey,
      timestamp: new Date().toISOString(),
      reason: 'نسخة احتياطية تلقائية شاملة قبل دمج وتصحيح بيانات ملف الإكسل (منظومة_جوجل_مدمج_نسخة_نظيفة_جاهزة_للاستيراد.xlsx)',
      data: currentFullDb
    };
    localStorage.setItem(backupKey, JSON.stringify(backupPayload));
    // Also save in recent backups index
    const existingBackups = JSON.parse(localStorage.getItem('system_automatic_backups_list') || '[]');
    existingBackups.unshift({
      key: backupKey,
      date: new Date().toLocaleString('ar-LY'),
      recordsCount: currentFullDb.employees?.length || 0,
      note: 'نسخة ما قبل دمج وتصحيح ملف الإكسل'
    });
    localStorage.setItem('system_automatic_backups_list', JSON.stringify(existingBackups.slice(0, 20)));
    return { success: true, backupKey, timestamp };
  } catch (err) {
    console.error('Failed to create pre-import backup:', err);
    return { success: false, backupKey: '', timestamp };
  }
}

/**
 * Commits the migration and correction atomically into system state
 * Strictly preserves existing employees and applies corrections / missing records without resetting DB
 */
export function commitMigrationAtomic(
  preview: MigrationPreviewResult,
  currentEmployees: Employee[],
  currentCareerRecords: CareerPromotionRecord[],
  currentPromotions: PromotionRecord[],
  currentIncrements: IncrementRecord[],
  currentSettlements: StatusSettlementRecord[],
  currentUser: string = 'مدير النظام'
): MigrationCommitResult {
  // 1. Full Snapshot backup
  const backupInfo = createPreImportBackup({
    employees: currentEmployees,
    careerRecords: currentCareerRecords,
    promotions: currentPromotions,
    increments: currentIncrements,
    settlements: currentSettlements
  });

  // 2. Prepare merged employees list: Preserve existing employees, add only confirmed new employees
  const employeesMap = new Map<number, Employee>();
  currentEmployees.forEach((e) => employeesMap.set(e.id, { ...e }));

  let importedCount = 0;
  let updatedCount = 0;

  preview.employeeGroups.forEach((group) => {
    // STRICT PREVENTATIVE GUARD: Never commit a placeholder or invalid employee
    if (!group.masterRecord.fullName || isInvalidPlaceholderName(group.masterRecord.fullName)) {
      return;
    }

    if (employeesMap.has(group.masterRecord.id)) {
      // Existing employee: Only update master fields if they were empty or misplaced
      const currentEmp = employeesMap.get(group.masterRecord.id)!;
      let updated = false;

      // Correct misplaced specialization on existing employee if found
      if (currentEmp.specialization && isRecognizedJobGrade(currentEmp.specialization)) {
        currentEmp.specialization = group.masterRecord.specialization || 'عام';
        updated = true;
      }

      if (updated) {
        employeesMap.set(currentEmp.id, currentEmp);
        updatedCount++;
      }
    } else {
      // New employee - double check national ID is not fake sequential
      employeesMap.set(group.masterRecord.id, group.masterRecord);
      importedCount++;
    }
  });

  const finalEmployees = Array.from(employeesMap.values());

  // 3. Prepare Career Records: Update corrected ones, append new missing ones, skip duplicates
  const careerRecordsMap = new Map<string, CareerPromotionRecord>();
  currentCareerRecords.forEach((cr) => careerRecordsMap.set(cr.id, { ...cr }));

  const newCareerRecords: CareerPromotionRecord[] = [];
  const newPromotions: PromotionRecord[] = [];
  const newIncrements: IncrementRecord[] = [];
  const newSettlements: StatusSettlementRecord[] = [];

  let nextRecId = Date.now();

  preview.employeeGroups.forEach((group) => {
    // Skip if employee record was invalid
    if (!group.masterRecord.fullName || isInvalidPlaceholderName(group.masterRecord.fullName)) {
      return;
    }
    const emp = group.masterRecord;
    
    group.historicalActions.forEach((action, idx) => {
      if (action.isDuplicate && action.proposedAction === 'لا تغيير') {
        // Skip duplicate - already in DB
        return;
      }

      if (action.isCorrection && action.matchedExistingRecordId && careerRecordsMap.has(action.matchedExistingRecordId)) {
        // Correct existing record in place!
        const existingRecord = careerRecordsMap.get(action.matchedExistingRecordId)!;
        existingRecord.newGrade = action.newGrade;
        existingRecord.newIncrement = action.newIncrement;
        if (action.actionDate) existingRecord.actionDate = action.actionDate;
        if (action.decisionNumber) existingRecord.decisionNumber = action.decisionNumber;
        if (action.decisionDate) existingRecord.decisionDate = action.decisionDate;
        existingRecord.notes = (existingRecord.notes ? `${existingRecord.notes} | ` : '') + 'تم تصحيح الدرجة من ملف الإكسل النظيف';
        careerRecordsMap.set(existingRecord.id, existingRecord);
        return;
      }

      // If new historical record to add
      if (action.proposedAction === 'إضافة سجل تاريخي جديد' || action.proposedAction === 'موظف جديد') {
        const recordId = `CR-IMP-${emp.id}-${idx + 1}-${nextRecId++}`;
        const careerRecord: CareerPromotionRecord = {
          id: recordId,
          employeeId: emp.id,
          fileNumber: emp.jobNumber,
          employeeName: emp.fullName,
          actionType: action.actionType,
          previousGrade: action.previousGrade || action.newGrade,
          previousIncrement: action.previousIncrement || 0,
          newGrade: action.newGrade,
          newIncrement: action.newIncrement,
          actionDate: action.actionDate || emp.hireDate,
          decisionDate: action.decisionDate || action.actionDate || emp.hireDate,
          decisionNumber: action.decisionNumber || `قرار-${idx + 1}`,
          issuingAuthority: action.issuingAuthority || 'مصرف الدم المركزي المرج',
          notes: action.notes || 'مرحل ومصحح من ملف الإكسل',
          createdBy: currentUser,
          createdAt: new Date().toISOString()
        };

        careerRecordsMap.set(recordId, careerRecord);
        newCareerRecords.push(careerRecord);

        // Keep auxiliary module collections in sync
        if (action.actionType === 'ترقية' || action.actionType === 'ترقية استثنائية') {
          newPromotions.push({
            id: recordId,
            employeeId: emp.id,
            fileNumber: emp.jobNumber,
            previousGrade: action.previousGrade || action.newGrade,
            previousIncrement: action.previousIncrement || 0,
            newGrade: action.newGrade,
            newIncrement: action.newIncrement,
            promotionType: action.actionType === 'ترقية استثنائية' ? 'ترقية استثنائية' : 'ترقية عادية',
            decisionNumber: action.decisionNumber,
            decisionDate: action.decisionDate,
            effectiveDate: action.actionDate,
            reason: action.notes || 'ترقية مصححة من ملف الإكسل',
            notes: action.notes,
            createdBy: currentUser,
            createdAt: new Date().toISOString()
          });
        } else if (action.actionType === 'علاوة دورية') {
          newIncrements.push({
            id: recordId,
            employeeId: emp.id,
            fileNumber: emp.jobNumber,
            previousGrade: action.previousGrade || action.newGrade,
            previousIncrement: action.previousIncrement || 0,
            newIncrement: action.newIncrement,
            effectiveDate: action.actionDate,
            incrementType: 'تلقائية',
            decisionNumber: action.decisionNumber,
            notes: action.notes,
            createdBy: currentUser,
            createdAt: new Date().toISOString()
          });
        } else if (action.actionType === 'تسوية وضع') {
          newSettlements.push({
            id: recordId,
            employeeId: emp.id,
            financialStatus: 'تسوية وضع وظيفي',
            grade: action.newGrade,
            jobTitle: emp.jobTitle,
            effectiveDate: action.actionDate,
            decisionNumber: action.decisionNumber,
            reason: action.notes || 'تسوية وضع وظيفي',
            notes: action.notes,
            createdBy: currentUser,
            createdAt: new Date().toISOString()
          });
        }
      }
    });
  });

  const finalCareerRecords = Array.from(careerRecordsMap.values());
  const finalPromotions = [...newPromotions, ...currentPromotions];
  const finalIncrements = [...newIncrements, ...currentIncrements];
  const finalSettlements = [...newSettlements, ...currentSettlements];

  const summaryLog = `تم تصحيح ودمج البيانات بنجاح: مطابقة ${preview.existingEmployeesCount} موظف، تصحيح ${preview.correctedRecordsCount} سجل، إضافة ${preview.newHistoricalRecordsCount} حركة وظيفية، واستبعاد ${preview.duplicateRecordsCount} سجل مكرر. تم إنشاء نسخة احتياطية برقم: ${backupInfo.backupKey}.`;

  return {
    backupCreated: backupInfo.success,
    backupKey: backupInfo.backupKey,
    backupTimestamp: backupInfo.timestamp,
    matchedEmployeesCount: preview.existingEmployeesCount,
    correctedRecordsCount: preview.correctedRecordsCount,
    newHistoricalRecordsCount: preview.newHistoricalRecordsCount,
    duplicateRecordsCount: preview.duplicateRecordsCount,
    newEmployeesCount: preview.newEmployeesCount,
    conflictReviewCount: preview.conflictReviewCount,
    importedEmployeesCount: importedCount,
    updatedEmployeesCount: updatedCount,
    importedHistoricalRecordsCount: newCareerRecords.length,
    unlinkedCareerRecords: preview.unlinkedCareerRecords || [],
    unlinkedExcelRows: preview.unlinkedExcelRows || [],
    employees: finalEmployees,
    careerRecords: finalCareerRecords,
    promotions: finalPromotions,
    increments: finalIncrements,
    settlements: finalSettlements,
    correctionsReport: preview.comparisonRows,
    summaryLog
  };
}

/**
 * Generates and downloads a CSV / Excel Error & Review Report
 */
export function exportErrorsReport(errors: MigrationRowError[], fileName: string = 'تقرير_أخطاء_وتنبيهات_الاستيراد.csv') {
  const header = ['رقم السطر', 'الرقم الوطني', 'اسم الموظف', 'نوع التنبيه / الخطأ', 'التفاصيل والوصف', 'الإجراء الموصى به'];
  const rows = errors.map((e) => [
    e.rowNumber,
    `"${e.nationalId}"`,
    `"${e.employeeName}"`,
    `"${e.errorType}"`,
    `"${e.description.replace(/"/g, '""')}"`,
    `"${e.recommendedAction.replace(/"/g, '""')}"`
  ]);

  const csvContent = '\uFEFF' + [header.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Generates and downloads a detailed CSV / Excel Correction & Merge Report
 */
export function exportCorrectionsReport(corrections: HistoricalCorrectionEntry[], fileName: string = 'تقرير_تصحيح_ودمج_البيانات.csv') {
  const header = [
    'رقم السطر',
    'الرقم الوطني',
    'اسم الموظف',
    'نوع العملية',
    'الإجراء المقترح',
    'الحقل المعدل',
    'القيمة السابقة (المنظومة)',
    'القيمة المصححة (الملف)',
    'التخصص المصحح',
    'الدرجة المصححة',
    'التاريخ',
    'الملاحظات'
  ];

  const rows = corrections.map((c) => [
    c.rowNumber,
    `"${c.nationalId}"`,
    `"${c.employeeName}"`,
    `"${c.actionType}"`,
    `"${c.proposedAction}"`,
    `"${c.fieldNameCorrected || '—'}"`,
    `"${(c.oldValue || c.existingGrade || '—').replace(/"/g, '""')}"`,
    `"${(c.newValue || c.cleanedGrade || '—').replace(/"/g, '""')}"`,
    `"${(c.cleanedSpecialization || '—').replace(/"/g, '""')}"`,
    `"${(c.cleanedGrade || '—').replace(/"/g, '""')}"`,
    `"${c.cleanedActionDate || c.existingActionDate || '—'}"`,
    `"${(c.notes || '').replace(/"/g, '""')}"`
  ]);

  const csvContent = '\uFEFF' + [header.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Built-in Sample Dataset Generator for "منظومة_جوجل_مدمج_نسخة_نظيفة_جاهزة_للاستيراد.xlsx"
 * Contains realistic cleaned data where misplaced grades in 'التخصص' have been correctly moved to 'الدرجة الجديدة الممنوحة'
 */
export function getSampleCleanedGoogleMergedExcelData(): any[] {
  return [
    // Employee 1: د. طارق مسعود سالم الفيتوري (Matches existing employee, provides historical actions)
    {
      'رقم الموظف': '1001/م',
      'الرقم الوطني': '119850123456',
      'اسم الموظف': 'د. طارق مسعود سالم الفيتوري',
      'إسم الأم': 'فاطمة محمد الفيتوري',
      'تاريخ الميلاد': '12/04/1985',
      'مكان الميلاد': 'المرج',
      'الجنس': 'ذكر',
      'الحالة الاجتماعية': 'متزوج',
      'الوضع الوظيفي': 'على رأس العمل',
      'تاريخ التعيين': '15/02/2010',
      'تاريخ المباشرة': '01/03/2010',
      'نظام الدرجة المعين عليها': 'اللائحة 418 – العناصر الطبية',
      'الدرجة المعين عليها': 'الدرجة السابعة',
      'عدد العلاوات عند التعيين': 0,
      'جدول المرتبات': 'جدول مرتبات العناصر الطبية',
      'الدرجة الجديدة الممنوحة': 'الدرجة التاسعة',
      'عدد العلاوات': 3,
      'تاريخ الدرجة الحالية': '01/01/2022',
      'نوع العملية': 'ترقية عادية',
      'تاريخ الاستحقاق': '01/01/2026',
      'المؤهل': 'دكتوراه طب بشرى / علوم مختبرات',
      'التخصص': 'أمراض الدم وبنوك الدم السريرية',
      'رقم الملاك': 'MLK-0101',
      'تاريخ المباشرة في مصرف الدم': '01/03/2010',
      'جهة التعيين': 'وزارة الصحة الليبية',
      'القسم': 'مكتب المدير العام',
      'الوظيفة': 'المدير العام / استشاري أمراض الدم',
      'رقم القرار': 'ق-2022/104',
      'تاريخ القرار': '15/12/2021',
      'الجهة التي أصدرت القرار': 'وزارة الصحة',
      'ملاحظات': 'سجل نظيف وموثق'
    },
    {
      'رقم الموظف': '1001/م',
      'الرقم الوطني': '119850123456',
      'اسم الموظف': 'د. طارق مسعود سالم الفيتوري',
      'نوع العملية': 'علاوة دورية',
      'الدرجة الجديدة الممنوحة': 'الدرجة التاسعة',
      'عدد العلاوات': 4,
      'تاريخ الدرجة الحالية': '01/01/2022',
      'تاريخ الاستحقاق': '01/01/2024',
      'رقم القرار': 'ع-2024/12',
      'تاريخ القرار': '05/01/2024',
      'الجهة التي أصدرت القرار': 'مصرف الدم المركزي المرج',
      'ملاحظات': 'علاوة دورية سنوية للعام 2024'
    },

    // Employee 2: أمل عبدالسلام بلقاسم العبيدي (Grade corrected from Specialization to 'فني صحي ثاني' & 'الدرجة السابعة')
    {
      'رقم الموظف': '1002/م',
      'الرقم الوطني': '219900234567',
      'اسم الموظف': 'أمل عبدالسلام بلقاسم العبيدي',
      'إسم الأم': 'خديجة صالح المنفي',
      'تاريخ الميلاد': '22/08/1990',
      'مكان الميلاد': 'المرج',
      'الجنس': 'أنثى',
      'الحالة الاجتماعية': 'متزوجة',
      'الوضع الوظيفي': 'على رأس العمل',
      'تاريخ التعيين': '01/04/2014',
      'تاريخ المباشرة': '15/04/2014',
      'نظام الدرجة المعين عليها': 'اللائحة 418 – العناصر الطبية',
      'الدرجة المعين عليها': 'الدرجة السادسة',
      'عدد العلاوات عند التعيين': 0,
      'جدول المرتبات': 'جدول العناصر الطبية المساعدة',
      'الدرجة الجديدة الممنوحة': 'فني صحي ثاني',
      'عدد العلاوات': 2,
      'تاريخ الدرجة الحالية': '01/06/2019',
      'نوع العملية': 'ترقية عادية',
      'تاريخ الاستحقاق': '01/06/2023',
      'المؤهل': 'بكالوريوس تقنية مختبرات طبية',
      'التخصص': 'سيرولوجي وفيروسات الدم',
      'رقم الملاك': 'MLK-0922',
      'تاريخ المباشرة في مصرف الدم': '15/04/2014',
      'جهة التعيين': 'مصرف الدم المركزي بلدية المرج',
      'القسم': 'قسم المسح الفيروسي والسيرولوجي',
      'الوظيفة': 'أخصائي سيرولوجي وفيروسات',
      'رقم القرار': 'ق-2019/55',
      'تاريخ القرار': '20/05/2019',
      'الجهة التي أصدرت القرار': 'وزارة الصحة',
      'ملاحظات': 'تم نقل الدرجة من حقل التخصص إلى الدرجة الممنوحة بنجاح'
    },
    {
      'رقم الموظف': '1002/م',
      'الرقم الوطني': '219900234567',
      'اسم الموظف': 'أمل عبدالسلام بلقاسم العبيدي',
      'نوع العملية': 'تسوية وضع',
      'الدرجة الجديدة الممنوحة': 'الدرجة الثامنة',
      'عدد العلاوات': 1,
      'تاريخ الدرجة الحالية': '01/10/2022',
      'تاريخ الاستحقاق': '01/10/2026',
      'المؤهل': 'ماجستير تقنية حيوية',
      'التخصص': 'سيرولوجي وفيروسات الدم',
      'رقم القرار': 'تسوية-2022/89',
      'تاريخ القرار': '15/09/2022',
      'الجهة التي أصدرت القرار': 'وزارة الخدمة المدنية',
      'ملاحظات': 'تسوية بالمؤهل العلمي الجديد'
    },

    // Employee 3: خالد ابراهيم خليفة البرعصي (Matches existing, corrected grade field)
    {
      'رقم الموظف': '1003/م',
      'الرقم الوطني': '119880345678',
      'اسم الموظف': 'خالد ابراهيم خليفة البرعصي',
      'إسم الأم': 'مريم خليفة البرعصي',
      'تاريخ الميلاد': '05/11/1988',
      'مكان الميلاد': 'بنغازي',
      'الجنس': 'ذكر',
      'الحالة الاجتماعية': 'متزوج',
      'الوضع الوظيفي': 'على رأس العمل',
      'تاريخ التعيين': '01/01/2012',
      'تاريخ المباشرة': '15/01/2012',
      'نظام الدرجة المعين عليها': 'جدول مرتبات القانون 15',
      'الدرجة المعين عليها': 'الدرجة الخامسة',
      'عدد العلاوات عند التعيين': 0,
      'جدول المرتبات': 'جدول المرتبات الموحد',
      'الدرجة الجديدة الممنوحة': 'الدرجة السابعة',
      'عدد العلاوات': 4,
      'تاريخ الدرجة الحالية': '01/06/2020',
      'نوع العملية': 'تسوية وضع',
      'تاريخ الاستحقاق': '01/06/2024',
      'المؤهل': 'بكالوريوس إدارة أعمال / محاسبة',
      'التخصص': 'إدارة موارد بشرية',
      'رقم الملاك': 'MLK-0754',
      'تاريخ المباشرة في مصرف الدم': '10/05/2015',
      'جهة التعيين': 'الهيئة العامة للخدمات الطبية',
      'القسم': 'مكتب الموارد البشرية',
      'الوظيفة': 'رئيس مكتب الموارد البشرية',
      'رقم القرار': 'تسوية-2020/12',
      'تاريخ القرار': '15/05/2020',
      'الجهة التي أصدرت القرار': 'وزارة الخدمة المدنية',
      'ملاحظات': 'تسوية وضع إداري وتسكين بالهيكل'
    },

    // Employee 4: منى عمر خليفة الدرسي (Grade corrected: 'معاون صحي أول')
    {
      'رقم الموظف': '1004/م',
      'الرقم الوطني': '219930456123',
      'اسم الموظف': 'منى عمر خليفة الدرسي',
      'إسم الأم': 'سالمة فرج الدرسي',
      'تاريخ الميلاد': '18/02/1993',
      'مكان الميلاد': 'المرج',
      'الجنس': 'أنثى',
      'الحالة الاجتماعية': 'عزباء',
      'الوضع الوظيفي': 'على رأس العمل',
      'تاريخ التعيين': '01/09/2016',
      'تاريخ المباشرة': '15/09/2016',
      'نظام الدرجة المعين عليها': 'اللائحة 418 – العناصر الطبية',
      'الدرجة المعين عليها': 'الدرجة الرابعة',
      'عدد العلاوات عند التعيين': 0,
      'جدول المرتبات': 'جدول العناصر الطبية المساعدة',
      'الدرجة الجديدة الممنوحة': 'معاون صحي أول',
      'عدد العلاوات': 1,
      'تاريخ الدرجة الحالية': '01/01/2023',
      'نوع العملية': 'ترقية استثنائية',
      'تاريخ الاستحقاق': '01/01/2027',
      'المؤهل': 'دبلوم عالي مختبرات طبية',
      'التخصص': 'فصل مكونات الدم والبلازما',
      'رقم الملاك': 'MLK-1102',
      'تاريخ المباشرة في مصرف الدم': '15/09/2016',
      'جهة التعيين': 'مصرف الدم المركزي بلدية المرج',
      'القسم': 'قسم تحضير مكونات الدم',
      'الوظيفة': 'أخصائي فصل البلازما والصفائح',
      'رقم القرار': 'ق-2023/02-استثنائي',
      'تاريخ القرار': '28/12/2022',
      'الجهة التي أصدرت القرار': 'وزارة الصحة',
      'ملاحظات': 'ترقية استثنائية نظيفة'
    },

    // Employee 5: موظف جديد لاختبار إضافة موظف جديد بالرقم الوطني
    {
      'رقم الموظف': '1007/م',
      'الرقم الوطني': '119890554433',
      'اسم الموظف': 'عصام مفتاح رمضان الجبالي',
      'إسم الأم': 'مبروكة سعد الجبالي',
      'تاريخ الميلاد': '09/09/1989',
      'مكان الميلاد': 'المرج',
      'الجنس': 'ذكر',
      'الحالة الاجتماعية': 'متزوج',
      'الوضع الوظيفي': 'على رأس العمل',
      'تاريخ التعيين': '01/11/2013',
      'تاريخ المباشرة': '15/11/2013',
      'نظام الدرجة المعين عليها': 'اللائحة 418 – العناصر الطبية',
      'الدرجة المعين عليها': 'الدرجة الخامسة',
      'عدد العلاوات عند التعيين': 0,
      'جدول المرتبات': 'جدول مرتبات العناصر الطبية',
      'الدرجة الجديدة الممنوحة': 'فني أول',
      'عدد العلاوات': 2,
      'تاريخ الدرجة الحالية': '01/01/2021',
      'نوع العملية': 'ترقية عادية',
      'تاريخ الاستحقاق': '01/01/2025',
      'المؤهل': 'بكالوريوس تقنية مختبرات',
      'التخصص': 'بنوك دم وتوافق فصائل',
      'رقم الملاك': 'MLK-1309',
      'تاريخ المباشرة في مصرف الدم': '15/11/2013',
      'جهة التعيين': 'مصرف الدم المركزي بلدية المرج',
      'القسم': 'قسم التبرع بالدم والحفظ',
      'الوظيفة': 'أخصائي حفظ الدم والتوافق',
      'رقم القرار': 'ق-2021/33',
      'تاريخ القرار': '20/12/2020',
      'الجهة التي أصدرت القرار': 'وزارة الصحة',
      'ملاحظات': 'موظف جديد بالملف النظيف'
    }
  ];
}

/**
 * Backward-compatible alias
 */
export const getSampleGoogleMergedExcelData = getSampleCleanedGoogleMergedExcelData;

/**
 * Returns the most recent pre-import backup snapshot from localStorage if available
 */
export function getLastPreImportBackup(): { key: string; timestamp: string; reason: string; data: any } | null {
  if (typeof window === 'undefined' || !window.localStorage) return null;
  try {
    const listRaw = localStorage.getItem('system_automatic_backups_list');
    if (listRaw) {
      const list = JSON.parse(listRaw);
      if (Array.isArray(list) && list.length > 0) {
        for (const item of list) {
          if (item && item.key && typeof item.key === 'string' && item.key.startsWith('backup_pre_migration_')) {
            const rawPayload = localStorage.getItem(item.key);
            if (rawPayload) {
              const payload = JSON.parse(rawPayload);
              if (payload && payload.data) {
                return {
                  key: item.key,
                  timestamp: payload.timestamp || item.date || '',
                  reason: payload.reason || item.note || '',
                  data: payload.data
                };
              }
            }
          }
        }
      }
    }

    // Fallback: search all localStorage keys
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key && key.startsWith('backup_pre_migration_')) {
        const rawPayload = localStorage.getItem(key);
        if (rawPayload) {
          const payload = JSON.parse(rawPayload);
          if (payload && payload.data) {
            return {
              key,
              timestamp: payload.timestamp || '',
              reason: payload.reason || '',
              data: payload.data
            };
          }
        }
      }
    }
  } catch (err) {
    console.error('Failed to get last pre-import backup:', err);
  }
  return null;
}

/**
 * Executes a full rollback to the last pre-import backup snapshot
 */
export function rollbackLastPreImportBackup(): { success: boolean; message: string; restoredData?: any } {
  const lastBackup = getLastPreImportBackup();
  if (!lastBackup || !lastBackup.data) {
    return {
      success: false,
      message: 'لم يتم العثور على أي نسخة احتياطية محفوظة لعملية الاستيراد السابقة.'
    };
  }

  try {
    return {
      success: true,
      message: `تم استرجاع النسخة الاحتياطية (${lastBackup.key}) بنجاح والتراجع عن آخر استيراد.`,
      restoredData: lastBackup.data
    };
  } catch (err: any) {
    return {
      success: false,
      message: `فشل التراجع: ${err?.message || 'خطأ غير معروف'}`
    };
  }
}

/**
 * Downloads a sample Excel workbook with all official columns
 */
export function downloadSampleExcelWorkbook(filename: string = 'منظومة_جوجل_مدمج_نسخة_نظيفة_جاهزة_للاستيراد.xlsx') {
  const data = getSampleCleanedGoogleMergedExcelData();
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'سجلات_الموظفين_والترقيات');
  XLSX.writeFile(wb, filename);
}
