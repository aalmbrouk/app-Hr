import React, { useState, useMemo } from 'react';
import { Employee, LeaveTransaction, ActiveTab, HrRule } from '../types';
import { formatDateDisplay, normalizeDateStorage } from '../utils/dateUtils';
import { 
  AlertTriangle, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Calendar, 
  UserCheck, 
  Search, 
  Filter, 
  ArrowRight, 
  AlertCircle, 
  Bell, 
  Sparkles, 
  ChevronDown, 
  ChevronUp, 
  FileText, 
  Check, 
  X, 
  User, 
  RefreshCw,
  ExternalLink,
  ShieldAlert,
  ArrowUpRight
} from 'lucide-react';

interface DashboardLeaveAlertsWidgetProps {
  employees: Employee[];
  leaves: LeaveTransaction[];
  rules?: HrRule[];
  setActiveTab: (tab: ActiveTab) => void;
  onUpdateLeaveStatus?: (id: string, status: LeaveTransaction['status']) => void;
  onUpdateEmployeeStatus?: (employeeId: number, status: Employee['status'], extraData?: Partial<Employee>) => void;
  onAddAuditLog?: (action: string, details: string, employeeId?: number | string) => void;
  onNavigateToLeaveWithFilter?: (empId?: number, leaveId?: string) => void;
}

export interface LeaveEndingAlertItem {
  leave: LeaveTransaction;
  employee: Employee;
  daysRemaining: number;
  urgency: 'overdue' | 'today' | 'tomorrow' | 'urgent_week' | 'soon';
  urgencyLabel: string;
  endDateDisplay: string;
  returnDateDisplay: string;
}

export interface PendingLeaveAlertItem {
  leave: LeaveTransaction;
  employee: Employee;
  startDateDisplay: string;
  endDateDisplay: string;
  submittedAtDisplay: string;
}

