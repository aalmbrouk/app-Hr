import { 
  Employee, 
  UserAccount, 
  AuditLog, 
  SystemSettings,
  LeaveTransaction,
  PromotionRecord,
  IncrementRecord,
  SecondmentRecord,
  TransferRecord,
  DisciplinaryRecord,
  ResignationRecord,
  StatusSettlementRecord,
  GeneralProcedure,
  OrganizationalUnit,
  JobTitle,
  HrRule,
  BulkOperationRecord,
  CareerPromotionRecord,
  EmployeeQualificationRecord,
  AnnualPerformanceEvaluation
} from '../types';
import { DEFAULT_HR_RULES } from '../utils/hrCalculations';
import { DEFAULT_APPOINTMENT_GRADE_CONFIGS } from '../utils/appointmentGradeUtils';
export { DEFAULT_HR_RULES, DEFAULT_APPOINTMENT_GRADE_CONFIGS };

// Educational Degrees (Dropdown exact options as requested)
export const EDUCATIONAL_DEGREES = [
  'دورة تدريبية',
  'ثانوية عامة',
  'دبلوم متوسط',
  'دبلوم عالي',
  'بكالوريوس',
  'ليسانس',
  'ماجستير',
  'دكتوراه'
] as const;

// Education Types (Public vs Private vs Not Applicable)
export const EDUCATION_TYPES = [
  'جامعة عامة',
  'جامعة خاصة',
  'غير منطبق'
] as const;

// Record Types for Employee Qualifications & Training History
export const QUALIFICATION_RECORD_TYPES = [
  'مؤهل علمي',
  'دورة تدريبية',
  'شهادة مهنية',
  'برنامج تدريبي',
  'أخرى'
] as const;

// High-level Assignment Categories
export const ASSIGNMENT_CATEGORIES = ['إداري', 'طبي'] as const;

// Comprehensive Department / Unit Structure
export const DEPARTMENTS = [
  'مكتب المدير العام',
  'مكتب الشؤون القانونية',
  'مكتب المراجعة الداخلية',
  'مكتب الموارد البشرية',
  'إدارة الشؤون الإدارية والمالية',
  'إدارة الشؤون الطبية',
  'قسم التبرع بالدم',
  'قسم الأطباء والتقييم الطبي',
  'قسم السحب الداخلي',
  'قسم تحضير مكونات الدم',
  'قسم المناعة وفصائل الدم والتوافق',
  'قسم المسح الفيروسي والسيرولوجي',
  'قسم التفاعل التسلسلي للبوليميراز (PCR)',
  'قسم حفظ وتوزيع الدم',
  'إدارة الصيدلة والمستلزمات الطبية',
  'إدارة المعدات والأجهزة الطبية',
  'إدارة الشؤون الفنية والهندسية والصيانة',
  'مكتب الجودة والسلامة البيولوجية',
  'مكتب العلاقات العامة وحملات التبرع'
];

// Department -> Category Mapping
export const DEPT_CATEGORIES: Record<string, 'إداري' | 'طبي'> = {
  'مكتب المدير العام': 'إداري',
  'مكتب الشؤون القانونية': 'إداري',
  'مكتب المراجعة الداخلية': 'إداري',
  'مكتب الموارد البشرية': 'إداري',
  'إدارة الشؤون الإدارية والمالية': 'إداري',
  'إدارة الشؤون الطبية': 'طبي',
  'قسم التبرع بالدم': 'طبي',
  'قسم الأطباء والتقييم الطبي': 'طبي',
  'قسم السحب الداخلي': 'طبي',
  'قسم تحضير مكونات الدم': 'طبي',
  'قسم المناعة وفصائل الدم والتوافق': 'طبي',
  'قسم المسح الفيروسي والسيرولوجي': 'طبي',
  'قسم التفاعل التسلسلي للبوليميراز (PCR)': 'طبي',
  'قسم حفظ وتوزيع الدم': 'طبي',
  'إدارة الصيدلة والمستلزمات الطبية': 'طبي',
  'إدارة المعدات والأجهزة الطبية': 'طبي',
  'إدارة الشؤون الفنية والهندسية والصيانة': 'إداري',
  'مكتب الجودة والسلامة البيولوجية': 'طبي',
  'مكتب العلاقات العامة وحملات التبرع': 'إداري'
};

