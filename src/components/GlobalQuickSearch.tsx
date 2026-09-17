import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Search, 
  User, 
  FileText, 
  Settings, 
  Wrench, 
  ChevronRight, 
  Sparkles, 
  X, 
  CornerDownLeft, 
  ArrowRight,
  Filter,
  Layers,
  Award,
  Calendar,
  Clock,
  HardDrive,
  Users,
  ShieldAlert,
  Sliders,
  CheckCircle2,
  FileCode2,
  AlertCircle
} from 'lucide-react';
import { Employee, CareerPromotionRecord, ActiveTab } from '../types';
import { 
  globalSmartSearch, 
  GlobalSearchResult, 
  SearchCategory,
  groupSearchResultsByCategory 
} from '../utils/globalSearchEngine';

interface GlobalQuickSearchProps {
  employees: Employee[];
  careerRecords?: CareerPromotionRecord[];
  onSelectEmployee: (employee: Employee) => void;
  onSelectResult?: (result: GlobalSearchResult) => void;
  className?: string;
}

export const GlobalQuickSearch: React.FC<GlobalQuickSearchProps> = ({
  employees,
  careerRecords = [],
  onSelectEmployee,
  onSelectResult,
  className = ''
}) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<'all' | SearchCategory>('all');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Compute search results across all categories
  const allResults: GlobalSearchResult[] = useMemo(() => {
    if (!query.trim()) return [];
    return globalSmartSearch(query, employees, careerRecords, 30);
  }, [query, employees, careerRecords]);

  // Filtered by selected category chip if any
  const visibleResults = useMemo(() => {
    if (activeCategoryFilter === 'all') return allResults;
    return allResults.filter(r => r.category === activeCategoryFilter);
  }, [allResults, activeCategoryFilter]);

  // Grouped for display
  const grouped = useMemo(() => {
    return groupSearchResultsByCategory(visibleResults);
  }, [visibleResults]);

  // Reset selected index on query or category change
  useEffect(() => {
    setSelectedIndex(0);
  }, [query, activeCategoryFilter]);

  // Close on outside clicks
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Keyboard shortcut: Ctrl + K or Cmd + K
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

  const handleExecuteResult = (res: GlobalSearchResult) => {
    setIsOpen(false);
    setQuery('');
    if (onSelectResult) {
      onSelectResult(res);
    } else if (res.employee) {
      onSelectEmployee(res.employee);
    }
  };

  const handleKeyDownInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
      inputRef.current?.blur();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (visibleResults.length > 0) {
        setSelectedIndex(prev => (prev + 1) % visibleResults.length);
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (visibleResults.length > 0) {
        setSelectedIndex(prev => (prev - 1 + visibleResults.length) % visibleResults.length);
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (visibleResults.length > 0 && visibleResults[selectedIndex]) {
        handleExecuteResult(visibleResults[selectedIndex]);
      }
    }
  };

  const getCategoryIcon = (category: SearchCategory) => {
    switch (category) {
      case 'employees':
        return <User className="w-4 h-4 text-blue-600" />;
      case 'reports':
        return <FileText className="w-4 h-4 text-emerald-600" />;
      case 'tools':
        return <Wrench className="w-4 h-4 text-amber-600" />;
      case 'features':
        return <Layers className="w-4 h-4 text-indigo-600" />;
    }
  };

  const getCategoryLabel = (category: SearchCategory) => {
    switch (category) {
      case 'employees':
        return 'الموظفون';
      case 'reports':
        return 'التقارير';
      case 'tools':
        return 'الأدوات والإجراءات';
      case 'features':
        return 'الخصائص والإعدادات';
    }
  };

  const getActionLabel = (res: GlobalSearchResult) => {
    if (res.category === 'employees') return 'فتح ملف الموظف';
    if (res.category === 'reports') return 'فتح التقرير';
    if (res.category === 'tools') return 'فتح الإجراء';
    return 'الانتقال للخاصية';
  };

  return (
    <div ref={containerRef} className={`relative ${className}`} id="global-smart-search-container">
      {/* Search Input Bar */}
      <div className="relative flex items-center w-full">
        {/* Search Icon & Prefix Label */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none flex items-center gap-1.5">
          <Search className="w-4 h-4 text-teal-600" />
          <span className="hidden sm:inline-block text-[11px] font-bold text-slate-500 border-l border-slate-300 pl-1.5 ml-1">
            البحث الشامل
          </span>
        </div>

        <input
          ref={inputRef}
          id="global-smart-search-input"
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => {
            if (query.trim()) setIsOpen(true);
          }}
          onKeyDown={handleKeyDownInput}
          placeholder="ابحث عن موظف، تقرير، أداة، إجراء أو خاصية... (Ctrl+K)"
          className="w-full pl-20 pr-32 py-2 text-xs sm:text-sm bg-white/95 text-slate-900 placeholder:text-slate-400 rounded-xl border border-slate-200/90 shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500 focus:bg-white transition-all"
          autoComplete="off"
          dir="rtl"
        />

        {/* Clear and Keyboard Shortcut */}
        <div className="absolute left-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setIsOpen(false);
                inputRef.current?.focus();
              }}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              title="مسح نص البحث"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <kbd className="hidden md:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono text-slate-600 bg-slate-100 border border-slate-200 rounded shadow-xs select-none">
            <span className="text-[9px]">Ctrl</span>+<span>K</span>
          </kbd>
        </div>
      </div>

      {/* Results Dropdown Palette */}
      {isOpen && query.trim().length > 0 && (
        <div 
          ref={dropdownRef}
          className="absolute z-50 right-0 top-full mt-2 w-full min-w-[340px] md:min-w-[620px] max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200/90 overflow-hidden text-slate-800 animate-in fade-in zoom-in-95 duration-150"
          dir="rtl"
        >
          {/* Header with category chips */}
          <div className="bg-slate-50/90 p-2.5 border-b border-slate-200/80 flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] font-bold text-slate-600 ml-1">التصنيف:</span>
              <button
                type="button"
                onClick={() => setActiveCategoryFilter('all')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                  activeCategoryFilter === 'all'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:bg-slate-200/60 border border-slate-200'
                }`}
              >
                الكل ({allResults.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveCategoryFilter('employees')}
                className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition-all flex items-center gap-1 ${
                  activeCategoryFilter === 'employees'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:bg-slate-200/60 border border-slate-200'
                }`}
              >
                <User className="w-3 h-3" />
                الموظفون ({grouped.employees.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveCategoryFilter('reports')}
                className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition-all flex items-center gap-1 ${
                  activeCategoryFilter === 'reports'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:bg-slate-200/60 border border-slate-200'
                }`}
              >
                <FileText className="w-3 h-3" />
                التقارير ({grouped.reports.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveCategoryFilter('tools')}
                className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition-all flex items-center gap-1 ${
                  activeCategoryFilter === 'tools'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:bg-slate-200/60 border border-slate-200'
                }`}
              >
                <Wrench className="w-3 h-3" />
                الإجراءات ({grouped.tools.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveCategoryFilter('features')}
                className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition-all flex items-center gap-1 ${
                  activeCategoryFilter === 'features'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:bg-slate-200/60 border border-slate-200'
                }`}
              >
                <Layers className="w-3 h-3" />
                الخصائص ({grouped.features.length})
              </button>
            </div>

            <div className="text-[11px] text-slate-500 font-medium">
              نتائج البحث عن: <strong className="text-slate-800">"{query}"</strong>
            </div>
          </div>

          {/* Results List */}
          <div className="max-h-[460px] overflow-y-auto divide-y divide-slate-100 p-1.5 space-y-1">
            {visibleResults.length === 0 ? (
              <div className="p-8 text-center">
                <div className="w-12 h-12 rounded-full bg-slate-100 mx-auto flex items-center justify-center text-slate-400 mb-3">
                  <AlertCircle className="w-6 h-6 text-slate-400" />
                </div>
                <h4 className="text-sm font-bold text-slate-700 mb-1">
                  لا توجد نتائج مطابقة لـ "{query}"
                </h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                  جرّب البحث باسم موظف، رقم وطني، أو كلمات دلالية مثل:
                  <span className="font-bold text-teal-700"> كفاءة</span>،
                  <span className="font-bold text-teal-700"> 418</span>،
                  <span className="font-bold text-teal-700"> استيراد</span>،
                  <span className="font-bold text-teal-700"> ترقية</span>،
                  أو <span className="font-bold text-teal-700">إجازة</span>.
                </p>
              </div>
            ) : (
              // Render Categorized Sections
              (['reports', 'tools', 'features', 'employees'] as SearchCategory[]).map(cat => {
                const catItems = visibleResults.filter(r => r.category === cat);
                if (catItems.length === 0) return null;

                return (
                  <div key={cat} className="pt-2 pb-1">
                    {/* Section Header */}
                    <div className="px-3 py-1 flex items-center justify-between text-[11px] font-black text-slate-500 uppercase tracking-wider mb-1">
                      <span className="flex items-center gap-1.5">
                        {getCategoryIcon(cat)}
                        <span>{getCategoryLabel(cat)}</span>
                      </span>
                      <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                        {catItems.length}
                      </span>
                    </div>

                    {/* Items */}
                    <div className="space-y-1">
                      {catItems.map((item) => {
                        const globalIndex = visibleResults.findIndex(r => r.id === item.id);
                        const isSelected = globalIndex === selectedIndex;

                        return (
                          <div
                            key={item.id}
                            onClick={() => handleExecuteResult(item)}
                            onMouseEnter={() => setSelectedIndex(globalIndex)}
                            className={`group relative p-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-between gap-3 ${
                              isSelected
                                ? 'bg-teal-50/90 border border-teal-200 text-slate-900 shadow-xs'
                                : 'hover:bg-slate-50 border border-transparent'
                            }`}
                          >
                            <div className="flex items-start gap-2.5 min-w-0 flex-1">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                                isSelected 
                                  ? 'bg-teal-600 text-white shadow-xs' 
                                  : 'bg-slate-100 text-slate-600 group-hover:bg-slate-200'
                              }`}>
                                {getCategoryIcon(item.category)}
                              </div>

                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-xs sm:text-sm font-black text-slate-900 group-hover:text-teal-900">
                                    {item.title}
                                  </span>
                                  {item.badge && (
                                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-slate-100 text-slate-700 border border-slate-200">
                                      {item.badge}
                                    </span>
                                  )}
                                  {item.matchDetail && (
                                    <span className="text-[10px] text-teal-700 bg-teal-100/70 px-1.5 py-0.2 rounded font-medium">
                                      {item.matchDetail}
                                    </span>
                                  )}
                                </div>

                                {item.subtitle && (
                                  <p className="text-[11px] text-slate-600 font-medium truncate mt-0.5">
                                    {item.subtitle}
                                  </p>
                                )}

                                {item.description && (
                                  <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                                    {item.description}
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* Action Button Indicator */}
                            <div className="shrink-0 flex items-center gap-1.5">
                              <span className={`text-[11px] font-bold px-2 py-1 rounded-lg transition-colors flex items-center gap-1 ${
                                isSelected
                                  ? 'bg-teal-600 text-white shadow-xs'
                                  : 'bg-slate-100 text-slate-600 group-hover:bg-slate-200'
                              }`}>
                                <span>{getActionLabel(item)}</span>
                                <ChevronRight className="w-3.5 h-3.5 rtl:rotate-180" />
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Guide */}
          <div className="bg-slate-50 px-3 py-2 border-t border-slate-200/80 flex items-center justify-between text-[11px] text-slate-500">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <kbd className="px-1 py-0.5 bg-white border border-slate-200 rounded text-[10px]">↑↓</kbd>
                <span>للتنقل</span>
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1 py-0.5 bg-white border border-slate-200 rounded text-[10px]">Enter</kbd>
                <span>للاختيار</span>
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1 py-0.5 bg-white border border-slate-200 rounded text-[10px]">Esc</kbd>
                <span>للإغلاق</span>
              </span>
            </div>

            <span className="font-semibold text-slate-600 text-[10px]">
              منظومة مصرف الدم المركزي المرج
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
