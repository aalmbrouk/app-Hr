import { 
  Employee, 
  CareerPromotionRecord, 
  PromotionRecord, 
  IncrementRecord, 
  StatusSettlementRecord, 
  GeneralProcedureRecord,
  GeneralProcedure,
  CareerActionType
} from '../types';
import { 
  isRegulation418Grade, 
  isGeneralNumericalGrade, 
  getGeneralNumericalRank,
  normalizeCareerActionType,
  getEmployeeCareerHistory,
  calculateEmployeeCareerSummary
} from './careerUtils';

export interface GradeRecalculationResult {
  employeeId: number;
  jobNumber: string;
  employeeName: string;
  
  // Current values in DB
  oldJobGrade: string;
  oldCurrentIncrement: number;
  oldGradeEntryDate: string;
  oldReviewStatus?: string;

  // New calculated values
  calculatedJobGrade: string;
  calculatedIncrement: number;
  calculatedGradeEntryDate: string;
  calculatedSalaryScale: string;
  
  // Evaluation details
  regulationCategory: 'نظام الدرجات العامة' | 'اللائحة 418 (تاريخي)' | 'مختلط / انتقال 2023' | 'غير محدد';
  evidenceRecordDesc: string;
  evidenceDate: string;
  evidenceDecisionNumber: string;
  
  // Flags
  isGradeChanged: boolean;
  isDateChanged: boolean;
  isIncrementChanged: boolean;
  isChanged: boolean;
  hasHistorical418: boolean;
  has2023Transition: boolean;
  isAmbiguous: boolean;
  hasInconsistency: boolean;
  anomalyReason?: string;
  recommendedReviewStatus: 'تمت المراجعة' | 'تحتاج إلى تصحيح' | 'لم تتم المراجعة';
  
  // Chronological actions audit
  chronologicalActionsCount: number;
  auditTrail: string[];
}

/**
 * Debug and audit information for an employee's chronological grade calculation (Rule 9)
 */
export interface LatestEffectiveGradeInfo {
  employeeId: number;
  jobNumber: string;
  employeeName: string;
  
  // Rule 9 Debug fields
  firstRecordedGrade: string;
  latestHistoricalGrade: string;
  latestGeneralGrade: string;
  latestGradeAction: string;
  effectiveDate: string;
  displayedCurrentGrade: string;
  
  // Operational details
  currentIncrement: number;
  gradeEntryDate: string;
  decisionDate: string;
  decisionNumber: string;
  isDifferentFromRecorded: boolean;
  source: string;
  chronologicalEventsCount: number;
  hasHistorical418: boolean;
  hasGeneralGrade: boolean;
  auditTrail: string[];
}

export interface ActiveDatabaseContext {
  employees: Employee[];
  careerRecords: CareerPromotionRecord[];
  promotions: PromotionRecord[];
  increments: IncrementRecord[];
  settlements: StatusSettlementRecord[];
  generalProcedures: (GeneralProcedureRecord | GeneralProcedure)[];
}

const activeDatabaseContext: ActiveDatabaseContext = {
  employees: [],
  careerRecords: [],
  promotions: [],
  increments: [],
  settlements: [],
  generalProcedures: []
};

/**
 * Registers active database records in memory so that getLatestEffectiveGrade(employeeId)
 * can be called as a single-parameter source of truth anywhere in the app.
 */
export function registerActiveDatabaseRecords(context: {
  employees?: Employee[];
  careerRecords?: CareerPromotionRecord[];
  promotions?: PromotionRecord[];
  increments?: IncrementRecord[];
  settlements?: StatusSettlementRecord[];
  generalProcedures?: (GeneralProcedureRecord | GeneralProcedure)[];
}): void {
  if (context.employees) activeDatabaseContext.employees = context.employees;
  if (context.careerRecords) activeDatabaseContext.careerRecords = context.careerRecords;
  if (context.promotions) activeDatabaseContext.promotions = context.promotions;
  if (context.increments) activeDatabaseContext.increments = context.increments;
  if (context.settlements) activeDatabaseContext.settlements = context.settlements;
  if (context.generalProcedures) activeDatabaseContext.generalProcedures = context.generalProcedures;
}

/**
 * Normalizes grade text display into standard Libyan official title (e.g., 'الدرجة الثامنة')
 */
export function normalizeGeneralGradeName(grade?: string): string {
  if (!grade) return 'الدرجة السابعة';
  const trimmed = grade.trim();
  
  // If already standard format
  if (trimmed.startsWith('الدرجة ')) {
    return trimmed;
  }
  if (trimmed.startsWith('درجة ')) {
    return 'الدرجة ' + trimmed.slice(5).trim();
  }

  const rank = getGeneralNumericalRank(trimmed);
  if (rank !== null) {
    const names = [
      '', 'الأولى', 'الثانية', 'الثالثة', 'الرابعة', 'الخامسة',
      'السادسة', 'السابعة', 'الثامنة', 'التاسعة', 'العاشرة',
      'الحادية عشرة', 'الثانية عشرة', 'الثالثة عشرة', 'الرابعة عشرة', 'الخامسة عشرة'
    ];
    if (names[rank]) {
      return `الدرجة ${names[rank]}`;
    }
  }

  return trimmed;
}

/**
 * Single source of truth calculation function:
 * Retrieves all career records, sorts chronologically, filters out non-grade changes,
 * and extracts the true latest effective General Grade.
 */
export interface GradeCalculationContext {
  careerRecords?: CareerPromotionRecord[];
  promotions?: PromotionRecord[];
  increments?: IncrementRecord[];
  settlements?: StatusSettlementRecord[];
  generalProcedures?: (GeneralProcedureRecord | GeneralProcedure)[];
  employees?: Employee[];
  asOfYear?: number;
  cutoffDate?: string;
}

export interface HistoricalGradeResult {
  effectiveGrade: string;
  effectiveGradeDate: string;
  decisionNumber: string;
  movementType: string;
  isUnderReview: boolean;
}

/**
 * Enhanced Single Source of Truth Engine:
 * Returns the latest valid effective Grade Information from chronological career history.
 * Supports historical cutoff dates / evaluation years for accurate historical reports.
 */
