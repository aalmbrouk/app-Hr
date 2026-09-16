import { 
  Employee, 
  CareerPromotionRecord, 
  CareerActionType, 
  CareerSummary,
  PromotionRecord,
  IncrementRecord,
  StatusSettlementRecord,
  TransferRecord,
  SecondmentRecord
} from '../types';
import { JOB_GRADES } from '../data/initialData';

/**
 * List of recognized Regulation 418 medical and allied-health grades
 */
export const REGULATION_418_GRADES = [
  'معاون صحي رابع',
  'معاون صحي ثالث',
  'معاون صحي ثاني',
  'معاون صحي أول',
  'معاون صحي',
  'فني صحي رابع',
  'فني صحي ثالث',
  'فني صحي ثاني',
  'فني صحي أول',
  'فني رابع',
  'فني ثالث',
  'فني ثاني',
  'فني أول',
  'كبير فنيين',
  'طبيب ثالث',
  'طبيب ثاني',
  'طبيب أول',
  'أخصائي',
  'استشاري',
  'ممرض رابع',
  'ممرض ثالث',
  'ممرض ثاني',
  'ممرض أول',
  'مشرف تمريض'
];

/**
 * General Numerical Grades Map (الدرجة الأولى إلى الخامسة عشرة)
 */
export const NUMERICAL_GRADES_MAP: Record<string, number> = {
  'الأولى': 1,
  'الدرجة الأولى': 1,
  'الثانية': 2,
  'الدرجة الثانية': 2,
  'الثالثة': 3,
  'الدرجة الثالثة': 3,
  'الرابعة': 4,
  'الدرجة الرابعة': 4,
  'الخامسة': 5,
  'الدرجة الخامسة': 5,
  'السادسة': 6,
  'الدرجة السادسة': 6,
  'السابعة': 7,
  'الدرجة السابعة': 7,
  'الثامنة': 8,
  'الدرجة الثامنة': 8,
  'التاسعة': 9,
  'الدرجة التاسعة': 9,
  'العاشرة': 10,
  'الدرجة العاشرة': 10,
  'الحادية عشر': 11,
  'الحادية عشرة': 11,
  'الدرجة الحادية عشر': 11,
  'الدرجة الحادية عشرة': 11,
  'الثانية عشر': 12,
  'الثانية عشرة': 12,
  'الدرجة الثانية عشر': 12,
  'الدرجة الثانية عشرة': 12,
  'الثالثة عشر': 13,
  'الثالثة عشرة': 13,
  'الدرجة الثالثة عشر': 13,
  'الدرجة الثالثة عشرة': 13,
  'الرابعة عشر': 14,
  'الرابعة عشرة': 14,
  'الدرجة الرابعة عشر': 14,
  'الدرجة الرابعة عشرة': 14,
  'الخامسة عشر': 15,
  'الخامسة عشرة': 15,
  'الدرجة الخامسة عشر': 15,
  'الدرجة الخامسة عشرة': 15
};

/**
 * Checks if a given grade belongs to the historical Regulation 418 classification system
 */
export function isRegulation418Grade(grade?: string): boolean {
  if (!grade) return false;
  const trimmed = grade.trim();
  if (REGULATION_418_GRADES.some(g => trimmed === g || trimmed.includes(g))) return true;
  if (trimmed.includes('418') || trimmed.includes('لائحة 418') || trimmed.includes('اللائحة 418')) return true;
  if (trimmed.includes('معاون') || trimmed.includes('فني صحي') || (trimmed.startsWith('فني') && !trimmed.includes('حاسوب') && !trimmed.includes('ميكانيك')) || trimmed.startsWith('طبيب') || trimmed === 'أخصائي' || trimmed === 'كبير فنيين') return true;
  return false;
}

/**
 * Checks if a given grade belongs to the General Numerical Grade System
 */
export function isGeneralNumericalGrade(grade?: string): boolean {
  if (!grade) return false;
  const trimmed = grade.trim();
  const clean = trimmed.replace('الدرجة', '').trim();
  if (NUMERICAL_GRADES_MAP[trimmed] !== undefined || NUMERICAL_GRADES_MAP[clean] !== undefined) {
    return true;
  }
  // Check if string contains numerical pattern like "الدرجة 8" or "درجة 7"
  const match = trimmed.match(/\b(1[0-5]|[1-9])\b/);
  return !!match && (trimmed.includes('درجة') || trimmed.includes('الدرجة'));
}

/**
 * Gets the numeric rank for a General Numerical Grade (1 to 15)
 */
export function getGeneralNumericalRank(grade?: string): number | null {
  if (!grade) return null;
  const trimmed = grade.trim();
  const clean = trimmed.replace('الدرجة', '').trim();
  if (NUMERICAL_GRADES_MAP[trimmed] !== undefined) return NUMERICAL_GRADES_MAP[trimmed];
  if (NUMERICAL_GRADES_MAP[clean] !== undefined) return NUMERICAL_GRADES_MAP[clean];
  const match = trimmed.match(/\b(1[0-5]|[1-9])\b/);
  if (match) {
    const num = parseInt(match[1], 10);
    if (num >= 1 && num <= 15) return num;
  }
  return null;
}

/**
 * Normalizes any action type string to a valid CareerActionType
 */
