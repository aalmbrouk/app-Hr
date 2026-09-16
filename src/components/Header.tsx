import React, { useState, useEffect } from 'react';
import { UserAccount, ActiveTab, Employee, CareerPromotionRecord } from '../types';
import { LogOut, Shield, Database, Clock, HardDrive, FileCode, Droplet, UserCheck } from 'lucide-react';
import { GlobalQuickSearch } from './GlobalQuickSearch';

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
  onSelectEmployee
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
    <header className="bg-gradient-to-r from-red-950 via-red-900 to-red-950 text-white shadow-lg border-b border-red-800/60 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Logo & Title */}
          <div className="flex items-center gap-3.5 w-full md:w-auto justify-between md:justify-start">
            <div className="flex items-center gap-3.5">
              <div className="relative flex items-center justify-center w-14 h-14 rounded-2xl bg-white border-2 border-red-400 p-0.5 shadow-lg group shrink-0">
                <img 
                  src="/logo.jpg" 
                  alt="شعار مصرف الدم المركزي بلدية المرج - ليبيا" 
                  className="w-full h-full object-contain rounded-xl group-hover:scale-105 transition-transform"
                />
                <div className="absolute -bottom-1 -right-1 bg-emerald-500 w-4 h-4 rounded-full border-2 border-red-950 shadow-sm" title="قاعدة البيانات متصلة ومحميّة" />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-black tracking-wide text-white drop-shadow-sm">
                  مصرف الدم المركزي بلدية المرج - ليبيا
                </h1>
                <p className="text-xs text-red-200/90 font-medium flex items-center gap-2 mt-0.5">
                  <span>منظومة إدارة الموارد البشرية والحسابات الوظيفية (Excel VBA Core)</span>
                  <span className="bg-red-800/90 px-2.5 py-0.5 rounded-md text-[10px] text-red-100 border border-red-700/80 font-bold">
                    {employeeCount.toLocaleString('ar-LY')} موظف
                  </span>
                </p>
              </div>
            </div>

            {/* Mobile menu user badge */}
            <div className="md:hidden flex items-center gap-2">
              <button
                onClick={onLogout}
                className="p-2 rounded-lg bg-red-800/60 hover:bg-red-700 text-red-100 border border-red-700 transition-colors"
                title="تسجيل الخروج"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Global Quick Search - Always visible in the main header */}
          <div className="flex-1 max-w-xl mx-2 flex justify-center order-3 md:order-2 w-full md:w-auto">
            <GlobalQuickSearch
              employees={employees}
              careerRecords={careerRecords}
              onSelectEmployee={onSelectEmployee}
              className="w-full flex justify-center"
            />
          </div>

          {/* Quick Actions & User Profile */}
          <div className="hidden md:flex items-center gap-3 order-2 md:order-3">
            <button
              onClick={() => setActiveTab('vba_code')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                activeTab === 'vba_code'
                  ? 'bg-amber-500 text-slate-950 border-amber-300 shadow-md shadow-amber-500/20'
                  : 'bg-red-800/50 hover:bg-red-800 text-amber-200 border-red-700'
              }`}
            >
              <FileCode className="w-4 h-4" />
              <span>أكواد VBA والتصدير</span>
            </button>

            <button
              onClick={onQuickBackup}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-800/40 hover:bg-red-800/80 text-red-100 border border-red-700/60 transition-all"
              title="توليد نسخة احتياطية فورية"
            >
              <HardDrive className="w-3.5 h-3.5 text-emerald-400" />
              <span>نسخة احتياطية</span>
            </button>

            {currentUser && (
              <div className="flex items-center gap-2 bg-red-950/80 border border-red-800/80 rounded-xl px-3 py-1.5">
                <div className="w-8 h-8 rounded-lg bg-red-800 border border-red-600 flex items-center justify-center text-red-100 font-black text-xs">
                  {currentUser.role.includes('1') ? 'A1' : 'A2'}
                </div>
                <div className="text-right leading-tight">
                  <p className="text-xs font-bold text-white flex items-center gap-1">
                    <UserCheck className="w-3 h-3 text-emerald-400" />
                    {currentUser.displayName}
                  </p>
                  <p className="text-[10px] text-red-300 font-mono">{currentUser.role}</p>
                </div>
                <button
                  onClick={onLogout}
                  className="mr-2 p-1.5 rounded-lg bg-red-900/80 hover:bg-red-700 text-red-200 hover:text-white transition-colors"
                  title="تسجيل الخروج"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

        </div>
      </div>
    </header>
  );
};