// Hierarchical Job Titles per Department
export const JOBS_BY_DEPT: Record<string, string[]> = {
  'مكتب المدير العام': ['مدير عام مصرف الدم', 'مساعد مدير عام', 'سكرتير إداري', 'مسجل بيانات وتوثيق'],
  'مكتب الشؤون القانونية': ['رئيس مكتب الشؤون القانونية', 'باحث قانوني', 'مستشار قانوني', 'متابع قضايا إدارية'],
  'مكتب المراجعة الداخلية': ['رئيس مكتب المراجعة الداخلية', 'مراجع مالي وإداري', 'تدقيق مستندات'],
  'مكتب الموارد البشرية': ['رئيس مكتب الموارد البشرية', 'مسؤول الشؤون الوظيفية', 'مسؤول ملفات وسجلات', 'مُدخل بيانات موارد بشرية', 'مسؤول الإجازات والخدمة'],
  'إدارة الشؤون الإدارية والمالية': ['مدير الشؤون الإدارية والمالية', 'رئيس قسم المحاسبة', 'محاسب مالي', 'أمينات صندوق', 'موظف استقبال', 'أمينات مخزن إداري', 'سائق حافلة تبرع', 'عامل خدمات عامة'],
  'إدارة الشؤون الطبية': ['مدير الشؤون الطبية', 'مستشار جودة بنوك الدم', 'مشرف عام الفحوصات', 'منسق خدمات نقل الدم'],
  'قسم التبرع بالدم': ['رئيس قسم التبرع', 'ممرض سحب دم', 'فني استقبال متبرعين', 'أخصائي توعية متبرعين', 'مساعد تمريض'],
  'قسم الأطباء والتقييم الطبي': ['رئيس قسم الأطباء', 'طبيب بشرى أخصائي', 'طبيب عام فحص متبرعين', 'طبيب مقيم بنك الدم'],
  'قسم السحب الداخلي': ['رئيس قسم السحب الداخلي', 'ممرض سحب عينات', 'فني سحب وتثقيف'],
  'قسم تحضير مكونات الدم': ['رئيس قسم فصل المكونات', 'أخصائي فصل البلازما والصفائح', 'فني فصل وتقنية مكونات', 'فني معالجة البلازما'],
  'قسم المناعة وفصائل الدم والتوافق': ['رئيس قسم المناعة والتوافق', 'أخصائي مطابقة وتطابق دمي (Cross-match)', 'فني فصائل وأجسام مضادة', 'فني مناعة نقل الدم'],
  'قسم المسح الفيروسي والسيرولوجي': ['رئيس قسم المسح الفيروسي', 'أخصائي سيرولوجي وفيروسات', 'فني مسح فيروسات بنك الدم'],
  'قسم التفاعل التسلسلي للبوليميراز (PCR)': ['رئيس قسم التفاعل التسلسلي PCR', 'أخصائي تقنية جزيئية NAT/PCR', 'فني فحص الحمض النبوي'],
  'قسم حفظ وتوزيع الدم': ['رئيس قسم الحفظ والتوزيع', 'أمين مخزن الدم المركزي', 'فني توزيع وصرف الدم', 'مسؤول التبريد والتخزين'],
  'إدارة الصيدلة والمستلزمات الطبية': ['مدير إدارة الصيدلة', 'صيدلي أخصائي', 'أمين مخزن مستلزمات سحب الدم', 'فني صيدلة'],
  'إدارة المعدات والأجهزة الطبية': ['مدير إدارة المعدات الطبية', 'مهندس أجهزة طبية', 'فني صيانة أجهزة حفظ وتبريد', 'فني معايرة أجهزة بنك الدم'],
  'إدارة الشؤون الفنية والهندسية والصيانة': ['مدير الشؤون الفنية', 'مهندس صيانة وترميز', 'فني كهرباء ومولدات', 'فني تكييف وتبريد', 'مشرف أمن وسلامة'],
  'مكتب الجودة والسلامة البيولوجية': ['رئيس مكتب الجودة', 'مسؤول سلامة بيولوجية', 'مراقب جودة مكونات الدم'],
  'مكتب العلاقات العامة وحملات التبرع': ['رئيس مكتب العلاقات العامة', 'منسق حملات التبرع الميدانية', 'مسؤول إعلام وتوعية مجتمعية']
};

export const ALL_JOB_TITLES = Array.from(new Set(Object.values(JOBS_BY_DEPT).flat()));
export { ALL_JOB_TITLES as JOB_TITLES };

export const QUALIFICATIONS = [
  'دكتوراه طب بشرى / دكتوراه علوم',
  'ماجستير أحياء دقيقة / مختبرات',
  'بكالوريوس تقنية مختبرات طبية',
  'بكالوريوس تمريض عام',
  'بكالوريوس إدارة أعمال / محاسبة',
  'بكالوريوس تقنية معلومات',
  'دبلوم عالي مختبرات طبية',
  'دبلوم متوسط تمريض',
  'دبلوم متوسط إداري',
  'شهادة الثانوية العامة',
  'شهادة إعدادية / أخرى'
];

export const SALARY_SCALES = [
  'جدول مرتبات الكادر الطبي والطب المساعد',
  'جدول المرتبات الموحد',
  'جدول العناصر الطبية المساعدة',
  'جدول الكوادر الإدارية والمالية',
  'جدول العقود والمكافآت'
];

export const JOB_GRADES = [
  'الدرجة الأولى',
  'الدرجة الثانية',
  'الدرجة الثالثة',
  'الدرجة الرابعة',
  'الدرجة الخامسة',
  'الدرجة السادسة',
  'الدرجة السابعة',
  'الدرجة الثامنة',
  'الدرجة التاسعة',
  'الدرجة العاشرة',
  'الدرجة الحادية عشر',
  'الدرجة الثانية عشر',
  'الدرجة الثالثة عشر',
  'الدرجة الرابعة عشر',
  'الدرجة الخامسة عشر'
];

export const COMMON_NATIONALITIES = [
  'ليبي',
  'مصري',
  'تونسي',
  'سوداني',
  'سوري',
  'أردني',
  'فلسطيني',
  'تشادي',
  'نيجري',
  'أخرى'
];

export const HIRING_ENTITIES = [
  'وزارة الصحة - ليبيا',
  'مصرف الدم المركزي بلدية المرج',
  'الهيئة العامة للخدمات الطبية',
  'مجلس الخدمات الصحية بنغازي/المرج',
  'عقد محلي - مصرف الدم',
  'نقل من مستشفى المرج التعليمي'
];

export const INITIAL_USERS: UserAccount[] = [
  {
    id: '1',
    username: 'admin1',
    displayName: 'المدير الأول (Administrator 1)',
    role: 'Administrator 1',
    lastLogin: '2026-08-05 08:30'
  },
  {
    id: '2',
    username: 'admin2',
    displayName: 'المدير الثاني (Administrator 2)',
    role: 'Administrator 2',
    lastLogin: '2026-08-04 14:15'
  }
];

export const INITIAL_SETTINGS: SystemSettings = {
  bankName: 'مصرف الدم المركزي بلدية المرج - ليبيا',
  subTitle: 'نظام إدارة الموارد البشرية وشؤون الموظفين',
  branch: 'الفرع الرئيسي - المرج',
  backupFolderPath: 'C:\\BloodBankSystem\\Backups',
  pdfFolderPath: 'C:\\BloodBankSystem\\EmployeePDFs',
  maxRecordsPerPage: 20,
  autoLog: true,
  themeColor: '#991b1b',
  isSheetProtected: true,
  generalManagerName: 'نجيب صالح سالم',
  generalManagerTitle: 'مدير عام مصرف الدم المركزي المرج',
  hrOfficerName: 'شؤون الموظفين',
  appointmentGradeConfigs: DEFAULT_APPOINTMENT_GRADE_CONFIGS
};

/**
 * PRODUCTION INITIAL STATE:
 * Clean, empty employee database for production first launch.
 * Zero demo employees are loaded on production startup.
 */
