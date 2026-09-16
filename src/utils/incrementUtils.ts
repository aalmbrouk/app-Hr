import { 
  Employee, 
  IncrementRecord, 
  PromotionRecord, 
  StatusSettlementRecord, 
  GeneralProcedure,
  IncrementBreakdown, 
  IncrementBreakdownItem, 
  LastGradeAffectingAction,
  IncrementType 
} from '../types';
import { formatDateDisplay } from './dateUtils';

/**
 * Normalizes an increment type string to standard types
 */
export function normalizeIncrementType(type?: string): IncrementType {
  if (!type) return 'علاوة سنوية تلقائية';
  if (type === 'تلقائية' || type === 'علاوة سنوية تلقائية' || type === 'علاوة سنوية دورية' || type === 'استحقاق سنوي') {
    return 'علاوة سنوية تلقائية';
  }
  if (type === 'ترقية' || type === 'علاوة ترقية') {
    return 'علاوة ترقية';
  }
  if (type === 'ترقية استثنائية' || type === 'استثنائية') {
    return 'ترقية استثنائية';
  }
  if (type === 'تسوية وضع' || type === 'تسوية') {
    return 'تسوية وضع';
  }
  if (type === 'يدوية' || type === 'علاوة يدوية') {
    return 'علاوة يدوية';
  }
  if (type === 'تعيين' || type === 'علاوة تعيين') {
    return 'علاوة تعيين';
  }
  return 'تعديل إداري آخر';
}

/**
 * Returns visual badge configuration for an increment type
 */
export function getIncrementTypeMeta(type: IncrementType | string) {
  const norm = normalizeIncrementType(type);
  switch (norm) {
    case 'علاوة سنوية تلقائية':
      return {
        label: 'علاوة سنوية تلقائية',
        shortLabel: 'سنوية تلقائية',
        badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
        dotColor: 'bg-emerald-500',
        sourceName: 'استحقاق سنوي دوري',
        defaultDecision: 'غير مرتبط بقرار ترقية'
      };
    case 'علاوة ترقية':
      return {
        label: 'علاوة ترقية',
        shortLabel: 'ترقية',
        badgeColor: 'bg-blue-100 text-blue-800 border-blue-300',
        dotColor: 'bg-blue-500',
        sourceName: 'قرار ترقية عادية',
        defaultDecision: 'قرار ترقية معتمد'
      };
    case 'ترقية استثنائية':
      return {
        label: 'ترقية استثنائية',
        shortLabel: 'استثنائية',
        badgeColor: 'bg-amber-100 text-amber-900 border-amber-300',
        dotColor: 'bg-amber-500',
        sourceName: 'قرار ترقية استثنائية',
        defaultDecision: 'قرار ترقية استثنائية'
      };
    case 'تسوية وضع':
      return {
        label: 'تسوية وضع',
        shortLabel: 'تسوية وضع',
        badgeColor: 'bg-purple-100 text-purple-800 border-purple-300',
        dotColor: 'bg-purple-500',
        sourceName: 'قرار تسوية وضع وظيفي / مؤهل',
        defaultDecision: 'قرار تسوية معتمد'
      };
    case 'علاوة تعيين':
      return {
        label: 'علاوة تعيين',
        shortLabel: 'تعيين',
        badgeColor: 'bg-teal-100 text-teal-800 border-teal-300',
        dotColor: 'bg-teal-500',
        sourceName: 'قرار تعيين أصلي',
        defaultDecision: 'قرار التعيين الأصلي'
      };
    case 'علاوة يدوية':
      return {
        label: 'علاوة يدوية',
        shortLabel: 'يدوية',
        badgeColor: 'bg-orange-100 text-orange-800 border-orange-300',
        dotColor: 'bg-orange-500',
        sourceName: 'تعديل يدوي مباشر',
        defaultDecision: 'إجراء إداري فردي'
      };
    case 'تعديل إداري آخر':
    default:
      return {
        label: 'تعديل إداري آخر',
        shortLabel: 'تعديل إداري',
        badgeColor: 'bg-gray-100 text-gray-800 border-gray-300',
        dotColor: 'bg-gray-500',
        sourceName: 'تعديل إداري عام',
        defaultDecision: 'مذكرة إدارية'
      };
  }
}

/**
 * Calculates a complete historical breakdown of an employee's increments
 * Distinguishes between Automatic Annual Increments, Promotions, Settlements, and Appointments.
 */