export function normalizeCareerActionType(type?: string): CareerActionType {
  if (!type) return 'ترقية';
  const trimmed = type.trim();
  if (
    trimmed.includes('418') || 
    trimmed.includes('تحويل من نظام 418') || 
    trimmed.includes('تحويل من اللائحة 418') || 
    trimmed.includes('تحويل/تسوية من نظام 418') || 
    trimmed.includes('انتقال من نظام 418') ||
    trimmed.includes('تسوية 418')
  ) {
    return 'تحويل من اللائحة 418 إلى نظام الدرجات العامة';
  }
  if (trimmed === 'ندب على درجة' || trimmed === 'ندب وظيفي على درجة') return 'ندب على درجة';
  if (trimmed.includes('تكليف') && (trimmed.includes('إنهاء') || trimmed.includes('انهاء'))) return 'إنهاء تكليف';
  if (trimmed === 'إنهاء تكليف' || trimmed === 'انهاء تكليف') return 'إنهاء تكليف';
  if (trimmed === 'تكليف' || trimmed === 'تكليف إداري' || trimmed === 'تكليف فني' || trimmed.startsWith('تكليف')) return 'تكليف';
  if (trimmed === 'انتهاء الندب' || trimmed === 'انهاء الندب' || trimmed === 'إنهاء الندب') return 'انتهاء الندب';
  if (trimmed === 'العودة من الندب' || trimmed === 'عودة من الندب') return 'العودة من الندب';
  if (trimmed === 'ندب' || trimmed === 'ندب خارجي' || trimmed === 'ندب داخلي') return 'ندب';
  if (trimmed === 'نقل' || trimmed === 'نقل داخلي' || trimmed === 'نقل موظف') return 'نقل';
  if (trimmed === 'تغيير مكان العمل' || trimmed === 'تغيير موقع العمل' || trimmed === 'مكان العمل') return 'تغيير مكان العمل';
  if (trimmed === 'تغيير المسمى الوظيفي' || trimmed === 'تعديل المسمى الوظيفي' || trimmed === 'المسمى الوظيفي') return 'تغيير المسمى الوظيفي';
  if (trimmed === 'إعارة / نقل خارجي' || trimmed === 'إعارة' || trimmed === 'نقل خارجي') return 'إعارة / نقل خارجي';
  if (trimmed === 'حركة وظيفية أخرى' || trimmed === 'إجراء وظيفي رسمي آخر') return 'حركة وظيفية أخرى';
  if (trimmed === 'ترقية' || trimmed === 'ترقية عادية' || trimmed === 'ترقية دورية') return 'ترقية';
  if (trimmed === 'علاوة دورية' || trimmed === 'علاوة سنوية' || trimmed === 'علاوة سنوية تلقائية' || trimmed === 'تلقائية' || trimmed === 'علاوة') return 'علاوة دورية';
  if (trimmed === 'ترقية استثنائية' || trimmed === 'استثنائية') return 'ترقية استثنائية';
  if (trimmed === 'تسوية وضع' || trimmed === 'تسوية وضع وظيفي' || trimmed === 'تسوية') return 'تسوية وضع';
  if (trimmed === 'تعيين' || trimmed === 'تعيين أصلي') return 'تعيين';
  return trimmed;
}

/**
 * Returns visual meta configuration for each CareerActionType
 */
export function getCareerActionMeta(actionType: CareerActionType | string) {
  const norm = normalizeCareerActionType(actionType);
  switch (norm) {
    case 'تحويل من اللائحة 418 إلى نظام الدرجات العامة':
      return {
        label: 'تحويل من نظام 418',
        badgeColor: 'bg-teal-100 text-teal-900 border-teal-300',
        dotColor: 'bg-teal-600',
        textColor: 'text-teal-800',
        accentBorder: 'border-teal-600',
        description: 'تحويل وتسوية تاريخية مشروعة من اللائحة 418 إلى نظام الدرجات العامة (2023)'
      };
    case 'ندب على درجة':
      return {
        label: 'ندب على درجة',
        badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-300',
        dotColor: 'bg-emerald-600',
        textColor: 'text-emerald-800',
        accentBorder: 'border-emerald-600',
        description: 'ندب وظيفي رسمي على درجة مالية / وظيفية معتمدة'
      };
    case 'ترقية':
      return {
        label: 'ترقية دورية',
        badgeColor: 'bg-red-100 text-red-900 border-red-300',
        dotColor: 'bg-red-600',
        textColor: 'text-red-800',
        accentBorder: 'border-red-600',
        description: 'ترقية وظيفية اعتيادية لاستيفاء المدة القانونية'
      };
    case 'علاوة دورية':
    case 'علاوة سنوية':
      return {
        label: 'علاوة دورية',
        badgeColor: 'bg-blue-100 text-blue-900 border-blue-300',
        dotColor: 'bg-blue-600',
        textColor: 'text-blue-800',
        accentBorder: 'border-blue-600',
        description: 'استحقاق علاوة سنوية دورية (لا تؤثر على تاريخ الدرجة)'
      };
    case 'ترقية استثنائية':
      return {
        label: 'ترقية استثنائية',
        badgeColor: 'bg-amber-100 text-amber-900 border-amber-300',
        dotColor: 'bg-amber-600',
        textColor: 'text-amber-800',
        accentBorder: 'border-amber-600',
        description: 'ترقية استثنائية بقرار إداري خاص'
      };
    case 'تسوية وضع':
      return {
        label: 'تسوية وضع',
        badgeColor: 'bg-purple-100 text-purple-900 border-purple-300',
        dotColor: 'bg-purple-600',
        textColor: 'text-purple-800',
        accentBorder: 'border-purple-600',
        description: 'تسوية وضع وظيفي / مؤهل علمي معتمد'
      };
    case 'تعيين':
      return {
        label: 'تعيين أول',
        badgeColor: 'bg-slate-100 text-slate-900 border-slate-300',
        dotColor: 'bg-slate-600',
        textColor: 'text-slate-800',
        accentBorder: 'border-slate-600',
        description: 'التعيين والمباشرة الأولى بالدولة'
      };
    case 'تكليف':
      return {
        label: 'تكليف إداري / فني',
        badgeColor: 'bg-indigo-100 text-indigo-900 border-indigo-300',
        dotColor: 'bg-indigo-600',
        textColor: 'text-indigo-800',
        accentBorder: 'border-indigo-600',
        description: 'تكليف بمهام أو منصب وظيفي أو رئاسة قسم/وحدة'
      };
    case 'إنهاء تكليف':
      return {
        label: 'إنهاء تكليف',
        badgeColor: 'bg-slate-100 text-slate-800 border-slate-300',
        dotColor: 'bg-slate-500',
        textColor: 'text-slate-700',
        accentBorder: 'border-slate-500',
        description: 'إنهاء تكليف وظيفي أو إداري رسمي'
      };
    case 'نقل':
      return {
        label: 'نقل وظيفي',
        badgeColor: 'bg-cyan-100 text-cyan-900 border-cyan-300',
        dotColor: 'bg-cyan-600',
        textColor: 'text-cyan-800',
        accentBorder: 'border-cyan-600',
        description: 'نقل الموظف من إدارة/جهة إلى أخرى'
      };
    case 'تغيير مكان العمل':
      return {
        label: 'تغيير مكان العمل',
        badgeColor: 'bg-sky-100 text-sky-900 border-sky-300',
        dotColor: 'bg-sky-600',
        textColor: 'text-sky-800',
        accentBorder: 'border-sky-600',
        description: 'تعديل مقر أو موقع أو فرع عمل الموظف'
      };
    case 'ندب':
      return {
        label: 'ندب',
        badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-300',
        dotColor: 'bg-emerald-600',
        textColor: 'text-emerald-800',
        accentBorder: 'border-emerald-600',
        description: 'ندب الموظف للعمل لدى جهة أخرى'
      };
    case 'انتهاء الندب':
      return {
        label: 'انتهاء الندب',
        badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-200',
        dotColor: 'bg-emerald-500',
        textColor: 'text-emerald-700',
        accentBorder: 'border-emerald-500',
        description: 'انتهاء فترة الندب الرسمي لدى الجهة'
      };
    case 'العودة من الندب':
      return {
        label: 'العودة من الندب',
        badgeColor: 'bg-teal-100 text-teal-900 border-teal-300',
        dotColor: 'bg-teal-600',
        textColor: 'text-teal-800',
        accentBorder: 'border-teal-600',
        description: 'مباشرة العمل بعد انتهاء الندب والعودة للجهة الأصلية'
      };
    case 'تغيير المسمى الوظيفي':
      return {
        label: 'تغيير المسمى الوظيفي',
        badgeColor: 'bg-violet-100 text-violet-900 border-violet-300',
        dotColor: 'bg-violet-600',
        textColor: 'text-violet-800',
        accentBorder: 'border-violet-600',
        description: 'تعديل أو ترقية المسمى الوظيفي أو الوظيفة'
      };
    case 'إعارة / نقل خارجي':
      return {
        label: 'إعارة / نقل خارجي',
        badgeColor: 'bg-orange-100 text-orange-900 border-orange-300',
        dotColor: 'bg-orange-600',
        textColor: 'text-orange-800',
        accentBorder: 'border-orange-600',
        description: 'إعارة أو نقل خارجي خارج الملاك الوظيفي'
      };
    case 'حركة وظيفية أخرى':
    default:
      return {
        label: norm || 'حركة وظيفية',
        badgeColor: 'bg-gray-100 text-gray-800 border-gray-300',
        dotColor: 'bg-gray-600',
        textColor: 'text-gray-800',
        accentBorder: 'border-gray-600',
        description: 'إجراء أو حركة وظيفية رسمية موثقة'
      };
  }
}