export function getLatestEffectiveGradeInfo(
  target: Employee | number | string,
  context?: GradeCalculationContext
): LatestEffectiveGradeInfo {
  // Resolve employee object
  let employee: Employee;
  const employeesList = context?.employees || activeDatabaseContext.employees;
  
  if (typeof target === 'object' && target !== null && 'id' in target) {
    employee = target as Employee;
  } else {
    const targetId = typeof target === 'number' ? target : parseInt(String(target), 10);
    const found = employeesList.find((e) => e.id === targetId || e.jobNumber === String(target));
    if (found) {
      employee = found;
    } else {
      employee = {
        id: typeof target === 'number' ? target : 0,
        jobNumber: String(target),
        fullName: `موظف رقم ${target}`,
        jobGrade: 'الدرجة السابعة',
        appointmentGrade: 'الدرجة السابعة',
        currentIncrement: 1,
        hireDate: '',
        directingDate: '',
        status: 'على رأس العمل'
      } as Employee;
    }
  }

  const empId = employee.id;
  const fileNum = (employee.jobNumber || '').trim();

  const cutoffLimit = context?.cutoffDate || (context?.asOfYear ? `${context.asOfYear}-12-31` : undefined);

  // Records sources
  const careerRecords = (context?.careerRecords || activeDatabaseContext.careerRecords) || [];
  const promotions = (context?.promotions || activeDatabaseContext.promotions) || [];
  const increments = (context?.increments || activeDatabaseContext.increments) || [];
  const settlements = (context?.settlements || activeDatabaseContext.settlements) || [];
  const generalProcedures = (context?.generalProcedures || activeDatabaseContext.generalProcedures) || [];

  const auditTrail: string[] = [];

  // Internal normalized ChronoEvent
  interface ChronoEvent {
    id: string;
    source: 'تعيين' | 'سجل_مسيرة' | 'ترقية' | 'علاوة' | 'تسوية' | 'إجراء_عام';
    actionType: string;
    normalizedAction: CareerActionType;
    isGradeChanging: boolean;
    isIncrementOnly: boolean;
    previousGrade: string;
    newGrade: string;
    increments: number;
    effectiveDate: string;
    decisionDate: string;
    decisionNumber: string;
    notes: string;
  }

  const events: ChronoEvent[] = [];

  // 1. Initial Appointment Baseline (only if hired on or before cutoffLimit)
  const hireDate = employee.hireDate || employee.directingDate || '';
  const initialAppGrade = (employee.appointmentGrade || employee.jobGrade || '').trim();
  const initialAppIncrements = employee.appointmentIncrements ?? 0;
  const isHiredBeforeCutoff = !cutoffLimit || (hireDate && hireDate <= cutoffLimit);
  
  if (isHiredBeforeCutoff && (hireDate || initialAppGrade)) {
    events.push({
      id: `init-hire-${empId}`,
      source: 'تعيين',
      actionType: 'تعيين',
      normalizedAction: 'تعيين',
      isGradeChanging: true,
      isIncrementOnly: false,
      previousGrade: '-',
      newGrade: initialAppGrade || 'الدرجة السابعة',
      increments: initialAppIncrements,
      effectiveDate: employee.directingDate || hireDate || '1990-01-01',
      decisionDate: hireDate || employee.directingDate || '1990-01-01',
      decisionNumber: 'قرار التعيين المباشر',
      notes: `نظام التعيين: ${employee.appointmentSalarySystem || 'قانون 15'}`
    });
  }

  // 1.5. Current Recorded Grade Baseline:
  // When an employee has intermediate career records (between appointment and current grade),
  // ensure the recorded current grade (if different from appointment and has gradeEntryDate)
  // is recognized in the chronological timeline so it is not superseded by intermediate steps.
  const currentRecordedGrade = (employee.jobGrade || '').trim();
  const currentGradeDate = employee.gradeEntryDate || (employee as any).currentGradeDateStorage || '';
  const isCurrentBeforeCutoff = !cutoffLimit || (currentGradeDate && currentGradeDate <= cutoffLimit);

  if (
    currentRecordedGrade &&
    currentRecordedGrade !== initialAppGrade &&
    currentGradeDate &&
    isCurrentBeforeCutoff
  ) {
    const isSettle = (employee.transactionType || '').includes('تسوية');
    const isExcep = (employee.transactionType || '').includes('استثنائية');
    const actType: CareerActionType = isSettle ? 'تسوية وضع' : (isExcep ? 'ترقية استثنائية' : 'ترقية');

    events.push({
      id: `current-grade-${empId}`,
      source: 'سجل_مسيرة',
      actionType: employee.transactionType || actType,
      normalizedAction: actType,
      isGradeChanging: true,
      isIncrementOnly: false,
      previousGrade: initialAppGrade || '',
      newGrade: currentRecordedGrade,
      increments: employee.currentIncrement ?? 1,
      effectiveDate: currentGradeDate,
      decisionDate: currentGradeDate,
      decisionNumber: 'الدرجة الحالية المسجلة',
      notes: `الدرجة الحالية المسجلة بملف الموظف (${employee.transactionType || 'ترقية'})`
    });
  }

  // 2. Direct Career Promotion Records
  careerRecords
    .filter((c) => c.employeeId === empId || (fileNum && (c.fileNumber || '').trim() === fileNum))
    .forEach((c) => {
      const norm = normalizeCareerActionType(c.actionType);
      const effDate = c.actionDate || c.effectiveDate || c.decisionDate || c.createdAt?.slice(0, 10) || '';
      if (cutoffLimit && effDate > cutoffLimit) return;
      const decDate = c.decisionDate || c.decisionIssueDate || effDate;
      const isInc = norm === 'علاوة دورية' || norm === 'علاوة سنوية' || (c.actionType || '').includes('علاوة');
      const isNonGradeMovement = [
        'تكليف',
        'إنهاء تكليف',
        'نقل',
        'تغيير مكان العمل',
        'ندب',
        'انتهاء الندب',
        'العودة من الندب',
        'تغيير المسمى الوظيفي',
        'حركة وظيفية أخرى',
        'إعارة / نقل خارجي'
      ].includes(norm);
      const hasGrade = !isNonGradeMovement && !!(c.newGrade && c.newGrade !== '-' && c.newGrade.trim() !== '');

      events.push({
        id: `career-${c.id}`,
        source: 'سجل_مسيرة',
        actionType: c.actionType || norm,
        normalizedAction: norm,
        isGradeChanging: !isInc && !isNonGradeMovement && hasGrade,
        isIncrementOnly: isInc,
        previousGrade: c.previousGrade || '',
        newGrade: c.newGrade || '',
        increments: c.newIncrement ?? c.newIncrementCount ?? 0,
        effectiveDate: effDate,
        decisionDate: decDate,
        decisionNumber: c.decisionNumber || '',
        notes: c.notes || ''
      });
    });

  // 3. Promotions
  promotions
    .filter((p) => p.employeeId === empId || (fileNum && (p.fileNumber || '').trim() === fileNum))
    .forEach((p) => {
      const isExceptional = p.promotionType === 'ترقية استثنائية';
      const effDate = p.effectiveDate || p.decisionDate || p.createdAt?.slice(0, 10) || '';
      if (cutoffLimit && effDate > cutoffLimit) return;
      const decDate = p.decisionDate || effDate;
      const norm: CareerActionType = isExceptional ? 'ترقية استثنائية' : 'ترقية';
      const hasGrade = !!(p.newGrade && p.newGrade !== '-' && p.newGrade.trim() !== '');

      events.push({
        id: `promo-${p.id}`,
        source: 'ترقية',
        actionType: p.promotionType || norm,
        normalizedAction: norm,
        isGradeChanging: hasGrade,
        isIncrementOnly: false,
        previousGrade: p.previousGrade || '',
        newGrade: p.newGrade || '',
        increments: p.newIncrement ?? 0,
        effectiveDate: effDate,
        decisionDate: decDate,
        decisionNumber: p.decisionNumber || '',
        notes: p.notes || p.reason || ''
      });
    });

  // 4. Increments (Annual increments do NOT change grade or current grade date)
  increments
    .filter((i) => i.employeeId === empId || (fileNum && (i.fileNumber || '').trim() === fileNum))
    .forEach((i) => {
      const effDate = i.effectiveDate || i.date || i.createdAt?.slice(0, 10) || '';
      if (cutoffLimit && effDate > cutoffLimit) return;
      const decDate = i.decisionDate || effDate;
      events.push({
        id: `inc-${i.id}`,
        source: 'علاوة',
        actionType: i.incrementType || 'علاوة دورية',
        normalizedAction: 'علاوة دورية',
        isGradeChanging: false, // Rule 3: increment is NOT a grade change
        isIncrementOnly: true,
        previousGrade: i.previousGrade || '',
        newGrade: i.newGrade || i.previousGrade || '',
        increments: i.newIncrement ?? 1,
        effectiveDate: effDate,
        decisionDate: decDate,
        decisionNumber: i.decisionNumber || '',
        notes: i.notes || ''
      });
    });

  // 5. Status Settlements
  settlements
    .filter((s) => s.employeeId === empId)
    .forEach((s) => {
      const effDate = s.effectiveDate || s.createdAt?.slice(0, 10) || '';
      if (cutoffLimit && effDate > cutoffLimit) return;
      const decDate = s.effectiveDate || effDate;
      const is2023 = effDate.startsWith('2023');
      const isNum = isGeneralNumericalGrade(s.grade);
      const norm: CareerActionType = (is2023 && isNum) 
        ? 'تحويل من اللائحة 418 إلى نظام الدرجات العامة' 
        : 'تسوية وضع';
      const hasGrade = !!(s.grade && s.grade !== '-' && s.grade.trim() !== '');

      events.push({
        id: `settle-${s.id}`,
        source: 'تسوية',
        actionType: norm,
        normalizedAction: norm,
        isGradeChanging: hasGrade,
        isIncrementOnly: false,
        previousGrade: '',
        newGrade: s.grade || '',
        increments: 0,
        effectiveDate: effDate,
        decisionDate: decDate,
        decisionNumber: s.decisionNumber || '',
        notes: s.notes || s.reason || ''
      });
    });

  // 6. General Procedures affecting grade
  generalProcedures
    .filter((g) => g.employeeId === empId || (fileNum && (g.fileNumber || '').trim() === fileNum))
    .forEach((g) => {
      const gp = g as any;
      const effDate = gp.effectiveDate || gp.procedureDate || gp.createdAt?.slice(0, 10) || '';
      if (cutoffLimit && effDate > cutoffLimit) return;
      const decDate = gp.procedureDate || effDate;
      const pType = (gp.procedureType || '').trim();
      let norm: CareerActionType = 'ترقية';
      if (pType.includes('استثنائية')) norm = 'ترقية استثنائية';
      else if (pType.includes('تسوية')) norm = 'تسوية وضع';
      else if (pType.includes('علاوة')) norm = 'علاوة دورية';
      else if (pType.includes('ندب')) norm = 'ندب على درجة';
      else if (pType.includes('418')) norm = 'تحويل من اللائحة 418 إلى نظام الدرجات العامة';

      const isInc = norm === 'علاوة دورية' || pType.includes('علاوة');
      const hasGrade = !!(gp.newGrade && gp.newGrade !== '-' && gp.newGrade.trim() !== '');

      if (hasGrade || isInc) {
        events.push({
          id: `gp-${gp.id}`,
          source: 'إجراء_عام',
          actionType: pType || norm,
          normalizedAction: norm,
          isGradeChanging: !isInc && hasGrade,
          isIncrementOnly: isInc,
          previousGrade: gp.previousGrade || '',
          newGrade: gp.newGrade || '',
          increments: 0,
          effectiveDate: effDate,
          decisionDate: decDate,
          decisionNumber: gp.procedureNumber || '',
          notes: gp.description || ''
        });
      }
    });

  // Deduplicate events by content signature
  const uniqueEvents: ChronoEvent[] = [];
  const seenSignatures = new Set<string>();

  events.forEach((ev) => {
    const sig = `${ev.normalizedAction}_${ev.effectiveDate}_${ev.decisionDate}_${ev.newGrade}_${ev.increments}_${ev.decisionNumber}`;
    if (!seenSignatures.has(sig)) {
      seenSignatures.add(sig);
      uniqueEvents.push(ev);
    }
  });

  // If cutoff limit is given and no valid events exist up to that date:
  if (cutoffLimit && uniqueEvents.length === 0) {
    return {
      employeeId: employee.id,
      jobNumber: employee.jobNumber || '',
      employeeName: employee.fullName || '',
      firstRecordedGrade: 'تحتاج إلى مراجعة',
      latestHistoricalGrade: 'تحتاج إلى مراجعة',
      latestGeneralGrade: 'تحتاج إلى مراجعة',
      latestGradeAction: 'تحتاج إلى مراجعة',
      effectiveDate: '',
      displayedCurrentGrade: 'تحتاج إلى مراجعة',
      currentIncrement: 0,
      gradeEntryDate: '',
      decisionDate: '',
      decisionNumber: '',
      isDifferentFromRecorded: true,
      source: 'تحتاج إلى مراجعة',
      chronologicalEventsCount: 0,
      hasHistorical418: false,
      hasGeneralGrade: false,
      auditTrail: [`لا توجد أي حركات وظيفية أو تعيين معتمد للموظف حتى تاريخ (${cutoffLimit}) — تحتاج إلى مراجعة`]
    };
  }

  // Rule 2 CHRONOLOGICAL SORTING:
  // 1. Effective Date ascending
  // 2. Decision Date ascending when Effective Date is equal
  // 3. Stable record ID as final tie-breaker
  uniqueEvents.sort((a, b) => {
    const effA = (a.effectiveDate || '').trim();
    const effB = (b.effectiveDate || '').trim();
    if (effA && effB && effA !== effB) {
      return effA.localeCompare(effB);
    }
    if (effA && !effB) return 1;
    if (!effA && effB) return -1;

    const decA = (a.decisionDate || '').trim();
    const decB = (b.decisionDate || '').trim();
    if (decA && decB && decA !== decB) {
      return decA.localeCompare(decB);
    }
    if (decA && !decB) return 1;
    if (!decA && decB) return -1;

    // Appointment goes first if on same date
    if (a.source === 'تعيين' && b.source !== 'تعيين') return -1;
    if (b.source === 'تعيين' && a.source !== 'تعيين') return 1;

    return String(a.id || '').localeCompare(String(b.id || ''));
  });

  // Identify FIRST recorded grade in history
  let firstRecordedGrade = '';
  for (const ev of uniqueEvents) {
    if (ev.newGrade && ev.newGrade !== '-') {
      firstRecordedGrade = ev.newGrade;
      break;
    }
  }
  if (!firstRecordedGrade) {
    firstRecordedGrade = employee.appointmentGrade || employee.jobGrade || 'الدرجة السابعة';
  }

  // Traversal state
  let currentGrade = firstRecordedGrade;
  let latestHistorical418Grade = '';
  let latestGeneralGrade = '';
  let latestGradeAction = 'تعيين';
  let latestEffectiveDate = employee.directingDate || employee.hireDate || '';
  let latestDecisionDate = '';
  let latestDecisionNumber = '';
  let currentIncrement = employee.currentIncrement ?? 1;
  let gradeEntryDate = employee.gradeEntryDate || latestEffectiveDate;

  let hasHistorical418 = false;
  let hasGeneralGrade = false;

  auditTrail.push(`بدء احتساب أحدث درجة نافذة للموظف [${employee.jobNumber}] (${uniqueEvents.length} حركة مسجلة)`);

  // Traverse chronologically ascending (oldest to newest)
  uniqueEvents.forEach((ev, idx) => {
    const dateStr = ev.effectiveDate || ev.decisionDate;
    const isGrade418 = isRegulation418Grade(ev.newGrade);
    const isGradeGen = isGeneralNumericalGrade(ev.newGrade);

    if (isGrade418) {
      hasHistorical418 = true;
      latestHistorical418Grade = ev.newGrade;
    }
    if (isGradeGen) {
      hasGeneralGrade = true;
    }

    // Rule 3: Annual increment is NOT a grade change
    if (ev.isIncrementOnly || ev.normalizedAction === 'علاوة دورية') {
      if (ev.increments !== undefined && ev.increments > 0) {
        currentIncrement = ev.increments;
      }
      auditTrail.push(
        `[${idx + 1}] علاوة دورية (${dateStr}): تحديث رصيد العلاوات إلى (${currentIncrement}) دون تغيير الدرجة (${currentGrade})`
      );
      return;
    }

    // Grade-changing action
    if (ev.isGradeChanging && ev.newGrade && ev.newGrade !== '-') {
      const candidateGrade = ev.newGrade.trim();

      // Rule 4: Regulation 418 records must NOT override a later General Grade
      if (isGrade418) {
        if (latestGeneralGrade) {
          auditTrail.push(
            `[${idx + 1}] سجل لائحة 418 تاريخي (${candidateGrade} بتاريخ ${dateStr}) — لا يلغي الدرجة العامة الأحدث (${latestGeneralGrade})`
          );
        } else {
          currentGrade = candidateGrade;
          latestGradeAction = ev.actionType || ev.normalizedAction;
          latestEffectiveDate = dateStr;
          latestDecisionDate = ev.decisionDate;
          latestDecisionNumber = ev.decisionNumber;
          auditTrail.push(`[${idx + 1}] اعتماد تصنيف 418 تاريخي: ${candidateGrade} بتاريخ ${dateStr}`);
        }
      } else if (isGradeGen) {
        // Rule 5: A later valid promotion MUST replace the previous current grade
        const normalizedGeneral = normalizeGeneralGradeName(candidateGrade);
        latestGeneralGrade = normalizedGeneral;
        currentGrade = normalizedGeneral;
        latestGradeAction = ev.actionType || ev.normalizedAction;
        latestEffectiveDate = dateStr;
        latestDecisionDate = ev.decisionDate;
        latestDecisionNumber = ev.decisionNumber;
        gradeEntryDate = dateStr || gradeEntryDate;
        if (ev.increments !== undefined && ev.increments >= 0) {
          currentIncrement = ev.increments;
        }
        auditTrail.push(
          `[${idx + 1}] تحديث الدرجة العامة إلى (${normalizedGeneral}) عبر [${latestGradeAction}] قرار (${ev.decisionNumber || '—'}) نافذ في (${dateStr})`
        );
      } else {
        // Other customized general grade text
        currentGrade = candidateGrade;
        latestGradeAction = ev.actionType || ev.normalizedAction;
        latestEffectiveDate = dateStr;
        latestDecisionDate = ev.decisionDate;
        latestDecisionNumber = ev.decisionNumber;
        auditTrail.push(`[${idx + 1}] تسجيل درجة خاصة: (${candidateGrade}) عبر [${latestGradeAction}] بتاريخ (${dateStr})`);
      }
    }
  });

  // Final determination of displayedCurrentGrade:
  // Rule 1: Current Grade = the latest valid effective General Grade found in career history.
  // Rule 4: Regulation 418 records must not override a later General Grade.
  let displayedCurrentGrade = '';
  if (latestGeneralGrade) {
    displayedCurrentGrade = latestGeneralGrade;
  } else if (currentGrade && !isRegulation418Grade(currentGrade)) {
    displayedCurrentGrade = normalizeGeneralGradeName(currentGrade);
  } else if (latestHistorical418Grade) {
    displayedCurrentGrade = latestHistorical418Grade;
  } else if (!cutoffLimit && employee.jobGrade && isGeneralNumericalGrade(employee.jobGrade)) {
    displayedCurrentGrade = normalizeGeneralGradeName(employee.jobGrade);
  } else if (!cutoffLimit && employee.jobGrade) {
    displayedCurrentGrade = employee.jobGrade;
  } else if (cutoffLimit) {
    displayedCurrentGrade = 'تحتاج إلى مراجعة';
    latestGradeAction = 'تحتاج إلى مراجعة';
    gradeEntryDate = '';
    latestEffectiveDate = '';
  } else {
    displayedCurrentGrade = 'الدرجة السابعة';
  }

  const isDifferentFromRecorded = (employee.jobGrade || '').trim() !== displayedCurrentGrade.trim();

  return {
    employeeId: employee.id,
    jobNumber: employee.jobNumber || '',
    employeeName: employee.fullName || '',
    firstRecordedGrade: normalizeGeneralGradeName(firstRecordedGrade) || firstRecordedGrade,
    latestHistoricalGrade: latestHistorical418Grade || firstRecordedGrade,
    latestGeneralGrade: latestGeneralGrade || displayedCurrentGrade,
    latestGradeAction,
    effectiveDate: latestEffectiveDate || employee.directingDate || employee.hireDate || '',
    displayedCurrentGrade,
    currentIncrement,
    gradeEntryDate: gradeEntryDate || latestEffectiveDate,
    decisionDate: latestDecisionDate,
    decisionNumber: latestDecisionNumber,
    isDifferentFromRecorded,
    source: latestGradeAction,
    chronologicalEventsCount: uniqueEvents.length,
    hasHistorical418,
    hasGeneralGrade,
    auditTrail
  };
}

