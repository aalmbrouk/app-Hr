import React, { useState, useMemo } from 'react';
import { 
  Employee, 
  LeaveTransaction, 
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
  EmploymentStatus,
  AssignmentCategory
} from '../types';
import { calculateEmployeeIncrementBreakdown } from '../utils/incrementUtils';
import { formatDateDisplay } from '../utils/dateUtils';
import { getCareerActionMeta, getEmployeeCareerHistory, calculateEmployeeCareerSummary } from '../utils/careerUtils';
import { createNewEvaluation } from '../utils/evaluationUtils';
import { getLatestEffectiveGradeInfo } from '../utils/gradeCalculationEngine';
import { DEPARTMENTS, JOB_TITLES, QUALIFICATIONS } from '../data/initialData';
import { OfficialDisciplinaryLetterModal } from './OfficialDisciplinaryLetterModal';
import { 
  User, 
  Briefcase, 
  Calendar, 
  Award, 
  Zap, 
  Edit3, 
  Printer, 
  Trash2, 
  ChevronLeft,
  ChevronRight,
  FileText, 
  Upload, 
  Download, 
  Eye, 
  Clock, 
  Building2, 
  ShieldAlert, 
  CheckCircle2, 
  Info,
  Paperclip,
  History,
  GraduationCap,
  Plus,
  ArrowRightLeft,
  AlertOctagon,
  FileCheck2,
  ExternalLink,
  TrendingUp,
  LayoutDashboard,
  Check,
  X,
  RotateCcw,
  Save,
  Search,
  SlidersHorizontal,
  FileDown
} from 'lucide-react';
import { EmployeeDossierPrintModal } from './EmployeeDossierPrintModal';
import { EmployeeCareerReportModal } from './EmployeeCareerReportModal';
import { QualificationRecordModal } from './QualificationRecordModal';
import { OfficialQualificationsPrintModal } from './OfficialQualificationsPrintModal';
import { OfficialPerformanceEvaluationModal } from './evaluations/OfficialPerformanceEvaluationModal';
import { EmployeePrintCard } from './EmployeePrintCard';

export type ProfileTabKey = 
  | 'summary'
  | 'personal'
  | 'job'
  | 'grade_increments'
  | 'promotions'
  | 'leaves'
  | 'qualifications'
  | 'procedures'
  | 'disciplinary'
  | 'transfers_resignations'
  | 'documents'
  | 'evaluations';

interface EmployeeProfileViewProps {
  employee: Employee;
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
  onBackToList: () => void;
  onUpdateEmployee: (emp: Employee) => void;
  onDeleteEmployee?: (id: number) => void;
  onOpenLeaveModal?: (empId: number) => void;
  onOpenIncrementDetails?: (emp: Employee) => void;
  onAddQualification?: (record: EmployeeQualificationRecord) => void;
  onUpdateQualification?: (record: EmployeeQualificationRecord) => void;
  onDeleteQualification?: (id: string) => void;
  onSaveEvaluation?: (evaluation: AnnualPerformanceEvaluation) => void;
  onDeleteEvaluation?: (id: string) => void;
  onAddCareerRecord?: (record: CareerPromotionRecord) => void;
  currentUser?: string;
  generalManagerName?: string;
  officialLogoUrl?: string;
}