export interface CareerTransitionValidation {
  isValid: boolean;
  is2023Transition: boolean;
  statusType: 'valid_2023_transition' | 'reg418_internal' | 'general_internal' | 'suspicious_jump' | 'suspicious_reverse' | 'post_2023_reg418' | 'late_418_transition' | 'standard';
  title: string;
  description: string;
  suggestedActionType?: CareerActionType;
  shouldCountAsPromotion: boolean;
}

/**
 * Validates a career transition according to the historical 2023 Regulation 418 transition rules:
 * 1. Pre-2023: Phase A (Regulation 418 scale)
 * 2. 2023 Transition: Phase B (Regulation 418 -> General Numerical Grade in 2023 = Valid Historical Transition)
 * 3. Post-2023: Phase C (General Numerical Grade progression)
 */
export function validateCareerTransition(
  previousGrade?: string,
  newGrade?: string,
  actionDate?: string,
  decisionDate?: string,
  existingActionType?: string
): CareerTransitionValidation {
  const pGrade = (previousGrade || '').trim();
  const nGrade = (newGrade || '').trim();
  const effectiveDate = actionDate || decisionDate || '';
  const dateYear = effectiveDate ? effectiveDate.slice(0, 4) : '';
  const is2023 = dateYear === '2023';
  const isPost2023 = effectiveDate > '2023-12-31';

  const isPrev418 = isRegulation418Grade(pGrade);
  const isNew418 = isRegulation418Grade(nGrade);
  const isPrevNum = isGeneralNumericalGrade(pGrade);
  const isNewNum = isGeneralNumericalGrade(nGrade);

  // CASE 1: 2023 Transition from Regulation 418 to General Numerical Grade
  if ((isPrev418 || !pGrade) && isNewNum && is2023) {
    return {
      isValid: true,
      is2023Transition: true,
      statusType: 'valid_2023_transition',
      title: 'تحويل تاريخي من نظام 418 إلى الدرجات العامة — 2023',
      description: `انتقال مشروع من تصنيف اللائحة 418 (${pGrade || 'سجل طبي سابق'}) إلى جدول الدرجات العامة (${nGrade}) خلال سنة 2023.`,
      suggestedActionType: 'تحويل من اللائحة 418 إلى نظام الدرجات العامة',
      shouldCountAsPromotion: false
    };
  }

  // CASE 2: Late Transition after 2023 from 418 to Numerical Grade
  if (isPrev418 && isNewNum && isPost2023) {
    return {
      isValid: true,
      is2023Transition: false,
      statusType: 'late_418_transition',
      title: 'تحويل من اللائحة 418 إلى الدرجات العامة بعد 2023',
      description: `تمت تسوية التحويل من اللائحة 418 إلى (${nGrade}) بتاريخ (${effectiveDate}) بعد سنة الانتقال 2023. يتطلب تدقيق القرار.`,
      suggestedActionType: 'تحويل من اللائحة 418 إلى نظام الدرجات العامة',
      shouldCountAsPromotion: false
    };
  }

  // CASE 3: Suspicious Reverse Transition (General Numerical -> 418)
  if (isPrevNum && isNew418) {
    return {
      isValid: false,
      is2023Transition: false,
      statusType: 'suspicious_reverse',
      title: 'انتقال عكسي إلى نظام 418 — يحتاج مراجعة',
      description: `تحول عكسي غير اعتيادي من جدول الدرجات العامة (${pGrade}) إلى تصنيف اللائحة 418 (${nGrade}).`,
      shouldCountAsPromotion: false
    };
  }

  // CASE 4: Post-2023 Regulation 418 record
  if (isNew418 && isPost2023) {
    return {
      isValid: false,
      is2023Transition: false,
      statusType: 'post_2023_reg418',
      title: 'سجل 418 بعد الانتقال إلى نظام الدرجات العامة — يحتاج مراجعة',
      description: `حركة بتصنيف اللائحة 418 (${nGrade}) بتاريخ (${effectiveDate}) بعد 31/12/2023. يُحفظ السجل التاريخي مع طلب تدقيق إداري.`,
      shouldCountAsPromotion: false
    };
  }

  // CASE 5: Progression within General Numerical Grades (Phase C)
  if (isPrevNum && isNewNum) {
    const rankPrev = getGeneralNumericalRank(pGrade);
    const rankNew = getGeneralNumericalRank(nGrade);
    if (rankPrev !== null && rankNew !== null) {
      const diff = rankNew - rankPrev;
      if (diff === 1) {
        return {
          isValid: true,
          is2023Transition: false,
          statusType: 'general_internal',
          title: 'ترقية/استحقاق طبيعي حسب قواعد النظام العام',
          description: `تدرج وظيفي منتظم في الدرجات العامة من (${pGrade}) إلى (${nGrade}).`,
          shouldCountAsPromotion: true
        };
      } else if (diff > 1 || diff < 0) {
        return {
          isValid: false,
          is2023Transition: false,
          statusType: 'suspicious_jump',
          title: 'قفزة غير اعتيادية في الدرجات العامة — تحتاج مراجعة',
          description: `انتقال الدرجة من (${pGrade} [${rankPrev}]) إلى (${nGrade} [${rankNew}]). فارق الدرجات (${diff}).`,
          shouldCountAsPromotion: false
        };
      }
    }
  }

  // CASE 6: Internal Regulation 418 progression (Phase A)
  if (isPrev418 && isNew418) {
    return {
      isValid: true,
      is2023Transition: false,
      statusType: 'reg418_internal',
      title: 'تدرج تاريخي معتمد ضمن اللائحة 418',
      description: `حركة تاريخية بين تصنيفات اللائحة 418 الطبية (${pGrade} ← ${nGrade}).`,
      shouldCountAsPromotion: false
    };
  }

  return {
    isValid: true,
    is2023Transition: false,
    statusType: 'standard',
    title: 'إجراء وظيفي معتمد',
    description: 'تسجيل حركة وظيفية حسب النظم المعمول بها.',
    shouldCountAsPromotion: existingActionType === 'ترقية' || existingActionType === 'ترقية استثنائية'
  };
}