/**
 * Single Source of Truth for Historical Competency Evaluation Grade:
 * Determines the employee's active effective grade and grade date for the selected evaluation year.
 * Returns 'تحتاج إلى مراجعة' if no valid grade exists on or before the evaluation year.
 */
export function getGradeAtEvaluationYear(
  target: Employee | number | string,
  evaluationYear: number,
  context?: GradeCalculationContext
): HistoricalGradeResult {
  const info = getLatestEffectiveGradeInfo(target, {
    ...context,
    asOfYear: evaluationYear
  });

  const isUnderReview = !info.displayedCurrentGrade || 
                        info.displayedCurrentGrade === 'تحتاج إلى مراجعة' || 
                        info.chronologicalEventsCount === 0;

  return {
    effectiveGrade: isUnderReview ? 'تحتاج إلى مراجعة' : info.displayedCurrentGrade,
    effectiveGradeDate: isUnderReview ? '' : (info.gradeEntryDate || info.effectiveDate || ''),
    decisionNumber: isUnderReview ? '' : info.decisionNumber,
    movementType: isUnderReview ? 'تحتاج إلى مراجعة' : info.latestGradeAction,
    isUnderReview
  };
}

/**
 * SINGLE SOURCE OF TRUTH FUNCTION: getLatestEffectiveGrade(employeeId)
 * Returns the latest valid effective General Grade based on the complete chronological career history.
 */
