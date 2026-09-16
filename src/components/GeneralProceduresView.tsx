import React, { useState, useMemo } from 'react';
import { 
  Employee, 
  GeneralProcedure, 
  IncrementRecord,
  BulkOperationRecord,
  AuditLog,
  CareerPromotionRecord,
  PromotionRecord,
  StatusSettlementRecord,
  SecondmentRecord,
  TransferRecord,
  LeaveTransaction,
  DisciplinaryRecord,
  ResignationRecord,
  EmployeeQualificationRecord,
  AnnualPerformanceEvaluation,
  UserAccount
} from '../types';
import { 
  FileText, 
  Plus, 
  Search, 
  Printer, 
  Eye, 
  Trash2, 
  Calendar, 
  Building2, 
  FileCheck, 
  FileDown, 
  Loader2, 
  CheckCircle2, 
  X,
  TrendingUp,
  Palmtree,
  Users,
  History,
  Undo2,
  Sparkles,
  Award,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Database,
  FileSpreadsheet,
  Download,
  Upload,
  RefreshCw,
  Layers,
  Zap,
  HardDrive,
  Check,
  RotateCcw,
  Activity,
  ClipboardCheck,
  AlertOctagon
} from 'lucide-react';
import { exportElementToPdf } from '../utils/pdfExport';
import { getTodayDateStorage, getCurrentTimestamp } from '../utils/dateUtils';
import { FullAppDatabase } from '../utils/storageTypes';
import { DiagnosticCheckResult } from '../utils/backupTypes';
import { AnnualIncrementSection } from './generalActions/AnnualIncrementSection';
import { LeaveBulkSection } from './generalActions/LeaveBulkSection';
import { EmployeeBulkSection } from './generalActions/EmployeeBulkSection';
import { GeneralActionsLogTable } from './generalActions/GeneralActionsLogTable';
import { UndoBulkActionModal } from './generalActions/UndoBulkActionModal';
import { AnnualIncrementReportModal } from './generalActions/AnnualIncrementReportModal';

// Administrative, Audit & Maintenance Modals
import { ExcelImportModal } from './ExcelImportModal';
import { EmployeeReviewModal } from './EmployeeReviewModal';
import { RebuildCurrentGradesModal } from './RebuildCurrentGradesModal';
import { GradeChronologyAuditModal } from './GradeChronologyAuditModal';
import { DatabaseFinalAuditModal } from './DatabaseFinalAuditModal';
import { TestRecordsCleanupModal } from './TestRecordsCleanupModal';
import { ResetEmployeeDatabaseModal } from './ResetEmployeeDatabaseModal';
import { createDatabaseBackup, downloadBackupFile, runBackupDiagnostics } from '../utils/backupService';
import { auditDatabaseCurrentGrades } from '../utils/gradeCalculationEngine';

interface GeneralProceduresViewProps {
  employees: Employee[];
  procedures: GeneralProcedure[];
  increments?: IncrementRecord[];
  careerRecords?: CareerPromotionRecord[];
  promotions?: PromotionRecord[];
  settlements?: StatusSettlementRecord[];
  secondments?: SecondmentRecord[];
  transfers?: TransferRecord[];
  leaves?: LeaveTransaction[];
  disciplinary?: DisciplinaryRecord[];
  resignations?: ResignationRecord[];
  qualifications?: EmployeeQualificationRecord[];
  evaluations?: AnnualPerformanceEvaluation[];
  bulkOperations?: BulkOperationRecord[];
  fullDatabase: FullAppDatabase;
  users?: UserAccount[];
  onAddProcedure: (procedure: GeneralProcedure) => void;
  onDeleteProcedure: (id: string) => void;
  onAddIncrement?: (increment: IncrementRecord) => void;
  onUpdateEmployeeIncrement?: (employeeId: number, newIncrement: number, nextIncrementDate?: string) => void;
  onBatchUpdateEmployees?: (updatedEmployees: Employee[], auditNote?: string) => void;
  onRecordBulkOperation?: (operation: BulkOperationRecord) => void;
  onRevertBulkOperation?: (
    operation: BulkOperationRecord, 
    restoredEmployees: Employee[], 
    undoRecord: BulkOperationRecord, 
    reason: string
  ) => void;
  onAddAuditLog?: (log: AuditLog) => void;
  onUpdateEmployee?: (emp: Employee) => void;
  onCleanupComplete?: (newDatabase: FullAppDatabase, summaryMessage: string) => void;
  onImportComplete?: (result: any) => void;
  onQuickBackup?: () => void;
  onOpenBackupModal?: () => void;
  onNavigateToTab?: (tabName: string) => void;
  currentUser: string;
}

