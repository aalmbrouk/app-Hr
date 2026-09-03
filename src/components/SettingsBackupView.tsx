import React, { useState, useEffect } from 'react';
import { SystemSettings, AuditLog, UserAccount, AppointmentGradeConfig, AppointmentSalarySystem } from '../types';
import { 
  HardDrive, 
  ShieldCheck, 
  Database, 
  FolderOpen, 
  Save, 
  RefreshCw, 
  Lock, 
  CheckCircle2, 
  Download, 
  Upload,
  AlertCircle, 
  Activity, 
  History,
  FileCheck,
  Check,
  AlertTriangle,
  Trash2,
  ShieldAlert,
  AlertOctagon,
  Award,
  Plus,
  Edit2,
  SlidersHorizontal,
  RotateCcw,
  Info
} from 'lucide-react';
import { DEFAULT_APPOINTMENT_GRADE_CONFIGS } from '../data/initialData';
import { FullAppDatabase } from '../utils/storageTypes';
import { 
  createDatabaseBackup, 
  downloadBackupFile, 
  getDatabaseInfo, 
  loadBackupHistory, 
  runBackupDiagnostics, 
  validateBackupFile,
  executePreRestoreBackup,
  formatBytes
} from '../utils/backupService';
import { 
  BackupHistoryRecord, 
  DatabaseInfo, 
  DiagnosticCheckResult 
} from '../utils/backupTypes';
import { ResetEmployeeDatabaseModal } from './ResetEmployeeDatabaseModal';
import { ExcelImportValidationCenter } from './ExcelImportValidationCenter';

interface SettingsBackupViewProps {
  settings: SystemSettings;
  fullDatabase: FullAppDatabase;
  onUpdateSettings: (newSettings: SystemSettings) => void;
  onQuickBackup: () => void;
  logs: AuditLog[];
  onOpenBackupModal: () => void;
  onRestoreComplete: (restoredDb: FullAppDatabase, message: string) => void;
  onLogAudit: (action: any, details: string) => void;
  currentUsername: string;
  users?: UserAccount[];
  onResetEmployeeDatabase?: (backupFileName: string, archiveData: boolean) => Promise<{ success: boolean; error?: string }>;
  onOpenExcelImport?: () => void;
  onOpenAddEmployee?: () => void;
  onCommitImport?: (newDatabase: FullAppDatabase, summaryLog: string) => void;
}

