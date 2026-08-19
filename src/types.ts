export type EmploymentStatus = 
  | 'على رأس العمل' 
  | 'إجازة' 
  | 'منقول' 
  | 'منتدب' 
  | 'متقاعد' 
  | 'موقوف' 
  | 'مستقيل' 
  | 'منهي خدماته' 
  | 'متوفى';

export type Gender = 'ذكر' | 'أنثى';

export type AssignmentCategory = 'إداري' | 'طبي';

export interface Employee {
  id: number;                      // System ID (الرقم الداخلي بالنظام - خط صغير ثانوني)
  jobNumber: string;               // الرقم الوظيفي / رقم الملف (بارز ورئيسي)
  nationalId: string;              // الرقم الوطني
  fullName: string;                // اسم الموظف
  motherName: string;              // اسم الأم
  birthDate: string;               // تاريخ الميلاد
  birthPlace: string;              // مكان الميلاد
  gender: Gender;                  // الجنس
  maritalStatus: string;           // الحالة الاجتماعية
  status: EmploymentStatus;        // الوضع الوظيفي
  hireDate: string;                // تاريخ التعيين (الاصلي)
  directingDate: string;           // تاريخ المباشرة
  bloodBankStartDate: string;      // تاريخ المباشرة في مصرف الدم (لحساب خدمة الإجازات)
  appointmentGrade: string;        // الدرجة المعين عليها
  salaryScale: string;             // جدول المرتبات
  jobGrade: string;                // اسم الدرجة الحالية
  currentIncrement: number;        // عدد العلاوات
  gradeEntryDate: string;          // تاريخ الدرجة الحالية
  transactionType: string;         // نوع العملية
  eligibilityDate: string;         // تاريخ الاستحقاق
  qualification: string;           // المؤهل
  specialization: string;          // التخصص
  cadreNumber: string;             // رقم الملاك / ملاك الموظف
  hiringEntity: string;            // جهة التعيين (حقل نصي حر مفتوح)
  assignmentCategory: AssignmentCategory; // إداري / طبي
  department: string;              // القسم / الإدارة / المكتب
  jobTitle: string;                // الوظيفة
  phone: string;                   // رقم الهاتف
  email: string;                   // البريد الإلكتروني
  pdfPath: string;                 // مسار ملف PDF
  pdfFileName?: string;            // اسم الملف
  notes: string;                   // ملاحظات
  createdAt?: string;
  updatedAt?: string;

  // Legacy/optional fields for migration archiving
  financialGrade?: string;
  currentJobPosition?: string;
  unit?: string;
}

// ----------------------------------------------------
// ORGANIZATIONAL STRUCTURE INTERFACES
// ----------------------------------------------------

export interface OrganizationalUnit {
  id: string;
  unitName: string;
  level: 'إدارة' | 'مكتب' | 'قسم' | 'وحدة';
  category: AssignmentCategory | 'مشترك';
  parentUnitId?: string;
  active: boolean;
  sortOrder: number;
}

export interface JobTitle {
  id: string;
  departmentId: string;
  jobTitle: string;
  category: AssignmentCategory;
  active: boolean;
  sortOrder: number;
}

// ----------------------------------------------------
// TRANSACTION & HR MODULE INTERFACES
// ----------------------------------------------------

export interface LeaveModification {
  id: string;
  leaveId: string;
  modificationType: 'تمديد' | 'تقليص' | 'قطع إجازة' | 'تعديل / تصحيح';
  originalStartDate: string;
  originalNumberOfDays: number;
  originalEndDate: string;
  originalReturnDate: string;
  newNumberOfDays: number;
  newEndDate: string;
  newReturnDate: string;
  reason: string;
  modifiedBy: string;
  modifiedAt: string;
  notes?: string;
}

export interface LeaveTransaction {
  id: string;
  employeeId: number;
  leaveType: 'إجازة سنوية' | 'إجازة الوضع والأمومة' | 'إجازة مرضية' | 'إجازة طارئة' | 'إجازة بدون مرتب' | 'إجازة حج' | 'أخرى';
  startDate: string;
  endDate: string;
  returnDate?: string;
  numberOfDays: number;
  leaveYear: number;
  approvalNumber?: string;
  approvalDate?: string;
  status: 'مقبولة' | 'قيد المراجعة' | 'مرفوضة' | 'ملغاة';
  deductsFromAnnualLeave: boolean; // هل تخصم من رصيد الإجازات السنوية؟
  calculationMethod?: 'تلقائي' | 'يدوي';
  manualReason?: string;
  reviewStatus?: 'تمت المراجعة والتدقيق' | 'قيد المراجعة' | 'غير مراجع';
  reviewerName?: string;
  reviewNotes?: string;
  balanceBefore?: number;
  balanceAfter?: number;
  modifications?: LeaveModification[];
  notes: string;
  createdBy: string;
  createdAt: string;
}

