import { 
  Employee, 
  LeaveTransaction, 
  PromotionRecord, 
  IncrementRecord, 
  SecondmentRecord, 
  TransferRecord, 
  DisciplinaryRecord, 
  ResignationRecord, 
  StatusSettlementRecord, 
  CareerPromotionRecord, 
  EmployeeQualificationRecord, 
  GeneralProcedure,
  HrRule
} from '../types';
import { 
  ReportType, 
  EmployeeSelectionMode, 
  FilterCondition, 
  ReportColumnConfig, 
  SortCriteria, 
  GroupByField, 
  SavedReportTemplate 
} from '../types/reportBuilderTypes';
import { DEPARTMENTS, QUALIFICATIONS, JOB_TITLES, HIRING_ENTITIES } from '../data/initialData';
import { formatDateDisplay } from './dateUtils';
import * as XLSX from 'xlsx';

// ----------------------------------------------------
// 1. REPORT TYPES DEFINITION & LABELS
// ----------------------------------------------------
export const REPORT_TYPES: { id: ReportType; label: string; description: string; iconName: string }[] = [
  { id: 'employees', label: 'تقرير الموظفين', description: 'كشف عام ببيانات الموظفين والملفات والمعلومات الأساسية', iconName: 'Users' },
  { id: 'career', label: 'التقرير الوظيفي', description: 'الوضع الوظيفي الحالي والدرجات وتاريخ التعيين والمباشرة', iconName: 'Briefcase' },
  { id: 'promotions', label: 'تقرير الترقيات', description: 'سجل حركات وقرارات الترقيات الوظيفية وتواريخ الاستحقاق', iconName: 'TrendingUp' },
  { id: 'increments', label: 'تقرير العلاوات الدورية', description: 'سجل العلاوات السنوية التلقائية واليدوية وتواريخها', iconName: 'Award' },
  { id: 'promotions_increments', label: 'تقرير الترقيات والعلاوات', description: 'تقرير شامل مدمج للترقيات والعلاوات وتوزيعها', iconName: 'GitMerge' },
  { id: 'secondment_grade', label: 'تقرير الندب على درجة', description: 'حالات الندب على درجات وظيفية وتكليفات المهام', iconName: 'Building2' },
  { id: 'promotion_eligibility', label: 'تقرير استحقاق الترقيات', description: 'كشف الموظفين المستحقين للترقية وتوفر شروط العلاوات (4+ علاوات)', iconName: 'UserCheck' },
  { id: 'leaves', label: 'تقرير الإجازات', description: 'حركات الإجازات السنوية، المرضية، الطارئة وأرصدة الأيام', iconName: 'Calendar' },
  { id: 'qualifications', label: 'تقرير المؤهلات والدورات', description: 'المؤهلات العلمية، التخصصات، الدورات التدريبية والشهادات', iconName: 'GraduationCap' },
  { id: 'outside_cadre', label: 'تقرير خارج الملاك الوظيفي', description: 'الموظفون المصنفون خارج الملاك أو المنقولون خارجياً', iconName: 'UserX' },
  { id: 'transfers', label: 'تقرير النقل', description: 'سجل حركات النقل الداخلي بين الأقسام والنقل الخارجي', iconName: 'ArrowLeftRight' },
  { id: 'resignations', label: 'تقرير الاستقالات', description: 'سجلات الاستقالة، تواريخ آخر يوم عمل وأسبابها', iconName: 'FileX' },
  { id: 'end_of_service', label: 'تقرير نهاية الخدمة', description: 'إنهاء الخدمة، بلوغ سن التقاعد، والنقل لجهات أخرى', iconName: 'Clock' },
  { id: 'disciplinary', label: 'تقرير الخصومات والإنذارات', description: 'الجزاءات الإدارية، التنبيهات، والخصومات المسجلة', iconName: 'AlertTriangle' },
  { id: 'general_procedures', label: 'تقرير الإجراءات العامة', description: 'القرارات الإدارية، المذكرات، والإجراءات الجماعية', iconName: 'FileCode2' },
  { id: 'custom', label: 'تقرير مخصص متعدد المعايير', description: 'تحديد كامل ومخصص لجميع المعايير والحقول والتجميع', iconName: 'Sliders' },
];

// ----------------------------------------------------
// 2. AVAILABLE FILTERABLE FIELDS
// ----------------------------------------------------
export interface FilterableFieldMeta {
  id: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'select' | 'boolean';
  category: 'personal' | 'job' | 'career' | 'qualifications' | 'leave' | 'admin';
  options?: string[];
  placeholder?: string;
}

