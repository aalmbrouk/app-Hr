import React from 'react';
import { ReportColumnConfig } from '../../types/reportBuilderTypes';
import { CheckSquare, Square, RotateCcw, ArrowUp, ArrowDown, Columns, Check } from 'lucide-react';

interface ColumnReorderListProps {
  columns: ReportColumnConfig[];
  onChangeColumns: (cols: ReportColumnConfig[]) => void;
  onResetDefault: () => void;
}

export const ColumnReorderList: React.FC<ColumnReorderListProps> = ({
  columns,
  onChangeColumns,
  onResetDefault
}) => {
  const handleToggleColumn = (id: string) => {
    onChangeColumns(
      columns.map(col => col.id === id ? { ...col, selected: !col.selected } : col)
    );
  };

  const handleSelectAll = () => {
    onChangeColumns(columns.map(col => ({ ...col, selected: true })));
  };

  const handleDeselectAll = () => {
    // Keep at least 'index' and 'fullName'
    onChangeColumns(columns.map(col => ({
      ...col,
      selected: col.id === 'index' || col.id === 'fullName'
    })));
  };

  const handleMoveUp = (index: number) => {
    if (index <= 0) return;
    const newCols = [...columns];
    const temp = newCols[index];
    newCols[index] = newCols[index - 1];
    newCols[index - 1] = temp;
    // Re-index orders
    onChangeColumns(newCols.map((c, i) => ({ ...c, order: i + 1 })));
  };

  const handleMoveDown = (index: number) => {
    if (index >= columns.length - 1) return;
    const newCols = [...columns];
    const temp = newCols[index];
    newCols[index] = newCols[index + 1];
    newCols[index + 1] = temp;
    // Re-index orders
    onChangeColumns(newCols.map((c, i) => ({ ...c, order: i + 1 })));
  };

  const selectedCount = columns.filter(c => c.selected).length;

  return (
    <div className="space-y-4">
      {/* Top Bar Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSelectAll}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold transition-all cursor-pointer flex items-center gap-1.5"
          >
            <CheckSquare className="w-3.5 h-3.5 text-emerald-400" />
            <span>تحديد الكل</span>
          </button>

          <button
            type="button"
            onClick={handleDeselectAll}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Square className="w-3.5 h-3.5 text-amber-400" />
            <span>إلغاء الكل</span>
          </button>

          <button
            type="button"
            onClick={onResetDefault}
            className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 font-bold transition-all cursor-pointer flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5 text-blue-400" />
            <span>الافتراضي للتقرير</span>
          </button>
        </div>

        <div className="text-xs font-bold text-slate-300 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
          <span>الحقول المختارة: </span>
          <span className="text-red-400 font-mono font-bold mr-1">{selectedCount}</span>
          <span className="text-slate-500"> / {columns.length} عمود</span>
        </div>
      </div>

      {/* Columns Grid & Order Controller */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-[480px] overflow-y-auto p-1">
        {columns.map((col, idx) => {
          return (
            <div
              key={col.id}
              className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-2.5 ${
                col.selected
                  ? 'bg-red-950/30 border-red-800/80 text-white shadow-sm'
                  : 'bg-slate-950/60 border-slate-800/80 text-slate-400 hover:border-slate-700'
              }`}
            >
              {/* Checkbox & Name */}
              <div
                onClick={() => handleToggleColumn(col.id)}
                className="flex items-center gap-2.5 overflow-hidden flex-1 cursor-pointer select-none"
              >
                <div
                  className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-all shrink-0 ${
                    col.selected
                      ? 'bg-red-600 border-red-500 text-white'
                      : 'border-slate-700 bg-slate-900'
                  }`}
                >
                  {col.selected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>

                <div className="overflow-hidden">
                  <div className="font-bold text-xs truncate text-slate-100">{col.label}</div>
                  <div className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                    <span className="font-mono text-slate-500">#{idx + 1}</span>
                    <span>•</span>
                    <span className="truncate">{getCategoryArabicLabel(col.category)}</span>
                  </div>
                </div>
              </div>

              {/* Up / Down Reorder Buttons */}
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  disabled={idx === 0}
                  onClick={() => handleMoveUp(idx)}
                  title="تحريك لأعلى / للأمام"
                  className="p-1 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 hover:text-white hover:border-slate-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  disabled={idx === columns.length - 1}
                  onClick={() => handleMoveDown(idx)}
                  title="تحريك لأسفل / للخلف"
                  className="p-1 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 hover:text-white hover:border-slate-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

function getCategoryArabicLabel(cat: string): string {
  switch (cat) {
    case 'personal': return 'شخصي';
    case 'job': return 'وظيفي';
    case 'career': return 'الدرجات والعلاوات';
    case 'qualifications': return 'مؤهلات ودورات';
    case 'leave': return 'إجازات';
    case 'admin': return 'إداري';
    default: return 'عام';
  }
}
