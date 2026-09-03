import React, { useState } from 'react';
import { 
  X, 
  Zap, 
  Award, 
  Calendar, 
  FileText, 
  CheckCircle2, 
  ShieldAlert, 
  Clock, 
  Printer, 
  Plus, 
  Info, 
  Building2,
  TrendingUp,
  UserCheck
} from 'lucide-react';
import { 
  Employee, 
  IncrementRecord, 
  PromotionRecord, 
  StatusSettlementRecord, 
  GeneralProcedure,
  IncrementType 
} from '../types';
import { 
  calculateEmployeeIncrementBreakdown, 
  getIncrementTypeMeta, 
  normalizeIncrementType 
} from '../utils/incrementUtils';
import { formatDateDisplay } from '../utils/dateUtils';
import { exportElementToPdf } from '../utils/pdfExport';

interface IncrementHistoryModalProps {
  employee: Employee;
  increments: IncrementRecord[];
  promotions: PromotionRecord[];
  settlements: StatusSettlementRecord[];
  generalProcedures?: GeneralProcedure[];
  isOpen: boolean;
  onClose: () => void;
  onAddIncrement?: (inc: IncrementRecord) => void;
  onUpdateEmployeeIncrement?: (employeeId: number, newIncrement: number) => void;
}

export const IncrementHistoryModal: React.FC<IncrementHistoryModalProps> = ({
  employee,
  increments,
  promotions,
  settlements,
  generalProcedures = [],
  isOpen,
  onClose,
  onAddIncrement,
  onUpdateEmployeeIncrement
}) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newIncType, setNewIncType] = useState<IncrementType>('علاوة سنوية تلقائية');
  const [newIncAmount, setNewIncAmount] = useState<number>(1);
  const [newDecisionNo, setNewDecisionNo] = useState<string>('غير مرتبط بقرار ترقية');
  const [newSource, setNewSource] = useState<string>('استحقاق سنوي دوري');
  const [newNotes, setNewNotes] = useState<string>('');
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  if (!isOpen) return null;

  // Calculate deep breakdown
  const breakdown = calculateEmployeeIncrementBreakdown(
    employee,
    increments,
    promotions,
    settlements,
    generalProcedures
  );

  // Employee increment transactions sorted chronologically
  const empIncrements = increments
    .filter((i) => i.employeeId === employee.id)
    .sort((a, b) => new Date(b.effectiveDate || b.createdAt || '').getTime() - new Date(a.effectiveDate || a.createdAt || '').getTime());

  const handleCreateIncrement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!onAddIncrement) return;

    const todayStr = new Date().toISOString().slice(0, 10);
    const currentCount = employee.currentIncrement || 1;
    const newTotal = Math.min(15, currentCount + newIncAmount);

    const record: IncrementRecord = {
      id: `INC-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`,
      employeeId: employee.id,
      fileNumber: employee.jobNumber,
      date: todayStr,
      incrementAmount: newIncAmount,
      incrementType: newIncType,
      source: newSource || getIncrementTypeMeta(newIncType).sourceName,
      decisionNumber: newDecisionNo || getIncrementTypeMeta(newIncType).defaultDecision,
      decisionDate: todayStr,
      effectiveDate: todayStr,
      previousGrade: employee.jobGrade,
      newGrade: employee.jobGrade,
      previousIncrement: currentCount,
      newIncrement: newTotal,
      notes: newNotes || `تسجيل ${newIncType} بالمنظومة (تاريخ الدرجة محفوظ)`,
      createdBy: 'المستخدم الحالي',
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 19)
    };

    onAddIncrement(record);
    if (onUpdateEmployeeIncrement) {
      onUpdateEmployeeIncrement(employee.id, newTotal);
    }
    setIsAddModalOpen(false);
  };

  const handleExportStatement = async () => {
    const el = document.getElementById('INCREMENT_HISTORY_STATEMENT');
    if (!el) return;
    setIsExportingPdf(true);
    try {
      await exportElementToPdf(el, `بيان_علاوات_${employee.jobNumber}_${employee.fullName.replace(/\s+/g, '_')}.pdf`, {
        orientation: 'portrait',
        margin: 6,
        scale: 2
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full border border-gray-200 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-red-900 via-red-800 to-amber-900 p-5 text-white flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
              <Zap className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold bg-amber-400/20 text-amber-200 px-2 py-0.5 rounded border border-amber-300/30">
                  السجل التاريخي الشامل لمصادر العلاوات
                </span>
                <span className="text-[11px] font-bold bg-white/10 text-white px-2 py-0.5 rounded">
                  الرقم الوظيفي: {employee.jobNumber}
                </span>
              </div>
              <h2 className="text-lg font-black mt-0.5">{employee.fullName}</h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportStatement}
              disabled={isExportingPdf}
              className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-bold flex items-center gap-1.5 border border-white/20 transition cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{isExportingPdf ? 'جارٍ التصدير...' : 'طباعة بيان العلاوات'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-white/20 rounded-lg text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-gray-800" id="INCREMENT_HISTORY_STATEMENT">
          
          {/* Top Info Banner: Current Grade + Total Increment Count & Breakdown */}
          <div className="bg-gradient-to-br from-gray-50 to-red-50/40 p-5 rounded-2xl border border-red-100 shadow-sm">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <div className="text-xs font-bold text-gray-500">الوضع الحالي المعتمد:</div>
                <div className="text-xl font-black text-red-950 mt-0.5 flex items-center gap-2">
                  <span>{employee.jobGrade}</span>
                  <span className="text-red-700 font-extrabold">+ {breakdown.totalIncrements} علاوات</span>
                </div>
                <div className="text-xs font-bold text-gray-700 mt-1 flex items-center gap-1.5">
                  <span className="text-gray-500">تفصيل المصادر:</span>
                  <span className="text-red-900 bg-white px-2.5 py-0.5 rounded-md border border-red-200 font-mono shadow-2xs">
                    {breakdown.breakdownSummaryText}
                  </span>
                </div>
              </div>

              {/* Action Button to Add Manual/Individual Increment */}
              {onAddIncrement && (
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-sm cursor-pointer shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>تسجيل علاوة جديدة</span>
                </button>
              )}
            </div>

            {/* Source Breakdown Badges Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-4 pt-4 border-t border-red-100/80">
              {breakdown.breakdownItems.map((item, idx) => (
                <div key={idx} className={`p-2.5 rounded-xl border ${item.badgeColor} flex flex-col justify-between`}>
                  <div className="text-[10px] font-bold opacity-80">{item.source}</div>
                  <div className="text-sm font-black mt-1 flex items-center justify-between">
                    <span>{item.label}</span>
                    <span className="text-base font-mono">{item.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* SECTION 5: "آخر إجراء مؤثر على الدرجة" (Last Grade/Promotion Reference) */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <div className="flex items-center gap-2 text-red-800 font-black text-sm mb-3">
              <Award className="w-4 h-4 text-red-700" />
              <span>آخر إجراء مؤثر على الدرجة (نقطة مرجع الترقية الحالية)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 bg-gray-50 p-3.5 rounded-xl border border-gray-200">
              <div>
                <span className="text-[11px] text-gray-500 block">نوع الإجراء:</span>
                <span className="font-extrabold text-red-900 text-sm">
                  {breakdown.lastGradeAffectingAction?.actionType || 'تعيين'}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-gray-500 block">تاريخ الإجراء (تاريخ الدرجة):</span>
                <span className="font-bold text-gray-900 font-mono">
                  {formatDateDisplay(breakdown.lastGradeAffectingAction?.actionDate || employee.gradeEntryDate || employee.directingDate)}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-gray-500 block">الدرجة الناتجة:</span>
                <span className="font-extrabold text-gray-900">
                  {breakdown.lastGradeAffectingAction?.resultingGrade || employee.jobGrade}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-gray-500 block">العلاوات الممنوحة بالإجراء:</span>
                <span className="font-bold text-amber-800 font-mono">
                  {breakdown.lastGradeAffectingAction?.incrementCountGranted || 1} علاوة
                </span>
              </div>

              <div className="sm:col-span-2">
                <span className="text-[11px] text-gray-500 block">رقم وتاريخ القرار:</span>
                <span className="font-semibold text-gray-800 font-mono">
                  {breakdown.lastGradeAffectingAction?.decisionNumber || 'غير محدد'} ({formatDateDisplay(breakdown.lastGradeAffectingAction?.decisionDate || '')})
                </span>
              </div>
              <div className="sm:col-span-2">
                <span className="text-[11px] text-gray-500 block">ملاحظات الإجراء:</span>
                <span className="font-normal text-gray-600">
                  {breakdown.lastGradeAffectingAction?.notes || 'الإجراء الأصلي المعتمد'}
                </span>
              </div>
            </div>

            {/* Core Invariance Rule Notice */}
            <div className="mt-3 flex items-start gap-2 bg-blue-50 p-2.5 rounded-lg border border-blue-200 text-blue-900 text-[11px]">
              <Info className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
              <span>
                <strong>ضابط المرجع القانوني:</strong> العلاوات السنوية التلقائية التي تصرف بعد هذا التاريخ تسجل بشكل مستقل ولا تعدل إطلاقاً «تاريخ الدرجة الحالية»، وتبقى نقطة الارتكاز لحساب استحقاق الترقية القادمة ثابتة ومحفوظة.
              </span>
            </div>
          </div>

          {/* SECTION 12: Summary of Latest Events */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
              <span className="text-[10px] text-gray-500 block font-bold">آخر ترقية عادية</span>
              <span className="font-bold text-gray-900 font-mono">
                {breakdown.lastPromotionDate ? formatDateDisplay(breakdown.lastPromotionDate) : 'لا يوجد'}
              </span>
            </div>
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
              <span className="text-[10px] text-gray-500 block font-bold">آخر تسوية وضع</span>
              <span className="font-bold text-purple-900 font-mono">
                {breakdown.lastSettlementDate ? formatDateDisplay(breakdown.lastSettlementDate) : 'لا يوجد'}
              </span>
            </div>
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
              <span className="text-[10px] text-gray-500 block font-bold">آخر ترقية استثنائية</span>
              <span className="font-bold text-amber-900 font-mono">
                {breakdown.lastExceptionalPromoDate ? formatDateDisplay(breakdown.lastExceptionalPromoDate) : 'لا يوجد'}
              </span>
            </div>
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
              <span className="text-[10px] text-gray-500 block font-bold">آخر علاوة سنوية تلقائية</span>
              <span className="font-bold text-emerald-900 font-mono">
                {breakdown.lastAnnualAutoDate ? formatDateDisplay(breakdown.lastAnnualAutoDate) : 'لا يوجد'}
              </span>
            </div>
          </div>

          {/* SECTION 3: Complete Chronological Increment History Table */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="p-3.5 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
              <div className="font-black text-gray-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-600" />
                <span>جدول حركات وسجل العلاوات المسجلة ({empIncrements.length})</span>
              </div>
              <span className="text-[11px] text-gray-500 font-mono">الترتيب الزمني للحركات</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-gray-100/70 border-b border-gray-200 text-gray-700 font-bold">
                  <tr>
                    <th className="py-2.5 px-3">تاريخ الحركة</th>
                    <th className="py-2.5 px-3">نوع العلاوة / المصدر</th>
                    <th className="py-2.5 px-3">رقم القرار / السند</th>
                    <th className="py-2.5 px-3">العلاوة السابقة ← الجديدة</th>
                    <th className="py-2.5 px-3">الدرجة</th>
                    <th className="py-2.5 px-3">الملاحظات والبيان</th>
                    <th className="py-2.5 px-3">المستخدم</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {empIncrements.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-6 text-center text-gray-500">
                        لا توجد حركات علاوات فردية مسجلة؛ يتم استنتاج المصادر مباشرة من قرار التعيين وتسوية الوضع.
                      </td>
                    </tr>
                  ) : (
                    empIncrements.map((inc) => {
                      const meta = getIncrementTypeMeta(inc.incrementType);
                      return (
                        <tr key={inc.id} className="hover:bg-gray-50 transition">
                          <td className="py-2.5 px-3 font-mono font-bold text-gray-900">
                            {formatDateDisplay(inc.effectiveDate || inc.date || '')}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${meta.badgeColor}`}>
                              {meta.label}
                            </span>
                            <div className="text-[10px] text-gray-400 mt-0.5">{inc.source || meta.sourceName}</div>
                          </td>
                          <td className="py-2.5 px-3 font-mono text-gray-700">
                            {inc.decisionNumber || meta.defaultDecision}
                          </td>
                          <td className="py-2.5 px-3 font-bold">
                            علاوة {inc.previousIncrement} ← <strong className="text-red-900 font-mono">علاوة {inc.newIncrement}</strong>
                          </td>
                          <td className="py-2.5 px-3 text-gray-700 font-medium">
                            {inc.newGrade || inc.previousGrade || employee.jobGrade}
                          </td>
                          <td className="py-2.5 px-3 text-gray-600 max-w-xs truncate">
                            {inc.notes || '—'}
                          </td>
                          <td className="py-2.5 px-3 text-gray-500 text-[10px]">
                            {inc.createdBy || 'المدير الإداري'}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3 shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-gray-800 hover:bg-gray-900 text-white rounded-xl font-bold cursor-pointer transition"
          >
            إغلاق
          </button>
        </div>

      </div>

      {/* Add Manual/Individual Increment Sub-Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-5 space-y-4 border border-gray-200 text-xs">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-sm font-black text-gray-900">تسجيل علاوة وظيفية مع تحديد المصدر</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-gray-400 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateIncrement} className="space-y-3.5">
              <div>
                <label className="block font-bold text-gray-700 mb-1">نوع ومصدر العلاوة *</label>
                <select
                  value={newIncType}
                  onChange={(e) => {
                    const type = e.target.value as IncrementType;
                    setNewIncType(type);
                    const meta = getIncrementTypeMeta(type);
                    setNewSource(meta.sourceName);
                    setNewDecisionNo(meta.defaultDecision);
                  }}
                  className="w-full p-2 border rounded-lg font-bold text-gray-900"
                >
                  <option value="علاوة سنوية تلقائية">علاوة سنوية تلقائية (استحقاق سنوي دوري)</option>
                  <option value="علاوة ترقية">علاوة ترقية (مرتبطة بقرار ترقية عادية)</option>
                  <option value="ترقية استثنائية">ترقية استثنائية (بقرار مدير عام)</option>
                  <option value="تسوية وضع">تسوية وضع (بقرار تسوية وظيفية / مؤهل)</option>
                  <option value="علاوة تعيين">علاوة تعيين (بداية الخدمة)</option>
                  <option value="علاوة يدوية">علاوة يدوية (تعديل استثنائي مباشر)</option>
                  <option value="تعديل إداري آخر">تعديل إداري آخر</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">عدد العلاوات المضافة (+1)</label>
                <input
                  type="number"
                  min={1}
                  max={5}
                  value={newIncAmount}
                  onChange={(e) => setNewIncAmount(Number(e.target.value))}
                  className="w-full p-2 border rounded-lg font-bold font-mono"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">المصدر / البيان *</label>
                <input
                  type="text"
                  value={newSource}
                  onChange={(e) => setNewSource(e.target.value)}
                  className="w-full p-2 border rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">رقم القرار / السند</label>
                <input
                  type="text"
                  value={newDecisionNo}
                  onChange={(e) => setNewDecisionNo(e.target.value)}
                  className="w-full p-2 border rounded-lg font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">ملاحظات</label>
                <textarea
                  rows={2}
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="w-full p-2 border rounded-lg"
                  placeholder="ملاحظات تفصيلية..."
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border rounded-lg text-gray-700 font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold"
                >
                  حفظ الحركة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