export const ALL_FILTERABLE_FIELDS: FilterableFieldMeta[] = [
  // Personal
  { id: 'fullName', label: 'اسم الموظف', type: 'text', category: 'personal', placeholder: 'مثال: محمد علي' },
  { id: 'jobNumber', label: 'الرقم الوظيفي / رقم الملف', type: 'text', category: 'personal', placeholder: 'مثال: 1042' },
  { id: 'nationalId', label: 'الرقم الوطني', type: 'text', category: 'personal', placeholder: 'مثال: 1198...' },
  { id: 'motherName', label: 'اسم الأم', type: 'text', category: 'personal' },
  { id: 'gender', label: 'الجنس', type: 'select', category: 'personal', options: ['ذكر', 'أنثى'] },
  { id: 'maritalStatus', label: 'الحالة الاجتماعية', type: 'select', category: 'personal', options: ['أعزب', 'متزوج', 'مطلق', 'أرمل'] },
  { id: 'nationality', label: 'الجنسية', type: 'text', category: 'personal' },
  { id: 'phone', label: 'رقم الهاتف', type: 'text', category: 'personal' },
  { id: 'birthDate', label: 'تاريخ الميلاد', type: 'date', category: 'personal' },
  { id: 'birthPlace', label: 'مكان الميلاد', type: 'text', category: 'personal' },

  // Job
  { id: 'department', label: 'القسم / الإدارة', type: 'select', category: 'job', options: DEPARTMENTS },
  { id: 'jobTitle', label: 'الوظيفة / المسمى الوظيفي', type: 'select', category: 'job', options: JOB_TITLES },
  { id: 'status', label: 'الوضع الوظيفي / الحالة الحالية', type: 'select', category: 'job', options: [
    'على رأس العمل',
    'إجازة',
    'منتدب',
    'منقول',
    'منقول خارجياً',
    'مستقيل',
    'منهي خدماته',
    'متقاعد',
    'موقوف',
    'متوفى'
  ]},
  { id: 'assignmentCategory', label: 'التصنيف الوظيفي (إداري/طبي)', type: 'select', category: 'job', options: ['إداري', 'طبي'] },
  { id: 'hiringEntity', label: 'جهة التعيين', type: 'text', category: 'job', placeholder: 'مثال: وزارة الصحة' },
  { id: 'cadreNumber', label: 'رقم الملاك الوظيفي', type: 'text', category: 'job' },
  { id: 'isOutsideCadre', label: 'خارج الملاك الوظيفي', type: 'boolean', category: 'job' },
  { id: 'transferredTo', label: 'الجهة المنقول إليها', type: 'text', category: 'job' },

  // Career Dates & Grades
  { id: 'hireDate', label: 'تاريخ التعيين', type: 'date', category: 'career' },
  { id: 'directingDate', label: 'تاريخ المباشرة', type: 'date', category: 'career' },
  { id: 'bloodBankStartDate', label: 'تاريخ المباشرة بمصرف الدم', type: 'date', category: 'career' },
  { id: 'jobGrade', label: 'الدرجة المالية الحالية', type: 'select', category: 'career', options: [
    'الدرجة الأولى', 'الدرجة الثانية', 'الدرجة الثالثة', 'الدرجة الرابعة',
    'الدرجة الخامسة', 'الدرجة السادسة', 'الدرجة السابعة', 'الدرجة الثامنة',
    'الدرجة التاسعة', 'الدرجة العاشرة', 'الدرجة الحادية عشر', 'الدرجة الثانية عشر',
    'الدرجة الثالثة عشر', 'الدرجة الرابعة عشر'
  ]},
  { id: 'currentIncrement', label: 'عدد العلاوات الحالية', type: 'number', category: 'career' },
  { id: 'gradeEntryDate', label: 'تاريخ الدرجة الحالية', type: 'date', category: 'career' },
  { id: 'lastIncrementDate', label: 'تاريخ آخر علاوة', type: 'date', category: 'career' },
  { id: 'appointmentSalarySystem', label: 'نظام الدرجة المعين عليها', type: 'select', category: 'career', options: ['جدول مرتبات القانون 15', 'اللائحة 418 – العناصر الطبية', 'غير محدد'] },
  { id: 'appointmentGrade', label: 'الدرجة المعين عليها', type: 'text', category: 'career', placeholder: 'مثال: الدرجة السادسة' },
  { id: 'appointmentIncrements', label: 'عدد العلاوات عند التعيين', type: 'number', category: 'career' },

  // Qualifications
  { id: 'qualification', label: 'المؤهل العلمي / الدرجة العلمية', type: 'select', category: 'qualifications', options: QUALIFICATIONS },
  { id: 'specialization', label: 'التخصص', type: 'text', category: 'qualifications', placeholder: 'مثال: تمريض / مختبرات / إدارة' },
  { id: 'university', label: 'الجامعة / المعهد', type: 'text', category: 'qualifications', placeholder: 'مثال: جامعة بنغازي' },
  { id: 'graduationYear', label: 'سنة التخرج', type: 'number', category: 'qualifications', placeholder: 'مثال: 2020' },
  { id: 'educationType', label: 'نوع التعليم', type: 'select', category: 'qualifications', options: ['جامعة عامة', 'جامعة خاصة', 'معهد عالي', 'غير منطبق'] },

  // Specific Module Criteria (Virtual joins)
  { id: 'leaveType', label: 'نوع الإجازة (في سجلات الإجازات)', type: 'select', category: 'leave', options: [
    'إجازة سنوية', 'إجازة الوضع والأمومة', 'إجازة مرضية', 'إجازة طارئة', 'إجازة بدون مرتب', 'إجازة حج', 'أخرى'
  ]},
  { id: 'leaveDays', label: 'عدد أيام الإجازة', type: 'number', category: 'leave' },
  { id: 'promotionType', label: 'نوع حركة الترقية', type: 'select', category: 'career', options: [
    'ترقية عادية', 'ترقية استثنائية', 'تسوية وضع', 'ندب / تكليف', 'علاوة دورية'
  ]},
  { id: 'decisionNumber', label: 'رقم القرار / المستند', type: 'text', category: 'admin' },
  { id: 'qualRecordType', label: 'نوع سجل المؤهل / الدورة', type: 'select', category: 'qualifications', options: [
    'مؤهل علمي', 'دورة تدريبية', 'شهادة مهنية', 'برنامج تدريبي'
  ]}
];