export function getLatestEffectiveGrade(
  target: Employee | number | string,
  context?: {
    careerRecords?: CareerPromotionRecord[];
    promotions?: PromotionRecord[];
    increments?: IncrementRecord[];
    settlements?: StatusSettlementRecord[];
    generalProcedures?: (GeneralProcedureRecord | GeneralProcedure)[];
    employees?: Employee[];
  }
): string {
  const info = getLatestEffectiveGradeInfo(target, context);
  return info.displayedCurrentGrade;
}

/**
 * Returns the latest effective increment count based on the complete chronological career history.
 */
export function getLatestEffectiveIncrement(
  target: Employee | number | string,
  context?: {
    careerRecords?: CareerPromotionRecord[];
    promotions?: PromotionRecord[];
    increments?: IncrementRecord[];
    settlements?: StatusSettlementRecord[];
    generalProcedures?: (GeneralProcedureRecord | GeneralProcedure)[];
    employees?: Employee[];
  }
): number {
  const info = getLatestEffectiveGradeInfo(target, context);
  return info.currentIncrement;
}

/**
 * Primary Core Engine:
 * Chronologically parses all career actions and determines the true Current Grade,
 * respecting the 2023 Regulation 418 transition rules and annual increment logic.
 */
export function calculateEmployeeCurrentGrade(
  employee: Employee,
  careerRecords: CareerPromotionRecord[] = [],
  promotions: PromotionRecord[] = [],
  increments: IncrementRecord[] = [],
  settlements: StatusSettlementRecord[] = [],
  generalProcedures: GeneralProcedureRecord[] = []
): GradeRecalculationResult {
  const safeCareerRecords = careerRecords || [];
  const safePromotions = promotions || [];
  const safeIncrements = increments || [];
  const safeSettlements = settlements || [];
  const safeGeneralProcedures = generalProcedures || [];

  const info = getLatestEffectiveGradeInfo(employee, {
    careerRecords: safeCareerRecords,
    promotions: safePromotions,
    increments: safeIncrements,
    settlements: safeSettlements,
    generalProcedures: safeGeneralProcedures
  });
  const auditTrail: string[] = [...info.auditTrail];
  const empId = employee.id;
  const fileNum = (employee.jobNumber || '').trim();

  // 1. Gather all events for this employee
  interface ChronoEvent {
    id: string;
    source: 'تعيين' | 'سجل_مسيرة' | 'ترقية' | 'علاوة' | 'تسوية' | 'إجراء_عام';
    actionType: CareerActionType | string;
    normalizedAction: CareerActionType;
    previousGrade: string;
    newGrade: string;
    increments: number;
    effectiveDate: string;
    decisionDate: string;
    decisionNumber: string;
    notes: string;
  }

  const events: ChronoEvent[] = [];

  // Initial Appointment
  const hireDate = employee.hireDate || employee.directingDate || '';
  if (hireDate) {
    const appGrade = employee.appointmentGrade || 'الدرجة السابعة';
    const appInc = employee.appointmentIncrements ?? 0;
    events.push({
      id: `init-hire-${empId}`,
      source: 'تعيين',
      actionType: 'تعيين',
      normalizedAction: 'تعيين',
      previousGrade: '-',
      newGrade: appGrade,
      increments: appInc,
      effectiveDate: employee.directingDate || hireDate,
      decisionDate: hireDate,
      decisionNumber: 'قرار التعيين الأصلي',
      notes: `نظام التعيين: ${employee.appointmentSalarySystem || 'قانون 15'}`
    });
  }

  // Current Recorded Grade Baseline
  const currentJobGradeVal = (employee.jobGrade || '').trim();
  const currentGradeDateVal = employee.gradeEntryDate || (employee as any).currentGradeDateStorage || '';
  if (currentJobGradeVal && currentJobGradeVal !== (employee.appointmentGrade || '').trim() && currentGradeDateVal) {
    const isSettle = (employee.transactionType || '').includes('تسوية');
    const isExcep = (employee.transactionType || '').includes('استثنائية');
    const actType: CareerActionType = isSettle ? 'تسوية وضع' : (isExcep ? 'ترقية استثنائية' : 'ترقية');

    events.push({
      id: `current-grade-${empId}`,
      source: 'سجل_مسيرة',
      actionType: employee.transactionType || actType,
      normalizedAction: actType,
      previousGrade: employee.appointmentGrade || '',
      newGrade: currentJobGradeVal,
      increments: employee.currentIncrement ?? 1,
      effectiveDate: currentGradeDateVal,
      decisionDate: currentGradeDateVal,
      decisionNumber: 'الدرجة الحالية المسجلة',
      notes: `الدرجة الحالية المسجلة (${employee.transactionType || 'ترقية'})`
    });
  }

  // Direct Career Promotion Records
  safeCareerRecords
    .filter((c) => c.employeeId === empId || (fileNum && (c.fileNumber || '').trim() === fileNum))
    .forEach((c) => {
      const norm = normalizeCareerActionType(c.actionType);
      const effDate = c.actionDate || c.decisionDate || c.createdAt?.slice(0, 10) || '';
      events.push({
        id: `career-${c.id}`,
        source: 'سجل_مسيرة',
        actionType: c.actionType,
        normalizedAction: norm,
        previousGrade: c.previousGrade || '',
        newGrade: c.newGrade || '',
        increments: c.newIncrement ?? 0,
        effectiveDate: effDate,
        decisionDate: c.decisionDate || effDate,
        decisionNumber: c.decisionNumber || '',
        notes: c.notes || ''
      });
    });

  // Legacy Promotion Records
  safePromotions
    .filter((p) => p.employeeId === empId || (fileNum && (p.fileNumber || '').trim() === fileNum))
    .forEach((p) => {
      const isExceptional = p.promotionType === 'ترقية استثنائية';
      const effDate = p.effectiveDate || p.decisionDate || p.createdAt?.slice(0, 10) || '';
      events.push({
        id: `promo-${p.id}`,
        source: 'ترقية',
        actionType: isExceptional ? 'ترقية استثنائية' : 'ترقية',
        normalizedAction: isExceptional ? 'ترقية استثنائية' : 'ترقية',
        previousGrade: p.previousGrade || '',
        newGrade: p.newGrade || '',
        increments: p.newIncrement ?? 0,
        effectiveDate: effDate,
        decisionDate: p.decisionDate || effDate,
        decisionNumber: p.decisionNumber || '',
        notes: p.notes || p.reason || ''
      });
    });

  // Legacy Increments
  safeIncrements
    .filter((i) => i.employeeId === empId || (fileNum && (i.fileNumber || '').trim() === fileNum))
    .forEach((i) => {
      const effDate = i.effectiveDate || i.date || i.createdAt?.slice(0, 10) || '';
      events.push({
        id: `inc-${i.id}`,
        source: 'علاوة',
        actionType: i.incrementType || 'علاوة دورية',
        normalizedAction: 'علاوة دورية',
        previousGrade: i.previousGrade || '',
        newGrade: i.newGrade || i.previousGrade || '',
        increments: i.newIncrement ?? 1,
        effectiveDate: effDate,
        decisionDate: i.decisionDate || effDate,
        decisionNumber: i.decisionNumber || '',
        notes: i.notes || ''
      });
    });

  // Status Settlements
  safeSettlements
    .filter((s) => s.employeeId === empId)
    .forEach((s) => {
      const effDate = s.effectiveDate || s.createdAt?.slice(0, 10) || '';
      const is2023 = effDate.startsWith('2023');
      const isNum = isGeneralNumericalGrade(s.grade);
      const norm: CareerActionType = (is2023 && isNum) 
        ? 'تحويل من اللائحة 418 إلى نظام الدرجات العامة' 
        : 'تسوية وضع';

      events.push({
        id: `settle-${s.id}`,
        source: 'تسوية',
        actionType: norm,
        normalizedAction: norm,
        previousGrade: '',
        newGrade: s.grade || '',
        increments: 0,
        effectiveDate: effDate,
        decisionDate: s.effectiveDate || '',
        decisionNumber: s.decisionNumber || '',
        notes: s.notes || s.reason || ''
      });
    });

  // General Procedures (e.g. Exceptional promotions, Grade assignments)
  safeGeneralProcedures
    .filter((g) => g.employeeId === empId || (fileNum && (g.fileNumber || '').trim() === fileNum))
    .forEach((g) => {
      const gp = g as any;
      const effDate = gp.effectiveDate || gp.procedureDate || gp.createdAt?.slice(0, 10) || '';
      const pType = (gp.procedureType || '').trim();
      let norm: CareerActionType = 'ترقية';
      if (pType.includes('استثنائية')) norm = 'ترقية استثنائية';
      else if (pType.includes('تسوية')) norm = 'تسوية وضع';
      else if (pType.includes('علاوة')) norm = 'علاوة دورية';
      else if (pType.includes('ندب')) norm = 'ندب على درجة';
      else if (pType.includes('418')) norm = 'تحويل من اللائحة 418 إلى نظام الدرجات العامة';

      if (gp.newGrade) {
        events.push({
          id: `gp-${gp.id}`,
          source: 'إجراء_عام',
          actionType: pType || norm,
          normalizedAction: norm,
          previousGrade: gp.previousGrade || '',
          newGrade: gp.newGrade || '',
          increments: 0,
          effectiveDate: effDate,
          decisionDate: gp.procedureDate || effDate,
          decisionNumber: gp.procedureNumber || '',
          notes: gp.description || ''
        });
      }
    });

  // Deduplicate events by content signature
  const uniqueEvents: ChronoEvent[] = [];
  const seenSignatures = new Set<string>();

  events.forEach((ev) => {
    const sig = `${ev.normalizedAction}_${ev.effectiveDate}_${ev.newGrade}_${ev.increments}_${ev.decisionNumber}`;
    if (!seenSignatures.has(sig)) {
      seenSignatures.add(sig);
      uniqueEvents.push(ev);
    }
  });

  // Sort Chronologically Ascending (oldest to newest)
  uniqueEvents.sort((a, b) => {
    const tA = a.effectiveDate || a.decisionDate || '';
    const tB = b.effectiveDate || b.decisionDate || '';
    if (tA && tB) {
      const comp = tA.localeCompare(tB);
      if (comp !== 0) return comp;
    }
    // Secondary tie-breaker: hire goes first
    if (a.source === 'تعيين') return -1;
    if (b.source === 'تعيين') return 1;
    return 0;
  });

  // Trace State progression
  let currentGrade = employee.jobGrade || 'الدرجة السابعة';
  let currentIncrement = employee.currentIncrement ?? 1;
  let gradeEntryDate = employee.gradeEntryDate || employee.directingDate || employee.hireDate || '';
  let salaryScale = employee.salaryScale || 'جدول المرتبات الموحد';
  
  let evidenceDesc = 'البيانات المسجلة بملف الموظف';
  let evidenceDate = gradeEntryDate;
  let evidenceDecNum = '';
  
  let hasHistorical418 = false;
  let has2023Transition = false;
  let hasPost2023General = false;
  let isAmbiguous = false;
  let hasInconsistency = false;
  let anomalyReason: string | undefined = undefined;

  // Audit trail initialization
  auditTrail.push(`بدء التتبع الزمني لسجل الموظف [${employee.jobNumber}] (${uniqueEvents.length} حركات موثقة)`);

  // Chronological execution
  uniqueEvents.forEach((ev, idx) => {
    const dateStr = ev.effectiveDate || ev.decisionDate;
    const year = dateStr ? parseInt(dateStr.slice(0, 4), 10) : 0;
    const isPost2023 = dateStr > '2023-12-31';
    const isYear2023 = year === 2023;

    const isGrade418 = isRegulation418Grade(ev.newGrade);
    const isGradeGeneral = isGeneralNumericalGrade(ev.newGrade);

    if (isGrade418) hasHistorical418 = true;
    if (isGradeGeneral && (isYear2023 || isPost2023)) hasPost2023General = true;

    // Check if this action is a transition from 418
    if (ev.normalizedAction === 'تحويل من اللائحة 418 إلى نظام الدرجات العامة' || (isYear2023 && isGradeGeneral && hasHistorical418)) {
      has2023Transition = true;
    }

    auditTrail.push(
      `[${idx + 1}] تاريخ: ${dateStr || 'غير محدد'} | إجراء: ${ev.normalizedAction} | الدرجة: ${ev.newGrade || '—'} | العلاوة: ${ev.increments} | قرار: ${ev.decisionNumber || '—'}`
    );

    // Logic: Grade-affecting actions vs Increments
    if (
      ev.normalizedAction === 'ترقية' ||
      ev.normalizedAction === 'ترقية استثنائية' ||
      ev.normalizedAction === 'تسوية وضع' ||
      ev.normalizedAction === 'ندب على درجة' ||
      ev.normalizedAction === 'تحويل من اللائحة 418 إلى نظام الدرجات العامة' ||
      (ev.normalizedAction === 'تعيين' && uniqueEvents.length === 1)
    ) {
      if (ev.newGrade && ev.newGrade !== '-') {
        // Priority check: Never let an old 418 grade overwrite a newer General Grade
        if (isGrade418 && hasPost2023General && isPost2023) {
          hasInconsistency = true;
          isAmbiguous = true;
          anomalyReason = `محاولة تسجيل تصنيف لائحة 418 (${ev.newGrade}) بتاريخ بعد 2023 رغم وجود درجات عامة موحدة.`;
          auditTrail.push(`⚠️ تنبيه تعارض: ${anomalyReason}`);
        } else {
          currentGrade = normalizeGeneralGradeName(ev.newGrade);
          if (ev.increments > 0) {
            currentIncrement = ev.increments;
          }
          if (dateStr) {
            gradeEntryDate = dateStr;
          }
          evidenceDesc = `${ev.normalizedAction} إلى (${currentGrade})`;
          evidenceDate = dateStr;
          evidenceDecNum = ev.decisionNumber;
        }
      }
    } else if (ev.normalizedAction === 'علاوة دورية') {
      // Annual Increments: DO NOT CHANGE gradeEntryDate!
      if (ev.increments > 0) {
        currentIncrement = ev.increments;
        auditTrail.push(`زيادة عدد العلاوات إلى (${currentIncrement}) مع تثبيت تاريخ استحقاق الدرجة (${gradeEntryDate})`);
      }
    }
  });

  // Final check on Current Grade against Regulation 418 vs General Scale rules:
  // Rule A & D: If an employee transitioned to General Grade in 2023 or has general grade records,
  // their Current Grade MUST be the General Grade, NOT the old Regulation 418 title!
  const isCurrentGrade418 = isRegulation418Grade(currentGrade);
  
  if (isCurrentGrade418) {
    if (hasPost2023General || has2023Transition) {
      // Find the latest valid general grade from history
      const latestGeneralAction = [...uniqueEvents].reverse().find(
        (ev) => isGeneralNumericalGrade(ev.newGrade) &&
                (ev.normalizedAction === 'ترقية' || 
                 ev.normalizedAction === 'ترقية استثنائية' || 
                 ev.normalizedAction === 'تسوية وضع' ||
                 ev.normalizedAction === 'تحويل من اللائحة 418 إلى نظام الدرجات العامة')
      );
      if (latestGeneralAction && latestGeneralAction.newGrade) {
        currentGrade = normalizeGeneralGradeName(latestGeneralAction.newGrade);
        if (latestGeneralAction.effectiveDate) {
          gradeEntryDate = latestGeneralAction.effectiveDate;
        }
        evidenceDesc = `استرجاع الدرجة العامة الأحدث (${currentGrade}) بعد انتهاء العمل باللائحة 418`;
        evidenceDate = latestGeneralAction.effectiveDate;
        evidenceDecNum = latestGeneralAction.decisionNumber;
        auditTrail.push(`✅ تصحيح تلقائي: استبدال تصنيف 418 القديم بالدرجة العامة المعتمدة (${currentGrade})`);
      } else {
        isAmbiguous = true;
        anomalyReason = 'الموظف يحمل تصنيف لائحة 418 فقط ولم يتم تسجيل درجة عامة بالجدول الموحد بعد 2023.';
      }
    } else {
      // TEST 3 Scenario: Only historical Regulation 418 records exist and no post-2023 general grade
      // Do NOT invent a general grade; mark as requiring review!
      isAmbiguous = true;
      anomalyReason = 'سجل طبي سابق خاضع للائحة 418 لم تتم تسوية وضعه بعد إلى جدول الدرجات العامة الموحد.';
    }
  }

  // Detect logically impossible transitions (e.g. Grade 8 -> Grade 5 without justification)
  const prevRank = getGeneralNumericalRank(employee.appointmentGrade);
  const curRank = getGeneralNumericalRank(currentGrade);
  if (prevRank !== null && curRank !== null && curRank < prevRank) {
    // Rank lowered without settlement
    const hasSettlement = uniqueEvents.some(
      (e) => e.normalizedAction === 'تسوية وضع' || e.normalizedAction === 'ندب على درجة'
    );
    if (!hasSettlement) {
      hasInconsistency = true;
      isAmbiguous = true;
      anomalyReason = `انخفاض غير مبرر في الدرجة من التعيين (${employee.appointmentGrade} [${prevRank}]) إلى الحالية (${currentGrade} [${curRank}]).`;
    }
  }

  // Determine Regulation Category
  let regulationCategory: 'نظام الدرجات العامة' | 'اللائحة 418 (تاريخي)' | 'مختلط / انتقال 2023' | 'غير محدد' = 'نظام الدرجات العامة';
  if (hasHistorical418 && (has2023Transition || hasPost2023General)) {
    regulationCategory = 'مختلط / انتقال 2023';
  } else if (hasHistorical418 && !hasPost2023General) {
    regulationCategory = 'اللائحة 418 (تاريخي)';
  } else {
    regulationCategory = 'نظام الدرجات العامة';
  }

  // Change detection
  const isGradeChanged = (employee.jobGrade || '').trim() !== currentGrade.trim();
  const isDateChanged = gradeEntryDate && (employee.gradeEntryDate || '').trim() !== gradeEntryDate.trim();
  const isIncrementChanged = (employee.currentIncrement ?? 0) !== currentIncrement;
  const isChanged = isGradeChanged || isDateChanged || isIncrementChanged;

  let recommendedReviewStatus: 'تمت المراجعة' | 'تحتاج إلى تصحيح' | 'لم تتم المراجعة' = 'تمت المراجعة';
  if (isAmbiguous || hasInconsistency) {
    recommendedReviewStatus = 'تحتاج إلى تصحيح';
  } else if (employee.reviewStatus) {
    recommendedReviewStatus = employee.reviewStatus;
  }

  return {
    employeeId: empId,
    jobNumber: fileNum,
    employeeName: employee.fullName,
    oldJobGrade: employee.jobGrade || 'غير مسجل',
    oldCurrentIncrement: employee.currentIncrement ?? 0,
    oldGradeEntryDate: employee.gradeEntryDate || 'غير مسجل',
    oldReviewStatus: employee.reviewStatus,
    calculatedJobGrade: info.displayedCurrentGrade,
    calculatedIncrement: info.currentIncrement,
    calculatedGradeEntryDate: info.gradeEntryDate || gradeEntryDate || employee.gradeEntryDate || employee.hireDate || '',
    calculatedSalaryScale: salaryScale,
    regulationCategory,
    evidenceRecordDesc: `${info.latestGradeAction} إلى (${info.displayedCurrentGrade})`,
    evidenceDate: info.effectiveDate || evidenceDate || gradeEntryDate,
    evidenceDecisionNumber: info.decisionNumber || evidenceDecNum || '—',
    isGradeChanged: (employee.jobGrade || '').trim() !== info.displayedCurrentGrade.trim(),
    isDateChanged,
    isIncrementChanged: (employee.currentIncrement ?? 0) !== info.currentIncrement,
    isChanged: (employee.jobGrade || '').trim() !== info.displayedCurrentGrade.trim() || isDateChanged || (employee.currentIncrement ?? 0) !== info.currentIncrement,
    hasHistorical418,
    has2023Transition,
    isAmbiguous,
    hasInconsistency,
    anomalyReason,
    recommendedReviewStatus,
    chronologicalActionsCount: uniqueEvents.length,
    auditTrail
  };
}