/**
 * Combines and normalizes an employee's complete career history from careerRecords,
 * legacy promotions, increments, and settlements without duplicating records.
 */
export function getEmployeeCareerHistory(
  employeeId: number,
  careerRecords: CareerPromotionRecord[] = [],
  promotions: PromotionRecord[] = [],
  increments: IncrementRecord[] = [],
  settlements: StatusSettlementRecord[] = [],
  transfers: TransferRecord[] = [],
  secondments: SecondmentRecord[] = []
): CareerPromotionRecord[] {
  const safeCareerRecords = careerRecords || [];
  const safePromotions = promotions || [];
  const safeIncrements = increments || [];
  const safeSettlements = settlements || [];
  const safeTransfers = transfers || [];
  const safeSecondments = secondments || [];

  // 1. Direct career records
  const directRecords = safeCareerRecords.filter((r) => r.employeeId === employeeId);
  const seenIds = new Set(directRecords.map((r) => r.id));
  const seenKeys = new Set(directRecords.map((r) => `${r.actionType}_${r.actionDate}_${r.decisionNumber}`));

  const synthesized: CareerPromotionRecord[] = [...directRecords];

  // 2. Synthesize from promotions if not already in careerRecords
  safePromotions
    .filter((p) => p.employeeId === employeeId)
    .forEach((p) => {
      const key = `${p.promotionType === 'ترقية استثنائية' ? 'ترقية استثنائية' : 'ترقية'}_${p.effectiveDate || p.decisionDate}_${p.decisionNumber}`;
      if (!seenIds.has(p.id) && !seenKeys.has(key)) {
        seenIds.add(p.id);
        seenKeys.add(key);
        synthesized.push({
          id: p.id,
          employeeId: p.employeeId,
          fileNumber: p.fileNumber || '',
          employeeName: '',
          actionType: p.promotionType === 'ترقية استثنائية' ? 'ترقية استثنائية' : 'ترقية',
          previousGrade: p.previousGrade || '',
          previousIncrement: p.previousIncrement || 0,
          newGrade: p.newGrade || '',
          newIncrement: p.newIncrement || 1,
          actionDate: p.effectiveDate || p.decisionDate || p.createdAt?.slice(0, 10) || '',
          decisionDate: p.decisionDate || p.effectiveDate || '',
          decisionNumber: p.decisionNumber || '',
          issuingAuthority: 'وزارة الصحة / مصرف الدم المركزي',
          notes: p.notes || p.reason || '',
          createdBy: p.createdBy || 'النظام',
          createdAt: p.createdAt || ''
        });
      }
    });

  // 3. Synthesize from increments if not already in careerRecords
  safeIncrements
    .filter((i) => i.employeeId === employeeId)
    .forEach((i) => {
      const key = `علاوة دورية_${i.effectiveDate}_${i.decisionNumber}`;
      if (!seenIds.has(i.id) && !seenKeys.has(key)) {
        seenIds.add(i.id);
        seenKeys.add(key);
        synthesized.push({
          id: i.id,
          employeeId: i.employeeId,
          fileNumber: i.fileNumber || '',
          employeeName: '',
          actionType: 'علاوة دورية',
          previousGrade: i.previousGrade || '',
          previousIncrement: i.previousIncrement || 0,
          newGrade: i.newGrade || i.previousGrade || '',
          newIncrement: i.newIncrement || 1,
          actionDate: i.effectiveDate || i.decisionDate || i.createdAt?.slice(0, 10) || '',
          decisionDate: i.decisionDate || i.effectiveDate || '',
          decisionNumber: i.decisionNumber || '',
          issuingAuthority: 'مصرف الدم المركزي المرج',
          notes: i.notes || '',
          createdBy: i.createdBy || 'النظام',
          createdAt: i.createdAt || ''
        });
      }
    });

  // 4. Synthesize from settlements if not already in careerRecords
  safeSettlements
    .filter((s) => s.employeeId === employeeId)
    .forEach((s) => {
      const key = `تسوية وضع_${s.effectiveDate}_${s.decisionNumber}`;
      if (!seenIds.has(s.id) && !seenKeys.has(key)) {
        seenIds.add(s.id);
        seenKeys.add(key);

        // Check if settlement represents a 2023 transition from 418
        const dateStr = s.effectiveDate || s.createdAt?.slice(0, 10) || '';
        const is2023 = dateStr.startsWith('2023');
        const actionType: CareerActionType = (is2023 && isGeneralNumericalGrade(s.grade))
          ? 'تحويل من اللائحة 418 إلى نظام الدرجات العامة'
          : 'تسوية وضع';

        synthesized.push({
          id: s.id,
          employeeId: s.employeeId,
          fileNumber: '',
          employeeName: '',
          actionType,
          previousGrade: '',
          previousIncrement: 0,
          newGrade: s.grade || '',
          newIncrement: 1,
          actionDate: dateStr,
          decisionDate: s.effectiveDate || '',
          decisionNumber: s.decisionNumber || '',
          issuingAuthority: 'وزارة الصحة / الخدمة المدنية',
          notes: s.notes || s.reason || '',
          createdBy: s.createdBy || 'النظام',
          createdAt: s.createdAt || ''
        });
      }
    });

  // 5. Synthesize from transfers if not already in careerRecords
  if (safeTransfers && safeTransfers.length > 0) {
    safeTransfers
      .filter((t) => t.employeeId === employeeId)
      .forEach((t) => {
        const key = `نقل_${t.effectiveDate}_${t.decisionNumber}`;
        if (!seenIds.has(t.id) && !seenKeys.has(key)) {
          seenIds.add(t.id);
          seenKeys.add(key);
          synthesized.push({
            id: t.id,
            employeeId: t.employeeId,
            fileNumber: '',
            employeeName: '',
            actionType: 'نقل',
            previousWorkLocation: t.previousDepartment,
            newWorkLocation: t.newDepartment,
            previousDepartment: t.previousDepartment,
            newDepartment: t.newDepartment,
            actionDate: t.effectiveDate || t.decisionDate || t.createdAt?.slice(0, 10) || '',
            decisionDate: t.decisionDate || t.effectiveDate || '',
            decisionNumber: t.decisionNumber || '',
            issuingAuthority: 'وزارة الصحة / مصرف الدم المركزي',
            notes: t.notes || t.reason || '',
            createdBy: t.createdBy || 'النظام',
            createdAt: t.createdAt || ''
          });
        }
      });
  }

  // 6. Synthesize from secondments if not already in careerRecords
  if (safeSecondments && safeSecondments.length > 0) {
    safeSecondments
      .filter((s) => s.employeeId === employeeId)
      .forEach((s) => {
        const key = `ندب_${s.startDate}_${s.decisionNumber}`;
        if (!seenIds.has(s.id) && !seenKeys.has(key)) {
          seenIds.add(s.id);
          seenKeys.add(key);
          synthesized.push({
            id: s.id,
            employeeId: s.employeeId,
            fileNumber: '',
            employeeName: '',
            actionType: 'ندب',
            secondmentEntity: s.assignedEntity,
            secondmentType: 'محدد المدة',
            startDate: s.startDate,
            endDate: s.endDate,
            actionDate: s.startDate || s.decisionDate || s.createdAt?.slice(0, 10) || '',
            decisionDate: s.decisionDate || s.startDate || '',
            decisionNumber: s.decisionNumber || '',
            issuingAuthority: 'وزارة الصحة',
            notes: s.notes || s.reason || '',
            createdBy: s.createdBy || 'النظام',
            createdAt: s.createdAt || ''
          });
        }
      });
  }

  // Sort chronologically (oldest to newest)
  return synthesized.sort((a, b) => {
    const timeA = new Date(a.actionDate || a.decisionDate || a.createdAt || '').getTime() || 0;
    const timeB = new Date(b.actionDate || b.decisionDate || b.createdAt || '').getTime() || 0;
    return timeA - timeB;
  });
}

