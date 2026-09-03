import React, { useMemo } from 'react';
import { Employee, AuditLog, ActiveTab, LeaveTransaction, PromotionRecord, IncrementRecord, HrRule, EmploymentStatus } from '../types';
import { calculateLeaveSummary, isOutsideCadreStatus, isEmployeeActiveInCadre } from '../utils/hrCalculations';
import { calculatePromotionRecommendation, normalizeDateStorage } from '../utils/dateUtils';
import { DashboardLeaveAlertsWidget } from './DashboardLeaveAlertsWidget';
import { 
  Users, 
  UserCheck, 
  FileCheck, 
  FileX, 
  UserPlus, 
  Search, 
  FileText, 
  BarChart2, 
  HardDrive, 
  Activity, 
  ShieldAlert, 
  Droplet,
  FileCode,
  Calendar,
  TrendingUp,
  Award,
  Zap,
  AlertCircle,
  UserX,
  ArrowLeftRight,
  Clock,
  BellRing
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';

interface DashboardViewProps {
  employees: Employee[];
  logs: AuditLog[];
  leaves?: LeaveTransaction[];
  promotions?: PromotionRecord[];
  increments?: IncrementRecord[];
  rules?: HrRule[];
  setActiveTab: (tab: ActiveTab) => void;
  onOpenAddModal: () => void;
  onQuickBackup: () => void;
  onUpdateLeaveStatus?: (id: string, status: LeaveTransaction['status']) => void;
  onUpdateEmployeeStatus?: (employeeId: number, status: EmploymentStatus, extraData?: Partial<Employee>) => void;
  onAddAuditLog?: (action: string, details: string, employeeId?: number | string) => void;
}

const COLOR_PALETTE = ['#991B1B', '#B91C1C', '#DC2626', '#EF4444', '#F87171', '#FCA5A5', '#7F1D1D'];

export const DashboardView: React.FC<DashboardViewProps> = ({
  employees,
  logs,
  leaves = [],
  promotions = [],
  increments = [],
  rules = [],
  setActiveTab,
  onOpenAddModal,
  onQuickBackup,
  onUpdateLeaveStatus,
  onUpdateEmployeeStatus,
  onAddAuditLog
}) => {
  const totalCount = employees.length;
  const maleCount = employees.filter((e) => e.gender === 'ذكر').length;
  const femaleCount = employees.filter((e) => e.gender === 'أنثى').length;
  const activeInCadreCount = employees.filter((e) => isEmployeeActiveInCadre(e)).length;
  const outsideCadreCount = employees.filter((e) => isOutsideCadreStatus(e.status)).length;
  const transferredOutCount = employees.filter((e) => e.status === 'منقول خارجياً').length;
  const activeDutyCount = employees.filter((e) => e.status === 'على رأس العمل').length;
  const withPdfCount = employees.filter((e) => e.pdfPath && e.pdfPath.length > 0).length;
  const missingPdfCount = totalCount - withPdfCount;

  // HR Calculations (Synchronized with Promotions & Increments engine)
  const eligiblePromotionsCount = employees.filter((e) => calculatePromotionRecommendation(e, rules).status === 'مستحق للترقية').length;
  const longServiceCount = employees.filter((e) => calculateLeaveSummary(e, leaves, rules).isLongService).length;
  const activeLeavesCount = employees.filter((e) => e.status === 'إجازة').length;

  // Real-time Leave Alerts Calculations for Summary Banners
  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const leavesEndingSoonCount = useMemo(() => {
    const today = new Date(todayStr + 'T00:00:00');
    return leaves.filter(leave => {
      if (leave.status !== 'مقبولة') return false;
      const normEnd = normalizeDateStorage(leave.endDate);
      if (!normEnd) return false;
      const endDateObj = new Date(normEnd + 'T00:00:00');
      const diffDays = Math.round((endDateObj.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return diffDays >= -14 && diffDays <= 7;
    }).length;
  }, [leaves, todayStr]);

  const unapprovedLeavesCount = useMemo(() => {
    return leaves.filter(leave => {
      return leave.status === 'قيد المراجعة' || 
             leave.reviewStatus === 'غير مراجع' || 
             leave.reviewStatus === 'قيد المراجعة' ||
             (leave.status !== 'مقبولة' && leave.status !== 'مرفوضة' && leave.status !== 'ملغاة');
    }).length;
  }, [leaves]);

  // Department distribution
  const deptMap: Record<string, number> = {};
  employees.forEach((e) => {
    deptMap[e.department] = (deptMap[e.department] || 0) + 1;
  });
  const deptData = Object.entries(deptMap).map(([name, count]) => ({
    name: name.replace('قسم ', ''),
    fullName: name,
    count
  }));

  // Gender Data for Pie Chart
  const genderData = [
    { name: 'ذكور', value: maleCount, color: '#991B1B' },
    { name: 'إناث', value: femaleCount, color: '#DC2626' }
  ];

  return (
    <div className="space-y-6">
      
      {/* Top Welcome Banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm relative overflow-hidden flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="space-y-2 z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-50 border border-red-200 text-red-800 text-xs font-bold">
            <Droplet className="w-3.5 h-3.5 fill-red-600 text-red-600" />
            <span>مصرف الدم المركزي بلدية المرج - ليبيا</span>
          </div>
          <h2 className="text-2xl font-black text-slate-900">
            لوحة القيادة والإحصاءات الحية للكادر الإداري والمالي
          </h2>
          <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">
            متابعة دقيقة للكادر الوظيفي ({totalCount} موظفاً) مع نظام التنبيه التلقائي للإجازات المنتهية وغير المعتمدة واستحقاقات الترقية.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto z-10">
          <button
            onClick={onOpenAddModal}
            className="flex-1 lg:flex-none px-4 py-2.5 rounded-xl bg-red-700 hover:bg-red-800 text-white font-bold text-xs shadow-sm transition-all border border-red-600 flex items-center justify-center gap-2 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>إضافة موظف جديد</span>
          </button>
          <button
            onClick={() => setActiveTab('vba_code')}
            className="flex-1 lg:flex-none px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-sm transition-all border border-slate-800 flex items-center justify-center gap-2 cursor-pointer"
          >
            <FileCode className="w-4 h-4 text-amber-400" />
            <span>تصدير كود VBA</span>
          </button>
        </div>
      </div>

      {/* HR Actionable Alert Banners - 4 Responsive Alert Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Alert 1: Leaves Ending Soon / Overdue */}
        <div 
          onClick={() => setActiveTab('leaves')}
          className={`border rounded-2xl p-4 shadow-sm cursor-pointer transition-all flex items-center justify-between ${
            leavesEndingSoonCount > 0 
              ? 'bg-amber-50/90 border-amber-300 hover:bg-amber-100/70 hover:shadow-md' 
              : 'bg-slate-50 border-slate-200 hover:bg-slate-100/70'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-xl text-white ${leavesEndingSoonCount > 0 ? 'bg-amber-600' : 'bg-slate-500'}`}>
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-800 block">إجازات تنتهي قريباً</span>
              <p className={`text-xl font-black ${leavesEndingSoonCount > 0 ? 'text-amber-800' : 'text-slate-700'}`}>
                {leavesEndingSoonCount} إجازة
              </p>
              <span className="text-[10px] text-slate-500">خلال 7 أيام أو تنتظر المباشرة</span>
            </div>
          </div>
          <span className="text-xs font-bold text-amber-700">متابعة ←</span>
        </div>

        {/* Alert 2: Unapproved / Pending Leaves */}
        <div 
          onClick={() => setActiveTab('leaves')}
          className={`border rounded-2xl p-4 shadow-sm cursor-pointer transition-all flex items-center justify-between ${
            unapprovedLeavesCount > 0 
              ? 'bg-red-50/90 border-red-300 hover:bg-red-100/70 hover:shadow-md' 
              : 'bg-slate-50 border-slate-200 hover:bg-slate-100/70'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-xl text-white ${unapprovedLeavesCount > 0 ? 'bg-red-700' : 'bg-slate-500'}`}>
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-800 block">إجازات بانتظار الاعتماد</span>
              <p className={`text-xl font-black ${unapprovedLeavesCount > 0 ? 'text-red-800' : 'text-slate-700'}`}>
                {unapprovedLeavesCount} طلب
              </p>
              <span className="text-[10px] text-slate-500">تتطلب تدقيقاً وإجراءً رسمياً</span>
            </div>
          </div>
          <span className="text-xs font-bold text-red-700">اعتماد ←</span>
        </div>

        {/* Alert 3: Eligible Promotions */}
        <div 
          onClick={() => setActiveTab('promotions')}
          className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 shadow-sm cursor-pointer hover:bg-emerald-100/60 transition-all flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-600 text-white rounded-xl">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-emerald-900 block">مستحقو الترقية الآن</span>
              <p className="text-xl font-black text-emerald-700">{eligiblePromotionsCount} موظفاً</p>
              <span className="text-[10px] text-emerald-600">استوفوا المدة والدرجة</span>
            </div>
          </div>
          <span className="text-xs font-bold text-emerald-700">متابعة ←</span>
        </div>

        {/* Alert 4: Long Service Staff */}
        <div 
          onClick={() => setActiveTab('leaves')}
          className="bg-purple-50 border border-purple-200 rounded-2xl p-4 shadow-sm cursor-pointer hover:bg-purple-100/60 transition-all flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-700 text-white rounded-xl">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-purple-900 block">طويلي الخدمة (&gt;20 سنة)</span>
              <p className="text-xl font-black text-purple-800">{longServiceCount} موظفاً</p>
              <span className="text-[10px] text-purple-600">استحقاق 45 يوماً إجازة</span>
            </div>
          </div>
          <span className="text-xs font-bold text-purple-700">متابعة ←</span>
        </div>

      </div>

      {/* DEDICATED AUTOMATED LEAVE ALERTS WIDGET */}
      <DashboardLeaveAlertsWidget
        employees={employees}
        leaves={leaves}
        rules={rules}
        setActiveTab={setActiveTab}
        onUpdateLeaveStatus={onUpdateLeaveStatus}
        onUpdateEmployeeStatus={onUpdateEmployeeStatus}
        onAddAuditLog={onAddAuditLog}
      />

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 sm:gap-4">
        
        {/* Card 1 */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500">إجمالي السجلات</span>
            <div className="p-2 rounded-xl bg-red-50 text-red-700 border border-red-200">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900">{totalCount}</p>
          <p className="text-[10px] text-slate-400 mt-1">كافة الموظفين بالقاعدة</p>
        </div>

        {/* Card 2 */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-emerald-800">الملاك النشط</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-700">{activeInCadreCount}</p>
          <p className="text-[10px] text-emerald-600 font-bold mt-1">
            داخل الملاك الفعلي
          </p>
        </div>

        {/* Card 3 */}
        <div 
          onClick={() => setActiveTab('resignations')}
          className="bg-white border border-purple-200 rounded-2xl p-4 shadow-sm cursor-pointer hover:border-purple-300 transition"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-purple-800">خارج الملاك</span>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-700 border border-purple-200">
              <ArrowLeftRight className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-purple-800">{outsideCadreCount}</p>
          <p className="text-[10px] text-purple-600 font-medium mt-1">
            {transferredOutCount} نقل خارجي / إنهاء
          </p>
        </div>

        {/* Card 4 */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500">على رأس العمل</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-700 border border-blue-200">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-blue-700">{activeDutyCount}</p>
          <p className="text-[10px] text-slate-400 mt-1">
            مباشرون لمهامهم
          </p>
        </div>

        {/* Card 5 */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500">ملفات PDF المؤرشفة</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
              <FileCheck className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-700">{withPdfCount}</p>
          <p className="text-[10px] text-slate-400 mt-1">من أصل {totalCount} موظف</p>
        </div>

        {/* Card 6 */}
        <div 
          onClick={() => setActiveTab('promotions')}
          className="bg-white border border-amber-200 rounded-2xl p-4 shadow-sm cursor-pointer hover:border-amber-300 transition"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-amber-800">مستحقو الترقية</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-700 border border-amber-200">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-amber-700">{eligiblePromotionsCount}</p>
          <p className="text-[10px] text-amber-600 font-medium mt-1">استوفوا المدة القانونية</p>
        </div>

      </div>

      {/* Visual Analytics Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Department Bar Chart */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-red-700" />
                <span>توزيع الموظفين حسب أقسام المصرف</span>
              </h3>
              <p className="text-[11px] text-slate-500">المختبرات، سحب الدم، حفظ الخثرات، والإدارة</p>
            </div>
            <button
              onClick={() => setActiveTab('statistics')}
              className="text-xs text-red-700 hover:text-red-800 font-bold cursor-pointer"
            >
              عرض الإحصاءات ←
            </button>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deptData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} interval={0} angle={-15} textAnchor="end" />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', color: '#0f172a' }}
                  labelFormatter={(label) => `القسم: ${label}`}
                  formatter={(value: any) => [`${value} موظف`, 'العدد']}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {deptData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLOR_PALETTE[index % COLOR_PALETTE.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gender Ratio Pie Chart */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-red-700" />
                <span>نسبة التكافؤ النوعي</span>
              </h3>
            </div>

            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={genderData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {genderData.map((entry, index) => (
                      <Cell key={`cell-gender-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', color: '#0f172a' }}
                    formatter={(val: any) => [`${val} موظف`, 'العدد']}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="space-y-2 pt-3 border-t border-slate-100">
            <div className="flex items-center justify-between text-xs font-bold">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-900" />
                <span className="text-slate-700">الذكور</span>
              </div>
              <span className="text-slate-900 font-mono">{maleCount} موظف</span>
            </div>
            <div className="flex items-center justify-between text-xs font-bold">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-600" />
                <span className="text-slate-700">الإناث</span>
              </div>
              <span className="text-slate-900 font-mono">{femaleCount} موظفة</span>
            </div>
          </div>
        </div>

      </div>

      {/* Bottom Audit Log Feed */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
          <h3 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4 text-emerald-600" />
            <span>آخر العمليات والإجراءات الوظيفية الموثقة (Audit Log)</span>
          </h3>
          <button
            onClick={() => setActiveTab('logs')}
            className="text-[11px] text-red-700 hover:underline font-bold cursor-pointer"
          >
            عرض السجل الكامل
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {logs.slice(0, 3).map((log, idx) => (
            <div
              key={`${log.id}-${log.timestamp}-${idx}`}
              className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 space-y-1"
            >
              <div className="flex items-center justify-between text-[10px]">
                <span className="font-bold text-red-800">{log.user}</span>
                <span className="text-slate-400 font-mono">{(log.timestamp || '').split(' ')[1] || log.timestamp || ''}</span>
              </div>
              <p className="font-bold text-slate-900 text-[11px] line-clamp-2">{log.details}</p>
              <span className="inline-block px-2 py-0.5 rounded text-[9px] font-bold bg-white text-slate-700 border border-slate-200">
                {log.action}
              </span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

