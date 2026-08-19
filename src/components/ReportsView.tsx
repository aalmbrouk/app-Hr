import React, { useState, useMemo } from 'react';
import { Employee } from '../types';
import { DEPARTMENTS, QUALIFICATIONS, JOB_TITLES, HIRING_ENTITIES } from '../data/initialData';
import { FileSpreadsheet, Download, Printer, FileText, Filter, CheckCircle2, Building2, FileDown, Loader2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import { formatDateDisplay } from '../utils/dateUtils';
import { exportElementToPdf } from '../utils/pdfExport';

interface ReportsViewProps {
  employees: Employee[];
}

export const ReportsView: React.FC<ReportsViewProps> = ({ employees }) => {
  const [reportType, setReportType] = useState<string>('all');
  const [selectedDept, setSelectedDept] = useState<string>(DEPARTMENTS[0]);
  const [selectedQual, setSelectedQual] = useState<string>(QUALIFICATIONS[0]);
  const [selectedJobTitle, setSelectedJobTitle] = useState<string>(JOB_TITLES[0]);
  const [selectedHiringEntity, setSelectedHiringEntity] = useState<string>(HIRING_ENTITIES[0]);
  const [selectedStatus, setSelectedStatus] = useState<string>('على رأس العمل');
  const [selectedYear, setSelectedYear] = useState<string>('2020');
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  // Available unique years
  const availableYears = useMemo(() => {
    const yearsSet = new Set<string>();
    employees.forEach((e) => {
      if (e.hireDate) yearsSet.add(e.hireDate.split('-')[0]);
      if (e.directingDate) yearsSet.add(e.directingDate.split('-')[0]);
    });
    return Array.from(yearsSet).sort((a, b) => b.localeCompare(a));
  }, [employees]);

  // Report Title & Filtered List
  const { reportTitle, reportData } = useMemo(() => {
    let data = [...employees];
    let title = 'تقرير جميع موظفي مصرف الدم المركزي المرج - ليبيا';

    if (reportType === 'dept') {
      data = employees.filter((e) => e.department === selectedDept);
      title = `تقرير الموظفين التابعين لـ (${selectedDept})`;
    } else if (reportType === 'qual') {
      data = employees.filter((e) => e.qualification === selectedQual);
      title = `تقرير الموظفين بحسب المؤهل العلمى (${selectedQual})`;
    } else if (reportType === 'jobTitle') {
      data = employees.filter((e) => e.jobTitle === selectedJobTitle);
      title = `تقرير الموظفين بحسب الوظيفة (${selectedJobTitle})`;
    } else if (reportType === 'hiringEntity') {
      data = employees.filter((e) => e.hiringEntity === selectedHiringEntity);
      title = `تقرير الموظفين بحسب جهة التعيين (${selectedHiringEntity})`;
    } else if (reportType === 'status') {
      data = employees.filter((e) => e.status === selectedStatus);
      title = `تقرير الموظفين بحسب الحالة الوظيفية (${selectedStatus})`;
    } else if (reportType === 'hireYear') {
      data = employees.filter((e) => e.hireDate && e.hireDate.startsWith(selectedYear));
      title = `تقرير الموظفين المعينين في سنة (${selectedYear})`;
    } else if (reportType === 'directingYear') {
      data = employees.filter((e) => e.directingDate && e.directingDate.startsWith(selectedYear));
      title = `تقرير الموظفين المباشرين بمصرف الدم في سنة (${selectedYear})`;
    }

    return { reportTitle: title, reportData: data };
  }, [
    employees,
    reportType,
    selectedDept,
    selectedQual,
    selectedJobTitle,
    selectedHiringEntity,
    selectedStatus,
    selectedYear
  ]);

  // Export to Real XLSX File
  const handleExportExcel = () => {
    const excelRows = reportData.map((emp, idx) => ({
      'ت': idx + 1,
      'رقم الموظف': emp.id,
      'الاسم الرباعي': emp.fullName,
      'اسم الأم': emp.motherName,
      'الجنس': emp.gender,
      'الرقم الوطني': emp.nationalId,
      'الرقم الوظيفي': emp.jobNumber,
      'رقم الملاك': emp.cadreNumber,
      'القسم': emp.department,
      'الوحدة': emp.unit,
      'الوظيفة': emp.jobTitle,
      'المؤهل العلمي': emp.qualification,
      'التخصص': emp.specialization,
      'الدرجة المالية': emp.financialGrade,
      'تاريخ التعيين': emp.hireDate,
      'جهة التعيين': emp.hiringEntity,
      'تاريخ المباشرة': emp.directingDate,
      'الجهة المنقول منها': emp.transferredFrom,
      'رقم الهاتف': emp.phone,
      'الحالة الوظيفية': emp.status,
      'ملاحظات': emp.notes
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'التقرير');

    // Generate File
    const fileName = `BloodBank_HR_Report_${Date.now()}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  // Direct Print / PDF Print View
  const handlePrintReport = () => {
    window.print();
  };

  // Direct High Quality PDF File Export
  const handleExportPdf = async () => {
    setIsExportingPdf(true);
    setExportSuccess(false);

    const safeTitle = reportTitle.replace(/[/\\?%*:|"<>]/g, '_');
    const fileName = `${safeTitle}_${Date.now()}`;

    try {
      const success = await exportElementToPdf('OFFICIAL_REPORT_DOCUMENT', fileName, {
        orientation: 'landscape',
        margin: 6,
        scale: 2.2
      });

      if (success) {
        setExportSuccess(true);
        setTimeout(() => setExportSuccess(false), 3000);
      }
    } catch (err) {
      console.error('Failed to export report PDF:', err);
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <div className="space-y-4">
      
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-red-950 text-red-400 border border-red-800">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-black text-white">
              مركز إنشاء التقارير والتصدير (Reports & Export Engine)
            </h2>
            <p className="text-xs text-slate-400">
              استخراج التقارير الرسمية المجمعة وتصديرها بصيغ Excel و PDF و الطباعة المباشرة
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportExcel}
            type="button"
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg transition-all flex items-center gap-1.5 border border-emerald-400 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>تصدير Excel (.xlsx)</span>
          </button>

          {/* Direct PDF Download Button */}
          <button
            onClick={handleExportPdf}
            disabled={isExportingPdf}
            type="button"
            className={`px-4 py-2 rounded-xl text-white font-bold text-xs shadow-lg transition-all flex items-center gap-1.5 border ${
              exportSuccess
                ? 'bg-emerald-600 border-emerald-400'
                : 'bg-slate-800 hover:bg-slate-700 border-slate-600'
            } disabled:opacity-50 cursor-pointer`}
          >
            {isExportingPdf ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-red-300" />
                <span>جاري إنشاء PDF...</span>
              </>
            ) : exportSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                <span>تم تصدير PDF</span>
              </>
            ) : (
              <>
                <FileDown className="w-4 h-4 text-red-400" />
                <span>تصدير PDF</span>
              </>
            )}
          </button>

          <button
            onClick={handlePrintReport}
            type="button"
            className="px-4 py-2 rounded-xl bg-red-700 hover:bg-red-600 text-white font-bold text-xs transition-all flex items-center gap-1.5 border border-red-500 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>طباعة المستند (A4)</span>
          </button>
        </div>
      </div>

      {/* Report Type Selector */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4 print:hidden">
        <div className="text-xs font-bold text-slate-300 flex items-center gap-2 border-b border-slate-800 pb-2">
          <Filter className="w-4 h-4 text-red-500" />
          <span>نوع التقرير والتصنيف المطلوب</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 text-xs">
          
          <button
            onClick={() => setReportType('all')}
            className={`p-3 rounded-xl border text-right font-bold transition-all ${
              reportType === 'all'
                ? 'bg-red-900/60 border-red-600 text-white shadow-inner'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
            }`}
          >
            جميع الموظفين
          </button>

          <button
            onClick={() => setReportType('dept')}
            className={`p-3 rounded-xl border text-right font-bold transition-all ${
              reportType === 'dept'
                ? 'bg-red-900/60 border-red-600 text-white shadow-inner'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
            }`}
          >
            حسب القسم
          </button>

          <button
            onClick={() => setReportType('qual')}
            className={`p-3 rounded-xl border text-right font-bold transition-all ${
              reportType === 'qual'
                ? 'bg-red-900/60 border-red-600 text-white shadow-inner'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
            }`}
          >
            حسب المؤهل العلمي
          </button>

          <button
            onClick={() => setReportType('jobTitle')}
            className={`p-3 rounded-xl border text-right font-bold transition-all ${
              reportType === 'jobTitle'
                ? 'bg-red-900/60 border-red-600 text-white shadow-inner'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
            }`}
          >
            حسب الوظيفة
          </button>

          <button
            onClick={() => setReportType('hiringEntity')}
            className={`p-3 rounded-xl border text-right font-bold transition-all ${
              reportType === 'hiringEntity'
                ? 'bg-red-900/60 border-red-600 text-white shadow-inner'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
            }`}
          >
            حسب جهة التعيين
          </button>

          <button
            onClick={() => setReportType('status')}
            className={`p-3 rounded-xl border text-right font-bold transition-all ${
              reportType === 'status'
                ? 'bg-red-900/60 border-red-600 text-white shadow-inner'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
            }`}
          >
            حسب الحالة الوظيفية
          </button>

          <button
            onClick={() => setReportType('hireYear')}
            className={`p-3 rounded-xl border text-right font-bold transition-all ${
              reportType === 'hireYear'
                ? 'bg-red-900/60 border-red-600 text-white shadow-inner'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
            }`}
          >
            حسب سنة التعيين
          </button>

          <button
            onClick={() => setReportType('directingYear')}
            className={`p-3 rounded-xl border text-right font-bold transition-all ${
              reportType === 'directingYear'
                ? 'bg-red-900/60 border-red-600 text-white shadow-inner'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
            }`}
          >
            حسب سنة المباشرة
          </button>

        </div>

        {/* Dynamic Parameter Selector */}
        {reportType !== 'all' && (
          <div className="pt-3 border-t border-slate-800 flex items-center gap-3 text-xs">
            <span className="font-bold text-slate-300">حدد الاختيار:</span>
            
            {reportType === 'dept' && (
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold"
              >
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            )}

            {reportType === 'qual' && (
              <select
                value={selectedQual}
                onChange={(e) => setSelectedQual(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold"
              >
                {QUALIFICATIONS.map((q) => (
                  <option key={q} value={q}>{q}</option>
                ))}
              </select>
            )}

            {reportType === 'jobTitle' && (
              <select
                value={selectedJobTitle}
                onChange={(e) => setSelectedJobTitle(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold"
              >
                {JOB_TITLES.map((jt) => (
                  <option key={jt} value={jt}>{jt}</option>
                ))}
              </select>
            )}

            {reportType === 'hiringEntity' && (
              <select
                value={selectedHiringEntity}
                onChange={(e) => setSelectedHiringEntity(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold"
              >
                {HIRING_ENTITIES.map((he) => (
                  <option key={he} value={he}>{he}</option>
                ))}
              </select>
            )}

            {reportType === 'status' && (
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold"
              >
                <option value="على رأس العمل">على رأس العمل</option>
                <option value="إجازة">إجازة</option>
                <option value="منقول">منقول</option>
                <option value="متقاعد">متقاعد</option>
                <option value="موقوف">موقوف</option>
              </select>
            )}

            {(reportType === 'hireYear' || reportType === 'directingYear') && (
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold font-mono"
              >
                {availableYears.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            )}
          </div>
        )}
      </div>

      {/* Printable Official Document Preview Container */}
      <div 
        id="OFFICIAL_REPORT_DOCUMENT"
        className="bg-white text-slate-900 rounded-2xl p-8 shadow-2xl border border-slate-200 space-y-6 print:p-0 print:border-none print:shadow-none"
      >
        
        {/* Printable Official Letterhead Header */}
        <div className="border-b-2 border-red-800 pb-4 flex items-center justify-between">
          <div className="text-right">
            <h3 className="text-xs font-black text-red-900">دولة ليبيا</h3>
            <h4 className="text-sm font-black text-slate-900">وزارة الصحة</h4>
            <h2 className="text-base font-black text-red-800">مصرف الدم المركزي بلدية المرج</h2>
            <p className="text-[10px] text-slate-600">قسم الشؤون الوظيفية والموارد البشرية</p>
          </div>

          <div className="text-center">
            <div className="w-20 h-20 mx-auto rounded-2xl bg-white border-2 border-red-800 p-1 overflow-hidden shadow-md flex items-center justify-center">
              <img src="/logo.jpg" alt="شعار مصرف الدم المركزي بلدية المرج" className="w-full h-full object-contain" />
            </div>
            <p className="text-[10px] font-bold text-red-900 mt-1">بلدية المرج - ليبيا</p>
          </div>

          <div className="text-left font-mono text-[11px] text-slate-600">
            <p><strong>التاريخ:</strong> {formatDateDisplay(new Date().toISOString().slice(0, 10))}</p>
            <p><strong>عدد السجلات:</strong> {reportData.length}</p>
            <p><strong>حالة التقرير:</strong> معتمد رسمي</p>
          </div>
        </div>

        {/* Report Document Title */}
        <div className="text-center bg-red-50 border border-red-200 rounded-xl py-3 px-4">
          <h1 className="text-base font-black text-red-900">{reportTitle}</h1>
        </div>

        {/* Report Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs border-collapse border border-slate-300">
            <thead>
              <tr className="bg-red-900 text-white font-bold text-[11px]">
                <th className="border border-red-800 p-2 text-center w-8">ت</th>
                <th className="border border-red-800 p-2">رقم الموظف</th>
                <th className="border border-red-800 p-2">الاسم الرباعي</th>
                <th className="border border-red-800 p-2">الرقم الوطني</th>
                <th className="border border-red-800 p-2">الرقم الوظيفي</th>
                <th className="border border-red-800 p-2">القسم</th>
                <th className="border border-red-800 p-2">الوظيفة</th>
                <th className="border border-red-800 p-2">المؤهل</th>
                <th className="border border-red-800 p-2">الدرجة</th>
                <th className="border border-red-800 p-2">الحالة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-medium">
              {reportData.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-6 text-center text-slate-500">
                    لا توجد بيانات مطابقة لهذا التقرير.
                  </td>
                </tr>
              ) : (
                reportData.map((emp, idx) => (
                  <tr key={emp.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                    <td className="border border-slate-300 p-2 text-center font-mono text-slate-600">{idx + 1}</td>
                    <td className="border border-slate-300 p-2 font-mono text-slate-800">{emp.id}</td>
                    <td className="border border-slate-300 p-2 font-black text-slate-900">{emp.fullName}</td>
                    <td className="border border-slate-300 p-2 font-mono text-slate-700">{emp.nationalId}</td>
                    <td className="border border-slate-300 p-2 font-mono text-red-800 font-bold">{emp.jobNumber}</td>
                    <td className="border border-slate-300 p-2 text-slate-800">{emp.department}</td>
                    <td className="border border-slate-300 p-2 text-slate-800">{emp.jobTitle}</td>
                    <td className="border border-slate-300 p-2 text-slate-700">{emp.qualification}</td>
                    <td className="border border-slate-300 p-2 text-slate-700">{emp.financialGrade}</td>
                    <td className="border border-slate-300 p-2 font-bold text-slate-800">{emp.status}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Report Official Footer & Signatures */}
        <div className="pt-8 border-t border-slate-300 grid grid-cols-2 text-center text-xs font-bold text-slate-800">
          <div>
            <p>مسؤول قسم الموارد البشرية</p>
            <p className="mt-8 text-slate-400">التوقيع والخاتم</p>
          </div>
          <div>
            <p>مدير عام مصرف الدم المركزي المرج</p>
            <p className="mt-8 text-slate-400">التوقيع والخاتم</p>
          </div>
        </div>

      </div>

    </div>
  );
};
