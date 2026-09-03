import React, { useState } from 'react';
import { Employee } from '../types';
import { formatDateDisplay } from '../utils/dateUtils';
import { X, Printer, FileDown, Loader2 } from 'lucide-react';
import { exportElementToPdf } from '../utils/pdfExport';

interface EmployeeListPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  employees: Employee[];
  title?: string;
  categoryFilter?: string;
  deptFilter?: string;
}

export const EmployeeListPrintModal: React.FC<EmployeeListPrintModalProps> = ({
  isOpen,
  onClose,
  employees,
  title = 'كشف وسجل بيانات موظفي مصرف الدم المركزي المرج',
  categoryFilter = 'الكل',
  deptFilter = 'الكل'
}) => {
  const [isExporting, setIsExporting] = useState(false);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleExportPdf = async () => {
    setIsExporting(true);
    try {
      await exportElementToPdf('EMPLOYEE_LIST_PRINT_REPORT', `كشف_الموظفين_${new Date().toISOString().slice(0, 10)}`, {
        orientation: 'landscape',
        scale: 2,
        margin: 8
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto" dir="rtl">
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full border border-gray-200 overflow-hidden flex flex-col max-h-[95vh]">
        
        {/* Modal Action Bar (Screen Only) */}
        <div className="bg-gray-900 text-white p-4 flex items-center justify-between border-b border-gray-800 print:hidden shrink-0">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-red-400" />
            <div>
              <h3 className="font-bold text-sm">معاينة طباعة كشف الموظفين الرسمي</h3>
              <p className="text-[11px] text-gray-300">جاهز للطباعة على ورق قياس A4 أو الحفظ كملف PDF</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportPdf}
              disabled={isExporting}
              className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 border border-gray-700 transition cursor-pointer"
            >
              {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4 text-emerald-400" />}
              <span>تصدير PDF</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-1.5 bg-red-700 hover:bg-red-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-sm"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة فورية</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-white rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Report Canvas */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 bg-white" id="EMPLOYEE_LIST_PRINT_REPORT">
          {/* Official Libyan Header */}
          <div className="border-b-2 border-red-900 pb-4 mb-4 text-center select-none">
            <div className="flex justify-between items-center text-xs font-bold text-gray-700">
              <div className="text-right">
                <p>دولة ليبيا</p>
                <p>وزارة الصحة</p>
                <p>مصرف الدم المركزي بلدية المرج</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 rounded-full border-2 border-red-800 bg-red-50 flex items-center justify-center mx-auto mb-1 text-red-900 font-black text-sm">
                  م.د.م
                </div>
                <h1 className="text-base font-black text-red-950">{title}</h1>
              </div>
              <div className="text-left font-mono text-[11px]">
                <p>التاريخ: {new Date().toLocaleDateString('ar-LY')}</p>
                <p>إجمالي السجلات: {employees.length}</p>
                <p>الصفحة: 1 من 1</p>
              </div>
            </div>

            <div className="flex justify-center gap-4 text-xs font-semibold text-gray-600 mt-2">
              <span>الكادر: {categoryFilter}</span>
              <span>•</span>
              <span>القسم: {deptFilter}</span>
            </div>
          </div>

          {/* Report Data Table */}
          <table className="w-full text-right text-xs border-collapse border border-gray-400">
            <thead className="bg-gray-100 text-gray-900 font-bold border-b border-gray-400">
              <tr>
                <th className="p-2 border border-gray-300 w-10 text-center">#</th>
                <th className="p-2 border border-gray-300 w-24">رقم الملف</th>
                <th className="p-2 border border-gray-300">اسم الموظف</th>
                <th className="p-2 border border-gray-300 w-28">الرقم الوطني/الجواز</th>
                <th className="p-2 border border-gray-300 w-20">الدرجة</th>
                <th className="p-2 border border-gray-300 w-28">القسم</th>
                <th className="p-2 border border-gray-300 w-28">الوظيفة</th>
                <th className="p-2 border border-gray-300 w-20 text-center">الحالة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-300">
              {employees.map((emp, index) => (
                <tr key={emp.id} className={index % 2 === 1 ? 'bg-gray-50' : 'bg-white'}>
                  <td className="p-1.5 border border-gray-300 text-center font-mono text-[11px] text-gray-600">
                    {index + 1}
                  </td>
                  <td className="p-1.5 border border-gray-300 font-bold font-mono text-gray-900 text-[11px]">
                    {emp.jobNumber}
                  </td>
                  <td className="p-1.5 border border-gray-300 font-semibold text-gray-950">
                    {emp.fullName}
                  </td>
                  <td className="p-1.5 border border-gray-300 font-mono text-gray-800 text-[11px]">
                    {emp.nationality === 'غير ليبي' || (emp.nationality && emp.nationality !== 'ليبي')
                      ? (emp.passportNumber || emp.nationalId)
                      : (emp.nationalId || '-')}
                  </td>
                  <td className="p-1.5 border border-gray-300 font-bold text-gray-900">
                    {emp.jobGrade} (+{emp.currentIncrement || 1})
                  </td>
                  <td className="p-1.5 border border-gray-300 text-gray-800">
                    {emp.department}
                  </td>
                  <td className="p-1.5 border border-gray-300 text-gray-700">
                    {emp.jobTitle}
                  </td>
                  <td className="p-1.5 border border-gray-300 text-center font-bold text-[11px]">
                    {emp.status}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Official Signatures Footer */}
          <div className="mt-8 pt-4 grid grid-cols-3 gap-4 text-center text-xs font-bold text-gray-800 border-t border-gray-300">
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
              <p>مدير عام مصرف الدم المركزي المرج</p>
              <div className="h-10"></div>
              <p>.......................................</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