// ----------------------------------------------------
// 3. MASTER COLUMNS LIST
// ----------------------------------------------------
export const MASTER_COLUMNS: ReportColumnConfig[] = [
  { id: 'index', label: 'ت', category: 'admin', selected: true, order: 1, width: '40px', align: 'center' },
  { id: 'jobNumber', label: 'الرقم الوظيفي / الملف', category: 'personal', selected: true, order: 2, width: '110px', align: 'center' },
  { id: 'fullName', label: 'الاسم الرباعي', category: 'personal', selected: true, order: 3, width: '220px', align: 'right' },
  { id: 'nationalId', label: 'الرقم الوطني', category: 'personal', selected: true, order: 4, width: '130px', align: 'center' },
  { id: 'gender', label: 'الجنس', category: 'personal', selected: false, order: 5, width: '70px', align: 'center' },
  { id: 'motherName', label: 'اسم الأم', category: 'personal', selected: false, order: 6, width: '140px', align: 'right' },
  { id: 'birthDate', label: 'تاريخ الميلاد', category: 'personal', selected: false, order: 7, width: '100px', align: 'center' },
  { id: 'birthPlace', label: 'مكان الميلاد', category: 'personal', selected: false, order: 8, width: '100px', align: 'right' },
  { id: 'maritalStatus', label: 'الحالة الاجتماعية', category: 'personal', selected: false, order: 9, width: '90px', align: 'center' },
  { id: 'phone', label: 'رقم الهاتف', category: 'personal', selected: false, order: 10, width: '110px', align: 'center' },
  
  { id: 'department', label: 'القسم / الإدارة', category: 'job', selected: true, order: 11, width: '160px', align: 'right' },
  { id: 'jobTitle', label: 'الوظيفة', category: 'job', selected: true, order: 12, width: '150px', align: 'right' },
  { id: 'assignmentCategory', label: 'التصنيف', category: 'job', selected: false, order: 13, width: '80px', align: 'center' },
  { id: 'status', label: 'الوضع الوظيفي', category: 'job', selected: true, order: 14, width: '110px', align: 'center' },
  { id: 'hiringEntity', label: 'جهة التعيين', category: 'job', selected: false, order: 15, width: '140px', align: 'right' },
  { id: 'cadreNumber', label: 'رقم الملاك', category: 'job', selected: false, order: 16, width: '90px', align: 'center' },
  
  { id: 'jobGrade', label: 'الدرجة الحالية', category: 'career', selected: true, order: 17, width: '110px', align: 'center' },
  { id: 'currentIncrement', label: 'عدد العلاوات', category: 'career', selected: true, order: 18, width: '90px', align: 'center' },
  { id: 'gradeEntryDate', label: 'تاريخ الدرجة الحالية', category: 'career', selected: false, order: 19, width: '110px', align: 'center' },
  { id: 'appointmentSalarySystem', label: 'نظام التعيين', category: 'career', selected: false, order: 20, width: '150px', align: 'right' },
  { id: 'appointmentGrade', label: 'الدرجة المعين عليها', category: 'career', selected: false, order: 21, width: '130px', align: 'center' },
  { id: 'appointmentIncrements', label: 'علاوات التعيين', category: 'career', selected: false, order: 22, width: '90px', align: 'center' },
  { id: 'hireDate', label: 'تاريخ التعيين', category: 'career', selected: false, order: 23, width: '100px', align: 'center' },
  { id: 'directingDate', label: 'تاريخ المباشرة', category: 'career', selected: false, order: 24, width: '100px', align: 'center' },
  { id: 'bloodBankStartDate', label: 'مباشرة مصرف الدم', category: 'career', selected: false, order: 25, width: '110px', align: 'center' },
  { id: 'lastIncrementDate', label: 'تاريخ آخر علاوة', category: 'career', selected: false, order: 26, width: '110px', align: 'center' },
  
  { id: 'qualification', label: 'المؤهل العلمي', category: 'qualifications', selected: true, order: 27, width: '140px', align: 'right' },
  { id: 'specialization', label: 'التخصص', category: 'qualifications', selected: false, order: 28, width: '130px', align: 'right' },
  { id: 'university', label: 'الجامعة / المعهد', category: 'qualifications', selected: false, order: 29, width: '140px', align: 'right' },
  { id: 'graduationYear', label: 'سنة التخرج', category: 'qualifications', selected: false, order: 30, width: '80px', align: 'center' },
  { id: 'educationType', label: 'نوع التعليم', category: 'qualifications', selected: false, order: 31, width: '100px', align: 'center' },

  // Module Specific Extra Columns
  { id: 'leaveDetails', label: 'تفاصيل الإجازة / الأيام', category: 'leave', selected: false, order: 32, width: '160px', align: 'right' },
  { id: 'promotionDetails', label: 'حركة الترقية / القرار', category: 'career', selected: false, order: 33, width: '160px', align: 'right' },
  { id: 'transferDetails', label: 'جهة النقل / التاريخ', category: 'job', selected: false, order: 34, width: '160px', align: 'right' },
  { id: 'disciplinaryDetails', label: 'نوع العقوبة / القرار', category: 'admin', selected: false, order: 35, width: '160px', align: 'right' },
  { id: 'qualificationDetails', label: 'الدورات / الشهادات', category: 'qualifications', selected: false, order: 36, width: '170px', align: 'right' },
  { id: 'notes', label: 'ملاحظات', category: 'admin', selected: false, order: 37, width: '150px', align: 'right' },
];

