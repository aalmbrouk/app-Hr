import React, { useState } from 'react';
import { Employee, DisciplinaryRecord } from '../types';
import { AlertTriangle, Plus, ShieldAlert, FileText } from 'lucide-react';
import { getTodayDateStorage, getCurrentTimestamp } from '../utils/dateUtils';

interface DisciplinaryViewProps {
  employees: Employee[];
  disciplinaryRecords: DisciplinaryRecord[];
  onAddRecord: (record: DisciplinaryRecord) => void;
}

export const DisciplinaryView: React.FC<DisciplinaryViewProps> = ({
  employees,
  disciplinaryRecords,
  onAddRecord
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formEmpId, setFormEmpId] = useState<number>(employees[0]?.id || 1001);
  const [formType, setFormType] = useState<DisciplinaryRecord['recordType']>('تنبيه');
  const [formDecisionNo, setFormDecisionNo] = useState('');
  const [formReason, setFormReason] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formDays, setFormDays] = useState<number>(0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const emp = employees.find((x) => x.id === formEmpId);
    if (!emp) return;

    const record: DisciplinaryRecord = {
      id: `DIS-${new Date().getFullYear()}-${String(disciplinaryRecords.length + 1).padStart(3, '0')}`,
      employeeId: formEmpId,
      recordType: formType,
      decisionNumber: formDecisionNo || `مذكرة ${Math.floor(Math.random() * 400) + 100}`,
      decisionDate: getTodayDateStorage(),
      effectiveDate: getTodayDateStorage(),
      numberOfDays: formType === 'خصم من المرتب' ? formDays : undefined,
      reason: formReason || 'عدم الالتزام بضوابط العمل والدوام',
      description: formDesc,
      notes: 'تم أرشفة الإجراء الشؤون الوظيفية دون حذف التاريخ',
      createdBy: 'المستخدم الحالي',
      createdAt: getCurrentTimestamp()
    };

    onAddRecord(record);
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-rose-700 font-bold text-xs mb-1">
            <AlertTriangle className="w-4 h-4" />
            <span>وحدة الشؤون القانونية والمتابعة</span>
          </div>
          <h2 className="text-xl font-black text-slate-900">سجل الجزاءات والخصومات والإنذارات</h2>
          <p className="text-xs text-slate-500 mt-1">
            توثيق العقوبات الإدارية والإنذارات الكتابية والخصومات لضمان الشفافية والانضباط الإداري
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs shadow-md flex items-center gap-2"
        >
          <Plus className="w-4 h-4 text-red-400" />
          <span>تسجيل إجراء إداري / تنبيه / خصم</span>
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-black text-slate-900">سجل الجزاءات والإجراءات الإدارية</h3>
          <span className="text-xs text-slate-500 font-mono">العدد: {disciplinaryRecords.length}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="p-3">رقم السجل</th>
                <th className="p-3">الموظف</th>
                <th className="p-3">نوع الإجراء</th>
                <th className="p-3">رقم القرار / المذكرة</th>
                <th className="p-3">الأيام/الخصم</th>
                <th className="p-3">السبب</th>
                <th className="p-3">التاريخ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {disciplinaryRecords.map((d) => {
                const emp = employees.find((e) => e.id === d.employeeId);
                return (
                  <tr key={d.id} className="hover:bg-slate-50 text-slate-800">
                    <td className="p-3 font-mono font-bold text-red-700">{d.id}</td>
                    <td className="p-3 font-bold text-slate-900">{emp ? emp.fullName : d.employeeId}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        d.recordType === 'خصم من المرتب'
                          ? 'bg-rose-100 text-rose-800 border border-rose-300'
                          : 'bg-amber-100 text-amber-800 border border-amber-300'
                      }`}>
                        {d.recordType}
                      </span>
                    </td>
                    <td className="p-3 text-slate-600">{d.decisionNumber}</td>
                    <td className="p-3 font-mono font-bold text-slate-900">
                      {d.numberOfDays ? `${d.numberOfDays} يوم` : '-'}
                    </td>
                    <td className="p-3 text-slate-600">{d.reason}</td>
                    <td className="p-3 font-mono text-slate-600">{d.effectiveDate}</td>
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
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <h3 className="font-black text-sm">تسجيل إجراء إداري / خصم / تنبيه</h3>
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
                    <option key={e.id} value={e.id}>{e.fullName} ({e.jobNumber})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">نوع الإجراء</label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as any)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold"
                  >
                    <option value="تنبيه">تنبيه شفوي/كتابي</option>
                    <option value="إنذار كتابي">إنذار كتابي رسمي</option>
                    <option value="خصم من المرتب">خصم أخير من المرتب</option>
                    <option value="عقوبة إدارية">عقوبة إدارية مسجلة</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">رقم القرار / المذكرة</label>
                  <input
                    type="text"
                    value={formDecisionNo}
                    onChange={(e) => setFormDecisionNo(e.target.value)}
                    placeholder="مذكرة إدارية رقم 15/2026"
                    required
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                  />
                </div>
              </div>

              {formType === 'خصم من المرتب' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">عدد أيام الخصم</label>
                  <input
                    type="number"
                    min={1}
                    max={30}
                    value={formDays}
                    onChange={(e) => setFormDays(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">سبب المخالفة</label>
                <input
                  type="text"
                  value={formReason}
                  onChange={(e) => setFormReason(e.target.value)}
                  placeholder="سبب توجيه التنبيه أو الخصم"
                  required
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">تفاصيل وملاحظات إضافية</label>
                <textarea
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
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
                  className="px-5 py-2 bg-slate-900 hover:bg-black text-white font-bold text-xs rounded-xl shadow"
                >
                  حفظ وتسجيل الإجراء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