export const INITIAL_EMPLOYEES: Employee[] = [];

/**
 * OPTIONAL DEMO DATA (FOR DEVELOPMENT & DEMO TESTING ONLY):
 * Clearly isolated demo dataset for testing system functionality and calculations.
 */
export const DEMO_EMPLOYEES: Employee[] = [
  {
    id: 1001,
    jobNumber: '1001/م',
    nationality: 'ليبي',
    documentType: 'الرقم الوطني',
    nationalId: '119850123456',
    fullName: 'د. طارق مسعود سالم الفيتوري',
    motherName: 'فاطمة علي الفيتوري',
    birthDate: '1985-04-12',
    birthPlace: 'المرج',
    gender: 'ذكر',
    maritalStatus: 'متزوج',
    status: 'على رأس العمل',
    hireDate: '2010-02-15',
    directingDate: '2010-03-01',
    bloodBankStartDate: '2012-01-10',
    appointmentSalarySystem: 'جدول مرتبات القانون 15',
    appointmentGrade: 'الدرجة السابعة',
    appointmentIncrements: 0,
    salaryScale: 'جدول مرتبات الكادر الطبي والطب المساعد',
    jobGrade: 'الدرجة العاشرة',
    currentIncrement: 3,
    gradeEntryDate: '2021-01-01',
    transactionType: 'ترقية عادية',
    eligibilityDate: '2025-01-01',
    qualification: 'دكتوراه طب بشرى / دكتوراه علوم',
    specialization: 'طب وجراحة / أمراض الدم ونقل الدم',
    cadreNumber: 'MLK-0881',
    hiringEntity: 'وزارة الصحة - ليبيا',
    assignmentCategory: 'طبي',
    department: 'قسم الأطباء والتقييم الطبي',
    jobTitle: 'طبيب بشرى أخصائي',
    phone: '0913456789',
    email: 'tarek.fitouri@bloodbank.marj.ly',
    pdfPath: '/docs/1001_tarek.pdf',
    pdfFileName: 'ملف_الموظف_طارق_الفيتوري.pdf',
    notes: 'أخصائي تقييم طبي ورئيس قسم الأطباء بمصرف الدم'
  },
  {
    id: 1002,
    jobNumber: '1002/م',
    nationality: 'ليبي',
    documentType: 'الرقم الوطني',
    nationalId: '219900987654',
    fullName: 'م. أمل مفتاح الصابر العبيدي',
    motherName: 'زينب محمد العبيدي',
    birthDate: '1990-08-22',
    birthPlace: 'المرج',
    gender: 'أنثى',
    maritalStatus: 'متزوجة',
    status: 'على رأس العمل',
    hireDate: '2014-06-10',
    directingDate: '2014-07-01',
    bloodBankStartDate: '2014-07-01',
    appointmentSalarySystem: 'جدول مرتبات القانون 15',
    appointmentGrade: 'الدرجة السادسة',
    appointmentIncrements: 0,
    salaryScale: 'جدول العناصر الطبية المساعدة',
    jobGrade: 'الدرجة الثامنة',
    currentIncrement: 2,
    gradeEntryDate: '2022-03-15',
    transactionType: 'ترقية عادية',
    eligibilityDate: '2026-03-15',
    qualification: 'بكالوريوس تقنية مختبرات طبية',
    specialization: 'سيرولوجي وبنوك الدم',
    cadreNumber: 'MLK-0922',
    hiringEntity: 'مصرف الدم المركزي بلدية المرج',
    assignmentCategory: 'طبي',
    department: 'قسم المسح الفيروسي والسيرولوجي',
    jobTitle: 'أخصائي سيرولوجي وفيروسات',
    phone: '0925678901',
    email: 'amal.alabeedi@bloodbank.marj.ly',
    pdfPath: '/docs/1002_amal.pdf',
    pdfFileName: 'ملف_الموظفة_أمل_العبيدي.pdf',
    notes: 'مشرفة قسم المسح الفيروسي'
  },
  {
    id: 1003,
    jobNumber: '1003/م',
    nationality: 'ليبي',
    documentType: 'الرقم الوطني',
    nationalId: '119880345678',
    fullName: 'أ. خالد ابراهيم البرعصي',
    motherName: 'مريم خليفة البرعصي',
    birthDate: '1988-11-05',
    birthPlace: 'بنغازي',
    gender: 'ذكر',
    maritalStatus: 'متزوج',
    status: 'على رأس العمل',
    hireDate: '2012-01-01',
    directingDate: '2012-01-15',
    bloodBankStartDate: '2015-05-10',
    appointmentGrade: 'الدرجة الخامسة',
    salaryScale: 'جدول المرتبات الموحد',
    jobGrade: 'الدرجة السابعة',
    currentIncrement: 4,
    gradeEntryDate: '2020-06-01',
    transactionType: 'تسوية وضع',
    eligibilityDate: '2024-06-01',
    qualification: 'بكالوريوس إدارة أعمال / محاسبة',
    specialization: 'إدارة موارد بشرية',
    cadreNumber: 'MLK-0754',
    hiringEntity: 'الهيئة العامة للخدمات الطبية',
    assignmentCategory: 'إداري',
    department: 'مكتب الموارد البشرية',
    jobTitle: 'رئيس مكتب الموارد البشرية',
    phone: '0912341122',
    email: 'khaled.baraasi@bloodbank.marj.ly',
    pdfPath: '/docs/1003_khaled.pdf',
    pdfFileName: 'ملف_الموظف_خالد_البرعصي.pdf',
    notes: 'رئيس مكتب الموارد البشرية المشرف على الإجراءات'
  },
  {
    id: 1004,
    jobNumber: '1004/م',
    nationality: 'ليبي',
    documentType: 'الرقم الوطني',
    nationalId: '219930456123',
    fullName: 'منى عمر خليفة الدرسي',
    motherName: 'سالمة فرج الدرسي',
    birthDate: '1993-02-18',
    birthPlace: 'المرج',
    gender: 'أنثى',
    maritalStatus: 'عزباء',
    status: 'على رأس العمل',
    hireDate: '2016-09-01',
    directingDate: '2016-09-15',
    bloodBankStartDate: '2016-09-15',
    appointmentGrade: 'الدرجة الرابعة',
    salaryScale: 'جدول العناصر الطبية المساعدة',
    jobGrade: 'الدرجة السادسة',
    currentIncrement: 1,
    gradeEntryDate: '2023-01-01',
    transactionType: 'ترقية عادية',
    eligibilityDate: '2027-01-01',
    qualification: 'دبلوم عالي مختبرات طبية',
    specialization: 'فصل مكونات الدم',
    cadreNumber: 'MLK-1102',
    hiringEntity: 'مصرف الدم المركزي بلدية المرج',
    assignmentCategory: 'طبي',
    department: 'قسم تحضير مكونات الدم',
    jobTitle: 'أخصائي فصل البلازما والصفائح',
    phone: '0948899001',
    email: 'mona.darsi@bloodbank.marj.ly',
    pdfPath: '/docs/1004_mona.pdf',
    pdfFileName: 'ملف_الموظفة_منى_الدرسي.pdf',
    notes: 'فني متخصص في فصل الصفائح والمكونات'
  },
  {
    id: 1005,
    jobNumber: '1005/م',
    nationality: 'ليبي',
    documentType: 'الرقم الوطني',
    nationalId: '119910567890',
    fullName: 'عبدالسلام فرج المنفي',
    motherName: 'عائشة سعد المنفي',
    birthDate: '1991-07-30',
    birthPlace: 'طبرق',
    gender: 'ذكر',
    maritalStatus: 'متزوج',
    status: 'على رأس العمل',
    hireDate: '2015-03-10',
    directingDate: '2015-04-01',
    bloodBankStartDate: '2018-02-01',
    appointmentGrade: 'الدرجة الخامسة',
    salaryScale: 'جدول المرتبات الموحد',
    jobGrade: 'الدرجة السابعة',
    currentIncrement: 3,
    gradeEntryDate: '2021-09-01',
    transactionType: 'ترقية عادية',
    eligibilityDate: '2025-09-01',
    qualification: 'بكالوريوس إدارة أعمال / محاسبة',
    specialization: 'محاسبة مالية ومراجعة',
    cadreNumber: 'MLK-0630',
    hiringEntity: 'عقد محلي - مصرف الدم',
    assignmentCategory: 'إداري',
    department: 'إدارة الشؤون الإدارية والمالية',
    jobTitle: 'محاسب مالي',
    phone: '0917788990',
    email: 'abdulsalam.menfi@bloodbank.marj.ly',
    pdfPath: '/docs/1005_abdulsalam.pdf',
    pdfFileName: 'ملف_الموظف_عبدالسلام_المنفي.pdf',
    notes: 'محاسب الخزينة والمرتبات'
  }
];

