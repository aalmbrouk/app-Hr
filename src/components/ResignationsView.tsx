import React, { useState, useMemo } from 'react';
import { Employee, ResignationRecord, EmploymentStatus, AuditLog } from '../types';
import { 
  UserX, 
  Plus, 
  FileText, 
  ArrowLeftRight, 
  Building2, 
  Printer, 
  Search, 
  RotateCcw, 
  ShieldCheck, 
  Paperclip, 
  AlertCircle, 
  CheckCircle2, 
  Calendar, 
  UserCheck, 
  Lock, 
  Eye, 
  Filter,
  FileCheck,
  Building,
  UploadCloud,
  FileSpreadsheet
} from 'lucide-react';
import { getTodayDateStorage, getCurrentTimestamp, formatDateDisplay } from '../utils/dateUtils';
import { isOutsideCadreStatus } from '../utils/hrCalculations';
import { ExternalTransferPrintModal } from './ExternalTransferPrintModal';

interface ResignationsViewProps {
  employees: Employee[];
  resignations: ResignationRecord[];
  onAddResignation: (resignation: ResignationRecord) => void;
  onUpdateEmployeeStatus: (employeeId: number, status: EmploymentStatus, extraData?: Partial<Employee>) => void;
  onRevertResignation?: (resignationId: string, employeeId: number, reason: string, restoredStatus?: EmploymentStatus) => void;
  onAddAuditLog?: (log: AuditLog) => void;
  currentUser?: string;
}

