import React, { useState, useEffect } from 'react';
import { 
  Employee, 
  CareerPromotionRecord, 
  CareerActionType 
} from '../types';
import { JOB_GRADES, HIRING_ENTITIES } from '../data/initialData';
import { getCareerActionMeta, isValidJobGrade, sanitizeAllowancesCount } from '../utils/careerUtils';
import { 
  X, 
  Award, 
  Zap, 
  ShieldAlert, 
  Check, 
  FileText, 
  Building2, 
  Calendar, 
  HelpCircle,
  TrendingUp,
  UserCheck
} from 'lucide-react';

interface CareerActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  employees: Employee[];
  initialEmployeeId?: number;
  initialActionType?: CareerActionType;
  recordToEdit?: CareerPromotionRecord | null;
  onSubmit: (record: CareerPromotionRecord) => void;
  currentUser?: string;
}

export const CareerActionModal: React.FC<CareerActionModalProps> = ({
  isOpen,
  onClose,
  employees,
  initialEmployeeId,
  initialActionType = 'ندب على درجة',
  recordToEdit = null,
  onSubmit,
  currentUser = 'المستخدم الحالي'
}) => {
  const [selectedEmpId, setSelectedEmpId] = useState<number>(
    recordToEdit?.employeeId || initialEmployeeId || employees[0]?.id || 1001
  );
  const [actionType, setActionType] = useState<CareerActionType>(
    recordToEdit?.actionType || initialActionType
  );
  const [newGrade, setNewGrade] = useState<string>(
    recordToEdit?.newGrade || JOB_GRADES[6] || 'الدرجة السابعة'
  );
  const [newIncrement, setNewIncrement] = useState<number>(
    recordToEdit?.newIncrement !== undefined ? recordToEdit.newIncrement : 1
  );
  const [decisionNumber, setDecisionNumber] = useState<string>(
    recordToEdit?.decisionNumber || ''
  );
  const [decisionDate, setDecisionDate] = useState<string>(
    recordToEdit?.decisionDate || new Date().toISOString().slice(0, 10)
  );
  const [actionDate, setActionDate] = useState<string>(
    recordToEdit?.actionDate || new Date().toISOString().slice(0, 10)
  );
  const [issuingAuthority, setIssuingAuthority] = useState<string>(
    recordToEdit?.issuingAuthority || 'وزارة الصحة - ليبيا'
  );
  const [notes, setNotes] = useState<string>(recordToEdit?.notes || '');
  const [errors, setErrors] = useState<string[]>([]);
  const [showConfirmEdit, setShowConfirmEdit] = useState<boolean>(false);

  const selectedEmp = employees.find((e) => e.id === selectedEmpId) || employees[0];

  useEffect(() => {
    if (!isOpen) {
      setShowConfirmEdit(false);
      setErrors([]);
      return;
    }

    if (recordToEdit) {
      setSelectedEmpId(recordToEdit.employeeId);
      setActionType(recordToEdit.actionType);
      setNewGrade(recordToEdit.newGrade);
      setNewIncrement(recordToEdit.newIncrement);
      setDecisionNumber(recordToEdit.decisionNumber);
      setDecisionDate(recordToEdit.decisionDate || new Date().toISOString().slice(0, 10));
      setActionDate(recordToEdit.actionDate || new Date().toISOString().slice(0, 10));
      setIssuingAuthority(recordToEdit.issuingAuthority || 'وزارة الصحة - ليبيا');
      setNotes(recordToEdit.notes || '');
    } else {
      const empId = initialEmployeeId || employees[0]?.id || 1001;
      setSelectedEmpId(empId);
      setActionType(initialActionType);
      const emp = employees.find((e) => e.id === empId);
      if (emp) {
        if (initialActionType === 'علاوة دورية') {
          setNewGrade(emp.jobGrade);
          setNewIncrement(Math.min(15, (emp.currentIncrement || 1) + 1));
        } else if (initialActionType === 'ندب على درجة') {
          setNewGrade(emp.jobGrade);
          setNewIncrement(emp.currentIncrement || 0);
        } else {
          setNewGrade(emp.jobGrade);
          setNewIncrement(1);
        }
      }
    }
  }, [isOpen, initialEmployeeId, initialActionType, recordToEdit, employees]);

  if (!isOpen || !selectedEmp) return null;

  const currentMeta = getCareerActionMeta(actionType);

  const handleEmpChange = (empId: number) => {
    setSelectedEmpId(empId);
    const emp = employees.find((e) => e.id === empId);
    if (!emp) return;

    if (actionType === 'علاوة دورية') {
      setNewGrade(emp.jobGrade);
      setNewIncrement(Math.min(15, (emp.currentIncrement || 1) + 1));
    } else if (actionType === 'ندب على درجة') {
      setNewGrade(emp.jobGrade);
      setNewIncrement(emp.currentIncrement || 0);
    }
  };

  const handleActionTypeChange = (type: CareerActionType) => {
    setActionType(type);
    if (type === 'علاوة دورية') {
      setNewGrade(selectedEmp.jobGrade);
      setNewIncrement(Math.min(15, (selectedEmp.currentIncrement || 1) + 1));
    } else if (type === 'ندب على درجة') {
      setNewGrade(selectedEmp.jobGrade);
    }
  };

  const validateForm = (): boolean => {
    const errs: string[] = [];

    if (!selectedEmpId) {
      errs.push('يرجى اختيار الموظف المعني');
    }

    if (!newGrade || !isValidJobGrade(newGrade)) {
      errs.push('الدرجة الجديدة إلزامية ويجب اختيارها من قائمة الدرجات الرسمية المعتمدة');
    }

    if (newIncrement === undefined || isNaN(newIncrement) || newIncrement < 0) {
      errs.push('عدد العلاوات يجب أن يكون رقماً صحيحاً غير سالب (0 فما فوق)');
    }

    if (!decisionDate) {
      errs.push('تاريخ القرار إلزامي');
    }

    if (!decisionNumber.trim()) {
      errs.push('رقم القرار إلزامي');
    }

    setErrors(errs);
    return errs.length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    if (recordToEdit && !showConfirmEdit) {
      setShowConfirmEdit(true);
      return;
    }

    const todayStr = new Date().toISOString().slice(0, 10);
    const sanitizedIncrement = sanitizeAllowancesCount(newIncrement);

    const record: CareerPromotionRecord = {
      id: recordToEdit?.id || `CAR-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`,
      employeeId: selectedEmp.id,
      fileNumber: selectedEmp.jobNumber,
      employeeName: selectedEmp.fullName,
      actionType,
      previousGrade: selectedEmp.jobGrade,
      previousIncrement: selectedEmp.currentIncrement || 0,
      newGrade,
      newIncrement: sanitizedIncrement,
      actionDate: actionDate || decisionDate || todayStr,
      decisionDate: decisionDate || todayStr,
      decisionNumber: decisionNumber.trim(),
      issuingAuthority: issuingAuthority.trim() || 'وزارة الصحة - ليبيا',
      notes: notes.trim(),
      createdBy: recordToEdit?.createdBy || currentUser,
      createdAt: recordToEdit?.createdAt || new Date().toISOString().replace('T', ' ').slice(0, 19),
      updatedBy: recordToEdit ? currentUser : undefined,
      updatedAt: recordToEdit ? new Date().toISOString().replace('T', ' ').slice(0, 19) : undefined
    };

    onSubmit(record);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-gray-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className={`p-5 text-white flex justify-between items-center shrink-0 ${
          actionType === 'ندب على درجة' ? 'bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900' :
          actionType === 'ترقية' ? 'bg-gradient-to-r from-red-900 via-red-800 to-amber-900' :
          actionType === 'علاوة دورية' ? 'bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900' :
          actionType === 'ترقية استثنائية' ? 'bg-gradient-to-r from-amber-800 via-amber-700 to-orange-900' :
          'bg-gradient-to-r from-purple-900 via-purple-800 to-slate-900'
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
              <Award className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold bg-white/20 text-white px-2 py-0.5 rounded">
                  {recordToEdit ? 'تعديل إجراء وظيفي معتمد' : 'تسجيل إجراء وظيفي في السجل المهني'}
                </span>
              </div>
              <h2 className="text-lg font-black mt-0.5">
                {recordToEdit ? `تعديل سجل: ${actionType}` : `تسجيل ${actionType}`}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto text-xs">
          {/* Validation Errors Alert */}
          {errors.length > 0 && (
            <div className="bg-red-50 border-r-4 border-red-600 p-3 rounded-lg text-red-900 space-y-1">
              <span className="font-bold block">يرجى تصحيح الأخطاء التالية:</span>
              <ul className="list-disc list-inside text-[11px]">
                {errors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Action Type Selector Grid */}
          <div>
            <label className="block font-black text-gray-800 mb-2">نوع الإجراء الوظيفي *</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
              {(['ندب على درجة', 'ترقية', 'علاوة دورية', 'ترقية استثنائية', 'تسوية وضع', 'تحويل من اللائحة 418 إلى نظام الدرجات العامة'] as CareerActionType[]).map((t) => {
                const meta = getCareerActionMeta(t);
                const isSelected = actionType === t;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => handleActionTypeChange(t)}
                    className={`py-2 px-2.5 rounded-xl border text-center font-bold transition flex flex-col items-center justify-center gap-1 cursor-pointer ${
                      isSelected 
                        ? `${meta.badgeColor} border-current ring-2 ring-offset-1 ring-red-700/50 shadow-sm` 
                        : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <span className="text-[11px] whitespace-nowrap">{t}</span>
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-gray-500 mt-1.5">{currentMeta.description}</p>
          </div>

          {/* Employee Selector & Readonly Current Info */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-3">
            <div>
              <label className="block font-bold text-gray-800 mb-1">اسم الموظف المعني *</label>
              <select
                disabled={!!recordToEdit}
                value={selectedEmpId}
                onChange={(e) => handleEmpChange(Number(e.target.value))}
                className="w-full p-2.5 bg-white border border-gray-300 rounded-lg font-bold text-gray-900 text-xs disabled:bg-gray-100"
              >
                {employees.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.fullName} ({e.jobNumber}) - {e.department} [{e.jobGrade} - علاوة {e.currentIncrement || 1}]
                  </option>
                ))}
              </select>
            </div>

            {/* Readonly Details Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] bg-white p-2.5 rounded-lg border border-slate-200">
              <div>
                <span className="text-gray-500 block">الرقم الوظيفي:</span>
                <strong className="text-red-900 font-mono">{selectedEmp.jobNumber}</strong>
              </div>
              <div>
                <span className="text-gray-500 block">الدرجة الحالية:</span>
                <strong className="text-gray-900">{selectedEmp.jobGrade}</strong>
              </div>
              <div>
                <span className="text-gray-500 block">عدد العلاوات الحالية:</span>
                <strong className="text-blue-900">{selectedEmp.currentIncrement || 1} علاوة</strong>
              </div>
              <div>
                <span className="text-gray-500 block">القسم / الإدارة:</span>
                <strong className="text-gray-800 truncate block">{selectedEmp.department}</strong>
              </div>
            </div>
          </div>

          {/* Grade and Increment Form Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* New Grade (Mandatory Dropdown from JOB_GRADES) */}
            <div>
              <label className="block font-black text-gray-800 mb-1">
                الدرجة الجديدة الممنوحة *
                <span className="text-red-600 mr-1">(قائمة الدرجات الرسمية المعتمدة)</span>
              </label>
              <select
                required
                value={newGrade}
                onChange={(e) => setNewGrade(e.target.value)}
                className="w-full p-2.5 bg-white border border-red-300 rounded-lg font-bold text-red-900 text-xs focus:ring-2 focus:ring-red-600"
              >
                {JOB_GRADES.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
              <span className="text-[10px] text-gray-500 mt-0.5 block">
                ملاحظة: لا يُسمح بإدخال نصوص حرة؛ يتم الاختيار حصراً من الدرجات الرسمية.
              </span>
            </div>

            {/* Increments Count */}
            <div>
              <label className="block font-black text-gray-800 mb-1">
                عدد العلاوات *
                <span className="text-gray-500 font-normal mr-1">(رقم صحيح ≥ 0)</span>
              </label>
              <input
                type="number"
                min={0}
                max={25}
                required
                value={newIncrement}
                onChange={(e) => setNewIncrement(Math.max(0, parseInt(e.target.value, 10) || 0))}
                className="w-full p-2.5 bg-white border border-gray-300 rounded-lg font-bold text-blue-900 font-mono text-xs"
              />
              <span className="text-[10px] text-gray-500 mt-0.5 block">
                {actionType === 'ندب على درجة' ? 'العلاوات الممنوحة بموجب قرار الندب على الدرجة' : 'العلاوات المعتمدة بالدرجة'}
              </span>
            </div>
          </div>

          {/* Decision Data Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-gray-800 mb-1">رقم القرار *</label>
              <input
                type="text"
                required
                placeholder="مثال: ق/2026/14"
                value={decisionNumber}
                onChange={(e) => setDecisionNumber(e.target.value)}
                className="w-full p-2.5 bg-white border border-gray-300 rounded-lg font-bold text-gray-900 font-mono text-xs"
              />
            </div>

            <div>
              <label className="block font-bold text-gray-800 mb-1">تاريخ القرار *</label>
              <input
                type="date"
                required
                value={decisionDate}
                onChange={(e) => setDecisionDate(e.target.value)}
                className="w-full p-2.5 bg-white border border-gray-300 rounded-lg font-bold text-gray-900 font-mono text-xs"
              />
            </div>

            <div>
              <label className="block font-bold text-gray-800 mb-1">تاريخ السريان / الفعالية</label>
              <input
                type="date"
                value={actionDate}
                onChange={(e) => setActionDate(e.target.value)}
                className="w-full p-2.5 bg-white border border-gray-300 rounded-lg font-bold text-gray-900 font-mono text-xs"
              />
            </div>
          </div>

          {/* Issuing Authority */}
          <div>
            <label className="block font-bold text-gray-800 mb-1">الجهة التي أصدرت القرار *</label>
            <div className="space-y-1.5">
              <input
                type="text"
                required
                placeholder="الجهة المصدرة للقرار..."
                value={issuingAuthority}
                onChange={(e) => setIssuingAuthority(e.target.value)}
                className="w-full p-2.5 bg-white border border-gray-300 rounded-lg font-bold text-gray-900 text-xs"
              />
              <div className="flex flex-wrap gap-1.5">
                {[
                  'وزارة الصحة - ليبيا',
                  'مصرف الدم المركزي بلدية المرج',
                  'الهيئة العامة للخدمات الطبية',
                  'مجلس الوزراء الليبي',
                  'إدارة الخدمة المدنية'
                ].map((sug) => (
                  <button
                    key={sug}
                    type="button"
                    onClick={() => setIssuingAuthority(sug)}
                    className="text-[10px] bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-0.5 rounded font-medium cursor-pointer"
                  >
                    {sug}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block font-bold text-gray-800 mb-1">ملاحظات وبيان السجل الوظيفي</label>
            <textarea
              rows={2}
              placeholder="أي تفاصيل أو إشارات إدارية خاصة بالقرار..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-2.5 bg-white border border-gray-300 rounded-lg text-xs"
            />
          </div>

          {/* Confirmation Warning on Edit */}
          {showConfirmEdit && (
            <div className="bg-amber-50 border border-amber-300 p-3.5 rounded-xl text-amber-900 space-y-2">
              <div className="flex items-center gap-2 font-black">
                <ShieldAlert className="w-5 h-5 text-amber-600" />
                <span>تأكيد تعديل السجل الوظيفي:</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                هل أنت متأكد من حفظ التعديلات على هذا السجل الوظيفي؟ سيتم توثيق عملية التعديل والقيم السابقة والجديدة في سجل تدقيق النظام (Audit Log).
              </p>
            </div>
          )}

          {/* Actions Footer */}
          <div className="flex justify-between items-center pt-3 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-xl text-gray-700 font-bold hover:bg-gray-50 cursor-pointer"
            >
              إلغاء
            </button>

            <div className="flex items-center gap-2">
              {showConfirmEdit ? (
                <>
                  <button
                    type="button"
                    onClick={() => setShowConfirmEdit(false)}
                    className="px-3 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl font-bold cursor-pointer"
                  >
                    رجوع
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-amber-700 hover:bg-amber-800 text-white rounded-xl font-bold shadow-md cursor-pointer flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    <span>تأكيد وحفظ التعديلات</span>
                  </button>
                </>
              ) : (
                <button
                  type="submit"
                  className={`px-6 py-2.5 text-white rounded-xl font-black shadow-md cursor-pointer flex items-center gap-2 ${
                    actionType === 'ندب على درجة' ? 'bg-emerald-700 hover:bg-emerald-800' :
                    actionType === 'ترقية' ? 'bg-red-700 hover:bg-red-800' :
                    actionType === 'علاوة دورية' ? 'bg-blue-700 hover:bg-blue-800' :
                    'bg-slate-800 hover:bg-slate-900'
                  }`}
                >
                  <Award className="w-4 h-4 text-amber-300" />
                  <span>{recordToEdit ? 'متابعة حفظ التعديل' : 'حفظ وتسجيل الإجراء'}</span>
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
