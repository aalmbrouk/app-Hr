import React from 'react';
import { Employee, EmployeeQualificationRecord } from '../types';
import { formatDateDisplay } from '../utils/dateUtils';
import { Printer, X, Download, GraduationCap } from 'lucide-react';

interface OfficialQualificationsPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee;
  qualifications: EmployeeQualificationRecord[];
  hospitalName?: string;
  subTitle?: string;
}

export const OfficialQualificationsPrintModal: React.FC<OfficialQualificationsPrintModalProps> = ({
  isOpen,
  onClose,
  employee,
  qualifications = [],
  hospitalName = 'مصرف الدم المركزي بلدية المرج',
  subTitle = 'قسم الشؤون الإدارية والمالية - وحدة شؤون الموظفين'
}) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const employeeQuals = qualifications.filter((q) => q.employeeId === employee.id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 overflow-y-auto print:p-0 print:bg-white animate-fadeIn text-right" dir="rtl">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[95vh] flex flex-col border border-gray-200 overflow-hidden print:border-none print:shadow-none print:max-w-none print:w-full print:max-h-none">
        {/* Modal Controls Header (Hidden in Print) */}
        <div className="p-4 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex justify-between items-center shrink-0 print:hidden">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-sm">
              معاينة وطباعة سجل المؤهلات والدورات التدريبية المعتمدة
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-1.5 bg-red-700 hover:bg-red-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-md cursor-pointer transition"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة السجل الرسمي</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="text-white/80 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Report Canvas */}
        <div className="p-8 overflow-y-auto print:overflow-visible print:p-6 bg-white text-gray-900 space-y-6">
          {/* Header */}
          <div className="border-b-2 border-red-900 pb-4 flex justify-between items-center text-center">
            <div className="text-right w-1/3 text-xs font-bold space-y-1">
              <div>دولة ليبيا</div>
              <div>وزارة الصحة</div>
              <div className="text-red-900 font-extrabold">{hospitalName}</div>
              <div className="text-[11px] text-gray-600">{subTitle}</div>
            </div>

            <div className="w-1/3 flex flex-col items-center justify-center">
              <div className="w-16 h-16 rounded-full border-2 border-red-900 flex items-center justify-center bg-red-50 text-red-900 font-black text-xl mb-1 shadow-xs">
                🩸
              </div>
              <span className="text-[10px] font-black tracking-widest text-gray-700">BLOOD BANK AL-MARJ</span>
            </div>

            <div className="text-left w-1/3 text-xs font-bold space-y-1" dir="ltr">
              <div>State of Libya</div>
              <div>Ministry of Health</div>
              <div className="text-red-900">Central Blood Bank</div>
              <div className="text-[10px] text-gray-500">Date: {new Date().toLocaleDateString('ar-LY')}</div>
            </div>
          </div>

          {/* Document Title */}
          <div className="text-center my-4">
            <h2 className="text-lg sm:text-xl font-black text-red-950 bg-red-50 py-2 px-6 rounded-xl border border-red-200 inline-block shadow-2xs">
              سجل المؤهلات العلمية والدورات التدريبية المعتمدة
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              بيان رسمي بالمسار الأكاديمي والتدريبي الصادر عن منظومة الموارد البشرية
            </p>
          </div>

          {/* Employee Info Card */}
          <div className="bg-slate-50 border-2 border-slate-200 rounded-xl p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <span className="text-gray-500 block mb-0.5 font-bold">اسم الموظف الرباعي:</span>
              <strong className="text-gray-900 text-sm font-black">{employee.fullName}</strong>
            </div>

            <div>
              <span className="text-gray-500 block mb-0.5 font-bold">الرقم الوظيفي / الملف:</span>
              <span className="font-mono font-black text-red-900 text-sm">{employee.jobNumber}</span>
            </div>

            <div>
              <span className="text-gray-500 block mb-0.5 font-bold">الرقم الوطني:</span>
              <span className="font-mono font-bold text-gray-900">{employee.nationalId || '-'}</span>
            </div>

            <div>
              <span className="text-gray-500 block mb-0.5 font-bold">رقم الملاك الوظيفي:</span>
              <span className="font-mono font-bold text-gray-900">{employee.cadreNumber || '-'}</span>
            </div>

            <div>
              <span className="text-gray-500 block mb-0.5 font-bold">القسم / الإدارة:</span>
              <span className="font-bold text-gray-900">{employee.department}</span>
            </div>

            <div>
              <span className="text-gray-500 block mb-0.5 font-bold">المسمى الوظيفي:</span>
              <span className="font-bold text-gray-900">{employee.jobTitle}</span>
            </div>

            <div>
              <span className="text-gray-500 block mb-0.5 font-bold">الدرجة الحالية:</span>
              <span className="font-bold text-red-900">{employee.jobGrade} (+{employee.currentIncrement || 1} علاوات)</span>
            </div>

            <div>
              <span className="text-gray-500 block mb-0.5 font-bold">الكادر الوظيفي:</span>
              <span className="font-bold text-gray-900">{employee.assignmentCategory}</span>
            </div>
          </div>

          {/* Primary Qualification Summary (from Section 4) */}
          <div className="p-3.5 bg-amber-50/70 border border-amber-300 rounded-xl text-xs">
            <h4 className="font-black text-amber-950 mb-1.5 flex items-center gap-1.5">
              <GraduationCap className="w-4 h-4 text-amber-700" />
              <span>المؤهل العلمي الأساسي المسجل بالملف:</span>
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
              <div>
                <span className="text-gray-600 block">الدرجة العلمية:</span>
                <strong className="text-gray-900">{employee.qualification || 'غير محدد'}</strong>
              </div>
              <div>
                <span className="text-gray-600 block">التخصص الدقيق:</span>
                <strong className="text-gray-900">{employee.specialization || 'عام'}</strong>
              </div>
              <div>
                <span className="text-gray-600 block">المؤسسة / الجامعة:</span>
                <strong className="text-gray-900">{employee.university || '-'} ({employee.educationType || 'جامعة عامة'})</strong>
              </div>
              <div>
                <span className="text-gray-600 block">سنة التخرج:</span>
                <strong className="font-mono text-gray-900">{employee.graduationYear || '-'}</strong>
              </div>
            </div>
          </div>

          {/* Detailed Qualifications & Training Table */}
          <div className="space-y-2">
            <h4 className="font-black text-xs text-gray-900 border-r-4 border-red-700 pr-2">
              جدول السجل التفصيلي للمؤهلات والشهادات والدورات التدريبية ({employeeQuals.length} سجل)
            </h4>

            {employeeQuals.length === 0 ? (
              <div className="p-6 text-center text-gray-500 text-xs border rounded-xl bg-gray-50">
                لا توجد سجلات مؤهلات أو دورات تدريبية إضافية مسجلة في المنظومة لهذا الموظف.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-right border border-gray-300">
                  <thead className="bg-slate-100 text-slate-800 font-bold border-b border-gray-300">
                    <tr>
                      <th className="p-2.5 border border-gray-300 text-center w-12">#</th>
                      <th className="p-2.5 border border-gray-300">نوع السجل</th>
                      <th className="p-2.5 border border-gray-300">اسم المؤهل / الدورة التدريبية</th>
                      <th className="p-2.5 border border-gray-300">التخصص</th>
                      <th className="p-2.5 border border-gray-300">الجامعة / الجهة المنفذة</th>
                      <th className="p-2.5 border border-gray-300 text-center">المدة / الساعات</th>
                      <th className="p-2.5 border border-gray-300 text-center">السنة / التاريخ</th>
                      <th className="p-2.5 border border-gray-300">رقم الشهادة / الإفادة</th>
                    </tr>
                  </thead>
                  <tbody>
                    {employeeQuals.map((q, idx) => (
                      <tr key={q.id} className="border-b border-gray-200 hover:bg-gray-50/50">
                        <td className="p-2.5 border border-gray-300 text-center font-bold text-gray-500">{idx + 1}</td>
                        <td className="p-2.5 border border-gray-300">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            q.recordType === 'مؤهل علمي'
                              ? 'bg-blue-100 text-blue-900 border border-blue-200'
                              : q.recordType === 'دورة تدريبية'
                              ? 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                              : 'bg-amber-100 text-amber-900 border border-amber-200'
                          }`}>
                            {q.recordType}
                          </span>
                        </td>
                        <td className="p-2.5 border border-gray-300 font-black text-gray-900">{q.title}</td>
                        <td className="p-2.5 border border-gray-300 font-medium text-gray-700">{q.specialization || '-'}</td>
                        <td className="p-2.5 border border-gray-300 font-medium text-gray-700">
                          {q.universityOrInstitute || q.executor || q.issuingAuthority || '-'}
                        </td>
                        <td className="p-2.5 border border-gray-300 text-center font-bold text-gray-800">{q.duration || '-'}</td>
                        <td className="p-2.5 border border-gray-300 text-center font-mono font-bold text-gray-900">
                          {q.graduationYear || (q.completionDate ? formatDateDisplay(q.completionDate) : '-')}
                        </td>
                        <td className="p-2.5 border border-gray-300 font-mono text-[11px] text-gray-600">{q.certificateNumber || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Official Signatures & Verification Footer */}
          <div className="pt-8 mt-6 border-t-2 border-gray-300 grid grid-cols-3 gap-6 text-center text-xs font-bold">
            <div className="space-y-8">
              <div className="text-gray-700">إعداد / مسؤول السجلات والتدريب</div>
              <div className="text-gray-400 font-mono text-[11px]">......................................</div>
            </div>

            <div className="space-y-8">
              <div className="text-gray-700">رئيس قسم الشؤون الإدارية والموظفين</div>
              <div className="text-gray-400 font-mono text-[11px]">......................................</div>
            </div>

            <div className="space-y-8">
              <div className="text-red-900 font-extrabold">يعتمد / مدير عام مصرف الدم المركزي المرج</div>
              <div className="text-gray-400 font-mono text-[11px]">الختم الرسمي والتوقيع</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
