import React, { useState, useEffect, useMemo } from 'react';
import { Employee, LeaveTransaction, LeaveModification, HrRule, PublicHoliday } from '../types';
import { calculateLeaveSummary } from '../utils/hrCalculations';
import { 
  calculateLeaveDatesFromWorkingDays, 
  calculateWorkingDaysBetween, 
  normalizeDateStorage, 
  formatDateDisplay, 
  DEFAULT_PUBLIC_HOLIDAYS 
} from '../utils/dateUtils';
import { OfficialLeavePrintModal } from './OfficialLeavePrintModal';
import { 
  X, 
  Save, 
  Printer, 
  Eye, 
  Calendar, 
  ShieldCheck, 
  Calculator, 
  AlertCircle, 
  History, 
  PlusCircle, 
  FileCheck,
  Building2,
  Clock
} from 'lucide-react';

interface LeaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  employees: Employee[];
  initialEmpId?: number;
  existingLeaveToModify?: LeaveTransaction | null;
  leaves: LeaveTransaction[];
  rules: HrRule[];
  publicHolidaysList?: PublicHoliday[];
  officialLogoUrl?: string;
  onAddLeave: (leave: LeaveTransaction) => void;
  onUpdateLeave?: (leave: LeaveTransaction) => void;
  currentUser?: string;
}

