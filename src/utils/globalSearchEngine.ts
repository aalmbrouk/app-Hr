import { Employee, CareerPromotionRecord, ActiveTab } from '../types';

export type SearchCategory = 'employees' | 'reports' | 'tools' | 'features';

export interface SystemSearchItem {
  id: string;
  category: SearchCategory;
  title: string;
  subtitle?: string;
  description: string;
  aliases: string[];
  keywords: string[];
  targetTab?: ActiveTab;
  actionType: 'navigate_tab' | 'open_modal' | 'open_report' | 'open_procedure' | 'open_employee';
  actionPayload?: any;
  badge?: string;
}

export interface GlobalSearchResult {
  id: string;
  category: SearchCategory;
  title: string;
  subtitle?: string;
  description?: string;
  score: number;
  matchType: 
    | 'exact_id'
    | 'exact_name'
    | 'exact_title'
    | 'prefix'
    | 'fuzzy'
    | 'alias_match'
    | 'description_match'
    | 'keyword_match'
    | 'partial';
  matchDetail?: string;
  badge?: string;
  employee?: Employee;
  targetTab?: ActiveTab;
  actionType: 'navigate_tab' | 'open_modal' | 'open_report' | 'open_procedure' | 'open_employee';
  actionPayload?: any;
}

/**
 * Robust Arabic text normalization
 */
export function normalizeArabicSearchText(str: string | number | undefined | null): string {
  if (str === undefined || str === null) return '';
  let s = String(str).trim().toLowerCase();

  // Convert eastern arabic numerals (٠-٩) to western (0-9)
  const easternNumerals = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  for (let i = 0; i < 10; i++) {
    s = s.split(easternNumerals[i]).join(String(i));
  }

  // Remove diacritics / tashkeel
  s = s.replace(/[\u064B-\u065F\u0670]/g, '');

  // Remove tatweel (kashida)
  s = s.replace(/\u0640/g, '');

  // Normalize alef variants (أ, إ, آ -> ا)
  s = s.replace(/[أإآآ]/g, 'ا');

  // Normalize teh marbuta & heh (ة -> ه)
  s = s.replace(/ة/g, 'ه');

  // Normalize yaa variants (ى, ئ -> ي)
  s = s.replace(/[ىئ]/g, 'ي');

  // Normalize redundant spaces
  s = s.replace(/\s+/g, ' ');

  return s;
}

/**
 * Fast Levenshtein distance for fuzzy matching
 */
