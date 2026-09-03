import React from 'react';
import { FilterCondition } from '../../types/reportBuilderTypes';
import { ALL_FILTERABLE_FIELDS, FilterableFieldMeta } from '../../utils/reportBuilderEngine';
import { Trash2, Plus, ArrowRightLeft } from 'lucide-react';

interface FilterConditionRowProps {
  condition: FilterCondition;
  index: number;
  isLast: boolean;
  onUpdate: (updated: FilterCondition) => void;
  onDelete: () => void;
  onAddNext: () => void;
}

export const FilterConditionRow: React.FC<FilterConditionRowProps> = ({
  condition,
  index,
  isLast,
  onUpdate,
  onDelete,
  onAddNext
}) => {
  const currentFieldMeta = ALL_FILTERABLE_FIELDS.find(f => f.id === condition.field) || ALL_FILTERABLE_FIELDS[0];

  const handleFieldChange = (newFieldId: string) => {
    const meta = ALL_FILTERABLE_FIELDS.find(f => f.id === newFieldId);
    if (!meta) return;

    let defaultOp = 'equals';
    let defaultValue: any = '';

    if (meta.type === 'text') {
      defaultOp = 'contains';
      defaultValue = '';
    } else if (meta.type === 'select') {
      defaultOp = 'equals';
      defaultValue = meta.options && meta.options.length > 0 ? meta.options[0] : '';
    } else if (meta.type === 'number') {
      defaultOp = 'greater_equal';
      defaultValue = 1;
    } else if (meta.type === 'date') {
      defaultOp = 'between';
      defaultValue = '2020-01-01';
    } else if (meta.type === 'boolean') {
      defaultOp = 'equals';
      defaultValue = 'نعم';
    }

    onUpdate({
      ...condition,
      field: meta.id,
      fieldType: meta.type,
      operator: defaultOp,
      value: defaultValue,
      secondValue: undefined
    });
  };

  const handleOperatorChange = (newOp: string) => {
    onUpdate({
      ...condition,
      operator: newOp
    });
  };

  const handleValueChange = (val: any) => {
    onUpdate({
      ...condition,
      value: val
    });
  };

  const handleSecondValueChange = (val2: any) => {
    onUpdate({
      ...condition,
      secondValue: val2
    });
  };

  const toggleLogicOp = () => {
    const nextOp = condition.logicOperatorWithNext === 'OR' ? 'AND' : 'OR';
    onUpdate({
      ...condition,
      logicOperatorWithNext: nextOp
    });
  };

  return (
    <div className="space-y-2">
      <div className="bg-slate-950/80 border border-slate-800 hover:border-slate-700 rounded-2xl p-3.5 flex flex-col md:flex-row items-stretch md:items-center gap-2.5 transition-all text-xs">
        
        {/* Index Badge */}
        <div className="shrink-0 flex items-center justify-between md:justify-start gap-2">
          <span className="w-6 h-6 rounded-lg bg-slate-900 border border-slate-700 text-slate-400 font-mono font-bold flex items-center justify-center text-[11px]">
            {index + 1}
          </span>
          <span className="text-[11px] text-slate-500 font-bold md:hidden">الشرط</span>
        </div>

        {/* Field Selector */}
        <div className="flex-1 min-w-[160px]">
          <select
            value={condition.field}
            onChange={e => handleFieldChange(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold focus:outline-none focus:border-red-500"
          >
            <optgroup label="المعلومات الشخصية والملف">
              {ALL_FILTERABLE_FIELDS.filter(f => f.category === 'personal').map(f => (
                <option key={f.id} value={f.id}>{f.label}</option>
              ))}
            </optgroup>
            <optgroup label="الوظيفة والبيانات الإدارية">
              {ALL_FILTERABLE_FIELDS.filter(f => f.category === 'job').map(f => (
                <option key={f.id} value={f.id}>{f.label}</option>
              ))}
            </optgroup>
            <optgroup label="الدرجات والعلاوات والترقيات">
              {ALL_FILTERABLE_FIELDS.filter(f => f.category === 'career').map(f => (
                <option key={f.id} value={f.id}>{f.label}</option>
              ))}
            </optgroup>
            <optgroup label="المؤهلات العلمية والدورات">
              {ALL_FILTERABLE_FIELDS.filter(f => f.category === 'qualifications').map(f => (
                <option key={f.id} value={f.id}>{f.label}</option>
              ))}
            </optgroup>
            <optgroup label="الإجازات والقرارات">
              {ALL_FILTERABLE_FIELDS.filter(f => f.category === 'leave' || f.category === 'admin').map(f => (
                <option key={f.id} value={f.id}>{f.label}</option>
              ))}
            </optgroup>
          </select>
        </div>

        {/* Operator Selector */}
        <div className="min-w-[140px]">
          <select
            value={condition.operator}
            onChange={e => handleOperatorChange(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-red-300 font-bold focus:outline-none focus:border-red-500"
          >
            {/* Text Operators */}
            {currentFieldMeta.type === 'text' && (
              <>
                <option value="contains">يحتوي على</option>
                <option value="equals">يساوي تماماً</option>
                <option value="not_equals">لا يساوي</option>
                <option value="starts_with">يبدأ بـ</option>
                <option value="ends_with">ينتهي بـ</option>
              </>
            )}

            {/* Select Operators */}
            {currentFieldMeta.type === 'select' && (
              <>
                <option value="equals">يساوي</option>
                <option value="not_equals">لا يساوي (استثناء)</option>
              </>
            )}

            {/* Number Operators */}
            {currentFieldMeta.type === 'number' && (
              <>
                <option value="equals">يساوي</option>
                <option value="greater_equal">أكبر من أو يساوي (≥)</option>
                <option value="greater_than">أكبر من (&gt;)</option>
                <option value="less_equal">أصغر من أو يساوي (≤)</option>
                <option value="less_than">أصغر من (&lt;)</option>
                <option value="between">بين قيمتين (مدى)</option>
              </>
            )}

            {/* Date Operators */}
            {currentFieldMeta.type === 'date' && (
              <>
                <option value="between">بين تاريخين (مدى)</option>
                <option value="equals">يساوي التاريخ</option>
                <option value="after">بعد التاريخ (أحدث من)</option>
                <option value="before">قبل التاريخ (أقدم من)</option>
                <option value="in_year">خلال سنة معينة</option>
                <option value="current_year">السنة الحالية</option>
                <option value="previous_year">السنة السابقة</option>
                <option value="last_30_days">خلال آخر 30 يوم</option>
                <option value="last_90_days">خلال آخر 90 يوم</option>
              </>
            )}

            {/* Boolean Operators */}
            {currentFieldMeta.type === 'boolean' && (
              <option value="equals">يساوي</option>
            )}
          </select>
        </div>

        {/* Value Input */}
        <div className="flex-1 flex items-center gap-2">
          {/* Select Options */}
          {currentFieldMeta.type === 'select' && currentFieldMeta.options && (
            <select
              value={condition.value}
              onChange={e => handleValueChange(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-medium focus:outline-none focus:border-red-500"
            >
              {currentFieldMeta.options.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          )}

          {/* Text Input */}
          {currentFieldMeta.type === 'text' && (
            <input
              type="text"
              value={condition.value || ''}
              onChange={e => handleValueChange(e.target.value)}
              placeholder={currentFieldMeta.placeholder || 'أدخل القيمة...'}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
            />
          )}

          {/* Number Input */}
          {currentFieldMeta.type === 'number' && (
            <div className="flex items-center gap-2 w-full">
              <input
                type="number"
                value={condition.value ?? ''}
                onChange={e => handleValueChange(e.target.value)}
                placeholder="القيمة"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-red-500"
              />
              {condition.operator === 'between' && (
                <>
                  <span className="text-slate-400 font-bold shrink-0">و</span>
                  <input
                    type="number"
                    value={condition.secondValue ?? ''}
                    onChange={e => handleSecondValueChange(e.target.value)}
                    placeholder="إلى"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-red-500"
                  />
                </>
              )}
            </div>
          )}

          {/* Date Input */}
          {currentFieldMeta.type === 'date' && (
            <div className="w-full flex items-center gap-2">
              {['current_year', 'previous_year', 'last_30_days', 'last_90_days'].includes(condition.operator) ? (
                <div className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-400 text-xs w-full text-center">
                  تصفية تلقائية حسب الفترة
                </div>
              ) : condition.operator === 'in_year' ? (
                <input
                  type="number"
                  placeholder="السنة (مثال: 2024)"
                  value={condition.value || ''}
                  onChange={e => handleValueChange(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-red-500"
                />
              ) : condition.operator === 'between' ? (
                <div className="flex items-center gap-2 w-full">
                  <input
                    type="date"
                    value={condition.value || ''}
                    onChange={e => handleValueChange(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2 py-2 text-white font-mono text-xs focus:outline-none focus:border-red-500"
                  />
                  <span className="text-slate-400 font-bold shrink-0">إلى</span>
                  <input
                    type="date"
                    value={condition.secondValue || ''}
                    onChange={e => handleSecondValueChange(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2 py-2 text-white font-mono text-xs focus:outline-none focus:border-red-500"
                  />
                </div>
              ) : (
                <input
                  type="date"
                  value={condition.value || ''}
                  onChange={e => handleValueChange(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-red-500"
                />
              )}
            </div>
          )}

          {/* Boolean Input */}
          {currentFieldMeta.type === 'boolean' && (
            <select
              value={condition.value}
              onChange={e => handleValueChange(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold focus:outline-none focus:border-red-500"
            >
              <option value="نعم">نعم (مفعل)</option>
              <option value="لا">لا (غير مفعل)</option>
            </select>
          )}
        </div>

        {/* Row Actions */}
        <div className="shrink-0 flex items-center gap-1.5 justify-end">
          <button
            type="button"
            onClick={onDelete}
            title="حذف هذا الشرط"
            className="p-2 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-950/40 border border-transparent hover:border-red-900/60 transition-all cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

      </div>

      {/* Logic Link Between Conditions */}
      {!isLast && (
        <div className="flex items-center justify-center py-1">
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1 rounded-full shadow-sm">
            <span className="text-[11px] text-slate-400 font-bold">الربط المنطقي:</span>
            <button
              type="button"
              onClick={toggleLogicOp}
              className={`px-2.5 py-0.5 rounded-full text-xs font-black transition-all cursor-pointer flex items-center gap-1 ${
                condition.logicOperatorWithNext === 'OR'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
              }`}
            >
              <span>{condition.logicOperatorWithNext === 'OR' ? 'أو (OR)' : 'و (AND)'}</span>
              <ArrowRightLeft className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