export const INITIAL_LEAVES: LeaveTransaction[] = [];
export const INITIAL_PROMOTIONS: PromotionRecord[] = [];
export const INITIAL_INCREMENTS: IncrementRecord[] = [];
export const INITIAL_SECONDMENTS: SecondmentRecord[] = [];
export const INITIAL_TRANSFERS: TransferRecord[] = [];
export const INITIAL_DISCIPLINARY: DisciplinaryRecord[] = [];
export const INITIAL_RESIGNATIONS: ResignationRecord[] = [];
export const INITIAL_SETTLEMENTS: StatusSettlementRecord[] = [];
export const INITIAL_GENERAL_PROCEDURES: GeneralProcedure[] = [];
export const INITIAL_BULK_OPERATIONS: BulkOperationRecord[] = [];
export const INITIAL_CAREER_RECORDS: CareerPromotionRecord[] = [];
export const INITIAL_ANNUAL_EVALUATIONS: AnnualPerformanceEvaluation[] = [];

export const DEMO_ANNUAL_EVALUATIONS: AnnualPerformanceEvaluation[] = [
  {
    id: 'EVAL-2025-1001-01',
    employeeId: 1001,
    fileNumber: '1001/م',
    employeeName: 'د. طارق مسعود سالم الفيتوري',
    nationalId: '119850123456',
    evaluationYear: 2025,
    periodStart: '01/01/2025',
    periodEnd: '31/12/2025',
    periodText: 'للمدة التي تبتدئ من 01/01/2025 وتنتهي في 31/12/2025',
    birthDateAndPlace: '1985-04-12 - المرج',
    hireDate: '2010-02-15',
    qualification: 'دكتوراه طب بشرى / دكتوراه علوم',
    qualificationDate: '2010-02-15',
    currentJobTitle: 'طبيب بشرى أخصائي',
    currentGrade: 'الدرجة العاشرة',
    gradeDate: '2021-01-01',
    workplace: 'قسم الأطباء والتقييم الطبي',
    nationality: 'ليبي',
    sector: 'الصحة',
    mode: 'إلكتروني',
    status: 'معتمد',
    scores: {
      duty_quantity: { score: 15, notes: 'إنتاجية استثنائية' },
      duty_quality: { score: 15, notes: 'دقة عالية في الفحوصات الطبية' },
      duty_tools_care: { score: 8, notes: 'محافظة ممتازة على أجهزة المختبر وبنك الدم' },
      duty_coordination: { score: 7, notes: 'تنسيق ممتاز مع الكادر الطبي' },
      punc_work_time_care: { score: 15, notes: 'انضباط كامل طوال ساعات الدوام' },
      punc_respect_timing: { score: 10, notes: 'التزام بالمناوبات والمواعيد' },
      init_accept_criticism: { score: 2, notes: '' },
      init_innovation_progress: { score: 3, notes: 'مبادرات متميزة في تطوير الفحص' },
      init_responsibility: { score: 3, notes: 'تحمل مسؤولية كاملة' },
      init_alertness_conduct: { score: 2, notes: '' },
      init_supervision_ability: { score: 3, notes: 'قيادة ممتازة لفريق العمل' },
      init_appearance: { score: 2, notes: '' },
      rel_colleagues_superiors: { score: 6, notes: 'تعاون وثيق وروح فريق' },
      rel_public_treatment: { score: 5, notes: 'معاملة راقية مع المتبرعين بالدم' },
      rel_general_work: { score: 4, notes: '' }
    },
    totalScore: 98,
    performanceScore: 98,
    performanceScoreJustification: 'طبيب أخصائي متميز بأداء واجباته والالتزام والانضباط الكامل',
    adjustedScore: 98,
    adjustedScoreJustification: 'لا يوجد تعديل، الدرجة مستحقة بالكامل',
    performanceRating: 'ممتاز',
    recommendations: {
      exceptionalBonusOrAllowance: 'نعم',
      nominationForPromotion: 'نعم',
      trainingNeeds: 'لا',
      transferToAnotherJob: 'لا',
      generalNotes: 'يوصى بتقديره رسمياً'
    },
    directSupervisorName: 'د. مسعود خليفة',
    directSupervisorJobOrGrade: 'رئيس قسم الأطباء',
    directSupervisorSignatureDate: '2025-12-30',
    higherSupervisorName: 'نجيب صالح سالم',
    higherSupervisorJobOrGrade: 'مدير عام مصرف الدم المركزي المرج',
    higherSupervisorSignatureDate: '2025-12-31',
    hrPreparerName: 'خالد ابراهيم البرعصي',
    hrPreparationDate: '2025-12-28',
    createdBy: 'admin1',
    createdAt: '2025-12-28 10:00'
  },
  {
    id: 'EVAL-2026-1002-02',
    employeeId: 1002,
    fileNumber: '1002/م',
    employeeName: 'م. أمل مفتاح الصابر العبيدي',
    nationalId: '219900234567',
    evaluationYear: 2026,
    periodStart: '01/01/2026',
    periodEnd: '31/12/2026',
    periodText: 'للمدة التي تبتدئ من 01/01/2026 وتنتهي في 31/12/2026',
    birthDateAndPlace: '1990-09-22 - البيضاء',
    hireDate: '2014-06-01',
    qualification: 'بكالوريوس تقنية مختبرات طبية',
    qualificationDate: '2013-07-15',
    currentJobTitle: 'فني مختبر رئيسي',
    currentGrade: 'الدرجة الثامنة',
    gradeDate: '2022-01-01',
    workplace: 'قسم الفحوصات والتحاليل الطبية',
    nationality: 'ليبي',
    sector: 'الصحة',
    mode: 'يدوي',
    status: 'جاهز للطباعة',
    scores: {},
    totalScore: '',
    performanceScore: '',
    adjustedScore: '',
    performanceRating: '',
    recommendations: {
      exceptionalBonusOrAllowance: '',
      nominationForPromotion: '',
      trainingNeeds: '',
      transferToAnotherJob: ''
    },
    directSupervisorName: '',
    directSupervisorJobOrGrade: 'رئيس قسم الفحوصات',
    higherSupervisorName: 'نجيب صالح سالم',
    higherSupervisorJobOrGrade: 'مدير عام مصرف الدم المركزي المرج',
    hrPreparerName: 'خالد ابراهيم البرعصي',
    hrPreparationDate: '2026-01-15',
    createdBy: 'admin1',
    createdAt: '2026-01-15 09:30'
  }
];

