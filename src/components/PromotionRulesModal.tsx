import React, { useState } from 'react';
import { PromotionRule } from '../types';
import { DEFAULT_PROMOTION_RULES } from '../utils/promotionEngine';
import { 
  Scale, 
  Plus, 
  Edit2, 
  Trash2, 
  CheckCircle2, 
  X, 
  RotateCcw, 
  AlertTriangle,
  FileText,
  Calendar,
  Shield,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';

interface PromotionRulesModalProps {
  isOpen: boolean;
  onClose: () => void;
  rules: PromotionRule[];
  onSaveRules: (rules: PromotionRule[]) => void;
  currentUser?: string;
}

export const PromotionRulesModal: React.FC<PromotionRulesModalProps> = ({
  isOpen,
  onClose,
  rules,
  onSaveRules,
  currentUser = 'مسؤول النظام'
}) => {
  const [editingRule, setEditingRule] = useState<PromotionRule | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);

  // Form states
  const [ruleName, setRuleName] = useState('');
  const [fromGrade, setFromGrade] = useState('');
  const [toGrade, setToGrade] = useState('');
  const [requiredIncrements, setRequiredIncrements] = useState(4);
  const [competencyRequirement, setCompetencyRequirement] = useState('');
  const [legalReference, setLegalReference] = useState('قانون علاقات العمل رقم 12 لسنة 2010 ولائحته التنفيذية');
  const [decisionNumber, setDecisionNumber] = useState('');
  const [effectiveFrom, setEffectiveFrom] = useState('2010-05-01');
  const [notes, setNotes] = useState('');
  const [active, setActive] = useState(true);

  if (!isOpen) return null;

  const handleStartAdd = () => {
    setIsAddingNew(true);
    setEditingRule(null);
    setRuleName('');
    setFromGrade('');
    setToGrade('');
    setRequiredIncrements(4);
    setCompetencyRequirement('جيد جداً فما فوق (إدخال اختياري)');
    setLegalReference('قانون علاقات العمل رقم 12 لسنة 2010 ولائحته التنفيذية');
    setDecisionNumber('قانون 12 لسنة 2010');
    setEffectiveFrom('2010-05-01');
    setNotes('');
    setActive(true);
  };

  const handleStartEdit = (rule: PromotionRule) => {
    setEditingRule(rule);
    setIsAddingNew(false);
    setRuleName(rule.ruleName);
    setFromGrade(rule.fromGrade);
    setToGrade(rule.toGrade);
    setRequiredIncrements(rule.requiredIncrements);
    setCompetencyRequirement(rule.competencyRequirement || '');
    setLegalReference(rule.legalReference);
    setDecisionNumber(rule.decisionNumber || '');
    setEffectiveFrom(rule.effectiveFrom || '2010-05-01');
    setNotes(rule.notes || '');
    setActive(rule.active);
  };

  const handleToggleActive = (ruleId: string) => {
    const updated = rules.map((r) => r.id === ruleId ? { ...r, active: !r.active } : r);
    onSaveRules(updated);
  };

  const handleResetDefaults = () => {
    if (window.confirm('هل أنت متأكد من استعادة قواعد الترقية الافتراضية وفق قانون علاقات العمل رقم 12 لسنة 2010؟')) {
      onSaveRules(DEFAULT_PROMOTION_RULES);
      setEditingRule(null);
      setIsAddingNew(false);
    }
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ruleName.trim() || !fromGrade.trim()) {
      alert('يرجى ملء اسم القاعدة والدرجة المستهدفة.');
      return;
    }

    if (isAddingNew) {
      const newRule: PromotionRule = {
        id: `RULE-PRM-${Date.now()}`,
        ruleName: ruleName.trim(),
        fromGrade: fromGrade.trim(),
        toGrade: toGrade.trim() || 'الدرجة التالية نظامياً',
        requiredIncrements: Number(requiredIncrements),
        competencyRequirement: competencyRequirement.trim(),
        legalReference: legalReference.trim(),
        decisionNumber: decisionNumber.trim(),
        effectiveFrom,
        notes: notes.trim(),
        active
      };
      onSaveRules([...rules, newRule]);
    } else if (editingRule) {
      const updated = rules.map((r) => {
        if (r.id === editingRule.id) {
          return {
            ...r,
            ruleName: ruleName.trim(),
            fromGrade: fromGrade.trim(),
            toGrade: toGrade.trim() || r.toGrade,
            requiredIncrements: Number(requiredIncrements),
            competencyRequirement: competencyRequirement.trim(),
            legalReference: legalReference.trim(),
            decisionNumber: decisionNumber.trim(),
            effectiveFrom,
            notes: notes.trim(),
            active
          };
        }
        return r;
      });
      onSaveRules(updated);
    }

    setIsAddingNew(false);
    setEditingRule(null);
  };

  const handleDeleteRule = (ruleId: string) => {
    if (rules.length <= 1) {
      alert('لا يمكن حذف جميع القواعد. يجب الإبقاء على قاعدة واحدة على الأقل.');
      return;
    }
    if (window.confirm('هل أنت متأكد من حذف هذه القاعدة من جدول القواعد الإدارية؟')) {
      onSaveRules(rules.filter((r) => r.id !== ruleId));
      if (editingRule?.id === ruleId) {
        setEditingRule(null);
        setIsAddingNew(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full border border-slate-200 overflow-hidden my-6">
        
        {/* Modal Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center border border-emerald-400">
              <Scale className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold">جدول قواعد وضوابط الترقيات الإدارية (PromotionRules)</h3>
              <p className="text-xs text-slate-300">
                تكوين معايير الأهلية القانونية واستحقاق الترشح وفق قانون علاقات العمل رقم 12 لسنة 2010
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Legal Principles Guidance */}
        <div className="bg-emerald-50 border-b border-emerald-200 p-4 text-xs text-emerald-900 flex items-start justify-between gap-4">
          <div className="flex items-start gap-2">
            <Shield className="w-5 h-5 text-emerald-700 flex-shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <span className="font-bold">المحددات القانونية المعيارية:</span>
              <ul className="list-disc list-inside mt-1 space-y-0.5">
                <li><span className="font-semibold">الدرجات ما دون العاشرة:</span> تشترط 4 علاوات مؤهلة كحد أدنى للترشح.</li>
                <li><span className="font-semibold">الدرجة العاشرة (نقطة التحول الانتقالي):</span> تشترط 5 علاوات مؤهلة للترشح للدرجة الحادية عشرة.</li>
                <li><span className="font-semibold">استيفاء المدة أو العلاوات:</span> يؤهل الموظف للعرض والمفاضلة ولا يعد ترقية تلقائية.</li>
              </ul>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={handleResetDefaults}
              className="px-3 py-1.5 rounded-lg border border-emerald-300 bg-white text-emerald-800 hover:bg-emerald-100 transition-colors flex items-center gap-1.5 font-medium"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>استعادة القواعد القانونية الافتراضية</span>
            </button>
            <button
              onClick={handleStartAdd}
              className="px-3.5 py-1.5 rounded-lg bg-emerald-700 text-white hover:bg-emerald-800 transition-colors flex items-center gap-1.5 font-bold shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة قاعدة ترقية جديدة</span>
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="p-6 space-y-6 text-right">
          
          {/* Rules Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-xs text-right border-collapse">
              <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3">اسم القاعدة الإدارية</th>
                  <th className="p-3">نطاق الدرجات (من / إلى)</th>
                  <th className="p-3 text-center">العلاوات المطلوبة</th>
                  <th className="p-3">شرط الكفاءة</th>
                  <th className="p-3">السند القانوني المعتمد</th>
                  <th className="p-3 text-center">الحالة</th>
                  <th className="p-3 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rules.map((rule) => (
                  <tr 
                    key={rule.id}
                    className={`hover:bg-slate-50 transition-colors ${!rule.active ? 'opacity-60 bg-slate-50/50' : ''}`}
                  >
                    <td className="p-3 font-bold text-slate-900">
                      {rule.ruleName}
                      {rule.decisionNumber && (
                        <span className="block text-[11px] text-slate-500 font-normal">
                          مرجع: {rule.decisionNumber}
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-slate-700">
                      <div className="font-semibold text-slate-800">{rule.fromGrade}</div>
                      <div className="text-[11px] text-emerald-700">← {rule.toGrade}</div>
                    </td>
                    <td className="p-3 text-center">
                      <span className={`inline-block px-2.5 py-1 rounded-full font-bold text-xs ${
                        rule.requiredIncrements === 5 
                          ? 'bg-amber-100 text-amber-900 border border-amber-300' 
                          : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                      }`}>
                        {rule.requiredIncrements} علاوات مؤهلة
                      </span>
                    </td>
                    <td className="p-3 text-slate-600">
                      {rule.competencyRequirement || 'غير محدد (اختياري)'}
                    </td>
                    <td className="p-3 text-slate-700 max-w-xs">
                      {rule.legalReference}
                    </td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => handleToggleActive(rule.id)}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold transition-colors ${
                          rule.active 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                            : 'bg-slate-200 text-slate-600'
                        }`}
                        title="انقر للتبديل"
                      >
                        {rule.active ? (
                          <>
                            <ToggleRight className="w-4 h-4 text-emerald-600" />
                            <span>سارية</span>
                          </>
                        ) : (
                          <>
                            <ToggleLeft className="w-4 h-4 text-slate-400" />
                            <span>معطلة</span>
                          </>
                        )}
                      </button>
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleStartEdit(rule)}
                          className="p-1.5 rounded-lg text-slate-600 hover:text-emerald-700 hover:bg-slate-100"
                          title="تعديل"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteRule(rule.id)}
                          className="p-1.5 rounded-lg text-slate-600 hover:text-rose-700 hover:bg-rose-50"
                          title="حذف"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Add / Edit Form Section */}
          {(isAddingNew || editingRule) && (
            <div className="bg-slate-50 border border-slate-300 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                  <Edit2 className="w-4 h-4 text-emerald-700" />
                  <span>{isAddingNew ? 'إضافة قاعدة ترقية إدارية جديدة' : `تعديل القاعدة: ${editingRule?.ruleName}`}</span>
                </h4>
                <button
                  type="button"
                  onClick={() => { setIsAddingNew(false); setEditingRule(null); }}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveForm} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">اسم القاعدة:</label>
                    <input
                      type="text"
                      value={ruleName}
                      onChange={(e) => setRuleName(e.target.value)}
                      placeholder="مثال: ترقية استثنائية لحملة الدكتوراه"
                      required
                      className="w-full text-xs border border-slate-300 rounded-lg p-2 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">من الدرجة:</label>
                    <input
                      type="text"
                      value={fromGrade}
                      onChange={(e) => setFromGrade(e.target.value)}
                      placeholder="مثال: الدرجة التاسعة أو ما دون العاشرة"
                      required
                      className="w-full text-xs border border-slate-300 rounded-lg p-2 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">إلى الدرجة:</label>
                    <input
                      type="text"
                      value={toGrade}
                      onChange={(e) => setToGrade(e.target.value)}
                      placeholder="الدرجة التالية نظامياً"
                      className="w-full text-xs border border-slate-300 rounded-lg p-2 bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">الحد الأدنى للعلاوات المؤهلة:</label>
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={requiredIncrements}
                      onChange={(e) => setRequiredIncrements(Number(e.target.value))}
                      required
                      className="w-full text-xs border border-slate-300 rounded-lg p-2 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">شرط الكفاءة (إدخال اختياري):</label>
                    <input
                      type="text"
                      value={competencyRequirement}
                      onChange={(e) => setCompetencyRequirement(e.target.value)}
                      placeholder="مثال: جيد جداً فما فوق"
                      className="w-full text-xs border border-slate-300 rounded-lg p-2 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">تاريخ السريان:</label>
                    <input
                      type="date"
                      value={effectiveFrom}
                      onChange={(e) => setEffectiveFrom(e.target.value)}
                      className="w-full text-xs border border-slate-300 rounded-lg p-2 bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">السند القانوني / المرجع:</label>
                    <input
                      type="text"
                      value={legalReference}
                      onChange={(e) => setLegalReference(e.target.value)}
                      placeholder="قانون علاقات العمل رقم 12 لسنة 2010"
                      className="w-full text-xs border border-slate-300 rounded-lg p-2 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">رقم القرار / التشريع:</label>
                    <input
                      type="text"
                      value={decisionNumber}
                      onChange={(e) => setDecisionNumber(e.target.value)}
                      placeholder="مثال: قرار مجلس الوزراء رقم 54 لسنة 2021"
                      className="w-full text-xs border border-slate-300 rounded-lg p-2 bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">ملاحظات القاعدة القانونية:</label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="شرح الضوابط والاستثناءات..."
                    className="w-full text-xs border border-slate-300 rounded-lg p-2 bg-white resize-none"
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                    <input
                      type="checkbox"
                      checked={active}
                      onChange={(e) => setActive(e.target.checked)}
                      className="accent-emerald-700"
                    />
                    <span>تفعيل هذه القاعدة في محرك احتساب الترقيات</span>
                  </label>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => { setIsAddingNew(false); setEditingRule(null); }}
                      className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 text-xs hover:bg-slate-100 font-semibold"
                    >
                      إلغاء
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 rounded-lg bg-emerald-700 text-white text-xs font-bold hover:bg-emerald-800 shadow-sm"
                    >
                      حفظ القاعدة
                    </button>
                  </div>
                </div>
              </form>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="bg-slate-100 p-4 border-t border-slate-200 flex items-center justify-between">
          <p className="text-xs text-slate-500">
            يتم حفظ هذه القواعد الإدارية بشكل دائم ومزامنتها في جميع وحدات النظام.
          </p>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 text-white text-xs font-bold hover:bg-slate-900 transition-colors"
          >
            إغلاق الجدول
          </button>
        </div>

      </div>
    </div>
  );
};
