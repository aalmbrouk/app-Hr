import React, { useState, useEffect } from 'react';
import { 
  AnnualPerformanceEvaluation, 
  Employee, 
  PerformanceEvaluationStatus, 
  EvaluationMode,
  CareerPromotionRecord,
  PromotionRecord,
  IncrementRecord,
  StatusSettlementRecord
} from '../../types';
import { 
  Printer, 
  X, 
  Save, 
  FileDown, 
  Eye, 
  Edit3, 
  CheckCircle2, 
  Loader2, 
  AlertCircle, 
  Paperclip, 
  Upload, 
  Trash2, 
  Award,
  Building2,
  ExternalLink
} from 'lucide-react';
import { exportElementToPdf } from '../../utils/pdfExport';
import { AnnualEvaluationPrintDocument } from './AnnualEvaluationPrintDocument';
import { 
  EVALUATION_CATEGORIES, 
  ALL_EVALUATION_ITEMS, 
  calculateRatingFromScore, 
  getEvaluationPeriodText,
  getEmployeeInfoForEvaluationYear 
} from '../../utils/evaluationUtils';
import { openPrintableEvaluationWindow } from '../../utils/printEvaluationHelper';

interface OfficialPerformanceEvaluationModalProps {
  isOpen: boolean;
  onClose: () => void;
  evaluation: AnnualPerformanceEvaluation;
  employee: Employee;
  allEmployees?: Employee[];
  careerRecords?: CareerPromotionRecord[];
  promotions?: PromotionRecord[];
  increments?: IncrementRecord[];
  settlements?: StatusSettlementRecord[];
  onSave: (updatedEvaluation: AnnualPerformanceEvaluation) => void;
  officialLogoUrl?: string;
  generalManagerName?: string;
  currentUser?: string;
}

