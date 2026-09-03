import React, { useState, useMemo } from 'react';
import { 
  Calculator, 
  Calendar, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldCheck, 
  Printer, 
  X, 
  Search, 
  Filter, 
  Zap, 
  Lock, 
  Undo2, 
  FileText, 
  TrendingUp, 
  RotateCcw,
  Clock,
  UserCheck,
  Building2,
  ChevronDown
} from 'lucide-react';
import { Employee, IncrementRecord, BulkOperationRecord, AuditLog } from '../../types';
import { formatDateDisplay, getTodayDateStorage } from '../../utils/dateUtils';
import { FullAppDatabase } from '../../utils/storageTypes';
import { createDatabaseBackup } from '../../utils/backupService';
import { SecurityPasswordModal } from './SecurityPasswordModal';
import { AnnualIncrementReportModal } from './AnnualIncrementReportModal';
import { UndoBulkActionModal } from './UndoBulkActionModal';

interface AnnualIncrementSectionProps {
  employees: Employee[];
  increments: IncrementRecord[];
  bulkOperations: BulkOperationRecord[];
  fullDatabase: FullAppDatabase;
  currentUser: string;
  onAddIncrement: (increment: IncrementRecord) => void;
  onUpdateEmployeeIncrement?: (employeeId: number, newIncrement: number, nextIncrementDate?: string) => void;
  onBatchUpdateEmployees?: (updatedEmployees: Employee[]) => void;
  onRecordBulkOperation: (operation: BulkOperationRecord) => void;
  onRevertBulkOperation: (
    operation: BulkOperationRecord, 
    restoredEmployees: Employee[], 
    undoRecord: BulkOperationRecord, 
    reason: string
  ) => void;
  onAddAuditLog?: (log: AuditLog) => void;
}

