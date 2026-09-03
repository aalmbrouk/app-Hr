import { 
  Employee, 
  AnnualPerformanceEvaluation, 
  CareerPromotionRecord, 
  PromotionRecord, 
  IncrementRecord, 
  StatusSettlementRecord,
  EvaluationRating,
  EvaluationItemValue
} from '../types';

export interface EvaluationCategoryItem {
  id: string;
  name: string;
  weight: number; // e.g. 15
  category: 'duty' | 'punctuality' | 'initiative' | 'human_relations';
}

export interface EvaluationCategoryGroup {
  id: 'duty' | 'punctuality' | 'initiative' | 'human_relations';
  title: string;
  weight: number; // e.g. 45
  items: EvaluationCategoryItem[];
}

export const EVALUATION_CATEGORIES: EvaluationCategoryGroup[] = [
  {
    id: 'duty',
    title: 'أولاً: أداء الواجب',
    weight: 45,
    items: [
      { id: 'duty_quantity', name: 'كمية العمل', weight: 15, category: 'duty' },
      { id: 'duty_quality', name: 'جودة العمل', weight: 15, category: 'duty' },
      { id: 'duty_tools_care', name: 'الحرص على استخدام أجهزة وأدوات أو مواد العمل', weight: 8, category: 'duty' },
      { id: 'duty_coordination', name: 'التنسيق في أداء العمل', weight: 7, category: 'duty' }
    ]
  },
  {
    id: 'punctuality',
    title: 'ثانياً: المواظبة على العمل',
    weight: 25,
    items: [
      { id: 'punc_work_time_care', name: 'الحرص على استخدام أوقات العمل الرسمي', weight: 15, category: 'punctuality' },
      { id: 'punc_respect_timing', name: 'احترام مواعيد العمل', weight: 10, category: 'punctuality' }
    ]
  },
  {
    id: 'initiative',
    title: 'ثالثاً: القدوة والاستعداد الذاتي',
    weight: 15,
    items: [
      { id: 'init_accept_criticism', name: 'مدى تقبل النقد', weight: 2, category: 'initiative' },
      { id: 'init_innovation_progress', name: 'الصلاحية للتقدم والابتكار', weight: 3, category: 'initiative' },
      { id: 'init_responsibility', name: 'القدرة على تحمل المسؤولية', weight: 3, category: 'initiative' },
      { id: 'init_alertness_conduct', name: 'التيقظ وحسن التصرف', weight: 2, category: 'initiative' },
      { id: 'init_supervision_ability', name: 'القدرة على الإشراف', weight: 3, category: 'initiative' },
      { id: 'init_appearance', name: 'المحافظة على المظهر', weight: 2, category: 'initiative' }
    ]
  },
  {
    id: 'human_relations',
    title: 'رابعاً: العلاقات الإنسانية',
    weight: 15,
    items: [
      { id: 'rel_colleagues_superiors', name: 'العلاقة مع الزملاء والرؤساء والمرؤوسين', weight: 6, category: 'human_relations' },
      { id: 'rel_public_treatment', name: 'معاملة الجمهور', weight: 5, category: 'human_relations' },
      { id: 'rel_general_work', name: 'العمل العام', weight: 4, category: 'human_relations' }
    ]
  }
];

export const ALL_EVALUATION_ITEMS = EVALUATION_CATEGORIES.flatMap(c => c.items);

export const EVALUATION_RATING_GUIDE = [
  { rating: 'ممتاز', range: '90 – 100', min: 90, max: 100, color: 'text-emerald-700 bg-emerald-50 border-emerald-300' },
  { rating: 'جيد جداً', range: '71 – 89', min: 71, max: 89, color: 'text-blue-700 bg-blue-50 border-blue-300' },
  { rating: 'جيد', range: '60 – 70', min: 60, max: 70, color: 'text-amber-700 bg-amber-50 border-amber-300' },
  { rating: 'المتوسط / ضعيف', range: '40 – 59', min: 40, max: 59, color: 'text-red-700 bg-red-50 border-red-300' }
];

export function calculateRatingFromScore(score: number | string | undefined): EvaluationRating {
  if (score === undefined || score === '' || isNaN(Number(score))) return '';
  const num = Number(score);
  if (num >= 90) return 'ممتاز';
  if (num >= 71) return 'جيد جداً';
  if (num >= 60) return 'جيد';
  if (num >= 40) return 'متوسط';
  return 'ضعيف';
}

export function getEvaluationPeriodText(year: number): string {
  return `للمدة التي تبتدئ من 01/01/${year} وتنتهي في 31/12/${year}`;
}

/**
 * Historical Data Resolution:
 * Retrieves the employee's grade, position, and status that were active during the evaluation year
 */
