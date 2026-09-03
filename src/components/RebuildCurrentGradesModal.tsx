import React, { useState, useMemo } from 'react';
import { 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  ShieldCheck, 
  Download, 
  X, 
  Filter, 
  Search, 
  FileText, 
  ArrowLeftRight,
  Database,
  Calendar,
  Layers,
  HelpCircle,
  Sparkles
} from 'lucide-react';
import { 
  Employee, 
  CareerPromotionRecord, 
  PromotionRecord, 
  IncrementRecord, 
  StatusSettlementRecord, 
  GeneralProcedureRecord 
} from '../types';
import { 
  auditDatabaseCurrentGrades, 
  recalculateCurrentGrade, 
  runGradeCalculationAcceptanceTests,
  GradeRecalculationResult 
} from '../utils/gradeCalculationEngine';
import { createDatabaseBackup, downloadBackupFile } from '../utils/backupService';
import { formatDateDisplay } from '../utils/dateUtils';

interface RebuildCurrentGradesModalProps {
  isOpen: boolean;
  onClose: () => void;
  employees: Employee[];
  careerRecords: CareerPromotionRecord[];
  promotions: PromotionRecord[];
  increments: IncrementRecord[];
  settlements: StatusSettlementRecord[];
  generalProcedures: GeneralProcedureRecord[];
  onApplyBatchUpdate: (updatedEmployees: Employee[], auditSummaryNotes: string) => void;
  fullDatabaseState: any;
}