export const OfficialPerformanceEvaluationModal: React.FC<OfficialPerformanceEvaluationModalProps> = ({
  isOpen,
  onClose,
  evaluation: initialEvaluation,
  employee,
  allEmployees = [],
  careerRecords = [],
  promotions = [],
  increments = [],
  settlements = [],
  onSave,
  officialLogoUrl = '/logo.jpg',
  generalManagerName = 'نجيب صالح بوحسن',
  currentUser = 'شؤون الموظفين'
}) => {
  const [formData, setFormData] = useState<AnnualPerformanceEvaluation>({ ...initialEvaluation });
  const [activeView, setActiveView] = useState<'preview' | 'edit' | 'archive'>('preview');
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [pdfSuccess, setPdfSuccess] = useState(false);
  const [printError, setPrintError] = useState<string | null>(null);
  const [uploadFeedback, setUploadFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const year = initialEvaluation.evaluationYear || new Date().getFullYear();
      const historical = getEmployeeInfoForEvaluationYear(
        employee,
        year,
        careerRecords,
        promotions,
        increments,
        settlements
      );
      setFormData({ 
        ...initialEvaluation,
        currentGrade: initialEvaluation.currentGrade || historical.currentGrade,
        gradeDate: initialEvaluation.gradeDate || historical.gradeDate,
        higherSupervisorName: initialEvaluation.higherSupervisorName || generalManagerName || 'نجيب صالح بوحسن'
      });
      setSaveSuccess(false);
      setPdfSuccess(false);
      setPrintError(null);
    }
  }, [isOpen, initialEvaluation, generalManagerName, employee, careerRecords, promotions, increments, settlements]);

  // Handle escape key to close modal smoothly
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!isOpen) return null;

  // Handle evaluation year change & historical recalculation
  const handleYearChange = (newYear: number) => {
    const historical = getEmployeeInfoForEvaluationYear(
      employee,
      newYear,
      careerRecords,
      promotions,
      increments,
      settlements
    );

    setFormData(prev => ({
      ...prev,
      evaluationYear: newYear,
      periodStart: `01/01/${newYear}`,
      periodEnd: `31/12/${newYear}`,
      periodText: getEvaluationPeriodText(newYear),
      birthDateAndPlace: historical.birthDateAndPlace,
      hireDate: historical.hireDate,
      qualification: historical.qualification,
      qualificationDate: historical.qualificationDate,
      currentJobTitle: historical.currentJobTitle,
      currentGrade: historical.currentGrade,
      gradeDate: historical.gradeDate,
      workplace: historical.workplace,
      nationality: historical.nationality,
      sector: historical.sector
    }));
  };

  // Score change in electronic mode
  const handleScoreChange = (itemId: string, val: string, notes?: string) => {
    const updatedScores = {
      ...formData.scores,
      [itemId]: {
        score: val,
        notes: notes !== undefined ? notes : formData.scores?.[itemId]?.notes || ''
      }
    };

    // Calculate total score if in electronic mode
    let sum = 0;
    let hasAnyScore = false;
    ALL_EVALUATION_ITEMS.forEach(it => {
      const s = updatedScores[it.id]?.score;
      if (s !== undefined && s !== '' && !isNaN(Number(s))) {
        sum += Number(s);
        hasAnyScore = true;
      }
    });

    const totalVal = hasAnyScore ? Math.min(100, Math.round(sum)) : '';
    const rating = hasAnyScore ? calculateRatingFromScore(totalVal) : '';

    setFormData(prev => ({
      ...prev,
      scores: updatedScores,
      totalScore: totalVal,
      performanceScore: totalVal,
      performanceRating: rating
    }));
  };

  // Save handler
  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const updated = {
      ...formData,
      updatedBy: currentUser,
      updatedAt: new Date().toISOString()
    };
    onSave(updated);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  // Direct Print handler
  const handlePrint = () => {
    setPrintError(null);
    try {
      window.print();
    } catch (err) {
      console.error('Window print error:', err);
      setPrintError('تعذر فتح نافذة الطباعة. يرجى المحاولة مرة أخرى أو استخدام زر "فتح نسخة للطباعة".');
    }
  };

  // Fallback print window handler
  const handleOpenPrintWindow = () => {
    const success = openPrintableEvaluationWindow(
      formData,
      officialLogoUrl,
      formData.higherSupervisorName || generalManagerName || 'نجيب صالح بوحسن'
    );
    if (!success) {
      // If popup blocker intervened, attempt direct print
      window.print();
    }
  };

  // PDF Export
  const handleExportPdf = async () => {
    setIsExportingPdf(true);
    setPdfSuccess(false);
    try {
      const fileName = `تقرير_كفاءة_${formData.employeeName.replace(/\s+/g, '_')}_${formData.evaluationYear}.pdf`;
      const success = await exportElementToPdf(`PRINT_EVALUATION_${formData.id}`, fileName, {
        orientation: 'portrait',
        margin: 4,
        scale: 2.5
      });
      if (success) {
        setPdfSuccess(true);
        setTimeout(() => setPdfSuccess(false), 3000);
      }
    } catch (err) {
      console.error('PDF export error:', err);
    } finally {
      setIsExportingPdf(false);
    }
  };

  // Scanned Document File Upload
  const handleScanUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setFormData(prev => ({
        ...prev,
        attachedDocPath: base64,
        attachedDocFileName: file.name,
        attachedDocDate: new Date().toISOString().slice(0, 10),
        status: prev.status === 'مسودة' ? 'مكتمل' : prev.status
      }));
      setUploadFeedback(`تم إرفاق المستند بنجاح: ${file.name}`);
      setTimeout(() => setUploadFeedback(null), 4000);
    };
    reader.onerror = () => {
      alert('حدث خطأ أثناء قراءة المستند.');
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveScan = () => {
    if (window.confirm('هل أنت متأكد من رغبتك في حذف النسخة الممسوحة ضوئياً؟')) {
      setFormData(prev => ({
        ...prev,
        attachedDocPath: undefined,
        attachedDocFileName: undefined,
        attachedDocDate: undefined
      }));
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 text-right" dir="rtl">
      {/* Container Dialog */}
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-5xl max-h-[96vh] flex flex-col shadow-2xl overflow-hidden text-slate-100 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Top Header Bar */}
        <div className="bg-slate-950 border-b border-slate-800 p-3.5 sm:p-4 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white">
                  تقرير كفاءة الموظف السنوي
                </h2>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                  {formData.evaluationYear}
                </span>
                <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                  formData.status === 'معتمد'
                    ? 'bg-emerald-950 text-emerald-300 border-emerald-700'
                    : formData.status === 'مكتمل'
                    ? 'bg-blue-950 text-blue-300 border-blue-700'
                    : formData.status === 'جاهز للطباعة'
                    ? 'bg-amber-950 text-amber-300 border-amber-700'
                    : 'bg-slate-800 text-slate-300 border-slate-700'
                }`}>
                  {formData.status}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                الموظف: <strong className="text-white">{formData.employeeName}</strong> | رقم الملف: <span className="font-mono text-amber-300 font-bold">{formData.fileNumber}</span>
              </p>
            </div>
          </div>

          {/* Navigation Sub-Tabs & Close */}
          <div className="flex items-center gap-2">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-1 flex items-center gap-1 text-xs">
              <button
                type="button"
                onClick={() => setActiveView('preview')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                  activeView === 'preview'
                    ? 'bg-amber-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>معاينة (A4)</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveView('edit')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                  activeView === 'edit'
                    ? 'bg-amber-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>البيانات والتقييم</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveView('archive')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                  activeView === 'archive'
                    ? 'bg-amber-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Paperclip className="w-3.5 h-3.5" />
                <span>الوثيقة الممسوحة</span>
                {formData.attachedDocPath && (
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                )}
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
              title="إغلاق"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Feedback Notices */}
        {printError && (
          <div className="bg-red-950 border-b border-red-800 p-2.5 text-xs text-red-200 flex items-center justify-between gap-2 font-bold animate-in fade-in">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{printError}</span>
            </div>
            <button
              type="button"
              onClick={handleOpenPrintWindow}
              className="px-3 py-1 bg-red-800 hover:bg-red-700 text-white rounded-lg text-[11px] font-bold"
            >
              فتح نسخة للطباعة الآن
            </button>
          </div>
        )}

        {saveSuccess && (
          <div className="bg-emerald-950 border-b border-emerald-800 p-2.5 text-xs text-emerald-300 flex items-center justify-center gap-2 font-bold animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>تم حفظ تقرير الكفاءة السنوي بنجاح في السجل التاريخي للموظف.</span>
          </div>
        )}
        {pdfSuccess && (
          <div className="bg-sky-950 border-b border-sky-800 p-2.5 text-xs text-sky-300 flex items-center justify-center gap-2 font-bold animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-sky-400" />
            <span>تم تصدير ملف PDF الرسمي بنجاح.</span>
          </div>
        )}

        {/* Modal Body Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          
          {/* VIEW 1: A4 DOCUMENT PREVIEW */}
          {activeView === 'preview' && (
            <div className="space-y-4">
              {/* Toolbar */}
              <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <label className="text-slate-400 font-bold">سنة التقييم:</label>
                    <select
                      value={formData.evaluationYear}
                      onChange={(e) => handleYearChange(Number(e.target.value))}
                      className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-white font-mono font-bold focus:outline-none focus:border-amber-500"
                    >
                      {Array.from({ length: 15 }, (_, i) => 2030 - i).map(yr => (
                        <option key={yr} value={yr}>{yr}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <label className="text-slate-400 font-bold">نمط التقييم:</label>
                    <select
                      value={formData.mode}
                      onChange={(e) => setFormData(prev => ({ ...prev, mode: e.target.value as EvaluationMode }))}
                      className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-amber-300 font-bold focus:outline-none focus:border-amber-500"
                    >
                      <option value="يدوي">تقييم يدوي (حقول فارغة للكتابة باليد)</option>
                      <option value="إلكتروني">تقييم إلكتروني (معبأ درجات وملاحظات)</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <label className="text-slate-400 font-bold">حالة التقرير:</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as PerformanceEvaluationStatus }))}
                      className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-white font-bold focus:outline-none focus:border-amber-500"
                    >
                      <option value="مسودة">مسودة</option>
                      <option value="جاهز للطباعة">جاهز للطباعة</option>
                      <option value="مكتمل">مكتمل</option>
                      <option value="معتمد">معتمد</option>
                    </select>
                  </div>
                </div>

                <div className="text-[11px] text-slate-400 flex items-center gap-2">
                  <span>المقاس: </span>
                  <strong className="text-emerald-400 font-bold">صفحة A4 واحدة رأسية (Portrait)</strong>
                </div>
              </div>

              {/* A4 Document Preview Canvas */}
              <div className="bg-slate-950 p-4 sm:p-6 rounded-2xl border border-slate-800 flex justify-center shadow-inner overflow-x-auto">
                <div className="shadow-2xl border border-slate-300 bg-white rounded-xs">
                  <AnnualEvaluationPrintDocument
                    evaluation={formData}
                    officialLogoUrl={officialLogoUrl}
                    idPrefix="PRINT_EVALUATION"
                    generalManagerName={formData.higherSupervisorName || generalManagerName || 'نجيب صالح بوحسن'}
                  />
                </div>
              </div>
            </div>
          )}

          {/* VIEW 2: EDITING FORM (FOR ELECTRONIC / CUSTOMIZING SNAPSHOT) */}
          {activeView === 'edit' && (
            <div className="space-y-5 text-xs">
              {/* General snapshot info */}
              <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-3">
                <h3 className="text-sm font-black text-amber-400 flex items-center gap-2 border-b border-slate-800 pb-2">
                  <Building2 className="w-4 h-4" />
                  <span>القسم الأول: معلومات عامة (الموظف والسجل التاريخي للتقييم)</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-400 font-bold mb-1">سنة التقييم</label>
                    <select
                      value={formData.evaluationYear}
                      onChange={(e) => handleYearChange(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono font-bold"
                    >
                      {Array.from({ length: 15 }, (_, i) => 2030 - i).map(yr => (
                        <option key={yr} value={yr}>{yr}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-slate-400 font-bold">الدرجة الوظيفية (لسنة {formData.evaluationYear})</label>
                      {formData.currentGrade === 'تحتاج إلى مراجعة' && (
                        <span className="text-[10px] bg-red-900/60 text-red-300 border border-red-700 px-1.5 py-0.5 rounded font-bold">
                          تحتاج إلى مراجعة
                        </span>
                      )}
                    </div>
                    <input
                      type="text"
                      value={formData.currentGrade}
                      onChange={(e) => setFormData(prev => ({ ...prev, currentGrade: e.target.value }))}
                      className={`w-full bg-slate-900 border ${formData.currentGrade === 'تحتاج إلى مراجعة' ? 'border-red-600 text-red-400 font-bold' : 'border-slate-700 text-white'} rounded-lg px-3 py-2`}
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 font-bold mb-1">تاريخ نيل الدرجة الحالية</label>
                    <input
                      type="date"
                      value={formData.gradeDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, gradeDate: e.target.value }))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white"
                    />
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      تاريخ نفاذ الدرجة الفعالة لسنة {formData.evaluationYear}
                    </span>
                  </div>

                  <div>
                    <label className="block text-slate-400 font-bold mb-1">المؤهل العلمي</label>
                    <input
                      type="text"
                      value={formData.qualification}
                      onChange={(e) => setFormData(prev => ({ ...prev, qualification: e.target.value }))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 font-bold mb-1">تاريخ الحصول عليه</label>
                    <input
                      type="text"
                      value={formData.qualificationDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, qualificationDate: e.target.value }))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 font-bold mb-1">الوظيفة الحالية</label>
                    <input
                      type="text"
                      value={formData.currentJobTitle}
                      onChange={(e) => setFormData(prev => ({ ...prev, currentJobTitle: e.target.value }))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 font-bold mb-1">مكان العمل الحالي</label>
                    <input
                      type="text"
                      value={formData.workplace}
                      onChange={(e) => setFormData(prev => ({ ...prev, workplace: e.target.value }))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 font-bold mb-1">الجنسية</label>
                    <input
                      type="text"
                      value={formData.nationality}
                      onChange={(e) => setFormData(prev => ({ ...prev, nationality: e.target.value }))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 font-bold mb-1">القطاع</label>
                    <input
                      type="text"
                      value={formData.sector}
                      onChange={(e) => setFormData(prev => ({ ...prev, sector: e.target.value }))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Mode Selection */}
              <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-white mb-0.5">نمط تعبئة التقرير</h4>
                  <p className="text-slate-400 text-xs">
                    اختر التقييم اليدوي لطباعة النموذج فارغاً وتعبئته باليد، أو التقييم الإلكتروني لحفظ الدرجات بالنظام
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, mode: 'يدوي' }))}
                    className={`px-3 py-1.5 rounded-lg font-bold border transition-all ${
                      formData.mode === 'يدوي'
                        ? 'bg-amber-600 border-amber-500 text-white'
                        : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
                    }`}
                  >
                    تقييم يدوي (ورقي)
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, mode: 'إلكتروني' }))}
                    className={`px-3 py-1.5 rounded-lg font-bold border transition-all ${
                      formData.mode === 'إلكتروني'
                        ? 'bg-amber-600 border-amber-500 text-white'
                        : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
                    }`}
                  >
                    تقييم إلكتروني (رقمي)
                  </button>
                </div>
              </div>

              {/* Electronic scores form (if in electronic mode) */}
              {formData.mode === 'إلكتروني' && (
                <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-4">
                  <h3 className="text-sm font-black text-amber-400 flex items-center gap-2 border-b border-slate-800 pb-2">
                    <Award className="w-4 h-4" />
                    <span>القسم الثاني: عناصر التقييم ودرجات الكفاءة (إلكتروني)</span>
                  </h3>

                  <div className="space-y-4">
                    {EVALUATION_CATEGORIES.map(cat => (
                      <div key={cat.id} className="border border-slate-800 rounded-xl p-3 bg-slate-900/50 space-y-2">
                        <div className="flex justify-between items-center font-bold text-white text-xs border-b border-slate-800 pb-1.5">
                          <span>{cat.title}</span>
                          <span className="text-amber-400 font-mono">النسبة: {cat.weight}%</span>
                        </div>

                        <div className="grid grid-cols-1 gap-2 pt-1">
                          {cat.items.map(item => (
                            <div key={item.id} className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center bg-slate-900 p-2 rounded-lg border border-slate-800/80">
                              <div className="sm:col-span-6 font-medium text-slate-200 text-xs">
                                {item.name}
                                <span className="text-[10px] text-slate-400 mr-2">({item.weight}%)</span>
                              </div>
                              <div className="sm:col-span-2">
                                <input
                                  type="number"
                                  min="0"
                                  max={item.weight}
                                  placeholder={`درجة من ${item.weight}`}
                                  value={formData.scores?.[item.id]?.score ?? ''}
                                  onChange={(e) => handleScoreChange(item.id, e.target.value)}
                                  className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1 text-center font-mono font-bold text-amber-300"
                                />
                              </div>
                              <div className="sm:col-span-4">
                                <input
                                  type="text"
                                  placeholder="ملاحظات أو مبررات..."
                                  value={formData.scores?.[item.id]?.notes ?? ''}
                                  onChange={(e) => handleScoreChange(item.id, String(formData.scores?.[item.id]?.score || ''), e.target.value)}
                                  className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1 text-slate-300 text-[11px]"
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Summary & Rating Card */}
                  <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
                    <div>
                      <span className="text-slate-400 block text-[11px]">المجموع الكلي:</span>
                      <span className="text-lg font-black font-mono text-amber-400">
                        {formData.totalScore !== '' ? `${formData.totalScore} / 100` : '—'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">التقدير العام:</span>
                      <span className="text-sm font-black text-emerald-400">
                        {formData.performanceRating || '—'}
                      </span>
                    </div>
                    <div>
                      <label className="block text-slate-400 text-[11px] mb-1">درجة الكفاءة المعدلة (إن وجدت):</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        placeholder="الدرجة المعدلة"
                        value={formData.adjustedScore || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, adjustedScore: e.target.value }))}
                        className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1 text-center font-mono font-bold text-white"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Section Three Recommendations */}
              <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-3">
                <h3 className="text-sm font-black text-amber-400 flex items-center gap-2 border-b border-slate-800 pb-2">
                  <span>القسم الثالث: توصيات واقتراحات الرئيس المباشر</span>
                </h3>

                <div className="space-y-3">
                  {/* Rec 1 */}
                  <div className="flex flex-wrap items-center justify-between gap-2 p-2 bg-slate-900 rounded-lg border border-slate-800">
                    <span className="text-slate-200 font-medium">1- توصية بمنحه مكافأة أو علاوة استثنائية:</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({
                          ...prev,
                          recommendations: { ...prev.recommendations, exceptionalBonusOrAllowance: 'نعم' }
                        }))}
                        className={`px-3 py-1 rounded text-xs font-bold ${
                          formData.recommendations?.exceptionalBonusOrAllowance === 'نعم'
                            ? 'bg-emerald-700 text-white'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        نعم
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({
                          ...prev,
                          recommendations: { ...prev.recommendations, exceptionalBonusOrAllowance: 'لا' }
                        }))}
                        className={`px-3 py-1 rounded text-xs font-bold ${
                          formData.recommendations?.exceptionalBonusOrAllowance === 'لا'
                            ? 'bg-red-800 text-white'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        لا
                      </button>
                    </div>
                  </div>

                  {/* Rec 2 */}
                  <div className="flex flex-wrap items-center justify-between gap-2 p-2 bg-slate-900 rounded-lg border border-slate-800">
                    <span className="text-slate-200 font-medium">2- ترشيحه للترقية إلى وظيفة من درجة أعلى:</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({
                          ...prev,
                          recommendations: { ...prev.recommendations, nominationForPromotion: 'نعم' }
                        }))}
                        className={`px-3 py-1 rounded text-xs font-bold ${
                          formData.recommendations?.nominationForPromotion === 'نعم'
                            ? 'bg-emerald-700 text-white'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        نعم
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({
                          ...prev,
                          recommendations: { ...prev.recommendations, nominationForPromotion: 'لا' }
                        }))}
                        className={`px-3 py-1 rounded text-xs font-bold ${
                          formData.recommendations?.nominationForPromotion === 'لا'
                            ? 'bg-red-800 text-white'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        لا
                      </button>
                    </div>
                  </div>

                  {/* Rec 3 */}
                  <div className="p-2 bg-slate-900 rounded-lg border border-slate-800 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-slate-200 font-medium">3- حاجته إلى التدريب في مجالات يتم تحديدها:</span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({
                            ...prev,
                            recommendations: { ...prev.recommendations, trainingNeeds: 'نعم' }
                          }))}
                          className={`px-3 py-1 rounded text-xs font-bold ${
                            formData.recommendations?.trainingNeeds === 'نعم'
                              ? 'bg-emerald-700 text-white'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          نعم
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({
                            ...prev,
                            recommendations: { ...prev.recommendations, trainingNeeds: 'لا' }
                          }))}
                          className={`px-3 py-1 rounded text-xs font-bold ${
                            formData.recommendations?.trainingNeeds === 'لا'
                              ? 'bg-red-800 text-white'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          لا
                        </button>
                      </div>
                    </div>
                    {formData.recommendations?.trainingNeeds === 'نعم' && (
                      <input
                        type="text"
                        placeholder="حدد مجالات التدريب المقترحة..."
                        value={formData.recommendations?.trainingDetails || ''}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          recommendations: { ...prev.recommendations, trainingDetails: e.target.value }
                        }))}
                        className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1 text-white text-xs"
                      />
                    )}
                  </div>

                  {/* Rec 4 */}
                  <div className="p-2 bg-slate-900 rounded-lg border border-slate-800 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-slate-200 font-medium">4- التوصية بنقله إلى وظيفة أخرى تتناسب مع قدرته:</span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({
                            ...prev,
                            recommendations: { ...prev.recommendations, transferToAnotherJob: 'نعم' }
                          }))}
                          className={`px-3 py-1 rounded text-xs font-bold ${
                            formData.recommendations?.transferToAnotherJob === 'نعم'
                              ? 'bg-emerald-700 text-white'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          نعم
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({
                            ...prev,
                            recommendations: { ...prev.recommendations, transferToAnotherJob: 'لا' }
                          }))}
                          className={`px-3 py-1 rounded text-xs font-bold ${
                            formData.recommendations?.transferToAnotherJob === 'لا'
                              ? 'bg-red-800 text-white'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          لا
                        </button>
                      </div>
                    </div>
                    {formData.recommendations?.transferToAnotherJob === 'نعم' && (
                      <input
                        type="text"
                        placeholder="حدد الوظيفة المقترحة للنقل..."
                        value={formData.recommendations?.transferDetails || ''}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          recommendations: { ...prev.recommendations, transferDetails: e.target.value }
                        }))}
                        className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1 text-white text-xs"
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* Signatures Configuration */}
              <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-3">
                <h3 className="text-sm font-black text-amber-400 flex items-center gap-2 border-b border-slate-800 pb-2">
                  <span>القسم الرابع: التوقيعات والاعتمادات الرسمية</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-2 p-2 bg-slate-900 rounded-lg border border-slate-800">
                    <h5 className="font-bold text-white text-xs">الرئيس المباشر</h5>
                    <div>
                      <label className="block text-slate-400 text-[11px] mb-0.5">الاسم</label>
                      <input
                        type="text"
                        value={formData.directSupervisorName || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, directSupervisorName: e.target.value }))}
                        placeholder="اسم الرئيس المباشر..."
                        className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 text-[11px] mb-0.5">الوظيفة أو الدرجة</label>
                      <input
                        type="text"
                        value={formData.directSupervisorJobOrGrade || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, directSupervisorJobOrGrade: e.target.value }))}
                        className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white text-xs"
                      />
                    </div>
                  </div>

                  <div className="space-y-2 p-2 bg-slate-900 rounded-lg border border-slate-800">
                    <h5 className="font-bold text-white text-xs">المدير العام</h5>
                    <div>
                      <label className="block text-slate-400 text-[11px] mb-0.5">الاسم</label>
                      <input
                        type="text"
                        value={formData.higherSupervisorName || generalManagerName || 'نجيب صالح بوحسن'}
                        onChange={(e) => setFormData(prev => ({ ...prev, higherSupervisorName: e.target.value }))}
                        className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white text-xs font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 text-[11px] mb-0.5">الصفة الوظيفية</label>
                      <input
                        type="text"
                        value={formData.higherSupervisorJobOrGrade || 'مدير عام مصرف الدم المركزي المرج'}
                        onChange={(e) => setFormData(prev => ({ ...prev, higherSupervisorJobOrGrade: e.target.value }))}
                        className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white text-xs"
                      />
                    </div>
                  </div>

                  <div className="space-y-2 p-2 bg-slate-900 rounded-lg border border-slate-800">
                    <h5 className="font-bold text-white text-xs">إعداد شؤون الموظفين</h5>
                    <div>
                      <label className="block text-slate-400 text-[11px] mb-0.5">اسم المعد</label>
                      <input
                        type="text"
                        value={formData.hrPreparerName || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, hrPreparerName: e.target.value }))}
                        className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 text-[11px] mb-0.5">تاريخ الإعداد</label>
                      <input
                        type="date"
                        value={formData.hrPreparationDate || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, hrPreparationDate: e.target.value }))}
                        className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white text-xs"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* VIEW 3: ARCHIVE & SCANNED COPY */}
          {activeView === 'archive' && (
            <div className="space-y-4 text-xs">
              {uploadFeedback && (
                <div className="bg-emerald-950 border border-emerald-800 p-3 rounded-xl text-emerald-300 text-xs flex items-center gap-2 font-bold animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>{uploadFeedback}</span>
                </div>
              )}

              {formData.attachedDocPath ? (
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <Paperclip className="w-5 h-5 text-emerald-400" />
                      <div>
                        <h4 className="font-bold text-white text-sm">
                          {formData.attachedDocFileName || 'وثيقة تقرير الكفاءة الممسوحة ضوئياً'}
                        </h4>
                        <p className="text-slate-400 text-xs">
                          تاريخ الأرشفة: {formData.attachedDocDate || 'غير محدد'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <a
                        href={formData.attachedDocPath}
                        download={formData.attachedDocFileName || 'وثيقة_تقرير_الكفاءة.pdf'}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold flex items-center gap-1.5"
                      >
                        <FileDown className="w-4 h-4" />
                        <span>تحميل المستند</span>
                      </a>
                      <button
                        type="button"
                        onClick={handleRemoveScan}
                        className="px-3 py-1.5 rounded-lg bg-red-950 hover:bg-red-900 text-red-300 font-bold flex items-center gap-1.5 border border-red-800"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>حذف المرفق</span>
                      </button>
                    </div>
                  </div>

                  {formData.attachedDocPath.startsWith('data:image/') && (
                    <div className="mt-3 border border-slate-800 rounded-lg p-2 bg-black/40 flex justify-center">
                      <img
                        src={formData.attachedDocPath}
                        alt="Scanned Document"
                        className="max-h-96 object-contain rounded"
                      />
                    </div>
                  )}
                </div>
              ) : (
                <div className="border-2 border-dashed border-slate-700 hover:border-amber-500 rounded-2xl p-8 text-center bg-slate-900/40 transition-colors">
                  <Upload className="w-10 h-10 text-slate-500 mx-auto mb-2" />
                  <h4 className="font-bold text-white text-sm mb-1">رفع الوثيقة الممسوحة ضوئياً (PDF أو صورة)</h4>
                  <p className="text-slate-400 text-xs mb-4">
                    اختر ملف التقرير الموقع والمختوم من جهازك لأرشفته في سجل الموظف
                  </p>
                  <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold shadow-lg">
                    <Upload className="w-4 h-4" />
                    <span>تصفح واختيار الملف...</span>
                    <input
                      type="file"
                      accept=".pdf,image/*"
                      onChange={handleScanUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Bottom Actions Footer */}
        <div className="bg-slate-950 border-t border-slate-800 p-3 sm:p-4 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs flex items-center gap-2 shadow-lg transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة تقرير الكفاءة</span>
            </button>

            <button
              type="button"
              onClick={handleOpenPrintWindow}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold text-xs flex items-center gap-1.5 border border-slate-700 transition-all cursor-pointer"
              title="فتح نسخة جاهزة للطباعة في نافذة مستقلة"
            >
              <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
              <span>فتح نسخة للطباعة</span>
            </button>

            <button
              type="button"
              onClick={handleExportPdf}
              disabled={isExportingPdf}
              className="px-4 py-2 rounded-xl bg-sky-700 hover:bg-sky-600 text-white font-bold text-xs flex items-center gap-2 shadow-lg transition-all disabled:opacity-50 cursor-pointer"
            >
              {isExportingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
              <span>تصدير PDF</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg transition-all cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>حفظ التعديلات</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs transition-colors cursor-pointer"
            >
              إغلاق
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
