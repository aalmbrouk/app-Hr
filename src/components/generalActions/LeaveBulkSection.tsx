import React, { useState } from 'react';
import { 
  Palmtree, 
  Plus, 
  Calendar, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldCheck, 
  Search, 
  RotateCcw,
  Sparkles,
  Users
} from 'lucide-react';
import { Employee, BulkOperationRecord, AuditLog } from '../../types';
import { formatDateDisplay } from '../../utils/dateUtils';
import { FullAppDatabase } from '../../utils/storageTypes';
import { createDatabaseBackup } from '../../utils/backupService';
import { SecurityPasswordModal } from './SecurityPasswordModal';

interface LeaveBulkSectionProps {
  employees: Employee[];
  bulkOperations: BulkOperationRecord[];
  fullDatabase: FullAppDatabase;
  currentUser: string;
  onBatchUpdateEmployees?: (updatedEmployees: Employee[]) => void;
  onRecordBulkOperation: (operation: BulkOperationRecord) => void;
  onAddAuditLog?: (log: AuditLog) => void;
}

export const LeaveBulkSection: React.FC<LeaveBulkSectionProps> = ({
  employees,
  bulkOperations,
  fullDatabase,
  currentUser,
  onBatchUpdateEmployees,
  onRecordBulkOperation,
  onAddAuditLog
}) => {
  const [leaveTypeAction, setLeaveTypeAction] = useState<'annual' | 'emergency'>('annual');
  const [amountToAdd, setAmountToAdd] = useState<number>(30);
  const [targetYear, setTargetYear] = useState<string>(String(new Date().getFullYear()));
  const [notes, setNotes] = useState<string>(`ترحيل وتجديد الرصيد السنوي القانوني لسنة ${new Date().getFullYear()}`);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmpIds, setSelectedEmpIds] = useState<number[]>(employees.map(e => e.id));
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

  const handleExecuteBulkLeave = async () => {
    setIsPasswordModalOpen(false);

    if (selectedEmpIds.length === 0) return;

    try {
      // 1. Safety Backup
      const backupResult = await createDatabaseBackup(
        fullDatabase,
        currentUser || 'المدير الإداري',
        'تلقائية',
        'ZIP'
      );

      // 2. Pre-operation snapshot
      const targetEmployees = employees.filter(e => selectedEmpIds.includes(e.id));
      const preSnapshot = targetEmployees.map(emp => ({
        id: emp.id,
        fullName: emp.fullName,
        jobNumber: emp.jobNumber,
        annualLeaveBalance: emp.annualLeaveBalance,
        emergencyLeaveBalance: emp.emergencyLeaveBalance
      }));

      // 3. Update balances
      const updatedList = employees.map(emp => {
        if (!selectedEmpIds.includes(emp.id)) return emp;

        if (leaveTypeAction === 'annual') {
          return {
            ...emp,
            annualLeaveBalance: (emp.annualLeaveBalance || 0) + Number(amountToAdd)
          };
        } else {
          return {
            ...emp,
            emergencyLeaveBalance: (emp.emergencyLeaveBalance || 0) + Number(amountToAdd)
          };
        }
      });

      if (onBatchUpdateEmployees) {
        onBatchUpdateEmployees(updatedList);
      }

      // 4. Record Bulk Operation
      const opCode = `LEAVE-BULK-${targetYear}-${Math.floor(100 + Math.random() * 900)}`;
      const opName = leaveTypeAction === 'annual'
        ? `إضافة رصيد سنوي (+${amountToAdd} يوم) لعام ${targetYear}`
        : `إضافة رصيد طارئ (+${amountToAdd} يوم) لعام ${targetYear}`;

      const bulkOp: BulkOperationRecord = {
        id: `BULK-LEAVE-${Date.now()}`,
        operationCode: opCode,
        actionType: 'LEAVE_BALANCE_ADJUST',
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
          leaveType: leaveTypeAction,
          amountAdded: amountToAdd,
          targetYear,
          notes
        }
      };

      onRecordBulkOperation(bulkOp);

      if (onAddAuditLog) {
        onAddAuditLog({
          id: `LOG-${Date.now()}`,
          userId: 1,
          userName: currentUser || 'المدير الإداري',
          action: 'BULK_LEAVE_BALANCE_UPDATED',
          details: `تم تحديث أرصدة الإجازات (+${amountToAdd} يوم) لعدد ${targetEmployees.length} موظف. رمز العملية: ${opCode}`,
          timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
          ipAddress: '127.0.0.1'
        });
      }

      alert(`تم بنجاح تحديث وتغذية أرصدة الإجازات لعدد ${targetEmployees.length} موظف بمقدار (+${amountToAdd} يوم)!`);

    } catch (err: any) {
      console.error(err);
      alert(`حدث خطأ أثناء تحديث الأرصدة: ${err.message}`);
    }
  };

  return (
    <div className="space-y-4 text-xs">
      
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-red-700 font-extrabold text-xs mb-1">
            <Palmtree className="w-4 h-4" />
            <span>الإجراءات العامة للأرصدة والإجازات</span>
          </div>
          <h2 className="text-lg font-black text-gray-900">
            تغذية وتحديث أرصدة الإجازات الجماعية
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            تجديد الأرصدة السنوية الدورية أو الطارئة لكافة موظفي المصرف دفعة واحدة مع النسخ الاحتياطي
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsPasswordModalOpen(true)}
          disabled={selectedEmpIds.length === 0}
          className="px-5 py-2.5 bg-red-700 hover:bg-red-800 text-white rounded-xl font-extrabold flex items-center gap-2 shadow-sm disabled:opacity-50 cursor-pointer"
        >
          <CheckCircle2 className="w-4 h-4 text-amber-300" />
          <span>تطبيق تغذية الأرصدة للمحددين ({selectedEmpIds.length})</span>
        </button>
      </div>

      {/* Control Configuration */}
      <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          
          <div>
            <label className="block font-bold text-gray-800 mb-1">نوع رصيد الإجازة *</label>
            <select
              value={leaveTypeAction}
              onChange={(e) => setLeaveTypeAction(e.target.value as any)}
              className="w-full p-2 bg-gray-50 border border-gray-300 rounded-xl font-bold text-gray-900"
            >
              <option value="annual">إجازة سنوية اعتيادية (+30 أو +45 يوم)</option>
              <option value="emergency">إجازة طارئة (+6 أيام)</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-gray-800 mb-1">عدد الأيام المضافة *</label>
            <input
              type="number"
              min="1"
              max="60"
              value={amountToAdd}
              onChange={(e) => setAmountToAdd(Number(e.target.value))}
              className="w-full p-2 bg-gray-50 border border-gray-300 rounded-xl font-mono font-bold text-red-950"
            />
          </div>

          <div>
            <label className="block font-bold text-gray-800 mb-1">السنة المالية *</label>
            <input
              type="text"
              value={targetYear}
              onChange={(e) => setTargetYear(e.target.value)}
              className="w-full p-2 bg-gray-50 border border-gray-300 rounded-xl font-mono font-bold text-gray-900"
            />
          </div>

          <div>
            <label className="block font-bold text-gray-800 mb-1">بيان وملاحظات الإجراء</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-2 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 font-bold"
            />
          </div>

        </div>

        {/* Selection Toolbar */}
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
              placeholder="تصفية بالاسم أو الرقم الوظيفي..."
              className="p-1.5 bg-gray-50 border border-gray-300 rounded-lg text-xs"
            />
          </div>
        </div>
      </div>

      {/* Employees Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-right text-xs">
          <thead className="bg-slate-50 border-b border-gray-200 font-extrabold text-gray-700">
            <tr>
              <th className="py-2.5 px-3 text-center w-10">تحديد</th>
              <th className="py-2.5 px-3">الرقم الوظيفي</th>
              <th className="py-2.5 px-3">اسم الموظف</th>
              <th className="py-2.5 px-3">القسم / الإدارة</th>
              <th className="py-2.5 px-3 text-center">الرصيد السنوي الحالي</th>
              <th className="py-2.5 px-3 text-center">الرصيد الطارئ الحالي</th>
              <th className="py-2.5 px-3 text-center bg-emerald-50 text-emerald-950 font-black">الرصيد بعد الإضافة</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredEmployees.map((emp) => {
              const isSelected = selectedEmpIds.includes(emp.id);
              const currentAnnual = emp.annualLeaveBalance || 0;
              const currentEmergency = emp.emergencyLeaveBalance || 0;
              const afterAdd = leaveTypeAction === 'annual' ? currentAnnual + amountToAdd : currentEmergency + amountToAdd;

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
                  <td className="py-2 px-3 text-center font-mono font-bold">{currentAnnual} يوم</td>
                  <td className="py-2 px-3 text-center font-mono font-bold">{currentEmergency} يوم</td>
                  <td className="py-2 px-3 text-center font-mono font-black text-emerald-900 bg-emerald-50/50">
                    {isSelected ? `${afterAdd} يوم (+${amountToAdd})` : '—'}
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
        onSuccess={handleExecuteBulkLeave}
        title="تأكيد إضافة وتغذية أرصدة الإجازات"
        actionDescription={`أنت على وشك إضافة (+${amountToAdd} يوم) لرصيد الإجازة ${leaveTypeAction === 'annual' ? 'السنوية' : 'الطارئة'} لعدد ${selectedEmpIds.length} موظف. سيتم أخذ نسخة احتياطية تأمينية وتوثيق العملية.`}
        currentUser={currentUser}
      />

    </div>
  );
};
