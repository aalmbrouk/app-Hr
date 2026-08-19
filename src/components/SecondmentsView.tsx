import React, { useState } from 'react';
import { Employee, SecondmentRecord } from '../types';
import { UserCheck, Plus, Calendar, Building2, CheckCircle2 } from 'lucide-react';
import { getTodayDateStorage, getCurrentTimestamp } from '../utils/dateUtils';

interface SecondmentsViewProps {
  employees: Employee[];
  secondments: SecondmentRecord[];
  onAddSecondment: (sec: SecondmentRecord) => void;
  onUpdateStatus: (id: string, status: SecondmentRecord['status']) => void;
}

export const SecondmentsView: React.FC<SecondmentsViewProps> = ({
  employees,
  secondments,
  onAddSecondment,
  onUpdateStatus
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formEmpId, setFormEmpId] = useState<number>(employees[0]?.id || 1001);
  const [formAssignedEntity, setFormAssignedEntity] = useState('');
  const [formStartDate, setFormStartDate] = useState('');
  const [formEndDate, setFormEndDate] = useState('');
  const [formDecisionNo, setFormDecisionNo] = useState('');
  const [formReason, setFormReason] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const emp = employees.find((x) => x.id === formEmpId);
    if (!emp) return;

    const record: SecondmentRecord = {
      id: `SEC-${new Date().getFullYear()}-${String(secondments.length + 1).padStart(3, '0')}`,
      employeeId: formEmpId,
      originalDepartment: emp.department,
      assignedEntity: formAssignedEntity || 'جهة خارجية غير محددة',
      startDate: formStartDate || getTodayDateStorage(),
      endDate: formEndDate || '',
      decisionNumber: formDecisionNo || `قرار تكليف ${Math.floor(Math.random() * 500) + 100}`,
      decisionDate: getTodayDateStorage(),
      reason: formReason || 'ندب وتكليف بمهام خارجية',
      status: 'نشط',
      notes: 'تمت إضافة السجل وإتاحة متابعة تاريخ الانتهاء',
      createdBy: 'المستخدم الحالي',
      createdAt: getCurrentTimestamp()
    };

    onAddSecondment(record);
    setIsModalOpen(false);
    setFormAssignedEntity('');
    setFormDecisionNo('');
    setFormReason('');
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-red-700 font-bold text-xs mb-1">
            <Building2 className="w-4 h-4" />
            <span>وحدة الندب والإعارة والتكليف</span>
          </div>
          <h2 className="text-xl font-black text-slate-900">سجل الندب والتكليف والإعارات الخارجية</h2>
          <p className="text-xs text-slate-500 mt-1">
            تسجيل ومتابعة الموظفين المنتدبين لجهات خارجية أو المعارين لمستشفيات أخرى مع حفظ التاريخ كاملاً
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-5 py-2.5 rounded-xl bg-red-700 hover:bg-red-800 text-white font-black text-xs shadow-md flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>إصدار قرار ندب / تكليف جديد</span>
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-black text-slate-900">جدول قرارات الندب والتكليف القائمة والتاريخية</h3>
          <span className="text-xs text-slate-500 font-mono">العدد: {secondments.length}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="p-3">رقم القرار</th>
                <th className="p-3">الموظف</th>
                <th className="p-3">القسم الأصلي بمصرف الدم</th>
                <th className="p-3">الجهة الموفد إليها / المنتدب إليها</th>
                <th className="p-3">تاريخ البدء</th>
                <th className="p-3">تاريخ الانتهاء</th>
                <th className="p-3">الحالة</th>
                <th className="p-3 text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {secondments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">
                    لا توجد سجلات ندب حالياً
                  </td>
                </tr>
              ) : (
                secondments.map((sec) => {
                  const emp = employees.find((e) => e.id === sec.employeeId);
                  return (
                    <tr key={sec.id} className="hover:bg-slate-50 text-slate-800">
                      <td className="p-3 font-mono font-bold text-red-700">{sec.id}</td>
                      <td className="p-3 font-bold text-slate-900">{emp ? emp.fullName : sec.employeeId}</td>
                      <td className="p-3 text-slate-600">{sec.originalDepartment}</td>
                      <td className="p-3 font-bold text-slate-800">{sec.assignedEntity}</td>
                      <td className="p-3 font-mono text-slate-600">{sec.startDate}</td>
                      <td className="p-3 font-mono text-slate-600">{sec.endDate || 'غير محدد'}</td>
                      <td className="p-3">
                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                          sec.status === 'نشط' 
                            ? 'bg-amber-50 text-amber-800 border-amber-200' 
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}>
                          {sec.status}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        {sec.status === 'نشط' && (
                          <button
                            onClick={() => onUpdateStatus(sec.id, 'منتهي')}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded font-bold text-[10px]"
                          >
                            إنهاء الندب
                          </button>
                        )}
                      </td>
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
            <div className="bg-red-900 text-white p-4 flex items-center justify-between">
              <h3 className="font-black text-sm">إقرار ندب / تكليف جديد</h3>
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
                    <option key={e.id} value={e.id}>{e.fullName} ({e.department})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">الجهة المنتدب إليها / المكلف بها</label>
                <input
                  type="text"
                  value={formAssignedEntity}
                  onChange={(e) => setFormAssignedEntity(e.target.value)}
                  placeholder="مثال: مستشفى المرج التعليمي / وزارة الصحة"
                  required
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">تاريخ بداية الندب</label>
                  <input
                    type="date"
                    value={formStartDate}
                    onChange={(e) => setFormStartDate(e.target.value)}
                    required
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">تاريخ نهاية الندب</label>
                  <input
                    type="date"
                    value={formEndDate}
                    onChange={(e) => setFormEndDate(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">رقم القرار الإداري</label>
                <input
                  type="text"
                  value={formDecisionNo}
                  onChange={(e) => setFormDecisionNo(e.target.value)}
                  placeholder="مثال: قرار إعارة 201/2026"
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">سبب ومبررات التكليف</label>
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
                  حفظ القرار
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
