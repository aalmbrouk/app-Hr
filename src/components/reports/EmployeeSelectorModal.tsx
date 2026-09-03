import React, { useState, useMemo } from 'react';
import { Employee } from '../../types';
import { Search, CheckSquare, Square, X, UserCheck, Users, Trash2, Filter } from 'lucide-react';
import { DEPARTMENTS } from '../../data/initialData';

interface EmployeeSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  employees: Employee[];
  selectedEmployeeIds: number[];
  onApply: (newSelectedIds: number[]) => void;
  title?: string;
  description?: string;
}

export const EmployeeSelectorModal: React.FC<EmployeeSelectorModalProps> = ({
  isOpen,
  onClose,
  employees,
  selectedEmployeeIds,
  onApply,
  title = 'تحديد الموظفين يدوياً',
  description = 'ابحث وحدد الموظفين المطلوب تضمينهم في التقرير'
}) => {
  const [tempSelectedIds, setTempSelectedIds] = useState<number[]>(selectedEmployeeIds);
  const [searchQuery, setSearchQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Reset temp selection when opening
  React.useEffect(() => {
    if (isOpen) {
      setTempSelectedIds(selectedEmployeeIds);
    }
  }, [isOpen, selectedEmployeeIds]);

  // Filtered employees list for picker
  const filteredEmployees = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return employees.filter(emp => {
      // Search
      const matchSearch = !q || 
        emp.fullName.toLowerCase().includes(q) ||
        (emp.jobNumber && emp.jobNumber.toLowerCase().includes(q)) ||
        (emp.nationalId && emp.nationalId.toLowerCase().includes(q)) ||
        (emp.jobTitle && emp.jobTitle.toLowerCase().includes(q));

      // Dept
      const matchDept = deptFilter === 'ALL' || emp.department === deptFilter;

      // Status
      const matchStatus = statusFilter === 'ALL' || emp.status === statusFilter;

      return matchSearch && matchDept && matchStatus;
    });
  }, [employees, searchQuery, deptFilter, statusFilter]);

  if (!isOpen) return null;

  const handleToggle = (id: number) => {
    setTempSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllFiltered = () => {
    const idsToAdd = filteredEmployees.map(e => e.id);
    setTempSelectedIds(prev => Array.from(new Set([...prev, ...idsToAdd])));
  };

  const handleDeselectAllFiltered = () => {
    const idsToRemove = new Set(filteredEmployees.map(e => e.id));
    setTempSelectedIds(prev => prev.filter(id => !idsToRemove.has(id)));
  };

  const handleClearAll = () => {
    setTempSelectedIds([]);
  };

  const handleConfirm = () => {
    onApply(tempSelectedIds);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-right">
        
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-red-950/80 text-red-400 border border-red-800">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">{title}</h3>
              <p className="text-xs text-slate-400">{description}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Filter Bar */}
        <div className="p-4 border-b border-slate-800 bg-slate-900/90 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Search Input */}
            <div className="relative md:col-span-1">
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="ابحث بالاسم، الرقم الوظيفي، أو الوطني..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl pr-9 pl-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
              />
            </div>

            {/* Department Filter */}
            <div>
              <select
                value={deptFilter}
                onChange={e => setDeptFilter(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500"
              >
                <option value="ALL">جميع الأقسام والإدارات</option>
                {DEPARTMENTS.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500"
              >
                <option value="ALL">جميع الحالات الوظيفية</option>
                <option value="على رأس العمل">على رأس العمل</option>
                <option value="إجازة">إجازة</option>
                <option value="منتدب">منتدب</option>
                <option value="منقول">منقول</option>
                <option value="مستقيل">مستقيل</option>
                <option value="منهي خدماته">منهي خدماته</option>
                <option value="متقاعد">متقاعد</option>
              </select>
            </div>
          </div>

          {/* Quick Selection Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 text-xs">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSelectAllFiltered}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all cursor-pointer flex items-center gap-1 font-bold"
              >
                <CheckSquare className="w-3.5 h-3.5 text-emerald-400" />
                <span>تحديد المعروض ({filteredEmployees.length})</span>
              </button>

              <button
                type="button"
                onClick={handleDeselectAllFiltered}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all cursor-pointer flex items-center gap-1 font-bold"
              >
                <Square className="w-3.5 h-3.5 text-amber-400" />
                <span>إلغاء تحديد المعروض</span>
              </button>

              <button
                type="button"
                onClick={handleClearAll}
                className="px-3 py-1.5 rounded-lg bg-red-950/60 hover:bg-red-900/80 text-red-300 border border-red-800 transition-all cursor-pointer flex items-center gap-1 font-bold"
              >
                <Trash2 className="w-3.5 h-3.5 text-red-400" />
                <span>إزالة الكل</span>
              </button>
            </div>

            <div className="text-xs font-bold text-slate-300 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
              <span>المحدد حالياً: </span>
              <span className="text-red-400 font-mono text-sm mr-1">{tempSelectedIds.length}</span>
              <span className="text-slate-500"> / {employees.length} موظف</span>
            </div>
          </div>
        </div>

        {/* Employee List Scroll Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 max-h-[50vh]">
          {filteredEmployees.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <Users className="w-10 h-10 mx-auto text-slate-600 mb-2 opacity-50" />
              <p>لا يوجد موظفون يطابقون شروط البحث.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {filteredEmployees.map(emp => {
                const isSelected = tempSelectedIds.includes(emp.id);
                return (
                  <div
                    key={emp.id}
                    onClick={() => handleToggle(emp.id)}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-red-950/40 border-red-700 text-white shadow-md'
                        : 'bg-slate-950/80 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-950'
                    }`}
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-all ${
                        isSelected ? 'bg-red-600 border-red-500 text-white' : 'border-slate-700 bg-slate-900'
                      }`}>
                        {isSelected && <UserCheck className="w-3.5 h-3.5" />}
                      </div>

                      <div className="overflow-hidden">
                        <div className="font-bold text-xs truncate text-white">{emp.fullName}</div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5 truncate">
                          <span className="font-mono text-red-300">#{emp.jobNumber || emp.id}</span>
                          <span>•</span>
                          <span className="truncate">{emp.department}</span>
                          <span>•</span>
                          <span className="truncate">{emp.jobTitle}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-left shrink-0">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                        emp.status === 'على رأس العمل' 
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' 
                          : 'bg-slate-800 text-slate-400'
                      }`}>
                        {emp.status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <div className="text-xs text-slate-400 font-medium">
            تم تحديد <strong className="text-white font-mono">{tempSelectedIds.length}</strong> موظف من أصل <span className="font-mono">{employees.length}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="px-5 py-2 rounded-xl bg-red-700 hover:bg-red-600 text-white text-xs font-bold shadow-lg transition-all border border-red-500 cursor-pointer flex items-center gap-2"
            >
              <UserCheck className="w-4 h-4" />
              <span>تأكيد الاختيار ({tempSelectedIds.length})</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
