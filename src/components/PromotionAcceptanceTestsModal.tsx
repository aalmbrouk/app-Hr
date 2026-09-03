import React, { useState } from 'react';
import { runPromotionAcceptanceTests, AcceptanceTestResult } from '../utils/promotionEngine';
import { 
  ShieldCheck, 
  CheckCircle2, 
  XCircle, 
  X, 
  Play, 
  RotateCcw, 
  FileCheck, 
  AlertTriangle,
  Info
} from 'lucide-react';

interface PromotionAcceptanceTestsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PromotionAcceptanceTestsModal: React.FC<PromotionAcceptanceTestsModalProps> = ({
  isOpen,
  onClose
}) => {
  const [testSuite, setTestSuite] = useState<{
    allPassed: boolean;
    totalTests: number;
    passedTests: number;
    results: AcceptanceTestResult[];
  }>(() => runPromotionAcceptanceTests());

  const [isRunning, setIsRunning] = useState(false);

  if (!isOpen) return null;

  const handleRunTests = () => {
    setIsRunning(true);
    setTimeout(() => {
      const res = runPromotionAcceptanceTests();
      setTestSuite(res);
      setIsRunning(false);
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full border border-slate-200 overflow-hidden my-6">
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center border border-emerald-400">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold">اختبارات القبول والامتثال للقانون الإداري الليبي (Acceptance Tests)</h3>
              <p className="text-xs text-slate-300">
                التحقق الآلي المعتمد للاختبارات السبعة الإلزامية وفق قانون علاقات العمل رقم 12 لسنة 2010
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Scorecard */}
        <div className={`p-4 border-b flex items-center justify-between ${
          testSuite.allPassed 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-950' 
            : 'bg-rose-50 border-rose-200 text-rose-950'
        }`}>
          <div className="flex items-center gap-3">
            {testSuite.allPassed ? (
              <CheckCircle2 className="w-7 h-7 text-emerald-600 flex-shrink-0" />
            ) : (
              <XCircle className="w-7 h-7 text-rose-600 flex-shrink-0" />
            )}
            <div>
              <h4 className="font-bold text-sm">
                {testSuite.allPassed 
                  ? 'جميع اختبارات القبول السبعة اجتازت بنجاح بنسبة 100% (All 7 Tests Passed)' 
                  : `فشل بعض الاختبارات: ${testSuite.passedTests} من أصل ${testSuite.totalTests}`
                }
              </h4>
              <p className="text-xs opacity-80">
                تم التحقق من عدم الترقية التلقائية، أولوية القرار الرسمي، النقطة الانتقالية للدرجة 10 (5 علاوات)، واستقلال العلاوة عن تغيير الدرجة.
              </p>
            </div>
          </div>

          <button
            onClick={handleRunTests}
            disabled={isRunning}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{isRunning ? 'جاري الفحص...' : 'إعادة تشغيل الفحص الشامل'}</span>
          </button>
        </div>

        {/* Tests List */}
        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto text-right">
          {testSuite.results.map((t) => (
            <div 
              key={t.testNumber} 
              className={`rounded-xl border p-4 transition-colors ${
                t.passed ? 'bg-slate-50/60 border-slate-200' : 'bg-rose-50/80 border-rose-300'
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-2">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    t.passed ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                  }`}>
                    {t.testNumber}
                  </span>
                  <h5 className="font-bold text-xs sm:text-sm text-slate-800">
                    {t.testName}
                  </h5>
                </div>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold flex items-center gap-1 ${
                  t.passed ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                }`}>
                  {t.passed ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                  <span>{t.passed ? 'ناجح' : 'فاشل'}</span>
                </span>
              </div>

              <div className="space-y-1.5 text-xs text-slate-600 mr-8">
                <div>
                  <span className="font-semibold text-slate-700">الوصف والمدخلات:</span> {t.description}
                </div>
                <div>
                  <span className="font-semibold text-slate-700">النتيجة المتوقعة نظامياً:</span> {t.expectedResult}
                </div>
                <div className="text-emerald-800 bg-emerald-50/80 p-2 rounded-lg border border-emerald-200">
                  <span className="font-bold">النتيجة الفعلية للمحرك:</span> {t.actualResult}
                </div>
                {t.details && (
                  <div className="text-[11px] text-slate-500 pt-0.5">
                    <span className="font-semibold">تفاصيل التحقق:</span> {t.details}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="bg-slate-100 p-4 border-t border-slate-200 flex items-center justify-between">
          <p className="text-xs text-slate-500 flex items-center gap-1.5">
            <Info className="w-4 h-4 text-emerald-600" />
            <span>محرك الترقيات متوافق ومختبر وفق نصوص المواد واللوائح التنفيذية للخدمة المدنية.</span>
          </p>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 text-white text-xs font-bold hover:bg-slate-900 transition-colors"
          >
            إغلاق نافذة الاختبارات
          </button>
        </div>

      </div>
    </div>
  );
};
