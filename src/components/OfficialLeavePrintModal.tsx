import React, { useEffect, useState } from 'react';
import { Employee, LeaveTransaction } from '../types';
import { 
  Printer, 
  X, 
  Building2, 
  ShieldCheck, 
  FileDown, 
  Loader2, 
  CheckCircle2, 
  SlidersHorizontal,
  Image as ImageIcon,
  Copy,
  QrCode,
  Stamp,
  UserCheck,
  Phone,
  FileCheck2,
  BookOpen
} from 'lucide-react';
import { formatDateDisplay, getLeavePdfFilename } from '../utils/dateUtils';
import { exportElementToPdf, exportElementToImage } from '../utils/pdfExport';

interface OfficialLeavePrintModalProps {
  leave: LeaveTransaction;
  employee: Employee | undefined;
  officialLogoUrl?: string;
  onClose: () => void;
}

export const OfficialLeavePrintModal: React.FC<OfficialLeavePrintModalProps> = ({
  leave,
  employee,
  officialLogoUrl,
  onClose
}) => {
  const defaultPdfFilename = getLeavePdfFilename(employee?.jobNumber || '1054', leave.startDate);
  
  // Export & Action States
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [exportPdfSuccess, setExportPdfSuccess] = useState(false);
  const [isExportingImg, setIsExportingImg] = useState(false);
  const [exportImgSuccess, setExportImgSuccess] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  
  // Customization Options Panel State
  const [showOptionsPanel, setShowOptionsPanel] = useState(false);

  // Form Customization Settings
  const [formMode, setFormMode] = useState<'standard' | 'handover' | 'return'>('standard');
  const [showElectronicSeal, setShowElectronicSeal] = useState(true);
  const [showQrVerification, setShowQrVerification] = useState(true);
  const [watermarkType, setWatermarkType] = useState<'approved' | 'draft' | 'original' | 'none'>('approved');
  const [showLegalCitation, setShowLegalCitation] = useState(true);
  const [showReplacementEmployee, setShowReplacementEmployee] = useState(true);
  const [replacementName, setReplacementName] = useState('.................................');
  const [showContactDetails, setShowContactDetails] = useState(true);
  const [emergencyPhone, setEmergencyPhone] = useState(employee?.phone || '091-XXXXXXX');
  const [leaveLocation, setLeaveLocation] = useState(employee?.address || 'المرج - ليبيا');
  const [showApplicantSignature, setShowApplicantSignature] = useState(true);
  const [showBalanceSummaryTable, setShowBalanceSummaryTable] = useState(true);
  const [compactLayout, setCompactLayout] = useState(false);

  // Smooth Escape Key Listener for closing
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Export Direct PDF
  const handleExportPdf = async () => {
    setIsExportingPdf(true);
    setExportPdfSuccess(false);

    try {
      const success = await exportElementToPdf('PRINT_LEAVE_FORM', defaultPdfFilename, {
        orientation: 'portrait',
        margin: compactLayout ? 4 : 6,
        scale: 2.6
      });

      if (success) {
        setExportPdfSuccess(true);
        setTimeout(() => setExportPdfSuccess(false), 3000);
      }
    } catch (err) {
      console.error('Failed to export PDF:', err);
    } finally {
      setIsExportingPdf(false);
    }
  };

  // Export Direct Image (PNG)
  const handleExportImage = async () => {
    setIsExportingImg(true);
    setExportImgSuccess(false);

    try {
      const imgFilename = defaultPdfFilename.replace('.pdf', '');
      const success = await exportElementToImage('PRINT_LEAVE_FORM', imgFilename, 'png', 2.5);

      if (success) {
        setExportImgSuccess(true);
        setTimeout(() => setExportImgSuccess(false), 3000);
      }
    } catch (err) {
      console.error('Failed to export Image:', err);
    } finally {
      setIsExportingImg(false);
    }
  };

  // Copy Summary to Clipboard
  const handleCopySummary = async () => {
    const summaryText = `[نموذج إجازة رسمية - مصرف الدم المركزي المرج]
الموظف: ${employee?.fullName || 'غير محدد'}
الرقم الوظيفي: ${employee?.jobNumber || '-'}
القسم: ${employee?.department || '-'}
نوع الإجازة: ${leave.leaveType}
الفترة: من ${formatDateDisplay(leave.startDate)} إلى ${formatDateDisplay(leave.endDate)}
المدة: ${leave.numberOfDays} يوم
تاريخ المباشرة: ${leave.returnDate ? formatDateDisplay(leave.returnDate) : '-'}
الرصيد المتبقي: ${leave.balanceAfter !== undefined ? `${leave.balanceAfter} يوم` : '-'}
رقم القيد: ${leave.id} (السنة المالية ${leave.leaveYear})`;

    try {
      await navigator.clipboard.writeText(summaryText);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 3000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  return (
    <div 
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto print:p-0 print:bg-white print:static print:block"
    >
      {/* Outer Wrapper */}
      <div className="w-full max-w-4xl space-y-3 my-auto">
        
        {/* Floating Action & Customizer Header (Hidden when printing) */}
        <div className="bg-slate-900 border border-slate-700 p-3 rounded-2xl shadow-xl print:hidden text-xs text-white space-y-3">
          
          {/* Main Top Action Row */}
          <div className="flex flex-wrap justify-between items-center gap-2">
            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                type="button"
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 rounded-xl flex items-center gap-1.5 font-bold transition-colors cursor-pointer"
              >
                <X className="w-4 h-4 text-slate-400" />
                <span>إغلاق</span>
              </button>

              <button
                onClick={() => setShowOptionsPanel(!showOptionsPanel)}
                type="button"
                className={`px-3 py-2 rounded-xl border flex items-center gap-1.5 font-bold transition-all cursor-pointer ${
                  showOptionsPanel 
                    ? 'bg-red-700 border-red-500 text-white' 
                    : 'bg-slate-800 hover:bg-slate-700 border-slate-600 text-slate-300'
                }`}
              >
                <SlidersHorizontal className="w-4 h-4 text-red-400" />
                <span>خيارات وتخصيص النموذج</span>
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Copy Summary Text */}
              <button
                onClick={handleCopySummary}
                type="button"
                title="نسخ ملخص بيانات الإجازة للمراسلات"
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 rounded-xl flex items-center gap-1.5 font-bold transition-colors cursor-pointer"
              >
                {copySuccess ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-400">تم النسخ</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-slate-400" />
                    <span className="hidden sm:inline">نسخ الملخص</span>
                  </>
                )}
              </button>

              {/* Export to Image (PNG) */}
              <button
                onClick={handleExportImage}
                disabled={isExportingImg}
                type="button"
                title="تصدير صورة عالية الدقة PNG"
                className={`px-3.5 py-2 rounded-xl font-bold flex items-center gap-1.5 border transition-all cursor-pointer ${
                  exportImgSuccess
                    ? 'bg-emerald-700 border-emerald-500 text-white'
                    : 'bg-slate-800 hover:bg-slate-700 border-slate-600 text-slate-200'
                } disabled:opacity-50`}
              >
                {isExportingImg ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-amber-300" />
                    <span>جاري التصدير...</span>
                  </>
                ) : exportImgSuccess ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                    <span>تم حفظ الصورة</span>
                  </>
                ) : (
                  <>
                    <ImageIcon className="w-4 h-4 text-amber-400" />
                    <span className="hidden sm:inline">حفظ كصورة (PNG)</span>
                  </>
                )}
              </button>

              {/* Direct PDF Export */}
              <button
                onClick={handleExportPdf}
                disabled={isExportingPdf}
                type="button"
                className={`px-4 py-2 rounded-xl font-extrabold flex items-center gap-2 shadow-lg transition-all cursor-pointer ${
                  exportPdfSuccess
                    ? 'bg-emerald-600 text-white border border-emerald-400'
                    : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-600'
                } disabled:opacity-50`}
              >
                {isExportingPdf ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-red-300" />
                    <span>إنشاء PDF...</span>
                  </>
                ) : exportPdfSuccess ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                    <span>تم التصدير PDF</span>
                  </>
                ) : (
                  <>
                    <FileDown className="w-4 h-4 text-red-400" />
                    <span>تصدير PDF (A4)</span>
                  </>
                )}
              </button>

              {/* Native Print */}
              <button
                onClick={() => window.print()}
                type="button"
                className="px-4 py-2 bg-red-700 hover:bg-red-600 text-white rounded-xl font-extrabold flex items-center gap-2 shadow-lg border border-red-500 transition-colors cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>طباعة الاستمارة (A4)</span>
              </button>
            </div>
          </div>

          {/* Expandable Customization Settings Drawer */}
          {showOptionsPanel && (
            <div className="pt-3 border-t border-slate-700 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs bg-slate-950/60 p-3.5 rounded-xl">
              
              {/* Column 1: Document Style & Mode */}
              <div className="space-y-2.5">
                <div className="text-red-400 font-extrabold flex items-center gap-1.5">
                  <FileCheck2 className="w-4 h-4" />
                  <span>نوع ونمط الاستمارة</span>
                </div>

                <div className="space-y-1.5">
                  <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white">
                    <input
                      type="radio"
                      name="formMode"
                      checked={formMode === 'standard'}
                      onChange={() => setFormMode('standard')}
                      className="accent-red-600"
                    />
                    <span>استمارة إجازة سنوية معتمدة (قياسي)</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white">
                    <input
                      type="radio"
                      name="formMode"
                      checked={formMode === 'handover'}
                      onChange={() => setFormMode('handover')}
                      className="accent-red-600"
                    />
                    <span>استمارة مع إشعار استلام مهام للبديل</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white">
                    <input
                      type="radio"
                      name="formMode"
                      checked={formMode === 'return'}
                      onChange={() => setFormMode('return')}
                      className="accent-red-600"
                    />
                    <span>إشعار عودة ومباشرة عمل بعد الإجازة</span>
                  </label>
                </div>

                <div className="pt-1">
                  <label className="text-[11px] text-slate-400 block mb-1">العلامة المائية للمستند:</label>
                  <select
                    value={watermarkType}
                    onChange={(e) => setWatermarkType(e.target.value as any)}
                    className="w-full bg-slate-800 border border-slate-600 text-slate-200 rounded-lg p-1.5 text-xs outline-none font-bold"
                  >
                    <option value="approved">نسخة رسمية معتمدة (Approved)</option>
                    <option value="original">أصلية للملف الوظيفي (Official Record)</option>
                    <option value="draft">مسودة تدقيق (Draft)</option>
                    <option value="none">بدون علامة مائية</option>
                  </select>
                </div>
              </div>

              {/* Column 2: Badges & Seals */}
              <div className="space-y-2.5">
                <div className="text-red-400 font-extrabold flex items-center gap-1.5">
                  <Stamp className="w-4 h-4" />
                  <span>الأختام والرموز الرقمية</span>
                </div>

                <div className="space-y-1.5">
                  <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white">
                    <input
                      type="checkbox"
                      checked={showElectronicSeal}
                      onChange={(e) => setShowElectronicSeal(e.target.checked)}
                      className="accent-red-600 rounded"
                    />
                    <span>إظهار الختم الرسمي الإلكتروني للمصرف</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white">
                    <input
                      type="checkbox"
                      checked={showQrVerification}
                      onChange={(e) => setShowQrVerification(e.target.checked)}
                      className="accent-red-600 rounded"
                    />
                    <span>إظهار باركود التحقق الرقمي QR</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white">
                    <input
                      type="checkbox"
                      checked={showLegalCitation}
                      onChange={(e) => setShowLegalCitation(e.target.checked)}
                      className="accent-red-600 rounded"
                    />
                    <span>إظهار السند القانوني (قانون 12 لسنة 2010)</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white">
                    <input
                      type="checkbox"
                      checked={showBalanceSummaryTable}
                      onChange={(e) => setShowBalanceSummaryTable(e.target.checked)}
                      className="accent-red-600 rounded"
                    />
                    <span>عرض جدول تفصيل الرصيد السنوي</span>
                  </label>
                </div>
              </div>

              {/* Column 3: Replacement & Contact Settings */}
              <div className="space-y-2.5">
                <div className="text-red-400 font-extrabold flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4" />
                  <span>بيانات البديل والتواصل</span>
                </div>

                <div className="space-y-1.5">
                  <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white">
                    <input
                      type="checkbox"
                      checked={showReplacementEmployee}
                      onChange={(e) => setShowReplacementEmployee(e.target.checked)}
                      className="accent-red-600 rounded"
                    />
                    <span>إدراج خانة الموظف البديل المكلف</span>
                  </label>

                  {showReplacementEmployee && (
                    <input
                      type="text"
                      placeholder="اسم الموظف المكلف بالبدالة..."
                      value={replacementName === '.................................' ? '' : replacementName}
                      onChange={(e) => setReplacementName(e.target.value || '.................................')}
                      className="w-full bg-slate-800 border border-slate-600 text-slate-200 rounded-lg px-2.5 py-1 text-xs outline-none"
                    />
                  )}

                  <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white">
                    <input
                      type="checkbox"
                      checked={showContactDetails}
                      onChange={(e) => setShowContactDetails(e.target.checked)}
                      className="accent-red-600 rounded"
                    />
                    <span>إدراج بيانات التواصل والعنوان بالإجازة</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white">
                    <input
                      type="checkbox"
                      checked={showApplicantSignature}
                      onChange={(e) => setShowApplicantSignature(e.target.checked)}
                      className="accent-red-600 rounded"
                    />
                    <span>إظهار إقرار وتوقيع طالب الإجازة</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white">
                    <input
                      type="checkbox"
                      checked={compactLayout}
                      onChange={(e) => setCompactLayout(e.target.checked)}
                      className="accent-red-600 rounded"
                    />
                    <span>تنسيق مدمج مضغوط لصفحة واحدة A4</span>
                  </label>
                </div>
              </div>

            </div>
          )}

        </div>

        {/* ------------------------------------------------------------- */}
        {/* Printable Official Leave Form Document (`PRINT_LEAVE_FORM`) */}
        {/* ------------------------------------------------------------- */}
        <div 
          id="PRINT_LEAVE_FORM"
          className={`bg-white rounded-2xl shadow-2xl w-full border border-gray-300 print:shadow-none print:border-none print:w-full print:p-0 relative font-sans text-gray-900 overflow-hidden ${
            compactLayout ? 'p-5 space-y-2 text-[11px]' : 'p-7 space-y-3.5 text-xs'
          }`}
        >
          
          {/* Optional Watermark */}
          {watermarkType !== 'none' && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 opacity-[0.04] select-none">
              <span className="text-8xl font-black rotate-[-30deg] tracking-widest text-red-950 uppercase">
                {watermarkType === 'approved' && 'معتمدة رسمياً'}
                {watermarkType === 'original' && 'أصل محفوظ بالملف'}
                {watermarkType === 'draft' && 'مسودة مراجعة'}
              </span>
            </div>
          )}

          {/* ------------------- HEADER ------------------- */}
          <div className="border-b-2 border-red-800 pb-3 avoid-break relative z-10">
            <div className="flex justify-between items-center">
              {/* Right: State & Entity Title (Arabic RTL) */}
              <div className="text-right space-y-0.5">
                <h3 className="text-[11px] font-extrabold text-gray-700">دولة ليبيا — وزارة الصحة</h3>
                <h1 className="text-lg font-black text-red-900 tracking-wide">مصرف الدم المركزي المرج</h1>
                <p className="text-[11px] font-bold text-gray-600">مكتب شؤون الموظفين والإدارة العامة</p>
              </div>

              {/* Center: Official Logo */}
              <div className="flex flex-col items-center justify-center">
                {officialLogoUrl ? (
                  <img 
                    src={officialLogoUrl} 
                    alt="شعار مصرف الدم المركزي المرج" 
                    className="w-16 h-16 object-contain"
                  />
                ) : (
                  <div className="flex flex-col items-center">
                    <div className="w-14 h-14 rounded-full bg-red-50 border-2 border-red-700 flex items-center justify-center shadow-inner relative">
                      <svg className="w-8 h-8 text-red-700" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
                      </svg>
                    </div>
                    <span className="text-[8px] font-bold text-gray-500 mt-0.5">مصرف الدم المركزي المرج</span>
                  </div>
                )}
              </div>

              {/* Left: Document Metadata & QR */}
              <div className="flex items-center gap-3">
                {showQrVerification && (
                  <div className="text-center p-1 bg-gray-50 border border-gray-300 rounded-lg">
                    <QrCode className="w-10 h-10 text-gray-800 mx-auto" />
                    <span className="text-[8px] font-mono text-gray-500 block leading-tight">LEAVE-{leave.id}</span>
                  </div>
                )}

                <div className="text-left font-mono text-[11px] text-gray-600 space-y-0.5 dir-ltr">
                  <div>السنة المالية: <strong className="text-red-900">{leave.leaveYear}</strong></div>
                  <div>تاريخ التحرير: <strong className="text-gray-900">{formatDateDisplay(leave.createdAt ? leave.createdAt.slice(0, 10) : new Date().toISOString().slice(0, 10))}</strong></div>
                  <div>كود الإجازة: <strong className="text-gray-900 bg-gray-100 px-1 rounded font-mono">{leave.id}</strong></div>
                </div>
              </div>
            </div>

            {/* DYNAMIC HEADER TITLE */}
            <div className="mt-2.5 bg-red-800 text-white text-center py-2 px-4 rounded-lg font-black text-base md:text-lg tracking-widest shadow-sm uppercase flex items-center justify-center gap-2">
              <span>
                {formMode === 'standard' && `نموذج ${leave.leaveType || 'إجازة سنوية'} رسمي`}
                {formMode === 'handover' && `نموذج ${leave.leaveType || 'إجازة سنوية'} مع إشعار استلام مهام البديل`}
                {formMode === 'return' && `إشعار عودة ومباشرة عمل بعد الإجازة (${leave.leaveType})`}
              </span>
            </div>
          </div>

          {/* ------------------- SECTION 1: EMPLOYEE INFORMATION ------------------- */}
          <div className="space-y-1 avoid-break relative z-10">
            <div className="flex items-center justify-between text-xs font-bold text-red-900 border-r-4 border-red-800 pr-2">
              <div className="flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-red-700" />
                <span>أولاً: البيانات الشخصية والوظيفية للموظف</span>
              </div>
              <span className="text-[10px] text-gray-500 font-normal">ملف الموظف المحفوظ بالإدارة</span>
            </div>

            <div className="grid grid-cols-3 gap-2 bg-gray-50 p-2.5 rounded-xl border border-gray-200 text-xs">
              <div>
                <span className="text-gray-500 block text-[10px]">اسم الموظف الرباعي:</span>
                <strong className="text-gray-900 font-extrabold text-sm">{employee?.fullName || 'غير محدد'}</strong>
              </div>

              <div className="bg-red-50/80 p-1 rounded-lg border border-red-200">
                <span className="text-red-800 block text-[10px] font-bold">الرقم الوظيفي / رقم الملف:</span>
                <strong className="text-red-950 font-mono text-base font-black">{employee?.jobNumber || '-'}</strong>
              </div>

              <div>
                <span className="text-gray-500 block text-[10px]">الرقم الوطني:</span>
                <strong className="text-gray-900 font-mono">{employee?.nationalId || '-'}</strong>
              </div>

              <div>
                <span className="text-gray-500 block text-[10px]">القسم / الوحدة الإدارية:</span>
                <strong className="text-gray-800 font-bold">{employee?.department || '-'}</strong>
              </div>

              <div>
                <span className="text-gray-500 block text-[10px]">المسمى الوظيفي والدرجة:</span>
                <strong className="text-gray-800 font-bold">{employee?.jobTitle || '-'} (الدرجة {employee?.degree || '-'})</strong>
              </div>

              <div>
                <span className="text-gray-500 block text-[10px]">الوضع الوظيفي:</span>
                <strong className="text-gray-800 font-bold">{employee?.employmentStatus || 'مستمر على رأس العمل'} ({employee?.assignmentCategory || 'كادر معتمد'})</strong>
              </div>
            </div>
          </div>

          {/* ------------------- SECTION 2: LEAVE DETAILS ------------------- */}
          <div className="space-y-1 avoid-break relative z-10">
            <div className="flex items-center justify-between text-xs font-bold text-red-900 border-r-4 border-red-800 pr-2">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-red-700" />
                <span>ثانياً: تفاصيل الإجازة وحساب المدة والرصيد</span>
              </div>
              <span className="text-[10px] text-gray-500 font-normal">النظام الآلي لحساب الإجازات</span>
            </div>

            <div className="grid grid-cols-3 gap-2 bg-red-50/40 p-2.5 rounded-xl border border-red-100 text-xs">
              <div>
                <span className="text-gray-500 block text-[10px]">نوع الإجازة المطلوبة:</span>
                <strong className="text-red-900 font-black text-sm">{leave.leaveType}</strong>
              </div>

              <div>
                <span className="text-gray-500 block text-[10px]">تاريخ بداية الإجازة:</span>
                <strong className="text-gray-900 font-mono font-bold text-xs">{formatDateDisplay(leave.startDate)}</strong>
              </div>

              <div>
                <span className="text-gray-500 block text-[10px]">عدد الأيام المعتمدة:</span>
                <strong className="text-red-900 font-black text-base">{leave.numberOfDays} يوم</strong>
              </div>

              <div>
                <span className="text-gray-500 block text-[10px]">تاريخ نهاية الإجازة:</span>
                <strong className="text-gray-900 font-mono font-bold text-xs">{formatDateDisplay(leave.endDate)}</strong>
              </div>

              <div>
                <span className="text-gray-500 block text-[10px]">تاريخ العودة ومباشرة العمل:</span>
                <strong className="text-blue-900 font-black font-mono text-xs">
                  {leave.returnDate ? formatDateDisplay(leave.returnDate) : 'يوم العمل التالي لمباشرة الإجازة'}
                </strong>
              </div>

              <div>
                <span className="text-gray-500 block text-[10px]">طريقة الاحتساب المعتمدة:</span>
                <strong className="text-gray-800 font-bold">
                  {leave.calculationMethod === 'يدوي' ? 'يدوي (حساب استثنائي)' : 'تلقائي (استبعاد العطلات الرسمية والجمع)'}
                </strong>
              </div>

              {/* Balance Breakdown Row */}
              {showBalanceSummaryTable && (
                <>
                  <div className="bg-white/80 p-1 rounded border border-gray-200">
                    <span className="text-gray-500 block text-[9px]">الرصيد قبل الإجازة:</span>
                    <strong className="text-gray-900 font-bold">{leave.balanceBefore !== undefined ? `${leave.balanceBefore} يوم` : '-'}</strong>
                  </div>

                  <div className="bg-red-50 p-1 rounded border border-red-200">
                    <span className="text-red-700 block text-[9px] font-bold">الرصيد المتبقي بعد الإجازة:</span>
                    <strong className="text-red-900 font-black">{leave.balanceAfter !== undefined ? `${leave.balanceAfter} يوم` : '-'}</strong>
                  </div>

                  <div className="bg-white/80 p-1 rounded border border-gray-200">
                    <span className="text-gray-500 block text-[9px]">حالة الخصم من الرصيد:</span>
                    <strong className={leave.deductsFromAnnualLeave ? 'text-red-800 font-bold' : 'text-emerald-800 font-bold'}>
                      {leave.deductsFromAnnualLeave ? 'تخصم من السنوية' : 'لا تخصم (مستثناة قانوناً)'}
                    </strong>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* ------------------- SECTION 3: REPLACEMENT EMPLOYEE & CONTACT (IF ENABLED) ------------------- */}
          {(showReplacementEmployee || showContactDetails) && (
            <div className="space-y-1 avoid-break relative z-10">
              <div className="flex items-center gap-1.5 text-xs font-bold text-gray-800 border-r-4 border-gray-600 pr-2">
                <UserCheck className="w-4 h-4 text-gray-700" />
                <span>ثالثاً: الموظف البديل المكلف وبيانات التواصل أثناء الإجازة</span>
              </div>

              <div className="grid grid-cols-2 gap-2 bg-gray-50 p-2.5 rounded-xl border border-gray-200 text-xs">
                {showReplacementEmployee && (
                  <div className="space-y-1">
                    <span className="text-gray-500 block text-[10px] font-bold">الموظف المكلف بتسيير العمل أثناء الإجازة:</span>
                    <div className="flex justify-between items-center text-xs">
                      <span>الاسم: <strong className="text-gray-900 font-bold">{replacementName}</strong></span>
                      <span>توقيع البديل: ............................</span>
                    </div>
                  </div>
                )}

                {showContactDetails && (
                  <div className="space-y-1">
                    <span className="text-gray-500 block text-[10px] font-bold">مقر الإقامة ورقم الاتصال أثناء الإجازة:</span>
                    <div className="flex justify-between items-center text-xs">
                      <span>العنوان: <strong className="text-gray-900">{leaveLocation}</strong></span>
                      <span className="font-mono">هاتف الطوارئ: <strong className="text-gray-900">{emergencyPhone}</strong></span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ------------------- SECTION 4: MODIFICATION HISTORY (IF ANY) ------------------- */}
          {leave.modifications && leave.modifications.length > 0 && (
            <div className="space-y-1 avoid-break relative z-10">
              <div className="text-xs font-bold text-amber-900 border-r-4 border-amber-600 pr-2">
                سجل تمديد / قطع / تعديل الإجازة الرسمي
              </div>

              <div className="bg-amber-50/60 p-2 rounded-xl border border-amber-200 text-[11px] space-y-1">
                {leave.modifications.map((m) => (
                  <div key={m.id} className="flex justify-between items-center border-b border-amber-100 last:border-none pb-0.5">
                    <span>الإجراء: <strong className="text-amber-950 font-bold">{m.modificationType}</strong></span>
                    <span>المدة السابقة: <strong className="font-mono">{m.originalNumberOfDays}</strong> → المعدلة: <strong className="font-mono text-amber-900">{m.newNumberOfDays} يوم</strong></span>
                    <span>العودة الجديدة: <strong className="font-mono">{formatDateDisplay(m.newReturnDate)}</strong></span>
                    <span className="text-gray-500">السبب: {m.reason}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ------------------- SECTION 5: NOTES & APPLICANT ACKNOWLEDGMENT ------------------- */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 avoid-break relative z-10">
            <div className="bg-gray-50 p-2 rounded-xl border border-gray-200 text-xs">
              <span className="text-gray-500 block text-[10px] font-bold">ملاحظات إدارية:</span>
              <p className="text-gray-800 text-[11px] font-medium leading-relaxed">
                {leave.manualReason 
                  ? `سبب الحساب اليدوي: ${leave.manualReason} | ${leave.notes || 'لا توجد ملاحظات إضافية'}`
                  : leave.notes || 'الإجازة مستوفية للشروط والضوابط القانونية المعمول بها بمصرف الدم المركزي المرج.'}
              </p>
            </div>

            {showApplicantSignature && (
              <div className="bg-gray-50 p-2 rounded-xl border border-gray-200 text-xs space-y-1">
                <span className="text-gray-500 block text-[10px] font-bold">إقرار طالب الإجازة:</span>
                <p className="text-gray-700 text-[10px]">
                  أتعهد بمباشرة العمل فور انتهاء المدة المحددة، وإخطار الإدارة بأي تغيير أو طارئ.
                </p>
                <div className="flex justify-between items-center pt-1 text-[10px]">
                  <span>توقيع الموظف: ...........................</span>
                  <span>التاريخ: .... / .... / 2026 م</span>
                </div>
              </div>
            )}
          </div>

          {/* ------------------- SECTION 6: THREE OFFICIAL SIGNATURES ------------------- */}
          <div className="pt-1 avoid-break relative z-10">
            <div className="text-xs font-bold text-gray-800 mb-1.5 border-b pb-1 flex justify-between items-center">
              <span>رابعاً: الاعتمادات والتوقيعات الرسمية (ثلاث جهات اختصاص)</span>
              <span className="text-[10px] text-gray-500">وفق الهيكل التنظيمي المعتمد</span>
            </div>

            <div className="grid grid-cols-3 gap-2.5 text-center text-xs">
              {/* 1. General Manager (المدير العام) */}
              <div className="border border-red-200 rounded-xl p-2.5 space-y-2.5 bg-red-50/30 relative overflow-hidden">
                <div className="font-black text-red-900 text-xs">اعتماد المدير العام</div>
                <div className="text-gray-700 text-[11px] font-bold">الاسم: .................................</div>
                <div className="text-gray-500 text-[10px]">التوقيع: ................................</div>
                <div className="text-gray-500 text-[10px]">التاريخ: .... / .... / 2026 م</div>
                
                {/* Physical Stamp or Electronic Seal Area */}
                {showElectronicSeal ? (
                  <div className="w-24 h-16 border-2 border-red-700/60 rounded-full mx-auto flex flex-col items-center justify-center text-[8px] text-red-800 font-extrabold bg-white/90 shadow-sm rotate-[-4deg]">
                    <div className="w-2 h-2 rounded-full bg-red-700 mb-0.5"></div>
                    <span>مصرف الدم المركزي المرج</span>
                    <span className="text-[7px] text-red-600">اعتماد الإدارة العامة</span>
                  </div>
                ) : (
                  <div className="w-24 h-16 border-2 border-dashed border-red-300 rounded-lg mx-auto flex items-center justify-center text-[8px] text-red-700 font-bold bg-white/80">
                    ختم المدير العام
                  </div>
                )}
              </div>

              {/* 2. Direct Manager (الرئيس المباشر) */}
              <div className="border border-gray-200 rounded-xl p-2.5 space-y-2.5 bg-gray-50/50">
                <div className="font-extrabold text-gray-800 text-xs">موافقة الرئيس المباشر</div>
                <div className="text-gray-700 text-[11px] font-bold">الاسم: .................................</div>
                <div className="text-gray-500 text-[10px]">التوقيع: ................................</div>
                <div className="text-gray-500 text-[10px]">التاريخ: .... / .... / 2026 م</div>

                <div className="w-24 h-16 border-2 border-dashed border-gray-300 rounded-lg mx-auto flex items-center justify-center text-[8px] text-gray-500 font-bold bg-white">
                  ختم القسم / الوحدة
                </div>
              </div>

              {/* 3. HR Preparation (إعداد شؤون الموظفين) */}
              <div className="border border-gray-200 rounded-xl p-2.5 space-y-2.5 bg-gray-50/50">
                <div className="font-extrabold text-gray-800 text-xs">مراجعة شؤون الموظفين</div>
                <div className="text-gray-700 text-[11px] font-bold">الاسم: {leave.reviewerName || leave.createdBy || '.................................'}</div>
                <div className="text-gray-500 text-[10px]">التوقيع: ................................</div>
                <div className="text-gray-500 text-[10px]">التاريخ: {formatDateDisplay(leave.createdAt ? leave.createdAt.slice(0, 10) : new Date().toISOString().slice(0, 10))}</div>

                <div className="w-24 h-16 border-2 border-dashed border-gray-300 rounded-lg mx-auto flex items-center justify-center text-[8px] text-gray-500 font-bold bg-white">
                  ختم شؤون الموظفين
                </div>
              </div>
            </div>
          </div>

          {/* ------------------- LEGAL CITATION FOOTER ------------------- */}
          {showLegalCitation && (
            <div className="bg-slate-50 p-2 rounded-lg border border-slate-200 text-[10px] text-gray-600 flex items-center gap-2 avoid-break relative z-10">
              <BookOpen className="w-4 h-4 text-red-700 shrink-0" />
              <span>
                <strong>السند القانوني:</strong> تم اعتماد الإجازة وفق أحكام القانون رقم 12 لسنة 2010 بشأن علاقات العمل ولائحته التنفيذية، وضوابط الإجازات السنوية والرصيد المستحق بمصرف الدم المركزي المرج.
              </span>
            </div>
          )}

          {/* ------------------- FOOTER METADATA ------------------- */}
          <div className="pt-2 border-t border-gray-200 flex justify-between items-center text-[9px] text-gray-500 font-bold avoid-break relative z-10">
            <span>مصرف الدم المركزي المرج — مكتب الشؤون الإدارية والموظفين</span>
            <span className="font-mono">وثيقة رسمية صادرة آلياً | Ref: {leave.id}</span>
            <span>طبع بتاريخ: {new Date().toLocaleDateString('ar-LY')}</span>
          </div>

        </div>

      </div>
    </div>
  );
};