export const DashboardLeaveAlertsWidget: React.FC<DashboardLeaveAlertsWidgetProps> = ({
  employees,
  leaves = [],
  setActiveTab,
  onUpdateLeaveStatus,
  onUpdateEmployeeStatus,
  onAddAuditLog
}) => {
  const [activeAlertTab, setActiveAlertTab] = useState<'all' | 'ending_soon' | 'pending_approval'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [isExpanded, setIsExpanded] = useState(true);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  // Today reference in normalized YYYY-MM-DD
  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const employeeMap = useMemo(() => {
    const map = new Map<number, Employee>();
    employees.forEach(emp => map.set(emp.id, emp));
    return map;
  }, [employees]);

  // 1. Compute Leaves Ending Soon
  const endingSoonAlerts: LeaveEndingAlertItem[] = useMemo(() => {
    const alerts: LeaveEndingAlertItem[] = [];
    const today = new Date(todayStr + 'T00:00:00');

    leaves.forEach(leave => {
      // Look for approved leaves
      if (leave.status !== 'مقبولة') return;
      const emp = employeeMap.get(leave.employeeId);
      if (!emp) return;

      const normEnd = normalizeDateStorage(leave.endDate);
      if (!normEnd) return;

      const endDateObj = new Date(normEnd + 'T00:00:00');
      const diffMs = endDateObj.getTime() - today.getTime();
      const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

      // Alert window: From overdue within 14 days (diffDays < 0 >= -14) up to 10 days in advance (diffDays <= 10)
      // Only include if employee is still in 'إجازة' status or the leave ended recently requiring duty return confirmation
      if (diffDays >= -14 && diffDays <= 10) {
        let urgency: LeaveEndingAlertItem['urgency'] = 'soon';
        let urgencyLabel = '';

        if (diffDays < 0) {
          urgency = 'overdue';
          const overdueCount = Math.abs(diffDays);
          urgencyLabel = overdueCount === 1 ? 'انتهت أمس (مطلوب تأكيد المباشرة)' : `انتهت منذ ${overdueCount} أيام (مطلوب تأكيد المباشرة)`;
        } else if (diffDays === 0) {
          urgency = 'today';
          urgencyLabel = 'تنتهي اليوم';
        } else if (diffDays === 1) {
          urgency = 'tomorrow';
          urgencyLabel = 'تنتهي غداً';
        } else if (diffDays <= 7) {
          urgency = 'urgent_week';
          urgencyLabel = `متبقي ${diffDays} أيام`;
        } else {
          urgency = 'soon';
          urgencyLabel = `متبقي ${diffDays} يوماً`;
        }

        alerts.push({
          leave,
          employee: emp,
          daysRemaining: diffDays,
          urgency,
          urgencyLabel,
          endDateDisplay: formatDateDisplay(leave.endDate),
          returnDateDisplay: leave.returnDate ? formatDateDisplay(leave.returnDate) : 'اليوم التالي'
        });
      }
    });

    // Sort by urgency: lowest diffDays first (overdue & today top)
    return alerts.sort((a, b) => a.daysRemaining - b.daysRemaining);
  }, [leaves, employeeMap, todayStr]);

  // 2. Compute Pending / Unapproved Leaves
  const pendingApprovalAlerts: PendingLeaveAlertItem[] = useMemo(() => {
    const alerts: PendingLeaveAlertItem[] = [];

    leaves.forEach(leave => {
      // Pending review / unapproved
      const isPending = leave.status === 'قيد المراجعة' || 
                        leave.reviewStatus === 'غير مراجع' || 
                        leave.reviewStatus === 'قيد المراجعة' ||
                        (leave.status !== 'مقبولة' && leave.status !== 'مرفوضة' && leave.status !== 'ملغاة');

      if (isPending) {
        const emp = employeeMap.get(leave.employeeId);
        if (!emp) return;

        alerts.push({
          leave,
          employee: emp,
          startDateDisplay: formatDateDisplay(leave.startDate),
          endDateDisplay: formatDateDisplay(leave.endDate),
          submittedAtDisplay: leave.createdAt ? formatDateDisplay(leave.createdAt) : 'حديثاً'
        });
      }
    });

    return alerts.sort((a, b) => (b.leave.createdAt || '').localeCompare(a.leave.createdAt || ''));
  }, [leaves, employeeMap]);

  // Department List for Filter
  const departments = useMemo(() => {
    const set = new Set<string>();
    employees.forEach(e => {
      if (e.department) set.add(e.department);
    });
    return Array.from(set);
  }, [employees]);

  // Action Handlers
  const handleQuickApproveLeave = (leaveId: string, emp: Employee, leaveType: string) => {
    if (onUpdateLeaveStatus) {
      onUpdateLeaveStatus(leaveId, 'مقبولة');
    }
    if (onAddAuditLog) {
      onAddAuditLog('اعتماد', `اعتماد فوري للإجازة (${leaveType}) للموظف ${emp.fullName} (${emp.jobNumber}) من لوحة التحكم`, emp.id);
    }
    showToast(`✓ تم اعتماد إجازة الموظف (${emp.fullName}) بنجاح`);
  };

  const handleQuickRejectLeave = (leaveId: string, emp: Employee, leaveType: string) => {
    if (onUpdateLeaveStatus) {
      onUpdateLeaveStatus(leaveId, 'مرفوضة');
    }
    if (onAddAuditLog) {
      onAddAuditLog('رفض', `رفض طلب الإجازة (${leaveType}) للموظف ${emp.fullName} (${emp.jobNumber}) من لوحة التحكم`, emp.id);
    }
    showToast(`تم تغيير حالة الإجازة للموظف (${emp.fullName}) إلى مرفوضة`);
  };

  const handleRegisterReturnToDuty = (emp: Employee, leave: LeaveTransaction) => {
    if (onUpdateEmployeeStatus) {
      onUpdateEmployeeStatus(emp.id, 'على رأس العمل');
    }
    if (onAddAuditLog) {
      onAddAuditLog('تعديل', `تسجيل مباشرة العمل وانتهاء الإجازة (${leave.leaveType}) للموظف ${emp.fullName} (${emp.jobNumber}) - الحالة: على رأس العمل`, emp.id);
    }
    showToast(`✓ تم تسجيل مباشرة العمل للموظف (${emp.fullName}) وتحديث حالته إلى "على رأس العمل"`);
  };

  const showToast = (msg: string) => {
    setActionSuccessMsg(msg);
    setTimeout(() => {
      setActionSuccessMsg(null);
    }, 4000);
  };

  // Filtered Items
  const filteredEndingAlerts = useMemo(() => {
    return endingSoonAlerts.filter(item => {
      const matchSearch = !searchQuery || 
        item.employee.fullName.includes(searchQuery) || 
        item.employee.jobNumber.includes(searchQuery) ||
        item.leave.leaveType.includes(searchQuery);
      const matchDept = departmentFilter === 'all' || item.employee.department === departmentFilter;
      return matchSearch && matchDept;
    });
  }, [endingSoonAlerts, searchQuery, departmentFilter]);

  const filteredPendingAlerts = useMemo(() => {
    return pendingApprovalAlerts.filter(item => {
      const matchSearch = !searchQuery || 
        item.employee.fullName.includes(searchQuery) || 
        item.employee.jobNumber.includes(searchQuery) ||
        item.leave.leaveType.includes(searchQuery);
      const matchDept = departmentFilter === 'all' || item.employee.department === departmentFilter;
      return matchSearch && matchDept;
    });
  }, [pendingApprovalAlerts, searchQuery, departmentFilter]);

  const totalAlertsCount = endingSoonAlerts.length + pendingApprovalAlerts.length;
  const overdueCount = endingSoonAlerts.filter(a => a.urgency === 'overdue').length;

  return (
    <div className="bg-white border-2 border-red-200/80 rounded-3xl p-5 md:p-6 shadow-md relative overflow-hidden transition-all text-right">
      
      {/* Decorative Accent Header Glow */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-red-600 via-amber-500 to-red-700" />

      {/* Toast Notification Banner */}
      {actionSuccessMsg && (
        <div className="mb-4 p-3.5 rounded-2xl bg-emerald-950 border border-emerald-700 text-emerald-200 text-xs font-bold flex items-center justify-between shadow-lg animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{actionSuccessMsg}</span>
          </div>
          <button 
            onClick={() => setActionSuccessMsg(null)}
            className="text-emerald-400 hover:text-white p-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        
        <div className="flex items-center gap-3">
          <div className="relative p-3 rounded-2xl bg-gradient-to-br from-red-600 to-red-800 text-white shadow-md shadow-red-900/20">
            <Bell className="w-5 h-5" />
            {totalAlertsCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-amber-500 border-2 border-white rounded-full text-[10px] font-black flex items-center justify-center text-slate-950 animate-pulse">
                {totalAlertsCount}
              </span>
            )}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-black text-slate-900">
                مركز التنبيه التلقائي للإجازات الوظيفية
              </h3>
              {totalAlertsCount > 0 ? (
                <span className="px-2.5 py-0.5 rounded-full bg-red-100 border border-red-300 text-red-800 text-[11px] font-bold">
                  {totalAlertsCount} تنبيهات تتطلب المتابعة
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-800 text-[11px] font-bold">
                  ✓ كافة الإجازات منتظمة
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              مراقبة آلية لاقتراب مواعيد انتهاء الإجازات وطلبات الاعتماد المعلقة لاتخاذ الإجراءات الفورية
            </p>
          </div>
        </div>

        {/* Quick Tabs & Controls */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-between md:justify-end">
          
          <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200 text-xs">
            <button
              onClick={() => setActiveAlertTab('all')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                activeAlertTab === 'all' 
                  ? 'bg-white text-slate-900 shadow-sm' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              الكل ({totalAlertsCount})
            </button>
            <button
              onClick={() => setActiveAlertTab('ending_soon')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 ${
                activeAlertTab === 'ending_soon' 
                  ? 'bg-amber-500 text-slate-950 shadow-sm' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>تنتهي قريباً ({endingSoonAlerts.length})</span>
            </button>
            <button
              onClick={() => setActiveAlertTab('pending_approval')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 ${
                activeAlertTab === 'pending_approval' 
                  ? 'bg-red-700 text-white shadow-sm' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <AlertCircle className="w-3.5 h-3.5" />
              <span>بانتظار الاعتماد ({pendingApprovalAlerts.length})</span>
            </button>
          </div>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
            title={isExpanded ? 'طي التنبيهات' : 'توسيع التنبيهات'}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

      </div>

      {/* Expanded Content Section */}
      {isExpanded && (
        <div className="mt-4 space-y-4">
          
          {/* Quick Filter Bar (Shown if alerts exist) */}
          {totalAlertsCount > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200 text-xs">
              
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="بحث باسم الموظف أو رقم الملف..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-3 pr-8 py-1.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                <div className="flex items-center gap-1.5 text-slate-600">
                  <Filter className="w-3.5 h-3.5 text-slate-400" />
                  <span className="font-bold">القسم:</span>
                </div>
                <select
                  value={departmentFilter}
                  onChange={(e) => setDepartmentFilter(e.target.value)}
                  className="bg-white border border-slate-300 text-slate-800 rounded-xl px-2.5 py-1.5 text-xs outline-none focus:border-red-500"
                >
                  <option value="all">كافة الأقسام والمكاتب</option>
                  {departments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>

                <button
                  onClick={() => setActiveTab('leaves')}
                  className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-800 border border-red-200 rounded-xl font-bold transition-colors flex items-center gap-1"
                >
                  <span>سجل الإجازات الكامل</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>

            </div>
          )}

          {/* SECTION 1: LEAVES ENDING SOON */}
          {(activeAlertTab === 'all' || activeAlertTab === 'ending_soon') && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
                  <h4 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-amber-600" />
                    <span>متابعة الإجازات المشرفة على الانتهاء والمباشرة ({filteredEndingAlerts.length})</span>
                  </h4>
                </div>
                {overdueCount > 0 && (
                  <span className="text-[11px] font-bold text-red-700 bg-red-50 border border-red-200 px-2.5 py-0.5 rounded-lg">
                    🚨 {overdueCount} إجازات انتهت وتتطلب تسجيل مباشرة العمل فوراً
                  </span>
                )}
              </div>

              {filteredEndingAlerts.length === 0 ? (
                activeAlertTab === 'ending_soon' ? (
                  <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-2">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                    <p className="text-xs font-bold text-slate-700">لا توجد إجازات قاربت على الانتهاء خلال هذه الفترة</p>
                    <p className="text-[11px] text-slate-500">كافة الموظفين في وضع إجازات مستقر ومطابق للجداول</p>
                  </div>
                ) : null
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {filteredEndingAlerts.map(({ leave, employee, urgency, urgencyLabel, endDateDisplay, returnDateDisplay, daysRemaining }) => {
                    
                    const isOverdue = urgency === 'overdue';
                    const isToday = urgency === 'today';
                    const isTomorrow = urgency === 'tomorrow';

                    return (
                      <div
                        key={leave.id}
                        className={`p-4 rounded-2xl border transition-all flex flex-col justify-between space-y-3 ${
                          isOverdue
                            ? 'bg-red-50/70 border-red-300 shadow-sm'
                            : isToday || isTomorrow
                            ? 'bg-amber-50/70 border-amber-300 shadow-sm'
                            : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        {/* Card Top Details */}
                        <div className="space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <span className="font-black text-xs text-slate-900 block">{employee.fullName}</span>
                              <span className="text-[11px] text-slate-500 font-mono">ملف: {employee.jobNumber || '—'} | {employee.department}</span>
                            </div>

                            <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black border shrink-0 ${
                              isOverdue
                                ? 'bg-red-700 text-white border-red-800 animate-pulse'
                                : isToday
                                ? 'bg-amber-500 text-slate-950 border-amber-600 font-black'
                                : isTomorrow
                                ? 'bg-amber-100 text-amber-900 border-amber-300 font-bold'
                                : 'bg-slate-200 text-slate-800 border-slate-300'
                            }`}>
                              {urgencyLabel}
                            </span>
                          </div>

                          <div className="p-2.5 rounded-xl bg-white border border-slate-200/80 text-[11px] space-y-1">
                            <div className="flex items-center justify-between text-slate-700">
                              <span className="text-slate-500">نوع الإجازة:</span>
                              <span className="font-bold text-red-800">{leave.leaveType}</span>
                            </div>
                            <div className="flex items-center justify-between text-slate-700">
                              <span className="text-slate-500">تاريخ الانتهاء:</span>
                              <span className="font-bold font-mono text-slate-900">{endDateDisplay}</span>
                            </div>
                            <div className="flex items-center justify-between text-slate-700">
                              <span className="text-slate-500">المباشرة المتوقعة:</span>
                              <span className="font-bold font-mono text-emerald-700">{returnDateDisplay}</span>
                            </div>
                          </div>
                        </div>

                        {/* Card Bottom Quick Actions */}
                        <div className="flex items-center gap-2 pt-1 border-t border-slate-200/60">
                          {isOverdue || isToday ? (
                            <button
                              onClick={() => handleRegisterReturnToDuty(employee, leave)}
                              className="flex-1 py-1.5 px-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-[11px] font-black transition-all flex items-center justify-center gap-1 shadow-sm cursor-pointer"
                              title="تأكيد مباشرة العمل وإعادة الحالة إلى على رأس العمل"
                            >
                              <UserCheck className="w-3.5 h-3.5" />
                              <span>تسجيل مباشرة العمل</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => setActiveTab('leaves')}
                              className="flex-1 py-1.5 px-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold transition-all flex items-center justify-center gap-1 shadow-sm cursor-pointer"
                            >
                              <Calendar className="w-3.5 h-3.5" />
                              <span>متابعة وتمديد</span>
                            </button>
                          )}

                          <button
                            onClick={() => setActiveTab('leaves')}
                            className="p-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-600 border border-slate-300 transition-colors"
                            title="فتح في وحدة الإجازات"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                        </div>

                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* SECTION 2: UNAPPROVED / PENDING LEAVES */}
          {(activeAlertTab === 'all' || activeAlertTab === 'pending_approval') && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                <h4 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-red-700" />
                  <span>طلبات الإجازة غير المعتمدة وبانتظار الإجراء ({filteredPendingAlerts.length})</span>
                </h4>
                <span className="text-[11px] text-slate-500 font-medium">
                  يمكن الاعتماد أو الرفض الفوري المباشر من هذا الجدول
                </span>
              </div>

              {filteredPendingAlerts.length === 0 ? (
                activeAlertTab === 'pending_approval' ? (
                  <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-2">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                    <p className="text-xs font-bold text-slate-700">لا توجد طلبات إجازة معلقة أو بانتظار الاعتماد</p>
                    <p className="text-[11px] text-slate-500">تم تدقيق واعتماد كافة الإجازات المدخلة بالمنظومة</p>
                  </div>
                ) : null
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {filteredPendingAlerts.map(({ leave, employee, startDateDisplay, endDateDisplay, submittedAtDisplay }) => (
                    <div
                      key={leave.id}
                      className="p-4 rounded-2xl bg-red-50/40 border border-red-200 hover:border-red-300 transition-all flex flex-col justify-between space-y-3 shadow-sm"
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="font-black text-xs text-slate-900 block">{employee.fullName}</span>
                            <span className="text-[11px] text-slate-500 font-mono">ملف: {employee.jobNumber || '—'} | {employee.department}</span>
                          </div>
                          <span className="px-2 py-0.5 rounded-lg bg-red-100 border border-red-300 text-red-800 text-[10px] font-black shrink-0">
                            بانتظار الاعتماد
                          </span>
                        </div>

                        <div className="p-2.5 rounded-xl bg-white border border-slate-200/80 text-[11px] space-y-1">
                          <div className="flex items-center justify-between text-slate-700">
                            <span className="text-slate-500">نوع الإجازة:</span>
                            <span className="font-bold text-red-800">{leave.leaveType}</span>
                          </div>
                          <div className="flex items-center justify-between text-slate-700">
                            <span className="text-slate-500">المدة والتواريخ:</span>
                            <span className="font-bold text-slate-900 font-mono">
                              {leave.numberOfDays} يوم ({startDateDisplay} إلى {endDateDisplay})
                            </span>
                          </div>
                          {leave.notes && (
                            <div className="pt-1 text-[10px] text-slate-600 border-t border-slate-100 truncate">
                              <strong>البيان:</strong> {leave.notes}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Direct Approval Actions */}
                      <div className="flex items-center gap-2 pt-1 border-t border-slate-200/60">
                        <button
                          onClick={() => handleQuickApproveLeave(leave.id, employee, leave.leaveType)}
                          className="flex-1 py-1.5 px-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-[11px] font-black transition-all flex items-center justify-center gap-1 shadow-sm cursor-pointer"
                          title="اعتماد الإجازة فورياً"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>اعتماد فوري</span>
                        </button>

                        <button
                          onClick={() => handleQuickRejectLeave(leave.id, employee, leave.leaveType)}
                          className="py-1.5 px-3 rounded-xl bg-red-100 hover:bg-red-200 text-red-800 border border-red-300 text-[11px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
                          title="رفض الإجازة"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>رفض</span>
                        </button>

                        <button
                          onClick={() => setActiveTab('leaves')}
                          className="p-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-600 border border-slate-300 transition-colors"
                          title="مراجعة كاملة في وحدة الإجازات"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                      </div>

                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Clean State Notice (if 0 alerts in 'all' view) */}
          {totalAlertsCount === 0 && (
            <div className="p-8 rounded-2xl bg-emerald-50/60 border border-emerald-200 text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-black text-emerald-950">سجلات الإجازات منتظمة ولا توجد تنبيهات عاجلة</h4>
              <p className="text-xs text-emerald-800 max-w-md mx-auto leading-relaxed">
                لا توجد إجازات قاربت على الانتهاء خلال الأيام القادمة، كما تم اعتماد ومراجعة جميع طلبات الإجازات المسجلة.
              </p>
            </div>
          )}

        </div>
      )}

    </div>
  );
};