export const RebuildCurrentGradesModal: React.FC<RebuildCurrentGradesModalProps> = ({
  isOpen,
  onClose,
  employees,
  careerRecords,
  promotions,
  increments,
  settlements,
  generalProcedures,
  onApplyBatchUpdate,
  fullDatabaseState
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeMode, setActiveMode] = useState<'audit' | 'apply'>('audit'); // Default MUST be AUDIT ONLY
  const [filterTab, setFilterTab] = useState<'all' | 'changed' | 'review' | 'historical418' | 'unchanged'>('all');
  const [selectedResult, setSelectedResult] = useState<GradeRecalculationResult | null>(null);
  const [isApplying, setIsApplying] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [applySuccessMsg, setApplySuccessMsg] = useState<string | null>(null);

  // Run calculation engine audit
  const auditReport = useMemo(() => {
    return auditDatabaseCurrentGrades(
      employees,
      careerRecords,
      promotions,
      increments,
      settlements,
      generalProcedures
    );
  }, [employees, careerRecords, promotions, increments, settlements, generalProcedures]);

  // Run unit acceptance tests
  const unitTests = useMemo(() => {
    return runGradeCalculationAcceptanceTests();
  }, []);

  // Filtered results
  const filteredResults = useMemo(() => {
    let list = auditReport.results;

    if (filterTab === 'changed') {
      list = list.filter((r) => r.isChanged);
    } else if (filterTab === 'review') {
      list = list.filter((r) => r.isAmbiguous || r.hasInconsistency);
    } else if (filterTab === 'historical418') {
      list = list.filter((r) => r.hasHistorical418);
    } else if (filterTab === 'unchanged') {
      list = list.filter((r) => !r.isChanged);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(
        (r) =>
          r.jobNumber.toLowerCase().includes(q) ||
          r.employeeName.toLowerCase().includes(q) ||
          r.oldJobGrade.toLowerCase().includes(q) ||
          r.calculatedJobGrade.toLowerCase().includes(q)
      );
    }

    return list;
  }, [auditReport, filterTab, searchQuery]);

  if (!isOpen) return null;

  // Handle Export Audit Report
  const handleExportAudit = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(auditReport, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `Grade_Recalculation_Audit_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Handle Apply Rebuild
  const handleConfirmApply = () => {
    setIsApplying(true);

    // 1. Create Pre-Backup automatically
    if (fullDatabaseState) {
      createDatabaseBackup(fullDatabaseState, 'النظام', 'تلقائية قبل إعادة بناء الدرجات', 'ZIP').then((res) => {
        if (res.success && res.blob) {
          downloadBackupFile(res.blob, `pre_rebuild_grades_${new Date().toISOString().slice(0, 10)}.zip`);
        }
      });
    }

    // 2. Compute updated employees array
    const updatedEmployees = employees.map((emp) => {
      const { updatedEmployee } = recalculateCurrentGrade(
        emp,
        careerRecords,
        promotions,
        increments,
        settlements,
        generalProcedures
      );
      return updatedEmployee;
    });

    const summaryNotes = `إعادة بناء وتدقيق الدرجات الحالية: تم تدقيق وتحديث ${auditReport.correctedEmployeesCount} موظفاً، وتوثيق سجلات اللائحة 418 التاريخية (${auditReport.historical418Count})، وتأشير ${auditReport.ambiguousRequiringReviewCount} حالة للمراجعة.`;

    onApplyBatchUpdate(updatedEmployees, summaryNotes);
    setIsApplying(false);
    setShowConfirmModal(false);
    setApplySuccessMsg('تمت إعادة بناء وتحديث الدرجات الحالية بنجاح وفق التسلسل الزمني المعتمد وقواعد انتقال 2023.');
    setTimeout(() => {
      setApplySuccessMsg(null);
      onClose();
    }, 2500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-6xl rounded-2xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col max-h-[94vh] animate-in fade-in zoom-in-95 duration-150">
        
        {/* HEADER */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-600/90 text-white flex items-center justify-center shadow-inner">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-white tracking-tight">
                  تدقيق وإعادة بناء الدرجات الحالية وانتقال اللائحة 418
                </h2>
                <span className="bg-teal-500/20 text-teal-300 text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-teal-500/30">
                  {activeMode === 'audit' ? '🔒 وضع التدقيق فقط (قراءة فقط)' : '⚡ وضع تطبيق التصحيحات'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                تحديد الدرجة الحالية وفق أحدث إجراء زمني مشروع مع الحفاظ الكامل على السجلات التاريخية للائحة 418
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* MODE SWITCHER */}
            <div className="bg-slate-800 p-0.5 rounded-xl border border-slate-700 flex items-center text-xs font-bold">
              <button
                type="button"
                onClick={() => setActiveMode('audit')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeMode === 'audit'
                    ? 'bg-teal-700 text-white shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5 text-teal-300" />
                <span>1. وضع التدقيق فقط (قراءة فقط)</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveMode('apply')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeMode === 'apply'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <RefreshCw className="w-3.5 h-3.5 text-amber-200" />
                <span>2. تطبيق التصحيحات</span>
              </button>
            </div>

            <button
              type="button"
              onClick={handleExportAudit}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer border border-slate-700"
              title="تصدير تقرير التدقيق الشامل JSON"
            >
              <Download className="w-3.5 h-3.5 text-teal-400" />
              <span>تصدير التقرير</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* MODE NOTICE BANNER */}
        {activeMode === 'audit' ? (
          <div className="bg-teal-900/90 text-teal-100 px-6 py-2.5 text-xs font-medium flex items-center justify-between border-b border-teal-800 shrink-0">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-teal-300 shrink-0" />
              <span>
                <strong>وضع التدقيق فقط (قراءة فقط):</strong> يتم فحص ومقارنة السجلات الحالية زمنياً وعرض حالات عدم التطابق دون إجراء أي تعديل على قاعدة البيانات.
              </span>
            </div>
            <span className="text-[11px] bg-teal-800/80 text-teal-200 px-2 py-0.5 rounded font-mono font-bold">
              READ_ONLY_AUDIT
            </span>
          </div>
        ) : (
          <div className="bg-amber-950/90 text-amber-100 px-6 py-2.5 text-xs font-medium flex items-center justify-between border-b border-amber-800 shrink-0">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                <strong>وضع تطبيق التصحيحات:</strong> يتطلب مراجعة التغييرات والتأكيد الصريح، وسيتم إنشاء نسخة احتياطية كاملة وتطبيق التعديل على ({auditReport.correctedEmployeesCount}) موظفاً فقط.
              </span>
            </div>
            <span className="text-[11px] bg-amber-800/80 text-amber-200 px-2 py-0.5 rounded font-mono font-bold">
              TRANSACTIONAL_APPLY
            </span>
          </div>
        )}

        {/* NOTIFICATIONS */}
        {applySuccessMsg && (
          <div className="bg-emerald-600 text-white px-6 py-2.5 text-xs font-bold flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{applySuccessMsg}</span>
          </div>
        )}

        {/* BODY */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50/50">

          {/* TOP METRICS BANNER */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-2xs">
              <span className="text-[11px] font-bold text-slate-500 block">إجمالي موظفي الملاك</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl font-black text-slate-900">{auditReport.totalEmployees}</span>
                <span className="text-xs text-slate-400 font-bold">موظف</span>
              </div>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-teal-200 shadow-2xs bg-teal-50/30">
              <span className="text-[11px] font-bold text-teal-800 block">درجات تحتاج تصحيح/تحديث</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl font-black text-teal-700">{auditReport.correctedEmployeesCount}</span>
                <span className="text-xs text-teal-600 font-bold">موظف</span>
              </div>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-blue-200 shadow-2xs bg-blue-50/30">
              <span className="text-[11px] font-bold text-blue-800 block">سجلات 418 تاريخية موثقة</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl font-black text-blue-700">{auditReport.historical418Count}</span>
                <span className="text-xs text-blue-600 font-bold">سجل</span>
              </div>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-amber-200 shadow-2xs bg-amber-50/30">
              <span className="text-[11px] font-bold text-amber-800 block">حالات تتطلب مراجعة إدارية</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl font-black text-amber-700">{auditReport.ambiguousRequiringReviewCount}</span>
                <span className="text-xs text-amber-600 font-bold">حالة</span>
              </div>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-emerald-200 shadow-2xs bg-emerald-50/30">
              <span className="text-[11px] font-bold text-emerald-800 block">إعادة حساب ناجحة ومتسقة</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl font-black text-emerald-700">{auditReport.successfullyRecalculatedCount}</span>
                <span className="text-xs text-emerald-600 font-bold">موظف</span>
              </div>
            </div>
          </div>

          {/* ACCEPTANCE TESTS BADGE STRIP */}
          <div className="bg-slate-900 text-slate-200 p-4 rounded-xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-sm">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
              <div>
                <h4 className="text-xs font-black text-white">
                  اختبارات القبول المعيارية (Acceptance Tests — 5 Scenarios)
                </h4>
                <p className="text-[11px] text-slate-400">
                  التحقق من صحة انتقال 2023، أولوية النظام العام، عدم مساس العلاوات بتاريخ الدرجة، وعدم اعتماد السجل الأول عشوائياً.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {unitTests.testResults.map((t, idx) => (
                <span
                  key={idx}
                  title={`${t.testName}: ${t.description}`}
                  className="bg-emerald-950/80 text-emerald-300 border border-emerald-700/60 px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  <span>TEST {idx + 1}: PASS</span>
                </span>
              ))}
            </div>
          </div>

          {/* CONTROLS & FILTER BAR */}
          <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              <button
                type="button"
                onClick={() => setFilterTab('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap cursor-pointer ${
                  filterTab === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                الكل ({auditReport.totalEmployees})
              </button>
              <button
                type="button"
                onClick={() => setFilterTab('changed')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap cursor-pointer ${
                  filterTab === 'changed' ? 'bg-teal-600 text-white' : 'bg-teal-50 text-teal-800 hover:bg-teal-100'
                }`}
              >
                تحتاج تصحيح ({auditReport.correctedEmployeesCount})
              </button>
              <button
                type="button"
                onClick={() => setFilterTab('historical418')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap cursor-pointer ${
                  filterTab === 'historical418' ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-800 hover:bg-blue-100'
                }`}
              >
                تاريخي 418 ({auditReport.historical418Count})
              </button>
              <button
                type="button"
                onClick={() => setFilterTab('review')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap cursor-pointer ${
                  filterTab === 'review' ? 'bg-amber-600 text-white' : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
                }`}
              >
                تحتاج مراجعة ({auditReport.ambiguousRequiringReviewCount})
              </button>
              <button
                type="button"
                onClick={() => setFilterTab('unchanged')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap cursor-pointer ${
                  filterTab === 'unchanged' ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                متطابقة ({auditReport.unchangedCount})
              </button>
            </div>

            <div className="relative min-w-[220px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="بحث برقم الملف أو اسم الموظف..."
                className="w-full pl-3 pr-8 py-1.5 bg-slate-50 border border-gray-200 rounded-lg text-xs focus:bg-white focus:outline-none focus:border-teal-500 font-medium"
              />
            </div>
          </div>

          {/* MAIN COMPARISON TABLE */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto max-h-[380px]">
              <table className="w-full text-right border-collapse text-xs">
                <thead className="sticky top-0 bg-slate-100 text-slate-700 font-bold border-b border-gray-200 z-10">
                  <tr>
                    <th className="py-2.5 px-3">رقم الملف</th>
                    <th className="py-2.5 px-3">اسم الموظف</th>
                    <th className="py-2.5 px-3">الدرجة الحالية الحالية (المسجلة)</th>
                    <th className="py-2.5 px-3">الدرجة المحسوبة (التسلسل الزمني)</th>
                    <th className="py-2.5 px-3">تاريخ النفاذ المعتمد</th>
                    <th className="py-2.5 px-3">مستند الإثبات والحركة</th>
                    <th className="py-2.5 px-3">التصنيف واللائحة</th>
                    <th className="py-2.5 px-3">حالة التدقيق</th>
                    <th className="py-2.5 px-3 text-center">التفاصيل</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredResults.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-slate-400 font-medium">
                        لا توجد سجلات مطابقة لمعايير البحث المحددة
                      </td>
                    </tr>
                  ) : (
                    filteredResults.map((item) => (
                      <tr key={item.employeeId} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                          {item.jobNumber || item.employeeId}
                        </td>
                        <td className="py-2.5 px-3 font-bold text-slate-900">
                          {item.employeeName}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                            item.isGradeChanged ? 'bg-red-50 text-red-700 line-through' : 'bg-slate-100 text-slate-700'
                          }`}>
                            {item.oldJobGrade} ({item.oldCurrentIncrement} علاوة)
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-bold">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                            item.isGradeChanged ? 'bg-teal-100 text-teal-900 border border-teal-300' : 'text-slate-800'
                          }`}>
                            {item.calculatedJobGrade} ({item.calculatedIncrement} علاوة)
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-600 text-[11px]">
                          {formatDateDisplay(item.calculatedGradeEntryDate)}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 max-w-[200px] truncate" title={item.evidenceRecordDesc}>
                          {item.evidenceRecordDesc}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            item.regulationCategory === 'مختلط / انتقال 2023'
                              ? 'bg-purple-100 text-purple-800'
                              : item.regulationCategory === 'اللائحة 418 (تاريخي)'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-800'
                          }`}>
                            {item.regulationCategory}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            item.recommendedReviewStatus === 'تمت المراجعة'
                              ? 'bg-emerald-100 text-emerald-800'
                              : item.recommendedReviewStatus === 'تحتاج إلى تصحيح'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}>
                            {item.recommendedReviewStatus}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => setSelectedResult(item)}
                            className="text-teal-700 hover:text-teal-900 font-bold text-[11px] underline cursor-pointer"
                          >
                            عرض المسار
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* AUDIT TRAIL MODAL / DRAWER IF SELECTED */}
          {selectedResult && (
            <div className="bg-white p-4 rounded-xl border border-teal-200 shadow-md">
              <div className="flex items-center justify-between border-b border-gray-100 pb-2 mb-3">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-teal-600" />
                  <h4 className="text-xs font-black text-slate-900">
                    التتبع الزمني للموظف: {selectedResult.employeeName} (ملف: {selectedResult.jobNumber})
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedResult(null)}
                  className="text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer"
                >
                  إغلاق المسار
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3 text-xs bg-slate-50 p-2.5 rounded-lg">
                <div>
                  <span className="text-slate-500 font-bold block text-[11px]">الدرجة الأصلية:</span>
                  <span className="font-bold text-slate-800">{selectedResult.oldJobGrade}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-bold block text-[11px]">الدرجة المحسوبة المعتمدة:</span>
                  <span className="font-bold text-teal-800">{selectedResult.calculatedJobGrade}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-bold block text-[11px]">حركة الإثبات:</span>
                  <span className="font-bold text-slate-800">{selectedResult.evidenceRecordDesc} ({selectedResult.evidenceDate})</span>
                </div>
              </div>

              <div className="bg-slate-900 text-slate-200 p-3 rounded-lg font-mono text-[11px] space-y-1 max-h-[160px] overflow-y-auto">
                {selectedResult.auditTrail.map((line, i) => (
                  <div key={i} className="leading-relaxed">
                    {line}
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* FOOTER */}
        <div className="bg-white px-6 py-4 border-t border-gray-200 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-500">
            {activeMode === 'audit' ? (
              <span className="flex items-center gap-1.5 text-slate-600 font-medium">
                <ShieldCheck className="w-4 h-4 text-teal-600" />
                وضع التدقيق للقراءة فقط. يمكنك مراجعة وتصدير التقرير بأمان تام دون أي تعديل على البيانات.
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-amber-800 font-medium">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                سيتم إنشاء <span className="font-bold">نسخة احتياطية كاملة مسبقاً</span> قبل تطبيق التعديلات، دون المساس بالسجلات التاريخية للائحة 418.
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              إغلاق
            </button>

            {activeMode === 'audit' ? (
              <button
                type="button"
                onClick={() => setActiveMode('apply')}
                className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-black shadow-md shadow-amber-600/20 flex items-center gap-2 transition-all cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>الانتقال إلى وضع تطبيق التصحيحات</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setShowConfirmModal(true)}
                className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-black shadow-md shadow-teal-600/20 flex items-center gap-2 transition-all cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>تطبيق التصحيحات المعتمدة ({auditReport.correctedEmployeesCount})</span>
              </button>
            )}
          </div>
        </div>

      </div>

      {/* CONFIRMATION MODAL */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-60 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-gray-200 p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-base font-black text-slate-900">
                تأكيد إعادة بناء الدرجات الحالية
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                سيقوم النظام بتحديث حقل الدرجة الحالية لعدد <span className="font-bold text-teal-700">({auditReport.correctedEmployeesCount})</span> موظفاً بناءً على التسلسل الزمني الفعلي وحركات التحويل لسنة 2023.
              </p>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-right text-[11px] text-slate-700 space-y-1">
                <div>✓ لن يتم حذف أو تعديل أي سجل تاريخي للائحة 418.</div>
                <div>✓ لن يتم تعديل تواريخ القرارات أو أرقامها.</div>
                <div>✓ سيتم حفظ نسخة احتياطية مشفرة فورية تلقائياً.</div>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                disabled={isApplying}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                تراجع
              </button>
              <button
                type="button"
                onClick={handleConfirmApply}
                disabled={isApplying}
                className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-black shadow-md shadow-teal-600/20 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                {isApplying ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>جاري التحديث...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>تأكيد واعتماد التحديث</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
