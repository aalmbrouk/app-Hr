import React, { useState, useMemo } from 'react';
import { 
  Employee, 
  EmployeeReviewStatus, 
  CareerPromotionRecord, 
  PromotionRecord, 
  IncrementRecord, 
  StatusSettlementRecord, 
  GeneralProcedure, 
  SecondmentRecord, 
  TransferRecord 
} from '../types';
import { 
  X, 
  CheckCircle2, 
  AlertTriangle, 
  Printer, 
  Save, 
  Edit3, 
  Calendar, 
  FileText, 
  User, 
  Building2, 
  Award, 
  Clock, 
  ShieldCheck, 
  History, 
  ArrowLeftRight,
  ClipboardList,
  Check,
  Briefcase,
  GraduationCap
} from 'lucide-react';
import { formatDateDisplay } from '../utils/dateUtils';
import { DEPARTMENTS, JOBS_BY_DEPT, QUALIFICATIONS, EDUCATIONAL_DEGREES, EDUCATION_TYPES, HIRING_ENTITIES } from '../data/initialData';
import { recalculateCurrentGrade } from '../utils/gradeCalculationEngine';
import { isRegulation418Grade } from '../utils/careerUtils';
import { Sparkles, RefreshCw } from 'lucide-react';

interface EmployeeReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee | null;
  onUpdateEmployee: (updatedEmp: Employee) => void;
  currentUser?: string;
  careerRecords?: CareerPromotionRecord[];
  promotions?: PromotionRecord[];
  increments?: IncrementRecord[];
  settlements?: StatusSettlementRecord[];
  generalProcedures?: GeneralProcedure[];
  secondments?: SecondmentRecord[];
  transfers?: TransferRecord[];
}