export const GeneralProceduresView: React.FC<GeneralProceduresViewProps> = ({
  employees = [],
  procedures = [],
  increments = [],
  careerRecords = [],
  promotions = [],
  settlements = [],
  secondments = [],
  transfers = [],
  leaves = [],
  disciplinary = [],
  resignations = [],
  qualifications = [],
  evaluations = [],
  bulkOperations = [],
  fullDatabase,
  users = [],
  onAddProcedure,
  onDeleteProcedure,
  onAddIncrement,
  onUpdateEmployeeIncrement,
  onBatchUpdateEmployees,
  onRecordBulkOperation,
  onRevertBulkOperation,
  onAddAuditLog,
  onUpdateEmployee,
  onCleanupComplete,
  onImportComplete,
  onQuickBackup,
  onOpenBackupModal,
  onNavigateToTab,
  currentUser
}) => {
  // Navigation Tabs within General Actions Module - Default to Consolidated Hub
  const [activeSection, setActiveSection] = useState<
    'hub' | 'annual_increments' | 'leaves_bulk' | 'employees_bulk' | 'audit_log' | 'individual_procedures'
  >('hub');

  // Consolidated Procedure Modals States
  const [isExcelImportOpen, setIsExcelImportOpen] = useState(false);
  const [isEmployeeReviewOpen, setIsEmployeeReviewOpen] = useState(false);
  const [reviewSelectedEmp, setReviewSelectedEmp] = useState<Employee | null>(null);
  const [isRebuildGradesOpen, setIsRebuildGradesOpen] = useState(false);
  const [isGradeAuditModalOpen, setIsGradeAuditModalOpen] = useState(false);
  const [isFinalAuditOpen, setIsFinalAuditOpen] = useState(false);
  const [isCleanupTestRecordsOpen, setIsCleanupTestRecordsOpen] = useState(false);
  const [isResetDbModalOpen, setIsResetDbModalOpen] = useState(false);

  // Diagnostics state
  const [diagnosticsRunning, setDiagnosticsRunning] = useState(false);
  const [diagnosticsResults, setDiagnosticsResults] = useState<DiagnosticCheckResult[]>([]);
  const [showDiagnosticsPanel, setShowDiagnosticsPanel] = useState(false);

  // Shared Modals for Undo & Reports across bulk operations
  const [selectedOpForUndo, setSelectedOpForUndo] = useState<BulkOperationRecord | null>(null);
  const [isUndoModalOpen, setIsUndoModalOpen] = useState(false);
  const [selectedOpForReport, setSelectedOpForReport] = useState<BulkOperationRecord | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  // Individual Procedures State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmpId, setSelectedEmpId] = useState<number | 'ALL'>('ALL');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [printProcedure, setPrintProcedure] = useState<GeneralProcedure | null>(null);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  // New individual procedure form state
  const [formData, setFormData] = useState<{
    employeeId: number;
    procedureType: string;
    procedureNumber: string;
    procedureDate: string;
    effectiveDate: string;
    description: string;
    reason: string;
    decisionAuthority: string;
    notes: string;
    pdfFileName: string;
  }>({
    employeeId: employees[0]?.id || 1001,
    procedureType: 'إجراء إداري',
    procedureNumber: `PROC-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
    procedureDate: getTodayDateStorage(),
    effectiveDate: getTodayDateStorage(),
    description: '',
    reason: '',
    decisionAuthority: 'مكتب الموارد البشرية - مصرف الدم المركزي المرج',
    notes: '',
    pdfFileName: ''
  });

  const procedureTypes = [
    'إجراء إداري',
    'قرار إداري',
    'تكليف',
    'مذكرة داخلية',
    'إخطار موارد بشرية',
    'تحديث مستندات',
    'تحديث حالة',
    'أخرى'
  ];

  // Grade Chronology stats calculation
  const gradeAuditStats = useMemo(() => {
    return auditDatabaseCurrentGrades(
      employees,
      careerRecords,
      promotions,
      increments,
      settlements,
      procedures
    );
  }, [employees, careerRecords, promotions, increments, settlements, procedures]);

  // Execute quick backup download
  const handleDownloadBackup = async () => {
    if (onQuickBackup) {
      onQuickBackup();
      return;
    }
    try {
      const backup = await createDatabaseBackup(fullDatabase, currentUser, 'يدوية');
      if (backup.blob) {
        downloadBackupFile(backup.blob, backup.fileName);
      }
    } catch (err) {
      console.error('Backup download failed:', err);
    }
  };

  // Execute in-hub full system diagnostics
  const handleRunDiagnostics = async () => {
    setDiagnosticsRunning(true);
    try {
      const res = await runBackupDiagnostics(fullDatabase);
      setDiagnosticsResults(res.results);
      setShowDiagnosticsPanel(true);
    } catch (e) {
      console.error(e);
    } finally {
      setDiagnosticsRunning(false);
    }
  };

  // Filtered individual procedures
  const filteredProcedures = (procedures || []).filter((p) => {
    const emp = (employees || []).find((e) => e.id === p.employeeId);
    const empName = emp ? emp.fullName : '';
    const empFile = emp ? emp.jobNumber : p.fileNumber || '';

    const matchesSearch = 
      p.procedureNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      empName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      empFile.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesEmp = selectedEmpId === 'ALL' || p.employeeId === selectedEmpId;
    const matchesType = selectedType === 'ALL' || p.procedureType === selectedType;

    return matchesSearch && matchesEmp && matchesType;
  });

  // Export Individual Procedure
  const handleExportProcedurePdf = async (proc: GeneralProcedure) => {
    setIsExportingPdf(true);
    try {
      const element = document.getElementById(`procedure-doc-${proc.id}`);
      if (element) {
        await exportElementToPdf(element, `قرار_${proc.procedureNumber}_${proc.procedureDate}.pdf`);
        setExportSuccess(true);
        setTimeout(() => setExportSuccess(false), 3000);
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleSubmitProcedure = (e: React.FormEvent) => {
    e.preventDefault();
    const emp = employees.find((e) => e.id === formData.employeeId);
    const newProcedure: GeneralProcedure = {
      id: `GP-${Date.now()}`,
      employeeId: formData.employeeId,
      fileNumber: emp?.jobNumber || '—',
      procedureType: formData.procedureType as any,
      procedureNumber: formData.procedureNumber,
      procedureDate: formData.procedureDate,
      effectiveDate: formData.effectiveDate,
      description: formData.description,
      reason: formData.reason,
      decisionAuthority: formData.decisionAuthority,
      notes: formData.notes,
      pdfFileName: formData.pdfFileName,
      createdAt: getCurrentTimestamp(),
      createdBy: currentUser
    };

    onAddProcedure(newProcedure);
    setIsAddModalOpen(false);

    // Reset Form
    setFormData({
      employeeId: employees[0]?.id || 1001,
      procedureType: 'إجراء إداري',
      procedureNumber: `PROC-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      procedureDate: getTodayDateStorage(),
      effectiveDate: getTodayDateStorage(),
      description: '',
      reason: '',
      decisionAuthority: 'مكتب الموارد البشرية - مصرف الدم المركزي المرج',
      notes: '',
      pdfFileName: ''
    });
  };

  return (
    <div className="space-y-6" id="general-procedures-view-root">
      {/* Top Banner & Module Switcher */}
      <div className="bg-gradient-to-r from-red-950 via-slate-900 to-red-950 text-white p-6 rounded-2xl border border-red-800/80 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-red-700 text-white tracking-wide uppercase">
                مركز العمليات الإدارية الموحد
              </span>
              <span className="text-xs text-red-200">الإصدار الشامل</span>
            </div>
            <h1 className="text-xl md:text-2xl font-black tracking-wide text-white">
              إجراءات عامة
            </h1>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl">
              المركز الإداري الموحد لجميع أدوات استيراد البيانات، المراجعة والتدقيق، صيانة وتنظيف السجلات، النسخ الاحتياطي، والقرارات الإدارية الجماعية والفردية.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleDownloadBackup}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-md cursor-pointer"
              title="نسخة احتياطية فورية قبل أي إجراء"
            >
              <Download className="w-4 h-4" />
              <span>نسخة احتياطية فورية</span>
            </button>
          </div>
        </div>

        {/* Sub-Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-2 mt-6 pt-4 border-t border-red-800/60">
          <button
            type="button"
            onClick={() => setActiveSection('hub')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
              activeSection === 'hub'
                ? 'bg-red-700 text-white shadow-md'
                : 'bg-slate-900/80 text-slate-300 hover:bg-slate-800 border border-slate-700/60'
            }`}
          >
            <Layers className="w-4 h-4 text-amber-400" />
            <span>لوحة الإجراءات والصيانة العامة</span>
            <span className="text-[10px] bg-amber-400 text-slate-950 px-1.5 py-0.2 rounded-full font-extrabold">
              الرئيسية
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('annual_increments')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeSection === 'annual_increments'
                ? 'bg-red-700 text-white shadow-md'
                : 'bg-slate-900/80 text-slate-300 hover:bg-slate-800 border border-slate-700/60'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>العلاوات السنوية (جماعي)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('leaves_bulk')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeSection === 'leaves_bulk'
                ? 'bg-red-700 text-white shadow-md'
                : 'bg-slate-900/80 text-slate-300 hover:bg-slate-800 border border-slate-700/60'
            }`}
          >
            <Palmtree className="w-4 h-4" />
            <span>أرصدة الإجازات الجماعية</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('employees_bulk')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeSection === 'employees_bulk'
                ? 'bg-red-700 text-white shadow-md'
                : 'bg-slate-900/80 text-slate-300 hover:bg-slate-800 border border-slate-700/60'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>إجراءات الموظفين الجماعية</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('individual_procedures')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeSection === 'individual_procedures'
                ? 'bg-red-700 text-white shadow-md'
                : 'bg-slate-900/80 text-slate-300 hover:bg-slate-800 border border-slate-700/60'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>القرارات الفردية الرسمية</span>
            <span className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.2 rounded-full font-mono">
              {procedures.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('audit_log')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeSection === 'audit_log'
                ? 'bg-red-700 text-white shadow-md'
                : 'bg-slate-900/80 text-slate-300 hover:bg-slate-800 border border-slate-700/60'
            }`}
          >
            <History className="w-4 h-4" />
            <span>سجل الرقابة والتراجع</span>
            <span className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.2 rounded-full font-mono">
              {bulkOperations.length}
            </span>
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* SECTION 1: CONSOLIDATED ADMINISTRATIVE & MAINTENANCE HUB  */}
      {/* ========================================================= */}
      {activeSection === 'hub' && (
        <div className="space-y-8 animate-in fade-in duration-150">
          
          {/* GROUP 1: استيراد البيانات */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center gap-3 border-b border-slate-200 pb-3 mb-5">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-black text-slate-900">استيراد البيانات</h2>
                <p className="text-xs text-slate-500">أدوات استيراد وتحديث بيانات الموظفين والمسارات من ملفات Excel</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Excel Import Card */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 hover:border-emerald-300 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-emerald-700 flex items-center gap-1.5">
                      <FileSpreadsheet className="w-4 h-4" />
                      <span>استيراد Excel (.xlsx / .xls)</span>
                    </span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                      معالجة ذكية
                    </span>
                  </div>
                  <h3 className="text-sm font-black text-slate-900 mb-1">
                    مركز استيراد وفحص بيانات الموظفين
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    استيراد بيانات الموظفين الجدد أو تحديث السجلات القائمة مع التحقق التلقائي من الأرقام الوطنية، مطابقة الدرجات، واستبعاد السجلات المكررة.
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsExcelImportOpen(true)}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                  >
                    <Upload className="w-4 h-4" />
                    <span>فتح نافذة استيراد Excel</span>
                  </button>
                  {onNavigateToTab && (
                    <button
                      type="button"
                      onClick={() => onNavigateToTab('excel_validation')}
                      className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                      title="مركز فحص Excel المتقدم"
                    >
                      <span>الفحص المتقدم &larr;</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Excel Template & Structure Card */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Download className="w-4 h-4 text-slate-500" />
                      <span>قوالب الاستيراد المعتمدة</span>
                    </span>
                    <span className="text-[10px] bg-slate-200 text-slate-700 font-bold px-2 py-0.5 rounded-full">
                      معياري
                    </span>
                  </div>
                  <h3 className="text-sm font-black text-slate-900 mb-1">
                    المخطط النموذجي لأعمدة البيانات
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    يتوافق محرك الاستيراد مع كافة الأعمدة الرسمية: الرقم الوظيفي، الاسم الكامل، الرقم الوطني، تاريخ الميلاد، تاريخ التعيين، الدرجة، والمسمى الوظيفي.
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 font-mono">
                  <span>الملفات المدعومة: .xlsx, .xls, .csv</span>
                  <span className="text-emerald-700 font-bold">100% متوافق</span>
                </div>
              </div>
            </div>
          </div>

          {/* GROUP 2: مراجعة وتدقيق البيانات */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center gap-3 border-b border-slate-200 pb-3 mb-5">
              <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700">
                <ClipboardCheck className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-black text-slate-900">مراجعة وتدقيق البيانات</h2>
                <p className="text-xs text-slate-500">أدوات الفحص والتدقيق القانوني وتتبع القرارات وانتقال اللائحة 418</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Employee Review Card */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 hover:border-blue-300 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-blue-700 flex items-center gap-1.5">
                      <ClipboardCheck className="w-4 h-4" />
                      <span>مراجعة بيانات الموظف</span>
                    </span>
                  </div>
                  <h3 className="text-sm font-black text-slate-900 mb-1">
                    تدقيق السيرة والملف الفردي
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    فحص ومراجعة السيرة الوظيفية، تسلسل الدرجات، الوثائق، وتطابق القرارات لكل موظف على حدة مع تقارير فورية.
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => {
                      if (employees.length > 0) {
                        setReviewSelectedEmp(employees[0]);
                        setIsEmployeeReviewOpen(true);
                      }
                    }}
                    className="w-full py-2.5 px-4 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                  >
                    <Eye className="w-4 h-4" />
                    <span>فتح نافذة مراجعة بيانات الموظف</span>
                  </button>
                </div>
              </div>

              {/* Grade & 418 Transition Audit Card */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 hover:border-teal-300 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-teal-700 flex items-center gap-1.5">
                      <Layers className="w-4 h-4" />
                      <span>تدقيق الدرجات وانتقال 418</span>
                    </span>
                    <span className="text-[10px] bg-teal-100 text-teal-800 font-bold px-2 py-0.5 rounded-full">
                      لائحة 418
                    </span>
                  </div>
                  <h3 className="text-sm font-black text-slate-900 mb-1">
                    إعادة بناء وتدقيق الدرجات الحالية
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    تدقيق تسلسل قرارات الترقية والتعيين، ومطابقة الانتقال التلقائي للائحة 418 لسنة 2023 وحساب تاريخ الاستحقاق.
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setIsRebuildGradesOpen(true)}
                    className="w-full py-2.5 px-4 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>تدقيق الدرجات وانتقال 418</span>
                  </button>
                </div>
              </div>

              {/* Final Database Audit Card */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 hover:border-indigo-300 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-indigo-700 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span>تدقيق نهائي للقاعدة</span>
                    </span>
                    <span className="text-[10px] bg-indigo-100 text-indigo-800 font-bold px-2 py-0.5 rounded-full">
                      الملاك 142
                    </span>
                  </div>
                  <h3 className="text-sm font-black text-slate-900 mb-1">
                    التدقيق الشامل والتقرير الختامي
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    فحص نهائي لسلامة كافة السجلات ومطابقتها مع الملاك المعتمد، والأرقام الوطنية، وتوليد تقرير رسمي جاهز للطباعة.
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setIsFinalAuditOpen(true)}
                    className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                  >
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>تشغيل التدقيق النهائي للقاعدة</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Extra tool: Chronology Inspection */}
            <div className="mt-4 p-4 rounded-xl bg-indigo-50/70 border border-indigo-200 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-3 text-xs text-indigo-900">
                <Zap className="w-5 h-5 text-indigo-600 shrink-0" />
                <div>
                  <span className="font-bold">فحص التتبع الزمني للدرجات: </span>
                  <span>التحقق من أن الدرجة المعروضة هي أحدث درجة نافذة قانوناً وتجاهل أي قرارات ملغاة.</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsGradeAuditModalOpen(true)}
                className="py-1.5 px-3 rounded-lg bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-bold shrink-0 transition-colors cursor-pointer"
              >
                <span>فحص الدرجات الزمنية</span>
              </button>
            </div>
          </div>

          {/* GROUP 3: صيانة وتنظيف البيانات */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center gap-3 border-b border-slate-200 pb-3 mb-5">
              <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-black text-slate-900">صيانة وتنظيف البيانات</h2>
                <p className="text-xs text-slate-500">أدوات إزالة السجلات التجريبية، فحص وتشخيص النظام، وإصلاح الروابط</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Test Records Cleanup Card */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 hover:border-amber-300 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-amber-700 flex items-center gap-1.5">
                      <ShieldAlert className="w-4 h-4" />
                      <span>تنظيف السجلات التجريبية</span>
                    </span>
                    <span className="text-[10px] bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded-full">
                      الملاك المعتمد
                    </span>
                  </div>
                  <h3 className="text-sm font-black text-slate-900 mb-1">
                    تصفية السجلات وضبط قاعدة البيانات
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    إزالة أي سجلات اختبارية وهمية وضبط ملاك الموظفين بدقة متناهية لمصرف الدم المركزي (142 موظفاً معتمداً) مع حماية النسخ الاحتياطي التلقائي.
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setIsCleanupTestRecordsOpen(true)}
                    className="w-full py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>تنظيف السجلات التجريبية</span>
                  </button>
                </div>
              </div>

              {/* Diagnostic Suite Card */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 hover:border-slate-300 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Activity className="w-4 h-4 text-emerald-600" />
                      <span>فحص قاعدة البيانات والتشخيص</span>
                    </span>
                    <span className="text-[10px] bg-slate-200 text-slate-700 font-bold px-2 py-0.5 rounded-full">
                      10 خطوات
                    </span>
                  </div>
                  <h3 className="text-sm font-black text-slate-900 mb-1">
                    الفحص الآلي للجداول والروابط الداخلية
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    تشخيص فوري وشامل لسلامة كافة الجداول، التحقق من عدم وجود أرقام وطنية مفقودة، فحص تماسك حركات الإجازات والترقيات.
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={handleRunDiagnostics}
                    disabled={diagnosticsRunning}
                    className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold transition-colors flex items-center justify-center gap-2 shadow-xs disabled:opacity-50 cursor-pointer"
                  >
                    {diagnosticsRunning ? (
                      <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                    ) : (
                      <Activity className="w-4 h-4 text-emerald-400" />
                    )}
                    <span>{diagnosticsRunning ? 'جارٍ الفحص والتشخيص...' : 'تشغيل فحص قاعدة البيانات الآن'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Diagnostic Results Panel (if executed) */}
            {showDiagnosticsPanel && (
              <div className="mt-4 p-5 rounded-2xl bg-slate-900 text-white border border-slate-800 animate-in fade-in duration-200">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-emerald-400" />
                    <h4 className="text-xs font-black">نتائج التشخيص الفوري لقاعدة البيانات</h4>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowDiagnosticsPanel(false)}
                    className="text-slate-400 hover:text-white text-xs p-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {diagnosticsResults.map((diag) => (
                    <div
                      key={diag.id}
                      className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-start gap-2.5"
                    >
                      <div className="mt-0.5">
                        {diag.status === 'passed' ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        ) : diag.status === 'warning' ? (
                          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                        ) : (
                          <AlertOctagon className="w-4 h-4 text-red-400 shrink-0" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-slate-200 truncate">{diag.stepName}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">{diag.message}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* GROUP 4: النسخ الاحتياطي والاستعادة */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center gap-3 border-b border-slate-200 pb-3 mb-5">
              <div className="w-9 h-9 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-700">
                <HardDrive className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-black text-slate-900">النسخ الاحتياطي والاستعادة</h2>
                <p className="text-xs text-slate-500">حماية البيانات، التصدير المشفر، وتنزيل حزم الأمان</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Backup Card */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
                <div>
                  <h3 className="text-xs font-bold text-purple-700 mb-1 flex items-center gap-1.5">
                    <Download className="w-4 h-4" />
                    <span>توليد وتنزيل نسخة فورية</span>
                  </h3>
                  <p className="text-xs text-slate-600 mt-2">
                    توليد ملف نسخة احتياطية حقيقية (.json / .zip) يحتوي على كافة سجلات المؤسسة مع بصمة أمان.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadBackup}
                  className="mt-4 w-full py-2.5 px-3 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                >
                  <Download className="w-4 h-4" />
                  <span>تنزيل نسخة احتياطية فورية</span>
                </button>
              </div>

              {/* Restore Card */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
                <div>
                  <h3 className="text-xs font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                    <RotateCcw className="w-4 h-4 text-amber-600" />
                    <span>استعادة قاعدة البيانات</span>
                  </h3>
                  <p className="text-xs text-slate-600 mt-2">
                    استرجاع واستبدال قاعدة البيانات بأكملها من ملف نسخ احتياطي تم تنزيله وحفظه مسبقاً.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (onOpenBackupModal) {
                      onOpenBackupModal();
                    } else if (onNavigateToTab) {
                      onNavigateToTab('backup');
                    }
                  }}
                  className="mt-4 w-full py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                >
                  <Upload className="w-4 h-4" />
                  <span>فتح نافذة الاستعادة والملفات</span>
                </button>
              </div>

              {/* Backup Settings Card */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
                <div>
                  <h3 className="text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                    <HardDrive className="w-4 h-4 text-emerald-600" />
                    <span>مركز النسخ والإعدادات</span>
                  </h3>
                  <p className="text-xs text-slate-600 mt-2">
                    إدارة تاريخ النسخ المحفوظة، فحص الحجم الفعلي، وتكوينات مسارات التخزين.
                  </p>
                </div>
                {onNavigateToTab && (
                  <button
                    type="button"
                    onClick={() => onNavigateToTab('backup')}
                    className="mt-4 w-full py-2.5 px-3 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold transition-colors flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <span>الانتقال لمركز النسخ والإعدادات &larr;</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* GROUP 5: إجراءات خطرة (تحت الحماية والترخيص) */}
          <div className="bg-red-50/80 rounded-2xl border-2 border-red-300 p-6 shadow-sm">
            <div className="flex items-center gap-3 border-b border-red-200 pb-3 mb-5">
              <div className="w-9 h-9 rounded-xl bg-red-100 border border-red-300 flex items-center justify-center text-red-700">
                <AlertOctagon className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-black text-red-950">إجراءات خطرة</h2>
                  <span className="text-[10px] bg-red-700 text-white px-2 py-0.5 rounded-full font-bold">
                    تتطلب ترخيصاً وتأكيداً
                  </span>
                </div>
                <p className="text-xs text-red-700">
                  عمليات شاملة تؤثر على عدد كبير من السجلات أو تؤدي إلى حذف وتصفير البيانات. تتطلب تأكيداً كتابياً وأخذ نسخة احتياطية إجبارية.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Reset Employee Database */}
              <div className="p-5 rounded-2xl bg-white border border-red-200 shadow-xs flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-black text-red-900 mb-1 flex items-center gap-2">
                    <Trash2 className="w-4 h-4 text-red-600" />
                    <span>إعادة ضبط وتصفير قاعدة بيانات الموظفين</span>
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    حذف كافة سجلات الموظفين الحالية مع حفظ نسخة احتياطية تلقائية إجبارية في سجل الأرشيف. يتطلب كتابة عبارة التأكيد الأمنية المحددة.
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-red-100">
                  <button
                    type="button"
                    onClick={() => setIsResetDbModalOpen(true)}
                    className="w-full py-2.5 px-4 rounded-xl bg-red-700 hover:bg-red-800 text-white text-xs font-black transition-colors flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                  >
                    <AlertTriangle className="w-4 h-4 text-amber-300" />
                    <span>إعادة ضبط وتصفير قاعدة البيانات...</span>
                  </button>
                </div>
              </div>

              {/* Undo Bulk Actions */}
              <div className="p-5 rounded-2xl bg-white border border-red-200 shadow-xs flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-black text-slate-900 mb-1 flex items-center gap-2">
                    <Undo2 className="w-4 h-4 text-red-600" />
                    <span>إلغاء الإجراءات والعلاوات الجماعية والتراجع</span>
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    التراجع الكامل عن آخر عملية جماعية تم تنفيذها (مثل صرف علاوة سنوية جماعية أو تعديل جماعي) وإعادة الموظفين لحالتهم السابقة بدقة.
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-red-100">
                  <button
                    type="button"
                    onClick={() => setActiveSection('audit_log')}
                    className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                  >
                    <History className="w-4 h-4 text-amber-400" />
                    <span>الانتقال لسجل العمليات والتراجع</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* SECTION 2: ANNUAL INCREMENTS (BULK)                       */}
      {/* ========================================================= */}
      {activeSection === 'annual_increments' && (
        <AnnualIncrementSection
          employees={employees}
          onBatchUpdateEmployees={(updatedEmployees) => {
            if (onBatchUpdateEmployees) {
              onBatchUpdateEmployees(updatedEmployees, 'صرف العلاوة السنوية الجماعية');
            }
          }}
          onRecordBulkOperation={onRecordBulkOperation}
          onAddAuditLog={onAddAuditLog}
          currentUser={currentUser}
          onAddIncrement={onAddIncrement}
          onUpdateEmployeeIncrement={onUpdateEmployeeIncrement}
        />
      )}

      {/* ========================================================= */}
      {/* SECTION 3: LEAVE BALANCES (BULK)                          */}
      {/* ========================================================= */}
      {activeSection === 'leaves_bulk' && (
        <LeaveBulkSection
          employees={employees}
          onBatchUpdateEmployees={(updatedEmployees) => {
            if (onBatchUpdateEmployees) {
              onBatchUpdateEmployees(updatedEmployees, 'تحديث وإعادة ضبط أرصدة الإجازات الجماعية');
            }
          }}
          onRecordBulkOperation={onRecordBulkOperation}
          onAddAuditLog={onAddAuditLog}
          currentUser={currentUser}
        />
      )}

      {/* ========================================================= */}
      {/* SECTION 4: EMPLOYEE BULK OPERATIONS                       */}
      {/* ========================================================= */}
      {activeSection === 'employees_bulk' && (
        <EmployeeBulkSection
          employees={employees}
          onBatchUpdateEmployees={(updatedEmployees) => {
            if (onBatchUpdateEmployees) {
              onBatchUpdateEmployees(updatedEmployees, 'إجراء جماعي على بيانات الموظفين');
            }
          }}
          onRecordBulkOperation={onRecordBulkOperation}
          onAddAuditLog={onAddAuditLog}
          currentUser={currentUser}
        />
      )}

      {/* ========================================================= */}
      {/* SECTION 5: AUDIT LOG & UNDO                               */}
      {/* ========================================================= */}
      {activeSection === 'audit_log' && (
        <GeneralActionsLogTable
          bulkOperations={bulkOperations}
          onUndoOperation={(op) => {
            setSelectedOpForUndo(op);
            setIsUndoModalOpen(true);
          }}
          onViewReport={(op) => {
            setSelectedOpForReport(op);
            setIsReportModalOpen(true);
          }}
        />
      )}

      {/* ========================================================= */}
      {/* SECTION 6: INDIVIDUAL ADMINISTRATIVE PROCEDURES           */}
      {/* ========================================================= */}
      {activeSection === 'individual_procedures' && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="بحث برقم القرار، الوصف، الموظف..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-3 pr-9 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-600 focus:border-red-600 outline-none"
                />
              </div>

              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="py-2 px-3 text-xs border border-slate-300 rounded-xl bg-white text-slate-700 outline-none focus:ring-2 focus:ring-red-600"
              >
                <option value="ALL">جميع أنواع القرارات</option>
                {procedureTypes.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>

              <select
                value={selectedEmpId}
                onChange={(e) => setSelectedEmpId(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
                className="py-2 px-3 text-xs border border-slate-300 rounded-xl bg-white text-slate-700 outline-none focus:ring-2 focus:ring-red-600 max-w-[200px]"
              >
                <option value="ALL">جميع الموظفين</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.jobNumber} - {emp.fullName}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-2 bg-red-700 hover:bg-red-800 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>تسجيل قرار / إجراء إداري جديد</span>
            </button>
          </div>

          {/* Procedures Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                  <tr>
                    <th className="p-3.5">رقم الإجراء</th>
                    <th className="p-3.5">النوع</th>
                    <th className="p-3.5">الموظف</th>
                    <th className="p-3.5">تاريخ الإجراء</th>
                    <th className="p-3.5">تاريخ النفاذ</th>
                    <th className="p-3.5">الوصف والبيان</th>
                    <th className="p-3.5">جهة الإصدار</th>
                    <th className="p-3.5 text-center">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredProcedures.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-500">
                        <FileText className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                        <p className="font-bold">لا توجد إجراءات إدارية مسجلة مطابقة للبحث</p>
                      </td>
                    </tr>
                  ) : (
                    filteredProcedures.map((proc) => {
                      const emp = employees.find((e) => e.id === proc.employeeId);
                      return (
                        <tr key={proc.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="p-3.5 font-mono font-bold text-red-900">{proc.procedureNumber}</td>
                          <td className="p-3.5">
                            <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-200">
                              {proc.procedureType}
                            </span>
                          </td>
                          <td className="p-3.5 font-bold text-slate-900">
                            {emp ? emp.fullName : 'موظف غير محدد'}
                            <div className="text-[10px] text-slate-400 font-mono">
                              الرقم الوظيفي: {emp?.jobNumber || proc.fileNumber}
                            </div>
                          </td>
                          <td className="p-3.5 font-mono text-slate-600">{proc.procedureDate}</td>
                          <td className="p-3.5 font-mono text-emerald-700 font-bold">{proc.effectiveDate || proc.procedureDate}</td>
                          <td className="p-3.5 max-w-xs truncate text-slate-700" title={proc.description}>
                            {proc.description}
                          </td>
                          <td className="p-3.5 text-slate-500">{proc.decisionAuthority || '—'}</td>
                          <td className="p-3.5">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => setPrintProcedure(proc)}
                                className="p-1.5 rounded-lg text-slate-600 hover:text-red-700 hover:bg-red-50 transition-colors cursor-pointer"
                                title="عرض وطباعة القرار الرسمي"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => onDeleteProcedure(proc.id)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                                title="حذف الإجراء"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
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
        </div>
      )}

      {/* ========================================================= */}
      {/* MODALS HOUSING CONSOLIDATED ADMINISTRATIVE TOOLS          */}
      {/* ========================================================= */}

      {/* 1. Excel Import Modal */}
      <ExcelImportModal
        isOpen={isExcelImportOpen}
        onClose={() => setIsExcelImportOpen(false)}
        existingEmployees={employees}
        existingCareerRecords={careerRecords}
        existingPromotions={promotions}
        existingIncrements={increments}
        existingSettlements={settlements}
        onImportComplete={(res) => {
          setIsExcelImportOpen(false);
          if (onImportComplete) onImportComplete(res);
        }}
        currentUser={currentUser}
        onNavigateToTab={onNavigateToTab}
      />

      {/* 2. Employee Review Modal */}
      {isEmployeeReviewOpen && (
        <EmployeeReviewModal
          isOpen={isEmployeeReviewOpen}
          onClose={() => {
            setIsEmployeeReviewOpen(false);
            setReviewSelectedEmp(null);
          }}
          employee={reviewSelectedEmp || employees[0] || null}
          onUpdateEmployee={(updatedEmp) => {
            onUpdateEmployee?.(updatedEmp);
            setReviewSelectedEmp(updatedEmp);
          }}
          currentUser={currentUser}
          careerRecords={careerRecords}
          promotions={promotions}
          increments={increments}
          settlements={settlements}
          generalProcedures={procedures}
          secondments={secondments}
          transfers={transfers}
        />
      )}

      {/* 3. Rebuild Current Grades & 418 Modal */}
      <RebuildCurrentGradesModal
        isOpen={isRebuildGradesOpen}
        onClose={() => setIsRebuildGradesOpen(false)}
        employees={employees}
        careerRecords={careerRecords}
        promotions={promotions}
        increments={increments}
        settlements={settlements}
        generalProcedures={procedures as any}
        onApplyBatchUpdate={(updatedEmps, note) => {
          if (onBatchUpdateEmployees) {
            onBatchUpdateEmployees(updatedEmps, note);
          }
          setIsRebuildGradesOpen(false);
        }}
        currentUser={currentUser}
      />

      {/* 4. Grade Chronology Audit Modal */}
      <GradeChronologyAuditModal
        isOpen={isGradeAuditModalOpen}
        onClose={() => setIsGradeAuditModalOpen(false)}
        employees={employees}
        careerRecords={careerRecords}
        promotions={promotions}
        increments={increments}
        settlements={settlements}
        generalProcedures={procedures}
      />

      {/* 5. Database Final Audit Modal */}
      <DatabaseFinalAuditModal
        isOpen={isFinalAuditOpen}
        onClose={() => setIsFinalAuditOpen(false)}
        fullDatabase={fullDatabase}
      />

      {/* 6. Test Records Cleanup Modal */}
      <TestRecordsCleanupModal
        isOpen={isCleanupTestRecordsOpen}
        onClose={() => setIsCleanupTestRecordsOpen(false)}
        fullDatabase={fullDatabase}
        onCleanupComplete={(newDb, msg) => {
          setIsCleanupTestRecordsOpen(false);
          onCleanupComplete?.(newDb, msg);
        }}
        currentUser={currentUser}
      />

      {/* 7. Reset Employee Database Modal (Dangerous Procedures) */}
      <ResetEmployeeDatabaseModal
        isOpen={isResetDbModalOpen}
        onClose={() => setIsResetDbModalOpen(false)}
        fullDatabase={fullDatabase}
        users={users}
        currentUsername={currentUser}
        onConfirmReset={async (backupFileName) => {
          // Perform database reset
          const emptyDb: FullAppDatabase = {
            ...fullDatabase,
            employees: [],
            increments: [],
            promotions: [],
            careerRecords: [],
            settlements: [],
            leaves: [],
            secondments: [],
            transfers: [],
            disciplinary: [],
            resignations: [],
            generalProcedures: [],
            lastUpdated: new Date().toISOString()
          };
          onCleanupComplete?.(emptyDb, `تصفير قاعدة البيانات مع أخذ نسخة احتياطية: ${backupFileName}`);
          setIsResetDbModalOpen(false);
          return { success: true };
        }}
        onOpenExcelImport={() => {
          setIsResetDbModalOpen(false);
          setIsExcelImportOpen(true);
        }}
      />

      {/* 8. Undo Bulk Action Modal */}
      {selectedOpForUndo && (
        <UndoBulkActionModal
          isOpen={isUndoModalOpen}
          onClose={() => {
            setIsUndoModalOpen(false);
            setSelectedOpForUndo(null);
          }}
          operation={selectedOpForUndo}
          currentUser={currentUser}
          employees={employees}
          fullDatabase={fullDatabase}
          onConfirmUndo={(op, restoredEmps, undoRec, reason) => {
            onRevertBulkOperation?.(op, restoredEmps, undoRec, reason);
            setIsUndoModalOpen(false);
            setSelectedOpForUndo(null);
          }}
        />
      )}

      {/* 9. Annual Increment Report Modal */}
      {selectedOpForReport && (
        <AnnualIncrementReportModal
          isOpen={isReportModalOpen}
          onClose={() => {
            setIsReportModalOpen(false);
            setSelectedOpForReport(null);
          }}
          bulkOp={selectedOpForReport}
          employees={employees}
          increments={increments}
        />
      )}

      {/* 10. Add Individual Procedure Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto text-right">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-red-700" />
                <span>تسجيل قرار أو إجراء إداري رسمي</span>
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitProcedure} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">اختيار الموظف</label>
                  <select
                    value={formData.employeeId}
                    onChange={(e) => setFormData({ ...formData, employeeId: Number(e.target.value) })}
                    className="w-full p-2.5 text-xs border border-slate-300 rounded-xl bg-white text-slate-800 outline-none focus:ring-2 focus:ring-red-600 font-medium"
                    required
                  >
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.jobNumber} - {emp.fullName} ({emp.jobGrade || 'درجة غير محددة'})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">نوع الإجراء</label>
                  <select
                    value={formData.procedureType}
                    onChange={(e) => setFormData({ ...formData, procedureType: e.target.value })}
                    className="w-full p-2.5 text-xs border border-slate-300 rounded-xl bg-white text-slate-800 outline-none focus:ring-2 focus:ring-red-600 font-medium"
                  >
                    {procedureTypes.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">رقم الإجراء / القرار</label>
                  <input
                    type="text"
                    value={formData.procedureNumber}
                    onChange={(e) => setFormData({ ...formData, procedureNumber: e.target.value })}
                    className="w-full p-2.5 text-xs border border-slate-300 rounded-xl font-mono text-slate-800 outline-none focus:ring-2 focus:ring-red-600"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">تاريخ الإجراء / الصدور</label>
                  <input
                    type="date"
                    value={formData.procedureDate}
                    onChange={(e) => setFormData({ ...formData, procedureDate: e.target.value })}
                    className="w-full p-2.5 text-xs border border-slate-300 rounded-xl font-mono text-slate-800 outline-none focus:ring-2 focus:ring-red-600"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">تاريخ نفاذ القرار</label>
                  <input
                    type="date"
                    value={formData.effectiveDate}
                    onChange={(e) => setFormData({ ...formData, effectiveDate: e.target.value })}
                    className="w-full p-2.5 text-xs border border-slate-300 rounded-xl font-mono text-slate-800 outline-none focus:ring-2 focus:ring-red-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">الجهة المصدرة للقرار</label>
                  <input
                    type="text"
                    value={formData.decisionAuthority}
                    onChange={(e) => setFormData({ ...formData, decisionAuthority: e.target.value })}
                    className="w-full p-2.5 text-xs border border-slate-300 rounded-xl text-slate-800 outline-none focus:ring-2 focus:ring-red-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">موضوع / بيان الإجراء</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="نص القرار أو الإجراء الإداري..."
                  className="w-full p-2.5 text-xs border border-slate-300 rounded-xl text-slate-800 outline-none focus:ring-2 focus:ring-red-600"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">المسوغات / الأسباب</label>
                <input
                  type="text"
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  placeholder="بناءً على كتاب الشؤون الإدارية رقم... أو مقتضيات المصلحة العامة"
                  className="w-full p-2.5 text-xs border border-slate-300 rounded-xl text-slate-800 outline-none focus:ring-2 focus:ring-red-600"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-red-700 hover:bg-red-800 text-white shadow-md transition-colors"
                >
                  حفظ وتسجيل القرار
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 11. Print Single Procedure Official Letter Modal */}
      {printProcedure && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-red-700" />
                <h3 className="text-base font-black text-slate-900">معاينة القرار الرسمي للطباعة</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleExportProcedurePdf(printProcedure)}
                  disabled={isExportingPdf}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-red-700 hover:bg-red-800 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  {isExportingPdf ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : exportSuccess ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                  ) : (
                    <FileDown className="w-3.5 h-3.5" />
                  )}
                  <span>{exportSuccess ? 'تم التصدير بنجاح' : 'تصدير PDF رسمي'}</span>
                </button>
                <button
                  onClick={() => window.print()}
                  className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 cursor-pointer"
                  title="طباعة"
                >
                  <Printer className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setPrintProcedure(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Official Letter A4 Document Canvas */}
            <div
              id={`procedure-doc-${printProcedure.id}`}
              className="p-8 bg-white text-slate-900 border border-slate-200 rounded-xl space-y-6 text-right leading-relaxed font-sans"
              style={{ direction: 'rtl' }}
            >
              {/* Official Header */}
              <div className="border-b-2 border-slate-800 pb-4 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-xs text-slate-700">دولة ليبيا</h4>
                  <h4 className="font-bold text-xs text-slate-700">وزارة الصحة</h4>
                  <h3 className="font-black text-sm text-slate-900">مصرف الدم المركزي المرج</h3>
                  <p className="text-[11px] text-slate-500 mt-1">مكتب الموارد البشرية والشؤون الإدارية</p>
                </div>
                <div className="w-16 h-16 rounded-xl border border-red-300 p-1 flex items-center justify-center">
                  <img src="/logo.jpg" alt="Logo" className="w-full h-full object-contain" />
                </div>
              </div>

              {/* Title & Metadata */}
              <div className="text-center py-2">
                <span className="inline-block px-4 py-1 rounded-full bg-slate-100 border border-slate-300 text-xs font-black text-slate-900 mb-2">
                  {printProcedure.procedureType}
                </span>
                <h2 className="text-lg font-black text-red-950">
                  قرار رقم ({printProcedure.procedureNumber}) لسنة {new Date().getFullYear()}
                </h2>
              </div>

              {/* Employee Target Information */}
              {(() => {
                const targetEmp = employees.find((e) => e.id === printProcedure.employeeId);
                return (
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-2">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-slate-500 font-bold">اسم الموظف: </span>
                        <span className="font-black text-slate-900">{targetEmp?.fullName || '—'}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 font-bold">الرقم الوظيفي: </span>
                        <span className="font-mono font-bold">{targetEmp?.jobNumber || printProcedure.fileNumber}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 font-bold">الدرجة الحالية: </span>
                        <span className="font-bold text-slate-900">{targetEmp?.jobGrade || '—'}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 font-bold">القسم / الإدارة: </span>
                        <span className="font-bold text-slate-900">{targetEmp?.department || '—'}</span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Body Text */}
              <div className="text-xs text-slate-800 space-y-4 leading-relaxed">
                <div>
                  <h5 className="font-bold text-slate-900 mb-1">الموضوع والبيان:</h5>
                  <p className="bg-white p-3 rounded-lg border border-slate-200 text-justify">
                    {printProcedure.description}
                  </p>
                </div>

                {printProcedure.reason && (
                  <div>
                    <h5 className="font-bold text-slate-900 mb-1">المسوغات والمبررات:</h5>
                    <p className="text-slate-600">{printProcedure.reason}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 pt-2 text-[11px] font-mono text-slate-600">
                  <div>تاريخ الإصدار: {printProcedure.procedureDate}</div>
                  <div>تاريخ النفاذ: {printProcedure.effectiveDate || printProcedure.procedureDate}</div>
                </div>
              </div>

              {/* Official Signatures */}
              <div className="grid grid-cols-2 gap-8 pt-10 border-t border-slate-200 text-center text-xs">
                <div>
                  <p className="font-bold text-slate-700">رئيس قسم الموارد البشرية</p>
                  <p className="text-slate-400 text-[10px] mt-8">الختم والتوقيع</p>
                </div>
                <div>
                  <p className="font-bold text-slate-700">مدير عام مصرف الدم المركزي</p>
                  <p className="text-slate-400 text-[10px] mt-8">يعتمد / الختم الرسمي</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
