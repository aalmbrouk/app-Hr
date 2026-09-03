import React, { useState, useRef } from 'react';
import { PromotionEligibilityResult } from '../types';
import { exportElementToPdf } from '../utils/pdfExport';
import { 
  Printer, 
  FileDown, 
  FileSpreadsheet, 
  X, 
  Search, 
  Filter, 
  Building2, 
  Award, 
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Clock,
  HelpCircle
} from 'lucide-react';

interface OfficialPromotionReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportData: PromotionEligibilityResult[];
  officialLogoUrl?: string;
  generalManagerName?: string;
  currentUser?: string;
}

export const OfficialPromotionReportModal: React.FC<OfficialPromotionReportModalProps> = ({
  isOpen,
  onClose,
  reportData,
  officialLogoUrl = '',
  generalManagerName = 'نجيب صالح سالم',
  currentUser = 'مسؤول شؤون الموظفين'
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('الكل');
  const [filterDept, setFilterDept] = useState<string>('الكل');
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  // Distinct departments
  const departments = Array.from(new Set(reportData.map((r) => r.department))).filter(Boolean);

  const filteredData = reportData.filter((item) => {
    const matchSearch = !searchTerm.trim() || 
      item.fullName.includes(searchTerm) || 
      item.jobNumber.includes(searchTerm) ||
      item.currentGrade.includes(searchTerm);

    const matchStatus = filterStatus === 'الكل' || item.statusArabic === filterStatus;
    const matchDept = filterDept === 'الكل' || item.department === filterDept;

    return matchSearch && matchStatus && matchDept;
  });

  const handlePrint = () => {
    window.print();
  };

  const handleExportPdf = async () => {
    if (!printRef.current) return;
    setIsExportingPdf(true);
    try {
      await exportElementToPdf(
        printRef.current,
        `تقرير_الترقيات_والاستحقاق_الوظيفي_${new Date().toISOString().slice(0, 10)}.pdf`,
        { orientation: 'landscape' }
      );
    } catch (e) {
      console.error('PDF Export error:', e);
      alert('حدث خطأ أثناء تصدير ملف PDF. يرجى تجربة الطباعة بدلاً من ذلك.');
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleExportCsv = () => {
    const headers = [
      'رقم الملف / الوظيفي',
      'اسم الموظف',
      'الدرجة الحالية',
      'تاريخ الدرجة الحالية',
      'عدد العلاوات المؤهلة الفعلية',
      'العلاوات المطلوبة للترشح',
      'أهلية الترشح للترقية',
      'تقرير الكفاءة',
      'آخر ترقية سابقة',
      'الدرجة التالية المرشح لها',
      'حالة القرار',
      'رقم القرار',
      'تاريخ القرار'
    ];

    const rows = filteredData.map((item) => [
      `"${item.jobNumber}"`,
      `"${item.fullName}"`,
      `"${item.currentGrade}"`,
      `"${item.currentGradeDateDisplay}"`,
      item.qualifyingIncrements,
      item.requiredIncrements,
      `"${item.statusArabic}"`,
      `"${item.competencyRating}"`,
      `"${item.lastPromotionDate || 'لا توجد'}"`,
      `"${item.nextGrade}"`,
      `"${item.decisionStatus}"`,
      `"${item.officialDecisionNumber || '-'}"`,
      `"${item.officialDecisionDate || '-'}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `تقرير_الترقيات_الرسمي_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusBadgeClass = (statusArabic: string) => {
    switch (statusArabic) {
      case 'تمت الترقية بقرار رسمي':
        return 'bg-emerald-100 text-emerald-900 border-emerald-300';
      case 'مستوفٍ للحد الأدنى للترشح':
        return 'bg-blue-100 text-blue-900 border-blue-300';
      case 'مستحق للعرض/المفاضلة':
        return 'bg-purple-100 text-purple-900 border-purple-300';
      case 'يحتاج إلى مراجعة':
        return 'bg-amber-100 text-amber-900 border-amber-300';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-300';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-7xl w-full border border-slate-200 overflow-hidden my-4 flex flex-col max-h-[92vh]">
        
        {/* Header - No Print */}
        <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center border border-emerald-400">
              <Award className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold">كشف وتقرير الترقيات الرسمي (قانون علاقات العمل رقم 12 لسنة 2010)</h3>
              <p className="text-xs text-slate-300">
                تقرير استحقاق وأهلية الترشح والقرارات الصادرة وفق المنظومة الإدارية الليبية
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCsv}
              className="px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-800 text-white hover:bg-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              title="تصدير ملف Excel / CSV"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span className="hidden sm:inline">Excel</span>
            </button>
            <button
              onClick={handleExportPdf}
              disabled={isExportingPdf}
              className="px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-800 text-white hover:bg-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              {isExportingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4 text-rose-400" />}
              <span className="hidden sm:inline">تصدير PDF</span>
            </button>
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة الكشف</span>
            </button>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-colors mr-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter Controls - No Print */}
        <div className="bg-slate-50 border-b border-slate-200 p-3 sm:p-4 grid grid-cols-1 sm:grid-cols-3 gap-3 print:hidden text-right">
          <div className="relative">
            <Search className="w-4 h-4 absolute right-3 top-3 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="بحث بالاسم أو الرقم الوظيفي أو الدرجة..."
              className="w-full text-xs pr-9 pl-3 py-2 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-emerald-600 outline-none"
            />
          </div>

          <div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full text-xs py-2 px-3 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-emerald-600 outline-none"
            >
              <option value="الكل">كافة الحالات القانونية</option>
              <option value="مستوفٍ للحد الأدنى للترشح">مستوفٍ للحد الأدنى للترشح</option>
              <option value="مستحق للعرض/المفاضلة">مستحق للعرض/المفاضلة</option>
              <option value="تمت الترقية بقرار رسمي">تمت الترقية بقرار رسمي</option>
              <option value="غير مستحق حالياً">غير مستحق حالياً</option>
              <option value="يحتاج إلى مراجعة">يحتاج إلى مراجعة</option>
            </select>
          </div>

          <div>
            <select
              value={filterDept}
              onChange={(e) => setFilterDept(e.target.value)}
              className="w-full text-xs py-2 px-3 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-emerald-600 outline-none"
            >
              <option value="الكل">كافة الإدارات والأقسام</option>
              {departments.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Legal Advisory - No Print */}
        <div className="bg-blue-50 border-b border-blue-200 p-3 px-6 text-xs text-blue-900 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-blue-700 flex-shrink-0" />
            <span>
              <span className="font-bold">ملاحظة نظامية:</span> استيفاء الحد الأدنى للترشح وفق عدد العلاوات المؤهلة لا يعني الترقية التلقائية. يشترط لاعتماد الترقية صدور قرار رسمي معتمد من السلطة المختصة.
            </span>
          </div>
          <span className="font-bold text-slate-700">إجمالي السجلات: {filteredData.length}</span>
        </div>

        {/* Printable Document Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-white" ref={printRef}>
          
          {/* Official Libyan Header */}
          <div className="text-center border-b-2 border-slate-800 pb-4 mb-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-right text-xs font-bold text-slate-800 space-y-0.5">
                <p>دولة ليبيا</p>
                <p>وزارة الصحة</p>
                <p>مصرف الدم المركزي المرج</p>
                <p>قسم الشؤون الإدارية والخدمات</p>
              </div>

              {officialLogoUrl ? (
                <img src={officialLogoUrl} alt="الشعار" className="w-16 h-16 object-contain" />
              ) : (
                <div className="w-16 h-16 rounded-full border-2 border-slate-800 flex items-center justify-center font-bold text-xs text-slate-800">
                  شعار
                </div>
              )}

              <div className="text-left text-xs font-semibold text-slate-700 space-y-0.5">
                <p>التاريخ: {new Date().toLocaleDateString('ar-LY')}</p>
                <p>كود الوثيقة: PRM-REP-{new Date().getFullYear()}</p>
                <p>القانون المعتمد: قانون 12 لسنة 2010</p>
              </div>
            </div>

            <h2 className="text-base sm:text-lg font-black text-slate-900 underline underline-offset-4 mt-2">
              كشف استحقاق وأهلية الترقيات الوظيفية والقرارات الرسمية
            </h2>
            <p className="text-xs text-slate-600 mt-1">
              معد وفق ضوابط قانون علاقات العمل رقم 12 لسنة 2010 ولائحته التنفيذية
            </p>
          </div>

          {/* Table of 13 Columns */}
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse text-[11px] border border-slate-300">
              <thead className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                <tr>
                  <th className="p-2 border border-slate-300 text-center w-8">#</th>
                  <th className="p-2 border border-slate-300">رقم الملف / الوظيفي</th>
                  <th className="p-2 border border-slate-300">اسم الموظف</th>
                  <th className="p-2 border border-slate-300">الدرجة الحالية</th>
                  <th className="p-2 border border-slate-300">تاريخ الدرجة الحالية</th>
                  <th className="p-2 border border-slate-300 text-center">العلاوات المؤهلة الفعلية</th>
                  <th className="p-2 border border-slate-300 text-center">العلاوات المطلوبة</th>
                  <th className="p-2 border border-slate-300 text-center">أهلية الترشح للترقية</th>
                  <th className="p-2 border border-slate-300 text-center">تقرير الكفاءة</th>
                  <th className="p-2 border border-slate-300">آخر ترقية سابقة</th>
                  <th className="p-2 border border-slate-300">الدرجة المرشح لها</th>
                  <th className="p-2 border border-slate-300 text-center">حالة القرار</th>
                  <th className="p-2 border border-slate-300">رقم وتاريخ القرار</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredData.map((item, idx) => (
                  <tr key={item.employeeId} className="hover:bg-slate-50 transition-colors">
                    <td className="p-2 border border-slate-300 text-center font-bold text-slate-500">{idx + 1}</td>
                    <td className="p-2 border border-slate-300 font-mono font-bold text-slate-900">{item.jobNumber}</td>
                    <td className="p-2 border border-slate-300 font-semibold text-slate-900">
                      {item.fullName}
                      <span className="block text-[10px] text-slate-500 font-normal">{item.department}</span>
                    </td>
                    <td className="p-2 border border-slate-300 font-bold text-slate-800">{item.currentGrade}</td>
                    <td className="p-2 border border-slate-300 text-slate-700">{item.currentGradeDateDisplay}</td>
                    <td className="p-2 border border-slate-300 text-center font-bold text-emerald-800 bg-emerald-50/40">
                      {item.qualifyingIncrements}
                    </td>
                    <td className="p-2 border border-slate-300 text-center font-semibold text-slate-700">
                      {item.requiredIncrements}
                    </td>
                    <td className="p-2 border border-slate-300 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded-full font-bold text-[10px] border ${getStatusBadgeClass(item.statusArabic)}`}>
                        {item.statusArabic}
                      </span>
                    </td>
                    <td className="p-2 border border-slate-300 text-center">
                      <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                        item.competencyRating === 'غير متوفر' ? 'text-amber-700 bg-amber-50' : 'text-slate-800'
                      }`}>
                        {item.competencyRating}
                      </span>
                    </td>
                    <td className="p-2 border border-slate-300 text-slate-600">
                      {item.lastPromotionDate || 'لا توجد سابقة'}
                    </td>
                    <td className="p-2 border border-slate-300 font-bold text-blue-900">
                      {item.nextGrade}
                    </td>
                    <td className="p-2 border border-slate-300 text-center font-medium">
                      {item.decisionStatus}
                    </td>
                    <td className="p-2 border border-slate-300 text-[10px] text-slate-700">
                      {item.officialDecisionNumber ? (
                        <>
                          <span className="font-bold text-slate-900 block">{item.officialDecisionNumber}</span>
                          <span className="text-slate-500">{item.officialDecisionDate}</span>
                        </>
                      ) : (
                        <span className="text-slate-400">لا يوجد قرار</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Report Footer & Signatures */}
          <div className="mt-12 pt-6 border-t border-slate-400 grid grid-cols-3 gap-6 text-center text-xs">
            <div>
              <p className="font-bold text-slate-800 mb-8">إعداد مسؤول شؤون الموظفين</p>
              <p className="font-semibold text-slate-700">{currentUser}</p>
              <p className="text-[10px] text-slate-500">التوقيع: ...........................</p>
            </div>
            <div>
              <p className="font-bold text-slate-800 mb-8">رئيس قسم الشؤون الإدارية والخدمات</p>
              <p className="font-semibold text-slate-700">اعتماد ومطابقة</p>
              <p className="text-[10px] text-slate-500">التوقيع: ...........................</p>
            </div>
            <div>
              <p className="font-bold text-slate-800 mb-8">يعتمد / مدير عام مصرف الدم المركزي</p>
              <p className="font-semibold text-slate-700">{generalManagerName}</p>
              <p className="text-[10px] text-slate-500">التوقيع والختم الرسمي: ...........................</p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
