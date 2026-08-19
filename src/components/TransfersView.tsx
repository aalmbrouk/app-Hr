import React, { useState } from 'react';
import { Employee, TransferRecord } from '../types';
import { ArrowLeftRight, Plus, Building, FileText } from 'lucide-react';
import { getTodayDateStorage, getCurrentTimestamp } from '../utils/dateUtils';

interface TransfersViewProps {
  employees: Employee[];
  transfers: TransferRecord[];
  onAddTransfer: (transfer: TransferRecord) => void;
  onUpdateEmployeeDept: (employeeId: number, newDept: string) => void;
}

export const TransfersView: React.FC<TransfersViewProps> = ({
  employees,
  transfers,
  onAddTransfer,
  onUpdateEmployeeDept
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formEmpId, setFormEmpId] = useState<number>(employees[0]?.id || 1001);
  const [formType, setFormType] = useState<TransferRecord['transferType']>('نقل داخلي');
  const [formNewDept, setFormNewDept] = useState('');
  const [formDecisionNo, setFormDecisionNo] = useState('');
  const [formReason, setFormReason] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const emp = employees.find((x) => x.id === formEmpId);
    if (!emp) return;

    const record: TransferRecord = {
      id: `TRN-${new Date().getFullYear()}-${String(transfers.length + 1).padStart(3, '0')}`,
      employeeId: formEmpId,
      previousDepartment: emp.department,
      newDepartment: formNewDept || 'قسم غير محدد',
      transferType: formType,
      decisionNumber: formDecisionNo || `قرار نقل ${Math.floor(Math.random() * 500) + 100}`,
      decisionDate: getTodayDateStorage(),
      effectiveDate: getTodayDateStorage(),
      reason: formReason || 'تنسيق داخلي وحاجة العمل',
      notes: 'تم تحديث قسم الموظف الحالي مع حفظ التاريخ الأرشيفي',
      createdBy: 'المستخدم الحالي',
      createdAt: getCurrentTimestamp()
    };

    onAddTransfer(record);
    if (formType === 'نقل داخلي') {
      onUpdateEmployeeDept(formEmpId, formNewDept);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-red-700 font-bold text-xs mb-1">
            <ArrowLeftRight className="w-4 h-4" />
            <span>وحدة التنقلات الشؤون الوظيفية</span>
          </div>
          <h2 className="text-xl font-black text-slate-900">سجل التنقلات الداخلية والخارجية</h2>
          <p className="text-xs text-slate-500 mt-1">
            متابعة حركة نقل الموظفين بين أقسام وحدات مصرف الدم أو النقل من وإلى الجهات الصحية الأخرى
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-5 py-2.5 rounded-xl bg-red-700 hover:bg-red-800 text-white font-black text-xs shadow-md flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>إصدار قرار نقل جديد</span>
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-black text-slate-900">حركات النقل المسجلة</h3>
          <span className="text-xs text-slate-500 font-mono">العدد: {transfers.length}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="p-3">رقم الحركة</th>
                <th className="p-3">الموظف</th>
                <th className="p-3">نوع النقل</th>
                <th className="p-3">من القسم / الجهة</th>
                <th className="p-3">إلى القسم / الجهة</th>
                <th className="p-3">رقم القرار</th>
                <th className="p-3">تاريخ النفاذ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {transfers.map((t) => {
                const emp = employees.find((e) => e.id === t.employeeId);
                return (
                  <tr key={t.id} className="hover:bg-slate-50 text-slate-800">
                    <td className="p-3 font-mono font-bold text-red-700">{t.id}</td>
                    <td className="p-3 font-bold text-slate-900">{emp ? emp.fullName : t.employeeId}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 border border-slate-200">
                        {t.transferType}
                      </span>
                    </td>
                    <td className="p-3 text-slate-500">{t.previousDepartment}</td>
                    <td className="p-3 font-bold text-emerald-700">{t.newDepartment}</td>
                    <td className="p-3 text-slate-600">{t.decisionNumber}</td>
                    <td className="p-3 font-mono text-slate-600">{t.effectiveDate}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="bg-red-900 text-white p-4 flex items-center justify-between">
              <h3 className="font-black text-sm">إصدار حركة نقل موظف</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-white font-bold">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">الموظف</label>
                <select
                  value={formEmpId}
                  onChange={(e) => setFormEmpId(Number(e.target.value))}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold"
                >
                  {employees.map((e) => (
                    <option key={e.id} value={e.id}>{e.fullName} (حالياً: {e.department})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">نوع النقل</label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as any)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold"
                  >
                    <option value="نقل داخلي">نقل داخلي بين الأقسام</option>
                    <option value="نقل خارجي">نقل خارجي لجهة أخرى</option>
                    <option value="نقل لمصرف الدم">نقل إلى مصرف الدم</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">القسم / الجهة الجديدة</label>
                  <input
                    type="text"
                    value={formNewDept}
                    onChange={(e) => setFormNewDept(e.target.value)}
                    placeholder="اسم القسم أو الجهة المستقبلة"
                    required
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">رقم القرار الإداري</label>
                <input
                  type="text"
                  value={formDecisionNo}
                  onChange={(e) => setFormDecisionNo(e.target.value)}
                  placeholder="قرار نقل رقم 44/2026"
                  required
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">السبب والملاحظات</label>
                <textarea
                  value={formReason}
                  onChange={(e) => setFormReason(e.target.value)}
                  rows={2}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-red-700 hover:bg-red-800 text-white font-bold text-xs rounded-xl shadow"
                >
                  تأكيد وتنفيذ النقل
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
