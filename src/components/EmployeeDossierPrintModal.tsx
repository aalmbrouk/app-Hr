import React, { useState, useEffect } from 'react';
import { 
  Employee, 
  LeaveTransaction, 
  IncrementRecord, 
  PromotionRecord, 
  StatusSettlementRecord, 
  GeneralProcedure,
  CareerPromotionRecord,
  EmployeeQualificationRecord,
  TransferRecord,
  SecondmentRecord,
  DisciplinaryRecord,
  ResignationRecord,
  AnnualPerformanceEvaluation
} from '../types';
import { formatDateDisplay } from '../utils/dateUtils';
import { calculateEmployeeIncrementBreakdown } from '../utils/incrementUtils';
import { getEmployeeCareerHistory } from '../utils/careerUtils';
import { exportElementToPdf } from '../utils/pdfExport';
import { 
  X, 
  Printer, 
  FileDown, 
  Loader2, 
  CheckCircle2, 
  User, 
  Award, 
  Briefcase, 
  GraduationCap, 
  Calendar, 
  FileText, 
  ShieldAlert,
  Building2
} from 'lucide-react';

interface EmployeeDossierPrintModalProps {
  employee: Employee | null;
  leaves?: LeaveTransaction[];
  increments?: IncrementRecord[];
  promotions?: PromotionRecord[];
  settlements?: StatusSettlementRecord[];
  generalProcedures?: GeneralProcedure[];
  careerRecords?: CareerPromotionRecord[];
  qualifications?: EmployeeQualificationRecord[];
  evaluations?: AnnualPerformanceEvaluation[];
  transfers?: TransferRecord[];
  secondments?: SecondmentRecord[];
  disciplinary?: DisciplinaryRecord[];
  resignations?: ResignationRecord[];
  isOpen: boolean;
  onClose: () => void;
  generalManagerName?: string;
  officialLogoUrl?: string;
}

