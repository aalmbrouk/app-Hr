import React, { useState } from 'react';
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
  AnnualPerformanceEvaluation
} from '../types';
import { calculateEmployeeIncrementBreakdown } from '../utils/incrementUtils';
import { formatDateDisplay } from '../utils/dateUtils';
import { getCareerActionMeta, getEmployeeCareerHistory, calculateEmployeeCareerSummary } from '../utils/careerUtils';
import { createNewEvaluation } from '../utils/evaluationUtils';
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
  ChevronUp, 
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
  ExternalLink
} from 'lucide-react';
import { EmployeeCareerReportModal } from './EmployeeCareerReportModal';
import { QualificationRecordModal } from './QualificationRecordModal';
import { OfficialQualificationsPrintModal } from './OfficialQualificationsPrintModal';
import { OfficialPerformanceEvaluationModal } from './evaluations/OfficialPerformanceEvaluationModal';

interface EmployeeDetailsAccordionProps {
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
  onOpenEdit: (emp: Employee) => void;
  onPrintCard: (emp: Employee) => void;
  onDeleteEmployee: (id: number) => void;
  onOpenLeaveModal: (empId: number) => void;
  onOpenIncrementDetails: (emp: Employee) => void;
  onUpdateEmployee: (emp: Employee) => void;
  onAddQualification?: (record: EmployeeQualificationRecord) => void;
  onUpdateQualification?: (record: EmployeeQualificationRecord) => void;
  onDeleteQualification?: (id: string) => void;
  onSaveEvaluation?: (evaluation: AnnualPerformanceEvaluation) => void;
  onDeleteEvaluation?: (id: string) => void;
  onClose: () => void;
  currentUser?: string;
  generalManagerName?: string;
  officialLogoUrl?: string;
}

