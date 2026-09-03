import React, { useState, useMemo, useEffect } from 'react';
import { Employee } from '../types';
import { FullAppDatabase } from '../utils/storageTypes';
import { 
  X, 
  Trash2, 
  ShieldAlert, 
  AlertTriangle, 
  CheckCircle2, 
  Download, 
  FileText, 
  RefreshCw, 
  ShieldCheck, 
  Users, 
  Database,
  Lock,
  ArrowRight,
  Info,
  Check
} from 'lucide-react';
import { 
  analyzeDatabaseForCleanup, 
  executeSafeCleanupToLegitimateCount, 
  CandidateRemovalRecord,
  TARGET_LEGITIMATE_COUNT 
} from '../utils/testRecordCleanupUtils';
import { createDatabaseBackup, downloadBackupFile } from '../utils/backupService';

interface TestRecordsCleanupModalProps {
  isOpen: boolean;
  onClose: () => void;
  fullDatabase: FullAppDatabase;
  onCleanupComplete: (newDatabase: FullAppDatabase, summaryMessage: string) => void;
  currentUser?: string;
}

export const TestRecordsCleanupModal: React.FC<TestRecordsCleanupModalProps> = ({
  isOpen,
  onClose,
  fullDatabase,
  onCleanupComplete,
  currentUser = 'المستخدم الحالي'
}) => {
  if (!isOpen) return null;

  // Analysis State
  const analysis = useMemo(() => {
    return analyzeDatabaseForCleanup(fullDatabase, TARGET_LEGITIMATE_COUNT);
  }, [fullDatabase]);

  // Stage: 'preview' -> 'confirming' -> 'executing' -> 'completed'
  const [stage, setStage] = useState<'preview' | 'confirming' | 'executing' | 'completed'>('preview');
  
  // Execution status
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [backupGeneratedName, setBackupGeneratedName] = useState<string>('');
  const [backupBlobUrl, setBackupBlobUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successDetails, setSuccessDetails] = useState<{
    deletedCount: number;
    legitimateCount: number;
    backupFileName: string;
  } | null>(null);

  // Manual explicit backup creation button
  const [manualBackupStatus, setManualBackupStatus] = useState<string | null>(null);

  const handleCreateManualBackup = async () => {
    try {
      const bkp = await createDatabaseBackup(fullDatabase, `نسخة_احتياطية_يدوية_قبل_تنظيف_السجلات_${new Date().toISOString().slice(0, 10)}`, currentUser);
      if (bkp.success && bkp.blob) {
        downloadBackupFile(bkp.blob, bkp.fileName);
        setManualBackupStatus(`تم تنزيل النسخة الاحتياطية بنجاح: ${bkp.fileName}`);
      } else {
        throw new Error(bkp.error || 'تعذر إنشاء النسخة الاحتياطية');
      }
    } catch (err: any) {
      setErrorMessage(`تعذر تنزيل النسخة الاحتياطية: ${err.message}`);
    }
  };

  // Perform Safe Deletion
  const handleExecuteDeletion = async () => {
    setIsProcessing(true);
    setErrorMessage(null);
    setStage('executing');

    try {
      // Step 1: Execute safe cleanup with mandatory pre-backup and 142 check
      const result = await executeSafeCleanupToLegitimateCount(fullDatabase, TARGET_LEGITIMATE_COUNT);

      if (!result.success || !result.updatedDatabase) {
        throw new Error(result.error || 'فشلت عملية التنظيف أثناء التحقق من العدد النهائي.');
      }

      setSuccessDetails({
        deletedCount: result.deletedCount,
        legitimateCount: result.legitimateCount,
        backupFileName: result.backupFileName || 'نسخة_أمان_تلقائية.json'
      });

      setStage('completed');
      onCleanupComplete(
        result.updatedDatabase,
        `تم تنظيف ${result.deletedCount} سجلاً تجريبياً وإبقاء ${result.legitimateCount} موظفاً معتمداً بنجاح مع حفظ نسخة احتياطية كاملة.`
      );
    } catch (err: any) {
      setErrorMessage(err.message || 'حدث خطأ أثناء تنفيذ التنظيف. تم التراجع التلقائي عن أي تغيير.');
      setStage('confirming');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150">
        
        {/* HEADER */}
        <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-600/90 text-white flex items-center justify-center font-black shadow-inner">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white tracking-tight">
                تنظيف السجلات التجريبية وضبط الملاك المعتمد (142 موظفاً)
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                فصل السجلات الوهمية واستيرادات الاختبار عن السجلات الرسمية المعتمدة
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ERROR BOX */}
        {errorMessage && (
          <div className="bg-red-50 border-b border-red-200 px-5 py-3 flex items-center justify-between text-red-900 text-xs font-bold shrink-0 animate-in fade-in">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button onClick={() => setErrorMessage(null)} className="text-red-700 hover:text-red-950 font-bold">
              إغلاق
            </button>
          </div>
        )}

        {/* MANUAL BACKUP SUCCESS */}
        {manualBackupStatus && (
          <div className="bg-emerald-50 border-b border-emerald-200 px-5 py-2.5 flex items-center justify-between text-emerald-900 text-xs font-bold shrink-0 animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{manualBackupStatus}</span>
            </div>
            <button onClick={() => setManualBackupStatus(null)} className="text-emerald-700 hover:text-emerald-950">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* BODY */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1 bg-slate-50/50">

          {/* STAGE 1 & 2: PREVIEW & CANDIDATES */}
          {stage !== 'completed' && (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                
                {/* Total Database Count */}
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs">
                  <div className="flex items-center justify-between text-slate-500 text-xs font-bold mb-1">
                    <span>إجمالي السجلات الحالية</span>
                    <Database className="w-4 h-4 text-slate-400" />
                  </div>
                  <div className="text-2xl font-black text-slate-900 font-mono">
                    {analysis.totalInitialEmployees} <span className="text-xs font-normal text-slate-500">سجل</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">تشمل كافة السجلات بالقاعدة</div>
                </div>

                {/* Legitimate Target Count */}
                <div className="bg-emerald-50/80 p-4 rounded-xl border border-emerald-200 shadow-2xs">
                  <div className="flex items-center justify-between text-emerald-700 text-xs font-bold mb-1">
                    <span>الموظفون المعتمدون (المستهدف)</span>
                    <Users className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="text-2xl font-black text-emerald-900 font-mono">
                    {analysis.actualLegitimateCount} <span className="text-xs font-bold text-emerald-700">/ 142 موظف</span>
                  </div>
                  <div className="text-[11px] text-emerald-700 font-semibold mt-1">سجلات حقيقية سيتم الإبقاء عليها بالكامل</div>
                </div>

                {/* Removal Candidates Count */}
                <div className="bg-red-50/80 p-4 rounded-xl border border-red-200 shadow-2xs">
                  <div className="flex items-center justify-between text-red-700 text-xs font-bold mb-1">
                    <span>السجلات المرشحة للحذف</span>
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </div>
                  <div className="text-2xl font-black text-red-900 font-mono">
                    {analysis.candidateRemovalCount} <span className="text-xs font-normal text-red-700">سجل وهمي/تجريبي</span>
                  </div>
                  <div className="text-[11px] text-red-700 font-semibold mt-1">عينات واستيرادات تالفة مرشحة للإزالة</div>
                </div>

              </div>

              {/* CANDIDATE LIST TABLE */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-2xs overflow-hidden">
                <div className="bg-slate-100 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Trash2 className="w-4 h-4 text-red-600" />
                    <h3 className="text-sm font-black text-slate-900">
                      قائمة السجلات المرشحة للحذف والتنظيف ({analysis.candidateRemovalCount} سجل)
                    </h3>
                  </div>
                  <span className="text-xs text-slate-500 font-medium">محددة وفق معايير الأمان المتقدمة</span>
                </div>

                <div className="overflow-x-auto max-h-72">
                  <table className="w-full text-right border-collapse text-xs">
                    <thead className="sticky top-0 bg-slate-50 border-b border-gray-200 font-bold text-slate-700">
                      <tr>
                        <th className="py-2.5 px-3">#</th>
                        <th className="py-2.5 px-3">رقم الملف / الوظيفي</th>
                        <th className="py-2.5 px-3">اسم الموظف</th>
                        <th className="py-2.5 px-3">الرقم الوطني</th>
                        <th className="py-2.5 px-3">معرف النظام (ID)</th>
                        <th className="py-2.5 px-3">معلومات الإنشاء/الاستيراد</th>
                        <th className="py-2.5 px-3">سبب الاستبعاد والحذف</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {analysis.candidateRemovalRecords.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-8 text-center text-emerald-700 font-bold">
                            ✓ لا توجد سجلات تجريبية أو وهمية مرشحة للحذف. قاعدة البيانات نظيفة تماماً!
                          </td>
                        </tr>
                      ) : (
                        analysis.candidateRemovalRecords.map((item, idx) => (
                          <tr key={item.id} className="hover:bg-red-50/50 transition-colors">
                            <td className="py-2.5 px-3 font-mono text-slate-400">{idx + 1}</td>
                            <td className="py-2.5 px-3 font-bold text-slate-900 font-mono">{item.jobNumber}</td>
                            <td className="py-2.5 px-3 font-bold text-red-950">{item.fullName}</td>
                            <td className="py-2.5 px-3 font-mono text-slate-600">{item.nationalId}</td>
                            <td className="py-2.5 px-3 font-mono text-slate-500">{item.id}</td>
                            <td className="py-2.5 px-3 text-slate-500">{item.importOrCreationInfo}</td>
                            <td className="py-2.5 px-3 text-red-700 font-semibold max-w-xs">{item.reason}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* CONFIRMATION WARNING BOX */}
              <div className="p-4 sm:p-5 bg-amber-50/90 rounded-xl border-2 border-amber-300 space-y-2">
                <div className="flex items-center gap-2 text-amber-900 font-black text-sm">
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                  <span>تحذير وضمانات الأمان:</span>
                </div>
                <p className="text-xs text-amber-950 leading-relaxed font-medium">
                  سيتم حذف السجلات التجريبية وغير المعتمدة وإبقاء <strong className="font-black text-slate-900">142 موظفًا معتمدًا</strong>. 
                  سيقوم النظام تلقائياً بإنشاء وحفظ نسخة احتياطية كاملة قبل التنفيذ، ولن يتم حذف أي سجل وظيفي أو مستند مرتبط بالموظفين المعتمدين.
                </p>
              </div>
            </>
          )}

          {/* STAGE 3: COMPLETED SUCCESS VIEW */}
          {stage === 'completed' && successDetails && (
            <div className="bg-white rounded-xl border-2 border-emerald-400 p-6 sm:p-8 text-center space-y-5">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div>
                <h3 className="text-xl font-black text-slate-900">
                  تم تجهيز النسخة النهائية للمنظومة بنجاح
                </h3>
                <p className="text-xs text-slate-600 mt-1">
                  تم تنظيف كافة السجلات التجريبية وتأكيد قاعدة بيانات الموظفين المعتمدين
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-right bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
                <div className="p-2.5 bg-white rounded border border-gray-200">
                  <span className="text-slate-500 font-bold block text-[11px]">عدد الموظفين المعتمدين:</span>
                  <span className="text-base font-black text-emerald-800 font-mono">142 موظف</span>
                </div>
                <div className="p-2.5 bg-white rounded border border-gray-200">
                  <span className="text-slate-500 font-bold block text-[11px]">السجلات المحذوفة:</span>
                  <span className="text-base font-black text-red-800 font-mono">{successDetails.deletedCount} سجل</span>
                </div>
                <div className="p-2.5 bg-white rounded border border-gray-200">
                  <span className="text-slate-500 font-bold block text-[11px]">حالة النسخة الاحتياطية:</span>
                  <span className="text-xs font-bold text-emerald-700">ناجحة وموثقة ✓</span>
                </div>
                <div className="p-2.5 bg-white rounded border border-gray-200">
                  <span className="text-slate-500 font-bold block text-[11px]">حالة المنظومة:</span>
                  <span className="text-xs font-bold text-blue-700">جاهزة للاستخدام المحلي</span>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow transition-colors cursor-pointer"
              >
                العودة لدليل الموظفين
              </button>
            </div>
          )}

        </div>

        {/* FOOTER BUTTONS */}
        {stage !== 'completed' && (
          <div className="bg-slate-100 px-5 py-3.5 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCreateManualBackup}
                className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-800 font-bold rounded-lg border border-gray-300 text-xs transition-colors cursor-pointer shadow-2xs"
                title="إنشاء وتنزيل نسخة احتياطية فورية الآن"
              >
                <Download className="w-4 h-4 text-slate-600" />
                <span>إنشاء نسخة احتياطية</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isProcessing}
                className="px-4 py-2 bg-white hover:bg-gray-50 text-slate-700 font-bold rounded-lg border border-gray-300 text-xs transition-colors cursor-pointer"
              >
                إلغاء
              </button>

              <button
                type="button"
                onClick={handleExecuteDeletion}
                disabled={isProcessing || analysis.candidateRemovalCount === 0}
                className="flex items-center gap-1.5 px-5 py-2 bg-red-700 hover:bg-red-800 disabled:opacity-50 text-white font-bold rounded-lg text-xs shadow-sm transition-colors cursor-pointer"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>جارٍ إنشاء النسخة الاحتياطية والتنفيذ...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>تنفيذ الحذف ({analysis.candidateRemovalCount} سجل)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
