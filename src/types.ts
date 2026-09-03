export type EmploymentStatus = 
  | 'على رأس العمل' 
  | 'إجازة' 
  | 'منقول' 
  | 'منقول خارجياً'
  | 'منتدب' 
  | 'متقاعد' 
  | 'موقوف' 
  | 'مستقيل' 
  | 'منهي خدماته' 
  | 'متوفى';

export type Gender = 'ذكر' | 'أنثى';

export type AssignmentCategory = 'إداري' | 'طبي';

export type AppointmentSalarySystem = 'جدول مرتبات القانون 15' | 'اللائحة 418 – العناصر الطبية';

export interface AppointmentGradeConfig {
  id: string;
  salarySystem: AppointmentSalarySystem;
  gradeName: string;
  maxIncrements: number;
  availableIncrements?: number[];
  sortOrder: number;
  active: boolean;
  notes?: string;
}

export type IncrementType = 
  | 'علاوة سنوية تلقائية'
  | 'علاوة ترقية'
  | 'ترقية استثنائية'
  | 'تسوية وضع'
  | 'علاوة يدوية'
  | 'علاوة تعيين'
  | 'تعديل إداري آخر'
  | 'تلقائية'
  | 'يدوية'
  | 'استثنائية';

export interface LastGradeAffectingAction {
  actionType: 'تعيين' | 'ترقية' | 'ترقية استثنائية' | 'تسوية وضع' | 'تعديل إداري';
  actionDate: string;
  resultingGrade: string;
  incrementCountGranted: number;
  decisionNumber: string;
  decisionDate: string;
  notes?: string;
}

export interface IncrementBreakdownItem {
  type: IncrementType;
  label: string;
  count: number;
  source: string;
  badgeColor: string;
}

export interface IncrementBreakdown {
  totalIncrements: number;
  annualAutoIncrements: number;
  promotionIncrements: number;
  settlementIncrements: number;
  exceptionalPromotionIncrements: number;
  manualIncrements: number;
  appointmentIncrements: number;
  otherAdjustmentIncrements: number;
  lastPromotionDate?: string;
  lastSettlementDate?: string;
  lastExceptionalPromoDate?: string;
  lastAnnualAutoDate?: string;
  lastGradeAffectingAction?: LastGradeAffectingAction;
  breakdownSummaryText: string;
  breakdownItems: IncrementBreakdownItem[];
}

export type DocumentType = 'الرقم الوطني' | 'رقم جواز السفر';

export type EmployeeReviewStatus = 'لم تتم المراجعة' | 'تمت المراجعة' | 'تحتاج إلى تصحيح';

export interface Employee {
  id: number;                      // System ID (الرقم الداخلي بالنظام - خط صغير ثانوني)
  jobNumber: string;               // الرقم الوظيفي / رقم الملف (بارز ورئيسي)
  nationality: string;             // الجنسية (إجباري: ليبي، مصري، تونسي...)
  documentType: DocumentType;      // نوع الوثيقة: 'الرقم الوطني' | 'رقم جواز السفر'
  nationalId: string;              // الرقم الوطني (إجباري للمواطن الليبي 12 خانة رقمية)
  passportNumber?: string;         // رقم جواز السفر (إجباري للموظف غير الليبي)
  needsNationalityReview?: boolean;// وسم مراجعة الجنسية للسجلات القديمة
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
  appointmentSalarySystem?: AppointmentSalarySystem | string; // نظام الدرجة المعين عليها
  appointmentGrade: string;        // الدرجة المعين عليها
  appointmentIncrements?: number;  // عدد العلاوات عند التعيين
  needsAppointmentSystemReview?: boolean; // يحتاج إلى تحديد نظام الدرجة المعين عليها
  salaryScale: string;             // جدول المرتبات
  jobGrade: string;                // اسم الدرجة الحالية
  currentIncrement: number;        // عدد العلاوات
  gradeEntryDate: string;          // تاريخ الدرجة الحالية
  transactionType: string;         // نوع العملية
  eligibilityDate: string;         // تاريخ الاستحقاق
  qualification: string;           // الدرجة العلمية (المؤهل العلمي)
  specialization: string;          // التخصص الدقيق (حقل يدوي)
  university?: string;             // اسم الجامعة (حقل يدوي: جامعة بنغازي، إلخ)
  graduationYear?: string;         // سنة التخرج (4 خانات رقمية: 2021)
  educationType?: string;          // نوع التعليم: جامعة عامة / جامعة خاصة / غير منطبق
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