export const EmployeeDetailsAccordion: React.FC<EmployeeDetailsAccordionProps> = ({
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
  onOpenEdit,
  onPrintCard,
  onDeleteEmployee,
  onOpenLeaveModal,
  onOpenIncrementDetails,
  onUpdateEmployee,
  onAddQualification,
  onUpdateQualification,
  onDeleteQualification,
  onSaveEvaluation,
  onDeleteEvaluation,
  onClose,
  currentUser = 'النظام',
  generalManagerName = 'نجيب صالح سالم',
  officialLogoUrl
}) => {
  type TabKey = 
    | 'personal' 
    | 'job' 
    | 'qualifications' 
    | 'career_promotions' 
    | 'annual_evaluations'
    | 'leaves' 
    | 'documents' 
    | 'transfers_resignations' 
    | 'disciplinary' 
    | 'procedures';

  const [activeTab, setActiveTab] = useState<TabKey>('personal');
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);
  const [isCareerReportOpen, setIsCareerReportOpen] = useState(false);
  
  // Qualifications modal states
  const [isQualModalOpen, setIsQualModalOpen] = useState(false);
  const [editingQualRecord, setEditingQualRecord] = useState<EmployeeQualificationRecord | null>(null);
  const [isQualPrintOpen, setIsQualPrintOpen] = useState(false);

  // Annual Evaluation modal states
  const [activeEvalModalDoc, setActiveEvalModalDoc] = useState<AnnualPerformanceEvaluation | null>(null);

  // Official Disciplinary Letter modal state
  const [selectedDisciplinaryLetter, setSelectedDisciplinaryLetter] = useState<DisciplinaryRecord | null>(null);

  // Calculate increment sources breakdown
  const breakdown = calculateEmployeeIncrementBreakdown(
    employee,
    increments,
    promotions,
    settlements,
    generalProcedures
  );

  // Filter evaluations for this employee
  const employeeEvaluations = (evaluations || [])
    .filter((e) => e.employeeId === employee.id)
    .sort((a, b) => b.evaluationYear - a.evaluationYear);

  // Filter leaves for this employee
  const employeeLeaves = leaves.filter((l) => l.employeeId === employee.id);

  // Filter qualifications for this employee
  const employeeQuals = qualifications.filter((q) => q.employeeId === employee.id);

  // Filter transfers, secondments, disciplinary, and procedures
  const employeeTransfers = transfers.filter((t) => t.employeeId === employee.id);
  const employeeSecondments = secondments.filter((s) => s.employeeId === employee.id);
  const employeeDisciplinary = disciplinary.filter((d) => d.employeeId === employee.id);
  const employeeProcedures = generalProcedures.filter((p) => p.employeeId === employee.id);
  const employeeResignations = resignations.filter((r) => r.employeeId === employee.id);

  // Unified Career History
  const fullCareerHistory = getEmployeeCareerHistory(
    employee.id,
    careerRecords,
    promotions,
    increments,
    settlements
  );

  // Career Summary Stats
  const careerSummary = calculateEmployeeCareerSummary(
    employee,
    careerRecords,
    promotions,
    increments,
    settlements
  );

  // PDF Document Upload handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingDoc(true);
    const reader = new FileReader();
    reader.onload = () => {
      const base64Data = reader.result as string;
      onUpdateEmployee({
        ...employee,
        pdfPath: base64Data,
        pdfFileName: file.name
      });
      setIsUploadingDoc(false);
    };
    reader.onerror = () => {
      alert('حدث خطأ أثناء قراءة المستند.');
      setIsUploadingDoc(false);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveDoc = () => {
    if (window.confirm('هل أنت متأكد من رغبتك في إزالة المستند المرفق؟')) {
      onUpdateEmployee({
        ...employee,
        pdfPath: '',
        pdfFileName: ''
      });
    }
  };

  const handleDeleteQual = (id: string, title: string) => {
    if (window.confirm(`هل أنت متأكد من رغبتك في حذف المؤهل / الدورة: "${title}"؟`)) {
      if (onDeleteQualification) {
        onDeleteQualification(id);
      }
    }
  };

  return (
    <div className="w-full max-w-full overflow-hidden box-border bg-slate-50/80 border border-slate-300 rounded-xl p-3 sm:p-4 shadow-sm text-right transition-all duration-150 ease-out" dir="rtl">
      {/* Top Header & Actions Bar */}
      <div className="w-full max-w-full box-border bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row justify-between items-start md:items-center gap-3 mb-3">
        <div className="min-w-0 max-w-full space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
              تفاصيل الموظف
            </span>
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
              employee.status === 'على رأس العمل'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : employee.status.includes('إجازة')
                ? 'bg-amber-50 text-amber-800 border-amber-200'
                : 'bg-slate-100 text-slate-700 border-slate-200'
            }`}>
              {employee.status}
            </span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              employee.assignmentCategory === 'طبي' ? 'bg-blue-50 text-blue-800 border border-blue-200' : 'bg-slate-100 text-slate-700'
            }`}>
              {employee.assignmentCategory}
            </span>
          </div>

          <h3 className="text-[16px] sm:text-[18px] font-bold text-slate-900 leading-tight">
            {employee.fullName}
          </h3>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 pt-0.5">
            <span>
              <strong className="text-slate-700">رقم الملف:</strong> <span className="font-mono font-bold text-slate-900">{employee.jobNumber}</span>
            </span>
            <span>
              <strong className="text-slate-700">الرقم الوطني:</strong> <span className="font-mono font-bold text-slate-900">{employee.nationality === 'ليبي' ? (employee.nationalId || '-') : (employee.passportNumber || employee.nationalId || '-')}</span>
            </span>
            <span>
              <strong className="text-slate-700">القسم:</strong> <span className="text-slate-900">{employee.department}</span>
            </span>
            <span>
              <strong className="text-slate-700">الوظيفة:</strong> <span className="text-slate-900">{employee.jobTitle}</span>
            </span>
            <span>
              <strong className="text-slate-700">الدرجة:</strong> <span className="font-bold text-slate-900">{employee.jobGrade} (+{employee.currentIncrement || 1})</span>
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 w-full md:w-auto shrink-0">
          <button
            type="button"
            onClick={() => onOpenEdit(employee)}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold flex items-center gap-1.5 transition border border-slate-300 shadow-2xs cursor-pointer"
            title="تعديل بيانات الموظف"
          >
            <Edit3 className="w-3.5 h-3.5 text-blue-700" />
            <span>تعديل</span>
          </button>

          <button
            type="button"
            onClick={() => onPrintCard(employee)}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition shadow-2xs cursor-pointer"
            title="طباعة بطاقة التعريف الرسمية"
          >
            <Printer className="w-3.5 h-3.5 text-slate-300" />
            <span>طباعة البطاقة</span>
          </button>

          <button
            type="button"
            onClick={() => setIsCareerReportOpen(true)}
            className="px-3 py-1.5 bg-amber-700 hover:bg-amber-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition shadow-2xs cursor-pointer"
            title="طباعة تقرير المسار المهني والترقيات"
          >
            <History className="w-3.5 h-3.5 text-amber-200" />
            <span>تقرير المسار المهني</span>
          </button>

          <button
            type="button"
            onClick={() => onDeleteEmployee(employee.id)}
            className="px-2.5 py-1.5 bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 rounded-lg text-xs font-medium flex items-center gap-1 transition cursor-pointer"
            title="حذف الموظف"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>حذف</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium flex items-center gap-1 transition cursor-pointer"
            title="إغلاق التفاصيل"
          >
            <ChevronUp className="w-3.5 h-3.5" />
            <span>إغلاق</span>
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-200 bg-white px-2 pt-2 rounded-t-xl overflow-x-auto gap-1 text-xs font-bold scrollbar-none">
        {/* 1. البيانات الأساسية */}
        <button
          type="button"
          onClick={() => setActiveTab('personal')}
          className={`pb-2.5 px-3 border-b-2 transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
            activeTab === 'personal'
              ? 'border-slate-800 text-slate-900 bg-slate-100/90 font-bold rounded-t'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-medium'
          }`}
        >
          <User className="w-3.5 h-3.5 text-slate-500" />
          <span>البيانات الأساسية</span>
        </button>

        {/* 2. البيانات الوظيفية */}
        <button
          type="button"
          onClick={() => setActiveTab('job')}
          className={`pb-2.5 px-3 border-b-2 transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
            activeTab === 'job'
              ? 'border-slate-800 text-slate-900 bg-slate-100/90 font-bold rounded-t'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-medium'
          }`}
        >
          <Briefcase className="w-3.5 h-3.5 text-slate-500" />
          <span>البيانات الوظيفية</span>
        </button>

        {/* 3. المؤهلات والدورات */}
        <button
          type="button"
          onClick={() => setActiveTab('qualifications')}
          className={`pb-2.5 px-3 border-b-2 transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
            activeTab === 'qualifications'
              ? 'border-slate-800 text-slate-900 bg-slate-100/90 font-bold rounded-t'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-medium'
          }`}
        >
          <GraduationCap className="w-3.5 h-3.5 text-slate-600" />
          <span>المؤهلات والدورات ({employeeQuals.length})</span>
        </button>

        {/* 4. بيانات الترقيات الوظيفية */}
        <button
          type="button"
          onClick={() => setActiveTab('career_promotions')}
          className={`pb-2.5 px-3 border-b-2 transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
            activeTab === 'career_promotions'
              ? 'border-slate-800 text-slate-900 bg-slate-100/90 font-bold rounded-t'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-medium'
          }`}
        >
          <Award className="w-3.5 h-3.5 text-slate-600" />
          <span>بيانات الترقيات الوظيفية ({fullCareerHistory.length})</span>
        </button>

        {/* تقارير الكفاءة السنوية */}
        <button
          type="button"
          onClick={() => setActiveTab('annual_evaluations')}
          className={`pb-2.5 px-3 border-b-2 transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
            activeTab === 'annual_evaluations'
              ? 'border-slate-800 text-slate-900 bg-slate-100/90 font-bold rounded-t'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-medium'
          }`}
        >
          <FileCheck2 className="w-3.5 h-3.5 text-slate-600" />
          <span>تقارير الكفاءة السنوية ({employeeEvaluations.length})</span>
        </button>

        {/* 5. الإجازات */}
        <button
          type="button"
          onClick={() => setActiveTab('leaves')}
          className={`pb-2.5 px-3 border-b-2 transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
            activeTab === 'leaves'
              ? 'border-slate-800 text-slate-900 bg-slate-100/90 font-bold rounded-t'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-medium'
          }`}
        >
          <Calendar className="w-3.5 h-3.5 text-slate-500" />
          <span>الإجازات ({employeeLeaves.length})</span>
        </button>

        {/* 6. الوثائق */}
        <button
          type="button"
          onClick={() => setActiveTab('documents')}
          className={`pb-2.5 px-3 border-b-2 transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
            activeTab === 'documents'
              ? 'border-slate-800 text-slate-900 bg-slate-100/90 font-bold rounded-t'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-medium'
          }`}
        >
          <Paperclip className="w-3.5 h-3.5 text-slate-500" />
          <span>الوثائق {employee.pdfPath && '📎'}</span>
        </button>

        {/* 7. النقل والاستقالة */}
        <button
          type="button"
          onClick={() => setActiveTab('transfers_resignations')}
          className={`pb-2.5 px-3 border-b-2 transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
            activeTab === 'transfers_resignations'
              ? 'border-slate-800 text-slate-900 bg-slate-100/90 font-bold rounded-t'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-medium'
          }`}
        >
          <ArrowRightLeft className="w-3.5 h-3.5 text-slate-500" />
          <span>النقل والاستقالة ({employeeTransfers.length + employeeSecondments.length + employeeResignations.length})</span>
        </button>

        {/* 8. الخصومات والإنذارات */}
        <button
          type="button"
          onClick={() => setActiveTab('disciplinary')}
          className={`pb-2.5 px-3 border-b-2 transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
            activeTab === 'disciplinary'
              ? 'border-slate-800 text-slate-900 bg-slate-100/90 font-bold rounded-t'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-medium'
          }`}
        >
          <AlertOctagon className="w-3.5 h-3.5 text-slate-500" />
          <span>الخصومات والإنذارات ({employeeDisciplinary.length})</span>
        </button>

        {/* 9. الإجراءات */}
        <button
          type="button"
          onClick={() => setActiveTab('procedures')}
          className={`pb-2.5 px-3 border-b-2 transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
            activeTab === 'procedures'
              ? 'border-slate-800 text-slate-900 bg-slate-100/90 font-bold rounded-t'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-medium'
          }`}
        >
          <FileCheck2 className="w-3.5 h-3.5 text-slate-500" />
          <span>الإجراءات ({employeeProcedures.length})</span>
        </button>
      </div>

      {/* Tab Panels Content */}
      <div className="bg-white p-4 sm:p-5 rounded-b-xl border-x border-b border-slate-200 shadow-2xs">
        
        {/* 1. PERSONAL TAB */}
        {activeTab === 'personal' && (
          <div className="space-y-3.5">
            <div className="border border-slate-200 rounded-lg p-3.5 bg-slate-50/60">
              <h4 className="text-xs font-bold text-slate-800 mb-2.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-600" />
                <span>المعلومات الشخصية والمدنية</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 text-xs">
                <div className="p-2.5 bg-white rounded border border-slate-200">
                  <span className="text-slate-500 block mb-1">الرقم الوطني / وثيقة الإثبات</span>
                  <span className="font-mono font-bold text-slate-900 text-sm">
                    {employee.nationality === 'ليبي' ? (employee.nationalId || '-') : (employee.passportNumber || employee.nationalId || '-')}
                  </span>
                </div>

                <div className="p-2.5 bg-white rounded border border-slate-200">
                  <span className="text-slate-500 block mb-1">اسم الأم</span>
                  <span className="font-bold text-slate-900">{employee.motherName || 'غير مسجل'}</span>
                </div>

                <div className="p-2.5 bg-white rounded border border-slate-200">
                  <span className="text-slate-500 block mb-1">تاريخ ومكان الميلاد</span>
                  <span className="font-bold text-slate-900">{formatDateDisplay(employee.birthDate)} - {employee.birthPlace || 'المرج'}</span>
                </div>

                <div className="p-2.5 bg-white rounded border border-slate-200">
                  <span className="text-slate-500 block mb-1">الجنسية والحالة الاجتماعية</span>
                  <span className="font-bold text-slate-900">{employee.nationality || 'ليبي'} ({employee.maritalStatus} - {employee.gender})</span>
                </div>
              </div>
            </div>

            <div className="border border-slate-200 rounded-lg p-3.5 bg-slate-50/60">
              <h4 className="text-xs font-bold text-slate-800 mb-2.5 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-slate-600" />
                <span>بيانات التواصل والعنوان</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 text-xs">
                <div className="p-2.5 bg-white rounded border border-slate-200">
                  <span className="text-slate-500 block mb-1">رقم الهاتف</span>
                  <span className="font-mono font-bold text-slate-900">{employee.phone || 'غير مسجل'}</span>
                </div>

                <div className="p-2.5 bg-white rounded border border-slate-200">
                  <span className="text-slate-500 block mb-1">البريد الإلكتروني</span>
                  <span className="font-mono text-slate-900">{employee.email || 'غير مسجل'}</span>
                </div>

                <div className="p-2.5 bg-white rounded border border-slate-200">
                  <span className="text-slate-500 block mb-1">العنوان الحالي</span>
                  <span className="font-bold text-slate-900">{employee.address || 'المرج'}</span>
                </div>

                <div className="p-2.5 bg-white rounded border border-slate-200">
                  <span className="text-slate-500 block mb-1">فصيلة الدم</span>
                  <span className="font-bold text-slate-900">{employee.bloodType || 'غير محدد'}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. JOB & GRADE TAB */}
        {activeTab === 'job' && (
          <div className="space-y-3.5">
            {/* External Transfer / Status Info Box */}
            {(employee.status === 'منقول خارجياً' || employee.transferredTo || employee.isOutsideCadre) && (
              <div className="p-3 bg-slate-100 border border-slate-300 rounded-lg flex flex-wrap items-center justify-between gap-3 text-xs">
                <div>
                  <span className="text-[11px] font-bold text-slate-800 block">حالة الموظف: خارج الملاك الوظيفي ({employee.status})</span>
                  {employee.transferredTo && (
                    <span className="text-xs font-bold text-slate-900 mt-0.5 block">
                      الجهة المنقول إليها: <strong className="text-slate-950">{employee.transferredTo}</strong>
                    </span>
                  )}
                </div>
                <span className="px-2.5 py-1 bg-slate-800 text-white rounded text-xs font-bold">
                  نقل خارج المؤسسة
                </span>
              </div>
            )}

            {/* Sub-block 1: Original Appointment Data */}
            <div className="border border-amber-200 rounded-lg p-3.5 bg-amber-50/40 space-y-2.5">
              <div className="flex items-center justify-between border-b border-amber-200 pb-2">
                <h4 className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                  <span>بيانات التعيين الأصلية (التصنيف عند التعيين - تاريخي ثابت)</span>
                </h4>
                <span className="text-[10px] text-amber-800 bg-amber-100/70 border border-amber-300 px-2 py-0.5 rounded font-medium">
                  بيانات تاريخية لا تتغير بالترقيات
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 text-xs">
                <div className="p-2.5 bg-white rounded border border-amber-200/80">
                  <span className="text-amber-800/80 block mb-1 text-[11px]">نظام الدرجة المعين عليها</span>
                  <span className="font-bold text-slate-900">{employee.appointmentSalarySystem || 'جدول مرتبات القانون 15'}</span>
                </div>

                <div className="p-2.5 bg-white rounded border border-amber-200/80">
                  <span className="text-amber-800/80 block mb-1 text-[11px]">الدرجة المعين عليها</span>
                  <span className="font-extrabold text-amber-950 text-sm">{employee.appointmentGrade || 'الدرجة السادسة'}</span>
                </div>

                <div className="p-2.5 bg-white rounded border border-amber-200/80">
                  <span className="text-amber-800/80 block mb-1 text-[11px]">عدد العلاوات عند التعيين</span>
                  <span className="font-bold text-slate-900">{employee.appointmentIncrements ?? 0} علاوات</span>
                </div>

                <div className="p-2.5 bg-white rounded border border-amber-200/80">
                  <span className="text-amber-800/80 block mb-1 text-[11px]">جهة التعيين الأصلية</span>
                  <span className="font-bold text-slate-900">{employee.hiringEntity || 'وزارة الصحة'}</span>
                </div>

                <div className="p-2.5 bg-white rounded border border-amber-200/80">
                  <span className="text-amber-800/80 block mb-1 text-[11px]">تاريخ التعيين الأول</span>
                  <span className="font-mono font-bold text-slate-900">{formatDateDisplay(employee.hireDate)}</span>
                </div>

                <div className="p-2.5 bg-white rounded border border-amber-200/80">
                  <span className="text-amber-800/80 block mb-1 text-[11px]">تاريخ المباشرة الأولى</span>
                  <span className="font-mono font-bold text-slate-900">{formatDateDisplay(employee.directingDate)}</span>
                </div>

                <div className="p-2.5 bg-white rounded border border-amber-200/80 sm:col-span-2">
                  <span className="text-amber-800/80 block mb-1 text-[11px]">بدء العمل بمصرف الدم المركزي</span>
                  <span className="font-mono font-bold text-slate-900">{formatDateDisplay(employee.bloodBankStartDate)}</span>
                </div>
              </div>
            </div>

            {/* Sub-block 2: Current Job & Cadre */}
            <div className="border border-slate-200 rounded-lg p-3.5 bg-slate-50/60">
              <h4 className="text-xs font-bold text-slate-800 mb-2.5 flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-slate-600" />
                <span>البيانات الوظيفية والملاك الحالي</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 text-xs">
                <div className="p-2.5 bg-white rounded border border-slate-200">
                  <span className="text-slate-500 block mb-1">القسم / الإدارة</span>
                  <span className="font-bold text-slate-900">{employee.department}</span>
                </div>

                <div className="p-2.5 bg-white rounded border border-slate-200">
                  <span className="text-slate-500 block mb-1">المسمى الوظيفي</span>
                  <span className="font-bold text-slate-900">{employee.jobTitle}</span>
                </div>

                <div className="p-2.5 bg-white rounded border border-slate-200">
                  <span className="text-slate-500 block mb-1">رقم الملاك الوظيفي</span>
                  <span className="font-mono font-bold text-slate-900">{employee.cadreNumber}</span>
                </div>

                <div className="p-2.5 bg-white rounded border border-slate-200">
                  <span className="text-slate-500 block mb-1">التصنيف المهني</span>
                  <span className="font-bold text-slate-900">{employee.assignmentCategory || 'إداري'}</span>
                </div>
              </div>
            </div>

            {/* Educational Info Box */}
            <div className="border border-slate-200 rounded-lg p-3.5 bg-slate-50/60">
              <div className="flex justify-between items-center mb-2.5">
                <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <GraduationCap className="w-3.5 h-3.5 text-slate-600" />
                  <span>المؤهل العلمي المسجل بالبيانات الأساسية للموظف</span>
                </h4>
                <button
                  type="button"
                  onClick={() => setActiveTab('qualifications')}
                  className="text-[11px] text-slate-700 hover:text-slate-950 font-bold underline flex items-center gap-0.5 cursor-pointer"
                >
                  <span>عرض سجل المؤهلات والدورات</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 text-xs">
                <div className="p-2.5 bg-white rounded border border-slate-200">
                  <span className="text-slate-500 block mb-0.5">الدرجة العلمية:</span>
                  <strong className="text-slate-900 text-sm font-bold">{employee.qualification || 'غير مسجل'}</strong>
                </div>
                <div className="p-2.5 bg-white rounded border border-slate-200">
                  <span className="text-slate-500 block mb-0.5">التخصص الدقيق:</span>
                  <strong className="text-slate-900">{employee.specialization || 'عام'}</strong>
                </div>
                <div className="p-2.5 bg-white rounded border border-slate-200">
                  <span className="text-slate-500 block mb-0.5">اسم الجامعة / المؤسسة:</span>
                  <strong className="text-slate-900">{employee.university || '-'} ({employee.educationType || 'جامعة عامة'})</strong>
                </div>
                <div className="p-2.5 bg-white rounded border border-slate-200">
                  <span className="text-slate-500 block mb-0.5">سنة التخرج:</span>
                  <strong className="font-mono text-slate-900">{employee.graduationYear || '-'}</strong>
                </div>
              </div>
            </div>

            {/* Current Grade & References Box */}
            <div className="border border-red-200 rounded-lg p-3.5 bg-red-50/40 space-y-2.5">
              <div className="flex items-center justify-between border-b border-red-200 pb-2">
                <h4 className="text-xs font-bold text-red-950 flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-red-700" />
                  <span>الوضع المالي والدرجة الحالية والترقيات</span>
                </h4>
                <span className="text-[10px] text-red-800 bg-red-100/70 border border-red-300 px-2 py-0.5 rounded font-medium">
                  ديناميكي (يتغير بالترقيات والعلاوات)
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 text-xs">
                <div className="p-2.5 bg-white rounded border border-red-200">
                  <span className="text-slate-500 block mb-1">الدرجة الحالية</span>
                  <span className="font-extrabold text-red-950 text-sm">{employee.jobGrade}</span>
                </div>
                <div className="p-2.5 bg-white rounded border border-red-200">
                  <span className="text-slate-500 block mb-1">عدد العلاوات المعتمدة</span>
                  <span className="font-bold text-slate-900 text-sm">+{employee.currentIncrement || 0} علاوات</span>
                </div>
                <div className="p-2.5 bg-white rounded border border-red-200">
                  <span className="text-slate-500 block mb-1">تاريخ الحصول على الدرجة</span>
                  <span className="font-mono font-bold text-slate-900">{formatDateDisplay(employee.gradeEntryDate)}</span>
                </div>
                <div className="p-2.5 bg-white rounded border border-red-200">
                  <span className="text-slate-500 block mb-1">تاريخ استحقاق الترقية القادمة</span>
                  <span className="font-mono font-bold text-slate-900">{formatDateDisplay(employee.eligibilityDate)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 3. QUALIFICATIONS & TRAINING COURSES TAB */}
        {activeTab === 'qualifications' && (
          <div className="space-y-3.5">
            {/* Header & Controls */}
            <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <h4 className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                  <GraduationCap className="w-4 h-4 text-slate-700" />
                  <span>سجل المؤهلات العلمية والدورات التدريبية المعتمدة للموظف ({employeeQuals.length})</span>
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  سجل المؤهلات الإضافية والدورات التدريبية والشهادات المهنية والمستندات الرسمية
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsQualPrintOpen(true)}
                  className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-lg text-xs font-bold flex items-center gap-1 shadow-2xs cursor-pointer transition"
                  title="طباعة سجل المؤهلات والدورات"
                >
                  <Printer className="w-3.5 h-3.5 text-slate-600" />
                  <span>طباعة السجل الرسمي</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setEditingQualRecord(null);
                    setIsQualModalOpen(true);
                  }}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-2xs cursor-pointer transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ إضافة مؤهل أو دورة</span>
                </button>
              </div>
            </div>

            {/* Main Qualification Highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 text-xs">
              <div className="p-2.5 bg-slate-50/70 border border-slate-200 rounded-lg">
                <span className="text-slate-500 block mb-1">المؤهل الرئيسي بالملف</span>
                <span className="font-bold text-slate-900">{employee.qualification || 'غير محدد'}</span>
              </div>
              <div className="p-2.5 bg-slate-50/70 border border-slate-200 rounded-lg">
                <span className="text-slate-500 block mb-1">التخصص الدقيق</span>
                <span className="font-bold text-slate-900">{employee.specialization || 'عام'}</span>
              </div>
              <div className="p-2.5 bg-slate-50/70 border border-slate-200 rounded-lg">
                <span className="text-slate-500 block mb-1">الجامعة / الكلية</span>
                <span className="font-bold text-slate-900">{employee.university || '-'}</span>
              </div>
              <div className="p-2.5 bg-slate-50/70 border border-slate-200 rounded-lg">
                <span className="text-slate-500 block mb-1">سنة التخرج / نوع التعليم</span>
                <span className="font-bold text-slate-900 font-mono">
                  {employee.graduationYear || '-'} ({employee.educationType || 'جامعة عامة'})
                </span>
              </div>
            </div>

            {/* Qualifications & Training Courses Table */}
            {employeeQuals.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs border border-slate-200 rounded-lg bg-slate-50/50 space-y-2">
                <GraduationCap className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="font-bold text-slate-700">لا توجد سجلات مؤهلات إضافية أو دورات تدريبية مسجلة للموظف.</p>
                <p className="text-[11px] text-slate-500">انقر على زر "+ إضافة مؤهل أو دورة" بالأعلى لإضافة سجل جديد مع إمكانية إرفاق الشهادة.</p>
              </div>
            ) : (
              <div className="overflow-x-auto border border-slate-200 rounded-lg">
                <table className="w-full text-xs text-right">
                  <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-2.5 border-l border-slate-200 text-center w-10">#</th>
                      <th className="p-2.5 border-l border-slate-200">النوع</th>
                      <th className="p-2.5 border-l border-slate-200">اسم المؤهل / الدورة</th>
                      <th className="p-2.5 border-l border-slate-200">التخصص</th>
                      <th className="p-2.5 border-l border-slate-200">الجهة / الجامعة</th>
                      <th className="p-2.5 border-l border-slate-200 text-center">المدة</th>
                      <th className="p-2.5 border-l border-slate-200 text-center">السنة / التاريخ</th>
                      <th className="p-2.5 border-l border-slate-200 text-center">المستند</th>
                      <th className="p-2.5 text-center w-24">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {employeeQuals.map((q, idx) => (
                      <tr key={q.id} className="hover:bg-slate-50/70 transition">
                        <td className="p-2.5 border-l border-slate-200 text-center font-bold text-slate-500">{idx + 1}</td>
                        <td className="p-2.5 border-l border-slate-200">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                            q.recordType === 'مؤهل علمي'
                              ? 'bg-blue-50 text-blue-900 border-blue-200'
                              : q.recordType === 'دورة تدريبية'
                              ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                              : 'bg-amber-50 text-amber-900 border-amber-200'
                          }`}>
                            {q.recordType}
                          </span>
                        </td>
                        <td className="p-2.5 border-l border-slate-200 font-bold text-slate-900">
                          <div>{q.title}</div>
                          {q.notes && <div className="text-[10px] text-slate-500 font-normal">{q.notes}</div>}
                        </td>
                        <td className="p-2.5 border-l border-slate-200 text-slate-700">{q.specialization || '-'}</td>
                        <td className="p-2.5 border-l border-slate-200 text-slate-700">
                          {q.universityOrInstitute || q.executor || q.issuingAuthority || '-'}
                        </td>
                        <td className="p-2.5 border-l border-slate-200 text-center text-slate-600">{q.duration || '-'}</td>
                        <td className="p-2.5 border-l border-slate-200 text-center font-mono font-bold text-slate-900">
                          {q.graduationYear || (q.completionDate ? formatDateDisplay(q.completionDate) : '-')}
                        </td>
                        <td className="p-2.5 border-l border-slate-200 text-center">
                          {q.documentPath ? (
                            <a
                              href={q.documentPath}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded border border-slate-300 text-[11px] font-bold cursor-pointer"
                              title="عرض المستند المرفق"
                            >
                              <FileText className="w-3 h-3 text-slate-600" />
                              <span>عرض</span>
                            </a>
                          ) : (
                            <span className="text-slate-400 text-[10px]">-</span>
                          )}
                        </td>
                        <td className="p-2.5 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingQualRecord(q);
                                setIsQualModalOpen(true);
                              }}
                              className="p-1 text-slate-700 hover:bg-slate-100 rounded transition cursor-pointer"
                              title="تعديل"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteQual(q.id, q.title)}
                              className="p-1 text-rose-700 hover:bg-rose-50 rounded transition cursor-pointer"
                              title="حذف"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* 4. CAREER PROMOTIONS & INCREMENTS TAB (بيانات الترقيات الوظيفية المدمجة) */}
        {activeTab === 'career_promotions' && (
          <div className="space-y-3.5">
            {/* Header with Print and Actions */}
            <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <h4 className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-slate-700" />
                  <span>بيانات الترقيات والعلاوات الوظيفية والندب على درجة ({fullCareerHistory.length} إجراء)</span>
                </h4>
                <p className="text-[11px] text-slate-600 mt-0.5">
                  الدرجة الحالية: <strong className="text-slate-900">{employee.jobGrade}</strong> | رصيد العلاوات: <strong className="text-slate-900">+{employee.currentIncrement || 1} علاوة</strong> | تاريخ الاستحقاق: <span className="font-mono font-bold text-slate-900">{formatDateDisplay(employee.eligibilityDate)}</span>
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsCareerReportOpen(true)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-2xs cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5 text-slate-300" />
                  <span>طباعة سجل المسار المهني</span>
                </button>

                <button
                  type="button"
                  onClick={() => onOpenIncrementDetails(employee)}
                  className="px-3 py-1.5 bg-amber-700 hover:bg-amber-800 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-2xs cursor-pointer"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-200" />
                  <span>تعديل العلاوة يدوياً</span>
                </button>
              </div>
            </div>

            {/* Summary Statistics Breakdown Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 text-xs">
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="text-slate-500 block mb-1">الترقيات الدورية</span>
                <span className="font-bold text-slate-900 text-sm">{careerSummary.promotionsCount}</span>
              </div>

              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="text-slate-500 block mb-1">العلاوات الدورية</span>
                <span className="font-bold text-slate-900 text-sm">{careerSummary.annualIncrementsCount}</span>
              </div>

              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="text-slate-500 block mb-1">ترقيات استثنائية</span>
                <span className="font-bold text-slate-900 text-sm">{careerSummary.exceptionalPromotionsCount}</span>
              </div>

              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="text-slate-500 block mb-1">تسويات الوضع</span>
                <span className="font-bold text-slate-900 text-sm">{careerSummary.statusSettlementsCount}</span>
              </div>

              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="text-slate-500 block mb-1">الندب على درجة</span>
                <span className="font-bold text-slate-900 text-sm">{careerSummary.secondmentToGradeCount}</span>
              </div>
            </div>

            {/* Increment Sources Breakdown Section */}
            <div className="p-3.5 bg-slate-50/60 border border-slate-200 rounded-lg space-y-2.5">
              <h5 className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-600" />
                <span>تفصيل مصادر العلاوات المعتمدة بالملف الوظيفي (إجمالي: +{employee.currentIncrement || 1})</span>
              </h5>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                <div className="p-2 bg-white border border-slate-200 rounded">
                  <span className="text-slate-500 block mb-0.5">علاوة التعيين الأساسية</span>
                  <span className="font-bold text-slate-900 text-sm">+{breakdown.appointmentIncrements}</span>
                </div>

                <div className="p-2 bg-white border border-slate-200 rounded">
                  <span className="text-slate-500 block mb-0.5">علاوات سنوية دورية</span>
                  <span className="font-bold text-slate-900 text-sm">+{breakdown.annualAutoIncrements}</span>
                </div>

                <div className="p-2 bg-white border border-slate-200 rounded">
                  <span className="text-slate-500 block mb-0.5">علاوات تسويات وظيفية</span>
                  <span className="font-bold text-slate-900 text-sm">+{breakdown.settlementIncrements}</span>
                </div>

                <div className="p-2 bg-white border border-slate-200 rounded">
                  <span className="text-slate-500 block mb-0.5">علاوات ترقيات / ندب</span>
                  <span className="font-bold text-slate-900 text-sm">
                    +{breakdown.promotionIncrements + breakdown.exceptionalPromotionIncrements + breakdown.manualIncrements}
                  </span>
                </div>
              </div>
            </div>

            {/* Unified Chronological Career History Table / Cards */}
            <div className="space-y-2">
              <h5 className="font-bold text-xs text-slate-900">
                السجل الزمني التراكمي لقرارات المسار الوظيفي ({fullCareerHistory.length} إجراء مسجل)
              </h5>

              {fullCareerHistory.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs border border-slate-200 rounded-lg bg-slate-50/50">
                  لا توجد قرارات ترقية أو ندب على درجة أو تسوية سابقة مسجلة للموظف (الموظف على الدرجة المعين عليها أو التسوية المعتمدة).
                </div>
              ) : (
                <div className="space-y-2">
                  {fullCareerHistory.map((rec) => {
                    const meta = getCareerActionMeta(rec.actionType);
                    return (
                      <div key={rec.id} className="p-3 bg-slate-50/70 border border-slate-200 rounded-lg flex flex-wrap justify-between items-center gap-2 text-xs">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${meta.badgeColor}`}>
                              {rec.actionType}
                            </span>
                            <span className="font-bold text-slate-900">
                              {rec.actionType === 'علاوة دورية' 
                                ? `منح علاوة سنوية (${rec.newIncrement})`
                                : `${rec.newGrade} (علاوة ${rec.newIncrement})`
                              }
                            </span>
                          </div>
                          <div className="text-slate-500 text-[11px] mt-1">
                            القرار: <strong className="text-slate-700">{rec.decisionNumber || 'غير محدد'}</strong> | التاريخ: <span className="font-mono text-slate-800">{formatDateDisplay(rec.actionDate || rec.decisionDate)}</span>
                            {rec.issuingAuthority && ` | الجهة المصدرة: ${rec.issuingAuthority}`}
                            {rec.notes && ` | ${rec.notes}`}
                          </div>
                        </div>

                        <div className="text-left">
                          {rec.previousGrade && rec.previousGrade !== rec.newGrade && (
                            <span className="text-[11px] text-slate-600 font-bold block">
                              من: {rec.previousGrade}
                            </span>
                          )}
                          <span className="font-mono text-[11px] text-slate-400">
                            {formatDateDisplay(rec.decisionDate)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 5. LEAVES TAB */}
        {activeTab === 'leaves' && (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="font-bold text-xs text-slate-800">
                سجل الإجازات المسجلة ({employeeLeaves.length})
              </span>
              <button
                type="button"
                onClick={() => onOpenLeaveModal(employee.id)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-2xs cursor-pointer"
              >
                <Calendar className="w-3.5 h-3.5 text-slate-300" />
                <span>تسجيل إجازة جديدة</span>
              </button>
            </div>

            {employeeLeaves.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs border border-slate-200 rounded-lg bg-slate-50/50">
                لا توجد إجازات سابقة مسجلة للموظف في المنظومة.
              </div>
            ) : (
              <div className="overflow-x-auto border border-slate-200 rounded-lg">
                <table className="w-full text-xs text-right">
                  <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-2.5 border-l border-slate-200">نوع الإجازة</th>
                      <th className="p-2.5 border-l border-slate-200 text-center">المدة (أيام)</th>
                      <th className="p-2.5 border-l border-slate-200">من تاريخ</th>
                      <th className="p-2.5 border-l border-slate-200">إلى تاريخ</th>
                      <th className="p-2.5 border-l border-slate-200">تاريخ المباشرة</th>
                      <th className="p-2.5 text-center">الحالة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {employeeLeaves.map((l) => (
                      <tr key={l.id} className="hover:bg-slate-50 transition">
                        <td className="p-2.5 border-l border-slate-200 font-bold text-slate-900">{l.leaveType}</td>
                        <td className="p-2.5 border-l border-slate-200 font-mono font-bold text-center">{l.durationDays}</td>
                        <td className="p-2.5 border-l border-slate-200 font-mono">{formatDateDisplay(l.startDate)}</td>
                        <td className="p-2.5 border-l border-slate-200 font-mono">{formatDateDisplay(l.endDate)}</td>
                        <td className="p-2.5 border-l border-slate-200 font-mono">{formatDateDisplay(l.returnDate)}</td>
                        <td className="p-2.5 text-center">
                          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-800 text-[10px] font-bold border border-slate-200">
                            {l.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* 6. DOCUMENTS & PDF TAB */}
        {activeTab === 'documents' && (
          <div className="space-y-3.5">
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <h4 className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-slate-700" />
                  <span>المستندات والملف الإلكتروني المرفق للموظف</span>
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  يمكن إرفاق وثيقة بصيغة PDF أو صورة رسمية للقرار أو بطاقة التعيين
                </p>
              </div>

              <label className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-2xs cursor-pointer transition">
                <Upload className="w-3.5 h-3.5 text-slate-300" />
                <span>{isUploadingDoc ? 'جاري التحميل...' : 'إرفاق مستند جديد'}</span>
                <input
                  type="file"
                  accept=".pdf,image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={isUploadingDoc}
                />
              </label>
            </div>

            {employee.pdfPath ? (
              <div className="p-3.5 bg-slate-50 border border-slate-300 rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-200 rounded text-slate-800">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="font-bold text-xs text-slate-950">
                      {employee.pdfFileName || `ملف_الموظف_${employee.jobNumber || employee.id}.pdf`}
                    </div>
                    <div className="text-[11px] text-slate-600 flex items-center gap-1 mt-0.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>المستند محفوظ ومتاح للعرض والتحميل</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={employee.pdfPath}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-2xs cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5 text-slate-300" />
                    <span>عرض الملف</span>
                  </a>

                  <a
                    href={employee.pdfPath}
                    download={employee.pdfFileName || `employee_${employee.jobNumber || employee.id}.pdf`}
                    className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-slate-600" />
                    <span>تنزيل</span>
                  </a>

                  <button
                    type="button"
                    onClick={handleRemoveDoc}
                    className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>إزالة</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-slate-500 text-xs border border-slate-200 rounded-lg bg-slate-50/50">
                لا يوجد مستند أو ملف PDF مرفق لهذا الموظف حالياً. استخدم الزر أعلاه لإرفاق المستند.
              </div>
            )}
          </div>
        )}

        {/* 7. TRANSFERS & RESIGNATIONS TAB */}
        {activeTab === 'transfers_resignations' && (
          <div className="space-y-3.5">
            <h4 className="font-bold text-xs text-slate-900">
              سجل النقل والندب الخارجي وإنهاء الخدمة
            </h4>

            {employeeTransfers.length === 0 && employeeSecondments.length === 0 && employeeResignations.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs border border-slate-200 rounded-lg bg-slate-50/50">
                لا توجد سجلات نقل أو ندب خارج المؤسسة أو استقالة مسجلة للموظف. الموظف بحالة ({employee.status}).
              </div>
            ) : (
              <div className="space-y-2">
                {employeeTransfers.map((t) => (
                  <div key={t.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs flex justify-between items-center">
                    <div>
                      <span className="px-2 py-0.5 bg-slate-800 text-white rounded font-bold text-[10px]">نقل خارجي</span>
                      <strong className="text-slate-900 mr-2">نقل إلى: {t.transferredTo}</strong>
                      <div className="text-slate-500 text-[11px] mt-1">
                        قرار: {t.decisionNumber} | التاريخ: {formatDateDisplay(t.decisionDate || t.effectiveDate)}
                      </div>
                    </div>
                  </div>
                ))}
                {employeeSecondments.map((s) => (
                  <div key={s.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs flex justify-between items-center">
                    <div>
                      <span className="px-2 py-0.5 bg-slate-800 text-white rounded font-bold text-[10px]">ندب خارجي</span>
                      <strong className="text-slate-900 mr-2">ندب إلى: {s.secondedTo}</strong>
                      <div className="text-slate-500 text-[11px] mt-1">
                        قرار: {s.decisionNumber} | المدة: {s.durationMonths || 12} شهر
                      </div>
                    </div>
                  </div>
                ))}
                {employeeResignations.map((r) => (
                  <div key={r.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs flex justify-between items-center">
                    <div>
                      <span className="px-2 py-0.5 bg-slate-800 text-white rounded font-bold text-[10px]">إنهاء خدمة / استقالة</span>
                      <strong className="text-slate-900 mr-2">السبب: {r.reason}</strong>
                      <div className="text-slate-500 text-[11px] mt-1">
                        تاريخ السريان: {formatDateDisplay(r.effectiveDate)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 8. DISCIPLINARY TAB */}
        {activeTab === 'disciplinary' && (
          <div className="space-y-3.5">
            <h4 className="font-bold text-xs text-slate-900">
              سجل الخصومات والإنذارات والعقوبات الإدارية ({employeeDisciplinary.length})
            </h4>

            {employeeDisciplinary.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs border border-slate-200 rounded-lg bg-slate-50/50">
                الملف نظيف. لا توجد أي إنذارات أو خصومات إدارية مسجلة على الموظف.
              </div>
            ) : (
              <div className="space-y-2">
                {employeeDisciplinary.map((d) => (
                  <div key={d.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs flex justify-between items-center">
                    <div>
                      <span className="px-2 py-0.5 bg-slate-800 text-white rounded font-bold text-[10px]">{d.recordType || d.penaltyType || d.actionType || 'تنبيه'}</span>
                      <strong className="text-slate-900 mr-2">{d.reason}</strong>
                      <div className="text-slate-500 text-[11px] mt-1">
                        كتاب/قرار: {d.letterNumber || d.decisionNumber || '—'} | الخصم: {d.numberOfDays || d.deductionDays || 0} يوم | التاريخ: {formatDateDisplay(d.effectiveDate || d.actionDate || d.decisionDate)}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedDisciplinaryLetter(d)}
                      className="px-2.5 py-1.5 bg-red-800 hover:bg-red-900 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-2xs transition cursor-pointer"
                      title="طباعة الخطاب الرسمي المعتمد"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>طباعة خطاب</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ANNUAL EVALUATIONS TAB */}
        {activeTab === 'annual_evaluations' && (
          <div className="space-y-3.5">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-2 border-b border-slate-200">
              <div>
                <h4 className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                  <FileCheck2 className="w-4 h-4 text-emerald-700" />
                  <span>تقارير تقييم الكفاءة السنوية للموظف ({employeeEvaluations.length})</span>
                </h4>
                <p className="text-[11px] text-slate-600 mt-0.5">
                  نماذج واستمارات تقارير الكفاءة السنوية الرسمية المصممة للطباعة والتوقيع والحفظ بالملف
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  const newEval = createNewEvaluation(
                    employee,
                    new Date().getFullYear(),
                    careerRecords,
                    promotions,
                    generalManagerName || 'نجيب صالح سالم',
                    currentUser || 'شؤون الموظفين'
                  );
                  setActiveEvalModalDoc(newEval);
                }}
                className="px-3 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ إنشاء تقرير كفاءة سنوي</span>
              </button>
            </div>

            {employeeEvaluations.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs border border-slate-200 rounded-xl bg-slate-50/50 space-y-2">
                <FileCheck2 className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="font-bold text-slate-700">لا توجد تقارير كفاءة سنوية مسجلة لهذا الموظف حتى الآن</p>
                <p className="text-[11px] text-slate-600">يمكنك إنشاء تقرير كفاءة سنوي رسمي جاهز للطباعة على ورقة A4 وتعبئة البيانات تلقائياً</p>
                <button
                  type="button"
                  onClick={() => {
                    const newEval = createNewEvaluation(
                      employee,
                      new Date().getFullYear(),
                      careerRecords,
                      promotions,
                      generalManagerName || 'نجيب صالح سالم',
                      currentUser || 'شؤون الموظفين'
                    );
                    setActiveEvalModalDoc(newEval);
                  }}
                  className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-800 text-white rounded-lg text-xs font-bold hover:bg-emerald-900 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>إنشاء تقرير كفاءة الآن</span>
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-2.5">سنة التقييم</th>
                      <th className="p-2.5">الفترة المشمولة</th>
                      <th className="p-2.5">الدرجة والوظيفة المقيدة</th>
                      <th className="p-2.5">نمط التقرير</th>
                      <th className="p-2.5">المجموع والتقدير</th>
                      <th className="p-2.5">الحالة</th>
                      <th className="p-2.5 text-center">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {employeeEvaluations.map((ev) => (
                      <tr key={ev.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-2.5 font-bold text-slate-900">{ev.evaluationYear}</td>
                        <td className="p-2.5 text-slate-600 text-[11px]">{ev.periodText || `${ev.periodStart} إلى ${ev.periodEnd}`}</td>
                        <td className="p-2.5">
                          <div className="font-semibold text-slate-800">{ev.currentGrade}</div>
                          <div className="text-[11px] text-slate-500">{ev.currentJobTitle}</div>
                        </td>
                        <td className="p-2.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            ev.mode === 'إلكتروني' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}>
                            {ev.mode === 'إلكتروني' ? 'إلكتروني مكتمل' : 'يدوي معد للطباعة'}
                          </span>
                        </td>
                        <td className="p-2.5">
                          {ev.performanceRating ? (
                            <div>
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                ev.performanceRating === 'ممتاز' ? 'bg-emerald-100 text-emerald-800' :
                                ev.performanceRating === 'جيد جداً' ? 'bg-blue-100 text-blue-800' :
                                ev.performanceRating === 'جيد' ? 'bg-yellow-100 text-yellow-800' :
                                ev.performanceRating === 'متوسط' ? 'bg-orange-100 text-orange-800' :
                                'bg-rose-100 text-rose-800'
                              }`}>
                                {ev.performanceRating}
                              </span>
                              {ev.performanceScore && (
                                <span className="text-[11px] text-slate-600 font-bold mr-1.5">({ev.performanceScore}/100)</span>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-500 text-[11px]">—</span>
                          )}
                        </td>
                        <td className="p-2.5">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            ev.status === 'معتمد' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                            ev.status === 'جاهز للطباعة' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                            'bg-slate-100 text-slate-700 border border-slate-200'
                          }`}>
                            {ev.status}
                          </span>
                        </td>
                        <td className="p-2.5 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setActiveEvalModalDoc(ev)}
                              title="معاينة وطباعة النموذج الرسمي A4 وتعديل التقرير"
                              className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded font-medium text-[11px] flex items-center gap-1 transition-colors"
                            >
                              <Printer className="w-3 h-3 text-slate-600" />
                              <span>معاينة وطباعة A4</span>
                            </button>
                            {onDeleteEvaluation && (
                              <button
                                type="button"
                                onClick={() => {
                                  if (window.confirm(`هل أنت متأكد من حذف تقرير الكفاءة لسنة ${ev.evaluationYear} للموظف؟`)) {
                                    onDeleteEvaluation(ev.id);
                                  }
                                }}
                                title="حذف التقرير"
                                className="p-1 text-rose-600 hover:bg-rose-50 rounded transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* 9. PROCEDURES TAB */}
        {activeTab === 'procedures' && (
          <div className="space-y-3.5">
            <h4 className="font-bold text-xs text-slate-900">
              سجل الإجراءات والقرارات الإدارية المعتمدة ({employeeProcedures.length})
            </h4>

            {employeeProcedures.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs border border-slate-200 rounded-lg bg-slate-50/50">
                لا توجد إجراءات إدارية عامة مسجلة للموظف.
              </div>
            ) : (
              <div className="space-y-2">
                {employeeProcedures.map((p) => (
                  <div key={p.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs flex justify-between items-center">
                    <div>
                      <strong className="text-slate-900">{p.description}</strong>
                      <div className="text-slate-500 text-[11px] mt-1">
                        رقم الإجراء: {p.procedureNumber} | التاريخ: {formatDateDisplay(p.procedureDate)} | الجهة: {p.decisionAuthority}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>

      {/* Career Report Modal */}
      <EmployeeCareerReportModal
        isOpen={isCareerReportOpen}
        onClose={() => setIsCareerReportOpen(false)}
        employee={employee}
        careerRecords={careerRecords}
        promotions={promotions}
        increments={increments}
        settlements={settlements}
      />

      {/* Qualifications Modal for Add/Edit */}
      <QualificationRecordModal
        isOpen={isQualModalOpen}
        onClose={() => {
          setIsQualModalOpen(false);
          setEditingQualRecord(null);
        }}
        employee={employee}
        recordToEdit={editingQualRecord}
        onSave={(record) => {
          if (editingQualRecord && onUpdateQualification) {
            onUpdateQualification(record);
          } else if (onAddQualification) {
            onAddQualification(record);
          }
        }}
        currentUser={currentUser}
      />

      {/* Official Qualifications Print Report Modal */}
      <OfficialQualificationsPrintModal
        isOpen={isQualPrintOpen}
        onClose={() => setIsQualPrintOpen(false)}
        employee={employee}
        qualifications={qualifications}
      />

      {/* Official Performance Evaluation Modal */}
      {activeEvalModalDoc && (
        <OfficialPerformanceEvaluationModal
          isOpen={!!activeEvalModalDoc}
          onClose={() => setActiveEvalModalDoc(null)}
          evaluation={activeEvalModalDoc}
          employee={employee}
          careerRecords={careerRecords}
          promotions={promotions}
          generalManagerName={generalManagerName}
          officialLogoUrl={officialLogoUrl}
          currentUser={currentUser}
          onSave={(updatedEval) => {
            if (onSaveEvaluation) {
              onSaveEvaluation(updatedEval);
            }
            setActiveEvalModalDoc(null);
          }}
          onDelete={(id) => {
            if (onDeleteEvaluation) {
              onDeleteEvaluation(id);
            }
            setActiveEvalModalDoc(null);
          }}
        />
      )}

      {/* Official Disciplinary Letter Modal */}
      {selectedDisciplinaryLetter && (
        <OfficialDisciplinaryLetterModal
          record={selectedDisciplinaryLetter}
          employee={employee}
          onClose={() => setSelectedDisciplinaryLetter(null)}
          currentUser={currentUser}
          generalManagerName={generalManagerName}
          officialLogoUrl={officialLogoUrl}
        />
      )}
    </div>
  );
};
