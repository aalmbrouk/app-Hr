import React, { useState } from 'react';
import { ActiveTab } from '../types';
import { 
  LayoutDashboard, 
  Users, 
  FileSpreadsheet, 
  BarChart3, 
  ShieldCheck, 
  History, 
  FileCode2,
  HardDrive,
  Calendar,
  TrendingUp,
  Building2,
  ArrowLeftRight,
  AlertTriangle,
  UserX,
  Clock,
  Sliders,
  Database,
  Award,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  employeeCount: number;
  logCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  employeeCount,
  logCount
}) => {
  const [showSecondaryModules, setShowSecondaryModules] = useState(false);

  // Clean Primary Navigation - Focused strictly on everyday employee management
  const primaryNavItems = [
    {
      id: 'dashboard' as ActiveTab,
      label: 'الرئيسية',
      icon: LayoutDashboard,
      badge: null
    },
    {
      id: 'employees' as ActiveTab,
      label: 'الموظفون',
      icon: Users,
      badge: employeeCount.toLocaleString('ar-LY')
    },
    {
      id: 'history' as ActiveTab,
      label: 'السيرة الوظيفية',
      icon: Clock,
      badge: null
    },
    {
      id: 'leaves' as ActiveTab,
      label: 'الإجازات',
      icon: Calendar,
      badge: null
    },
    {
      id: 'promotions' as ActiveTab,
      label: 'الترقيات الوظيفية',
      icon: TrendingUp,
      badge: null
    },
    {
      id: 'reports' as ActiveTab,
      label: 'التقارير',
      icon: FileSpreadsheet,
      badge: null
    },
    {
      id: 'general_procedures' as ActiveTab,
      label: 'إجراءات عامة',
      icon: FileCode2,
      badge: 'مجمعة'
    },
    {
      id: 'backup' as ActiveTab,
      label: 'الإعدادات / النسخ الاحتياطي',
      icon: HardDrive,
      badge: null
    }
  ];

  // Complementary HR modules for secondary administration
  const secondaryModuleItems = [
    {
      id: 'annual_evaluations' as ActiveTab,
      label: 'تقارير الكفاءة السنوية',
      icon: Award,
      badge: 'رسمي'
    },
    {
      id: 'org_structure' as ActiveTab,
      label: 'الهيكل التنظيمي والوظائف',
      icon: Database,
      badge: null
    },
    {
      id: 'secondments' as ActiveTab,
      label: 'الندب والتكليف والإعارة',
      icon: Building2,
      badge: null
    },
    {
      id: 'transfers' as ActiveTab,
      label: 'حركات النقل',
      icon: ArrowLeftRight,
      badge: null
    },
    {
      id: 'disciplinary' as ActiveTab,
      label: 'الجزاءات والإنذارات',
      icon: AlertTriangle,
      badge: null
    },
    {
      id: 'resignations' as ActiveTab,
      label: 'نهاية الخدمة والاستقالات',
      icon: UserX,
      badge: null
    },
    {
      id: 'statistics' as ActiveTab,
      label: 'الإحصاءات والرسوم البيانية',
      icon: BarChart3,
      badge: null
    },
    {
      id: 'users' as ActiveTab,
      label: 'المستخدمون والصلاحيات',
      icon: ShieldCheck,
      badge: null
    },
    {
      id: 'logs' as ActiveTab,
      label: 'سجل تدقيق العمليات',
      icon: History,
      badge: logCount > 0 ? logCount.toString() : null
    },
    {
      id: 'hr_rules' as ActiveTab,
      label: 'قواعد اللوائح (HR Rules)',
      icon: Sliders,
      badge: null
    }
  ];

  const isSecondaryActive = secondaryModuleItems.some((item) => item.id === activeTab);

  return (
    <aside className="w-full md:w-64 bg-white border-l border-slate-200 text-slate-800 flex-shrink-0 min-h-[calc(100vh-73px)] shadow-xs">
      <div className="p-3">
        {/* Primary Navigation Section */}
        <div className="mb-4">
          <div className="px-3 py-1.5 text-[11px] font-black text-slate-500 uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>القائمة الرئيسية</span>
            <span className="text-[10px] text-slate-400 font-normal">المهام اليومية</span>
          </div>
          <nav className="space-y-1">
            {primaryNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              const isGeneralProcedures = item.id === 'general_procedures';

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer group ${
                    isActive
                      ? 'bg-red-700 text-white font-black shadow-md shadow-red-900/10'
                      : isGeneralProcedures
                      ? 'text-slate-800 hover:bg-red-50/80 hover:text-red-900 border border-slate-200/60'
                      : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon
                      className={`w-4 h-4 flex-shrink-0 transition-transform group-hover:scale-105 ${
                        isActive 
                          ? 'text-white' 
                          : isGeneralProcedures 
                          ? 'text-red-700' 
                          : 'text-slate-500 group-hover:text-red-700'
                      }`}
                    />
                    <span className="truncate">{item.label}</span>
                  </div>

                  {item.badge && (
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold flex-shrink-0 ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : isGeneralProcedures
                          ? 'bg-red-100 text-red-800'
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Secondary Modules Section (Collapsible to keep interface ultra-clean) */}
        <div className="pt-2 border-t border-slate-200">
          <button
            type="button"
            onClick={() => setShowSecondaryModules((prev) => !prev)}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <span className="text-[11px] font-black text-slate-500 uppercase tracking-wider">
              سجلات ووحدات إضافية
            </span>
            <div className="flex items-center gap-1 text-slate-400">
              {isSecondaryActive && (
                <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
              )}
              {showSecondaryModules || isSecondaryActive ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </div>
          </button>

          {(showSecondaryModules || isSecondaryActive) && (
            <div className="mt-1 space-y-0.5 animate-in fade-in duration-150">
              {secondaryModuleItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer group ${
                      isActive
                        ? 'bg-red-700 text-white font-black shadow-xs'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon
                        className={`w-3.5 h-3.5 flex-shrink-0 ${
                          isActive ? 'text-white' : 'text-slate-400 group-hover:text-red-700'
                        }`}
                      />
                      <span className="truncate">{item.label}</span>
                    </div>

                    {item.badge && (
                      <span
                        className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold flex-shrink-0 ${
                          isActive
                            ? 'bg-white/20 text-white'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Brand Emblem Footer Box */}
        <div className="mt-6 p-3 rounded-2xl bg-slate-50 border border-slate-200 text-center">
          <div className="w-9 h-9 mx-auto mb-1.5 rounded-xl bg-white border border-red-300 p-0.5 shadow-xs flex items-center justify-center overflow-hidden">
            <img src="/logo.jpg" alt="Logo" className="w-full h-full object-contain" />
          </div>
          <h4 className="text-xs font-black text-slate-900">مصرف الدم المركزي المرج</h4>
          <p className="text-[10px] text-slate-500 font-medium">إدارة الموارد البشرية - ليبيا</p>
        </div>
      </div>
    </aside>
  );
};