  // Review Status & History
  reviewStatus?: EmployeeReviewStatus; // 'لم تتم المراجعة' | 'تمت المراجعة' | 'تحتاج إلى تصحيح'
  reviewDate?: string;                 // تاريخ المراجعة
  reviewedBy?: string;                 // اسم المستخدم الذي قام بالمراجعة
  reviewNotes?: string;                // ملاحظات المراجعة

  // External Transfer & Cadre Archiving
  transferredTo?: string;          // الجهة المنقول إليها في حالة النقل الخارجي
  isOutsideCadre?: boolean;        // خارج الملاك الوظيفي

  // Last Grade Affecting Action & Increment Details
  lastGradeAffectingAction?: LastGradeAffectingAction;
  lastIncrementDate?: string;
  nextIncrementDate?: string;

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

export type CareerActionType = 
  | 'ترقية' 
  | 'علاوة دورية' 
  | 'تسوية وضع' 
  | 'ترقية استثنائية' 
  | 'ندب على درجة' 
  | 'تحويل من اللائحة 418 إلى نظام الدرجات العامة'
  | 'تعيين';

export type HistoricalCareerClassification = 
  | 'REGULATION_418_HISTORICAL'
  | 'GENERAL_GRADE_TRANSITION'
  | 'PROMOTION'
  | 'ANNUAL_INCREMENT'
  | 'STATUS_SETTLEMENT'
  | 'STANDARD_CAREER_ACTION';

export interface CareerPromotionRecord {
  id: string;
  employeeId: number;
  fileNumber: string;
  employeeName: string;
  nationalId?: string;
  actionType: CareerActionType;
  previousGrade: string;
  previousIncrement: number;
  newGrade: string;
  newIncrement: number;
  historicalJobTitle?: string;
  historicalGrade?: string;
  historicalClassification?: HistoricalCareerClassification;
  isImmutable?: boolean;
  sourceFile?: string;
  sourceRow?: number;
  actionDate: string; // YYYY-MM-DD
  decisionDate: string;
  decisionNumber: string;
  issuingAuthority: string; // الجهة التي أصدرت القرار
  notes: string;
  createdBy: string;
  createdAt: string;
  updatedBy?: string;
  updatedAt?: string;
}

export interface UnlinkedHistoricalCareerRecord {
  id: string;
  sourceFile: string;
  sourceRow: number;
  rawJobNumber?: string;
  rawEmployeeName?: string;
  rawNationalId?: string;
  rawActionType?: string;
  rawGradeOrTitle?: string;
  rawEffectiveDate?: string;
  rawDecisionNumber?: string;
  rawDecisionDate?: string;
  rawNotes?: string;
  rejectionReason: string;
  detectedClassification?: HistoricalCareerClassification;
  capturedAt: string;
}

export interface HistoricalMatchedEmployeeSummary {
  employeeId: number;
  jobNumber: string;
  fullName: string;
  nationalId: string;
  earliestHistoricalRecordDate?: string;
  earliestHistoricalTitle?: string;
  latestHistoricalRecordDate?: string;
  latestHistoricalTitle?: string;
  currentGradeBefore: string;
  currentGradeAfter: string;
  currentIncrementBefore: number;
  currentIncrementAfter: number;
  currentGradeDateBefore: string;
  currentGradeDateAfter: string;
  recordsToAddCount: number;
  hasHistorical418: boolean;
  has2023Transition: boolean;
  isGradeChanged: boolean;
  isGradeDateChanged: boolean;
  anomalyWarning?: string;
  expectedResult: 'متطابق_سليم' | 'تحديث_مقبول' | 'تغيير_غير_متوقع_محظور' | 'يحتاج_مراجعة';
  historicalItems: CareerPromotionRecord[];
}

export interface HistoricalDryRunReport {
  timestamp: string;
  sourceFileName: string;
  totalExcelRows: number;
  validHistoricalRecordsCount: number;
  successfullyMatchedRecordsCount: number;
  unmatchedRecordsCount: number;
  duplicateRecordsCount: number;
  invalidRecordsCount: number;
  employeesReceivingHistoryCount: number;
  employeesWithNoHistoryCount: number;
  regulation418RecordsCount: number;
  transition2023RecordsCount: number;
  recordsRequiringManualReviewCount: number;
  unexpectedGradeChangesCount: number;
  matchedEmployeesSummary: HistoricalMatchedEmployeeSummary[];
  unlinkedRecords: UnlinkedHistoricalCareerRecord[];
  duplicateRecords: { rowNumber: number; reason: string; item: any }[];
  canCommitSafely: boolean;
  blockReason?: string;
}

export type EducationalDegree = 
  | 'دورة تدريبية'
  | 'ثانوية عامة'
  | 'دبلوم متوسط'
  | 'دبلوم عالي'
  | 'بكالوريوس'
  | 'ليسانس'
  | 'ماجستير'
  | 'دكتوراه';

export type QualificationRecordType = 
  | 'مؤهل علمي' 
  | 'دورة تدريبية' 
  | 'شهادة مهنية' 
  | 'برنامج تدريبي' 
  | 'أخرى';

export interface EmployeeQualificationRecord {
  id: string;
  employeeId: number;
  employeeName?: string;
  fileNumber?: string;
  recordType: QualificationRecordType; // نوع السجل
  title: string;                       // اسم المؤهل / الدورة *
  specialization?: string;             // التخصص
  issuingAuthority?: string;           // الجهة المانحة / المؤسسة
  executor?: string;                   // الجهة المنفذة (للدورات التدريبية)
  universityOrInstitute?: string;      // اسم الجامعة / المعهد
  educationType?: string;              // نوع التعليم ('جامعة عامة' | 'جامعة خاصة' | 'غير منطبق' | 'أخرى')
  graduationYear?: string;             // سنة الحصول عليه / سنة التخرج / سنة الدورة (4 خانات)
  completionDate?: string;             // تاريخ الحصول عليه / تاريخ الدورة
  duration?: string;                   // مدة الدورة (مثال: أسبوعان، 40 ساعة)
  certificateNumber?: string;          // رقم الشهادة / المستند
  notes?: string;                      // ملاحظات
  documentPath?: string;               // مسار الملف المرفق (PDF أو صورة)
  documentFileName?: string;           // اسم الملف المرفق
  createdBy?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CareerSummary {
  promotionsCount: number;             // عدد الترقيات (ترقية فقط - لا تشمل تحويل اللائحة 418)
  annualIncrementsCount: number;       // عدد العلاوات الدورية
  exceptionalPromotionsCount: number;  // عدد الترقيات الاستثنائية
  statusSettlementsCount: number;      // عدد تسويات الوضع
  secondmentToGradeCount: number;      // عدد مرات الندب على درجة
  transition418Count?: number;         // عدد حركات التحويل من اللائحة 418 إلى نظام الدرجات العامة
  lastPromotionDate?: string;          // آخر ترقية
  lastAnnualIncrementDate?: string;    // آخر علاوة دورية
  currentGrade: string;                // الدرجة الحالية
  currentIncrement: number;            // عدد العلاوات الحالية
  lastAction?: {
    actionType: CareerActionType;
    actionDate: string;
    previousGrade: string;
    newGrade: string;
    newIncrement: number;
    decisionNumber: string;
  };
}

// ----------------------------------------------------
// PROMOTION ENGINE & LIBYAN LABOR LAW COMPLIANCE
// ----------------------------------------------------

export type CompetencyReportRating = 
  | 'ممتاز' 
  | 'جيد جداً' 
  | 'جيد' 
  | 'مقبول' 
  | 'ضعيف' 
  | 'غير متوفر' 
  | 'غير مسجل';

export type PromotionEligibilityStatus = 
  | 'NOT_ELIGIBLE' 
  | 'ELIGIBLE_FOR_CONSIDERATION' 
  | 'RECOMMENDED' 
  | 'OFFICIALLY_PROMOTED' 
  | 'NEEDS_REVIEW';

export type PromotionEligibilityStatusArabic = 
  | 'غير مستحق حالياً' 
  | 'مستوفٍ للحد الأدنى للترشح' 
  | 'مستحق للعرض/المفاضلة' 
  | 'تمت الترقية بقرار رسمي' 
  | 'يحتاج إلى مراجعة';

export interface PromotionRule {
  id: string;
  ruleName: string;
  fromGrade: string;
  toGrade: string;
  fromGradeNum?: number;
  toGradeNum?: number;
  requiredIncrements: number; // Required Qualifying Increments / Period
  competencyRequirement?: string;
  effectiveFrom: string; // YYYY-MM-DD
  effectiveTo?: string;
  legalReference: string; // e.g. "قانون علاقات العمل رقم 12 لسنة 2010 ولائحته التنفيذية"
  decisionNumber?: string;
  notes?: string;
  active: boolean;
}

export interface PromotionEligibilityResult {
  employeeId: number;
  jobNumber: string;
  fullName: string;
  department: string;
  assignmentCategory: AssignmentCategory;
  currentGrade: string;
  currentGradeDate: string;
  currentGradeDateDisplay: string;
  qualifyingIncrements: number;
  requiredIncrements: number;
  status: PromotionEligibilityStatus;
  statusArabic: PromotionEligibilityStatusArabic;
  nextGrade: string;
  competencyRating: CompetencyReportRating;
  competencyWarning?: string;
  lastPromotionDate?: string;
  lastPromotionDecision?: string;
  decisionStatus: 'لا يوجد قرار رسمي' | 'تمت الترقية بقرار رسمي' | 'بانتظار العرض والمفاضلة';
  officialDecisionNumber?: string;
  officialDecisionDate?: string;
  issuingAuthority?: string;
  hasOfficialDecision: boolean;
  isBelowGrade10: boolean;
  isTransition10to11: boolean;
  isAboveGrade11: boolean;
  gradeJumpWarning?: string;
  legalComplianceNotice: string;
  legalReference: string;
  applicableRuleName: string;
  notes: string;
  auditTrail: string[];
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
  issuingAuthority?: string;
  competencyRating?: CompetencyReportRating;
  qualification?: string;
  jobTitle?: string;
  reason: string;
  notes: string;
  pdfPath?: string;
  pdfFileName?: string;
  status?: 'OFFICIALLY_PROMOTED' | 'مسجل';
  createdBy: string;
  createdAt: string;
}

export interface IncrementRecord {
  id: string;
  employeeId: number;
  fileNumber?: string;
  date?: string;
  incrementAmount?: number;
  incrementType: IncrementType;
  source?: string;
  decisionNumber: string;
  decisionDate?: string;
  effectiveDate: string;
  previousGrade?: string;
  newGrade?: string;
  previousIncrement: number;
  newIncrement: number;
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
  qualification?: string;
  specialization?: string;
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
  recordType?: 'تنبيه' | 'إنذار كتابي' | 'خصم من المرتب' | 'عقوبة إدارية' | 'أخرى';
  actionType?: string;
  penaltyType?: string;
  actionDate?: string;
  decisionNumber: string;
  decisionDate: string;
  effectiveDate: string;
  numberOfDays?: number;
  deductionDays?: number;
  deductionAmount?: number;
  reason: string;
  description: string;
  violationDetails?: string;
  issuingAuthority?: string;
  issuingOfficial?: string;
  letterNumber?: string;
  letterDate?: string;
  letterTitle?: string;
  customLetterBody?: string;
  status?: 'ساري' | 'ملغى' | 'منفذ' | 'مؤرشف';
  notes: string;
  createdBy: string;
  createdAt: string;
  lastModifiedBy?: string;
  lastModifiedDate?: string;
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
  resignationDate: string; // أو تاريخ النقل / إنهاء الخدمة
  lastWorkingDate: string;
  decisionNumber: string;
  decisionDate: string;
  reason: string;
  finalStatus: 'مستقيل' | 'متقاعد' | 'منهي خدماته' | 'متوفى' | 'منقول خارجياً' | 'أخرى';
  actionType?: 'استقالة' | 'نقل خارجي' | 'إنهاء خدمة' | 'نهاية خدمة' | 'تقاعد' | 'أخرى';
  destinationEntity?: string; // الجهة المنقول إليها (إجباري في حالة النقل الخارجي)
  previousDepartment?: string;
  previousJobTitle?: string;
  previousGrade?: string;
  pdfPath?: string;
  pdfFileName?: string;
  notes: string;
  createdBy: string;
  createdAt: string;
  // Reversal fields
  isReversed?: boolean;
  reversedAt?: string;
  reversedBy?: string;
  reversalReason?: string;
  previousStatus?: EmploymentStatus;
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

export type BulkActionType = 
  | 'صرف العلاوة السنوية'
  | 'إلغاء العلاوة السنوية'
  | 'إضافة رصيد إجازات'
  | 'خصم رصيد إجازات'
  | 'حذف / أرشفة الموظفين'
  | 'تحديث درجات جماعي'
  | 'إجراء جماعي مخصص'
  | 'ANNUAL_INCREMENT_DISBURSE'
  | 'LEAVE_BALANCE_ADJUST'
  | 'EMPLOYEE_STATUS_UPDATE'
  | 'UNDO_OPERATION';

export interface BulkOperationRecord {
  id: string; // e.g. "2026-000145"
  operationCode?: string;
  actionType: BulkActionType | string;
  actionName?: string;
  executionDate?: string; // YYYY-MM-DD
  executionTime?: string; // HH:mm:ss
  executedAt?: string;
  executedBy: string;
  affectedCount: number;
  affectedEmployeeIds: number[];
  status: 'مكتملة بنجاح' | 'تم التراجع عنها' | 'فاشلة' | 'SUCCESS' | 'REVERTED';
  backupFileName: string;
  backupChecksum?: string;
  isReversible?: boolean;
  isUndone?: boolean;
  undone?: boolean;
  undoneAt?: string;
  undoneBy?: string;
  undoOperationId?: string;
  undoDate?: string;
  undoTime?: string;
  undoBy?: string;
  undoReason?: string;
  undoBackupFileName?: string;
  preSnapshot?: {
    employees: Employee[];
    increments?: IncrementRecord[];
    promotions?: PromotionRecord[];
    leaves?: LeaveTransaction[];
  };
  preOperationSnapshot?: any[];
  details?: any;
  notes?: string;
  selectedMonth?: string;
  calculationDate?: string;
  resultReportData?: {
    reportNumber: string;
    reportDate: string;
    month: string;
    totalEligible: number;
    rows: Array<{
      employeeId: number;
      jobNumber: string;
      fullName: string;
      grade: string;
      currentIncrement: number;
      lastIncrementDate: string;
      nextEligibilityDate: string;
      newIncrement: number;
      incrementsDue: number;
      notes: string;
    }>;
  };
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
  action: 'إضافة' | 'تعديل' | 'حذف' | 'تسجيل دخول' | 'نسخة احتياطية' | 'استعادة' | 'عرض PDF' | 'تصدير تقرير' | 'إجراء وظيفي' | 'إجراء جماعي' | 'تراجع' | 'تقرير كفاءة سنوي';
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
  generalManagerName?: string;
  generalManagerTitle?: string;
  hrOfficerName?: string;
  appointmentGradeConfigs?: AppointmentGradeConfig[];
}

export type PerformanceEvaluationStatus = 
  | 'مسودة' 
  | 'جاهز للطباعة' 
  | 'مكتمل' 
  | 'معتمد';

export type EvaluationMode = 'يدوي' | 'إلكتروني';

export type EvaluationRating = 
  | 'ممتاز' 
  | 'جيد جداً' 
  | 'جيد' 
  | 'متوسط' 
  | 'ضعيف'
  | '';

export interface EvaluationItemValue {
  score?: number | string;
  notes?: string;
}

export interface EvaluationRecommendations {
  exceptionalBonusOrAllowance?: 'نعم' | 'لا' | '';
  nominationForPromotion?: 'نعم' | 'لا' | '';
  trainingNeeds?: 'نعم' | 'لا' | '';
  transferToAnotherJob?: 'نعم' | 'لا' | '';
  trainingDetails?: string;
  transferDetails?: string;
  generalNotes?: string;
}

export interface AnnualPerformanceEvaluation {
  id: string; // e.g. "EVAL-2022-1001" or "EVAL-1712345678"
  employeeId: number;
  fileNumber: string;
  employeeName: string;
  nationalId?: string;
  evaluationYear: number; // e.g. 2022, 2026
  periodStart: string;    // e.g. "01/01/2022" or "2022-01-01"
  periodEnd: string;      // e.g. "31/12/2022" or "2022-12-31"
  periodText?: string;    // e.g. "للمدة التي تبتدئ من 01/01/2022 وتنتهي في 31/12/2022"
  
