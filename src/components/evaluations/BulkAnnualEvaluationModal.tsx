import React, { useState } from 'react';
import { 
  Employee, 
  AnnualPerformanceEvaluation, 
  CareerPromotionRecord, 
  PromotionRecord
} from '../../types';
import { 
  X, 
  Printer, 
  Users, 
  Calendar, 
  CheckSquare, 
  Square, 
  Sparkles, 
  CheckCircle2, 
  Layers, 
  Building2,
  ExternalLink
} from 'lucide-react';
import { createNewEvaluation } from '../../utils/evaluationUtils';
import { AnnualEvaluationPrintDocument } from './AnnualEvaluationPrintDocument';

interface BulkAnnualEvaluationModalProps {
  isOpen: boolean;
  onClose: () => void;
  employees: Employee[];
  existingEvaluations: AnnualPerformanceEvaluation[];
  careerRecords?: CareerPromotionRecord[];
  promotions?: PromotionRecord[];
  onBatchGenerate: (newEvaluations: AnnualPerformanceEvaluation[]) => void;
  officialLogoUrl?: string;
  generalManagerName?: string;
  currentUser?: string;
}

export const BulkAnnualEvaluationModal: React.FC<BulkAnnualEvaluationModalProps> = ({
  isOpen,
  onClose,
  employees,
  existingEvaluations,
  careerRecords = [],
  promotions = [],
  onBatchGenerate,
  officialLogoUrl = '/logo.jpg',
  generalManagerName = 'نجيب صالح بوحسن',
  currentUser = 'شؤون الموظفين'
}) => {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [selectedDept, setSelectedDept] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedEmpIds, setSelectedEmpIds] = useState<number[]>(employees.map(e => e.id));
  const [activeStep, setActiveStep] = useState<'select' | 'print_preview'>('select');
  const [generatedEvals, setGeneratedEvals] = useState<AnnualPerformanceEvaluation[]>([]);
  const [generationNotice, setGenerationNotice] = useState<string | null>(null);

  if (!isOpen) return null;

  // Filtered employees
  const filteredEmployees = employees.filter(emp => {
    const matchesDept = selectedDept === 'ALL' || emp.department === selectedDept;
    const matchesCat = selectedCategory === 'ALL' || emp.assignmentCategory === selectedCategory;
    const matchesSearch = 
      emp.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.jobNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.department.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesDept && matchesCat && matchesSearch;
  });

  const departments = Array.from(new Set(employees.map(e => e.department).filter(Boolean)));

  const handleToggleEmp = (id: number) => {
    setSelectedEmpIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleSelectAllFiltered = () => {
    const ids = filteredEmployees.map(e => e.id);
    setSelectedEmpIds(prev => Array.from(new Set([...prev, ...ids])));
  };

  const handleDeselectAllFiltered = () => {
    const idsToDeselect = new Set(filteredEmployees.map(e => e.id));
    setSelectedEmpIds(prev => prev.filter(id => !idsToDeselect.has(id)));
  };

  const handleGenerate = () => {
    const selectedEmps = employees.filter(e => selectedEmpIds.includes(e.id));
    if (selectedEmps.length === 0) {
      alert('يرجى اختيار موظف واحد على الأقل.');
      return;
    }

    const created: AnnualPerformanceEvaluation[] = [];
    let skippedCount = 0;

    selectedEmps.forEach(emp => {
      // Check duplicate
      const alreadyExists = existingEvaluations.some(
        ev => ev.employeeId === emp.id && ev.evaluationYear === selectedYear
      );

      if (alreadyExists) {
        skippedCount++;
      } else {
        const ev = createNewEvaluation(
          emp,
          selectedYear,
          careerRecords,
          promotions,
          generalManagerName,
          currentUser
        );
        created.push(ev);
      }
    });

    if (created.length > 0) {
      onBatchGenerate(created);
    }

    // Also prepare for bulk preview
    const previewList: AnnualPerformanceEvaluation[] = selectedEmps.map(emp => {
      const existing = existingEvaluations.find(
        ev => ev.employeeId === emp.id && ev.evaluationYear === selectedYear
      );
      return existing || createNewEvaluation(emp, selectedYear, careerRecords, promotions, generalManagerName, currentUser);
    });

    setGeneratedEvals(previewList);
    setGenerationNotice(`تم إنشاء ${created.length} تقرير كفاءة بنجاح للسنة ${selectedYear}${skippedCount > 0 ? ` (تم تجاوز ${skippedCount} موظف لوجود تقرير مسبق لهم)` : ''}.`);
    setActiveStep('print_preview');
  };

  const handlePrintAll = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 text-right" dir="rtl">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-5xl max-h-[96vh] flex flex-col shadow-2xl overflow-hidden text-slate-100 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="bg-slate-950 border-b border-slate-800 p-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white">
                توليد وطباعة تقارير الكفاءة السنوية جماعياً
              </h2>
              <p className="text-xs text-slate-400">
                توليد نماذج تقارير كفاءة فارغة معدة للكتابة اليدوية مع صفحة A4 منفصلة لكل موظف
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
          {activeStep === 'select' ? (
            <div className="space-y-4">
              {/* Filter controls */}
              <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-400 font-bold mb-1">سنة التقييم المطلوب توليدها:</label>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-amber-400" />
                      <select
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(Number(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white font-mono font-bold"
                      >
                        {Array.from({ length: 15 }, (_, i) => 2030 - i).map(yr => (
                          <option key={yr} value={yr}>{yr}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-400 font-bold mb-1">تصفية حسب القسم / الوحدة:</label>
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-sky-400" />
                      <select
                        value={selectedDept}
                        onChange={(e) => setSelectedDept(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white font-bold"
                      >
                        <option value="ALL">جميع الأقسام والوحدات ({employees.length})</option>
                        {departments.map(d => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-400 font-bold mb-1">الكادر الوظيفي:</label>
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white font-bold"
                    >
                      <option value="ALL">الكل (طبي وإداري)</option>
                      <option value="إداري">إداري فقط</option>
                      <option value="طبي">طبي فقط</option>
                    </select>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
                  <input
                    type="text"
                    placeholder="بحث سريع بالاسم أو رقم الملف..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white text-xs w-64"
                  />

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleSelectAllFiltered}
                      className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
                    >
                      تحديد الكل الظاهر ({filteredEmployees.length})
                    </button>
                    <button
                      type="button"
                      onClick={handleDeselectAllFiltered}
                      className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
                    >
                      إلغاء تحديد الكل
                    </button>
                  </div>
                </div>
              </div>

              {/* Employee selection checklist */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 space-y-2">
                <div className="flex justify-between items-center text-slate-400 font-bold text-xs px-2 pb-2 border-b border-slate-800">
                  <span>قائمة الموظفين المحددين للتوليد ({selectedEmpIds.length} من {employees.length})</span>
                  <span className="text-[11px] text-amber-400">انقر على الموظف للتحديد / الإلغاء</span>
                </div>

                <div className="max-h-80 overflow-y-auto space-y-1.5 pr-1">
                  {filteredEmployees.map(emp => {
                    const isSelected = selectedEmpIds.includes(emp.id);
                    const hasExisting = existingEvaluations.some(
                      ev => ev.employeeId === emp.id && ev.evaluationYear === selectedYear
                    );

                    return (
                      <div
                        key={emp.id}
                        onClick={() => handleToggleEmp(emp.id)}
                        className={`p-2.5 rounded-lg border flex items-center justify-between transition-colors cursor-pointer select-none ${
                          isSelected
                            ? 'bg-amber-950/30 border-amber-500/50 text-white'
                            : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:bg-slate-800/60'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-amber-400 shrink-0" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-600 shrink-0" />
                          )}
                          <div>
                            <span className="font-bold text-xs text-white">{emp.fullName}</span>
                            <span className="text-[11px] text-slate-400 mr-2 font-mono">#{emp.jobNumber}</span>
                            <span className="text-[10px] text-slate-500 mr-2">| {emp.department}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {hasExisting && (
                            <span className="text-[10px] px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800">
                              يوجد تقرير مسبق ({selectedYear})
                            </span>
                          )}
                          <span className="text-[11px] font-mono text-slate-400">{emp.jobGrade}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            /* PREVIEW STEP */
            <div className="space-y-4">
              {generationNotice && (
                <div className="bg-emerald-950 border border-emerald-800 p-3 rounded-xl text-emerald-300 text-xs flex items-center gap-2 font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{generationNotice}</span>
                </div>
              )}

              <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl flex items-center justify-between text-xs">
                <span className="text-slate-300">
                  عدد الصفحات الجاهزة للطباعة: <strong className="text-amber-400 font-mono text-sm">{generatedEvals.length}</strong> (صفحة A4 منفصلة لكل موظف)
                </span>

                <button
                  type="button"
                  onClick={handlePrintAll}
                  className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs flex items-center gap-2 shadow-lg cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>طباعة جميع النماذج ({generatedEvals.length} صفحة)</span>
                </button>
              </div>

              {/* Multi-page preview canvas */}
              <div className="space-y-6 bg-slate-950 p-6 rounded-2xl border border-slate-800 overflow-x-auto flex flex-col items-center">
                {generatedEvals.map((evalDoc, idx) => (
                  <div key={evalDoc.id} className="relative shadow-2xl bg-white rounded-xs">
                    <div className="absolute -top-3 right-2 bg-slate-900 text-amber-300 px-2.5 py-0.5 rounded-full text-[10px] font-mono border border-slate-700 z-10">
                      صفحة {idx + 1} من {generatedEvals.length} : {evalDoc.employeeName}
                    </div>
                    <AnnualEvaluationPrintDocument
                      evaluation={evalDoc}
                      officialLogoUrl={officialLogoUrl}
                      idPrefix="BULK_PRINT"
                      isBulkPrint={true}
                      generalManagerName={generalManagerName}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-950 border-t border-slate-800 p-3.5 sm:p-4 flex items-center justify-between shrink-0">
          <div>
            <span className="text-xs text-slate-400">
              {selectedEmpIds.length} موظف محدد لسنة {selectedYear}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {activeStep === 'select' ? (
              <button
                type="button"
                onClick={handleGenerate}
                className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>توليد ومعاينة النماذج ({selectedEmpIds.length})</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handlePrintAll}
                className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs flex items-center gap-2 shadow-lg cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>طباعة النماذج الآن</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs cursor-pointer"
            >
              إغلاق
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