export const EmployeeReviewModal: React.FC<EmployeeReviewModalProps> = ({
  isOpen,
  onClose,
  employee,
  onUpdateEmployee,
  currentUser = 'المستخدم الحالي',
  careerRecords = [],
  promotions = [],
  increments = [],
  settlements = [],
  generalProcedures = [],
  secondments = [],
  transfers = []
}) => {
  if (!isOpen || !employee) return null;

  // Review Form State
  const [reviewStatus, setReviewStatus] = useState<EmployeeReviewStatus>(employee.reviewStatus || 'لم تتم المراجعة');
  const [reviewedBy, setReviewedBy] = useState<string>(employee.reviewedBy || currentUser);
  const [reviewDate, setReviewDate] = useState<string>(employee.reviewDate || new Date().toISOString().slice(0, 10));
  const [reviewNotes, setReviewNotes] = useState<string>(employee.reviewNotes || '');

  // Edit Mode state if admin needs to make direct corrections
  const [isEditingData, setIsEditingData] = useState<boolean>(false);
  const [editFormData, setEditFormData] = useState<Employee>({ ...employee });
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Compile full chronological career history for this specific employee
  const fullCareerHistory = useMemo(() => {
    const list: Array<{
      id: string;
      date: string;
      procedureType: string;
      previousGrade: string;
      newGrade: string;
      increments: number | string;
      decisionNumber: string;
      decisionDate: string;
      issuingAuthority: string;
      effectiveDate: string;
      notes: string;
      source: string;
    }> = [];

    const empId = employee.id;
    const fileNum = employee.jobNumber;

    // 1. Initial Appointment
    if (employee.hireDate) {
      list.push({
        id: `init-hire-${empId}`,
        date: employee.hireDate,
        procedureType: 'تعيين أول بمصرف الدم',
        previousGrade: '-',
        newGrade: employee.appointmentGrade || 'الدرجة التعيينية',
        increments: employee.appointmentIncrements ?? 0,
        decisionNumber: 'قرار تعيين أصلي',
        decisionDate: employee.hireDate,
        issuingAuthority: employee.hiringEntity || 'وزارة الصحة',
        effectiveDate: employee.directingDate || employee.hireDate,
        notes: `نظام الدرجة المعين عليها: ${employee.appointmentSalarySystem || 'جدول مرتبات القانون 15'}`,
        source: 'ملف التعيين'
      });
    }

    // 2. Career Promotion Records (including 418 transitions)
    careerRecords
      .filter((c) => c.employeeId === empId || (fileNum && c.fileNumber === fileNum))
      .forEach((c) => {
        list.push({
          id: `career-${c.id}`,
          date: c.actionDate || c.decisionDate || c.createdAt || '',
          procedureType: c.actionType,
          previousGrade: c.previousGrade || '-',
          newGrade: c.newGrade || '-',
          increments: c.newIncrement ?? '-',
          decisionNumber: c.decisionNumber || 'غير محدد',
          decisionDate: c.decisionDate || '-',
          issuingAuthority: c.issuingAuthority || 'مصرف الدم المركزي المرج',
          effectiveDate: c.actionDate || c.decisionDate || '-',
          notes: c.notes || '',
          source: 'سجل المسيرة الوظيفية'
        });
      });

    // 3. Promotion Records
    promotions
      .filter((p) => p.employeeId === empId || (fileNum && p.fileNumber === fileNum))
      .forEach((p) => {
        list.push({
          id: `promo-${p.id}`,
          date: p.effectiveDate || p.decisionDate || p.createdAt || '',
          procedureType: p.promotionType || 'ترقية عادية',
          previousGrade: p.previousGrade || '-',
          newGrade: p.newGrade || '-',
          increments: p.newIncrement ?? 0,
          decisionNumber: p.decisionNumber || '-',
          decisionDate: p.decisionDate || '-',
          issuingAuthority: 'الشؤون الإدارية / وزارة الصحة',
          effectiveDate: p.effectiveDate || '-',
          notes: `${p.reason ? p.reason + ' - ' : ''}${p.notes || ''}`,
          source: 'سجل الترقيات'
        });
      });

    // 4. Increment Records
    increments
      .filter((i) => i.employeeId === empId || (fileNum && i.fileNumber === fileNum))
      .forEach((i) => {
        list.push({
          id: `inc-${i.id}`,
          date: i.effectiveDate || i.date || i.createdAt || '',
          procedureType: i.incrementType || 'علاوة سنوية دورية',
          previousGrade: i.previousGrade || employee.jobGrade,
          newGrade: i.newGrade || employee.jobGrade,
          increments: i.newIncrement ?? 1,
          decisionNumber: i.decisionNumber || 'استحقاق دوري',
          decisionDate: i.decisionDate || i.effectiveDate || '-',
          issuingAuthority: 'مصرف الدم المركزي بالمرج',
          effectiveDate: i.effectiveDate || '-',
          notes: i.notes || '',
          source: 'سجل العلاوات'
        });
      });

    // 5. Status Settlements
    settlements
      .filter((s) => s.employeeId === empId)
      .forEach((s) => {
        list.push({
          id: `set-${s.id}`,
          date: s.effectiveDate || s.createdAt || '',
          procedureType: 'تسوية وضع وظيفي / مالي',
          previousGrade: employee.jobGrade,
          newGrade: s.grade || employee.jobGrade,
          increments: '-',
          decisionNumber: s.decisionNumber || '-',
          decisionDate: s.effectiveDate || '-',
          issuingAuthority: 'لجنة تسوية الأوضاع',
          effectiveDate: s.effectiveDate || '-',
          notes: `${s.reason ? s.reason + ' - ' : ''}${s.notes || ''}`,
          source: 'سجل التسويات'
        });
      });

    // 6. General Procedures
    generalProcedures
      .filter((g) => g.employeeId === empId || (fileNum && g.fileNumber === fileNum))
      .forEach((g) => {
        list.push({
          id: `gp-${g.id}`,
          date: g.effectiveDate || g.procedureDate || g.createdAt || '',
          procedureType: g.procedureType || 'إجراء وظيفي عام',
          previousGrade: '-',
          newGrade: '-',
          increments: '-',
          decisionNumber: g.procedureNumber || '-',
          decisionDate: g.procedureDate || '-',
          issuingAuthority: g.decisionAuthority || 'إدارة مصرف الدم',
          effectiveDate: g.effectiveDate || '-',
          notes: `${g.description ? g.description + ' - ' : ''}${g.notes || ''}`,
          source: 'الإجراءات العامة'
        });
      });

    // 7. Secondments
    secondments
      .filter((sec) => sec.employeeId === empId)
      .forEach((sec) => {
        list.push({
          id: `sec-${sec.id}`,
          date: sec.startDate || sec.createdAt || '',
          procedureType: `ندب خارجي: ${sec.assignedEntity}`,
          previousGrade: employee.jobGrade,
          newGrade: employee.jobGrade,
          increments: '-',
          decisionNumber: sec.decisionNumber || '-',
          decisionDate: sec.decisionDate || '-',
          issuingAuthority: 'وزارة الصحة',
          effectiveDate: `${sec.startDate} إلى ${sec.endDate}`,
          notes: `${sec.reason ? sec.reason + ' - ' : ''}${sec.notes || ''}`,
          source: 'سجل الندب'
        });
      });

    // 8. Transfers
    transfers
      .filter((t) => t.employeeId === empId)
      .forEach((t) => {
        list.push({
          id: `trans-${t.id}`,
          date: t.effectiveDate || t.createdAt || '',
          procedureType: `نقل: ${t.transferType || 'نقل'} (${t.previousDepartment} ➔ ${t.newDepartment})`,
          previousGrade: '-',
          newGrade: '-',
          increments: '-',
          decisionNumber: t.decisionNumber || '-',
          decisionDate: t.decisionDate || '-',
          issuingAuthority: 'إدارة الموارد البشرية',
          effectiveDate: t.effectiveDate || '-',
          notes: `${t.reason ? t.reason + ' - ' : ''}${t.notes || ''}`,
          source: 'سجل النقل'
        });
      });

    // Sort chronologically ascending
    return list.sort((a, b) => (a.date || '').localeCompare(b.date || ''));
  }, [employee, careerRecords, promotions, increments, settlements, generalProcedures, secondments, transfers]);

  // Compute chronological grade calculation on the fly
  const chronoAudit = useMemo(() => {
    return recalculateCurrentGrade(
      employee,
      careerRecords,
      promotions,
      increments,
      settlements,
      generalProcedures
    );
  }, [employee, careerRecords, promotions, increments, settlements, generalProcedures]);

  // Handle applying calculated grade directly to employee
  const handleApplyCalculatedGrade = () => {
    const updated = {
      ...chronoAudit.updatedEmployee,
      reviewStatus: chronoAudit.result.recommendedReviewStatus,
      reviewedBy: currentUser,
      reviewDate: new Date().toISOString().slice(0, 10),
      reviewNotes: `تم اعتماد الدرجة الحالية المحسوبة زمنياً: ${chronoAudit.result.calculatedJobGrade} بناءً على حركة (${chronoAudit.result.evidenceRecordDesc})`,
      updatedAt: new Date().toISOString()
    };
    onUpdateEmployee(updated);
    setEditFormData({ ...updated });
    setReviewStatus(chronoAudit.result.recommendedReviewStatus);
    setReviewNotes(updated.reviewNotes);
    setSaveSuccessMsg(`تم تحديث الدرجة الحالية للموظف إلى "${chronoAudit.result.calculatedJobGrade}" بنجاح.`);
    setTimeout(() => setSaveSuccessMsg(null), 3500);
  };

  // Handle Save Review
  const handleSaveReview = () => {
    const updated: Employee = {
      ...(isEditingData ? editFormData : employee),
      reviewStatus,
      reviewedBy,
      reviewDate,
      reviewNotes,
      updatedAt: new Date().toISOString()
    };

    onUpdateEmployee(updated);
    setSaveSuccessMsg('تم حفظ وتوثيق مراجعة بيانات الموظف بنجاح.');
    setIsEditingData(false);
    setTimeout(() => setSaveSuccessMsg(null), 3500);
  };

  // Handle Direct Print
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150">
        
        {/* MODAL HEADER */}
        <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-600/90 text-white flex items-center justify-center font-black text-lg shadow-inner">
              {employee.jobNumber || employee.id}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-white tracking-tight">
                  مراجعة وتدقيق بيانات الموظف: {employee.fullName}
                </h2>
                <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                  reviewStatus === 'تمت المراجعة' 
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : reviewStatus === 'تحتاج إلى تصحيح'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'bg-slate-700 text-slate-300 border border-slate-600'
                }`}>
                  {reviewStatus}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                الرقم الوظيفي / رقم الملف: <span className="text-amber-400 font-bold">{employee.jobNumber}</span> — الرقم الوطني: <span className="text-white font-mono">{employee.nationalId || employee.passportNumber || 'غير مسجل'}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer"
              title="طباعة استمارة المراجعة الرسمية"
            >
              <Printer className="w-4 h-4 text-slate-300" />
              <span>طباعة الاستمارة</span>
            </button>
            
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* NOTIFICATION MESSAGE */}
        {saveSuccessMsg && (
          <div className="bg-emerald-50 border-b border-emerald-200 px-5 py-2.5 flex items-center justify-between text-emerald-800 text-xs font-bold shrink-0 animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{saveSuccessMsg}</span>
            </div>
            <button onClick={() => setSaveSuccessMsg(null)} className="text-emerald-600 hover:text-emerald-900">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* MODAL BODY */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50/50">

          {/* 1. EMPLOYEE COMPLETE INFORMATION SECTION */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-2xs overflow-hidden">
            <div className="bg-slate-100/90 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-slate-700" />
                <h3 className="text-sm font-black text-slate-900">1. البيانات الشخصية والوظيفية الكاملة للموظف</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsEditingData(!isEditingData)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  isEditingData 
                    ? 'bg-amber-100 text-amber-800 border border-amber-300' 
                    : 'bg-white text-slate-700 border border-gray-300 hover:bg-slate-50'
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>{isEditingData ? 'إلغاء التعديل' : 'تعديل البيانات'}</span>
              </button>
            </div>

            <div className="p-4 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3.5 text-xs">
              
              {/* Field 1: Job Number */}
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200/80">
                <span className="text-[11px] font-bold text-slate-500 block">الرقم الوظيفي / رقم الملف:</span>
                {isEditingData ? (
                  <input
                    type="text"
                    value={editFormData.jobNumber}
                    onChange={(e) => setEditFormData({ ...editFormData, jobNumber: e.target.value })}
                    className="w-full mt-1 px-2 py-1 bg-white border border-gray-300 rounded font-bold text-xs"
                  />
                ) : (
                  <span className="text-sm font-black text-slate-900 font-mono mt-0.5 block">{employee.jobNumber || '-'}</span>
                )}
              </div>

              {/* Field 2: Full Name */}
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200/80 md:col-span-2">
                <span className="text-[11px] font-bold text-slate-500 block">اسم الموظف الرباعي:</span>
                {isEditingData ? (
                  <input
                    type="text"
                    value={editFormData.fullName}
                    onChange={(e) => setEditFormData({ ...editFormData, fullName: e.target.value })}
                    className="w-full mt-1 px-2 py-1 bg-white border border-gray-300 rounded font-bold text-xs"
                  />
                ) : (
                  <span className="text-sm font-black text-red-950 mt-0.5 block">{employee.fullName}</span>
                )}
              </div>

              {/* Field 3: National ID / Passport */}
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200/80">
                <span className="text-[11px] font-bold text-slate-500 block">الرقم الوطني / جواز السفر:</span>
                {isEditingData ? (
                  <input
                    type="text"
                    value={editFormData.nationalId || editFormData.passportNumber || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, nationalId: e.target.value })}
                    className="w-full mt-1 px-2 py-1 bg-white border border-gray-300 rounded font-bold text-xs font-mono"
                  />
                ) : (
                  <span className="text-xs font-bold text-slate-900 font-mono mt-0.5 block">
                    {employee.nationalId || employee.passportNumber || 'غير متوفر'} ({employee.nationality || 'ليبي'})
                  </span>
                )}
              </div>

              {/* Field 4: Mother's Name */}
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200/80">
                <span className="text-[11px] font-bold text-slate-500 block">اسم الأم:</span>
                {isEditingData ? (
                  <input
                    type="text"
                    value={editFormData.motherName}
                    onChange={(e) => setEditFormData({ ...editFormData, motherName: e.target.value })}
                    className="w-full mt-1 px-2 py-1 bg-white border border-gray-300 rounded font-bold text-xs"
                  />
                ) : (
                  <span className="text-xs font-semibold text-slate-800 mt-0.5 block">{employee.motherName || '-'}</span>
                )}
              </div>

              {/* Field 5: Date of Birth */}
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200/80">
                <span className="text-[11px] font-bold text-slate-500 block">تاريخ الميلاد:</span>
                {isEditingData ? (
                  <input
                    type="date"
                    value={editFormData.birthDate}
                    onChange={(e) => setEditFormData({ ...editFormData, birthDate: e.target.value })}
                    className="w-full mt-1 px-2 py-1 bg-white border border-gray-300 rounded font-bold text-xs"
                  />
                ) : (
                  <span className="text-xs font-semibold text-slate-800 mt-0.5 block">{formatDateDisplay(employee.birthDate)}</span>
                )}
              </div>

              {/* Field 6: Place of Birth */}
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200/80">
                <span className="text-[11px] font-bold text-slate-500 block">مكان الميلاد:</span>
                {isEditingData ? (
                  <input
                    type="text"
                    value={editFormData.birthPlace}
                    onChange={(e) => setEditFormData({ ...editFormData, birthPlace: e.target.value })}
                    className="w-full mt-1 px-2 py-1 bg-white border border-gray-300 rounded font-bold text-xs"
                  />
                ) : (
                  <span className="text-xs font-semibold text-slate-800 mt-0.5 block">{employee.birthPlace || '-'}</span>
                )}
              </div>

              {/* Field 7: Employment Status */}
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200/80">
                <span className="text-[11px] font-bold text-slate-500 block">الوضع الوظيفي:</span>
                <span className="text-xs font-bold text-emerald-700 mt-0.5 block">{employee.status}</span>
              </div>

              {/* Field 8: Appointment Date */}
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200/80">
                <span className="text-[11px] font-bold text-slate-500 block">تاريخ التعيين:</span>
                <span className="text-xs font-semibold text-slate-800 mt-0.5 block">{formatDateDisplay(employee.hireDate)}</span>
              </div>

              {/* Field 9: Start Date */}
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200/80">
                <span className="text-[11px] font-bold text-slate-500 block">تاريخ المباشرة:</span>
                <span className="text-xs font-semibold text-slate-800 mt-0.5 block">{formatDateDisplay(employee.directingDate)}</span>
              </div>

              {/* Field 10: Blood Bank Start Date */}
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200/80">
                <span className="text-[11px] font-bold text-slate-500 block">المباشرة بمصرف الدم:</span>
                <span className="text-xs font-bold text-red-700 mt-0.5 block">{formatDateDisplay(employee.bloodBankStartDate || employee.directingDate)}</span>
              </div>

              {/* Field 11: Appointment Grade & System */}
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200/80">
                <span className="text-[11px] font-bold text-slate-500 block">الدرجة المعين عليها:</span>
                <span className="text-xs font-bold text-slate-900 mt-0.5 block">{employee.appointmentGrade || '-'}</span>
                <span className="text-[10px] text-slate-500 block">{employee.appointmentSalarySystem || 'قانون 15'}</span>
              </div>

              {/* Field 12: Current Grade & Salary Scale */}
              <div className="p-2.5 bg-blue-50/50 rounded-lg border border-blue-200/80">
                <span className="text-[11px] font-bold text-blue-700 block">الدرجة الحالية وجدول المرتبات:</span>
                <span className="text-xs font-black text-blue-950 mt-0.5 block">{employee.jobGrade} ({employee.salaryScale})</span>
              </div>

              {/* Field 13: Number of Increments */}
              <div className="p-2.5 bg-blue-50/50 rounded-lg border border-blue-200/80">
                <span className="text-[11px] font-bold text-blue-700 block">عدد العلاوات:</span>
                <span className="text-xs font-black text-blue-950 mt-0.5 block">{employee.currentIncrement ?? 0} علاوات</span>
              </div>

              {/* Field 14: Current Grade Date */}
              <div className="p-2.5 bg-blue-50/50 rounded-lg border border-blue-200/80">
                <span className="text-[11px] font-bold text-blue-700 block">تاريخ الدرجة الحالية:</span>
                <span className="text-xs font-bold text-blue-950 mt-0.5 block">{formatDateDisplay(employee.gradeEntryDate)}</span>
              </div>

              {/* Field 15: Last Increment Date */}
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200/80">
                <span className="text-[11px] font-bold text-slate-500 block">تاريخ آخر علاوة / استحقاق:</span>
                <span className="text-xs font-semibold text-slate-800 mt-0.5 block">{formatDateDisplay(employee.lastIncrementDate || employee.eligibilityDate)}</span>
              </div>

              {/* Field 16: Qualification & Degree */}
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200/80">
                <span className="text-[11px] font-bold text-slate-500 block">المؤهل العلمي:</span>
                <span className="text-xs font-bold text-slate-900 mt-0.5 block">{employee.qualification || '-'}</span>
              </div>

              {/* Field 17: Specialization */}
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200/80">
                <span className="text-[11px] font-bold text-slate-500 block">التخصص الدقيق:</span>
                <span className="text-xs font-semibold text-slate-800 mt-0.5 block">{employee.specialization || '-'}</span>
              </div>

              {/* Field 18 & 19 & 20: University, Year, Education Type */}
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200/80">
                <span className="text-[11px] font-bold text-slate-500 block">الجامعة وسنة التخرج:</span>
                <span className="text-xs font-semibold text-slate-800 mt-0.5 block">
                  {employee.university || 'الجامعة'} {employee.graduationYear ? `(${employee.graduationYear})` : ''} - {employee.educationType || 'جامعة عامة'}
                </span>
              </div>

              {/* Field 21: Department */}
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200/80">
                <span className="text-[11px] font-bold text-slate-500 block">القسم / الإدارة:</span>
                <span className="text-xs font-bold text-slate-900 mt-0.5 block">{employee.department}</span>
              </div>

              {/* Field 22: Job Title */}
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200/80">
                <span className="text-[11px] font-bold text-slate-500 block">المسمى الوظيفي:</span>
                <span className="text-xs font-bold text-slate-900 mt-0.5 block">{employee.jobTitle}</span>
              </div>

              {/* Field 23: Classification */}
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200/80">
                <span className="text-[11px] font-bold text-slate-500 block">التصنيف الوظيفي:</span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded inline-block mt-0.5 ${
                  employee.assignmentCategory === 'طبي' ? 'bg-red-100 text-red-800' : 'bg-slate-200 text-slate-800'
                }`}>
                  كادر {employee.assignmentCategory}
                </span>
              </div>

              {/* Field 24: Appointment Authority */}
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200/80">
                <span className="text-[11px] font-bold text-slate-500 block">جهة التعيين:</span>
                <span className="text-xs font-semibold text-slate-800 mt-0.5 block">{employee.hiringEntity || 'وزارة الصحة'}</span>
              </div>

              {/* Field 25: Authority transferred from */}
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200/80">
                <span className="text-[11px] font-bold text-slate-500 block">الجهة المنقول منها / إليها:</span>
                <span className="text-xs font-semibold text-slate-800 mt-0.5 block">{employee.transferredTo || 'تعيين مباشر بالمصرف'}</span>
              </div>

              {/* Field 26: Establishment / Cadre Number */}
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200/80">
                <span className="text-[11px] font-bold text-slate-500 block">رقم الملاك الوظيفي:</span>
                <span className="text-xs font-mono font-bold text-slate-900 mt-0.5 block">{employee.cadreNumber || '-'}</span>
              </div>

              {/* Field 27: Notes */}
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200/80 md:col-span-3 lg:col-span-4">
                <span className="text-[11px] font-bold text-slate-500 block">الملاحظات العامة:</span>
                <span className="text-xs text-slate-700 mt-0.5 block">{employee.notes || 'لا توجد ملاحظات إضافية'}</span>
              </div>

            </div>
          </div>

          {/* CHRONOLOGICAL GRADE AUDIT & 418 TRANSITION BANNER */}
          <div className={`rounded-xl border p-4 shadow-2xs space-y-3 ${
            chronoAudit.result.isChanged
              ? 'bg-teal-50/70 border-teal-300'
              : chronoAudit.result.hasHistorical418
              ? 'bg-blue-50/70 border-blue-200'
              : 'bg-slate-100/60 border-slate-200'
          }`}>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white shrink-0 ${
                  chronoAudit.result.isChanged ? 'bg-teal-600' : 'bg-slate-700'
                }`}>
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-900 flex items-center gap-2">
                    <span>التدقيق الزمني للدرجة الحالية (Chronological State Engine)</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      chronoAudit.result.regulationCategory === 'مختلط / انتقال 2023'
                        ? 'bg-purple-100 text-purple-800'
                        : chronoAudit.result.regulationCategory === 'اللائحة 418 (تاريخي)'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-slate-200 text-slate-800'
                    }`}>
                      {chronoAudit.result.regulationCategory}
                    </span>
                  </h4>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    الدرجة المحسوبة وفق أحدث إجراء زمني: <span className="font-bold text-slate-900">{chronoAudit.result.calculatedJobGrade}</span> ({chronoAudit.result.calculatedIncrement} علاوة) — تاريخ النفاذ: <span className="font-bold text-slate-900">{formatDateDisplay(chronoAudit.result.calculatedGradeEntryDate)}</span>
                  </p>
                </div>
              </div>

              {chronoAudit.result.isChanged && (
                <button
                  type="button"
                  onClick={handleApplyCalculatedGrade}
                  className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-black flex items-center gap-1.5 shadow-xs transition-colors shrink-0 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>اعتماد الدرجة المحسوبة وتحديث السجل</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] bg-white/80 p-2.5 rounded-lg border border-slate-200/70">
              <div>
                <span className="text-slate-500 font-bold block">مستند الإثبات:</span>
                <span className="font-bold text-slate-800">{chronoAudit.result.evidenceRecordDesc}</span>
              </div>
              <div>
                <span className="text-slate-500 font-bold block">الدرجة المسجلة الحالية:</span>
                <span className={`font-bold ${chronoAudit.result.isGradeChanged ? 'text-red-700 line-through' : 'text-slate-800'}`}>
                  {chronoAudit.result.oldJobGrade} ({chronoAudit.result.oldCurrentIncrement} علاوة)
                </span>
              </div>
              <div>
                <span className="text-slate-500 font-bold block">حالة التدقيق المقترحة:</span>
                <span className={`font-bold ${
                  chronoAudit.result.recommendedReviewStatus === 'تمت المراجعة' ? 'text-emerald-700' : 'text-amber-700'
                }`}>
                  {chronoAudit.result.recommendedReviewStatus} {chronoAudit.result.anomalyReason ? `(${chronoAudit.result.anomalyReason})` : ''}
                </span>
              </div>
            </div>
          </div>

          {/* 2. COMPLETE CHRONOLOGICAL CAREER RECORD REVIEW */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-2xs overflow-hidden">
            <div className="bg-slate-100/90 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-slate-700" />
                <h3 className="text-sm font-black text-slate-900">
                  2. السجل والمسيرة الوظيفية الكاملة (Career History) — {fullCareerHistory.length} إجراء موثق
                </h3>
              </div>
              <span className="text-xs text-slate-500 font-medium">مرتبة تصاعدياً من تاريخ التعيين حتى اليوم</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-gray-200 text-slate-700 font-bold">
                    <th className="py-2.5 px-3">#</th>
                    <th className="py-2.5 px-3">نوع الإجراء الوظيفي</th>
                    <th className="py-2.5 px-3">الدرجة السابقة</th>
                    <th className="py-2.5 px-3">الدرجة الجديدة</th>
                    <th className="py-2.5 px-3">العلاوات</th>
                    <th className="py-2.5 px-3">رقم وتاريخ القرار</th>
                    <th className="py-2.5 px-3">الجهة المصدرة</th>
                    <th className="py-2.5 px-3">تاريخ النفاذ</th>
                    <th className="py-2.5 px-3">ملاحظات الإجراء</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {fullCareerHistory.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-slate-400 font-medium">
                        لا توجد حركات مسجلة إضافية بخلاف بيانات التعيين الأساسية
                      </td>
                    </tr>
                  ) : (
                    fullCareerHistory.map((item, idx) => (
                      <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-400">{idx + 1}</td>
                        <td className="py-2.5 px-3 font-bold text-slate-900">
                          <span className={`px-2 py-0.5 rounded text-[11px] inline-block ${
                            item.procedureType.includes('تعيين')
                              ? 'bg-blue-100 text-blue-800'
                              : item.procedureType.includes('ترقية')
                              ? 'bg-emerald-100 text-emerald-800'
                              : item.procedureType.includes('تسوية')
                              ? 'bg-purple-100 text-purple-800'
                              : item.procedureType.includes('علاوة')
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {item.procedureType}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-600">
                          <span>{item.previousGrade}</span>
                          {isRegulation418Grade(item.previousGrade) && (
                            <span className="mr-1 text-[9px] font-bold px-1.5 py-0.2 bg-amber-100 text-amber-800 rounded">لائحة 418</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 font-bold text-blue-900">
                          <span>{item.newGrade}</span>
                          {isRegulation418Grade(item.newGrade) && (
                            <span className="mr-1 text-[9px] font-bold px-1.5 py-0.2 bg-amber-100 text-amber-800 rounded">لائحة 418</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-800">{item.increments}</td>
                        <td className="py-2.5 px-3 text-slate-700">
                          <span className="font-bold">{item.decisionNumber}</span>
                          {item.decisionDate && item.decisionDate !== '-' && (
                            <span className="text-[11px] text-slate-500 block">{formatDateDisplay(item.decisionDate)}</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600">{item.issuingAuthority}</td>
                        <td className="py-2.5 px-3 font-semibold text-slate-900">{formatDateDisplay(item.effectiveDate)}</td>
                        <td className="py-2.5 px-3 text-slate-600 max-w-xs truncate" title={item.notes}>
                          {item.notes || '-'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* 3. REVIEW STATUS & AUDIT SECTION */}
          <div className="bg-white rounded-xl border-2 border-slate-300 shadow-sm p-4 sm:p-5 space-y-4">
            <div className="flex items-center gap-2 border-b border-gray-200 pb-2.5">
              <ShieldCheck className="w-5 h-5 text-red-600" />
              <h3 className="text-sm font-black text-slate-900">3. توثيق حالة المراجعة الإدارية والتدقيق</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              
              {/* Review Status Selector */}
              <div>
                <label className="block text-slate-700 font-bold mb-1.5">
                  حالة المراجعة: <span className="text-red-500">*</span>
                </label>
                <select
                  value={reviewStatus}
                  onChange={(e) => setReviewStatus(e.target.value as EmployeeReviewStatus)}
                  className="w-full px-3 py-2 bg-slate-50 border border-gray-300 rounded-lg font-bold text-slate-900 focus:ring-2 focus:ring-red-600 outline-none"
                >
                  <option value="لم تتم المراجعة">لم تتم المراجعة</option>
                  <option value="تمت المراجعة">تمت المراجعة والاعتماد</option>
                  <option value="تحتاج إلى تصحيح">تحتاج إلى تصحيح بيانات</option>
                </select>
              </div>

              {/* Reviewer Name */}
              <div>
                <label className="block text-slate-700 font-bold mb-1.5">
                  اسم المسؤول القائم بالمراجعة:
                </label>
                <input
                  type="text"
                  value={reviewedBy}
                  onChange={(e) => setReviewedBy(e.target.value)}
                  placeholder="اسم المراجع..."
                  className="w-full px-3 py-2 bg-slate-50 border border-gray-300 rounded-lg font-medium text-slate-900 focus:ring-2 focus:ring-red-600 outline-none"
                />
              </div>

              {/* Review Date */}
              <div>
                <label className="block text-slate-700 font-bold mb-1.5">
                  تاريخ المراجعة:
                </label>
                <input
                  type="date"
                  value={reviewDate}
                  onChange={(e) => setReviewDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-gray-300 rounded-lg font-medium text-slate-900 focus:ring-2 focus:ring-red-600 outline-none"
                />
              </div>

              {/* Review Notes */}
              <div className="sm:col-span-3">
                <label className="block text-slate-700 font-bold mb-1.5">
                  ملاحظات المراجعة وتوصيات التدقيق:
                </label>
                <textarea
                  rows={3}
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="اكتب هنا أي ملاحظات أو فوارق تم رصدها بين السجل الوظيفي والبيانات الحالية..."
                  className="w-full px-3 py-2 bg-slate-50 border border-gray-300 rounded-lg text-xs font-medium text-slate-900 focus:ring-2 focus:ring-red-600 outline-none"
                />
              </div>

            </div>
          </div>

        </div>

        {/* MODAL FOOTER */}
        <div className="bg-slate-100 px-5 py-3.5 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-500">
            * حفظ المراجعة يوثق السجل ولا يغير البيانات الشخصية ما لم يتم تعديلها صراحة من قبلك.
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white hover:bg-gray-50 text-slate-700 font-bold rounded-lg border border-gray-300 text-xs transition-colors cursor-pointer"
            >
              إلغاء
            </button>

            <button
              type="button"
              onClick={handleSaveReview}
              className="flex items-center gap-1.5 px-5 py-2 bg-red-700 hover:bg-red-800 text-white font-bold rounded-lg text-xs shadow-sm transition-colors cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>حفظ وتوثيق المراجعة</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