export const SettingsBackupView: React.FC<SettingsBackupViewProps> = ({
  settings,
  fullDatabase,
  onUpdateSettings,
  logs,
  onOpenBackupModal,
  onRestoreComplete,
  onLogAudit,
  currentUsername,
  users = [],
  onResetEmployeeDatabase,
  onOpenExcelImport,
  onOpenAddEmployee,
  onCommitImport
}) => {
  const [formData, setFormData] = useState<SystemSettings>({ ...settings });
  const [activeSubTab, setActiveSubTab] = useState<'backup' | 'excel_validation' | 'settings' | 'diagnostics' | 'history' | 'appointment_grades'>('backup');
  
  // Appointment Grades Config state
  const [gradeSystemFilter, setGradeSystemFilter] = useState<'الكل' | AppointmentSalarySystem>('الكل');
  const [editingGrade, setEditingGrade] = useState<AppointmentGradeConfig | null>(null);
  const [newGradeName, setNewGradeName] = useState<string>('');
  const [newGradeSystem, setNewGradeSystem] = useState<AppointmentSalarySystem>('جدول مرتبات القانون 15');
  const [newGradeLevel, setNewGradeLevel] = useState<number>(1);
  const [newGradeMinInc, setNewGradeMinInc] = useState<number>(0);
  const [newGradeMaxInc, setNewGradeMaxInc] = useState<number>(10);
  const [isAddingGrade, setIsAddingGrade] = useState<boolean>(false);
  
  // Real Backup State
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [backupFeedback, setBackupFeedback] = useState<{ message: string; isError: boolean; fileName?: string; size?: string } | null>(null);

  // Restore State
  const [restoreFeedback, setRestoreFeedback] = useState<{ message: string; isError: boolean } | null>(null);

  // Diagnostics State
  const [dbInfo, setDbInfo] = useState<DatabaseInfo>(getDatabaseInfo(fullDatabase));
  const [diagnosticsList, setDiagnosticsList] = useState<DiagnosticCheckResult[]>([]);
  const [isRunningDiag, setIsRunningDiag] = useState<boolean>(false);

  // History State
  const [historyList, setHistoryList] = useState<BackupHistoryRecord[]>(loadBackupHistory());

  // Reset Employee Database Modal State
  const [isResetModalOpen, setIsResetModalOpen] = useState<boolean>(false);

  useEffect(() => {
    setDbInfo(getDatabaseInfo(fullDatabase));
    setHistoryList(loadBackupHistory());
  }, [fullDatabase]);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSettings(formData);
    setBackupFeedback({ message: 'تم حفظ الإعدادات بنجاح وتحديث مسارات النظام.', isError: false });
    onLogAudit('تعديل', 'تحديث إعدادات ومسارات النظام');
  };

  const handleExecuteBackup = async (format: 'ZIP' | 'BAK' = 'ZIP') => {
    if (isExporting) return;
    setIsExporting(true);
    setBackupFeedback(null);

    try {
      const res = await createDatabaseBackup(fullDatabase, currentUsername, 'يدوية', format);
      if (res.success && res.blob) {
        // Trigger real immediate download to disk
        downloadBackupFile(res.blob, res.fileName);
        
        setBackupFeedback({
          message: `تم إنشاء النسخة الاحتياطية (${res.fileName}) والتحقق من سلامتها وتنزيلها لجهازك بنجاح!`,
          isError: false,
          fileName: res.fileName,
          size: res.sizeFormatted
        });

        setHistoryList(loadBackupHistory());
        onLogAudit('نسخة احتياطية', `تم إنشاء نسخة احتياطية حقيقية (${res.fileName}) بحجم ${res.sizeFormatted} وبصمة ${res.checksum}`);
      } else {
        setBackupFeedback({
          message: `فشل إنشاء النسخة الاحتياطية: ${res.error || 'خطأ غير معروف'}`,
          isError: true
        });
      }
    } catch (err: any) {
      console.error('[SettingsBackupView] Backup error:', err);
      setBackupFeedback({
        message: `حدث خطأ أثناء إنشاء النسخة: ${err?.message || String(err)}`,
        isError: true
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleRunDiagnostics = async () => {
    setIsRunningDiag(true);
    try {
      const res = await runBackupDiagnostics(fullDatabase);
      setDiagnosticsList(res.results);
      setDbInfo(getDatabaseInfo(fullDatabase));
    } catch (err: any) {
      console.error('[SettingsBackupView] Diagnostics error:', err);
    } finally {
      setIsRunningDiag(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-red-950 text-red-400 border border-red-800 shadow-md">
            <HardDrive className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <span>إدارة النسخ الاحتياطي وقاعدة البيانات والإعدادات</span>
              <span className="px-2 py-0.5 rounded-md bg-emerald-950 text-emerald-300 text-[10px] font-bold border border-emerald-800 font-mono">
                Active & Protected
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              توليد نسخ احتياطية فورية حقيقية (.ZIP / .BAK)، فحص سلامة الجداول، والاستعادة الوقائية التلقائية
            </p>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleExecuteBackup('ZIP')}
            disabled={isExporting}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white font-bold text-xs shadow-lg transition-all border border-emerald-500 flex items-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {isExporting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            <span>{isExporting ? 'جاري التجميع...' : 'نسخة احتياطية فورية (.ZIP)'}</span>
          </button>

          <button
            onClick={onOpenBackupModal}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs shadow transition-all border border-slate-700 flex items-center gap-1.5 cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>نافذة النسخ والاستعادة الشاملة</span>
          </button>
        </div>
      </div>

      {/* Sub navigation bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-1.5 flex gap-1 text-xs font-bold">
        <button
          onClick={() => setActiveSubTab('backup')}
          className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 ${
            activeSubTab === 'backup'
              ? 'bg-red-800 text-white shadow'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Download className="w-4 h-4" />
          <span>مركز النسخ الاحتياطي السريع</span>
        </button>

        <button
          onClick={() => setActiveSubTab('excel_validation')}
          className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 ${
            activeSubTab === 'excel_validation'
              ? 'bg-red-800 text-white shadow font-black'
              : 'text-emerald-400 hover:text-white hover:bg-slate-800 font-bold'
          }`}
        >
          <FileCheck className="w-4 h-4 text-emerald-400" />
          <span>استيراد وفحص بيانات Excel</span>
        </button>

        <button
          onClick={() => setActiveSubTab('settings')}
          className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 ${
            activeSubTab === 'settings'
              ? 'bg-red-800 text-white shadow'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <FolderOpen className="w-4 h-4" />
          <span>تخصيص المسارات والشعار</span>
        </button>

        <button
          onClick={() => {
            setActiveSubTab('diagnostics');
            if (diagnosticsList.length === 0) handleRunDiagnostics();
          }}
          className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 ${
            activeSubTab === 'diagnostics'
              ? 'bg-red-800 text-white shadow'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>فحص وتشخيص النظام (10 فحوصات)</span>
        </button>

        <button
          onClick={() => setActiveSubTab('history')}
          className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 ${
            activeSubTab === 'history'
              ? 'bg-red-800 text-white shadow'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <History className="w-4 h-4" />
          <span>سجل النسخ السابقة ({historyList.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('appointment_grades')}
          className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 ${
            activeSubTab === 'appointment_grades'
              ? 'bg-red-800 text-white shadow'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>تصنيفات الدرجة المعين عليها</span>
        </button>
      </div>

      {/* Feedback Banner */}
      {backupFeedback && (
        <div className={`p-4 rounded-2xl border text-xs flex items-center justify-between shadow-lg ${
          backupFeedback.isError 
            ? 'bg-red-950/90 border-red-700 text-red-200' 
            : 'bg-emerald-950/90 border-emerald-700 text-emerald-200'
        }`}>
          <div className="flex items-center gap-3">
            {backupFeedback.isError ? (
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            )}
            <div>
              <p className="font-bold">{backupFeedback.message}</p>
              {backupFeedback.fileName && (
                <p className="text-[11px] font-mono text-emerald-300 mt-0.5">
                  الملف: {backupFeedback.fileName} | الحجم: {backupFeedback.size}
                </p>
              )}
            </div>
          </div>
          <button 
            onClick={() => setBackupFeedback(null)} 
            className="font-bold px-2 py-1 rounded text-slate-300 hover:text-white hover:bg-white/10"
          >
            إغلاق
          </button>
        </div>
      )}

      {/* SUB-TAB 1: QUICK BACKUP CENTER */}
      {activeSubTab === 'backup' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Action Card */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-sm font-black text-white flex items-center gap-2">
                  <Database className="w-4 h-4 text-emerald-400" />
                  <span>توليد وتنزيل نسخة احتياطية حقيقية</span>
                </h3>
                <span className="text-[10px] text-slate-400">
                  بصمة أمنية CRC32 مشفرة
                </span>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                يقوم النظام بتجميع كافة جداول قاعدة البيانات (الموظفون، الإجازات، الترقيات، العلاوات، المستخدمون، وسجل التدقيق) داخل حزمة موثقة ومطابقة للمعايير القياسية مع التحقق التلقائي من سلامة المحتوى وحجم الملف قبل التنزيل.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <button
                  onClick={() => handleExecuteBackup('ZIP')}
                  disabled={isExporting}
                  className="p-4 rounded-xl bg-slate-950 hover:bg-slate-800 border border-emerald-800/80 hover:border-emerald-500 text-right transition-all group disabled:opacity-50 cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="p-2 rounded-lg bg-emerald-950 text-emerald-400 group-hover:scale-110 transition-transform">
                      <Download className="w-5 h-5" />
                    </span>
                    <span className="text-[10px] font-bold bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded border border-emerald-800">
                      موصى به
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-white group-hover:text-emerald-300">
                    تصدير حزمة مضغوطة (.ZIP)
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-1">
                    تتضمن ملف قاعدة البيانات (database.db)، الميتا، والإعدادات.
                  </p>
                </button>

                <button
                  onClick={() => handleExecuteBackup('BAK')}
                  disabled={isExporting}
                  className="p-4 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-700 hover:border-slate-500 text-right transition-all group disabled:opacity-50 cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="p-2 rounded-lg bg-slate-900 text-amber-400 group-hover:scale-110 transition-transform">
                      <HardDrive className="w-5 h-5" />
                    </span>
                    <span className="text-[10px] font-bold bg-slate-900 text-slate-400 px-2 py-0.5 rounded border border-slate-700">
                      حاوية
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-white group-hover:text-amber-300">
                    تصدير حاوية هيكلية (.BAK)
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-1">
                    حاوية مشفرة بكلمة المرور وجاهزة للاستيراد المباشر.
                  </p>
                </button>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>جميع البيانات تخضع للتحقق الآلي قبل التصدير</span>
                </span>

                <button
                  onClick={onOpenBackupModal}
                  className="text-red-400 hover:text-red-300 font-bold underline flex items-center gap-1 cursor-pointer"
                >
                  <span>استعادة نسخة احتياطية سابقة &larr;</span>
                </button>
              </div>
            </div>
          </div>

          {/* Database Metrics Column */}
          <div className="space-y-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
              <h3 className="text-sm font-bold text-white border-b border-slate-800 pb-3 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>حالة قاعدة البيانات الحالية</span>
              </h3>

              <div className="space-y-2.5 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <span className="text-slate-400">إجمالي الموظفين:</span>
                  <span className="font-bold text-white">{fullDatabase.employees?.length || 0} موظف</span>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <span className="text-slate-400">إجمالي حركات الإجازات:</span>
                  <span className="font-bold text-white">{fullDatabase.leaves?.length || 0} حركة</span>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <span className="text-slate-400">الترقيات والعلاوات:</span>
                  <span className="font-bold text-white">
                    {(fullDatabase.promotions?.length || 0) + (fullDatabase.increments?.length || 0)} حركة
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <span className="text-slate-400">حجم الذاكرة الحقيقي:</span>
                  <span className="font-mono font-bold text-emerald-400">{dbInfo.totalSizeFormatted}</span>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <span className="text-slate-400">حالة التخزين:</span>
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    ● متصل ومحفوظ
                  </span>
                </div>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* SUB-TAB: EXCEL IMPORT & VALIDATION CENTER */}
      {activeSubTab === 'excel_validation' && (
        <ExcelImportValidationCenter
          fullDatabase={fullDatabase}
          onCommitImport={(newDb, logMsg) => {
            if (onCommitImport) {
              onCommitImport(newDb, logMsg);
            }
          }}
          onLogAudit={onLogAudit}
          currentUsername={currentUsername}
        />
      )}

      {/* SUB-TAB 2: SYSTEM SETTINGS FORM */}
      {activeSubTab === 'settings' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
          <h3 className="text-sm font-bold text-white border-b border-slate-800 pb-3 flex items-center gap-2">
            <FolderOpen className="w-4 h-4 text-red-500" />
            <span>تخصيص المسارات والشعار والإعدادات الإدارية</span>
          </h3>

          <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-300 font-bold mb-1.5">اسم المؤسسة الرئيسي</label>
                <input
                  type="text"
                  value={formData.bankName}
                  onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1.5">الفرع / البلدية</label>
                <input
                  type="text"
                  value={formData.branch}
                  onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-red-500"
                />
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <div>
                <label className="block text-slate-300 font-bold mb-1.5">شعار المؤسسة الرسمي (Official Logo)</label>
                <div className="flex gap-2 items-center">
                  <input
                    type="text"
                    value={formData.officialLogoUrl || ''}
                    onChange={(e) => setFormData({ ...formData, officialLogoUrl: e.target.value })}
                    placeholder="رابط الشعار أو المسار الإلكتروني للصورة..."
                    className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-amber-300 text-[11px] focus:outline-none focus:border-red-500"
                  />
                  {formData.officialLogoUrl ? (
                    <img src={formData.officialLogoUrl} alt="Logo Preview" className="w-10 h-10 object-contain bg-white rounded-lg p-1 border border-slate-700" />
                  ) : (
                    <span className="text-[10px] text-slate-500 bg-slate-950 px-2 py-1.5 rounded border border-slate-800">
                      [شعار افتراضي]
                    </span>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1.5">مجلد حفظ النسخ الاحتياطية الافتراضي</label>
                <input
                  type="text"
                  value={formData.backupFolderPath}
                  onChange={(e) => setFormData({ ...formData, backupFolderPath: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-emerald-300 font-mono text-[11px] focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1.5">مجلد حفظ مرفقات PDF</label>
                <input
                  type="text"
                  value={formData.pdfFolderPath}
                  onChange={(e) => setFormData({ ...formData, pdfFolderPath: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sky-300 font-mono text-[11px] focus:outline-none focus:border-red-500"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="autoLog"
                  checked={formData.autoLog}
                  onChange={(e) => setFormData({ ...formData, autoLog: e.target.checked })}
                  className="w-4 h-4 rounded text-red-600 bg-slate-950 border-slate-700 focus:ring-0"
                />
                <label htmlFor="autoLog" className="text-slate-300 font-bold">
                  تفعيل التوثيق الآلي بجدول DB_Log لجميع العمليات
                </label>
              </div>

              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-red-800 hover:from-red-500 hover:to-red-700 text-white font-bold shadow-lg border border-red-500 flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                <span>حفظ التعديلات</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* SUB-TAB 3: DIAGNOSTICS */}
      {activeSubTab === 'diagnostics' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-sky-400" />
                <span>نتائج الفحص التشخيصي لمنظومة النسخ الاحتياطي (10 مراحل فحص)</span>
              </h3>
              <p className="text-[11px] text-slate-400">
                فحص الاتصال، المحرك، الصلاحيات، ضغط البيانات، وبصمة التكامل
              </p>
            </div>

            <button
              onClick={handleRunDiagnostics}
              disabled={isRunningDiag}
              className="px-3.5 py-1.5 rounded-xl bg-sky-700 hover:bg-sky-600 text-white font-bold text-xs flex items-center gap-1.5 border border-sky-500"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRunningDiag ? 'animate-spin' : ''}`} />
              <span>إعادة الفحص الآن</span>
            </button>
          </div>

          <div className="space-y-2 text-xs">
            {diagnosticsList.map((diag, i) => (
              <div 
                key={diag.id}
                className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-1 rounded ${
                    diag.status === 'passed' ? 'bg-emerald-950 text-emerald-400' : 'bg-amber-950 text-amber-400'
                  }`}>
                    {diag.status === 'passed' ? <Check className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                  </div>
                  <div>
                    <p className="font-bold text-white">{i + 1}. {diag.stepName}</p>
                    <p className="text-slate-400 text-[11px]">{diag.message}</p>
                  </div>
                </div>

                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  diag.status === 'passed' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-amber-950 text-amber-300 border border-amber-800'
                }`}>
                  {diag.status === 'passed' ? 'ناجح 100%' : 'تنبيه'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-TAB 4: HISTORY */}
      {activeSubTab === 'history' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-black text-white flex items-center gap-2">
              <History className="w-4 h-4 text-amber-400" />
              <span>سجل جميع النسخ الاحتياطية السابقة</span>
            </h3>
            <span className="text-xs text-emerald-400 font-mono font-bold bg-slate-950 px-2 py-1 rounded border border-slate-800">
              {historyList.length} نسخة محفوظة
            </span>
          </div>

          {historyList.length === 0 ? (
            <p className="text-center py-6 text-slate-400 text-xs">لا توجد نسخ مسجلة في السجل بعد.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="text-slate-400 border-b border-slate-800 bg-slate-950">
                  <tr>
                    <th className="p-3">اسم الملف</th>
                    <th className="p-3">النوع</th>
                    <th className="p-3">التاريخ</th>
                    <th className="p-3">الحجم</th>
                    <th className="p-3">الموظفون</th>
                    <th className="p-3">الحالة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {historyList.map(h => (
                    <tr key={h.id} className="hover:bg-slate-800/40">
                      <td className="p-3 font-mono text-emerald-300">{h.fileName}</td>
                      <td className="p-3">{h.backupType}</td>
                      <td className="p-3 text-slate-300">{h.backupDateFormatted}</td>
                      <td className="p-3 font-mono text-white">{h.fileSizeFormatted}</td>
                      <td className="p-3 font-bold text-slate-200">{h.recordCounts?.employees || 0}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                          {h.validationStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 5: APPOINTMENT GRADE CONFIGURATIONS */}
      {activeSubTab === 'appointment_grades' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-400" />
                <span>إدارة وتخصيص تصنيفات "الدرجة المعين عليها"</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                تحديد السلالم المالية المستقلة، تسلسل الدرجات، والحدود الدنيا والقصوى للعلاوات عند التعيين.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const confirmed = window.confirm('هل أنت متأكد من استعادة التصنيفات الافتراضية للدرجات المعين عليها؟');
                  if (confirmed) {
                    const updated = { ...formData, appointmentGradeConfigs: DEFAULT_APPOINTMENT_GRADE_CONFIGS };
                    setFormData(updated);
                    onUpdateSettings(updated);
                    setBackupFeedback({ message: 'تمت استعادة التصنيفات القياسية بنجاح.', isError: false });
                    onLogAudit('تعديل', 'استعادة التصنيفات القياسية لدرجات التعيين');
                  }
                }}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-slate-700"
              >
                <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                <span>استعادة الافتراضي</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsAddingGrade(true);
                  setEditingGrade(null);
                  setNewGradeName('');
                  setNewGradeSystem('جدول مرتبات القانون 15');
                  setNewGradeLevel(1);
                  setNewGradeMinInc(0);
                  setNewGradeMaxInc(10);
                }}
                className="px-3 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة درجة جديدة</span>
              </button>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-400 ml-2">تصفية حسب النظام:</span>
            {(['الكل', 'جدول مرتبات القانون 15', 'اللائحة 418 – العناصر الطبية'] as const).map((sys) => {
              const currentConfigs = formData.appointmentGradeConfigs || DEFAULT_APPOINTMENT_GRADE_CONFIGS;
              const count = sys === 'الكل' 
                ? currentConfigs.length 
                : currentConfigs.filter(c => c.salarySystem === sys).length;

              return (
                <button
                  key={sys}
                  type="button"
                  onClick={() => setGradeSystemFilter(sys)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
                    gradeSystemFilter === sys
                      ? 'bg-amber-600 text-white shadow'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <span>{sys}</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                    gradeSystemFilter === sys ? 'bg-black/30 text-white' : 'bg-slate-900 text-slate-400'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Add / Edit Grade Form Modal / Inline */}
          {(isAddingGrade || editingGrade) && (
            <div className="p-4 bg-slate-950 border border-amber-500/40 rounded-xl space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <h4 className="text-xs font-black text-amber-300 flex items-center gap-2">
                  {editingGrade ? <Edit2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  <span>{editingGrade ? 'تعديل بيانات الدرجة' : 'إضافة درجة تعيين جديدة'}</span>
                </h4>
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingGrade(false);
                    setEditingGrade(null);
                  }}
                  className="text-slate-400 hover:text-white text-xs"
                >
                  إلغاء
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">نظام المرتبات *</label>
                  <select
                    value={editingGrade ? editingGrade.salarySystem : newGradeSystem}
                    onChange={(e) => {
                      const val = e.target.value as AppointmentSalarySystem;
                      if (editingGrade) {
                        setEditingGrade({ ...editingGrade, salarySystem: val });
                      } else {
                        setNewGradeSystem(val);
                      }
                    }}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-xs focus:ring-1 focus:ring-amber-500"
                  >
                    <option value="جدول مرتبات القانون 15">جدول مرتبات القانون 15</option>
                    <option value="اللائحة 418 – العناصر الطبية">اللائحة 418 – العناصر الطبية</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">مسمى الدرجة *</label>
                  <input
                    type="text"
                    value={editingGrade ? editingGrade.gradeName : newGradeName}
                    onChange={(e) => {
                      if (editingGrade) {
                        setEditingGrade({ ...editingGrade, gradeName: e.target.value });
                      } else {
                        setNewGradeName(e.target.value);
                      }
                    }}
                    placeholder="مثال: الدرجة السادسة"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-xs focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">الترتيب التسلسلي (1..14)</label>
                  <input
                    type="number"
                    min={1}
                    max={14}
                    value={editingGrade ? editingGrade.sortOrder : newGradeLevel}
                    onChange={(e) => {
                      const v = parseInt(e.target.value, 10) || 1;
                      if (editingGrade) {
                        setEditingGrade({ ...editingGrade, sortOrder: v });
                      } else {
                        setNewGradeLevel(v);
                      }
                    }}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-xs focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">أقصى عدد علاوات</label>
                  <input
                    type="number"
                    min={0}
                    max={30}
                    value={editingGrade ? editingGrade.maxIncrements : newGradeMaxInc}
                    onChange={(e) => {
                      const v = parseInt(e.target.value, 10) || 10;
                      if (editingGrade) {
                        setEditingGrade({ ...editingGrade, maxIncrements: v });
                      } else {
                        setNewGradeMaxInc(v);
                      }
                    }}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-xs focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    const currentConfigs = formData.appointmentGradeConfigs || DEFAULT_APPOINTMENT_GRADE_CONFIGS;
                    if (editingGrade) {
                      const updatedConfigs = currentConfigs.map(g => g.id === editingGrade.id ? editingGrade : g);
                      const updated = { ...formData, appointmentGradeConfigs: updatedConfigs };
                      setFormData(updated);
                      onUpdateSettings(updated);
                      setEditingGrade(null);
                      setBackupFeedback({ message: `تم تحديث الدرجة (${editingGrade.gradeName}) بنجاح.`, isError: false });
                    } else {
                      if (!newGradeName.trim()) {
                        alert('يرجى كتابة اسم الدرجة');
                        return;
                      }
                      const newId = `grade-${Date.now()}`;
                      const newConfig: AppointmentGradeConfig = {
                        id: newId,
                        salarySystem: newGradeSystem,
                        gradeName: newGradeName.trim(),
                        maxIncrements: newGradeMaxInc,
                        sortOrder: newGradeLevel,
                        active: true
                      };
                      const updatedConfigs = [...currentConfigs, newConfig];
                      const updated = { ...formData, appointmentGradeConfigs: updatedConfigs };
                      setFormData(updated);
                      onUpdateSettings(updated);
                      setIsAddingGrade(false);
                      setNewGradeName('');
                      setBackupFeedback({ message: `تمت إضافة الدرجة (${newConfig.gradeName}) بنجاح.`, isError: false });
                    }
                  }}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>حفظ الدرجة</span>
                </button>
              </div>
            </div>
          )}

          {/* Grades Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-800 text-slate-300 font-bold border-b border-slate-700">
                <tr>
                  <th className="p-3 text-center w-12">#</th>
                  <th className="p-3">نظام المرتبات</th>
                  <th className="p-3">مسمى الدرجة</th>
                  <th className="p-3 text-center">الترتيب</th>
                  <th className="p-3 text-center">علاوات التعيين المتاحة</th>
                  <th className="p-3 text-center">الحالة</th>
                  <th className="p-3 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {(() => {
                  const currentConfigs = formData.appointmentGradeConfigs || DEFAULT_APPOINTMENT_GRADE_CONFIGS;
                  const filtered = gradeSystemFilter === 'الكل'
                    ? currentConfigs
                    : currentConfigs.filter(c => c.salarySystem === gradeSystemFilter);

                  if (filtered.length === 0) {
                    return (
                      <tr>
                        <td colSpan={7} className="p-6 text-center text-slate-500">
                          لا توجد تصنيفات معرفة لهذا النظام
                        </td>
                      </tr>
                    );
                  }

                  return filtered.map((cfg, idx) => (
                    <tr key={cfg.id} className="hover:bg-slate-900/60 transition-colors">
                      <td className="p-3 text-center font-mono text-slate-400">{idx + 1}</td>
                      <td className="p-3 font-semibold text-white">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          cfg.salarySystem === 'جدول مرتبات القانون 15'
                            ? 'bg-blue-950 text-blue-300 border border-blue-800'
                            : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        }`}>
                          {cfg.salarySystem}
                        </span>
                      </td>
                      <td className="p-3 font-bold text-amber-200">{cfg.gradeName}</td>
                      <td className="p-3 text-center font-mono font-bold text-slate-300">{cfg.sortOrder}</td>
                      <td className="p-3 text-center font-mono text-slate-300">
                        0 - {cfg.maxIncrements} علاوة
                      </td>
                      <td className="p-3 text-center">
                        <button
                          type="button"
                          onClick={() => {
                            const updatedConfigs = currentConfigs.map(g => g.id === cfg.id ? { ...g, active: !g.active } : g);
                            const updated = { ...formData, appointmentGradeConfigs: updatedConfigs };
                            setFormData(updated);
                            onUpdateSettings(updated);
                          }}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition ${
                            cfg.active !== false
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800 hover:bg-emerald-900'
                              : 'bg-red-950 text-red-300 border border-red-800 hover:bg-red-900'
                          }`}
                        >
                          {cfg.active !== false ? 'مفعلة' : 'معطلة'}
                        </button>
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingGrade(cfg);
                              setIsAddingGrade(false);
                            }}
                            className="p-1.5 text-slate-400 hover:text-amber-300 hover:bg-slate-800 rounded transition"
                            title="تعديل الدرجة"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              const ok = window.confirm(`هل أنت متأكد من حذف تصنيف الدرجة (${cfg.gradeName})؟`);
                              if (ok) {
                                const updatedConfigs = currentConfigs.filter(g => g.id !== cfg.id);
                                const updated = { ...formData, appointmentGradeConfigs: updatedConfigs };
                                setFormData(updated);
                                onUpdateSettings(updated);
                                setBackupFeedback({ message: `تم حذف الدرجة (${cfg.gradeName}).`, isError: false });
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded transition"
                            title="حذف الدرجة"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ));
                })()}
              </tbody>
            </table>
          </div>

          <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl text-xs text-slate-400 flex items-start gap-3">
            <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>ملاحظة هامة:</strong> تصنيفات "الدرجة المعين عليها" مستقلة تماماً ومخصصة لتوثيق الوضع القانوني والمالي عند أول تعيين للموظف في الدولة. لن يؤثر تعديل أو إضافة هذه التصنيفات على الدرجة الحالية أو الترقيات أو العلاوات الدورية.
            </p>
          </div>
        </div>
      )}

      {/* Hidden Sheets Status Box */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <h3 className="text-sm font-bold text-white border-b border-slate-800 pb-3 flex items-center gap-2">
          <Database className="w-4 h-4 text-emerald-400" />
          <span>حالة أوراق وجداول قاعدة البيانات الداخلية</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
            <div>
              <p className="font-extrabold text-white">DB_Employees</p>
              <p className="text-[10px] text-slate-400">{fullDatabase.employees?.length || 0} موظف</p>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center gap-1">
              <Lock className="w-3 h-3" /> VeryHidden
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
            <div>
              <p className="font-extrabold text-white">DB_Leaves</p>
              <p className="text-[10px] text-slate-400">{fullDatabase.leaves?.length || 0} إجازة</p>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center gap-1">
              <Lock className="w-3 h-3" /> VeryHidden
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
            <div>
              <p className="font-extrabold text-white">DB_Promotions</p>
              <p className="text-[10px] text-slate-400">
                {(fullDatabase.promotions?.length || 0) + (fullDatabase.increments?.length || 0)} حركة
              </p>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center gap-1">
              <Lock className="w-3 h-3" /> VeryHidden
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
            <div>
              <p className="font-extrabold text-white">DB_Log</p>
              <p className="text-[10px] text-slate-400">{logs.length} حركة تدقيق</p>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center gap-1">
              <Lock className="w-3 h-3" /> VeryHidden
            </span>
          </div>

        </div>

        <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-800/50 text-[11px] text-amber-200 leading-relaxed">
          جميع أوراق العمل السابقة محميّة برمجياً بكلمة المرور المشفرة <code className="bg-slate-950 px-1 py-0.5 rounded font-mono text-amber-300">BloodBank2026</code> ولا يمكن الوصول إليها من واجهة Excel العادية.
        </div>
      </div>

    </div>
  );
};
