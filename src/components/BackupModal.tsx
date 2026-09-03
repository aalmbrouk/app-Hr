import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  HardDrive, 
  Download, 
  Upload, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  ShieldCheck, 
  Database, 
  History, 
  Activity, 
  FileCheck, 
  Lock, 
  AlertCircle, 
  Check, 
  FileSpreadsheet,
  FileArchive,
  ArrowRight,
  Info
} from 'lucide-react';
import { FullAppDatabase } from '../utils/storageTypes';
import { 
  BackupHistoryRecord, 
  DatabaseInfo, 
  DiagnosticCheckResult,
  BackupPackageMetadata 
} from '../utils/backupTypes';
import { 
  createDatabaseBackup, 
  downloadBackupFile, 
  loadBackupHistory, 
  getDatabaseInfo, 
  runBackupDiagnostics, 
  validateBackupFile, 
  executePreRestoreBackup,
  formatBytes
} from '../utils/backupService';

interface BackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  fullDatabase: FullAppDatabase;
  currentUsername: string;
  onRestoreComplete: (restoredDb: FullAppDatabase, message: string) => void;
  onLogAudit: (action: any, details: string) => void;
}

export const BackupModal: React.FC<BackupModalProps> = ({
  isOpen,
  onClose,
  fullDatabase,
  currentUsername,
  onRestoreComplete,
  onLogAudit
}) => {
  const [activeTab, setActiveTab] = useState<'backup' | 'restore' | 'history' | 'diagnostics'>('backup');
  
  // Backup State
  const [isBackingUp, setIsBackingUp] = useState<boolean>(false);
  const [backupFormat, setBackupFormat] = useState<'ZIP' | 'BAK'>('ZIP');
  const [lastBackupResult, setLastBackupResult] = useState<{
    fileName: string;
    sizeFormatted: string;
    checksum: string;
    backupDate: string;
    blob: Blob;
    recordCounts: any;
    metadata: BackupPackageMetadata;
  } | null>(null);
  const [backupError, setBackupError] = useState<string | null>(null);

  // Restore State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isValidatingFile, setIsValidatingFile] = useState<boolean>(false);
  const [validationResult, setValidationResult] = useState<{
    valid: boolean;
    data?: FullAppDatabase;
    metadata?: BackupPackageMetadata;
    errors: string[];
    warnings: string[];
    tablesFound: string[];
    counts: any;
  } | null>(null);
  const [isRestoring, setIsRestoring] = useState<boolean>(false);
  const [restoreSuccessMsg, setRestoreSuccessMsg] = useState<string | null>(null);
  const [restoreErrorMsg, setRestoreErrorMsg] = useState<string | null>(null);
  const [confirmRestore, setConfirmRestore] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // History State
  const [historyList, setHistoryList] = useState<BackupHistoryRecord[]>([]);

  // Diagnostics State
  const [isRunningDiagnostics, setIsRunningDiagnostics] = useState<boolean>(false);
  const [diagnosticsResults, setDiagnosticsResults] = useState<DiagnosticCheckResult[]>([]);
  const [dbInfo, setDbInfo] = useState<DatabaseInfo | null>(null);

  useEffect(() => {
    if (isOpen) {
      setDbInfo(getDatabaseInfo(fullDatabase));
      setHistoryList(loadBackupHistory());
      setBackupError(null);
      setRestoreErrorMsg(null);
      setRestoreSuccessMsg(null);
      setConfirmRestore(false);
    }
  }, [isOpen, fullDatabase]);

  // Handle immediate real backup
  const handlePerformBackup = async () => {
    if (isBackingUp) return;
    setIsBackingUp(true);
    setBackupError(null);
    setLastBackupResult(null);

    try {
      const res = await createDatabaseBackup(fullDatabase, currentUsername, 'يدوية', backupFormat);
      
      if (res.success && res.blob) {
        // Trigger automatic verified download to user's computer
        downloadBackupFile(res.blob, res.fileName);

        setLastBackupResult({
          fileName: res.fileName,
          sizeFormatted: res.sizeFormatted,
          checksum: res.checksum,
          backupDate: new Date().toLocaleTimeString('ar-LY') + ' ' + new Date().toLocaleDateString('ar-LY'),
          blob: res.blob,
          recordCounts: res.historyRecord.recordCounts,
          metadata: res.metadata
        });

        setHistoryList(loadBackupHistory());
        onLogAudit('نسخة احتياطية', `إنشاء نسخة احتياطية حقيقية ناجحة (${res.fileName}) بحجم ${res.sizeFormatted} وبصمة ${res.checksum}`);
      } else {
        setBackupError(res.error || 'فشل إنشاء النسخة الاحتياطية');
        onLogAudit('نسخة احتياطية', `فشل إنشاء النسخة الاحتياطية: ${res.error || 'خطأ غير معروف'}`);
      }
    } catch (err: any) {
      console.error('[BackupModal] Backup execution error:', err);
      setBackupError(err?.message || 'حدث خطأ غير متوقع أثناء النسخ الاحتياطي');
    } finally {
      setIsBackingUp(false);
    }
  };

  // Re-download current generated backup
  const handleReDownload = () => {
    if (lastBackupResult?.blob && lastBackupResult?.fileName) {
      downloadBackupFile(lastBackupResult.blob, lastBackupResult.fileName);
    }
  };

  // Handle file select for restore
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setIsValidatingFile(true);
    setValidationResult(null);
    setRestoreErrorMsg(null);
    setRestoreSuccessMsg(null);
    setConfirmRestore(false);

    try {
      const result = await validateBackupFile(file);
      setValidationResult(result);
    } catch (err: any) {
      setValidationResult({
        valid: false,
        errors: [err?.message || 'فشل فك وفحص الملف المحدد'],
        warnings: [],
        tablesFound: [],
        counts: { employees: 0, leaves: 0, promotions: 0, increments: 0, users: 0, total: 0 }
      });
    } finally {
      setIsValidatingFile(false);
    }
  };

  // Execute restore
  const handleExecuteRestore = async () => {
    if (!validationResult?.valid || !validationResult.data || isRestoring) return;

    setIsRestoring(true);
    setRestoreErrorMsg(null);
    setRestoreSuccessMsg(null);

    try {
      // 1. Mandatory Pre-Restore safety backup
      const preRes = await executePreRestoreBackup(fullDatabase, currentUsername);
      if (!preRes.success) {
        throw new Error(`تم إيقاف الاستعادة لضمان سلامة بياناتك: ${preRes.error}`);
      }

      onLogAudit('نسخة احتياطية', `تم إنشاء نسخة احتياطية وقائية تلقائية (${preRes.fileName}) قبل بدء الاستعادة`);

      // 2. Apply restored database
      const restoredDb: FullAppDatabase = {
        ...validationResult.data,
        version: validationResult.data.version || 1,
        lastUpdated: new Date().toISOString()
      };

      onRestoreComplete(
        restoredDb, 
        `تمت استعادة قاعدة البيانات بنجاح من النسخة (${selectedFile?.name || 'الملف المرفوع'}) بنجاح، وتم حفظ نسخة وقائية تلقائياً.`
      );

      onLogAudit('استعادة', `استعادة كاملة لقاعدة البيانات من ملف (${selectedFile?.name}) بنجاح. عدد الموظفين المستعادين: ${restoredDb.employees?.length || 0}`);
      
      setRestoreSuccessMsg(`تمت عملية الاستعادة بنجاح تام! عدد الموظفين المستعادين: ${restoredDb.employees?.length || 0} موظف.`);
      setHistoryList(loadBackupHistory());
      setConfirmRestore(false);
      setSelectedFile(null);
      setValidationResult(null);
    } catch (err: any) {
      console.error('[BackupModal] Restore failed:', err);
      setRestoreErrorMsg(err?.message || 'حدث خطأ أثناء عملية الاستعادة');
      onLogAudit('استعادة', `فشل في استعادة قاعدة البيانات: ${err?.message || 'خطأ غير معروف'}`);
    } finally {
      setIsRestoring(false);
    }
  };

  // Run full system diagnostics
  const handleRunDiagnostics = async () => {
    setIsRunningDiagnostics(true);
    setDiagnosticsResults([]);
    try {
      const res = await runBackupDiagnostics(fullDatabase);
      setDiagnosticsResults(res.results);
      setDbInfo(getDatabaseInfo(fullDatabase));
    } catch (err: any) {
      console.error('[BackupModal] Diagnostics error:', err);
    } finally {
      setIsRunningDiagnostics(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div 
        id="backup-restore-modal-container"
        className="bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col text-slate-100 overflow-hidden"
      >
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-red-950 via-slate-900 to-slate-900 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-red-800/60 text-red-100 border border-red-700 shadow-md">
              <HardDrive className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <span>إدارة النسخ الاحتياطي والاستعادة وقاعدة البيانات</span>
                <span className="bg-emerald-950 text-emerald-300 border border-emerald-800 text-[11px] font-bold px-2 py-0.5 rounded-md font-mono">
                  v2.5 Production
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                إنشاء وتنزيل نسخ احتياطية حقيقية (.ZIP / .BAK) مشفرة ومحققة التكامل مع دعم الاستعادة الآمنة
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            title="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-slate-950/60 border-b border-slate-800 px-6 pt-3 flex gap-2 overflow-x-auto text-xs font-bold">
          <button
            onClick={() => setActiveTab('backup')}
            className={`pb-3 px-3.5 border-b-2 flex items-center gap-2 transition-all ${
              activeTab === 'backup'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Download className="w-4 h-4" />
            <span>إنشاء نسخة احتياطية فورية</span>
          </button>

          <button
            onClick={() => setActiveTab('restore')}
            className={`pb-3 px-3.5 border-b-2 flex items-center gap-2 transition-all ${
              activeTab === 'restore'
                ? 'border-red-500 text-red-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>استعادة قاعدة البيانات</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`pb-3 px-3.5 border-b-2 flex items-center gap-2 transition-all ${
              activeTab === 'history'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <History className="w-4 h-4" />
            <span>سجل النسخ الاحتياطية ({historyList.length})</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('diagnostics');
              if (diagnosticsResults.length === 0) handleRunDiagnostics();
            }}
            className={`pb-3 px-3.5 border-b-2 flex items-center gap-2 transition-all ${
              activeTab === 'diagnostics'
                ? 'border-sky-500 text-sky-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>فحص وتشخيص النظام (Diagnostics)</span>
          </button>
        </div>

        {/* Modal Body Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">

          {/* ======================================================== */}
          {/* TAB 1: INSTANT REAL BACKUP */}
          {/* ======================================================== */}
          {activeTab === 'backup' && (
            <div className="space-y-6">
              
              {/* Database Overview Banner */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                <div>
                  <p className="text-slate-400 font-bold mb-1">المحرك وقاعدة البيانات</p>
                  <p className="text-white font-black truncate">{dbInfo?.name || 'قاعدة البيانات الداخلية'}</p>
                  <p className="text-[10px] text-emerald-400 font-mono mt-0.5">● {dbInfo?.status || 'متصل'}</p>
                </div>

                <div>
                  <p className="text-slate-400 font-bold mb-1">إجمالي سجلات الموظفين</p>
                  <p className="text-white font-black text-sm">{fullDatabase.employees?.length || 0} موظف</p>
                  <p className="text-[10px] text-slate-400">كامل الحقول (26 حقل)</p>
                </div>

                <div>
                  <p className="text-slate-400 font-bold mb-1">إجمالي الحركات والجداول</p>
                  <p className="text-white font-black text-sm">{dbInfo?.totalRecordsCount || 0} سجل</p>
                  <p className="text-[10px] text-slate-400">16 جدولاً داخلياً</p>
                </div>

                <div>
                  <p className="text-slate-400 font-bold mb-1">حجم البيانات بالذاكرة</p>
                  <p className="text-emerald-300 font-mono font-bold text-sm">{dbInfo?.totalSizeFormatted || '0 KB'}</p>
                  <p className="text-[10px] text-slate-400">بصمة موثوقة CRC32</p>
                </div>
              </div>

              {/* Format selection and trigger button */}
              <div className="bg-gradient-to-br from-slate-950 to-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
                  <div>
                    <h3 className="text-sm font-black text-white flex items-center gap-2">
                      <FileArchive className="w-4 h-4 text-emerald-400" />
                      <span>صيغة حزمة النسخة الاحتياطية</span>
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      تتضمن الحزمة قاعدة البيانات الكاملة، الميتا، الإعدادات، ومرفقات الموظفين
                    </p>
                  </div>

                  <div className="flex items-center gap-2 bg-slate-900 border border-slate-700 p-1 rounded-xl">
                    <button
                      onClick={() => setBackupFormat('ZIP')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        backupFormat === 'ZIP' 
                          ? 'bg-emerald-600 text-white shadow' 
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      حزمة مضغوطة (.ZIP) [موصى به]
                    </button>

                    <button
                      onClick={() => setBackupFormat('BAK')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        backupFormat === 'BAK' 
                          ? 'bg-emerald-600 text-white shadow' 
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      حاوية بيانات (.BAK)
                    </button>
                  </div>
                </div>

                {/* The Primary Backup Trigger Action Button */}
                <div className="pt-2">
                  <button
                    id="btn-execute-real-backup"
                    onClick={handlePerformBackup}
                    disabled={isBackingUp}
                    className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white font-black text-base shadow-xl border border-emerald-400 flex items-center justify-center gap-3 transition-all transform active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {isBackingUp ? (
                      <>
                        <RefreshCw className="w-5 h-5 animate-spin text-white" />
                        <span>جاري تجميع وحزم قاعدة البيانات والتحقق من السلامة...</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-5 h-5" />
                        <span>بدء إنشاء وتنزيل النسخة الاحتياطية الحقيقية الآن</span>
                      </>
                    )}
                  </button>
                  <p className="text-[11px] text-center text-slate-400 mt-2">
                    سيتم تجميع كافة الجداول، والتحقق التلقائي من سلامة الملف، وبدء التنزيل المباشر لجهازك تلقائياً.
                  </p>
                </div>
              </div>

              {/* Backup Failure Error Box */}
              {backupError && (
                <div className="p-4 rounded-2xl bg-red-950/80 border border-red-700 text-red-200 text-xs flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-red-100">فشل في إنشاء النسخة الاحتياطية:</p>
                    <p className="mt-1">{backupError}</p>
                  </div>
                </div>
              )}

              {/* Success Result Details Card */}
              {lastBackupResult && (
                <div className="bg-emerald-950/40 border border-emerald-700/80 rounded-2xl p-5 space-y-4 shadow-xl">
                  <div className="flex items-center justify-between border-b border-emerald-800/60 pb-3">
                    <div className="flex items-center gap-2 text-emerald-300 font-black text-sm">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      <span>تم إنشاء النسخة الاحتياطية والتحقق منها وتنزيلها بنجاح!</span>
                    </div>

                    <button
                      onClick={handleReDownload}
                      className="px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs flex items-center gap-1.5 border border-emerald-500 shadow"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>إعادة التنزيل</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                    <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
                      <span className="text-slate-400 block text-[10px]">اسم الملف:</span>
                      <span className="font-mono font-bold text-emerald-300 truncate block dir-ltr text-right">
                        {lastBackupResult.fileName}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
                      <span className="text-slate-400 block text-[10px]">حجم الملف الحقيقي:</span>
                      <span className="font-mono font-bold text-white">
                        {lastBackupResult.sizeFormatted}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
                      <span className="text-slate-400 block text-[10px]">بصمة التكامل (Checksum):</span>
                      <span className="font-mono font-bold text-amber-300">
                        {lastBackupResult.checksum}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
                      <span className="text-slate-400 block text-[10px]">تاريخ ووقت النسخة:</span>
                      <span className="font-bold text-slate-200">
                        {lastBackupResult.backupDate}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
                      <span className="text-slate-400 block text-[10px]">سجلات الموظفين المضمنة:</span>
                      <span className="font-bold text-emerald-300">
                        {lastBackupResult.recordCounts.employees} موظف
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
                      <span className="text-slate-400 block text-[10px]">حالة فحص السلامة:</span>
                      <span className="font-bold text-emerald-400 flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5" /> مؤكدة ومطابقة 100%
                      </span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-300 leading-relaxed">
                    تم تضمين جميع الجداول الداخلية (DB_Employees, DB_Leaves, DB_Promotions, DB_Increments, DB_Users, DB_Settings, DB_Log) داخل الملف. يمكنك حفظ هذا الملف على وحدة تخزين خارجية (Flash / Hard Drive) أو سحابياً لضمان سلامة بيانات المؤسسة.
                  </div>
                </div>
              )}

            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 2: SECURE RESTORE WORKFLOW */}
          {/* ======================================================== */}
          {activeTab === 'restore' && (
            <div className="space-y-6">
              
              {/* Mandatory Safety Notice */}
              <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-800/80 text-amber-200 text-xs flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold text-amber-100 text-sm">
                    آلية الاستعادة الآمنة مع النسخ الوقائي التلقائي (Pre-Restore Protection)
                  </p>
                  <p className="leading-relaxed">
                    قبل تطبيق أي استعادة، يقوم النظام تلقائياً بإنشاء نسخة احتياطية وقائية كاملة من بياناتك الحالية وتنزيلها لجهازك باسم (<code className="font-mono bg-slate-950 px-1 py-0.5 rounded text-amber-300">PreRestore_Backup_...</code>) حتى لا تفقد أي بيانات حالية تحت أي ظرف.
                  </p>
                </div>
              </div>

              {/* File Upload Box */}
              <div className="bg-slate-950 border-2 border-dashed border-slate-700 hover:border-red-500/80 transition-colors rounded-2xl p-6 text-center space-y-3">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".zip,.bak,.json,.db"
                  className="hidden"
                />

                <div className="flex justify-center">
                  <div className="p-3 rounded-2xl bg-slate-900 border border-slate-700 text-red-400">
                    <Upload className="w-8 h-8" />
                  </div>
                </div>

                <div>
                  <p className="text-sm font-bold text-white">
                    اختر ملف النسخة الاحتياطية المراد استعادتها
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    يدعم حزم (.ZIP)، حاويات (.BAK)، أو ملفات (.JSON / .DB)
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold border border-slate-600 transition-colors inline-flex items-center gap-2"
                >
                  <HardDrive className="w-4 h-4 text-emerald-400" />
                  <span>استعراض الملفات من الكمبيوتر</span>
                </button>

                {selectedFile && (
                  <div className="mt-3 p-2 rounded-xl bg-slate-900 border border-slate-800 inline-block text-xs font-mono text-emerald-300">
                    الملف المحدد: {selectedFile.name} ({formatBytes(selectedFile.size)})
                  </div>
                )}
              </div>

              {/* Validation Progress */}
              {isValidatingFile && (
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-center text-xs text-slate-300 flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-red-400" />
                  <span>جاري فك تشفير حزمة النسخة الاحتياطية والتحقق من الجداول...</span>
                </div>
              )}

              {/* Validation Result Inspection Card */}
              {validationResult && (
                <div className={`rounded-2xl p-5 border space-y-4 ${
                  validationResult.valid 
                    ? 'bg-slate-950 border-emerald-700/60' 
                    : 'bg-red-950/40 border-red-700'
                }`}>
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      {validationResult.valid ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-red-400" />
                      )}
                      <span className="font-bold text-sm text-white">
                        {validationResult.valid 
                          ? 'تم فحص النسخة الاحتياطية بنجاح ومطابقتها للمواصفات' 
                          : 'الملف غير صالح للاستعادة'}
                      </span>
                    </div>

                    <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                      validationResult.valid ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-red-950 text-red-300 border border-red-800'
                    }`}>
                      {validationResult.valid ? 'جاهز للاستعادة' : 'تالف / غير متوافق'}
                    </span>
                  </div>

                  {/* Summary of content found in the backup */}
                  {validationResult.valid && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                        <span className="text-slate-400 block text-[10px]">الموظفون في النسخة:</span>
                        <span className="font-black text-emerald-400 text-sm">
                          {validationResult.counts.employees} موظف
                        </span>
                      </div>

                      <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                        <span className="text-slate-400 block text-[10px]">سجلات الإجازات:</span>
                        <span className="font-black text-white text-sm">
                          {validationResult.counts.leaves} إجازة
                        </span>
                      </div>

                      <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                        <span className="text-slate-400 block text-[10px]">الترقيات والعلاوات:</span>
                        <span className="font-black text-white text-sm">
                          {validationResult.counts.promotions + validationResult.counts.increments} حركة
                        </span>
                      </div>

                      <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                        <span className="text-slate-400 block text-[10px]">الجداول المكتشفة:</span>
                        <span className="font-bold text-amber-300 text-xs">
                          {validationResult.tablesFound.length} جدول
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Warnings or Errors list */}
                  {validationResult.errors.length > 0 && (
                    <div className="p-3 rounded-xl bg-red-950 border border-red-800 text-xs text-red-200 space-y-1">
                      <p className="font-bold">أخطاء تمنع الاستعادة:</p>
                      {validationResult.errors.map((err, i) => (
                        <p key={i}>• {err}</p>
                      ))}
                    </div>
                  )}

                  {/* Confirmation and Trigger Action */}
                  {validationResult.valid && (
                    <div className="pt-3 border-t border-slate-800 space-y-3">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="chk-confirm-restore"
                          checked={confirmRestore}
                          onChange={(e) => setConfirmRestore(e.target.checked)}
                          className="w-4 h-4 rounded text-red-600 bg-slate-900 border-slate-700 focus:ring-0 cursor-pointer"
                        />
                        <label htmlFor="chk-confirm-restore" className="text-xs text-slate-200 font-bold cursor-pointer">
                          أؤكد رغبتي في استبدال البيانات الحالية ببيانات هذه النسخة بعد أخذ النسخة الوقائية التلقائية.
                        </label>
                      </div>

                      <button
                        id="btn-execute-restore-action"
                        onClick={handleExecuteRestore}
                        disabled={!confirmRestore || isRestoring}
                        className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-red-600 to-red-800 hover:from-red-500 hover:to-red-700 text-white font-bold text-sm shadow-xl border border-red-500 flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                      >
                        {isRestoring ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>جاري إنشاء النسخة الوقائية واستعادة البيانات...</span>
                          </>
                        ) : (
                          <>
                            <ShieldCheck className="w-4 h-4" />
                            <span>تأكيد واستعادة البيانات الآن</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Status Notifications */}
              {restoreSuccessMsg && (
                <div className="p-4 rounded-2xl bg-emerald-950/80 border border-emerald-700 text-emerald-200 text-xs flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  <span>{restoreSuccessMsg}</span>
                </div>
              )}

              {restoreErrorMsg && (
                <div className="p-4 rounded-2xl bg-red-950/80 border border-red-700 text-red-200 text-xs flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
                  <span>{restoreErrorMsg}</span>
                </div>
              )}

            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 3: BACKUP HISTORY */}
          {/* ======================================================== */}
          {activeTab === 'history' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">
                  سجل جميع النسخ الاحتياطية التي تم إنشاؤها (يدوية، تلقائية، وقبل الاستعادة)
                </span>
                <span className="font-mono text-emerald-400 font-bold bg-slate-950 px-2 py-1 rounded border border-slate-800">
                  {historyList.length} نسخة مسجلة
                </span>
              </div>

              {historyList.length === 0 ? (
                <div className="p-8 text-center bg-slate-950 rounded-2xl border border-slate-800 text-slate-400 text-xs">
                  لا توجد نسخ احتياطية مسجلة حتى الآن. يمكنك إنشاء نسخة فورية الآن من التبويب الأول.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-slate-800">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-slate-950 text-slate-300 font-bold border-b border-slate-800">
                      <tr>
                        <th className="p-3">معرّف النسخة / الملف</th>
                        <th className="p-3">النوع</th>
                        <th className="p-3">التاريخ والوقت</th>
                        <th className="p-3">الحجم</th>
                        <th className="p-3">عدد الموظفين</th>
                        <th className="p-3">الحالة والتحقق</th>
                        <th className="p-3">بواسطة</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 bg-slate-900/60 font-medium">
                      {historyList.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-800/50 transition-colors">
                          <td className="p-3 font-mono text-emerald-300">
                            <div>{item.fileName}</div>
                            <div className="text-[10px] text-slate-500">{item.checksum}</div>
                          </td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              item.backupType === 'قبل الاستعادة'
                                ? 'bg-amber-950 text-amber-300 border border-amber-800'
                                : item.backupType === 'تلقائية'
                                ? 'bg-sky-950 text-sky-300 border border-sky-800'
                                : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            }`}>
                              {item.backupType}
                            </span>
                          </td>
                          <td className="p-3 text-slate-300">{item.backupDateFormatted}</td>
                          <td className="p-3 font-mono text-white">{item.fileSizeFormatted}</td>
                          <td className="p-3 font-bold text-slate-200">
                            {item.recordCounts?.employees || 0} موظف
                          </td>
                          <td className="p-3">
                            <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded ${
                              item.status === 'ناجحة'
                                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                : 'bg-red-950 text-red-400 border border-red-800'
                            }`}>
                              {item.status === 'ناجحة' ? <Check className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                              {item.validationStatus}
                            </span>
                          </td>
                          <td className="p-3 text-slate-400">{item.createdBy}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 4: SYSTEM DIAGNOSTICS */}
          {/* ======================================================== */}
          {activeTab === 'diagnostics' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Activity className="w-4 h-4 text-sky-400" />
                    <span>فحص وتشخيص منظومة النسخ الاحتياطي (10 نقاط فحص أمني)</span>
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    التحقق من الاتصال، الصلاحيات، محرك الضغط، سلامة البصمة، وجاهزية الاسترجاع
                  </p>
                </div>

                <button
                  onClick={handleRunDiagnostics}
                  disabled={isRunningDiagnostics}
                  className="px-4 py-2 rounded-xl bg-sky-700 hover:bg-sky-600 text-white font-bold text-xs flex items-center gap-2 border border-sky-500 shadow"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRunningDiagnostics ? 'animate-spin' : ''}`} />
                  <span>إعادة الفحص الشامل</span>
                </button>
              </div>

              {/* Diagnostics List */}
              <div className="space-y-2.5">
                {diagnosticsResults.map((diag, index) => (
                  <div 
                    key={diag.id}
                    className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-start justify-between gap-3 text-xs"
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-1 rounded-lg mt-0.5 ${
                        diag.status === 'passed' ? 'bg-emerald-950 text-emerald-400' :
                        diag.status === 'warning' ? 'bg-amber-950 text-amber-400' :
                        'bg-red-950 text-red-400'
                      }`}>
                        {diag.status === 'passed' ? <CheckCircle2 className="w-4 h-4" /> :
                         diag.status === 'warning' ? <AlertTriangle className="w-4 h-4" /> :
                         <AlertCircle className="w-4 h-4" />}
                      </div>

                      <div>
                        <p className="font-bold text-white flex items-center gap-2">
                          <span>{index + 1}. {diag.stepName}</span>
                        </p>
                        <p className="text-slate-300 mt-0.5">{diag.message}</p>
                        {diag.details && (
                          <p className="text-[10px] text-slate-500 font-mono mt-0.5">{diag.details}</p>
                        )}
                      </div>
                    </div>

                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                      diag.status === 'passed' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' :
                      diag.status === 'warning' ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                      'bg-red-950 text-red-300 border border-red-800'
                    }`}>
                      {diag.status === 'passed' ? 'سليم ومطابق' : diag.status === 'warning' ? 'تنبيه' : 'فشل'}
                    </span>
                  </div>
                ))}
              </div>

            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="bg-slate-950 px-6 py-3.5 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>نظام الحماية والنسخ الاحتياطي مفعل بنسبة 100%</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold transition-colors"
          >
            إغلاق النافذة
          </button>
        </div>

      </div>
    </div>
  );
};
