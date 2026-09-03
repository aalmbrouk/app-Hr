import React, { useState } from 'react';
import { 
  Employee, 
  AnnualPerformanceEvaluation, 
  PerformanceEvaluationStatus,
  EvaluationMode,
  CareerPromotionRecord,
  PromotionRecord,
  IncrementRecord,
  StatusSettlementRecord,
  AuditLog
} from '../../types';
import { 
  Award, 
  Plus, 
  Printer, 
  Search, 
  Filter, 
  Layers, 
  Calendar, 
  CheckCircle2, 
  Eye, 
  Edit3, 
  Trash2, 
  FileDown, 
  Paperclip, 
  Building2, 
  UserCheck, 
  FileText,
  AlertTriangle,
  TrendingUp,
  FileCheck2,
  Sparkles
} from 'lucide-react';
import { OfficialPerformanceEvaluationModal } from './OfficialPerformanceEvaluationModal';
import { BulkAnnualEvaluationModal } from './BulkAnnualEvaluationModal';
import { createNewEvaluation } from '../../utils/evaluationUtils';

interface PerformanceEvaluationViewProps {
  employees: Employee[];
  evaluations: AnnualPerformanceEvaluation[];
  careerRecords?: CareerPromotionRecord[];
  promotions?: PromotionRecord[];
  increments?: IncrementRecord[];
  settlements?: StatusSettlementRecord[];
  onSaveEvaluation: (evaluation: AnnualPerformanceEvaluation) => void;
  onBatchSaveEvaluations: (evaluations: AnnualPerformanceEvaluation[]) => void;
  onDeleteEvaluation: (id: string) => void;
  officialLogoUrl?: string;
  generalManagerName?: string;
  currentUser?: string;
  onNavigateToReports?: () => void;
  onOpenEmployeeProfile?: (employeeId: number) => void;
}

