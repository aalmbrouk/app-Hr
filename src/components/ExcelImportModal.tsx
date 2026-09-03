import React, { useState, useRef, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { 
  Employee, 
  CareerPromotionRecord, 
  PromotionRecord, 
  IncrementRecord, 
  StatusSettlementRecord 
} from '../types';
import { 
  FileSpreadsheet, 
  Upload, 
  CheckCircle2, 
  AlertTriangle, 
  X, 
  Info, 
  Check, 
  RotateCcw, 
  Calendar, 
  Users, 
  Layers, 
  Download, 
  ShieldCheck, 
  FileText, 
  Sparkles,
  ArrowRight,
  Filter,
  Eye,
  AlertCircle,
  ShieldAlert
} from 'lucide-react';
import { 
  parseExcelMigrationData, 
  commitMigrationAtomic, 
  exportErrorsReport, 
  getSampleGoogleMergedExcelData, 
  downloadSampleExcelWorkbook,
  getLastPreImportBackup,
  rollbackLastPreImportBackup,
  MigrationPreviewResult,
  MigrationCommitResult
} from '../utils/excelMigrationUtils';
import { formatDateDisplay } from '../utils/dateUtils';
import { getCareerActionMeta } from '../utils/careerUtils';

interface ExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingEmployees: Employee[];
  existingCareerRecords?: CareerPromotionRecord[];
  existingPromotions?: PromotionRecord[];
  existingIncrements?: IncrementRecord[];
  existingSettlements?: StatusSettlementRecord[];
  onImportComplete?: (result: MigrationCommitResult) => void;
  onImportEmployees?: (newEmployees: Employee[]) => void;
  currentUser?: string;
  onNavigateToTab?: (tabName: string) => void;
}

