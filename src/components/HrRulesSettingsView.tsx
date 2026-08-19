import React, { useState } from 'react';
import { HrRule } from '../types';
import { Sliders, Plus, Edit2, Save, RotateCcw, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface HrRulesSettingsViewProps {
  rules: HrRule[];
  onUpdateRule: (updatedRule: HrRule) => void;
  onResetRules: () => void;
}

export const HrRulesSettingsView: React.FC<HrRulesSettingsViewProps> = ({
  rules,
  onUpdateRule,
  onResetRules
}) => {
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<number | string>('');
  const [editDesc, setEditDesc] = useState('');

  const handleStartEdit = (rule: HrRule) => {
    setEditingRuleId(rule.id);
    setEditValue(rule.value);
    setEditDesc(rule.description);
  };

  const handleSaveEdit = (rule: HrRule) => {
    const updated: HrRule = {
      ...rule,
      value: editValue,
      description: editDesc,
      effectiveDate: new Date().toISOString().slice(0, 10)
    };
    onUpdateRule(updated);
    setEditingRuleId(null);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-red-700 font-bold text-xs mb-1">
            <Sliders className="w-4 h-4" />
            <span>لوائح وقواعد الشؤون الوظيفية (HR Rules Engine)</span>
          </div>
          <h2 className="text-xl font-black text-slate-900">إدارة القواعد واللوائح القانونية القابلة والتعديل</h2>
          <p className="text-xs text-slate-500 mt-1">
            إتاحة تعديل مدد الإجازات، عتبة طويلي الخدمة، وسنوات الترقيات لضمان مواكبة أية تعديلات في التشريعات الليبية
          </p>
        </div>

        <button
          onClick={onResetRules}
          className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs border border-slate-200 transition-all flex items-center gap-1.5"
        >
          <RotateCcw className="w-4 h-4" />
          <span>استعادة القواعد الافتراضية</span>
        </button>
      </div>

      {/* Rules Categories Grid */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-black text-slate-900">جدول القواعد والبارامترات النشطة بالنظام</h3>
          <span className="text-xs text-slate-500 font-mono">عدد القواعد: {rules.length}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="p-3">رمز القاعدة</th>
                <th className="p-3">اسم القاعدة</th>
                <th className="p-3">التصنيف</th>
                <th className="p-3">القيمة والوحدة</th>
                <th className="p-3">الوصف والتوضيح</th>
                <th className="p-3">تاريخ النفاذ</th>
                <th className="p-3 text-center">تعديل</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {rules.map((rule) => {
                const isEditing = editingRuleId === rule.id;
                return (
                  <tr key={rule.id} className="hover:bg-slate-50 text-slate-800">
                    <td className="p-3 font-mono font-bold text-red-700">{rule.id}</td>
                    <td className="p-3 font-bold text-slate-900">{rule.ruleName}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 border border-slate-200">
                        {rule.category}
                      </span>
                    </td>
                    <td className="p-3 font-bold text-emerald-800">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="w-24 p-1 bg-white border border-slate-300 rounded text-xs font-bold"
                        />
                      ) : (
                        <span>{rule.value} {rule.unit}</span>
                      )}
                    </td>
                    <td className="p-3 text-slate-600 max-w-xs">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editDesc}
                          onChange={(e) => setEditDesc(e.target.value)}
                          className="w-full p-1 bg-white border border-slate-300 rounded text-xs"
                        />
                      ) : (
                        <span>{rule.description}</span>
                      )}
                    </td>
                    <td className="p-3 font-mono text-slate-500">{rule.effectiveDate}</td>
                    <td className="p-3 text-center">
                      {isEditing ? (
                        <button
                          onClick={() => handleSaveEdit(rule)}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold text-[11px] shadow-sm flex items-center gap-1 mx-auto"
                        >
                          <Save className="w-3.5 h-3.5" />
                          <span>حفظ</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleStartEdit(rule)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded font-bold text-[11px]"
                        >
                          تعديل
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
