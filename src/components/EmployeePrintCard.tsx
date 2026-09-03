import React, { useState } from 'react';
import { Employee } from '../types';
import { X, Printer, FileDown, Loader2, CheckCircle2 } from 'lucide-react';
import { exportElementToPdf } from '../utils/pdfExport';

interface EmployeePrintCardProps {
  employee: Employee | null;
  onClose: () => void;
}

export const EmployeePrintCard: React.FC<EmployeePrintCardProps> = ({
  employee,
  onClose
}) => {
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  const handleExportPdf = async () => {
    if (!employee) return;
    setIsExportingPdf(true);
    setExportSuccess(false);

    const filename = `بطاقة_تعريف_${employee.jobNumber || employee.id}_${employee.fullName.replace(/\s+/g, '_')}`;

    try {
      const success = await exportElementToPdf('EMPLOYEE_BADGE_PRINT_CARD', filename, {
        orientation: 'portrait',
        scale: 3,
        margin: 10
      });

      if (success) {
        setExportSuccess(true);
        setTimeout(() => setExportSuccess(false), 3000);
      }
    } catch (err) {
      console.error('Failed to export employee badge to PDF:', err);
    } finally {
      setIsExportingPdf(false);
    }
  };

  if (!employee) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-xl bg-slate-900 border-2 border-red-800 rounded-2xl shadow-2xl overflow-hidden my-auto">
        
        {/* Modal Top Header (Screen Only) */}
        <div className="bg-gradient-to-r from-red-950 via-red-900 to-red-950 px-6 py-4 border-b border-red-800 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2.5">
            <Printer className="w-5 h-5 text-red-300" />
            <div>
              <h3 className="text-sm font-extrabold text-white">بطاقة تعريف موظف - مصرف الدم المركزي المرج</h3>
              <p className="text-xs text-red-200">معاينة بطاقة التعريف الرسمية للطباعة والتصدير</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportPdf}
              disabled={isExportingPdf}
              type="button"
              className={`px-3.5 py-2 rounded-xl text-white font-bold text-xs shadow-lg transition-all flex items-center gap-1.5 border ${
                exportSuccess
                  ? 'bg-emerald-600 border-emerald-400'
                  : 'bg-slate-800 hover:bg-slate-700 border-slate-600'
              } disabled:opacity-50 cursor-pointer`}
            >
              {isExportingPdf ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-red-300" />
                  <span>جاري التصدير...</span>
                </>
              ) : exportSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                  <span>تم التصدير PDF</span>
                </>
              ) : (
                <>
                  <FileDown className="w-4 h-4 text-red-400" />
                  <span>تصدير PDF</span>
                </>
              )}
            </button>

            <button
              onClick={handlePrint}
              type="button"
              className="px-4 py-2 rounded-xl bg-red-700 hover:bg-red-600 text-white font-bold text-xs shadow-lg transition-all flex items-center gap-1.5 border border-red-500 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة الآن</span>
            </button>
            
            <button
              onClick={onClose}
              type="button"
              className="p-1.5 rounded-lg bg-red-900 hover:bg-red-700 text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Badge Card Container (Printable) */}
        <div className="p-6 flex justify-center bg-slate-950 print:p-0 print:bg-white">
          
          <div 
            id="EMPLOYEE_BADGE_PRINT_CARD"
            className="w-[340px] bg-gradient-to-b from-white via-slate-50 to-red-50 text-slate-900 border-2 border-red-900 rounded-2xl p-5 shadow-2xl relative overflow-hidden space-y-4 print:shadow-none print:w-full"
          >
            
            {/* Top Badge Letterhead */}
            <div className="text-center border-b-2 border-red-800 pb-3 space-y-1">
              <div className="flex items-center justify-center gap-2">
                <div className="w-12 h-12 rounded-xl bg-white border-2 border-red-800 p-0.5 overflow-hidden flex-shrink-0 shadow-sm flex items-center justify-center">
                  <img src="/logo.jpg" alt="شعار مصرف الدم المركزي بلدية المرج" className="w-full h-full object-contain" />
                </div>
                <div>
                  <h4 className="text-[11px] font-black text-red-900 leading-tight">دولة ليبيا - وزارة الصحة</h4>
                  <h3 className="text-xs font-black text-slate-900">مصرف الدم المركزي بلدية المرج</h3>
                </div>
              </div>
              <p className="text-[9px] font-bold text-red-800 bg-red-100 rounded-full py-0.5 px-3 inline-block">
                بطاقة تعريف موظف رسمية (Employee ID)
              </p>
            </div>

            {/* Photo & ID Badge Details */}
            <div className="flex gap-3 items-center">
              {/* Photo Box */}
              <div className="w-20 h-24 rounded-xl bg-slate-100 border-2 border-red-800 overflow-hidden flex flex-col items-center justify-center flex-shrink-0 shadow-inner">
                <img src="/logo.jpg" alt="شعار الموظف" className="w-full h-full object-cover" />
              </div>

              {/* Employee Details */}
              <div className="space-y-1 text-[11px] flex-1 leading-tight">
                <p className="text-xs font-black text-slate-900">{employee.fullName}</p>
                <p className="font-bold text-red-800">{employee.jobTitle}</p>
                <p className="text-slate-700"><strong>القسم:</strong> {employee.department}</p>
                <p className="text-slate-700 font-mono"><strong>الرقم الوظيفي:</strong> {employee.jobNumber}</p>
                <p className="text-slate-700 font-mono"><strong>الرقم الوطني:</strong> {employee.nationalId}</p>
              </div>
            </div>

            {/* Additional Table Details */}
            <div className="border-t border-slate-300 pt-3 text-[10px] space-y-1 bg-white p-2.5 rounded-xl border">
              <div className="flex justify-between">
                <span className="text-slate-500">رقم الملاك:</span>
                <span className="font-bold font-mono text-slate-900">{employee.cadreNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">تاريخ المباشرة:</span>
                <span className="font-bold font-mono text-slate-900">{employee.directingDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">الحالة الوظيفية:</span>
                <span className="font-bold text-emerald-800">{employee.status}</span>
              </div>
            </div>

            {/* Footer Bar */}
            <div className="pt-2 border-t border-red-800 flex items-center justify-between text-[9px] text-slate-600 font-bold">
              <span>مصرف الدم المركزي - المرج</span>
              <span className="font-mono text-red-900">ID: EMP-{employee.id}</span>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