/**
 * Recalculates single employee grade safely and returns an updated Employee instance
 * WITHOUT modifying any underlying historical records or original decisions.
 */
export function recalculateCurrentGrade(
  employee: Employee,
  careerRecords: CareerPromotionRecord[] = [],
  promotions: PromotionRecord[] = [],
  increments: IncrementRecord[] = [],
  settlements: StatusSettlementRecord[] = [],
  generalProcedures: GeneralProcedureRecord[] = []
): { updatedEmployee: Employee; result: GradeRecalculationResult } {
  const result = calculateEmployeeCurrentGrade(
    employee,
    careerRecords,
    promotions,
    increments,
    settlements,
    generalProcedures
  );

  const summary = calculateEmployeeCareerSummary(
    employee,
    careerRecords,
    promotions,
    increments,
    settlements
  );

  const updatedEmployee: Employee = {
    ...employee,
    jobGrade: result.calculatedJobGrade,
    currentIncrement: result.calculatedIncrement,
    gradeEntryDate: result.calculatedGradeEntryDate || employee.gradeEntryDate,
    salaryScale: result.calculatedSalaryScale,
    workLocation: summary.currentWorkLocation || employee.workLocation,
    department: summary.currentDepartment || employee.department,
    reviewStatus: result.recommendedReviewStatus,
    reviewNotes: result.anomalyReason 
      ? `${employee.reviewNotes ? employee.reviewNotes + ' | ' : ''}تدقيق الدرجات: ${result.anomalyReason}` 
      : employee.reviewNotes,
    updatedAt: new Date().toISOString()
  };

  return {
    updatedEmployee,
    result
  };
}

