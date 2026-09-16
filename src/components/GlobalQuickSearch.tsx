import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Search, User, FileText, ArrowRight, CornerDownLeft, Sparkles, X } from 'lucide-react';
import { Employee, CareerPromotionRecord } from '../types';
import { globalEmployeeSearch, GlobalSearchResult } from '../utils/globalSearchEngine';

interface GlobalQuickSearchProps {
  employees: Employee[];
  careerRecords?: CareerPromotionRecord[];
  onSelectEmployee: (employee: Employee) => void;
  className?: string;
}

export const GlobalQuickSearch: React.FC<GlobalQuickSearchProps> = ({
  employees,
  careerRecords = [],
  onSelectEmployee,
  className = ''
}) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Compute search results with priority ranking
  const results: GlobalSearchResult[] = useMemo(() => {
    if (!query.trim()) return [];
    return globalEmployeeSearch(query, employees, careerRecords, 10);
  }, [query, employees, careerRecords]);

  // Reset selected index on new query
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Handle outside clicks to close dropdown
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Global Keyboard Shortcut: Ctrl + K (or Cmd + K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
        setIsOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSelect = (emp: Employee) => {
    setIsOpen(false);
    setQuery('');
    onSelectEmployee(emp);
  };

  const handleKeyDownInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
      inputRef.current?.blur();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (results.length > 0) {
        setSelectedIndex((prev) => (prev + 1) % results.length);
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (results.length > 0) {
        setSelectedIndex((prev) => (prev - 1 + results.length) % results.length);
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (results.length > 0 && results[selectedIndex]) {
        handleSelect(results[selectedIndex].employee);
      }
    }
  };

  return (
    <div ref={containerRef} className={`relative ${className}`} id="global-quick-search-container">
      {/* Search Input Box */}
      <div className="relative flex items-center">
        <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-red-300 pointer-events-none flex items-center gap-1">
          <Search className="w-4 h-4 text-amber-400" />
        </div>

        <input
          ref={inputRef}
          type="text"
          value={query}
          onFocus={() => {
            if (query.trim()) setIsOpen(true);
          }}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onKeyDown={handleKeyDownInput}
          placeholder="ابحث باسم الموظف أو الرقم الوطني أو الرقم الوظيفي أو أي بيانات..."
          aria-label="Global Quick Search - بحث سريع"
          className="w-full sm:w-[340px] md:w-[420px] lg:w-[480px] bg-red-950/70 hover:bg-red-950/90 focus:bg-white text-white focus:text-slate-900 pr-10 pl-20 py-2 rounded-xl text-xs font-bold border border-red-700/80 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/30 transition-all shadow-inner placeholder:text-red-300/70"
        />

        {/* Clear Button & Keyboard Shortcut Badge */}
        <div className="absolute left-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
          {query ? (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setIsOpen(false);
                inputRef.current?.focus();
              }}
              className="p-1 rounded-md text-red-300 hover:text-white hover:bg-red-800/80 transition-colors"
              title="مسح البحث"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : (
            <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-0.5 text-[10px] font-mono font-bold text-red-200/80 bg-red-900/60 border border-red-700/60 rounded-md select-none">
              <span>Ctrl</span>
              <span>+</span>
              <span>K</span>
            </kbd>
          )}
        </div>
      </div>

      {/* Results Dropdown Panel */}
      {isOpen && query.trim() && (
        <div 
          className="absolute right-0 top-full mt-2 w-full sm:w-[460px] md:w-[520px] bg-white rounded-2xl shadow-2xl border border-slate-200/90 z-50 overflow-hidden text-right animate-in fade-in slide-in-from-top-1 duration-150"
          id="global-search-results-dropdown"
        >
          {/* Header Info */}
          <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-[11px] font-bold text-slate-600">
            <div className="flex items-center gap-1.5">
              <span className="text-red-700 font-extrabold">نتائج البحث السريع</span>
              <span className="bg-red-100 text-red-800 text-[10px] px-2 py-0.2 rounded-full font-black">
                {results.length}
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-normal hidden sm:inline">
              اضغط Enter لفتح الملف، أو Esc للإغلاق
            </span>
          </div>

          {/* Results List */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100">
            {results.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                  <Search className="w-5 h-5" />
                </div>
                <p className="font-extrabold text-sm text-slate-800">لا توجد نتائج مطابقة</p>
                <p className="text-xs text-slate-500 mt-1">
                  تأكد من كتابة الاسم أو الرقم الوطني أو الرقم الوظيفي بشكل صحيح
                </p>
              </div>
            ) : (
              results.map((res, index) => {
                const emp = res.employee;
                const isSelected = index === selectedIndex;

                return (
                  <div
                    key={emp.id}
                    onClick={() => handleSelect(emp)}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={`p-3.5 transition-colors cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected ? 'bg-red-50/80 border-r-4 border-red-700' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      {/* Employee Name & Job Grade */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <User className="w-4 h-4 text-red-700 shrink-0" />
                          <span className="font-black text-xs text-slate-900 truncate">
                            {emp.fullName}
                          </span>
                        </div>
                        <span className="shrink-0 bg-slate-100 text-slate-800 text-[10px] px-2 py-0.5 rounded-md font-bold border border-slate-200">
                          الدرجة: {emp.jobGrade} {emp.currentIncrement ? `(علاوة ${emp.currentIncrement})` : ''}
                        </span>
                      </div>

                      {/* Details row: Job Number, National ID */}
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-[11px] text-slate-600 font-mono">
                        <span className="flex items-center gap-1 font-bold text-red-950">
                          <span className="text-[10px] text-slate-500 font-sans font-normal">الرقم الوظيفي:</span>
                          <span>{emp.jobNumber || '—'}</span>
                        </span>
                        <span className="flex items-center gap-1 font-bold text-slate-700">
                          <span className="text-[10px] text-slate-500 font-sans font-normal">الرقم الوطني:</span>
                          <span>{emp.nationalId || '—'}</span>
                        </span>
                      </div>

                      {/* Department / Work Location / Matched Reason */}
                      <div className="flex flex-wrap items-center gap-2 mt-1.5 text-[11px] text-slate-500">
                        <span className="truncate max-w-[200px] text-slate-700 font-medium">
                          {emp.department || 'إدارة عامة'}
                          {emp.workLocation ? ` - ${emp.workLocation}` : ''}
                        </span>

                        {res.matchDescription && (
                          <span className="text-[10px] bg-amber-50 text-amber-900 border border-amber-200 px-1.5 py-0.2 rounded font-semibold truncate">
                            {res.matchDescription}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="shrink-0 text-slate-400 flex items-center">
                      <CornerDownLeft className="w-4 h-4 text-red-700" />
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer of Dropdown */}
          {results.length > 0 && (
            <div className="p-2.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-500">
              <span>انقر بالماوس أو اضغط Enter لفتح الملف التعريفي الشامل للموظف</span>
              <span className="font-mono text-slate-400">Ctrl + K</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
