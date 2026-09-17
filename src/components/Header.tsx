import React, { useState, useEffect } from 'react';
import { UserAccount, ActiveTab, Employee, CareerPromotionRecord } from '../types';
import { LogOut, Shield, Database, Clock, HardDrive, FileCode, Droplet, UserCheck, Sparkles } from 'lucide-react';
import { GlobalQuickSearch } from './GlobalQuickSearch';
import { GlobalSearchResult } from '../utils/globalSearchEngine';

interface HeaderProps {
  currentUser: UserAccount | null;
  onLogout: () => void;
  setActiveTab: (tab: ActiveTab) => void;
  activeTab: ActiveTab;
  employeeCount: number;
  onQuickBackup: () => void;
  employees: Employee[];
  careerRecords?: CareerPromotionRecord[];
  onSelectEmployee: (employee: Employee) => void;
  onSelectResult?: (result: GlobalSearchResult) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  onLogout,
  setActiveTab,
  activeTab,
  employeeCount,
  onQuickBackup,
  employees,
  careerRecords = [],
  onSelectEmployee,
  onSelectResult
}) => {
  const [timeString, setTimeString] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeString(
        now.toLocaleDateString('ar-LY', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }) +
          ' - ' +
          now.toLocaleTimeString('ar-LY', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="bg-slate-900 text-white shadow-md border-b border-slate-800 sticky top-0 z-30 transition-colors" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          
          {/* Logo & Title */}
          <div className="flex items-center gap-3.5 w-full md:w-auto justify-between md:justify-start">
            <div className="flex items-center gap-3">
              <div className="relative flex items-center justify-center w-12 h-12 rounded-xl bg-white border border-slate-200 p-0.5 shadow-sm group shrink-0">
                <img 
                  src="/logo.jpg" 
                  alt="شعار مصرف الدم المركزي بلدية المرج - ليبيا" 
                  className="w-full h-full object-contain rounded-lg group-hover:scale-105 transition-transform"
                />
                <div 
                  className="absolute -bottom-1 -right-1 bg-emerald-500 w-3.5 h-3.5 rounded-full border-2 border-slate-900 shadow-xs" 
                  title="قاعدة البيانات متصلة ومحميّة" 
                />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base md:text-lg font-black tracking-tight text-white drop-shadow-xs">
                    مصرف الدم المركزي المرج
                  </h1>
                  <span className="hidden lg:inline-flex items-center gap-1 text-[11px] font-semibold text-teal-300 bg-teal-950/80 border border-teal-700/50 px-2 py-0.5 rounded-md">
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
                    بلدية المرج - ليبيا
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 font-medium flex items-center gap-2 mt-0.5">
                  <span className="truncate">منظومة الشؤون الإدارية والموارد البشرية (Excel VBA Core)</span>
                  <span className="bg-slate-800 px-2 py-0.2 rounded text-[10px] text-teal-300 border border-slate-700 font-bold shrink-0">
                    {employeeCount.toLocaleString('ar-LY')} موظف
                  </span>
                </p>
              </div>
            </div>

            {/* Mobile menu user badge */}
            <div className="md:hidden flex items-center gap-2">
              <button
                onClick={onLogout}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
                title="تسجيل الخروج"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Global Smart Search Bar - Always accessible in the top header */}
          <div className="flex-1 max-w-xl mx-1 md:mx-4 flex justify-center order-3 md:order-2 w-full md:w-auto">
            <GlobalQuickSearch
              employees={employees}
              careerRecords={careerRecords}
              onSelectEmployee={onSelectEmployee}
              onSelectResult={onSelectResult}
              className="w-full flex justify-center"
            />
          </div>

          {/* Quick Actions & User Profile */}
          <div className="hidden md:flex items-center gap-2.5 order-2 md:order-3">
            <button
              onClick={() => setActiveTab('vba_code')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                activeTab === 'vba_code'
                  ? 'bg-amber-500 text-slate-950 border-amber-300 shadow-sm shadow-amber-500/20'
                  : 'bg-slate-800/80 hover:bg-slate-800 text-amber-200 border-slate-700'
              }`}
              title="أكواد VBA ووحدات الماكرو"
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>أكواد VBA</span>
            </button>

            <button
              onClick={onQuickBackup}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800/80 hover:bg-slate-800 text-slate-200 border border-slate-700 hover:border-slate-600 transition-all cursor-pointer"
              title="توليد نسخة احتياطية فورية لقاعدة البيانات"
            >
              <HardDrive className="w-3.5 h-3.5 text-teal-400" />
              <span>نسخ احتياطي</span>
            </button>

            {currentUser && (
              <div className="flex items-center gap-2 bg-slate-800/90 border border-slate-700/80 rounded-xl px-2.5 py-1.5 shadow-xs">
                <div className="w-7 h-7 rounded-lg bg-teal-900/60 border border-teal-700/60 flex items-center justify-center text-teal-200 font-black text-[11px]">
                  {currentUser.role.includes('1') ? 'A1' : 'A2'}
                </div>
                <div className="text-right leading-tight">
                  <p className="text-xs font-bold text-white flex items-center gap-1">
                    <UserCheck className="w-3 h-3 text-teal-400" />
                    {currentUser.displayName}
                  </p>
                  <p className="text-[10px] text-slate-400 font-mono">{currentUser.role}</p>
                </div>
                <button
                  onClick={onLogout}
                  className="mr-1.5 p-1 rounded-md bg-slate-700/60 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                  title="تسجيل الخروج"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

        </div>
      </div>
    </header>
  );
};