/**
 * Calculates Career Summary separating Promotions, Increments, Exceptional Promotions, Settlements, 2023 418 Transitions, and Secondments.
 * MANDATORY: The 2023 transition must NOT increase promotionsCount.
 */
export function calculateEmployeeCareerSummary(
  employee: Employee,
  careerRecords: CareerPromotionRecord[] = [],
  promotions: PromotionRecord[] = [],
  increments: IncrementRecord[] = [],
  settlements: StatusSettlementRecord[] = []
): CareerSummary {
  const history = getEmployeeCareerHistory(
    employee.id,
    careerRecords,
    promotions,
    increments,
    settlements
  );

  let promotionsCount = 0;
  let annualIncrementsCount = 0;
  let exceptionalPromotionsCount = 0;
  let statusSettlementsCount = 0;
  let secondmentToGradeCount = 0;
  let transition418Count = 0;
  let lastPromotionDate: string | undefined;
  let lastAnnualIncrementDate: string | undefined;

  let assignmentsCount = 0;
  let transfersCount = 0;
  let secondmentsCount = 0;
  let workLocationChangesCount = 0;
  let jobTitleChangesCount = 0;

  // Process history chronologically
  history.forEach((rec) => {
    const norm = normalizeCareerActionType(rec.actionType);
    const date = rec.actionDate || rec.decisionDate;

    if (norm === 'ترقية') {
      promotionsCount++;
      if (date) lastPromotionDate = date;
    } else if (norm === 'علاوة دورية' || norm === 'علاوة سنوية') {
      annualIncrementsCount++;
      if (date) lastAnnualIncrementDate = date;
    } else if (norm === 'ترقية استثنائية') {
      exceptionalPromotionsCount++;
      if (date) lastPromotionDate = date;
    } else if (norm === 'تسوية وضع') {
      statusSettlementsCount++;
    } else if (norm === 'تحويل من اللائحة 418 إلى نظام الدرجات العامة') {
      transition418Count++;
    } else if (norm === 'ندب على درجة') {
      secondmentToGradeCount++;
    } else if (norm === 'تكليف') {
      assignmentsCount++;
    } else if (norm === 'نقل' || norm === 'إعارة / نقل خارجي') {
      transfersCount++;
    } else if (norm === 'ندب') {
      secondmentsCount++;
    } else if (norm === 'تغيير مكان العمل') {
      workLocationChangesCount++;
    } else if (norm === 'تغيير المسمى الوظيفي') {
      jobTitleChangesCount++;
    }
  });

  // Current Grade determination: After 2023 transition, current grade is based on latest valid transaction
  const latestRecord = history[history.length - 1];
  const lastAction = latestRecord ? {
    actionType: normalizeCareerActionType(latestRecord.actionType),
    actionDate: latestRecord.actionDate || latestRecord.decisionDate,
    previousGrade: latestRecord.previousGrade,
    newGrade: latestRecord.newGrade,
    newIncrement: latestRecord.newIncrement,
    decisionNumber: latestRecord.decisionNumber
  } : undefined;

  const currentWorkLoc = getCurrentWorkLocation(employee, careerRecords);
  const currentAsgn = getCurrentAssignment(employee, careerRecords);
  const currentDept = getCurrentDepartment(employee, careerRecords);

  return {
    promotionsCount,
    annualIncrementsCount,
    exceptionalPromotionsCount,
    statusSettlementsCount,
    secondmentToGradeCount,
    transition418Count,
    assignmentsCount,
    transfersCount,
    secondmentsCount,
    workLocationChangesCount,
    locationChangesCount: workLocationChangesCount,
    jobTitleChangesCount,
    currentWorkLocation: currentWorkLoc.location,
    currentAssignmentTitle: currentAsgn.title,
    currentAssignment: currentAsgn.title,
    currentDepartmentName: currentDept.department,
    currentDepartment: currentDept.department,
    lastPromotionDate: lastPromotionDate || employee.gradeEntryDate,
    lastAnnualIncrementDate: lastAnnualIncrementDate || employee.lastIncrementDate,
    currentGrade: employee.jobGrade,
    currentIncrement: employee.currentIncrement || 1,
    lastAction
  };
}