export const EmployeeProfileView: React.FC<EmployeeProfileViewProps> = ({
  employee,
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
  onBackToList,
  onUpdateEmployee,
  onDeleteEmployee,
  onOpenLeaveModal,
  onOpenIncrementDetails,
  onAddQualification,
  onUpdateQualification,
  onDeleteQualification,
  onSaveEvaluation,
  onDeleteEvaluation,
  onAddCareerRecord,
  currentUser = 'المستخدم الحالي',
  generalManagerName = 'نجيب صالح سالم',
  officialLogoUrl
}) => {
  // Navigation Tab
  const [activeTab, setActiveTab] = useState<ProfileTabKey>('summary');

  // Authoritative Chronological Latest Effective Grade calculation
  const effectiveGradeInfo = useMemo(() => {
    return getLatestEffectiveGradeInfo(employee, {
      careerRecords,
      promotions,
      increments,
      settlements,
      generalProcedures
    });
  }, [employee, careerRecords, promotions, increments, settlements, generalProcedures]);

  // Print Modals
  const [isDossierPrintOpen, setIsDossierPrintOpen] = useState<boolean>(false);
  const [isBadgePrintOpen, setIsBadgePrintOpen] = useState<boolean>(false);
  const [isCareerReportOpen, setIsCareerReportOpen] = useState<boolean>(false);
  const [isQualPrintOpen, setIsQualPrintOpen] = useState<boolean>(false);
  const [activeEvalModalDoc, setActiveEvalModalDoc] = useState<AnnualPerformanceEvaluation | null>(null);
  const [selectedDisciplinaryForLetter, setSelectedDisciplinaryForLetter] = useState<DisciplinaryRecord | null>(null);

  // Section-Level Editing States
  const [isEditingPersonal, setIsEditingPersonal] = useState<boolean>(false);
  const [personalForm, setPersonalForm] = useState({
    fullName: employee.fullName || '',
    nationalId: employee.nationalId || '',
    passportNumber: employee.passportNumber || '',
    nationality: employee.nationality || 'ليبي',
    documentType: employee.documentType || 'الرقم الوطني',
    motherName: employee.motherName || '',
    birthDate: employee.birthDate || '',
    birthPlace: employee.birthPlace || '',
    gender: employee.gender || 'ذكر',
    maritalStatus: employee.maritalStatus || 'أعزب',
    qualification: employee.qualification || '',
    specialization: employee.specialization || '',
    university: employee.university || '',
    graduationYear: employee.graduationYear || '',
    educationType: employee.educationType || 'جامعة عامة'
  });

  const [isEditingJob, setIsEditingJob] = useState<boolean>(false);
  const [jobForm, setJobForm] = useState({
    jobNumber: employee.jobNumber || '',
    status: employee.status || 'على رأس العمل',
    hireDate: employee.hireDate || '',
    directingDate: employee.directingDate || '',
    bloodBankStartDate: employee.bloodBankStartDate || '',
    hiringEntity: employee.hiringEntity || '',
    transferredTo: employee.transferredTo || '',
    cadreNumber: employee.cadreNumber || '',
    assignmentCategory: employee.assignmentCategory || 'إداري',
    department: employee.department || '',
    jobTitle: employee.jobTitle || '',
    phone: employee.phone || '',
    email: employee.email || '',
    notes: employee.notes || ''
  });

  const [isEditingGrades, setIsEditingGrades] = useState<boolean>(false);
  const [gradesForm, setGradesForm] = useState({
    appointmentSalarySystem: employee.appointmentSalarySystem || 'جدول مرتبات القانون 15',
    appointmentGrade: employee.appointmentGrade || 'الدرجة الأولى',
    appointmentIncrements: employee.appointmentIncrements ?? 0,
    salaryScale: employee.salaryScale || 'جدول المرتبات الموحد',
    jobGrade: employee.jobGrade || 'الدرجة الرابعة',
    currentIncrement: employee.currentIncrement || 1,
    gradeEntryDate: employee.gradeEntryDate || '',
    lastIncrementDate: employee.lastIncrementDate || '',
    nextIncrementDate: employee.nextIncrementDate || '',
    eligibilityDate: employee.eligibilityDate || ''
  });

  // Success Feedback Toast
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);

  // Qualifications modal
  const [isQualModalOpen, setIsQualModalOpen] = useState(false);
  const [editingQualRecord, setEditingQualRecord] = useState<EmployeeQualificationRecord | null>(null);

  // Document upload state
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);
  const [documentCategory, setDocumentCategory] = useState<string>('وثيقة رسمية');
  const [documentTitle, setDocumentTitle] = useState<string>('');

  // Table filters & searches inside tabs
  const [promoFilter, setPromoFilter] = useState<string>('');
  const [leaveFilter, setLeaveFilter] = useState<string>('الكل');

  // Calculations
  const breakdown = calculateEmployeeIncrementBreakdown(
    employee,
    increments,
    promotions,
    settlements,
    generalProcedures
  );

  const employeeEvaluations = (evaluations || [])
    .filter((e) => e.employeeId === employee.id)
    .sort((a, b) => b.evaluationYear - a.evaluationYear);

  const employeeLeaves = leaves.filter((l) => l.employeeId === employee.id);
  const employeeQuals = qualifications.filter((q) => q.employeeId === employee.id);
  const employeeTransfers = transfers.filter((t) => t.employeeId === employee.id);
  const employeeSecondments = secondments.filter((s) => s.employeeId === employee.id);
  const employeeDisciplinary = disciplinary.filter((d) => d.employeeId === employee.id);
  const employeeProcedures = generalProcedures.filter((p) => p.employeeId === employee.id);
  const employeeResignations = resignations.filter((r) => r.employeeId === employee.id);

  const fullCareerHistory = getEmployeeCareerHistory(
    employee.id,
    careerRecords,
    promotions,
    increments,
    settlements
  );

  const careerSummary = calculateEmployeeCareerSummary(
    employee,
    careerRecords,
    promotions,
    increments,
    settlements
  );

  // Leave balance statistics
  const totalLeaveDaysUsed = employeeLeaves.reduce((sum, l) => sum + (l.daysCount || 0), 0);
  const annualLeaveDaysUsed = employeeLeaves
    .filter((l) => l.leaveType === 'سنوية')
    .reduce((sum, l) => sum + (l.daysCount || 0), 0);
  const estimatedLeaveBalance = 30; // Standard annual entitlement
  const remainingLeaveDays = Math.max(0, estimatedLeaveBalance - annualLeaveDaysUsed);

  // Show Toast
  const triggerToast = (msg: string) => {
    setSaveFeedback(msg);
    setTimeout(() => setSaveFeedback(null), 3500);
  };

  // Section Save Handlers
  const handleSavePersonal = () => {
    if (!personalForm.fullName.trim()) {
      alert('يرجى كتابة اسم الموظف كاملاً.');
      return;
    }
    const updated: Employee = {
      ...employee,
      ...personalForm,
      updatedAt: new Date().toISOString()
    };
    onUpdateEmployee(updated);
    setIsEditingPersonal(false);
    triggerToast('تم حفظ البيانات الشخصية بنجاح.');
  };

  const handleSaveJob = () => {
    if (!jobForm.jobNumber.trim()) {
      alert('يرجى تحديد الرقم الوظيفي / رقم الملف.');
      return;
    }
    const updated: Employee = {
      ...employee,
      ...jobForm,
      updatedAt: new Date().toISOString()
    };
    onUpdateEmployee(updated);
    setIsEditingJob(false);
    triggerToast('تم حفظ البيانات الوظيفية بنجاح.');
  };

  const handleSaveGrades = () => {
    const updated: Employee = {
      ...employee,
      ...gradesForm,
      updatedAt: new Date().toISOString()
    };
    onUpdateEmployee(updated);
    setIsEditingGrades(false);
    triggerToast('تم حفظ بيانات الدرجة والعلاوات بنجاح.');
  };

  // File Upload Handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingDoc(true);
    const reader = new FileReader();
    reader.onload = () => {
      const base64Data = reader.result as string;
      const titleToSave = documentTitle.trim() || file.name;
      const updated: Employee = {
        ...employee,
        pdfPath: base64Data,
        pdfFileName: titleToSave,
        updatedAt: new Date().toISOString()
      };
      onUpdateEmployee(updated);
      setIsUploadingDoc(false);
      setDocumentTitle('');
      triggerToast('تم رفع وأرشفة الوثيقة بنجاح.');
    };
    reader.onerror = () => {
      alert('تعذر قراءة الملف.');
      setIsUploadingDoc(false);
    };
    reader.readAsDataURL(file);
  };

  const handleDeleteDocument = () => {
    const ok = window.confirm('هل أنت متأكد من حذف الوثيقة المؤرشفة؟');
    if (ok) {
      const updated: Employee = {
        ...employee,
        pdfPath: '',
        pdfFileName: undefined,
        updatedAt: new Date().toISOString()
      };
      onUpdateEmployee(updated);
      triggerToast('تم حذف الوثيقة بنجاح.');
    }
  };

  // Status Styling
  const getStatusBadge = (status: EmploymentStatus | string) => {
    if (status === 'على رأس العمل') {
      return {
        bg: 'bg-emerald-50 text-emerald-800 border-emerald-300',
        dot: 'bg-emerald-600',
        label: 'على رأس العمل'
      };
    }
    if (status.includes('إجازة')) {
      return {
        bg: 'bg-amber-50 text-amber-900 border-amber-300',
        dot: 'bg-amber-600',
        label: status
      };
    }
    if (status === 'منقول' || status === 'نقل خارجي') {
      return {
        bg: 'bg-blue-50 text-blue-900 border-blue-300',
        dot: 'bg-blue-600',
        label: status
      };
    }
    if (status === 'مستقيل' || status === 'نهاية خدمة' || status === 'متقاعد') {
      return {
        bg: 'bg-red-50 text-red-900 border-red-300',
        dot: 'bg-red-600',
        label: status
      };
    }
    if (status.includes('خارج الملاك') || status === 'منتدب') {
      return {
        bg: 'bg-purple-50 text-purple-900 border-purple-300',
        dot: 'bg-purple-600',
        label: status
      };
    }
    return {
      bg: 'bg-gray-100 text-gray-800 border-gray-300',
      dot: 'bg-gray-500',
      label: status
    };
  };

  const statusBadge = getStatusBadge(employee.status);
  const isLibyan = employee.nationality === 'ليبي' || !employee.nationality;

  // Tabs List Config
  const tabsList: { key: ProfileTabKey; label: string; icon: React.FC<{ className?: string }>; count?: number }[] = [
    { key: 'summary', label: 'الملخص', icon: LayoutDashboard },
    { key: 'personal', label: 'البيانات الشخصية', icon: User },
    { key: 'job', label: 'البيانات الوظيفية', icon: Briefcase },
    { key: 'grade_increments', label: 'الدرجة والعلاوات', icon: Award },
    { key: 'promotions', label: 'بيانات الترقيات الوظيفية', icon: TrendingUp, count: fullCareerHistory.length },
    { key: 'leaves', label: 'الإجازات', icon: Calendar, count: employeeLeaves.length },
    { key: 'qualifications', label: 'المؤهلات والدورات', icon: GraduationCap, count: employeeQuals.length + (employee.qualification ? 1 : 0) },
    { key: 'procedures', label: 'الإجراءات الوظيفية', icon: Zap, count: employeeProcedures.length },
    { key: 'disciplinary', label: 'الخصومات والإنذارات', icon: ShieldAlert, count: employeeDisciplinary.length },
    { key: 'transfers_resignations', label: 'النقل والاستقالات ونهاية الخدمة', icon: ArrowRightLeft, count: employeeTransfers.length + employeeSecondments.length + employeeResignations.length },
    { key: 'documents', label: 'الوثائق', icon: Paperclip, count: employee.pdfPath ? 1 : 0 },
    { key: 'evaluations', label: 'تقارير الكفاءة السنوية', icon: FileCheck2, count: employeeEvaluations.length }
  ];

  return (
    <div className="w-full space-y-4 pb-12 animate-fadeIn" dir="rtl">
      
      {/* Toast Feedback */}
      {saveFeedback && (
        <div className="fixed bottom-6 left-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl border border-emerald-500/50 flex items-center gap-3 animate-slideUp">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-bold">{saveFeedback}</span>
        </div>
      )}

      {/* TOP COMPACT PROFILE HEADER */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs p-4 sm:p-5 space-y-4">
        
        {/* Navigation & Action Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-3">
          <button
            type="button"
            onClick={onBackToList}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg text-xs font-bold transition cursor-pointer shadow-2xs border border-gray-200"
          >
            <ChevronRight className="w-4 h-4 text-gray-600" />
            <span>العودة إلى قائمة الموظفين</span>
          </button>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                if (activeTab === 'personal') setIsEditingPersonal(!isEditingPersonal);
                else if (activeTab === 'job') setIsEditingJob(!isEditingJob);
                else if (activeTab === 'grade_increments') setIsEditingGrades(!isEditingGrades);
                else setActiveTab('personal');
              }}
              className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold transition flex items-center gap-1.5 border border-slate-300 cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5 text-slate-600" />
              <span>تعديل</span>
            </button>

            <button
              type="button"
              onClick={() => setIsDossierPrintOpen(true)}
              className="px-3.5 py-1.5 bg-red-700 hover:bg-red-800 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>طباعة ملف الموظف</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('documents')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border ${
                activeTab === 'documents'
                  ? 'bg-amber-600 text-white border-amber-600 shadow-2xs'
                  : 'bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-200'
              }`}
            >
              <Paperclip className="w-3.5 h-3.5 text-amber-600" />
              <span>الوثائق</span>
              {employee.pdfPath && (
                <span className="w-2 h-2 rounded-full bg-emerald-500" title="توجد وثائق مرفقة" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setIsBadgePrintOpen(true)}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            >
              <Award className="w-3.5 h-3.5 text-amber-400" />
              <span>بطاقة التعريف</span>
            </button>
          </div>
        </div>

        {/* Employee Summary Card */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          
          <div className="flex items-center gap-3.5 min-w-0">
            {/* Avatar / Icon */}
            <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-slate-800 to-red-950 text-white flex items-center justify-center font-black text-lg shrink-0 shadow-md border border-slate-700">
              {employee.fullName.slice(0, 2) || <User className="w-6 h-6" />}
            </div>

            <div className="space-y-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-gray-950 truncate">
                  {employee.fullName}
                </h2>
                {!isLibyan && (
                  <span className="text-[11px] bg-blue-100 text-blue-900 border border-blue-300 px-2 py-0.2 rounded-md font-bold">
                    {employee.nationality || 'وافد'}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-600">
                <div className="flex items-center gap-1">
                  <span className="text-gray-400">الرقم الوظيفي:</span>
                  <span className="font-mono font-bold text-red-900 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                    {employee.jobNumber}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <span className="text-gray-400">الرقم الوطني:</span>
                  <span className="font-mono font-semibold text-gray-900">
                    {isLibyan ? (employee.nationalId || '—') : (employee.passportNumber || employee.nationalId || '—')}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <span className="text-gray-400">القسم:</span>
                  <span className="font-semibold text-gray-800">{employee.department}</span>
                </div>

                <div className="flex items-center gap-1">
                  <span className="text-gray-400">الوظيفة:</span>
                  <span className="font-semibold text-gray-800">{employee.jobTitle}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Status & Current Grade Badges */}
          <div className="flex flex-wrap items-center gap-3 shrink-0 self-stretch md:self-auto justify-between md:justify-end border-t md:border-t-0 pt-2 md:pt-0 border-gray-100">
            {/* Grade Pill (Authoritative Chronological Latest Effective Grade) */}
            <div className="text-right bg-amber-50/80 border border-amber-200 rounded-xl px-3.5 py-1.5">
              <div className="flex items-center gap-1.5 justify-end">
                <span className="block text-[10px] font-bold text-amber-800">الدرجة الحالية (النافذة)</span>
                {effectiveGradeInfo.isDifferentFromRecorded && (
                  <span 
                    className="text-[9px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-1 py-0.2 rounded"
                    title={`محدثة زمنياً وفق أحدث إجراء: ${effectiveGradeInfo.latestGradeAction} (${effectiveGradeInfo.effectiveDate || '-'})`}
                  >
                    محدثة
                  </span>
                )}
              </div>
              <span className="text-xs font-black text-slate-900 flex items-center gap-1 mt-0.5">
                <span>{effectiveGradeInfo.displayedCurrentGrade || employee.jobGrade || '—'}</span>
                <span className="text-[10px] text-amber-800 bg-amber-200/70 px-1 rounded">
                  +{effectiveGradeInfo.currentIncrement} علاوة
                </span>
              </span>
            </div>

            {/* Employment Status Badge */}
            <div className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold border shadow-2xs ${statusBadge.bg}`}>
              <span className={`w-2.5 h-2.5 rounded-full ${statusBadge.dot} animate-pulse`} />
              <span>{statusBadge.label}</span>
            </div>
          </div>

        </div>

      </div>

      {/* 12 PROFILE NAVIGATION TABS */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-2xs p-1.5 overflow-x-auto scrollbar-thin">
        <div className="flex items-center gap-1 min-w-max">
          {tabsList.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-red-800 text-white shadow-2xs'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-gray-500'}`} />
                <span>{tab.label}</span>
                {typeof tab.count === 'number' && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                    isActive ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB 1: SUMMARY DASHBOARD */}
      {activeTab === 'summary' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            
            {/* Card 1: Basic Info */}
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                <h3 className="text-xs font-black text-gray-900 flex items-center gap-1.5">
                  <User className="w-4 h-4 text-red-700" />
                  <span>المعلومات الأساسية</span>
                </h3>
                <span className="text-[11px] font-mono text-gray-400">#{employee.id}</span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 font-bold">الاسم:</span>
                  <span className="font-bold text-gray-900">{employee.fullName}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 font-bold">الرقم الوظيفي / رقم الملف:</span>
                  <span className="font-mono font-bold text-red-900 bg-red-50 px-1.5 py-0.5 rounded">{employee.jobNumber}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 font-bold">الرقم الوطني / الوثيقة:</span>
                  <span className="font-mono font-semibold text-gray-800">
                    {isLibyan ? (employee.nationalId || '—') : (employee.passportNumber || employee.nationalId || '—')}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 font-bold">تاريخ الميلاد:</span>
                  <span className="font-mono text-gray-800">{formatDateDisplay(employee.birthDate) || '—'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 font-bold">الجنسية:</span>
                  <span className="font-semibold text-gray-800">{employee.nationality || 'ليبي'}</span>
                </div>
              </div>
            </div>

            {/* Card 2: Employment Status */}
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                <h3 className="text-xs font-black text-gray-900 flex items-center gap-1.5">
                  <Briefcase className="w-4 h-4 text-blue-700" />
                  <span>الوضع الوظيفي</span>
                </h3>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${statusBadge.bg}`}>
                  {employee.status}
                </span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 font-bold">الحالة الوظيفية:</span>
                  <span className="font-bold text-emerald-900">{employee.status}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 font-bold">الإدارة / القسم:</span>
                  <span className="font-semibold text-gray-900">{employee.department}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 font-bold">الوظيفة:</span>
                  <span className="font-semibold text-gray-900">{employee.jobTitle}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 font-bold">الفئة الوظيفية:</span>
                  <span className="font-bold text-gray-800 bg-gray-100 px-2 py-0.5 rounded text-[11px]">
                    {employee.assignmentCategory}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 font-bold">رقم الملاك:</span>
                  <span className="font-mono font-semibold text-gray-800">{employee.cadreNumber || '—'}</span>
                </div>
              </div>
            </div>

            {/* Card 3: Grade & Increments */}
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                <h3 className="text-xs font-black text-gray-900 flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-amber-700" />
                  <span>الدرجة والعلاوات</span>
                </h3>
                <span className="text-[11px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  {effectiveGradeInfo.displayedCurrentGrade}
                </span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 font-bold">نظام الدرجة المعين عليها:</span>
                  <span className="font-bold text-slate-800">{employee.appointmentSalarySystem || 'جدول مرتبات القانون 15'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 font-bold">الدرجة المعين عليها (الأولى):</span>
                  <span className="font-bold text-amber-900">{employee.appointmentGrade || effectiveGradeInfo.firstRecordedGrade || '—'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 font-bold">الدرجة الحالية (النافذة):</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-black text-red-900">{effectiveGradeInfo.displayedCurrentGrade}</span>
                    {effectiveGradeInfo.isDifferentFromRecorded && (
                      <span className="text-[9px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-1.5 py-0.2 rounded" title={`محدثة زمنياً وفق: ${effectiveGradeInfo.latestGradeAction}`}>
                        محدثة وفق أحدث إجراء
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 font-bold">عدد العلاوات:</span>
                  <span className="font-mono font-bold text-gray-900">{effectiveGradeInfo.currentIncrement} علاوة</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 font-bold">تاريخ الدرجة الحالية:</span>
                  <span className="font-mono text-gray-800">{formatDateDisplay(effectiveGradeInfo.gradeEntryDate || employee.gradeEntryDate) || '—'}</span>
                </div>
              </div>
            </div>

            {/* Card 4: Important Dates */}
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                <h3 className="text-xs font-black text-gray-900 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-emerald-700" />
                  <span>المواعيد المهمة</span>
                </h3>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 font-bold">تاريخ التعيين:</span>
                  <span className="font-mono font-semibold text-gray-900">{formatDateDisplay(employee.hireDate) || '—'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 font-bold">تاريخ المباشرة العامة:</span>
                  <span className="font-mono font-semibold text-gray-900">{formatDateDisplay(employee.directingDate) || '—'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 font-bold">المباشرة بمصرف الدم:</span>
                  <span className="font-mono font-bold text-red-900">{formatDateDisplay(employee.bloodBankStartDate) || '—'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 font-bold">موعد العلاوة القادمة:</span>
                  <span className="font-mono font-bold text-emerald-800">{formatDateDisplay(employee.nextIncrementDate) || '—'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 font-bold">موعد استحقاق الترقية:</span>
                  <span className="font-mono font-bold text-blue-800">{formatDateDisplay(employee.eligibilityDate) || '—'}</span>
                </div>
              </div>
            </div>

            {/* Card 5: Leaves Statistics */}
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                <h3 className="text-xs font-black text-gray-900 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-purple-700" />
                  <span>الإجازات</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setActiveTab('leaves')}
                  className="text-[11px] text-purple-700 font-bold hover:underline"
                >
                  عرض السجل
                </button>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 font-bold">الرصيد السنوي التقديري:</span>
                  <span className="font-mono font-bold text-gray-900">{estimatedLeaveBalance} يوم</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 font-bold">المستخدم من الإجازات:</span>
                  <span className="font-mono font-bold text-amber-800">{totalLeaveDaysUsed} يوم</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 font-bold">المتبقي التقديري:</span>
                  <span className="font-mono font-black text-emerald-800">{remainingLeaveDays} يوم</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 font-bold">إجمالي طلبات الإجازة:</span>
                  <span className="font-mono font-semibold text-gray-800">{employeeLeaves.length} طلب</span>
                </div>
              </div>
            </div>

            {/* Card 6: Documents & Evaluations */}
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                <h3 className="text-xs font-black text-gray-900 flex items-center gap-1.5">
                  <Paperclip className="w-4 h-4 text-amber-700" />
                  <span>الوثائق والتقارير</span>
                </h3>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 font-bold">الوثائق المؤرشفة:</span>
                  <span className="font-mono font-bold text-gray-900">{employee.pdfPath ? '1 وثيقة مرفقة' : 'لا توجد'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 font-bold">تقارير الكفاءة السنوية:</span>
                  <span className="font-mono font-bold text-purple-900">{employeeEvaluations.length} تقرير</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 font-bold">المؤهلات والدورات:</span>
                  <span className="font-mono font-bold text-blue-900">{employeeQuals.length + (employee.qualification ? 1 : 0)} سجل</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 font-bold">الإجراءات الوظيفية:</span>
                  <span className="font-mono font-bold text-gray-900">{employeeProcedures.length} إجراء</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* TAB 2: PERSONAL INFORMATION */}
      {activeTab === 'personal' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-2xs p-5 space-y-5">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div>
              <h3 className="text-sm font-black text-gray-900 flex items-center gap-2">
                <User className="w-4 h-4 text-red-700" />
                <span>البيانات الشخصية والتعريفية للموظف</span>
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                المعلومات الرسمية الخاصة بالهوية، الميلاد، والمؤهل العلمي الأساسي.
              </p>
            </div>

            {!isEditingPersonal ? (
              <button
                type="button"
                onClick={() => setIsEditingPersonal(true)}
                className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold transition flex items-center gap-1.5 border border-slate-300 cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5 text-slate-600" />
                <span>تعديل البيانات الشخصية</span>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditingPersonal(false)}
                  className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-bold transition cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={handleSavePersonal}
                  className="px-4 py-1.5 bg-red-700 hover:bg-red-800 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>حفظ التعديلات</span>
                </button>
              </div>
            )}
          </div>

          {!isEditingPersonal ? (
            /* View Mode */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 space-y-1">
                <span className="text-gray-500 font-bold block">اسم الموظف كاملاً:</span>
                <span className="font-black text-gray-900 text-sm">{employee.fullName}</span>
              </div>

              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 space-y-1">
                <span className="text-gray-500 font-bold block">الرقم الوطني / وثيقة الهوية:</span>
                <span className="font-mono font-bold text-gray-900 text-sm">
                  {isLibyan ? (employee.nationalId || '—') : (employee.passportNumber || employee.nationalId || '—')}
                </span>
              </div>

              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 space-y-1">
                <span className="text-gray-500 font-bold block">الجنسية:</span>
                <span className="font-semibold text-gray-900">{employee.nationality || 'ليبي'}</span>
              </div>

              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 space-y-1">
                <span className="text-gray-500 font-bold block">اسم الأم:</span>
                <span className="font-semibold text-gray-900">{employee.motherName || '—'}</span>
              </div>

              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 space-y-1">
                <span className="text-gray-500 font-bold block">تاريخ الميلاد:</span>
                <span className="font-mono font-semibold text-gray-900">{formatDateDisplay(employee.birthDate) || '—'}</span>
              </div>

              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 space-y-1">
                <span className="text-gray-500 font-bold block">مكان الميلاد:</span>
                <span className="font-semibold text-gray-900">{employee.birthPlace || '—'}</span>
              </div>

              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 space-y-1">
                <span className="text-gray-500 font-bold block">الجنس / الحالة الاجتماعية:</span>
                <span className="font-semibold text-gray-900">{employee.gender || 'ذكر'} - {employee.maritalStatus || 'أعزب'}</span>
              </div>

              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 space-y-1">
                <span className="text-gray-500 font-bold block">المؤهل العلمي الأساسي:</span>
                <span className="font-bold text-blue-950">{employee.qualification || '—'}</span>
              </div>

              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 space-y-1">
                <span className="text-gray-500 font-bold block">التخصص الدقيق:</span>
                <span className="font-semibold text-gray-900">{employee.specialization || '—'}</span>
              </div>

              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 space-y-1">
                <span className="text-gray-500 font-bold block">الجامعة / المعهد:</span>
                <span className="font-semibold text-gray-900">{employee.university || '—'}</span>
              </div>

              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 space-y-1">
                <span className="text-gray-500 font-bold block">سنة التخرج:</span>
                <span className="font-mono font-bold text-gray-900">{employee.graduationYear || '—'}</span>
              </div>

              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 space-y-1">
                <span className="text-gray-500 font-bold block">نوع التعليم:</span>
                <span className="font-semibold text-gray-900">{employee.educationType || 'جامعة عامة'}</span>
              </div>
            </div>
          ) : (
            /* Edit Mode */
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">اسم الموظف *</label>
                <input
                  type="text"
                  value={personalForm.fullName}
                  onChange={(e) => setPersonalForm({ ...personalForm, fullName: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-red-600 outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">الجنسية *</label>
                <select
                  value={personalForm.nationality}
                  onChange={(e) => setPersonalForm({ ...personalForm, nationality: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-red-600 outline-none"
                >
                  <option value="ليبي">ليبي</option>
                  <option value="مصري">مصري</option>
                  <option value="تونسي">تونسي</option>
                  <option value="سوداني">سوداني</option>
                  <option value="فلسطيني">فلسطيني</option>
                  <option value="أخرى">أخرى</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">الرقم الوطني / جواز السفر *</label>
                <input
                  type="text"
                  value={personalForm.nationality === 'ليبي' ? personalForm.nationalId : (personalForm.passportNumber || personalForm.nationalId)}
                  onChange={(e) => {
                    if (personalForm.nationality === 'ليبي') {
                      setPersonalForm({ ...personalForm, nationalId: e.target.value });
                    } else {
                      setPersonalForm({ ...personalForm, passportNumber: e.target.value, nationalId: e.target.value });
                    }
                  }}
                  className="w-full p-2 border border-gray-300 rounded-lg text-xs font-mono font-bold focus:ring-2 focus:ring-red-600 outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">اسم الأم</label>
                <input
                  type="text"
                  value={personalForm.motherName}
                  onChange={(e) => setPersonalForm({ ...personalForm, motherName: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-red-600 outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">تاريخ الميلاد</label>
                <input
                  type="date"
                  value={personalForm.birthDate}
                  onChange={(e) => setPersonalForm({ ...personalForm, birthDate: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-red-600 outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">مكان الميلاد</label>
                <input
                  type="text"
                  value={personalForm.birthPlace}
                  onChange={(e) => setPersonalForm({ ...personalForm, birthPlace: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-red-600 outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">المؤهل العلمي الأساسي</label>
                <select
                  value={personalForm.qualification}
                  onChange={(e) => setPersonalForm({ ...personalForm, qualification: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-red-600 outline-none"
                >
                  <option value="">اختر المؤهل</option>
                  {QUALIFICATIONS.map((q) => (
                    <option key={q} value={q}>{q}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">التخصص الدقيق</label>
                <input
                  type="text"
                  value={personalForm.specialization}
                  onChange={(e) => setPersonalForm({ ...personalForm, specialization: e.target.value })}
                  placeholder="مثال: تحليل طبي / كيمياء حيوية"
                  className="w-full p-2 border border-gray-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-red-600 outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">الجامعة / المعهد</label>
                <input
                  type="text"
                  value={personalForm.university}
                  onChange={(e) => setPersonalForm({ ...personalForm, university: e.target.value })}
                  placeholder="مثال: جامعة بنغازي"
                  className="w-full p-2 border border-gray-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-red-600 outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">سنة التخرج</label>
                <input
                  type="text"
                  value={personalForm.graduationYear}
                  onChange={(e) => setPersonalForm({ ...personalForm, graduationYear: e.target.value })}
                  placeholder="2020"
                  className="w-full p-2 border border-gray-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-red-600 outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">نوع التعليم</label>
                <select
                  value={personalForm.educationType}
                  onChange={(e) => setPersonalForm({ ...personalForm, educationType: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-red-600 outline-none"
                >
                  <option value="جامعة عامة">جامعة عامة</option>
                  <option value="جامعة خاصة">جامعة خاصة</option>
                  <option value="معهد عالي">معهد عالي</option>
                  <option value="معهد متوسط">معهد متوسط</option>
                  <option value="غير منطبق">غير منطبق</option>
                </select>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: EMPLOYMENT INFORMATION */}
      {activeTab === 'job' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-2xs p-5 space-y-5">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div>
              <h3 className="text-sm font-black text-gray-900 flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-blue-700" />
                <span>البيانات الوظيفية والتعيين</span>
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                بيانات ملف الموظف، تاريخ المباشرة، القسم، الوظيفة والاتصال.
              </p>
            </div>

            {!isEditingJob ? (
              <button
                type="button"
                onClick={() => setIsEditingJob(true)}
                className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold transition flex items-center gap-1.5 border border-slate-300 cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5 text-slate-600" />
                <span>تعديل البيانات الوظيفية</span>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditingJob(false)}
                  className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-bold transition cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={handleSaveJob}
                  className="px-4 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>حفظ التعديلات</span>
                </button>
              </div>
            )}
          </div>

          {!isEditingJob ? (
            /* View Mode */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 space-y-1">
                <span className="text-gray-500 font-bold block">الرقم الوظيفي / رقم الملف:</span>
                <span className="font-mono font-bold text-red-900 text-sm">{employee.jobNumber}</span>
              </div>

              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 space-y-1">
                <span className="text-gray-500 font-bold block">الوضع الوظيفي:</span>
                <span className="font-black text-emerald-900">{employee.status}</span>
              </div>

              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 space-y-1">
                <span className="text-gray-500 font-bold block">تاريخ التعيين (الأصلي):</span>
                <span className="font-mono font-semibold text-gray-900">{formatDateDisplay(employee.hireDate) || '—'}</span>
              </div>

              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 space-y-1">
                <span className="text-gray-500 font-bold block">تاريخ المباشرة العامة:</span>
                <span className="font-mono font-semibold text-gray-900">{formatDateDisplay(employee.directingDate) || '—'}</span>
              </div>

              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 space-y-1">
                <span className="text-gray-500 font-bold block">تاريخ المباشرة بمصرف الدم:</span>
                <span className="font-mono font-bold text-red-900">{formatDateDisplay(employee.bloodBankStartDate) || '—'}</span>
              </div>

              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 space-y-1">
                <span className="text-gray-500 font-bold block">جهة التعيين:</span>
                <span className="font-semibold text-gray-900">{employee.hiringEntity || 'وزارة الصحة'}</span>
              </div>

              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 space-y-1">
                <span className="text-gray-500 font-bold block">القسم / الإدارة:</span>
                <span className="font-semibold text-gray-900">{employee.department}</span>
              </div>

              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 space-y-1">
                <span className="text-gray-500 font-bold block">الوظيفة الحالية:</span>
                <span className="font-semibold text-gray-900">{employee.jobTitle}</span>
              </div>

              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 space-y-1">
                <span className="text-gray-500 font-bold block">رقم الملاك / ملاك الموظف:</span>
                <span className="font-mono font-semibold text-gray-900">{employee.cadreNumber || '—'}</span>
              </div>

              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 space-y-1">
                <span className="text-gray-500 font-bold block">رقم الهاتف:</span>
                <span className="font-mono font-semibold text-gray-900">{employee.phone || '—'}</span>
              </div>

              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 space-y-1">
                <span className="text-gray-500 font-bold block">البريد الإلكتروني:</span>
                <span className="font-mono text-gray-900">{employee.email || '—'}</span>
              </div>

              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 space-y-1">
                <span className="text-gray-500 font-bold block">ملاحظات إدارية:</span>
                <span className="text-gray-800">{employee.notes || 'لا توجد ملاحظات'}</span>
              </div>
            </div>
          ) : (
            /* Edit Mode */
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">الرقم الوظيفي / رقم الملف *</label>
                <input
                  type="text"
                  value={jobForm.jobNumber}
                  onChange={(e) => setJobForm({ ...jobForm, jobNumber: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg text-xs font-mono font-bold focus:ring-2 focus:ring-blue-600 outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">الوضع الوظيفي *</label>
                <select
                  value={jobForm.status}
                  onChange={(e) => setJobForm({ ...jobForm, status: e.target.value as EmploymentStatus })}
                  className="w-full p-2 border border-gray-300 rounded-lg text-xs font-bold focus:ring-2 focus:ring-blue-600 outline-none"
                >
                  <option value="على رأس العمل">على رأس العمل</option>
                  <option value="إجازة">إجازة</option>
                  <option value="إجازة مرضية">إجازة مرضية</option>
                  <option value="إجازة بدون مرتب">إجازة بدون مرتب</option>
                  <option value="منتدب">منتدب</option>
                  <option value="منقول">منقول</option>
                  <option value="مستقيل">مستقيل</option>
                  <option value="نهاية خدمة">نهاية خدمة</option>
                  <option value="متقاعد">متقاعد</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">القسم / الإدارة</label>
                <select
                  value={jobForm.department}
                  onChange={(e) => setJobForm({ ...jobForm, department: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-blue-600 outline-none"
                >
                  {DEPARTMENTS.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">الوظيفة</label>
                <input
                  type="text"
                  value={jobForm.jobTitle}
                  onChange={(e) => setJobForm({ ...jobForm, jobTitle: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-blue-600 outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">الكادر / الفئة</label>
                <select
                  value={jobForm.assignmentCategory}
                  onChange={(e) => setJobForm({ ...jobForm, assignmentCategory: e.target.value as AssignmentCategory })}
                  className="w-full p-2 border border-gray-300 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-blue-600 outline-none"
                >
                  <option value="إداري">إداري</option>
                  <option value="طبي">طبي</option>
                  <option value="خدمات مساعدة">خدمات مساعدة</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">رقم الملاك</label>
                <input
                  type="text"
                  value={jobForm.cadreNumber}
                  onChange={(e) => setJobForm({ ...jobForm, cadreNumber: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-blue-600 outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">تاريخ التعيين</label>
                <input
                  type="date"
                  value={jobForm.hireDate}
                  onChange={(e) => setJobForm({ ...jobForm, hireDate: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-600 outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">تاريخ المباشرة العامة</label>
                <input
                  type="date"
                  value={jobForm.directingDate}
                  onChange={(e) => setJobForm({ ...jobForm, directingDate: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-600 outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">المباشرة بمصرف الدم</label>
                <input
                  type="date"
                  value={jobForm.bloodBankStartDate}
                  onChange={(e) => setJobForm({ ...jobForm, bloodBankStartDate: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-600 outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">جهة التعيين</label>
                <input
                  type="text"
                  value={jobForm.hiringEntity}
                  onChange={(e) => setJobForm({ ...jobForm, hiringEntity: e.target.value })}
                  placeholder="مثال: وزارة الصحة"
                  className="w-full p-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-600 outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">رقم الهاتف</label>
                <input
                  type="text"
                  value={jobForm.phone}
                  onChange={(e) => setJobForm({ ...jobForm, phone: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-blue-600 outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">البريد الإلكتروني</label>
                <input
                  type="email"
                  value={jobForm.email}
                  onChange={(e) => setJobForm({ ...jobForm, email: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-blue-600 outline-none"
                />
              </div>

              <div className="col-span-1 md:col-span-3">
                <label className="block text-[11px] font-bold text-gray-700 mb-1">ملاحظات إدارية</label>
                <textarea
                  rows={2}
                  value={jobForm.notes}
                  onChange={(e) => setJobForm({ ...jobForm, notes: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-600 outline-none"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: GRADE & INCREMENTS */}
      {activeTab === 'grade_increments' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-2xs p-5 space-y-6">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div>
              <h3 className="text-sm font-black text-gray-900 flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-700" />
                <span>الدرجة والعلاوات (التعيين الأصلي مقابل الوضع الحالي)</span>
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                الفصل الصريح بين بيانات التعيين الأصلية والتدرج الوظيفي المالي الحالي.
              </p>
            </div>

            {!isEditingGrades ? (
              <button
                type="button"
                onClick={() => setIsEditingGrades(true)}
                className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold transition flex items-center gap-1.5 border border-slate-300 cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5 text-slate-600" />
                <span>تعديل الدرجة والعلاوات</span>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditingGrades(false)}
                  className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-bold transition cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={handleSaveGrades}
                  className="px-4 py-1.5 bg-amber-700 hover:bg-amber-800 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>حفظ التعديلات</span>
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Section 1: Appointment Data */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
              <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                <div className="w-2.5 h-2.5 rounded-full bg-slate-600" />
                <h4 className="text-xs font-black text-slate-900">1. بيانات التعيين الأصلية</h4>
              </div>

              {!isEditingGrades ? (
                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between items-center bg-white p-2.5 rounded-lg border border-slate-200">
                    <span className="text-gray-500 font-bold">نظام الدرجة المعين عليها:</span>
                    <span className="font-bold text-slate-900">{employee.appointmentSalarySystem || 'جدول مرتبات القانون 15'}</span>
                  </div>
                  <div className="flex justify-between items-center bg-white p-2.5 rounded-lg border border-slate-200">
                    <span className="text-gray-500 font-bold">الدرجة المعين عليها:</span>
                    <span className="font-black text-amber-900">{employee.appointmentGrade || '—'}</span>
                  </div>
                  <div className="flex justify-between items-center bg-white p-2.5 rounded-lg border border-slate-200">
                    <span className="text-gray-500 font-bold">عدد العلاوات عند التعيين:</span>
                    <span className="font-mono font-bold text-gray-900">{employee.appointmentIncrements ?? 0} علاوة</span>
                  </div>
                  <div className="flex justify-between items-center bg-white p-2.5 rounded-lg border border-slate-200">
                    <span className="text-gray-500 font-bold">تاريخ التعيين الأساسي:</span>
                    <span className="font-mono font-semibold text-gray-900">{formatDateDisplay(employee.hireDate) || '—'}</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">نظام الدرجة المعين عليها *</label>
                    <select
                      value={gradesForm.appointmentSalarySystem}
                      onChange={(e) => setGradesForm({ ...gradesForm, appointmentSalarySystem: e.target.value as AppointmentSalarySystem })}
                      className="w-full p-2 border border-gray-300 rounded-lg text-xs font-bold"
                    >
                      <option value="جدول مرتبات القانون 15">جدول مرتبات القانون 15</option>
                      <option value="اللائحة 418 – العناصر الطبية">اللائحة 418 – العناصر الطبية</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">الدرجة المعين عليها *</label>
                    <input
                      type="text"
                      value={gradesForm.appointmentGrade}
                      onChange={(e) => setGradesForm({ ...gradesForm, appointmentGrade: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded-lg text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">عدد العلاوات عند التعيين</label>
                    <input
                      type="number"
                      min={0}
                      max={15}
                      value={gradesForm.appointmentIncrements}
                      onChange={(e) => setGradesForm({ ...gradesForm, appointmentIncrements: Number(e.target.value) })}
                      className="w-full p-2 border border-gray-300 rounded-lg text-xs font-mono font-bold"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Section 2: Current Status */}
            <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-200 space-y-3">
              <div className="flex items-center gap-2 border-b border-amber-200 pb-2">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-600" />
                <h4 className="text-xs font-black text-amber-950">2. الوضع الوظيفي والمالي الحالي</h4>
              </div>

              {!isEditingGrades ? (
                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between items-center bg-white p-2.5 rounded-lg border border-amber-200">
                    <span className="text-gray-500 font-bold">الدرجة الحالية (النافذة):</span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-black text-red-900 text-sm">{effectiveGradeInfo.displayedCurrentGrade}</span>
                      {effectiveGradeInfo.isDifferentFromRecorded && (
                        <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-1.5 py-0.5 rounded" title={`محدثة زمنياً وفق: ${effectiveGradeInfo.latestGradeAction}`}>
                          محدثة زمنياً ({effectiveGradeInfo.latestGradeAction})
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-between items-center bg-white p-2.5 rounded-lg border border-amber-200">
                    <span className="text-gray-500 font-bold">عدد العلاوات الحالية (النافذة):</span>
                    <span className="font-mono font-black text-amber-900">{effectiveGradeInfo.currentIncrement} علاوة</span>
                  </div>
                  <div className="flex justify-between items-center bg-white p-2.5 rounded-lg border border-amber-200">
                    <span className="text-gray-500 font-bold">تاريخ استحقاق/نفاذ الدرجة:</span>
                    <span className="font-mono font-semibold text-gray-900">{formatDateDisplay(effectiveGradeInfo.gradeEntryDate || employee.gradeEntryDate) || '—'}</span>
                  </div>
                  <div className="flex justify-between items-center bg-white p-2.5 rounded-lg border border-amber-200">
                    <span className="text-gray-500 font-bold">تاريخ آخر علاوة:</span>
                    <span className="font-mono font-semibold text-gray-900">{formatDateDisplay(employee.lastIncrementDate) || '—'}</span>
                  </div>
                  <div className="flex justify-between items-center bg-white p-2.5 rounded-lg border border-amber-200">
                    <span className="text-gray-500 font-bold">موعد العلاوة القادمة:</span>
                    <span className="font-mono font-bold text-emerald-800">{formatDateDisplay(employee.nextIncrementDate) || '—'}</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">الدرجة الحالية *</label>
                    <input
                      type="text"
                      value={gradesForm.jobGrade}
                      onChange={(e) => setGradesForm({ ...gradesForm, jobGrade: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded-lg text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">عدد العلاوات الحالية</label>
                    <input
                      type="number"
                      min={0}
                      max={30}
                      value={gradesForm.currentIncrement}
                      onChange={(e) => setGradesForm({ ...gradesForm, currentIncrement: Number(e.target.value) })}
                      className="w-full p-2 border border-gray-300 rounded-lg text-xs font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">تاريخ الدرجة الحالية</label>
                    <input
                      type="date"
                      value={gradesForm.gradeEntryDate}
                      onChange={(e) => setGradesForm({ ...gradesForm, gradeEntryDate: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">تاريخ آخر علاوة</label>
                    <input
                      type="date"
                      value={gradesForm.lastIncrementDate}
                      onChange={(e) => setGradesForm({ ...gradesForm, lastIncrementDate: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded-lg text-xs"
                    />
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* Increment Breakdown Breakdown Summary */}
          <div className="p-4 bg-slate-900 text-white rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black text-amber-400 flex items-center gap-1.5">
                <Zap className="w-4 h-4" />
                <span>تفصيل مصادر العلاوات المكتسبة للموظف</span>
              </h4>
              <span className="text-xs font-mono font-black text-amber-300">
                الإجمالي: {breakdown.totalIncrements} علاوة
              </span>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              {breakdown.breakdownItems.map((item, i) => (
                <div key={i} className="flex items-center gap-1.5 bg-slate-800 border border-slate-700 px-2.5 py-1 rounded-lg text-xs">
                  <span className="text-slate-400">{item.label}:</span>
                  <span className="font-mono font-black text-amber-300">+{item.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: PROMOTIONS */}
      {activeTab === 'promotions' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-2xs p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
            <div>
              <h3 className="text-sm font-black text-gray-900 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-red-700" />
                <span>بيانات الترقيات والتدرج الوظيفي</span>
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                السجل الزمني لكافة الترقيات والتسويات وتغييرات الدرجة للموظف.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsCareerReportOpen(true)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <Printer className="w-3.5 h-3.5 text-amber-400" />
                <span>طباعة تقرير التدرج</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="w-full text-right text-xs border-collapse">
              <thead className="bg-gray-100 font-bold text-gray-700 border-b border-gray-200">
                <tr>
                  <th className="p-2.5 w-10 text-center">#</th>
                  <th className="p-2.5 w-24">التاريخ</th>
                  <th className="p-2.5 w-28">نوع الإجراء</th>
                  <th className="p-2.5 w-28">الدرجة السابقة</th>
                  <th className="p-2.5 w-28">الدرجة الجديدة</th>
                  <th className="p-2.5 w-20 text-center">العلاوات</th>
                  <th className="p-2.5 w-28">رقم القرار</th>
                  <th className="p-2.5">ملاحظات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {fullCareerHistory.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-gray-400">
                      لا توجد سجلات ترقية أو تسوية مسجلة لهذا الموظف
                    </td>
                  </tr>
                ) : (
                  fullCareerHistory.map((rec, idx) => (
                    <tr key={rec.id} className="hover:bg-gray-50 transition">
                      <td className="p-2.5 text-center font-mono text-gray-400">{idx + 1}</td>
                      <td className="p-2.5 font-mono font-semibold text-gray-800">{formatDateDisplay(rec.actionDate)}</td>
                      <td className="p-2.5">
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-50 text-blue-900 border border-blue-200">
                          {rec.actionType}
                        </span>
                      </td>
                      <td className="p-2.5 text-gray-600">{rec.previousGrade || '—'}</td>
                      <td className="p-2.5 font-bold text-amber-900">{rec.newGrade}</td>
                      <td className="p-2.5 text-center font-mono font-bold text-gray-800">+{rec.newIncrement || 0}</td>
                      <td className="p-2.5 font-mono text-gray-700">{rec.decisionNumber || '—'}</td>
                      <td className="p-2.5 text-gray-600">{rec.notes || '—'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 6: LEAVES */}
      {activeTab === 'leaves' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-2xs p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
            <div>
              <h3 className="text-sm font-black text-gray-900 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-purple-700" />
                <span>سجل الإجازات والأرصدة</span>
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                كافة الإجازات السنوية، المرضية، والطارئة المستفاد منها.
              </p>
            </div>

            {onOpenLeaveModal && (
              <button
                type="button"
                onClick={() => onOpenLeaveModal(employee.id)}
                className="px-3.5 py-1.5 bg-purple-700 hover:bg-purple-800 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>إضافة طلب إجازة</span>
              </button>
            )}
          </div>

          {/* Leave Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-purple-50 border border-purple-200 p-3 rounded-lg text-center">
              <span className="block text-[11px] font-bold text-purple-800">الرصيد السنوي</span>
              <span className="text-lg font-black text-purple-950 font-mono">{estimatedLeaveBalance} يوم</span>
            </div>
            <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg text-center">
              <span className="block text-[11px] font-bold text-amber-800">المستخدم الفعلي</span>
              <span className="text-lg font-black text-amber-950 font-mono">{totalLeaveDaysUsed} يوم</span>
            </div>
            <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-lg text-center">
              <span className="block text-[11px] font-bold text-emerald-800">المتبقي التقديري</span>
              <span className="text-lg font-black text-emerald-950 font-mono">{remainingLeaveDays} يوم</span>
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="w-full text-right text-xs border-collapse">
              <thead className="bg-gray-100 font-bold text-gray-700 border-b border-gray-200">
                <tr>
                  <th className="p-2.5 w-10 text-center">#</th>
                  <th className="p-2.5 w-28">نوع الإجازة</th>
                  <th className="p-2.5 w-28">تاريخ البداية</th>
                  <th className="p-2.5 w-28">تاريخ النهاية</th>
                  <th className="p-2.5 w-20 text-center">الأيام</th>
                  <th className="p-2.5 w-24 text-center">الحالة</th>
                  <th className="p-2.5">ملاحظات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {employeeLeaves.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-gray-400">
                      لا توجد إجازات مسجلة لهذا الموظف
                    </td>
                  </tr>
                ) : (
                  employeeLeaves.map((l, idx) => (
                    <tr key={l.id} className="hover:bg-gray-50 transition">
                      <td className="p-2.5 text-center font-mono text-gray-400">{idx + 1}</td>
                      <td className="p-2.5 font-bold text-gray-900">{l.leaveType}</td>
                      <td className="p-2.5 font-mono text-gray-800">{formatDateDisplay(l.startDate)}</td>
                      <td className="p-2.5 font-mono text-gray-800">{formatDateDisplay(l.endDate)}</td>
                      <td className="p-2.5 text-center font-mono font-bold text-purple-900">{l.daysCount} يوم</td>
                      <td className="p-2.5 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          {l.status || 'معتمدة'}
                        </span>
                      </td>
                      <td className="p-2.5 text-gray-600">{l.notes || '—'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 7: QUALIFICATIONS & TRAINING */}
      {activeTab === 'qualifications' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-2xs p-5 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
            <div>
              <h3 className="text-sm font-black text-gray-900 flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-blue-700" />
                <span>المؤهلات العلمية والدورات التدريبية</span>
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                توثيق الشهادات الأكاديمية والبرامج التدريبية المعتمدة.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsQualPrintOpen(true)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5 text-amber-400" />
                <span>طباعة الكشف</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setEditingQualRecord(null);
                  setIsQualModalOpen(true);
                }}
                className="px-3.5 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>إضافة مؤهل / دورة</span>
              </button>
            </div>
          </div>

          {/* 1. Academic Qualifications */}
          <div className="space-y-2">
            <h4 className="text-xs font-black text-gray-800 border-r-2 border-blue-700 pr-2">
              المؤهلات والشهادات العلمية
            </h4>
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="w-full text-right text-xs border-collapse">
                <thead className="bg-gray-100 font-bold text-gray-700 border-b border-gray-200">
                  <tr>
                    <th className="p-2.5">المؤهل / الدرجة العلمية</th>
                    <th className="p-2.5">التخصص</th>
                    <th className="p-2.5">الجامعة / المؤسسة</th>
                    <th className="p-2.5 text-center">سنة التخرج</th>
                    <th className="p-2.5 text-center">نوع التعليم</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  <tr>
                    <td className="p-2.5 font-bold text-gray-900">{employee.qualification || '—'}</td>
                    <td className="p-2.5 font-semibold text-gray-800">{employee.specialization || '—'}</td>
                    <td className="p-2.5 text-gray-700">{employee.university || '—'}</td>
                    <td className="p-2.5 text-center font-mono font-bold text-gray-800">{employee.graduationYear || '—'}</td>
                    <td className="p-2.5 text-center text-gray-700">{employee.educationType || '—'}</td>
                  </tr>
                  {employeeQuals.filter((q) => q.recordType === 'مؤهل_علمي').map((q) => (
                    <tr key={q.id} className="hover:bg-gray-50">
                      <td className="p-2.5 font-bold text-blue-900">{q.title}</td>
                      <td className="p-2.5 text-gray-800">{q.specialization || '—'}</td>
                      <td className="p-2.5 text-gray-700">{q.institution || '—'}</td>
                      <td className="p-2.5 text-center font-mono text-gray-800">{q.yearObtained || '—'}</td>
                      <td className="p-2.5 text-center text-gray-700">{q.grade || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 2. Training Courses */}
          <div className="space-y-2">
            <h4 className="text-xs font-black text-gray-800 border-r-2 border-emerald-700 pr-2">
              الدورات التدريبية وورش العمل
            </h4>
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="w-full text-right text-xs border-collapse">
                <thead className="bg-gray-100 font-bold text-gray-700 border-b border-gray-200">
                  <tr>
                    <th className="p-2.5">اسم الدورة</th>
                    <th className="p-2.5">الجهة المنفذة</th>
                    <th className="p-2.5 text-center">المدة / الساعات</th>
                    <th className="p-2.5 text-center">تاريخ الانعقاد</th>
                    <th className="p-2.5 text-center">التقدير</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {employeeQuals.filter((q) => q.recordType === 'دورة_تدريبية').length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-6 text-center text-gray-400">
                        لا توجد دورات تدريبية مسجلة لهذا الموظف
                      </td>
                    </tr>
                  ) : (
                    employeeQuals.filter((q) => q.recordType === 'دورة_تدريبية').map((q) => (
                      <tr key={q.id} className="hover:bg-gray-50">
                        <td className="p-2.5 font-bold text-emerald-950">{q.title}</td>
                        <td className="p-2.5 text-gray-800">{q.institution || '—'}</td>
                        <td className="p-2.5 text-center font-mono text-gray-800">{q.durationHours ? `${q.durationHours} ساعة` : '—'}</td>
                        <td className="p-2.5 text-center font-mono text-gray-800">{formatDateDisplay(q.startDate) || '—'}</td>
                        <td className="p-2.5 text-center text-gray-700">{q.grade || 'اجتياز'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 8: FUNCTIONAL PROCEDURES */}
      {activeTab === 'procedures' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-2xs p-5 space-y-4">
          <div className="border-b border-gray-100 pb-3">
            <h3 className="text-sm font-black text-gray-900 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-600" />
              <span>الإجراءات الوظيفية والإدارية</span>
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              السجل الشامل للإجراءات والقرارات الصادرة بحق الموظف.
            </p>
          </div>

          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="w-full text-right text-xs border-collapse">
              <thead className="bg-gray-100 font-bold text-gray-700 border-b border-gray-200">
                <tr>
                  <th className="p-2.5 w-10 text-center">#</th>
                  <th className="p-2.5 w-28">نوع الإجراء</th>
                  <th className="p-2.5 w-28">التاريخ</th>
                  <th className="p-2.5 w-28">رقم القرار</th>
                  <th className="p-2.5">البيان / الوصف</th>
                  <th className="p-2.5 w-32">الجهة المصدرة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {employeeProcedures.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-gray-400">
                      لا توجد إجراءات وظيفية عامة مسجلة
                    </td>
                  </tr>
                ) : (
                  employeeProcedures.map((p, idx) => (
                    <tr key={p.id} className="hover:bg-gray-50 transition">
                      <td className="p-2.5 text-center font-mono text-gray-400">{idx + 1}</td>
                      <td className="p-2.5 font-bold text-gray-900">{p.procedureType}</td>
                      <td className="p-2.5 font-mono text-gray-800">{formatDateDisplay(p.procedureDate)}</td>
                      <td className="p-2.5 font-mono font-semibold text-gray-800">{p.procedureNumber || '—'}</td>
                      <td className="p-2.5 text-gray-800">{p.description || '—'}</td>
                      <td className="p-2.5 text-gray-600">{p.issuingAuthority || 'مصرف الدم المركزي'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 9: DISCIPLINARY & WARNINGS */}
      {activeTab === 'disciplinary' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-2xs p-5 space-y-4">
          <div className="border-b border-gray-100 pb-3">
            <h3 className="text-sm font-black text-gray-900 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-red-700" />
              <span>الخصومات والإنذارات والعقوبات</span>
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              سجل الإجراءات الانضباطية والجزاءات المطبقة.
            </p>
          </div>

          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="w-full text-right text-xs border-collapse">
              <thead className="bg-gray-100 font-bold text-gray-700 border-b border-gray-200">
                <tr>
                  <th className="p-2.5 w-10 text-center">#</th>
                  <th className="p-2.5 w-28">نوع الإجراء</th>
                  <th className="p-2.5 w-28">التاريخ</th>
                  <th className="p-2.5">السبب والداعي</th>
                  <th className="p-2.5 w-28">رقم القرار/الكتاب</th>
                  <th className="p-2.5 w-24 text-center">القيمة / الأيام</th>
                  <th className="p-2.5 w-32 text-center">الخطاب الرسمي</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {employeeDisciplinary.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-gray-400">
                      السجل نظيف - لا توجد إنذارات أو خصومات مسجلة بحق الموظف
                    </td>
                  </tr>
                ) : (
                  employeeDisciplinary.map((d, idx) => (
                    <tr key={d.id} className="hover:bg-red-50/30 transition">
                      <td className="p-2.5 text-center font-mono text-gray-400">{idx + 1}</td>
                      <td className="p-2.5 font-bold text-red-900">{d.recordType || d.actionType || 'تنبيه'}</td>
                      <td className="p-2.5 font-mono text-gray-800">{formatDateDisplay(d.effectiveDate || d.actionDate || d.decisionDate)}</td>
                      <td className="p-2.5 text-gray-800">{d.reason}</td>
                      <td className="p-2.5 font-mono text-gray-700">{d.letterNumber || d.decisionNumber || '—'}</td>
                      <td className="p-2.5 text-center font-mono font-bold text-red-900">
                        {d.numberOfDays || d.deductionDays ? `${d.numberOfDays || d.deductionDays} يوم` : d.deductionAmount ? `${d.deductionAmount} د.ل` : '—'}
                      </td>
                      <td className="p-2.5 text-center">
                        <button
                          type="button"
                          onClick={() => setSelectedDisciplinaryForLetter(d)}
                          className="px-2.5 py-1 bg-red-700 hover:bg-red-800 text-white rounded-lg text-[11px] font-bold inline-flex items-center gap-1 shadow-2xs transition cursor-pointer"
                          title="طباعة الخطاب الرسمي المعتمد"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>طباعة خطاب</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 10: TRANSFERS / RESIGNATIONS / END OF SERVICE */}
      {activeTab === 'transfers_resignations' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-2xs p-5 space-y-6">
          <div className="border-b border-gray-100 pb-3">
            <h3 className="text-sm font-black text-gray-900 flex items-center gap-2">
              <ArrowRightLeft className="w-4 h-4 text-blue-700" />
              <span>النقل، الانتداب، الاستقالات ونهاية الخدمة</span>
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              توثيق الحركات الخارجية وحالات إنهاء الخدمة.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Transfers & Secondments */}
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-2">
              <h4 className="text-xs font-black text-gray-900 border-r-2 border-blue-700 pr-2">
                سجل النقل والانتداب الداخلي والخارجي
              </h4>
              {employeeTransfers.length === 0 && employeeSecondments.length === 0 ? (
                <p className="text-xs text-gray-400 py-4 text-center">لا توجد حركات نقل أو ندب مسجلة</p>
              ) : (
                <div className="space-y-2 text-xs">
                  {employeeTransfers.map((t) => (
                    <div key={t.id} className="p-2 bg-white rounded border border-gray-200">
                      <div className="flex justify-between font-bold">
                        <span>نقل إلى: {t.toDepartment}</span>
                        <span className="font-mono text-gray-500">{formatDateDisplay(t.transferDate)}</span>
                      </div>
                      <p className="text-gray-600 text-[11px] mt-1">{t.reason}</p>
                    </div>
                  ))}
                  {employeeSecondments.map((s) => (
                    <div key={s.id} className="p-2 bg-white rounded border border-gray-200">
                      <div className="flex justify-between font-bold">
                        <span>انتداب إلى: {s.destinationEntity}</span>
                        <span className="font-mono text-gray-500">{formatDateDisplay(s.startDate)}</span>
                      </div>
                      <p className="text-gray-600 text-[11px] mt-1">المدة: {s.durationMonths} شهر</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Resignations & End of Service */}
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-2">
              <h4 className="text-xs font-black text-gray-900 border-r-2 border-red-700 pr-2">
                سجل الاستقالة ونهاية الخدمة
              </h4>
              {employeeResignations.length === 0 ? (
                <p className="text-xs text-gray-400 py-4 text-center">الموظف على رأس العمل - لا توجد استقالة مسجلة</p>
              ) : (
                <div className="space-y-2 text-xs">
                  {employeeResignations.map((r) => (
                    <div key={r.id} className="p-2 bg-white rounded border border-red-200">
                      <div className="flex justify-between font-bold text-red-900">
                        <span>نوع الإنهاء: {r.resignationType}</span>
                        <span className="font-mono text-gray-500">{formatDateDisplay(r.effectiveDate)}</span>
                      </div>
                      <p className="text-gray-700 text-[11px] mt-1">السبب: {r.reason}</p>
                      {r.decisionNumber && (
                        <p className="text-gray-500 font-mono text-[10px] mt-0.5">رقم القرار: {r.decisionNumber}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 11: DOCUMENTS */}
      {activeTab === 'documents' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-2xs p-5 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
            <div>
              <h3 className="text-sm font-black text-gray-900 flex items-center gap-2">
                <Paperclip className="w-4 h-4 text-amber-700" />
                <span>أرشيف الوثائق والمستندات الإلكترونية</span>
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                مستودع المستندات والملفات المرفقة بصيغ PDF والصور.
              </p>
            </div>
          </div>

          {/* Upload New Document Box */}
          <div className="bg-amber-50/40 border border-amber-200 rounded-xl p-4 space-y-3">
            <h4 className="text-xs font-black text-amber-950 flex items-center gap-1.5">
              <Upload className="w-3.5 h-3.5 text-amber-700" />
              <span>إضافة وثيقة جديدة للأرشيف</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">تصنيف الوثيقة</label>
                <select
                  value={documentCategory}
                  onChange={(e) => setDocumentCategory(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg text-xs font-semibold bg-white"
                >
                  <option value="قرار تعيين">قرار تعيين</option>
                  <option value="مؤهل علمي">مؤهل علمي</option>
                  <option value="إجراء إداري / ترقية">إجراء إداري / ترقية</option>
                  <option value="تقرير كفاءة">تقرير كفاءة</option>
                  <option value="وثيقة هوية">وثيقة هوية</option>
                  <option value="أخرى">أخرى</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">عنوان / وصف الوثيقة</label>
                <input
                  type="text"
                  value={documentTitle}
                  onChange={(e) => setDocumentTitle(e.target.value)}
                  placeholder="مثال: شهادة البكالوريوس الأصلية"
                  className="w-full p-2 border border-gray-300 rounded-lg text-xs bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">اختر ملف (PDF / صورة)</label>
                <label className="w-full p-2 border border-dashed border-amber-400 bg-amber-50 hover:bg-amber-100 rounded-lg text-xs font-bold text-amber-900 flex items-center justify-center gap-2 cursor-pointer transition">
                  <Upload className="w-4 h-4" />
                  <span>{isUploadingDoc ? 'جاري الرفع...' : 'رفع الملف الآن'}</span>
                  <input
                    type="file"
                    accept=".pdf,image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                    disabled={isUploadingDoc}
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Archived Documents List */}
          <div className="space-y-3">
            <h4 className="text-xs font-black text-gray-800">الوثائق المؤرشفة الحالية</h4>

            {!employee.pdfPath ? (
              <div className="p-8 text-center border border-dashed border-gray-300 rounded-xl text-gray-400 space-y-2">
                <FileText className="w-8 h-8 text-gray-300 mx-auto" />
                <p className="text-xs font-bold text-gray-600">لا توجد وثائق مؤرشفة لهذا الموظف حتى الآن</p>
                <p className="text-[11px] text-gray-400">يمكنك رفع ملفات PDF وصور المستندات لحفظها بملف الموظف.</p>
              </div>
            ) : (
              <div className="flex items-center justify-between p-3.5 bg-gray-50 border border-gray-200 rounded-xl text-xs">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-100 text-red-800 rounded-lg">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="font-bold text-gray-900">{employee.pdfFileName || 'وثيقة ملف الموظف'}</h5>
                    <p className="text-[11px] text-gray-500">تم التخزين الآمن في السجل الإلكتروني</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={employee.pdfPath}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg font-bold flex items-center gap-1.5 transition"
                  >
                    <Eye className="w-3.5 h-3.5 text-blue-400" />
                    <span>فتح ومعاينة</span>
                  </a>

                  <a
                    href={employee.pdfPath}
                    download={employee.pdfFileName || `ملف_الموظف_${employee.jobNumber}.pdf`}
                    className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-bold flex items-center gap-1.5 transition"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>تحميل</span>
                  </a>

                  <button
                    type="button"
                    onClick={handleDeleteDocument}
                    className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition"
                    title="حذف الوثيقة"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 12: ANNUAL EVALUATIONS */}
      {activeTab === 'evaluations' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-2xs p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
            <div>
              <h3 className="text-sm font-black text-gray-900 flex items-center gap-2">
                <FileCheck2 className="w-4 h-4 text-purple-700" />
                <span>تقارير الكفاءة السنوية وتقييم الأداء</span>
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                التقييمات الدورية السنوية المعتمدة لترقيات الموظف.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                const currentYear = new Date().getFullYear();
                const newEval = createNewEvaluation(
                  employee, 
                  currentYear, 
                  careerRecords, 
                  promotions, 
                  generalManagerName, 
                  currentUser
                );
                setActiveEvalModalDoc(newEval);
              }}
              className="px-3.5 py-1.5 bg-purple-700 hover:bg-purple-800 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>إضافة تقرير كفاءة سنوي</span>
            </button>
          </div>

          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="w-full text-right text-xs border-collapse">
              <thead className="bg-gray-100 font-bold text-gray-700 border-b border-gray-200">
                <tr>
                  <th className="p-2.5 w-12 text-center">السنة</th>
                  <th className="p-2.5 w-28">الفترة</th>
                  <th className="p-2.5 w-24 text-center">درجة الكفاءة</th>
                  <th className="p-2.5 w-28 text-center">التقدير العام</th>
                  <th className="p-2.5 w-32">الرئيس المباشر</th>
                  <th className="p-2.5 w-28">تاريخ التقرير</th>
                  <th className="p-2.5 w-24 text-center">الحالة</th>
                  <th className="p-2.5 w-28 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {employeeEvaluations.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-gray-400">
                      لا توجد تقارير كفاءة مسجلة لهذا الموظف
                    </td>
                  </tr>
                ) : (
                  employeeEvaluations.map((ev) => (
                    <tr key={ev.id} className="hover:bg-purple-50/20 transition">
                      <td className="p-2.5 text-center font-mono font-bold text-gray-900">{ev.evaluationYear}</td>
                      <td className="p-2.5 text-gray-700">{ev.periodFrom ? `${formatDateDisplay(ev.periodFrom)} إلى ${formatDateDisplay(ev.periodTo)}` : 'سنوي'}</td>
                      <td className="p-2.5 text-center font-mono font-black text-purple-950">{ev.totalScore || 95}%</td>
                      <td className="p-2.5 text-center">
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-purple-50 text-purple-900 border border-purple-200">
                          {ev.finalGrade || ev.ratingCategory || 'ممتاز'}
                        </span>
                      </td>
                      <td className="p-2.5 text-gray-700">{ev.directManagerName || 'رئيس القسم'}</td>
                      <td className="p-2.5 font-mono text-gray-700">{formatDateDisplay(ev.reportDate || ev.createdAt)}</td>
                      <td className="p-2.5 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          {ev.status || 'معتمد'}
                        </span>
                      </td>
                      <td className="p-2.5 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => setActiveEvalModalDoc(ev)}
                            className="p-1 text-purple-700 hover:bg-purple-50 rounded transition"
                            title="فتح ومعاينة النموذج الرسمي"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          {onDeleteEvaluation && (
                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm('هل أنت متأكد من حذف هذا التقرير؟')) {
                                  onDeleteEvaluation(ev.id);
                                  triggerToast('تم حذف تقرير الكفاءة.');
                                }
                              }}
                              className="p-1 text-red-600 hover:bg-red-50 rounded transition"
                              title="حذف التقرير"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODALS */}
      {/* 1. Official A4 Dossier Print Modal */}
      {isDossierPrintOpen && (
        <EmployeeDossierPrintModal
          employee={employee}
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
          isOpen={isDossierPrintOpen}
          onClose={() => setIsDossierPrintOpen(false)}
          generalManagerName={generalManagerName}
          officialLogoUrl={officialLogoUrl}
        />
      )}

      {/* 2. Employee Badge Card Print Modal */}
      {isBadgePrintOpen && (
        <EmployeePrintCard
          employee={employee}
          onClose={() => setIsBadgePrintOpen(false)}
        />
      )}

      {/* 3. Career Promotion History Modal */}
      {isCareerReportOpen && (
        <EmployeeCareerReportModal
          employee={employee}
          careerRecords={careerRecords}
          promotions={promotions}
          increments={increments}
          settlements={settlements}
          isOpen={isCareerReportOpen}
          onClose={() => setIsCareerReportOpen(false)}
        />
      )}

      {/* 4. Qualifications Official Print Modal */}
      {isQualPrintOpen && (
        <OfficialQualificationsPrintModal
          employee={employee}
          qualifications={employeeQuals}
          isOpen={isQualPrintOpen}
          onClose={() => setIsQualPrintOpen(false)}
          generalManagerName={generalManagerName}
          officialLogoUrl={officialLogoUrl}
        />
      )}

      {/* 5. Qualification Add / Edit Modal */}
      {isQualModalOpen && (
        <QualificationRecordModal
          employee={employee}
          record={editingQualRecord}
          isOpen={isQualModalOpen}
          onClose={() => {
            setIsQualModalOpen(false);
            setEditingQualRecord(null);
          }}
          onSave={(rec) => {
            if (editingQualRecord && onUpdateQualification) {
              onUpdateQualification(rec);
            } else if (onAddQualification) {
              onAddQualification(rec);
            }
            setIsQualModalOpen(false);
            setEditingQualRecord(null);
            triggerToast('تم حفظ المؤهل بنجاح.');
          }}
          currentUser={currentUser}
        />
      )}

      {/* 6. Performance Evaluation Official Modal */}
      {activeEvalModalDoc && (
        <OfficialPerformanceEvaluationModal
          evaluation={activeEvalModalDoc}
          employee={employee}
          careerRecords={careerRecords}
          promotions={promotions}
          isOpen={!!activeEvalModalDoc}
          onClose={() => setActiveEvalModalDoc(null)}
          onSave={(ev) => {
            if (onSaveEvaluation) onSaveEvaluation(ev);
            setActiveEvalModalDoc(null);
            triggerToast('تم حفظ تقرير الكفاءة بنجاح.');
          }}
          generalManagerName={generalManagerName}
          officialLogoUrl={officialLogoUrl}
          currentUser={currentUser}
        />
      )}

      {/* 7. Official Disciplinary & Penalty Letter Modal */}
      {selectedDisciplinaryForLetter && (
        <OfficialDisciplinaryLetterModal
          record={selectedDisciplinaryForLetter}
          employee={employee}
          onClose={() => setSelectedDisciplinaryForLetter(null)}
          currentUser={currentUser}
          generalManagerName={generalManagerName}
          officialLogoUrl={officialLogoUrl}
        />
      )}

    </div>
  );
};