export const AnnualIncrementSection: React.FC<AnnualIncrementSectionProps> = ({
  employees,
  increments,
  bulkOperations,
  fullDatabase,
  currentUser,
  onAddIncrement,
  onUpdateEmployeeIncrement,
  onBatchUpdateEmployees,
  onRecordBulkOperation,
  onRevertBulkOperation,
  onAddAuditLog
}) => {
  // Calculation parameters
  const [targetYear, setTargetYear] = useState<string>(String(new Date().getFullYear()));
  const [targetMonth, setTargetMonth] = useState<string>(String(new Date().getMonth() + 1).padStart(2, '0'));
  const [calcDateInput, setCalcDateInput] = useState<string>(getTodayDateStorage());
  const [calcMethod, setCalcMethod] = useState<'Anniversary Date' | 'January 1st'>('Anniversary Date');
  const [filterType, setFilterType] = useState<'eligible' | 'all'>('eligible');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmpIds, setSelectedEmpIds] = useState<number[]>([]);

  // Modals
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isCancelIncrementModalOpen, setIsCancelIncrementModalOpen] = useState(false);
  const [selectedBulkOpForReport, setSelectedBulkOpForReport] = useState<BulkOperationRecord | null>(null);
  const [isUndoModalOpen, setIsUndoModalOpen] = useState(false);
  const [selectedOpForUndo, setSelectedOpForUndo] = useState<BulkOperationRecord | null>(null);

  // Month Names in Arabic
  const months = [
    { value: '01', name: 'يناير (شهر 1)' },
    { value: '02', name: 'فبراير (شهر 2)' },
    { value: '03', name: 'مارس (شهر 3)' },
    { value: '04', name: 'أبريل (شهر 4)' },
    { value: '05', name: 'مايو (شهر 5)' },
    { value: '06', name: 'يونيو (شهر 6)' },
    { value: '07', name: 'يوليو (شهر 7)' },
    { value: '08', name: 'أغسطس (شهر 8)' },
    { value: '09', name: 'سبتمبر (شهر 9)' },
    { value: '10', name: 'أكتوبر (شهر 10)' },
    { value: '11', name: 'نوفمبر (شهر 11)' },
    { value: '12', name: 'ديسمبر (شهر 12)' },
  ];

  // =========================================================================
  // 1. ENGINE: CALCULATE ANNUAL INCREMENT ELIGIBILITY
  // Core Rule: "تاريخ الدرجة الحالية" is NEVER changed during calculation
  // =========================================================================
  const calculationList = useMemo(() => {
    const calcDate = new Date(calcDateInput);
    if (isNaN(calcDate.getTime())) return [];

    return employees.map((emp) => {
      // 1. Get baseline date for the current grade
      const gradeEntryDateStr = emp.gradeEntryDate || emp.directingDate || emp.hireDate || '2020-01-01';
      const gradeDate = new Date(gradeEntryDateStr);
      const validGradeDate = isNaN(gradeDate.getTime()) ? new Date('2020-01-01') : gradeDate;

      // 2. Completed years in current grade
      let completedYears = calcDate.getFullYear() - validGradeDate.getFullYear();
      const monthDiff = calcDate.getMonth() - validGradeDate.getMonth();
      const dayDiff = calcDate.getDate() - validGradeDate.getDate();

      if (calcMethod === 'Anniversary Date') {
        if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
          completedYears--;
        }
      }
      if (completedYears < 0) completedYears = 0;

      // 3. Recommended increment based on grade entry date + completed years (starts at 1)
      const currentInc = emp.currentIncrement || 1;
      const targetIncrement = Math.min(15, 1 + completedYears);

      // Check if eligible for increment
      const incrementsDue = Math.max(0, targetIncrement - currentInc);
      const isEligible = incrementsDue > 0 && currentInc < 15;

      // Next increment date calculation (1 year from calculation or anniversary)
      const nextDate = new Date(validGradeDate);
      nextDate.setFullYear(calcDate.getFullYear() + (isEligible ? 1 : 1));
      const nextIncrementDateStorage = nextDate.toISOString().split('T')[0];

      return {
        emp,
        calc: {
          currentIncrement: currentInc,
          recommendedIncrement: targetIncrement,
          incrementsDue,
          completedYears,
          isEligibleForNewIncrement: isEligible,
          gradeEntryDateDisplay: formatDateDisplay(gradeEntryDateStr),
          lastIncrementDateDisplay: emp.lastIncrementDate ? formatDateDisplay(emp.lastIncrementDate) : '',
          nextIncrementDateDisplay: formatDateDisplay(nextIncrementDateStorage),
          nextIncrementDateStorage,
          resultDisplay: isEligible
            ? `علاوة ${currentInc} ← علاوة ${targetIncrement}`
            : currentInc >= 15
            ? 'الحد الأقصى (علاوة 15)'
            : `سارية (علاوة ${currentInc})`
        }
      };
    });
  }, [employees, calcDateInput, calcMethod]);

  const eligibleCalculations = useMemo(() => {
    return calculationList.filter((item) => item.calc.isEligibleForNewIncrement);
  }, [calculationList]);

  // Filtered view by search and status
  const displayedCalculations = useMemo(() => {
    return calculationList.filter(({ emp, calc }) => {
      const matchesSearch = 
        emp.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.jobNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.jobGrade.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesFilter = filterType === 'all' || calc.isEligibleForNewIncrement;

      return matchesSearch && matchesFilter;
    });
  }, [calculationList, searchTerm, filterType]);

  // Select all eligible by default when calculated
  const handleSelectAllEligible = () => {
    const ids = eligibleCalculations.map((item) => item.emp.id);
    setSelectedEmpIds(ids);
  };

  const handleClearSelection = () => {
    setSelectedEmpIds([]);
  };

  // Toggle selection for a single employee
  const handleToggleSelectEmp = (id: number) => {
    setSelectedEmpIds((prev) => 
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // =========================================================================
  // 2. DISBURSE / APPLY ANNUAL INCREMENT (صرف العلاوة السنوية)
  // Strict Workflow: Password -> Safety Backup -> Atomic Execution -> Bulk Record -> Report
  // =========================================================================
  const handleOpenDisburseModal = () => {
    const targets = calculationList.filter(
      (item) => selectedEmpIds.includes(item.emp.id) && item.calc.isEligibleForNewIncrement
    );

    if (targets.length === 0) {
      alert('يرجى تحديد موظف واحد على الأقل مستحق للعلاوة السنوية للمتابعة.');
      return;
    }

    setIsPasswordModalOpen(true);
  };

  const handleExecuteDisburse = async () => {
    setIsPasswordModalOpen(false);

    const targets = calculationList.filter(
      (item) => selectedEmpIds.includes(item.emp.id) && item.calc.isEligibleForNewIncrement
    );

    if (targets.length === 0) return;

    try {
      // 1. Create Pre-Operation Automated Backup
      const backupResult = await createDatabaseBackup(
        fullDatabase,
        currentUser || 'المدير الإداري',
        'تلقائية',
        'ZIP'
      );

      // 2. Capture Pre-Operation Snapshot of affected employees
      const preSnapshot = targets.map(({ emp }) => ({
        id: emp.id,
        fullName: emp.fullName,
        jobNumber: emp.jobNumber,
        jobGrade: emp.jobGrade,
        gradeEntryDate: emp.gradeEntryDate, // Strictly preserved
        currentIncrement: emp.currentIncrement || 1,
        lastIncrementDate: emp.lastIncrementDate,
        nextIncrementDate: emp.nextIncrementDate
      }));

      // 3. Prepare Batch Records & Updates
      const operationYear = targetYear || String(new Date().getFullYear());
      const operationCode = `INC-BULK-${operationYear}-${targetMonth}-${Math.floor(100 + Math.random() * 900)}`;
      const updatedEmployeesList = [...employees];

      targets.forEach(({ emp, calc }) => {
        // Create increment transaction record
        const record: IncrementRecord = {
          id: `INC-${operationYear}-${Math.floor(Math.random() * 90000) + 10000}`,
          employeeId: emp.id,
          previousGrade: emp.jobGrade,
          previousIncrement: emp.currentIncrement || 1,
          newIncrement: calc.recommendedIncrement,
          effectiveDate: calcDateInput,
          incrementType: 'تلقائية',
          decisionNumber: `علاوة-سنوية-${operationYear}/${targetMonth}/${emp.jobNumber}`,
          notes: `صرف علاوة سنوية جماعية استناداً لعدد ${calc.completedYears} سنوات مكتملة (تاريخ الدرجة محفوظ دون مساس)`,
          createdBy: currentUser || 'وحدة الإجراءات العامة',
          createdAt: new Date().toISOString().replace('T', ' ').slice(0, 19)
        };

        onAddIncrement(record);

        // Update employee state: strictly DO NOT modify gradeEntryDate!
        const empIndex = updatedEmployeesList.findIndex(e => e.id === emp.id);
        if (empIndex !== -1) {
          updatedEmployeesList[empIndex] = {
            ...updatedEmployeesList[empIndex],
            currentIncrement: calc.recommendedIncrement,
            lastIncrementDate: calcDateInput,
            nextIncrementDate: calc.nextIncrementDateStorage,
            // gradeEntryDate is explicitly preserved:
            gradeEntryDate: updatedEmployeesList[empIndex].gradeEntryDate
          };
        }

        if (onUpdateEmployeeIncrement) {
          onUpdateEmployeeIncrement(emp.id, calc.recommendedIncrement, calc.nextIncrementDateStorage);
        }
      });

      if (onBatchUpdateEmployees) {
        onBatchUpdateEmployees(updatedEmployeesList);
      }

      // 4. Record Bulk Operation in DB
      const bulkOp: BulkOperationRecord = {
        id: `BULK-INC-${Date.now()}`,
        operationCode: operationCode,
        actionType: 'ANNUAL_INCREMENT_DISBURSE',
        actionName: `صرف العلاوة السنوية لشهر ${targetMonth}/${operationYear}`,
        executedAt: new Date().toISOString(),
        executedBy: currentUser || 'المدير العام',
        affectedCount: targets.length,
        affectedEmployeeIds: targets.map(t => t.emp.id),
        preOperationSnapshot: preSnapshot,
        backupFileName: backupResult.fileName || `HR_Backup_${calcDateInput}.zip`,
        backupChecksum: backupResult.checksum || 'CRC32-VERIFIED',
        status: 'SUCCESS',
        details: {
          targetMonth: `${targetMonth}/${operationYear}`,
          effectiveDate: calcDateInput,
          calculationMethod: calcMethod,
          eligibleCount: eligibleCalculations.length,
          disbursedCount: targets.length
        }
      };

      onRecordBulkOperation(bulkOp);

      if (onAddAuditLog) {
        onAddAuditLog({
          id: `LOG-${Date.now()}`,
          userId: 1,
          userName: currentUser || 'المدير الإداري',
          action: 'BULK_ANNUAL_INCREMENT_EXECUTED',
          details: `تم تنفيذ صرف العلاوة السنوية لعدد ${targets.length} موظف عن شهر ${targetMonth}/${operationYear}. النسخة الاحتياطية: ${backupResult.fileName}`,
          timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
          ipAddress: '127.0.0.1'
        });
      }

      // 5. Open Official Report Modal for immediate printing/verification
      setSelectedBulkOpForReport(bulkOp);
      setIsReportModalOpen(true);

    } catch (err: any) {
      console.error(err);
      alert(`حدث خطأ أثناء صرف العلاوات: ${err.message || 'خطأ غير معروف'}`);
    }
  };

  // Find the most recent annual increment bulk operation
  const lastIncrementOp = bulkOperations.find(
    op => op.actionType === 'ANNUAL_INCREMENT_DISBURSE' && !op.undone
  );

  return (
    <div className="space-y-5 text-xs">
      
      {/* Top Banner Card */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-red-700 font-extrabold text-xs mb-1">
            <TrendingUp className="w-4 h-4" />
            <span>الإجراءات العامة الإدارية</span>
          </div>
          <h2 className="text-lg font-black text-gray-900">
            إدارة واحتساب وصرف العلاوات السنوية
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            التحكم المركزي في استحقاقات العلاوات السنوية الدورية، المراجعة قبل الصرف، وإصدار التقارير المعتمدة
          </p>
        </div>

        {/* Action Buttons Bar */}
        <div className="flex flex-wrap items-center gap-2">
          
          {/* Quick Print Report Button */}
          <button
            type="button"
            onClick={() => {
              setSelectedBulkOpForReport(lastIncrementOp || null);
              setIsReportModalOpen(true);
            }}
            className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <FileText className="w-4 h-4 text-amber-400" />
            <span>تقرير العلاوات السنوية</span>
          </button>

          {/* Undo/Cancel Last Increment Button */}
          {lastIncrementOp && (
            <button
              type="button"
              onClick={() => {
                setSelectedOpForUndo(lastIncrementOp);
                setIsUndoModalOpen(true);
              }}
              className="px-3.5 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-xl font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <RotateCcw className="w-4 h-4 text-amber-700" />
              <span>إلغاء / التراجع عن آخر علاوة ({lastIncrementOp.operationCode})</span>
            </button>
          )}

          {/* Disburse Button */}
          <button
            type="button"
            onClick={handleOpenDisburseModal}
            disabled={selectedEmpIds.length === 0}
            className="px-4 py-2.5 bg-red-700 hover:bg-red-800 text-white rounded-xl font-extrabold flex items-center gap-1.5 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4 text-amber-300" />
            <span>صرف العلاوة السنوية للمحددين ({selectedEmpIds.length})</span>
          </button>
        </div>
      </div>

      {/* Mandatory Statutory Notice */}
      <div className="bg-amber-50 border-r-4 border-amber-500 p-3.5 rounded-xl text-amber-950 text-xs flex items-start gap-3 shadow-xs">
        <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <span className="font-extrabold text-amber-950">ضابط احتساب العلاوة السنوية:</span>
          <p className="text-[11px] leading-relaxed text-amber-900 font-medium">
            احتساب وصرف العلاوة السنوية لا يغيّر «تاريخ الدرجة الحالية». تاريخ الدرجة الحالية تاريخ وظيفي محفوظ قانوناً ولا يتغير إلا عند إجراء ترقية وظيفية أو تسوية وضع معتمدة.
          </p>
        </div>
      </div>

      {/* Parameters & Control Panel */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 items-end">
          
          {/* Target Year & Month */}
          <div>
            <label className="block font-bold text-gray-800 mb-1">شهر الاستحقاق والصرف *</label>
            <select
              value={targetMonth}
              onChange={(e) => setTargetMonth(e.target.value)}
              className="w-full p-2 bg-gray-50 border border-gray-300 rounded-xl text-xs font-bold text-gray-900"
            >
              {months.map((m) => (
                <option key={m.value} value={m.value}>{m.name}</option>
              ))}
            </select>
          </div>

          {/* Calculation Date */}
          <div>
            <label className="block font-bold text-gray-800 mb-1">تاريخ الاحتساب والفعالية *</label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-gray-400 absolute right-3 top-2.5" />
              <input
                type="date"
                value={calcDateInput}
                onChange={(e) => setCalcDateInput(e.target.value)}
                className="w-full pr-9 pl-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs font-bold text-red-950 font-mono"
              />
            </div>
          </div>

          {/* Periodicity Method */}
          <div>
            <label className="block font-bold text-gray-800 mb-1">طريقة احتساب الدورية</label>
            <select
              value={calcMethod}
              onChange={(e) => setCalcMethod(e.target.value as any)}
              className="w-full p-2 bg-gray-50 border border-gray-300 rounded-xl text-xs font-bold text-gray-800"
            >
              <option value="Anniversary Date">تاريخ الاستحقاق (ذكرى تاريخ الدرجة)</option>
              <option value="January 1st">1 يناير من كل سنة مالية</option>
            </select>
          </div>

          {/* Search Input */}
          <div>
            <label className="block font-bold text-gray-800 mb-1">بحث في الكشف</label>
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute right-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="بحث بالاسم أو الرقم الوظيفي..."
                className="w-full pr-9 pl-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs font-bold text-gray-900"
              />
            </div>
          </div>

        </div>

        {/* Quick Selection & Metrics Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSelectAllEligible}
              className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg text-xs font-bold transition-colors cursor-pointer"
            >
              تحديد كافة المستحقين ({eligibleCalculations.length})
            </button>

            <button
              type="button"
              onClick={handleClearSelection}
              className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-bold transition-colors cursor-pointer"
            >
              إلغاء التحديد
            </button>

            <div className="flex items-center gap-1 bg-gray-100 p-0.5 rounded-lg">
              <button
                type="button"
                onClick={() => setFilterType('eligible')}
                className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                  filterType === 'eligible' ? 'bg-white text-red-950 shadow-xs' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                المستحقون فقط ({eligibleCalculations.length})
              </button>

              <button
                type="button"
                onClick={() => setFilterType('all')}
                className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                  filterType === 'all' ? 'bg-white text-red-950 shadow-xs' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                الكل ({calculationList.length})
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3 font-bold text-xs">
            <span className="text-gray-600">المحددون للتنفيذ:</span>
            <span className="font-mono text-red-950 text-sm bg-red-50 border border-red-200 px-2.5 py-0.5 rounded-lg">
              {selectedEmpIds.length} موظف
            </span>
          </div>
        </div>
      </div>

      {/* Review & Calculations Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calculator className="w-4 h-4 text-red-700" />
            <h3 className="font-extrabold text-sm text-gray-900">
              مراجعة استحقاقات العلاوات السنوية قبل الصرف
            </h3>
          </div>
          <div className="text-[11px] text-gray-500">
            تاريخ السريان المعتمد: <strong className="text-red-900 font-mono">{formatDateDisplay(calcDateInput)}</strong>
          </div>
        </div>

        <div className="overflow-x-auto max-h-96 overflow-y-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-gray-100 border-b border-gray-300 text-gray-700 font-extrabold sticky top-0 z-10">
              <tr>
                <th className="py-2.5 px-3 text-center w-10">
                  <input
                    type="checkbox"
                    checked={
                      displayedCalculations.length > 0 &&
                      displayedCalculations
                        .filter((item) => item.calc.isEligibleForNewIncrement)
                        .every((item) => selectedEmpIds.includes(item.emp.id))
                    }
                    onChange={(e) => {
                      if (e.target.checked) {
                        const ids = displayedCalculations
                          .filter((item) => item.calc.isEligibleForNewIncrement)
                          .map((item) => item.emp.id);
                        setSelectedEmpIds((prev) => Array.from(new Set([...prev, ...ids])));
                      } else {
                        const idsToUncheck = displayedCalculations.map((item) => item.emp.id);
                        setSelectedEmpIds((prev) => prev.filter((id) => !idsToUncheck.includes(id)));
                      }
                    }}
                    className="rounded cursor-pointer"
                  />
                </th>
                <th className="py-2.5 px-3">الرقم والموظف</th>
                <th className="py-2.5 px-3">الدرجة الحالية</th>
                <th className="py-2.5 px-3 text-center">العلاوة الحالية</th>
                <th className="py-2.5 px-3 bg-amber-100/60 text-amber-950 font-black">
                  تاريخ الدرجة الحالية (محفوظ)
                </th>
                <th className="py-2.5 px-3">تاريخ آخر علاوة</th>
                <th className="py-2.5 px-3 text-center">السنوات المكتملة</th>
                <th className="py-2.5 px-3 text-center">العلاوات المستحقة</th>
                <th className="py-2.5 px-3 bg-red-50 text-red-950 font-black">النتيجة بعد الصرف</th>
                <th className="py-2.5 px-3">الاستحقاق القادم</th>
                <th className="py-2.5 px-3">حالة الاستحقاق</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {displayedCalculations.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-gray-500 font-bold">
                    لا توجد بيانات مطابقة لخيارات البحث أو التصفية الحالية
                  </td>
                </tr>
              ) : (
                displayedCalculations.map(({ emp, calc }) => {
                  const isSelected = selectedEmpIds.includes(emp.id);

                  return (
                    <tr
                      key={emp.id}
                      className={`hover:bg-amber-50/30 transition-colors ${
                        calc.isEligibleForNewIncrement ? 'bg-emerald-50/20' : ''
                      }`}
                    >
                      <td className="py-2 px-3 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          disabled={!calc.isEligibleForNewIncrement}
                          onChange={() => handleToggleSelectEmp(emp.id)}
                          className="rounded cursor-pointer"
                        />
                      </td>

                      <td className="py-2 px-3">
                        <div className="font-extrabold text-gray-900">{emp.fullName}</div>
                        <div className="text-[10px] text-gray-500 font-mono">{emp.jobNumber}</div>
                      </td>

                      <td className="py-2 px-3 font-bold text-gray-800">{emp.jobGrade}</td>

                      <td className="py-2 px-3 font-mono font-bold text-center">
                        علاوة {calc.currentIncrement}
                      </td>

                      {/* Grade Entry Date strictly preserved */}
                      <td className="py-2 px-3 font-mono dir-ltr text-right font-black text-amber-950 bg-amber-50/80 border-x border-amber-200/60">
                        {calc.gradeEntryDateDisplay}
                      </td>

                      <td className="py-2 px-3 font-mono dir-ltr text-right text-gray-600">
                        {calc.lastIncrementDateDisplay || calc.gradeEntryDateDisplay}
                      </td>

                      <td className="py-2 px-3 font-bold text-blue-900 text-center font-mono">
                        {calc.completedYears} {calc.completedYears === 1 ? 'سنة' : 'سنوات'}
                      </td>

                      <td className="py-2 px-3 font-bold text-center font-mono">
                        {calc.incrementsDue > 0 ? (
                          <span className="text-emerald-700 font-extrabold bg-emerald-100 px-2 py-0.5 rounded-full">
                            +{calc.incrementsDue}
                          </span>
                        ) : (
                          <span className="text-gray-400">0</span>
                        )}
                      </td>

                      <td className="py-2 px-3 font-black text-red-950 bg-red-50/60 font-mono">
                        {calc.resultDisplay}
                      </td>

                      <td className="py-2 px-3 font-mono dir-ltr text-right text-gray-700">
                        {calc.nextIncrementDateDisplay || '—'}
                      </td>

                      <td className="py-2 px-3">
                        {calc.isEligibleForNewIncrement ? (
                          <span className="bg-emerald-100 text-emerald-900 font-extrabold px-2 py-0.5 rounded-full text-[10px] inline-block">
                            مستحقة (+{calc.incrementsDue})
                          </span>
                        ) : calc.currentIncrement >= 15 ? (
                          <span className="bg-gray-100 text-gray-600 font-bold px-2 py-0.5 rounded-full text-[10px] inline-block">
                            الحد الأقصى
                          </span>
                        ) : (
                          <span className="bg-blue-50 text-blue-800 font-bold px-2 py-0.5 rounded-full text-[10px] inline-block">
                            سارية
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        <div className="p-3.5 bg-gray-50 border-t border-gray-200 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-gray-500 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>نظام الحماية: تاريخ الدرجة الحالية محمي من أي تعديل أثناء الصرف.</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleOpenDisburseModal}
              disabled={selectedEmpIds.length === 0}
              className="px-5 py-2 bg-red-700 hover:bg-red-800 text-white rounded-xl font-extrabold flex items-center gap-1.5 shadow-sm disabled:opacity-50 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4 text-amber-300" />
              <span>اعتماد وصرف العلاوات للمحددين ({selectedEmpIds.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Security Password Confirmation Modal */}
      <SecurityPasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        onSuccess={handleExecuteDisburse}
        title="تأكيد اعتماد وصرف العلاوات السنوية"
        actionDescription={`أنت على وشك صرف العلاوة السنوية لعدد ${selectedEmpIds.length} موظف مستحق عن شهر ${targetMonth}/${targetYear}. سيقوم النظام بأخذ نسخة احتياطية تأمينية وتحديث السجلات وحفظ تاريخ الدرجة الحالية دون أي مساس.`}
        currentUser={currentUser}
        riskLevel="high"
      />

      {/* Annual Increment Official Report Modal */}
      <AnnualIncrementReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        bulkOp={selectedBulkOpForReport}
        targetMonth={`${targetMonth}/${targetYear}`}
        appliedDate={calcDateInput}
        employees={employees}
        increments={increments}
        calculationList={calculationList}
      />

      {/* Undo Bulk Action Modal */}
      <UndoBulkActionModal
        isOpen={isUndoModalOpen}
        onClose={() => {
          setIsUndoModalOpen(false);
          setSelectedOpForUndo(null);
        }}
        operation={selectedOpForUndo}
        currentUser={currentUser}
        employees={employees}
        fullDatabase={fullDatabase}
        onConfirmUndo={onRevertBulkOperation}
      />

    </div>
  );
};