/**
 * Resolves current work location based on employee file and chronological movements
 */
export function getCurrentWorkLocation(
  employee: Employee,
  careerRecords: CareerPromotionRecord[] = []
): { location: string; isTemporary?: boolean; status: 'active' | 'base' | 'review_required'; warning?: string } {
  const records = (careerRecords || [])
    .filter(r => r.employeeId === employee.id)
    .sort((a, b) => {
      const tA = new Date(a.actionDate || a.decisionDate || a.createdAt || '').getTime() || 0;
      const tB = new Date(b.actionDate || b.decisionDate || b.createdAt || '').getTime() || 0;
      return tA - tB;
    });

  const today = new Date().toISOString().slice(0, 10);

  // Check active secondments first
  const secondmentRecords = records.filter(r => {
    const norm = normalizeCareerActionType(r.actionType);
    return (norm === 'ندب' || norm === 'إعارة / نقل خارجي') && (r.actionDate || r.decisionDate || '') <= today;
  });

  const endSecondmentRecords = records.filter(r => {
    const norm = normalizeCareerActionType(r.actionType);
    return (norm === 'انتهاء الندب' || norm === 'العودة من الندب') && (r.actionDate || r.decisionDate || '') <= today;
  });

  if (secondmentRecords.length > 0) {
    const latestSecondment = secondmentRecords[secondmentRecords.length - 1];
    const secDate = latestSecondment.actionDate || latestSecondment.decisionDate || '';
    const latestEnd = endSecondmentRecords[endSecondmentRecords.length - 1];
    const endDate = latestEnd ? (latestEnd.actionDate || latestEnd.decisionDate || '') : '';

    const isStillSeconded = (!latestSecondment.endDate || latestSecondment.endDate >= today) && (!latestEnd || endDate < secDate);
    if (isStillSeconded && latestSecondment.secondmentEntity) {
      return {
        location: latestSecondment.secondmentEntity,
        isTemporary: true,
        status: 'active',
        warning: `منتدب حالياً لدى ${latestSecondment.secondmentEntity}`
      };
    }
  }

  // Work Location Changes and Transfers up to today
  const locationMovements = records.filter(r => {
    const norm = normalizeCareerActionType(r.actionType);
    const effDate = r.actionDate || r.decisionDate || '';
    return effDate <= today && (
      norm === 'تغيير مكان العمل' ||
      norm === 'نقل' ||
      norm === 'العودة من الندب' ||
      !!r.newWorkLocation ||
      !!r.workLocation
    );
  });

  if (locationMovements.length > 0) {
    const latest = locationMovements[locationMovements.length - 1];
    const targetLoc = latest.newWorkLocation || latest.workLocation;
    if (targetLoc && targetLoc.trim() !== '') {
      return {
        location: targetLoc.trim(),
        status: 'active'
      };
    }
  }

  // Fallback to employee base location
  const baseLocation = employee.workLocation || employee.hiringEntity || 'مصرف الدم المركزي المرج';
  return {
    location: baseLocation,
    status: 'base'
  };
}