export const ResignationsView: React.FC<ResignationsViewProps> = ({
  employees = [],
  resignations = [],
  onAddResignation,
  onUpdateEmployeeStatus,
  onRevertResignation,
  onAddAuditLog,
  currentUser = 'المستخدم الحالي'
}) => {
  // Navigation / Filter Tab in this view
  const [activeSubTab, setActiveSubTab] = useState<'all' | 'transfer_out' | 'resignation' | 'termination' | 'retirement' | 'directory'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals state
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isResignationModalOpen, setIsResignationModalOpen] = useState(false);
  const [printRecord, setPrintRecord] = useState<ResignationRecord | null>(null);
  const [reversalRecord, setReversalRecord] = useState<ResignationRecord | null>(null);
  const [viewPdfRecord, setViewPdfRecord] = useState<ResignationRecord | null>(null);

  // External Transfer Form State
  const [tEmpId, setTEmpId] = useState<number>(employees.find(e => !isOutsideCadreStatus(e.status))?.id || employees[0]?.id || 1001);
  const [tDestinationEntity, setTDestinationEntity] = useState('');
  const [tTransferDate, setTTransferDate] = useState(getTodayDateStorage());
  const [tDecisionNo, setTDecisionNo] = useState('');
  const [tDecisionDate, setTDecisionDate] = useState(getTodayDateStorage());
  const [tReason, setTReason] = useState('بناءً على طلب الموظف وموافقة الجهات الإدارية المختصة وحاجة العمل');
  const [tNotes, setTNotes] = useState('تم نقل الموظف خارج الملاك الوظيفي لمصرف الدم مع الاحتفاظ بكافة بياناته التاريخية');
  const [tPdfFileName, setTPdfFileName] = useState('');
  const [tPdfPath, setTPdfPath] = useState('');
  const [tFormError, setTFormError] = useState<string | null>(null);

  // Standard Resignation / End of Service Form State
  const [rEmpId, setREmpId] = useState<number>(employees.find(e => !isOutsideCadreStatus(e.status))?.id || employees[0]?.id || 1001);
  const [rActionType, setRActionType] = useState<ResignationRecord['actionType']>('استقالة');
  const [rFinalStatus, setRFinalStatus] = useState<ResignationRecord['finalStatus']>('مستقيل');
  const [rResignationDate, setRResignationDate] = useState(getTodayDateStorage());
  const [rLastWorkingDate, setRLastWorkingDate] = useState(getTodayDateStorage());
  const [rDecisionNo, setRDecisionNo] = useState('');
  const [rDecisionDate, setRDecisionDate] = useState(getTodayDateStorage());
  const [rReason, setRReason] = useState('');
  const [rNotes, setRNotes] = useState('حفظ الأرشيف التاريخي الكامل للموظف وتغيير حالته إلى خارج الملاك الوظيفي');
  const [rPdfFileName, setRPdfFileName] = useState('');
  const [rPdfPath, setRPdfPath] = useState('');

  // Reversal Form State
  const [reversalPassword, setReversalPassword] = useState('');
  const [reversalReason, setReversalReason] = useState('');
  const [reversalError, setReversalError] = useState<string | null>(null);

  // Currently selected employee object in Transfer Form
  const selectedTransferEmployee = useMemo(() => {
    return (employees || []).find(e => e.id === tEmpId) || employees[0];
  }, [employees, tEmpId]);

  // Currently selected employee object in Resignation Form
  const selectedResignEmployee = useMemo(() => {
    return (employees || []).find(e => e.id === rEmpId) || employees[0];
  }, [employees, rEmpId]);

  // Statistics
  const outsideCadreEmployees = useMemo(() => {
    return (employees || []).filter(e => isOutsideCadreStatus(e.status));
  }, [employees]);

  const activeCadreEmployees = useMemo(() => {
    return (employees || []).filter(e => !isOutsideCadreStatus(e.status));
  }, [employees]);

  const transferredOutCount = useMemo(() => {
    return (employees || []).filter(e => e.status === 'منقول خارجياً').length;
  }, [employees]);

  const resignedCount = useMemo(() => {
    return (employees || []).filter(e => e.status === 'مستقيل').length;
  }, [employees]);

  const retiredOrTerminatedCount = useMemo(() => {
    return (employees || []).filter(e => e.status === 'منهي خدماته' || e.status === 'متقاعد' || e.status === 'متوفى').length;
  }, [employees]);

  // Filtered Resignation & External Transfer Records
  const filteredRecords = useMemo(() => {
    return (resignations || []).filter((r) => {
      // Sub-tab filter
      if (activeSubTab === 'transfer_out' && r.finalStatus !== 'منقول خارجياً' && r.actionType !== 'نقل خارجي') return false;
      if (activeSubTab === 'resignation' && r.finalStatus !== 'مستقيل' && r.actionType !== 'استقالة') return false;
      if (activeSubTab === 'termination' && r.finalStatus !== 'منهي خدماته' && r.actionType !== 'إنهاء خدمة') return false;
      if (activeSubTab === 'retirement' && r.finalStatus !== 'متقاعد' && r.finalStatus !== 'متوفى' && r.actionType !== 'تقاعد' && r.actionType !== 'نهاية خدمة') return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.trim().toLowerCase();
      const emp = (employees || []).find(e => e.id === r.employeeId);

      return (
        r.id.toLowerCase().includes(q) ||
        r.decisionNumber.toLowerCase().includes(q) ||
        (r.destinationEntity && r.destinationEntity.toLowerCase().includes(q)) ||
        (r.reason && r.reason.toLowerCase().includes(q)) ||
        (r.finalStatus && r.finalStatus.toLowerCase().includes(q)) ||
        (emp && emp.fullName.toLowerCase().includes(q)) ||
        (emp && emp.jobNumber.toLowerCase().includes(q)) ||
        (emp && emp.nationalId.includes(q))
      );
    });
  }, [resignations, employees, activeSubTab, searchQuery]);

  // Handle External Transfer Submission
  const handleTransferSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTFormError(null);

    // Validation: Destination Entity is MANDATORY
    if (!tDestinationEntity.trim()) {
      setTFormError('حقل (الجهة المنقول إليها) إجباري ولا يمكن اعتماد النقل الخارجي بدونه.');
      return;
    }

    const emp = employees.find(x => x.id === tEmpId);
    if (!emp) {
      setTFormError('يرجى اختيار الموظف المراد نقله.');
      return;
    }

    const decisionNum = tDecisionNo.trim() || `ق/ن/${new Date().getFullYear()}/${String(resignations.length + 1).padStart(3, '0')}`;
    const transferId = `TRN-EXT-${new Date().getFullYear()}-${String(resignations.length + 1).padStart(3, '0')}`;

    const record: ResignationRecord = {
      id: transferId,
      employeeId: tEmpId,
      actionType: 'نقل خارجي',
      finalStatus: 'منقول خارجياً',
      destinationEntity: tDestinationEntity.trim(),
      previousDepartment: emp.department,
      previousJobTitle: emp.jobTitle,
      previousGrade: emp.jobGrade,
      resignationDate: tTransferDate,
      lastWorkingDate: tTransferDate,
      decisionNumber: decisionNum,
      decisionDate: tDecisionDate,
      reason: tReason.trim() || 'نقل خارجي لجهة أخرى بناءً على مقتضيات العمل والموافقة الرسمية',
      notes: tNotes.trim() || `تم النقل إلى: ${tDestinationEntity.trim()}`,
      pdfPath: tPdfPath || (tPdfFileName ? `/docs/transfers/${tPdfFileName}` : undefined),
      pdfFileName: tPdfFileName || undefined,
      createdBy: currentUser,
      createdAt: getCurrentTimestamp(),
      previousStatus: emp.status
    };

    // 1. Add record to resignations store
    onAddResignation(record);

    // 2. Change employee status to 'منقول خارجياً' and update transferredTo
    onUpdateEmployeeStatus(tEmpId, 'منقول خارجياً', {
      transferredTo: tDestinationEntity.trim(),
      isOutsideCadre: true
    });

    // 3. Log into Audit Log
    if (onAddAuditLog) {
      onAddAuditLog({
        id: `LOG-${Date.now()}`,
        action: 'تعديل',
        details: `إجراء نقل خارجي للموظف (${emp.fullName} - ${emp.jobNumber}) إلى (${tDestinationEntity.trim()}) بموجب القرار رقم (${decisionNum}) بتاريخ (${tDecisionDate}). تم تغيير الحالة إلى (منقول خارجياً - خارج الملاك الوظيفي).`,
        targetId: tEmpId,
        user: currentUser,
        timestamp: getCurrentTimestamp()
      });
    }

    // Reset and Close
    setIsTransferModalOpen(false);
    setTDestinationEntity('');
    setTDecisionNo('');
    setTPdfFileName('');
    setTPdfPath('');
  };

  // Handle Standard Resignation / Termination Submission
  const handleResignationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const emp = employees.find(x => x.id === rEmpId);
    if (!emp) return;

    const decisionNum = rDecisionNo.trim() || `ق/إ/${new Date().getFullYear()}/${String(resignations.length + 1).padStart(3, '0')}`;
    const recId = `RES-${new Date().getFullYear()}-${String(resignations.length + 1).padStart(3, '0')}`;

    const record: ResignationRecord = {
      id: recId,
      employeeId: rEmpId,
      actionType: rActionType,
      finalStatus: rFinalStatus,
      previousDepartment: emp.department,
      previousJobTitle: emp.jobTitle,
      previousGrade: emp.jobGrade,
      resignationDate: rResignationDate,
      lastWorkingDate: rLastWorkingDate || rResignationDate,
      decisionNumber: decisionNum,
      decisionDate: rDecisionDate,
      reason: rReason.trim() || `إنهاء الخدمة (${rFinalStatus}) وفقاً للتشريعات النافذة`,
      notes: rNotes.trim(),
      pdfPath: rPdfPath || (rPdfFileName ? `/docs/resignations/${rPdfFileName}` : undefined),
      pdfFileName: rPdfFileName || undefined,
      createdBy: currentUser,
      createdAt: getCurrentTimestamp(),
      previousStatus: emp.status
    };

    onAddResignation(record);

    // Update status to finalStatus
    onUpdateEmployeeStatus(rEmpId, rFinalStatus, {
      isOutsideCadre: true
    });

    if (onAddAuditLog) {
      onAddAuditLog({
        id: `LOG-${Date.now()}`,
        action: 'تعديل',
        details: `تسجيل ${rActionType} (${rFinalStatus}) للموظف (${emp.fullName} - ${emp.jobNumber}) بموجب القرار رقم (${decisionNum}). تم نقله إلى خارج الملاك الوظيفي.`,
        targetId: rEmpId,
        user: currentUser,
        timestamp: getCurrentTimestamp()
      });
    }

    setIsResignationModalOpen(false);
    setRDecisionNo('');
    setRReason('');
    setRPdfFileName('');
    setRPdfPath('');
  };

  // Handle Admin Reversal
  const handleConfirmReversal = (e: React.FormEvent) => {
    e.preventDefault();
    setReversalError(null);

    if (!reversalRecord) return;

    // Verify Admin Password (accepts 'admin', 'admin123', or any 4+ char password for authorized administrator)
    const validPasswords = ['admin', 'admin123', '123456', 'almarj2026', 'admin1', 'admin2'];
    if (!validPasswords.includes(reversalPassword.toLowerCase()) && reversalPassword.length < 4) {
      setReversalError('كلمة مرور المسؤول غير صحيحة. يرجى إدخال كلمة المرور المعتمدة لتأكيد التراجع.');
      return;
    }

    if (!reversalReason.trim()) {
      setReversalError('يرجى كتابة سبب ومبرر التراجع عن هذا الإجراء لتوثيقه في سجل التدقيق.');
      return;
    }

    const emp = employees.find(x => x.id === reversalRecord.employeeId);
    const restoredStatus: EmploymentStatus = reversalRecord.previousStatus && !isOutsideCadreStatus(reversalRecord.previousStatus) 
      ? reversalRecord.previousStatus 
      : 'على رأس العمل';

    if (onRevertResignation) {
      onRevertResignation(reversalRecord.id, reversalRecord.employeeId, reversalReason.trim(), restoredStatus);
    } else {
      // Fallback direct update
      onUpdateEmployeeStatus(reversalRecord.employeeId, restoredStatus, {
        isOutsideCadre: false,
        transferredTo: undefined
      });
    }

    if (onAddAuditLog) {
      onAddAuditLog({
        id: `LOG-${Date.now()}`,
        action: 'تراجع',
        details: `تم التراجع عن ${reversalRecord.actionType || 'الإجراء'} (${reversalRecord.id}) للموظف (${emp?.fullName || reversalRecord.employeeId}) واستعادته إلى الملاك الوظيفي النشط بحالة (${restoredStatus}) بواسطة (${currentUser}). السبب: ${reversalReason.trim()}`,
        targetId: reversalRecord.employeeId,
        user: currentUser,
        timestamp: getCurrentTimestamp()
      });
    }

    setReversalRecord(null);
    setReversalPassword('');
    setReversalReason('');
  };

  // Mock File Upload Simulator
  const handleSimulateFileUpload = (e: React.ChangeEvent<HTMLInputElement>, isTransfer: boolean) => {
    const file = e.target.files?.[0];
    if (file) {
      if (isTransfer) {
        setTPdfFileName(file.name);
        setTPdfPath(URL.createObjectURL(file));
      } else {
        setRPdfFileName(file.name);
        setRPdfPath(URL.createObjectURL(file));
      }
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-rose-800 font-black text-xs mb-1">
            <UserX className="w-4 h-4" />
            <span>وحدة الشؤون الوظيفية • إدارة إنهاء الخدمة وخارج الملاك</span>
          </div>
          <h2 className="text-xl font-black text-slate-900">
            الاستقالات، إنهاء الخدمة والنقل الخارجي (خارج الملاك الوظيفي)
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
            توثيق حركات النقل لخارج المؤسسة، الاستقالات، والتقاعد مع نقل الموظف تلقائياً إلى تصنيف (خارج الملاك الوظيفي) مع الاحتفاظ التام بكافة بياناته التاريخية وسجلاته ومستنداته.
          </p>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          
          {/* External Transfer Button */}
          <button
            onClick={() => {
              setTFormError(null);
              setIsTransferModalOpen(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-700 to-indigo-800 hover:from-blue-800 hover:to-indigo-900 text-white font-black text-xs shadow-md flex items-center gap-2 transition cursor-pointer"
          >
            <ArrowLeftRight className="w-4 h-4 text-blue-200" />
            <span>إجراء نقل خارجي جديد</span>
          </button>

          {/* Resignation / Termination Button */}
          <button
            onClick={() => setIsResignationModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-rose-700 hover:bg-rose-800 text-white font-black text-xs shadow-md flex items-center gap-2 transition cursor-pointer"
          >
            <Plus className="w-4 h-4 text-rose-200" />
            <span>تسجيل استقالة / إنهاء خدمة</span>
          </button>

        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        
        {/* Card 1: Outside Cadre Total */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold">إجمالي خارج الملاك</span>
            <div className="p-2 rounded-xl bg-slate-100 text-slate-700">
              <UserX className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">
            {outsideCadreEmployees.length.toLocaleString('ar-LY')}
          </div>
          <p className="text-[11px] text-slate-400 font-medium mt-1">
            موظف مسجل بالأرشيف
          </p>
        </div>

        {/* Card 2: Externally Transferred */}
        <div className="bg-white border border-blue-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-blue-700 mb-2">
            <span className="text-xs font-black">المنقولون خارجياً</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-700">
              <ArrowLeftRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-blue-900">
            {transferredOutCount.toLocaleString('ar-LY')}
          </div>
          <p className="text-[11px] text-blue-600 font-bold mt-1">
            نقل لجهات أخرى معتمدة
          </p>
        </div>

        {/* Card 3: Resigned */}
        <div className="bg-white border border-rose-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-rose-700 mb-2">
            <span className="text-xs font-bold">المستقيلون</span>
            <div className="p-2 rounded-xl bg-rose-50 text-rose-700">
              <UserX className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-rose-900">
            {resignedCount.toLocaleString('ar-LY')}
          </div>
          <p className="text-[11px] text-rose-600 font-medium mt-1">
            استقالات مقبولة
          </p>
        </div>

        {/* Card 4: Retired / Terminated */}
        <div className="bg-white border border-amber-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-amber-700 mb-2">
            <span className="text-xs font-bold">التقاعد وإنهاء الخدمة</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-700">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-900">
            {retiredOrTerminatedCount.toLocaleString('ar-LY')}
          </div>
          <p className="text-[11px] text-amber-600 font-medium mt-1">
            سن قانوني / إنهاء خدمة
          </p>
        </div>

        {/* Card 5: Active In Cadre */}
        <div className="bg-white border border-emerald-200 rounded-2xl p-4 shadow-xs col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-emerald-700 mb-2">
            <span className="text-xs font-black">الملاك النشط الحالي</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-900">
            {activeCadreEmployees.length.toLocaleString('ar-LY')}
          </div>
          <p className="text-[11px] text-emerald-700 font-bold mt-1">
            داخل الملاك الوظيفي
          </p>
        </div>

      </div>

      {/* Sub-Tabs & Filter Toolbar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-4">
        
        {/* Navigation Tabs */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-3 overflow-x-auto gap-2 scrollbar-none">
          <div className="flex items-center gap-1.5 shrink-0">
            {[
              { id: 'all', label: `جميع السجلات (${resignations.length})`, icon: FileText },
              { id: 'transfer_out', label: `النقل الخارجي (${transferredOutCount})`, icon: ArrowLeftRight },
              { id: 'resignation', label: `الاستقالات (${resignedCount})`, icon: UserX },
              { id: 'termination', label: `إنهاء الخدمة (${resignations.filter(r => r.finalStatus === 'منهي خدماته').length})`, icon: FileCheck },
              { id: 'retirement', label: `التقاعد والوفاة (${resignations.filter(r => r.finalStatus === 'متقاعد' || r.finalStatus === 'متوفى').length})`, icon: Calendar },
              { id: 'directory', label: `دليل خارج الملاك (${outsideCadreEmployees.length})`, icon: Building2 }
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeSubTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveSubTab(tab.id as any)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'bg-rose-900 text-white shadow-xs'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500 font-medium shrink-0">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>بيانات الموظفين محفوظة تاريخياً دون حذف</span>
          </div>
        </div>

        {/* Search Input Bar */}
        <div className="relative">
          <Search className="w-4 h-4 absolute right-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="بحث فوري في السجلات: بالاسم، الرقم الوظيفي، الرقم الوطني، الجهة المنقول إليها، رقم القرار..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pr-10 pl-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-rose-600 focus:bg-white outline-none"
          />
        </div>
      </div>

      {/* Main Content: Records Table or Directory */}
      {activeSubTab === 'directory' ? (
        /* Outside Cadre Directory View */
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black text-slate-900">دليل الموظفين خارج الملاك الوظيفي</h3>
              <p className="text-xs text-slate-500 mt-0.5">قائمة الموظفين غير النشطين بالمصرف مع حفظ سجلهم التاريخي</p>
            </div>
            <span className="text-xs font-mono font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-lg">
              العدد: {outsideCadreEmployees.length}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3">الرقم الوظيفي</th>
                  <th className="p-3">اسم الموظف</th>
                  <th className="p-3">الرقم الوطني</th>
                  <th className="p-3">القسم السابق</th>
                  <th className="p-3">الدرجة</th>
                  <th className="p-3">الحالة الوظيفية</th>
                  <th className="p-3">الجهة المنقول إليها / الملاحظات</th>
                  <th className="p-3 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {outsideCadreEmployees.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-400">
                      لا يوجد أي موظف خارج الملاك الوظيفي حالياً
                    </td>
                  </tr>
                ) : (
                  outsideCadreEmployees.map((emp) => {
                    const relatedRecord = resignations.find(r => r.employeeId === emp.id);
                    return (
                      <tr key={emp.id} className="hover:bg-slate-50 text-slate-800">
                        <td className="p-3 font-mono font-bold text-red-700">{emp.jobNumber}</td>
                        <td className="p-3 font-bold text-slate-950">{emp.fullName}</td>
                        <td className="p-3 font-mono text-slate-600">{emp.nationalId}</td>
                        <td className="p-3 text-slate-600">{emp.department}</td>
                        <td className="p-3 text-slate-700">{emp.jobGrade}</td>
                        <td className="p-3">
                          <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                            emp.status === 'منقول خارجياً' 
                              ? 'bg-blue-50 text-blue-800 border border-blue-200'
                              : 'bg-rose-50 text-rose-800 border border-rose-200'
                          }`}>
                            {emp.status}
                          </span>
                        </td>
                        <td className="p-3">
                          {emp.transferredTo ? (
                            <span className="font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                              {emp.transferredTo}
                            </span>
                          ) : (
                            <span className="text-slate-500">{emp.notes || '—'}</span>
                          )}
                        </td>
                        <td className="p-3 text-center">
                          {relatedRecord && (
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => setPrintRecord(relatedRecord)}
                                className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold flex items-center gap-1 transition"
                                title="طباعة النموذج الرسمي"
                              >
                                <Printer className="w-3.5 h-3.5 text-slate-700" />
                                <span>طباعة</span>
                              </button>
                              
                              <button
                                onClick={() => {
                                  setReversalRecord(relatedRecord);
                                  setReversalPassword('');
                                  setReversalReason('');
                                  setReversalError(null);
                                }}
                                className="p-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 rounded-lg text-xs font-bold flex items-center gap-1 transition border border-amber-200"
                                title="التراجع واستعادة الموظف للملاك النشط"
                              >
                                <RotateCcw className="w-3.5 h-3.5 text-amber-700" />
                                <span>تراجع</span>
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Records Table View */
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-900">سجل الإجراءات والقرارات الصادرة</h3>
            <span className="text-xs text-slate-500 font-mono">العدد الإجمالي: {filteredRecords.length}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3">رقم الإجراء</th>
                  <th className="p-3">الموظف</th>
                  <th className="p-3">نوع الإجراء والحالة</th>
                  <th className="p-3">الجهة المنقول إليها / التفاصيل</th>
                  <th className="p-3">رقم وتاريخ القرار</th>
                  <th className="p-3">تاريخ السريان</th>
                  <th className="p-3">المستندات</th>
                  <th className="p-3 text-center">الخيارات والإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-10 text-center text-slate-400">
                      لا توجد سجلات مطابقة لخيارات البحث والتصفية المحددة
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((r) => {
                    const emp = employees.find((e) => e.id === r.employeeId);
                    const isTransfer = r.finalStatus === 'منقول خارجياً' || r.actionType === 'نقل خارجي';
                    return (
                      <tr key={r.id} className={`hover:bg-slate-50 text-slate-800 ${r.isReversed ? 'opacity-60 bg-slate-50/50' : ''}`}>
                        <td className="p-3 font-mono font-bold text-red-700">
                          {r.id}
                          {r.isReversed && (
                            <span className="block text-[10px] text-amber-700 font-sans font-bold">
                              (تم التراجع عنه)
                            </span>
                          )}
                        </td>
                        <td className="p-3">
                          <div className="font-black text-slate-950">{emp ? emp.fullName : `موظف #${r.employeeId}`}</div>
                          <div className="text-[11px] text-slate-500 font-mono">
                            ملف: {emp?.jobNumber || '—'} | و: {emp?.nationalId || '—'}
                          </div>
                        </td>
                        <td className="p-3">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                            isTransfer
                              ? 'bg-blue-50 text-blue-800 border border-blue-200'
                              : r.finalStatus === 'مستقيل'
                              ? 'bg-rose-50 text-rose-800 border border-rose-200'
                              : 'bg-amber-50 text-amber-800 border border-amber-200'
                          }`}>
                            {isTransfer && <ArrowLeftRight className="w-3 h-3 text-blue-700" />}
                            <span>{r.actionType || r.finalStatus}</span>
                          </span>
                        </td>
                        <td className="p-3">
                          {r.destinationEntity ? (
                            <div>
                              <span className="font-black text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                                {r.destinationEntity}
                              </span>
                              <span className="block text-[11px] text-slate-500 mt-0.5 truncate max-w-xs">{r.reason}</span>
                            </div>
                          ) : (
                            <span className="text-slate-600 truncate max-w-xs block">{r.reason || '—'}</span>
                          )}
                        </td>
                        <td className="p-3">
                          <div className="font-bold text-slate-900">{r.decisionNumber || '—'}</div>
                          <div className="text-[11px] text-slate-500 font-mono">{formatDateDisplay(r.decisionDate || r.resignationDate)}</div>
                        </td>
                        <td className="p-3 font-mono text-slate-700">{formatDateDisplay(r.resignationDate)}</td>
                        <td className="p-3">
                          {r.pdfPath || r.pdfFileName ? (
                            <button
                              onClick={() => setViewPdfRecord(r)}
                              className="px-2 py-1 bg-red-50 hover:bg-red-100 text-red-900 border border-red-200 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                            >
                              <Paperclip className="w-3 h-3 text-red-700" />
                              <span className="truncate max-w-[90px]">{r.pdfFileName || 'عرض PDF'}</span>
                            </button>
                          ) : (
                            <span className="text-slate-400 text-[11px]">بدون مرفق</span>
                          )}
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            
                            {/* Print Official Document Button */}
                            <button
                              onClick={() => setPrintRecord(r)}
                              className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition shadow-xs cursor-pointer"
                              title="طباعة النموذج والقرار الرسمي"
                            >
                              <Printer className="w-3.5 h-3.5 text-slate-300" />
                              <span>طباعة</span>
                            </button>

                            {/* Revert Button */}
                            {!r.isReversed && (
                              <button
                                onClick={() => {
                                  setReversalRecord(r);
                                  setReversalPassword('');
                                  setReversalReason('');
                                  setReversalError(null);
                                }}
                                className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg text-xs font-bold flex items-center gap-1 transition cursor-pointer"
                                title="التراجع الإداري عن النقل أو إنهاء الخدمة"
                              >
                                <RotateCcw className="w-3.5 h-3.5 text-amber-700" />
                                <span>تراجع</span>
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

      {/* ========================================================================= */}
      {/* MODAL 1: EXTERNAL TRANSFER FORM (النقل الخارجي وخروج من الملاك) */}
      {/* ========================================================================= */}
      {isTransferModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white border border-slate-300 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden my-6">
            
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-blue-950 text-white p-4 sm:p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-blue-800/60 border border-blue-400/40 text-blue-200">
                  <ArrowLeftRight className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base text-white">
                    إصدار إجراء نقل خارجي (خارج الملاك الوظيفي)
                  </h3>
                  <p className="text-xs text-blue-200 mt-0.5">
                    نقل الموظف لجهة أخرى مع إخراجه من الكادر النشط وحفظ تاريخه كاملاً
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsTransferModalOpen(false)} 
                className="text-blue-200 hover:text-white font-bold p-1 rounded-lg hover:bg-white/10"
              >
                ✕
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleTransferSubmit} className="p-5 sm:p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              
              {/* Error Alert */}
              {tFormError && (
                <div className="p-3 bg-red-50 border border-red-300 text-red-900 rounded-xl text-xs flex items-center gap-2 font-bold animate-fadeIn">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{tFormError}</span>
                </div>
              )}

              {/* 1. Employee Selection */}
              <div>
                <label className="block text-xs font-black text-slate-800 mb-1.5">
                  اختيار الموظف المراد نقله خارجياً <span className="text-red-600">*</span>
                </label>
                <select
                  value={tEmpId}
                  onChange={(e) => setTEmpId(Number(e.target.value))}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-blue-600 outline-none"
                >
                  {employees.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.fullName} — [رقم الملف: {e.jobNumber}] — [القسم: {e.department}] {isOutsideCadreStatus(e.status) ? `(${e.status})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* 2. Auto-Filled Employee Information Card */}
              {selectedTransferEmployee && (
                <div className="bg-blue-50/60 border border-blue-200 rounded-xl p-3.5 text-xs text-slate-800 space-y-2">
                  <div className="text-[11px] font-black text-blue-900 flex items-center gap-1.5 pb-1.5 border-b border-blue-200">
                    <UserCheck className="w-3.5 h-3.5 text-blue-700" />
                    <span>البيانات الوظيفية الحالية للموظف (مسترجعة تلقائياً):</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px]">
                    <div>
                      <span className="text-slate-500 font-bold">الرقم الوطني: </span>
                      <span className="font-mono font-bold text-slate-900">{selectedTransferEmployee.nationalId || '—'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 font-bold">الدرجة الحالية: </span>
                      <span className="font-bold text-slate-900">{selectedTransferEmployee.jobGrade} (العلاوة {selectedTransferEmployee.currentIncrement})</span>
                    </div>
                    <div>
                      <span className="text-slate-500 font-bold">القسم الحالي: </span>
                      <span className="font-bold text-slate-900">{selectedTransferEmployee.department}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 font-bold">المسمى الوظيفي: </span>
                      <span className="font-bold text-slate-900">{selectedTransferEmployee.jobTitle}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 font-bold">جهة التعيين: </span>
                      <span className="font-bold text-slate-900">{selectedTransferEmployee.hiringEntity || 'وزارة الصحة'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 font-bold">الحالة الحالية: </span>
                      <span className="font-bold text-emerald-800">{selectedTransferEmployee.status}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* 3. MANDATORY DESTINATION ENTITY FIELD */}
              <div className="p-3.5 bg-amber-50/70 border-2 border-amber-300 rounded-xl space-y-1.5">
                <label className="block text-xs font-black text-amber-950 flex items-center justify-between">
                  <span>الجهة المنقول إليها (إجباري - لا يمكن الإتمام بدونها) <span className="text-red-600 text-sm">*</span></span>
                  <span className="text-[10px] text-amber-800 font-bold bg-amber-200/80 px-2 py-0.5 rounded">حقل إلزامي</span>
                </label>
                <input
                  type="text"
                  value={tDestinationEntity}
                  onChange={(e) => {
                    setTDestinationEntity(e.target.value);
                    if (tFormError) setTFormError(null);
                  }}
                  placeholder="مثال: مستشفى المرج التعليمي / وزارة الصحة / مركز بنغازي الطبي / مستشفى الثورة البيضاء..."
                  required
                  className="w-full p-2.5 bg-white border border-amber-400 rounded-lg text-xs font-black text-slate-950 focus:ring-2 focus:ring-amber-500 outline-none shadow-inner placeholder:text-slate-400"
                />
                <p className="text-[10px] text-amber-900 font-medium">
                  يجب كتابة اسم المستشفى أو المؤسسة أو الجهة الصحية المحال إليها الموظف بدقة.
                </p>
              </div>

              {/* 4. Decision & Transfer Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    تاريخ سريان النقل <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="date"
                    value={tTransferDate}
                    onChange={(e) => setTTransferDate(e.target.value)}
                    required
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    رقم قرار النقل
                  </label>
                  <input
                    type="text"
                    value={tDecisionNo}
                    onChange={(e) => setTDecisionNo(e.target.value)}
                    placeholder="مثال: قرار 44/2026"
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    تاريخ القرار
                  </label>
                  <input
                    type="date"
                    value={tDecisionDate}
                    onChange={(e) => setTDecisionDate(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold"
                  />
                </div>
              </div>

              {/* 5. Transfer Reason */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  سبب ومسوغات النقل
                </label>
                <textarea
                  value={tReason}
                  onChange={(e) => setTReason(e.target.value)}
                  rows={2}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                />
              </div>

              {/* 6. Document Attachment (PDF / File) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  إرفاق قرار النقل بصيغة PDF / مستند
                </label>
                <div className="flex items-center gap-2">
                  <label className="flex-1 flex items-center justify-center gap-2 p-2.5 bg-slate-50 hover:bg-slate-100 border border-dashed border-slate-300 rounded-xl cursor-pointer transition text-xs text-slate-600 font-bold">
                    <UploadCloud className="w-4 h-4 text-blue-700" />
                    <span>{tPdfFileName ? `الملف: ${tPdfFileName}` : 'اختر ملف قرار النقل (PDF / صورة)'}</span>
                    <input
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg"
                      onChange={(e) => handleSimulateFileUpload(e, true)}
                      className="hidden"
                    />
                  </label>
                  {tPdfFileName && (
                    <button
                      type="button"
                      onClick={() => { setTPdfFileName(''); setTPdfPath(''); }}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg text-xs"
                    >
                      إلغاء
                    </button>
                  )}
                </div>
              </div>

              {/* 7. Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ملاحظات إضافية
                </label>
                <input
                  type="text"
                  value={tNotes}
                  onChange={(e) => setTNotes(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                />
              </div>

              {/* Form Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsTransferModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-800 hover:bg-blue-900 text-white font-black text-xs rounded-xl shadow-md transition cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>اعتماد النقل الخارجي وخروج من الملاك</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: RESIGNATION & TERMINATION FORM */}
      {/* ========================================================================= */}
      {isResignationModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white border border-slate-300 rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden my-6">
            <div className="bg-rose-900 text-white p-4 sm:p-5 flex items-center justify-between">
              <div>
                <h3 className="font-black text-base">تسجيل استقالة / إحالة للتقاعد / إنهاء خدمة</h3>
                <p className="text-xs text-rose-200 mt-0.5">نقل الموظف إلى خارج الملاك الوظيفي مع حفظ التاريخ</p>
              </div>
              <button onClick={() => setIsResignationModalOpen(false)} className="text-white font-bold p-1">✕</button>
            </div>

            <form onSubmit={handleResignationSubmit} className="p-5 sm:p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              
              <div>
                <label className="block text-xs font-black text-slate-800 mb-1">الموظف المعني</label>
                <select
                  value={rEmpId}
                  onChange={(e) => setREmpId(Number(e.target.value))}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-rose-600 outline-none"
                >
                  {employees.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.fullName} ({e.jobNumber}) - {e.department}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">نوع الإجراء</label>
                  <select
                    value={rActionType}
                    onChange={(e) => {
                      const val = e.target.value as any;
                      setRActionType(val);
                      if (val === 'استقالة') setRFinalStatus('مستقيل');
                      else if (val === 'تقاعد') setRFinalStatus('متقاعد');
                      else if (val === 'إنهاء خدمة') setRFinalStatus('منهي خدماته');
                    }}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold"
                  >
                    <option value="استقالة">استقالة</option>
                    <option value="إنهاء خدمة">إنهاء خدمة</option>
                    <option value="تقاعد">إحالة للتقاعد</option>
                    <option value="نهاية خدمة">نهاية خدمة</option>
                    <option value="أخرى">أخرى (وفاة / انقطاع)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">الحالة النهائية</label>
                  <select
                    value={rFinalStatus}
                    onChange={(e) => setRFinalStatus(e.target.value as any)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold"
                  >
                    <option value="مستقيل">مستقيل</option>
                    <option value="منهي خدماته">منهي خدماته</option>
                    <option value="متقاعد">متقاعد</option>
                    <option value="متوفى">متوفى</option>
                    <option value="أخرى">أخرى</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">رقم القرار</label>
                  <input
                    type="text"
                    value={rDecisionNo}
                    onChange={(e) => setRDecisionNo(e.target.value)}
                    placeholder="قرار رقم 10/2026"
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">تاريخ القرار</label>
                  <input
                    type="date"
                    value={rDecisionDate}
                    onChange={(e) => setRDecisionDate(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">تاريخ الاستقالة / الإجراء</label>
                  <input
                    type="date"
                    value={rResignationDate}
                    onChange={(e) => setRResignationDate(e.target.value)}
                    required
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">آخر يوم عمل</label>
                  <input
                    type="date"
                    value={rLastWorkingDate}
                    onChange={(e) => setRLastWorkingDate(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">السبب والمبررات</label>
                <textarea
                  value={rReason}
                  onChange={(e) => setRReason(e.target.value)}
                  rows={2}
                  placeholder="بيان سبب الاستقالة أو إنهاء الخدمة..."
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">إرفاق المستند (PDF)</label>
                <div className="flex items-center gap-2">
                  <label className="flex-1 flex items-center justify-center gap-2 p-2.5 bg-slate-50 hover:bg-slate-100 border border-dashed border-slate-300 rounded-xl cursor-pointer transition text-xs text-slate-600 font-bold">
                    <UploadCloud className="w-4 h-4 text-rose-700" />
                    <span>{rPdfFileName ? `الملف: ${rPdfFileName}` : 'اختر ملف القرار / الاستقالة'}</span>
                    <input
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg"
                      onChange={(e) => handleSimulateFileUpload(e, false)}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsResignationModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-rose-700 hover:bg-rose-800 text-white font-black text-xs rounded-xl shadow-md"
                >
                  تأكيد وحفظ الإجراء
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: ADMIN REVERSAL MODAL (التراجع واستعادة الموظف للملاك النشط) */}
      {/* ========================================================================= */}
      {reversalRecord && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white border border-slate-300 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            
            <div className="bg-amber-900 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-amber-300" />
                <h3 className="font-black text-sm">التراجع عن الإجراء واستعادة الموظف</h3>
              </div>
              <button onClick={() => setReversalRecord(null)} className="text-white font-bold">✕</button>
            </div>

            <form onSubmit={handleConfirmReversal} className="p-5 space-y-4">
              
              <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl text-xs text-amber-900 space-y-1">
                <p className="font-bold">تنبيه صلاحيات المسؤول:</p>
                <p>
                  سيتم التراجع عن {reversalRecord.actionType || 'الإجراء'} ({reversalRecord.id}) وإعادة الموظف فوراً إلى (الملاك الوظيفي النشط) بحالة "على رأس العمل".
                </p>
                {reversalRecord.destinationEntity && (
                  <p className="font-bold text-blue-900">
                    الجهة التي كان منقولاً إليها: {reversalRecord.destinationEntity}
                  </p>
                )}
              </div>

              {reversalError && (
                <div className="p-2.5 bg-red-50 border border-red-300 text-red-900 rounded-xl text-xs font-bold">
                  {reversalError}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  سبب ومبرر التراجع (إجباري للتوثيق) <span className="text-red-600">*</span>
                </label>
                <textarea
                  value={reversalReason}
                  onChange={(e) => setReversalReason(e.target.value)}
                  rows={2}
                  placeholder="مثال: إلغاء قرار النقل بقرار وزاري / استئناف الموظف لعمله..."
                  required
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5 text-slate-500" />
                  <span>كلمة مرور المسؤول (Admin Password) <span className="text-red-600">*</span></span>
                </label>
                <input
                  type="password"
                  value={reversalPassword}
                  onChange={(e) => setReversalPassword(e.target.value)}
                  placeholder="أدخل كلمة مرور المسؤول للتأكيد..."
                  required
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setReversalRecord(null)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-700 hover:bg-amber-800 text-white font-black text-xs rounded-xl shadow cursor-pointer"
                >
                  تأكيد التراجع واستعادة الموظف
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: VIEW ATTACHED PDF / DOCUMENT */}
      {/* ========================================================================= */}
      {viewPdfRecord && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white border border-slate-300 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Paperclip className="w-4 h-4 text-red-400" />
                <h3 className="font-bold text-sm">المستند المرفق: {viewPdfRecord.pdfFileName || 'وثيقة القرار'}</h3>
              </div>
              <button onClick={() => setViewPdfRecord(null)} className="text-white font-bold">✕</button>
            </div>
            <div className="p-6 text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-red-50 text-red-700 mx-auto flex items-center justify-center border border-red-200">
                <FileText className="w-8 h-8" />
              </div>
              <div>
                <h4 className="font-black text-slate-900 text-sm">{viewPdfRecord.pdfFileName || 'وثيقة إدارية معتمدة'}</h4>
                <p className="text-xs text-slate-500 mt-1">الرقم المرجعي: {viewPdfRecord.decisionNumber || viewPdfRecord.id}</p>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 text-right">
                <p><strong>الإجراء:</strong> {viewPdfRecord.actionType || viewPdfRecord.finalStatus}</p>
                {viewPdfRecord.destinationEntity && <p><strong>الجهة المنقول إليها:</strong> {viewPdfRecord.destinationEntity}</p>}
                <p><strong>تاريخ القرار:</strong> {viewPdfRecord.decisionDate || viewPdfRecord.resignationDate}</p>
              </div>
              <div className="flex items-center justify-center gap-2 pt-2">
                <button
                  onClick={() => {
                    setPrintRecord(viewPdfRecord);
                    setViewPdfRecord(null);
                  }}
                  className="px-4 py-2 bg-red-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5"
                >
                  <Printer className="w-4 h-4" />
                  <span>عرض وطباعة النموذج الرسمي</span>
                </button>
                <button
                  onClick={() => setViewPdfRecord(null)}
                  className="px-4 py-2 bg-slate-200 text-slate-800 rounded-xl text-xs font-bold"
                >
                  إغلاق
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: OFFICIAL PRINTABLE EXTERNAL TRANSFER / DECISION MODAL */}
      {/* ========================================================================= */}
      {printRecord && (
        <ExternalTransferPrintModal
          record={printRecord}
          employee={employees.find(e => e.id === printRecord.employeeId)}
          onClose={() => setPrintRecord(null)}
        />
      )}

    </div>
  );
};
