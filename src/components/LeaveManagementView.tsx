import React, { useState } from 'react';
import { Employee, LeaveTransaction, HrRule, PublicHoliday } from '../types';
import { LeaveModal } from './LeaveModal';
import { OfficialLeavePrintModal } from './OfficialLeavePrintModal';
import { formatDateDisplay } from '../utils/dateUtils';
import { exportElementToPdf } from '../utils/pdfExport';
import { 
  Calendar, 
  Plus, 
  CheckCircle2, 
  Search, 
  UserCheck, 
  ShieldCheck, 
  FileText,
  Printer,
  Building2,
  FileCheck,
  History,
  Eye,
  FileDown,
  Loader2,
  X,
  Sparkles
} from 'lucide-react';

interface LeaveManagementViewProps {
  employees: Employee[];
  leaves: LeaveTransaction[];
  rules: HrRule[];
  publicHolidaysList?: PublicHoliday[];
  officialLogoUrl?: string;
  onAddLeave: (leave: LeaveTransaction) => void;
  onUpdateLeave?: (leave: LeaveTransaction) => void;
  onUpdateLeaveStatus?: (id: string, status: LeaveTransaction['status']) => void;
  currentUser?: string;
}

export const LeaveManagementView: React.FC<LeaveManagementViewProps> = ({
  employees,
  leaves,
  rules,
  publicHolidaysList = [],
  officialLogoUrl,
  onAddLeave,
  onUpdateLeave,
  onUpdateLeaveStatus,
  currentUser = 'الشؤون الإدارية'
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEmpIdFilter, setSelectedEmpIdFilter] = useState<number | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  // Modal & Print states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modifyLeave, setModifyLeave] = useState<LeaveTransaction | null>(null);
  const [printLeave, setPrintLeave] = useState<LeaveTransaction | null>(null);
  const [preSelectedEmpId, setPreSelectedEmpId] = useState<number | undefined>(undefined);
  
  // Bulk statement report state
  const [isStatementReportOpen, setIsStatementReportOpen] = useState(false);
  const [isExportingStatementPdf, setIsExportingStatementPdf] = useState(false);
  const [statementExportSuccess, setStatementExportSuccess] = useState(false);

  // Filtered leaves
  const filteredLeaves = leaves.filter((l) => {
    const emp = employees.find((e) => e.id === l.employeeId);
    const empName = emp ? emp.fullName : '';
    const empFile = emp ? emp.jobNumber : '';
    const matchesSearch = empName.includes(searchQuery) || empFile.includes(searchQuery) || l.id.includes(searchQuery) || l.leaveType.includes(searchQuery);
    const matchesEmp = selectedEmpIdFilter === 'all' || l.employeeId === selectedEmpIdFilter;
    const matchesStatus = statusFilter === 'all' || l.status === statusFilter;
    return matchesSearch && matchesEmp && matchesStatus;
  });

  const handleOpenCreateModalForEmp = (empId?: number) => {
    setPreSelectedEmpId(empId);
    setModifyLeave(null);
    setIsModalOpen(true);
  };

  const handleOpenModifyModalForLeave = (leave: LeaveTransaction) => {
    setModifyLeave(leave);
    setPreSelectedEmpId(leave.employeeId);
    setIsModalOpen(true);
  };

  const handleExportStatementPdf = async () => {
    setIsExportingStatementPdf(true);
    setStatementExportSuccess(false);
    const filename = `كشف_سجل_الإجازات_السنوية_مصرف_الدم_${new Date().getFullYear()}_${Date.now()}`;
    try {
      const success = await exportElementToPdf('PRINT_LEAVE_STATEMENT_REPORT', filename, {
        orientation: 'landscape',
        margin: 6,
        scale: 2.2
      });
      if (success) {
        setStatementExportSuccess(true);
        setTimeout(() => setStatementExportSuccess(false), 3000);
      }
    } catch (err) {
      console.error('Statement PDF error:', err);
    } finally {
      setIsExportingStatementPdf(false);
    }
  };

  const selectedPrintEmployee = printLeave ? employees.find((e) => e.id === printLeave.employeeId) : undefined;

  return (
    <div className="space-y-6 text-right font-sans">
      
      {/* Top Header Card */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-red-700 font-bold text-xs mb-1">
            <Calendar className="w-4 h-4" />
            <span>وحدة الشؤون الوظيفية والإجازات — مصرف الدم المركزي المرج</span>
          </div>
          <h1 className="text-xl font-black text-gray-900">إدارة سجلات ونماذج الإجازات السنوية والرسمية</h1>
          <p className="text-xs text-gray-600 mt-1">
            نظام الإجازات المتكامل: تسجيل وتمديد الإجازات، تخصيص وطباعة نموذج الإجازة الرسمي A4، وتصدير مستندات PDF وصور PNG عالية الدقة.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Print Leaves Statement Table Button */}
          <button
            onClick={() => setIsStatementReportOpen(true)}
            type="button"
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs shadow-sm border border-slate-700 transition-all flex items-center gap-2 cursor-pointer"
          >
            <Printer className="w-4 h-4 text-red-400" />
            <span>كشف الإجازات العام (PDF)</span>
          </button>

          {/* New Leave Button */}
          <button
            onClick={() => handleOpenCreateModalForEmp()}
            type="button"
            className="px-5 py-2.5 rounded-xl bg-red-800 hover:bg-red-900 text-white font-extrabold text-xs shadow-md border border-red-700 transition-all flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>تسجيل طلب / إجازة جديدة</span>
          </button>
        </div>
      </div>

      {/* Leave Summary Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
        <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-gray-500 font-bold mb-2">
            <span>إجمالي الإجازات المسجلة</span>
            <FileText className="w-4 h-4 text-gray-400" />
          </div>
          <p className="text-2xl font-black text-gray-900">{leaves.length}</p>
          <span className="text-[11px] text-gray-400">سجل إجازة موثق بالنظام</span>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm border-r-4 border-r-emerald-500">
          <div className="flex items-center justify-between text-gray-500 font-bold mb-2">
            <span>إجازات سارية ومعتمدة</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-emerald-700">
            {leaves.filter((l) => l.status === 'مقبولة').length}
          </p>
          <span className="text-[11px] text-emerald-600 font-medium">مقبولة ومراجعة</span>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm border-r-4 border-r-amber-500">
          <div className="flex items-center justify-between text-gray-500 font-bold mb-2">
            <span>إجازات ممددة أو معدلة</span>
            <History className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-black text-amber-700">
            {leaves.filter((l) => l.modifications && l.modifications.length > 0).length}
          </p>
          <span className="text-[11px] text-amber-600 font-medium">تم تمديدها أو قطعها وتوثيق التاريخ</span>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm border-r-4 border-r-blue-500">
          <div className="flex items-center justify-between text-gray-500 font-bold mb-2">
            <span>رصيد الموظف السنوي</span>
            <ShieldCheck className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-black text-blue-700">30 - 45 يوم</p>
          <span className="text-[11px] text-blue-600 font-medium">حسب سنوات الخدمة ببنك الدم</span>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute right-3 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="بحث بالاسم، الرقم الوظيفي، أو كود الإجازة..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pr-9 pl-3 py-2 border border-gray-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-red-600 font-medium"
          />
        </div>

        <div>
          <select
            value={selectedEmpIdFilter}
            onChange={(e) => setSelectedEmpIdFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
            className="py-2 px-3 border border-gray-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-red-600 font-bold"
          >
            <option value="all">جميع الموظفين</option>
            {employees.map((e) => (
              <option key={e.id} value={e.id}>
                {e.fullName} ({e.jobNumber})
              </option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="py-2 px-3 border border-gray-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-red-600 font-bold"
          >
            <option value="all">جميع الحالات</option>
            <option value="مقبولة">مقبولة</option>
            <option value="قيد المراجعة">قيد المراجعة</option>
            <option value="مرفوضة">مرفوضة</option>
          </select>
        </div>
      </div>

      {/* Leaves Records Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-700 font-bold">
              <tr>
                <th className="py-3.5 px-4">كود الإجازة</th>
                <th className="py-3.5 px-4">الموظف / الرقم الوظيفي</th>
                <th className="py-3.5 px-4">نوع الإجازة</th>
                <th className="py-3.5 px-4">الفترة والخصم</th>
                <th className="py-3.5 px-4">الأيام والمباشرة</th>
                <th className="py-3.5 px-4">التعديلات والتمديد</th>
                <th className="py-3.5 px-4 text-center">النموذج والطباعة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredLeaves.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-gray-500 font-bold">
                    لا توجد سجلات إجازات تطابق محددات البحث
                  </td>
                </tr>
              ) : (
                filteredLeaves.map((l) => {
                  const emp = employees.find((e) => e.id === l.employeeId);
                  const hasMods = l.modifications && l.modifications.length > 0;

                  return (
                    <tr key={l.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-red-900 font-mono text-xs">{l.id}</td>
                      
                      <td className="py-3.5 px-4">
                        <div className="font-extrabold text-gray-900 text-xs">{emp?.fullName || 'غير معروف'}</div>
                        <div className="text-[10px] text-red-900 font-mono font-bold">
                          الرقم الوظيفي: {emp?.jobNumber || '-'}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-black text-gray-800">{l.leaveType}</td>

                      <td className="py-3.5 px-4 text-gray-700 font-mono text-[11px] space-y-1">
                        <div>من {formatDateDisplay(l.startDate)} إلى {formatDateDisplay(l.endDate)}</div>
                        <div>
                          {l.deductsFromAnnualLeave ? (
                            <span className="bg-red-50 text-red-800 text-[10px] px-2 py-0.5 rounded font-bold border border-red-200">
                              تخصم من السنوية
                            </span>
                          ) : (
                            <span className="bg-emerald-50 text-emerald-800 text-[10px] px-2 py-0.5 rounded font-bold border border-emerald-200">
                              غير مخصومة
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-black text-red-900 text-sm">{l.numberOfDays} يوم</div>
                        <div className="text-[10px] text-blue-900 font-bold font-mono">
                          المباشرة: {l.returnDate ? formatDateDisplay(l.returnDate) : '-'}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        {hasMods ? (
                          <span className="bg-amber-50 text-amber-900 border border-amber-300 text-[10px] px-2 py-1 rounded-md font-bold inline-flex items-center gap-1">
                            <History className="w-3 h-3 text-amber-700" />
                            <span>معدلة ({l.modifications?.length} إجراء)</span>
                          </span>
                        ) : (
                          <span className="text-gray-400 text-[11px]">بدون تمديد</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {/* Modify / Extend button */}
                          <button
                            onClick={() => handleOpenModifyModalForLeave(l)}
                            title="تمديد أو قطع أو تعديل الإجازة"
                            className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 rounded-lg border border-amber-300 font-bold text-[11px] inline-flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <History className="w-3.5 h-3.5 text-amber-700" />
                            <span>تمديد/قطع</span>
                          </button>

                          {/* Print & PDF PRINT_LEAVE_FORM button */}
                          <button
                            onClick={() => setPrintLeave(l)}
                            title="عرض وتخصيص وطباعة نموذج الإجازة وتصدير PDF/PNG"
                            className="px-3.5 py-1.5 bg-red-800 hover:bg-red-900 text-white rounded-lg border border-red-700 font-bold text-[11px] inline-flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>نموذج الإجازة (A4)</span>
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

      {/* Leave Entry / Management Modal */}
      <LeaveModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        employees={employees}
        initialEmpId={preSelectedEmpId}
        existingLeaveToModify={modifyLeave}
        leaves={leaves}
        rules={rules}
        publicHolidaysList={publicHolidaysList}
        officialLogoUrl={officialLogoUrl}
        onAddLeave={onAddLeave}
        onUpdateLeave={onUpdateLeave}
        currentUser={currentUser}
      />

      {/* Printable Official Leave Form A4 Modal (PRINT_LEAVE_FORM with rich options) */}
      {printLeave && (
        <OfficialLeavePrintModal
          leave={printLeave}
          employee={selectedPrintEmployee}
          officialLogoUrl={officialLogoUrl}
          onClose={() => setPrintLeave(null)}
        />
      )}

      {/* Printable Bulk Annual Leaves Statement Modal */}
      {isStatementReportOpen && (
        <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-3 overflow-y-auto print:p-0 print:bg-white print:static">
          <div 
            id="PRINT_LEAVE_STATEMENT_REPORT"
            className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full p-8 border border-gray-300 print:shadow-none print:border-none print:w-full space-y-6 text-right relative font-sans"
          >
            {/* Top Toolbar */}
            <div className="flex flex-wrap justify-between items-center print:hidden bg-gray-100 p-3 rounded-xl border border-gray-200 gap-2">
              <button
                onClick={() => setIsStatementReportOpen(false)}
                type="button"
                className="px-3.5 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <X className="w-4 h-4 text-gray-500" />
                <span>إغلاق المعاينة</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportStatementPdf}
                  disabled={isExportingStatementPdf}
                  type="button"
                  className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer ${
                    statementExportSuccess
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-800 hover:bg-slate-900 text-white'
                  } disabled:opacity-50`}
                >
                  {isExportingStatementPdf ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-red-300" />
                      <span>جاري إنشاء PDF...</span>
                    </>
                  ) : statementExportSuccess ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                      <span>تم تصدير PDF</span>
                    </>
                  ) : (
                    <>
                      <FileDown className="w-4 h-4 text-red-400" />
                      <span>تصدير ملف PDF مباشر (أفقي)</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => window.print()}
                  type="button"
                  className="px-5 py-2 bg-red-700 hover:bg-red-800 text-white rounded-lg text-xs font-bold flex items-center gap-2 shadow-md cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>طباعة الكشف الرسمي (A4)</span>
                </button>
              </div>
            </div>

            {/* Official Report Header */}
            <div className="border-b-2 border-red-800 pb-4 flex justify-between items-center">
              <div>
                <h3 className="text-xs font-extrabold text-gray-700">دولة ليبيا — وزارة الصحة</h3>
                <h1 className="text-xl font-black text-red-900">مصرف الدم المركزي المرج</h1>
                <p className="text-xs font-bold text-gray-600">مكتب شؤون الموظفين — سجل حركات الإجازات الرسمية</p>
              </div>

              {officialLogoUrl ? (
                <img src={officialLogoUrl} alt="Logo" className="w-16 h-16 object-contain" />
              ) : (
                <div className="w-16 h-16 rounded-full bg-red-50 border-2 border-red-700 flex items-center justify-center">
                  <span className="text-[10px] font-bold text-red-700 text-center">مصرف الدم المرج</span>
                </div>
              )}

              <div className="text-left font-mono text-xs text-gray-600 space-y-0.5 dir-ltr">
                <div>السنة المالية: <strong className="text-red-900">{new Date().getFullYear()}</strong></div>
                <div>تاريخ الاستخراج: <strong>{formatDateDisplay(new Date().toISOString().slice(0, 10))}</strong></div>
                <div>إجمالي السجلات: <strong>{filteredLeaves.length}</strong></div>
              </div>
            </div>

            <div className="bg-red-800 text-white text-center py-2.5 rounded-lg font-black text-base tracking-wider">
              كشف حركات وسجلات الإجازات السنوية والرسمية المعتمدة
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs border border-gray-300">
                <thead className="bg-gray-100 text-gray-900 font-bold border-b border-gray-300">
                  <tr>
                    <th className="py-2.5 px-3 border-l border-gray-300">ت</th>
                    <th className="py-2.5 px-3 border-l border-gray-300">رقم القيد</th>
                    <th className="py-2.5 px-3 border-l border-gray-300">اسم الموظف</th>
                    <th className="py-2.5 px-3 border-l border-gray-300">الرقم الوظيفي</th>
                    <th className="py-2.5 px-3 border-l border-gray-300">القسم</th>
                    <th className="py-2.5 px-3 border-l border-gray-300">نوع الإجازة</th>
                    <th className="py-2.5 px-3 border-l border-gray-300">الفترة (من - إلى)</th>
                    <th className="py-2.5 px-3 border-l border-gray-300">الأيام</th>
                    <th className="py-2.5 px-3 border-l border-gray-300">تاريخ المباشرة</th>
                    <th className="py-2.5 px-3">الحالة والخصم</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredLeaves.map((l, idx) => {
                    const emp = employees.find((e) => e.id === l.employeeId);
                    return (
                      <tr key={l.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/70'}>
                        <td className="py-2 px-3 border-l border-gray-200 font-mono text-center">{idx + 1}</td>
                        <td className="py-2 px-3 border-l border-gray-200 font-mono font-bold text-red-900">{l.id}</td>
                        <td className="py-2 px-3 border-l border-gray-200 font-bold text-gray-900">{emp?.fullName || '-'}</td>
                        <td className="py-2 px-3 border-l border-gray-200 font-mono">{emp?.jobNumber || '-'}</td>
                        <td className="py-2 px-3 border-l border-gray-200">{emp?.department || '-'}</td>
                        <td className="py-2 px-3 border-l border-gray-200 font-bold">{l.leaveType}</td>
                        <td className="py-2 px-3 border-l border-gray-200 font-mono text-[11px]">
                          {formatDateDisplay(l.startDate)} ← {formatDateDisplay(l.endDate)}
                        </td>
                        <td className="py-2 px-3 border-l border-gray-200 font-bold text-center">{l.numberOfDays}</td>
                        <td className="py-2 px-3 border-l border-gray-200 font-mono text-center">
                          {l.returnDate ? formatDateDisplay(l.returnDate) : '-'}
                        </td>
                        <td className="py-2 px-3 text-[11px]">
                          <span className={l.deductsFromAnnualLeave ? 'text-red-800 font-bold' : 'text-emerald-800 font-bold'}>
                            {l.deductsFromAnnualLeave ? 'مخصومة' : 'غير مخصومة'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Official Signatures for the Statement */}
            <div className="pt-4 grid grid-cols-3 gap-6 text-center text-xs avoid-break">
              <div className="space-y-3">
                <div className="font-bold text-gray-800">إعداد / وحدة الإجازات</div>
                <div className="text-gray-500 text-[11px]">التوقيع: ............................</div>
              </div>

              <div className="space-y-3">
                <div className="font-bold text-gray-800">رئيس قسم الشؤون الإدارية</div>
                <div className="text-gray-500 text-[11px]">التوقيع: ............................</div>
              </div>

              <div className="space-y-3">
                <div className="font-bold text-red-900">اعتماد مدير عام المصرف</div>
                <div className="text-gray-500 text-[11px]">الختم والتوقيع: ............................</div>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 pt-2 flex justify-between text-[10px] text-gray-500 font-bold">
              <span>مصرف الدم المركزي المرج</span>
              <span>نظام إدارة الموارد البشرية والإجازات</span>
              <span>صفحة كشف معتمدة</span>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

