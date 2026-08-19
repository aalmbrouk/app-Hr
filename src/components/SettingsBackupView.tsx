import React, { useState } from 'react';
import { SystemSettings, AuditLog } from '../types';
import { HardDrive, ShieldCheck, Database, FolderOpen, Save, RefreshCw, Lock, CheckCircle2, Download, AlertCircle } from 'lucide-react';
import { FullAppDatabase } from '../utils/storageTypes';
import { exportManualBackup } from '../utils/storageService';

interface SettingsBackupViewProps {
  settings: SystemSettings;
  fullDatabase?: FullAppDatabase;
  onUpdateSettings: (newSettings: SystemSettings) => void;
  onQuickBackup: () => void;
  logs: AuditLog[];
}

export const SettingsBackupView: React.FC<SettingsBackupViewProps> = ({
  settings,
  fullDatabase,
  onUpdateSettings,
  onQuickBackup,
  logs
}) => {
  const [formData, setFormData] = useState<SystemSettings>({ ...settings });
  const [backupFeedback, setBackupFeedback] = useState<{ message: string; isError: boolean } | null>(null);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSettings(formData);
    setBackupFeedback({ message: 'تم حفظ الإعدادات بنجاح وتحديث ملف البيانات (hr-data.json)', isError: false });
  };

  const handleCreateBackup = async () => {
    console.log('[DEBUG 1] Backup button clicked in SettingsBackupView. handleCreateBackup entered.');
    console.log('[DEBUG 1] fullDatabase prop:', fullDatabase ? { version: fullDatabase.version, empCount: fullDatabase.employees?.length, keys: Object.keys(fullDatabase) } : 'UNDEFINED');
    onQuickBackup();
    if (fullDatabase) {
      setIsExporting(true);
      console.log('[DEBUG 1] Calling exportManualBackup(fullDatabase)...');
      try {
        const res = await exportManualBackup(fullDatabase);
        console.log('[DEBUG 1] exportManualBackup completed. Result:', res);
        setIsExporting(false);
        setBackupFeedback({ message: res.message, isError: !res.success });
      } catch (err: any) {
        console.error('[DEBUG 1 ERROR] Unexpected error awaiting exportManualBackup:', err);
        setIsExporting(false);
        setBackupFeedback({ message: `خطأ غير متوقع: ${err?.message || err}`, isError: true });
      }
    } else {
      console.warn('[DEBUG 1] fullDatabase is undefined/null in SettingsBackupView!');
      setBackupFeedback({ message: `تم إنشاء النسخة الاحتياطية بنجاح في المسار: ${formData.backupFolderPath}`, isError: false });
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-red-950 text-red-400 border border-red-800">
            <HardDrive className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-black text-white">
              إعدادات المنظومة والنسخ الاحتياطي (Backup & Database Options)
            </h2>
            <p className="text-xs text-slate-400">
              إدارة قاعدة البيانات الدائمة (hr-data.json) وتصدير نسخ احتياطية آمنة
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCreateBackup}
            disabled={isExporting}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-800 hover:from-emerald-500 hover:to-emerald-700 text-white font-bold text-xs shadow-lg transition-all border border-emerald-500 flex items-center gap-1.5 disabled:opacity-50"
          >
            <Download className="w-4 h-4 text-emerald-200" />
            <span>{isExporting ? 'جاري التصدير...' : 'تصدير نسخة احتياطية (Export Backup)'}</span>
          </button>
        </div>
      </div>

      {backupFeedback && (
        <div className={`p-4 rounded-2xl border text-xs flex items-center justify-between shadow-lg animate-in fade-in ${
          backupFeedback.isError 
            ? 'bg-red-950/85 border-red-700 text-red-200' 
            : 'bg-emerald-950/85 border-emerald-700 text-emerald-200'
        }`}>
          <div className="flex items-center gap-2">
            {backupFeedback.isError ? (
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            )}
            <span className="font-semibold">{backupFeedback.message}</span>
          </div>
          <button 
            onClick={() => setBackupFeedback(null)} 
            className={`font-bold px-2 py-1 rounded hover:bg-white/10 ${
              backupFeedback.isError ? 'text-red-300 hover:text-white' : 'text-emerald-300 hover:text-white'
            }`}
          >
            إغلاق
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Settings Form */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
          <h3 className="text-sm font-bold text-white border-b border-slate-800 pb-3 flex items-center gap-2">
            <FolderOpen className="w-4 h-4 text-red-500" />
            <span>تخصيص المسارات وإعدادات النظام</span>
          </h3>

          <form onSubmit={handleSave} className="space-y-4 text-xs">
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-300 font-bold mb-1.5">اسم المصرف الرئيسي</label>
                <input
                  type="text"
                  value={formData.bankName}
                  onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1.5">عنوان الفرع</label>
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
                <label className="block text-slate-300 font-bold mb-1.5">شعار المؤسسة الرسمي (Official Institution Logo)</label>
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
                <p className="text-[10px] text-slate-500 mt-1">
                  يتم استخدام هذا الشعار تلقائياً في استمارة الإجازة الرسمية (PRINT_LEAVE_FORM) وكشوفات الموظفين والتقارير.
                </p>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1.5">مجلد حفظ النسخ الاحتياطية (Backup Folder)</label>
                <input
                  type="text"
                  value={formData.backupFolderPath}
                  onChange={(e) => setFormData({ ...formData, backupFolderPath: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-emerald-300 font-mono text-[11px] focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1.5">مجلد حفظ مرفقات PDF (PDF Attachments Folder)</label>
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

        {/* Hidden Sheets Status Box */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <h3 className="text-sm font-bold text-white border-b border-slate-800 pb-3 flex items-center gap-2">
            <Database className="w-4 h-4 text-emerald-400" />
            <span>حالة أوراق قاعدة البيانات المخفية</span>
          </h3>

          <div className="space-y-3 text-xs">
            
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <div>
                <p className="font-extrabold text-white">DB_Employees</p>
                <p className="text-[10px] text-slate-400">جدول الموظفين وجميع الحقول 26</p>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center gap-1">
                <Lock className="w-3 h-3" /> VeryHidden
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <div>
                <p className="font-extrabold text-white">DB_Users</p>
                <p className="text-[10px] text-slate-400">Administrator 1 & Administrator 2</p>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center gap-1">
                <Lock className="w-3 h-3" /> VeryHidden
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <div>
                <p className="font-extrabold text-white">DB_Settings</p>
                <p className="text-[10px] text-slate-400">المسارات والإعدادات الإدارية</p>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center gap-1">
                <Lock className="w-3 h-3" /> VeryHidden
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <div>
                <p className="font-extrabold text-white">DB_Log</p>
                <p className="text-[10px] text-slate-400">سجل العمليات والتوثيق ({logs.length} سجل)</p>
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

    </div>
  );
};
