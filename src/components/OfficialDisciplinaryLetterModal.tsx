import React, { useState, useEffect, useMemo } from 'react';
import { Employee, DisciplinaryRecord } from '../types';
import { 
  Printer, 
  X, 
  FileDown, 
  Loader2, 
  CheckCircle2, 
  Edit3, 
  Eye, 
  Save, 
  ShieldAlert, 
  AlertTriangle,
  Building2,
  Calendar,
  UserCheck,
  RotateCcw
} from 'lucide-react';
import { formatDateDisplay, getTodayDateStorage, getCurrentTimestamp } from '../utils/dateUtils';
import { exportElementToPdf } from '../utils/pdfExport';

interface OfficialDisciplinaryLetterModalProps {
  record: DisciplinaryRecord;
  employee: Employee | undefined;
  onClose: () => void;
  onSave?: (updatedRecord: DisciplinaryRecord) => void;
  currentUser?: string;
  generalManagerName?: string;
  officialLogoUrl?: string;
  initialMode?: 'preview' | 'edit';
}

/**
 * Generate formal Arabic administrative letter text based on disciplinary action type and details
 */
export function generateDefaultLetterBody(
  type: string,
  reason: string,
  description: string,
  days?: number,
  amount?: number,
  decisionNo?: string
): string {
  const normType = (type || '').trim();

  if (normType.includes('خصم')) {
    const daysText = days ? `خصم (${days}) أيام من مرتبكم الشهري` : amount ? `خصم مبلغ قدره (${amount} د.ل)` : 'توقيع عقوبة الخصم المالي من المرتب';
    return `إشارة إلى قواعد الانضباط الإداري والوظيفي المعمول بها بمصرف الدم المركزي المرج، واستناداً إلى أحكام قانون الخدمة المدنية رقم (12) لسنة 2010م ولائحته التنفيذية، وبناءً على ما ثبت من مخالفة إدارية متمثلة في:\n\n«${reason || 'الغياب غير المبرر أو التقصير في أداء الواجبات الوظيفية'}»\n${description ? `التفاصيل: ${description}\n` : ''}\nتقرر توقيع عقوبة (${daysText})، وذلك لردع التجاوزات وضمان حسن سير وانتظام العمل بالمرفق. نأمل منكم التقيد التام باللوائح والتعليمات الصادرة وعدم تكرار مثل هذه المخالفات مستقبلاً تجنباً لاتخاذ إجراءات تأديبية أشد.`;
  }

  if (normType.includes('إنذار')) {
    return `بناءً على أحكام قانون الخدمة المدنية ولائحة تنظيم العمل والدوام بمصرف الدم المركزي المرج، وحيث تبين ارتكابكم المخالفة المسلكية/الإدارية المتمثلة في:\n\n«${reason || 'الإخلال بالواجبات والتعليمات الإدارية والمهنية'}»\n${description ? `بيان المخالفة: ${description}\n` : ''}\nفإن إدارة مصرف الدم المركزي المرج توجه إليكم هذا (الإنذار الكتابي الرسمي)، ليكون تنبيهاً قاطعاً بضرورة تصحيح المسار والالتزام التام بواجباتكم ومسؤولياتكم الوظيفية. وفي حال تكرار هذا التصرف أو أي مخالفة أخرى، سيتم إحالتكم إلى لجنة التحقيق وتوقيع العقوبات المنصوص عليها قانوناً.`;
  }

  if (normType.includes('جزاء') || normType.includes('عقوبة')) {
    return `بناءً على التحقيقات الإدارية ومحاضر المتابعة ${decisionNo ? `والقرار الإداري رقم (${decisionNo})` : ''}، وحرصاً على مقتضيات المصلحة العامة والانضباط المؤسسي بمصرف الدم المركزي، وبناءً على ما نسب إليكم من إخلال بالضوابط:\n\n«${reason || 'مخالفة اللوائح وقواعد السلوك الوظيفي'}»\n${description ? `شرح الواقعة: ${description}\n` : ''}\nتقرر اعتماد وتوقيع الجزاء التأديبي الموضح أعلاه بحقكم مع إيداع نسخة من هذا الخطاب بملفكم الإداري والشخصي، مؤكدين على ضرورة تدارك هذه الملاحظات والتقيد الصارم بالمعايير المهنية المعتمدة.`;
  }

  // Default / التنبيه الإداري
  return `نلفت انتباهكم وعنايتكم الكريمة إلى ضرورة الالتزام الصارم بقواعد العمل والدوام الرسمي واللوائح المعمول بها في مصرف الدم المركزي المرج، وذلك بشأن الملاحظة الإدارية المسجلة:\n\n«${reason || 'ملاحظات الدوام والتقيد بالتعليمات الإدارية'}»\n${description ? `الملاحظات: ${description}\n` : ''}\nشاكرين لكم تعاونكم المسبق وحرصكم المستمر على الرقي بمستوى الأداء وخدمة المصلحة العامة.`;
}