export const PerformanceEvaluationView: React.FC<PerformanceEvaluationViewProps> = ({
  employees,
  evaluations,
  careerRecords = [],
  promotions = [],
  increments = [],
  settlements = [],
  onSaveEvaluation,
  onBatchSaveEvaluations,
  onDeleteEvaluation,
  officialLogoUrl = '/logo.jpg',
  generalManagerName = 'نجيب صالح سالم',
  currentUser = 'شؤون الموظفين',
  onNavigateToReports,
  onOpenEmployeeProfile
}) => {
  const currentYear = new Date().getFullYear();

  // Filters
  const [selectedYear, setSelectedYear] = useState<string>('ALL');
  const [selectedDept, setSelectedDept] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedMode, setSelectedMode] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Active Modals
  const [selectedEvaluation, setSelectedEvaluation] = useState<AnnualPerformanceEvaluation | null>(null);
  const [isEvaluationModalOpen, setIsEvaluationModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [isNewEvalModalOpen, setIsNewEvalModalOpen] = useState(false);

  // New Single Evaluation Creation State
  const [newEvalEmployeeId, setNewEvalEmployeeId] = useState<number>(employees[0]?.id || 1);
  const [newEvalYear, setNewEvalYear] = useState<number>(currentYear);
  const [duplicateWarning, setDuplicateWarning] = useState<AnnualPerformanceEvaluation | null>(null);

  // Departments list
  const departments = Array.from(new Set(employees.map(e => e.department).filter(Boolean)));

  // Filtered evaluations
  const filteredEvaluations = evaluations.filter(ev => {
    const matchesYear = selectedYear === 'ALL' || String(ev.evaluationYear) === selectedYear;
    const matchesDept = selectedDept === 'ALL' || ev.workplace?.includes(selectedDept);
    const matchesStatus = selectedStatus === 'ALL' || ev.status === selectedStatus;
    const matchesMode = selectedMode === 'ALL' || ev.mode === selectedMode;
    const matchesSearch = 
      ev.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ev.fileNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ev.currentJobTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ev.directSupervisorName?.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesYear && matchesDept && matchesStatus && matchesMode && matchesSearch;
  });

  // KPIs
  const totalEvalsCount = evaluations.length;
  const currentYearEvalsCount = evaluations.filter(e => e.evaluationYear === currentYear).length;
  const approvedCount = evaluations.filter(e => e.status === 'معتمد').length;
  const readyToPrintCount = evaluations.filter(e => e.status === 'جاهز للطباعة' || e.status === 'مسودة').length;
  const withScanCount = evaluations.filter(e => !!e.attachedDocPath).length;

  // Open Single Evaluation Modal
  const handleOpenEvaluation = (ev: AnnualPerformanceEvaluation) => {
    setSelectedEvaluation(ev);
    setIsEvaluationModalOpen(true);
  };

  // Prepare New Single Evaluation
  const handleStartCreateNew = () => {
    setNewEvalEmployeeId(employees[0]?.id || 1);
    setNewEvalYear(currentYear);
    setDuplicateWarning(null);
    setIsNewEvalModalOpen(true);
  };

  // Confirm Creation of Single Evaluation
  const handleConfirmCreateNew = () => {
    const emp = employees.find(e => e.id === Number(newEvalEmployeeId));
    if (!emp) return;

    // Check duplicate
    const existing = evaluations.find(
      ev => ev.employeeId === emp.id && ev.evaluationYear === Number(newEvalYear)
    );

    if (existing && !duplicateWarning) {
      setDuplicateWarning(existing);
      return;
    }

    const newEval = createNewEvaluation(
      emp,
      Number(newEvalYear),
      careerRecords,
      promotions,
      generalManagerName,
      currentUser
    );

    onSaveEvaluation(newEval);
    setIsNewEvalModalOpen(false);
    setSelectedEvaluation(newEval);
    setIsEvaluationModalOpen(true);
  };

  // Selected employee for the modal
  const activeEmployee = employees.find(e => e.id === selectedEvaluation?.employeeId) || employees[0];

  return (
    <div className="space-y-6 text-right" dir="rtl">
      {/* Top Banner & Module Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-inner">
            <Award className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-white">
                تقارير الكفاءة السنوية
              </h1>
              <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold px-2.5 py-0.5 rounded-full text-xs">
                نموذج A4 رسمي معتمد
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              إصدار وإدارة تقارير تقييم الأداء السنوي الرسمية للموظفين لملفات الخدمة والترقيات وفق المعايير الإدارية
            </p>
          </div>
        </div>

        {/* Top Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleStartCreateNew}
            className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-amber-600/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>إنشاء تقرير كفاءة لموظف</span>
          </button>

          <button
            type="button"
            onClick={() => setIsBulkModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center gap-2 border border-slate-700 shadow-md transition-all cursor-pointer"
          >
            <Layers className="w-4 h-4 text-amber-400" />
            <span>توليد وطباعة جماعية</span>
          </button>

          {onNavigateToReports && (
            <button
              type="button"
              onClick={onNavigateToReports}
              className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs flex items-center gap-1.5 border border-slate-700 transition-all cursor-pointer"
            >
              <FileText className="w-4 h-4 text-sky-400" />
              <span>مركز التقارير</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {/* Total */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between">
          <span className="text-slate-400 text-xs font-bold">إجمالي التقارير المسجلة</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-black text-white font-mono">{totalEvalsCount}</span>
            <Award className="w-4 h-4 text-slate-500" />
          </div>
        </div>

        {/* Current Year */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between">
          <span className="text-slate-400 text-xs font-bold">تقارير سنة {currentYear}</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-black text-amber-400 font-mono">{currentYearEvalsCount}</span>
            <Calendar className="w-4 h-4 text-amber-500" />
          </div>
        </div>

        {/* Ready to Print / Draft */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between">
          <span className="text-slate-400 text-xs font-bold">جاهز للطباعة / مسودة</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-black text-sky-400 font-mono">{readyToPrintCount}</span>
            <Printer className="w-4 h-4 text-sky-500" />
          </div>
        </div>

        {/* Approved */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between">
          <span className="text-slate-400 text-xs font-bold">معتمد وموقع</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-black text-emerald-400 font-mono">{approvedCount}</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
        </div>

        {/* Scanned / Archived */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between">
          <span className="text-slate-400 text-xs font-bold">مؤرشف مع وثيقة ممسوحة</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-black text-indigo-400 font-mono">{withScanCount}</span>
            <FileCheck2 className="w-4 h-4 text-indigo-500" />
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 text-xs">
          {/* Search */}
          <div className="relative">
            <label className="block text-slate-400 font-bold mb-1">بحث سريع</label>
            <div className="relative">
              <input
                type="text"
                placeholder="اسم الموظف، رقم الملف، الوظيفة..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg pr-8 pl-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
              <Search className="w-4 h-4 text-slate-500 absolute right-2.5 top-2.5" />
            </div>
          </div>

          {/* Year */}
          <div>
            <label className="block text-slate-400 font-bold mb-1">سنة التقييم</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-500"
            >
              <option value="ALL">جميع السنوات</option>
              {Array.from({ length: 15 }, (_, i) => currentYear + 2 - i).map(yr => (
                <option key={yr} value={String(yr)}>{yr}</option>
              ))}
            </select>
          </div>

          {/* Department */}
          <div>
            <label className="block text-slate-400 font-bold mb-1">القسم / الإدارة</label>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
            >
              <option value="ALL">جميع الأقسام</option>
              {departments.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="block text-slate-400 font-bold mb-1">الحالة</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
            >
              <option value="ALL">جميع الحالات</option>
              <option value="مسودة">مسودة</option>
              <option value="جاهز للطباعة">جاهز للطباعة</option>
              <option value="مكتمل">مكتمل</option>
              <option value="معتمد">معتمد</option>
            </select>
          </div>

          {/* Mode */}
          <div>
            <label className="block text-slate-400 font-bold mb-1">النمط</label>
            <select
              value={selectedMode}
              onChange={(e) => setSelectedMode(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
            >
              <option value="ALL">الكل (يدوي وإلكتروني)</option>
              <option value="يدوي">يدوي (ورقي)</option>
              <option value="إلكتروني">إلكتروني (رقمي)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Evaluations Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-400" />
            <span className="font-bold text-white text-sm">سجل تقارير الكفاءة السنوية</span>
            <span className="bg-slate-800 text-amber-300 font-mono px-2 py-0.5 rounded text-xs">
              {filteredEvaluations.length} تقرير
            </span>
          </div>

          <div className="text-slate-400 text-[11px]">
            * النماذج مصممة رسمياً بحجم A4 رأسية لطباعتها وإيداعها في ملف الخدمة
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-950 text-slate-400 font-bold border-b border-slate-800">
              <tr>
                <th className="p-3 w-16 text-center">السنة</th>
                <th className="p-3 w-24">رقم الملف</th>
                <th className="p-3">اسم الموظف</th>
                <th className="p-3">القسم / مكان العمل</th>
                <th className="p-3">الدرجة</th>
                <th className="p-3 w-24">النمط</th>
                <th className="p-3 w-32">التقدير / الدرجة</th>
                <th className="p-3 w-28">الحالة</th>
                <th className="p-3 w-24">الوثيقة</th>
                <th className="p-3 w-40 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredEvaluations.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-12 text-center text-slate-500">
                    <Award className="w-12 h-12 text-slate-600 mx-auto mb-3 opacity-40" />
                    <p className="font-bold text-sm text-slate-400">لا توجد تقارير كفاءة مطابقة لخيارات البحث</p>
                    <p className="text-xs text-slate-500 mt-1">
                      يمكنك إنشاء تقرير جديد لموظف أو استخدام التوليد الجماعي
                    </p>
                  </td>
                </tr>
              ) : (
                filteredEvaluations.map(ev => (
                  <tr key={ev.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-3 text-center font-mono font-black text-amber-400">
                      {ev.evaluationYear}
                    </td>
                    <td className="p-3 font-mono text-slate-300 font-bold">
                      {ev.fileNumber}
                    </td>
                    <td className="p-3">
                      <div 
                        onClick={() => onOpenEmployeeProfile && onOpenEmployeeProfile(ev.employeeId)}
                        className="font-bold text-white hover:text-amber-400 cursor-pointer transition-colors"
                      >
                        {ev.employeeName}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {ev.currentJobTitle}
                      </div>
                    </td>
                    <td className="p-3 text-slate-300">
                      {ev.workplace || 'مصرف الدم المركزي المرج'}
                    </td>
                    <td className="p-3 font-semibold text-slate-300">
                      {ev.currentGrade}
                    </td>
                    <td className="p-3">
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                        ev.mode === 'يدوي' 
                          ? 'bg-slate-800 text-slate-300' 
                          : 'bg-amber-950 text-amber-300 border border-amber-800'
                      }`}>
                        {ev.mode}
                      </span>
                    </td>
                    <td className="p-3 font-medium">
                      {ev.performanceRating ? (
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-amber-300">{ev.performanceRating}</span>
                          {ev.totalScore !== undefined && ev.totalScore !== '' && (
                            <span className="text-slate-400 font-mono text-[11px]">({ev.totalScore}%)</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-500 text-[11px]">يدوي / غير مسجل</span>
                      )}
                    </td>
                    <td className="p-3">
                      <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                        ev.status === 'معتمد'
                          ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                          : ev.status === 'مكتمل'
                          ? 'bg-blue-950 text-blue-300 border-blue-800'
                          : ev.status === 'جاهز للطباعة'
                          ? 'bg-amber-950 text-amber-300 border-amber-800'
                          : 'bg-slate-800 text-slate-300 border-slate-700'
                      }`}>
                        {ev.status}
                      </span>
                    </td>
                    <td className="p-3">
                      {ev.attachedDocPath ? (
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-bold bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/60">
                          <Paperclip className="w-3 h-3" />
                          <span>مرفق</span>
                        </span>
                      ) : (
                        <span className="text-slate-500 text-[11px]">-</span>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenEvaluation(ev)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-amber-600 text-slate-300 hover:text-white transition-colors"
                          title="معاينة وطباعة A4"
                        >
                          <Printer className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenEvaluation(ev)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                          title="تعديل التقرير"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`هل أنت متأكد من حذف تقرير كفاءة ${ev.employeeName} لسنة ${ev.evaluationYear}؟`)) {
                              onDeleteEvaluation(ev.id);
                            }
                          }}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-900 text-slate-400 hover:text-red-300 transition-colors"
                          title="حذف التقرير"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: New Single Evaluation Selection */}
      {isNewEvalModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg p-5 text-slate-100 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-400" />
                <span>إنشاء تقرير كفاءة سنوي جديد</span>
              </h3>
              <button
                onClick={() => setIsNewEvalModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg"
              >
                ✕
              </button>
            </div>

            {duplicateWarning && (
              <div className="p-3 rounded-xl bg-amber-950/80 border border-amber-700 text-amber-200 text-xs space-y-2">
                <div className="flex items-center gap-2 font-bold">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>تنبيه: يوجد بالفعل تقرير كفاءة لهذا الموظف عن سنة {newEvalYear}.</span>
                </div>
                <p className="text-[11px] text-amber-300/80">
                  هل ترغب في فتح التقرير الموجود وتعديله أو إنشاء تقرير جديد كلياً؟
                </p>
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setIsNewEvalModalOpen(false);
                      setSelectedEvaluation(duplicateWarning);
                      setIsEvaluationModalOpen(true);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs"
                  >
                    فتح التقرير الموجود
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmCreateNew}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
                  >
                    إنشاء تقرير جديد وتجاوز
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-bold mb-1">اختر الموظف المستهدف</label>
                <select
                  value={newEvalEmployeeId}
                  onChange={(e) => {
                    setNewEvalEmployeeId(Number(e.target.value));
                    setDuplicateWarning(null);
                  }}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2.5 text-white font-medium focus:outline-none focus:border-amber-500 text-xs"
                >
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.fullName} ({emp.jobNumber}) - {emp.department} - {emp.jobGrade}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">سنة التقييم</label>
                <select
                  value={newEvalYear}
                  onChange={(e) => {
                    setNewEvalYear(Number(e.target.value));
                    setDuplicateWarning(null);
                  }}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2.5 text-white font-mono font-bold focus:outline-none focus:border-amber-500 text-xs"
                >
                  {Array.from({ length: 15 }, (_, i) => currentYear + 2 - i).map(yr => (
                    <option key={yr} value={yr}>{yr}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-slate-800 pt-3">
              <button
                type="button"
                onClick={handleConfirmCreateNew}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg"
              >
                <Sparkles className="w-4 h-4" />
                <span>إنشاء وفتح النموذج</span>
              </button>
              <button
                type="button"
                onClick={() => setIsNewEvalModalOpen(false)}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 text-xs"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Single Performance Evaluation (Official A4 + Edit + Print) */}
      {selectedEvaluation && (
        <OfficialPerformanceEvaluationModal
          isOpen={isEvaluationModalOpen}
          onClose={() => {
            setIsEvaluationModalOpen(false);
            setSelectedEvaluation(null);
          }}
          evaluation={selectedEvaluation}
          employee={activeEmployee}
          allEmployees={employees}
          careerRecords={careerRecords}
          promotions={promotions}
          increments={increments}
          settlements={settlements}
          onSave={(updated) => {
            onSaveEvaluation(updated);
            setSelectedEvaluation(updated);
          }}
          officialLogoUrl={officialLogoUrl}
          generalManagerName={generalManagerName}
          currentUser={currentUser}
        />
      )}

      {/* Modal: Bulk Annual Evaluations Generation & Print */}
      <BulkAnnualEvaluationModal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        employees={employees}
        existingEvaluations={evaluations}
        careerRecords={careerRecords}
        promotions={promotions}
        onBatchGenerate={(newList) => {
          onBatchSaveEvaluations(newList);
        }}
        officialLogoUrl={officialLogoUrl}
        generalManagerName={generalManagerName}
        currentUser={currentUser}
      />
    </div>
  );
};
