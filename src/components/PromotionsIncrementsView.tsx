import React, { useState, useMemo, useEffect } from 'react';
import { 
  Employee, 
  PromotionRecord, 
  IncrementRecord, 
  StatusSettlementRecord, 
  HrRule,
  CareerPromotionRecord,
  CareerActionType,
  PromotionRule,
  PromotionEligibilityResult,
  AnnualPerformanceEvaluation
} from '../types';
import { 
  calculatePromotionRecommendation, 
  calculateAnnualIncrements, 
  formatDateDisplay 
} from '../utils/dateUtils';
import { 
  calculatePromotionEligibility as calculateLibyanPromotionEligibility,
  DEFAULT_PROMOTION_RULES,
  createOfficialPromotionRecords,
  OfficialPromotionDecisionInput,
  findApplicablePromotionRule,
  getNextSequentialGrade
} from '../utils/promotionEngine';
import { 
  getEmployeeCareerHistory, 
  calculateEmployeeCareerSummary, 
  getCareerActionMeta 
} from '../utils/careerUtils';
import { DEPARTMENTS, JOB_GRADES } from '../data/initialData';
import { exportElementToPdf } from '../utils/pdfExport';
import { CareerActionModal } from './CareerActionModal';
import { EmployeeCareerReportModal } from './EmployeeCareerReportModal';
import { OfficialPromotionModal } from './OfficialPromotionModal';
import { PromotionRulesModal } from './PromotionRulesModal';
import { PromotionAcceptanceTestsModal } from './PromotionAcceptanceTestsModal';
import { OfficialPromotionReportModal } from './OfficialPromotionReportModal';
import { 
  TrendingUp, 
  Award, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Zap, 
  Printer,
  Filter,
  Search,
  Check,
  X,
  Building2,
  Calendar,
  FileDown,
  Loader2,
  AlertTriangle,
  Info,
  ShieldCheck,
  RefreshCw,
  Plus,
  Edit2,
  Trash2,
  FileText,
  Layers,
  FileSpreadsheet,
  Scale
} from 'lucide-react';
import { ExcelImportModal } from './ExcelImportModal';
import { MigrationCommitResult } from '../utils/excelMigrationUtils';

interface PromotionsIncrementsViewProps {
  employees: Employee[];
  promotions: PromotionRecord[];
  increments: IncrementRecord[];
  settlements: StatusSettlementRecord[];
  careerRecords?: CareerPromotionRecord[];
  rules: HrRule[];
  promotionRules?: PromotionRule[];
  annualEvaluations?: AnnualPerformanceEvaluation[];
  onUpdatePromotionRules?: (rules: PromotionRule[]) => void;
  onAddPromotion: (promo: PromotionRecord) => void;
  onAddIncrement: (inc: IncrementRecord) => void;
  onAddSettlement: (settle: StatusSettlementRecord) => void;
  onAddCareerRecord?: (record: CareerPromotionRecord) => void;
  onUpdateCareerRecord?: (record: CareerPromotionRecord) => void;
  onDeleteCareerRecord?: (recordId: string) => void;
  onUpdateEmployeeGrade: (employeeId: number, newGrade: string, newIncrement: number, newGradeDate?: string) => void;
  onUpdateEmployeeIncrement?: (employeeId: number, newIncrement: number, nextEligibilityDate?: string) => void;
  onImportComplete?: (result: MigrationCommitResult) => void;
  generalManagerName?: string;
  officialLogoUrl?: string;
  currentUser?: string;
}