export const ExcelImportModal: React.FC<ExcelImportModalProps> = ({
  isOpen,
  onClose,
  existingEmployees,
  existingCareerRecords = [],
  existingPromotions = [],
  existingIncrements = [],
  existingSettlements = [],
  onImportComplete,
  onImportEmployees,
  currentUser = 'مدير النظام',
  onNavigateToTab
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<string>('');
  const [workbookObj, setWorkbookObj] = useState<XLSX.WorkBook | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [step, setStep] = useState<'upload' | 'preview' | 'success'>('upload');
  const [previewTab, setPreviewTab] = useState<'employees' | 'career_actions' | 'unlinked' | 'errors'>('employees');
  const [previewData, setPreviewData] = useState<MigrationPreviewResult | null>(null);
  const [commitResult, setCommitResult] = useState<MigrationCommitResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [lastBackupInfo, setLastBackupInfo] = useState<{ key: string; timestamp: string; reason: string; data: any } | null>(null);
  const [isRollingBack, setIsRollingBack] = useState<boolean>(false);
  const [rollbackFeedback, setRollbackFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showRollbackConfirm, setShowRollbackConfirm] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check for previous backup snapshot on open
  useEffect(() => {
    if (isOpen) {
      const backup = getLastPreImportBackup();
      setLastBackupInfo(backup);
      setRollbackFeedback(null);
      setShowRollbackConfirm(false);
    }
  }, [isOpen]);

  // Execute Rollback
  const handleExecuteRollback = () => {
    setIsRollingBack(true);
    setRollbackFeedback(null);
    try {
      const rollbackRes = rollbackLastPreImportBackup();
      if (rollbackRes.success && rollbackRes.restoredData) {
        const restored = rollbackRes.restoredData;
        const commitPayload: MigrationCommitResult = {
          backupCreated: false,
          backupKey: '',
          backupTimestamp: '',
          matchedEmployeesCount: 0,
          correctedRecordsCount: 0,
          newHistoricalRecordsCount: 0,
          duplicateRecordsCount: 0,
          newEmployeesCount: 0,
          conflictReviewCount: 0,
          importedEmployeesCount: 0,
          updatedEmployeesCount: 0,
          importedHistoricalRecordsCount: 0,
          employees: restored.employees || existingEmployees,
          careerRecords: restored.careerRecords || existingCareerRecords,
          promotions: restored.promotions || existingPromotions,
          increments: restored.increments || existingIncrements,
          settlements: restored.settlements || existingSettlements,
          correctionsReport: [],
          summaryLog: rollbackRes.message
        };

        if (onImportComplete) {
          onImportComplete(commitPayload);
        } else if (onImportEmployees && restored.employees) {
          onImportEmployees(restored.employees);
        }

        setRollbackFeedback({
          type: 'success',
          message: rollbackRes.message
        });
        setShowRollbackConfirm(false);
        // Refresh available backup
        setLastBackupInfo(getLastPreImportBackup());
      } else {
        setRollbackFeedback({
          type: 'error',
          message: rollbackRes.message || 'تعذر استرجاع النسخة الاحتياطية السابقة.'
        });
      }
    } catch (err: any) {
      console.error('Rollback error:', err);
      setRollbackFeedback({
        type: 'error',
        message: `حدث خطأ أثناء محاولة التراجع: ${err?.message || 'خطأ غير معروف'}`
      });
    } finally {
      setIsRollingBack(false);
    }
  };

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

  // Process uploaded Excel File
  const processExcelFile = (fileToRead: File) => {
    setErrorMsg('');
    setIsProcessing(true);
    setFile(fileToRead);
    setFileName(fileToRead.name);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array', cellDates: true });

        if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
          throw new Error('الملف لا يحتوي على أي أوراق عمل (Sheets)!');
        }

        setWorkbookObj(workbook);
        setSheetNames(workbook.SheetNames);
        const firstSheet = workbook.SheetNames[0];
        setSelectedSheet(firstSheet);

        parseSheet(workbook, firstSheet);
      } catch (err: any) {
        console.error('Excel parse error:', err);
        setErrorMsg('حدث خطأ أثناء قراءة ملف الإكسل. يرجى التأكد من أن الملف بصيغة .xlsx أو .xls أو .csv صالحة.');
        setIsProcessing(false);
      }
    };

    reader.readAsArrayBuffer(fileToRead);
  };

  // Parse specific sheet inside workbook
  const parseSheet = (wb: XLSX.WorkBook, sheetName: string) => {
    try {
      const worksheet = wb.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

      if (!jsonData || jsonData.length === 0) {
        setErrorMsg('ورقة العمل المحددة فارغة!');
        setIsProcessing(false);
        return;
      }

      const parsedResult = parseExcelMigrationData(jsonData, existingEmployees, existingCareerRecords);
      setPreviewData(parsedResult);
      setIsProcessing(false);
      setStep('preview');
    } catch (err: any) {
      console.error(err);
      setErrorMsg('حدث خطأ أثناء معالجة بيانات ورقة العمل المحددة.');
      setIsProcessing(false);
    }
  };

  // Handle Sheet Change
  const handleSheetChange = (newSheet: string) => {
    setSelectedSheet(newSheet);
    if (workbookObj) {
      setIsProcessing(true);
      parseSheet(workbookObj, newSheet);
    }
  };

  // Load Built-in Sample for "منظومة_جوجل_مدمج.xlsx"
  const handleLoadSampleGoogleMergedData = () => {
    setIsProcessing(true);
    setErrorMsg('');
    setFileName('منظومة_جوجل_مدمج.xlsx (النموذج المدمج المعتمد)');
    try {
      const sampleData = getSampleGoogleMergedExcelData();
      const parsedResult = parseExcelMigrationData(sampleData, existingEmployees, existingCareerRecords);
      setPreviewData(parsedResult);
      setIsProcessing(false);
      setStep('preview');
    } catch (err: any) {
      console.error(err);
      setErrorMsg('تعذر تحميل النموذج التجريبي.');
      setIsProcessing(false);
    }
  };

  // Confirm and Atomically Commit Migration
  const handleConfirmMigration = () => {
    if (!previewData) return;
    setIsProcessing(true);
    try {
      const result = commitMigrationAtomic(
        previewData,
        existingEmployees,
        existingCareerRecords,
        existingPromotions,
        existingIncrements,
        existingSettlements,
        currentUser
      );

      setCommitResult(result);

      if (onImportComplete) {
        onImportComplete(result);
      } else if (onImportEmployees) {
        onImportEmployees(result.employees);
      }

      setIsProcessing(false);
      setStep('success');
    } catch (err: any) {
      console.error('Migration commit error:', err);
      setErrorMsg('حدث خطأ غير متوقع أثناء حفظ البيانات وترحيل السجلات.');
      setIsProcessing(false);
    }
  };

  // Reset Wizard
  const handleReset = () => {
    setFile(null);
    setFileName('');
    setWorkbookObj(null);
    setPreviewData(null);
    setCommitResult(null);
    setErrorMsg('');
    setStep('upload');
  };

  if (!isOpen) return null;

  // Filtered employees in preview
  const filteredEmployeeGroups = previewData?.employeeGroups.filter((g) => {
    if (!searchFilter.trim()) return true;
    const term = searchFilter.toLowerCase();
    return (
      g.employeeName.toLowerCase().includes(term) ||
      g.nationalId.includes(term) ||
      g.masterRecord.jobNumber.includes(term) ||
      g.masterRecord.department.toLowerCase().includes(term)
    );
  }) || [];

  // Filtered historical actions in preview
  const filteredActions = previewData?.allHistoricalActions.filter((a) => {
    if (!searchFilter.trim()) return true;
    const term = searchFilter.toLowerCase();
    return (
      a.employeeName.toLowerCase().includes(term) ||
      a.nationalId.includes(term) ||
      a.actionType.includes(term) ||
      a.newGrade.includes(term) ||
      a.decisionNumber.includes(term)
    );
  }) || [];

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full p-6 space-y-6 border border-gray-200 max-h-[92vh] flex flex-col">
        
        {/* Header */}
        <div className="flex justify-between items-center border-b pb-4 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-50 text-red-700 rounded-xl border border-red-200">
              <FileSpreadsheet className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                معالج استيراد وترحيل بيانات الموظفين والترقيات من Excel
                <span className="text-xs bg-red-100 text-red-800 font-semibold px-2 py-0.5 rounded-full border border-red-300">
                  منظومة جوجل مدمج
                </span>
              </h2>
              <p className="text-xs text-gray-600 mt-0.5">
                تجميع السجلات بالرقم الوطني • فصل البيانات الأساسية عن الحركات التاريخية • حماية التواريخ الأصلية • نسخة احتياطية تلقائية
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-xl text-sm flex items-start gap-3 flex-shrink-0">
            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-bold">تنبيه في الاستيراد</div>
              <div>{errorMsg}</div>
            </div>
          </div>
        )}

        {/* Rollback Feedback Banner */}
        {rollbackFeedback && (
          <div className={`p-4 rounded-xl text-sm flex items-start gap-3 flex-shrink-0 border ${
            rollbackFeedback.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-red-50 border-red-200 text-red-900'
          }`}>
            {rollbackFeedback.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <div className="font-bold">
                {rollbackFeedback.type === 'success' ? 'تم التراجع بنجاح' : 'خطأ في عملية التراجع'}
              </div>
              <div>{rollbackFeedback.message}</div>
            </div>
          </div>
        )}

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto space-y-6 pr-1">

          {/* STEP 1: UPLOAD SCREEN */}
          {step === 'upload' && (
            <div className="space-y-6">

              {/* Quick Rollback Banner if previous backup exists */}
              {lastBackupInfo && (
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 bg-amber-100 text-amber-800 rounded-xl border border-amber-200 shrink-0">
                      <RotateCcw className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-amber-950 flex items-center gap-2">
                        <span>تراجع فوري عن آخر عملية استيراد Excel</span>
                        <span className="text-[10px] bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full font-semibold">
                          نسخة محفوظة متاحة
                        </span>
                      </h4>
                      <p className="text-xs text-amber-800 mt-0.5">
                        تم أخذ نسخة احتياطية بتاريخ: <span className="font-mono font-bold text-amber-950">{lastBackupInfo.timestamp || lastBackupInfo.key}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    {!showRollbackConfirm ? (
                      <button
                        type="button"
                        onClick={() => setShowRollbackConfirm(true)}
                        className="px-4 py-2 bg-amber-700 hover:bg-amber-800 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>التراجع عن آخر استيراد</span>
                      </button>
                    ) : (
                      <div className="flex items-center gap-2 bg-white/90 p-1.5 rounded-xl border border-amber-300">
                        <span className="text-[11px] font-bold text-red-700 pr-1">تأكيد التراجع؟</span>
                        <button
                          type="button"
                          onClick={handleExecuteRollback}
                          disabled={isRollingBack}
                          className="px-3 py-1.5 bg-red-700 hover:bg-red-800 text-white rounded-lg text-xs font-bold shadow-xs transition-all flex items-center gap-1 cursor-pointer"
                        >
                          {isRollingBack ? (
                            <span>جاري التراجع...</span>
                          ) : (
                            <>
                              <Check className="w-3 h-3" />
                              <span>نعم، تراجع واستعد البيانات</span>
                            </>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowRollbackConfirm(false)}
                          className="px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-bold transition-all cursor-pointer"
                        >
                          إلغاء
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Core Guidance Card */}
              <div className="bg-gradient-to-r from-red-50 via-amber-50 to-orange-50 border border-red-200 p-5 rounded-2xl space-y-3">
                <div className="flex items-center gap-2 text-red-900 font-bold text-base">
                  <Sparkles className="w-5 h-5 text-red-700" />
                  قواعد الترحيل الذكي لملف "منظومة_جوجل_مدمج.xlsx":
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-gray-700">
                  <div className="bg-white/80 p-3 rounded-xl border border-red-100 flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-gray-900">المطابقة بالرقم الوطني: </span>
                      الصفوف المتعددة لنفس الرقم الوطني تعامل كموظف واحد مع عدة حركات وظيفية وتاريخية.
                    </div>
                  </div>
                  <div className="bg-white/80 p-3 rounded-xl border border-red-100 flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-gray-900">حفظ التواريخ الأصلية: </span>
                      يتم حفظ تاريخ الدرجة وتواريخ الاستحقاق كما هي بالملف دون استبدالها بتاريخ اليوم.
                    </div>
                  </div>
                  <div className="bg-white/80 p-3 rounded-xl border border-red-100 flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-gray-900">أرشفة الحركات التاريخية: </span>
                      تحويل كل إجراء (ترقية، علاوة، تسوية، ندب) إلى سجل وظيفي مستقل قابل للطباعة والبحث.
                    </div>
                  </div>
                  <div className="bg-white/80 p-3 rounded-xl border border-red-100 flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-gray-900">نسخة احتياطية فورية: </span>
                      يتم أخذ نسخة كاملة من قاعدة البيانات الحالية تلقائياً قبل حفظ أي تعديلات.
                    </div>
                  </div>
                </div>
              </div>

              {/* Upload Dropzone */}
              <div
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-red-300 hover:border-red-500 bg-red-50/40 hover:bg-red-50/70 transition-all rounded-2xl p-10 text-center cursor-pointer space-y-4"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".xlsx, .xls, .csv"
                  className="hidden"
                />
                <div className="w-16 h-16 bg-white shadow-md text-red-600 rounded-full flex items-center justify-center mx-auto border border-red-100">
                  <Upload className="w-8 h-8" />
                </div>
                <div>
                  <p className="text-base font-bold text-gray-900">
                    اسحب وأفلت ملف الإكسل هنا، أو انقر للاختيار من جهازك
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    يدعم ملفات (.xlsx, .xls, .csv) لملف منظومة جوجل مدمج أو أي ملف يحتوي على 21 عموداً رسمياً
                  </p>
                </div>
              </div>

              {/* Quick Preset Actions */}
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleLoadSampleGoogleMergedData}
                    disabled={isProcessing}
                    className="flex items-center gap-2 px-4 py-2.5 bg-red-700 hover:bg-red-800 text-white rounded-xl text-xs font-bold shadow-sm transition-colors"
                  >
                    <Sparkles className="w-4 h-4" />
                    استيراد مباشر من نموذج (منظومة_جوجل_مدمج.xlsx)
                  </button>
                  <span className="text-xs text-gray-500">
                    (لاختبار ترحيل السجلات المتكررة والحركات التاريخية بنقرة واحدة)
                  </span>
                </div>

                <button
                  onClick={() => downloadSampleExcelWorkbook()}
                  className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-gray-100 text-gray-700 rounded-xl text-xs font-bold border border-gray-300 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  تحميل قالب Excel فارغ مع الأعمدة الرسمية
                </button>
              </div>

            </div>
          )}

          {/* STEP 2: PREVIEW & AUDIT SCREEN */}
          {step === 'preview' && previewData && (
            <div className="space-y-6">

              {/* Summary Statistics Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
                <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl text-center">
                  <div className="text-xs font-bold text-slate-500">صفوف Excel</div>
                  <div className="text-xl font-extrabold text-slate-800 mt-0.5">{previewData.totalExcelRows}</div>
                </div>

                <div className="bg-red-50 border border-red-200 p-3 rounded-xl text-center">
                  <div className="text-xs font-bold text-red-700">موظفون فريدون</div>
                  <div className="text-xl font-extrabold text-red-900 mt-0.5">{previewData.uniqueEmployeesCount}</div>
                </div>

                <div className="bg-blue-50 border border-blue-200 p-3 rounded-xl text-center">
                  <div className="text-xs font-bold text-blue-700">حركات وظيفية</div>
                  <div className="text-xl font-extrabold text-blue-900 mt-0.5">{previewData.totalHistoricalTransactions}</div>
                </div>

                <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl text-center">
                  <div className="text-xs font-bold text-emerald-700">موظفون جدد</div>
                  <div className="text-xl font-extrabold text-emerald-900 mt-0.5">{previewData.newEmployeesCount}</div>
                </div>

                <div className="bg-indigo-50 border border-indigo-200 p-3 rounded-xl text-center">
                  <div className="text-xs font-bold text-indigo-700">تحديث مسجلين</div>
                  <div className="text-xl font-extrabold text-indigo-900 mt-0.5">{previewData.existingEmployeesCount}</div>
                </div>

                <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl text-center">
                  <div className="text-xs font-bold text-amber-700">سجلات مكررة</div>
                  <div className="text-xl font-extrabold text-amber-900 mt-0.5">{previewData.duplicateTransactionsCount}</div>
                </div>

                <div className={`p-3 rounded-xl text-center border ${previewData.flaggedReviewCount > 0 ? 'bg-rose-50 border-rose-200' : 'bg-gray-50 border-gray-200'}`}>
                  <div className={`text-xs font-bold ${previewData.flaggedReviewCount > 0 ? 'text-rose-700' : 'text-gray-500'}`}>يحتاج مراجعة</div>
                  <div className={`text-xl font-extrabold ${previewData.flaggedReviewCount > 0 ? 'text-rose-900' : 'text-gray-800'} mt-0.5`}>
                    {previewData.flaggedReviewCount}
                  </div>
                </div>
              </div>

              {/* Sheet Selector (if multi-sheet) */}
              {sheetNames.length > 1 && (
                <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl border">
                  <span className="text-xs font-bold text-gray-700">ورقة العمل المحددة:</span>
                  <select
                    value={selectedSheet}
                    onChange={(e) => handleSheetChange(e.target.value)}
                    className="p-1.5 bg-white border border-gray-300 rounded-lg text-xs font-bold text-gray-800"
                  >
                    {sheetNames.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Notice Banner */}
              <div className="bg-blue-50 border border-blue-200 text-blue-900 p-3.5 rounded-xl text-xs flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-blue-700 flex-shrink-0" />
                  <div>
                    <span className="font-bold">ضمان سلامة التواريخ: </span>
                    تم استخراج تواريخ الدرجات والقرارات بدقة من الملف، ولن يتم استبدال أي تاريخ بتأريخ اليوم.
                  </div>
                </div>
                {previewData.errors.length > 0 && (
                  <button
                    onClick={() => exportErrorsReport(previewData.errors)}
                    className="flex items-center gap-1.5 px-3 py-1 bg-white hover:bg-blue-100 text-blue-800 rounded-lg border border-blue-300 font-bold transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    تصدير تقرير الملاحظات والأخطاء ({previewData.errors.length})
                  </button>
                )}
              </div>

              {/* Sub-tabs for Preview */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPreviewTab('employees')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                      previewTab === 'employees'
                        ? 'bg-red-700 text-white shadow-sm'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <Users className="w-4 h-4" />
                    سجلات الموظفين الفريدة ({previewData.uniqueEmployeesCount})
                  </button>

                  <button
                    onClick={() => setPreviewTab('career_actions')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                      previewTab === 'career_actions'
                        ? 'bg-blue-700 text-white shadow-sm'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <Layers className="w-4 h-4" />
                    سجل الحركات الوظيفية والترقيات ({previewData.totalHistoricalTransactions})
                  </button>

                  <button
                    onClick={() => setPreviewTab('errors')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                      previewTab === 'errors'
                        ? 'bg-rose-700 text-white shadow-sm'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <AlertCircle className="w-4 h-4" />
                    الملاحظات وتنبيهات التعارض ({previewData.errors.length})
                  </button>

                  {(previewData.unlinkedCareerRecords && previewData.unlinkedCareerRecords.length > 0) && (
                    <button
                      onClick={() => setPreviewTab('unlinked')}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                        previewTab === 'unlinked'
                          ? 'bg-amber-700 text-white shadow-sm'
                          : 'bg-amber-50 text-amber-900 border border-amber-300 hover:bg-amber-100'
                      }`}
                    >
                      <ShieldAlert className="w-4 h-4 text-amber-700" />
                      سجلات محجوبة دون موظف ({previewData.unlinkedCareerRecords.length})
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <input
                    type="text"
                    placeholder="بحث في المعاينة (بالاسم، الرقم الوطني، الدرجة)..."
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    className="p-2 border border-gray-300 rounded-xl text-xs w-full sm:w-64 bg-white focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>

              {/* TAB 1: UNIQUE EMPLOYEES MASTER TABLE */}
              {previewTab === 'employees' && (
                <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                  <div className="overflow-x-auto max-h-80">
                    <table className="w-full text-right text-xs">
                      <thead className="bg-gray-100 text-gray-700 sticky top-0 font-bold border-b">
                        <tr>
                          <th className="p-2.5">رقم الملف</th>
                          <th className="p-2.5">اسم الموظف</th>
                          <th className="p-2.5">الرقم الوطني</th>
                          <th className="p-2.5">الدرجة الحالية</th>
                          <th className="p-2.5">العلاوة</th>
                          <th className="p-2.5">تاريخ الدرجة المحفوظ</th>
                          <th className="p-2.5">القسم</th>
                          <th className="p-2.5">الحركات المؤرشفة</th>
                          <th className="p-2.5 text-center">الحالة</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 bg-white">
                        {filteredEmployeeGroups.length === 0 ? (
                          <tr>
                            <td colSpan={9} className="p-6 text-center text-gray-500">
                              لا توجد سجلات مطابقة لمعايير البحث.
                            </td>
                          </tr>
                        ) : (
                          filteredEmployeeGroups.map((grp) => (
                            <tr key={grp.nationalId} className="hover:bg-gray-50/80 transition-colors">
                              <td className="p-2.5 font-bold text-gray-800">{grp.masterRecord.jobNumber}</td>
                              <td className="p-2.5 font-bold text-gray-900">
                                {grp.masterRecord.fullName}
                                {grp.hasConflicts && (
                                  <span className="block text-[10px] text-amber-700 font-normal">
                                    ⚠️ تعارض في السطور المتعددة
                                  </span>
                                )}
                              </td>
                              <td className="p-2.5 font-mono text-gray-700 font-semibold">{grp.masterRecord.nationalId || '—'}</td>
                              <td className="p-2.5 text-amber-900 font-bold">{grp.masterRecord.jobGrade}</td>
                              <td className="p-2.5 font-bold">{grp.masterRecord.currentIncrement}</td>
                              <td className="p-2.5 font-mono text-gray-800 bg-amber-50/50">
                                {formatDateDisplay(grp.masterRecord.gradeEntryDate) || 'غير محدد'}
                              </td>
                              <td className="p-2.5 text-gray-600 truncate max-w-[140px]">{grp.masterRecord.department}</td>
                              <td className="p-2.5">
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
                                  {grp.historicalActions.length} حركات
                                </span>
                              </td>
                              <td className="p-2.5 text-center">
                                {grp.isExisting ? (
                                  <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-indigo-100 text-indigo-800">
                                    تحديث مسجل
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800">
                                    موظف جديد
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 2: HISTORICAL CAREER TRANSACTIONS TABLE */}
              {previewTab === 'career_actions' && (
                <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                  <div className="overflow-x-auto max-h-80">
                    <table className="w-full text-right text-xs">
                      <thead className="bg-gray-100 text-gray-700 sticky top-0 font-bold border-b">
                        <tr>
                          <th className="p-2.5">سطر</th>
                          <th className="p-2.5">اسم الموظف</th>
                          <th className="p-2.5">الرقم الوطني</th>
                          <th className="p-2.5">نوع الإجراء</th>
                          <th className="p-2.5">الدرجة</th>
                          <th className="p-2.5">العلاوة</th>
                          <th className="p-2.5">تاريخ الإجراء / السريان</th>
                          <th className="p-2.5">رقم وتاريخ القرار</th>
                          <th className="p-2.5">الجهة المصدرة</th>
                          <th className="p-2.5 text-center">الحالة</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 bg-white">
                        {filteredActions.length === 0 ? (
                          <tr>
                            <td colSpan={10} className="p-6 text-center text-gray-500">
                              لا توجد حركات وظيفية مطابقة.
                            </td>
                          </tr>
                        ) : (
                          filteredActions.map((act, idx) => {
                            const meta = getCareerActionMeta(act.actionType);
                            return (
                              <tr key={idx} className={`hover:bg-gray-50/80 transition-colors ${act.isDuplicate ? 'bg-amber-50/30' : ''}`}>
                                <td className="p-2.5 text-gray-500 font-mono">{act.rowNumber}</td>
                                <td className="p-2.5 font-bold text-gray-900">{act.employeeName}</td>
                                <td className="p-2.5 font-mono text-gray-700">{act.nationalId}</td>
                                <td className="p-2.5">
                                  <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${meta.badgeColor}`}>
                                    {meta.label}
                                  </span>
                                </td>
                                <td className="p-2.5 font-bold text-gray-800">{act.newGrade}</td>
                                <td className="p-2.5 font-bold">{act.newIncrement}</td>
                                <td className="p-2.5 font-mono text-gray-900 bg-slate-50">
                                  {formatDateDisplay(act.actionDate) || '—'}
                                </td>
                                <td className="p-2.5 text-gray-700">
                                  <span className="font-bold">{act.decisionNumber || '—'}</span>
                                  {act.decisionDate && <span className="text-[10px] text-gray-500 block font-mono">بتاريخ: {formatDateDisplay(act.decisionDate)}</span>}
                                </td>
                                <td className="p-2.5 text-gray-600 truncate max-w-[120px]">{act.issuingAuthority}</td>
                                <td className="p-2.5 text-center">
                                  {act.isDuplicate ? (
                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                                      سجل مكرر
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                      صالح للترحيل
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
                </div>
              )}

              {/* TAB 3: ERRORS & CONFLICT AUDIT TABLE */}
              {previewTab === 'errors' && (
                <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                  <div className="overflow-x-auto max-h-80">
                    <table className="w-full text-right text-xs">
                      <thead className="bg-gray-100 text-gray-700 sticky top-0 font-bold border-b">
                        <tr>
                          <th className="p-2.5">رقم السطر</th>
                          <th className="p-2.5">الرقم الوطني</th>
                          <th className="p-2.5">اسم الموظف</th>
                          <th className="p-2.5">نوع التنبيه</th>
                          <th className="p-2.5">التفاصيل والوصف</th>
                          <th className="p-2.5">الإجراء الموصى به</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 bg-white">
                        {previewData.errors.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="p-8 text-center text-emerald-700 font-bold">
                              <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-600 mb-2" />
                              ممتاز! لا توجد أي أخطاء أو تعارضات في البيانات المفحوصة.
                            </td>
                          </tr>
                        ) : (
                          previewData.errors.map((err, idx) => (
                            <tr key={idx} className="hover:bg-rose-50/30 transition-colors">
                              <td className="p-2.5 font-mono text-gray-600">{err.rowNumber}</td>
                              <td className="p-2.5 font-mono text-gray-800">{err.nationalId}</td>
                              <td className="p-2.5 font-bold text-gray-900">{err.employeeName}</td>
                              <td className="p-2.5">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  err.errorType === 'خطأ حرج' ? 'bg-red-100 text-red-800' :
                                  err.errorType === 'تنبيه تعارض' ? 'bg-amber-100 text-amber-800' :
                                  'bg-slate-100 text-slate-800'
                                }`}>
                                  {err.errorType}
                                </span>
                              </td>
                              <td className="p-2.5 text-gray-800">{err.description}</td>
                              <td className="p-2.5 text-blue-800 font-semibold">{err.recommendedAction}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 4: UNLINKED RECORDS (PREVENTED FROM FAKE EMPLOYEE CREATION) */}
              {previewTab === 'unlinked' && (
                <div className="space-y-3">
                  <div className="bg-amber-50 border border-amber-300 p-3 rounded-xl text-xs text-amber-900 flex items-start gap-2">
                    <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">حظر توليد الموظفين الوهميين: </span>
                      الصفوف التالية تحتوي على حركات وظيفية أو بيانات ولكن بدون اسم موظف حقيقي ومعتمد (أو تحمل نصوصاً وهمية مثل "موظف غير معرف"). 
                      قام النظام بمنع إنشاء سجلات موظفين أو أرقام وطنية وهمية لها تلقائياً لضمان سلامة قاعدة البيانات.
                    </div>
                  </div>

                  <div className="border border-amber-200 rounded-xl overflow-hidden shadow-sm">
                    <div className="overflow-x-auto max-h-80">
                      <table className="w-full text-right text-xs">
                        <thead className="bg-amber-100 text-amber-900 sticky top-0 font-bold border-b border-amber-200">
                          <tr>
                            <th className="p-2.5">رقم السطر بالإكسل</th>
                            <th className="p-2.5">الاسم الوارد بالملف</th>
                            <th className="p-2.5">الرقم الوطني بالملف</th>
                            <th className="p-2.5">نوع الحركة</th>
                            <th className="p-2.5">الدرجة / العلاوة</th>
                            <th className="p-2.5">تاريخ الإجراء</th>
                            <th className="p-2.5">سبب الحجب وعدم الإنشاء</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-amber-100 bg-white">
                          {(!previewData.unlinkedCareerRecords || previewData.unlinkedCareerRecords.length === 0) ? (
                            <tr>
                              <td colSpan={7} className="p-6 text-center text-gray-500">
                                لا توجد صفوف غير مرتبطة.
                              </td>
                            </tr>
                          ) : (
                            previewData.unlinkedCareerRecords.map((unlinked, idx) => (
                              <tr key={idx} className="hover:bg-amber-50/50 transition-colors">
                                <td className="p-2.5 font-mono font-bold text-amber-900">{unlinked.rawRowNumber}</td>
                                <td className="p-2.5 font-bold text-gray-700">{unlinked.rawEmployeeName || '— (فارغ)'}</td>
                                <td className="p-2.5 font-mono text-gray-600">{unlinked.rawNationalId || '—'}</td>
                                <td className="p-2.5 text-gray-800">{unlinked.careerRecord.actionType}</td>
                                <td className="p-2.5 font-semibold text-gray-800">
                                  {unlinked.careerRecord.newGrade} (علاوة {unlinked.careerRecord.newIncrement})
                                </td>
                                <td className="p-2.5 font-mono text-gray-700">{formatDateDisplay(unlinked.careerRecord.actionDate) || '—'}</td>
                                <td className="p-2.5 text-amber-800 font-medium">{unlinked.reason}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* STEP 3: SUCCESS SCREEN */}
          {step === 'success' && commitResult && (
            <div className="space-y-6 py-4 text-center">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto border-2 border-emerald-300">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-bold text-gray-900">
                  اكتمل ترحيل واستيراد البيانات التاريخية بنجاح!
                </h3>
                <p className="text-xs text-gray-600 max-w-lg mx-auto">
                  تم دمج بيانات الموظفين بالرقم الوطني بنجاح، وتوثيق سجلات الترقيات والعلاوات في الأرشيف الوظيفي المعتمد.
                </p>
              </div>

              {/* Result Statistics */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-2xl mx-auto text-center">
                <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl">
                  <div className="text-xs text-emerald-700 font-bold">موظفون جدد تم تسجيلهم</div>
                  <div className="text-2xl font-extrabold text-emerald-900 mt-1">{commitResult.importedEmployeesCount}</div>
                </div>

                <div className="bg-indigo-50 border border-indigo-200 p-4 rounded-xl">
                  <div className="text-xs text-indigo-700 font-bold">موظفون محدثون</div>
                  <div className="text-2xl font-extrabold text-indigo-900 mt-1">{commitResult.updatedEmployeesCount}</div>
                </div>

                <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl">
                  <div className="text-xs text-blue-700 font-bold">سجلات ترقيات وعلاوات مؤرشفة</div>
                  <div className="text-2xl font-extrabold text-blue-900 mt-1">{commitResult.importedHistoricalRecordsCount}</div>
                </div>
              </div>

              {/* Backup Info */}
              {commitResult.backupCreated && (
                <div className="bg-gray-50 border border-gray-200 p-3.5 rounded-xl max-w-2xl mx-auto text-xs text-gray-700 flex items-center justify-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                  <div>
                    <span className="font-bold text-gray-900">تم إنشاء نسخة احتياطية تلقائية آمنة: </span>
                    <span className="font-mono text-gray-600">{commitResult.backupKey}</span>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-center gap-3 pt-4 border-t">
                {onNavigateToTab && (
                  <button
                    onClick={() => {
                      onClose();
                      onNavigateToTab('promotions_increments');
                    }}
                    className="px-5 py-2.5 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-bold shadow-sm transition-colors flex items-center gap-2"
                  >
                    <Layers className="w-4 h-4" />
                    عرض سجل الترقيات والعلاوات الوظيفية
                  </button>
                )}

                <button
                  onClick={onClose}
                  className="px-6 py-2.5 bg-gray-800 hover:bg-gray-900 text-white rounded-xl text-xs font-bold transition-colors"
                >
                  إغلاق ومتابعة العمل
                </button>
              </div>

            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="border-t pt-4 flex items-center justify-between flex-shrink-0">
          {step === 'upload' && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">
                المصدر: ملفات Excel الرسمية لمنظومة الموارد البشرية
              </span>
            </div>
          )}

          {step === 'preview' && (
            <div className="flex items-center gap-2">
              <button
                onClick={handleReset}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                اختيار ملف آخر
              </button>
            </div>
          )}

          <div className="flex items-center gap-2 mr-auto">
            {step === 'preview' && (
              <button
                onClick={handleConfirmMigration}
                disabled={isProcessing}
                className="px-6 py-2.5 bg-red-700 hover:bg-red-800 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-2"
              >
                {isProcessing ? (
                  <>جاري إنشاء النسخة الاحتياطية وترحيل البيانات...</>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    اعتماد الترحيل وحفظ السجلات ({previewData?.uniqueEmployeesCount} موظف • {previewData?.totalHistoricalTransactions} حركة)
                  </>
                )}
              </button>
            )}

            <button
              onClick={onClose}
              className="px-4 py-2 bg-white hover:bg-gray-100 text-gray-700 border border-gray-300 rounded-xl text-xs font-bold transition-colors"
            >
              إلغاء
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