export const DEMO_LEAVES: LeaveTransaction[] = [
  {
    id: 'LV-2026-001',
    employeeId: 1002,
    leaveType: 'إجازة سنوية',
    startDate: '2026-07-01',
    endDate: '2026-07-15',
    numberOfDays: 15,
    leaveYear: 2026,
    approvalNumber: 'DEC-8812',
    approvalDate: '2026-06-25',
    status: 'مقبولة',
    deductsFromAnnualLeave: true,
    balanceBefore: 30,
    balanceAfter: 15,
    notes: 'إجازة سنوية اعتيادية اعتبارات عائلية',
    createdBy: 'admin1',
    createdAt: '2026-06-25 10:00'
  },
  {
    id: 'LV-2026-002',
    employeeId: 1004,
    leaveType: 'إجازة الوضع والأمومة',
    startDate: '2026-05-01',
    endDate: '2026-07-31',
    numberOfDays: 90,
    leaveYear: 2026,
    approvalNumber: 'DEC-8901',
    approvalDate: '2026-04-28',
    status: 'مقبولة',
    deductsFromAnnualLeave: false, // لا تخصم من رصيد الإجازات السنوية (حسب الشرط 12)
    balanceBefore: 30,
    balanceAfter: 30,
    notes: 'إجازة وضع وأمومة مدفوعة الأجر طبقاً للائحة',
    createdBy: 'admin1',
    createdAt: '2026-04-28 11:30'
  },
  {
    id: 'LV-2026-003',
    employeeId: 1005,
    leaveType: 'إجازة مرضية',
    startDate: '2026-02-10',
    endDate: '2026-02-17',
    numberOfDays: 7,
    leaveYear: 2026,
    approvalNumber: 'MED-441',
    approvalDate: '2026-02-18',
    status: 'مقبولة',
    deductsFromAnnualLeave: false, // لا تخصم من رصيد الإجازات السنوية
    balanceBefore: 30,
    balanceAfter: 30,
    notes: 'تقرير طبي معتمد من اللجنة الطبية المرج',
    createdBy: 'admin2',
    createdAt: '2026-02-18 09:15'
  }
];

