import React, { useState, useEffect } from 'react';
import { Employee, CompetencyReportRating, PromotionRecord, PromotionRule } from '../types';
import { 
  findApplicablePromotionRule, 
  getNextSequentialGrade, 
  validateGradeProgression, 
  getEmployeeCompetencyInfo,
  getEmployeeQualifyingIncrements,
  createOfficialPromotionRecords,
  OfficialPromotionDecisionInput,
  DEFAULT_PROMOTION_RULES
} from '../utils/promotionEngine';
import { JOB_GRADES } from '../data/initialData';
import { 
  Award, 
  X, 
  AlertTriangle, 
  FileText, 
  Building2, 
  Calendar, 
  ShieldCheck, 
  CheckCircle2, 
  Upload,
  Info
} from 'lucide-react';

interface OfficialPromotionModalProps {
  isOpen: boolean;
  onClose: () => void;
  employees: Employee[];
  promotions: PromotionRecord[];
  rules?: PromotionRule[];
  initialEmployeeId?: number;
  onSaveOfficialPromotion: (input: OfficialPromotionDecisionInput) => void;
  currentUser?: string;
}

export const OfficialPromotionModal: React.FC<OfficialPromotionModalProps> = ({
  isOpen,
  onClose,
  employees,
  promotions,
  rules = DEFAULT_PROMOTION_RULES,
  initialEmployeeId,
  onSaveOfficialPromotion,
  currentUser = 'مسؤول شؤون الموظفين'
}) => {
  const [selectedEmpId, setSelectedEmpId] = useState<number>(initialEmployeeId || (employees[0]?.id ?? 0));
  const [newGrade, setNewGrade] = useState<string>('');
  const [effectiveDate, setEffectiveDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [decisionNumber, setDecisionNumber] = useState<string>('');
  const [decisionDate, setDecisionDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [issuingAuthority, setIssuingAuthority] = useState<string>('وزارة الصحة - لجنة شؤون الموظفين');
  const [competencyRating, setCompetencyRating] = useState<CompetencyReportRating>('غير متوفر');
  const [qualification, setQualification] = useState<string>('');
  const [jobTitle, setJobTitle] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [pdfFileName, setPdfFileName] = useState<string>('');
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  const selectedEmployee = employees.find((e) => e.id === selectedEmpId) || employees[0];

  useEffect(() => {
    if (initialEmployeeId) {
      setSelectedEmpId(initialEmployeeId);
    }
  }, [initialEmployeeId]);

  useEffect(() => {
    if (selectedEmployee) {
      const { rule } = findApplicablePromotionRule(selectedEmployee.jobGrade, rules);
      const targetGrade = getNextSequentialGrade(selectedEmployee.jobGrade, rule);
      setNewGrade(targetGrade);

      const comp = getEmployeeCompetencyInfo(selectedEmployee.id, [], promotions);
      setCompetencyRating(comp.rating);
      setQualification(selectedEmployee.qualification || '');
      setJobTitle(selectedEmployee.jobTitle || '');
      setFormErrors({});
    }
  }, [selectedEmployee, rules, promotions]);

  if (!isOpen || !selectedEmployee) return null;

  const previousGrade = selectedEmployee.jobGrade;
  const progressionCheck = validateGradeProgression(previousGrade, newGrade, 'ترقية');
  const incrementsInfo = getEmployeeQualifyingIncrements(selectedEmployee, previousGrade, [], [], promotions);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: { [key: string]: string } = {};

    if (!decisionNumber.trim()) {
      errors.decisionNumber = 'رقم القرار الرسمي مطلوب لإتمام الترقية.';
    }
    if (!decisionDate) {
      errors.decisionDate = 'تاريخ صدور القرار مطلوب.';
    }
    if (!effectiveDate) {
      errors.effectiveDate = 'تاريخ نفاذ واستحقاق الترقية مطلوب.';
    }
    if (!issuingAuthority.trim()) {
      errors.issuingAuthority = 'الجهة المصدرة للقرار مطلوبة.';
    }
    if (!newGrade.trim() || newGrade === previousGrade) {
      errors.newGrade = 'الدرجة الجديدة يجب أن تكون مختلفة عن الدرجة الحالية.';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    onSaveOfficialPromotion({
      employeeId: selectedEmployee.id,
      fileNumber: selectedEmployee.jobNumber,
      employeeName: selectedEmployee.fullName,
      previousGrade,
      newGrade,
      effectiveDate,
      decisionNumber: decisionNumber.trim(),
      decisionDate,
      issuingAuthority: issuingAuthority.trim(),
      competencyRating,
      qualification: qualification.trim(),
      jobTitle: jobTitle.trim(),
      notes: notes.trim(),
      pdfFileName,
      createdBy: currentUser
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden my-6">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-l from-emerald-800 to-teal-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
              <Award className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <h3 className="text-lg font-bold">تسجيل قرار ترقية رسمي معتمد</h3>
              <p className="text-xs text-emerald-200">
                قانون علاقات العمل رقم 12 لسنة 2010 — توثيق القرار الرسمي الصادر عن السلطة المختصة
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

        {/* Legal Advisory Banner */}
        <div className="bg-amber-50 border-b border-amber-200 p-3 px-5 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-amber-900 leading-relaxed">
            <span className="font-bold">محددات قانونية:</span> لا تتم الترقية في المنظومة تلقائياً بمجرد استيفاء سنوات الخدمة أو عدد العلاوات. يشترط لاعتماد الترقية ونفاذها صدور قرار رسمي معتمد وموثق برقم وتاريخ من جهة الاختصاص، ويبدأ احتساب دورة الترقية الجديدة من تاريخ نفاذ هذا القرار.
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 text-right">
          
          {/* Employee Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">الموظف المعني بالترقية:</label>
            <select
              value={selectedEmpId}
              onChange={(e) => setSelectedEmpId(Number(e.target.value))}
              className="w-full text-sm border border-slate-300 rounded-xl p-2.5 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 outline-none"
            >
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.fullName} ({emp.jobNumber}) — {emp.jobGrade} [{emp.department}]
                </option>
              ))}
            </select>
          </div>

          {/* Employee Current Context Box */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
            <div>
              <span className="text-slate-500 block">الدرجة الحالية:</span>
              <span className="font-bold text-slate-800">{previousGrade}</span>
            </div>
            <div>
              <span className="text-slate-500 block">العلاوات المؤهلة المقيدة:</span>
              <span className="font-bold text-emerald-700">{incrementsInfo.qualifyingIncrements} علاوة مؤهلة</span>
            </div>
            <div>
              <span className="text-slate-500 block">تاريخ استحقاق الدرجة:</span>
              <span className="font-medium text-slate-700">{selectedEmployee.gradeEntryDate || 'غير مسجل'}</span>
            </div>
          </div>

          {/* Grade Progression Settings */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">الدرجة السابقة:</label>
              <input
                type="text"
                value={previousGrade}
                disabled
                className="w-full text-sm border border-slate-200 rounded-xl p-2.5 bg-slate-100 text-slate-600 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                الدرجة الجديدة الصادر بها القرار: <span className="text-rose-600">*</span>
              </label>
              <select
                value={newGrade}
                onChange={(e) => setNewGrade(e.target.value)}
                className="w-full text-sm border border-slate-300 rounded-xl p-2.5 bg-white focus:ring-2 focus:ring-emerald-600 outline-none font-medium"
              >
                {JOB_GRADES.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
              {formErrors.newGrade && (
                <p className="text-rose-600 text-xs mt-1">{formErrors.newGrade}</p>
              )}
            </div>
          </div>

          {/* Progression Jump Warning */}
          {progressionCheck.isJump && (
            <div className="bg-amber-50 border border-amber-300 rounded-xl p-3 flex items-start gap-2.5 text-xs text-amber-900">
              <AlertTriangle className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">تحذير التدرج الرتبي:</span> {progressionCheck.warning}
              </div>
            </div>
          )}

          {/* Decision Number, Date & Issuing Authority */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                رقم القرار الرسمي: <span className="text-rose-600">*</span>
              </label>
              <input
                type="text"
                value={decisionNumber}
                onChange={(e) => setDecisionNumber(e.target.value)}
                placeholder="مثال: قرار وزاري رقم (105) لسنة 2026"
                className="w-full text-sm border border-slate-300 rounded-xl p-2.5 bg-white focus:ring-2 focus:ring-emerald-600 outline-none"
              />
              {formErrors.decisionNumber && (
                <p className="text-rose-600 text-xs mt-1">{formErrors.decisionNumber}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                تاريخ صدور القرار: <span className="text-rose-600">*</span>
              </label>
              <input
                type="date"
                value={decisionDate}
                onChange={(e) => setDecisionDate(e.target.value)}
                className="w-full text-sm border border-slate-300 rounded-xl p-2.5 bg-white focus:ring-2 focus:ring-emerald-600 outline-none"
              />
              {formErrors.decisionDate && (
                <p className="text-rose-600 text-xs mt-1">{formErrors.decisionDate}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                تاريخ نفاذ الترقية: <span className="text-rose-600">*</span>
              </label>
              <input
                type="date"
                value={effectiveDate}
                onChange={(e) => setEffectiveDate(e.target.value)}
                className="w-full text-sm border border-slate-300 rounded-xl p-2.5 bg-white focus:ring-2 focus:ring-emerald-600 outline-none"
              />
              {formErrors.effectiveDate && (
                <p className="text-rose-600 text-xs mt-1">{formErrors.effectiveDate}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              الجهة المصدرة للقرار: <span className="text-rose-600">*</span>
            </label>
            <input
              type="text"
              value={issuingAuthority}
              onChange={(e) => setIssuingAuthority(e.target.value)}
              placeholder="مثال: وزارة الصحة / لجنة شؤون الموظفين / مجلس الوزراء"
              className="w-full text-sm border border-slate-300 rounded-xl p-2.5 bg-white focus:ring-2 focus:ring-emerald-600 outline-none"
            />
            {formErrors.issuingAuthority && (
              <p className="text-rose-600 text-xs mt-1">{formErrors.issuingAuthority}</p>
            )}
          </div>

          {/* Competency Report (Optional, warning if absent) */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-slate-500" />
                تقرير الكفاءة السنوي (إدخال اختياري):
              </label>
              <span className="text-[11px] text-slate-500">عدم وجود التقرير لا يمنع تسجيل القرار الصادر</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(['ممتاز', 'جيد جداً', 'جيد', 'مقبول', 'ضعيف', 'غير متوفر', 'غير مسجل'] as CompetencyReportRating[]).map((rating) => (
                <label
                  key={rating}
                  className={`flex items-center gap-2 p-2 rounded-lg border text-xs cursor-pointer transition-colors ${
                    competencyRating === rating 
                      ? 'bg-emerald-100 border-emerald-400 font-bold text-emerald-900' 
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <input
                    type="radio"
                    name="competencyRating"
                    value={rating}
                    checked={competencyRating === rating}
                    onChange={() => setCompetencyRating(rating)}
                    className="accent-emerald-700"
                  />
                  <span>{rating}</span>
                </label>
              ))}
            </div>

            {competencyRating === 'غير متوفر' && (
              <div className="mt-2 text-[11px] text-amber-700 bg-amber-50 p-2 rounded-lg border border-amber-200 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 flex-shrink-0" />
                <span>تنبيه: تقرير الكفاءة غير متوفر. سيتم توثيق القرار وإدراجه في السجل دون اختلاق تقييم افتراضي.</span>
              </div>
            )}
          </div>

          {/* Optional Qualification & Job Title */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">المؤهل العلمي المسند للترقية:</label>
              <input
                type="text"
                value={qualification}
                onChange={(e) => setQualification(e.target.value)}
                placeholder="مثال: بكالوريوس إدارة أعمال"
                className="w-full text-sm border border-slate-300 rounded-xl p-2.5 bg-white focus:ring-2 focus:ring-emerald-600 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">المسمى الوظيفي المعتمد:</label>
              <input
                type="text"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="مثال: باحث أول شؤون إدارية"
                className="w-full text-sm border border-slate-300 rounded-xl p-2.5 bg-white focus:ring-2 focus:ring-emerald-600 outline-none"
              />
            </div>
          </div>

          {/* Notes & PDF File */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">ملاحظات وسند القرار:</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="أي مبررات أو قرارات ملحقة أو تفاصيل أخرى..."
              className="w-full text-sm border border-slate-300 rounded-xl p-2.5 bg-white focus:ring-2 focus:ring-emerald-600 outline-none resize-none"
            />
          </div>

          {/* Form Actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-sm font-semibold hover:bg-slate-100 transition-colors"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-gradient-to-l from-emerald-700 to-teal-800 text-white text-sm font-bold shadow-md hover:from-emerald-800 hover:to-teal-900 transition-all flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>اعتماد وتسجيل الترقية الرسمية</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