/**
 * Determine dynamic official letter title
 */
export function getDynamicLetterTitle(type: string): { title: string; subtitle: string; badgeColor: string } {
  const norm = (type || '').trim();
  if (norm.includes('خصم')) {
    return {
      title: 'خطاب خصم من المرتب',
      subtitle: 'إشعار توقيع عقوبة خصم مالي رسمي',
      badgeColor: 'bg-rose-100 text-rose-900 border-rose-300'
    };
  }
  if (norm.includes('إنذار')) {
    return {
      title: 'خطاب إنذار كتابي رسمي',
      subtitle: 'إجراء انضباطي رسمي وفق قانون الخدمة المدنية',
      badgeColor: 'bg-amber-100 text-amber-900 border-amber-300'
    };
  }
  if (norm.includes('جزاء') || norm.includes('عقوبة')) {
    return {
      title: 'خطاب جزاء وعقوبة إدارية',
      subtitle: 'قرار تأديبي معتمد لحفظ النظام والانضباط الوظيفي',
      badgeColor: 'bg-red-100 text-red-900 border-red-300'
    };
  }
  return {
    title: 'خطاب تنبيه وإجراء إداري',
    subtitle: 'إشعار تنبيه ومتابعة انضباطية إدارية',
    badgeColor: 'bg-blue-100 text-blue-900 border-blue-300'
  };
}

