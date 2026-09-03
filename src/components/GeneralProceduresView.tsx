import React, { useState } from 'react';
import { 
  Employee, 
  GeneralProcedure, 
  IncrementRecord,
  BulkOperationRecord,
  AuditLog 
} from '../types';
import { 
  FileText, 
  Plus, 
  Search, 
  Printer, 
  Eye, 
  Trash2, 
  Paperclip, 
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
  Award
} from 'lucide-react';
import { exportElementToPdf } from '../utils/pdfExport';
import { getTodayDateStorage, getCurrentTimestamp } from '../utils/dateUtils';
import { FullAppDatabase } from '../utils/storageTypes';
import { AnnualIncrementSection } from './generalActions/AnnualIncrementSection';
import { LeaveBulkSection } from './generalActions/LeaveBulkSection';
import { EmployeeBulkSection } from './generalActions/EmployeeBulkSection';
import { GeneralActionsLogTable } from './generalActions/GeneralActionsLogTable';
import { UndoBulkActionModal } from './generalActions/UndoBulkActionModal';
import { AnnualIncrementReportModal } from './generalActions/AnnualIncrementReportModal';

interface GeneralProceduresViewProps {
  employees: Employee[];
  procedures: GeneralProcedure[];
  increments?: IncrementRecord[];
  bulkOperations?: BulkOperationRecord[];
  fullDatabase?: FullAppDatabase;
  onAddProcedure: (procedure: GeneralProcedure) => void;
  onDeleteProcedure: (id: string) => void;
  onAddIncrement?: (increment: IncrementRecord) => void;
  onUpdateEmployeeIncrement?: (employeeId: number, newIncrement: number, nextIncrementDate?: string) => void;
  onBatchUpdateEmployees?: (updatedEmployees: Employee[]) => void;
  onRecordBulkOperation?: (operation: BulkOperationRecord) => void;
  onRevertBulkOperation?: (
    operation: BulkOperationRecord, 
    restoredEmployees: Employee[], 
    undoRecord: BulkOperationRecord, 
    reason: string
  ) => void;
  onAddAuditLog?: (log: AuditLog) => void;
  currentUser: string;
}

