import React, { useState, useMemo, useEffect } from 'react';
import { 
  Employee, 
  EmploymentStatus, 
  Gender, 
  AssignmentCategory, 
  LeaveTransaction, 
  HrRule,
  IncrementRecord,
  PromotionRecord,
  StatusSettlementRecord,
  GeneralProcedure,
  CareerPromotionRecord,
  EmployeeQualificationRecord,
  TransferRecord,
  SecondmentRecord,
  DisciplinaryRecord,
  ResignationRecord,
  AnnualPerformanceEvaluation,
  AppointmentSalarySystem,
  AppointmentGradeConfig,
  CareerActionType,
  IntermediateCareerStep
} from '../types';
import { 
  APPOINTMENT_SALARY_SYSTEMS, 
  getAvailableAppointmentGrades, 
  getAvailableIncrementsForGrade, 
  inferSalarySystemFromGrade 
} from '../utils/appointmentGradeUtils';
import { ExcelImportModal } from './ExcelImportModal';
import { MigrationCommitResult } from '../utils/excelMigrationUtils';
import { LeaveModal } from './LeaveModal';
import { OfficialLeavePrintModal } from './OfficialLeavePrintModal';
import { IncrementHistoryModal } from './IncrementHistoryModal';
import { EmployeeDetailsAccordion } from './EmployeeDetailsAccordion';
import { EmployeeListPrintModal } from './EmployeeListPrintModal';
import { FilteredEmployeeReportModal } from './FilteredEmployeeReportModal';
import { EmployeeProfileView } from './EmployeeProfileView';
import * as XLSX from 'xlsx';
import { 
  DEPARTMENTS, 
  DEPT_CATEGORIES,
  JOBS_BY_DEPT, 
  QUALIFICATIONS, 
  EDUCATIONAL_DEGREES,
  EDUCATION_TYPES,
  HIRING_ENTITIES,
  SALARY_SCALES,
  JOB_GRADES,
  ASSIGNMENT_CATEGORIES,
  COMMON_NATIONALITIES
} from '../data/initialData';
import { parseGradeNumber, isOutsideCadreStatus } from '../utils/hrCalculations';
import { formatDateDisplay } from '../utils/dateUtils';
import { isInvalidPlaceholderName, isFakeSequentialNationalId } from '../utils/fakeRecordDetection';
import { getGenderFromNationalId, getGenderFromEmployee, normalizeNationalId } from '../utils/nationalIdUtils';
import { sortEmployeesNumerically } from '../utils/employeeSortingUtils';
import { EmployeeReviewModal } from './EmployeeReviewModal';
import { TestRecordsCleanupModal } from './TestRecordsCleanupModal';
import { DatabaseFinalAuditModal } from './DatabaseFinalAuditModal';
import { RebuildCurrentGradesModal } from './RebuildCurrentGradesModal';
import { GradeChronologyAuditModal } from './GradeChronologyAuditModal';
import { getLatestEffectiveGradeInfo, getLatestEffectiveGrade, getLatestEffectiveIncrement, LatestEffectiveGradeInfo } from '../utils/gradeCalculationEngine';
import { FullAppDatabase } from '../types';
import { 
  UserPlus, 
  Edit3, 
  Trash2, 
  FileText, 
  Search, 
  Filter, 
  Printer, 
  X, 
  Zap, 
  AlertTriangle,
  FileSpreadsheet,
  Calendar,
  ChevronRight, 
  ChevronLeft, 
  ChevronDown, 
  ChevronUp,
  Eye, 
  User, 
  CheckCircle2, 
  RefreshCw,
  Layers,
  Award,
  SlidersHorizontal,
  ArrowUpDown,
  Info,
  ClipboardCheck,
  ShieldAlert,
  ShieldCheck,
  Plus
} from 'lucide-react';

interface EmployeeManagerViewProps {
  employees: Employee[];
  leaves?: LeaveTransaction[];
  increments?: IncrementRecord[];
  promotions?: PromotionRecord[];
  settlements?: StatusSettlementRecord[];
  generalProcedures?: GeneralProcedure[];
  careerRecords?: CareerPromotionRecord[];
  qualifications?: EmployeeQualificationRecord[];
  evaluations?: AnnualPerformanceEvaluation[];
  transfers?: TransferRecord[];
  secondments?: SecondmentRecord[];
  disciplinary?: DisciplinaryRecord[];
  resignations?: ResignationRecord[];
  rules?: HrRule[];
  appointmentGradeConfigs?: AppointmentGradeConfig[];
  fullDatabase?: FullAppDatabase;
  onCleanupComplete?: (newDatabase: FullAppDatabase, summary: string) => void;
  onAddEmployee: (emp: Employee) => void;
  onUpdateEmployee: (emp: Employee) => void;
  onDeleteEmployee: (id: number) => void;
  onDuplicateEmployee: (emp: Employee) => void;
  onPrintCard: (emp: Employee) => void;
  onOpenAddModal: boolean;
  setOpenAddModal: (open: boolean) => void;
  openExcelModal?: boolean;
  setOpenExcelModal?: (open: boolean) => void;
  onGenerateHighVolume?: (count: number) => void;
  onAddLeave?: (leave: LeaveTransaction) => void;
  onAddIncrement?: (inc: IncrementRecord) => void;
  onUpdateEmployeeIncrement?: (employeeId: number, newIncrement: number) => void;
  onAddQualification?: (record: EmployeeQualificationRecord) => void;
  onUpdateQualification?: (record: EmployeeQualificationRecord) => void;
  onDeleteQualification?: (id: string) => void;
  onSaveEvaluation?: (evaluation: AnnualPerformanceEvaluation) => void;
  onDeleteEvaluation?: (id: string) => void;
  onAddCareerRecord?: (record: CareerPromotionRecord) => void;
  onAddCareerRecords?: (records: CareerPromotionRecord[]) => void;
  onUpdateCareerRecord?: (record: CareerPromotionRecord) => void;
  onDeleteCareerRecord?: (id: string) => void;
  onImportComplete?: (result: MigrationCommitResult) => void;
  onNavigateToTab?: (tabName: string) => void;
  currentUser?: string;
  generalManagerName?: string;
  officialLogoUrl?: string;
}

