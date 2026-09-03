import React, { useState, useRef } from 'react';
import { Printer, Download, X, Building2, CheckCircle2, ShieldCheck, FileText, Loader2 } from 'lucide-react';
import { Employee, IncrementRecord, BulkOperationRecord } from '../../types';
import { formatDateDisplay } from '../../utils/dateUtils';
import { exportElementToPdf } from '../../utils/pdfExport';

interface AnnualIncrementReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  bulkOp?: BulkOperationRecord | null;
  targetMonth?: string;
  appliedDate?: string;
  employees: Employee[];
  increments: IncrementRecord[];
  calculationList?: Array<{
    emp: Employee;
    calc: {
      currentIncrement: number;
      recommendedIncrement: number;
      incrementsDue: number;
      gradeEntryDateDisplay: string;
      lastIncrementDateDisplay: string;
      completedYears: number;
      isEligibleForNewIncrement: boolean;
    };
  }>;
}

export const AnnualIncrementReportModal: React.FC<AnnualIncrementReportModalProps> = ({
  isOpen,
  onClose,
  bulkOp,
  targetMonth,
  appliedDate,
  employees,
  increments,
  calculationList = []
}) => {
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const printAreaRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const effectiveDate = appliedDate || bulkOp?.details?.effectiveDate || new Date().toISOString().split('T')[0];
  const monthDisplay = targetMonth || bulkOp?.details?.targetMonth || 'الشهر الحالي';
  const operationCode = bulkOp?.operationCode || `INC-BULK-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;

  // Determine items to display
  let reportItems: Array<{
    jobNumber: string;
    fullName: string;
    jobGrade: string;
    gradeDate: string;
    prevIncrement: number;
    newIncrement: number;
    effectiveDate: string;
    status: string;
    notes: string;
  }> = [];

  if (calculationList && calculationList.length > 0) {
    reportItems = calculationList
      .filter((item) => item.calc.isEligibleForNewIncrement)
      .map(({ emp, calc }) => ({
        jobNumber: emp.jobNumber,
        fullName: emp.fullName,
        jobGrade: emp.jobGrade,
        gradeDate: calc.gradeEntryDateDisplay,
        prevIncrement: calc.currentIncrement,
        newIncrement: calc.recommendedIncrement,
        effectiveDate: effectiveDate,
        status: 'مستحقة ومصروفة',
        notes: `استناداً لعدد ${calc.completedYears} سنوات خدمة مكتملة (تاريخ الدرجة محفوظ)`
      }));
  } else if (bulkOp?.affectedEmployeeIds && bulkOp.affectedEmployeeIds.length > 0) {
    reportItems = bulkOp.affectedEmployeeIds.map((empId) => {
      const emp = employees.find((e) => e.id === empId);
      const inc = increments.find((i) => i.employeeId === empId && i.effectiveDate === effectiveDate);
      return {
        jobNumber: emp?.jobNumber || String(empId),
        fullName: emp?.fullName || 'موظف بالخدمة',
        jobGrade: emp?.jobGrade || 'الدرجة الحالية',
        gradeDate: formatDateDisplay(emp?.gradeEntryDate || emp?.directingDate || ''),
        prevIncrement: inc?.previousIncrement || ((emp?.currentIncrement || 2) - 1),
        newIncrement: inc?.newIncrement || (emp?.currentIncrement || 1),
        effectiveDate: effectiveDate,
        status: 'تم التنفيذ والاعتماد',
        notes: inc?.notes || 'علاوة سنوية دورية مقررة نظاماً'
      };
    });
  } else {
    // Fallback from increments list
    reportItems = increments.slice(0, 10).map((inc) => {
      const emp = employees.find((e) => e.id === inc.employeeId);
      return {
        jobNumber: emp?.jobNumber || '—',
        fullName: emp?.fullName || 'موظف',
        jobGrade: emp?.jobGrade || inc.previousGrade,
        gradeDate: formatDateDisplay(emp?.gradeEntryDate || emp?.directingDate || ''),
        prevIncrement: inc.previousIncrement,
        newIncrement: inc.newIncrement,
        effectiveDate: inc.effectiveDate,
        status: 'معتمدة ومسجلة',
        notes: inc.notes || 'علاوة دورية'
      };
    });
  }

  const handlePrint = () => {
    window.print();
  };

  const handleExportPdf = async () => {
    if (!printAreaRef.current) return;
    setIsExportingPdf(true);
    try {
      const fileName = `تقرير_صرف_العلاوات_السنوية_${effectiveDate}.pdf`;
      await exportElementToPdf(printAreaRef.current, fileName, {
        orientation: 'landscape',
        margin: 6,
        scale: 2.2
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-xs z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full border border-gray-200 overflow-hidden flex flex-col max-h-[92vh] my-auto">
        
        {/* Modal Top Bar */}
        <div className="px-6 py-3.5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <FileText className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="font-extrabold text-sm text-white">تقرير صرف العلاوة السنوية الرسمية</h3>
              <p className="text-[11px] text-gray-400">معاينة وطباعة كشف العلاوات المصروفة والمعتمدة</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4 text-amber-400" />
              <span>طباعة الكشف</span>
            </button>

            <button
              type="button"
              disabled={isExportingPdf}
              onClick={handleExportPdf}
              className="px-3.5 py-1.5 bg-red-800 hover:bg-red-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {isExportingPdf ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              <span>تصدير PDF</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="إغلاق التقرير"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Report Body */}
        <div className="p-6 overflow-y-auto flex-1 bg-gray-50">
          <div 
            ref={printAreaRef}
            className="bg-white p-8 rounded-xl shadow-xs border border-gray-200 text-gray-900 space-y-6 max-w-4xl mx-auto"
            dir="rtl"
          >
            {/* Official Report Header */}
            <div className="border-b-2 border-slate-900 pb-5">
              <div className="flex justify-between items-start">
                <div className="text-right space-y-1">
                  <div className="font-extrabold text-sm text-gray-900">دولة ليبيا</div>
                  <div className="font-bold text-xs text-gray-800">وزارة الصحة</div>
                  <div className="font-extrabold text-xs text-red-950">مصرف الدم المركزي بلدية المرج</div>
                  <div className="text-[11px] text-gray-600">الشؤون الإدارية والمالية / شؤون الموظفين</div>
                </div>

                <div className="text-center px-4 py-2 border-2 border-red-900 rounded-xl bg-red-50/50">
                  <div className="text-sm font-black text-red-950">تقرير صرف العلاوة السنوية</div>
                  <div className="text-[11px] font-bold text-red-900">عن شهر: {monthDisplay}</div>
                  <div className="text-[10px] text-gray-600 font-mono mt-0.5">رمز العملية: {operationCode}</div>
                </div>

                <div className="text-left text-xs space-y-1 text-gray-600 font-mono">
                  <div>التاريخ: {formatDateDisplay(effectiveDate)}</div>
                  <div>الصفحة: 1 من 1</div>
                  <div className="text-[10px] text-emerald-800 font-sans font-bold">الحالة: معتمد إدارياً</div>
                </div>
              </div>
            </div>

            {/* Metrics & Context Bar */}
            <div className="grid grid-cols-4 gap-3 text-xs bg-gray-50 p-3.5 rounded-xl border border-gray-200">
              <div>
                <span className="text-gray-500 block text-[10px]">إجمالي المستفيدين:</span>
                <span className="font-extrabold text-gray-900 font-mono text-sm">{reportItems.length} موظف</span>
              </div>
              <div>
                <span className="text-gray-500 block text-[10px]">تاريخ السريان والفعالية:</span>
                <span className="font-extrabold text-red-950 font-mono">{formatDateDisplay(effectiveDate)}</span>
              </div>
              <div>
                <span className="text-gray-500 block text-[10px]">نوع الإجراء:</span>
                <span className="font-bold text-blue-900">صرف علاوة سنوية جماعي</span>
              </div>
              <div>
                <span className="text-gray-500 block text-[10px]">تاريخ الدرجة الحالية:</span>
                <span className="font-bold text-emerald-800">محفوظ دون أي تعديل</span>
              </div>
            </div>

            {/* Report Data Table */}
            <div className="border border-gray-300 rounded-lg overflow-hidden">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-100 border-b border-gray-300 text-gray-800 font-extrabold">
                  <tr>
                    <th className="py-2.5 px-3 text-center w-10">ت</th>
                    <th className="py-2.5 px-3">الرقم الوظيفي</th>
                    <th className="py-2.5 px-3">اسم الموظف الرباعي</th>
                    <th className="py-2.5 px-3">الدرجة</th>
                    <th className="py-2.5 px-3 bg-amber-50 text-amber-950">تاريخ الدرجة (محفوظ)</th>
                    <th className="py-2.5 px-3 text-center">العلاوة السابقة</th>
                    <th className="py-2.5 px-3 text-center font-black text-red-900 bg-red-50">العلاوة الجديدة</th>
                    <th className="py-2.5 px-3">تاريخ الفعالية</th>
                    <th className="py-2.5 px-3">الملاحظات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 text-[11px]">
                  {reportItems.map((item, idx) => (
                    <tr key={idx} className={idx % 2 === 1 ? 'bg-gray-50/70' : 'bg-white'}>
                      <td className="py-2 px-3 text-center font-bold text-gray-500 font-mono">{idx + 1}</td>
                      <td className="py-2 px-3 font-mono font-bold text-gray-800">{item.jobNumber}</td>
                      <td className="py-2 px-3 font-extrabold text-gray-900">{item.fullName}</td>
                      <td className="py-2 px-3 font-bold text-gray-800">{item.jobGrade}</td>
                      <td className="py-2 px-3 font-mono dir-ltr text-right font-black text-amber-950 bg-amber-50/50">
                        {item.gradeDate}
                      </td>
                      <td className="py-2 px-3 text-center font-bold font-mono">علاوة {item.prevIncrement}</td>
                      <td className="py-2 px-3 text-center font-black font-mono text-red-900 bg-red-50/60">
                        علاوة {item.newIncrement}
                      </td>
                      <td className="py-2 px-3 font-mono dir-ltr text-right text-gray-600">{formatDateDisplay(item.effectiveDate)}</td>
                      <td className="py-2 px-3 text-[10px] text-gray-600">{item.notes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Official Certification Clause */}
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 text-[11px] text-gray-700 leading-relaxed">
              <span className="font-bold text-gray-900">إقرار وتوثيق: </span>
              تم احتساب وصرف العلاوة السنوية الدورية للموظفين الواردة أسماؤهم أعلاه طبقاً لأحكام القانون رقم (12) لسنة 2010 بشأن علاقات العمل ولائحته التنفيذية، مع التأكيد الصارم على ثبات وحفظ «تاريخ الدرجة الحالية» لكافة الموظفين دون أي مساس أو تعديل.
            </div>

            {/* Signatures Section */}
            <div className="grid grid-cols-3 gap-6 pt-6 border-t-2 border-gray-300 text-center text-xs">
              <div className="space-y-10">
                <div className="font-bold text-gray-800">إعداد شؤون الموظفين</div>
                <div className="border-b border-dotted border-gray-400 w-3/4 mx-auto"></div>
                <div className="text-[10px] text-gray-500">التوقيع والختم</div>
              </div>

              <div className="space-y-10">
                <div className="font-bold text-gray-800">مراجعة الشؤون المالية</div>
                <div className="border-b border-dotted border-gray-400 w-3/4 mx-auto"></div>
                <div className="text-[10px] text-gray-500">التوقيع والختم</div>
              </div>

              <div className="space-y-10">
                <div className="font-extrabold text-gray-950">اعتماد مدير عام مصرف الدم المركزي</div>
                <div className="border-b border-dotted border-gray-400 w-3/4 mx-auto"></div>
                <div className="text-[10px] text-gray-500">التوقيع والختم الرسمي</div>
              </div>
            </div>

          </div>
        </div>

        {/* Modal Bottom Footer */}
        <div className="px-6 py-3 bg-white border-t border-gray-200 flex items-center justify-between shrink-0">
          <div className="text-xs text-gray-500 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>تقرير نظامي صادر من المنظومة الإدارية المعتمدة</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-4 h-4 text-amber-400" />
              <span>طباعة</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 bg-red-700 hover:bg-red-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              إغلاق
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
