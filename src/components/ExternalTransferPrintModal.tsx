import React, { useEffect, useState } from 'react';
import { Employee, ResignationRecord } from '../types';
import { 
  Printer, 
  X, 
  Building2, 
  FileDown, 
  Loader2, 
  CheckCircle2, 
  Stamp, 
  UserCheck, 
  FileCheck2,
  ArrowLeftRight,
  ShieldCheck,
  Building
} from 'lucide-react';
import { formatDateDisplay } from '../utils/dateUtils';
import { exportElementToPdf, exportElementToImage } from '../utils/pdfExport';

interface ExternalTransferPrintModalProps {
  record: ResignationRecord;
  employee: Employee | undefined;
  onClose: () => void;
}

export const ExternalTransferPrintModal: React.FC<ExternalTransferPrintModalProps> = ({
  record,
  employee,
  onClose
}) => {
  const defaultPdfFilename = `قرار_نقل_خارجي_${employee?.jobNumber?.replace('/', '_') || record.employeeId}_${record.resignationDate || '2026'}.pdf`;

  // Export states
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [exportPdfSuccess, setExportPdfSuccess] = useState(false);
  const [isExportingImg, setIsExportingImg] = useState(false);
  const [exportImgSuccess, setExportImgSuccess] = useState(false);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Export to PDF
  const handleExportPdf = async () => {
    setIsExportingPdf(true);
    setExportPdfSuccess(false);
    try {
      const success = await exportElementToPdf('PRINT_EXTERNAL_TRANSFER_FORM', defaultPdfFilename, {
        orientation: 'portrait',
        margin: 6,
        scale: 2.6
      });
      if (success) {
        setExportPdfSuccess(true);
        setTimeout(() => setExportPdfSuccess(false), 3000);
      }
    } catch (err) {
      console.error('Failed to export transfer PDF:', err);
    } finally {
      setIsExportingPdf(false);
    }
  };

  // Export to Image PNG
  const handleExportImage = async () => {
    setIsExportingImg(true);
    setExportImgSuccess(false);
    try {
      const success = await exportElementToImage(
        'PRINT_EXTERNAL_TRANSFER_FORM', 
        defaultPdfFilename.replace('.pdf', '.png'), 
        'png',
        2.5
      );
      if (success) {
        setExportImgSuccess(true);
        setTimeout(() => setExportImgSuccess(false), 3000);
      }
    } catch (err) {
      console.error('Failed to export transfer Image:', err);
    } finally {
      setIsExportingImg(false);
    }
  };

  // Browser Print
  const handlePrint = () => {
    window.print();
  };

  const destinationEntity = record.destinationEntity || employee?.transferredTo || 'جهة خارجية معتمدة';
  const effectiveDate = record.resignationDate || record.lastWorkingDate || new Date().toISOString().slice(0, 10);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto print:p-0 print:bg-white">
      <div className="bg-white border border-slate-300 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[96vh] flex flex-col overflow-hidden print:border-none print:shadow-none print:max-w-none print:max-h-none">
        
        {/* Modal Top Control Bar (Hidden when printing) */}
        <div className="p-3 sm:p-4 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-3 shrink-0 print:hidden border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-red-950 text-red-400 border border-red-800">
              <ArrowLeftRight className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-white">
                طباعة إجراء النقل الخارجي وخروج من الملاك الوظيفي
              </h3>
              <p className="text-[11px] text-slate-300">
                النموذج الإداري المعتمد لمصرف الدم المركزي بلدية المرج
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-red-700 hover:bg-red-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-sm cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة المستند</span>
            </button>

            <button
              onClick={handleExportPdf}
              disabled={isExportingPdf}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-sm cursor-pointer ${
                exportPdfSuccess
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
              }`}
            >
              {isExportingPdf ? (
                <Loader2 className="w-4 h-4 animate-spin text-red-400" />
              ) : exportPdfSuccess ? (
                <CheckCircle2 className="w-4 h-4 text-white" />
              ) : (
                <FileDown className="w-4 h-4 text-red-400" />
              )}
              <span>{isExportingPdf ? 'جاري التحميل...' : exportPdfSuccess ? 'تم حفظ PDF' : 'تصدير PDF'}</span>
            </button>

            <button
              onClick={handleExportImage}
              disabled={isExportingImg}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-sm cursor-pointer ${
                exportImgSuccess
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
              }`}
            >
              {isExportingImg ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Building className="w-4 h-4 text-emerald-400" />
              )}
              <span>صورة PNG</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Area */}
        <div className="p-4 sm:p-8 overflow-y-auto bg-slate-100/60 print:bg-white print:p-0 flex justify-center">
          <div 
            id="PRINT_EXTERNAL_TRANSFER_FORM"
            className="w-full max-w-[210mm] bg-white text-slate-900 p-8 sm:p-10 shadow-lg border border-slate-300 print:border-none print:shadow-none print:p-8 relative min-h-[285mm] flex flex-col justify-between"
            dir="rtl"
          >
            {/* Document Watermark */}
            <div className="absolute inset-0 flex items-center justify-center opacity-4 pointer-events-none select-none z-0">
              <img src="/logo.jpg" alt="Watermark" className="w-[380px] object-contain opacity-10" />
            </div>

            {/* Top Official Header */}
            <div className="relative z-10 border-b-2 border-red-900 pb-4 mb-6">
              <div className="flex items-center justify-between gap-4">
                
                {/* State & Institution Hierarchy (Right) */}
                <div className="text-right space-y-1">
                  <p className="text-xs font-bold text-slate-800 tracking-wide">دولة ليبيا</p>
                  <p className="text-xs font-bold text-slate-800">وزارة الصحة</p>
                  <p className="text-sm font-black text-red-900">مصرف الدم المركزي بلدية المرج</p>
                  <p className="text-[11px] font-bold text-slate-600">وحدة الشؤون الإدارية والموظفين</p>
                </div>

                {/* Central Official Logo */}
                <div className="flex flex-col items-center justify-center">
                  <div className="w-20 h-20 rounded-2xl bg-white border-2 border-red-800 p-1 shadow-sm flex items-center justify-center overflow-hidden">
                    <img 
                      src="/logo.jpg" 
                      alt="الشعار الرسمي لمصرف الدم المركزي المرج" 
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <span className="text-[10px] font-black text-slate-700 mt-1">مصرف الدم المركزي المرج</span>
                </div>

                {/* Document Metadata (Left) */}
                <div className="text-left space-y-1 font-mono text-xs">
                  <div className="flex items-center justify-end gap-1.5">
                    <span className="font-bold text-slate-900">{record.id}</span>
                    <span className="font-sans font-bold text-slate-500">:رقم الإجراء</span>
                  </div>
                  <div className="flex items-center justify-end gap-1.5">
                    <span className="font-bold text-slate-900">{record.decisionNumber || 'ق/ن/2026/01'}</span>
                    <span className="font-sans font-bold text-slate-500">:رقم القرار</span>
                  </div>
                  <div className="flex items-center justify-end gap-1.5">
                    <span className="font-bold text-slate-900">{formatDateDisplay(record.decisionDate || effectiveDate)}</span>
                    <span className="font-sans font-bold text-slate-500">:تاريخ القرار</span>
                  </div>
                  <div className="flex items-center justify-end gap-1.5">
                    <span className="font-bold text-slate-900">{formatDateDisplay(effectiveDate)}</span>
                    <span className="font-sans font-bold text-slate-500">:تاريخ السريان</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Document Title Banner */}
            <div className="relative z-10 text-center mb-6">
              <div className="inline-block bg-red-950 text-white px-8 py-2 rounded-xl border border-red-800 shadow-sm">
                <h2 className="text-lg font-black tracking-wide">
                  إجراء نقل خارجي وخروج من الملاك الوظيفي
                </h2>
                <p className="text-[11px] text-red-200 mt-0.5 font-bold">
                  (خارج الملاك الوظيفي لمصرف الدم المركزي المرج)
                </p>
              </div>
            </div>

            {/* Formal Legal Preamble */}
            <div className="relative z-10 mb-5 bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs text-slate-800 leading-relaxed font-medium">
              <p>
                بناءً على مقتضيات المصلحة العامة، وعلى موافقة إدارة مصرف الدم المركزي المرج والجهة الطالبة للنقل، 
                وطبقاً لأحكام القانون رقم (12) لسنة 2010 بشأن علاقات العمل ولائحته التنفيذية، وقرار النقل الصادر برقم{' '}
                <strong className="text-red-900 font-bold">({record.decisionNumber || 'المرفق'})</strong> بتاريخ{' '}
                <strong className="text-red-900 font-bold">{formatDateDisplay(record.decisionDate || effectiveDate)}</strong>:
              </p>
              <p className="mt-1 text-slate-900 font-bold">
                تقرر اتخاذ الإجراءات الإدارية والوظيفية لنقل الموظف الموضحة بياناته أدناه إلى الجهة المنقول إليها واعتباره خارج الملاك الوظيفي للمصرف.
              </p>
            </div>

            {/* Section 1: Employee Information Table */}
            <div className="relative z-10 mb-5">
              <div className="flex items-center gap-2 mb-2">
                <UserCheck className="w-4 h-4 text-red-800" />
                <h4 className="text-xs font-black text-slate-900 uppercase">أولاً: البيانات الوظيفية للموظف المنقول</h4>
              </div>

              <div className="border border-slate-300 rounded-xl overflow-hidden shadow-xs">
                <table className="w-full text-xs text-right border-collapse">
                  <tbody>
                    <tr className="border-b border-slate-200 bg-slate-50/70">
                      <td className="p-2.5 font-bold text-slate-600 w-1/4 border-l border-slate-200">الاسم الرباعي:</td>
                      <td className="p-2.5 font-black text-slate-950 w-1/4 border-l border-slate-200">{employee?.fullName || 'غير محدد'}</td>
                      <td className="p-2.5 font-bold text-slate-600 w-1/4 border-l border-slate-200">الرقم الوظيفي / الملف:</td>
                      <td className="p-2.5 font-black text-red-900 w-1/4 font-mono">{employee?.jobNumber || employee?.id || '—'}</td>
                    </tr>
                    <tr className="border-b border-slate-200">
                      <td className="p-2.5 font-bold text-slate-600 border-l border-slate-200">الرقم الوطني:</td>
                      <td className="p-2.5 font-bold text-slate-900 border-l border-slate-200 font-mono">{employee?.nationalId || '—'}</td>
                      <td className="p-2.5 font-bold text-slate-600 border-l border-slate-200">الدرجة الحالية والعلاوات:</td>
                      <td className="p-2.5 font-bold text-slate-900 font-mono">
                        {employee?.jobGrade || '—'} (العلاوة {employee?.currentIncrement || 0})
                      </td>
                    </tr>
                    <tr className="border-b border-slate-200 bg-slate-50/70">
                      <td className="p-2.5 font-bold text-slate-600 border-l border-slate-200">المسمى الوظيفي:</td>
                      <td className="p-2.5 font-bold text-slate-900 border-l border-slate-200">{employee?.jobTitle || '—'}</td>
                      <td className="p-2.5 font-bold text-slate-600 border-l border-slate-200">القسم / الإدارة السابقة:</td>
                      <td className="p-2.5 font-bold text-slate-900">{record.previousDepartment || employee?.department || '—'}</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold text-slate-600 border-l border-slate-200">المؤهل والتخصص:</td>
                      <td className="p-2.5 font-bold text-slate-900 border-l border-slate-200">{employee?.qualification || '—'} / {employee?.specialization || '—'}</td>
                      <td className="p-2.5 font-bold text-slate-600 border-l border-slate-200">جهة التعيين الأصلية:</td>
                      <td className="p-2.5 font-bold text-slate-900">{employee?.hiringEntity || 'وزارة الصحة'}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Section 2: External Transfer & Destination Details */}
            <div className="relative z-10 mb-5">
              <div className="flex items-center gap-2 mb-2">
                <Building2 className="w-4 h-4 text-red-800" />
                <h4 className="text-xs font-black text-slate-900 uppercase">ثانياً: تفاصيل النقل الخارجي والجهة المستقبلة</h4>
              </div>

              <div className="border-2 border-red-800/80 rounded-xl overflow-hidden shadow-xs bg-red-50/20">
                <table className="w-full text-xs text-right border-collapse">
                  <tbody>
                    <tr className="border-b border-red-200 bg-red-100/60">
                      <td className="p-3 font-black text-red-950 w-1/4 border-l border-red-200">الجهة المنقول إليها (إجباري):</td>
                      <td className="p-3 font-black text-red-900 text-sm w-3/4" colSpan={3}>
                        {destinationEntity}
                      </td>
                    </tr>
                    <tr className="border-b border-red-200">
                      <td className="p-2.5 font-bold text-slate-700 w-1/4 border-l border-red-200">تاريخ سريان النقل:</td>
                      <td className="p-2.5 font-bold text-slate-900 w-1/4 border-l border-red-200 font-mono">{formatDateDisplay(effectiveDate)}</td>
                      <td className="p-2.5 font-bold text-slate-700 w-1/4 border-l border-red-200">الوضع الوظيفي الجديد:</td>
                      <td className="p-2.5 font-black text-rose-800 w-1/4">منقول خارجياً (خارج الملاك الوظيفي)</td>
                    </tr>
                    <tr className="border-b border-red-200 bg-white/60">
                      <td className="p-2.5 font-bold text-slate-700 border-l border-red-200">سبب ومسوغات النقل:</td>
                      <td className="p-2.5 text-slate-800 font-medium" colSpan={3}>
                        {record.reason || 'بناءً على طلب الموظف وموافقة الجهات الإدارية المختصة وحاجة العمل'}
                      </td>
                    </tr>
                    {record.notes && (
                      <tr>
                        <td className="p-2.5 font-bold text-slate-700 border-l border-red-200">ملاحظات إدارية:</td>
                        <td className="p-2.5 text-slate-700" colSpan={3}>
                          {record.notes}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Section 3: Administrative Instructions & Clearance */}
            <div className="relative z-10 mb-6 bg-slate-50 border border-slate-200 rounded-xl p-3 text-[11px] text-slate-700 space-y-1">
              <p className="font-bold text-slate-900">توجيهات إدارية ملزمة:</p>
              <ul className="list-disc list-inside space-y-0.5 font-medium text-slate-600">
                <li>يتم استكمال إجراءات إخلاء الطرف الإداري والمالي وتسليم العهد الرسمية لدى مصرف الدم.</li>
                <li>يُحال الملف الوظيفي الأصلي مع المستندات والتقارير المالية إلى <strong className="text-slate-900">{destinationEntity}</strong>.</li>
                <li>يتم حفظ السجل التاريخي الكامل والمستندات بصفة دائمة في قاعدة بيانات مصرف الدم المركزي المرج.</li>
              </ul>
            </div>

            {/* Section 4: Signatures, Approvals & Official Seal */}
            <div className="relative z-10 pt-4 border-t-2 border-slate-300">
              <div className="grid grid-cols-4 gap-3 text-center text-xs">
                
                {/* Personnel Department */}
                <div className="space-y-8 flex flex-col justify-between">
                  <div>
                    <p className="font-black text-slate-900">إعداد شؤون الموظفين</p>
                    <p className="text-[10px] text-slate-500 font-medium">رئيس وحدة الشؤون الوظيفية</p>
                  </div>
                  <div className="border-b border-dotted border-slate-400 w-3/4 mx-auto pb-1 text-[11px] font-bold text-slate-800">
                    التوقيع: ........................
                  </div>
                </div>

                {/* Direct Supervisor */}
                <div className="space-y-8 flex flex-col justify-between">
                  <div>
                    <p className="font-black text-slate-900">الرئيس المباشر</p>
                    <p className="text-[10px] text-slate-500 font-medium">رئيس القسم / الإدارة</p>
                  </div>
                  <div className="border-b border-dotted border-slate-400 w-3/4 mx-auto pb-1 text-[11px] font-bold text-slate-800">
                    التوقيع: ........................
                  </div>
                </div>

                {/* General Director */}
                <div className="space-y-8 flex flex-col justify-between">
                  <div>
                    <p className="font-black text-slate-900">يعتمد المدير العام</p>
                    <p className="text-[10px] text-slate-500 font-medium">مصرف الدم المركزي المرج</p>
                  </div>
                  <div className="border-b border-dotted border-slate-400 w-3/4 mx-auto pb-1 text-[11px] font-bold text-slate-800">
                    التوقيع: ........................
                  </div>
                </div>

                {/* Official Circular Stamp Box */}
                <div className="flex flex-col items-center justify-center">
                  <div className="w-24 h-24 rounded-full border-2 border-dashed border-red-800 flex flex-col items-center justify-center p-2 text-center text-red-900 bg-red-50/30">
                    <Stamp className="w-5 h-5 text-red-800 mb-1 opacity-80" />
                    <span className="text-[9px] font-black leading-tight">مكان الختم الرسمي للمصرف</span>
                  </div>
                </div>

              </div>
            </div>

            {/* Bottom Footer Note */}
            <div className="relative z-10 text-center text-[10px] text-slate-400 pt-6 mt-4 border-t border-slate-100 flex items-center justify-between">
              <span>مصرف الدم المركزي بلدية المرج - منظومة الشؤون الإدارية والموارد البشرية الإلكترونية</span>
              <span className="font-mono">تاريخ الطباعة: {new Date().toLocaleDateString('ar-LY')} {new Date().toLocaleTimeString('ar-LY', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