export const PromotionsIncrementsView: React.FC<PromotionsIncrementsViewProps> = ({
  employees = [],
  promotions = [],
  increments = [],
  settlements = [],
  careerRecords = [],
  rules = [],
  promotionRules = [],
  annualEvaluations = [],
  onUpdatePromotionRules,
  onAddPromotion,
  onAddIncrement,
  onAddSettlement,
  onAddCareerRecord,
  onUpdateCareerRecord,
  onDeleteCareerRecord,
  onUpdateEmployeeGrade,
  onUpdateEmployeeIncrement,
  onImportComplete,
  generalManagerName = 'نجيب صالح سالم',
  officialLogoUrl = '',
  currentUser = 'المستخدم الحالي'
}) => {
  const [activeTab, setActiveTab] = useState<'eligibility' | 'career_history' | 'secondments_grade' | 'promotions' | 'increments'>('eligibility');
  
  // Local promotion rules synchronized with props
  const [localPromotionRules, setLocalPromotionRules] = useState<PromotionRule[]>(promotionRules || DEFAULT_PROMOTION_RULES);
  useEffect(() => {
    if (promotionRules && promotionRules.length > 0) {
      setLocalPromotionRules(promotionRules);
    }
  }, [promotionRules]);

  // Modals
  const [isExcelMigrationOpen, setIsExcelMigrationOpen] = useState(false);
  const [isCareerModalOpen, setIsCareerModalOpen] = useState(false);
  const [careerModalActionType, setCareerModalActionType] = useState<CareerActionType>('ندب على درجة');
  const [careerModalInitialEmpId, setCareerModalInitialEmpId] = useState<number | undefined>(undefined);
  const [recordToEdit, setRecordToEdit] = useState<CareerPromotionRecord | null>(null);

  // Official Promotion Engine Modals
  const [isOfficialPromotionModalOpen, setIsOfficialPromotionModalOpen] = useState(false);
  const [isPromotionRulesModalOpen, setIsPromotionRulesModalOpen] = useState(false);
  const [isAcceptanceTestsModalOpen, setIsAcceptanceTestsModalOpen] = useState(false);
  const [isOfficialReportModalOpen, setIsOfficialReportModalOpen] = useState(false);
  const [officialPromotionEmpId, setOfficialPromotionEmpId] = useState<number | undefined>(undefined);

  const [isPrintReportOpen, setIsPrintReportOpen] = useState(false);
  const [isEmpCareerReportOpen, setIsEmpCareerReportOpen] = useState(false);
  const [selectedEmpForReport, setSelectedEmpForReport] = useState<Employee>((employees && employees[0]) || {} as Employee);

  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('الكل');
  const [selectedCategory, setSelectedCategory] = useState('الكل');
  const [selectedStatus, setSelectedStatus] = useState('الكل');
  const [selectedHistoryAction, setSelectedHistoryAction] = useState<string>('الكل');

  // Combined comprehensive career records across all employees
  const allCareerHistory = useMemo(() => {
    const all: CareerPromotionRecord[] = [];
    (employees || []).forEach((emp) => {
      const empHistory = getEmployeeCareerHistory(
        emp.id,
        careerRecords || [],
        promotions || [],
        increments || [],
        settlements || []
      );
      empHistory.forEach((rec) => {
        all.push({
          ...rec,
          employeeName: rec.employeeName || emp.fullName,
          fileNumber: rec.fileNumber || emp.jobNumber
        });
      });
    });

    // Sort newest first for table view
    return all.sort((a, b) => {
      const timeA = new Date(a.actionDate || a.decisionDate || a.createdAt || '').getTime() || 0;
      const timeB = new Date(b.actionDate || b.decisionDate || b.createdAt || '').getTime() || 0;
      return timeB - timeA;
    });
  }, [employees, careerRecords, promotions, increments, settlements]);

  // Overall Statistics Counts across database
  const statsCounts = useMemo(() => {
    let promoCount = 0;
    let incCount = 0;
    let secGradeCount = 0;
    let expPromoCount = 0;
    let settleCount = 0;

    allCareerHistory.forEach((r) => {
      if (r.actionType === 'ترقية') promoCount++;
      else if (r.actionType === 'علاوة دورية') incCount++;
      else if (r.actionType === 'ندب على درجة') secGradeCount++;
      else if (r.actionType === 'ترقية استثنائية') expPromoCount++;
      else if (r.actionType === 'تسوية وضع') settleCount++;
    });

    return {
      promoCount,
      incCount,
      secGradeCount,
      expPromoCount,
      settleCount,
      totalCount: allCareerHistory.length
    };
  }, [allCareerHistory]);

  // Calculated Libyan Promotion Eligibility Results (Primary Administrative Engine)
  const libyanPromotionResults = useMemo<PromotionEligibilityResult[]>(() => {
    return (employees || []).map((emp) => {
      return calculateLibyanPromotionEligibility(emp, {
        promotions: promotions || [],
        increments: increments || [],
        careerRecords: careerRecords || [],
        settlements: settlements || [],
        annualEvaluations: annualEvaluations || [],
        rules: localPromotionRules
      });
    });
  }, [employees, promotions, increments, careerRecords, settlements, annualEvaluations, localPromotionRules]);

  // Counts based on Libyan Promotion Engine
  const promotionEligibilityCounts = useMemo(() => {
    let eligibleCount = 0;
    let recommendedCount = 0;
    let officiallyPromotedCount = 0;
    let notEligibleCount = 0;
    let needsReviewCount = 0;

    libyanPromotionResults.forEach((r) => {
      if (r.status === 'ELIGIBLE_FOR_CONSIDERATION') eligibleCount++;
      else if (r.status === 'RECOMMENDED') recommendedCount++;
      else if (r.status === 'OFFICIALLY_PROMOTED') officiallyPromotedCount++;
      else if (r.status === 'NEEDS_REVIEW') needsReviewCount++;
      else notEligibleCount++;
    });

    return {
      eligibleCount,
      recommendedCount,
      officiallyPromotedCount,
      notEligibleCount,
      needsReviewCount,
      totalCandidates: eligibleCount + recommendedCount
    };
  }, [libyanPromotionResults]);

  // Filtered Libyan Promotion List for Tab 1
  const filteredLibyanPromotionList = useMemo(() => {
    return libyanPromotionResults.filter((result) => {
      const matchSearch = !searchTerm.trim() || 
        result.fullName.includes(searchTerm) || 
        result.jobNumber.includes(searchTerm) ||
        result.currentGrade.includes(searchTerm);
      
      const matchDept = selectedDept === 'الكل' || result.department === selectedDept;
      const matchCat = selectedCategory === 'الكل' || result.assignmentCategory === selectedCategory;
      const matchStatus = selectedStatus === 'الكل' || result.statusArabic === selectedStatus;

      return matchSearch && matchDept && matchCat && matchStatus;
    });
  }, [libyanPromotionResults, searchTerm, selectedDept, selectedCategory, selectedStatus]);

  // Calculated promotion recommendations list for Tab 1 and Print Report (legacy compatibility)
  const recommendationList = useMemo(() => {
    return (employees || []).map((emp) => {
      const rec = calculatePromotionRecommendation(emp, rules || []);
      const inc = calculateAnnualIncrements(emp, 'Anniversary Date', undefined, increments || []);
      const summary = calculateEmployeeCareerSummary(emp, careerRecords || [], promotions || [], increments || [], settlements || []);
      return {
        emp,
        rec,
        inc,
        summary
      };
    });
  }, [employees, rules, increments, careerRecords, promotions, settlements]);

  // Filtered recommendations for Tab 1
  const filteredList = useMemo(() => {
    return recommendationList.filter(({ emp, rec }) => {
      const matchSearch = !searchTerm.trim() || 
        emp.fullName.includes(searchTerm) || 
        emp.jobNumber.includes(searchTerm) ||
        emp.nationalId.includes(searchTerm);
      
      const matchDept = selectedDept === 'الكل' || emp.department === selectedDept;
      const matchCat = selectedCategory === 'الكل' || emp.assignmentCategory === selectedCategory;
      const matchStatus = selectedStatus === 'الكل' || rec.status === selectedStatus;

      return matchSearch && matchDept && matchCat && matchStatus;
    });
  }, [recommendationList, searchTerm, selectedDept, selectedCategory, selectedStatus]);

  // Filtered history list for Tab 2
  const filteredHistoryList = useMemo(() => {
    return allCareerHistory.filter((rec) => {
      const emp = employees.find((e) => e.id === rec.employeeId);
      const matchSearch = !searchTerm.trim() || 
        (rec.employeeName && rec.employeeName.includes(searchTerm)) ||
        (rec.fileNumber && rec.fileNumber.includes(searchTerm)) ||
        (rec.decisionNumber && rec.decisionNumber.includes(searchTerm)) ||
        (emp && emp.fullName.includes(searchTerm));

      const matchAction = selectedHistoryAction === 'الكل' || rec.actionType === selectedHistoryAction;
      const matchDept = selectedDept === 'الكل' || (emp && emp.department === selectedDept);

      return matchSearch && matchAction && matchDept;
    });
  }, [allCareerHistory, searchTerm, selectedHistoryAction, selectedDept, employees]);

  // Filtered secondment to grade list
  const secondmentGradeList = useMemo(() => {
    return allCareerHistory.filter((r) => r.actionType === 'ندب على درجة');
  }, [allCareerHistory]);

  const eligibleCount = recommendationList.filter((r) => r.rec.status === 'مستحق للترقية').length;
  const approachingCount = recommendationList.filter((r) => r.rec.status === 'قريب من الاستحقاق').length;

  // ESC key listener for report modals
  useEffect(() => {
    if (!isPrintReportOpen && !isEmpCareerReportOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsPrintReportOpen(false);
        setIsEmpCareerReportOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPrintReportOpen, isEmpCareerReportOpen]);

  // Handle saving new or edited career record
  const handleSaveCareerRecord = (record: CareerPromotionRecord) => {
    if (recordToEdit) {
      if (onUpdateCareerRecord) {
        onUpdateCareerRecord(record);
      }
    } else {
      if (onAddCareerRecord) {
        onAddCareerRecord(record);
      } else {
        // Fallback backward compatible handling
        if (record.actionType === 'ترقية' || record.actionType === 'ترقية استثنائية') {
          const promo: PromotionRecord = {
            id: record.id,
            employeeId: record.employeeId,
            fileNumber: record.fileNumber,
            previousGrade: record.previousGrade,
            previousIncrement: record.previousIncrement,
            newGrade: record.newGrade,
            newIncrement: record.newIncrement,
            promotionType: record.actionType === 'ترقية استثنائية' ? 'ترقية استثنائية' : 'ترقية عادية',
            decisionNumber: record.decisionNumber,
            decisionDate: record.decisionDate,
            effectiveDate: record.actionDate,
            reason: record.notes || 'ترقية مسجلة بالنظام',
            notes: record.notes,
            createdBy: currentUser,
            createdAt: record.createdAt
          };
          onAddPromotion(promo);
          onUpdateEmployeeGrade(record.employeeId, record.newGrade, record.newIncrement, record.actionDate);
        } else if (record.actionType === 'علاوة دورية') {
          const inc: IncrementRecord = {
            id: record.id,
            employeeId: record.employeeId,
            fileNumber: record.fileNumber,
            previousGrade: record.previousGrade,
            previousIncrement: record.previousIncrement,
            newIncrement: record.newIncrement,
            effectiveDate: record.actionDate,
            incrementType: 'تلقائية',
            decisionNumber: record.decisionNumber,
            notes: record.notes,
            createdBy: currentUser,
            createdAt: record.createdAt
          };
          onAddIncrement(inc);
          if (onUpdateEmployeeIncrement) {
            onUpdateEmployeeIncrement(record.employeeId, record.newIncrement);
          } else {
            onUpdateEmployeeGrade(record.employeeId, record.previousGrade, record.newIncrement);
          }
        } else if (record.actionType === 'ندب على درجة') {
          onUpdateEmployeeGrade(record.employeeId, record.newGrade, record.newIncrement, record.actionDate);
        } else if (record.actionType === 'تسوية وضع') {
          const setRecord: StatusSettlementRecord = {
            id: record.id,
            employeeId: record.employeeId,
            financialStatus: 'تسوية وضع وظيفي',
            grade: record.newGrade,
            jobTitle: 'تسوية مؤهل',
            effectiveDate: record.actionDate,
            decisionNumber: record.decisionNumber,
            reason: record.notes || 'تسوية وضع',
            notes: record.notes,
            createdBy: currentUser,
            createdAt: record.createdAt
          };
          onAddSettlement(setRecord);
          onUpdateEmployeeGrade(record.employeeId, record.newGrade, record.newIncrement, record.actionDate);
        }
      }
    }
    setRecordToEdit(null);
  };

  // Official Promotion Decision Submission Handler
  const handleSaveOfficialPromotion = (input: OfficialPromotionDecisionInput) => {
    const { promotion, careerRecord } = createOfficialPromotionRecords(input);
    onAddPromotion(promotion);
    if (onAddCareerRecord) {
      onAddCareerRecord(careerRecord);
    }
    // Set employee to new grade, reset increment to 1 for starting new career stage, and set grade entry date
    onUpdateEmployeeGrade(input.employeeId, input.newGrade, 1, input.effectiveDate);
    
    alert(`تم بنجاح توثيق واعتماد قرار الترقية الرسمي رقم (${input.decisionNumber}) وترقية الموظف (${input.employeeName}) إلى (${input.newGrade}) وفق النظام الإداري المعتمد!`);
  };

  // Save Promotion Rules Handler
  const handleSavePromotionRules = (newRules: PromotionRule[]) => {
    setLocalPromotionRules(newRules);
    if (onUpdatePromotionRules) {
      onUpdatePromotionRules(newRules);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header Card */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-red-700 font-bold text-xs mb-1">
            <TrendingUp className="w-4 h-4" />
            <span>وحدة الشؤون الوظيفية والترقيات والندب على الدرجة — منظومة الامتثال الإداري الليبي</span>
          </div>
          <h1 className="text-xl font-extrabold text-gray-900">نظام إدارة الترقيات والعلاوات والندب على الدرجة</h1>
          <p className="text-xs text-gray-600 mt-1">
            تطبيق محكم لقانون علاقات العمل رقم 12 لسنة 2010 ولائحته التنفيذية (الفصل بين استيفاء علاوات الاستحقاق وإصدار القرار الرسمي المعتمد للترقية)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Official Promotion Decision Button (MANDATORY REQUIREMENT) */}
          <button
            onClick={() => {
              setOfficialPromotionEmpId(undefined);
              setIsOfficialPromotionModalOpen(true);
            }}
            className="px-3.5 py-2.5 rounded-xl bg-red-700 hover:bg-red-800 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 cursor-pointer transition"
          >
            <Award className="w-4 h-4 text-amber-300" />
            <span>تسجيل قرار ترقية رسمي معتمد</span>
          </button>

          {/* Official Promotion Report Modal Button */}
          <button
            onClick={() => setIsOfficialReportModalOpen(true)}
            className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 cursor-pointer transition"
          >
            <Printer className="w-4 h-4 text-amber-400" />
            <span>تقرير وكشف الترقيات الرسمي</span>
          </button>

          {/* Promotion Rules Modal Button */}
          <button
            onClick={() => setIsPromotionRulesModalOpen(true)}
            className="px-3.5 py-2.5 rounded-xl bg-indigo-700 hover:bg-indigo-800 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 cursor-pointer transition"
          >
            <Scale className="w-4 h-4 text-indigo-200" />
            <span>قواعد وضوابط الترقيات</span>
          </button>

          {/* Acceptance Tests Button */}
          <button
            onClick={() => setIsAcceptanceTestsModalOpen(true)}
            className="px-3.5 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 cursor-pointer transition"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-300" />
            <span>اختبارات القبول والامتثال (1-7)</span>
          </button>

          {/* Dedicated "ندب على درجة" Button (MANDATORY REQUIREMENT) */}
          <button
            onClick={() => {
              setRecordToEdit(null);
              setCareerModalActionType('ندب على درجة');
              setCareerModalInitialEmpId(employees[0]?.id);
              setIsCareerModalOpen(true);
            }}
            className="px-3.5 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 cursor-pointer transition"
          >
            <Award className="w-4 h-4 text-teal-200" />
            <span>تسجيل ندب على درجة</span>
          </button>

          {/* Print Individual Career History Report Button */}
          <button
            onClick={() => {
              setSelectedEmpForReport(employees[0]);
              setIsEmpCareerReportOpen(true);
            }}
            className="px-3.5 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-800 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 cursor-pointer transition"
          >
            <FileText className="w-4 h-4 text-amber-300" />
            <span>سجل الموظف الوظيفي</span>
          </button>

          {/* Excel Historical Migration Button */}
          <button
            onClick={() => setIsExcelMigrationOpen(true)}
            className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 cursor-pointer transition"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>ترحيل Excel</span>
          </button>

          {/* Generic Action Button */}
          <button
            onClick={() => {
              setRecordToEdit(null);
              setCareerModalActionType('ترقية');
              setCareerModalInitialEmpId(employees[0]?.id);
              setIsCareerModalOpen(true);
            }}
            className="px-3 py-2.5 rounded-xl bg-gray-700 hover:bg-gray-800 text-white font-bold text-xs shadow-sm flex items-center gap-1 cursor-pointer transition"
          >
            <Plus className="w-4 h-4" />
            <span>إجراء وظيفي عام</span>
          </button>
        </div>
      </div>

      {/* Top Statistical Metrics Grid (DISTINGUISHING ALL ACTIONS) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="bg-white border border-red-200 rounded-xl p-3.5 shadow-xs text-right">
          <div className="flex items-center justify-between text-red-700 mb-1">
            <span className="text-[11px] font-bold">قرارات الترقيات</span>
            <Award className="w-4 h-4 text-red-600" />
          </div>
          <div className="text-2xl font-black text-red-950">{statsCounts.promoCount}</div>
          <div className="text-[10px] text-gray-500 mt-0.5">ترقيات وظيفية معتمدة</div>
        </div>

        <div className="bg-white border border-blue-200 rounded-xl p-3.5 shadow-xs text-right">
          <div className="flex items-center justify-between text-blue-700 mb-1">
            <span className="text-[11px] font-bold">العلاوات الدورية</span>
            <Zap className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-blue-950">{statsCounts.incCount}</div>
          <div className="text-[10px] text-gray-500 mt-0.5">علاوات سنوية ممنوحة</div>
        </div>

        <div className="bg-white border border-emerald-200 rounded-xl p-3.5 shadow-xs text-right bg-emerald-50/20">
          <div className="flex items-center justify-between text-emerald-700 mb-1">
            <span className="text-[11px] font-bold">ندب على درجة</span>
            <Building2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-950">{statsCounts.secGradeCount}</div>
          <div className="text-[10px] text-emerald-700 mt-0.5 font-bold">إجراءات ندب مسجلة</div>
        </div>

        <div className="bg-white border border-amber-200 rounded-xl p-3.5 shadow-xs text-right">
          <div className="flex items-center justify-between text-amber-700 mb-1">
            <span className="text-[11px] font-bold">الترقيات الاستثنائية</span>
            <Award className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-950">{statsCounts.expPromoCount}</div>
          <div className="text-[10px] text-gray-500 mt-0.5">قرارات استثنائية</div>
        </div>

        <div className="bg-white border border-purple-200 rounded-xl p-3.5 shadow-xs text-right">
          <div className="flex items-center justify-between text-purple-700 mb-1">
            <span className="text-[11px] font-bold">تسويات الوضع</span>
            <Layers className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-black text-purple-950">{statsCounts.settleCount}</div>
          <div className="text-[10px] text-gray-500 mt-0.5">تسوية مؤهل / كادر</div>
        </div>
      </div>

      {/* Warning Notice Banner */}
      <div className="bg-amber-50/80 border-r-4 border-amber-500 p-3.5 rounded-xl text-amber-900 text-xs flex items-start gap-3 shadow-xs">
        <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <span className="font-extrabold text-amber-950">ضابط احتساب السجل الوظيفي والترقيات:</span>
          <p className="text-[11px] leading-relaxed text-amber-900 font-medium">
            العلاوة السنوية الدورية ليست ترقية ولا تُحتسب كترقية ولا تغيّر تاريخ الدرجة الحالية. يتم توثيق «الندب على درجة» كإجراء وظيفي مستقل في السجل التاريخي الشامل للموظف.
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-gray-200 bg-white px-4 pt-3 rounded-t-xl text-xs font-bold overflow-x-auto">
        <button
          onClick={() => setActiveTab('eligibility')}
          className={`pb-3 px-4 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'eligibility' ? 'border-red-700 text-red-800' : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          أهلية واستحقاق الترشح للترقيات ({promotionEligibilityCounts.totalCandidates} مستوفٍ/مرشح)
        </button>

        <button
          onClick={() => setActiveTab('career_history')}
          className={`pb-3 px-4 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'career_history' ? 'border-red-700 text-red-800' : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          السجل الوظيفي الشامل للترقيات والعلاوات ({allCareerHistory.length})
        </button>

        <button
          onClick={() => setActiveTab('secondments_grade')}
          className={`pb-3 px-4 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'secondments_grade' ? 'border-emerald-700 text-emerald-800' : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          سجل الندب على درجة ({secondmentGradeList.length})
        </button>

        <button
          onClick={() => setActiveTab('promotions')}
          className={`pb-3 px-4 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'promotions' ? 'border-red-700 text-red-800' : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          سجل قرارات الترقيات المعتمدة ({statsCounts.promoCount + statsCounts.expPromoCount})
        </button>

        <button
          onClick={() => setActiveTab('increments')}
          className={`pb-3 px-4 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'increments' ? 'border-red-700 text-red-800' : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          سجل العلاوات السنوية ({statsCounts.incCount})
        </button>
      </div>

      {/* TAB 1: LIBYAN ADMINISTRATIVE PROMOTION ELIGIBILITY & NOMINATION ENGINE */}
      {activeTab === 'eligibility' && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden space-y-4 p-4">
          
          {/* Statutory Principle Notice */}
          <div className="bg-slate-900 text-white p-3.5 rounded-xl border-r-4 border-red-500 text-xs flex items-start justify-between gap-3 shadow-sm">
            <div className="flex items-start gap-2.5">
              <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <div className="font-extrabold text-amber-300 flex items-center gap-2">
                  <span>الضابط القانوني وفق قانون علاقات العمل رقم 12 لسنة 2010 ولائحته التنفيذية:</span>
                  <span className="text-[10px] bg-red-800/80 px-2 py-0.5 rounded text-white font-mono">ضابط الدرجة 10</span>
                </div>
                <p className="text-[11px] text-gray-200 leading-relaxed font-medium">
                  استيفاء العلاوات السنوية المقررة (4 علاوات لما دون العاشرة، و5 علاوات للدرجة العاشرة للترقية إلى الحادية عشرة) يمثل الحد الأدنى للترشح واستحقاق العرض والمفاضلة، ولا يعد ترقية تلقائية مطلقاً. لا تصبح الترقية نافذة إلا بصدور وتوثيق قرار رسمي معتمد برقم وتاريخ صادر عن السلطة المختصة.
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsAcceptanceTestsModalOpen(true)}
              className="shrink-0 px-3 py-1.5 bg-red-700 hover:bg-red-800 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer transition"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-amber-300" />
              <span>فحص الاختبارات 1-7</span>
            </button>
          </div>

          {/* Filters Toolbar */}
          <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-200 grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute right-3 top-2.5" />
              <input
                type="text"
                placeholder="بحث بالاسم أو الرقم الوظيفي أو الدرجة..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pr-9 pl-3 py-2 bg-white border border-gray-300 rounded-lg text-xs"
              />
            </div>

            <div>
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="w-full p-2 bg-white border border-gray-300 rounded-lg text-xs font-bold"
              >
                <option value="الكل">جميع الأقسام والإدارات</option>
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            <div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full p-2 bg-white border border-gray-300 rounded-lg text-xs font-bold"
              >
                <option value="الكل">كافة الكوادر (إداري وطبي)</option>
                <option value="طبي">طبي / طبي مساعد</option>
                <option value="إداري">إداري / تخصصي</option>
              </select>
            </div>

            <div>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full p-2 bg-white border border-gray-300 rounded-lg text-xs font-bold text-red-900"
              >
                <option value="الكل">جميع حالات الاستحقاق</option>
                <option value="مستوفٍ للحد الأدنى للترشح">مستوفٍ للحد الأدنى للترشح</option>
                <option value="مستحق للعرض/المفاضلة">مستحق للعرض/المفاضلة</option>
                <option value="تمت الترقية بقرار رسمي">تمت الترقية بقرار رسمي</option>
                <option value="غير مستحق حالياً">غير مستحق حالياً</option>
                <option value="يحتاج إلى مراجعة">يحتاج إلى مراجعة</option>
              </select>
            </div>
          </div>

          {/* Quick Summary Cards based on Libyan Promotion Engine */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-xs">
            <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl text-amber-950 font-bold flex justify-between items-center shadow-2xs">
              <div>
                <div className="text-[10px] text-amber-800">مستوفو حد الترشح / المفاضلة:</div>
                <div className="text-base font-black text-amber-900 mt-0.5">{promotionEligibilityCounts.totalCandidates} موظف</div>
              </div>
              <Award className="w-5 h-5 text-amber-600 shrink-0" />
            </div>

            <div className="bg-blue-50 border border-blue-200 p-3 rounded-xl text-blue-950 font-bold flex justify-between items-center shadow-2xs">
              <div>
                <div className="text-[10px] text-blue-800">تمت الترقية بقرار رسمي:</div>
                <div className="text-base font-black text-blue-900 mt-0.5">{promotionEligibilityCounts.officiallyPromotedCount} موظف</div>
              </div>
              <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0" />
            </div>

            <div className="bg-gray-100 border border-gray-200 p-3 rounded-xl text-gray-800 font-bold flex justify-between items-center shadow-2xs">
              <div>
                <div className="text-[10px] text-gray-600">غير مستحق حالياً:</div>
                <div className="text-base font-black text-gray-800 mt-0.5">{promotionEligibilityCounts.notEligibleCount} موظف</div>
              </div>
              <Clock className="w-5 h-5 text-gray-500 shrink-0" />
            </div>

            <div className="bg-red-50 border border-red-200 p-3 rounded-xl text-red-950 font-bold flex justify-between items-center shadow-2xs">
              <div>
                <div className="text-[10px] text-red-800">يحتاج إلى مراجعة:</div>
                <div className="text-base font-black text-red-900 mt-0.5">{promotionEligibilityCounts.needsReviewCount} سجل</div>
              </div>
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
            </div>

            <div className="bg-slate-100 border border-slate-300 p-3 rounded-xl text-slate-800 font-bold flex justify-between items-center shadow-2xs">
              <div>
                <div className="text-[10px] text-slate-600">نتائج الفلترة المعروضة:</div>
                <div className="text-base font-black text-slate-900 mt-0.5">{filteredLibyanPromotionList.length} سجل</div>
              </div>
              <Filter className="w-5 h-5 text-slate-600 shrink-0" />
            </div>
          </div>

          {/* Primary Libyan Promotion Engine Table */}
          <div className="border rounded-xl overflow-hidden shadow-xs">
            <table className="w-full text-right text-xs">
              <thead className="bg-gray-100 border-b border-gray-200 text-gray-700 font-bold">
                <tr>
                  <th className="py-3 px-3">الرقم الوظيفي</th>
                  <th className="py-3 px-3">اسم الموظف</th>
                  <th className="py-3 px-3">القسم والكادر</th>
                  <th className="py-3 px-3">الدرجة وتاريخ نفاذها</th>
                  <th className="py-3 px-3 text-center">العلاوات المؤهلة</th>
                  <th className="py-3 px-3 text-center">العلاوات المطلوبة</th>
                  <th className="py-3 px-3 text-center">تقرير الكفاءة</th>
                  <th className="py-3 px-3 text-center">الترقية المستهدفة</th>
                  <th className="py-3 px-3">حالة الأهلية والاستحقاق القانونية</th>
                  <th className="py-3 px-3">القرار الرسمي المعتمد</th>
                  <th className="py-3 px-3 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredLibyanPromotionList.map((result) => {
                  const emp = employees.find(e => e.id === result.employeeId);
                  return (
                    <tr key={result.employeeId} className="hover:bg-gray-50 transition">
                      {/* Job Number */}
                      <td className="py-3 px-3 font-bold text-red-900 font-mono">
                        {result.jobNumber}
                      </td>

                      {/* Employee Name */}
                      <td className="py-3 px-3 font-bold text-gray-900">
                        <div>{result.fullName}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <button
                            onClick={() => {
                              if (emp) {
                                setSelectedEmpForReport(emp);
                                setIsEmpCareerReportOpen(true);
                              }
                            }}
                            className="text-[10px] text-red-700 hover:text-red-900 underline flex items-center gap-0.5 cursor-pointer"
                          >
                            <FileText className="w-3 h-3" />
                            <span>السجل الوظيفي</span>
                          </button>
                        </div>
                      </td>

                      {/* Dept and Category */}
                      <td className="py-3 px-3 text-gray-700">
                        <div>{result.department}</div>
                        <span className="text-[10px] text-gray-500 font-bold">({result.assignmentCategory})</span>
                      </td>

                      {/* Current Grade and Date */}
                      <td className="py-3 px-3 font-bold text-gray-900">
                        <div className="flex items-center gap-1">
                          <span className="bg-gray-100 text-gray-800 px-1.5 py-0.5 rounded text-[11px] font-bold">
                            {result.currentGrade}
                          </span>
                          <span className="text-[10px] text-gray-500">
                            (علاوة {result.currentIncrement})
                          </span>
                        </div>
                        <div className="text-[10px] font-mono text-gray-600 mt-0.5">
                          تاريخ الدرجة: {formatDateDisplay(result.gradeEntryDate)}
                        </div>
                      </td>

                      {/* Qualifying Increments Count */}
                      <td className="py-3 px-3 text-center">
                        <span className="inline-flex items-center justify-center px-2 py-1 rounded-full text-xs font-black bg-blue-50 text-blue-900 border border-blue-200">
                          {result.qualifyingIncrementsCount}
                        </span>
                        <div className="text-[9px] text-gray-500 mt-0.5">
                          {result.qualifyingIncrementsCount >= result.requiredIncrements ? 'مستوفٍ للمدة' : `متبقي ${result.requiredIncrements - result.qualifyingIncrementsCount}`}
                        </div>
                      </td>

                      {/* Required Increments */}
                      <td className="py-3 px-3 text-center">
                        <span className="font-extrabold text-xs text-gray-800">
                          {result.requiredIncrements} علاوات
                        </span>
                        <div className="text-[9px] text-gray-500">
                          {result.currentGrade === 'الدرجة العاشرة' || result.currentGrade === '10' ? (
                            <span className="text-amber-700 font-bold">ضابط الدرجة 10</span>
                          ) : (
                            <span>ما دون العاشرة</span>
                          )}
                        </div>
                      </td>

                      {/* Competency Report (Optional - displays warning if missing without blocking) */}
                      <td className="py-3 px-3 text-center">
                        {result.competencyReportRating ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            {result.competencyReportRating}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-amber-50 text-amber-800 border border-amber-200" title="تقرير الكفاءة اختياري ولا يمنع تسجيل قرار الترقية">
                            <AlertCircle className="w-3 h-3 text-amber-600" />
                            <span>غير متوفر</span>
                          </span>
                        )}
                      </td>

                      {/* Target Next Grade */}
                      <td className="py-3 px-3 text-center font-extrabold text-red-900">
                        <span className="bg-red-50 text-red-800 border border-red-200 px-2 py-1 rounded text-[11px] inline-block font-bold">
                          {result.targetGrade}
                        </span>
                      </td>

                      {/* Legal Promotion Status Badge */}
                      <td className="py-3 px-3">
                        {result.status === 'OFFICIALLY_PROMOTED' && (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-100 text-blue-900 border border-blue-300">
                            <CheckCircle2 className="w-3 h-3 text-blue-700" />
                            <span>تمت الترقية بقرار رسمي</span>
                          </div>
                        )}
                        {result.status === 'ELIGIBLE_FOR_CONSIDERATION' && (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                            <Award className="w-3 h-3 text-amber-700" />
                            <span>مستوفٍ للحد الأدنى للترشح</span>
                          </div>
                        )}
                        {result.status === 'RECOMMENDED' && (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                            <Check className="w-3 h-3 text-emerald-700" />
                            <span>مستحق للعرض/المفاضلة</span>
                          </div>
                        )}
                        {result.status === 'NOT_ELIGIBLE' && (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-gray-100 text-gray-700 border border-gray-300">
                            <Clock className="w-3 h-3 text-gray-500" />
                            <span>غير مستحق حالياً</span>
                          </div>
                        )}
                        {result.status === 'NEEDS_REVIEW' && (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-100 text-red-900 border border-red-300">
                            <AlertTriangle className="w-3 h-3 text-red-700" />
                            <span>يحتاج إلى مراجعة</span>
                          </div>
                        )}
                        {/* Legal Note sub-caption */}
                        <div className="text-[10px] text-gray-500 mt-1 line-clamp-1 max-w-xs" title={result.legalNote}>
                          {result.legalNote}
                        </div>
                      </td>

                      {/* Official Decision Status */}
                      <td className="py-3 px-3">
                        {result.officialDecisionNumber ? (
                          <div className="text-[10px] font-mono text-gray-900">
                            <div className="font-bold text-blue-900">{result.officialDecisionNumber}</div>
                            <div className="text-gray-500">{formatDateDisplay(result.officialDecisionDate)}</div>
                          </div>
                        ) : (
                          <span className="text-[10px] text-gray-400 font-medium">بانتظار القرار الرسمي</span>
                        )}
                      </td>

                      {/* Action Buttons */}
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Official Promotion Decision Button */}
                          <button
                            onClick={() => {
                              setOfficialPromotionEmpId(result.employeeId);
                              setIsOfficialPromotionModalOpen(true);
                            }}
                            className="px-2.5 py-1.5 bg-red-700 hover:bg-red-800 text-white rounded-lg text-[11px] font-bold shadow-xs cursor-pointer transition flex items-center gap-1"
                            title="تسجيل وتوثيق قرار ترقية رسمي معتمد برقم وتاريخ"
                          >
                            <Award className="w-3 h-3 text-amber-300" />
                            <span>تسجيل قرار رسمي</span>
                          </button>

                          {/* Secondment to Grade */}
                          <button
                            onClick={() => {
                              setRecordToEdit(null);
                              setCareerModalActionType('ندب على درجة');
                              setCareerModalInitialEmpId(result.employeeId);
                              setIsCareerModalOpen(true);
                            }}
                            className="px-2 py-1.5 bg-teal-700 hover:bg-teal-800 text-white rounded-lg text-[11px] font-bold shadow-xs cursor-pointer transition flex items-center gap-1"
                            title="تسجيل ندب على درجة وظيفية"
                          >
                            <span>ندب على درجة</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: COMPREHENSIVE CAREER HISTORY (ALL ACTIONS) */}
      {activeTab === 'career_history' && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden space-y-4 p-4">
          {/* Filter Bar */}
          <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-200 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute right-3 top-2.5" />
              <input
                type="text"
                placeholder="بحث بالاسم أو رقم القرار أو الرقم الوظيفي..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pr-9 pl-3 py-2 bg-white border border-gray-300 rounded-lg text-xs"
              />
            </div>

            <div>
              <select
                value={selectedHistoryAction}
                onChange={(e) => setSelectedHistoryAction(e.target.value)}
                className="w-full p-2 bg-white border border-gray-300 rounded-lg text-xs font-bold"
              >
                <option value="الكل">كافة أنواع الإجراءات (ترقية، علاوة، ندب على درجة...)</option>
                <option value="ندب على درجة">ندب على درجة</option>
                <option value="ترقية">ترقية دورية</option>
                <option value="علاوة دورية">علاوة دورية سنوية</option>
                <option value="ترقية استثنائية">ترقية استثنائية</option>
                <option value="تسوية وضع">تسوية وضع وظيفي</option>
                <option value="تعيين">تعيين أصلي</option>
              </select>
            </div>

            <div>
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="w-full p-2 bg-white border border-gray-300 rounded-lg text-xs font-bold"
              >
                <option value="الكل">كافة الأقسام والإدارات</option>
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="border rounded-xl overflow-hidden">
            <table className="w-full text-right text-xs">
              <thead className="bg-gray-100 border-b border-gray-200 text-gray-700 font-bold">
                <tr>
                  <th className="py-3 px-3">رقم القرار / السجل</th>
                  <th className="py-3 px-3">الموظف / الرقم الوظيفي</th>
                  <th className="py-3 px-3">نوع الإجراء الوظيفي</th>
                  <th className="py-3 px-3">الدرجة السابقة والجديدة</th>
                  <th className="py-3 px-3">عدد العلاوات</th>
                  <th className="py-3 px-3">تاريخ الإجراء والقرار</th>
                  <th className="py-3 px-3">الجهة المصدرة للقرار</th>
                  <th className="py-3 px-3">البيان والملاحظات</th>
                  <th className="py-3 px-3 text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 text-[11px]">
                {filteredHistoryList.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-gray-500">
                      لا توجد سجلات وظيفية مطابقة لخيارات البحث
                    </td>
                  </tr>
                ) : (
                  filteredHistoryList.map((rec) => {
                    const meta = getCareerActionMeta(rec.actionType);
                    const emp = employees.find((e) => e.id === rec.employeeId);
                    return (
                      <tr key={rec.id} className="hover:bg-gray-50">
                        <td className="py-3 px-3 font-bold text-red-900 font-mono">
                          {rec.decisionNumber || rec.id}
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-bold text-gray-900">{rec.employeeName || emp?.fullName || 'غير معروف'}</div>
                          <div className="text-[10px] text-gray-500 font-mono">الرقم الوظيفي: {rec.fileNumber || emp?.jobNumber}</div>
                        </td>
                        <td className="py-3 px-3">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${meta.badgeColor}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${meta.dotColor}`}></span>
                            {meta.label}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-semibold">
                          {rec.previousGrade ? (
                            <span>{rec.previousGrade} ← <strong className="text-red-900">{rec.newGrade}</strong></span>
                          ) : (
                            <strong className="text-red-900">{rec.newGrade}</strong>
                          )}
                        </td>
                        <td className="py-3 px-3 font-bold text-blue-900">
                          {rec.newIncrement !== undefined ? `${rec.newIncrement} علاوة` : '—'}
                        </td>
                        <td className="py-3 px-3 font-mono dir-ltr text-right text-gray-700">
                          <div>{formatDateDisplay(rec.actionDate || rec.decisionDate)}</div>
                          {rec.decisionDate && rec.decisionDate !== rec.actionDate && (
                            <div className="text-[9px] text-gray-400">قرار: {formatDateDisplay(rec.decisionDate)}</div>
                          )}
                        </td>
                        <td className="py-3 px-3 text-gray-700">
                          {rec.issuingAuthority || 'مصرف الدم المركزي'}
                        </td>
                        <td className="py-3 px-3 text-gray-600 max-w-xs truncate">
                          {rec.notes || '—'}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => {
                                setRecordToEdit(rec);
                                setIsCareerModalOpen(true);
                              }}
                              className="p-1.5 text-gray-600 hover:text-amber-700 hover:bg-amber-50 rounded transition cursor-pointer"
                              title="تعديل السجل"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            {onDeleteCareerRecord && (
                              <button
                                onClick={() => {
                                  if (window.confirm(`هل أنت متأكد من حذف هذا السجل الوظيفي (${rec.actionType} - ${rec.decisionNumber})؟`)) {
                                    onDeleteCareerRecord(rec.id);
                                  }
                                }}
                                className="p-1.5 text-gray-400 hover:text-red-700 hover:bg-red-50 rounded transition cursor-pointer"
                                title="حذف السجل"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: SECONDMENT TO GRADE (ندب على درجة) */}
      {activeTab === 'secondments_grade' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-emerald-200 shadow-sm flex flex-wrap justify-between items-center gap-3">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-emerald-700" />
              <div>
                <h3 className="text-sm font-extrabold text-emerald-950">سجل الندب الوظيفي على الدرجة المعتمدة</h3>
                <p className="text-[11px] text-gray-500">توثيق قرارات الندب على درجة مالية / وظيفية وعدد العلاوات المقررة بالقرار</p>
              </div>
            </div>

            <button
              onClick={() => {
                setRecordToEdit(null);
                setCareerModalActionType('ندب على درجة');
                setCareerModalInitialEmpId(employees[0]?.id);
                setIsCareerModalOpen(true);
              }}
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4 text-amber-300" />
              <span>تسجيل ندب على درجة جديد</span>
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <table className="w-full text-right text-xs">
              <thead className="bg-emerald-50/60 border-b border-emerald-200 text-emerald-950 font-bold">
                <tr>
                  <th className="py-3 px-4">رقم القرار</th>
                  <th className="py-3 px-4">اسم الموظف / الرقم الوظيفي</th>
                  <th className="py-3 px-4">الدرجة السابقة</th>
                  <th className="py-3 px-4">الدرجة المنتدب عليها</th>
                  <th className="py-3 px-4">عدد العلاوات</th>
                  <th className="py-3 px-4">تاريخ القرار والفعالية</th>
                  <th className="py-3 px-4">الجهة التي أصدرت القرار</th>
                  <th className="py-3 px-4">ملاحظات القرار</th>
                  <th className="py-3 px-4 text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 text-[11px]">
                {secondmentGradeList.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-gray-500">
                      لا توجد قرارات ندب على درجة مسجلة حتى الآن
                    </td>
                  </tr>
                ) : (
                  secondmentGradeList.map((rec) => {
                    const emp = employees.find((e) => e.id === rec.employeeId);
                    return (
                      <tr key={rec.id} className="hover:bg-gray-50">
                        <td className="py-3 px-4 font-bold text-emerald-900 font-mono">{rec.decisionNumber}</td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-gray-900">{rec.employeeName || emp?.fullName}</div>
                          <div className="text-[10px] text-gray-500 font-mono">الرقم الوظيفي: {rec.fileNumber || emp?.jobNumber}</div>
                        </td>
                        <td className="py-3 px-4 text-gray-600">{rec.previousGrade || '—'}</td>
                        <td className="py-3 px-4 font-extrabold text-emerald-900 bg-emerald-50/50">
                          {rec.newGrade}
                        </td>
                        <td className="py-3 px-4 font-bold text-blue-900">{rec.newIncrement} علاوة</td>
                        <td className="py-3 px-4 font-mono dir-ltr text-right text-gray-700">
                          {formatDateDisplay(rec.actionDate || rec.decisionDate)}
                        </td>
                        <td className="py-3 px-4 text-gray-700 font-semibold">{rec.issuingAuthority}</td>
                        <td className="py-3 px-4 text-gray-500">{rec.notes || '—'}</td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => {
                              setRecordToEdit(rec);
                              setIsCareerModalOpen(true);
                            }}
                            className="p-1.5 text-gray-600 hover:text-amber-700 hover:bg-amber-50 rounded transition cursor-pointer"
                            title="تعديل السجل"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: PROMOTIONS */}
      {activeTab === 'promotions' && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-700 font-bold">
                <tr>
                  <th className="py-3 px-4">رقم القرار</th>
                  <th className="py-3 px-4">الموظف / الرقم الوظيفي</th>
                  <th className="py-3 px-4">نوع الترقية</th>
                  <th className="py-3 px-4">الدرجة السابقة والجديدة</th>
                  <th className="py-3 px-4">تاريخ القرار والفعالية</th>
                  <th className="py-3 px-4">الجهة المصدرة / السبب</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {allCareerHistory.filter(r => r.actionType === 'ترقية' || r.actionType === 'ترقية استثنائية').length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-gray-500">لا توجد ترقيات مسجلة</td>
                  </tr>
                ) : (
                  allCareerHistory.filter(r => r.actionType === 'ترقية' || r.actionType === 'ترقية استثنائية').map((p) => {
                    const emp = employees.find((e) => e.id === p.employeeId);
                    return (
                      <tr key={p.id} className="hover:bg-gray-50">
                        <td className="py-3 px-4 font-bold text-red-900 font-mono">{p.decisionNumber}</td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-gray-900">{emp?.fullName || p.employeeName}</div>
                          <div className="text-[10px] text-gray-500 font-mono">الرقم الوظيفي: {emp?.jobNumber || p.fileNumber}</div>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${p.actionType === 'ترقية استثنائية' ? 'bg-amber-100 text-amber-900' : 'bg-red-100 text-red-900'}`}>
                            {p.actionType}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-semibold">
                          {p.previousGrade} ← <strong className="text-red-900">{p.newGrade}</strong>
                        </td>
                        <td className="py-3 px-4 text-gray-600 font-mono">{formatDateDisplay(p.actionDate || p.decisionDate)}</td>
                        <td className="py-3 px-4 text-gray-700">{p.notes || p.issuingAuthority}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: INCREMENTS */}
      {activeTab === 'increments' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex flex-wrap justify-between items-center gap-3">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-600" />
              <div>
                <h3 className="text-sm font-extrabold text-gray-900">سجل العلاوات السنوية الدورية</h3>
                <p className="text-[11px] text-gray-500">متابعة العلاوات الممنوحة واحتساب الاستحقاقات الدورية تلقائياً</p>
              </div>
            </div>

            <button
              onClick={() => {
                setRecordToEdit(null);
                setCareerModalActionType('علاوة دورية');
                setCareerModalInitialEmpId(employees[0]?.id);
                setIsCareerModalOpen(true);
              }}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4 text-amber-400" />
              <span>تسجيل علاوة فردية</span>
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <table className="w-full text-right text-xs">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-700 font-bold">
                <tr>
                  <th className="py-3 px-4">رقم القرار / السجل</th>
                  <th className="py-3 px-4">الموظف / الرقم الوظيفي</th>
                  <th className="py-3 px-4">الدرجة وتاريخها</th>
                  <th className="py-3 px-4">العلاوة الممنوحة</th>
                  <th className="py-3 px-4">تاريخ الفعالية والاستحقاق</th>
                  <th className="py-3 px-4">البيان والملاحظات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 text-[11px]">
                {allCareerHistory.filter(r => r.actionType === 'علاوة دورية').length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-gray-500">لا توجد علاوات مسجلة حتى الآن</td>
                  </tr>
                ) : (
                  allCareerHistory.filter(r => r.actionType === 'علاوة دورية').map((inc) => {
                    const emp = employees.find((e) => e.id === inc.employeeId);
                    return (
                      <tr key={inc.id} className="hover:bg-gray-50">
                        <td className="py-3 px-4 font-bold text-red-900 font-mono">{inc.decisionNumber}</td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-gray-900">{emp?.fullName || inc.employeeName}</div>
                          <div className="text-[10px] text-gray-500 font-mono">الرقم الوظيفي: {emp?.jobNumber || inc.fileNumber}</div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-gray-800">{emp?.jobGrade || inc.previousGrade}</div>
                          <div className="text-[10px] text-gray-600 font-mono">
                            تاريخ الدرجة: {formatDateDisplay(emp?.gradeEntryDate || '')}
                          </div>
                        </td>
                        <td className="py-3 px-4 font-bold text-blue-900">
                          علاوة {inc.newIncrement}
                        </td>
                        <td className="py-3 px-4 text-gray-600 font-mono">{formatDateDisplay(inc.actionDate || inc.decisionDate)}</td>
                        <td className="py-3 px-4 text-gray-500">{inc.notes || '—'}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Unified Career Action Modal (Add / Edit for all 5 actions) */}
      <CareerActionModal
        isOpen={isCareerModalOpen}
        onClose={() => {
          setIsCareerModalOpen(false);
          setRecordToEdit(null);
        }}
        employees={employees}
        initialEmployeeId={careerModalInitialEmpId}
        initialActionType={careerModalActionType}
        recordToEdit={recordToEdit}
        onSubmit={handleSaveCareerRecord}
        currentUser={currentUser}
      />

      {/* Employee Career History Report Modal */}
      {isEmpCareerReportOpen && selectedEmpForReport && (
        <EmployeeCareerReportModal
          isOpen={isEmpCareerReportOpen}
          onClose={() => setIsEmpCareerReportOpen(false)}
          employee={selectedEmpForReport}
          careerRecords={careerRecords}
          promotions={promotions}
          increments={increments}
          settlements={settlements}
          onOpenAddModal={() => {
            setRecordToEdit(null);
            setCareerModalActionType('ندب على درجة');
            setCareerModalInitialEmpId(selectedEmpForReport.id);
            setIsCareerModalOpen(true);
          }}
        />
      )}

      {/* Printable Official Promotion Eligibility Report Modal (UPDATED WITH ALL REQUIRED COLUMNS) */}
      {isPrintReportOpen && (
        <div 
          className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 overflow-y-auto print:p-0 print:bg-white print:static"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsPrintReportOpen(false);
          }}
        >
          <div 
            id="PRINT_PROMOTIONS_REPORT"
            className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full p-8 border border-gray-300 print:shadow-none print:border-none print:w-full space-y-6 text-right relative font-sans my-auto"
          >
            {/* Top Screen Controls */}
            <div className="flex flex-wrap justify-between items-center print:hidden bg-slate-100 p-3 rounded-xl border border-slate-200 gap-2">
              <button
                onClick={() => setIsPrintReportOpen(false)}
                type="button"
                className="px-4 py-2 bg-slate-700 hover:bg-slate-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
                <span>إغلاق</span>
              </button>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={async () => {
                    setIsExportingPdf(true);
                    setExportSuccess(false);
                    const safeName = `تقرير_استحقاق_الترقيات_${new Date().getFullYear()}_${Date.now()}`;
                    try {
                      const success = await exportElementToPdf('PRINT_PROMOTIONS_REPORT', safeName, {
                        orientation: 'landscape',
                        margin: 6,
                        scale: 2.2
                      });
                      if (success) {
                        setExportSuccess(true);
                        setTimeout(() => setExportSuccess(false), 3000);
                      }
                    } catch (err) {
                      console.error('PDF export error:', err);
                    } finally {
                      setIsExportingPdf(false);
                    }
                  }}
                  disabled={isExportingPdf}
                  type="button"
                  className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer ${
                    exportSuccess
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-800 hover:bg-slate-900 text-white'
                  } disabled:opacity-50`}
                >
                  {isExportingPdf ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-red-300" />
                      <span>جاري إنشاء PDF...</span>
                    </>
                  ) : exportSuccess ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-200" />
                      <span>تم تصدير PDF</span>
                    </>
                  ) : (
                    <>
                      <FileDown className="w-4 h-4 text-red-400" />
                      <span>تصدير ملف PDF مباشر</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => window.print()}
                  type="button"
                  className="px-5 py-2 bg-red-700 hover:bg-red-800 text-white rounded-lg text-xs font-bold flex items-center gap-2 shadow-md transition-colors cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>طباعة</span>
                </button>
              </div>
            </div>

            {/* Official Header */}
            <div className="border-b-2 border-red-800 pb-4">
              <div className="flex justify-between items-center">
                <div className="text-right space-y-1">
                  <h3 className="text-xs font-extrabold text-gray-700">دولة ليبيا — وزارة الصحة</h3>
                  <h1 className="text-xl font-black text-red-900 tracking-wide">مصرف الدم المركزي بلدية المرج</h1>
                  <p className="text-xs font-bold text-gray-600">إدارة الشؤون الإدارية والمالية — قسم الموارد البشرية والترقيات</p>
                </div>

                <div className="flex flex-col items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-red-50 border-2 border-red-700 flex items-center justify-center shadow-inner relative">
                    <svg className="w-10 h-10 text-red-700" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
                    </svg>
                  </div>
                  <span className="text-[10px] font-black text-red-800 mt-1">مصرف الدم المركزي</span>
                </div>

                <div className="text-left font-mono text-xs text-gray-600 space-y-1">
                  <div>تاريخ التقرير: <strong className="text-gray-900">{formatDateDisplay(new Date().toISOString().slice(0, 10))}</strong></div>
                  <div>السنة المالية: <strong className="text-red-900">{new Date().getFullYear()}</strong></div>
                  <div>إجمالي الموظفين: <strong className="text-gray-900">{filteredList.length}</strong></div>
                </div>
              </div>

              <div className="mt-3 bg-red-800 text-white text-center py-1.5 rounded-lg font-black text-sm tracking-wider shadow-sm">
                كشف واستمارة ترشيح واستحقاق الترقيات الوظيفية للموظفين
              </div>
            </div>

            {/* Active Filters Summary */}
            <div className="bg-gray-50 p-3 rounded-lg border text-xs flex justify-around font-bold text-gray-700">
              <span>قسم / إدارة: <strong className="text-red-900">{selectedDept}</strong></span>
              <span>الكادر الوظيفي: <strong className="text-red-900">{selectedCategory}</strong></span>
              <span>حالة الاستحقاق: <strong className="text-red-900">{selectedStatus}</strong></span>
              <span>عدد المستحقين: <strong className="text-emerald-800">{eligibleCount} موظف</strong></span>
            </div>

            {/* Main Data Table (MANDATORY REQUIREMENT: UPDATED REPORT COLUMNS) */}
            <div className="border rounded-xl overflow-hidden">
              <table className="w-full text-right text-xs">
                <thead className="bg-gray-100 border-b border-gray-300 font-bold text-gray-800 text-[10px]">
                  <tr>
                    <th className="py-2.5 px-2">ر.م</th>
                    <th className="py-2.5 px-2">اسم الموظف</th>
                    <th className="py-2.5 px-2">الدرجة الحالية</th>
                    <th className="py-2.5 px-2">عدد العلاوات</th>
                    <th className="py-2.5 px-2">تاريخ آخر ترقية</th>
                    <th className="py-2.5 px-2">تاريخ آخر علاوة</th>
                    <th className="py-2.5 px-2 text-center">عدد الترقيات السابقة</th>
                    <th className="py-2.5 px-2">نوع آخر إجراء</th>
                    <th className="py-2.5 px-2">الدرجة السابقة</th>
                    <th className="py-2.5 px-2">الترقية المقترحة</th>
                    <th className="py-2.5 px-2">توصية الاستحقاق</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 text-[10px]">
                  {filteredList.map(({ emp, rec, summary }, idx) => (
                    <tr key={emp.id} className="hover:bg-gray-50">
                      <td className="py-2 px-2 font-bold text-gray-500">{idx + 1}</td>
                      <td className="py-2 px-2 font-bold text-gray-900">
                        <div>{emp.fullName}</div>
                        <span className="text-[9px] text-gray-500 font-mono">{emp.jobNumber}</span>
                      </td>
                      <td className="py-2 px-2 font-bold">{emp.jobGrade}</td>
                      <td className="py-2 px-2 font-bold text-blue-900">{emp.currentIncrement || 1}</td>
                      <td className="py-2 px-2 font-mono dir-ltr text-right">
                        {formatDateDisplay(summary.lastPromotionDate)}
                      </td>
                      <td className="py-2 px-2 font-mono dir-ltr text-right">
                        {formatDateDisplay(summary.lastAnnualIncrementDate)}
                      </td>
                      <td className="py-2 px-2 text-center font-bold text-red-900">
                        {summary.promotionsCount}
                      </td>
                      <td className="py-2 px-2">
                        {summary.lastAction ? (
                          <span className="text-[9px] font-bold text-gray-800">
                            {summary.lastAction.actionType}
                          </span>
                        ) : (
                          'تعيين'
                        )}
                      </td>
                      <td className="py-2 px-2 text-gray-600">
                        {summary.lastAction?.previousGrade || '—'}
                      </td>
                      <td className="py-2 px-2 font-extrabold text-red-900 bg-red-50/40">
                        {rec.recommendedNewGrade}
                      </td>
                      <td className="py-2 px-2 font-bold">
                        {rec.status === 'مستحق للترقية' ? (
                          <span className="text-emerald-800 font-bold">مستحق ({rec.recommendedNewGrade})</span>
                        ) : rec.status === 'قريب من الاستحقاق' ? (
                          <span className="text-amber-800">قريب من الاستحقاق</span>
                        ) : (
                          <span className="text-gray-600">غير مستحق</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Official Signatures & Stamp */}
            <div className="pt-4 border-t space-y-4">
              <div className="grid grid-cols-3 gap-4 text-center text-xs">
                <div className="border border-gray-200 rounded-xl p-3 space-y-6 bg-gray-50/50">
                  <div className="font-bold text-gray-800">رئيس قسم الموارد البشرية والترقيات</div>
                  <div className="text-gray-400 text-[10px]">التوقيع: .....................</div>
                </div>

                <div className="border border-gray-200 rounded-xl p-3 space-y-6 bg-gray-50/50">
                  <div className="font-bold text-gray-800">مدير الشؤون الإدارية والمالية</div>
                  <div className="text-gray-400 text-[10px]">التوقيع: .....................</div>
                </div>

                <div className="border border-red-200 rounded-xl p-3 space-y-6 bg-red-50/30">
                  <div className="font-extrabold text-red-900">المدير العام لمصرف الدم المركزي</div>
                  <div className="text-gray-400 text-[10px]">الاعتماد الرسمي: ...........</div>
                </div>
              </div>

              <div className="flex justify-between items-center text-xs pt-2">
                <p className="text-[10px] text-gray-500">
                  تم استخراج هذا التقرير آلياً من منظومة إدارة الموظفين والموارد البشرية بمصرف الدم المركزي المرج.
                </p>

                <div className="w-28 h-28 border-2 border-dashed border-red-700 rounded-full flex flex-col items-center justify-center text-center p-2 text-[9px] text-red-800 font-bold bg-red-50/40">
                  <span>ختم المصرف الرسمي</span>
                  <span className="text-[7px] text-gray-400 mt-1">تاريخ الختم: ../../20..</span>
                </div>
              </div>
            </div>

            {/* Bottom Controls */}
            <div className="print:hidden pt-4 border-t-2 border-gray-200 flex flex-wrap items-center justify-between gap-3">
              <button
                onClick={() => setIsPrintReportOpen(false)}
                type="button"
                className="px-6 py-2.5 bg-slate-700 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm cursor-pointer"
              >
                <X className="w-4 h-4" />
                <span>إغلاق</span>
              </button>

              <button
                onClick={() => window.print()}
                type="button"
                className="px-6 py-2.5 bg-red-700 hover:bg-red-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>طباعة</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Excel Migration Modal */}
      <ExcelImportModal
        isOpen={isExcelMigrationOpen}
        onClose={() => setIsExcelMigrationOpen(false)}
        existingEmployees={employees}
        existingCareerRecords={careerRecords}
        existingPromotions={promotions}
        existingIncrements={increments}
        existingSettlements={settlements}
        onImportComplete={(result) => {
          if (onImportComplete) {
            onImportComplete(result);
          }
          setActiveTab('career_history');
        }}
        currentUser={currentUser}
        onNavigateToTab={(tab) => {
          if (tab === 'promotions_increments' || tab === 'promotions') {
            setActiveTab('career_history');
          }
        }}
      />

      {/* Official Promotion Decision Modal (Strict Libyan Law Workflow) */}
      <OfficialPromotionModal
        isOpen={isOfficialPromotionModalOpen}
        onClose={() => {
          setIsOfficialPromotionModalOpen(false);
          setOfficialPromotionEmpId(undefined);
        }}
        employees={employees}
        careerRecords={careerRecords}
        promotions={promotions}
        increments={increments}
        settlements={settlements}
        annualEvaluations={annualEvaluations}
        rules={localPromotionRules}
        initialEmployeeId={officialPromotionEmpId}
        currentUser={currentUser}
        onSavePromotion={handleSaveOfficialPromotion}
      />

      {/* Promotion Rules and Legal Standards Configuration Modal */}
      <PromotionRulesModal
        isOpen={isPromotionRulesModalOpen}
        onClose={() => setIsPromotionRulesModalOpen(false)}
        rules={localPromotionRules}
        onSaveRules={handleSavePromotionRules}
      />

      {/* Acceptance and Compliance Tests (1 to 7) Modal */}
      <PromotionAcceptanceTestsModal
        isOpen={isAcceptanceTestsModalOpen}
        onClose={() => setIsAcceptanceTestsModalOpen(false)}
        rules={localPromotionRules}
      />

      {/* Official Promotion Comprehensive Legal Report Modal (13 Columns + Signatures) */}
      <OfficialPromotionReportModal
        isOpen={isOfficialReportModalOpen}
        onClose={() => setIsOfficialReportModalOpen(false)}
        results={filteredLibyanPromotionList}
        generalManagerName={generalManagerName}
        officialLogoUrl={officialLogoUrl}
        departmentFilter={selectedDept}
        statusFilter={selectedStatus}
      />
    </div>
  );
};