/**
 * Runs a comprehensive read-only audit across all employees in the database
 */
export function auditDatabaseCurrentGrades(
  employees: Employee[],
  careerRecords: CareerPromotionRecord[] = [],
  promotions: PromotionRecord[] = [],
  increments: IncrementRecord[] = [],
  settlements: StatusSettlementRecord[] = [],
  generalProcedures: GeneralProcedureRecord[] = []
): {
  totalEmployees: number;
  correctedEmployeesCount: number;
  historical418Count: number;
  ambiguousRequiringReviewCount: number;
  inconsistentSequencesCount: number;
  successfullyRecalculatedCount: number;
  unchangedCount: number;
  results: GradeRecalculationResult[];
} {
  const results = employees.map((emp) =>
    calculateEmployeeCurrentGrade(
      emp,
      careerRecords,
      promotions,
      increments,
      settlements,
      generalProcedures
    )
  );

  const correctedEmployeesCount = results.filter((r) => r.isChanged).length;
  const historical418Count = results.filter((r) => r.hasHistorical418).length;
  const ambiguousRequiringReviewCount = results.filter((r) => r.isAmbiguous).length;
  const inconsistentSequencesCount = results.filter((r) => r.hasInconsistency).length;
  const successfullyRecalculatedCount = results.filter((r) => !r.isAmbiguous && !r.hasInconsistency).length;
  const unchangedCount = results.filter((r) => !r.isChanged).length;

  return {
    totalEmployees: employees.length,
    correctedEmployeesCount,
    historical418Count,
    ambiguousRequiringReviewCount,
    inconsistentSequencesCount,
    successfullyRecalculatedCount,
    unchangedCount,
    results
  };
}

/**
 * Executes Automated Unit/Acceptance Tests for the 5 mandated scenarios in the requirements
 */