/**
 * Get default selected column IDs based on report type
 */
export function getDefaultColumnsForReport(type: ReportType): string[] {
  switch (type) {
    case 'employees':
      return ['index', 'jobNumber', 'fullName', 'nationalId', 'department', 'jobTitle', 'qualification', 'jobGrade', 'status'];
    case 'career':
      return ['index', 'jobNumber', 'fullName', 'department', 'jobTitle', 'jobGrade', 'currentIncrement', 'gradeEntryDate', 'hireDate', 'directingDate', 'status'];
    case 'promotions':
    case 'promotions_increments':
      return ['index', 'jobNumber', 'fullName', 'department', 'jobTitle', 'jobGrade', 'currentIncrement', 'gradeEntryDate', 'promotionDetails', 'notes'];
    case 'increments':
      return ['index', 'jobNumber', 'fullName', 'department', 'jobTitle', 'jobGrade', 'currentIncrement', 'lastIncrementDate', 'notes'];
    case 'promotion_eligibility':
      return ['index', 'jobNumber', 'fullName', 'department', 'jobTitle', 'jobGrade', 'currentIncrement', 'gradeEntryDate', 'lastIncrementDate', 'status'];
    case 'secondment_grade':
      return ['index', 'jobNumber', 'fullName', 'department', 'jobTitle', 'jobGrade', 'status', 'notes'];
    case 'leaves':
      return ['index', 'jobNumber', 'fullName', 'department', 'jobTitle', 'leaveDetails', 'status'];
    case 'qualifications':
      return ['index', 'jobNumber', 'fullName', 'department', 'jobTitle', 'qualification', 'specialization', 'university', 'graduationYear', 'qualificationDetails'];
    case 'outside_cadre':
    case 'transfers':
      return ['index', 'jobNumber', 'fullName', 'department', 'jobTitle', 'transferDetails', 'cadreNumber', 'status'];
    case 'resignations':
    case 'end_of_service':
      return ['index', 'jobNumber', 'fullName', 'department', 'jobTitle', 'jobGrade', 'status', 'notes'];
    case 'disciplinary':
      return ['index', 'jobNumber', 'fullName', 'department', 'jobTitle', 'disciplinaryDetails', 'notes'];
    case 'general_procedures':
      return ['index', 'jobNumber', 'fullName', 'department', 'jobTitle', 'notes'];
    case 'custom':
    default:
      return ['index', 'jobNumber', 'fullName', 'nationalId', 'department', 'jobTitle', 'jobGrade', 'currentIncrement', 'qualification', 'status'];
  }
}

// ----------------------------------------------------
// 4. FILTER EVALUATION LOGIC
// ----------------------------------------------------
export interface ExtendedReportRow {
  employee: Employee;
  extraData?: {
    leaves?: LeaveTransaction[];
    promotions?: PromotionRecord[];
    increments?: IncrementRecord[];
    secondments?: SecondmentRecord[];
    transfers?: TransferRecord[];
    disciplinary?: DisciplinaryRecord[];
    resignations?: ResignationRecord[];
    qualifications?: EmployeeQualificationRecord[];
    generalProcedures?: GeneralProcedure[];
  };
}

/**
 * Match a single filter condition on an employee record
 */
export function matchCondition(
  emp: Employee, 
  cond: FilterCondition,
  extra?: ExtendedReportRow['extraData']
): boolean {
  if (!cond.field || cond.value === undefined || cond.value === '') {
    return true; // Skip empty conditions
  }

  // Handle module-specific join fields
  if (cond.field === 'leaveType' && extra?.leaves) {
    return extra.leaves.some(l => l.leaveType === cond.value);
  }
  if (cond.field === 'leaveDays' && extra?.leaves) {
    const days = extra.leaves.reduce((sum, l) => sum + (l.numberOfDays || 0), 0);
    return compareNumbers(days, cond.operator, cond.value, cond.secondValue);
  }
  if (cond.field === 'promotionType' && extra?.promotions) {
    return extra.promotions.some(p => p.promotionType === cond.value);
  }
  if (cond.field === 'qualRecordType' && extra?.qualifications) {
    return extra.qualifications.some(q => q.recordType === cond.value);
  }
  if (cond.field === 'decisionNumber') {
    const num = String(cond.value).toLowerCase().trim();
    const inProm = extra?.promotions?.some(p => p.decisionNumber?.toLowerCase().includes(num));
    const inInc = extra?.increments?.some(i => i.decisionNumber?.toLowerCase().includes(num));
    const inProc = extra?.generalProcedures?.some(g => g.procedureNumber?.toLowerCase().includes(num));
    return Boolean(inProm || inInc || inProc);
  }

  // Get raw value from employee
  let rawVal = (emp as any)[cond.field];

  // If searching jobGrade, also fallback to financialGrade
  if (cond.field === 'jobGrade' && !rawVal && emp.financialGrade) {
    rawVal = emp.financialGrade;
  }

  // Booleans
  if (cond.fieldType === 'boolean') {
    const boolVal = Boolean(rawVal);
    const targetBool = cond.value === true || cond.value === 'true' || cond.value === 'نعم';
    return boolVal === targetBool;
  }

  // Numbers
  if (cond.fieldType === 'number') {
    const numVal = Number(rawVal) || 0;
    return compareNumbers(numVal, cond.operator, cond.value, cond.secondValue);
  }

  // Dates
  if (cond.fieldType === 'date') {
    return compareDates(rawVal, cond.operator, cond.value, cond.secondValue);
  }

  // Text / Select
  return compareStrings(String(rawVal || ''), cond.operator, String(cond.value || ''));
}