export function levenshteinDistance(a: string, b: string): number {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Calculates string similarity between 0 and 1
 */
export function calculateSimilarity(s1: string, s2: string): number {
  if (!s1 || !s2) return 0;
  if (s1 === s2) return 1;
  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;
  if (longer.length === 0) return 1.0;
  const dist = levenshteinDistance(longer, shorter);
  return (longer.length - dist) / longer.length;
}

/**
 * SYSTEM CATALOG: Complete index of Reports, Tools, Features, and Settings
 */
export const SYSTEM_SEARCH_ITEMS: SystemSearchItem[] = [
  // ==========================================
  // 1. REPORTS (التقارير)
  // ==========================================
  {
    id: 'report_competency',
    category: 'reports',
    title: 'تقرير كفاءة الموظف السنوي',
    subtitle: 'النموذج الرسمي المعتمد A4 لتقييم كفاءة الأداء الوظيفي',
    description: 'تقرير سنوي رسمي لتقييم كفاءة الموظف بالدرجة والنسبة المئوية والصفات الشخصية ومبررات الحكم على الكفاءة',
    aliases: [
      'تقرير كفاءة',
      'تقرير الكفاءة',
      'تقرير كفاءه',
      'تقرير الكفائة',
      'الكفائة',
      'الكفاءة',
      'كفاءة',
      'كفاءه',
      'كفاءة الموظف',
      'تقييم الكفاءة',
      'تقييم الكفائة',
      'تقييم الموظف',
      'تقرير التقييم',
      'التقييم السنوي',
      'الكفاءة السنوية',
      'تقارير الكفاءة السنوية',
      'تقرير الموظف السنوي',
      'كفاءة الاداء',
      'Annual Efficiency Report',
      'Employee Efficiency Report',
      'Performance Evaluation',
      'Competency Evaluation'
    ],
    keywords: ['كفاءة', 'تقييم', 'أداء', 'سنوي', 'درجة', 'نسبة', 'مدير', 'رسمي', 'a4', 'نموذج'],
    targetTab: 'annual_evaluations',
    actionType: 'open_report',
    badge: 'تقرير رسمي A4'
  },
  {
    id: 'report_employees_general',
    category: 'reports',
    title: 'تقرير الموظفين الشامل',
    subtitle: 'كشف الموظفين مع الفلاتر وتصدير Excel / PDF / Word',
    description: 'تقرير تفصيلي ببيانات الموظفين، الأقسام، الكادر الطبي، الدرجات الحالية، والوضع الوظيفي',
    aliases: [
      'تقرير الموظفين',
      'كشف الموظفين',
      'بيان الموظفين',
      'قائمة الموظفين',
      'طباعة الموظفين',
      'حصر الموظفين',
      'تقرير العاملين',
      'تقرير الكادر'
    ],
    keywords: ['موظفين', 'كشف', 'حصر', 'اسماء', 'اقسام', 'درجات', 'تقرير'],
    targetTab: 'reports',
    actionType: 'open_report',
    badge: 'تقرير'
  },
  {
    id: 'report_promotions_due',
    category: 'reports',
    title: 'تقرير المستحقين للترقية الوظيفية',
    subtitle: 'كشف المرشحين للترقيات مع شروط المباشرة والعلاوات واستحقاق الدرجة',
    description: 'تقرير استحقاق الترقية للموظفين الذين استوفوا المدة البينية والشروط والسنوات المحددة في اللوائح',
    aliases: [
      'تقرير الترقيات',
      'المستحقين للترقية',
      'كشف الترقيات',
      'تقرير استحقاق الترقية',
      'مرشحي الترقية',
      'ترقيات الموظفين',
      'تقرير الترقية'
    ],
    keywords: ['ترقية', 'ترقيات', 'استحقاق', 'درجة', 'مرشحين', 'مستحقين', 'كشف'],
    targetTab: 'reports',
    actionType: 'open_report',
    badge: 'تقرير ترقيات'
  },
  {
    id: 'report_leaves_summary',
    category: 'reports',
    title: 'تقرير الإجازات السنوية والمرضية',
    subtitle: 'كشف حركات وأرصدة الإجازات للموظفين ومتابعة فترات الغياب الرسمية',
    description: 'تقرير حركة الإجازات، الرصيد المستنفذ والمتبقي، الإجازات الطارئة والمرضية، ونماذج الخروج والعودة',
    aliases: [
      'تقرير الاجازات',
      'تقرير الإجازات',
      'كشف الإجازات',
      'رصيد الإجازات',
      'بيان الإجازات',
      'تقرير الغياب',
      'اجازات الموظفين'
    ],
    keywords: ['اجازة', 'إجازة', 'إجازات', 'غياب', 'رصيد', 'مرضية', 'سنوية', 'طارئة'],
    targetTab: 'reports',
    actionType: 'open_report',
    badge: 'تقرير إجازات'
  },
  {
    id: 'report_career_history',
    category: 'reports',
    title: 'تقرير السيرة والتدرج الوظيفي',
    subtitle: 'السجل التاريخي الشامل للقرارات والترقيات والعلاوات والتكليفات',
    description: 'كشف تاريخي متكامل يوثق مسار الموظف منذ التعيين وحتى الدرجة الحالية مع القرارات الرسمية',
    aliases: [
      'تقرير السيرة الوظيفية',
      'تقرير السيرة',
      'السجل التاريخي',
      'كشف التدرج الوظيفي',
      'تاريخ الموظف',
      'تقرير الحركات الوظيفية',
      'مسار الموظف'
    ],
    keywords: ['سيرة', 'مسار', 'تاريخ', 'تدرج', 'قرارات', 'ترقيات', 'حركات'],
    targetTab: 'reports',
    actionType: 'open_report',
    badge: 'تقرير تاريخي'
  },
  {
    id: 'report_outside_cadre',
    category: 'reports',
    title: 'تقرير خارج الملاك الوظيفي',
    subtitle: 'حصر الموظفين المنقولين، المنتدبين، أو خارج الملاك الإداري',
    description: 'كشف الموظفين الموجودين خارج الملاك الوظيفي المعتمد أو في إعارة أو تكليف خارجي',
    aliases: [
      'خارج الملاك',
      'تقرير خارج الملاك',
      'المعارين والمنتدبين',
      'خارج الهيكل'
    ],
    keywords: ['ملاك', 'خارج', 'انتداب', 'إعارة', 'تكليف'],
    targetTab: 'reports',
    actionType: 'open_report',
    badge: 'تقرير'
  },
  {
    id: 'report_employee_badge',
    category: 'reports',
    title: 'بطاقة الموظف التعريفية (Badge ID)',
    subtitle: 'طباعة بطاقة الهوية الوظيفية والباركود للموظف',
    description: 'إصدار وطباعة البطاقة التعريفية الرسمية للموظف مع بيانات القسم والرقم الوظيفي والدرجة',
    aliases: [
      'بطاقة الموظف',
      'بطاقة تعريفية',
      'طباعة باج',
      'باج الموظف',
      'شارة الموظف',
      'هوية الموظف',
      'ID Card',
      'Badge'
    ],
    keywords: ['بطاقة', 'باج', 'شارة', 'هوية', 'تعريفية', 'طباعة'],
    targetTab: 'employees',
    actionType: 'open_modal',
    badge: 'بطاقة'
  },

  // ==========================================
  // 2. TOOLS & PROCEDURES (الأدوات والإجراءات)
  // ==========================================
  {
    id: 'tool_audit_418',
    category: 'tools',
    title: 'تدقيق الدرجات وانتقال 418',
    subtitle: 'مراجعة توافق الدرجات والسجل التاريخي وانتقال الكادر الطبي للائحة 418',
    description: 'أداة تدقيق حسابات انتقال الدرجات للائحة 418 الطبية والمسار المهني وتوحيد سنوات الخدمة',
    aliases: [
      'تدقيق الدرجات',
      'تدقيق الدرجات وانتقال 418',
      'انتقال 418',
      'اللائحة 418',
      'لائحة 418',
      'كادر 418',
      'تدقيق 418',
      'تسوية 418',
      'مطابقة 418',
      'الدرجات التاريخية',
      'مراجعة الدرجات'
    ],
    keywords: ['418', 'تدقيق', 'لائحة', 'كادر', 'طبي', 'درجات', 'انتقال', 'تسوية', 'تاريخي'],
    targetTab: 'historical_418',
    actionType: 'open_procedure',
    badge: 'أداة تدقيق'
  },
  {
    id: 'tool_cleanup_records',
    category: 'tools',
    title: 'تنظيف السجلات التجريبية والاختبارية',
    subtitle: 'فحص وإزالة الموظفين الوهميين والسجلات غير الرسمية بأمان تام',
    description: 'أداة ذكية لفحص قاعدة البيانات وحذف السجلات التجريبية غير المؤكدة مع الحفاظ التام على 142 موظفاً معتمداً',
    aliases: [
      'تنظيف',
      'تنظيف السجلات التجريبية',
      'تنظيف السجلات',
      'حذف التجريبية',
      'السجلات الوهمية',
      'تنظيف القاعدة',
      'إزالة السجلات الاختبارية',
      'تنظيف موظفين',
      'تصفية السجلات التجريبية'
    ],
    keywords: ['تنظيف', 'تجريبية', 'اختبارية', 'حذف', 'وهمية', 'تصفية', 'قاعدة'],
    targetTab: 'general_procedures',
    actionType: 'open_procedure',
    actionPayload: 'open_cleanup_modal',
    badge: 'صيانة'
  },
  {
    id: 'tool_database_final_audit',
    category: 'tools',
    title: 'تدقيق نهائي للقاعدة وفحص النزاهة',
    subtitle: 'فحص شامل لسلامة الأرقام الوطنية والوظيفية والتواريخ والترقيات',
    description: 'مراجعة متكاملة لكافة سجلات قاعدة بيانات مصرف الدم والتحقق من عدم وجود تكرار أو أخطاء حسابية',
    aliases: [
      'تدقيق نهائي للقاعدة',
      'تدقيق القاعدة',
      'فحص قاعدة البيانات',
      'فحص البيانات',
      'نزاهة القاعدة',
      'سلامة البيانات',
      'تشخيص القاعدة',
      'فحص شامل',
      'مراجعة القاعدة'
    ],
    keywords: ['تدقيق', 'قاعدة', 'فحص', 'نزاهة', 'تكرار', 'سلامة', 'تشخيص'],
    targetTab: 'general_procedures',
    actionType: 'open_procedure',
    actionPayload: 'open_final_audit_modal',
    badge: 'تدقيق'
  },
  {
    id: 'tool_employee_review',
    category: 'tools',
    title: 'مراجعة وتدقيق بيانات الموظف',
    subtitle: 'فحص ملف الموظف والتأكد من مطابقة الرقم الوطني والدرجة والمباشرة',
    description: 'مراجعة دقيقة لملف الموظف الفردي والمطابقة الورقية مع الملفات الإدارية وإصدار تقرير التدقيق',
    aliases: [
      'مراجعة بيانات الموظف',
      'مراجعة الموظف',
      'تدقيق الموظف',
      'فحص الموظف',
      'مطابقة بيانات الموظف',
      'مراجعة الملف'
    ],
    keywords: ['مراجعة', 'تدقيق', 'مطابقة', 'ملف', 'موظف', 'تحقق'],
    targetTab: 'general_procedures',
    actionType: 'open_procedure',
    actionPayload: 'open_review_modal',
    badge: 'إجراء إداري'
  },
  {
    id: 'tool_excel_import',
    category: 'tools',
    title: 'استيراد بيانات من ملف Excel',
    subtitle: 'رفع ملف إكسل ومطابقة الأعمدة وتحديث السجلات والبيانات الوظيفية',
    description: 'معالج استيراد بيانات الموظفين والسجل التاريخي مع التحقق التلقائي من الأرقام الوطنية ومنع التكرار',
    aliases: [
      'استيراد Excel',
      'استيراد اكسل',
      'استيراد إكسل',
      'رفع Excel',
      'رفع اكسل',
      'ادخال Excel',
      'تحميل Excel',
      'رفع ملف Excel',
      'استيراد الموظفين',
      'تحديث من Excel',
      'Excel Import'
    ],
    keywords: ['استيراد', 'اكسل', 'إكسل', 'excel', 'رفع', 'ملف', 'استيراد موظفين'],
    targetTab: 'general_procedures',
    actionType: 'open_procedure',
    actionPayload: 'open_import_modal',
    badge: 'استيراد'
  },
  {
    id: 'tool_system_backup',
    category: 'tools',
    title: 'النسخ الاحتياطي لقاعدة البيانات',
    subtitle: 'حفظ وتصدير نسخة احتياطية آمنة وشاملة لكافة البيانات والملفات',
    description: 'توليد ملف نسخة احتياطية مشفرة بضغطة زر واحدة تشمل كافة الموظفين والترقيات والقرارات والإجازات',
    aliases: [
      'النسخ الاحتياطي',
      'نسخ احتياطي',
      'تصدير نسخة احتياطية',
      'حفظ نسخة',
      'باك اب',
      'باكاب',
      'Backup',
      'Quick Backup'
    ],
    keywords: ['نسخ', 'احتياطي', 'تصدير', 'حفظ', 'باكاب', 'backup', 'قاعدة'],
    targetTab: 'backup',
    actionType: 'open_modal',
    badge: 'أمان البيانات'
  },
  {
    id: 'tool_system_restore',
    category: 'tools',
    title: 'استعادة قاعدة البيانات',
    subtitle: 'استرجاع النظام من نسخة احتياطية سابقة مع فحص السلامة والمطابقة',
    description: 'استعادة كاملة وموثوقة لقاعدة البيانات من ملف نسخة احتياطية سابق مع مراجعة الفروقات قبل الاعتماد',
    aliases: [
      'الاستعادة',
      'استعادة',
      'استعادة قاعدة البيانات',
      'استرجاع نسخة',
      'استرجاع البيانات',
      'Restore',
      'Database Restore'
    ],
    keywords: ['استعادة', 'استرجاع', 'نسخة', 'سابق', 'restore', 'قاعدة'],
    targetTab: 'backup',
    actionType: 'open_modal',
    badge: 'أمان البيانات'
  },
  {
    id: 'tool_vba_exporter',
    category: 'tools',
    title: 'أكواد VBA ووحدات الماكرو Excel',
    subtitle: 'تصدير شفرات VBA البرمجية المتوافقة مع ملفات إكسل للمصرف',
    description: 'مكتبة أكواد VBA المتطورة لتوليد وحساب الترقيات والعلاوات في نماذج إكسل الرسمية',
    aliases: [
      'اكواد vba',
      'أكواد VBA',
      'ماكرو',
      'vba',
      'VBA',
      'تصدير vba',
      'شفرات vba',
      'تصدير ماكرو'
    ],
    keywords: ['vba', 'ماكرو', 'اكسل', 'كود', 'برمجة', 'شفرات'],
    targetTab: 'vba_code',
    actionType: 'open_procedure',
    badge: 'VBA'
  },
  {
    id: 'tool_bulk_increment',
    category: 'tools',
    title: 'منح علاوة سنوية جماعية / فردية',
    subtitle: 'إجراءات استحقاق العلاوات السنوية وتحديث قيمها وتواريخ الاستحقاق القادم',
    description: 'إجراء إداري لإضافة علاوة سنوية للموظفين المستحقين مع التوثيق في سجل التدقيق وإمكانية التراجع',
    aliases: [
      'إضافة علاوة',
      'اضافة علاوة',
      'علاوة سنوية',
      'منح علاوة',
      'العلاوات السنوية',
      'علاوة الموظفين',
      'علاوه'
    ],
    keywords: ['علاوة', 'علاوات', 'سنوية', 'منح', 'استحقاق', 'زيادة'],
    targetTab: 'promotions',
    actionType: 'open_procedure',
    badge: 'إجراء'
  },
  {
    id: 'tool_cancel_increment',
    category: 'tools',
    title: 'إلغاء أو تعديل علاوة سنوية (تراجع)',
    subtitle: 'إلغاء حركة علاوة معتمدة بالخطأ واسترجاع الرصيد السابق',
    description: 'أداة التراجع عن العمليات الجماعية أو إلغاء علاوة فردية وإعادة الوضع إلى ما كان عليه',
    aliases: [
      'إلغاء علاوة',
      'الغاء علاوة',
      'تراجع عن علاوة',
      'تعديل علاوة',
      'سحب علاوة'
    ],
    keywords: ['إلغاء', 'تراجع', 'علاوة', 'سحب', 'تعديل'],
    targetTab: 'general_procedures',
    actionType: 'open_procedure',
    badge: 'إجراء'
  },
  {
    id: 'tool_add_leave_balance',
    category: 'tools',
    title: 'إضافة وتعديل رصيد الإجازات',
    subtitle: 'إدراج الرصيد السنوي للموظف وتسجيل الإجازات الاستثنائية والطارئة',
    description: 'إدارة رصيد الإجازات السنوي والخصومات والتسويات حسب لوائح الخدمة المدنية',
    aliases: [
      'إضافة رصيد إجازات',
      'اضافة رصيد اجازات',
      'تعديل رصيد الإجازات',
      'شحن رصيد اجازة',
      'تعديل رصيد اجازات'
    ],
    keywords: ['رصيد', 'اجازات', 'إجازات', 'إضافة', 'سنوي'],
    targetTab: 'leaves',
    actionType: 'open_procedure',
    badge: 'إجراء'
  },

  // ==========================================
  // 3. FEATURES & SETTINGS (الخصائص والإعدادات)
  // ==========================================
  {
    id: 'feature_promotions_increments',
    category: 'features',
    title: 'الترقيات الوظيفية والعلاوات',
    subtitle: 'إدارة مسار الترقيات والدرجات والتسويات المالية',
    description: 'شاشة متكاملة لحساب مدد استحقاق الترقية وتطبيق قرارات الترفيع وتعديل الدرجات والتحقق من القرارات',
    aliases: [
      'الترقيات',
      'الترقيات الوظيفية',
      'ترقيات',
      'ترقيه',
      'ترقية',
      'العلاوات',
      'العلاوات والترقيات',
      'درجات الموظفين',
      'استحقاق الترقية'
    ],
    keywords: ['ترقية', 'ترقيات', 'علاوة', 'علاوات', 'درجة', 'ترفيع', 'تسوية'],
    targetTab: 'promotions',
    actionType: 'navigate_tab',
    badge: 'خاصية أساسية'
  },
  {
    id: 'feature_leaves_management',
    category: 'features',
    title: 'إدارة الإجازات والغياب',
    subtitle: 'طلب إجازة، اعتماد الإجازات، وتتبع الأرصدة والنماذج الرسمية',
    description: 'إدارة الإجازات السنوية والمرضية والطارئة وحج وعمرة، وإصدار نماذج الإجازات الرسمية للطباعة',
    aliases: [
      'الإجازات',
      'الاجازات',
      'إجازات',
      'اجازات',
      'اجازة',
      'إجازة',
      'طلب إجازة',
      'غياب',
      'رصيد الإجازات'
    ],
    keywords: ['إجازة', 'إجازات', 'اجازات', 'سنوية', 'مرضية', 'رصيد', 'غياب'],
    targetTab: 'leaves',
    actionType: 'navigate_tab',
    badge: 'خاصية أساسية'
  },
  {
    id: 'feature_career_history',
    category: 'features',
    title: 'السيرة الوظيفية والتاريخ المهني',
    subtitle: 'سجل الحركات الوظيفية، التكليف، النقل، والندب لكل موظف',
    description: 'ملف التتبع الزمني لكافة الأحداث الوظيفية والقرارات والندب والإعارة وتاريخ الدرجات',
    aliases: [
      'السيرة الوظيفية',
      'السيره الوظيفيه',
      'السيرة',
      'التاريخ الوظيفي',
      'السجل الوظيفي',
      'الحركات الوظيفية',
      'مكان الموظف',
      'موقع الموظف',
      'أين الموظف',
      'تعديل ترقية',
      'إضافة حركة وظيفية',
      'تعديل حركة وظيفية'
    ],
    keywords: ['سيرة', 'تاريخ', 'مسار', 'حركة', 'تكليف', 'نقل', 'ندب', 'مكان', 'موقع'],
    targetTab: 'history',
    actionType: 'navigate_tab',
    badge: 'خاصية أساسية'
  },
  {
    id: 'feature_employees_list',
    category: 'features',
    title: 'قائمة وسجلات الموظفين',
    subtitle: 'إضافة موظف، تعديل البيانات، والبحث في الكادر الإداري والطبي',
    description: 'شاشة الإدارة المركزية لبيانات 142 موظفاً مع الفلترة حسب الكادر والدرجة والقسم',
    aliases: [
      'الموظفون',
      'الموظفين',
      'سجل الموظفين',
      'بيانات الموظفين',
      'إضافة موظف',
      'ملف الموظف',
      'تعديل موظف'
    ],
    keywords: ['موظف', 'موظفون', 'موظفين', 'اضافة', 'تعديل', 'اسماء'],
    targetTab: 'employees',
    actionType: 'navigate_tab',
    badge: 'خاصية أساسية'
  },
  {
    id: 'feature_secondments',
    category: 'features',
    title: 'الندب والتكليف والإعارة',
    subtitle: 'متابعة قرارات الندب الخارجي والداخلي والتكليفات الإدارية',
    description: 'تسجيل وإدارة قرارات الانتداب والتكليف إلى جهات خارج المصرف أو تكليفات المهام الخاصة',
    aliases: [
      'الندب',
      'التكليف',
      'الإعارة',
      'الندب والتكليف',
      'التكليفات',
      'الندب والإعارة',
      'الانتداب'
    ],
    keywords: ['ندب', 'انتداب', 'تكليف', 'إعارة', 'خارجي', 'داخلي'],
    targetTab: 'secondments',
    actionType: 'navigate_tab',
    badge: 'شؤون إدارية'
  },
  {
    id: 'feature_transfers',
    category: 'features',
    title: 'حركات النقل وأماكن العمل',
    subtitle: 'إدارة النقل بين الأقسام والوحدات والمراكز التابعة لمصرف الدم',
    description: 'توثيق قرارات النقل الداخلي والخارجي وتغيير أماكن ومواقع العمل للموظفين',
    aliases: [
      'النقل',
      'حركات النقل',
      'نقل موظف',
      'اماكن العمل',
      'أماكن العمل',
      'مواقع العمل',
      'تغيير القسم',
      'النقل الداخلي'
    ],
    keywords: ['نقل', 'مكان', 'موقع', 'قسم', 'وحدة', 'حركة'],
    targetTab: 'transfers',
    actionType: 'navigate_tab',
    badge: 'شؤون إدارية'
  },
  {
    id: 'feature_org_structure',
    category: 'features',
    title: 'الهيكل التنظيمي والوظائف المعتمدة',
    subtitle: 'تعديل مسميات الأقسام والوحدات والوظائف الإدارية والطبية',
    description: 'إدارة الهيكل التنظيمي المعتمد لمصرف الدم المركزي بالمرج والمسميات الوظيفية والوحدات',
    aliases: [
      'الهيكل التنظيمي',
      'الهيكل',
      'الوظائف',
      'الأقسام',
      'الاقسام',
      'الوحدات',
      'المسميات الوظيفية',
      'الوحدات التنظيمية'
    ],
    keywords: ['هيكل', 'تنظيمي', 'اقسام', 'مسميات', 'وظائف', 'وحدات'],
    targetTab: 'org_structure',
    actionType: 'navigate_tab',
    badge: 'إعدادات'
  },
  {
    id: 'feature_promotion_rules',
    category: 'features',
    title: 'قواعد وإعدادات الترقية والمدد البينية',
    subtitle: 'ضبط شروط الترقية، سنوات الاستحقاق، ومعايير الكفاءة لكل درجة',
    description: 'تخصيص قواعد مدد البقاء في الدرجة، سنوات الانتقال للائحة 418، وشروط الكفاءة والعلاوات',
    aliases: [
      'إعدادات الترقية',
      'قواعد الترقية',
      'شروط الترقية',
      'لوائح الترقية',
      'المدد البينية',
      'سنوات الترقية',
      'قواعد الترقيات'
    ],
    keywords: ['قواعد', 'ترقية', 'شروط', 'مدد', 'بينية', 'سنوات', 'كفاءة'],
    targetTab: 'hr_rules',
    actionType: 'navigate_tab',
    badge: 'لوائح'
  },
  {
    id: 'feature_hr_rules',
    category: 'features',
    title: 'قواعد ولوائح الموارد البشرية (HR Rules)',
    subtitle: 'لوائح الخدمة المدنية، مدد الإجازات، وشروط العلاوات المعتمدة',
    description: 'إعدادات ثوابت النظام القانونية وفق التشريعات الليبية المنظمة للعاملين بالقطاع الصحي',
    aliases: [
      'قواعد الإجازات',
      'لوائح الإجازات',
      'قواعد النظام',
      'لوائح الموارد البشرية',
      'قوانين الخدمة',
      'HR Rules'
    ],
    keywords: ['لوائح', 'قواعد', 'قانون', 'خدمة', 'مدنية', 'حدود'],
    targetTab: 'hr_rules',
    actionType: 'navigate_tab',
    badge: 'لوائح'
  },
  {
    id: 'feature_user_management',
    category: 'features',
    title: 'المستخدمون والصلاحيات',
    subtitle: 'إدارة حسابات مستخدمي النظام وكلمات المرور ومستويات الوصول',
    description: 'التحكم في حسابات مسؤولي الموارد البشرية ومدراء الأقسام وتعيين الصلاحيات',
    aliases: [
      'المستخدمين',
      'المستخدمون والصلاحيات',
      'المستخدمين والصلاحيات',
      'الصلاحيات',
      'كلمات المرور',
      'حسابات المستخدمين',
      'مدراء النظام'
    ],
    keywords: ['مستخدم', 'مستخدمين', 'صلاحيات', 'مرور', 'أمان', 'حساب'],
    targetTab: 'users',
    actionType: 'navigate_tab',
    badge: 'أمان'
  },
  {
    id: 'feature_audit_logs',
    category: 'features',
    title: 'سجل تدقيق العمليات (Audit Logs)',
    subtitle: 'سجل المراقبة الزمنية لكافة الإضافات والتعديلات والعمليات الإدارية',
    description: 'سجل أمني تفصيلي يوثق اسم المستخدم ووقت وتفاصيل أي تعديل أو حذف أو تصدير تم بالنظام',
    aliases: [
      'سجل التدقيق',
      'سجل العمليات',
      'سجل الأنشطة',
      'التدقيق',
      'مراقبة العمليات',
      'Audit Logs',
      'Logs'
    ],
    keywords: ['سجل', 'تدقيق', 'عمليات', 'أنشطة', 'مراقبة', 'تاريخ', 'audit'],
    targetTab: 'logs',
    actionType: 'navigate_tab',
    badge: 'تدقيق'
  },
  {
    id: 'feature_statistics',
    category: 'features',
    title: 'الإحصاءات والرسوم البيانية',
    subtitle: 'لوحات قياس ومؤشرات توزيع الموظفين والأقسام والدرجات والكادر',
    description: 'رسوم بيانية وإحصائيات تفاعلية لتوزيع القوى العاملة ونسب الذكور والإناث والكادر الطبي',
    aliases: [
      'الإحصاءات',
      'الاحصاءات',
      'إحصائيات',
      'احصائيات',
      'الرسوم البيانية',
      'مؤشرات الأداء',
      'لوحة القياس',
      'توزيع الموظفين'
    ],
    keywords: ['إحصاءات', 'بيانية', 'رسوم', 'توزيع', 'مؤشرات', 'مخطط'],
    targetTab: 'statistics',
    actionType: 'navigate_tab',
    badge: 'مؤشرات'
  },
  {
    id: 'feature_system_settings',
    category: 'features',
    title: 'إعدادات النظام ومعلومات المصرف',
    subtitle: 'تعديل اسم المؤسسة، المدير العام، الشعار الرسمي، ومسارات التخزين',
    description: 'لوحة الإعدادات العامة لمصرف الدم المركزي بالمرج ومعلومات الترويسة الرسمية في التقارير',
    aliases: [
      'إعدادات النظام',
      'اعدادات النظام',
      'الإعدادات',
      'اعدادات المصرف',
      'اسم المصرف',
      'شعار المصرف',
      'اسم المدير'
    ],
    keywords: ['إعدادات', 'نظام', 'مصرف', 'مدير', 'شعار', 'ترويسة'],
    targetTab: 'backup',
    actionType: 'navigate_tab',
    badge: 'إعدادات'
  }
];

/**
 * Universal Global Smart Search Engine
 * Searches across:
 * - Employees (with priority scoring)
 * - Reports (with fuzzy matching & aliases)
 * - Tools & Procedures (with fuzzy matching & aliases)
 * - Features & Settings (with fuzzy matching & aliases)
 */
export function globalSmartSearch(
  query: string,
  employees: Employee[],
  careerRecords: CareerPromotionRecord[] = [],
  maxResults: number = 24
): GlobalSearchResult[] {
  if (!query || !query.trim()) {
    return [];
  }

  const rawTrimmed = query.trim();
  const normalizedQuery = normalizeArabicSearchText(rawTrimmed);
  if (!normalizedQuery) return [];

  const queryWords = normalizedQuery.split(' ').filter(Boolean);
  const results: GlobalSearchResult[] = [];

  // ============================================================
  // A. Search System Items (Reports, Tools, Features, Settings)
  // ============================================================
  for (const item of SYSTEM_SEARCH_ITEMS) {
    const normTitle = normalizeArabicSearchText(item.title);
    const normSub = normalizeArabicSearchText(item.subtitle);
    const normDesc = normalizeArabicSearchText(item.description);
    const normAliases = item.aliases.map(normalizeArabicSearchText);
    const normKeywords = item.keywords.map(normalizeArabicSearchText);

    let score = 0;
    let matchType: GlobalSearchResult['matchType'] | null = null;
    let matchDetail: string | undefined = undefined;

    // 1. Exact match on title or alias
    if (normTitle === normalizedQuery) {
      score = 950;
      matchType = 'exact_title';
      matchDetail = 'تطابق اسم تام';
    } else if (normAliases.includes(normalizedQuery)) {
      score = 920;
      matchType = 'alias_match';
      matchDetail = 'مرادف مطابق تماماً';
    }
    // 2. Title starts with query
    else if (normTitle.startsWith(normalizedQuery)) {
      score = 850;
      matchType = 'prefix';
      matchDetail = 'يبدأ باسم الخاصية';
    }
    // 3. Title contains query
    else if (normTitle.includes(normalizedQuery)) {
      score = 750;
      matchType = 'partial';
      matchDetail = 'مطابقة في العنوان';
    }
    // 4. Any alias contains query or query contains alias
    else {
      const matchedAlias = normAliases.find(a => a.includes(normalizedQuery) || normalizedQuery.includes(a));
      if (matchedAlias) {
        score = 700;
        matchType = 'alias_match';
        matchDetail = 'مطابقة في المرادفات الشائعة';
      }
    }

    // 5. Check multi-word matching in title / subtitle
    if (!matchType && queryWords.length > 1) {
      const combinedTitle = `${normTitle} ${normSub}`;
      if (queryWords.every(w => combinedTitle.includes(w))) {
        score = 650;
        matchType = 'partial';
        matchDetail = 'تطابق كلمات الخاصية';
      }
    }

    // 6. Fuzzy matching on title and aliases (Levenshtein typo tolerance)
    if (!matchType && normalizedQuery.length >= 3) {
      // Check similarity with title
      const titleSim = calculateSimilarity(normTitle, normalizedQuery);
      if (titleSim >= 0.72) {
        score = Math.round(titleSim * 700);
        matchType = 'fuzzy';
        matchDetail = 'تطابق تقريبي بالاسم';
      } else {
        // Check similarity with aliases
        for (const al of normAliases) {
          const sim = calculateSimilarity(al, normalizedQuery);
          if (sim >= 0.72) {
            score = Math.round(sim * 680);
            matchType = 'fuzzy';
            matchDetail = `مطابقة تقريبية: ${al}`;
            break;
          }
        }
      }
    }

    // 7. Search in description / purpose ("I don't remember the name" scenario)
    if (!matchType) {
      if (normDesc.includes(normalizedQuery)) {
        score = 550;
        matchType = 'description_match';
        matchDetail = 'مطابقة في وصف ووظيفة الخاصية';
      } else if (queryWords.length > 1 && queryWords.every(w => normDesc.includes(w))) {
        score = 500;
        matchType = 'description_match';
        matchDetail = 'مطابقة كلمات الوصف';
      }
    }

    // 8. Search in keywords
    if (!matchType) {
      const matchedKw = normKeywords.find(k => k.includes(normalizedQuery) || normalizedQuery.includes(k));
      if (matchedKw) {
        score = 420;
        matchType = 'keyword_match';
        matchDetail = `كلمة دلالية: ${matchedKw}`;
      }
    }

    if (matchType && score > 0) {
      results.push({
        id: item.id,
        category: item.category,
        title: item.title,
        subtitle: item.subtitle,
        description: item.description,
        score,
        matchType,
        matchDetail,
        badge: item.badge,
        targetTab: item.targetTab,
        actionType: item.actionType,
        actionPayload: item.actionPayload
      });
    }
  }

  // ============================================================
  // B. Search Employees
  // ============================================================
  // Build employee career cache if needed
  const careerByEmpId = new Map<number, CareerPromotionRecord[]>();
  for (const cr of careerRecords) {
    const list = careerByEmpId.get(cr.employeeId) || [];
    list.push(cr);
    careerByEmpId.set(cr.employeeId, list);
  }

  for (const emp of employees) {
    const rawNatId = (emp.nationalId || '').trim();
    const rawJobNum = String(emp.jobNumber || '').trim();
    const normalizedName = normalizeArabicSearchText(emp.fullName);
    const normalizedDept = normalizeArabicSearchText(emp.department);
    const normalizedLoc = normalizeArabicSearchText(emp.workLocation);
    const normalizedTitle = normalizeArabicSearchText(emp.jobTitle);
    const normalizedQual = normalizeArabicSearchText(emp.qualification);
    const empCareer = careerByEmpId.get(emp.id) || [];

    let score = 0;
    let matchType: GlobalSearchResult['matchType'] | null = null;
    let matchDetail: string | undefined = undefined;

    // 1. Exact National ID
    if (rawNatId && rawNatId === rawTrimmed) {
      score = 1000;
      matchType = 'exact_id';
      matchDetail = `تطابق رقم وطني تام: ${rawNatId}`;
    }
    // 2. Exact Job Number
    else if (rawJobNum && rawJobNum === rawTrimmed) {
      score = 900;
      matchType = 'exact_id';
      matchDetail = `تطابق رقم وظيفي تام: ${rawJobNum}`;
    }
    // 3. Exact employee name
    else if (normalizedName === normalizedQuery) {
      score = 880;
      matchType = 'exact_name';
      matchDetail = 'تطابق تام للاسم';
    }
    // 4. Name prefix
    else if (normalizedName.startsWith(normalizedQuery)) {
      score = 750;
      matchType = 'prefix';
      matchDetail = 'يبدأ باسم الموظف';
    }
    // 5. Partial name / all words present
    else if (normalizedName.includes(normalizedQuery)) {
      score = 650;
      matchType = 'partial';
      matchDetail = 'مطابقة في اسم الموظف';
    } else if (queryWords.length > 1 && queryWords.every(w => normalizedName.includes(w))) {
      score = 600;
      matchType = 'partial';
      matchDetail = 'تطابق كلمات الاسم';
    }
    // 6. Fuzzy name match (typos in names like "احمد" vs "أحمد" or transposed letters)
    else if (normalizedQuery.length >= 4) {
      const nameParts = normalizedName.split(' ');
      let bestSim = 0;
      for (const part of nameParts) {
        const sim = calculateSimilarity(part, normalizedQuery);
        if (sim > bestSim) bestSim = sim;
      }
      if (bestSim >= 0.75) {
        score = Math.round(bestSim * 580);
        matchType = 'fuzzy';
        matchDetail = 'تطابق تقريبي للاسم';
      }
    }

    // 7. Partial National ID or Job Number
    if (!matchType) {
      if (rawNatId && rawNatId.includes(rawTrimmed)) {
        score = 520;
        matchType = 'exact_id';
        matchDetail = `مطابقة جزئية للرقم الوطني: ${rawNatId}`;
      } else if (rawJobNum && rawJobNum.includes(rawTrimmed)) {
        score = 480;
        matchType = 'exact_id';
        matchDetail = `مطابقة جزئية للرقم الوظيفي: ${rawJobNum}`;
      }
    }

    // 8. Department / Location / Assignment
    if (!matchType) {
      if (normalizedDept.includes(normalizedQuery)) {
        score = 410;
        matchType = 'partial';
        matchDetail = `القسم: ${emp.department}`;
      } else if (normalizedLoc.includes(normalizedQuery)) {
        score = 390;
        matchType = 'partial';
        matchDetail = `مكان العمل: ${emp.workLocation}`;
      } else {
        const asgn = empCareer.find(cr => 
          normalizeArabicSearchText(cr.assignmentTitle).includes(normalizedQuery) ||
          normalizeArabicSearchText(cr.assignmentRole).includes(normalizedQuery) ||
          normalizeArabicSearchText(cr.secondmentEntity).includes(normalizedQuery) ||
          normalizeArabicSearchText(cr.newWorkLocation).includes(normalizedQuery)
        );
        if (asgn) {
          score = 360;
          matchType = 'partial';
          matchDetail = `التكليف/الموقع: ${asgn.assignmentTitle || asgn.secondmentEntity || asgn.newWorkLocation}`;
        }
      }
    }

    // 9. Job title / Qualification / Current Grade
    if (!matchType) {
      if (normalizedTitle.includes(normalizedQuery)) {
        score = 320;
        matchType = 'partial';
        matchDetail = `المسمى: ${emp.jobTitle}`;
      } else if (normalizedQual.includes(normalizedQuery)) {
        score = 300;
        matchType = 'partial';
        matchDetail = `المؤهل: ${emp.qualification}`;
      } else if (String(emp.jobGrade || '').trim() === rawTrimmed) {
        score = 290;
        matchType = 'partial';
        matchDetail = `الدرجة الوظيفية: ${emp.jobGrade}`;
      }
    }

    if (matchType && score > 0) {
      results.push({
        id: `emp_${emp.id}`,
        category: 'employees',
        title: emp.fullName,
        subtitle: `رقم وظيفي: ${emp.jobNumber || '—'} | الرقم الوطني: ${emp.nationalId || '—'}`,
        description: `${emp.department || 'عام'} - ${emp.jobTitle || 'موظف'} (الدرجة ${emp.jobGrade || '—'})`,
        score,
        matchType,
        matchDetail,
        badge: emp.status || 'على رأس العمل',
        employee: emp,
        actionType: 'open_employee',
        targetTab: 'employees'
      });
    }
  }

  // Sort strictly by descending priority score
  results.sort((a, b) => b.score - a.score);

  return results.slice(0, maxResults);
}

/**
 * Group search results by Category
 */
export function groupSearchResultsByCategory(results: GlobalSearchResult[]): {
  employees: GlobalSearchResult[];
  reports: GlobalSearchResult[];
  tools: GlobalSearchResult[];
  features: GlobalSearchResult[];
} {
  return {
    employees: results.filter(r => r.category === 'employees'),
    reports: results.filter(r => r.category === 'reports'),
    tools: results.filter(r => r.category === 'tools'),
    features: results.filter(r => r.category === 'features')
  };
}
