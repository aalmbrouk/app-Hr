import React, { useState, useMemo } from 'react';
import { Employee, PromotionRecord, IncrementRecord, StatusSettlementRecord, HrRule } from '../types';
import { calculatePromotionRecommendation, calculateAnnualIncrements, formatDateDisplay } from '../utils/dateUtils';
import { DEPARTMENTS } from '../data/initialData';
import { exportElementToPdf } from '../utils/pdfExport';
import { 
  TrendingUp, 
  Award, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Zap, 
  Printer,
  Filter,
  Search,
  Check,
  X,
  Building2,
  Calendar,
  FileDown,
  Loader2
} from 'lucide-react';

interface PromotionsIncrementsViewProps {
  employees: Employee[];
  promotions: PromotionRecord[];
  increments: IncrementRecord[];
  settlements: StatusSettlementRecord[];
  rules: HrRule[];
  onAddPromotion: (promo: PromotionRecord) => void;
  onAddIncrement: (inc: IncrementRecord) => void;
  onAddSettlement: (settle: StatusSettlementRecord) => void;
  onUpdateEmployeeGrade: (employeeId: number, newGrade: string, newIncrement: number) => void;
}

export const PromotionsIncrementsView: React.FC<PromotionsIncrementsViewProps> = ({
  employees,
  promotions,
  increments,
  settlements,
  rules,
  onAddPromotion,
  onAddIncrement,
  onAddSettlement,
  onUpdateEmployeeGrade
}) => {
  const [activeTab, setActiveTab] = useState<'eligibility' | 'promotions' | 'increments'>('eligibility');
  const [isPromoModalOpen, setIsPromoModalOpen] = useState(false);
  const [isIncModalOpen, setIsIncModalOpen] = useState(false);
  const [isPrintReportOpen, setIsPrintReportOpen] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('الكل');
  const [selectedCategory, setSelectedCategory] = useState('الكل');
  const [selectedStatus, setSelectedStatus] = useState('الكل');

  // Form states for Promotion
  const [promoEmpId, setPromoEmpId] = useState<number>(employees[0]?.id || 1001);
  const [promoType, setPromoType] = useState<PromotionRecord['promotionType']>('ترقية عادية');
  const [promoNewGrade, setPromoNewGrade] = useState('الدرجة السابعة');
  const [promoDecisionNo, setPromoDecisionNo] = useState('');
  const [promoReason, setPromoReason] = useState('');

  // Form states for Increment
  const [incEmpId, setIncEmpId] = useState<number>(employees[0]?.id || 1001);
  const [incNewVal, setIncNewVal] = useState<number>(2);
  const [incType, setIncType] = useState<IncrementRecord['incrementType']>('تلقائية');
  const [incDecisionNo, setIncDecisionNo] = useState('');

  // Selected for batch promotion
  const [selectedEmpIds, setSelectedEmpIds] = useState<number[]>([]);

  // Calculated promotion recommendations list
  const recommendationList = useMemo(() => {
    return employees.map((emp) => {
      const rec = calculatePromotionRecommendation(emp, rules);
      const inc = calculateAnnualIncrements(emp);
      return {
        emp,
        rec,
        inc
      };
    });
  }, [employees, rules]);

  // Filtered recommendations
  const filteredList = useMemo(() => {
    return recommendationList.filter(({ emp, rec }) => {
      const matchSearch = !searchTerm.trim() || 
        emp.fullName.includes(searchTerm) || 
        emp.jobNumber.includes(searchTerm) ||
        emp.nationalId.includes(searchTerm);
      
      const matchDept = selectedDept === 'الكل' || emp.department === selectedDept;
      const matchCat = selectedCategory === 'الكل' || emp.assignmentCategory === selectedCategory;
      const matchStatus = selectedStatus === 'الكل' || rec.status === selectedStatus;

      return matchSearch && matchDept && matchCat && matchStatus;
    });
  }, [recommendationList, searchTerm, selectedDept, selectedCategory, selectedStatus]);

  const eligibleCount = recommendationList.filter((r) => r.rec.status === 'مستحق للترقية').length;
  const approachingCount = recommendationList.filter((r) => r.rec.status === 'قريب من الاستحقاق').length;

  const handlePromoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const emp = employees.find((x) => x.id === promoEmpId);
    if (!emp) return;

    const record: PromotionRecord = {
      id: `PRM-${new Date().getFullYear()}-${String(promotions.length + 1).padStart(3, '0')}`,
      employeeId: promoEmpId,
      fileNumber: emp.jobNumber,
      previousGrade: emp.jobGrade,
      previousGradeName: emp.jobGrade,
      previousIncrement: emp.currentIncrement,
      newGrade: promoNewGrade,
      newGradeName: promoNewGrade,
      newIncrement: 1,
      promotionType: promoType,
      decisionNumber: promoDecisionNo || `ق/ت/2026/${Math.floor(Math.random() * 800) + 100}`,
      decisionDate: new Date().toISOString().slice(0, 10),
      effectiveDate: new Date().toISOString().slice(0, 10),
      eligibilityDate: `${new Date().getFullYear() + 4}-01-01`,
      reason: promoReason || (promoType === 'ترقية استثنائية' ? 'ترقية استثنائية بقرار مدير عام المصرف' : 'استيفاء الشروط والمدّة القانونية'),
      notes: 'تم حفظ قرار الترقية وتحديث سجلات الدرجة والعلاوات بالأنظمة',
      createdBy: 'المستخدم الحالي',
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 19)
    };

    onAddPromotion(record);
    onUpdateEmployeeGrade(promoEmpId, promoNewGrade, 1);
    setIsPromoModalOpen(false);
  };

  const handleIncSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const emp = employees.find((x) => x.id === incEmpId);
    if (!emp) return;

    const record: IncrementRecord = {
      id: `INC-${new Date().getFullYear()}-${String(increments.length + 1).padStart(3, '0')}`,
      employeeId: incEmpId,
      previousGrade: emp.jobGrade,
      previousIncrement: emp.currentIncrement || 1,
      newIncrement: incNewVal,
      effectiveDate: new Date().toISOString().slice(0, 10),
      incrementType: incType,
      decisionNumber: incDecisionNo || `قرار علاوة ${Math.floor(Math.random() * 500) + 100}`,
      notes: 'إضافة علاوة دورية مسجلة بالنظام',
      createdBy: 'المستخدم الحالي',
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 19)
    };

    onAddIncrement(record);
    onUpdateEmployeeGrade(incEmpId, emp.jobGrade, incNewVal);
    setIsIncModalOpen(false);
  };

  // Requirement: Batch Promtion Execution
  const handleBatchPromotions = () => {
    const eligibleToPromote = recommendationList.filter(r => r.rec.status === 'مستحق للترقية');
    if (eligibleToPromote.length === 0) {
      alert('لا يوجد موظفون مستحقون للترقية حالياً وفق الضوابط والقوانين المعمول بها.');
      return;
    }

    if (!window.confirm(`هل أنت ألكيد من تطبيق الترقيات الجماعية لعدد ${eligibleToPromote.length} موظف مستحق للترقية؟`)) {
      return;
    }

    let count = 0;
    eligibleToPromote.forEach(({ emp, rec }) => {
      const record: PromotionRecord = {
        id: `PRM-${new Date().getFullYear()}-${Math.floor(Math.random() * 9000) + 1000}`,
        employeeId: emp.id,
        fileNumber: emp.jobNumber,
        previousGrade: emp.jobGrade,
        previousGradeName: emp.jobGrade,
        previousIncrement: emp.currentIncrement || 1,
        newGrade: rec.recommendedNewGrade,
        newGradeName: rec.recommendedNewGrade,
        newIncrement: 1, // Reset increment to 1 on new promotion
        promotionType: 'ترقية عادية',
        decisionNumber: `قرار-ترقية-${new Date().getFullYear()}/${Math.floor(Math.random() * 800) + 100}`,
        decisionDate: new Date().toISOString().slice(0, 10),
        effectiveDate: new Date().toISOString().slice(0, 10),
        reason: 'اعتماد الترقيات الجماعية بناءً على استيفاء المدّة القانونية وتاريخ الدرجة الحالية',
        notes: 'ترقية دورية معتمدة بالنظام',
        createdBy: 'نظام الترقيات الجماعي',
        createdAt: new Date().toISOString().replace('T', ' ').slice(0, 19)
      };

      onAddPromotion(record);
      onUpdateEmployeeGrade(emp.id, rec.recommendedNewGrade, 1);
      count++;
    });

    alert(`تم بنجاح اعتماد وترقية ${count} موظف وتحديث درجاتهم وعلاواتهم بالأنظمة!`);
  };

  // Requirement #8: Automatic Annual Increments Batch Processing
  const handleBatchAnnualIncrements = () => {
    let applied = 0;
    employees.forEach((emp) => {
      const incCalc = calculateAnnualIncrements(emp);
      if (incCalc.incrementsDue > 0 && incCalc.recommendedIncrement > emp.currentIncrement) {
        const record: IncrementRecord = {
          id: `INC-${new Date().getFullYear()}-${Math.floor(Math.random() * 9000) + 1000}`,
          employeeId: emp.id,
          previousGrade: emp.jobGrade,
          previousIncrement: emp.currentIncrement || 1,
          newIncrement: incCalc.recommendedIncrement,
          effectiveDate: new Date().toISOString().slice(0, 10),
          incrementType: 'تلقائية',
          decisionNumber: `علاوة-تلقائية-${new Date().getFullYear()}`,
          notes: 'علاوة دورية سنوية احتساب تلقائي استناداً لتاريخ استحقاق العلاوات',
          createdBy: 'نظام العلاوات السنوية التلقائي',
          createdAt: new Date().toISOString().replace('T', ' ').slice(0, 19)
        };
        onAddIncrement(record);
        onUpdateEmployeeGrade(emp.id, emp.jobGrade, incCalc.recommendedIncrement);
        applied++;
      }
    });

    alert(`تم احتساب وتطبيق العلاوات السنوية التلقائية لعدد ${applied} موظف مستحق بنجاح!`);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header Card */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-red-700 font-bold text-xs mb-1">
            <TrendingUp className="w-4 h-4" />
            <span>وحدة الشؤون الوظيفية والترقيات</span>
          </div>
          <h1 className="text-xl font-extrabold text-gray-900">إدارة الدرجات والترقيات والعلاوات السنوية</h1>
          <p className="text-xs text-gray-600 mt-1">
            احتساب استحقاق الترقية استناداً لتاريخ الدرجة الحالية وعدد العلاوات، دعم الترقية الاستثنائية، واحتساب العلاوة السنوية التلقائية
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsPrintReportOpen(true)}
            className="px-3.5 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-900 text-white font-bold text-xs shadow-sm flex items-center gap-1.5"
          >
            <Printer className="w-4 h-4 text-amber-400" />
            <span>طباعة تقرير استحقاق الترقيات</span>
          </button>

          <button
            onClick={handleBatchPromotions}
            className="px-3.5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-sm flex items-center gap-1.5"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>تطبيق الترقيات الجماعية للمستحقين ({eligibleCount})</span>
          </button>

          <button
            onClick={handleBatchAnnualIncrements}
            className="px-3.5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-sm flex items-center gap-1.5"
            title="احتساب وتحديث العلاوات السنوية التلقائية"
          >
            <Zap className="w-4 h-4" />
            <span>احتساب العلاوات السنوية تلقائياً</span>
          </button>

          <button
            onClick={() => setIsPromoModalOpen(true)}
            className="px-3.5 py-2.5 rounded-xl bg-red-700 hover:bg-red-800 text-white font-bold text-xs shadow-sm flex items-center gap-1.5"
          >
            <Award className="w-4 h-4" />
            <span>تسجيل ترقية فردية</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 bg-white px-4 pt-3 rounded-t-xl text-xs font-bold">
        <button
          onClick={() => setActiveTab('eligibility')}
          className={`pb-3 px-4 border-b-2 transition-all ${activeTab === 'eligibility' ? 'border-red-700 text-red-800' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
        >
          الترشيحات والتوصيات للترقية ({eligibleCount} مستحق)
        </button>
        <button
          onClick={() => setActiveTab('promotions')}
          className={`pb-3 px-4 border-b-2 transition-all ${activeTab === 'promotions' ? 'border-red-700 text-red-800' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
        >
          سجل قرارات الترقيات المعتمدة ({promotions.length})
        </button>
        <button
          onClick={() => setActiveTab('increments')}
          className={`pb-3 px-4 border-b-2 transition-all ${activeTab === 'increments' ? 'border-red-700 text-red-800' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
        >
          سجل العلاوات السنوية ({increments.length})
        </button>
      </div>

      {/* TAB 1: ELIGIBILITY & RECOMMENDATIONS */}
      {activeTab === 'eligibility' && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden space-y-4 p-4">
          
          {/* Filters Toolbar */}
          <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-200 grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute right-3 top-2.5" />
              <input
                type="text"
                placeholder="بحث بالاسم أو الرقم الوظيفي..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pr-9 pl-3 py-2 bg-white border border-gray-300 rounded-lg text-xs"
              />
            </div>

            {/* Department Filter */}
            <div>
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="w-full p-2 bg-white border border-gray-300 rounded-lg text-xs font-bold"
              >
                <option value="الكل">جميع الأقسام والإدارات</option>
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            {/* Category Filter */}
            <div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full p-2 bg-white border border-gray-300 rounded-lg text-xs font-bold"
              >
                <option value="الكل">كافة الكوادر (إداري وطبي)</option>
                <option value="طبي">طبي / طبي مساعد</option>
                <option value="إداري">إداري / تخصصي</option>
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full p-2 bg-white border border-gray-300 rounded-lg text-xs font-bold text-red-900"
              >
                <option value="الكل">جميع حالات الاستحقاق</option>
                <option value="مستحق للترقية">مستحق للترقية حالياً</option>
                <option value="قريب من الاستحقاق">قريب من الاستحقاق (&lt; 6 أشهر)</option>
                <option value="غير مستحق">غير مستحق بعد</option>
                <option value="مراجعة يدوية">مراجعة يدوية (حالات خاصة)</option>
              </select>
            </div>
          </div>

          {/* Quick Summary Cards */}
          <div className="grid grid-cols-4 gap-3 text-xs">
            <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl text-emerald-950 font-bold flex justify-between items-center">
              <span>المستحقون للترقية حالياً:</span>
              <span className="text-base font-black text-emerald-800">{eligibleCount} موظف</span>
            </div>
            <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl text-amber-950 font-bold flex justify-between items-center">
              <span>القريبون من الاستحقاق:</span>
              <span className="text-base font-black text-amber-800">{approachingCount} موظف</span>
            </div>
            <div className="bg-blue-50 border border-blue-200 p-3 rounded-xl text-blue-950 font-bold flex justify-between items-center">
              <span>نتائج الفلترة الحالية:</span>
              <span className="text-base font-black text-blue-800">{filteredList.length} سجل</span>
            </div>
            <div className="bg-gray-100 border border-gray-200 p-3 rounded-xl text-gray-800 font-bold flex justify-between items-center">
              <span>قاعدة الحساب:</span>
              <span className="text-xs text-gray-700">الدرجة الحالية + تاريخها</span>
            </div>
          </div>

          <div className="border rounded-xl overflow-hidden">
            <table className="w-full text-right text-xs">
              <thead className="bg-gray-100 border-b border-gray-200 text-gray-700 font-bold">
                <tr>
                  <th className="py-3 px-3">الرقم الوظيفي</th>
                  <th className="py-3 px-3">اسم الموظف</th>
                  <th className="py-3 px-3">القسم والكادر</th>
                  <th className="py-3 px-3">الدرجة والعلاوة الحالية</th>
                  <th className="py-3 px-3">تاريخ الدرجة الحالية</th>
                  <th className="py-3 px-3">المدة بالدرجة</th>
                  <th className="py-3 px-3">الترقية المقترحة</th>
                  <th className="py-3 px-3">حالة الاستحقاق والتوصية</th>
                  <th className="py-3 px-3 text-center">الإجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredList.map(({ emp, rec, inc }) => (
                  <tr key={emp.id} className="hover:bg-gray-50">
                    <td className="py-3 px-3 font-bold text-red-900 font-mono">{emp.jobNumber}</td>
                    <td className="py-3 px-3 font-bold text-gray-900">{emp.fullName}</td>
                    <td className="py-3 px-3 text-gray-700">
                      <div>{emp.department}</div>
                      <span className="text-[10px] text-gray-500 font-bold">({emp.assignmentCategory})</span>
                    </td>
                    <td className="py-3 px-3 font-bold">{emp.jobGrade} (علاوة {emp.currentIncrement || 1})</td>
                    <td className="py-3 px-3 font-mono dir-ltr text-right">{formatDateDisplay(rec.currentGradeDateStorage)}</td>
                    <td className="py-3 px-3 font-bold text-blue-900">{rec.yearsInGrade} سنة</td>
                    <td className="py-3 px-3 font-extrabold text-red-900 bg-red-50/50 px-2 rounded">
                      {rec.recommendedNewGrade}
                    </td>
                    <td className="py-3 px-3">
                      {rec.status === 'مستحق للترقية' && (
                        <span className="bg-emerald-100 text-emerald-900 text-[10px] px-2.5 py-1 rounded-full font-bold inline-block">
                          مستحق للترقية ({rec.recommendedNewGrade})
                        </span>
                      )}
                      {rec.status === 'قريب من الاستحقاق' && (
                        <span className="bg-amber-100 text-amber-900 text-[10px] px-2.5 py-1 rounded-full font-bold inline-block">
                          قريب من الاستحقاق
                        </span>
                      )}
                      {rec.status === 'غير مستحق' && (
                        <span className="bg-gray-100 text-gray-600 text-[10px] px-2.5 py-1 rounded-full font-bold inline-block">
                          غير مستحق (متبقي {rec.requiredYears - rec.yearsInGrade > 0 ? (rec.requiredYears - rec.yearsInGrade).toFixed(1) : 0} سنة)
                        </span>
                      )}
                      {rec.status === 'مراجعة يدوية' && (
                        <span className="bg-purple-100 text-purple-900 text-[10px] px-2.5 py-1 rounded-full font-bold inline-block">
                          حالة وظيفية خاصة
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={() => {
                          setPromoEmpId(emp.id);
                          setPromoNewGrade(rec.recommendedNewGrade);
                          setIsPromoModalOpen(true);
                        }}
                        className="px-3 py-1 bg-red-700 hover:bg-red-800 text-white rounded text-[11px] font-bold shadow-sm"
                      >
                        ترقية الموظف
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: PROMOTIONS */}
      {activeTab === 'promotions' && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-700 font-bold">
                <tr>
                  <th className="py-3 px-4">رقم القرار</th>
                  <th className="py-3 px-4">الموظف / الرقم الوظيفي</th>
                  <th className="py-3 px-4">نوع الترقية</th>
                  <th className="py-3 px-4">الدرجة السابقة والجديدة</th>
                  <th className="py-3 px-4">تاريخ القرار والفعالية</th>
                  <th className="py-3 px-4">السبب / البيان</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {promotions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-gray-500">لا توجد ترقيات مسجلة</td>
                  </tr>
                ) : (
                  promotions.map((p) => {
                    const emp = employees.find((e) => e.id === p.employeeId);
                    return (
                      <tr key={p.id} className="hover:bg-gray-50">
                        <td className="py-3 px-4 font-bold text-red-900">{p.decisionNumber}</td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-gray-900">{emp?.fullName || 'غير معروف'}</div>
                          <div className="text-[10px] text-gray-500 font-mono">الرقم الوظيفي: {emp?.jobNumber}</div>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${p.promotionType === 'ترقية استثنائية' ? 'bg-amber-100 text-amber-900' : 'bg-red-100 text-red-900'}`}>
                            {p.promotionType}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-semibold">
                          {p.previousGrade} ← <strong className="text-red-900">{p.newGrade}</strong>
                        </td>
                        <td className="py-3 px-4 text-gray-600">{p.effectiveDate}</td>
                        <td className="py-3 px-4 text-gray-700">{p.reason}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: INCREMENTS */}
      {activeTab === 'increments' && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-700 font-bold">
                <tr>
                  <th className="py-3 px-4">رقم القرار / السجل</th>
                  <th className="py-3 px-4">الموظف / الرقم الوظيفي</th>
                  <th className="py-3 px-4">نوع العلاوة</th>
                  <th className="py-3 px-4">العلاوة السابقة والتالية</th>
                  <th className="py-3 px-4">تاريخ الاستحقاق</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {increments.map((inc) => {
                  const emp = employees.find((e) => e.id === inc.employeeId);
                  return (
                    <tr key={inc.id} className="hover:bg-gray-50">
                      <td className="py-3 px-4 font-bold text-red-900">{inc.decisionNumber}</td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-gray-900">{emp?.fullName || 'غير معروف'}</div>
                        <div className="text-[10px] text-gray-500 font-mono">الرقم الوظيفي: {emp?.jobNumber}</div>
                      </td>
                      <td className="py-3 px-4 font-semibold">{inc.incrementType}</td>
                      <td className="py-3 px-4 font-bold">
                        علاوة {inc.previousIncrement} ← <strong className="text-red-900">علاوة {inc.newIncrement}</strong>
                      </td>
                      <td className="py-3 px-4 text-gray-600">{inc.effectiveDate}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Promotion Modal (Requirement #10, #11) */}
      {isPromoModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 space-y-4 border border-gray-200 text-xs">
            <h3 className="text-base font-extrabold text-gray-900 border-b pb-3">اعتماد قرار ترقية موظف</h3>

            <form onSubmit={handlePromoSubmit} className="space-y-4">
              <div>
                <label className="block font-bold text-gray-700 mb-1">الموظف *</label>
                <select
                  value={promoEmpId}
                  onChange={(e) => setPromoEmpId(Number(e.target.value))}
                  className="w-full p-2 border rounded-lg font-bold"
                >
                  {employees.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.fullName} ({e.jobNumber}) - {e.jobGrade}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">نوع الترقية *</label>
                <select
                  value={promoType}
                  onChange={(e) => setPromoType(e.target.value as any)}
                  className="w-full p-2 border rounded-lg font-bold"
                >
                  <option value="ترقية عادية">ترقية عادية (استيفاء المدة)</option>
                  <option value="ترقية استثنائية">ترقية استثنائية (قرار إداري)</option>
                  <option value="تسوية وضع">تسوية وضع وظيفي</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">الدرجة الجديدة الممنوحة *</label>
                <input
                  type="text"
                  required
                  value={promoNewGrade}
                  onChange={(e) => setPromoNewGrade(e.target.value)}
                  className="w-full p-2 border rounded-lg font-bold text-red-900"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">رقم قرار الترقية</label>
                <input
                  type="text"
                  value={promoDecisionNo}
                  onChange={(e) => setPromoDecisionNo(e.target.value)}
                  placeholder="ق/ت/2026/102"
                  className="w-full p-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">الأسباب الموجبة للترقية / البيان</label>
                <textarea
                  rows={2}
                  value={promoReason}
                  onChange={(e) => setPromoReason(e.target.value)}
                  placeholder="سبب الترقية..."
                  className="w-full p-2 border rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsPromoModalOpen(false)}
                  className="px-4 py-2 border rounded-lg text-gray-700"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-red-700 hover:bg-red-800 text-white rounded-lg font-bold"
                >
                  حفظ القرار وتحديث الدرجة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable Official Promotion Eligibility Report Modal */}
      {isPrintReportOpen && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 overflow-y-auto print:p-0 print:bg-white print:static">
          <div 
            id="PRINT_PROMOTIONS_REPORT"
            className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full p-8 border border-gray-300 print:shadow-none print:border-none print:w-full space-y-6 text-right relative font-sans"
          >
            
            {/* Top Controls */}
            <div className="flex flex-wrap justify-between items-center print:hidden bg-gray-100 p-3 rounded-xl border border-gray-200 gap-2">
              <button
                onClick={() => setIsPrintReportOpen(false)}
                type="button"
                className="px-3.5 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <X className="w-4 h-4 text-gray-500" />
                <span>إغلاق المعاينة</span>
              </button>
              
              <div className="flex items-center gap-2">
                {/* Direct PDF Download */}
                <button
                  onClick={async () => {
                    setIsExportingPdf(true);
                    setExportSuccess(false);
                    const safeName = `تقرير_استحقاق_الترقيات_${new Date().getFullYear()}_${Date.now()}`;
                    try {
                      const success = await exportElementToPdf('PRINT_PROMOTIONS_REPORT', safeName, {
                        orientation: 'landscape',
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
                  }}
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
                      <Loader2 className="w-4 h-4 animate-spin text-red-300" />
                      <span>جاري إنشاء PDF...</span>
                    </>
                  ) : exportSuccess ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-200" />
                      <span>تم تصدير PDF</span>
                    </>
                  ) : (
                    <>
                      <FileDown className="w-4 h-4 text-red-400" />
                      <span>تصدير ملف PDF مباشر</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => window.print()}
                  type="button"
                  className="px-5 py-2 bg-red-700 hover:bg-red-800 text-white rounded-lg text-xs font-bold flex items-center gap-2 shadow-md cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>طباعة التقرير الرسمي (A4)</span>
                </button>
              </div>
            </div>

            {/* Official Header */}
            <div className="border-b-2 border-red-800 pb-4">
              <div className="flex justify-between items-center">
                <div className="text-right space-y-1">
                  <h3 className="text-xs font-extrabold text-gray-700">دولة ليبيا — وزارة الصحة</h3>
                  <h1 className="text-xl font-black text-red-900 tracking-wide">مصرف الدم المركزي بلدية المرج</h1>
                  <p className="text-xs font-bold text-gray-600">إدارة الشؤون الإدارية والمالية — قسم الموارد البشرية والترقيات</p>
                </div>

                <div className="flex flex-col items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-red-50 border-2 border-red-700 flex items-center justify-center shadow-inner relative">
                    <svg className="w-10 h-10 text-red-700" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
                    </svg>
                  </div>
                  <span className="text-[10px] font-black text-red-800 mt-1">مصرف الدم المركزي</span>
                </div>

                <div className="text-left font-mono text-xs text-gray-600 space-y-1">
                  <div>تاريخ التقرير: <strong className="text-gray-900">{formatDateDisplay(new Date().toISOString().slice(0, 10))}</strong></div>
                  <div>السنة المالية: <strong className="text-red-900">{new Date().getFullYear()}</strong></div>
                  <div>إجمالي الموظفين: <strong className="text-gray-900">{filteredList.length}</strong></div>
                </div>
              </div>

              <div className="mt-3 bg-red-800 text-white text-center py-1.5 rounded-lg font-black text-sm tracking-wider shadow-sm">
                كشف واستمارة ترشيح واستحقاق الترقيات الوظيفية للموظفين
              </div>
            </div>

            {/* Active Filters Summary */}
            <div className="bg-gray-50 p-3 rounded-lg border text-xs flex justify-around font-bold text-gray-700">
              <span>قسم / إدارة: <strong className="text-red-900">{selectedDept}</strong></span>
              <span>الكادر الوظيفي: <strong className="text-red-900">{selectedCategory}</strong></span>
              <span>حالة الاستحقاق: <strong className="text-red-900">{selectedStatus}</strong></span>
              <span>عدد المستحقين: <strong className="text-emerald-800">{eligibleCount} موظف</strong></span>
            </div>

            {/* Main Data Table */}
            <div className="border rounded-xl overflow-hidden">
              <table className="w-full text-right text-xs">
                <thead className="bg-gray-100 border-b border-gray-300 font-bold text-gray-800">
                  <tr>
                    <th className="py-2.5 px-3">ر.م</th>
                    <th className="py-2.5 px-3">الرقم الوظيفي</th>
                    <th className="py-2.5 px-3">اسم الموظف الرباعي</th>
                    <th className="py-2.5 px-3">القسم / الإدارة</th>
                    <th className="py-2.5 px-3">الدرجة الحالية</th>
                    <th className="py-2.5 px-3">تاريخ الدرجة</th>
                    <th className="py-2.5 px-3">المدة</th>
                    <th className="py-2.5 px-3">الدرجة المقترحة</th>
                    <th className="py-2.5 px-3">توصية الاستحقاق</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 text-[11px]">
                  {filteredList.map(({ emp, rec }, idx) => (
                    <tr key={emp.id} className="hover:bg-gray-50">
                      <td className="py-2 px-3 font-bold text-gray-500">{idx + 1}</td>
                      <td className="py-2 px-3 font-bold text-red-900 font-mono">{emp.jobNumber}</td>
                      <td className="py-2 px-3 font-bold text-gray-900">{emp.fullName}</td>
                      <td className="py-2 px-3">{emp.department}</td>
                      <td className="py-2 px-3 font-bold">{emp.jobGrade}</td>
                      <td className="py-2 px-3 font-mono dir-ltr text-right">{formatDateDisplay(rec.currentGradeDateStorage)}</td>
                      <td className="py-2 px-3 font-bold text-blue-900">{rec.yearsInGrade} سنة</td>
                      <td className="py-2 px-3 font-extrabold text-red-900 bg-red-50/50">{rec.recommendedNewGrade}</td>
                      <td className="py-2 px-3 font-bold">
                        {rec.status === 'مستحق للترقية' ? (
                          <span className="text-emerald-800">مستحق ترقية ({rec.recommendedNewGrade})</span>
                        ) : rec.status === 'قريب من الاستحقاق' ? (
                          <span className="text-amber-800">قريب من الاستحقاق</span>
                        ) : (
                          <span className="text-gray-600">غير مستحق</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Official Signatures & Stamp */}
            <div className="pt-4 border-t space-y-4">
              <div className="grid grid-cols-3 gap-4 text-center text-xs">
                <div className="border border-gray-200 rounded-xl p-3 space-y-6 bg-gray-50/50">
                  <div className="font-bold text-gray-800">رئيس قسم الموارد البشرية والترقيات</div>
                  <div className="text-gray-400 text-[10px]">التوقيع: .....................</div>
                </div>

                <div className="border border-gray-200 rounded-xl p-3 space-y-6 bg-gray-50/50">
                  <div className="font-bold text-gray-800">مدير الشؤون الإدارية والمالية</div>
                  <div className="text-gray-400 text-[10px]">التوقيع: .....................</div>
                </div>

                <div className="border border-red-200 rounded-xl p-3 space-y-6 bg-red-50/30">
                  <div className="font-extrabold text-red-900">المدير العام لمصرف الدم المركزي</div>
                  <div className="text-gray-400 text-[10px]">الاعتماد الرسمي: ...........</div>
                </div>
              </div>

              {/* Stamp Box */}
              <div className="flex justify-between items-center text-xs pt-2">
                <p className="text-[10px] text-gray-500">
                  تم استخراج هذا التقرير آلياً من منظومة إدارة الموظفين والموارد البشرية بمصرف الدم المركزي المرج.
                </p>

                <div className="w-28 h-28 border-2 border-dashed border-red-700 rounded-full flex flex-col items-center justify-center text-center p-2 text-[9px] text-red-800 font-bold bg-red-50/40">
                  <span>ختم المصرف الرسمي</span>
                  <span className="text-[7px] text-gray-400 mt-1">تاريخ الختم: ../../20..</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};