export function runGradeCalculationAcceptanceTests(): {
  allPassed: boolean;
  testResults: {
    testName: string;
    description: string;
    passed: boolean;
    expected: string;
    actual: string;
    details?: string;
  }[];
} {
  const tests = [
    // TEST 1: 2022 فني صحي ثاني (418) -> 2023 درجة ثامنة (General Grade)
    (() => {
      const mockEmp: Employee = {
        id: 991,
        jobNumber: '991',
        fullName: 'موظف تجريبي 1',
        jobGrade: 'فني صحي ثاني', // incorrectly recorded as old 418
        currentIncrement: 1,
        gradeEntryDate: '2022-01-01',
        hireDate: '2018-01-01',
        directingDate: '2018-01-15',
        bloodBankStartDate: '2018-01-15',
        appointmentGrade: 'فني صحي ثالث',
        salaryScale: 'المرتبات الموحد',
        nationality: 'ليبي',
        documentType: 'الرقم الوطني',
        nationalId: '119900000001',
        gender: 'ذكر',
        maritalStatus: 'متزوج',
        status: 'على رأس العمل',
        motherName: 'فاطمة',
        birthDate: '1990-01-01',
        birthPlace: 'المرج',
        qualification: 'دبلوم عالي',
        specialization: 'مختبرات',
        cadreNumber: 'CAD-991',
        hiringEntity: 'وزارة الصحة',
        assignmentCategory: 'طبي',
        department: 'قسم المختبرات',
        jobTitle: 'فني مختبر',
        transactionType: 'ترقية عادية',
        eligibilityDate: '2026-01-01',
        phone: '',
        email: '',
        pdfPath: '',
        notes: ''
      };

      const mockCareer: CareerPromotionRecord[] = [
        {
          id: 'c1',
          employeeId: 991,
          fileNumber: '991',
          employeeName: 'موظف تجريبي 1',
          actionType: 'ترقية',
          previousGrade: 'فني صحي ثالث',
          previousIncrement: 1,
          newGrade: 'فني صحي ثاني',
          newIncrement: 1,
          actionDate: '2022-01-01',
          decisionDate: '2022-01-01',
          decisionNumber: '10/2022',
          issuingAuthority: 'وزارة الصحة',
          notes: 'ترقية بلائحة 418',
          createdBy: 'admin',
          createdAt: '2022-01-01'
        },
        {
          id: 'c2',
          employeeId: 991,
          fileNumber: '991',
          employeeName: 'موظف تجريبي 1',
          actionType: 'تحويل من اللائحة 418 إلى نظام الدرجات العامة',
          previousGrade: 'فني صحي ثاني',
          previousIncrement: 1,
          newGrade: 'الدرجة الثامنة',
          newIncrement: 1,
          actionDate: '2023-06-01',
          decisionDate: '2023-06-01',
          decisionNumber: '418/2023',
          issuingAuthority: 'وزارة الصحة',
          notes: 'تسوية وانتقال للجدول الموحد',
          createdBy: 'admin',
          createdAt: '2023-06-01'
        }
      ];

      const res = calculateEmployeeCurrentGrade(mockEmp, mockCareer);
      const passed = res.calculatedJobGrade === 'الدرجة الثامنة';
      return {
        testName: 'TEST 1: التحويل من لائحة 418 إلى الدرجة العامة لسنة 2023',
        description: '2022 فني صحي ثاني (418) + 2023 درجة ثامنة (عام) -> الدرجة الحالية: الدرجة الثامنة',
        passed,
        expected: 'الدرجة الثامنة',
        actual: res.calculatedJobGrade,
        details: res.evidenceRecordDesc
      };
    })(),

    // TEST 2: 2021 فني صحي أول (418) -> 2023 درجة سابعة -> 2025 درجة سادسة
    (() => {
      const mockEmp: Employee = {
        id: 992,
        jobNumber: '992',
        fullName: 'موظف تجريبي 2',
        jobGrade: 'الدرجة السابعة',
        currentIncrement: 1,
        gradeEntryDate: '2023-01-01',
        hireDate: '2015-01-01',
        directingDate: '2015-01-15',
        bloodBankStartDate: '2015-01-15',
        appointmentGrade: 'فني صحي أول',
        salaryScale: 'المرتبات الموحد',
        nationality: 'ليبي',
        documentType: 'الرقم الوطني',
        nationalId: '119900000002',
        gender: 'أنثى',
        maritalStatus: 'متزوج',
        status: 'على رأس العمل',
        motherName: 'خديجة',
        birthDate: '1985-01-01',
        birthPlace: 'المرج',
        qualification: 'بكالوريوس',
        specialization: 'تحاليل',
        cadreNumber: 'CAD-992',
        hiringEntity: 'وزارة الصحة',
        assignmentCategory: 'طبي',
        department: 'قسم المختبرات',
        jobTitle: 'أخصائي تحاليل',
        transactionType: 'ترقية عادية',
        eligibilityDate: '2026-01-01',
        phone: '',
        email: '',
        pdfPath: '',
        notes: ''
      };

      const mockCareer: CareerPromotionRecord[] = [
        {
          id: 'c21',
          employeeId: 992,
          fileNumber: '992',
          employeeName: 'موظف تجريبي 2',
          actionType: 'ترقية',
          previousGrade: 'فني صحي ثاني',
          previousIncrement: 1,
          newGrade: 'فني صحي أول',
          newIncrement: 1,
          actionDate: '2021-01-01',
          decisionDate: '2021-01-01',
          decisionNumber: '05/2021',
          issuingAuthority: 'وزارة الصحة',
          notes: 'ترقية بلائحة 418',
          createdBy: 'admin',
          createdAt: '2021-01-01'
        },
        {
          id: 'c22',
          employeeId: 992,
          fileNumber: '992',
          employeeName: 'موظف تجريبي 2',
          actionType: 'تحويل من اللائحة 418 إلى نظام الدرجات العامة',
          previousGrade: 'فني صحي أول',
          previousIncrement: 1,
          newGrade: 'الدرجة السابعة',
          newIncrement: 1,
          actionDate: '2023-01-01',
          decisionDate: '2023-01-01',
          decisionNumber: '100/2023',
          issuingAuthority: 'وزارة الصحة',
          notes: 'تسوية للدرجة السابعة',
          createdBy: 'admin',
          createdAt: '2023-01-01'
        },
        {
          id: 'c23',
          employeeId: 992,
          fileNumber: '992',
          employeeName: 'موظف تجريبي 2',
          actionType: 'ترقية',
          previousGrade: 'الدرجة السابعة',
          previousIncrement: 1,
          newGrade: 'الدرجة السادسة',
          newIncrement: 1,
          actionDate: '2025-01-01',
          decisionDate: '2025-01-01',
          decisionNumber: '12/2025',
          issuingAuthority: 'وزارة الصحة',
          notes: 'ترقية دورية لاحقة',
          createdBy: 'admin',
          createdAt: '2025-01-01'
        }
      ];

      const res = calculateEmployeeCurrentGrade(mockEmp, mockCareer);
      const passed = res.calculatedJobGrade === 'الدرجة السادسة';
      return {
        testName: 'TEST 2: التدرج اللاحق والترقية بعد انتقال 2023',
        description: '2021 فني أول (418) + 2023 درجة 7 + 2025 درجة 6 (ترقية) -> الدرجة الحالية: الدرجة السادسة',
        passed,
        expected: 'الدرجة السادسة',
        actual: res.calculatedJobGrade,
        details: res.evidenceRecordDesc
      };
    })(),

    // TEST 3: Only historical Regulation 418 records exist and no post-2023 General Grade
    (() => {
      const mockEmp: Employee = {
        id: 993,
        jobNumber: '993',
        fullName: 'موظف تجريبي 3',
        jobGrade: 'فني صحي ثالث',
        currentIncrement: 2,
        gradeEntryDate: '2020-01-01',
        hireDate: '2016-01-01',
        directingDate: '2016-01-15',
        bloodBankStartDate: '2016-01-15',
        appointmentGrade: 'فني صحي رابع',
        salaryScale: 'اللائحة 418',
        nationality: 'ليبي',
        documentType: 'الرقم الوطني',
        nationalId: '119900000003',
        gender: 'ذكر',
        maritalStatus: 'أعزب',
        status: 'على رأس العمل',
        motherName: 'مريم',
        birthDate: '1992-01-01',
        birthPlace: 'المرج',
        qualification: 'دبلوم متوسط',
        specialization: 'تمريض',
        cadreNumber: 'CAD-993',
        hiringEntity: 'وزارة الصحة',
        assignmentCategory: 'طبي',
        department: 'قسم التمريض',
        jobTitle: 'ممرض',
        transactionType: 'ترقية عادية',
        eligibilityDate: '2026-01-01',
        phone: '',
        email: '',
        pdfPath: '',
        notes: ''
      };

      const mockCareer: CareerPromotionRecord[] = [
        {
          id: 'c31',
          employeeId: 993,
          fileNumber: '993',
          employeeName: 'موظف تجريبي 3',
          actionType: 'ترقية',
          previousGrade: 'فني صحي رابع',
          previousIncrement: 1,
          newGrade: 'فني صحي ثالث',
          newIncrement: 1,
          actionDate: '2020-01-01',
          decisionDate: '2020-01-01',
          decisionNumber: '02/2020',
          issuingAuthority: 'وزارة الصحة',
          notes: 'حركة تاريخية بلائحة 418',
          createdBy: 'admin',
          createdAt: '2020-01-01'
        }
      ];

      const res = calculateEmployeeCurrentGrade(mockEmp, mockCareer);
      const passed = res.isAmbiguous && res.recommendedReviewStatus === 'تحتاج إلى تصحيح';
      return {
        testName: 'TEST 3: وجود سجلات 418 تاريخية فقط بدون تسوية 2023',
        description: 'عدم اختراع درجة عامة وهمية وتمييز السجل كوسم [تحتاج مراجعة / تصحيح]',
        passed,
        expected: 'تحتاج إلى تصحيح (بدون اختراع درجة وهمية)',
        actual: res.recommendedReviewStatus,
        details: res.anomalyReason
      };
    })(),

    // TEST 4: Multiple annual increments after the current grade
    (() => {
      const mockEmp: Employee = {
        id: 994,
        jobNumber: '994',
        fullName: 'موظف تجريبي 4',
        jobGrade: 'الدرجة الثامنة',
        currentIncrement: 1,
        gradeEntryDate: '2023-01-01',
        hireDate: '2018-01-01',
        directingDate: '2018-01-15',
        bloodBankStartDate: '2018-01-15',
        appointmentGrade: 'الدرجة التاسعة',
        salaryScale: 'المرتبات الموحد',
        nationality: 'ليبي',
        documentType: 'الرقم الوطني',
        nationalId: '119900000004',
        gender: 'ذكر',
        maritalStatus: 'متزوج',
        status: 'على رأس العمل',
        motherName: 'عائشة',
        birthDate: '1989-01-01',
        birthPlace: 'المرج',
        qualification: 'بكالوريوس',
        specialization: 'إدارة',
        cadreNumber: 'CAD-994',
        hiringEntity: 'وزارة الصحة',
        assignmentCategory: 'إداري',
        department: 'الشؤون الإدارية',
        jobTitle: 'باحث إداري',
        transactionType: 'ترقية عادية',
        eligibilityDate: '2026-01-01',
        phone: '',
        email: '',
        pdfPath: '',
        notes: ''
      };

      const mockCareer: CareerPromotionRecord[] = [
        {
          id: 'c41',
          employeeId: 994,
          fileNumber: '994',
          employeeName: 'موظف تجريبي 4',
          actionType: 'ترقية',
          previousGrade: 'الدرجة التاسعة',
          previousIncrement: 1,
          newGrade: 'الدرجة الثامنة',
          newIncrement: 1,
          actionDate: '2023-01-01',
          decisionDate: '2023-01-01',
          decisionNumber: '11/2023',
          issuingAuthority: 'وزارة الصحة',
          notes: 'ترقية',
          createdBy: 'admin',
          createdAt: '2023-01-01'
        },
        {
          id: 'c42',
          employeeId: 994,
          fileNumber: '994',
          employeeName: 'موظف تجريبي 4',
          actionType: 'علاوة دورية',
          previousGrade: 'الدرجة الثامنة',
          previousIncrement: 1,
          newGrade: 'الدرجة الثامنة',
          newIncrement: 2,
          actionDate: '2024-01-01',
          decisionDate: '2024-01-01',
          decisionNumber: 'استحقاق دوري',
          issuingAuthority: 'مصرف الدم',
          notes: 'علاوة 2024',
          createdBy: 'admin',
          createdAt: '2024-01-01'
        },
        {
          id: 'c43',
          employeeId: 994,
          fileNumber: '994',
          employeeName: 'موظف تجريبي 4',
          actionType: 'علاوة دورية',
          previousGrade: 'الدرجة الثامنة',
          previousIncrement: 2,
          newGrade: 'الدرجة الثامنة',
          newIncrement: 3,
          actionDate: '2025-01-01',
          decisionDate: '2025-01-01',
          decisionNumber: 'استحقاق دوري',
          issuingAuthority: 'مصرف الدم',
          notes: 'علاوة 2025',
          createdBy: 'admin',
          createdAt: '2025-01-01'
        }
      ];

      const res = calculateEmployeeCurrentGrade(mockEmp, mockCareer);
      const passed = 
        res.calculatedJobGrade === 'الدرجة الثامنة' && 
        res.calculatedIncrement === 3 && 
        res.calculatedGradeEntryDate === '2023-01-01';

      return {
        testName: 'TEST 4: العلاوات السنوية المتعددة بعد الحصول على الدرجة',
        description: 'الدرجة تظل ثابتة (الدرجة الثامنة)، تاريخ الدرجة يظل (2023-01-01)، والعلاوات تصبح 3',
        passed,
        expected: 'الدرجة الثامنة | تاريخ: 2023-01-01 | علاوات: 3',
        actual: `${res.calculatedJobGrade} | تاريخ: ${res.calculatedGradeEntryDate} | علاوات: ${res.calculatedIncrement}`,
        details: 'العلاوات السنوية زادت العلاوة دون تغيير تاريخ الدرجة'
      };
    })(),

    // TEST 5: Old Regulation 418 record appears first in file
    (() => {
      const mockEmp: Employee = {
        id: 995,
        jobNumber: '995',
        fullName: 'موظف تجريبي 5',
        jobGrade: 'فني صحي ثاني', // wrongly initialized to first record
        currentIncrement: 1,
        gradeEntryDate: '2020-01-01',
        hireDate: '2016-01-01',
        directingDate: '2016-01-15',
        bloodBankStartDate: '2016-01-15',
        appointmentGrade: 'فني صحي ثالث',
        salaryScale: 'المرتبات الموحد',
        nationality: 'ليبي',
        documentType: 'الرقم الوطني',
        nationalId: '119900000005',
        gender: 'أنثى',
        maritalStatus: 'عزباء',
        status: 'على رأس العمل',
        motherName: 'زينب',
        birthDate: '1991-01-01',
        birthPlace: 'المرج',
        qualification: 'دبلوم عالي',
        specialization: 'مختبرات',
        cadreNumber: 'CAD-995',
        hiringEntity: 'وزارة الصحة',
        assignmentCategory: 'طبي',
        department: 'قسم المختبرات',
        jobTitle: 'فني أول',
        transactionType: 'ترقية عادية',
        eligibilityDate: '2026-01-01',
        phone: '',
        email: '',
        pdfPath: '',
        notes: ''
      };

      // Notice array order: 2020 first, 2023 second
      const mockCareer: CareerPromotionRecord[] = [
        {
          id: 'c51',
          employeeId: 995,
          fileNumber: '995',
          employeeName: 'موظف تجريبي 5',
          actionType: 'ترقية',
          previousGrade: 'فني صحي ثالث',
          previousIncrement: 1,
          newGrade: 'فني صحي ثاني',
          newIncrement: 1,
          actionDate: '2020-01-01',
          decisionDate: '2020-01-01',
          decisionNumber: '08/2020',
          issuingAuthority: 'وزارة الصحة',
          notes: 'حركة أولى قديمة',
          createdBy: 'admin',
          createdAt: '2020-01-01'
        },
        {
          id: 'c52',
          employeeId: 995,
          fileNumber: '995',
          employeeName: 'موظف تجريبي 5',
          actionType: 'تحويل من اللائحة 418 إلى نظام الدرجات العامة',
          previousGrade: 'فني صحي ثاني',
          previousIncrement: 1,
          newGrade: 'الدرجة السابعة',
          newIncrement: 1,
          actionDate: '2023-01-01',
          decisionDate: '2023-01-01',
          decisionNumber: '99/2023',
          issuingAuthority: 'وزارة الصحة',
          notes: 'تسوية للدرجة السابعة بالجدول الموحد',
          createdBy: 'admin',
          createdAt: '2023-01-01'
        }
      ];

      const res = calculateEmployeeCurrentGrade(mockEmp, mockCareer);
      const passed = res.calculatedJobGrade === 'الدرجة السابعة';

      return {
        testName: 'TEST 5: عدم اعتماد السجل الأول كأساس للدرجة الحالية',
        description: 'ورود سجل 418 القديم أولاً لا يجعله الدرجة الحالية، بل يُعتمد السجل الزمني الأحدث (الدرجة السابعة)',
        passed,
        expected: 'الدرجة السابعة',
        actual: res.calculatedJobGrade,
        details: res.evidenceRecordDesc
      };
    })()
  ];

  const allPassed = tests.every((t) => t.passed);
  return {
    allPassed,
    testResults: tests
  };
}