export const GeneralProceduresView: React.FC<GeneralProceduresViewProps> = ({
  employees,
  procedures,
  increments = [],
  bulkOperations = [],
  fullDatabase = {
    version: 1,
    lastUpdated: new Date().toISOString(),
    employees,
    increments,
    generalProcedures: procedures,
    users: [],
    logs: [],
    settings: {} as any
  },
  onAddProcedure,
  onDeleteProcedure,
  onAddIncrement = () => {},
  onUpdateEmployeeIncrement,
  onBatchUpdateEmployees,
  onRecordBulkOperation = () => {},
  onRevertBulkOperation = () => {},
  onAddAuditLog,
  currentUser
}) => {
  // Navigation Tabs within General Actions Module
  const [activeSection, setActiveSection] = useState<
    'annual_increments' | 'leaves_bulk' | 'employees_bulk' | 'audit_log' | 'individual_procedures'
  >('annual_increments');

  // Shared Modals for Undo & Reports across views
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

  // Filtered individual procedures
  const filteredProcedures = procedures.filter((p) => {
    const emp = employees.find((e) => e.id === p.employeeId);
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

  const handleSubmitIndividual = (e: React.FormEvent) => {
    e.preventDefault();
    const targetEmp = employees.find((e) => e.id === Number(formData.employeeId));
    if (!targetEmp) return;

    const newProc: GeneralProcedure = {
      id: `PRC-${Date.now()}`,
      employeeId: targetEmp.id,
      fileNumber: targetEmp.jobNumber,
      procedureType: formData.procedureType,
      procedureNumber: formData.procedureNumber,
      procedureDate: formData.procedureDate,
      effectiveDate: formData.effectiveDate,
      description: formData.description,
      reason: formData.reason,
      decisionAuthority: formData.decisionAuthority,
      notes: formData.notes,
      pdfPath: formData.pdfFileName ? `/docs/${formData.pdfFileName}` : undefined,
      pdfFileName: formData.pdfFileName || undefined,
      createdBy: currentUser,
      createdAt: getCurrentTimestamp()
    };

    onAddProcedure(newProc);
    setIsAddModalOpen(false);
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

  const handleExportIndividualPdf = async () => {
    const el = document.getElementById('printable-procedure-area');
    if (!el || !printProcedure) return;

    setIsExportingPdf(true);
    setExportSuccess(false);

    try {
      const fileName = `إجراء_${printProcedure.procedureNumber}_${printProcedure.fileNumber}.pdf`;
      await exportElementToPdf(el, fileName, {
        orientation: 'portrait',
        margin: 6,
        scale: 2.2
      });
      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 3000);
    } catch (error) {
      console.error('Failed to export PDF:', error);
      alert('حدث خطأ أثناء تصدير ملف PDF. يرجى المحاولة مرة أخرى.');
    } finally {
      setIsExportingPdf(false);
    }
  };

  // Find last action for quick undo button
  const lastActiveOp = bulkOperations.find(op => !op.undone && op.actionType !== 'UNDO_OPERATION');

  return (
    <div className="space-y-6">
      
      {/* Top Main Navigation Tabs Bar */}
      <div className="bg-white p-2 rounded-2xl border border-gray-200 shadow-xs flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          
          <button
            type="button"
            onClick={() => setActiveSection('annual_increments')}
            className={`px-4 py-2.5 rounded-xl font-black text-xs flex items-center gap-2 transition-all cursor-pointer ${
              activeSection === 'annual_increments'
                ? 'bg-red-700 text-white shadow-xs'
                : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
            }`}
          >
            <TrendingUp className="w-4 h-4 text-amber-300" />
            <span>العلاوة السنوية (احتساب وصرف)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('leaves_bulk')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
              activeSection === 'leaves_bulk'
                ? 'bg-red-700 text-white shadow-xs'
                : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
            }`}
          >
            <Palmtree className="w-4 h-4" />
            <span>أرصدة الإجازات</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('employees_bulk')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
              activeSection === 'employees_bulk'
                ? 'bg-red-700 text-white shadow-xs'
                : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>إجراءات الموظفين</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('audit_log')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
              activeSection === 'audit_log'
                ? 'bg-red-700 text-white shadow-xs'
                : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
            }`}
          >
            <History className="w-4 h-4" />
            <span>سجل الرقابة والتراجع ({bulkOperations.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('individual_procedures')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
              activeSection === 'individual_procedures'
                ? 'bg-red-700 text-white shadow-xs'
                : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>القرارات الفردية ({procedures.length})</span>
          </button>

        </div>

        {/* Global Quick Undo Last Action Button */}
        {lastActiveOp && (
          <button
            type="button"
            onClick={() => {
              setSelectedOpForUndo(lastActiveOp);
              setIsUndoModalOpen(true);
            }}
            title="التراجع عن آخر إجراء إداري تم تنفيذه"
            className="px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-950 border border-amber-300 rounded-xl text-xs font-black flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
          >
            <Undo2 className="w-4 h-4 text-amber-700" />
            <span>التراجع عن آخر إجراء: {lastActiveOp.operationCode}</span>
          </button>
        )}
      </div>

      {/* TAB 1: Annual Increments Section */}
      {activeSection === 'annual_increments' && (
        <AnnualIncrementSection
          employees={employees}
          increments={increments}
          bulkOperations={bulkOperations}
          fullDatabase={fullDatabase}
          currentUser={currentUser}
          onAddIncrement={onAddIncrement}
          onUpdateEmployeeIncrement={onUpdateEmployeeIncrement}
          onBatchUpdateEmployees={onBatchUpdateEmployees}
          onRecordBulkOperation={onRecordBulkOperation}
          onRevertBulkOperation={onRevertBulkOperation}
          onAddAuditLog={onAddAuditLog}
        />
      )}

      {/* TAB 2: Leave Bulk Section */}
      {activeSection === 'leaves_bulk' && (
        <LeaveBulkSection
          employees={employees}
          bulkOperations={bulkOperations}
          fullDatabase={fullDatabase}
          currentUser={currentUser}
          onBatchUpdateEmployees={onBatchUpdateEmployees}
          onRecordBulkOperation={onRecordBulkOperation}
          onAddAuditLog={onAddAuditLog}
        />
      )}

      {/* TAB 3: Employee Bulk Section */}
      {activeSection === 'employees_bulk' && (
        <EmployeeBulkSection
          employees={employees}
          bulkOperations={bulkOperations}
          fullDatabase={fullDatabase}
          currentUser={currentUser}
          onBatchUpdateEmployees={onBatchUpdateEmployees}
          onRecordBulkOperation={onRecordBulkOperation}
          onAddAuditLog={onAddAuditLog}
        />
      )}

      {/* TAB 4: General Actions Audit Log Table */}
      {activeSection === 'audit_log' && (
        <GeneralActionsLogTable
          operations={bulkOperations}
          onSelectUndo={(op) => {
            setSelectedOpForUndo(op);
            setIsUndoModalOpen(true);
          }}
          onViewReport={(op) => {
            setSelectedOpForReport(op);
            setIsReportModalOpen(true);
          }}
        />
      )}

      {/* TAB 5: Individual Administrative Decisions */}
      {activeSection === 'individual_procedures' && (
        <div className="space-y-4 text-xs">
          
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
            <div>
              <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
                <FileText className="text-red-700 w-5 h-5" />
                سجل القرارات والإجراءات الإدارية الفردية
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                توثيق القرارات الإدارية، التكاليف، والمذكرات الرسمية للموظفين
              </p>
            </div>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-1.5 bg-red-700 hover:bg-red-800 text-white px-4 py-2.5 rounded-xl font-bold shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة إجراء فردي جديد</span>
            </button>
          </div>

          {/* Filters & Search */}
          <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute right-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="بحث برقم الإجراء، البيان، الموظف، أو الرقم الوظيفي..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pr-9 pl-3 py-2 border border-gray-300 rounded-xl text-xs font-bold text-gray-900 bg-gray-50 focus:bg-white"
              />
            </div>

            <div>
              <select
                value={selectedEmpId}
                onChange={(e) => setSelectedEmpId(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
                className="w-full py-2 px-3 border border-gray-300 rounded-xl text-xs font-bold text-gray-800 bg-gray-50"
              >
                <option value="ALL">جميع الموظفين</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.fullName} ({emp.jobNumber})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full py-2 px-3 border border-gray-300 rounded-xl text-xs font-bold text-gray-800 bg-gray-50"
              >
                <option value="ALL">جميع أنواع الإجراءات</option>
                {procedureTypes.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Procedures List */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 border-b border-gray-200 text-gray-700 font-extrabold">
                  <tr>
                    <th className="py-3 px-4">رقم الإجراء</th>
                    <th className="py-3 px-4">الموظف / الرقم الوظيفي</th>
                    <th className="py-3 px-4">نوع الإجراء</th>
                    <th className="py-3 px-4">تاريخ الإجراء / النفاذ</th>
                    <th className="py-3 px-4">البيان والتفاصيل</th>
                    <th className="py-3 px-4">جهة القرار</th>
                    <th className="py-3 px-4">المرفق</th>
                    <th className="py-3 px-4 text-center">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredProcedures.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-gray-500 font-bold">
                        لا توجد إجراءات عامة مسجلة تطابق محددات البحث
                      </td>
                    </tr>
                  ) : (
                    filteredProcedures.map((proc) => {
                      const emp = employees.find((e) => e.id === proc.employeeId);
                      return (
                        <tr key={proc.id} className="hover:bg-gray-50 transition-colors">
                          <td className="py-3 px-4 font-mono font-bold text-red-950">{proc.procedureNumber}</td>
                          <td className="py-3 px-4">
                            <div className="font-extrabold text-gray-900">{emp?.fullName || 'غير معروف'}</div>
                            <div className="text-[10px] text-gray-500 font-mono">الرقم الوظيفي: {emp?.jobNumber || proc.fileNumber}</div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="inline-block bg-red-50 text-red-800 text-[10px] px-2.5 py-0.5 rounded-full font-bold border border-red-200">
                              {proc.procedureType}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-[11px] text-gray-600 font-mono">
                            <div>تاريخه: {proc.procedureDate}</div>
                            <div>النفاذ: {proc.effectiveDate}</div>
                          </td>
                          <td className="py-3 px-4 max-w-xs">
                            <p className="font-bold text-gray-800 truncate" title={proc.description}>{proc.description}</p>
                            {proc.reason && <p className="text-[10px] text-gray-500 truncate" title={proc.reason}>السبب: {proc.reason}</p>}
                          </td>
                          <td className="py-3 px-4 text-gray-600">{proc.decisionAuthority}</td>
                          <td className="py-3 px-4">
                            {proc.pdfFileName ? (
                              <span className="inline-flex items-center gap-1 text-[10px] text-blue-700 font-bold bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                                <Paperclip className="w-3 h-3" />
                                {proc.pdfFileName}
                              </span>
                            ) : (
                              <span className="text-[10px] text-gray-400">لا يوجد</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => setPrintProcedure(proc)}
                                title="طباعة نموذج الإجراء"
                                className="p-1.5 text-gray-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                              >
                                <Printer className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => onDeleteProcedure(proc.id)}
                                title="حذف"
                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
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

      {/* Global Shared Undo Bulk Action Modal */}
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
        onConfirmUndo={onRevertBulkOperation}
      />

      {/* Global Shared Annual Increment Report Modal */}
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

      {/* Add Individual Procedure Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 max-w-2xl w-full p-6 space-y-4 text-xs">
            <div className="flex justify-between items-center border-b pb-3">
              <h2 className="text-base font-black text-gray-900 flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-red-700" />
                تسجيل إجراء وظيفي عام جديد
              </h2>
              <button onClick={() => setIsAddModalOpen(false)} className="text-gray-400 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitIndividual} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">الموظف المعني *</label>
                  <select
                    value={formData.employeeId}
                    onChange={(e) => setFormData({ ...formData, employeeId: Number(e.target.value) })}
                    className="w-full p-2 border rounded-xl font-bold"
                  >
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.fullName} ({emp.jobNumber})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">نوع الإجراء *</label>
                  <select
                    value={formData.procedureType}
                    onChange={(e) => setFormData({ ...formData, procedureType: e.target.value })}
                    className="w-full p-2 border rounded-xl font-bold"
                  >
                    {procedureTypes.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">رقم الإجراء / القرار *</label>
                  <input
                    type="text"
                    required
                    value={formData.procedureNumber}
                    onChange={(e) => setFormData({ ...formData, procedureNumber: e.target.value })}
                    className="w-full p-2 border rounded-xl font-bold font-mono text-red-950"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">تاريخ الإجراء *</label>
                  <input
                    type="date"
                    required
                    value={formData.procedureDate}
                    onChange={(e) => setFormData({ ...formData, procedureDate: e.target.value })}
                    className="w-full p-2 border rounded-xl font-bold font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">تاريخ النفاذ والفعالية *</label>
                  <input
                    type="date"
                    required
                    value={formData.effectiveDate}
                    onChange={(e) => setFormData({ ...formData, effectiveDate: e.target.value })}
                    className="w-full p-2 border rounded-xl font-bold font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">جهة اتخاذ القرار *</label>
                  <input
                    type="text"
                    required
                    value={formData.decisionAuthority}
                    onChange={(e) => setFormData({ ...formData, decisionAuthority: e.target.value })}
                    className="w-full p-2 border rounded-xl font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">بيان وتفاصيل الإجراء *</label>
                <textarea
                  required
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="اكتب نص القرار أو الإجراء بالكامل..."
                  className="w-full p-2 border rounded-xl font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">الأسباب الموجبة للإجراء</label>
                <input
                  type="text"
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  placeholder="بناءً على كتاب الشؤون الإدارية رقم..."
                  className="w-full p-2 border rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border rounded-xl font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-red-700 text-white rounded-xl font-bold"
                >
                  حفظ وتسجيل الإجراء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Individual Print View Modal */}
      {printProcedure && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full p-6 space-y-4 border border-gray-200 text-xs my-8">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-extrabold text-sm text-gray-900">نموذج قرار إجراء إداري</h3>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 py-1.5 bg-slate-800 text-white rounded-lg font-bold flex items-center gap-1.5"
                >
                  <Printer className="w-4 h-4 text-amber-400" />
                  <span>طباعة</span>
                </button>
                <button
                  type="button"
                  onClick={handleExportIndividualPdf}
                  disabled={isExportingPdf}
                  className="px-3 py-1.5 bg-red-700 text-white rounded-lg font-bold flex items-center gap-1.5"
                >
                  {isExportingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
                  <span>تصدير PDF</span>
                </button>
                <button onClick={() => setPrintProcedure(null)} className="text-gray-400 hover:text-gray-700 p-1">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div id="printable-procedure-area" className="bg-white p-6 rounded-xl border space-y-5">
              <div className="border-b-2 border-slate-900 pb-3 flex justify-between items-start">
                <div className="space-y-1">
                  <div className="font-black text-sm">دولة ليبيا - وزارة الصحة</div>
                  <div className="font-bold text-xs text-red-950">مصرف الدم المركزي بلدية المرج</div>
                  <div className="text-gray-600 text-[11px]">مكتب الموارد البشرية والشؤون الإدارية</div>
                </div>
                <div className="text-left font-mono text-[11px]">
                  <div>رقم الإجراء: {printProcedure.procedureNumber}</div>
                  <div>التاريخ: {printProcedure.procedureDate}</div>
                </div>
              </div>

              {(() => {
                const emp = employees.find(e => e.id === printProcedure.employeeId);
                return (
                  <div className="grid grid-cols-2 gap-3 bg-gray-50 p-3 rounded-xl border text-[11px]">
                    <div>اسم الموظف: <strong className="text-gray-900">{emp?.fullName}</strong></div>
                    <div>الرقم الوظيفي: <strong className="font-mono">{emp?.jobNumber}</strong></div>
                    <div>القسم: <strong>{emp?.department}</strong></div>
                    <div>الدرجة: <strong>{emp?.jobGrade} (علاوة {emp?.currentIncrement})</strong></div>
                  </div>
                );
              })()}

              <div className="space-y-2 text-[11px]">
                <div className="font-bold text-gray-900">نص وبيان الإجراء:</div>
                <div className="p-3 bg-gray-50 rounded-xl border leading-relaxed text-gray-900 font-medium">
                  {printProcedure.description}
                </div>
                {printProcedure.reason && (
                  <div className="text-gray-700">الأسباب الموجبة: {printProcedure.reason}</div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-6 pt-6 border-t text-center text-[11px]">
                <div className="space-y-8">
                  <div className="font-bold">المسؤول المباشر / رئيس القسم</div>
                  <div className="text-gray-400">التوقيع: .....................</div>
                </div>
                <div className="space-y-8">
                  <div className="font-extrabold text-red-950">مدير عام مصرف الدم المركزي</div>
                  <div className="text-gray-400">التوقيع والختم الرسمي: .....................</div>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t">
              <button
                type="button"
                onClick={() => setPrintProcedure(null)}
                className="px-4 py-2 border rounded-xl font-bold"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
