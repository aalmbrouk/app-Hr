import React, { useState } from 'react';
import { OrganizationalUnit, JobTitle, AssignmentCategory } from '../types';
import { Building2, Briefcase, Plus, Trash2, Edit2, CheckCircle2, ShieldCheck } from 'lucide-react';

interface OrgStructureViewProps {
  orgUnits?: OrganizationalUnit[];
  units?: OrganizationalUnit[];
  jobTitles?: JobTitle[];
  onUpdateOrgUnits?: (units: OrganizationalUnit[]) => void;
  onUpdateUnits?: (units: OrganizationalUnit[]) => void;
  onUpdateJobTitles?: (jobs: JobTitle[]) => void;
}

export const OrgStructureView: React.FC<OrgStructureViewProps> = ({
  orgUnits: propsOrgUnits,
  units: propsUnits,
  jobTitles = [],
  onUpdateOrgUnits,
  onUpdateUnits,
  onUpdateJobTitles
}) => {
  const orgUnits = propsOrgUnits || propsUnits || [];
  const handleUpdateUnits = onUpdateOrgUnits || onUpdateUnits || (() => {});
  const [activeTab, setActiveTab] = useState<'units' | 'jobs'>('units');

  // Unit modal
  const [isUnitModalOpen, setIsUnitModalOpen] = useState(false);
  const [newUnit, setNewUnit] = useState<{
    unitName: string;
    level: 'إدارة' | 'مكتب' | 'قسم' | 'وحدة';
    category: AssignmentCategory | 'مشترك';
  }>({
    unitName: '',
    level: 'قسم',
    category: 'إداري'
  });

  // Job modal
  const [isJobModalOpen, setIsJobModalOpen] = useState(false);
  const [newJob, setNewJob] = useState<{
    departmentId: string;
    jobTitle: string;
    category: AssignmentCategory;
  }>({
    departmentId: orgUnits?.[0]?.id || 'UNIT-001',
    jobTitle: '',
    category: 'إداري'
  });

  const handleAddUnit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUnit.unitName.trim()) return;

    const unit: OrganizationalUnit = {
      id: `UNIT-${String(orgUnits.length + 1).padStart(3, '0')}`,
      unitName: newUnit.unitName.trim(),
      level: newUnit.level,
      category: newUnit.category,
      active: true,
      sortOrder: orgUnits.length + 1
    };

    handleUpdateUnits([...orgUnits, unit]);
    setIsUnitModalOpen(false);
    setNewUnit({ unitName: '', level: 'قسم', category: 'إداري' });
  };

  const handleDeleteUnit = (id: string) => {
    handleUpdateUnits(orgUnits.filter((u) => u.id !== id));
  };

  const handleAddJob = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newJob.jobTitle.trim()) return;

    const targetUnit = orgUnits.find((u) => u.id === newJob.departmentId);

    const job: JobTitle = {
      id: `JOB-${Date.now()}`,
      departmentId: newJob.departmentId,
      jobTitle: newJob.jobTitle.trim(),
      category: targetUnit?.category === 'طبي' ? 'طبي' : newJob.category,
      active: true,
      sortOrder: jobTitles.length + 1
    };

    onUpdateJobTitles?.([...jobTitles, job]);
    setIsJobModalOpen(false);
    setNewJob({ departmentId: orgUnits?.[0]?.id || 'UNIT-001', jobTitle: '', category: 'إداري' });
  };

  const handleDeleteJob = (id: string) => {
    onUpdateJobTitles?.(jobTitles.filter((j) => j.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Building2 className="w-7 h-7 text-red-700" />
            جدول وقاعدة بيانات الهيكل التنظيمي المعتمد
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            إدارة الإدارات والمكاتب والأقسام والوظائف ديناميكياً ودعم التصنيف (إداري / طبي)
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('units')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'units'
                ? 'bg-red-700 text-white shadow-sm'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            الوحدات الإدارية ({orgUnits.length})
          </button>
          <button
            onClick={() => setActiveTab('jobs')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'jobs'
                ? 'bg-red-700 text-white shadow-sm'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            المسميات الوظيفية ({jobTitles.length})
          </button>
        </div>
      </div>

      {activeTab === 'units' ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden p-6 space-y-4">
          <div className="flex justify-between items-center border-b pb-4">
            <h2 className="font-bold text-gray-800 text-lg">قائمة الوحدات التنظيمية (إدارة / مكتب / قسم)</h2>
            <button
              onClick={() => setIsUnitModalOpen(true)}
              className="flex items-center gap-2 bg-red-700 hover:bg-red-800 text-white px-3.5 py-2 rounded-lg text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              إضافة وحدة تنظيمية
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-700 font-semibold">
                <tr>
                  <th className="py-3 px-4">كود الوحدة</th>
                  <th className="py-3 px-4">اسم الإدارة / المكتب / القسم</th>
                  <th className="py-3 px-4">المستوى التنظيمي</th>
                  <th className="py-3 px-4">التصنيف الرئيسي</th>
                  <th className="py-3 px-4 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {orgUnits.map((unit) => (
                  <tr key={unit.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4 font-mono text-xs text-gray-500">{unit.id}</td>
                    <td className="py-3 px-4 font-bold text-gray-900">{unit.unitName}</td>
                    <td className="py-3 px-4">
                      <span className="bg-gray-100 text-gray-800 text-xs px-2.5 py-1 rounded-full font-medium">
                        {unit.level}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`text-xs px-2.5 py-1 rounded-full font-medium border ${
                          unit.category === 'طبي'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : unit.category === 'إداري'
                            ? 'bg-blue-50 text-blue-800 border-blue-200'
                            : 'bg-purple-50 text-purple-800 border-purple-200'
                        }`}
                      >
                        {unit.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleDeleteUnit(unit.id)}
                        className="text-gray-400 hover:text-red-600 p-1 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden p-6 space-y-4">
          <div className="flex justify-between items-center border-b pb-4">
            <h2 className="font-bold text-gray-800 text-lg">جدول المسميات الوظيفية والمستويات</h2>
            <button
              onClick={() => setIsJobModalOpen(true)}
              className="flex items-center gap-2 bg-red-700 hover:bg-red-800 text-white px-3.5 py-2 rounded-lg text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              إضافة مسمى وظيفي
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-700 font-semibold">
                <tr>
                  <th className="py-3 px-4">الوحدة / القسم التابع له</th>
                  <th className="py-3 px-4">المسمى الوظيفي</th>
                  <th className="py-3 px-4">التصنيف</th>
                  <th className="py-3 px-4 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {jobTitles.map((job) => {
                  const unit = orgUnits.find((u) => u.id === job.departmentId);
                  return (
                    <tr key={job.id} className="hover:bg-gray-50">
                      <td className="py-3 px-4 text-gray-700 font-medium">{unit?.unitName || 'قسم عام'}</td>
                      <td className="py-3 px-4 font-bold text-gray-900">{job.jobTitle}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`text-xs px-2.5 py-1 rounded-full font-medium border ${
                            job.category === 'طبي'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : 'bg-blue-50 text-blue-800 border-blue-200'
                          }`}
                        >
                          {job.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleDeleteJob(job.id)}
                          className="text-gray-400 hover:text-red-600 p-1 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Unit Modal */}
      {isUnitModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
            <h3 className="font-bold text-gray-900 text-lg border-b pb-2">إضافة وحدة تنظيمية جديدة</h3>
            <form onSubmit={handleAddUnit} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">اسم الوحدة *</label>
                <input
                  type="text"
                  required
                  value={newUnit.unitName}
                  onChange={(e) => setNewUnit({ ...newUnit, unitName: e.target.value })}
                  placeholder="مثال: قسم الجودة الطبية"
                  className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-red-600 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">المستوى التنظيمي</label>
                <select
                  value={newUnit.level}
                  onChange={(e) => setNewUnit({ ...newUnit, level: e.target.value as any })}
                  className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-red-600 outline-none"
                >
                  <option value="إدارة">إدارة</option>
                  <option value="مكتب">مكتب</option>
                  <option value="قسم">قسم</option>
                  <option value="وحدة">وحدة</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">التصنيف الوظيفي</label>
                <select
                  value={newUnit.category}
                  onChange={(e) => setNewUnit({ ...newUnit, category: e.target.value as any })}
                  className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-red-600 outline-none"
                >
                  <option value="إداري">إداري</option>
                  <option value="طبي">طبي</option>
                  <option value="مشترك">مشترك</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setIsUnitModalOpen(false)}
                  className="px-4 py-2 border rounded-lg text-gray-700"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-700 text-white rounded-lg font-medium"
                >
                  حفظ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Job Modal */}
      {isJobModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
            <h3 className="font-bold text-gray-900 text-lg border-b pb-2">إضافة مسمى وظيفي جديد</h3>
            <form onSubmit={handleAddJob} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">الوحدة / القسم التابع له *</label>
                <select
                  value={newJob.departmentId}
                  onChange={(e) => setNewJob({ ...newJob, departmentId: e.target.value })}
                  className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-red-600 outline-none"
                >
                  {orgUnits.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.unitName} ({u.level})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">المسمى الوظيفي *</label>
                <input
                  type="text"
                  required
                  value={newJob.jobTitle}
                  onChange={(e) => setNewJob({ ...newJob, jobTitle: e.target.value })}
                  placeholder="مثال: فني مطابقة دموية"
                  className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-red-600 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">التصنيف</label>
                <select
                  value={newJob.category}
                  onChange={(e) => setNewJob({ ...newJob, category: e.target.value as any })}
                  className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-red-600 outline-none"
                >
                  <option value="إداري">إداري</option>
                  <option value="طبي">طبي</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setIsJobModalOpen(false)}
                  className="px-4 py-2 border rounded-lg text-gray-700"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-700 text-white rounded-lg font-medium"
                >
                  حفظ المسمى
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