export interface PromotionRecord {
  id: string;
  employeeId: number;
  fileNumber: string;
  previousGrade: string;
  previousGradeName?: string;
  previousIncrement: number;
  newGrade: string;
  newGradeName?: string;
  newIncrement: number;
  promotionType: 'ترقية عادية' | 'ترقية استثنائية' | 'تسوية وضع' | 'ندب / تكليف' | 'أخرى';
  decisionNumber: string;
  decisionDate: string;
  effectiveDate: string;
  eligibilityDate?: string;
  reason: string;
  notes: string;
  createdBy: string;
  createdAt: string;
}

export interface IncrementRecord {
  id: string;
  employeeId: number;
  previousGrade: string;
  previousIncrement: number;
  newIncrement: number;
  effectiveDate: string;
  incrementType: 'تلقائية' | 'يدوية' | 'استثنائية';
  decisionNumber: string;
  notes: string;
  createdBy: string;
  createdAt: string;
}

export interface SecondmentRecord {
  id: string;
  employeeId: number;
  originalDepartment: string;
  assignedEntity: string;
  startDate: string;
  endDate: string;
  decisionNumber: string;
  decisionDate: string;
  reason: string;
  status: 'نشط' | 'منتهي' | 'ملغى';
  notes: string;
  createdBy: string;
  createdAt: string;
}

export interface StatusSettlementRecord {
  id: string;
  employeeId: number;
  grade: string;
  jobTitle: string;
  qualification: string;
  specialization: string;
  financialStatus: string;
  effectiveDate: string;
  decisionNumber: string;
  reason: string;
  notes: string;
  createdBy: string;
  createdAt: string;
}

export interface DisciplinaryRecord {
  id: string;
  employeeId: number;
  recordType: 'تنبيه' | 'إنذار كتابي' | 'خصم من المرتب' | 'عقوبة إدارية' | 'أخرى';
  decisionNumber: string;
  decisionDate: string;
  effectiveDate: string;
  numberOfDays?: number;
  deductionAmount?: number;
  reason: string;
  description: string;
  notes: string;
  createdBy: string;
  createdAt: string;
}

export interface TransferRecord {
  id: string;
  employeeId: number;
  previousDepartment: string;
  newDepartment: string;
  transferType: 'نقل داخلي' | 'نقل خارجي' | 'نقل لجهة أخرى' | 'نقل لمصرف الدم' | 'أخرى';
  decisionNumber: string;
  decisionDate: string;
  effectiveDate: string;
  reason: string;
  notes: string;
  createdBy: string;
  createdAt: string;
}

export interface ResignationRecord {
  id: string;
  employeeId: number;
  resignationDate: string;
  lastWorkingDate: string;
  decisionNumber: string;
  decisionDate: string;
  reason: string;
  finalStatus: 'مستقيل' | 'متقاعد' | 'منهي خدماته' | 'متوفى' | 'أخرى';
  notes: string;
  createdBy: string;
  createdAt: string;
}

export interface GeneralProcedure {
  id: string;
  employeeId: number;
  fileNumber: string;
  procedureType: string; // 'إجراء إداري' | 'قرار إداري' | 'تكليف' | 'مذكرة داخلية' | 'إخطار موارد بشرية' | 'تحديث مستندات' | 'تحديث حالة' | 'أخرى'
  procedureNumber: string;
  procedureDate: string;
  effectiveDate: string;
  description: string;
  reason: string;
  decisionAuthority: string;
  notes: string;
  pdfPath?: string;
  pdfFileName?: string;
  createdBy: string;
  createdAt: string;
  updatedAt?: string;
}

export interface HrRule {
  id: string;
  ruleName: string;
  key: string;
  value: number | string;
  unit: string;
  description: string;
  category: 'إجازات' | 'ترقيات' | 'علاوات' | 'لوائح عامة';
  effectiveDate: string;
  isActive: boolean;
}

export interface UserAccount {
  id: string;
  username: string;
  displayName: string;
  role: 'Administrator 1' | 'Administrator 2';
  lastLogin?: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  action: 'إضافة' | 'تعديل' | 'حذف' | 'تسجيل دخول' | 'نسخة احتياطية' | 'استعادة' | 'عرض PDF' | 'تصدير تقرير' | 'إجراء وظيفي';
  details: string;
  targetId?: string | number;
}

export interface PublicHoliday {
  id: string;
  name: string;
  date: string; // YYYY-MM-DD
  active: boolean;
  notes?: string;
}

export interface SystemSettings {
  bankName: string;
  subTitle: string;
  branch: string;
  backupFolderPath: string;
  pdfFolderPath: string;
  maxRecordsPerPage: number;
  autoLog: boolean;
  themeColor: string;
  isSheetProtected: boolean;
  annualIncrementMethod?: 'Anniversary Date' | 'January 1st';
  publicHolidays?: string[];
  publicHolidaysList?: PublicHoliday[];
  officialLogoUrl?: string;
}

export type ActiveTab = 
  | 'dashboard' 
  | 'employees' 
  | 'search' 
  | 'leaves' 
  | 'promotions' 
  | 'general_procedures'
  | 'secondments' 
  | 'transfers' 
  | 'disciplinary' 
  | 'resignations' 
  | 'history' 
  | 'hr_rules' 
  | 'reports' 
  | 'statistics' 
  | 'settings' 
  | 'backup' 
  | 'users' 
  | 'logs' 
  | 'vba_code'
  | 'org_structure';