  // Section One Snapshot: General Employee Info (Historical or Current)
  birthDateAndPlace: string;
  hireDate: string;
  qualification: string;
  qualificationDate: string;
  currentJobTitle: string;
  currentGrade: string;
  gradeDate: string;
  workplace: string;
  nationality: string;
  sector: string; // e.g. "الصحة"

  // Mode and Status
  mode: EvaluationMode; // 'يدوي' (Default) | 'إلكتروني'
  status: PerformanceEvaluationStatus; // 'مسودة' (Default) | 'جاهز للطباعة' | 'مكتمل' | 'معتمد'

  // Section Two: Performance Evaluation Scores & Fields
  // Category item values: { [itemId: string]: EvaluationItemValue }
  scores: Record<string, EvaluationItemValue>;
  totalScore?: number | string;                     // المجموع 100%
  performanceScore?: number | string;               // درجة الكفاءة
  performanceScoreJustification?: string;          // مبررات الحكم على الكفاءة
  adjustedScore?: number | string;                  // درجة الكفاءة المعدلة
  adjustedScoreJustification?: string;             // مبررات تعديل درجة كفاءة الموظف من الرئيس المباشر
  performanceRating?: EvaluationRating;             // ممتاز / جيد جداً / جيد / متوسط / ضعيف