function compareNumbers(actual: number, operator: string, target: any, target2?: any): boolean {
  const numTarget = Number(target) || 0;
  switch (operator) {
    case 'equals':
      return actual === numTarget;
    case 'greater_than':
      return actual > numTarget;
    case 'greater_equal':
      return actual >= numTarget;
    case 'less_than':
      return actual < numTarget;
    case 'less_equal':
      return actual <= numTarget;
    case 'between': {
      const numTarget2 = Number(target2) || 0;
      const min = Math.min(numTarget, numTarget2);
      const max = Math.max(numTarget, numTarget2);
      return actual >= min && actual <= max;
    }
    default:
      return actual === numTarget;
  }
}

function compareStrings(actual: string, operator: string, target: string): boolean {
  const a = actual.trim().toLowerCase();
  const t = target.trim().toLowerCase();

  switch (operator) {
    case 'equals':
      return a === t;
    case 'not_equals':
      return a !== t;
    case 'contains':
      return a.includes(t);
    case 'starts_with':
      return a.startsWith(t);
    case 'ends_with':
      return a.endsWith(t);
    default:
      return a.includes(t);
  }
}

function compareDates(actualDateStr: string | undefined, operator: string, target: any, target2?: any): boolean {
  if (!actualDateStr) return false;
  const actual = actualDateStr.slice(0, 10);
  const now = new Date();
  const currentYear = String(now.getFullYear());
  const prevYear = String(now.getFullYear() - 1);
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  switch (operator) {
    case 'equals':
      return actual === String(target).slice(0, 10);
    case 'before':
      return actual < String(target).slice(0, 10);
    case 'after':
      return actual > String(target).slice(0, 10);
    case 'between': {
      const start = String(target).slice(0, 10);
      const end = String(target2 || target).slice(0, 10);
      return actual >= start && actual <= end;
    }
    case 'in_year':
      return actual.startsWith(String(target).trim());
    case 'in_month':
      return actual.startsWith(String(target).trim());
    case 'current_year':
      return actual.startsWith(currentYear);
    case 'previous_year':
      return actual.startsWith(prevYear);
    case 'last_30_days': {
      const past30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      const today = new Date().toISOString().slice(0, 10);
      return actual >= past30 && actual <= today;
    }
    case 'last_90_days': {
      const past90 = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      const today = new Date().toISOString().slice(0, 10);
      return actual >= past90 && actual <= today;
    }
    default:
      return actual === String(target);
  }
}

/**
 * Filter list of employees based on selection mode, specific IDs, and multi-condition criteria
 */
export function filterEmployeesForReport(
  employees: Employee[],
  selectionMode: EmployeeSelectionMode,
  selectedIds: number[],
  excludedIds: number[],
  conditions: FilterCondition[],
  groupLogic: 'AND' | 'OR' = 'AND',
  moduleData?: {
    leaves?: LeaveTransaction[];
    promotions?: PromotionRecord[];
    increments?: IncrementRecord[];
    secondments?: SecondmentRecord[];
    transfers?: TransferRecord[];
    disciplinary?: DisciplinaryRecord[];
    resignations?: ResignationRecord[];
    qualifications?: EmployeeQualificationRecord[];
    generalProcedures?: GeneralProcedure[];
  }
): ExtendedReportRow[] {
  // Step 1: Base employee set
  let baseSet: Employee[] = [];

  if (selectionMode === 'specific') {
    const idSet = new Set(selectedIds);
    baseSet = employees.filter(e => idSet.has(e.id));
  } else if (selectionMode === 'all_except') {
    const exSet = new Set(excludedIds);
    baseSet = employees.filter(e => !exSet.has(e.id));
  } else {
    baseSet = [...employees];
  }

  // Map with extra data attachments
  const extendedRows: ExtendedReportRow[] = baseSet.map(emp => ({
    employee: emp,
    extraData: {
      leaves: moduleData?.leaves?.filter(l => l.employeeId === emp.id),
      promotions: moduleData?.promotions?.filter(p => p.employeeId === emp.id),
      increments: moduleData?.increments?.filter(i => i.employeeId === emp.id),
      secondments: moduleData?.secondments?.filter(s => s.employeeId === emp.id),
      transfers: moduleData?.transfers?.filter(t => t.employeeId === emp.id),
      disciplinary: moduleData?.disciplinary?.filter(d => d.employeeId === emp.id),
      resignations: moduleData?.resignations?.filter(r => r.employeeId === emp.id),
      qualifications: moduleData?.qualifications?.filter(q => q.employeeId === emp.id),
      generalProcedures: moduleData?.generalProcedures?.filter(g => g.employeeId === emp.id),
    }
  }));

  // Step 2: Apply Conditions if criteria mode or conditions exist
  const activeConditions = conditions.filter(c => c.field && c.value !== undefined && c.value !== '');
  if (activeConditions.length === 0) {
    return extendedRows;
  }

  return extendedRows.filter(row => {
    if (groupLogic === 'OR') {
      // Any condition matches
      return activeConditions.some(cond => matchCondition(row.employee, cond, row.extraData));
    }

    // Default: Check individual condition link operators if present, otherwise AND
    let overallMatch = true;
    for (let i = 0; i < activeConditions.length; i++) {
      const cond = activeConditions[i];
      const match = matchCondition(row.employee, cond, row.extraData);
      
      if (i === 0) {
        overallMatch = match;
      } else {
        const prevCond = activeConditions[i - 1];
        const op = prevCond.logicOperatorWithNext || 'AND';
        if (op === 'OR') {
          overallMatch = overallMatch || match;
        } else {
          overallMatch = overallMatch && match;
        }
      }
    }
    return overallMatch;
  });
}