export const EmployeeManagerView: React.FC<EmployeeManagerViewProps> = ({
  employees = [],
  leaves = [],
  increments = [],
  promotions = [],
  settlements = [],
  generalProcedures = [],
  careerRecords = [],
  qualifications = [],
  evaluations = [],
  transfers = [],
  secondments = [],
  disciplinary = [],
  resignations = [],
  rules = [],
  appointmentGradeConfigs,
  fullDatabase,
  onCleanupComplete,
  onAddEmployee,
  onUpdateEmployee,
  onDeleteEmployee,
  onDuplicateEmployee,
  onPrintCard,
  onOpenAddModal,
  setOpenAddModal,
  openExcelModal,
  setOpenExcelModal,
  onGenerateHighVolume,
  onAddLeave,
  onAddIncrement,
  onUpdateEmployeeIncrement,
  onAddQualification,
  onUpdateQualification,
  onDeleteQualification,
  onSaveEvaluation,
  onDeleteEvaluation,
  onAddCareerRecord,
  onAddCareerRecords,
  onUpdateCareerRecord,
  onDeleteCareerRecord,
  onImportComplete,
  onNavigateToTab,
  currentUser = 'المستخدم الحالي',
  generalManagerName,
  officialLogoUrl
}) => {
  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isAdvancedFilterOpen, setIsAdvancedFilterOpen] = useState<boolean>(false);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<'الكل' | AssignmentCategory>('الكل');

  // Administrative Filters
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>('الكل');
  const [selectedJobTitleFilter, setSelectedJobTitleFilter] = useState<string>('الكل');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('الكل');
  const [selectedQualFilter, setSelectedQualFilter] = useState<string>('الكل');
  const [selectedGradeFilter, setSelectedGradeFilter] = useState<string>('الكل');
  const [selectedSalarySystemFilter, setSelectedSalarySystemFilter] = useState<string>('الكل');
  const [selectedNationalityFilter, setSelectedNationalityFilter] = useState<'الكل' | 'ليبي' | 'غير ليبي'>('الكل');
  const [selectedGenderFilter, setSelectedGenderFilter] = useState<'الكل' | 'ذكر' | 'أنثى' | 'غير محدد'>('الكل');
  const [selectedHiringEntityFilter, setSelectedHiringEntityFilter] = useState<string>('الكل');

  // Career & Promotion Filters
  const [selectedIncrementFilter, setSelectedIncrementFilter] = useState<string>('الكل');
  const [selectedPromotionEligibilityFilter, setSelectedPromotionEligibilityFilter] = useState<string>('الكل');
  const [selectedHasPromotionsFilter, setSelectedHasPromotionsFilter] = useState<string>('الكل');
  const [selectedHasSecondmentsFilter, setSelectedHasSecondmentsFilter] = useState<string>('الكل');
  const [selectedHasSettlementsFilter, setSelectedHasSettlementsFilter] = useState<string>('الكل');
  const [selectedHasProceduresFilter, setSelectedHasProceduresFilter] = useState<string>('الكل');

  // Leave, Disciplinary, Evaluation & Attachment Filters
  const [selectedLeaveFilter, setSelectedLeaveFilter] = useState<string>('الكل');
  const [selectedDisciplinaryFilter, setSelectedDisciplinaryFilter] = useState<string>('الكل');
  const [selectedWarningsFilter, setSelectedWarningsFilter] = useState<string>('الكل');
  const [selectedDeductionsFilter, setSelectedDeductionsFilter] = useState<string>('الكل');
  const [selectedEvaluationFilter, setSelectedEvaluationFilter] = useState<string>('الكل');
  const [selectedDocumentFilter, setSelectedDocumentFilter] = useState<string>('الكل');
  
  // Expanded employee for inline accordion details
  const [expandedEmpId, setExpandedEmpId] = useState<number | null>(null);

  // Selected employee for dedicated Profile View
  const [selectedProfileEmp, setSelectedProfileEmp] = useState<Employee | null>(null);

  // Modal states
  const [isFormOpen, setIsFormOpen] = useState<boolean>(onOpenAddModal);
  const [editingEmp, setEditingEmp] = useState<Employee | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [intermediateGrades, setIntermediateGrades] = useState<IntermediateCareerStep[]>([]);
  const [deletedIntermediateIds, setDeletedIntermediateIds] = useState<string[]>([]);
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(!!openExcelModal);
  const [isListPrintModalOpen, setIsListPrintModalOpen] = useState<boolean>(false);
  const [isFilteredReportModalOpen, setIsFilteredReportModalOpen] = useState<boolean>(false);

  // Review, Cleanup & Audit Modal States
  const [reviewEmp, setReviewEmp] = useState<Employee | null>(null);
  const [isCleanupModalOpen, setIsCleanupModalOpen] = useState<boolean>(false);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState<boolean>(false);
  const [isRebuildGradesModalOpen, setIsRebuildGradesModalOpen] = useState<boolean>(false);
  const [isGradeAuditModalOpen, setIsGradeAuditModalOpen] = useState<boolean>(false);
  const [auditInspectEmpId, setAuditInspectEmpId] = useState<number | null>(null);

  // Increment Details Modal State
  const [incrementDetailEmp, setIncrementDetailEmp] = useState<Employee | null>(null);

  // Leave Modal State for specific employee
  const [leaveModalEmpId, setLeaveModalEmpId] = useState<number | null>(null);
  const [printLeaveRecord, setPrintLeaveRecord] = useState<LeaveTransaction | null>(null);

  // Pagination state (20, 50, 100, or all)
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(50);

  // Active Full Database fallback
  const activeDb: FullAppDatabase = useMemo(() => {
    if (fullDatabase) return fullDatabase;
    return {
      employees,
      leaves,
      increments,
      promotions,
      settlements,
      generalProcedures,
      careerRecords,
      qualifications,
      annualEvaluations: evaluations,
      transfers,
      secondments,
      disciplinary,
      resignations,
      hrRules: rules
    };
  }, [fullDatabase, employees, leaves, increments, promotions, settlements, generalProcedures, careerRecords, qualifications, evaluations, transfers, secondments, disciplinary, resignations, rules]);

  // Sync prop modal open
  useEffect(() => {
    if (onOpenAddModal) {
      handleOpenCreate();
      setOpenAddModal(false);
    }
  }, [onOpenAddModal]);

  useEffect(() => {
    if (openExcelModal) {
      setIsImportModalOpen(true);
      if (setOpenExcelModal) setOpenExcelModal(false);
    }
  }, [openExcelModal]);

  // Fast ID Set indexations for O(1) membership lookups
  const employeesWithLeaves = useMemo(() => new Set(leaves.map((l) => l.employeeId)), [leaves]);
  
  const employeesWithActiveLeaves = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const activeIds = new Set<number>();
    leaves.forEach((l) => {
      if (l.startDate && l.endDate && l.startDate <= today && l.endDate >= today) {
        activeIds.add(l.employeeId);
      }
    });
    return activeIds;
  }, [leaves]);

  const employeesWithPromotions = useMemo(() => new Set(promotions.map((p) => p.employeeId)), [promotions]);
  const employeesWithSecondments = useMemo(() => new Set(secondments.map((s) => s.employeeId)), [secondments]);
  const employeesWithSettlements = useMemo(() => new Set(settlements.map((s) => s.employeeId)), [settlements]);
  const employeesWithProcedures = useMemo(() => new Set(generalProcedures.map((g) => g.employeeId)), [generalProcedures]);

  const employeesWithDisciplinary = useMemo(() => new Set(disciplinary.map((d) => d.employeeId)), [disciplinary]);
  
  const employeesWithWarnings = useMemo(() => {
    const s = new Set<number>();
    disciplinary.forEach((d) => {
      const t = (d.recordType || d.actionType || d.penaltyType || '');
      if (t.includes('إنذار') || t.includes('تنبيه') || t.includes('لوم')) s.add(d.employeeId);
    });
    return s;
  }, [disciplinary]);

  const employeesWithDeductions = useMemo(() => {
    const s = new Set<number>();
    disciplinary.forEach((d) => {
      const t = (d.recordType || d.actionType || d.penaltyType || '');
      const days = Number(d.numberOfDays || d.deductionDays || 0);
      if (t.includes('خصم') || days > 0) {
        s.add(d.employeeId);
      }
    });
    return s;
  }, [disciplinary]);

  const employeesWithEvaluations = useMemo(() => new Set(evaluations.map((e) => e.employeeId)), [evaluations]);

  // Central authoritative mapping of latest effective grades for all employees
  const employeeGradeInfoMap = useMemo(() => {
    const map = new Map<number, LatestEffectiveGradeInfo>();
    employees.forEach((emp) => {
      const info = getLatestEffectiveGradeInfo(emp, {
        careerRecords,
        promotions,
        increments,
        settlements,
        generalProcedures,
        employees
      });
      map.set(emp.id, info);
    });
    return map;
  }, [employees, careerRecords, promotions, increments, settlements, generalProcedures]);

  // Statistics for chronological grade status
  const gradeChronologyStats = useMemo(() => {
    let changedCount = 0;
    let historical418Count = 0;
    let generalGradeCount = 0;
    employees.forEach((emp) => {
      const info = employeeGradeInfoMap.get(emp.id);
      if (info?.isDifferentFromRecorded) changedCount++;
      if (info?.hasHistorical418) historical418Count++;
      if (info?.hasGeneralGrade) generalGradeCount++;
    });
    return {
      total: employees.length,
      changedCount,
      historical418Count,
      generalGradeCount
    };
  }, [employees, employeeGradeInfoMap]);

  // Unique options extracted dynamically from employees database
  const uniqueDepartments = useMemo(() => {
    const set = new Set<string>(DEPARTMENTS);
    employees.forEach((e) => { if (e.department) set.add(e.department); });
    return Array.from(set).sort();
  }, [employees]);

  const uniqueJobTitles = useMemo(() => {
    const set = new Set<string>();
    employees.forEach((e) => { if (e.jobTitle) set.add(e.jobTitle); });
    return Array.from(set).sort();
  }, [employees]);

  const uniqueGrades = useMemo(() => {
    const set = new Set<string>(JOB_GRADES);
    employees.forEach((e) => {
      const g = employeeGradeInfoMap.get(e.id)?.displayedCurrentGrade || e.jobGrade;
      if (g) set.add(g);
    });
    return Array.from(set);
  }, [employees, employeeGradeInfoMap]);

  const uniqueHiringEntities = useMemo(() => {
    const set = new Set<string>(HIRING_ENTITIES);
    employees.forEach((e) => { if (e.hiringEntity) set.add(e.hiringEntity); });
    return Array.from(set).sort();
  }, [employees]);

  const uniqueQualifications = useMemo(() => {
    const set = new Set<string>(QUALIFICATIONS);
    employees.forEach((e) => { if (e.qualification) set.add(e.qualification); });
    return Array.from(set).sort();
  }, [employees]);

  // Count active advanced filters
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedDeptFilter !== 'الكل') count++;
    if (selectedJobTitleFilter !== 'الكل') count++;
    if (selectedStatusFilter !== 'الكل') count++;
    if (selectedQualFilter !== 'الكل') count++;
    if (selectedGradeFilter !== 'الكل') count++;
    if (selectedSalarySystemFilter !== 'الكل') count++;
    if (selectedNationalityFilter !== 'الكل') count++;
    if (selectedGenderFilter !== 'الكل') count++;
    if (selectedHiringEntityFilter !== 'الكل') count++;
    if (selectedIncrementFilter !== 'الكل') count++;
    if (selectedPromotionEligibilityFilter !== 'الكل') count++;
    if (selectedHasPromotionsFilter !== 'الكل') count++;
    if (selectedHasSecondmentsFilter !== 'الكل') count++;
    if (selectedHasSettlementsFilter !== 'الكل') count++;
    if (selectedHasProceduresFilter !== 'الكل') count++;
    if (selectedLeaveFilter !== 'الكل') count++;
    if (selectedDisciplinaryFilter !== 'الكل') count++;
    if (selectedWarningsFilter !== 'الكل') count++;
    if (selectedDeductionsFilter !== 'الكل') count++;
    if (selectedEvaluationFilter !== 'الكل') count++;
    if (selectedDocumentFilter !== 'الكل') count++;
    return count;
  }, [
    selectedDeptFilter,
    selectedJobTitleFilter,
    selectedStatusFilter,
    selectedQualFilter,
    selectedGradeFilter,
    selectedSalarySystemFilter,
    selectedNationalityFilter,
    selectedGenderFilter,
    selectedHiringEntityFilter,
    selectedIncrementFilter,
    selectedPromotionEligibilityFilter,
    selectedHasPromotionsFilter,
    selectedHasSecondmentsFilter,
    selectedHasSettlementsFilter,
    selectedHasProceduresFilter,
    selectedLeaveFilter,
    selectedDisciplinaryFilter,
    selectedWarningsFilter,
    selectedDeductionsFilter,
    selectedEvaluationFilter,
    selectedDocumentFilter
  ]);

  const handleResetFilters = () => {
    setSelectedDeptFilter('الكل');
    setSelectedJobTitleFilter('الكل');
    setSelectedStatusFilter('الكل');
    setSelectedQualFilter('الكل');
    setSelectedGradeFilter('الكل');
    setSelectedSalarySystemFilter('الكل');
    setSelectedNationalityFilter('الكل');
    setSelectedGenderFilter('الكل');
    setSelectedHiringEntityFilter('الكل');
    setSelectedIncrementFilter('الكل');
    setSelectedPromotionEligibilityFilter('الكل');
    setSelectedHasPromotionsFilter('الكل');
    setSelectedHasSecondmentsFilter('الكل');
    setSelectedHasSettlementsFilter('الكل');
    setSelectedHasProceduresFilter('الكل');
    setSelectedLeaveFilter('الكل');
    setSelectedDisciplinaryFilter('الكل');
    setSelectedWarningsFilter('الكل');
    setSelectedDeductionsFilter('الكل');
    setSelectedEvaluationFilter('الكل');
    setSelectedDocumentFilter('الكل');
    setSearchQuery('');
    setCurrentPage(1);
  };

  // Structured summary of active filters for report headers & chip tags
  const activeFilterSummary = useMemo(() => {
    const list: { label: string; value: string; onRemove: () => void }[] = [];
    if (selectedDeptFilter !== 'الكل') list.push({ label: 'القسم', value: selectedDeptFilter, onRemove: () => setSelectedDeptFilter('الكل') });
    if (selectedJobTitleFilter !== 'الكل') list.push({ label: 'الوظيفة', value: selectedJobTitleFilter, onRemove: () => setSelectedJobTitleFilter('الكل') });
    if (selectedStatusFilter !== 'الكل') list.push({ label: 'الوضع', value: selectedStatusFilter, onRemove: () => setSelectedStatusFilter('الكل') });
    if (selectedGradeFilter !== 'الكل') list.push({ label: 'الدرجة', value: selectedGradeFilter, onRemove: () => setSelectedGradeFilter('الكل') });
    if (selectedSalarySystemFilter !== 'الكل') list.push({ label: 'المرتبات', value: selectedSalarySystemFilter, onRemove: () => setSelectedSalarySystemFilter('الكل') });
    if (selectedNationalityFilter !== 'الكل') list.push({ label: 'الجنسية', value: selectedNationalityFilter, onRemove: () => setSelectedNationalityFilter('الكل') });
    if (selectedGenderFilter !== 'الكل') list.push({ label: 'الجنس', value: selectedGenderFilter, onRemove: () => setSelectedGenderFilter('الكل') });
    if (selectedHiringEntityFilter !== 'الكل') list.push({ label: 'الجهة', value: selectedHiringEntityFilter, onRemove: () => setSelectedHiringEntityFilter('الكل') });
    if (selectedQualFilter !== 'الكل') list.push({ label: 'المؤهل', value: selectedQualFilter, onRemove: () => setSelectedQualFilter('الكل') });
    if (selectedIncrementFilter !== 'الكل') list.push({ label: 'العلاوة', value: selectedIncrementFilter, onRemove: () => setSelectedIncrementFilter('الكل') });
    if (selectedPromotionEligibilityFilter !== 'الكل') list.push({ label: 'الترقية', value: selectedPromotionEligibilityFilter, onRemove: () => setSelectedPromotionEligibilityFilter('الكل') });
    if (selectedHasPromotionsFilter !== 'الكل') list.push({ label: 'الترقيات السابقة', value: selectedHasPromotionsFilter, onRemove: () => setSelectedHasPromotionsFilter('الكل') });
    if (selectedHasSecondmentsFilter !== 'الكل') list.push({ label: 'الندب', value: selectedHasSecondmentsFilter, onRemove: () => setSelectedHasSecondmentsFilter('الكل') });
    if (selectedHasSettlementsFilter !== 'الكل') list.push({ label: 'التسوية', value: selectedHasSettlementsFilter, onRemove: () => setSelectedHasSettlementsFilter('الكل') });
    if (selectedHasProceduresFilter !== 'الكل') list.push({ label: 'الإجراءات', value: selectedHasProceduresFilter, onRemove: () => setSelectedHasProceduresFilter('الكل') });
    if (selectedLeaveFilter !== 'الكل') list.push({ label: 'الإجازات', value: selectedLeaveFilter, onRemove: () => setSelectedLeaveFilter('الكل') });
    if (selectedDisciplinaryFilter !== 'الكل') list.push({ label: 'الجزاءات', value: selectedDisciplinaryFilter, onRemove: () => setSelectedDisciplinaryFilter('الكل') });
    if (selectedWarningsFilter !== 'الكل') list.push({ label: 'الإنذارات', value: selectedWarningsFilter, onRemove: () => setSelectedWarningsFilter('الكل') });
    if (selectedDeductionsFilter !== 'الكل') list.push({ label: 'الخصومات', value: selectedDeductionsFilter, onRemove: () => setSelectedDeductionsFilter('الكل') });
    if (selectedEvaluationFilter !== 'الكل') list.push({ label: 'التقييم السنوي', value: selectedEvaluationFilter, onRemove: () => setSelectedEvaluationFilter('الكل') });
    if (selectedDocumentFilter !== 'الكل') list.push({ label: 'المستندات', value: selectedDocumentFilter, onRemove: () => setSelectedDocumentFilter('الكل') });
    return list;
  }, [
    selectedDeptFilter,
    selectedJobTitleFilter,
    selectedStatusFilter,
    selectedGradeFilter,
    selectedSalarySystemFilter,
    selectedNationalityFilter,
    selectedGenderFilter,
    selectedHiringEntityFilter,
    selectedQualFilter,
    selectedIncrementFilter,
    selectedPromotionEligibilityFilter,
    selectedHasPromotionsFilter,
    selectedHasSecondmentsFilter,
    selectedHasSettlementsFilter,
    selectedHasProceduresFilter,
    selectedLeaveFilter,
    selectedDisciplinaryFilter,
    selectedWarningsFilter,
    selectedDeductionsFilter,
    selectedEvaluationFilter,
    selectedDocumentFilter
  ]);

  // High-performance Filtered dataset (High-speed multi-criteria matching)
  const filteredEmployees = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const fourYearsAgo = `${currentYear - 4}-12-31`;

    const filtered = employees.filter((emp) => {
      // 1. Top Cadre Category Filter
      if (selectedCategoryFilter === 'خارج_الملاك') {
        if (!isOutsideCadreStatus(emp.status)) return false;
      } else if (selectedCategoryFilter !== 'الكل') {
        if (emp.assignmentCategory !== selectedCategoryFilter || isOutsideCadreStatus(emp.status)) return false;
      }

      const effectiveInfo = employeeGradeInfoMap.get(emp.id);
      const effectiveGrade = effectiveInfo?.displayedCurrentGrade || emp.jobGrade;
      const effectiveIncrement = effectiveInfo?.currentIncrement ?? emp.currentIncrement ?? 0;

      // 2. Administrative Filters
      if (selectedDeptFilter !== 'الكل' && emp.department !== selectedDeptFilter) return false;
      if (selectedJobTitleFilter !== 'الكل' && emp.jobTitle !== selectedJobTitleFilter) return false;
      if (selectedStatusFilter !== 'الكل' && emp.status !== selectedStatusFilter) return false;
      if (selectedQualFilter !== 'الكل' && emp.qualification !== selectedQualFilter) return false;
      if (selectedGradeFilter !== 'الكل' && effectiveGrade !== selectedGradeFilter) return false;
      if (selectedSalarySystemFilter !== 'الكل') {
        const sys = emp.salaryScale || emp.appointmentSalarySystem || '';
        if (!sys.includes(selectedSalarySystemFilter)) return false;
      }
      if (selectedHiringEntityFilter !== 'الكل' && emp.hiringEntity !== selectedHiringEntityFilter) return false;

      // 3. Nationality Filter
      if (selectedNationalityFilter === 'ليبي') {
        if (emp.nationality && emp.nationality !== 'ليبي') return false;
      } else if (selectedNationalityFilter === 'غير ليبي') {
        if (!emp.nationality || emp.nationality === 'ليبي') return false;
      }

      // 3.5. Gender Filter (Derived Authoritatively from National ID: 1=ذكر, 2=أنثى)
      if (selectedGenderFilter !== 'الكل') {
        const empGender = getGenderFromEmployee(emp);
        if (empGender !== selectedGenderFilter) return false;
      }

      // 4. Career & Promotion Filters
      if (selectedIncrementFilter !== 'الكل') {
        const inc = effectiveIncrement;
        if (selectedIncrementFilter === '0' && inc !== 0) return false;
        if (selectedIncrementFilter === '1' && inc !== 1) return false;
        if (selectedIncrementFilter === '2' && inc !== 2) return false;
        if (selectedIncrementFilter === '3' && inc !== 3) return false;
        if (selectedIncrementFilter === '4' && inc !== 4) return false;
        if (selectedIncrementFilter === '5+' && inc < 5) return false;
      }

      if (selectedPromotionEligibilityFilter !== 'الكل') {
        const isEligible = 
          (emp.eligibilityDate && emp.eligibilityDate <= new Date().toISOString().slice(0, 10)) ||
          (emp.gradeEntryDate && emp.gradeEntryDate <= fourYearsAgo);
        
        if (selectedPromotionEligibilityFilter === 'مستحق للترقية' && !isEligible) return false;
        if (selectedPromotionEligibilityFilter === 'غير مستحق' && isEligible) return false;
      }

      if (selectedHasPromotionsFilter !== 'الكل') {
        const has = employeesWithPromotions.has(emp.id);
        if (selectedHasPromotionsFilter === 'نعم' && !has) return false;
        if (selectedHasPromotionsFilter === 'لا' && has) return false;
      }

      if (selectedHasSecondmentsFilter !== 'الكل') {
        const has = employeesWithSecondments.has(emp.id);
        if (selectedHasSecondmentsFilter === 'نعم' && !has) return false;
        if (selectedHasSecondmentsFilter === 'لا' && has) return false;
      }

      if (selectedHasSettlementsFilter !== 'الكل') {
        const has = employeesWithSettlements.has(emp.id);
        if (selectedHasSettlementsFilter === 'نعم' && !has) return false;
        if (selectedHasSettlementsFilter === 'لا' && has) return false;
      }

      if (selectedHasProceduresFilter !== 'الكل') {
        const has = employeesWithProcedures.has(emp.id);
        if (selectedHasProceduresFilter === 'نعم' && !has) return false;
        if (selectedHasProceduresFilter === 'لا' && has) return false;
      }

      // 5. Leave, Disciplinary, Evaluation & Attachment Filters
      if (selectedLeaveFilter !== 'الكل') {
        if (selectedLeaveFilter === 'إجازة نشطة حالياً' && !employeesWithActiveLeaves.has(emp.id)) return false;
        if (selectedLeaveFilter === 'لديه سجل إجازات' && !employeesWithLeaves.has(emp.id)) return false;
        if (selectedLeaveFilter === 'بدون إجازات' && employeesWithLeaves.has(emp.id)) return false;
      }

      if (selectedDisciplinaryFilter !== 'الكل') {
        const has = employeesWithDisciplinary.has(emp.id);
        if (selectedDisciplinaryFilter === 'نعم' && !has) return false;
        if (selectedDisciplinaryFilter === 'لا' && has) return false;
      }

      if (selectedWarningsFilter !== 'الكل') {
        const has = employeesWithWarnings.has(emp.id);
        if (selectedWarningsFilter === 'نعم' && !has) return false;
        if (selectedWarningsFilter === 'لا' && has) return false;
      }

      if (selectedDeductionsFilter !== 'الكل') {
        const has = employeesWithDeductions.has(emp.id);
        if (selectedDeductionsFilter === 'نعم' && !has) return false;
        if (selectedDeductionsFilter === 'لا' && has) return false;
      }

      if (selectedEvaluationFilter !== 'الكل') {
        const has = employeesWithEvaluations.has(emp.id);
        if (selectedEvaluationFilter === 'نعم' && !has) return false;
        if (selectedEvaluationFilter === 'لا' && has) return false;
      }

      if (selectedDocumentFilter !== 'الكل') {
        const hasDoc = !!(emp.pdfPath || emp.pdfFileName);
        if (selectedDocumentFilter === 'نعم' && !hasDoc) return false;
        if (selectedDocumentFilter === 'لا' && hasDoc) return false;
      }

      // 6. Fuzzy General Text Search across all prominent fields
      if (!searchQuery.trim()) return true;
      const q = searchQuery.trim().toLowerCase();
      return (
        emp.fullName.toLowerCase().includes(q) ||
        emp.nationalId.includes(q) ||
        (emp.passportNumber && emp.passportNumber.toLowerCase().includes(q)) ||
        (emp.nationality && emp.nationality.toLowerCase().includes(q)) ||
        emp.jobNumber.toLowerCase().includes(q) ||
        (emp.cadreNumber && emp.cadreNumber.toLowerCase().includes(q)) ||
        (emp.department && emp.department.toLowerCase().includes(q)) ||
        (emp.jobTitle && emp.jobTitle.toLowerCase().includes(q)) ||
        (emp.jobGrade && emp.jobGrade.toLowerCase().includes(q)) ||
        (effectiveGrade && effectiveGrade.toLowerCase().includes(q)) ||
        (emp.hiringEntity && emp.hiringEntity.toLowerCase().includes(q)) ||
        (emp.qualification && emp.qualification.toLowerCase().includes(q)) ||
        (emp.specialization && emp.specialization.toLowerCase().includes(q)) ||
        (emp.phone && emp.phone.includes(q)) ||
        (emp.transferredTo && emp.transferredTo.toLowerCase().includes(q)) ||
        (emp.notes && emp.notes.toLowerCase().includes(q)) ||
        String(emp.id).includes(q)
      );
    });

    return sortEmployeesNumerically(filtered);
  }, [
    employees,
    searchQuery,
    selectedCategoryFilter,
    selectedDeptFilter,
    selectedJobTitleFilter,
    selectedStatusFilter,
    selectedQualFilter,
    selectedGradeFilter,
    selectedSalarySystemFilter,
    selectedNationalityFilter,
    selectedGenderFilter,
    selectedHiringEntityFilter,
    selectedIncrementFilter,
    selectedPromotionEligibilityFilter,
    selectedHasPromotionsFilter,
    selectedHasSecondmentsFilter,
    selectedHasSettlementsFilter,
    selectedHasProceduresFilter,
    selectedLeaveFilter,
    selectedDisciplinaryFilter,
    selectedWarningsFilter,
    selectedDeductionsFilter,
    selectedEvaluationFilter,
    selectedDocumentFilter,
    employeesWithLeaves,
    employeesWithActiveLeaves,
    employeesWithPromotions,
    employeesWithSecondments,
    employeesWithSettlements,
    employeesWithProcedures,
    employeesWithDisciplinary,
    employeesWithWarnings,
    employeesWithDeductions,
    employeesWithEvaluations,
    employeeGradeInfoMap
  ]);

  // Export filtered list to Excel with complete data columns
  const handleExportFilteredExcel = () => {
    const data = filteredEmployees.map((emp, index) => {
      const gradeInfo = employeeGradeInfoMap.get(emp.id);
      return {
        'ت': index + 1,
        'رقم الملف / الوظيفي': emp.jobNumber,
        'اسم الموظف الرباعي': emp.fullName,
        'الرقم الوطني / الجواز': emp.nationalId || emp.passportNumber || '',
        'الجنسية': emp.nationality || 'ليبي',
        'القسم / الإدارة': emp.department || '',
        'المسمى الوظيفي': emp.jobTitle || '',
        'الدرجة الحالية': gradeInfo?.displayedCurrentGrade || emp.jobGrade || '',
        'العلاوة السنوية': gradeInfo?.currentIncrement ?? emp.currentIncrement ?? 0,
        'جدول المرتبات': emp.salaryScale || emp.appointmentSalarySystem || '',
        'نوع الكادر': emp.assignmentCategory || '',
        'الحالة الوظيفية': emp.status || '',
        'المؤهل العلمي': emp.qualification || '',
        'التخصص': emp.specialization || '',
        'جهة التعيين': emp.hiringEntity || '',
        'تاريخ التعيين': emp.hireDate || '',
        'المباشرة بمصرف الدم': emp.bloodBankStartDate || emp.directingDate || '',
        'رقم الهاتف': emp.phone || '',
        'ملاحظات': emp.notes || ''
      };
    });

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'سجل الموظفين المفلتر');
    XLSX.writeFile(wb, `كشف_موظفي_مصرف_الدم_المفلتر_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  // Paginated dataset
  const effectivePageSize = pageSize === 0 ? Math.max(filteredEmployees.length, 1) : pageSize;
  const totalPages = Math.ceil(filteredEmployees.length / effectivePageSize) || 1;
  const paginatedEmployees = useMemo(() => {
    if (pageSize === 0) return filteredEmployees;
    const start = (currentPage - 1) * pageSize;
    return filteredEmployees.slice(start, start + pageSize);
  }, [filteredEmployees, currentPage, pageSize]);

  // Open Form for Create
  const handleOpenCreate = () => {
    const nextId = employees.length > 0 ? Math.max(...employees.map((e) => e.id)) + 1 : 1001;
    const defaultDept = DEPARTMENTS[0];
    const defaultCategory = DEPT_CATEGORIES[defaultDept] || 'إداري';
    const defaultJobs = JOBS_BY_DEPT[defaultDept] || ['موظف إداري'];

    setFormError(null);
    setEditingEmp({
      id: nextId,
      jobNumber: `${nextId}/م`,
      nationality: 'ليبي',
      documentType: 'الرقم الوطني',
      nationalId: '',
      passportNumber: '',
      fullName: '',
      motherName: '',
      birthDate: '1992-01-01',
      birthPlace: 'المرج',
      gender: 'ذكر',
      maritalStatus: 'متزوج',
      status: 'على رأس العمل',
      hireDate: '2020-01-01',
      directingDate: '2020-02-01',
      bloodBankStartDate: '2020-02-01',
      appointmentSalarySystem: 'جدول مرتبات القانون 15',
      appointmentGrade: 'الدرجة السادسة',
      appointmentIncrements: 0,
      needsAppointmentSystemReview: false,
      salaryScale: 'جدول المرتبات الموحد',
      jobGrade: 'الدرجة السابعة',
      currentIncrement: 1,
      gradeEntryDate: '',
      transactionType: 'تعيين جديد',
      eligibilityDate: '2026-01-01',
      qualification: 'بكالوريوس',
      specialization: '',
      university: '',
      graduationYear: '',
      educationType: 'جامعة عامة',
      cadreNumber: `MLK-${nextId}`,
      hiringEntity: HIRING_ENTITIES[0] || 'وزارة الصحة - ليبيا',
      assignmentCategory: defaultCategory,
      department: defaultDept,
      jobTitle: defaultJobs[0] || 'أخصائي مختبرات',
      phone: '0910000000',
      email: '',
      pdfPath: '',
      pdfFileName: '',
      notes: ''
    });
    setIntermediateGrades([]);
    setDeletedIntermediateIds([]);
    setIsFormOpen(true);
  };

  // Helper to add an intermediate career step
  const handleAddIntermediateStep = () => {
    const prevStepGrade = intermediateGrades.length > 0 
      ? intermediateGrades[intermediateGrades.length - 1].grade 
      : (editingEmp?.appointmentGrade || '');
    
    let suggestedGrade = '';
    const prevNum = parseGradeNumber(prevStepGrade);
    if (prevNum && prevNum > 1) {
      const nextNum = prevNum - 1;
      if (nextNum >= 1 && nextNum <= 15) {
        suggestedGrade = JOB_GRADES[nextNum - 1] || '';
      }
    }
    if (!suggestedGrade && JOB_GRADES.length > 0) {
      suggestedGrade = JOB_GRADES[0];
    }

    const newStep: IntermediateCareerStep = {
      id: `temp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      grade: suggestedGrade,
      movementType: 'ترقية',
      previousGrade: prevStepGrade,
      decisionNumber: '',
      decisionDate: '',
      effectiveDate: editingEmp?.hireDate || '',
      entitlementDate: '',
      issuingAuthority: 'مصرف الدم المركزي المرج',
      notes: ''
    };

    setIntermediateGrades((prev) => [...prev, newStep]);
  };

  const handleRemoveIntermediateStep = (indexToRemove: number) => {
    setIntermediateGrades((prev) => {
      const target = prev[indexToRemove];
      if (target && target.id && !target.id.startsWith('temp-')) {
        setDeletedIntermediateIds((d) => [...d, target.id]);
      }
      return prev.filter((_, idx) => idx !== indexToRemove);
    });
  };

  const handleUpdateIntermediateStep = (index: number, updates: Partial<IntermediateCareerStep>) => {
    setIntermediateGrades((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], ...updates };
      return next;
    });
  };

  // Real-time career sequence warnings for non-sequential jumps or demotions
  const sequenceWarnings = useMemo(() => {
    if (!editingEmp) return [];
    const steps: { name: string; grade: string; type?: string }[] = [];
    if (editingEmp.appointmentGrade) {
      steps.push({ name: 'درجة التعيين', grade: editingEmp.appointmentGrade });
    }
    intermediateGrades.forEach((g, idx) => {
      steps.push({ name: `الدرجة البينية (${idx + 1})`, grade: g.grade, type: g.movementType });
    });
    if (editingEmp.jobGrade) {
      steps.push({ name: 'الدرجة الحالية', grade: editingEmp.jobGrade });
    }

    const warnings: string[] = [];
    for (let i = 0; i < steps.length - 1; i++) {
      const from = steps[i];
      const to = steps[i + 1];
      const numA = parseGradeNumber(from.grade);
      const numB = parseGradeNumber(to.grade);

      if (numA > 0 && numB > 0) {
        if (numA - numB > 1) {
          warnings.push(`تنبيه تسلسل: قفزة غير اعتيادية من ${from.name} (${from.grade}) إلى ${to.name} (${to.grade}) بمقدار ${numA - numB} درجات.`);
        } else if (numA < numB) {
          warnings.push(`تنبيه تسلسل: انخفاض غير اعتيادي في الدرجة من ${from.name} (${from.grade}) إلى ${to.name} (${to.grade}).`);
        }
      }
    }
    return warnings;
  }, [editingEmp?.appointmentGrade, editingEmp?.jobGrade, intermediateGrades]);

  // Normalize grade to valid options
  const normalizeGradeToOption = (rawGrade?: string): string => {
    if (!rawGrade) return '';
    if (JOB_GRADES.includes(rawGrade)) return rawGrade;
    const gradeNum = parseGradeNumber(rawGrade);
    if (gradeNum >= 1 && gradeNum <= 15 && JOB_GRADES[gradeNum - 1]) {
      return JOB_GRADES[gradeNum - 1];
    }
    return '';
  };

  // Open Form for Edit
  const handleOpenEdit = (emp: Employee) => {
    setFormError(null);
    const matchedGrade = normalizeGradeToOption(emp.jobGrade);
    const nat = emp.nationality || (emp.nationalId && /^[0-9]{12}$/.test(emp.nationalId.trim()) ? 'ليبي' : 'ليبي');
    const doc = emp.documentType || (nat === 'ليبي' ? 'الرقم الوطني' : 'رقم جواز السفر');
    const inferredSys = emp.appointmentSalarySystem || (emp.appointmentGrade ? inferSalarySystemFromGrade(emp.appointmentGrade) : 'جدول مرتبات القانون 15');
    const cleanNatId = normalizeNationalId(emp.nationalId);
    let resolvedGender: Gender = emp.gender || 'ذكر';
    if (cleanNatId.startsWith('1')) resolvedGender = 'ذكر';
    else if (cleanNatId.startsWith('2')) resolvedGender = 'أنثى';

    setEditingEmp({
      ...emp,
      nationality: nat,
      documentType: doc,
      nationalId: cleanNatId || emp.nationalId || '',
      passportNumber: emp.passportNumber || '',
      gender: resolvedGender,
      jobGrade: matchedGrade || emp.jobGrade || '',
      appointmentSalarySystem: emp.appointmentSalarySystem || inferredSys || 'جدول مرتبات القانون 15',
      appointmentGrade: emp.appointmentGrade || 'الدرجة السادسة',
      appointmentIncrements: emp.appointmentIncrements ?? 0
    });

    const empCareer = (careerRecords || []).filter((c) => c.employeeId === emp.id);
    const existingSteps: IntermediateCareerStep[] = empCareer
      .filter((c) => c.newGrade && c.newGrade !== emp.appointmentGrade && c.newGrade !== emp.jobGrade)
      .map((c) => ({
        id: c.id,
        grade: c.newGrade || '',
        movementType: (c.actionType as CareerActionType) || 'ترقية',
        previousGrade: c.previousGrade || '',
        decisionNumber: c.decisionNumber || '',
        decisionDate: c.decisionDate || '',
        effectiveDate: c.actionDate || c.effectiveDate || '',
        entitlementDate: c.entitlementDate || '',
        issuingAuthority: c.issuingAuthority || '',
        notes: c.notes || ''
      }));
    setIntermediateGrades(existingSteps);
    setDeletedIntermediateIds([]);
    setIsFormOpen(true);
  };

  // Save Employee Form with strict validation
  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEmp) return;
    setFormError(null);

    const trimmedFullName = editingEmp.fullName.trim();
    const trimmedJobNumber = editingEmp.jobNumber.trim();
    const trimmedNationality = (editingEmp.nationality || '').trim();
    const isLibyan = trimmedNationality === 'ليبي';
    const trimmedNationalId = (editingEmp.nationalId || '').trim();
    const trimmedPassport = (editingEmp.passportNumber || '').trim();

    if (!trimmedFullName) {
      setFormError('يرجى إدخال اسم الموظف الرباعي كاملاً.');
      return;
    }

    if (isInvalidPlaceholderName(trimmedFullName)) {
      setFormError('اسم الموظف المدخل غير صالح (اسم نائب وهمي). يرجى إدخال الاسم الرباعي الحقيقي للموظف.');
      return;
    }

    if (!trimmedNationality) {
      setFormError('يرجى تحديد أو إدخال جنسية الموظف.');
      return;
    }

    if (isLibyan) {
      if (!trimmedNationalId) {
        setFormError('يرجى إدخال الرقم الوطني للموظف الليبي.');
        return;
      }
      if (!/^[0-9]{12}$/.test(trimmedNationalId)) {
        setFormError('الرقم الوطني للمواطن الليبي يجب أن يتكون من 12 رقماً تماماً.');
        return;
      }
      if (isFakeSequentialNationalId(trimmedNationalId)) {
        setFormError('الرقم الوطني المدخل مولد بنمط تسلسلي وهمي غير معتمد.');
        return;
      }
      const duplicateNationalId = employees.some(
        (e) => e.id !== editingEmp.id && (e.nationality === 'ليبي' || !e.nationality) && e.nationalId.trim() === trimmedNationalId
      );
      if (duplicateNationalId) {
        setFormError(`الرقم الوطني (${trimmedNationalId}) مسجل مسبقاً لموظف آخر.`);
        return;
      }
    } else {
      if (!trimmedPassport && !trimmedNationalId) {
        setFormError('يرجى إدخال رقم جواز السفر أو وثيقة الإقامة الرسمية للموظف غير الليبي.');
        return;
      }
    }

    if (!trimmedJobNumber) {
      setFormError('يرجى إدخال الرقم الوظيفي / رقم الملف.');
      return;
    }

    const duplicateJobNumber = employees.some(
      (e) => e.id !== editingEmp.id && e.jobNumber.trim() === trimmedJobNumber
    );
    if (duplicateJobNumber) {
      setFormError(`الرقم الوظيفي / رقم الملف (${trimmedJobNumber}) مسجل مسبقاً لموظف آخر.`);
      return;
    }

    const cleanNatId = normalizeNationalId(trimmedNationalId);
    let resolvedGender: Gender = editingEmp.gender || 'ذكر';
    if (cleanNatId.startsWith('1')) resolvedGender = 'ذكر';
    else if (cleanNatId.startsWith('2')) resolvedGender = 'أنثى';

    const payload: Employee = {
      ...editingEmp,
      fullName: trimmedFullName,
      jobNumber: trimmedJobNumber,
      nationality: trimmedNationality,
      documentType: isLibyan ? 'الرقم الوطني' : 'رقم جواز السفر',
      nationalId: isLibyan ? cleanNatId : '',
      passportNumber: !isLibyan ? (trimmedPassport || cleanNatId) : (editingEmp.passportNumber || ''),
      gender: resolvedGender
    };

    const exists = employees.some((e) => e.id === payload.id);
    if (exists) {
      onUpdateEmployee(payload);
    } else {
      onAddEmployee(payload);
    }

    // Save Intermediate Career Steps as CareerPromotionRecords
    if (intermediateGrades.length > 0) {
      const existingCareerIds = new Set((careerRecords || []).map((c) => c.id));
      const newRecordsToSave: CareerPromotionRecord[] = [];

      intermediateGrades.forEach((step, idx) => {
        const prevGradeForStep = idx === 0 
          ? (payload.appointmentGrade || '') 
          : intermediateGrades[idx - 1].grade;

        const recordId = step.id && !step.id.startsWith('temp-') 
          ? step.id 
          : `career-step-${payload.id}-${Date.now()}-${idx}`;

        const record: CareerPromotionRecord = {
          id: recordId,
          employeeId: payload.id,
          fileNumber: payload.jobNumber || '',
          employeeName: payload.fullName || '',
          nationalId: payload.nationalId || '',
          actionType: step.movementType || 'ترقية',
          movementType: step.movementType || 'ترقية',
          previousGrade: step.previousGrade || prevGradeForStep,
          previousIncrement: 0,
          newGrade: step.grade,
          newIncrement: 1,
          actionDate: step.effectiveDate || payload.hireDate || new Date().toISOString().slice(0, 10),
          decisionDate: step.decisionDate || step.effectiveDate || payload.hireDate || '',
          decisionNumber: step.decisionNumber || `قرار ترقية رقم (${idx + 1})`,
          issuingAuthority: step.issuingAuthority || 'مصرف الدم المركزي المرج',
          notes: step.notes || `تدرج وظيفي بيني (${step.grade})`,
          createdBy: currentUser || 'المستخدم',
          createdAt: new Date().toISOString()
        };

        if (existingCareerIds.has(step.id)) {
          if (onUpdateCareerRecord) {
            onUpdateCareerRecord(record);
          }
        } else {
          newRecordsToSave.push(record);
        }
      });

      if (newRecordsToSave.length > 0) {
        if (onAddCareerRecords) {
          onAddCareerRecords(newRecordsToSave);
        } else if (onAddCareerRecord) {
          newRecordsToSave.forEach((r) => onAddCareerRecord(r));
        }
      }
    }

    // Process deleted intermediate records if any
    if (deletedIntermediateIds.length > 0 && onDeleteCareerRecord) {
      deletedIntermediateIds.forEach((delId) => {
        onDeleteCareerRecord(delId);
      });
    }

    setIsFormOpen(false);
    setFormError(null);
    setIntermediateGrades([]);
    setDeletedIntermediateIds([]);
    setExpandedEmpId(payload.id);
  };

  // Handle Department Change in Form
  const handleFormDeptChange = (dept: string) => {
    if (!editingEmp) return;
    const category = DEPT_CATEGORIES[dept] || 'إداري';
    const jobs = JOBS_BY_DEPT[dept] || ['موظف عام'];
    setEditingEmp({
      ...editingEmp,
      department: dept,
      assignmentCategory: category,
      jobTitle: jobs[0] || 'موظف عام'
    });
  };

  // Render Dedicated Employee Profile View
  if (selectedProfileEmp) {
    const currentProfileEmp = employees.find((e) => e.id === selectedProfileEmp.id) || selectedProfileEmp;
    return (
      <EmployeeProfileView
        employee={currentProfileEmp}
        leaves={leaves}
        increments={increments}
        promotions={promotions}
        settlements={settlements}
        generalProcedures={generalProcedures}
        careerRecords={careerRecords}
        qualifications={qualifications}
        evaluations={evaluations}
        transfers={transfers}
        secondments={secondments}
        disciplinary={disciplinary}
        resignations={resignations}
        onBackToList={() => setSelectedProfileEmp(null)}
        onUpdateEmployee={(updated) => {
          onUpdateEmployee(updated);
          setSelectedProfileEmp(updated);
        }}
        onDeleteEmployee={(id) => {
          onDeleteEmployee(id);
          setSelectedProfileEmp(null);
        }}
        onOpenLeaveModal={(id) => setLeaveModalEmpId(id)}
        onOpenIncrementDetails={(empObj) => setIncrementDetailEmp(empObj)}
        onAddQualification={onAddQualification}
        onUpdateQualification={onUpdateQualification}
        onDeleteQualification={onDeleteQualification}
        onSaveEvaluation={onSaveEvaluation}
        onDeleteEvaluation={onDeleteEvaluation}
        employees={employees}
        onAddCareerRecord={onAddCareerRecord}
        onUpdateCareerRecord={onUpdateCareerRecord}
        onDeleteCareerRecord={onDeleteCareerRecord}
        currentUser={currentUser}
        generalManagerName={generalManagerName}
        officialLogoUrl={officialLogoUrl}
      />
    );
  }

  return (
    <div className="w-full max-w-full overflow-hidden box-border space-y-3 text-right" dir="rtl">
      
      {/* 1. TOP HEADER & MAIN ACTION TOOLBAR */}
      <div className="w-full bg-white p-3.5 sm:p-4 rounded-xl border border-gray-200 shadow-2xs flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg sm:text-xl font-black text-gray-900">إدارة الموظفين والملفات</h1>
            <span className="bg-red-100 text-red-800 text-xs px-2.5 py-0.5 rounded-full font-bold border border-red-200">
              {employees.length} موظف
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            سجل الموظفين والملفات وبيانات الملاك الوظيفي وإدارتها
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <button
            type="button"
            onClick={handleOpenCreate}
            className="flex items-center gap-1.5 bg-red-700 hover:bg-red-800 text-white px-3.5 py-2 rounded-lg font-bold shadow-2xs transition-colors text-xs cursor-pointer"
          >
            <UserPlus className="w-4 h-4 shrink-0" />
            <span>إضافة موظف جديد</span>
          </button>

          <button
            type="button"
            onClick={() => setIsImportModalOpen(true)}
            className="flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white px-3 py-2 rounded-lg font-bold shadow-2xs transition-colors text-xs cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 shrink-0" />
            <span>استيراد إكسل</span>
          </button>

          <button
            type="button"
            onClick={() => setIsListPrintModalOpen(true)}
            className="flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-300 px-3 py-2 rounded-lg font-bold transition-colors text-xs cursor-pointer"
            title="طباعة كشف الموظفين الرسمي"
          >
            <Printer className="w-4 h-4 text-gray-600 shrink-0" />
            <span>طباعة التقرير</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (filteredEmployees.length > 0) {
                setReviewEmp(filteredEmployees[0]);
              }
            }}
            className="flex items-center gap-1.5 bg-blue-700 hover:bg-blue-800 text-white px-3 py-2 rounded-lg font-bold shadow-2xs transition-colors text-xs cursor-pointer"
            title="مراجعة وتدقيق بيانات الموظف والسيرة الوظيفية"
          >
            <ClipboardCheck className="w-4 h-4 shrink-0" />
            <span>مراجعة بيانات الموظف</span>
          </button>

          <button
            type="button"
            onClick={() => setIsCleanupModalOpen(true)}
            className="flex items-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white px-3 py-2 rounded-lg font-bold shadow-2xs transition-colors text-xs cursor-pointer"
            title="تنظيف السجلات التجريبية وضبط الملاك المعتمد (142 موظف)"
          >
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>تنظيف السجلات التجريبية</span>
          </button>

          <button
            type="button"
            onClick={() => setIsRebuildGradesModalOpen(true)}
            className="flex items-center gap-1.5 bg-teal-700 hover:bg-teal-800 text-white px-3 py-2 rounded-lg font-bold shadow-2xs transition-colors text-xs cursor-pointer"
            title="تدقيق وإعادة بناء وتحديث الدرجات الحالية وانتقال اللائحة 418"
          >
            <Layers className="w-4 h-4 text-teal-300 shrink-0" />
            <span>تدقيق الدرجات وانتقال 418</span>
          </button>

          <button
            type="button"
            onClick={() => setIsAuditModalOpen(true)}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-900 text-white px-3 py-2 rounded-lg font-bold shadow-2xs transition-colors text-xs cursor-pointer"
            title="التدقيق النهائي الشامل لسلامة قاعدة البيانات"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>تدقيق نهائي للقاعدة</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setAuditInspectEmpId(null);
              setIsGradeAuditModalOpen(true);
            }}
            className="flex items-center gap-1.5 bg-indigo-700 hover:bg-indigo-800 text-white px-3 py-2 rounded-lg font-bold shadow-2xs transition-colors text-xs cursor-pointer"
            title="فحص وتدقيق التتبع الزمني للدرجات (أحدث درجة نافذة)"
          >
            <Zap className="w-4 h-4 text-amber-300 shrink-0" />
            <span>فحص الدرجات الزمنية</span>
            {gradeChronologyStats.changedCount > 0 && (
              <span className="bg-amber-400 text-slate-900 text-[10px] px-1.5 py-0.2 rounded-full font-black">
                {gradeChronologyStats.changedCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* CHRONOLOGICAL GRADE INTEGRITY BANNER */}
      <div className="w-full bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-900 text-white px-3.5 py-2.5 rounded-xl border border-indigo-700/50 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 text-xs">
        <div className="flex items-center gap-2">
          <span className="flex h-2.5 w-2.5 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400"></span>
          </span>
          <span className="font-bold text-indigo-100">
            النظام يعتمد الدرجة النافذة الأحدث زمنيًا وفق مسيرة الموظف وتدرجه
          </span>
          <span className="text-indigo-300 text-[11px] hidden md:inline">
            (يتم استبعاد درجة التعيين الأولى والدرجات الملغاة تلقائياً فور نفاذ ترقية أو تسوية لاحقة)
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => {
              setAuditInspectEmpId(null);
              setIsGradeAuditModalOpen(true);
            }}
            className="flex items-center gap-1 bg-amber-400 hover:bg-amber-300 text-slate-950 px-2.5 py-1 rounded-lg font-black text-[11px] transition-colors cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>فتح مدقق الدرجات والتحقق</span>
          </button>
        </div>
      </div>

      {/* 2. SEARCH FIRST & COLLAPSIBLE FILTERS CARD */}
      <div className="w-full bg-white p-3 sm:p-3.5 rounded-xl border border-gray-200 shadow-2xs space-y-2.5">
        
        {/* Main Search Row */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          {/* Prominent Search Bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute right-3.5 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="🔎 ابحث باسم الموظف أو رقم الملف أو الرقم الوطني أو التخصص أو الهاتف..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className="w-full pr-10 pl-9 py-2 bg-gray-50/80 hover:bg-white focus:bg-white border border-gray-300 rounded-lg text-xs sm:text-sm font-medium focus:ring-2 focus:ring-red-600 outline-none transition-all placeholder:text-gray-400 text-gray-900"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => { setSearchQuery(''); setCurrentPage(1); }}
                className="absolute left-3 top-2.5 text-gray-400 hover:text-gray-600 p-0.5"
                title="مسح البحث"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Search Button & Advanced Filters Controls */}
          <div className="flex flex-wrap items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => setIsAdvancedFilterOpen(!isAdvancedFilterOpen)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold border transition cursor-pointer ${
                isAdvancedFilterOpen || activeFiltersCount > 0
                  ? 'bg-red-50 text-red-950 border-red-300 shadow-2xs'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-300'
              }`}
              title="فتح / إغلاق لوحة الفلاتر المتقدمة"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-red-700" />
              <span>{isAdvancedFilterOpen ? 'إخفاء الفلاتر' : '🔎 فلترة الموظفين'}</span>
              {activeFiltersCount > 0 && (
                <span className="bg-red-700 text-white rounded-full px-1.5 py-0.2 text-[10px] font-bold">
                  {activeFiltersCount}
                </span>
              )}
              {isAdvancedFilterOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {/* Quick Export & Print Actions for Filtered Results */}
            <button
              type="button"
              onClick={() => setIsFilteredReportModalOpen(true)}
              className="flex items-center gap-1 bg-slate-800 hover:bg-slate-900 text-white px-2.5 py-2 rounded-lg font-bold text-xs shadow-2xs transition cursor-pointer"
              title="طباعة تقرير بكافة الموظفين المطابقين لمعايير الفلترة الحالية"
            >
              <Printer className="w-3.5 h-3.5 text-red-400" />
              <span className="hidden sm:inline">طباعة النتائج ({filteredEmployees.length})</span>
              <span className="sm:hidden">طباعة</span>
            </button>

            <button
              type="button"
              onClick={handleExportFilteredExcel}
              className="flex items-center gap-1 bg-emerald-700 hover:bg-emerald-800 text-white px-2.5 py-2 rounded-lg font-bold text-xs shadow-2xs transition cursor-pointer"
              title="تصدير النتائج المفلترة إلى ملف إكسل XLSX"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span className="hidden md:inline">تصدير Excel</span>
            </button>

            {activeFiltersCount > 0 && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="flex items-center gap-1 px-2.5 py-2 bg-red-100/70 hover:bg-red-200 text-red-800 rounded-lg text-xs font-bold transition cursor-pointer"
                title="إلغاء ومسح جميع الفلاتر"
              >
                <RefreshCw className="w-3 h-3 text-red-700" />
                <span>مسح ({activeFiltersCount})</span>
              </button>
            )}
          </div>
        </div>

        {/* Active Filter Tags / Chips */}
        {activeFilterSummary.length > 0 && (
          <div className="pt-2 flex flex-wrap items-center gap-1.5 text-[11px] border-t border-gray-100">
            <span className="text-gray-500 font-bold flex items-center gap-1">
              <Filter className="w-3 h-3 text-red-700" />
              <span>الفلاتر النشطة:</span>
            </span>
            {activeFilterSummary.map((item, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-50 text-red-900 border border-red-200 rounded-md font-medium animate-fadeIn"
              >
                <span className="text-gray-600 font-semibold">{item.label}:</span>
                <span className="font-bold">{item.value}</span>
                <button
                  type="button"
                  onClick={item.onRemove}
                  className="hover:bg-red-200/80 rounded p-0.5 text-red-700 cursor-pointer"
                  title={`إزالة فلتر ${item.label}`}
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            <button
              type="button"
              onClick={handleResetFilters}
              className="text-red-700 hover:text-red-900 hover:underline font-bold text-[10px] mr-1 cursor-pointer"
            >
              مسح الكل
            </button>
          </div>
        )}

        {/* Collapsible Comprehensive Advanced Filter Dashboard */}
        {isAdvancedFilterOpen && (
          <div className="pt-3 border-t border-gray-200 space-y-3 bg-slate-50/70 p-3 sm:p-4 rounded-xl animate-fadeIn">
            
            {/* Filter Section Header */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200 pb-2">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-red-800" />
                <span className="font-black text-xs text-slate-900">
                  لوحة التصفية والفلترة المتقدمة لبيانات ومسار الموظفين
                </span>
                <span className="text-[11px] text-slate-500 font-medium">
                  (محرك فلترة فوري يدعم كافة السجلات والمسارات)
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-slate-700 bg-white px-2 py-1 rounded border border-slate-200">
                  مطابق: <strong className="text-red-700">{filteredEmployees.length}</strong> من إجمالي {employees.length}
                </span>
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded text-[11px] font-bold transition flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3 text-slate-500" />
                  <span>إعادة ضبط الكل</span>
                </button>
              </div>
            </div>

            {/* 3 Structured Columns / Sections */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
              
              {/* SECTION 1: Administrative & Organizational Filters */}
              <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-black text-slate-900 border-b border-slate-100 pb-1.5">
                  <span className="w-2 h-2 rounded-full bg-red-700"></span>
                  <span>1. الفلاتر الإدارية والوظيفية</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {/* Department */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-0.5">الإدارة / القسم</label>
                    <select
                      value={selectedDeptFilter}
                      onChange={(e) => { setSelectedDeptFilter(e.target.value); setCurrentPage(1); }}
                      className="w-full py-1.5 px-2 bg-slate-50 border border-slate-200 rounded text-xs font-medium focus:ring-1 focus:ring-red-600 outline-none truncate"
                    >
                      <option value="الكل">جميع الأقسام ({uniqueDepartments.length})</option>
                      {uniqueDepartments.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>

                  {/* Job Title */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-0.5">المسمى الوظيفي</label>
                    <select
                      value={selectedJobTitleFilter}
                      onChange={(e) => { setSelectedJobTitleFilter(e.target.value); setCurrentPage(1); }}
                      className="w-full py-1.5 px-2 bg-slate-50 border border-slate-200 rounded text-xs font-medium focus:ring-1 focus:ring-red-600 outline-none truncate"
                    >
                      <option value="الكل">جميع المسميات ({uniqueJobTitles.length})</option>
                      {uniqueJobTitles.map((j) => (
                        <option key={j} value={j}>{j}</option>
                      ))}
                    </select>
                  </div>

                  {/* Status */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-0.5">الحالة الوظيفية</label>
                    <select
                      value={selectedStatusFilter}
                      onChange={(e) => { setSelectedStatusFilter(e.target.value); setCurrentPage(1); }}
                      className="w-full py-1.5 px-2 bg-slate-50 border border-slate-200 rounded text-xs font-medium focus:ring-1 focus:ring-red-600 outline-none truncate"
                    >
                      <option value="الكل">جميع الحالات الوظيفية</option>
                      <option value="على رأس العمل">على رأس العمل</option>
                      <option value="إجازة">إجازة</option>
                      <option value="منتدب">منتدب</option>
                      <option value="منقول خارجياً">منقول خارجياً (خارج الملاك)</option>
                      <option value="مستقيل">مستقيل (خارج الملاك)</option>
                      <option value="منهي خدماته">منهي خدماته (خارج الملاك)</option>
                      <option value="متقاعد">متقاعد (خارج الملاك)</option>
                      <option value="متوفى">متوفى</option>
                    </select>
                  </div>

                  {/* Grade */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-0.5">الدرجة الحالية</label>
                    <select
                      value={selectedGradeFilter}
                      onChange={(e) => { setSelectedGradeFilter(e.target.value); setCurrentPage(1); }}
                      className="w-full py-1.5 px-2 bg-slate-50 border border-slate-200 rounded text-xs font-medium focus:ring-1 focus:ring-red-600 outline-none truncate"
                    >
                      <option value="الكل">جميع الدرجات</option>
                      {uniqueGrades.map((g) => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </select>
                  </div>

                  {/* Salary System */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-0.5">جدول المرتبات</label>
                    <select
                      value={selectedSalarySystemFilter}
                      onChange={(e) => { setSelectedSalarySystemFilter(e.target.value); setCurrentPage(1); }}
                      className="w-full py-1.5 px-2 bg-slate-50 border border-slate-200 rounded text-xs font-medium focus:ring-1 focus:ring-red-600 outline-none truncate"
                    >
                      <option value="الكل">جميع الجداول واللوائح</option>
                      <option value="الموحد">جدول المرتبات الموحد</option>
                      <option value="القانون 15">جدول مرتبات القانون 15</option>
                      <option value="418">اللائحة 418 الطبية</option>
                    </select>
                  </div>

                  {/* Nationality */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-0.5">الجنسية</label>
                    <select
                      value={selectedNationalityFilter}
                      onChange={(e) => { setSelectedNationalityFilter(e.target.value as any); setCurrentPage(1); }}
                      className="w-full py-1.5 px-2 bg-slate-50 border border-slate-200 rounded text-xs font-semibold focus:ring-1 focus:ring-red-600 outline-none truncate"
                    >
                      <option value="الكل">الكل (ليبي ووافد)</option>
                      <option value="ليبي">المواطنون (ليبي)</option>
                      <option value="غير ليبي">الوافدون وغير الليبيين</option>
                    </select>
                  </div>

                  {/* Gender Filter */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-0.5">الجنس</label>
                    <select
                      value={selectedGenderFilter}
                      onChange={(e) => { setSelectedGenderFilter(e.target.value as any); setCurrentPage(1); }}
                      className="w-full py-1.5 px-2 bg-slate-50 border border-slate-200 rounded text-xs font-semibold focus:ring-1 focus:ring-red-600 outline-none truncate"
                    >
                      <option value="الكل">الكل (الجميع)</option>
                      <option value="ذكر">ذكر</option>
                      <option value="أنثى">أنثى</option>
                    </select>
                  </div>

                  {/* Hiring Entity */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-0.5">جهة التعيين</label>
                    <select
                      value={selectedHiringEntityFilter}
                      onChange={(e) => { setSelectedHiringEntityFilter(e.target.value); setCurrentPage(1); }}
                      className="w-full py-1.5 px-2 bg-slate-50 border border-slate-200 rounded text-xs font-medium focus:ring-1 focus:ring-red-600 outline-none truncate"
                    >
                      <option value="الكل">جميع جهات التعيين</option>
                      {uniqueHiringEntities.map((h) => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>

                  {/* Qualification */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-0.5">المؤهل العلمي</label>
                    <select
                      value={selectedQualFilter}
                      onChange={(e) => { setSelectedQualFilter(e.target.value); setCurrentPage(1); }}
                      className="w-full py-1.5 px-2 bg-slate-50 border border-slate-200 rounded text-xs font-medium focus:ring-1 focus:ring-red-600 outline-none truncate"
                    >
                      <option value="الكل">جميع المؤهلات</option>
                      {uniqueQualifications.map((q) => (
                        <option key={q} value={q}>{q}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* SECTION 2: Career, Promotion & Seniority Filters */}
              <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-black text-slate-900 border-b border-slate-100 pb-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-700"></span>
                  <span>2. فلاتر المسار الوظيفي والترقيات</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {/* Increments */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-0.5">عدد العلاوات الحالية</label>
                    <select
                      value={selectedIncrementFilter}
                      onChange={(e) => { setSelectedIncrementFilter(e.target.value); setCurrentPage(1); }}
                      className="w-full py-1.5 px-2 bg-slate-50 border border-slate-200 rounded text-xs font-medium focus:ring-1 focus:ring-red-600 outline-none"
                    >
                      <option value="الكل">جميع العلاوات</option>
                      <option value="0">بدون علاوة (0)</option>
                      <option value="1">علاوة واحدة (+1)</option>
                      <option value="2">علاوتان (+2)</option>
                      <option value="3">3 علاوات (+3)</option>
                      <option value="4">4 علاوات (+4)</option>
                      <option value="5+">5 علاوات أو أكثر</option>
                    </select>
                  </div>

                  {/* Promotion Eligibility */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-0.5">استحقاق الترقية</label>
                    <select
                      value={selectedPromotionEligibilityFilter}
                      onChange={(e) => { setSelectedPromotionEligibilityFilter(e.target.value); setCurrentPage(1); }}
                      className="w-full py-1.5 px-2 bg-slate-50 border border-slate-200 rounded text-xs font-bold focus:ring-1 focus:ring-red-600 outline-none text-slate-900 truncate"
                    >
                      <option value="الكل">الكل (مستحق وغير مستحق)</option>
                      <option value="مستحق للترقية">مستحق للترقية (4+ سنوات)</option>
                      <option value="غير مستحق">غير مستحق حالياً</option>
                    </select>
                  </div>

                  {/* Promotions Record */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-0.5">سجل ترقيات سابقة</label>
                    <select
                      value={selectedHasPromotionsFilter}
                      onChange={(e) => { setSelectedHasPromotionsFilter(e.target.value); setCurrentPage(1); }}
                      className="w-full py-1.5 px-2 bg-slate-50 border border-slate-200 rounded text-xs font-medium focus:ring-1 focus:ring-red-600 outline-none"
                    >
                      <option value="الكل">الكل</option>
                      <option value="نعم">لديه ترقيات مسجلة</option>
                      <option value="لا">ليس لديه ترقيات</option>
                    </select>
                  </div>

                  {/* Secondments Record */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-0.5">الندب والتكليف</label>
                    <select
                      value={selectedHasSecondmentsFilter}
                      onChange={(e) => { setSelectedHasSecondmentsFilter(e.target.value); setCurrentPage(1); }}
                      className="w-full py-1.5 px-2 bg-slate-50 border border-slate-200 rounded text-xs font-medium focus:ring-1 focus:ring-red-600 outline-none"
                    >
                      <option value="الكل">الكل</option>
                      <option value="نعم">لديه ندب / تكليف</option>
                      <option value="لا">ليس لديه</option>
                    </select>
                  </div>

                  {/* Settlements */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-0.5">تسوية الوضع</label>
                    <select
                      value={selectedHasSettlementsFilter}
                      onChange={(e) => { setSelectedHasSettlementsFilter(e.target.value); setCurrentPage(1); }}
                      className="w-full py-1.5 px-2 bg-slate-50 border border-slate-200 rounded text-xs font-medium focus:ring-1 focus:ring-red-600 outline-none"
                    >
                      <option value="الكل">الكل</option>
                      <option value="نعم">لديه تسوية وضع</option>
                      <option value="لا">ليس لديه</option>
                    </select>
                  </div>

                  {/* General Procedures */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-0.5">حركات وإجراءات وظيفية</label>
                    <select
                      value={selectedHasProceduresFilter}
                      onChange={(e) => { setSelectedHasProceduresFilter(e.target.value); setCurrentPage(1); }}
                      className="w-full py-1.5 px-2 bg-slate-50 border border-slate-200 rounded text-xs font-medium focus:ring-1 focus:ring-red-600 outline-none"
                    >
                      <option value="الكل">الكل</option>
                      <option value="نعم">لديه إجراءات عامة</option>
                      <option value="لا">ليس لديه</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* SECTION 3: Leaves, Disciplinary, Evaluation & Files */}
              <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-black text-slate-900 border-b border-slate-100 pb-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-600"></span>
                  <span>3. الإجازات، الانضباط، والتقييم السنوي</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {/* Leaves */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-0.5">حالة الإجازات</label>
                    <select
                      value={selectedLeaveFilter}
                      onChange={(e) => { setSelectedLeaveFilter(e.target.value); setCurrentPage(1); }}
                      className="w-full py-1.5 px-2 bg-slate-50 border border-slate-200 rounded text-xs font-medium focus:ring-1 focus:ring-red-600 outline-none truncate"
                    >
                      <option value="الكل">الكل</option>
                      <option value="إجازة نشطة حالياً">إجازة نشطة حالياً</option>
                      <option value="لديه سجل إجازات">لديه سجل إجازات</option>
                      <option value="بدون إجازات">بدون إجازات مسجلة</option>
                    </select>
                  </div>

                  {/* Disciplinary */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-0.5">الجزاءات والعقوبات</label>
                    <select
                      value={selectedDisciplinaryFilter}
                      onChange={(e) => { setSelectedDisciplinaryFilter(e.target.value); setCurrentPage(1); }}
                      className="w-full py-1.5 px-2 bg-slate-50 border border-slate-200 rounded text-xs font-medium focus:ring-1 focus:ring-red-600 outline-none"
                    >
                      <option value="الكل">الكل</option>
                      <option value="نعم">لديه جزاءات / عقوبات</option>
                      <option value="لا">الملف نظيف (لا توجد)</option>
                    </select>
                  </div>

                  {/* Warnings */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-0.5">الإنذارات والتنبيهات</label>
                    <select
                      value={selectedWarningsFilter}
                      onChange={(e) => { setSelectedWarningsFilter(e.target.value); setCurrentPage(1); }}
                      className="w-full py-1.5 px-2 bg-slate-50 border border-slate-200 rounded text-xs font-medium focus:ring-1 focus:ring-red-600 outline-none"
                    >
                      <option value="الكل">الكل</option>
                      <option value="نعم">لديه إنذار رسمي</option>
                      <option value="لا">بدون إنذارات</option>
                    </select>
                  </div>

                  {/* Deductions */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-0.5">الخصومات من المرتب</label>
                    <select
                      value={selectedDeductionsFilter}
                      onChange={(e) => { setSelectedDeductionsFilter(e.target.value); setCurrentPage(1); }}
                      className="w-full py-1.5 px-2 bg-slate-50 border border-slate-200 rounded text-xs font-medium focus:ring-1 focus:ring-red-600 outline-none"
                    >
                      <option value="الكل">الكل</option>
                      <option value="نعم">لديه خصم أيام</option>
                      <option value="لا">بدون خصومات</option>
                    </select>
                  </div>

                  {/* Evaluation */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-0.5">تقييم الكفاءة السنوي</label>
                    <select
                      value={selectedEvaluationFilter}
                      onChange={(e) => { setSelectedEvaluationFilter(e.target.value); setCurrentPage(1); }}
                      className="w-full py-1.5 px-2 bg-slate-50 border border-slate-200 rounded text-xs font-medium focus:ring-1 focus:ring-red-600 outline-none"
                    >
                      <option value="الكل">الكل</option>
                      <option value="نعم">لديه تقرير كفاءة</option>
                      <option value="لا">بدون تقييم كفاءة</option>
                    </select>
                  </div>

                  {/* Digital Attachments */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-0.5">المستندات والملفات</label>
                    <select
                      value={selectedDocumentFilter}
                      onChange={(e) => { setSelectedDocumentFilter(e.target.value); setCurrentPage(1); }}
                      className="w-full py-1.5 px-2 bg-slate-50 border border-slate-200 rounded text-xs font-medium focus:ring-1 focus:ring-red-600 outline-none"
                    >
                      <option value="الكل">الكل</option>
                      <option value="نعم">مرفق ملف PDF/مستند</option>
                      <option value="لا">بدون ملف إلكتروني</option>
                    </select>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* Category Tabs */}
        <div className="flex border-b border-gray-200 overflow-x-auto gap-1 scrollbar-none pt-1">
          <button
            type="button"
            onClick={() => { setSelectedCategoryFilter('الكل'); setCurrentPage(1); }}
            className={`pb-2 px-3 sm:px-4 font-bold text-xs border-b-2 transition-all whitespace-nowrap cursor-pointer shrink-0 ${
              selectedCategoryFilter === 'الكل'
                ? 'border-red-700 text-red-800'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            كافة الكوادر ({employees.length})
          </button>
          <button
            type="button"
            onClick={() => { setSelectedCategoryFilter('إداري'); setCurrentPage(1); }}
            className={`pb-2 px-3 sm:px-4 font-bold text-xs border-b-2 transition-all whitespace-nowrap cursor-pointer shrink-0 ${
              selectedCategoryFilter === 'إداري'
                ? 'border-blue-700 text-blue-800'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            الكادر الإداري ({employees.filter((e) => e.assignmentCategory === 'إداري' && !isOutsideCadreStatus(e.status)).length})
          </button>
          <button
            type="button"
            onClick={() => { setSelectedCategoryFilter('طبي'); setCurrentPage(1); }}
            className={`pb-2 px-3 sm:px-4 font-bold text-xs border-b-2 transition-all whitespace-nowrap cursor-pointer shrink-0 ${
              selectedCategoryFilter === 'طبي'
                ? 'border-emerald-700 text-emerald-800'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            الكادر الطبي والمساعد ({employees.filter((e) => e.assignmentCategory === 'طبي' && !isOutsideCadreStatus(e.status)).length})
          </button>
          <button
            type="button"
            onClick={() => { setSelectedCategoryFilter('خارج_الملاك'); setCurrentPage(1); }}
            className={`pb-2 px-3 sm:px-4 font-bold text-xs border-b-2 transition-all whitespace-nowrap cursor-pointer shrink-0 ${
              selectedCategoryFilter === 'خارج_الملاك'
                ? 'border-purple-700 text-purple-800'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            خارج الملاك الوظيفي ({employees.filter((e) => isOutsideCadreStatus(e.status)).length})
          </button>
        </div>

      </div>

      {/* 3. MAIN DATA TABLE CONTAINER */}
      <div className="w-full rounded-xl border border-gray-200 shadow-2xs bg-white overflow-hidden flex flex-col box-border">
        
        {/* Table Top Info & Page Size Toolbar */}
        <div className="px-3.5 py-2 bg-gray-50 border-b border-gray-200 flex flex-wrap justify-between items-center gap-2 text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-bold text-gray-800">
              قائمة الموظفين ({filteredEmployees.length})
            </span>
            {searchQuery && (
              <span className="bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded text-[11px] truncate max-w-[180px]">
                "{searchQuery}"
              </span>
            )}
            {selectedCategoryFilter !== 'الكل' && (
              <span className="bg-red-50 text-red-800 border border-red-200 font-semibold px-2 py-0.5 rounded text-[11px]">
                {selectedCategoryFilter === 'خارج_الملاك' ? 'خارج الملاك' : selectedCategoryFilter}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 text-gray-600 text-xs">
            <div className="flex items-center gap-1">
              <span>عرض:</span>
              <select
                value={pageSize}
                onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                className="py-1 px-2 border border-gray-300 rounded bg-white text-xs text-gray-800 outline-none font-medium"
              >
                <option value={20}>20 موظف</option>
                <option value={50}>50 موظف</option>
                <option value={100}>100 موظف</option>
                <option value={0}>الكل ({filteredEmployees.length})</option>
              </select>
            </div>
            <span className="font-medium text-gray-500">
              عرض {(currentPage - 1) * effectivePageSize + (filteredEmployees.length > 0 ? 1 : 0)}–{Math.min(currentPage * effectivePageSize, filteredEmployees.length)} من أصل {filteredEmployees.length}
            </span>
          </div>
        </div>

        {/* Compact Table */}
        <div className="overflow-x-auto w-full max-h-[calc(100vh-320px)] min-h-[380px] scrollbar-thin select-text">
          <table className="w-full text-right text-xs border-collapse">
            {/* Sticky Header */}
            <thead className="bg-gray-100/90 text-gray-700 font-bold border-b border-gray-200 sticky top-0 z-10 backdrop-blur-xs">
              <tr>
                <th className="py-2.5 px-3 w-12 text-center text-gray-400 font-mono">#</th>
                <th className="py-2.5 px-3 w-28 text-gray-900">الرقم الوظيفي</th>
                <th className="py-2.5 px-3 text-gray-900 min-w-[180px]">اسم الموظف</th>
                <th className="py-2.5 px-3 w-32 text-gray-700 hidden sm:table-cell">الرقم الوطني / الوثيقة</th>
                <th className="py-2.5 px-3 w-32 text-gray-900" title="الدرجة الحالية النافذة حسب أحدث إجراء زمني معتمد">الدرجة الحالية</th>
                <th className="py-2.5 px-3 w-32 text-gray-700 hidden md:table-cell">القسم</th>
                <th className="py-2.5 px-3 w-32 text-gray-700 hidden lg:table-cell">الوظيفة</th>
                <th className="py-2.5 px-3 w-28 text-center text-gray-700">الحالة</th>
                <th className="py-2.5 px-3 w-28 text-center text-gray-900">إجراءات</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {paginatedEmployees.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-12 text-center text-gray-500">
                    <User className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="font-bold text-gray-700 text-sm">لا توجد نتائج مطابقة لبحثك</p>
                    <p className="text-xs text-gray-400 mt-1">جرّب تغيير كلمات البحث أو إعادة ضبط الفلاتر المتقدمة.</p>
                  </td>
                </tr>
              ) : (
                paginatedEmployees.map((emp, idx) => {
                  const isExpanded = expandedEmpId === emp.id;
                  const isLibyan = emp.nationality === 'ليبي' || !emp.nationality;
                  const rowNumber = (currentPage - 1) * effectivePageSize + idx + 1;

                  return (
                    <React.Fragment key={emp.id}>
                      <tr
                        onClick={() => setSelectedProfileEmp(emp)}
                        className="cursor-pointer transition-all duration-150 group relative hover:bg-red-50/40 text-gray-800"
                        style={{ height: '44px' }}
                      >
                        {/* 1. Sequential # */}
                        <td className="py-2 px-3 text-center font-mono text-[11px] relative whitespace-nowrap">
                          <span className="text-gray-400 group-hover:text-red-800 font-bold">
                            {String(rowNumber).padStart(3, '0')}
                          </span>
                        </td>

                        {/* 2. Job Number */}
                        <td className="py-2 px-3 font-mono font-bold text-xs whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded text-[11px] transition-colors border bg-red-50 group-hover:bg-red-100 text-red-900 border-red-200">
                            {emp.jobNumber}
                          </span>
                        </td>

                        {/* 3. Employee Name - Prominent for readability */}
                        <td className="py-2 px-3">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[14px] sm:text-[14.5px] truncate max-w-[240px] font-bold text-gray-900 group-hover:text-red-900 transition-colors">
                              {emp.fullName}
                            </span>
                            {!isLibyan && (
                              <span className="text-[10px] bg-blue-100 text-blue-800 px-1 py-0.2 rounded font-bold shrink-0">
                                {emp.nationality || 'وافد'}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* 4. National ID / Document */}
                        <td className="py-2 px-3 font-mono text-gray-700 text-xs hidden sm:table-cell whitespace-nowrap">
                          {isLibyan ? (emp.nationalId || '-') : (emp.passportNumber || emp.nationalId || '-')}
                        </td>

                        {/* 5. Grade & Current Increment (Authoritative Chronological Latest Effective Grade) */}
                        <td className="py-2 px-3 whitespace-nowrap">
                          {(() => {
                            const gradeInfo = employeeGradeInfoMap.get(emp.id);
                            const displayedGrade = gradeInfo?.displayedCurrentGrade || emp.jobGrade || '-';
                            const displayedIncrement = gradeInfo?.currentIncrement ?? (emp.currentIncrement || 1);
                            const isUpdatedChronologically = !!gradeInfo?.isDifferentFromRecorded;

                            return (
                              <div className="flex items-center gap-1">
                                <span className="font-bold text-gray-900 text-xs">
                                  {displayedGrade}
                                </span>
                                <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1 rounded" title="العلاوة الحالية النافذة">
                                  +{displayedIncrement}
                                </span>
                                {isUpdatedChronologically && (
                                  <span 
                                    className="text-[9px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-1 py-0.2 rounded"
                                    title={`محدثة وفق أحدث إجراء: ${gradeInfo?.latestGradeAction || 'ترقية/تسوية'} (${gradeInfo?.effectiveDate || '-'})`}
                                  >
                                    محدثة
                                  </span>
                                )}
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setAuditInspectEmpId(emp.id);
                                    setIsGradeAuditModalOpen(true);
                                  }}
                                  className="text-gray-400 hover:text-indigo-600 p-0.5 rounded transition-colors"
                                  title="فحص التتبع الزمني للدرجة ومقارنة الدرجة الأولى بالأحدث"
                                >
                                  <Info className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            );
                          })()}
                        </td>

                        {/* 6. Department */}
                        <td className="py-2 px-3 text-gray-800 text-xs hidden md:table-cell truncate max-w-[150px]">
                          {emp.department}
                        </td>

                        {/* 7. Job Title */}
                        <td className="py-2 px-3 text-gray-600 text-xs hidden lg:table-cell truncate max-w-[150px]">
                          {emp.jobTitle}
                        </td>

                        {/* 8. Status Badge */}
                        <td className="py-2 px-3 text-center whitespace-nowrap">
                          <div className="flex flex-col items-center gap-1">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${
                              emp.status === 'على رأس العمل'
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : emp.status.includes('إجازة')
                                ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                : isOutsideCadreStatus(emp.status)
                                ? 'bg-purple-50 text-purple-800 border border-purple-200'
                                : 'bg-gray-100 text-gray-700 border border-gray-200'
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${
                                emp.status === 'على رأس العمل'
                                  ? 'bg-emerald-600'
                                  : emp.status.includes('إجازة')
                                  ? 'bg-amber-600'
                                  : isOutsideCadreStatus(emp.status)
                                  ? 'bg-purple-600'
                                  : 'bg-gray-500'
                              }`} />
                              {emp.status}
                            </span>
                            {emp.reviewStatus && emp.reviewStatus !== 'لم تتم المراجعة' && (
                              <span className={`inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.2 rounded font-bold ${
                                emp.reviewStatus === 'تمت المراجعة'
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                  : 'bg-amber-100 text-amber-800 border border-amber-300'
                              }`}>
                                <ClipboardCheck className="w-2.5 h-2.5" />
                                {emp.reviewStatus}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* 9. Action Buttons */}
                        <td className="py-2 px-2 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setSelectedProfileEmp(emp)}
                              className="px-2.5 py-1.5 bg-red-700 hover:bg-red-800 text-white rounded-md text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-2xs"
                              title="فتح الملف الشخصي والسيرة الوظيفية الكاملة"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>فتح ملف الموظف</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setReviewEmp(emp)}
                              className="px-2 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded-md text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-2xs"
                              title="مراجعة وتدقيق بيانات الموظف والسيرة الوظيفية"
                            >
                              <ClipboardCheck className="w-3.5 h-3.5" />
                              <span>مراجعة</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleOpenEdit(emp)}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition cursor-pointer"
                              title="تعديل بيانات الموظف"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => onPrintCard(emp)}
                              className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-md transition cursor-pointer"
                              title="طباعة بطاقة الموظف"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => onDeleteEmployee(emp.id)}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition cursor-pointer"
                              title="حذف الموظف"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* 4. PAGINATION FOOTER */}
        <div className="px-3.5 py-2.5 bg-gray-50 border-t border-gray-200 flex flex-wrap justify-between items-center gap-2 text-xs">
          <span className="text-gray-600 font-medium">
            صفحة <span className="font-bold text-gray-900">{currentPage}</span> من <span className="font-bold text-gray-900">{totalPages}</span> (إجمالي {filteredEmployees.length} موظف)
          </span>

          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="px-2.5 py-1 rounded-md border border-gray-300 bg-white disabled:opacity-40 hover:bg-gray-50 font-bold flex items-center gap-1 cursor-pointer transition shadow-2xs"
            >
              <ChevronRight className="w-3.5 h-3.5" />
              <span>السابق</span>
            </button>

            {/* Compact numeric page indicator */}
            {totalPages <= 7 ? (
              Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setCurrentPage(p)}
                  className={`w-7 h-7 rounded-md text-xs font-bold transition cursor-pointer ${
                    currentPage === p
                      ? 'bg-red-700 text-white shadow-2xs'
                      : 'bg-white hover:bg-gray-100 border border-gray-300 text-gray-700'
                  }`}
                >
                  {p}
                </button>
              ))
            ) : (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setCurrentPage(1)}
                  className={`w-7 h-7 rounded-md text-xs font-bold transition cursor-pointer ${
                    currentPage === 1 ? 'bg-red-700 text-white' : 'bg-white border border-gray-300'
                  }`}
                >
                  1
                </button>
                {currentPage > 3 && <span className="px-1 text-gray-400">...</span>}
                {currentPage > 1 && currentPage < totalPages && (
                  <button
                    type="button"
                    className="w-7 h-7 rounded-md text-xs font-bold bg-red-700 text-white"
                  >
                    {currentPage}
                  </button>
                )}
                {currentPage < totalPages - 2 && <span className="px-1 text-gray-400">...</span>}
                <button
                  type="button"
                  onClick={() => setCurrentPage(totalPages)}
                  className={`w-7 h-7 rounded-md text-xs font-bold transition cursor-pointer ${
                    currentPage === totalPages ? 'bg-red-700 text-white' : 'bg-white border border-gray-300'
                  }`}
                >
                  {totalPages}
                </button>
              </div>
            )}

            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="px-2.5 py-1 rounded-md border border-gray-300 bg-white disabled:opacity-40 hover:bg-gray-50 font-bold flex items-center gap-1 cursor-pointer transition shadow-2xs"
            >
              <span>التالي</span>
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 5. EMPLOYEE ADD / EDIT FORM MODAL */}
      {isFormOpen && editingEmp && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto" dir="rtl">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full p-4 sm:p-6 space-y-4 border border-gray-200 my-auto box-border max-h-[95vh] overflow-y-auto scrollbar-thin">
            <div className="flex justify-between items-center border-b pb-3 sticky top-0 bg-white z-20">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-red-100 text-red-800 rounded-xl">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base sm:text-lg text-gray-900">
                    {editingEmp.id && employees.some((e) => e.id === editingEmp.id) ? 'تعديل بيانات موظف' : 'إضافة موظف جديد'}
                  </h3>
                  <p className="text-[11px] text-gray-500 font-medium">
                    يرجى تعبئة كافة الحقول الإلزامية بدقة وفق اللوائح الإدارية
                  </p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => { setIsFormOpen(false); setFormError(null); }} 
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-red-50 border border-red-300 rounded-xl text-red-800 text-xs font-bold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveForm} className="space-y-4 text-xs">
              
              {/* SECTION 1: Personal Information & Official Identity Documents */}
              <div className="bg-slate-50/90 p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center gap-2 border-b border-slate-200 pb-2 text-red-900 font-extrabold text-xs">
                  <User className="w-4 h-4 text-red-700 shrink-0" />
                  <span>القسم الأول: البيانات الشخصية ووثائق إثبات الهوية (إلزامية)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {/* Job Number */}
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">الرقم الوظيفي / رقم الملف *</label>
                    <input
                      type="text"
                      required
                      value={editingEmp.jobNumber}
                      onChange={(e) => setEditingEmp({ ...editingEmp, jobNumber: e.target.value })}
                      placeholder="مثال: 1001/م"
                      className="w-full p-2.5 border rounded-lg font-bold text-red-950 bg-white box-border focus:ring-2 focus:ring-red-600"
                    />
                  </div>

                  {/* Full Name */}
                  <div className="sm:col-span-2">
                    <label className="block font-bold text-gray-700 mb-1">الاسم الرباعي واللقب الكامل *</label>
                    <input
                      type="text"
                      required
                      value={editingEmp.fullName}
                      onChange={(e) => setEditingEmp({ ...editingEmp, fullName: e.target.value })}
                      placeholder="اكتب الاسم الرباعي كاملاً كما في الوثيقة الرسمية..."
                      className="w-full p-2.5 border rounded-lg font-bold text-gray-900 bg-white box-border focus:ring-2 focus:ring-red-600"
                    />
                  </div>

                  {/* Nationality Field */}
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">
                      الجنسية * <span className="text-[10px] text-gray-500 font-normal">(اختر أو اكتب)</span>
                    </label>
                    <div className="space-y-1.5">
                      <select
                        value={COMMON_NATIONALITIES.includes(editingEmp.nationality) ? editingEmp.nationality : 'أخرى'}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === 'ليبي') {
                            setEditingEmp({
                              ...editingEmp,
                              nationality: 'ليبي',
                              documentType: 'الرقم الوطني'
                            });
                          } else if (val === 'أخرى') {
                            setEditingEmp({
                              ...editingEmp,
                              nationality: editingEmp.nationality === 'ليبي' ? '' : editingEmp.nationality,
                              documentType: 'رقم جواز السفر'
                            });
                          } else {
                            setEditingEmp({
                              ...editingEmp,
                              nationality: val,
                              documentType: 'رقم جواز السفر'
                            });
                          }
                        }}
                        className="w-full p-2.5 border rounded-lg font-bold bg-white text-gray-800 box-border focus:ring-2 focus:ring-red-600"
                      >
                        {COMMON_NATIONALITIES.map((nat) => (
                          <option key={nat} value={nat}>{nat}</option>
                        ))}
                      </select>

                      {(!COMMON_NATIONALITIES.includes(editingEmp.nationality) || editingEmp.nationality === 'أخرى' || editingEmp.nationality === '') && (
                        <input
                          type="text"
                          required
                          value={editingEmp.nationality === 'أخرى' ? '' : editingEmp.nationality}
                          onChange={(e) => setEditingEmp({ ...editingEmp, nationality: e.target.value, documentType: 'رقم جواز السفر' })}
                          placeholder="اكتب الجنسية يدوياً..."
                          className="w-full p-2 border border-amber-400 rounded-lg font-bold bg-amber-50/50 text-amber-950 box-border focus:ring-2 focus:ring-amber-500"
                        />
                      )}
                    </div>
                  </div>

                  {/* National ID / Passport */}
                  <div className="sm:col-span-2">
                    {editingEmp.nationality === 'ليبي' ? (
                      <div>
                        <label className="block font-bold text-gray-700 mb-1">
                          الرقم الوطني (12 رقماً للمواطن الليبي) *
                        </label>
                        <input
                          type="text"
                          required
                          maxLength={12}
                          value={editingEmp.nationalId}
                          onChange={(e) => {
                            const cleanId = normalizeNationalId(e.target.value);
                            const firstDigit = cleanId.charAt(0);
                            let newGender = editingEmp.gender;
                            if (firstDigit === '1') newGender = 'ذكر';
                            else if (firstDigit === '2') newGender = 'أنثى';
                            setEditingEmp({
                              ...editingEmp,
                              nationalId: cleanId,
                              gender: newGender
                            });
                          }}
                          placeholder="مثال: 119900123456"
                          className="w-full p-2.5 border rounded-lg font-mono font-bold text-gray-900 bg-white box-border focus:ring-2 focus:ring-red-600"
                        />
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <label className="block font-bold text-gray-700 mb-1">رقم جواز السفر *</label>
                          <input
                            type="text"
                            required
                            value={editingEmp.passportNumber || ''}
                            onChange={(e) => setEditingEmp({ ...editingEmp, passportNumber: e.target.value })}
                            placeholder="مثال: A12345678"
                            className="w-full p-2.5 border rounded-lg font-mono font-bold text-gray-900 bg-white box-border focus:ring-2 focus:ring-red-600"
                          />
                        </div>
                        <div>
                          <label className="block font-bold text-gray-700 mb-1">الرقم الوطني / الإقامة (إن وجد)</label>
                          <input
                            type="text"
                            value={editingEmp.nationalId || ''}
                            onChange={(e) => {
                              const cleanId = normalizeNationalId(e.target.value);
                              const firstDigit = cleanId.charAt(0);
                              let newGender = editingEmp.gender;
                              if (firstDigit === '1') newGender = 'ذكر';
                              else if (firstDigit === '2') newGender = 'أنثى';
                              setEditingEmp({
                                ...editingEmp,
                                nationalId: cleanId,
                                gender: newGender
                              });
                            }}
                            placeholder="رقم الإقامة أو الرقم الوطني..."
                            className="w-full p-2.5 border rounded-lg font-mono bg-white box-border focus:ring-2 focus:ring-red-600"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Mother Name */}
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">اسم الأم الكامل</label>
                    <input
                      type="text"
                      value={editingEmp.motherName}
                      onChange={(e) => setEditingEmp({ ...editingEmp, motherName: e.target.value })}
                      placeholder="اسم الأم الثلاثي..."
                      className="w-full p-2.5 border rounded-lg bg-white box-border focus:ring-2 focus:ring-red-600"
                    />
                  </div>

                  {/* Birth Date */}
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">تاريخ الميلاد</label>
                    <input
                      type="date"
                      value={editingEmp.birthDate}
                      onChange={(e) => setEditingEmp({ ...editingEmp, birthDate: e.target.value })}
                      className="w-full p-2.5 border rounded-lg bg-white box-border focus:ring-2 focus:ring-red-600"
                    />
                  </div>

                  {/* Birth Place */}
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">مكان الميلاد</label>
                    <input
                      type="text"
                      value={editingEmp.birthPlace}
                      onChange={(e) => setEditingEmp({ ...editingEmp, birthPlace: e.target.value })}
                      placeholder="المرج، بنغازي..."
                      className="w-full p-2.5 border rounded-lg bg-white box-border focus:ring-2 focus:ring-red-600"
                    />
                  </div>

                  {/* Gender: Automatic from National ID */}
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">الجنس</label>
                    <div className="w-full p-2.5 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 font-bold text-sm box-border flex items-center justify-between">
                      <span className="text-base text-gray-900">{editingEmp.gender === 'أنثى' ? 'أنثى' : 'ذكر'}</span>
                      <span className="text-xs text-gray-500 font-normal">
                        (يتحدد تلقائياً بمجرد إدخال الرقم الوطني: 1 = ذكر، 2 = أنثى)
                      </span>
                    </div>
                  </div>

                  {/* Marital Status */}
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">الحالة الاجتماعية</label>
                    <select
                      value={editingEmp.maritalStatus}
                      onChange={(e) => setEditingEmp({ ...editingEmp, maritalStatus: e.target.value })}
                      className="w-full p-2.5 border rounded-lg bg-white box-border focus:ring-2 focus:ring-red-600"
                    >
                      <option value="أعزب">أعزب</option>
                      <option value="متزوج">متزوج</option>
                      <option value="مطلق">مطلق</option>
                      <option value="أرمل">أرمل</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* SECTION 2: Career, Cadre & Department */}
              <div className="bg-slate-50/90 p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center gap-2 border-b border-slate-200 pb-2 text-blue-900 font-extrabold text-xs">
                  <Layers className="w-4 h-4 text-blue-700 shrink-0" />
                  <span>القسم الثاني: التبعية الإدارية والملاك والوظيفة</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {/* Department */}
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">القسم / الإدارة التابع لها *</label>
                    <select
                      value={editingEmp.department}
                      onChange={(e) => handleFormDeptChange(e.target.value)}
                      className="w-full p-2.5 border rounded-lg bg-white font-bold text-blue-950 box-border focus:ring-2 focus:ring-blue-600"
                    >
                      {DEPARTMENTS.map((dept) => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>
                  </div>

                  {/* Assignment Category */}
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">الكادر الوظيفي *</label>
                    <select
                      value={editingEmp.assignmentCategory}
                      onChange={(e) => setEditingEmp({ ...editingEmp, assignmentCategory: e.target.value as AssignmentCategory })}
                      className="w-full p-2.5 border rounded-lg bg-white font-bold text-gray-800 box-border focus:ring-2 focus:ring-blue-600"
                    >
                      {ASSIGNMENT_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  {/* Job Title */}
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">المسمى الوظيفي *</label>
                    <input
                      type="text"
                      required
                      value={editingEmp.jobTitle}
                      onChange={(e) => setEditingEmp({ ...editingEmp, jobTitle: e.target.value })}
                      placeholder="مثال: فني مختبر أول..."
                      className="w-full p-2.5 border rounded-lg bg-white font-bold box-border focus:ring-2 focus:ring-blue-600"
                    />
                  </div>

                  {/* Cadre / Financial Number */}
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">رقم الملاك الوظيفي / المالي</label>
                    <input
                      type="text"
                      value={editingEmp.cadreNumber || ''}
                      onChange={(e) => setEditingEmp({ ...editingEmp, cadreNumber: e.target.value })}
                      placeholder="MLK-1001"
                      className="w-full p-2.5 border rounded-lg bg-white box-border font-mono focus:ring-2 focus:ring-blue-600"
                    />
                  </div>

                  {/* Employment Status */}
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">الحالة الوظيفية *</label>
                    <select
                      value={editingEmp.status}
                      onChange={(e) => setEditingEmp({ ...editingEmp, status: e.target.value as EmploymentStatus })}
                      className="w-full p-2.5 border rounded-lg bg-white font-bold box-border focus:ring-2 focus:ring-blue-600"
                    >
                      <option value="على رأس العمل">على رأس العمل</option>
                      <option value="إجازة">إجازة</option>
                      <option value="منتدب">منتدب</option>
                      <option value="منقول خارجياً">منقول خارجياً (خارج الملاك)</option>
                      <option value="مستقيل">مستقيل (خارج الملاك)</option>
                      <option value="منهي خدماته">منهي خدماته (خارج الملاك)</option>
                      <option value="متقاعد">متقاعد (خارج الملاك)</option>
                      <option value="متوفى">متوفى</option>
                    </select>
                  </div>

                  {/* Hiring Entity */}
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">جهة التعيين</label>
                    <select
                      value={editingEmp.hiringEntity}
                      onChange={(e) => setEditingEmp({ ...editingEmp, hiringEntity: e.target.value })}
                      className="w-full p-2.5 border rounded-lg bg-white box-border focus:ring-2 focus:ring-blue-600"
                    >
                      {HIRING_ENTITIES.map((ent) => (
                        <option key={ent} value={ent}>{ent}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* SECTION 3: Grades, Increments & Dates */}
              <div className="bg-slate-50/90 p-4 rounded-xl border border-slate-200 space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-200 pb-2 text-amber-900 font-extrabold text-xs">
                  <Award className="w-4 h-4 text-amber-700 shrink-0" />
                  <span>القسم الثالث: الدرجة الوظيفية والعلاوات والتواريخ الرسمية</span>
                </div>

                {/* Subsection A: بيانات التعيين الأصلية */}
                <div className="bg-white p-3.5 rounded-xl border border-amber-200 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between border-b border-amber-100 pb-1.5">
                    <div className="flex items-center gap-1.5 text-amber-900 font-bold text-xs">
                      <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                      <span>بيانات التعيين الأصلية (التصنيف عند التعيين)</span>
                    </div>
                    <span className="text-[10px] text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 font-medium">
                      تاريخي ثابت
                    </span>
                  </div>

                  {/* Clarification banner */}
                  <div className="p-2.5 bg-amber-50/90 rounded-lg border border-amber-200 text-[11px] text-amber-900 font-medium flex items-center gap-2">
                    <Info className="w-4 h-4 text-amber-700 shrink-0" />
                    <span>الدرجة المعين عليها تمثل التصنيف عند التعيين ولا تمثل بالضرورة الدرجة الحالية.</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {/* نظام الدرجة المعين عليها */}
                    <div>
                      <label className="block font-bold text-gray-700 mb-1">
                        نظام الدرجة المعين عليها *
                      </label>
                      <select
                        value={editingEmp.appointmentSalarySystem || ''}
                        onChange={(e) => {
                          const newSystem = e.target.value as AppointmentSalarySystem;
                          const available = getAvailableAppointmentGrades(newSystem, appointmentGradeConfigs);
                          setEditingEmp({
                            ...editingEmp,
                            appointmentSalarySystem: newSystem,
                            appointmentGrade: available[0]?.gradeName || '',
                            appointmentIncrements: 0,
                            needsAppointmentSystemReview: false
                          });
                        }}
                        className="w-full p-2.5 border rounded-lg font-bold bg-white text-gray-900 box-border focus:ring-2 focus:ring-amber-500"
                      >
                        <option value="">-- اختر نظام التعيين --</option>
                        {APPOINTMENT_SALARY_SYSTEMS.map((sys) => (
                          <option key={sys} value={sys}>{sys}</option>
                        ))}
                      </select>
                    </div>

                    {/* الدرجة المعين عليها */}
                    <div>
                      <label className="block font-bold text-gray-700 mb-1">
                        الدرجة المعين عليها *
                      </label>
                      <select
                        disabled={!editingEmp.appointmentSalarySystem}
                        value={editingEmp.appointmentGrade || ''}
                        onChange={(e) => {
                          const newGrade = e.target.value;
                          setEditingEmp({
                            ...editingEmp,
                            appointmentGrade: newGrade,
                            needsAppointmentSystemReview: false
                          });
                        }}
                        className="w-full p-2.5 border rounded-lg font-bold bg-white text-amber-950 box-border focus:ring-2 focus:ring-amber-500 disabled:bg-gray-100 disabled:text-gray-400"
                      >
                        {!editingEmp.appointmentSalarySystem ? (
                          <option value="">(اختر نظام الدرجة أولاً)</option>
                        ) : (
                          <>
                            <option value="">-- اختر الدرجة --</option>
                            {getAvailableAppointmentGrades(editingEmp.appointmentSalarySystem, appointmentGradeConfigs).map((g) => (
                              <option key={g.id} value={g.gradeName}>{g.gradeName}</option>
                            ))}
                          </>
                        )}
                      </select>
                    </div>

                    {/* عدد العلاوات عند التعيين */}
                    <div>
                      <label className="block font-bold text-gray-700 mb-1">
                        عدد العلاوات عند التعيين
                      </label>
                      <select
                        disabled={!editingEmp.appointmentSalarySystem || !editingEmp.appointmentGrade}
                        value={editingEmp.appointmentIncrements ?? 0}
                        onChange={(e) => setEditingEmp({ ...editingEmp, appointmentIncrements: parseInt(e.target.value, 10) || 0 })}
                        className="w-full p-2.5 border rounded-lg font-bold bg-white text-gray-800 box-border focus:ring-2 focus:ring-amber-500 disabled:bg-gray-100 disabled:text-gray-400"
                      >
                        {getAvailableIncrementsForGrade(editingEmp.appointmentSalarySystem, editingEmp.appointmentGrade, appointmentGradeConfigs).map((inc) => (
                          <option key={inc} value={inc}>
                            {inc} {inc === 0 ? '(بدون علاوات)' : inc === 1 ? 'علاوة واحدة' : inc === 2 ? 'علاوتان' : `${inc} علاوات`}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Hire Date */}
                    <div>
                      <label className="block font-bold text-gray-700 mb-1">تاريخ التعيين الأول</label>
                      <input
                        type="date"
                        value={editingEmp.hireDate}
                        onChange={(e) => setEditingEmp({ ...editingEmp, hireDate: e.target.value })}
                        className="w-full p-2.5 border rounded-lg bg-white box-border focus:ring-2 focus:ring-amber-500"
                      />
                    </div>

                    {/* Directing Date */}
                    <div>
                      <label className="block font-bold text-gray-700 mb-1">تاريخ المباشرة</label>
                      <input
                        type="date"
                        value={editingEmp.directingDate}
                        onChange={(e) => setEditingEmp({ ...editingEmp, directingDate: e.target.value })}
                        className="w-full p-2.5 border rounded-lg bg-white box-border focus:ring-2 focus:ring-amber-500"
                      />
                    </div>

                    {/* Blood Bank Start Date */}
                    <div>
                      <label className="block font-bold text-gray-700 mb-1">بدء العمل بمصرف الدم</label>
                      <input
                        type="date"
                        value={editingEmp.bloodBankStartDate}
                        onChange={(e) => setEditingEmp({ ...editingEmp, bloodBankStartDate: e.target.value })}
                        className="w-full p-2.5 border rounded-lg bg-white box-border focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Intermediate Career Steps (Optional) */}
                <div className="space-y-3">
                  {/* Add Button & Connecting Divider */}
                  <div className="relative flex items-center justify-center my-1">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-dashed border-slate-300"></div>
                    </div>
                    <div className="relative flex items-center gap-2 bg-slate-50 px-3 py-1 rounded-full border border-slate-200 text-xs">
                      <button
                        type="button"
                        id="btn-add-intermediate-step"
                        onClick={handleAddIntermediateStep}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow-xs cursor-pointer hover:shadow"
                        title="إضافة درجة وظيفية بينية بين درجة التعيين والدرجة الحالية"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>+ إضافة درجة وظيفية بينية (اختياري)</span>
                      </button>
                      {intermediateGrades.length > 0 && (
                        <span className="text-[11px] font-mono font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                          {intermediateGrades.length} {intermediateGrades.length === 1 ? 'درجة بينية' : 'درجات بينية'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Sequence Warnings Banner */}
                  {sequenceWarnings.length > 0 && (
                    <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl space-y-1 text-xs text-amber-900">
                      <div className="flex items-center gap-1.5 font-bold text-amber-800">
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>ملاحظات تسلسل التدرج الوظيفي:</span>
                      </div>
                      <ul className="list-disc list-inside space-y-0.5 text-[11px] text-amber-800 pr-2">
                        {sequenceWarnings.map((warn, wIdx) => (
                          <li key={wIdx}>{warn}</li>
                        ))}
                      </ul>
                      <p className="text-[10px] text-amber-700 mt-1">
                        * يُسمح بمتابعة الحفظ في حال كانت الترقية استثنائية أو تسوية وضع رسمية وفق قرارات معتمدة.
                      </p>
                    </div>
                  )}

                  {/* Intermediate Steps Cards */}
                  {intermediateGrades.map((step, idx) => {
                    const prevGradeForThis = idx === 0 ? (editingEmp.appointmentGrade || 'التعيين') : (intermediateGrades[idx - 1].grade || '—');
                    const nextGradeForThis = idx === intermediateGrades.length - 1 ? (editingEmp.jobGrade || 'الحالية') : (intermediateGrades[idx + 1].grade || '—');

                    return (
                      <div 
                        key={step.id || idx} 
                        className="bg-white p-3.5 rounded-xl border-2 border-emerald-200 shadow-2xs space-y-3 relative"
                      >
                        {/* Step Header */}
                        <div className="flex items-center justify-between border-b border-emerald-100 pb-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                            <span className="font-black text-xs text-emerald-950">
                              درجة وظيفية بينية ({idx + 1} من {intermediateGrades.length})
                            </span>
                            <span className="text-[10px] bg-emerald-50 text-emerald-800 font-bold px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                              <span>{prevGradeForThis}</span>
                              <span>←</span>
                              <span className="font-extrabold text-emerald-900">{step.grade || '—'}</span>
                              <span>←</span>
                              <span>{nextGradeForThis}</span>
                            </span>
                          </div>

                          <button
                            type="button"
                            id={`btn-remove-intermediate-step-${idx}`}
                            onClick={() => handleRemoveIntermediateStep(idx)}
                            className="p-1.5 text-red-600 hover:text-white hover:bg-red-600 rounded-lg border border-red-200 hover:border-red-600 transition flex items-center gap-1 text-xs cursor-pointer"
                            title="حذف هذه الدرجة البينية"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span className="text-[11px] font-bold">حذف الخطوة</span>
                          </button>
                        </div>

                        {/* Step Fields Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                          {/* Grade Selector */}
                          <div>
                            <label className="block font-bold text-gray-700 mb-1 text-xs">
                              الدرجة الوظيفية *
                            </label>
                            <select
                              value={step.grade}
                              onChange={(e) => handleUpdateIntermediateStep(idx, { grade: e.target.value })}
                              className="w-full p-2 border rounded-lg font-bold text-emerald-950 bg-white box-border focus:ring-2 focus:ring-emerald-600 text-xs"
                            >
                              {JOB_GRADES.map((g) => (
                                <option key={g} value={g}>{g}</option>
                              ))}
                            </select>
                          </div>

                          {/* Action / Movement Type */}
                          <div>
                            <label className="block font-bold text-gray-700 mb-1 text-xs">
                              نوع الحركة الوظيفية *
                            </label>
                            <select
                              value={step.movementType || 'ترقية'}
                              onChange={(e) => handleUpdateIntermediateStep(idx, { movementType: e.target.value as CareerActionType })}
                              className="w-full p-2 border rounded-lg font-bold text-gray-900 bg-white box-border focus:ring-2 focus:ring-emerald-600 text-xs"
                            >
                              <option value="ترقية">ترقية عادية</option>
                              <option value="ترقية استثنائية">ترقية استثنائية</option>
                              <option value="تسوية وضع">تسوية وضع</option>
                              <option value="تحويل من اللائحة 418 إلى نظام الدرجات العامة">تحويل من اللائحة 418 إلى نظام الدرجات العامة</option>
                              <option value="ندب على درجة">ندب على درجة</option>
                              <option value="إجراء وظيفي رسمي آخر">إجراء وظيفي رسمي آخر</option>
                            </select>
                          </div>

                          {/* Effective Date */}
                          <div>
                            <label className="block font-bold text-gray-700 mb-1 text-xs">
                              تاريخ النفاذ والسريان
                            </label>
                            <input
                              type="date"
                              value={step.effectiveDate || ''}
                              onChange={(e) => handleUpdateIntermediateStep(idx, { effectiveDate: e.target.value })}
                              className="w-full p-2 border rounded-lg bg-white box-border focus:ring-2 focus:ring-emerald-600 text-xs"
                            />
                          </div>

                          {/* Decision Number */}
                          <div>
                            <label className="block font-bold text-gray-700 mb-1 text-xs">
                              رقم القرار
                            </label>
                            <input
                              type="text"
                              placeholder="مثال: ق/2018/142"
                              value={step.decisionNumber || ''}
                              onChange={(e) => handleUpdateIntermediateStep(idx, { decisionNumber: e.target.value })}
                              className="w-full p-2 border rounded-lg bg-white box-border focus:ring-2 focus:ring-emerald-600 text-xs"
                            />
                          </div>

                          {/* Decision Date */}
                          <div>
                            <label className="block font-bold text-gray-700 mb-1 text-xs">
                              تاريخ صدور القرار
                            </label>
                            <input
                              type="date"
                              value={step.decisionDate || ''}
                              onChange={(e) => handleUpdateIntermediateStep(idx, { decisionDate: e.target.value })}
                              className="w-full p-2 border rounded-lg bg-white box-border focus:ring-2 focus:ring-emerald-600 text-xs"
                            />
                          </div>

                          {/* Issuing Authority */}
                          <div>
                            <label className="block font-bold text-gray-700 mb-1 text-xs">
                              جهة إصدار القرار
                            </label>
                            <input
                              type="text"
                              placeholder="وزارة الصحة / مصرف الدم..."
                              value={step.issuingAuthority || ''}
                              onChange={(e) => handleUpdateIntermediateStep(idx, { issuingAuthority: e.target.value })}
                              className="w-full p-2 border rounded-lg bg-white box-border focus:ring-2 focus:ring-emerald-600 text-xs"
                            />
                          </div>

                          {/* Notes */}
                          <div className="sm:col-span-2 md:col-span-3">
                            <label className="block font-bold text-gray-700 mb-1 text-xs">
                              ملاحظات أو سبب الترقية
                            </label>
                            <input
                              type="text"
                              placeholder="أسباب الترقية، كفاءة، تسوية مؤهل، إلخ..."
                              value={step.notes || ''}
                              onChange={(e) => handleUpdateIntermediateStep(idx, { notes: e.target.value })}
                              className="w-full p-2 border rounded-lg bg-white box-border focus:ring-2 focus:ring-emerald-600 text-xs"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* Button to add another step if some already exist */}
                  {intermediateGrades.length > 0 && (
                    <div className="flex justify-center">
                      <button
                        type="button"
                        onClick={handleAddIntermediateStep}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-xs font-bold transition cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>+ إضافة درجة بينية أخرى</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Subsection B: الوضع الوظيفي والمالي الحالي */}
                <div className="bg-white p-3.5 rounded-xl border border-red-200 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between border-b border-red-100 pb-1.5">
                    <div className="flex items-center gap-1.5 text-red-900 font-bold text-xs">
                      <span className="w-2 h-2 rounded-full bg-red-600"></span>
                      <span>الوضع الوظيفي الحالي (الدرجة الحالية والترقيات)</span>
                    </div>
                    <span className="text-[10px] text-red-800 bg-red-50 px-2 py-0.5 rounded border border-red-200 font-medium">
                      ديناميكي / قابل للترقية
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {/* Current Grade */}
                    <div>
                      <label className="block font-bold text-gray-700 mb-1">الدرجة الوظيفية الحالية *</label>
                      <select
                        value={editingEmp.jobGrade}
                        onChange={(e) => setEditingEmp({ ...editingEmp, jobGrade: e.target.value })}
                        className="w-full p-2.5 border rounded-lg font-bold text-red-950 bg-white box-border focus:ring-2 focus:ring-red-600"
                      >
                        {JOB_GRADES.map((g) => (
                          <option key={g} value={g}>{g}</option>
                        ))}
                      </select>
                    </div>

                    {/* Current Increment */}
                    <div>
                      <label className="block font-bold text-gray-700 mb-1">رصيد العلاوات الحالي (0 - 15)</label>
                      <input
                        type="number"
                        min={0}
                        max={15}
                        value={editingEmp.currentIncrement ?? 1}
                        onChange={(e) => setEditingEmp({ ...editingEmp, currentIncrement: Math.max(0, parseInt(e.target.value) || 0) })}
                        className="w-full p-2.5 border rounded-lg font-bold bg-white text-amber-950 box-border focus:ring-2 focus:ring-red-600"
                      />
                    </div>

                    {/* Grade Entry Date */}
                    <div>
                      <label className="block font-bold text-gray-700 mb-1">تاريخ استحقاق/دخول الدرجة</label>
                      <input
                        type="date"
                        value={editingEmp.gradeEntryDate || ''}
                        onChange={(e) => setEditingEmp({ ...editingEmp, gradeEntryDate: e.target.value })}
                        className="w-full p-2.5 border rounded-lg bg-white box-border focus:ring-2 focus:ring-red-600"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 4: Qualifications, Education & Contact Details */}
              <div className="bg-slate-50/90 p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center gap-2 border-b border-slate-200 pb-2 text-emerald-900 font-extrabold text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>القسم الرابع: المؤهلات العلمية ومعلومات الاتصال</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {/* 1. الدرجة العلمية (Dropdown exact options) */}
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">
                      الدرجة العلمية * <span className="text-[10px] text-gray-500 font-normal">(قائمة منسدلة)</span>
                    </label>
                    <select
                      value={editingEmp.qualification || ''}
                      onChange={(e) => setEditingEmp({ ...editingEmp, qualification: e.target.value })}
                      className="w-full p-2.5 border rounded-lg bg-white font-bold text-gray-900 box-border focus:ring-2 focus:ring-red-600"
                    >
                      <option value="">-- اختر الدرجة العلمية --</option>
                      {EDUCATIONAL_DEGREES.map((deg) => (
                        <option key={deg} value={deg}>{deg}</option>
                      ))}
                    </select>
                  </div>

                  {/* 2. التخصص الدقيق (Manual text input - never automatically populated) */}
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">
                      التخصص الدقيق <span className="text-[10px] text-gray-500 font-normal">(إدخال يدوي)</span>
                    </label>
                    <input
                      type="text"
                      value={editingEmp.specialization || ''}
                      onChange={(e) => setEditingEmp({ ...editingEmp, specialization: e.target.value })}
                      placeholder="اكتب التخصص الدقيق يدوياً (مثال: أمراض الدم، تقنية مختبرات، محاسبة)..."
                      className="w-full p-2.5 border rounded-lg bg-white box-border focus:ring-2 focus:ring-red-600"
                    />
                  </div>

                  {/* 3. اسم الجامعة (Manual text input) */}
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">
                      اسم الجامعة / المؤسسة التعليمية <span className="text-[10px] text-gray-500 font-normal">(إدخال يدوي)</span>
                    </label>
                    <input
                      type="text"
                      value={editingEmp.university || ''}
                      onChange={(e) => setEditingEmp({ ...editingEmp, university: e.target.value })}
                      placeholder="مثال: جامعة بنغازي، جامعة عمر المختار..."
                      className="w-full p-2.5 border rounded-lg bg-white box-border focus:ring-2 focus:ring-red-600"
                    />
                  </div>

                  {/* 4. سنة التخرج (Numeric 4-digits) */}
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">
                      سنة التخرج / الحصول على المؤهل <span className="text-[10px] text-gray-500 font-normal">(4 خانات رقمية)</span>
                    </label>
                    <input
                      type="text"
                      maxLength={4}
                      value={editingEmp.graduationYear || ''}
                      onChange={(e) => setEditingEmp({ ...editingEmp, graduationYear: e.target.value.replace(/\D/g, '') })}
                      placeholder="مثال: 2021"
                      className="w-full p-2.5 border rounded-lg bg-white font-mono box-border focus:ring-2 focus:ring-red-600"
                    />
                  </div>

                  {/* 5. نوع التعليم (Dropdown: جامعة عامة / جامعة خاصة / غير منطبق) */}
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">
                      نوع التعليم <span className="text-[10px] text-gray-500 font-normal">(قائمة منسدلة)</span>
                    </label>
                    <select
                      value={editingEmp.educationType || 'جامعة عامة'}
                      onChange={(e) => setEditingEmp({ ...editingEmp, educationType: e.target.value })}
                      className="w-full p-2.5 border rounded-lg bg-white box-border focus:ring-2 focus:ring-red-600 font-semibold text-gray-800"
                    >
                      {EDUCATION_TYPES.map((type) => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">رقم الهاتف</label>
                    <input
                      type="text"
                      value={editingEmp.phone || ''}
                      onChange={(e) => setEditingEmp({ ...editingEmp, phone: e.target.value })}
                      placeholder="0910000000"
                      className="w-full p-2.5 border rounded-lg bg-white box-border font-mono focus:ring-2 focus:ring-red-600"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">البريد الإلكتروني</label>
                    <input
                      type="email"
                      value={editingEmp.email || ''}
                      onChange={(e) => setEditingEmp({ ...editingEmp, email: e.target.value })}
                      placeholder="user@bloodbank.gov.ly"
                      className="w-full p-2.5 border rounded-lg bg-white box-border font-mono focus:ring-2 focus:ring-red-600"
                    />
                  </div>

                  {/* Notes */}
                  <div className="sm:col-span-2">
                    <label className="block font-bold text-gray-700 mb-1">ملاحظات إدارية إضافية</label>
                    <input
                      type="text"
                      value={editingEmp.notes || ''}
                      onChange={(e) => setEditingEmp({ ...editingEmp, notes: e.target.value })}
                      placeholder="أي ملاحظات أو تفاصيل إضافية..."
                      className="w-full p-2.5 border rounded-lg bg-white box-border"
                    />
                  </div>
                </div>
              </div>

              {/* Form Action Buttons */}
              <div className="flex justify-end gap-3 pt-3 border-t sticky bottom-0 bg-white z-10 py-2">
                <button
                  type="button"
                  onClick={() => { setIsFormOpen(false); setFormError(null); }}
                  className="px-5 py-2 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-100 font-bold cursor-pointer transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-red-700 hover:bg-red-800 text-white rounded-xl font-bold shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>حفظ بيانات الموظف</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. EXCEL IMPORT WIZARD MODAL */}
      <ExcelImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        existingEmployees={employees}
        existingCareerRecords={careerRecords}
        existingPromotions={promotions}
        existingIncrements={increments}
        existingSettlements={settlements}
        onImportComplete={(result) => {
          if (onImportComplete) {
            onImportComplete(result);
          } else {
            result.employees.forEach((ne) => {
              const exists = employees.some((e) => e.id === ne.id);
              if (exists) onUpdateEmployee(ne);
              else onAddEmployee(ne);
            });
          }
        }}
        currentUser={currentUser}
        onNavigateToTab={onNavigateToTab}
      />

      {/* 7. LIST PRINT MODAL */}
      <EmployeeListPrintModal
        isOpen={isListPrintModalOpen}
        onClose={() => setIsListPrintModalOpen(false)}
        employees={filteredEmployees}
        categoryFilter={selectedCategoryFilter}
        deptFilter={selectedDeptFilter}
      />

      {/* 8. QUICK LEAVE MODAL */}
      {leaveModalEmpId !== null && (
        <LeaveModal
          isOpen={leaveModalEmpId !== null}
          onClose={() => setLeaveModalEmpId(null)}
          employees={employees}
          initialEmpId={leaveModalEmpId}
          leaves={leaves}
          rules={rules}
          onAddLeave={(newLeave) => {
            if (onAddLeave) onAddLeave(newLeave);
          }}
          onPrintLeaveDirectly={(l) => setPrintLeaveRecord(l)}
          currentUser={currentUser}
        />
      )}

      {/* 9. OFFICIAL LEAVE PRINT PREVIEW MODAL */}
      {printLeaveRecord && (
        <OfficialLeavePrintModal
          leave={printLeaveRecord}
          employee={employees.find((e) => e.id === printLeaveRecord.employeeId)}
          onClose={() => setPrintLeaveRecord(null)}
        />
      )}

      {/* 10. INCREMENT HISTORY & BREAKDOWN MODAL */}
      {incrementDetailEmp && (
        <IncrementHistoryModal
          isOpen={incrementDetailEmp !== null}
          onClose={() => setIncrementDetailEmp(null)}
          employee={incrementDetailEmp}
          increments={increments}
          promotions={promotions}
          settlements={settlements}
          generalProcedures={generalProcedures}
          onAddIncrement={onAddIncrement}
          onUpdateEmployeeIncrement={onUpdateEmployeeIncrement}
        />
      )}

      {/* 11. EMPLOYEE REVIEW MODAL */}
      {reviewEmp && (
        <EmployeeReviewModal
          isOpen={reviewEmp !== null}
          onClose={() => setReviewEmp(null)}
          employee={reviewEmp}
          allEmployees={filteredEmployees}
          careerRecords={careerRecords}
          promotions={promotions}
          increments={increments}
          settlements={settlements}
          generalProcedures={generalProcedures}
          qualifications={qualifications}
          leaves={leaves}
          evaluations={evaluations}
          currentUser={currentUser}
          onUpdateEmployee={(updated) => {
            onUpdateEmployee(updated);
            setReviewEmp(updated);
          }}
          onSelectEmployee={(emp) => setReviewEmp(emp)}
        />
      )}

      {/* 12. TEST RECORDS CLEANUP MODAL */}
      <TestRecordsCleanupModal
        isOpen={isCleanupModalOpen}
        onClose={() => setIsCleanupModalOpen(false)}
        fullDatabase={activeDb}
        currentUser={currentUser}
        onCleanupComplete={(newDb, summary) => {
          if (onCleanupComplete) {
            onCleanupComplete(newDb, summary);
          }
          setIsCleanupModalOpen(false);
        }}
      />

      {/* 13. DATABASE FINAL AUDIT MODAL */}
      <DatabaseFinalAuditModal
        isOpen={isAuditModalOpen}
        onClose={() => setIsAuditModalOpen(false)}
        fullDatabase={activeDb}
        currentUser={currentUser}
      />

      {/* 14. REBUILD & AUDIT CURRENT GRADES MODAL */}
      <RebuildCurrentGradesModal
        isOpen={isRebuildGradesModalOpen}
        onClose={() => setIsRebuildGradesModalOpen(false)}
        employees={employees}
        careerRecords={careerRecords}
        promotions={promotions}
        increments={increments}
        settlements={settlements}
        generalProcedures={generalProcedures}
        fullDatabaseState={activeDb}
        onApplyBatchUpdate={(updatedEmps, summary) => {
          if (onCleanupComplete) {
            const newDb: FullAppDatabase = {
              ...activeDb,
              employees: updatedEmps
            };
            onCleanupComplete(newDb, summary);
          } else {
            updatedEmps.forEach((emp) => onUpdateEmployee(emp));
          }
        }}
      />

      {/* 15. GRADE CHRONOLOGY AUDIT & DEBUG MODAL */}
      <GradeChronologyAuditModal
        isOpen={isGradeAuditModalOpen}
        onClose={() => {
          setIsGradeAuditModalOpen(false);
          setAuditInspectEmpId(null);
        }}
        employees={employees}
        careerRecords={careerRecords}
        promotions={promotions}
        increments={increments}
        settlements={settlements}
        generalProcedures={generalProcedures}
        preSelectedEmployeeId={auditInspectEmpId}
      />
    </div>
  );
};