export const DEMO_CAREER_RECORDS: CareerPromotionRecord[] = [
  {
    id: 'CAR-2022-001',
    employeeId: 1001,
    fileNumber: '1001/م',
    employeeName: 'أحمد خليفة سالم العبيدي',
    actionType: 'تعيين',
    previousGrade: 'الدرجة السادسة',
    previousIncrement: 0,
    newGrade: 'الدرجة السادسة',
    newIncrement: 0,
    actionDate: '2022-01-01',
    decisionDate: '2021-12-15',
    decisionNumber: 'DEC-2021-01',
    issuingAuthority: 'وزارة الصحة - ليبيا',
    notes: 'قرار التعيين والمباشرة الأصلية بالدولة',
    createdBy: 'admin1',
    createdAt: '2022-01-01 08:00'
  },
  {
    id: 'CAR-2023-001',
    employeeId: 1001,
    fileNumber: '1001/م',
    employeeName: 'أحمد خليفة سالم العبيدي',
    actionType: 'علاوة دورية',
    previousGrade: 'الدرجة السادسة',
    previousIncrement: 0,
    newGrade: 'الدرجة السادسة',
    newIncrement: 1,
    actionDate: '2023-01-01',
    decisionDate: '2022-12-28',
    decisionNumber: 'INC-2023-01',
    issuingAuthority: 'مصرف الدم المركزي المرج',
    notes: 'علاوة سنوية دورية استحقاق يناير 2023',
    createdBy: 'admin1',
    createdAt: '2023-01-01 08:00'
  },
  {
    id: 'CAR-2024-001',
    employeeId: 1001,
    fileNumber: '1001/م',
    employeeName: 'أحمد خليفة سالم العبيدي',
    actionType: 'علاوة دورية',
    previousGrade: 'الدرجة السادسة',
    previousIncrement: 1,
    newGrade: 'الدرجة السادسة',
    newIncrement: 2,
    actionDate: '2024-01-01',
    decisionDate: '2023-12-25',
    decisionNumber: 'INC-2024-01',
    issuingAuthority: 'مصرف الدم المركزي المرج',
    notes: 'علاوة سنوية دورية استحقاق يناير 2024',
    createdBy: 'admin1',
    createdAt: '2024-01-01 08:00'
  },
  {
    id: 'CAR-2025-001',
    employeeId: 1001,
    fileNumber: '1001/م',
    employeeName: 'أحمد خليفة سالم العبيدي',
    actionType: 'ترقية',
    previousGrade: 'الدرجة السادسة',
    previousIncrement: 2,
    newGrade: 'الدرجة الخامسة',
    newIncrement: 0,
    actionDate: '2025-01-01',
    decisionDate: '2024-12-20',
    decisionNumber: 'PRM-2025-12',
    issuingAuthority: 'وزارة الصحة / إدارة الشؤون الإدارية',
    notes: 'ترقية دورية اعتيادية لاستيفاء المدة القانونية',
    createdBy: 'admin1',
    createdAt: '2025-01-01 08:00'
  },
  {
    id: 'CAR-2026-001',
    employeeId: 1001,
    fileNumber: '1001/م',
    employeeName: 'أحمد خليفة سالم العبيدي',
    actionType: 'علاوة دورية',
    previousGrade: 'الدرجة الخامسة',
    previousIncrement: 0,
    newGrade: 'الدرجة الخامسة',
    newIncrement: 1,
    actionDate: '2026-01-01',
    decisionDate: '2025-12-28',
    decisionNumber: 'INC-2026-01',
    issuingAuthority: 'مصرف الدم المركزي المرج',
    notes: 'علاوة سنوية دورية استحقاق يناير 2026',
    createdBy: 'admin1',
    createdAt: '2026-01-01 08:00'
  },
  {
    id: 'CAR-2026-002',
    employeeId: 1001,
    fileNumber: '1001/م',
    employeeName: 'أحمد خليفة سالم العبيدي',
    actionType: 'ندب على درجة',
    previousGrade: 'الدرجة الخامسة',
    previousIncrement: 1,
    newGrade: 'الدرجة الرابعة',
    newIncrement: 3,
    actionDate: '2026-08-10',
    decisionDate: '2026-08-10',
    decisionNumber: 'SEC-GRD-2026-44',
    issuingAuthority: 'وزارة الصحة - قرار وزاري رقم 44',
    notes: 'ندب وظيفي رسمي على الدرجة الرابعة و3 علاوات',
    createdBy: 'admin1',
    createdAt: '2026-08-10 10:00'
  }
];

export const DEMO_PROMOTIONS: PromotionRecord[] = [
  {
    id: 'PRM-2021-001',
    employeeId: 1001,
    fileNumber: '1001/م',
    previousGrade: 'الدرجة التاسعة',
    previousGradeName: 'الدرجة التاسعة',
    previousIncrement: 4,
    newGrade: 'الدرجة العاشرة',
    newGradeName: 'الدرجة العاشرة',
    newIncrement: 1,
    promotionType: 'ترقية عادية',
    decisionNumber: 'PRM-2021-88',
    decisionDate: '2020-12-20',
    effectiveDate: '2021-01-01',
    eligibilityDate: '2025-01-01',
    reason: 'استيفاء المدة القانونية للترقية (4 سنوات)',
    notes: 'تم اعتماد الترقية رسمياً قرار وزاري',
    createdBy: 'admin1',
    createdAt: '2020-12-20 12:00'
  }
];

export const DEMO_INCREMENTS: IncrementRecord[] = [
  {
    id: 'INC-2023-001',
    employeeId: 1001,
    previousGrade: 'الدرجة العاشرة',
    previousIncrement: 2,
    newIncrement: 3,
    effectiveDate: '2023-01-01',
    incrementType: 'تلقائية',
    decisionNumber: 'INC-2023-102',
    notes: 'علاوة سنوية دورية استحقاق يناير',
    createdBy: 'admin1',
    createdAt: '2023-01-01 08:00'
  }
];

export const DEMO_SECONDMENTS: SecondmentRecord[] = [
  {
    id: 'SEC-2025-001',
    employeeId: 1003,
    originalDepartment: 'مكتب الموارد البشرية',
    assignedEntity: 'مستشفى المرج التعليمي',
    startDate: '2025-01-01',
    endDate: '2025-12-31',
    decisionNumber: 'SEC-801',
    decisionDate: '2024-12-15',
    reason: 'ندب جزئي لتنظيم الأرشيف الطبي',
    status: 'منتهي',
    notes: 'تمت العودة لمباشرة العمل ببنك الدم',
    createdBy: 'admin1',
    createdAt: '2024-12-15 11:00'
  }
];

export const DEMO_TRANSFERS: TransferRecord[] = [
  {
    id: 'TRN-2022-001',
    employeeId: 1005,
    previousDepartment: 'مكتب الموارد البشرية',
    newDepartment: 'إدارة الشؤون الإدارية والمالية',
    transferType: 'نقل داخلي',
    decisionNumber: 'TRN-102',
    decisionDate: '2022-05-10',
    effectiveDate: '2022-05-15',
    reason: 'مصلحة العمل وحاجة الشؤون المالية لمشرف حسابات',
    notes: 'تمت إجراءات التسليم والتسلم',
    createdBy: 'admin1',
    createdAt: '2022-05-10 10:00'
  }
];