export const EmployeeDossierPrintModal: React.FC<EmployeeDossierPrintModalProps> = ({
  employee,
  leaves = [],
  increments = [],
  promotions = [],
  settlements = [],
  generalProcedures = [],
  careerRecords = [],
  qualifications = [],
  evaluations = [],
  transfers = [],
  secondments = [],
  disciplinary = [],
  resignations = [],
  isOpen,
  onClose,
  generalManagerName = 'نجيب صالح سالم',
  officialLogoUrl
}) => {
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !employee) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleExportPdf = async () => {
    setIsExportingPdf(true);
    setExportSuccess(false);

    const safeName = (employee.fullName || 'موظف').replace(/\s+/g, '_');
    const filename = `ملف_الموظف_${employee.jobNumber || employee.id}_${safeName}`;

    try {
      const success = await exportElementToPdf('EMPLOYEE_DOSSIER_PRINT_DOCUMENT', filename, {
        orientation: 'portrait',
        scale: 2,
        margin: 10
      });

      if (success) {
        setExportSuccess(true);
        setTimeout(() => setExportSuccess(false), 3000);
      }
    } catch (err) {
      console.error('Failed to export employee dossier:', err);
    } finally {
      setIsExportingPdf(false);
    }
  };

  // Filter records for this employee
  const empLeaves = (leaves || []).filter((l) => l.employeeId === employee.id);
  const empQuals = (qualifications || []).filter((q) => q.employeeId === employee.id);
  const empEvals = (evaluations || []).filter((e) => e.employeeId === employee.id).sort((a, b) => b.evaluationYear - a.evaluationYear);
  const empDisciplinary = (disciplinary || []).filter((d) => d.employeeId === employee.id);
  
  const careerHistory = getEmployeeCareerHistory(
    employee.id,
    careerRecords,
    promotions,
    increments,
    settlements
  );

  const breakdown = calculateEmployeeIncrementBreakdown(
    employee,
    increments,
    promotions,
    settlements,
    generalProcedures
  );

  const isLibyan = employee.nationality === 'ليبي' || !employee.nationality;

  // Leave balance calculations
  const totalLeaveDaysUsed = empLeaves.reduce((sum, l) => sum + (l.daysCount || 0), 0);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto" dir="rtl">
      <div className="bg-white text-gray-900 rounded-2xl shadow-2xl max-w-4xl w-full my-auto border border-gray-300 flex flex-col max-h-[96vh] overflow-hidden">
        
        {/* Top Control Bar (Screen only) */}
        <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0 print:hidden">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="text-sm font-bold text-white">
                معاينة طباعة ملف الموظف الشامل (نموذج A4 رسمي)
              </h3>
              <p className="text-xs text-slate-400">
                {employee.fullName} - الرقم الوظيفي: {employee.jobNumber}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {exportSuccess && (
              <span className="text-emerald-400 text-xs font-bold flex items-center gap-1 bg-emerald-950/80 border border-emerald-800 px-2.5 py-1 rounded-lg animate-fadeIn">
                <CheckCircle2 className="w-4 h-4" />
                تم التصدير بنجاح
              </span>
            )}

            <button
              type="button"
              disabled={isExportingPdf}
              onClick={handleExportPdf}
              className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 border border-slate-700 disabled:opacity-50 cursor-pointer"
            >
              {isExportingPdf ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileDown className="w-3.5 h-3.5 text-blue-400" />}
              <span>تصدير PDF</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-1.5 bg-red-700 hover:bg-red-600 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>طباعة المستند</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
              title="إغلاق النافذة"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Printable Sheet Container */}
        <div className="p-4 sm:p-8 overflow-y-auto bg-slate-100/60 flex justify-center scrollbar-thin">
          <div 
            id="EMPLOYEE_DOSSIER_PRINT_DOCUMENT"
            className="w-full max-w-[210mm] bg-white border border-gray-300 p-8 sm:p-10 shadow-lg text-gray-900 font-sans space-y-6 print:m-0 print:border-none print:shadow-none print:p-6"
            style={{ minHeight: '297mm' }}
          >
            {/* 1. Official Header */}
            <div className="border-b-2 border-slate-900 pb-4">
              <div className="flex items-center justify-between">
                <div className="text-right space-y-1 text-xs font-bold text-gray-800">
                  <p>دولة ليبيا</p>
                  <p>حكومة الوحدة الوطنية</p>
                  <p>وزارة الصحة</p>
                  <p className="text-red-900 font-black">مصرف الدم المركزي المرج</p>
                  <p className="text-[11px] text-gray-600">إدارة الشؤون الإدارية والمالية - قسم الملفات</p>
                </div>

                <div className="text-center">
                  {officialLogoUrl ? (
                    <img src={officialLogoUrl} alt="Logo" className="w-16 h-16 object-contain mx-auto" />
                  ) : (
                    <div className="w-16 h-16 rounded-full border-2 border-red-900 flex items-center justify-center bg-red-50 text-red-900 font-bold text-xs mx-auto">
                      مصرف الدم
                    </div>
                  )}
                  <p className="text-[10px] font-black text-slate-900 mt-1">بطاقة السيرة الوظيفية</p>
                </div>

                <div className="text-left space-y-1 text-xs font-mono font-semibold text-gray-800">
                  <p>رقم الملف: <strong className="text-red-900">{employee.jobNumber}</strong></p>
                  <p>التاريخ: {formatDateDisplay(new Date().toISOString())}</p>
                  <p>الرقم الداخلي: #{employee.id}</p>
                </div>
              </div>

              <div className="mt-3 text-center bg-slate-900 text-white py-1.5 rounded font-black text-sm tracking-wide">
                ملف السيرة الوظيفية الشامل للموظف
              </div>
            </div>

            {/* 2. Top Summary Box */}
            <div className="grid grid-cols-3 gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg text-xs">
              <div className="col-span-2 space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-gray-500 w-24">اسم الموظف:</span>
                  <span className="font-black text-sm text-gray-900">{employee.fullName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-gray-500 w-24">الرقم الوطني / الوثيقة:</span>
                  <span className="font-mono font-bold text-gray-800">{isLibyan ? (employee.nationalId || '-') : (employee.passportNumber || employee.nationalId || '-')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-gray-500 w-24">القسم والوظيفة:</span>
                  <span className="font-semibold text-gray-800">{employee.department} - {employee.jobTitle}</span>
                </div>
              </div>

              <div className="border-r border-gray-300 pr-3 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-gray-500">الحالة الوظيفية:</span>
                  <span className="font-black text-emerald-900">{employee.status}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-gray-500">الدرجة الحالية:</span>
                  <span className="font-black text-red-900">{employee.jobGrade} (+{employee.currentIncrement || 1})</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-gray-500">جهة التعيين:</span>
                  <span className="font-semibold text-gray-800 truncate max-w-[120px]">{employee.hiringEntity || 'وزارة الصحة'}</span>
                </div>
              </div>
            </div>

            {/* 3. Personal Information Table */}
            <div className="space-y-2">
              <h4 className="text-xs font-black text-slate-900 border-r-4 border-red-900 pr-2 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-red-900" />
                <span>أولاً: البيانات الشخصية الأساسية</span>
              </h4>
              
              <table className="w-full text-right text-xs border border-gray-300">
                <tbody className="divide-y divide-gray-200">
                  <tr className="bg-gray-50">
                    <td className="p-2 font-bold text-gray-600 w-1/4 border-l border-gray-300">الجنسية:</td>
                    <td className="p-2 font-semibold text-gray-900 w-1/4">{employee.nationality || 'ليبي'}</td>
                    <td className="p-2 font-bold text-gray-600 w-1/4 border-r border-l border-gray-300">اسم الأم:</td>
                    <td className="p-2 font-semibold text-gray-900 w-1/4">{employee.motherName || '—'}</td>
                  </tr>
                  <tr>
                    <td className="p-2 font-bold text-gray-600 border-l border-gray-300">تاريخ الميلاد:</td>
                    <td className="p-2 font-mono font-semibold text-gray-900">{formatDateDisplay(employee.birthDate) || '—'}</td>
                    <td className="p-2 font-bold text-gray-600 border-r border-l border-gray-300">مكان الميلاد:</td>
                    <td className="p-2 font-semibold text-gray-900">{employee.birthPlace || '—'}</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="p-2 font-bold text-gray-600 border-l border-gray-300">الحالة الاجتماعية:</td>
                    <td className="p-2 font-semibold text-gray-900">{employee.maritalStatus || '—'}</td>
                    <td className="p-2 font-bold text-gray-600 border-r border-l border-gray-300">رقم الهاتف:</td>
                    <td className="p-2 font-mono font-semibold text-gray-900">{employee.phone || '—'}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* 4. Grade & Career Comparison Table */}
            <div className="space-y-2">
              <h4 className="text-xs font-black text-slate-900 border-r-4 border-amber-600 pr-2 flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-amber-700" />
                <span>ثانياً: التدرج الوظيفي (بيانات التعيين مقابل الوضع الحالي)</span>
              </h4>

              <table className="w-full text-right text-xs border border-gray-300">
                <thead className="bg-slate-800 text-white font-bold">
                  <tr>
                    <th className="p-2 w-1/2 border-l border-slate-700">بيانات التعيين الأصلية</th>
                    <th className="p-2 w-1/2">الوضع المالي والوظيفي الحالي</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  <tr>
                    <td className="p-2 border-l border-gray-300 space-y-1">
                      <p><span className="text-gray-500 font-bold">نظام التعيين:</span> <strong className="text-slate-900">{employee.appointmentSalarySystem || 'جدول مرتبات القانون 15'}</strong></p>
                      <p><span className="text-gray-500 font-bold">الدرجة المعين عليها:</span> <strong className="text-amber-900">{employee.appointmentGrade || '—'}</strong></p>
                      <p><span className="text-gray-500 font-bold">علاوات التعيين:</span> <strong className="text-gray-800">{employee.appointmentIncrements ?? 0} علاوات</strong></p>
                      <p><span className="text-gray-500 font-bold">تاريخ التعيين:</span> <strong className="font-mono text-gray-800">{formatDateDisplay(employee.hireDate) || '—'}</strong></p>
                      <p><span className="text-gray-500 font-bold">تاريخ المباشرة العامة:</span> <strong className="font-mono text-gray-800">{formatDateDisplay(employee.directingDate) || '—'}</strong></p>
                      <p><span className="text-gray-500 font-bold">بدء العمل بمصرف الدم:</span> <strong className="font-mono text-gray-800">{formatDateDisplay(employee.bloodBankStartDate) || '—'}</strong></p>
                    </td>

                    <td className="p-2 space-y-1 bg-amber-50/40">
                      <p><span className="text-gray-500 font-bold">جدول المرتبات:</span> <strong className="text-slate-900">{employee.salaryScale || 'جدول المرتبات الموحد'}</strong></p>
                      <p><span className="text-gray-500 font-bold">الدرجة الحالية:</span> <strong className="text-red-900 font-black">{employee.jobGrade || '—'}</strong></p>
                      <p><span className="text-gray-500 font-bold">عدد العلاوات الحالية:</span> <strong className="text-amber-900 font-black">{employee.currentIncrement || 1} علاوة</strong></p>
                      <p><span className="text-gray-500 font-bold">تاريخ الدرجة الحالية:</span> <strong className="font-mono text-gray-800">{formatDateDisplay(employee.gradeEntryDate) || '—'}</strong></p>
                      <p><span className="text-gray-500 font-bold">تاريخ آخر علاوة:</span> <strong className="font-mono text-gray-800">{formatDateDisplay(employee.lastIncrementDate) || '—'}</strong></p>
                      <p><span className="text-gray-500 font-bold">موعد العلاوة القادمة:</span> <strong className="font-mono text-emerald-800 font-bold">{formatDateDisplay(employee.nextIncrementDate) || '—'}</strong></p>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* 5. Qualifications Table */}
            <div className="space-y-2">
              <h4 className="text-xs font-black text-slate-900 border-r-4 border-blue-800 pr-2 flex items-center gap-1.5">
                <GraduationCap className="w-3.5 h-3.5 text-blue-800" />
                <span>ثالثاً: المؤهلات العلمية والدورات التدريبية</span>
              </h4>

              <table className="w-full text-right text-xs border border-gray-300">
                <thead className="bg-gray-100 font-bold text-gray-800 border-b border-gray-300">
                  <tr>
                    <th className="p-2">المؤهل العلمي / الدورة</th>
                    <th className="p-2">التخصص</th>
                    <th className="p-2">الجامعة / المؤسسة</th>
                    <th className="p-2 text-center">سنة التخرج</th>
                    <th className="p-2 text-center">نوع التعليم</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  <tr>
                    <td className="p-2 font-bold text-gray-900">{employee.qualification || '—'}</td>
                    <td className="p-2 font-semibold text-gray-800">{employee.specialization || '—'}</td>
                    <td className="p-2 text-gray-700">{employee.university || '—'}</td>
                    <td className="p-2 text-center font-mono font-bold text-gray-800">{employee.graduationYear || '—'}</td>
                    <td className="p-2 text-center text-gray-700">{employee.educationType || '—'}</td>
                  </tr>
                  {empQuals.map((q) => (
                    <tr key={q.id} className="bg-blue-50/20">
                      <td className="p-2 font-bold text-blue-950">{q.title} ({q.recordType})</td>
                      <td className="p-2 text-gray-800">{q.specialization || '—'}</td>
                      <td className="p-2 text-gray-700">{q.institution || '—'}</td>
                      <td className="p-2 text-center font-mono text-gray-800">{q.yearObtained || formatDateDisplay(q.startDate) || '—'}</td>
                      <td className="p-2 text-center text-gray-700">{q.grade || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 6. Career History & Leaves Summary */}
            <div className="grid grid-cols-2 gap-4">
              {/* Leaves Summary */}
              <div className="space-y-2">
                <h4 className="text-xs font-black text-slate-900 border-r-4 border-emerald-800 pr-2 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-emerald-800" />
                  <span>رابعاً: ملخص الإجازات</span>
                </h4>
                <div className="p-2.5 bg-gray-50 border border-gray-200 rounded text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-500 font-bold">إجمالي أيام الإجازات المسجلة:</span>
                    <span className="font-mono font-bold text-gray-900">{totalLeaveDaysUsed} يوم</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 font-bold">عدد الإجازات المعتمدة:</span>
                    <span className="font-mono font-bold text-emerald-900">{empLeaves.length} إجازة</span>
                  </div>
                  {empLeaves.slice(0, 2).map((l) => (
                    <p key={l.id} className="text-[11px] text-gray-600 border-t border-gray-200 pt-1">
                      • {l.leaveType} ({l.daysCount} يوم) من {formatDateDisplay(l.startDate)} إلى {formatDateDisplay(l.endDate)}
                    </p>
                  ))}
                </div>
              </div>

              {/* Annual Evaluations Summary */}
              <div className="space-y-2">
                <h4 className="text-xs font-black text-slate-900 border-r-4 border-purple-800 pr-2 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-purple-800" />
                  <span>خامساً: تقارير الكفاءة السنوية</span>
                </h4>
                <div className="p-2.5 bg-gray-50 border border-gray-200 rounded text-xs space-y-1">
                  {empEvals.length === 0 ? (
                    <p className="text-gray-400 text-center py-2">لا توجد تقارير كفاءة مسجلة</p>
                  ) : (
                    empEvals.slice(0, 3).map((ev) => (
                      <div key={ev.id} className="flex justify-between items-center text-[11px] border-b border-gray-200 pb-1 last:border-none">
                        <span className="font-bold text-gray-800">تقرير سنة {ev.evaluationYear}:</span>
                        <span className="font-bold text-purple-900 bg-purple-50 px-1.5 py-0.2 rounded border border-purple-200">
                          {ev.finalGrade || ev.ratingCategory || 'ممتاز'} ({ev.totalScore || 95}%)
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* 7. Official Signatures Footer */}
            <div className="pt-8 border-t-2 border-slate-900 grid grid-cols-3 gap-4 text-center text-xs">
              <div className="space-y-10">
                <p className="font-bold text-gray-800">رئيس قسم الملفات والشؤون الوظيفية</p>
                <p className="text-gray-400">...................................</p>
              </div>

              <div className="space-y-2">
                <p className="font-bold text-gray-800">ختم المصرف الرسمي</p>
                <div className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-full mx-auto flex items-center justify-center text-[10px] text-gray-400">
                  ختم الإدارة
                </div>
              </div>

              <div className="space-y-10">
                <p className="font-bold text-gray-800">مدير عام مصرف الدم المركزي المرج</p>
                <p className="font-black text-slate-950">{generalManagerName}</p>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
