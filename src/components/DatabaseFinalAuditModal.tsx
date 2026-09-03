import React, { useMemo } from 'react';
import { FullAppDatabase } from '../utils/storageTypes';
import { 
  X, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  Printer, 
  FileCheck2, 
  Database,
  Building,
  Users,
  Award,
  Calendar
} from 'lucide-react';
import { runFinalProductionAudit, TARGET_LEGITIMATE_COUNT } from '../utils/testRecordCleanupUtils';

interface DatabaseFinalAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
  fullDatabase: FullAppDatabase;
}

export const DatabaseFinalAuditModal: React.FC<DatabaseFinalAuditModalProps> = ({
  isOpen,
  onClose,
  fullDatabase
}) => {
  if (!isOpen) return null;

  const auditResult = useMemo(() => {
    return runFinalProductionAudit(fullDatabase, TARGET_LEGITIMATE_COUNT);
  }, [fullDatabase]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150">
        
        {/* HEADER */}
        <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black shadow-inner">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white tracking-tight">
                التدقيق النهائي الشامل لقاعدة البيانات (Final Production Audit)
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                فحص وتوثيق سلامة سجلات الملاك المعتمد ومطابقة المعايير القياسية
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4 text-slate-300" />
              <span>طباعة تقرير التدقيق</span>
            </button>
            
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* BODY */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50/50">
          
          {/* BANNER STATUS */}
          <div className={`p-4 rounded-xl border flex items-center gap-3.5 ${
            auditResult.passed 
              ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
              : 'bg-amber-50 border-amber-300 text-amber-950'
          }`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
              auditResult.passed ? 'bg-emerald-200 text-emerald-800' : 'bg-amber-200 text-amber-800'
            }`}>
              {auditResult.passed ? <CheckCircle2 className="w-6 h-6" /> : <AlertCircle className="w-6 h-6" />}
            </div>
            <div>
              <h3 className="text-sm font-black">
                {auditResult.passed ? 'نتيجة التدقيق النهائي: معتمد ومطابق بنسبة 100%' : 'تنبيه: توجد بنود تتطلب معالجة'}
              </h3>
              <p className="text-xs mt-0.5 leading-relaxed font-medium">
                {auditResult.summaryMessage}
              </p>
            </div>
          </div>

          {/* AUDIT CHECKLIST TABLE */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-2xs overflow-hidden">
            <div className="bg-slate-100 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileCheck2 className="w-4 h-4 text-slate-700" />
                <h4 className="text-sm font-black text-slate-900">بنود التدقيق ومعايير القبول الإنتاجي</h4>
              </div>
              <span className="text-xs text-slate-500 font-mono font-bold">10 / 10 بنود فحص</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-gray-200 font-bold text-slate-700">
                    <th className="py-2.5 px-4">#</th>
                    <th className="py-2.5 px-4">بند التدقيق والتحقق</th>
                    <th className="py-2.5 px-4">القيمة المستهدفة</th>
                    <th className="py-2.5 px-4">القيمة الفعلية بقاعدة البيانات</th>
                    <th className="py-2.5 px-4">الحالة والنتيجة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {auditResult.auditItems.map((item, idx) => (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-400">{idx + 1}</td>
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {item.label}
                        {item.details && (
                          <span className="text-[11px] text-slate-500 font-normal block mt-0.5">{item.details}</span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-700">{item.expected}</td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">{item.actual}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                          item.passed 
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : 'bg-red-100 text-red-800 border border-red-200'
                        }`}>
                          {item.passed ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                          <span>{item.passed ? 'مطابق وناجح' : 'غير مطابق'}</span>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* SYSTEM ARCHITECTURE VERIFICATION NOTE */}
          <div className="bg-slate-100 p-4 rounded-xl border border-gray-200 text-xs text-slate-700 space-y-1">
            <div className="font-bold text-slate-900">إقرار الجاهزية المحلية والإنتاجية:</div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              هذه المنظومة مصممة للعمل محلياً بالكامل على جهاز المستخدم (Standalone Local Application) دون أي تبعية لسيرفرات خارجية أو خدمات سحابية. يتم حفظ البيانات بصيغة JSON محلية مشفرة وتلقائية.
            </p>
          </div>

        </div>

        {/* FOOTER */}
        <div className="bg-slate-100 px-5 py-3.5 border-t border-gray-200 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-500 font-medium">
            تاريخ ووقت التدقيق: {new Date().toLocaleDateString('ar-LY')} - {new Date().toLocaleTimeString('ar-LY')}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            إغلاق التقرير
          </button>
        </div>

      </div>
    </div>
  );
};