export const DEMO_GENERAL_PROCEDURES: GeneralProcedure[] = [
  {
    id: 'PRC-2026-001',
    employeeId: 1001,
    fileNumber: '1001/م',
    procedureType: 'قرار إداري',
    procedureNumber: 'أد/2026/12',
    procedureDate: '2026-01-10',
    effectiveDate: '2026-01-15',
    description: 'تكليف برئاسة لجنة التقييم الفني والأجهزة الطبية بالمصرف',
    reason: 'مصلحة العمل وتحديث معايير الجودة الطبية',
    decisionAuthority: 'مدير عام مصرف الدم المركزي المرج',
    notes: 'تم إخطار جميع الأقسام المعنية بالقرار',
    pdfPath: '/docs/proc_1001_takleef.pdf',
    pdfFileName: 'قرار_تكليف_د_طارق_الفيتوري.pdf',
    createdBy: 'admin1',
    createdAt: '2026-01-10 11:00'
  },
  {
    id: 'PRC-2026-002',
    employeeId: 1003,
    fileNumber: '1003/م',
    procedureType: 'إخطار موارد بشرية',
    procedureNumber: 'م هـ/2026/04',
    procedureDate: '2026-03-01',
    effectiveDate: '2026-03-01',
    description: 'اعتماد تحديث البيانات الأكاديمية وإضافة دورة الجودة الشاملة',
    reason: 'تحديث الملف الوظيفي للموظف',
    decisionAuthority: 'مكتب الموارد البشرية',
    notes: 'إرفاق الشواهد في الأرشيف الإلكتروني',
    createdBy: 'admin2',
    createdAt: '2026-03-01 09:30'
  }
];

export const INITIAL_QUALIFICATIONS: EmployeeQualificationRecord[] = [];

export const DEMO_QUALIFICATIONS: EmployeeQualificationRecord[] = [
  {
    id: 'QUAL-2026-001',
    employeeId: 1001,
    employeeName: 'د. طارق مسعود سالم الفيتوري',
    fileNumber: '1001/م',
    recordType: 'مؤهل علمي',
    title: 'دكتوراه طب بشري وأمراض الدم',
    specialization: 'طب وجراحة / أمراض الدم ونقل الدم',
    issuingAuthority: 'جامعة بنغازي - كلية الطب البشري',
    universityOrInstitute: 'جامعة بنغازي',
    educationType: 'جامعة عامة',
    graduationYear: '2015',
    completionDate: '2015-06-30',
    certificateNumber: 'MED-PHD-8821',
    notes: 'معادلة ومعتمدة من وزارة التعليم العالي',
    createdBy: 'admin1',
    createdAt: '2026-01-10 10:00'
  },
  {
    id: 'QUAL-2026-002',
    employeeId: 1001,
    employeeName: 'د. طارق مسعود سالم الفيتوري',
    fileNumber: '1001/م',
    recordType: 'دورة تدريبية',
    title: 'إدارة وتأكيد جودة بنوك الدم المتقدمة',
    specialization: 'سلامة نقل الدم وضبط الجودة',
    issuingAuthority: 'منظمة الصحة العالمية WHO / وزارة الصحة',
    executor: 'المركز الوطني لتطوير النظام الصحي',
    duration: '4 أسابيع (60 ساعة تدريبية)',
    graduationYear: '2023',
    completionDate: '2023-11-20',
    certificateNumber: 'WHO-BB-2023-991',
    notes: 'دورة تدريبية تخصصية معتمدة',
    createdBy: 'admin1',
    createdAt: '2026-01-10 10:30'
  },
  {
    id: 'QUAL-2026-003',
    employeeId: 1002,
    employeeName: 'م. أمل مفتاح الصابر العبيدي',
    fileNumber: '1002/م',
    recordType: 'مؤهل علمي',
    title: 'بكالوريوس تقنية مختبرات طبية',
    specialization: 'فحوصات الدم والمناعة والمختبرات',
    issuingAuthority: 'جامعة بنغازي - كلية التقنية الطبية',
    universityOrInstitute: 'جامعة بنغازي',
    educationType: 'جامعة عامة',
    graduationYear: '2013',
    completionDate: '2013-07-15',
    certificateNumber: 'LAB-BSC-4091',
    notes: 'تقدير ممتاز مع مرتبة الشرف',
    createdBy: 'admin1',
    createdAt: '2026-01-12 11:00'
  }
];

export const INITIAL_ORG_UNITS: OrganizationalUnit[] = DEPARTMENTS.map((dept, index) => ({
  id: `UNIT-${String(index + 1).padStart(3, '0')}`,
  unitName: dept,
  level: dept.includes('مكتب') ? 'مكتب' : dept.includes('إدارة') ? 'إدارة' : 'قسم',
  category: DEPT_CATEGORIES[dept] || 'إداري',
  active: true,
  sortOrder: index + 1
}));

export const INITIAL_JOB_TITLES: JobTitle[] = Object.entries(JOBS_BY_DEPT).flatMap(([dept, jobs], dIndex) =>
  jobs.map((job, jIndex) => ({
    id: `JOB-${String(dIndex + 1).padStart(2, '0')}-${String(jIndex + 1).padStart(2, '0')}`,
    departmentId: `UNIT-${String(dIndex + 1).padStart(3, '0')}`,
    jobTitle: job,
    category: DEPT_CATEGORIES[dept] || 'إداري',
    active: true,
    sortOrder: jIndex + 1
  }))
);

export const INITIAL_LOGS: AuditLog[] = [
  {
    id: 'LOG-1001',
    timestamp: '2026-08-05 08:31:12',
    user: 'admin1',
    action: 'تسجيل دخول',
    details: 'تسجيل دخول ناجح للمدير الأول'
  },
  {
    id: 'LOG-1002',
    timestamp: '2026-08-05 09:12:00',
    user: 'admin1',
    action: 'إجراء وظيفي',
    details: 'تسجيل إجازة سنوية للموظفة أمل العبيدي (1002/م)'
  }
];

