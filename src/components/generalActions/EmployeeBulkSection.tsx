import React, { useState } from 'react';
import { 
  Users, 
  Building2, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldCheck, 
  Search, 
  Filter, 
  Tag, 
  FolderLock 
} from 'lucide-react';
import { Employee, BulkOperationRecord, AuditLog } from '../../types';
import { FullAppDatabase } from '../../utils/storageTypes';
import { createDatabaseBackup } from '../../utils/backupService';
import { SecurityPasswordModal } from './SecurityPasswordModal';

interface EmployeeBulkSectionProps {
  employees: Employee[];
  bulkOperations: BulkOperationRecord[];
  fullDatabase: FullAppDatabase;
  currentUser: string;
  onBatchUpdateEmployees?: (updatedEmployees: Employee[]) => void;
  onRecordBulkOperation: (operation: BulkOperationRecord) => void;
  onAddAuditLog?: (log: AuditLog) => void;
}

export const EmployeeBulkSection: React.FC<EmployeeBulkSectionProps> = ({
  employees,
  bulkOperations,
  fullDatabase,
  currentUser,
  onBatchUpdateEmployees,
  onRecordBulkOperation,
  onAddAuditLog
}) => {
  const [bulkActionType, setBulkActionType] = useState<'status' | 'department' | 'contractType'>('status');
  const [newStatus, setNewStatus] = useState<string>('مستمر بالخدمة');
  const [newDepartment, setNewDepartment] = useState<string>('مختبر المناعة والتوافق المصلي');
  const [newContractType, setNewContractType] = useState<string>('عقد دائم');
  const [actionReason, setActionReason] = useState<string>('إعادة هيكلة وتحديث إداري جماعي للملاك');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmpIds, setSelectedEmpIds] = useState<number[]>([]);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  const filteredEmployees = employees.filter((emp) =>
    emp.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.jobNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectAll = () => {
    setSelectedEmpIds(filteredEmployees.map(e => e.id));
  };

  const handleClearSelection = () => {
    setSelectedEmpIds([]);
  };

  const handleExecuteBulkUpdate = async () => {
    setIsPasswordModalOpen(false);

    if (selectedEmpIds.length === 0) return;

    try {
      const backupResult = await createDatabaseBackup(
        fullDatabase,
        currentUser || 'المدير الإداري',
        'تلقائية',
        'ZIP'
      );

      const targetEmployees = employees.filter(e => selectedEmpIds.includes(e.id));
      const preSnapshot = targetEmployees.map(emp => ({
        id: emp.id,
        fullName: emp.fullName,
        jobNumber: emp.jobNumber,
        status: emp.status,
        department: emp.department,
        contractType: emp.contractType
      }));

      const updatedList = employees.map(emp => {
        if (!selectedEmpIds.includes(emp.id)) return emp;

        if (bulkActionType === 'status') {
          return { ...emp, status: newStatus as any };
        } else if (bulkActionType === 'department') {
          return { ...emp, department: newDepartment };
        } else {
          return { ...emp, contractType: newContractType as any };
        }
      });

      if (onBatchUpdateEmployees) {
        onBatchUpdateEmployees(updatedList);
      }

      const opCode = `EMP-BULK-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
      const opName = bulkActionType === 'status' 
        ? `تحديث الحالة الوظيفية جماعياً إلى (${newStatus})` 
        : bulkActionType === 'department' 
        ? `نقل وتحديث القسم جماعياً إلى (${newDepartment})` 
        : `تحديث نوع العقد جماعياً إلى (${newContractType})`;

      const bulkOp: BulkOperationRecord = {
        id: `BULK-EMP-${Date.now()}`,
        operationCode: opCode,
        actionType: 'EMPLOYEE_STATUS_UPDATE',
        actionName: opName,
        executedAt: new Date().toISOString(),
        executedBy: currentUser || 'المدير العام',
        affectedCount: targetEmployees.length,
        affectedEmployeeIds: targetEmployees.map(e => e.id),
        preOperationSnapshot: preSnapshot,
        backupFileName: backupResult.fileName,
        backupChecksum: backupResult.checksum,
        status: 'SUCCESS',
        details: {
          updateType: bulkActionType,
          reason: actionReason
        }
      };

      onRecordBulkOperation(bulkOp);

      if (onAddAuditLog) {
        onAddAuditLog({
          id: `LOG-${Date.now()}`,
          userId: 1,
          userName: currentUser || 'المدير الإداري',
          action: 'BULK_EMPLOYEES_UPDATED',
          details: `تم تنفيذ إجراء جماعي (${opName}) لعدد ${targetEmployees.length} موظف. النسخة: ${backupResult.fileName}`,
          timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
          ipAddress: '127.0.0.1'
        });
      }

      alert(`تم بنجاح تحديث وتطبيق الإجراء الإداري الجماعي لعدد ${targetEmployees.length} موظف!`);

    } catch (err: any) {
      console.error(err);
      alert(`حدث خطأ أثناء تنفيذ الإجراء الجماعي: ${err.message}`);
    }
  };

  return (
    <div className="space-y-4 text-xs">
      
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-red-700 font-extrabold text-xs mb-1">
            <Users className="w-4 h-4" />
            <span>الإجراءات العامة لملفات الموظفين</span>
          </div>
          <h2 className="text-lg font-black text-gray-900">
            الإجراءات الإدارية الجماعية للموظفين
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            تحديث الحالة الوظيفية، إعادة توزيع الأقسام، أو تعديل شروط العقود مع الحفظ والتأمين
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsPasswordModalOpen(true)}
          disabled={selectedEmpIds.length === 0}
          className="px-5 py-2.5 bg-red-700 hover:bg-red-800 text-white rounded-xl font-extrabold flex items-center gap-2 shadow-sm disabled:opacity-50 cursor-pointer"
        >
          <CheckCircle2 className="w-4 h-4 text-amber-300" />
          <span>تطبيق الإجراء الجماعي ({selectedEmpIds.length})</span>
        </button>
      </div>

      {/* Options Panel */}
      <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          
          <div>
            <label className="block font-bold text-gray-800 mb-1">نوع الإجراء الجماعي *</label>
            <select
              value={bulkActionType}
              onChange={(e) => setBulkActionType(e.target.value as any)}
              className="w-full p-2 bg-gray-50 border border-gray-300 rounded-xl font-bold text-gray-900"
            >
              <option value="status">تعديل الحالة الوظيفية (نشط / مستمر / موقوف)</option>
              <option value="department">إعادة توزيع / نقل جماعي للأقسام</option>
              <option value="contractType">تحديث نوع العقد والتعيين</option>
            </select>
          </div>

          {bulkActionType === 'status' && (
            <div>
              <label className="block font-bold text-gray-800 mb-1">الحالة الوظيفية الجديدة *</label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="w-full p-2 bg-gray-50 border border-gray-300 rounded-xl font-bold text-gray-900"
              >
                <option value="مستمر بالخدمة">مستمر بالخدمة</option>
                <option value="في إجازة">في إجازة</option>
                <option value="منتدب">منتدب</option>
                <option value="مكلف بمهمة">مكلف بمهمة</option>
                <option value="موقوف عن العمل">موقوف عن العمل</option>
              </select>
            </div>
          )}

          {bulkActionType === 'department' && (
            <div>
              <label className="block font-bold text-gray-800 mb-1">القسم / الوحدة المنقول إليها *</label>
              <select
                value={newDepartment}
                onChange={(e) => setNewDepartment(e.target.value)}
                className="w-full p-2 bg-gray-50 border border-gray-300 rounded-xl font-bold text-gray-900"
              >
                <option value="مختبر المناعة والتوافق المصلي">مختبر المناعة والتوافق المصلي</option>
                <option value="قسم سحب الدم والتبرع">قسم سحب الدم والتبرع</option>
                <option value="مختبر الفيروسات والأمراض المنقولة">مختبر الفيروسات والأمراض المنقولة</option>
                <option value="قسم الموارد البشرية والشؤون الإدارية">قسم الموارد البشرية والشؤون الإدارية</option>
                <option value="وحدة التوزيع وصرف مشتقات الدم">وحدة التوزيع وصرف مشتقات الدم</option>
                <option value="مختبر فصل وتجزئة مكونات الدم">مختبر فصل وتجزئة مكونات الدم</option>
              </select>
            </div>
          )}

          {bulkActionType === 'contractType' && (
            <div>
              <label className="block font-bold text-gray-800 mb-1">نوع العقد الجديد *</label>
              <select
                value={newContractType}
                onChange={(e) => setNewContractType(e.target.value)}
                className="w-full p-2 bg-gray-50 border border-gray-300 rounded-xl font-bold text-gray-900"
              >
                <option value="عقد دائم">عقد دائم</option>
                <option value="عقد مؤقت">عقد مؤقت</option>
                <option value="ندب">ندب</option>
                <option value="إعارة">إعارة</option>
                <option value="عقد تدريب">عقد تدريب</option>
              </select>
            </div>
          )}

          <div>
            <label className="block font-bold text-gray-800 mb-1">سبب ومستند الإجراء الإداري</label>
            <input
              type="text"
              value={actionReason}
              onChange={(e) => setActionReason(e.target.value)}
              className="w-full p-2 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 font-bold"
            />
          </div>

        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSelectAll}
              className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg font-bold"
            >
              تحديد الجميع ({employees.length})
            </button>
            <button
              type="button"
              onClick={handleClearSelection}
              className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg font-bold"
            >
              إلغاء التحديد
            </button>
          </div>

          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="تصفية بالاسم أو الرقم..."
              className="p-1.5 bg-gray-50 border border-gray-300 rounded-lg text-xs"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-right text-xs">
          <thead className="bg-slate-50 border-b border-gray-200 font-extrabold text-gray-700">
            <tr>
              <th className="py-2.5 px-3 text-center w-10">تحديد</th>
              <th className="py-2.5 px-3">الرقم الوظيفي</th>
              <th className="py-2.5 px-3">اسم الموظف</th>
              <th className="py-2.5 px-3">القسم الحالي</th>
              <th className="py-2.5 px-3">الحالة الحالية</th>
              <th className="py-2.5 px-3">نوع العقد</th>
              <th className="py-2.5 px-3 bg-red-50 text-red-950 font-black">النتيجة بعد التطبيق</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredEmployees.map((emp) => {
              const isSelected = selectedEmpIds.includes(emp.id);
              let resultStr = '—';
              if (isSelected) {
                if (bulkActionType === 'status') resultStr = `الحالة ← ${newStatus}`;
                else if (bulkActionType === 'department') resultStr = `القسم ← ${newDepartment}`;
                else resultStr = `العقد ← ${newContractType}`;
              }

              return (
                <tr key={emp.id} className={`hover:bg-gray-50 ${isSelected ? 'bg-amber-50/20' : ''}`}>
                  <td className="py-2 px-3 text-center">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedEmpIds(prev => [...prev, emp.id]);
                        } else {
                          setSelectedEmpIds(prev => prev.filter(id => id !== emp.id));
                        }
                      }}
                      className="rounded"
                    />
                  </td>
                  <td className="py-2 px-3 font-mono font-bold text-gray-800">{emp.jobNumber}</td>
                  <td className="py-2 px-3 font-extrabold text-gray-900">{emp.fullName}</td>
                  <td className="py-2 px-3 text-gray-600">{emp.department}</td>
                  <td className="py-2 px-3">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-900">
                      {emp.status}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-gray-600">{emp.contractType || 'دائم'}</td>
                  <td className="py-2 px-3 font-bold font-mono text-red-950 bg-red-50/50">
                    {resultStr}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <SecurityPasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        onSuccess={handleExecuteBulkUpdate}
        title="تأكيد تنفيذ الإجراء الجماعي"
        actionDescription={`أنت على وشك تنفيذ إجراء جماعي لعدد ${selectedEmpIds.length} موظف. سيتم أخذ نسخة احتياطية تأمينية كاملة وتحديث البيانات فوراً.`}
        currentUser={currentUser}
      />

    </div>
  );
};
