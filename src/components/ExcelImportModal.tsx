import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { Employee, EmploymentStatus } from '../types';
import { FileSpreadsheet, Upload, CheckCircle2, AlertTriangle, X, Info, Check, RotateCcw, Calendar } from 'lucide-react';
import { normalizeDateStorage, formatDateDisplay } from '../utils/dateUtils';

interface ExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportEmployees: (newEmployees: Employee[]) => void;
  existingEmployees: Employee[];
}

interface DateComparison {
  field: string;
  original: string;
  cleanedStorage: string;
  cleanedDisplay: string;
}

export const ExcelImportModal: React.FC<ExcelImportModalProps> = ({
  isOpen,
  onClose,
  onImportEmployees,
  existingEmployees
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [previewRows, setPreviewRows] = useState<Employee[]>([]);
  const [parsedRawData, setParsedRawData] = useState<any[]>([]);
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [step, setStep] = useState<'upload' | 'preview' | 'success'>('upload');
  const [importedCount, setImportedCount] = useState<number>(0);
  const [updatedCount, setUpdatedCount] = useState<number>(0);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Handle File Selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      processExcelFile(selectedFile);
    }
  };

  // Drag and Drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      processExcelFile(droppedFile);
    }
  };

  // Process Excel File
  const processExcelFile = (fileToRead: File) => {
    setErrorMsg('');
    setValidationErrors([]);
    setIsProcessing(true);
    setFile(fileToRead);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array', cellDates: true });

        if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
          throw new Error('الملف لا يحتوي على أي أوراق عمل (Sheets)!');
        }

        setSheetNames(workbook.SheetNames);
        const firstSheet = workbook.SheetNames[0];
        setSelectedSheet(firstSheet);

        parseSheetData(workbook, firstSheet);
      } catch (err: any) {
        console.error('Excel parse error:', err);
        setErrorMsg('حدث خطأ أثناء قراءة ملف الإكسل. يرجى التأكد من أن الملف بصيغة .xlsx أو .xls أو .csv صحيحة.');
        setIsProcessing(false);
      }
    };

    reader.readAsArrayBuffer(fileToRead);
  };

  // Parse Sheet Data based on the 21 specified columns
  const parseSheetData = (workbook: XLSX.WorkBook, sheetName: string) => {
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

    if (!jsonData || jsonData.length === 0) {
      setErrorMsg('ورقة العمل المحددة فارغة!');
      setIsProcessing(false);
      return;
    }

    setParsedRawData(jsonData);

    // Map 21 columns
    const errors: string[] = [];
    let baseNextId = existingEmployees.length > 0 ? Math.max(...existingEmployees.map((e) => e.id)) + 1 : 1001;

    const parsed: Employee[] = jsonData.map((row: any, idx: number) => {
      const getVal = (arabicName: string, altKey?: string) => {
        if (row[arabicName] !== undefined && String(row[arabicName]).trim() !== '') {
          return String(row[arabicName]).trim();
        }
        if (altKey && row[altKey] !== undefined && String(row[altKey]).trim() !== '') {
          return String(row[altKey]).trim();
        }
        return '';
      };

      const sysIdStr = getVal('رقم الموظف');
      const fullName = getVal('اسم الموظف', 'الاسم');
      const nationalId = getVal('الرقم الوطني');
      const motherName = getVal('إسم الأم');
      const birthDate = normalizeDateStorage(getVal('تاريخ الميلاد'));
      const birthPlace = getVal('مكان الميلاد');
      const statusRaw = getVal('الوضع الوظيفي');
      const hireDate = normalizeDateStorage(getVal('تاريخ التعيين'));
      const directingDate = normalizeDateStorage(getVal('تاريخ المباشرة'));
      const appointmentGrade = getVal('الدرجة المعين عليها');
      const salaryScale = getVal('جدول المرتبات');
      const jobGrade = getVal('اسم الدرجة الحالية', 'الدرجة الحالية');
      const currentIncStr = getVal('عدد العلاوات');
      const gradeEntryDate = normalizeDateStorage(getVal('تاريخ الدرجة الحالية'));
      const transactionType = getVal('نوع العملية');
      const eligibilityDate = normalizeDateStorage(getVal('تاريخ الاستحقاق'));
      const qualification = getVal('المؤهل');
      const specialization = getVal('التخصص');
      const cadreNumber = getVal('رقم الملاك');
      const bloodBankStartDate = normalizeDateStorage(getVal('تاريخ المباشرة في مصرف الدم'));
      const hiringEntity = getVal('جهة التعيين');

      // Validations
      if (!fullName) {
        errors.push(`السطر ${idx + 2}: اسم الموظف مفقود!`);
      }
      if (nationalId && nationalId.length < 10) {
        errors.push(`السطر ${idx + 2}: الرقم الوطني (${nationalId}) قد يكون غير مكتمل.`);
      }

      // Check if employee exists by National ID or File Number
      const existingMatch = existingEmployees.find(
        (e) => (nationalId && e.nationalId === nationalId) || (sysIdStr && e.jobNumber === sysIdStr)
      );

      const sysId = existingMatch ? existingMatch.id : (baseNextId++);
      const fileNumber = sysIdStr || (existingMatch ? existingMatch.jobNumber : `${sysId}/م`);

      // Determine Department & Assignment Category
      const defaultDept = existingMatch ? existingMatch.department : 'قسم التبرع بالدم';
      const isMedical = defaultDept.includes('طبي') || defaultDept.includes('مسح') || defaultDept.includes('أطباء') || defaultDept.includes('تبرع') || defaultDept.includes('تحضير');

      const empObj: Employee = {
        id: sysId,
        jobNumber: fileNumber,
        nationalId: nationalId || (existingMatch?.nationalId || `11990${String(sysId).padStart(7, '0')}`),
        fullName: fullName || (existingMatch?.fullName || 'غير معروف'),
        motherName: motherName || (existingMatch?.motherName || ''),
        birthDate: birthDate || (existingMatch?.birthDate || '1990-01-01'),
        birthPlace: birthPlace || (existingMatch?.birthPlace || 'المرج'),
        gender: (existingMatch?.gender || 'ذكر'),
        maritalStatus: (existingMatch?.maritalStatus || 'متزوج'),
        status: (statusRaw as EmploymentStatus) || (existingMatch?.status || 'على رأس العمل'),
        hireDate: hireDate || (existingMatch?.hireDate || '2015-01-01'),
        directingDate: directingDate || (existingMatch?.directingDate || '2015-01-15'),
        bloodBankStartDate: bloodBankStartDate || (existingMatch?.bloodBankStartDate || directingDate || hireDate || '2015-01-15'),
        appointmentGrade: appointmentGrade || (existingMatch?.appointmentGrade || 'الدرجة السادسة'),
        salaryScale: salaryScale || (existingMatch?.salaryScale || 'جدول المرتبات الموحد'),
        jobGrade: jobGrade || (existingMatch?.jobGrade || 'الدرجة السابعة'),
        currentIncrement: Number(currentIncStr) || (existingMatch?.currentIncrement || 1),
        gradeEntryDate: gradeEntryDate || (existingMatch?.gradeEntryDate || '2022-01-01'),
        transactionType: transactionType || (existingMatch?.transactionType || 'ترقية عادية'),
        eligibilityDate: eligibilityDate || (existingMatch?.eligibilityDate || '2026-01-01'),
        qualification: qualification || (existingMatch?.qualification || 'بكالوريوس'),
        specialization: specialization || (existingMatch?.specialization || 'عام'),
        cadreNumber: cadreNumber || (existingMatch?.cadreNumber || `MLK-${sysId}`),
        hiringEntity: hiringEntity || (existingMatch?.hiringEntity || 'مصرف الدم المركزي بلدية المرج'),
        assignmentCategory: isMedical ? 'طبي' : 'إداري',
        department: defaultDept,
        jobTitle: existingMatch ? existingMatch.jobTitle : 'أخصائي شؤون وظيفية',
        phone: existingMatch?.phone || '0910000000',
        email: existingMatch?.email || '',
        pdfPath: existingMatch?.pdfPath || `/docs/${sysId}_doc.pdf`,
        notes: existingMatch?.notes || 'تم استيراده أو تحديثه عبر ملف Excel'
      };

      return empObj;
    });

    setValidationErrors(errors);
    setPreviewRows(parsed);
    setIsProcessing(false);
    setStep('preview');
  };

  const formatDateStr = (rawVal: any): string => {
    if (!rawVal) return '';
    if (rawVal instanceof Date) {
      return rawVal.toISOString().slice(0, 10);
    }
    const str = String(rawVal).trim();
    if (str.match(/^\d{4}-\d{2}-\d{2}$/)) return str;
    const parts = str.split(/[\/\.-]/);
    if (parts.length === 3) {
      if (parts[0].length === 4) return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
      if (parts[2].length === 4) return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
    }
    return str;
  };

  const handleConfirmImport = () => {
    setIsProcessing(true);
    try {
      let created = 0;
      let updated = 0;

      previewRows.forEach((p) => {
        const exists = existingEmployees.some((e) => e.id === p.id || e.nationalId === p.nationalId);
        if (exists) updated++;
        else created++;
      });

      onImportEmployees(previewRows);
      setImportedCount(created);
      setUpdatedCount(updated);
      setIsProcessing(false);
      setStep('success');
    } catch (err) {
      console.error(err);
      setErrorMsg('حدث خطأ أثناء إجراء عملية الاستيراد وحفظ السجلات بالأنظمة!');
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full p-6 space-y-6 border border-gray-200">
        
        {/* Header */}
        <div className="flex justify-between items-center border-b pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-red-50 text-red-700 rounded-xl">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">معالج استيراد بيانات الموظفين من ملف الإكسل (21 عمود)</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                مطابقة الأعمدة الرسمية، التحقق من الأخطاء، وحفظ التعديلات دون حذف السجلات السابقة
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-xl text-sm flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-bold">خطأ في الاستيراد</div>
              <div>{errorMsg}</div>
            </div>
          </div>
        )}

        {/* STEP 1: UPLOAD */}
        {step === 'upload' && (
          <div className="space-y-6">
            <div
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 hover:border-red-600 bg-gray-50 hover:bg-red-50/30 rounded-2xl p-10 text-center cursor-pointer transition-all space-y-4"
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".xlsx, .xls, .csv"
                className="hidden"
              />
              <div className="w-16 h-16 bg-red-100 text-red-700 rounded-full flex items-center justify-center mx-auto shadow-sm">
                <Upload className="w-8 h-8" />
              </div>
              <div>
                <p className="text-base font-bold text-gray-800">اسحب ملف الإكسل هنا أو اضغط للاختيار</p>
                <p className="text-xs text-gray-500 mt-1">يدعم ملفات .XLSX و .XLS و .CSV التي تحتوي على الأعمدة الـ21 الرسمية</p>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 text-xs text-gray-700 space-y-2">
              <div className="font-bold text-gray-900 flex items-center gap-1.5">
                <Info className="w-4 h-4 text-red-700" />
                الأعمدة الـ21 المطلوبة بالترتيب في ملف الإكسل:
              </div>
              <p className="leading-relaxed text-gray-600">
                1. رقم الموظف | 2. اسم الموظف | 3. الرقم الوطني | 4. إسم الأم | 5. تاريخ الميلاد | 6. مكان الميلاد | 7. الوضع الوظيفي | 8. تاريخ التعيين | 9. تاريخ المباشرة | 10. الدرجة المعين عليها | 11. جدول المرتبات | 12. اسم الدرجة الحالية | 13. عدد العلاوات | 14. تاريخ الدرجة الحالية | 15. نوع العملية | 16. تاريخ الاستحقاق | 17. المؤهل | 18. التخصص | 19. رقم الملاك | 20. تاريخ المباشرة في مصرف الدم | 21. جهة التعيين
              </p>
            </div>
          </div>
        )}

        {/* STEP 2: PREVIEW */}
        {step === 'preview' && (
          <div className="space-y-4">
            {/* Validation alerts if any */}
            {validationErrors.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 text-amber-900 p-3 rounded-xl text-xs space-y-1 max-h-32 overflow-y-auto">
                <div className="font-bold flex items-center gap-1">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  تنبيهات مراجعة البيانات ({validationErrors.length}):
                </div>
                {validationErrors.slice(0, 5).map((err, i) => (
                  <div key={i}>• {err}</div>
                ))}
                {validationErrors.length > 5 && (
                  <div className="font-semibold text-amber-800">...وغيرها من الملاحظات.</div>
                )}
              </div>
            )}

            <div className="flex justify-between items-center text-sm">
              <div className="font-bold text-gray-800">
                معاينة السجلات المجهزة للاستيراد ({previewRows.length} موظف)
              </div>
              <button
                onClick={() => setStep('upload')}
                className="text-xs text-gray-600 hover:text-red-700 flex items-center gap-1 underline"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                إعادة اختيار ملف آخر
              </button>
            </div>

            {/* Preview Table */}
            <div className="border rounded-xl overflow-hidden max-h-80 overflow-y-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-gray-100 border-b font-semibold text-gray-700 sticky top-0">
                  <tr>
                    <th className="py-2.5 px-3">الرقم الوظيفي</th>
                    <th className="py-2.5 px-3">اسم الموظف</th>
                    <th className="py-2.5 px-3">الرقم الوطني</th>
                    <th className="py-2.5 px-3">الدرجة والعلاوة</th>
                    <th className="py-2.5 px-3">المباشرة (تاريخ نظيف DD/MM/YYYY)</th>
                    <th className="py-2.5 px-3">جهة التعيين</th>
                    <th className="py-2.5 px-3">الحالة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {previewRows.map((emp) => {
                    const exists = existingEmployees.some(
                      (e) => e.id === emp.id || e.nationalId === emp.nationalId
                    );
                    return (
                      <tr key={emp.id} className="hover:bg-gray-50">
                        <td className="py-2 px-3 font-bold text-gray-900">{emp.jobNumber}</td>
                        <td className="py-2 px-3 font-semibold text-gray-800">{emp.fullName}</td>
                        <td className="py-2 px-3 font-mono">{emp.nationalId}</td>
                        <td className="py-2 px-3">{emp.jobGrade} (علاوة {emp.currentIncrement})</td>
                        <td className="py-2 px-3 font-medium text-blue-900 bg-blue-50/50 rounded">
                          <span className="flex items-center gap-1 dir-ltr inline-block">
                            <Calendar className="w-3 h-3 text-blue-600 inline ml-1" />
                            {formatDateDisplay(emp.bloodBankStartDate) || 'غير محدد'}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-gray-600">{emp.hiringEntity}</td>
                        <td className="py-2 px-3">
                          {exists ? (
                            <span className="bg-amber-100 text-amber-800 text-[10px] px-2 py-0.5 rounded font-bold">تحديث سطر</span>
                          ) : (
                            <span className="bg-emerald-100 text-emerald-800 text-[10px] px-2 py-0.5 rounded font-bold">جديد</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Action buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm"
              >
                إلغاء
              </button>
              <button
                type="button"
                disabled={isProcessing || previewRows.length === 0}
                onClick={handleConfirmImport}
                className="flex items-center gap-2 bg-red-700 hover:bg-red-800 text-white px-5 py-2 rounded-lg font-medium shadow-sm text-sm"
              >
                <Check className="w-4 h-4" />
                تأكيد وبدء الاستيراد بالدفعات ({previewRows.length} سجل)
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: SUCCESS */}
        {step === 'success' && (
          <div className="text-center py-8 space-y-4">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">تمت عملية استيراد وتحديث البيانات بنجاح!</h3>
            <p className="text-sm text-gray-600 max-w-md mx-auto">
              تم إضافة <span className="font-bold text-emerald-700">{importedCount}</span> موظف جديد وتحديث <span className="font-bold text-amber-700">{updatedCount}</span> سجل بالأنظمة مع الحفاظ الكامل على كافة الإجراءات والسجلات التراكمية.
            </p>
            <div className="pt-4">
              <button
                onClick={onClose}
                className="bg-red-700 hover:bg-red-800 text-white px-6 py-2.5 rounded-lg font-medium shadow-sm text-sm"
              >
                إغلاق والعودة لشاشة الموظفين
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