export const LeaveModal: React.FC<LeaveModalProps> = ({
  isOpen,
  onClose,
  employees,
  initialEmpId,
  existingLeaveToModify,
  leaves,
  rules,
  publicHolidaysList = [],
  officialLogoUrl,
  onAddLeave,
  onUpdateLeave,
  currentUser = 'الشؤون الإدارية'
}) => {
  // Active Tab Mode: 'new' (New Leave) or 'modification' (Extend / Reduce / Interrupt / Correct)
  const [activeTabMode, setActiveTabMode] = useState<'new' | 'modification'>(
    existingLeaveToModify ? 'modification' : 'new'
  );

  // Unsaved Changes Tracking Flag
  const [isDirty, setIsDirty] = useState(false);
  const [showUnsavedPrompt, setShowUnsavedPrompt] = useState(false);

  // Review / Print Preview Modal State
  const [previewLeave, setPreviewLeave] = useState<LeaveTransaction | null>(null);

  // Active Public Holiday String Array (YYYY-MM-DD)
  const activeHolidayStrings = useMemo(() => {
    if (publicHolidaysList && publicHolidaysList.length > 0) {
      return publicHolidaysList.filter(h => h.active).map(h => normalizeDateStorage(h.date));
    }
    return DEFAULT_PUBLIC_HOLIDAYS;
  }, [publicHolidaysList]);

  // ----------------------------------------------------
  // FORM STATE FOR NEW LEAVE
  // ----------------------------------------------------
  const [empId, setEmpId] = useState<number>(
    existingLeaveToModify ? existingLeaveToModify.employeeId : (initialEmpId || employees[0]?.id || 1001)
  );
  const [leaveType, setLeaveType] = useState<LeaveTransaction['leaveType']>(
    existingLeaveToModify ? existingLeaveToModify.leaveType : 'إجازة سنوية'
  );
  const [startDate, setStartDate] = useState<string>(
    existingLeaveToModify ? normalizeDateStorage(existingLeaveToModify.startDate) : '2026-08-11'
  );
  const [numberOfDays, setNumberOfDays] = useState<number>(
    existingLeaveToModify ? existingLeaveToModify.numberOfDays : 18
  );

  // Calculation Method ('تلقائي' or 'يدوي')
  const [calcMethod, setCalcMethod] = useState<'تلقائي' | 'يدوي'>(
    existingLeaveToModify?.calculationMethod || 'تلقائي'
  );
  const [manualEndDate, setManualEndDate] = useState<string>('');
  const [manualReturnDate, setManualReturnDate] = useState<string>('');
  const [manualReason, setManualReason] = useState<string>(
    existingLeaveToModify?.manualReason || ''
  );

  // Deducts check
  const [deducts, setDeducts] = useState<boolean>(
    existingLeaveToModify ? existingLeaveToModify.deductsFromAnnualLeave : true
  );

  // Review fields
  const [reviewStatus, setReviewStatus] = useState<'تمت المراجعة والتدقيق' | 'قيد المراجعة'>(
    existingLeaveToModify?.reviewStatus || 'تمت المراجعة والتدقيق'
  );
  const [reviewerName, setReviewerName] = useState<string>(
    existingLeaveToModify?.reviewerName || currentUser
  );
  const [reviewNotes, setReviewNotes] = useState<string>(
    existingLeaveToModify?.reviewNotes || 'مستوفية لكافة الشروط وضوابط رصيد الإجازات'
  );
  const [notes, setNotes] = useState<string>(existingLeaveToModify?.notes || '');

  // ----------------------------------------------------
  // FORM STATE FOR MODIFICATION / EXTENSION / INTERRUPTION
  // ----------------------------------------------------
  const [selectedLeaveIdToModify, setSelectedLeaveIdToModify] = useState<string>(
    existingLeaveToModify ? existingLeaveToModify.id : (leaves[0]?.id || '')
  );
  const [modificationType, setModificationType] = useState<'تمديد' | 'تقليص' | 'قطع إجازة' | 'تعديل / تصحيح'>('تمديد');
  const [additionalDaysCount, setAdditionalDaysCount] = useState<number>(5);
  const [modificationReason, setModificationReason] = useState<string>('');

  // Selected Employee object
  const targetEmp = useMemo(() => {
    return employees.find((e) => e.id === Number(empId)) || employees[0];
  }, [employees, empId]);

  // Employee Leave Summary
  const empLeaveSummary = useMemo(() => {
    return targetEmp ? calculateLeaveSummary(targetEmp, leaves, rules) : null;
  }, [targetEmp, leaves, rules]);

  // Auto-Update Deducts based on Leave Type
  useEffect(() => {
    if (leaveType === 'إجازة الوضع والأمومة' || leaveType === 'إجازة مرضية') {
      setDeducts(false);
    } else if (leaveType === 'إجازة سنوية' || leaveType === 'إجازة طارئة') {
      setDeducts(true);
    }
  }, [leaveType]);

  // ----------------------------------------------------
  // AUTOMATIC CALCULATION ENGINE
  // ----------------------------------------------------
  const autoCalculatedDates = useMemo(() => {
    return calculateLeaveDatesFromWorkingDays(startDate, numberOfDays, activeHolidayStrings);
  }, [startDate, numberOfDays, activeHolidayStrings]);

  const finalEndDate = useMemo(() => {
    if (calcMethod === 'يدوي' && manualEndDate) {
      return normalizeDateStorage(manualEndDate);
    }
    return autoCalculatedDates.endDateStorage;
  }, [calcMethod, manualEndDate, autoCalculatedDates]);

  const finalReturnDate = useMemo(() => {
    if (calcMethod === 'يدوي' && manualReturnDate) {
      return normalizeDateStorage(manualReturnDate);
    }
    return autoCalculatedDates.returnDateStorage;
  }, [calcMethod, manualReturnDate, autoCalculatedDates]);

  // Selected Target Leave for Modification
  const targetLeaveForModification = useMemo(() => {
    return leaves.find((l) => l.id === selectedLeaveIdToModify) || existingLeaveToModify || leaves[0];
  }, [leaves, selectedLeaveIdToModify, existingLeaveToModify]);

  // Calculated Modification Preview
  const modificationCalculationPreview = useMemo(() => {
    if (!targetLeaveForModification) return null;
    const origDays = targetLeaveForModification.numberOfDays;
    const origStart = targetLeaveForModification.startDate;

    let newDays = origDays;
    if (modificationType === 'تمديد') {
      newDays = origDays + Number(additionalDaysCount || 0);
    } else if (modificationType === 'تقليص' || modificationType === 'قطع إجازة') {
      newDays = Math.max(1, Number(additionalDaysCount || 1));
    }

    const calcResult = calculateLeaveDatesFromWorkingDays(origStart, newDays, activeHolidayStrings);

    return {
      originalDays: origDays,
      originalEndDate: targetLeaveForModification.endDate,
      originalReturnDate: targetLeaveForModification.returnDate || '',
      newDays,
      newEndDate: calcResult.endDateStorage,
      newReturnDate: calcResult.returnDateStorage
    };
  }, [targetLeaveForModification, modificationType, additionalDaysCount, activeHolidayStrings]);

  // Mark form dirty on input changes
  const handleInputChange = (setter: any, value: any) => {
    setter(value);
    setIsDirty(true);
  };

  // ----------------------------------------------------
  // RECORD BUILDER & VALIDATOR
  // ----------------------------------------------------
  const validateAndBuildLeaveRecord = (): LeaveTransaction | null => {
    if (!targetEmp) {
      alert('يرجى اختيار الموظف المعني بالطلب');
      return null;
    }

    if (activeTabMode === 'new') {
      if (!startDate) {
        alert('يرجى اختيار تاريخ بداية الإجازة');
        return null;
      }
      if (numberOfDays <= 0) {
        alert('يرجى تحديد عدد أيام الإجازة بشكل صحيح (أكبر من 0)');
        return null;
      }
      if (calcMethod === 'يدوي' && !manualReason.trim()) {
        alert('تنبيه هام: يجب كتابة سبب وتبرير الحساب اليدوي للإجازة عند اختيار خيار الحساب اليدوي');
        return null;
      }

      const balanceBefore = empLeaveSummary ? empLeaveSummary.remainingDays : 30;
      const balanceAfter = deducts ? Math.max(0, balanceBefore - numberOfDays) : balanceBefore;

      const newLeaveRecord: LeaveTransaction = {
        id: `LEV-${new Date().getFullYear()}-${String(leaves.length + 1).padStart(3, '0')}`,
        employeeId: targetEmp.id,
        leaveType,
        startDate: normalizeDateStorage(startDate),
        endDate: finalEndDate,
        returnDate: finalReturnDate,
        numberOfDays,
        leaveYear: new Date(startDate).getFullYear() || 2026,
        status: 'مقبولة',
        deductsFromAnnualLeave: deducts,
        calculationMethod: calcMethod,
        manualReason: calcMethod === 'يدوي' ? manualReason : undefined,
        reviewStatus,
        reviewerName,
        reviewNotes,
        balanceBefore,
        balanceAfter,
        notes,
        createdBy: currentUser,
        createdAt: new Date().toISOString().replace('T', ' ').slice(0, 19)
      };

      return newLeaveRecord;
    } else {
      // Modification Mode
      if (!targetLeaveForModification) {
        alert('يرجى اختيار الإجازة المراد تمديدها أو قطعها');
        return null;
      }
      if (!modificationReason.trim()) {
        alert('يرجى كتابة سبب التمديد / القطع / التعديل الإداري');
        return null;
      }
      if (!modificationCalculationPreview) return null;

      const newMod: LeaveModification = {
        id: `MOD-${Date.now()}`,
        leaveId: targetLeaveForModification.id,
        modificationType,
        originalStartDate: targetLeaveForModification.startDate,
        originalNumberOfDays: targetLeaveForModification.numberOfDays,
        originalEndDate: targetLeaveForModification.endDate,
        originalReturnDate: targetLeaveForModification.returnDate || '',
        newNumberOfDays: modificationCalculationPreview.newDays,
        newEndDate: modificationCalculationPreview.newEndDate,
        newReturnDate: modificationCalculationPreview.newReturnDate,
        reason: modificationReason,
        modifiedBy: currentUser,
        modifiedAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
        notes: `تم الإجراء بطلب رسمياً - ${modificationType}`
      };

      const updatedLeaveRecord: LeaveTransaction = {
        ...targetLeaveForModification,
        numberOfDays: modificationCalculationPreview.newDays,
        endDate: modificationCalculationPreview.newEndDate,
        returnDate: modificationCalculationPreview.newReturnDate,
        modifications: [
          ...(targetLeaveForModification.modifications || []),
          newMod
        ]
      };

      return updatedLeaveRecord;
    }
  };

  // Button Action: [💾 حفظ]
  const handleSave = () => {
    const record = validateAndBuildLeaveRecord();
    if (!record) return;

    if (activeTabMode === 'new') {
      onAddLeave(record);
    } else if (onUpdateLeave) {
      onUpdateLeave(record);
    } else {
      onAddLeave(record);
    }

    setIsDirty(false);
    onClose();
  };

  // Button Action: [👁 مراجعة]
  const handleReview = () => {
    const record = validateAndBuildLeaveRecord();
    if (!record) return;
    setPreviewLeave(record);
  };

  // Button Action: [🖨 طباعة]
  const handlePrint = () => {
    const record = validateAndBuildLeaveRecord();
    if (!record) return;

    if (activeTabMode === 'new') {
      onAddLeave(record);
    } else if (onUpdateLeave) {
      onUpdateLeave(record);
    }

    setIsDirty(false);
    setPreviewLeave(record);

    setTimeout(() => {
      window.print();
    }, 200);
  };

  // Button Action: [✕ إغلاق]
  const handleClose = () => {
    if (isDirty) {
      setShowUnsavedPrompt(true);
    } else {
      setIsDirty(false);
      setShowUnsavedPrompt(false);
      onClose();
    }
  };

  // Smooth Escape key handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (previewLeave) {
          setPreviewLeave(null);
        } else if (showUnsavedPrompt) {
          setShowUnsavedPrompt(false);
        } else {
          handleClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [previewLeave, showUnsavedPrompt, isDirty]);

  if (!isOpen) return null;

  return (
    <>
      <div 
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            handleClose();
          }
        }}
        className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 overflow-y-auto font-sans text-right"
      >
        <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full p-6 border border-gray-300 text-xs space-y-4 my-8 relative">
          
          {/* Header */}
          <div className="flex justify-between items-center border-b pb-3">
            <div className="flex items-center gap-2 text-red-900 font-black text-sm">
              <Calendar className="w-5 h-5 text-red-700" />
              <span>طلب {leaveType || 'إجازة رسمية'} — مصرف الدم المركزي المرج</span>
            </div>

            <button
              onClick={handleClose}
              type="button"
              className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Mode Switcher: New Leave vs Extend/Modify Existing Leave */}
          <div className="flex items-center gap-2 bg-gray-100 p-1.5 rounded-xl border border-gray-200">
            <button
              type="button"
              onClick={() => setActiveTabMode('new')}
              className={`flex-1 py-2 rounded-lg font-bold flex items-center justify-center gap-2 transition-all ${
                activeTabMode === 'new'
                  ? 'bg-red-800 text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-200'
              }`}
            >
              <PlusCircle className="w-4 h-4" />
              <span>تسجيل إجازة رسمية جديدة</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTabMode('modification')}
              className={`flex-1 py-2 rounded-lg font-bold flex items-center justify-center gap-2 transition-all ${
                activeTabMode === 'modification'
                  ? 'bg-amber-700 text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-200'
              }`}
            >
              <History className="w-4 h-4" />
              <span>تمديد / قطع / تعديل إجازة سابقة (سجل التعديلات)</span>
            </button>
          </div>

          {/* ------------------- NEW LEAVE TAB ------------------- */}
          {activeTabMode === 'new' && (
            <div className="space-y-4">
              
              {/* Employee Selection */}
              <div className="grid grid-cols-2 gap-3 bg-gray-50 p-3.5 rounded-xl border border-gray-200">
                <div>
                  <label className="block font-bold text-gray-800 mb-1">الموظف المعني بالإجازة *</label>
                  <select
                    value={empId}
                    onChange={(e) => handleInputChange(setEmpId, Number(e.target.value))}
                    className="w-full p-2.5 border border-gray-300 rounded-xl font-bold bg-white focus:ring-2 focus:ring-red-600 outline-none text-xs"
                  >
                    {employees.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.fullName} (الرقم الوظيفي: {e.jobNumber}) - {e.department}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-gray-800 mb-1">نوع الإجازة *</label>
                  <select
                    value={leaveType}
                    onChange={(e) => handleInputChange(setLeaveType, e.target.value as any)}
                    className="w-full p-2.5 border border-gray-300 rounded-xl font-bold bg-white focus:ring-2 focus:ring-red-600 outline-none text-xs text-red-900"
                  >
                    <option value="إجازة سنوية">إجازة سنوية (اعتيادية)</option>
                    <option value="إجازة طارئة">إجازة طارئة</option>
                    <option value="إجازة الوضع والأمومة">إجازة الوضع والأمومة (غير مخصومة)</option>
                    <option value="إجازة مرضية">إجازة مرضية (غير مخصومة)</option>
                    <option value="إجازة حج">إجازة حج</option>
                    <option value="إجازة بدون مرتب">إجازة بدون مرتب</option>
                    <option value="أخرى">إجازة أخرى</option>
                  </select>
                </div>

                {/* Employee Info Box */}
                {targetEmp && (
                  <div className="col-span-2 bg-white p-2.5 rounded-lg border border-gray-200 grid grid-cols-4 gap-2 text-[11px]">
                    <div>الرقم الوظيفي: <strong className="text-red-900 font-mono font-bold">{targetEmp.jobNumber}</strong></div>
                    <div>الرقم الوطني: <strong className="font-mono">{targetEmp.nationalId}</strong></div>
                    <div>القسم: <strong>{targetEmp.department}</strong></div>
                    <div>الرصيد المتبقي: <strong className="text-emerald-700">{empLeaveSummary?.remainingDays || 30} يوم</strong></div>
                  </div>
                )}
              </div>

              {/* Leave Dates & Engine Calculation Section */}
              <div className="bg-red-50/40 p-4 rounded-xl border border-red-200 space-y-3">
                <div className="flex justify-between items-center border-b border-red-200 pb-2">
                  <span className="font-extrabold text-red-900 flex items-center gap-1.5">
                    <Calculator className="w-4 h-4 text-red-700" />
                    حساب فترة الإجازة وتاريخ المباشرة التلقائي
                  </span>

                  {/* Calculation Mode Switcher */}
                  <div className="flex items-center bg-white p-1 rounded-lg border border-gray-300 text-[11px] font-bold">
                    <button
                      type="button"
                      onClick={() => handleInputChange(setCalcMethod, 'تلقائي')}
                      className={`px-3 py-1 rounded-md transition-all ${
                        calcMethod === 'تلقائي'
                          ? 'bg-red-700 text-white shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      حساب تلقائي (خصم الجمعة والسبت والعطلات)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleInputChange(setCalcMethod, 'يدوي')}
                      className={`px-3 py-1 rounded-md transition-all ${
                        calcMethod === 'يدوي'
                          ? 'bg-amber-700 text-white shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      حساب يدوي
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 items-end">
                  <div>
                    <label className="block font-bold text-gray-800 mb-1">تاريخ بداية الإجازة *</label>
                    <input
                      type="date"
                      required
                      value={startDate}
                      onChange={(e) => handleInputChange(setStartDate, e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-lg font-mono bg-white font-bold text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-gray-800 mb-1">عدد أيام الإجازة *</label>
                    <input
                      type="number"
                      min={1}
                      required
                      value={numberOfDays}
                      onChange={(e) => handleInputChange(setNumberOfDays, Math.max(1, Number(e.target.value)))}
                      className="w-full p-2 border border-red-400 rounded-lg font-black text-red-900 bg-white text-sm"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-gray-800 mb-1">طريقة الاحتساب الحالية</label>
                    <div className="p-2 bg-white border border-gray-300 rounded-lg font-bold text-gray-800 text-[11px]">
                      {calcMethod === 'تلقائي' ? 'استبعاد الجمعة/السبت والعطلات' : 'حساب يدوي استثنائي'}
                    </div>
                  </div>
                </div>

                {/* Display Calculated Dates */}
                <div className="bg-white p-3 rounded-lg border border-red-200 grid grid-cols-2 gap-3 text-xs">
                  <div className="flex justify-between items-center border-l pl-2">
                    <span className="text-gray-600 font-bold">تاريخ نهاية الإجازة المحسوب:</span>
                    <span className="font-mono font-black text-red-900 bg-red-50 px-2 py-0.5 rounded">
                      {formatDateDisplay(finalEndDate)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 font-bold">تاريخ العودة والمباشرة للعمل:</span>
                    <span className="font-mono font-black text-blue-900 bg-blue-50 px-2 py-0.5 rounded">
                      {formatDateDisplay(finalReturnDate)}
                    </span>
                  </div>
                </div>

                {/* Manual Reason Box if Manual Selected */}
                {calcMethod === 'يدوي' && (
                  <div className="bg-amber-50 p-3 rounded-lg border border-amber-300 space-y-1">
                    <label className="block font-extrabold text-amber-900 text-xs">
                      سبب وتبرير الحساب اليدوي للإجازة (إجباري) *
                    </label>
                    <input
                      type="text"
                      required
                      value={manualReason}
                      onChange={(e) => handleInputChange(setManualReason, e.target.value)}
                      placeholder="اكتب التبرير الإداري أو القرار القانوني المعتمد..."
                      className="w-full p-2 border border-amber-400 rounded-lg text-xs bg-white text-amber-950 font-bold outline-none"
                    />
                  </div>
                )}
              </div>

              {/* Deducts Checkbox & Reviewer Details */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-gray-900 block text-xs">الخصم من الرصيد السنوي</span>
                    <span className="text-[10px] text-gray-500">خصم من الرصيد الاعتيادي للموظف</span>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer bg-white px-3 py-1.5 rounded-lg border border-gray-300">
                    <input
                      type="checkbox"
                      checked={deducts}
                      onChange={(e) => handleInputChange(setDeducts, e.target.checked)}
                      className="w-4 h-4 accent-red-700"
                    />
                    <span className="font-bold text-xs">{deducts ? 'نعم (خصم)' : 'لا (استثناء)'}</span>
                  </label>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">المراجع / الشؤون الإدارية</label>
                  <input
                    type="text"
                    value={reviewerName}
                    onChange={(e) => handleInputChange(setReviewerName, e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg text-xs font-bold"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block font-bold text-gray-700 mb-1">ملاحظات إضافية (تظهر في الاستمارة الرسمية)</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => handleInputChange(setNotes, e.target.value)}
                  placeholder="أي ملاحظات رسمية إضافية..."
                  className="w-full p-2 border border-gray-300 rounded-lg text-xs"
                />
              </div>

            </div>
          )}

          {/* ------------------- EXTENSION / MODIFICATION TAB ------------------- */}
          {activeTabMode === 'modification' && (
            <div className="space-y-4">
              <div className="bg-amber-50 p-3.5 rounded-xl border border-amber-200 text-amber-950 text-xs space-y-3">
                <div className="font-extrabold text-amber-900 flex items-center gap-1.5 border-b border-amber-200 pb-2">
                  <History className="w-4 h-4 text-amber-700" />
                  <span>تمديد / تقليص / قطع إجازة مسجلة مسبقاً (سجل عدم المساس بالبيانات الأصلية)</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-amber-900 mb-1">اختر الإجازة المراد إجراء التغيير عليها *</label>
                    <select
                      value={selectedLeaveIdToModify}
                      onChange={(e) => setSelectedLeaveIdToModify(e.target.value)}
                      className="w-full p-2.5 border border-amber-300 rounded-xl font-bold bg-white text-xs text-amber-950 outline-none"
                    >
                      {leaves.map((l) => {
                        const emp = employees.find((e) => e.id === l.employeeId);
                        return (
                          <option key={l.id} value={l.id}>
                            {l.id} — {emp?.fullName} ({l.leaveType}: {l.numberOfDays} يوم من {formatDateDisplay(l.startDate)})
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-amber-900 mb-1">نوع الإجراء المعتمد *</label>
                    <select
                      value={modificationType}
                      onChange={(e) => setModificationType(e.target.value as any)}
                      className="w-full p-2.5 border border-amber-300 rounded-xl font-bold bg-white text-xs text-amber-950 outline-none"
                    >
                      <option value="تمديد">تمديد الإجازة (إضافة أيام)</option>
                      <option value="تقليص">تقليص الإجازة (إنقاص أيام)</option>
                      <option value="قطع إجازة">قطع الإجازة والمباشرة المبكرة</option>
                      <option value="تعديل / تصحيح">تعديل / تصحيح إداري</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 items-end">
                  <div>
                    <label className="block font-bold text-amber-900 mb-1">
                      {modificationType === 'تمديد' ? 'عدد الأيام المضافة للطلب *' : 'عدد الأيام المعدلة الإجمالية *'}
                    </label>
                    <input
                      type="number"
                      min={1}
                      required
                      value={additionalDaysCount}
                      onChange={(e) => setAdditionalDaysCount(Math.max(1, Number(e.target.value)))}
                      className="w-full p-2 border border-amber-400 rounded-lg font-black text-amber-900 bg-white text-sm"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-amber-900 mb-1">سبب التعديل / التمديد الإداري *</label>
                    <input
                      type="text"
                      required
                      value={modificationReason}
                      onChange={(e) => setModificationReason(e.target.value)}
                      placeholder="اكتب التبرير الإداري أو ظروف التمديد والقطع..."
                      className="w-full p-2 border border-amber-400 rounded-lg text-xs bg-white text-amber-950 font-bold"
                    />
                  </div>
                </div>

                {/* Modification Result Preview */}
                {modificationCalculationPreview && (
                  <div className="bg-white p-3 rounded-lg border border-amber-300 space-y-1.5 text-xs text-amber-950">
                    <div className="font-extrabold text-amber-900 border-b border-amber-100 pb-1">
                      معاينة احتساب التغيير الجديد:
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-[11px]">
                      <div>الأيام الأصلية: <strong className="font-mono">{modificationCalculationPreview.originalDays} يوم</strong></div>
                      <div>الأيام الجديدة: <strong className="font-mono text-red-900">{modificationCalculationPreview.newDays} يوم</strong></div>
                      <div>تاريخ العودة الجديد: <strong className="font-mono text-blue-900">{formatDateDisplay(modificationCalculationPreview.newReturnDate)}</strong></div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ------------------- FOUR LARGE ACTION BUTTONS ------------------- */}
          <div className="flex flex-wrap justify-between items-center pt-4 border-t border-gray-200 gap-2">
            
            {/* Close Button [✕ إغلاق] */}
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-extrabold rounded-xl border border-gray-300 flex items-center gap-1.5 transition-colors text-xs"
            >
              <X className="w-4 h-4 text-gray-500" />
              <span>✕ إغلاق</span>
            </button>

            <div className="flex items-center gap-2">
              {/* Review Button [👁 مراجعة] */}
              <button
                type="button"
                onClick={handleReview}
                className="px-4 py-2.5 bg-blue-700 hover:bg-blue-800 text-white font-extrabold rounded-xl flex items-center gap-1.5 shadow-sm transition-colors text-xs"
              >
                <Eye className="w-4 h-4" />
                <span>👁 مراجعة الاستمارة (PRINT_LEAVE_FORM)</span>
              </button>

              {/* Print Button [🖨 طباعة] */}
              <button
                type="button"
                onClick={handlePrint}
                className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-extrabold rounded-xl flex items-center gap-1.5 shadow-sm transition-colors text-xs"
              >
                <Printer className="w-4 h-4" />
                <span>🖨 طباعة الاستمارة الرسمية</span>
              </button>

              {/* Save Button [💾 حفظ] */}
              <button
                type="button"
                onClick={handleSave}
                className="px-5 py-2.5 bg-red-800 hover:bg-red-900 text-white font-black rounded-xl flex items-center gap-1.5 shadow-md transition-colors text-xs"
              >
                <Save className="w-4 h-4" />
                <span>💾 حفظ واعتماد الطلب</span>
              </button>
            </div>

          </div>

        </div>
      </div>

      {/* Unsaved Changes Warning Dialog */}
      {showUnsavedPrompt && (
        <div className="fixed inset-0 bg-black/80 z-60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4 text-right shadow-2xl border border-red-200">
            <div className="flex items-center gap-2 text-red-800 font-bold text-sm">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <span>تنبيه تعديلات غير محفوظة</span>
            </div>
            <p className="text-xs text-gray-700 font-bold">
              توجد تعديلات غير محفوظة، هل تريد حفظها قبل الإغلاق؟
            </p>

            <div className="flex justify-between items-center pt-2 border-t gap-2 text-xs">
              <button
                onClick={() => setShowUnsavedPrompt(false)}
                className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg font-bold"
              >
                إلغاء
              </button>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setIsDirty(false);
                    setShowUnsavedPrompt(false);
                    onClose();
                  }}
                  className="px-3 py-2 bg-gray-200 text-gray-800 rounded-lg font-bold hover:bg-gray-300 cursor-pointer"
                >
                  إغلاق بدون حفظ
                </button>

                <button
                  onClick={() => {
                    setShowUnsavedPrompt(false);
                    handleSave();
                  }}
                  className="px-4 py-2 bg-red-700 text-white rounded-lg font-bold hover:bg-red-800"
                >
                  حفظ وإغلاق
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Full A4 Print Preview Modal (`PRINT_LEAVE_FORM`) */}
      {previewLeave && (
        <OfficialLeavePrintModal
          leave={previewLeave}
          employee={employees.find(e => e.id === previewLeave.employeeId)}
          officialLogoUrl={officialLogoUrl}
          onClose={() => setPreviewLeave(null)}
        />
      )}
    </>
  );
};