/**
 * Resolves current assignment based on employee file and chronological assignments
 */
export function getCurrentAssignment(
  employee: Employee,
  careerRecords: CareerPromotionRecord[] = []
): { title: string; assignmentType?: string; startDate?: string; endDate?: string; status: 'active' | 'none' | 'ended' | 'review_required'; warning?: string } {
  const records = (careerRecords || [])
    .filter(r => r.employeeId === employee.id)
    .sort((a, b) => {
      const tA = new Date(a.actionDate || a.decisionDate || a.createdAt || '').getTime() || 0;
      const tB = new Date(b.actionDate || b.decisionDate || b.createdAt || '').getTime() || 0;
      return tA - tB;
    });

  const today = new Date().toISOString().slice(0, 10);

  const assignmentRecords = records.filter(r => {
    const norm = normalizeCareerActionType(r.actionType);
    return norm === 'تكليف' || (!['إنهاء تكليف'].includes(norm) && !!r.assignmentTitle);
  });

  const endAssignmentRecords = records.filter(r => {
    const norm = normalizeCareerActionType(r.actionType);
    return norm === 'إنهاء تكليف';
  });

  if (assignmentRecords.length === 0) {
    if (employee.currentAssignment && employee.currentAssignment.trim() !== '' && employee.currentAssignment !== 'بدون تكليف' && employee.currentAssignment !== 'غير مكلف') {
      return {
        title: employee.currentAssignment,
        status: 'active'
      };
    }
    return {
      title: 'بدون تكليف (غير مكلف)',
      status: 'none'
    };
  }

  // Find active assignments:
  const activeAssignments: CareerPromotionRecord[] = [];

  assignmentRecords.forEach(asgn => {
    const sDate = asgn.startDate || asgn.actionDate || asgn.decisionDate || '';
    if (sDate > today) return; // future assignment

    if (asgn.endDate && asgn.endDate < today) {
      return; // ended in past
    }

    // Check if ended by an explicit end record
    const isEnded = endAssignmentRecords.some(endRec => {
      const endDate = endRec.actionDate || endRec.decisionDate || '';
      if (endDate > today) return false;
      if (endRec.linkedAssignmentId && endRec.linkedAssignmentId === asgn.id) return true;
      if (endRec.assignmentTitle && asgn.assignmentTitle && endRec.assignmentTitle.trim() === asgn.assignmentTitle.trim() && endDate >= sDate) return true;
      if (!endRec.linkedAssignmentId && !endRec.assignmentTitle && endDate >= sDate) return true;
      return false;
    });

    if (!isEnded) {
      activeAssignments.push(asgn);
    }
  });

  if (activeAssignments.length === 0) {
    return {
      title: 'لا يوجد تكليف حالي',
      status: 'ended'
    };
  }

  if (activeAssignments.length > 1) {
    // Multiple conflicting open assignments without end dates
    const latest = activeAssignments[activeAssignments.length - 1];
    return {
      title: latest.assignmentTitle || 'تكليف متعدد',
      assignmentType: latest.assignmentType,
      startDate: latest.startDate || latest.actionDate,
      endDate: latest.endDate,
      status: 'review_required',
      warning: 'تعدد تكليفات متزامنة مفتوحة بدون إنهاء — تحتاج إلى مراجعة'
    };
  }

  const current = activeAssignments[0];
  return {
    title: current.assignmentTitle || 'تكليف رسمي',
    assignmentType: current.assignmentType,
    startDate: current.startDate || current.actionDate,
    endDate: current.endDate,
    status: 'active'
  };
}

/**
 * Resolves current department based on employee file and chronological movements
 */
export function getCurrentDepartment(
  employee: Employee,
  careerRecords: CareerPromotionRecord[] = []
): { department: string; status: 'active' | 'base'; warning?: string } {
  const records = (careerRecords || [])
    .filter(r => r.employeeId === employee.id)
    .sort((a, b) => {
      const tA = new Date(a.actionDate || a.decisionDate || a.createdAt || '').getTime() || 0;
      const tB = new Date(b.actionDate || b.decisionDate || b.createdAt || '').getTime() || 0;
      return tA - tB;
    });

  const today = new Date().toISOString().slice(0, 10);

  const deptMovements = records.filter(r => {
    const effDate = r.actionDate || r.decisionDate || '';
    return effDate <= today && (!!r.newDepartment || !!r.department);
  });

  if (deptMovements.length > 0) {
    const latest = deptMovements[deptMovements.length - 1];
    const dept = latest.newDepartment || latest.department;
    if (dept && dept.trim() !== '') {
      return {
        department: dept.trim(),
        status: 'active'
      };
    }
  }

  return {
    department: employee.department || 'غير محدد',
    status: 'base'
  };
}

/**
 * Resolves historical work location at a specific date
 */
