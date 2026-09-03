import React, { useState, useMemo } from 'react';
import { Employee, CareerPromotionRecord, PromotionRecord, IncrementRecord, StatusSettlementRecord, GeneralProcedure } from '../types';
import { getLatestEffectiveGradeInfo, LatestEffectiveGradeInfo } from '../utils/gradeCalculationEngine';
import { X, Search, Filter, CheckCircle, AlertTriangle, ShieldCheck, Zap, Download, Calendar, Layers, Clock, ArrowRight, User } from 'lucide-react';
import * as XLSX from 'xlsx';

interface GradeChronologyAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
  employees: Employee[];
  careerRecords?: CareerPromotionRecord[];
  promotions?: PromotionRecord[];
  increments?: IncrementRecord[];
  settlements?: StatusSettlementRecord[];
  generalProcedures?: GeneralProcedure[];
  preSelectedEmployeeId?: number | null;
}

export const GradeChronologyAuditModal: React.FC<GradeChronologyAuditModalProps> = ({
  isOpen,
  onClose,
  employees,
  careerRecords = [],
  promotions = [],
  increments = [],
  settlements = [],
  generalProcedures = [],
  preSelectedEmployeeId
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'changed' | '418' | 'promoted'>('all');
  const [selectedAuditEmpId, setSelectedAuditEmpId] = useState<number | null>(preSelectedEmployeeId || null);

  // Calculate audit info for all employees
  const auditList = useMemo(() => {
    return employees.map((emp) => {
      const info = getLatestEffectiveGradeInfo(emp, {
        careerRecords,
        promotions,
        increments,
        settlements,
        generalProcedures,
        employees
      });
      return {
        emp,
        info
      };
    });
  }, [employees, careerRecords, promotions, increments, settlements, generalProcedures]);

  // Statistics
  const stats = useMemo(() => {
    let changedCount = 0;
    let historical418Count = 0;
    let generalCount = 0;
    let promotedCount = 0;

    auditList.forEach(({ info }) => {
      if (info.isDifferentFromRecorded) changedCount++;
      if (info.hasHistorical418) historical418Count++;
      if (info.hasGeneralGrade) generalCount++;
      if (info.latestGradeAction === 'ترقية' || info.latestGradeAction === 'ترقية استثنائية') {
        promotedCount++;
      }
    });

    return {
      total: auditList.length,
      changedCount,
      historical418Count,
      generalCount,
      promotedCount
    };
  }, [auditList]);

  // Filtered list
  const filteredList = useMemo(() => {
    return auditList.filter(({ emp, info }) => {
      // Category filter
      if (activeFilter === 'changed' && !info.isDifferentFromRecorded) return false;
      if (activeFilter === '418' && !info.hasHistorical418) return false;
      if (activeFilter === 'promoted' && !(info.latestGradeAction === 'ترقية' || info.latestGradeAction === 'ترقية استثنائية')) return false;

      // Search term
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim();
        const matchesName = emp.fullName?.toLowerCase().includes(q);
        const matchesJobNum = emp.jobNumber?.toLowerCase().includes(q);
        const matchesCurrentGrade = info.displayedCurrentGrade.toLowerCase().includes(q);
        const matchesFirstGrade = info.firstRecordedGrade.toLowerCase().includes(q);
        return matchesName || matchesJobNum || matchesCurrentGrade || matchesFirstGrade;
      }

      return true;
    });
  }, [auditList, activeFilter, searchTerm]);

  // Selected employee detail
  const selectedDetail = useMemo(() => {
    if (!selectedAuditEmpId) return null;
    return auditList.find((item) => item.emp.id === selectedAuditEmpId) || null;
  }, [auditList, selectedAuditEmpId]);

  // Export to Excel
  const handleExportExcel = () => {
    const dataToExport = filteredList.map(({ emp, info }, idx) => ({
      'ت': idx + 1,
      'رقم الملف': emp.jobNumber || '-',
      'اسم الموظف': emp.fullName,
      'First Recorded Grade (الدرجة الأولى المسجلة)': info.firstRecordedGrade,
      'Latest Historical Grade (أحدث تصنيف 418)': info.latestHistoricalGrade,
      'Latest General Grade (أحدث درجة عامة)': info.latestGeneralGrade,
      'Latest Grade Action (أحدث إجراء)': info.latestGradeAction,
      'Effective Date (تاريخ النفاذ)': info.effectiveDate || '-',
      'Displayed Current Grade (الدرجة الحالية المعروضة)': info.displayedCurrentGrade,
      'علاوة الدرجة': info.currentIncrement,
      'الدرجة المسجلة بالملف الأصلي': emp.jobGrade,
      'هل تم التحديث زمنياً؟': info.isDifferentFromRecorded ? 'نعم (محدثة)' : 'مطابقة للأصل',
      'عدد الحركات الموثقة': info.chronologicalEventsCount
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'تقرير تدقيق الدرجات الزمنية');
    XLSX.writeFile(wb, `Chronological_Grade_Audit_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto" dir="rtl">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-6xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between border-b border-indigo-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600/40 rounded-xl border border-indigo-400/30">
              <Zap className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-wide">
                  فحص وتدقيق التتبع الزمني للدرجات — أحدث درجة نافذة
                </h2>
                <span className="bg-amber-400/20 text-amber-300 text-[11px] font-bold px-2 py-0.5 rounded-full border border-amber-400/30">
                  {stats.total} موظف بالملاك المعتمد
                </span>
              </div>
              <p className="text-xs text-indigo-200 mt-0.5">
                التحقق الصارم من عرض الدرجة النافذة الأحدث لكل موظف وتجنب عرض الدرجة الأولى أو تاريخ التعيين
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-indigo-200 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Summary Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 sm:p-4 bg-slate-50 border-b border-slate-200 text-xs">
          <div className="bg-white p-2.5 rounded-xl border border-slate-200 flex items-center justify-between">
            <div>
              <span className="text-gray-500 text-[11px] block">إجمالي الموظفين</span>
              <span className="font-mono font-black text-slate-900 text-base">{stats.total}</span>
            </div>
            <User className="w-4 h-4 text-slate-400" />
          </div>

          <div className="bg-white p-2.5 rounded-xl border border-indigo-100 flex items-center justify-between">
            <div>
              <span className="text-indigo-600 font-bold text-[11px] block">درجات محدثة زمنياً</span>
              <span className="font-mono font-black text-indigo-900 text-base">{stats.changedCount}</span>
            </div>
            <Clock className="w-4 h-4 text-indigo-500" />
          </div>

          <div className="bg-white p-2.5 rounded-xl border border-emerald-100 flex items-center justify-between">
            <div>
              <span className="text-emerald-700 font-bold text-[11px] block">حركات ترقية مسجلة</span>
              <span className="font-mono font-black text-emerald-900 text-base">{stats.promotedCount}</span>
            </div>
            <Layers className="w-4 h-4 text-emerald-500" />
          </div>

          <div className="bg-white p-2.5 rounded-xl border border-amber-100 flex items-center justify-between">
            <div>
              <span className="text-amber-700 font-bold text-[11px] block">سجلات اللائحة 418</span>
              <span className="font-mono font-black text-amber-900 text-base">{stats.historical418Count}</span>
            </div>
            <ShieldCheck className="w-4 h-4 text-amber-500" />
          </div>
        </div>

        {/* Toolbar & Filters */}
        <div className="p-3 sm:p-4 bg-white border-b border-slate-200 flex flex-col sm:flex-row gap-2.5 items-center justify-between">
          <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto text-xs">
            <button
              type="button"
              onClick={() => setActiveFilter('all')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                activeFilter === 'all'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              الكل ({stats.total})
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('changed')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                activeFilter === 'changed'
                  ? 'bg-indigo-700 text-white shadow-xs'
                  : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
              }`}
            >
              درجات محدثة زمنياً ({stats.changedCount})
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('promoted')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                activeFilter === 'promoted'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
              }`}
            >
              ترقيات لاحقة ({stats.promotedCount})
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('418')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                activeFilter === '418'
                  ? 'bg-amber-700 text-white shadow-xs'
                  : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
              }`}
            >
              سجلات 418 ({stats.historical418Count})
            </button>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="بحث بالاسم أو رقم الملف أو الدرجة..."
                className="w-full pr-8 pl-3 py-1.5 bg-gray-50 border border-gray-300 rounded-lg text-xs font-semibold focus:outline-hidden focus:border-indigo-500"
              />
            </div>
            <button
              type="button"
              onClick={handleExportExcel}
              className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors shrink-0 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>تصدير Excel</span>
            </button>
          </div>
        </div>

        {/* Content Body: Table + Drawer/Detail */}
        <div className="flex-1 overflow-auto p-3 sm:p-4">
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-right text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 whitespace-nowrap">
                  <th className="py-2.5 px-3">#</th>
                  <th className="py-2.5 px-3">الموظف</th>
                  <th className="py-2.5 px-3 bg-slate-200/50">First Recorded Grade<br/><span className="text-[10px] text-gray-500 font-normal">الدرجة الأولى المسجلة</span></th>
                  <th className="py-2.5 px-3">Latest Historical<br/><span className="text-[10px] text-gray-500 font-normal">أحدث تصنيف 418</span></th>
                  <th className="py-2.5 px-3">Latest General<br/><span className="text-[10px] text-gray-500 font-normal">أحدث درجة عامة</span></th>
                  <th className="py-2.5 px-3">Latest Grade Action<br/><span className="text-[10px] text-gray-500 font-normal">أحدث إجراء مغير</span></th>
                  <th className="py-2.5 px-3">Effective Date<br/><span className="text-[10px] text-gray-500 font-normal">تاريخ النفاذ</span></th>
                  <th className="py-2.5 px-3 bg-indigo-100/70 text-indigo-950">Displayed Current Grade<br/><span className="text-[10px] text-indigo-700 font-bold">الدرجة الحالية المعروضة</span></th>
                  <th className="py-2.5 px-3 text-center">التفاصيل</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredList.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-gray-500">
                      لا توجد سجلات مطابقة لمعايير البحث الحالية
                    </td>
                  </tr>
                ) : (
                  filteredList.map(({ emp, info }, idx) => {
                    const isSelected = selectedAuditEmpId === emp.id;
                    const isDiff = info.isDifferentFromRecorded;

                    return (
                      <tr 
                        key={emp.id} 
                        onClick={() => setSelectedAuditEmpId(emp.id)}
                        className={`hover:bg-indigo-50/50 transition-colors cursor-pointer ${
                          isSelected ? 'bg-indigo-50 font-bold' : idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'
                        }`}
                      >
                        <td className="py-2 px-3 font-mono text-gray-500">{idx + 1}</td>
                        <td className="py-2 px-3 whitespace-nowrap">
                          <div className="font-bold text-slate-900">{emp.fullName}</div>
                          <div className="text-[11px] font-mono text-gray-500">ملف: {emp.jobNumber || emp.id}</div>
                        </td>

                        {/* First Recorded Grade */}
                        <td className="py-2 px-3 whitespace-nowrap bg-slate-100/40 text-slate-700">
                          {info.firstRecordedGrade}
                        </td>

                        {/* Latest Historical Grade */}
                        <td className="py-2 px-3 whitespace-nowrap text-amber-800 font-mono text-[11px]">
                          {info.latestHistoricalGrade}
                        </td>

                        {/* Latest General Grade */}
                        <td className="py-2 px-3 whitespace-nowrap font-semibold text-slate-800">
                          {info.latestGeneralGrade}
                        </td>

                        {/* Latest Grade Action */}
                        <td className="py-2 px-3 whitespace-nowrap">
                          <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            info.latestGradeAction.includes('ترقية')
                              ? 'bg-emerald-100 text-emerald-800'
                              : info.latestGradeAction.includes('تسوية')
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-gray-100 text-gray-700'
                          }`}>
                            {info.latestGradeAction}
                          </span>
                        </td>

                        {/* Effective Date */}
                        <td className="py-2 px-3 whitespace-nowrap font-mono text-gray-600 text-[11px]">
                          {info.effectiveDate || '-'}
                        </td>

                        {/* Displayed Current Grade */}
                        <td className="py-2 px-3 whitespace-nowrap bg-indigo-50/80">
                          <div className="flex items-center gap-1.5">
                            <span className="font-black text-indigo-950 text-xs">
                              {info.displayedCurrentGrade}
                            </span>
                            <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-1 rounded">
                              +{info.currentIncrement}
                            </span>
                            {isDiff && (
                              <span className="inline-flex items-center px-1.5 py-0.2 text-[9px] font-bold bg-emerald-100 text-emerald-800 rounded">
                                محدثة زمنياً
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Detail Trigger */}
                        <td className="py-2 px-3 text-center whitespace-nowrap">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedAuditEmpId(emp.id);
                            }}
                            className="text-indigo-600 hover:text-indigo-800 font-bold text-[11px] underline"
                          >
                            عرض المسيرة ({info.chronologicalEventsCount})
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Selected Employee Chronological Audit Trail Card */}
          {selectedDetail && (
            <div className="mt-4 p-4 bg-slate-900 text-white rounded-xl shadow-lg border border-indigo-800 text-xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-700 pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
                  <h3 className="font-black text-sm text-white">
                    التتبع الزمني للموظف: {selectedDetail.emp.fullName} (رقم الملف: {selectedDetail.emp.jobNumber})
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">الدرجة المعروضة الحالية:</span>
                  <span className="bg-emerald-600 text-white font-black px-2 py-0.5 rounded text-xs">
                    {selectedDetail.info.displayedCurrentGrade} (+{selectedDetail.info.currentIncrement})
                  </span>
                </div>
              </div>

              {/* 6 Core Fields Quick Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 bg-slate-800/80 p-3 rounded-lg border border-slate-700 text-[11px]">
                <div>
                  <span className="text-gray-400 block">First Recorded Grade</span>
                  <strong className="text-amber-200">{selectedDetail.info.firstRecordedGrade}</strong>
                </div>
                <div>
                  <span className="text-gray-400 block">Latest Historical Grade</span>
                  <strong className="text-amber-300">{selectedDetail.info.latestHistoricalGrade}</strong>
                </div>
                <div>
                  <span className="text-gray-400 block">Latest General Grade</span>
                  <strong className="text-emerald-300">{selectedDetail.info.latestGeneralGrade}</strong>
                </div>
                <div>
                  <span className="text-gray-400 block">Latest Grade Action</span>
                  <strong className="text-blue-300">{selectedDetail.info.latestGradeAction}</strong>
                </div>
                <div>
                  <span className="text-gray-400 block">Effective Date</span>
                  <strong className="text-purple-300 font-mono">{selectedDetail.info.effectiveDate || '-'}</strong>
                </div>
                <div>
                  <span className="text-gray-400 block">Displayed Grade</span>
                  <strong className="text-emerald-400 font-black">{selectedDetail.info.displayedCurrentGrade}</strong>
                </div>
              </div>

              {/* Audit Trail List */}
              <div className="space-y-1 text-[11px] font-mono bg-slate-950 p-3 rounded-lg border border-slate-800 max-h-48 overflow-y-auto">
                <div className="text-gray-400 font-bold mb-1">تسلسل الأحداث وقرارات الترقية والعلاوات:</div>
                {selectedDetail.info.auditTrail.map((log, i) => (
                  <div key={i} className="text-slate-300 leading-relaxed">
                    {log}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 bg-slate-100 border-t border-slate-200 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-gray-600">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span>نظام التدقيق الزمني نشط: جميع الدرجات المعروضة مستخرجة من أحدث إجراء رسمي نافذ.</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg font-bold transition-colors cursor-pointer"
          >
            إغلاق
          </button>
        </div>

      </div>
    </div>
  );
};