// ----------------------------------------------------
// 5. SORTING ENGINE
// ----------------------------------------------------
export function sortReportRows(rows: ExtendedReportRow[], sortCriteria: SortCriteria[]): ExtendedReportRow[] {
  if (!sortCriteria || sortCriteria.length === 0) {
    return rows;
  }

  const activeSorts = sortCriteria.filter(s => s.field);
  if (activeSorts.length === 0) return rows;

  return [...rows].sort((a, b) => {
    for (const sort of activeSorts) {
      let valA = (a.employee as any)[sort.field] ?? '';
      let valB = (b.employee as any)[sort.field] ?? '';

      // Number comparison
      if (typeof valA === 'number' && typeof valB === 'number') {
        if (valA !== valB) {
          return sort.direction === 'asc' ? valA - valB : valB - valA;
        }
        continue;
      }

      // String comparison with Arabic locale
      const strA = String(valA);
      const strB = String(valB);
      const cmp = strA.localeCompare(strB, 'ar-LY', { sensitivity: 'base', numeric: true });
      if (cmp !== 0) {
        return sort.direction === 'asc' ? cmp : -cmp;
      }
    }
    return 0;
  });
}

// ----------------------------------------------------
// 6. GROUPING ENGINE
// ----------------------------------------------------
export interface GroupedReportSection {
  groupKey: string;
  groupLabel: string;
  count: number;
  rows: ExtendedReportRow[];
}

export function groupReportRows(rows: ExtendedReportRow[], groupBy: GroupByField): GroupedReportSection[] {
  if (groupBy === 'none' || !groupBy) {
    return [{
      groupKey: 'all',
      groupLabel: 'جميع السجلات',
      count: rows.length,
      rows: rows
    }];
  }

  const groupsMap = new Map<string, ExtendedReportRow[]>();

  rows.forEach(row => {
    let key = String((row.employee as any)[groupBy] || 'غير محدد');
    if (!groupsMap.has(key)) {
      groupsMap.set(key, []);
    }
    groupsMap.get(key)!.push(row);
  });

  const sections: GroupedReportSection[] = [];
  groupsMap.forEach((groupRows, key) => {
    sections.push({
      groupKey: key,
      groupLabel: key,
      count: groupRows.length,
      rows: groupRows
    });
  });

  // Sort sections alphabetically
  return sections.sort((a, b) => a.groupLabel.localeCompare(b.groupLabel, 'ar-LY'));
}

// ----------------------------------------------------
// 7. COLUMN VALUE FORMATTER
// ----------------------------------------------------
export function formatColumnValue(colId: string, row: ExtendedReportRow, index: number): string {
  const emp = row.employee;
  const extra = row.extraData;

  switch (colId) {
    case 'index':
      return String(index + 1);
    case 'jobNumber':
      return emp.jobNumber || String(emp.id);
    case 'fullName':
      return emp.fullName || '—';
    case 'nationalId':
      return emp.nationalId || '—';
    case 'gender':
      return emp.gender || '—';
    case 'motherName':
      return emp.motherName || '—';
    case 'birthDate':
      return formatDateDisplay(emp.birthDate) || '—';
    case 'birthPlace':
      return emp.birthPlace || '—';
    case 'maritalStatus':
      return emp.maritalStatus || '—';
    case 'phone':
      return emp.phone || '—';
    case 'department':
      return emp.department || '—';
    case 'jobTitle':
      return emp.jobTitle || '—';
    case 'assignmentCategory':
      return emp.assignmentCategory || '—';
    case 'status':
      return emp.status || '—';
    case 'hiringEntity':
      return emp.hiringEntity || '—';
    case 'cadreNumber':
      return emp.cadreNumber || '—';
    case 'jobGrade':
      return emp.jobGrade || emp.financialGrade || '—';
    case 'currentIncrement':
      return emp.currentIncrement !== undefined ? String(emp.currentIncrement) : '0';
    case 'gradeEntryDate':
      return formatDateDisplay(emp.gradeEntryDate) || '—';
    case 'appointmentSalarySystem':
      return emp.appointmentSalarySystem || 'جدول مرتبات القانون 15';
    case 'appointmentGrade':
      return emp.appointmentGrade || '—';
    case 'appointmentIncrements':
      return emp.appointmentIncrements !== undefined ? String(emp.appointmentIncrements) : '0';
    case 'hireDate':
      return formatDateDisplay(emp.hireDate) || '—';
    case 'directingDate':
      return formatDateDisplay(emp.directingDate) || '—';
    case 'bloodBankStartDate':
      return formatDateDisplay(emp.bloodBankStartDate) || '—';
    case 'lastIncrementDate':
      return formatDateDisplay(emp.lastIncrementDate) || '—';
    case 'qualification':
      return emp.qualification || '—';
    case 'specialization':
      return emp.specialization || '—';
    case 'university':
      return emp.university || '—';
    case 'graduationYear':
      return emp.graduationYear || '—';
    case 'educationType':
      return emp.educationType || '—';
    case 'leaveDetails': {
      if (extra?.leaves && extra.leaves.length > 0) {
        const lastLeave = extra.leaves[0];
        return `${lastLeave.leaveType} (${lastLeave.numberOfDays} يوم) - من ${formatDateDisplay(lastLeave.startDate)}`;
      }
      return 'لا توجد إجازات';
    }
    case 'promotionDetails': {
      if (extra?.promotions && extra.promotions.length > 0) {
        const lastP = extra.promotions[0];
        return `${lastP.promotionType}: ${lastP.previousGrade || ''} ← ${lastP.newGrade || ''} (قرار: ${lastP.decisionNumber || '—'})`;
      }
      return 'لا توجد ترقيات';
    }
    case 'transferDetails': {
      if (extra?.transfers && extra.transfers.length > 0) {
        const lastT = extra.transfers[0];
        return `${lastT.transferType}: ${lastT.previousDepartment} ← ${lastT.newDepartment}`;
      }
      if (emp.transferredTo) {
        return `منقول لـ: ${emp.transferredTo}`;
      }
      return '—';
    }
    case 'disciplinaryDetails': {
      if (extra?.disciplinary && extra.disciplinary.length > 0) {
        const d = extra.disciplinary[0];
        return `${d.recordType} (قرار: ${d.decisionNumber || '—'}) - ${d.reason || ''}`;
      }
      return 'سجل نظيف';
    }
    case 'qualificationDetails': {
      if (extra?.qualifications && extra.qualifications.length > 0) {
        return extra.qualifications.map(q => `${q.recordType}: ${q.title} (${q.specialization || q.issuingAuthority || ''})`).join(' | ');
      }
      return '—';
    }
    case 'notes':
      return emp.notes || '—';
    default:
      return String((emp as any)[colId] || '—');
  }
}

