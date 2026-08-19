import React, { useState } from 'react';
import { 
  Employee, 
  GeneralProcedure, 
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
  CheckCircle,
  Building2,
  FileCheck,
  FileDown,
  Loader2,
  CheckCircle2,
  X
} from 'lucide-react';
import { exportElementToPdf } from '../utils/pdfExport';
import { getTodayDateStorage, getCurrentTimestamp } from '../utils/dateUtils';

interface GeneralProceduresViewProps {
  employees: Employee[];
  procedures: GeneralProcedure[];
  onAddProcedure: (procedure: GeneralProcedure) => void;
  onDeleteProcedure: (id: string) => void;
  currentUser: string;
}

export const GeneralProceduresView: React.FC<GeneralProceduresViewProps> = ({
  employees,
  procedures,
  onAddProcedure,
  onDeleteProcedure,
  currentUser
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmpId, setSelectedEmpId] = useState<number | 'ALL'>('ALL');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [printProcedure, setPrintProcedure] = useState<GeneralProcedure | null>(null);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  // New procedure form state
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

  // Filtered procedures
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

  const handleSubmit = (e: React.FormEvent) => {
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

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FileText className="text-red-700 w-7 h-7" />
            سجل الإجراءات العامة للموظفين
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            توثيق وقرارات الإجراءات الإدارية، التكاليف، المذكرات، والإخطارات الرسمية للموظفين
          </p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 bg-red-700 hover:bg-red-800 text-white px-4 py-2.5 rounded-lg font-medium shadow-sm transition-colors"
        >
          <Plus className="w-5 h-5" />
          إضافة إجراء جديد
        </button>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative">
          <Search className="w-5 h-5 absolute right-3 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="بحث برقم الإجراء، البيان، الموظف، أو الرقم الوظيفي..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-600 focus:border-red-600 outline-none"
          />
        </div>

        <div>
          <select
            value={selectedEmpId}
            onChange={(e) => setSelectedEmpId(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
            className="w-full py-2 px-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-600 focus:border-red-600 outline-none"
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
            className="w-full py-2 px-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-600 focus:border-red-600 outline-none"
          >
            <option value="ALL">جميع أنواع الإجراءات</option>
            {procedureTypes.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Procedures List */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-700 font-semibold">
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
                  <td colSpan={8} className="py-8 text-center text-gray-500">
                    لا توجد إجراءات عامة مسجلة تطابق محددات البحث.
                  </td>
                </tr>
              ) : (
                filteredProcedures.map((proc) => {
                  const emp = employees.find((e) => e.id === proc.employeeId);
                  return (
                    <tr key={proc.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4 font-bold text-red-900">{proc.procedureNumber}</td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-gray-900">{emp?.fullName || 'غير معروف'}</div>
                        <div className="text-xs text-gray-500 font-mono">الرقم الوظيفي: {emp?.jobNumber || proc.fileNumber} (النظام: #{proc.employeeId})</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-block bg-red-50 text-red-800 text-xs px-2.5 py-1 rounded-full font-medium border border-red-200">
                          {proc.procedureType}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-xs text-gray-600">
                        <div>تاريخه: {proc.procedureDate}</div>
                        <div>النفاذ: {proc.effectiveDate}</div>
                      </td>
                      <td className="py-3 px-4 max-w-xs">
                        <p className="font-medium text-gray-800 truncate" title={proc.description}>{proc.description}</p>
                        {proc.reason && <p className="text-xs text-gray-500 truncate" title={proc.reason}>السبب: {proc.reason}</p>}
                      </td>
                      <td className="py-3 px-4 text-xs text-gray-600">{proc.decisionAuthority}</td>
                      <td className="py-3 px-4">
                        {proc.pdfFileName ? (
                          <span className="inline-flex items-center gap-1 text-xs text-blue-700 font-medium bg-blue-50 px-2 py-1 rounded border border-blue-200">
                            <Paperclip className="w-3.5 h-3.5" />
                            {proc.pdfFileName}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">لا يوجد</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => setPrintProcedure(proc)}
                            title="طباعة نموذج الإجراء"
                            className="p-1.5 text-gray-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onDeleteProcedure(proc.id)}
                            title="حذف"
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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

      {/* Add Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl border border-gray-200 max-w-2xl w-full p-6 space-y-4">
            <h2 className="text-xl font-bold text-gray-900 border-b pb-3 flex items-center gap-2">
              <FileCheck className="w-6 h-6 text-red-700" />
              تسجيل إجراء وظيفي عام جديد
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4 text-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">الموظف *</label>
                  <select
                    value={formData.employeeId}
                    onChange={(e) => setFormData({ ...formData, employeeId: Number(e.target.value) })}
                    required
                    className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-600 outline-none"
                  >
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.fullName} - {emp.jobNumber}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">نوع الإجراء *</label>
                  <select
                    value={formData.procedureType}
                    onChange={(e) => setFormData({ ...formData, procedureType: e.target.value })}
                    required
                    className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-600 outline-none"
                  >
                    {procedureTypes.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">رقم الإجراء / القرار *</label>
                  <input
                    type="text"
                    value={formData.procedureNumber}
                    onChange={(e) => setFormData({ ...formData, procedureNumber: e.target.value })}
                    required
                    className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-600 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">تاريخ الإجراء *</label>
                  <input
                    type="date"
                    value={formData.procedureDate}
                    onChange={(e) => setFormData({ ...formData, procedureDate: e.target.value })}
                    required
                    className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-600 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">تاريخ النفاذ *</label>
                  <input
                    type="date"
                    value={formData.effectiveDate}
                    onChange={(e) => setFormData({ ...formData, effectiveDate: e.target.value })}
                    required
                    className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-600 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">جهة القرار / التكليف</label>
                  <input
                    type="text"
                    value={formData.decisionAuthority}
                    onChange={(e) => setFormData({ ...formData, decisionAuthority: e.target.value })}
                    className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-600 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">بيان الإجراء وتفاصيله *</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                  placeholder="اكتب وصف الإجراء الإداري أو نص القرار..."
                  className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-600 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">سبب الإجراء / الأسباب الموجبة</label>
                <input
                  type="text"
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  placeholder="سبب اتخاذ الإجراء..."
                  className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-600 outline-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">اسم مستند PDF المرفق (اختياري)</label>
                  <input
                    type="text"
                    value={formData.pdfFileName}
                    onChange={(e) => setFormData({ ...formData, pdfFileName: e.target.value })}
                    placeholder="مثال: decision_2026.pdf"
                    className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-600 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">ملاحظات إضافية</label>
                  <input
                    type="text"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-600 outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-700 hover:bg-red-800 text-white rounded-lg font-medium"
                >
                  حفظ الإجراء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable Form Modal (Requirement #18 & #15) */}
      {printProcedure && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto print:p-0 print:bg-white print:static">
          <div 
            id="PRINT_PROCEDURE_DOCUMENT"
            className="bg-white rounded-xl shadow-2xl max-w-3xl w-full p-8 border border-gray-300 print:shadow-none print:border-none print:max-w-none print:w-full space-y-6 text-right"
          >
            
            {/* Action Buttons Toolbar at Top (Hidden in print) */}
            <div className="flex flex-wrap justify-between items-center print:hidden bg-gray-100 p-3 rounded-xl border border-gray-200 gap-2">
              <button
                onClick={() => setPrintProcedure(null)}
                type="button"
                className="px-3.5 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <X className="w-4 h-4 text-gray-500" />
                <span>إغلاق المعاينة</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={async () => {
                    setIsExportingPdf(true);
                    setExportSuccess(false);
                    const safeName = `إجراء_${printProcedure.procedureNumber}_${printProcedure.procedureType}_${Date.now()}`;
                    try {
                      const success = await exportElementToPdf('PRINT_PROCEDURE_DOCUMENT', safeName, {
                        orientation: 'portrait',
                        margin: 6,
                        scale: 2.5
                      });
                      if (success) {
                        setExportSuccess(true);
                        setTimeout(() => setExportSuccess(false), 3000);
                      }
                    } catch (err) {
                      console.error('PDF export failed:', err);
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
                      <span>جاري تصدير PDF...</span>
                    </>
                  ) : exportSuccess ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                      <span>تم التصدير PDF</span>
                    </>
                  ) : (
                    <>
                      <FileDown className="w-4 h-4 text-red-400" />
                      <span>تصدير PDF مباشر</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => window.print()}
                  type="button"
                  className="flex items-center gap-2 bg-red-700 hover:bg-red-800 text-white px-5 py-2 rounded-lg font-bold text-xs shadow-md cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>طباعة النموذج (A4)</span>
                </button>
              </div>
            </div>

            {/* Header */}
            <div className="flex justify-between items-center border-b-2 border-red-800 pb-4">
              <div>
                <h2 className="text-xl font-extrabold text-red-900">مصرف الدم المركزي بلدية المرج</h2>
                <p className="text-sm font-semibold text-gray-700 mt-1">مكتب شؤون الموارد البشرية - الإجراءات العامة</p>
                <p className="text-xs text-gray-500">Blood Bank Central Al-Marj - HR Office</p>
              </div>
              <div className="text-left font-mono text-xs text-gray-600 space-y-1">
                <div>رقم الإجراء: <span className="font-bold text-gray-900">{printProcedure.procedureNumber}</span></div>
                <div>التاريخ: <span className="font-bold text-gray-900">{printProcedure.procedureDate}</span></div>
                <div>تاريخ النفاذ: <span className="font-bold text-gray-900">{printProcedure.effectiveDate}</span></div>
              </div>
            </div>

            <div className="text-center py-2 bg-red-50 border border-red-200 rounded-lg">
              <h3 className="text-lg font-bold text-red-900">نموذج إجراء وظيفي / قرار إداري</h3>
              <p className="text-xs text-red-700 font-semibold mt-0.5">نوع الإجراء: {printProcedure.procedureType}</p>
            </div>

            {/* Employee info */}
            {(() => {
              const emp = employees.find((e) => e.id === printProcedure.employeeId);
              return (
                <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg border border-gray-200 text-sm">
                  <div>
                    <span className="text-xs text-gray-500 block">اسم الموظف:</span>
                    <span className="font-bold text-gray-900">{emp?.fullName || 'غير معروف'}</span>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 block">الرقم الوظيفي / رقم الملف:</span>
                    <span className="font-bold text-gray-900">{emp?.jobNumber || printProcedure.fileNumber}</span>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 block">الرقم الوطني:</span>
                    <span className="font-mono text-gray-800">{emp?.nationalId}</span>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 block">القسم / الإدارة:</span>
                    <span className="font-semibold text-gray-800">{emp?.department}</span>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 block">الوظيفة:</span>
                    <span className="font-semibold text-gray-800">{emp?.jobTitle}</span>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 block">الدرجة الحالية والعلاوة:</span>
                    <span className="font-semibold text-gray-800">{emp?.jobGrade} (علاوة {emp?.currentIncrement})</span>
                  </div>
                </div>
              );
            })()}

            {/* Procedure Details */}
            <div className="space-y-3 text-sm">
              <div className="p-4 border border-gray-300 rounded-lg space-y-2">
                <div className="font-bold text-gray-900 border-b pb-1">تفاصيل وبيان الإجراء:</div>
                <p className="text-gray-800 whitespace-pre-line leading-relaxed">{printProcedure.description}</p>
              </div>

              {printProcedure.reason && (
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                  <span className="font-semibold text-gray-700">الأسباب الموجبة: </span>
                  <span className="text-gray-800">{printProcedure.reason}</span>
                </div>
              )}

              <div className="text-xs text-gray-600">
                جهة اتخاذ القرار / التكليف: <span className="font-bold text-gray-800">{printProcedure.decisionAuthority}</span>
              </div>
            </div>

            {/* Signatures Area (Requirement #14 & #18) */}
            <div className="grid grid-cols-2 gap-8 pt-6 border-t border-gray-300 text-sm">
              <div className="text-center space-y-8">
                <div className="font-bold text-gray-800">توقيع المسؤول المباشر / رئيس القسم</div>
                <div className="text-xs text-gray-500">الاسم: ............................................</div>
                <div className="text-xs text-gray-500">التوقيع: .......................... التاريخ: ../../20..</div>
              </div>
              <div className="text-center space-y-8">
                <div className="font-bold text-gray-800">توقيع مدير عام مصرف الدم المركزي</div>
                <div className="text-xs text-gray-500">الاسم: ............................................</div>
                <div className="text-xs text-gray-500">التوقيع: .......................... التاريخ: ../../20..</div>
              </div>
            </div>

            {/* Mandatory Reserved Footer Stamp Area (Requirement #15) */}
            <div className="mt-8 pt-4 border-t-2 border-dashed border-gray-400 bg-gray-50 p-4 rounded-lg text-center space-y-2">
              <div className="font-extrabold text-sm text-red-900">
                مكتب شؤون الموارد البشرية — مصرف الدم المركزي بلدية المرج
              </div>
              <div className="grid grid-cols-3 gap-4 text-xs text-gray-700 pt-2">
                <div>ختم الجهة الرسمية: [ .................... ]</div>
                <div>التوقيع والاعتماد: [ .................... ]</div>
                <div>تاريخ الاعتماد: ../../20..</div>
              </div>
            </div>


          </div>
        </div>
      )}
    </div>
  );
};