export function getEmployeeInfoForEvaluationYear(
  employee: Employee,
  evaluationYear: number,
  careerRecords: CareerPromotionRecord[] = [],
  promotions: PromotionRecord[] = [],
  increments: IncrementRecord[] = [],
  settlements: StatusSettlementRecord[] = []
): {
  birthDateAndPlace: string;
  hireDate: string;
  qualification: string;
  qualificationDate: string;
  currentJobTitle: string;
  currentGrade: string;
  gradeDate: string;
  workplace: string;
  nationality: string;
  sector: string;
} {
  const cutoffDate = `${evaluationYear}-12-31`;

  // Check career promotions / records for the most recent action on or before cutoff date
  const pastCareerRecords = careerRecords
    .filter(r => r.employeeId === employee.id && r.actionDate <= cutoffDate)
    .sort((a, b) => b.actionDate.localeCompare(a.actionDate));

  const pastPromotions = promotions
    .filter(p => p.employeeId === employee.id && p.effectiveDate <= cutoffDate)
    .sort((a, b) => b.effectiveDate.localeCompare(a.effectiveDate));

  let historicalGrade = employee.jobGrade;
  let historicalGradeDate = employee.gradeEntryDate || employee.hireDate;

  if (pastCareerRecords.length > 0) {
    historicalGrade = pastCareerRecords[0].newGrade;
    historicalGradeDate = pastCareerRecords[0].actionDate;
  } else if (pastPromotions.length > 0) {
    historicalGrade = pastPromotions[0].newGrade;
    historicalGradeDate = pastPromotions[0].effectiveDate;
  } else if (employee.appointmentGrade && employee.hireDate) {
    // If evaluation year was earlier than hire year, fallback safely
    if (new Date(employee.hireDate).getFullYear() >= evaluationYear) {
      historicalGrade = employee.appointmentGrade;
      historicalGradeDate = employee.hireDate;
    }
  }

  const birthPlaceStr = employee.birthPlace ? ` - ${employee.birthPlace}` : '';
  const birthDateAndPlace = `${employee.birthDate || 'غير محدد'}${birthPlaceStr}`;

  return {
    birthDateAndPlace,
    hireDate: employee.hireDate || employee.bloodBankStartDate || '2010-01-01',
    qualification: employee.qualification || 'مؤهل جامعي تخصصي',
    qualificationDate: employee.graduationYear || employee.hireDate || '2010-01-01',
    currentJobTitle: employee.jobTitle || 'موظف',
    currentGrade: historicalGrade || 'الدرجة السادسة',
    gradeDate: historicalGradeDate || '2021-01-01',
    workplace: employee.department || 'مصرف الدم المركزي المرج',
    nationality: employee.nationality || 'ليبي',
    sector: 'الصحة'
  };
}

/**
 * Creates a blank/new Annual Performance Evaluation object ready for printing or manual handwriting
 */
export function createNewEvaluation(
  employee: Employee,
  evaluationYear: number = new Date().getFullYear(),
  careerRecords: CareerPromotionRecord[] = [],
  promotions: PromotionRecord[] = [],
  generalManagerName: string = 'نجيب صالح بوحسن',
  currentUser: string = 'شؤون الموظفين'
): AnnualPerformanceEvaluation {
  const historicalInfo = getEmployeeInfoForEvaluationYear(employee, evaluationYear, careerRecords, promotions);
  
  // Default empty scores for handwritten form
  const initialScores: Record<string, EvaluationItemValue> = {};
  ALL_EVALUATION_ITEMS.forEach(item => {
    initialScores[item.id] = { score: '', notes: '' };
  });

  return {
    id: `EVAL-${evaluationYear}-${employee.id}-${Date.now().toString().slice(-4)}`,
    employeeId: employee.id,
    fileNumber: employee.jobNumber,
    employeeName: employee.fullName,
    nationalId: employee.nationalId || employee.passportNumber || '',
    evaluationYear,
    periodStart: `01/01/${evaluationYear}`,
    periodEnd: `31/12/${evaluationYear}`,
    periodText: getEvaluationPeriodText(evaluationYear),
    
    // Section One Snapshot
    birthDateAndPlace: historicalInfo.birthDateAndPlace,
    hireDate: historicalInfo.hireDate,
    qualification: historicalInfo.qualification,
    qualificationDate: historicalInfo.qualificationDate,
    currentJobTitle: historicalInfo.currentJobTitle,
    currentGrade: historicalInfo.currentGrade,
    gradeDate: historicalInfo.gradeDate,
    workplace: historicalInfo.workplace,
    nationality: historicalInfo.nationality,
    sector: historicalInfo.sector,

    // Form mode and status
    mode: 'يدوي',
    status: 'مسودة',

    // Section Two
    scores: initialScores,
    totalScore: '',
    performanceScore: '',
    performanceScoreJustification: '',
    adjustedScore: '',
    adjustedScoreJustification: '',
    performanceRating: '',

    // Section Three Recommendations
    recommendations: {
      exceptionalBonusOrAllowance: '',
      nominationForPromotion: '',
      trainingNeeds: '',
      transferToAnotherJob: '',
      trainingDetails: '',
      transferDetails: '',
      generalNotes: ''
    },

    // Signatures
    directSupervisorName: '',
    directSupervisorJobOrGrade: 'رئيس القسم المباشر',
    higherSupervisorName: generalManagerName,
    higherSupervisorJobOrGrade: 'مدير عام مصرف الدم المركزي المرج',
    hrPreparerName: currentUser,
    hrPreparationDate: new Date().toISOString().slice(0, 10),

    createdBy: currentUser,
    createdAt: new Date().toISOString()
  };
}