// ----------------------------------------------------
// 8. EXPORT TO EXCEL (.XLSX)
// ----------------------------------------------------
export function exportReportToExcel(
  rows: ExtendedReportRow[],
  selectedColumns: ReportColumnConfig[],
  reportTitle: string
) {
  const activeCols = selectedColumns.filter(c => c.selected);

  const excelData = rows.map((row, idx) => {
    const item: Record<string, string> = {};
    activeCols.forEach(col => {
      item[col.label] = formatColumnValue(col.id, row, idx);
    });
    return item;
  });

  const worksheet = XLSX.utils.json_to_sheet(excelData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'التقرير الرسمي');

  // Set RTL on sheet
  if (!worksheet['!views']) worksheet['!views'] = [];
  worksheet['!views'].push({ RTL: true });

  const safeTitle = reportTitle.replace(/[/\\?%*:|"<>]/g, '_').slice(0, 40);
  const fileName = `${safeTitle}_${Date.now()}.xlsx`;
  XLSX.writeFile(workbook, fileName);
}

// ----------------------------------------------------
// 9. EXPORT TO WORD (.DOC)
// ----------------------------------------------------
export function exportReportToWord(
  rows: ExtendedReportRow[],
  selectedColumns: ReportColumnConfig[],
  reportTitle: string,
  criteriaSummaryText?: string
) {
  const activeCols = selectedColumns.filter(c => c.selected);
  const dateStr = formatDateDisplay(new Date().toISOString().slice(0, 10));

  let tableHeaderHtml = activeCols.map(c => 
    `<th style="border: 1px solid #991b1b; padding: 8px; background-color: #7f1d1d; color: #ffffff; text-align: ${c.align || 'center'}; font-size: 11px;">${c.label}</th>`
  ).join('');

  let tableRowsHtml = rows.map((row, idx) => {
    const cells = activeCols.map(c => 
      `<td style="border: 1px solid #cbd5e1; padding: 6px; text-align: ${c.align || 'center'}; font-size: 11px; background-color: ${idx % 2 === 0 ? '#ffffff' : '#f8fafc'};">${formatColumnValue(c.id, row, idx)}</td>`
    ).join('');
    return `<tr>${cells}</tr>`;
  }).join('');

  const wordHtml = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset='utf-8'>
      <title>${reportTitle}</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; direction: rtl; text-align: right; margin: 20px; }
        .header-box { text-align: center; border-bottom: 2px solid #7f1d1d; padding-bottom: 12px; margin-bottom: 15px; }
        .org-title { font-size: 18px; font-weight: bold; color: #7f1d1d; margin: 0; }
        .sub-title { font-size: 13px; color: #334155; margin: 2px 0; }
        .report-title-box { background-color: #fef2f2; border: 1px solid #fecaca; padding: 10px; text-align: center; border-radius: 6px; margin: 15px 0; }
        .report-title { font-size: 16px; font-weight: bold; color: #991b1b; margin: 0; }
        .meta-info { font-size: 11px; color: #64748b; margin-top: 5px; }
        table { width: 100%; border-collapse: collapse; margin-top: 15px; font-family: inherit; }
        .footer-sig { margin-top: 40px; width: 100%; }
      </style>
    </head>
    <body>
      <div class="header-box">
        <p class="sub-title">دولة ليبيا - وزارة الصحة</p>
        <h1 class="org-title">مصرف الدم المركزي بلدية المرج</h1>
        <p class="sub-title">قسم الشؤون الوظيفية والموارد البشرية</p>
      </div>

      <div class="report-title-box">
        <h2 class="report-title">${reportTitle}</h2>
        <div class="meta-info">
          <span>التاريخ: ${dateStr}</span> | 
          <span>عدد السجلات: ${rows.length}</span>
          ${criteriaSummaryText ? `<br><span>المعايير: ${criteriaSummaryText}</span>` : ''}
        </div>
      </div>

      <table>
        <thead>
          <tr>${tableHeaderHtml}</tr>
        </thead>
        <tbody>
          ${tableRowsHtml}
        </tbody>
      </table>

      <table class="footer-sig">
        <tr>
          <td style="text-align: center; font-weight: bold; font-size: 12px; width: 50%;">
            رئيس قسم الموارد البشرية<br><br><br>......................................
          </td>
          <td style="text-align: center; font-weight: bold; font-size: 12px; width: 50%;">
            مدير عام مصرف الدم المركزي المرج<br><br><br>......................................
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  const blob = new Blob(['\ufeff', wordHtml], { type: 'application/msword;charset=utf-8' });
  const safeTitle = reportTitle.replace(/[/\\?%*:|"<>]/g, '_').slice(0, 40);
  const fileName = `${safeTitle}_${Date.now()}.doc`;
  
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// ----------------------------------------------------
// 10. SAVED TEMPLATES STORAGE (LOCALSTORAGE)
// ----------------------------------------------------
const SAVED_TEMPLATES_KEY = 'blood_bank_saved_report_templates';

export function loadSavedReportTemplates(): SavedReportTemplate[] {
  if (typeof window === 'undefined' || !window.localStorage) return [];
  try {
    const raw = window.localStorage.getItem(SAVED_TEMPLATES_KEY);
    if (!raw) return getDefaultBuiltinTemplates();
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : getDefaultBuiltinTemplates();
  } catch (err) {
    console.error('Failed to load saved report templates:', err);
    return getDefaultBuiltinTemplates();
  }
}

export function saveReportTemplate(template: Omit<SavedReportTemplate, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): SavedReportTemplate {
  const current = loadSavedReportTemplates();
  const now = new Date().toISOString();
  const id = template.id || `template_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  const newRecord: SavedReportTemplate = {
    ...template,
    id,
    createdAt: template.id ? (current.find(t => t.id === template.id)?.createdAt || now) : now,
    updatedAt: now
  };

  const index = current.findIndex(t => t.id === id);
  let updatedList: SavedReportTemplate[];
  if (index >= 0) {
    updatedList = current.map(t => t.id === id ? newRecord : t);
  } else {
    updatedList = [newRecord, ...current];
  }

  if (typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.setItem(SAVED_TEMPLATES_KEY, JSON.stringify(updatedList));
  }
  return newRecord;
}

export function deleteReportTemplate(id: string): SavedReportTemplate[] {
  const current = loadSavedReportTemplates();
  const filtered = current.filter(t => t.id !== id);
  if (typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.setItem(SAVED_TEMPLATES_KEY, JSON.stringify(filtered));
  }
  return filtered;
}

export function duplicateReportTemplate(id: string): SavedReportTemplate | null {
  const current = loadSavedReportTemplates();
  const item = current.find(t => t.id === id);
  if (!item) return null;

  const duplicated: SavedReportTemplate = {
    ...item,
    id: `template_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    name: `نسخة من ${item.name}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const updatedList = [duplicated, ...current];
  if (typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.setItem(SAVED_TEMPLATES_KEY, JSON.stringify(updatedList));
  }
  return duplicated;
}

function getDefaultBuiltinTemplates(): SavedReportTemplate[] {
  return [
    {
      id: 'builtin_promo_eligible',
      name: 'الموظفون المستحقون للترقية (4 علاوات فأكثر)',
      description: 'كشف بالموظفين على رأس العمل الذين لديهم 4 علاوات أو أكثر ومستحقون للنظر في ترقيتهم',
      reportType: 'promotion_eligibility',
      employeeSelectionMode: 'criteria',
      selectedEmployeeIds: [],
      excludedEmployeeIds: [],
      filterConditions: [
        { id: 'c1', field: 'status', fieldType: 'select', operator: 'equals', value: 'على رأس العمل', logicOperatorWithNext: 'AND' },
        { id: 'c2', field: 'currentIncrement', fieldType: 'number', operator: 'greater_equal', value: 4 }
      ],
      groupLogic: 'AND',
      selectedColumnIds: ['index', 'jobNumber', 'fullName', 'department', 'jobTitle', 'jobGrade', 'currentIncrement', 'gradeEntryDate', 'lastIncrementDate', 'status'],
      sortCriteria: [{ field: 'department', direction: 'asc' }, { field: 'fullName', direction: 'asc' }],
      groupBy: 'department',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z'
    },
    {
      id: 'builtin_active_employees',
      name: 'الموظفون على رأس العمل حسب الأقسام',
      description: 'كشف شامل بالموظفين الفعليين النشطين بمصرف الدم مقسمين حسب الأقسام والإدارات',
      reportType: 'employees',
      employeeSelectionMode: 'criteria',
      selectedEmployeeIds: [],
      excludedEmployeeIds: [],
      filterConditions: [
        { id: 'c1', field: 'status', fieldType: 'select', operator: 'equals', value: 'على رأس العمل' }
      ],
      groupLogic: 'AND',
      selectedColumnIds: ['index', 'jobNumber', 'fullName', 'nationalId', 'department', 'jobTitle', 'jobGrade', 'currentIncrement', 'qualification', 'status'],
      sortCriteria: [{ field: 'department', direction: 'asc' }, { field: 'fullName', direction: 'asc' }],
      groupBy: 'department',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z'
    }
  ];
}
