import React from 'react';
import { ActiveTab } from '../types';
import { 
  LayoutDashboard, 
  Users, 
  Search, 
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
  Database
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
  const mainNavItems = [
    {
      id: 'dashboard' as ActiveTab,
      label: 'الرئيسية واللوحة الإحصائية',
      icon: LayoutDashboard,
      badge: null
    },
    {
      id: 'employees' as ActiveTab,
      label: 'إدارة الموظفين والملفات',
      icon: Users,
      badge: employeeCount.toLocaleString('ar-LY')
    },
    {
      id: 'search' as ActiveTab,
      label: 'الاستعلام السريع والبطاقات',
      icon: Search,
      badge: 'محدث'
    }
  ];

  const hrModuleItems = [
    {
      id: 'leaves' as ActiveTab,
      label: 'الإجازات والسنوات (30/45 يوم)',
      icon: Calendar,
      badge: null
    },
    {
      id: 'promotions' as ActiveTab,
      label: 'الترقيات والعلاوات الدورية',
      icon: TrendingUp,
      badge: null
    },
    {
      id: 'general_procedures' as ActiveTab,
      label: 'الإجراءات الوظيفية والقرارات العامة',
      icon: FileCode2,
      badge: 'جديد'
    },
    {
      id: 'org_structure' as ActiveTab,
      label: 'قاعدة الهيكل التنظيمي والوظائف',
      icon: Database,
      badge: null
    },
    {
      id: 'secondments' as ActiveTab,
      label: 'الندب والتكليف والإعارات',
      icon: Building2,
      badge: null
    },
    {
      id: 'transfers' as ActiveTab,
      label: 'النقل الداخلي والخارجي',
      icon: ArrowLeftRight,
      badge: null
    },
    {
      id: 'disciplinary' as ActiveTab,
      label: 'الجزاءات والخصومات والإنذارات',
      icon: AlertTriangle,
      badge: null
    },
    {
      id: 'resignations' as ActiveTab,
      label: 'الاستقالات ونهاية الخدمة',
      icon: UserX,
      badge: null
    },
    {
      id: 'history' as ActiveTab,
      label: 'السجل التاريخي الشامل للموظف',
      icon: Clock,
      badge: null
    },
    {
      id: 'hr_rules' as ActiveTab,
      label: 'إعدادات وقواعد اللوائح (HR Rules)',
      icon: Sliders,
      badge: 'تعديل'
    }
  ];

  const systemNavItems = [
    {
      id: 'reports' as ActiveTab,
      label: 'التقارير والتصدير (PDF/Excel)',
      icon: FileSpreadsheet,
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
      badge: 'Admins'
    },
    {
      id: 'logs' as ActiveTab,
      label: 'سجل تدقيق العمليات (Logs)',
      icon: History,
      badge: logCount.toString()
    },
    {
      id: 'backup' as ActiveTab,
      label: 'النسخ الاحتياطي والإعدادات',
      icon: HardDrive,
      badge: null
    },
    {
      id: 'vba_code' as ActiveTab,
      label: 'أكواد VBA الكاملة للإكسل',
      icon: FileCode2,
      badge: 'VBA Core'
    }
  ];

  const renderNavGroup = (title: string, items: typeof mainNavItems) => (
    <div className="mb-4">
      <div className="px-3 py-1.5 text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1.5">
        <span>{title}</span>
      </div>
      <div className="space-y-0.5">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          const isVba = item.id === 'vba_code';

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all group ${
                isActive
                  ? isVba 
                    ? 'bg-amber-500 text-slate-950 font-black shadow'
                    : 'bg-red-700 text-white font-black shadow-md shadow-red-900/10'
                  : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Icon
                  className={`w-4 h-4 flex-shrink-0 transition-transform group-hover:scale-105 ${
                    isActive 
                      ? isVba ? 'text-slate-950' : 'text-white'
                      : isVba ? 'text-amber-600' : 'text-red-700 group-hover:text-red-800'
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </div>

              {item.badge && (
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold flex-shrink-0 ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-100 text-slate-600 border border-slate-200'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <aside className="w-full md:w-64 bg-white border-l border-slate-200 text-slate-800 flex-shrink-0 min-h-[calc(100vh-73px)] shadow-sm">
      <div className="p-3">
        {renderNavGroup('القسم الرئيسي', mainNavItems)}
        {renderNavGroup('وحدات الشؤون الوظيفية HR', hrModuleItems)}
        {renderNavGroup('النظام والتقارير', systemNavItems)}

        {/* Brand Emblem Footer Box */}
        <div className="mt-4 p-3 rounded-2xl bg-slate-50 border border-slate-200 text-center">
          <div className="w-9 h-9 mx-auto mb-1.5 rounded-xl bg-white border border-red-300 p-0.5 shadow-sm flex items-center justify-center overflow-hidden">
            <img src="/logo.jpg" alt="Logo" className="w-full h-full object-contain" />
          </div>
          <h4 className="text-xs font-black text-slate-900">مصرف الدم المركزي بلدية المرج</h4>
          <p className="text-[10px] text-slate-500 font-medium">نظام الموارد البشرية - دولة ليبيا</p>
        </div>
      </div>
    </aside>
  );
};