export function getWorkLocationAtDate(
  employee: Employee,
  careerRecords: CareerPromotionRecord[] = [],
  targetDate: string
): { location: string; status: 'active' | 'base' | 'review_required'; warning?: string } {
  if (!targetDate) return getCurrentWorkLocation(employee, careerRecords);

  const records = (careerRecords || [])
    .filter(r => r.employeeId === employee.id)
    .filter(r => (r.actionDate || r.decisionDate || '') <= targetDate)
    .sort((a, b) => {
      const tA = new Date(a.actionDate || a.decisionDate || a.createdAt || '').getTime() || 0;
      const tB = new Date(b.actionDate || b.decisionDate || b.createdAt || '').getTime() || 0;
      return tA - tB;
    });

  // Secondment check at targetDate
  const secondmentRecords = records.filter(r => {
    const norm = normalizeCareerActionType(r.actionType);
    return (norm === 'ندب' || norm === 'إعارة / نقل خارجي') && (r.actionDate || r.decisionDate || '') <= targetDate;
  });
  const endSecondmentRecords = records.filter(r => {
    const norm = normalizeCareerActionType(r.actionType);
    return (norm === 'انتهاء الندب' || norm === 'العودة من الندب') && (r.actionDate || r.decisionDate || '') <= targetDate;
  });

  if (secondmentRecords.length > 0) {
    const latestSec = secondmentRecords[secondmentRecords.length - 1];
    const secDate = latestSec.actionDate || latestSec.decisionDate || '';
    const latestEnd = endSecondmentRecords[endSecondmentRecords.length - 1];
    const endDate = latestEnd ? (latestEnd.actionDate || latestEnd.decisionDate || '') : '';

    const isStillSeconded = (!latestSec.endDate || latestSec.endDate >= targetDate) && (!latestEnd || endDate < secDate);
    if (isStillSeconded && latestSec.secondmentEntity) {
      return {
        location: latestSec.secondmentEntity,
        status: 'active',
        warning: `منتدب في هذا التاريخ لدى ${latestSec.secondmentEntity}`
      };
    }
  }

  // Work location changes up to targetDate
  const locationMovements = records.filter(r => {
    const norm = normalizeCareerActionType(r.actionType);
    return (
      norm === 'تغيير مكان العمل' ||
      norm === 'نقل' ||
      norm === 'العودة من الندب' ||
      !!r.newWorkLocation ||
      !!r.workLocation
    );
  });

  if (locationMovements.length > 0) {
    const latest = locationMovements[locationMovements.length - 1];
    const targetLoc = latest.newWorkLocation || latest.workLocation;
    if (targetLoc && targetLoc.trim() !== '') {
      return {
        location: targetLoc.trim(),
        status: 'active'
      };
    }
  }

  return {
    location: employee.workLocation || employee.hiringEntity || 'مصرف الدم المركزي المرج',
    status: 'base'
  };
}

/**
 * Resolves historical assignment at a specific date
 */
export function getAssignmentAtDate(
  employee: Employee,
  careerRecords: CareerPromotionRecord[] = [],
  targetDate: string
): { title: string; assignmentType?: string; startDate?: string; endDate?: string; status: 'active' | 'none' | 'ended' | 'review_required'; warning?: string } {
  if (!targetDate) return getCurrentAssignment(employee, careerRecords);

  const records = (careerRecords || [])
    .filter(r => r.employeeId === employee.id)
    .filter(r => (r.actionDate || r.decisionDate || '') <= targetDate)
    .sort((a, b) => {
      const tA = new Date(a.actionDate || a.decisionDate || a.createdAt || '').getTime() || 0;
      const tB = new Date(b.actionDate || b.decisionDate || b.createdAt || '').getTime() || 0;
      return tA - tB;
    });

  const assignmentRecords = records.filter(r => {
    const norm = normalizeCareerActionType(r.actionType);
    return norm === 'تكليف' || (!['إنهاء تكليف'].includes(norm) && !!r.assignmentTitle);
  });

  const endAssignmentRecords = records.filter(r => {
    const norm = normalizeCareerActionType(r.actionType);
    return norm === 'إنهاء تكليف';
  });

  const activeAssignments = assignmentRecords.filter(asgn => {
    const sDate = asgn.startDate || asgn.actionDate || asgn.decisionDate || '';
    if (sDate > targetDate) return false;
    if (asgn.endDate && asgn.endDate < targetDate) return false;

    const isEnded = endAssignmentRecords.some(endRec => {
      const eDate = endRec.actionDate || endRec.decisionDate || '';
      if (eDate > targetDate) return false;
      if (endRec.linkedAssignmentId && endRec.linkedAssignmentId === asgn.id) return true;
      if (endRec.assignmentTitle && asgn.assignmentTitle && endRec.assignmentTitle.trim() === asgn.assignmentTitle.trim() && eDate >= sDate) return true;
      if (!endRec.linkedAssignmentId && !endRec.assignmentTitle && eDate >= sDate) return true;
      return false;
    });

    return !isEnded;
  });

  if (activeAssignments.length === 0) {
    return {
      title: 'بدون تكليف في هذا التاريخ',
      status: 'none'
    };
  }

  if (activeAssignments.length > 1) {
    const latest = activeAssignments[activeAssignments.length - 1];
    return {
      title: latest.assignmentTitle || 'تكليف متعدد',
      assignmentType: latest.assignmentType,
      startDate: latest.startDate || latest.actionDate,
      endDate: latest.endDate,
      status: 'review_required',
      warning: 'تعدد تكليفات متزامنة في هذا التاريخ — تحتاج إلى مراجعة'
    };
  }

  const current = activeAssignments[0];
  return {
    title: current.assignmentTitle || 'تكليف رسمي',
    assignmentType: current.assignmentType,
    startDate: current.startDate || current.actionDate,
    endDate: current.endDate,
    status: 'active'
  };
}

/**
 * Validates movement dates and logical integrity
 */
export function validateCareerMovementDates(movement: Partial<CareerPromotionRecord>): {
  isValid: boolean;
  warning?: string;
  error?: string;
} {
  if (movement.startDate && movement.endDate) {
    if (movement.endDate < movement.startDate) {
      return {
        isValid: false,
        error: 'تاريخ الانتهاء لا يمكن أن يكون قبل تاريخ البدء.'
      };
    }
  }

  if (!movement.actionDate && !movement.decisionDate) {
    return {
      isValid: false,
      error: 'يجب تحديد تاريخ النفاذ أو تاريخ القرار.'
    };
  }

  return { isValid: true };
}

/**
 * Validates whether a grade is in the official JOB_GRADES or 418 list
 */
export function isValidJobGrade(grade: string): boolean {
  if (!grade) return false;
  const trimmed = grade.trim();
  return JOB_GRADES.includes(trimmed) || REGULATION_418_GRADES.includes(trimmed) || isGeneralNumericalGrade(trimmed);
}

/**
 * Ensures allowances count is a valid non-negative integer
 */
export function sanitizeAllowancesCount(val: any): number {
  const num = parseInt(val, 10);
  if (isNaN(num) || num < 0) return 0;
  return num;
}