export const DEMO_BULK_OPERATIONS: BulkOperationRecord[] = [
  {
    id: 'BULK-INC-2026-01',
    operationCode: 'INC-BULK-2026-01-142',
    actionType: 'ANNUAL_INCREMENT_DISBURSE',
    actionName: 'صرف العلاوة السنوية الدورية لشهر 01/2026',
    executionDate: '2026-01-15',
    executionTime: '11:20:00',
    executedAt: '2026-01-15T11:20:00Z',
    executedBy: 'المدير الإداري',
    affectedCount: 2,
    affectedEmployeeIds: [1001, 1002],
    status: 'SUCCESS',
    backupFileName: 'AutoBackup_Before_BulkInc_2026-01-15_142.zip',
    backupChecksum: 'CRC32-A9F1B2C3',
    isReversible: true,
    isUndone: false,
    preOperationSnapshot: [
      {
        id: 1001,
        fullName: 'أحمد خليفة سالم العبيدي',
        jobNumber: '1001/م',
        jobGrade: 'الدرجة التاسعة',
        gradeEntryDate: '2021-01-01',
        currentIncrement: 3,
        lastIncrementDate: '2024-01-01'
      },
      {
        id: 1002,
        fullName: 'أمل فرج مسعود البرعصي',
        jobNumber: '1002/م',
        jobGrade: 'الدرجة الثامنة',
        gradeEntryDate: '2022-01-01',
        currentIncrement: 2,
        lastIncrementDate: '2024-01-01'
      }
    ],
    details: {
      targetMonth: '01/2026',
      effectiveDate: '2026-01-15',
      calculationMethod: 'Anniversary Date',
      eligibleCount: 2,
      disbursedCount: 2
    },
    notes: 'تمت العملية بعد التحقق بكلمة المرور وحفظ نسخة احتياطية كاملة'
  }
];

export function generateLargeDataset(count: number = 100): Employee[] {
  const result: Employee[] = [...INITIAL_EMPLOYEES];
  const firstNames = ['محمد', 'علي', 'أحمد', 'عبدالله', 'سالم', 'محمود', 'مصطفى', 'عمر', 'إبراهيم', 'فاطمة', 'عائشة', 'زينب', 'مريم', 'سارة', 'أسماء'];
  const fatherNames = ['خليفة', 'فرج', 'صالح', 'مفتاح', 'سعيد', 'رمضان', 'ميلاد', 'حسن', 'عبدالقادر', 'مسعود'];
  const familyNames = ['العبيدي', 'البرعصي', 'الدرسي', 'الفيتوري', 'القطعاني', 'المنفي', 'الزواري', 'الحاسي', 'الشريف', 'الورفلي'];
  const cities = ['المرج', 'بنغازي', 'طبرق', 'شحات', 'البيضاء', 'درنة', 'طرابلس'];

  for (let i = INITIAL_EMPLOYEES.length + 1; i <= count; i++) {
    const fn = firstNames[Math.floor(Math.random() * firstNames.length)];
    const mn = fatherNames[Math.floor(Math.random() * fatherNames.length)];
    const sn = fatherNames[Math.floor(Math.random() * fatherNames.length)];
    const ln = familyNames[Math.floor(Math.random() * familyNames.length)];
    const isFemale = ['فاطمة', 'عائشة', 'زينب', 'مريم', 'سارة', 'أسماء'].includes(fn);

    const dept = DEPARTMENTS[i % DEPARTMENTS.length];
    const deptCategory = DEPT_CATEGORIES[dept] || 'إداري';
    const deptJobs = JOBS_BY_DEPT[dept] || ['موظف إداري'];
    const job = deptJobs[i % deptJobs.length];

    const hireYear = 2000 + (i % 22);
    const birthYear = 1970 + (i % 28);
    const currentGradeNum = 4 + (i % 8);

    const emp: Employee = {
      id: 1000 + i,
      jobNumber: `${1000 + i}/م`,
      nationality: 'ليبي',
      documentType: 'الرقم الوطني',
      nationalId: `${isFemale ? '2' : '1'}${birthYear}${String(i).padStart(7, '0')}`,
      passportNumber: '',
      fullName: `${fn} ${mn} ${sn} ${ln}`,
      motherName: `مريم ${fatherNames[(i + 2) % fatherNames.length]}`,
      birthDate: `${birthYear}-0${(i % 9) + 1}-15`,
      birthPlace: cities[i % cities.length],
      gender: isFemale ? 'أنثى' : 'ذكر',
      maritalStatus: i % 3 === 0 ? 'متزوج' : 'عزب',
      status: 'على رأس العمل',
      hireDate: `${hireYear}-01-10`,
      directingDate: `${hireYear}-02-01`,
      bloodBankStartDate: `${hireYear + 1}-03-01`,
      appointmentGrade: `الدرجة السادسة`,
      salaryScale: deptCategory === 'طبي' ? 'جدول العناصر الطبية المساعدة' : 'جدول المرتبات الموحد',
      jobGrade: `الدرجة ${String(currentGradeNum).padStart(2, '0')}`,
      currentIncrement: (i % 6) + 1,
      gradeEntryDate: `2021-01-01`,
      transactionType: 'ترقية عادية',
      eligibilityDate: `2025-01-01`,
      qualification: QUALIFICATIONS[i % QUALIFICATIONS.length],
      specialization: deptCategory === 'طبي' ? 'تقنية مختبرات وبنوك دم' : 'إدارة ومحاسبة',
      cadreNumber: `MLK-${String(1000 + i)}`,
      hiringEntity: HIRING_ENTITIES[i % HIRING_ENTITIES.length],
      assignmentCategory: deptCategory,
      department: dept,
      jobTitle: job,
      phone: `09${(i % 4) + 1}${String(1000000 + i).slice(0, 7)}`,
      email: `user${i}@bloodbank.marj.ly`,
      pdfPath: `/docs/${1000 + i}_doc.pdf`,
      pdfFileName: `ملف_${fn}_${ln}.pdf`,
      notes: `بيانات موظف مستوردة تلقائياً برقم ${1000 + i}`
    };

    result.push(emp);
  }

  return result;
}
