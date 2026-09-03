import React, { useState } from 'react';
import { Employee } from '../types';
import { formatDateDisplay } from '../utils/dateUtils';
import { X, Printer, FileDown, Loader2, Filter, ShieldAlert } from 'lucide-react';
import { exportElementToPdf } from '../utils/pdfExport';

interface FilteredEmployeeReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  employees: Employee[];
  activeFilterSummary: { label: string; value: string }[];
  searchQuery?: string;
  categoryFilter?: string;
  generalManagerName?: string;
}

export const FilteredEmployeeReportModal: React.FC<FilteredEmployeeReportModalProps> = ({
  isOpen,
  onClose,
  employees,
  activeFilterSummary = [],
  searchQuery = '',
  categoryFilter = 'الكل',
  generalManagerName = 'نجيب صالح سالم'
}) => {
  const [isExporting, setIsExporting] = useState(false);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleExportPdf = async () => {
    setIsExporting(true);
    try {
      await exportElementToPdf('FILTERED_EMPLOYEE_LIST_REPORT', `كشف_موظفي_مصرف_الدم_المفلتر_${new Date().toISOString().slice(0, 10)}`, {
        orientation: 'landscape',
        scale: 2,
        margin: 8
      });
    } catch (err) {
      console.error('PDF Export Error:', err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto print:p-0 print:bg-white" dir="rtl">
      <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full border border-slate-300 overflow-hidden flex flex-col max-h-[96vh] print:border-none print:shadow-none print:max-w-none print:max-h-none">
        
        {/* Modal Top Bar (Screen Only) */}
        <div className="bg-slate-900 text-white p-3.5 sm:p-4 flex items-center justify-between border-b border-slate-800 print:hidden shrink-0">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-red-400" />
            <div>
              <h3 className="font-black text-sm">معاينة طباعة كشف الموظفين وفق معايير الفلترة</h3>
              <p className="text-[11px] text-slate-300">
                إجمالي النتائج المفلترة: ({employees.length}) موظف — جاهز للطباعة A4 أو التصدير كملف PDF
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportPdf}
              disabled={isExporting}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-slate-700 transition cursor-pointer"
            >
              {isExporting ? <Loader2 className="w-4 h-4 animate-spin text-red-400" /> : <FileDown className="w-4 h-4 text-emerald-400" />}
              <span>تصدير PDF</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-1.5 bg-red-700 hover:bg-red-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-sm"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة فورية</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-xl transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Canvas */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 bg-white" id="FILTERED_EMPLOYEE_LIST_REPORT">
          {/* Libyan Official Header */}
          <div className="border-b-2 border-red-900 pb-3 mb-4 select-none">
            <div className="flex justify-between items-center text-xs font-bold text-slate-800">
              <div className="text-right space-y-0.5">
                <p className="font-black text-slate-950">دولة ليبيا</p>
                <p>وزارة الصحة</p>
                <p className="font-black text-red-950">مصرف الدم المركزي بلدية المرج</p>
                <p className="text-[10px] text-slate-500 font-medium">الشؤون الإدارية والمالية / شؤون الموظفين</p>
              </div>

              <div className="text-center">
                <div className="w-12 h-12 rounded-full border-2 border-red-900 bg-red-50 flex items-center justify-center mx-auto mb-1 text-red-950 font-black text-xs">
                  م.د.م
                </div>
                <h1 className="text-base font-black text-red-950">
                  كشف وسجل بيانات موظفي مصرف الدم المركزي
                </h1>
                <p className="text-[11px] font-bold text-slate-600">
                  (تقرير مفلتر ومطابق لمعايير البحث والانتقاء المحددة)
                </p>
              </div>

              <div className="text-left font-mono text-[11px] space-y-0.5">
                <p>التاريخ: {new Date().toLocaleDateString('ar-LY')}</p>
                <p>إجمالي السجلات: {employees.length}</p>
                <p>تصنيف الكادر: {categoryFilter}</p>
              </div>
            </div>

            {/* Active Filters Summary Header Banner */}
            {(activeFilterSummary.length > 0 || searchQuery) && (
              <div className="mt-3 pt-2 border-t border-slate-200 bg-slate-50 p-2 rounded-lg text-[11px] flex flex-wrap items-center gap-2">
                <span className="font-black text-slate-800 flex items-center gap-1">
                  <Filter className="w-3.5 h-3.5 text-red-800" />
                  <span>معايير الفلترة المطبقة:</span>
                </span>
                {searchQuery && (
                  <span className="bg-white border border-slate-300 px-2 py-0.5 rounded font-bold text-slate-900">
                    البحث: "{searchQuery}"
                  </span>
                )}
                {activeFilterSummary.map((f, i) => (
                  <span key={i} className="bg-white border border-slate-300 px-2 py-0.5 rounded text-slate-800">
                    <strong>{f.label}:</strong> {f.value}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Employee Table */}
          <table className="w-full text-right text-xs border-collapse border border-slate-400">
            <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-400">
              <tr>
                <th className="p-2 border border-slate-300 w-10 text-center">#</th>
                <th className="p-2 border border-slate-300 w-20 text-center">رقم الملف</th>
                <th className="p-2 border border-slate-300">اسم الموظف الرباعي</th>
                <th className="p-2 border border-slate-300 w-28">الرقم الوطني/الجواز</th>
                <th className="p-2 border border-slate-300 w-24 text-center">الدرجة والعلاوة</th>
                <th className="p-2 border border-slate-300 w-28">القسم</th>
                <th className="p-2 border border-slate-300 w-32">المسمى الوظيفي</th>
                <th className="p-2 border border-slate-300 w-24">المؤهل</th>
                <th className="p-2 border border-slate-300 w-20 text-center">الوضع</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-300">
              {employees.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-400 font-bold">
                    لا توجد سجلات تطابق الفلترة المحددة
                  </td>
                </tr>
              ) : (
                employees.map((emp, index) => (
                  <tr key={emp.id} className={index % 2 === 1 ? 'bg-slate-50/60' : 'bg-white'}>
                    <td className="p-1.5 border border-slate-300 text-center font-mono text-[11px] text-slate-600">
                      {index + 1}
                    </td>
                    <td className="p-1.5 border border-slate-300 font-bold font-mono text-slate-900 text-[11px] text-center">
                      {emp.jobNumber}
                    </td>
                    <td className="p-1.5 border border-slate-300 font-bold text-slate-950">
                      {emp.fullName}
                    </td>
                    <td className="p-1.5 border border-slate-300 font-mono text-slate-800 text-[11px]">
                      {emp.nationality === 'غير ليبي' || (emp.nationality && emp.nationality !== 'ليبي')
                        ? (emp.passportNumber || emp.nationalId)
                        : (emp.nationalId || '-')}
                    </td>
                    <td className="p-1.5 border border-slate-300 font-bold text-slate-900 text-center">
                      {emp.jobGrade} {emp.currentIncrement ? `(+${emp.currentIncrement})` : ''}
                    </td>
                    <td className="p-1.5 border border-slate-300 text-slate-800">
                      {emp.department}
                    </td>
                    <td className="p-1.5 border border-slate-300 text-slate-700">
                      {emp.jobTitle}
                    </td>
                    <td className="p-1.5 border border-slate-300 text-slate-700 text-[11px]">
                      {emp.qualification || '—'}
                    </td>
                    <td className="p-1.5 border border-slate-300 text-center font-bold text-[11px]">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                        emp.status === 'على رأس العمل' ? 'text-emerald-800 bg-emerald-50' : 'text-slate-700 bg-slate-100'
                      }`}>
                        {emp.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* Official Libyan Signatures Footer */}
          <div className="mt-8 pt-4 grid grid-cols-3 gap-4 text-center text-xs font-bold text-slate-800 border-t border-slate-300">
            <div>
              <p>إعداد / موظف المنظومة</p>
              <div className="h-10"></div>
              <p>.......................................</p>
            </div>
            <div>
              <p>رئيس قسم الشؤون الإدارية والمالية</p>
              <div className="h-10"></div>
              <p>.......................................</p>
            </div>
            <div>
              <p>يعتمد / مدير عام مصرف الدم المركزي المرج</p>
              <p className="font-black text-red-950 mt-1">{generalManagerName}</p>
              <p>.......................................</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