export function calculateEmployeeIncrementBreakdown(
  emp: Employee,
  increments: IncrementRecord[] = [],
  promotions: PromotionRecord[] = [],
  settlements: StatusSettlementRecord[] = [],
  _procedures: GeneralProcedure[] = []
): IncrementBreakdown {
  const totalIncrements = emp.currentIncrement || 1;

  // Filter records for this employee
  const empIncrements = (increments || [])
    .filter((i) => i.employeeId === emp.id)
    .sort((a, b) => new Date(a.effectiveDate || a.createdAt || '').getTime() - new Date(b.effectiveDate || b.createdAt || '').getTime());

  const empPromotions = (promotions || [])
    .filter((p) => p.employeeId === emp.id)
    .sort((a, b) => new Date(a.effectiveDate || a.decisionDate || a.createdAt || '').getTime() - new Date(b.effectiveDate || b.decisionDate || b.createdAt || '').getTime());

  const empSettlements = (settlements || [])
    .filter((s) => s.employeeId === emp.id)
    .sort((a, b) => new Date(a.effectiveDate || a.createdAt || '').getTime() - new Date(b.effectiveDate || b.createdAt || '').getTime());

  // Determine latest events
  const latestPromo = empPromotions[empPromotions.length - 1];
  const latestSettle = empSettlements[empSettlements.length - 1];
  const latestExceptionalPromo = empPromotions.filter((p) => p.promotionType === 'ترقية استثنائية').slice(-1)[0];

  const lastAnnualAutoInc = empIncrements
    .filter((i) => normalizeIncrementType(i.incrementType) === 'علاوة سنوية تلقائية')
    .slice(-1)[0];

  // 1. Determine "آخر إجراء مؤثر على الدرجة" (Last Grade Affecting Action)
  let lastGradeAffectingAction: LastGradeAffectingAction;

  if (emp.lastGradeAffectingAction) {
    lastGradeAffectingAction = { ...emp.lastGradeAffectingAction };
  } else if (latestSettle && (!latestPromo || new Date(latestSettle.effectiveDate).getTime() >= new Date(latestPromo.effectiveDate).getTime())) {
    lastGradeAffectingAction = {
      actionType: 'تسوية وضع',
      actionDate: latestSettle.effectiveDate,
      resultingGrade: latestSettle.grade || emp.jobGrade,
      incrementCountGranted: 3, // standard settlement increment baseline or derived
      decisionNumber: latestSettle.decisionNumber || 'قرار تسوية',
      decisionDate: latestSettle.effectiveDate,
      notes: latestSettle.reason || 'تسوية وضع وظيفي ومؤهل'
    };
  } else if (latestPromo) {
    lastGradeAffectingAction = {
      actionType: latestPromo.promotionType === 'ترقية استثنائية' ? 'ترقية استثنائية' : 'ترقية',
      actionDate: latestPromo.effectiveDate || latestPromo.decisionDate,
      resultingGrade: latestPromo.newGrade || emp.jobGrade,
      incrementCountGranted: latestPromo.newIncrement || 1,
      decisionNumber: latestPromo.decisionNumber || 'قرار ترقية',
      decisionDate: latestPromo.decisionDate || latestPromo.effectiveDate,
      notes: latestPromo.reason || 'استيفاء المدة والشروط القانونية للترقية'
    };
  } else {
    // Default to initial appointment
    lastGradeAffectingAction = {
      actionType: 'تعيين',
      actionDate: emp.gradeEntryDate || emp.directingDate || emp.hireDate || '2020-01-01',
      resultingGrade: emp.jobGrade || emp.appointmentGrade || 'الدرجة التاسعة',
      incrementCountGranted: 1,
      decisionNumber: 'قرار التعيين الأصلي',
      decisionDate: emp.hireDate || '2020-01-01',
      notes: 'التعيين الأصلي وبدء الخدمة'
    };
  }

  // 2. Count increments by source
  let annualAutoCount = 0;
  let promoIncCount = 0;
  let settleIncCount = 0;
  let exceptionalPromoCount = 0;
  let manualCount = 0;
  let apptCount = 0;
  let otherCount = 0;

  // Process explicit increment transactions
  if (empIncrements.length > 0) {
    empIncrements.forEach((inc) => {
      const type = normalizeIncrementType(inc.incrementType);
      const amount = inc.incrementAmount ?? 1;

      switch (type) {
        case 'علاوة سنوية تلقائية':
          annualAutoCount += amount;
          break;
        case 'علاوة ترقية':
          promoIncCount += amount;
          break;
        case 'ترقية استثنائية':
          exceptionalPromoCount += amount;
          break;
        case 'تسوية وضع':
          settleIncCount += amount;
          break;
        case 'علاوة يدوية':
          manualCount += amount;
          break;
        case 'علاوة تعيين':
          apptCount += amount;
          break;
        default:
          otherCount += amount;
          break;
      }
    });
  }

  // If transactions sum is less than totalIncrements, attribute remaining baseline increments to the base action
  const currentSum = annualAutoCount + promoIncCount + settleIncCount + exceptionalPromoCount + manualCount + apptCount + otherCount;
  
  if (currentSum < totalIncrements) {
    const diff = totalIncrements - currentSum;
    if (lastGradeAffectingAction.actionType === 'تسوية وضع') {
      settleIncCount += diff;
    } else if (lastGradeAffectingAction.actionType === 'ترقية') {
      promoIncCount += diff;
    } else if (lastGradeAffectingAction.actionType === 'ترقية استثنائية') {
      exceptionalPromoCount += diff;
    } else {
      apptCount += diff;
    }
  } else if (currentSum > totalIncrements && empIncrements.length === 0) {
    // Normalize to exact total
    annualAutoCount = Math.max(0, totalIncrements - 1);
    apptCount = 1;
  }

  // 3. Build breakdown items list
  const breakdownItems: IncrementBreakdownItem[] = [];

  if (settleIncCount > 0) {
    breakdownItems.push({
      type: 'تسوية وضع',
      label: 'تسوية وضع',
      count: settleIncCount,
      source: 'آخر تسوية وضع وظيفي',
      badgeColor: 'bg-purple-100 text-purple-800 border-purple-200'
    });
  }

  if (promoIncCount > 0) {
    breakdownItems.push({
      type: 'علاوة ترقية',
      label: 'ترقية دورية',
      count: promoIncCount,
      source: 'قرار الترقية المعتمد',
      badgeColor: 'bg-blue-100 text-blue-800 border-blue-200'
    });
  }

  if (exceptionalPromoCount > 0) {
    breakdownItems.push({
      type: 'ترقية استثنائية',
      label: 'ترقية استثنائية',
      count: exceptionalPromoCount,
      source: 'قرار ترقية استثنائية',
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-200'
    });
  }

  if (apptCount > 0) {
    breakdownItems.push({
      type: 'علاوة تعيين',
      label: 'تعيين أصلي',
      count: apptCount,
      source: 'بداية التعيين والدرجة',
      badgeColor: 'bg-teal-100 text-teal-800 border-teal-200'
    });
  }

  if (annualAutoCount > 0) {
    breakdownItems.push({
      type: 'علاوة سنوية تلقائية',
      label: 'علاوة سنوية تلقائية',
      count: annualAutoCount,
      source: 'استحقاق سنوي دوري',
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200'
    });
  }

  if (manualCount > 0) {
    breakdownItems.push({
      type: 'علاوة يدوية',
      label: 'علاوة يدوية',
      count: manualCount,
      source: 'تعديل يدوي مباشر',
      badgeColor: 'bg-orange-100 text-orange-800 border-orange-200'
    });
  }

  if (otherCount > 0) {
    breakdownItems.push({
      type: 'تعديل إداري آخر',
      label: 'تعديل إداري',
      count: otherCount,
      source: 'إجراءات إدارية أخرى',
      badgeColor: 'bg-gray-100 text-gray-800 border-gray-200'
    });
  }

  // 4. Build concise summary text (e.g. "3 علاوات – آخر تسوية وضع | 4 علاوات – علاوات سنوية تلقائية")
  const summaryParts: string[] = [];
  breakdownItems.forEach((item) => {
    summaryParts.push(`${item.count} ${item.count === 1 ? 'علاوة' : 'علاوات'} – ${item.label}`);
  });

  const breakdownSummaryText = summaryParts.join(' | ') || `${totalIncrements} علاوات مسجلة`;

  return {
    totalIncrements,
    annualAutoIncrements: annualAutoCount,
    promotionIncrements: promoIncCount,
    settlementIncrements: settleIncCount,
    exceptionalPromotionIncrements: exceptionalPromoCount,
    manualIncrements: manualCount,
    appointmentIncrements: apptCount,
    otherAdjustmentIncrements: otherCount,
    lastPromotionDate: latestPromo?.effectiveDate || latestPromo?.decisionDate,
    lastSettlementDate: latestSettle?.effectiveDate,
    lastExceptionalPromoDate: latestExceptionalPromo?.effectiveDate || latestExceptionalPromo?.decisionDate,
    lastAnnualAutoDate: lastAnnualAutoInc?.effectiveDate,
    lastGradeAffectingAction,
    breakdownSummaryText,
    breakdownItems
  };
}

/**
 * CRITICAL RULE VALIDATOR:
 * Strictly verifies that the employee's Grade Entry Date is 100% UNCHANGED before and after an annual increment.
 * Throws an error if any change is detected.
 */
export function validateAnnualIncrementGradeSafety(
  prevGradeDate: string | undefined,
  newGradeDate: string | undefined,
  employeeFullName: string
): { isValid: boolean; error?: string } {
  const normPrev = (prevGradeDate || '').trim();
  const normNew = (newGradeDate || '').trim();

  if (normPrev !== normNew) {
    const errorMsg = `خطأ أمني حرج: تم محاولة تعديل تاريخ الدرجة الحالية للموظف (${employeeFullName}) من [${normPrev}] إلى [${normNew}] أثناء عملية صرف العلاوة السنوية التلقائية. النظام يمنع هذه العملية قطعياً حفاظاً على المرجع القانوني للترقية.`;
    console.error(errorMsg);
    return { isValid: false, error: errorMsg };
  }

  return { isValid: true };
}