  // Section Three: Recommendations
  recommendations: EvaluationRecommendations;

  // Signatures & Approval Parties
  directSupervisorName: string;
  directSupervisorJobOrGrade: string;
  directSupervisorSignatureDate?: string;
  higherSupervisorName: string;
  higherSupervisorJobOrGrade: string;
  higherSupervisorSignatureDate?: string;
  hrPreparerName: string;
  hrPreparationDate: string;

  // Scanned Document Archiving
  attachedDocPath?: string;
  attachedDocFileName?: string;
  attachedDocDate?: string;

  // Audit
  createdBy: string;
  createdAt: string;
  updatedBy?: string;
  updatedAt?: string;
  notes?: string;
}

export type ActiveTab = 
  | 'dashboard' 
  | 'employees' 
  | 'search' 
  | 'leaves' 
  | 'promotions' 
  | 'annual_evaluations'
  | 'general_procedures'
  | 'historical_418'
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
  | 'excel_validation'
  | 'users' 
  | 'logs' 
  | 'vba_code'
  | 'org_structure';

export type SettlementRecord = StatusSettlementRecord;
export type GeneralProcedureRecord = GeneralProcedure;
export type QualificationRecord = EmployeeQualificationRecord;
export type AnnualEvaluationRecord = AnnualPerformanceEvaluation;

export interface FullAppDatabase {
  employees: Employee[];
  careerRecords?: CareerPromotionRecord[];
  promotions?: PromotionRecord[];
  increments?: IncrementRecord[];
  leaves?: LeaveTransaction[];
  disciplinary?: DisciplinaryRecord[];
  secondments?: SecondmentRecord[];
  transfers?: TransferRecord[];
  resignations?: ResignationRecord[];
  settlements?: StatusSettlementRecord[];
  generalProcedures?: GeneralProcedure[];
  qualifications?: EmployeeQualificationRecord[];
  annualEvaluations?: AnnualPerformanceEvaluation[];
  unlinkedHistoricalRecords?: UnlinkedHistoricalCareerRecord[];
  hrRules?: HrRule[];
  promotionRules?: PromotionRule[];
  auditLogs?: AuditLog[];
  users?: UserAccount[];
  version?: string;
  lastUpdated?: string;
  [key: string]: any;
}