export const OfficialDisciplinaryLetterModal: React.FC<OfficialDisciplinaryLetterModalProps> = ({
  record,
  employee,
  onClose,
  onSave,
  currentUser = 'شؤون الموظفين',
  generalManagerName = 'نجيب صالح سالم',
  officialLogoUrl,
  initialMode = 'preview'
}) => {
  const [mode, setMode] = useState<'preview' | 'edit'>(initialMode);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Form State for editing
  const [recordType, setRecordType] = useState<DisciplinaryRecord['recordType']>(
    record.recordType || (record.actionType as any) || (record.penaltyType as any) || 'إنذار كتابي'
  );
  const [letterNumber, setLetterNumber] = useState<string>(
    record.letterNumber || record.decisionNumber || `م د م / ${new Date().getFullYear()} / ${record.id?.replace(/[^0-9]/g, '') || Math.floor(Math.random() * 800 + 100)}`
  );
  const [letterDate, setLetterDate] = useState<string>(
    record.letterDate || record.effectiveDate || record.actionDate || record.decisionDate || getTodayDateStorage()
  );
  const [decisionNumber, setDecisionNumber] = useState<string>(record.decisionNumber || '');
  const [decisionDate, setDecisionDate] = useState<string>(record.decisionDate || record.effectiveDate || getTodayDateStorage());
  const [reason, setReason] = useState<string>(record.reason || '');
  const [description, setDescription] = useState<string>(record.description || record.violationDetails || '');
  const [numberOfDays, setNumberOfDays] = useState<number>(record.numberOfDays || record.deductionDays || 0);
  const [deductionAmount, setDeductionAmount] = useState<number>(record.deductionAmount || 0);
  const [issuingAuthority, setIssuingAuthority] = useState<string>(
    record.issuingAuthority || record.issuingOfficial || 'إدارة الشؤون الإدارية والخدمات'
  );
  const [notes, setNotes] = useState<string>(record.notes || '');
  
  // Custom Letter Body
  const [letterBody, setLetterBody] = useState<string>(() => {
    if (record.customLetterBody && record.customLetterBody.trim()) {
      return record.customLetterBody;
    }
    return generateDefaultLetterBody(
      record.recordType || record.actionType || 'إنذار كتابي',
      record.reason,
      record.description,
      record.numberOfDays || record.deductionDays,
      record.deductionAmount,
      record.decisionNumber
    );
  });

  // Dynamic meta
  const meta = useMemo(() => getDynamicLetterTitle(recordType || 'إنذار'), [recordType]);

  // Recalculate default template if user clicks reset text
  const handleResetTemplate = () => {
    const defaultText = generateDefaultLetterBody(
      recordType || 'إنذار',
      reason,
      description,
      numberOfDays,
      deductionAmount,
      decisionNumber
    );
    setLetterBody(defaultText);
  };

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Save changes
  const handleSave = () => {
    const updated: DisciplinaryRecord = {
      ...record,
      recordType,
      actionType: recordType,
      penaltyType: recordType,
      letterNumber: letterNumber.trim(),
      letterDate: letterDate || getTodayDateStorage(),
      letterTitle: meta.title,
      decisionNumber: decisionNumber.trim(),
      decisionDate: decisionDate || letterDate,
      effectiveDate: letterDate,
      actionDate: letterDate,
      reason: reason.trim() || 'مخالفة ضوابط العمل والدوام',
      description: description.trim(),
      violationDetails: description.trim(),
      numberOfDays: recordType === 'خصم من المرتب' ? numberOfDays : undefined,
      deductionDays: recordType === 'خصم من المرتب' ? numberOfDays : undefined,
      deductionAmount: recordType === 'خصم من المرتب' && deductionAmount > 0 ? deductionAmount : undefined,
      issuingAuthority: issuingAuthority.trim(),
      issuingOfficial: issuingAuthority.trim(),
      customLetterBody: letterBody.trim(),
      notes: notes.trim(),
      lastModifiedBy: currentUser,
      lastModifiedDate: getCurrentTimestamp()
    };

    if (onSave) {
      onSave(updated);
    }
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
    setMode('preview');
  };

  // Print via browser
  const handlePrint = () => {
    window.print();
  };

  // Export to PDF
  const handleExportPdf = async () => {
    setIsExportingPdf(true);
    setExportSuccess(false);
    try {
      const filename = `${meta.title.replace(/\s+/g, '_')}_${employee?.jobNumber?.replace('/', '_') || record.employeeId}_${letterDate || '2026'}.pdf`;
      const success = await exportElementToPdf('OFFICIAL_DISCIPLINARY_LETTER_DOC', filename, {
        orientation: 'portrait',
        margin: 6,
        scale: 2.5
      });
      if (success) {
        setExportSuccess(true);
        setTimeout(() => setExportSuccess(false), 3000);
      }
    } catch (err) {
      console.error('PDF Export Error:', err);
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto print:p-0 print:bg-white" dir="rtl">
      <div className="bg-white border border-slate-300 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[96vh] flex flex-col overflow-hidden print:border-none print:shadow-none print:max-w-none print:max-h-none">
        
        {/* Top Control Bar (Hidden when printing) */}
        <div className="p-3 sm:p-4 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-3 shrink-0 print:hidden border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-red-950 text-red-400 border border-red-800">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-black text-white">
                  {meta.title} — {employee?.fullName || `الموظف ${record.employeeId}`}
                </h3>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${meta.badgeColor}`}>
                  {recordType}
                </span>
              </div>
              <p className="text-[11px] text-slate-300 mt-0.5">
                وثيقة رسمية معتمدة قابلة للطباعة والتصدير بدقة عالية على ورق A4
              </p>
            </div>
          </div>

          <div className="flex items-center flex-wrap gap-2">
            {/* Mode Switch: Preview vs Edit */}
            {mode === 'preview' ? (
              <button
                type="button"
                onClick={() => setMode('edit')}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                <span>تعديل الخطاب</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setMode('preview')}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5 text-blue-400" />
                <span>معاينة الخطاب</span>
              </button>
            )}

            {/* Save Button */}
            <button
              type="button"
              onClick={handleSave}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-sm ${
                saveSuccess
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-700 hover:bg-slate-600 text-white border border-slate-600'
              }`}
            >
              {saveSuccess ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5 text-emerald-400" />}
              <span>{saveSuccess ? 'تم الحفظ بنجاح' : 'حفظ التعديلات'}</span>
            </button>

            {/* Export PDF */}
            <button
              type="button"
              onClick={handleExportPdf}
              disabled={isExportingPdf}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-sm ${
                exportSuccess
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
              }`}
            >
              {isExportingPdf ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-red-400" />
              ) : exportSuccess ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-white" />
              ) : (
                <FileDown className="w-3.5 h-3.5 text-emerald-400" />
              )}
              <span>{isExportingPdf ? 'جار التصدير...' : exportSuccess ? 'تم التصدير' : 'حفظ PDF'}</span>
            </button>

            {/* Print Button */}
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-1.5 bg-red-700 hover:bg-red-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-sm cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة خطاب</span>
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-xl transition cursor-pointer"
              title="إغلاق"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body Container */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-6 bg-slate-100/60 print:p-0 print:bg-white flex flex-col items-center">
          
          {/* Edit Controls Panel (visible only in Edit mode) */}
          {mode === 'edit' && (
            <div className="w-full max-w-3xl mb-4 bg-amber-50/80 border border-amber-200 rounded-xl p-4 text-xs space-y-3 print:hidden animate-fadeIn">
              <div className="flex items-center justify-between border-b border-amber-200 pb-2">
                <span className="font-black text-amber-950 flex items-center gap-1.5">
                  <Edit3 className="w-4 h-4 text-amber-700" />
                  <span>تعديل وتخصيص بيانات ونصوص الخطاب الرسمي</span>
                </span>
                <button
                  type="button"
                  onClick={handleResetTemplate}
                  className="px-2.5 py-1 bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg text-[11px] font-bold flex items-center gap-1 transition cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3 text-amber-700" />
                  <span>إعادة توليد الصيغة الافتراضية</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">نوع الإجراء</label>
                  <select
                    value={recordType}
                    onChange={(e) => setRecordType(e.target.value as any)}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg font-bold text-xs focus:ring-2 focus:ring-red-600 outline-none"
                  >
                    <option value="تنبيه">تنبيه إداري</option>
                    <option value="إنذار كتابي">إنذار كتابي رسمي</option>
                    <option value="خصم من المرتب">خصم من المرتب</option>
                    <option value="عقوبة إدارية">جزاء / عقوبة إدارية</option>
                    <option value="أخرى">إجراء إداري آخر</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">رقم الخطاب / الكتاب</label>
                  <input
                    type="text"
                    value={letterNumber}
                    onChange={(e) => setLetterNumber(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-red-600 outline-none font-mono"
                    placeholder="م د م / 2026 / 140"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">تاريخ الخطاب</label>
                  <input
                    type="date"
                    value={letterDate}
                    onChange={(e) => setLetterDate(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-red-600 outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">رقم القرار / المذكرة (إن وجد)</label>
                  <input
                    type="text"
                    value={decisionNumber}
                    onChange={(e) => setDecisionNumber(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-red-600 outline-none"
                    placeholder="قرار رقم 12 لسنة 2026"
                  />
                </div>

                {recordType === 'خصم من المرتب' && (
                  <>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">عدد أيام الخصم</label>
                      <input
                        type="number"
                        min={0}
                        max={60}
                        value={numberOfDays}
                        onChange={(e) => setNumberOfDays(Number(e.target.value))}
                        className="w-full p-2 bg-white border border-slate-300 rounded-lg font-bold text-xs focus:ring-2 focus:ring-red-600 outline-none font-mono"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">قيمة الخصم المالي (د.ل)</label>
                      <input
                        type="number"
                        min={0}
                        step={5}
                        value={deductionAmount}
                        onChange={(e) => setDeductionAmount(Number(e.target.value))}
                        className="w-full p-2 bg-white border border-slate-300 rounded-lg font-bold text-xs focus:ring-2 focus:ring-red-600 outline-none font-mono"
                      />
                    </div>
                  </>
                )}

                <div>
                  <label className="block font-bold text-slate-700 mb-1">الجهة / المسؤول المصدر</label>
                  <input
                    type="text"
                    value={issuingAuthority}
                    onChange={(e) => setIssuingAuthority(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-red-600 outline-none"
                    placeholder="إدارة الشؤون الإدارية والمالية"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">سبب الجزاء / المخالفة</label>
                <input
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-red-600 outline-none"
                  placeholder="سبب توجيه الخطاب"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">نص صلب الخطاب الرسمي (قابل للتعديل بحرية)</label>
                <textarea
                  rows={4}
                  value={letterBody}
                  onChange={(e) => setLetterBody(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-red-600 outline-none leading-relaxed"
                  placeholder="أدخل صيغة الخطاب المعتمدة..."
                />
              </div>
            </div>
          )}

          {/* OFFICIAL A4 PRINTABLE DOCUMENT CANVAS */}
          <div 
            id="OFFICIAL_DISCIPLINARY_LETTER_DOC"
            className="w-full max-w-[210mm] min-h-[285mm] bg-white border border-slate-300 shadow-md p-8 sm:p-10 flex flex-col justify-between text-slate-900 font-sans print:border-none print:shadow-none print:p-6 print:m-0 print:w-full print:max-w-none print:min-h-0"
          >
            {/* 1. OFFICIAL HEADER */}
            <div>
              <div className="border-b-2 border-red-900 pb-4 mb-4 select-none">
                <div className="flex justify-between items-center text-xs font-black text-slate-800">
                  {/* Right: State & Organization */}
                  <div className="text-right space-y-1">
                    <p className="text-sm font-black text-slate-950">دولة ليبيا</p>
                    <p className="text-xs font-bold text-slate-700">وزارة الصحة</p>
                    <p className="text-xs font-bold text-red-950">مصرف الدم المركزي المرج</p>
                    <p className="text-[10px] text-slate-500 font-medium">الشؤون الإدارية والخدمات / شؤون الموظفين</p>
                  </div>

                  {/* Center: Official Logo & Identity */}
                  <div className="text-center">
                    {officialLogoUrl ? (
                      <img
                        src={officialLogoUrl}
                        alt="شعار مصرف الدم المركزي"
                        className="w-16 h-16 object-contain mx-auto mb-1"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full border-2 border-red-900 bg-red-50 flex flex-col items-center justify-center mx-auto mb-1 shadow-inner">
                        <span className="text-[10px] font-black text-red-950 leading-none">مصرف الدم</span>
                        <span className="text-[9px] font-bold text-red-700 leading-none mt-0.5">المرج</span>
                      </div>
                    )}
                    <span className="text-[10px] font-bold tracking-wider text-slate-600 block">
                      CENTRAL BLOOD BANK - AL MARJ
                    </span>
                  </div>

                  {/* Left: Document Metadata */}
                  <div className="text-left font-mono text-xs space-y-1.5">
                    <div className="flex items-center justify-end gap-1.5">
                      <span className="font-bold text-slate-900">{letterNumber || '—'}</span>
                      <span className="text-slate-500 font-sans">:الرقم الإشاري</span>
                    </div>
                    <div className="flex items-center justify-end gap-1.5">
                      <span className="font-bold text-slate-900">{formatDateDisplay(letterDate)}</span>
                      <span className="text-slate-500 font-sans">:التاريخ</span>
                    </div>
                    <div className="flex items-center justify-end gap-1.5 text-[11px]">
                      <span className="font-bold text-slate-700">سري وشخصي</span>
                      <span className="text-slate-500 font-sans">:درجة السرية</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. DYNAMIC TITLE BANNER */}
              <div className="text-center my-4">
                <div className="inline-block border-y-2 border-red-900 py-1 px-8">
                  <h1 className="text-xl sm:text-2xl font-black text-red-950 tracking-wide">
                    {meta.title}
                  </h1>
                </div>
                <p className="text-[11px] text-slate-600 font-bold mt-1">
                  {meta.subtitle} {decisionNumber ? `— استناداً إلى القرار (${decisionNumber})` : ''}
                </p>
              </div>

              {/* 3. AUTO-POPULATED EMPLOYEE INFORMATION */}
              <div className="mb-4 bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs">
                <h4 className="font-black text-slate-900 border-b border-slate-200 pb-1.5 mb-2.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4 text-red-800" />
                    <span>بيانات الموظف المعني بالإجراء</span>
                  </span>
                  <span className="text-[11px] text-slate-500 font-mono font-normal">
                    رقم الملف: {employee?.jobNumber || record.employeeId}
                  </span>
                </h4>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-y-2.5 gap-x-4">
                  <div>
                    <span className="block text-[10px] text-slate-500 font-bold">اسم الموظف الرباعي</span>
                    <span className="font-black text-slate-900 text-xs">{employee?.fullName || '—'}</span>
                  </div>

                  <div>
                    <span className="block text-[10px] text-slate-500 font-bold">الرقم الوطني / الوثيقة</span>
                    <span className="font-mono font-bold text-slate-800 text-xs">
                      {employee?.nationalId || employee?.passportNumber || '—'}
                    </span>
                  </div>

                  <div>
                    <span className="block text-[10px] text-slate-500 font-bold">القسم / الإدارة</span>
                    <span className="font-bold text-slate-800 text-xs">{employee?.department || '—'}</span>
                  </div>

                  <div>
                    <span className="block text-[10px] text-slate-500 font-bold">المسمى الوظيفي</span>
                    <span className="font-bold text-slate-800 text-xs">{employee?.jobTitle || '—'}</span>
                  </div>

                  <div>
                    <span className="block text-[10px] text-slate-500 font-bold">الدرجة الحالية والترقية</span>
                    <span className="font-bold text-slate-900 text-xs">
                      {employee?.jobGrade || '—'} {employee?.currentIncrement ? `(علاوة ${employee.currentIncrement})` : ''}
                    </span>
                  </div>

                  <div>
                    <span className="block text-[10px] text-slate-500 font-bold">تاريخ التعيين العام</span>
                    <span className="font-mono text-slate-800 text-xs">
                      {formatDateDisplay(employee?.hireDate)}
                    </span>
                  </div>

                  <div>
                    <span className="block text-[10px] text-slate-500 font-bold">المباشرة بمصرف الدم</span>
                    <span className="font-mono text-slate-800 text-xs">
                      {formatDateDisplay(employee?.bloodBankStartDate || employee?.directingDate || employee?.hireDate)}
                    </span>
                  </div>

                  <div>
                    <span className="block text-[10px] text-slate-500 font-bold">الوضع الوظيفي</span>
                    <span className="font-bold text-slate-800 text-xs">{employee?.status || 'على رأس العمل'}</span>
                  </div>
                </div>
              </div>

              {/* 4. DISCIPLINARY / PENALTY DETAILS TABLE */}
              <div className="mb-4 overflow-hidden border border-slate-300 rounded-xl text-xs">
                <table className="w-full text-right border-collapse">
                  <thead className="bg-slate-100 font-black text-slate-800 border-b border-slate-300">
                    <tr>
                      <th className="p-2 border-l border-slate-300 w-1/4">نوع الإجراء الوظيفي</th>
                      <th className="p-2 border-l border-slate-300 w-1/4">تاريخ السريان / النفاذ</th>
                      <th className="p-2 border-l border-slate-300 w-1/4">القرار / المذكرة</th>
                      <th className="p-2 w-1/4">العقوبة / الخصم المالي</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    <tr className="bg-white">
                      <td className="p-2 border-l border-slate-200 font-bold text-red-950">
                        {recordType}
                      </td>
                      <td className="p-2 border-l border-slate-200 font-mono font-bold text-slate-800">
                        {formatDateDisplay(letterDate)}
                      </td>
                      <td className="p-2 border-l border-slate-200 text-slate-700">
                        {decisionNumber || 'مذكرة شؤون إدارية'} {decisionDate ? `(${formatDateDisplay(decisionDate)})` : ''}
                      </td>
                      <td className="p-2 font-mono font-black text-red-900">
                        {numberOfDays > 0 ? `${numberOfDays} يوم خصم` : deductionAmount > 0 ? `${deductionAmount} د.ل` : 'عقوبة إدارية معتمدة'}
                      </td>
                    </tr>
                    <tr className="bg-slate-50/50">
                      <td className="p-2 border-l border-slate-200 font-bold text-slate-700">
                        سبب الجزاء / المخالفة
                      </td>
                      <td colSpan={3} className="p-2 font-bold text-slate-900">
                        {reason || 'مخالفة ضوابط الدوام وحسن سير العمل'}
                      </td>
                    </tr>
                    {description && (
                      <tr className="bg-white">
                        <td className="p-2 border-l border-slate-200 font-bold text-slate-700">
                          وصف الواقعة والتفاصيل
                        </td>
                        <td colSpan={3} className="p-2 text-slate-800">
                          {description}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* 5. FORMAL LETTER BODY */}
              <div className="mb-6 bg-white border-r-4 border-red-900 p-4 pl-2 text-xs sm:text-sm text-slate-900 leading-relaxed space-y-2 whitespace-pre-line text-justify">
                <p className="font-bold text-slate-950 mb-1">
                  إلى الأخ الموظف: {employee?.fullName || 'المحترم'} ({employee?.jobTitle || 'الموظف بمصرف الدم'})
                </p>
                <p className="font-semibold text-slate-700">
                  السلام عليكم ورحمة الله وبركاته،، وبعد:
                </p>
                <div className="text-slate-900 pr-2">
                  {letterBody}
                </div>
                <p className="font-bold text-slate-950 text-center pt-2">
                  «والسلام عليكم ورحمة الله وبركاته»
                </p>
              </div>
            </div>

            {/* 6. SIGNATURES AND STAMP SECTION */}
            <div className="border-t-2 border-slate-300 pt-4 mt-auto">
              <div className="grid grid-cols-4 gap-2 text-center text-xs font-bold text-slate-800">
                {/* 1. HR Preparation */}
                <div className="border border-slate-200 rounded-lg p-2 bg-slate-50/60 flex flex-col justify-between min-h-[95px]">
                  <p className="text-[11px] font-black text-slate-950">إعداد شؤون الموظفين</p>
                  <div className="text-[10px] text-slate-600 text-right space-y-1 mt-1">
                    <p>الاسم: {currentUser}</p>
                    <p>التوقيع: .....................</p>
                    <p className="font-mono">التاريخ: {formatDateDisplay(letterDate)}</p>
                  </div>
                </div>

                {/* 2. Direct Supervisor */}
                <div className="border border-slate-200 rounded-lg p-2 bg-slate-50/60 flex flex-col justify-between min-h-[95px]">
                  <p className="text-[11px] font-black text-slate-950">الرئيس المباشر / القسم</p>
                  <div className="text-[10px] text-slate-600 text-right space-y-1 mt-1">
                    <p>الاسم: .....................</p>
                    <p>التوقيع: .....................</p>
                    <p>التاريخ: .....................</p>
                  </div>
                </div>

                {/* 3. General Manager */}
                <div className="border border-slate-200 rounded-lg p-2 bg-slate-50/60 flex flex-col justify-between min-h-[95px]">
                  <p className="text-[11px] font-black text-red-950">يعتمد / المدير العام</p>
                  <div className="text-[10px] text-slate-800 text-right space-y-1 mt-1">
                    <p className="font-bold">{generalManagerName}</p>
                    <p>التوقيع: .....................</p>
                    <p className="font-mono">التاريخ: {formatDateDisplay(letterDate)}</p>
                  </div>
                </div>

                {/* 4. Official Stamp Area */}
                <div className="border-2 border-dashed border-red-800/40 rounded-lg p-2 bg-red-50/30 flex flex-col items-center justify-center min-h-[95px] text-center">
                  <span className="text-[10px] font-black text-red-900">مكان الختم الرسمي</span>
                  <span className="text-[8px] text-slate-400 mt-1 block">مصرف الدم المركزي المرج</span>
                </div>
              </div>

              {/* Document Audit Footer */}
              <div className="mt-3 pt-2 border-t border-slate-100 flex justify-between items-center text-[9px] text-slate-500 font-mono">
                <span>تم الإنشاء: {record.createdAt || getCurrentTimestamp()} بواسطة ({record.createdBy || currentUser})</span>
                {record.lastModifiedDate && (
                  <span>آخر تعديل: {record.lastModifiedDate} بواسطة ({record.lastModifiedBy || currentUser})</span>
                )}
                <span>كود التحقق: {record.id || 'DOC-VERIFIED'}</span>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
