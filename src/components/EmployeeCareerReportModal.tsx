import React, { useState, useEffect } from 'react';
import { 
  Employee, 
  CareerPromotionRecord, 
  PromotionRecord, 
  IncrementRecord, 
  StatusSettlementRecord,
  CareerActionType
} from '../types';
import { 
  getEmployeeCareerHistory, 
  calculateEmployeeCareerSummary, 
  getCareerActionMeta 
} from '../utils/careerUtils';
import { formatDateDisplay } from '../utils/dateUtils';
import { exportElementToPdf } from '../utils/pdfExport';
import { 
  X, 
  Printer, 
  FileDown, 
  Check, 
  Loader2, 
  Award, 
  Zap, 
  ShieldAlert, 
  Calendar, 
  FileText, 
  Building2,
  TrendingUp,
  UserCheck,
  Plus
} from 'lucide-react';

interface EmployeeCareerReportModalProps {
  employee: Employee;
  careerRecords?: CareerPromotionRecord[];
  promotions?: PromotionRecord[];
  increments?: IncrementRecord[];
  settlements?: StatusSettlementRecord[];
  isOpen: boolean;
  onClose: () => void;
  onOpenAddModal?: () => void;
}

export const EmployeeCareerReportModal: React.FC<EmployeeCareerReportModalProps> = ({
  employee,
  careerRecords = [],
  promotions = [],
  increments = [],
  settlements = [],
  isOpen,
  onClose,
  onOpenAddModal
}) => {
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const history = getEmployeeCareerHistory(
    employee.id,
    careerRecords,
    promotions,
    increments,
    settlements
  );

  const summary = calculateEmployeeCareerSummary(
    employee,
    careerRecords,
    promotions,
    increments,
    settlements
  );

  const handleExportPdf = async () => {
    setIsExportingPdf(true);
    setExportSuccess(false);
    const safeName = `سجل_الترقيات_والعلاوات_${employee.jobNumber}_${employee.fullName.replace(/\s+/g, '_')}`;
    try {
      const success = await exportElementToPdf('PRINT_EMPLOYEE_CAREER_REPORT', safeName, {
        orientation: 'portrait',
        margin: 6,
        scale: 2.2
      });
      if (success) {
        setExportSuccess(true);
        setTimeout(() => setExportSuccess(false), 3000);
      }
    } catch (err) {
      console.error('PDF export error:', err);
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 overflow-y-auto print:p-0 print:bg-white print:static"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        id="PRINT_EMPLOYEE_CAREER_REPORT"
        className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full p-8 border border-gray-300 print:shadow-none print:border-none print:w-full space-y-6 text-right relative font-sans my-auto"
      >
        {/* Screen Toolbar */}
        <div className="flex flex-wrap justify-between items-center print:hidden bg-slate-100 p-3 rounded-xl border border-slate-200 gap-2">
          <button
            onClick={onClose}
            type="button"
            className="px-4 py-2 bg-slate-700 hover:bg-slate-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
            <span>إغلاق</span>
          </button>

          <div className="flex items-center gap-2">
            {onOpenAddModal && (
              <button
                onClick={() => {
                  onClose();
                  onOpenAddModal();
                }}
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة سجل وظيفي جديد</span>
              </button>
            )}

            <button
              onClick={handleExportPdf}
              disabled={isExportingPdf}
              type="button"
              className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer ${
                exportSuccess
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-800 hover:bg-slate-900 text-white'
              } disabled:opacity-50`}
            >
              {isExportingPdf ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-amber-300" />
                  <span>جاري إنشاء PDF...</span>
                </>
              ) : exportSuccess ? (
                <>
                  <Check className="w-4 h-4 text-emerald-200" />
                  <span>تم تصدير PDF</span>
                </>
              ) : (
                <>
                  <FileDown className="w-4 h-4 text-amber-400" />
                  <span>تصدير PDF</span>
                </>
              )}
            </button>

            <button
              onClick={() => window.print()}
              type="button"
              className="px-5 py-2 bg-red-700 hover:bg-red-800 text-white rounded-lg text-xs font-bold flex items-center gap-2 shadow-md transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة</span>
            </button>
          </div>
        </div>

        {/* Official Header */}
        <div className="border-b-2 border-red-800 pb-4">
          <div className="flex justify-between items-center">
            <div className="text-right space-y-1">
              <h3 className="text-xs font-extrabold text-gray-700">دولة ليبيا — وزارة الصحة</h3>
              <h1 className="text-xl font-black text-red-900 tracking-wide">مصرف الدم المركزي بلدية المرج</h1>
              <p className="text-xs font-bold text-gray-600">إدارة الشؤون الإدارية والمالية — قسم الموارد البشرية وشؤون الموظفين</p>
            </div>

            <div className="flex flex-col items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-red-50 border-2 border-red-700 flex items-center justify-center shadow-inner">
                <svg className="w-10 h-10 text-red-700" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
                </svg>
              </div>
              <span className="text-[10px] font-black text-red-800 mt-1">مصرف الدم المركزي</span>
            </div>

            <div className="text-left font-mono text-xs text-gray-600 space-y-1">
              <div>تاريخ الاستخراج: <strong className="text-gray-900">{formatDateDisplay(new Date().toISOString().slice(0, 10))}</strong></div>
              <div>الرقم الوظيفي: <strong className="text-red-900 font-bold">{employee.jobNumber}</strong></div>
              <div>الرقم الوطني: <strong className="text-gray-900">{employee.nationalId}</strong></div>
            </div>
          </div>

          <div className="mt-3 bg-red-900 text-white text-center py-2 rounded-lg font-black text-sm tracking-wider shadow-sm flex items-center justify-center gap-2">
            <Award className="w-5 h-5 text-amber-300" />
            <span>السجل الوظيفي للترقيات والعلاوات والندب على الدرجة للموظف</span>
          </div>
        </div>

        {/* Employee Profile Information Strip */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div>
            <span className="text-gray-500 block text-[11px]">اسم الموظف الرباعي:</span>
            <strong className="text-gray-900 text-sm font-black">{employee.fullName}</strong>
          </div>
          <div>
            <span className="text-gray-500 block text-[11px]">القسم / الإدارة:</span>
            <strong className="text-gray-900 font-bold">{employee.department}</strong>
          </div>
          <div>
            <span className="text-gray-500 block text-[11px]">المسمى الوظيفي:</span>
            <strong className="text-gray-900 font-bold">{employee.jobTitle}</strong>
          </div>
          <div>
            <span className="text-gray-500 block text-[11px]">تاريخ المباشرة الأصلية:</span>
            <strong className="text-gray-900 font-mono">{formatDateDisplay(employee.directingDate || employee.hireDate || '')}</strong>
          </div>
        </div>

        {/* Career Summary Statistics Grid (MANDATORY REQUIREMENT) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-2.5 text-center">
          <div className="bg-red-50 border border-red-200 rounded-xl p-2.5 text-red-950">
            <span className="text-[11px] font-bold block text-red-800">عدد الترقيات</span>
            <span className="text-xl font-black text-red-900">{summary.promotionsCount}</span>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-2.5 text-blue-950">
            <span className="text-[11px] font-bold block text-blue-800">عدد العلاوات الدورية</span>
            <span className="text-xl font-black text-blue-900">{summary.annualIncrementsCount}</span>
          </div>

          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-2.5 text-emerald-950">
            <span className="text-[11px] font-bold block text-emerald-800">عدد مرات الندب على درجة</span>
            <span className="text-xl font-black text-emerald-900">{summary.secondmentToGradeCount}</span>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-2.5 text-amber-950">
            <span className="text-[11px] font-bold block text-amber-800">الترقيات الاستثنائية</span>
            <span className="text-xl font-black text-amber-900">{summary.exceptionalPromotionsCount}</span>
          </div>

          <div className="bg-purple-50 border border-purple-200 rounded-xl p-2.5 text-purple-950 col-span-2 sm:col-span-4 md:col-span-1">
            <span className="text-[11px] font-bold block text-purple-800">تسويات الوضع</span>
            <span className="text-xl font-black text-purple-900">{summary.statusSettlementsCount}</span>
          </div>
        </div>

        {/* Current Grade and Dates Ribbon */}
        <div className="bg-amber-50/70 border border-amber-300/80 rounded-xl p-3 grid grid-cols-2 md:grid-cols-4 gap-2 text-xs font-bold text-gray-800">
          <div>
            <span className="text-gray-500 font-normal block text-[10px]">الدرجة الحالية:</span>
            <span className="text-red-900 font-extrabold">{summary.currentGrade}</span>
          </div>
          <div>
            <span className="text-gray-500 font-normal block text-[10px]">عدد العلاوات الحالية:</span>
            <span className="text-blue-900 font-extrabold">{summary.currentIncrement} علاوة</span>
          </div>
          <div>
            <span className="text-gray-500 font-normal block text-[10px]">تاريخ آخر ترقية:</span>
            <span className="font-mono">{formatDateDisplay(summary.lastPromotionDate)}</span>
          </div>
          <div>
            <span className="text-gray-500 font-normal block text-[10px]">تاريخ آخر علاوة دورية:</span>
            <span className="font-mono">{formatDateDisplay(summary.lastAnnualIncrementDate)}</span>
          </div>
        </div>

        {/* Chronological History Table */}
        <div className="border border-gray-300 rounded-xl overflow-hidden">
          <div className="bg-gray-100 px-4 py-2.5 border-b border-gray-300 flex justify-between items-center">
            <span className="font-bold text-gray-900 text-xs">التسلسل الزمني للإجراءات والقرارات الوظيفية</span>
            <span className="text-[11px] text-gray-600 font-mono">إجمالي السجلات: {history.length}</span>
          </div>

          <table className="w-full text-right text-xs">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-700 font-bold text-[11px]">
              <tr>
                <th className="py-2.5 px-3">التاريخ</th>
                <th className="py-2.5 px-3">نوع الإجراء</th>
                <th className="py-2.5 px-3">الدرجة السابقة</th>
                <th className="py-2.5 px-3">الدرجة الممنوحة</th>
                <th className="py-2.5 px-3">عدد العلاوات</th>
                <th className="py-2.5 px-3">رقم القرار</th>
                <th className="py-2.5 px-3">الجهة المصدرة للقرار</th>
                <th className="py-2.5 px-3">البيان والملاحظات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-[11px]">
              {history.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-gray-500">
                    لا توجد سجلات ترقيات أو علاوات سابقة مسجلة لهذا الموظف
                  </td>
                </tr>
              ) : (
                history.map((rec) => {
                  const meta = getCareerActionMeta(rec.actionType);
                  return (
                    <tr key={rec.id} className="hover:bg-gray-50/80">
                      <td className="py-2.5 px-3 font-mono dir-ltr text-right font-bold text-gray-800">
                        {formatDateDisplay(rec.actionDate || rec.decisionDate)}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${meta.badgeColor}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${meta.dotColor}`}></span>
                          {meta.label}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-gray-600">
                        {rec.previousGrade ? (
                          <span>{rec.previousGrade} {rec.previousIncrement !== undefined ? `(${rec.previousIncrement} علاوة)` : ''}</span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-gray-900">
                        {rec.newGrade || '—'}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-blue-900">
                        {rec.newIncrement !== undefined ? `${rec.newIncrement} علاوة` : '—'}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-red-900 font-mono">
                        {rec.decisionNumber || '—'}
                      </td>
                      <td className="py-2.5 px-3 text-gray-700 text-[10px]">
                        {rec.issuingAuthority || 'مصرف الدم المركزي'}
                      </td>
                      <td className="py-2.5 px-3 text-gray-500 text-[10px] max-w-xs truncate">
                        {rec.notes || '—'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Official Signatures and Stamp */}
        <div className="pt-4 border-t space-y-4">
          <div className="grid grid-cols-3 gap-4 text-center text-xs">
            <div className="border border-gray-200 rounded-xl p-3 space-y-6 bg-gray-50/50">
              <div className="font-bold text-gray-800">رئيس وحدة الموارد البشرية والترقيات</div>
              <div className="text-gray-400 text-[10px]">التوقيع: .....................</div>
            </div>

            <div className="border border-gray-200 rounded-xl p-3 space-y-6 bg-gray-50/50">
              <div className="font-bold text-gray-800">مدير إدارة الشؤون الإدارية والمالية</div>
              <div className="text-gray-400 text-[10px]">التوقيع: .....................</div>
            </div>

            <div className="border border-red-200 rounded-xl p-3 space-y-6 bg-red-50/30">
              <div className="font-extrabold text-red-900">المدير العام لمصرف الدم المركزي</div>
              <div className="text-gray-400 text-[10px]">الاعتماد الرسمي: ...........</div>
            </div>
          </div>

          {/* Stamp & Verification */}
          <div className="flex justify-between items-center text-xs pt-2">
            <p className="text-[10px] text-gray-500">
              مستخرج رسمي من السجل الوظيفي الإلكتروني لمصرف الدم المركزي بلدية المرج — معتمد ومطابق للأرشيف.
            </p>

            <div className="w-28 h-28 border-2 border-dashed border-red-700 rounded-full flex flex-col items-center justify-center text-center p-2 text-[9px] text-red-800 font-bold bg-red-50/40">
              <span>ختم المصرف الرسمي</span>
              <span className="text-[7px] text-gray-400 mt-1">التاريخ: ../../20..</span>
            </div>
          </div>
        </div>

        {/* Screen Bottom Controls */}
        <div className="print:hidden pt-4 border-t-2 border-gray-200 flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={onClose}
            type="button"
            className="px-6 py-2.5 bg-slate-700 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm cursor-pointer"
          >
            <X className="w-4 h-4" />
            <span>إغلاق</span>
          </button>

          <button
            onClick={() => window.print()}
            type="button"
            className="px-6 py-2.5 bg-red-700 hover:bg-red-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>طباعة السجل الرسمي (A4)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
