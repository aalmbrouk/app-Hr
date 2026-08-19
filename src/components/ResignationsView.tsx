import React, { useState } from 'react';
import { Employee, ResignationRecord, EmploymentStatus } from '../types';
import { UserX, Plus, FileX, Archive } from 'lucide-react';
import { getTodayDateStorage, getCurrentTimestamp } from '../utils/dateUtils';

interface ResignationsViewProps {
  employees: Employee[];
  resignations: ResignationRecord[];
  onAddResignation: (resignation: ResignationRecord) => void;
  onUpdateEmployeeStatus: (employeeId: number, status: EmploymentStatus) => void;
}

export const ResignationsView: React.FC<ResignationsViewProps> = ({
  employees,
  resignations,
  onAddResignation,
  onUpdateEmployeeStatus
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formEmpId, setFormEmpId] = useState<number>(employees[0]?.id || 1001);
  const [formFinalStatus, setFormFinalStatus] = useState<ResignationRecord['finalStatus']>('مستقيل');
  const [formResignationDate, setFormResignationDate] = useState('');
  const [formLastWorkingDate, setFormLastWorkingDate] = useState('');
  const [formDecisionNo, setFormDecisionNo] = useState('');
  const [formReason, setFormReason] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const emp = employees.find((x) => x.id === formEmpId);
    if (!emp) return;

    const record: ResignationRecord = {
      id: `RES-${new Date().getFullYear()}-${String(resignations.length + 1).padStart(3, '0')}`,
      employeeId: formEmpId,
      resignationDate: formResignationDate || getTodayDateStorage(),
      lastWorkingDate: formLastWorkingDate || formResignationDate || getTodayDateStorage(),
      decisionNumber: formDecisionNo || `قرار نهاية خدمة ${Math.floor(Math.random() * 300) + 100}`,
      decisionDate: getTodayDateStorage(),
      reason: formReason || 'انتهاء الخدمة حسب الأصول',
      finalStatus: formFinalStatus,
      notes: 'تم حفظ الأرشيف التاريخي وتغيير الحالة الوظيفية دون حذف بيانات الموظف',
      createdBy: 'المستخدم الحالي',
      createdAt: getCurrentTimestamp()
    };

    onAddResignation(record);
    onUpdateEmployeeStatus(formEmpId, formFinalStatus as EmploymentStatus);
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-rose-700 font-bold text-xs mb-1">
            <UserX className="w-4 h-4" />
            <span>وحدة إنهاء الخدمة والأرشيف التاريخي</span>
          </div>
          <h2 className="text-xl font-black text-slate-900">سجل الاستقالات والتقاعد ونهاية الخدمة</h2>
          <p className="text-xs text-slate-500 mt-1">
            تسجيل الاستقالات والإحالة على التقاعد وإنهاء الخدمة مع الاحتفاظ بكافة البيانات التاريخية للموظف
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-5 py-2.5 rounded-xl bg-rose-700 hover:bg-rose-800 text-white font-black text-xs shadow-md flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>إقرار إنهاء خدمة / استقالة</span>
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-black text-slate-900">سجلات إنهاء الخدمة المؤرشفة</h3>
          <span className="text-xs text-slate-500 font-mono">العدد: {resignations.length}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="p-3">رقم القرار</th>
                <th className="p-3">الموظف</th>
                <th className="p-3">الحالة النهائية</th>
                <th className="p-3">تاريخ الاستقالة / القرار</th>
                <th className="p-3">آخر يوم عمل</th>
                <th className="p-3">السبب</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {resignations.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    لا توجد سجلات استقالة أو تقاعد مسجلة حالياً
                  </td>
                </tr>
              ) : (
                resignations.map((r) => {
                  const emp = employees.find((e) => e.id === r.employeeId);
                  return (
                    <tr key={r.id} className="hover:bg-slate-50 text-slate-800">
                      <td className="p-3 font-mono font-bold text-red-700">{r.id}</td>
                      <td className="p-3 font-bold text-slate-900">{emp ? emp.fullName : r.employeeId}</td>
                      <td className="p-3">
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-800 border border-rose-200">
                          {r.finalStatus}
                        </span>
                      </td>
                      <td className="p-3 font-mono text-slate-600">{r.resignationDate}</td>
                      <td className="p-3 font-mono text-slate-600">{r.lastWorkingDate}</td>
                      <td className="p-3 text-slate-600">{r.reason}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="bg-rose-900 text-white p-4 flex items-center justify-between">
              <h3 className="font-black text-sm">تسجيل استقالة / إحالة للتقاعد / إنهاء خدمة</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-white font-bold">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">الموظف</label>
                <select
                  value={formEmpId}
                  onChange={(e) => setFormEmpId(Number(e.target.value))}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900"
                >
                  {employees.map((e) => (
                    <option key={e.id} value={e.id}>{e.fullName} ({e.jobNumber})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">الحالة النهائية</label>
                  <select
                    value={formFinalStatus}
                    onChange={(e) => setFormFinalStatus(e.target.value as any)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold"
                  >
                    <option value="مستقيل">مستقيل</option>
                    <option value="متقاعد">متقاعد</option>
                    <option value="منهي خدماته">منهي خدماته</option>
                    <option value="متوفى">متوفى</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">رقم القرار</label>
                  <input
                    type="text"
                    value={formDecisionNo}
                    onChange={(e) => setFormDecisionNo(e.target.value)}
                    placeholder="قرار رقم 10/2026"
                    required
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">تاريخ تقديم القرار</label>
                  <input
                    type="date"
                    value={formResignationDate}
                    onChange={(e) => setFormResignationDate(e.target.value)}
                    required
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">آخر يوم عمل</label>
                  <input
                    type="date"
                    value={formLastWorkingDate}
                    onChange={(e) => setFormLastWorkingDate(e.target.value)}
                    required
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">سبب إنهاء الخدمة</label>
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
                  className="px-5 py-2 bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs rounded-xl shadow"
                >
                  حفظ وتأكيد إنهاء الخدمة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
