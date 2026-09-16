import React from 'react';
import { AnnualPerformanceEvaluation } from '../../types';
import { EVALUATION_CATEGORIES, EVALUATION_RATING_GUIDE } from '../../utils/evaluationUtils';
import { formatDateDisplay } from '../../utils/dateUtils';

interface AnnualEvaluationPrintDocumentProps {
  evaluation: AnnualPerformanceEvaluation;
  officialLogoUrl?: string;
  idPrefix?: string;
  isBulkPrint?: boolean;
  generalManagerName?: string;
}

export const AnnualEvaluationPrintDocument: React.FC<AnnualEvaluationPrintDocumentProps> = ({
  evaluation,
  officialLogoUrl = '/logo.jpg',
  idPrefix = 'PRINT_EVALUATION',
  isBulkPrint = false,
  generalManagerName = 'نجيب صالح بوحسن'
}) => {
  const containerId = `${idPrefix}_${evaluation.id}`;
  const isElectronic = evaluation.mode === 'إلكتروني';
  const gmName = evaluation.higherSupervisorName || generalManagerName || 'نجيب صالح بوحسن';

  return (
    <div
      id={containerId}
      className={`print-evaluation-document bg-white text-black font-sans box-border w-full max-w-[210mm] mx-auto p-3 text-right select-none ${
        isBulkPrint ? 'page-break-after-always' : ''
      }`}
      dir="rtl"
      style={{
        width: '210mm',
        minHeight: '293mm',
        maxHeight: '297mm',
        boxSizing: 'border-box',
        color: '#000000',
        backgroundColor: '#ffffff',
        fontFamily: 'system-ui, -apple-system, "Segoe UI", Tahoma, Arial, sans-serif',
        lineHeight: 1.2,
        fontSize: '10px'
      }}
    >
      {/* 1. OFFICIAL HEADER */}
      <div className="flex items-center justify-between border-b-2 border-black pb-1.5 mb-1.5">
        {/* Right text */}
        <div className="text-center font-bold text-[11px] leading-snug w-48">
          <p className="font-extrabold text-[12px] m-0">دولة ليبيا</p>
          <p className="font-bold text-[11px] m-0">وزارة الصحة</p>
          <p className="font-extrabold text-[11.5px] m-0">مصرف الدم المركزي المرج</p>
        </div>

        {/* Center Logo */}
        <div className="flex flex-col items-center justify-center px-2">
          <img
            src={officialLogoUrl || '/logo.jpg'}
            alt="شعار مصرف الدم المركزي المرج"
            className="w-12 h-12 object-contain"
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
        </div>

        {/* Left administrative metadata */}
        <div className="text-right font-bold text-[10px] leading-snug w-48" dir="rtl">
          <p className="m-0">
            <span className="font-semibold text-slate-800">القطاع:</span>{' '}
            <span className="font-bold">{evaluation.sector || 'الصحة'}</span>
          </p>
          <p className="m-0">
            <span className="font-semibold text-slate-800">رقم الملف:</span>{' '}
            <span className="font-mono font-extrabold text-[11px]">{evaluation.fileNumber}</span>
          </p>
          <p className="text-[9px] text-slate-600 font-normal m-0">
            رمز الوثيقة: <span className="font-mono">{evaluation.id}</span>
          </p>
        </div>
      </div>

      {/* 2. REPORT TITLE & EVALUATION PERIOD */}
      <div className="text-center my-1 pb-1 border-b border-black">
        <h1 className="text-[14px] font-black tracking-wide text-black m-0 mb-0.5">
          تقرير كفاءة الموظف
        </h1>
        <div className="inline-block bg-slate-100 border border-slate-400 px-4 py-0.5 rounded text-[9.5px] font-bold text-slate-900">
          {evaluation.periodText || `للمدة التي تبتدئ من 01/01/${evaluation.evaluationYear} وتنتهي في 31/12/${evaluation.evaluationYear}`}
        </div>
      </div>

      {/* 3. SECTION ONE: GENERAL INFORMATION */}
      <div className="mb-1.5">
        <div className="bg-slate-200 border border-black font-extrabold text-[10px] px-2 py-0.5 mb-0.5 text-black flex justify-between items-center">
          <span>القسم الأول: معلومات عامة</span>
          <span className="text-[8.5px] font-normal text-slate-700">بيانات السجل الوظيفي المعتمدة</span>
        </div>

        <table className="w-full border-collapse border border-black text-[9.5px]">
          <tbody>
            <tr>
              <td className="border border-black bg-slate-50 font-bold p-1 w-24">الاسم واللقب:</td>
              <td className="border border-black font-extrabold p-1 text-[10.5px]" colSpan={3}>
                {evaluation.employeeName}
              </td>
              <td className="border border-black bg-slate-50 font-bold p-1 w-32">تاريخ ومكان الميلاد:</td>
              <td className="border border-black font-medium p-1 w-40">
                {evaluation.birthDateAndPlace || '...........................................'}
              </td>
            </tr>
            <tr>
              <td className="border border-black bg-slate-50 font-bold p-1">تاريخ التعيين:</td>
              <td className="border border-black font-medium p-1 w-32">
                {evaluation.hireDate || '...........................................'}
              </td>
              <td className="border border-black bg-slate-50 font-bold p-1 w-24">المؤهل العلمي:</td>
              <td className="border border-black font-medium p-1">
                {evaluation.qualification || '...........................................'}
              </td>
              <td className="border border-black bg-slate-50 font-bold p-1">تاريخ الحصول عليه:</td>
              <td className="border border-black font-medium p-1">
                {evaluation.qualificationDate || '...........................................'}
              </td>
            </tr>
            <tr>
              <td className="border border-black bg-slate-50 font-bold p-1">الوظيفة الحالية:</td>
              <td className="border border-black font-semibold p-1" colSpan={3}>
                {evaluation.currentJobTitle || '...........................................'}
              </td>
              <td className="border border-black bg-slate-50 font-bold p-1">مكان العمل الحالي:</td>
              <td className="border border-black font-medium p-1">
                {evaluation.workplace || 'مصرف الدم المركزي المرج'}
              </td>
            </tr>
            <tr>
              <td className="border border-black bg-slate-50 font-bold p-1">الدرجة الحالية:</td>
              <td className="border border-black font-bold p-1">
                {evaluation.currentGrade === 'تحتاج إلى مراجعة' ? (
                  <span className="text-red-700 font-bold">تحتاج إلى مراجعة</span>
                ) : (
                  evaluation.currentGrade || '...........................................'
                )}
              </td>
              <td className="border border-black bg-slate-50 font-bold p-1">تاريخ نيلها:</td>
              <td className="border border-black font-medium p-1">
                {evaluation.currentGrade === 'تحتاج إلى مراجعة' || !evaluation.gradeDate ? (
                  evaluation.currentGrade === 'تحتاج إلى مراجعة' ? 'تحتاج إلى مراجعة' : '...........................................'
                ) : (
                  formatDateDisplay(evaluation.gradeDate) || evaluation.gradeDate
                )}
              </td>
              <td className="border border-black bg-slate-50 font-bold p-1">الجنسية:</td>
              <td className="border border-black font-medium p-1">
                {evaluation.nationality || 'ليبي'}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* 4. SECTION TWO: PERFORMANCE & PERSONAL QUALITIES */}
      <div className="mb-1.5">
        <div className="bg-slate-200 border border-black font-extrabold text-[10px] px-2 py-0.5 mb-0.5 text-black flex justify-between items-center">
          <span>القسم الثاني: كفاءة الأداء والصفات الشخصية</span>
          <span className="text-[8.5px] font-normal text-slate-700">تعبئة يدوية بواسطة الرئيس المباشر</span>
        </div>

        <table className="w-full border-collapse border border-black text-[9px]">
          <thead>
            <tr className="bg-slate-100 text-center font-bold">
              <th className="border border-black p-0.5 w-8">م</th>
              <th className="border border-black p-0.5 text-right pr-1.5">عنصر التقييم</th>
              <th className="border border-black p-0.5 w-12">النسبة</th>
              <th className="border border-black p-0.5 w-14">درجة الكفاءة</th>
              <th className="border border-black p-0.5 w-40">مبررات الحكم على الكفاءة</th>
              <th className="border border-black p-0.5 w-16">درجة الكفاءة المعدلة</th>
              <th className="border border-black p-0.5 w-40">مبررات تعديل درجة الكفاءة</th>
            </tr>
          </thead>
          <tbody>
            {EVALUATION_CATEGORIES.map((cat, catIdx) => (
              <React.Fragment key={cat.id}>
                {/* Category Header Row */}
                <tr className="bg-slate-100 font-extrabold">
                  <td className="border border-black text-center font-bold text-[8.5px] p-0.5">
                    {catIdx + 1}
                  </td>
                  <td className="border border-black p-0.5 pr-1.5 font-extrabold text-[9.5px]">
                    {cat.title}
                  </td>
                  <td className="border border-black p-0.5 text-center font-extrabold text-[9.5px]">
                    {cat.weight}%
                  </td>
                  <td className="border border-black bg-slate-50"></td>
                  <td className="border border-black bg-slate-50"></td>
                  <td className="border border-black bg-slate-50"></td>
                  <td className="border border-black bg-slate-50"></td>
                </tr>

                {/* Sub-items */}
                {cat.items.map((item, itemIdx) => {
                  const itemVal = evaluation.scores?.[item.id];
                  const hasScore = isElectronic && itemVal?.score !== undefined && itemVal?.score !== '';
                  const hasNotes = isElectronic && itemVal?.notes;

                  return (
                    <tr key={item.id} className="h-4.5">
                      <td className="border border-black text-center text-slate-600 text-[8px] p-0.5">
                        {catIdx + 1}/{itemIdx + 1}
                      </td>
                      <td className="border border-black pr-2 text-[9px] p-0.5">
                        {item.name}
                      </td>
                      <td className="border border-black text-center text-slate-700 text-[8.5px] p-0.5">
                        {item.weight}%
                      </td>
                      <td className="border border-black text-center font-bold font-mono text-[9px] p-0.5">
                        {hasScore ? itemVal?.score : ''}
                      </td>
                      <td className="border border-black px-1 text-[8.5px] text-slate-800 p-0.5">
                        {hasNotes ? itemVal?.notes : ''}
                      </td>
                      <td className="border border-black text-center font-bold font-mono text-[9px] p-0.5">
                        {/* Adjusted Score for manual/electronic completion */}
                      </td>
                      <td className="border border-black px-1 text-[8.5px] text-slate-800 p-0.5">
                        {/* Adjusted Justification for manual/electronic completion */}
                      </td>
                    </tr>
                  );
                })}
              </React.Fragment>
            ))}

            {/* Total Row */}
            <tr className="bg-slate-200 font-extrabold text-[9.5px]">
              <td className="border border-black text-center" colSpan={2}>
                المجمــــوع الكلـــــي
              </td>
              <td className="border border-black text-center font-bold">
                100%
              </td>
              <td className="border border-black text-center font-mono text-[10px] font-black">
                {isElectronic && evaluation.totalScore ? evaluation.totalScore : ''}
              </td>
              <td className="border border-black text-center text-[8.5px] text-slate-800">
                {isElectronic && evaluation.performanceRating ? `التقدير: ${evaluation.performanceRating}` : ''}
              </td>
              <td className="border border-black text-center font-mono text-[10px] font-black">
                {isElectronic && evaluation.adjustedScore ? evaluation.adjustedScore : ''}
              </td>
              <td className="border border-black text-[8.5px] px-1 text-slate-800">
                {isElectronic && evaluation.adjustedScoreJustification ? evaluation.adjustedScoreJustification : ''}
              </td>
            </tr>
          </tbody>
        </table>

        {/* Classification Guide Reference Bar */}
        <div className="mt-1 border border-black bg-slate-50 px-2 py-0.5 flex items-center justify-between text-[8px]">
          <span className="font-extrabold text-slate-900">دليل تقييم الكفاءة:</span>
          {EVALUATION_RATING_GUIDE.map((g, i) => (
            <span key={i} className="font-semibold">
              <strong>{g.rating}:</strong> ({g.range})
            </span>
          ))}
        </div>
      </div>

      {/* 5. SECTION THREE: RECOMMENDATIONS */}
      <div className="mb-1.5">
        <div className="bg-slate-200 border border-black font-extrabold text-[10px] px-2 py-0.5 mb-0.5 text-black flex justify-between items-center">
          <span>القسم الثالث: إبداء الرئيس رأيه صراحة في مرؤوسه</span>
          <span className="text-[8.5px] font-normal text-slate-700">توصيات واقتراحات الرئيس المباشر</span>
        </div>

        <div className="border border-black p-1.5 bg-white space-y-0.5 text-[9px] leading-snug">
          {/* Rec 1 */}
          <div className="flex items-center justify-between border-b border-dotted border-slate-300 pb-0.5">
            <span className="font-medium">
              1- توصية بمنحه مكافأة أو علاوة استثنائية وفقاً للقوانين واللوائح.
            </span>
            <div className="flex items-center gap-3 text-[8.5px] font-bold shrink-0">
              <span className="flex items-center gap-1">
                <span>نعم</span>
                <span className="w-3.5 h-3.5 border border-black inline-block text-center text-[9px] leading-none font-black">
                  {evaluation.recommendations?.exceptionalBonusOrAllowance === 'نعم' ? '✓' : ''}
                </span>
              </span>
              <span className="flex items-center gap-1">
                <span>لا</span>
                <span className="w-3.5 h-3.5 border border-black inline-block text-center text-[9px] leading-none font-black">
                  {evaluation.recommendations?.exceptionalBonusOrAllowance === 'لا' ? '✓' : ''}
                </span>
              </span>
            </div>
          </div>

          {/* Rec 2 */}
          <div className="flex items-center justify-between border-b border-dotted border-slate-300 pb-0.5">
            <span className="font-medium">
              2- ترشيحه للترقية إلى وظيفة من درجة أعلى.
            </span>
            <div className="flex items-center gap-3 text-[8.5px] font-bold shrink-0">
              <span className="flex items-center gap-1">
                <span>نعم</span>
                <span className="w-3.5 h-3.5 border border-black inline-block text-center text-[9px] leading-none font-black">
                  {evaluation.recommendations?.nominationForPromotion === 'نعم' ? '✓' : ''}
                </span>
              </span>
              <span className="flex items-center gap-1">
                <span>لا</span>
                <span className="w-3.5 h-3.5 border border-black inline-block text-center text-[9px] leading-none font-black">
                  {evaluation.recommendations?.nominationForPromotion === 'لا' ? '✓' : ''}
                </span>
              </span>
            </div>
          </div>

          {/* Rec 3 */}
          <div className="flex items-center justify-between border-b border-dotted border-slate-300 pb-0.5">
            <div className="flex-1 pr-1">
              <span className="font-medium">
                3- حاجته إلى التدريب في مجالات يتم تحديدها.
              </span>
              <span className="text-[8px] text-slate-700 mr-2">
                (المجال: {evaluation.recommendations?.trainingDetails || '...........................................'})
              </span>
            </div>
            <div className="flex items-center gap-3 text-[8.5px] font-bold shrink-0">
              <span className="flex items-center gap-1">
                <span>نعم</span>
                <span className="w-3.5 h-3.5 border border-black inline-block text-center text-[9px] leading-none font-black">
                  {evaluation.recommendations?.trainingNeeds === 'نعم' ? '✓' : ''}
                </span>
              </span>
              <span className="flex items-center gap-1">
                <span>لا</span>
                <span className="w-3.5 h-3.5 border border-black inline-block text-center text-[9px] leading-none font-black">
                  {evaluation.recommendations?.trainingNeeds === 'لا' ? '✓' : ''}
                </span>
              </span>
            </div>
          </div>

          {/* Rec 4 */}
          <div className="flex items-center justify-between">
            <div className="flex-1 pr-1">
              <span className="font-medium">
                4- التوصية بنقله إلى وظيفة أخرى تتناسب مع قدرته وإمكانياته.
              </span>
              <span className="text-[8px] text-slate-700 mr-2">
                (الوظيفة المقترحة: {evaluation.recommendations?.transferDetails || '...........................................'})
              </span>
            </div>
            <div className="flex items-center gap-3 text-[8.5px] font-bold shrink-0">
              <span className="flex items-center gap-1">
                <span>نعم</span>
                <span className="w-3.5 h-3.5 border border-black inline-block text-center text-[9px] leading-none font-black">
                  {evaluation.recommendations?.transferToAnotherJob === 'نعم' ? '✓' : ''}
                </span>
              </span>
              <span className="flex items-center gap-1">
                <span>لا</span>
                <span className="w-3.5 h-3.5 border border-black inline-block text-center text-[9px] leading-none font-black">
                  {evaluation.recommendations?.transferToAnotherJob === 'لا' ? '✓' : ''}
                </span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 6. SIGNATURES & OFFICIAL APPROVALS */}
      <div className="grid grid-cols-3 gap-1.5 border border-black p-1 bg-slate-50 text-[9px]">
        {/* Direct Supervisor */}
        <div className="border border-black p-1.5 bg-white space-y-0.5">
          <div className="font-black text-center border-b border-black pb-0.5 text-[9.5px]">
            الرئيس المباشر
          </div>
          <p className="m-0 pt-0.5">
            <span className="font-bold">الاسم:</span>{' '}
            <span className="font-medium">{evaluation.directSupervisorName || '................................'}</span>
          </p>
          <p className="m-0">
            <span className="font-bold">الوظيفة/الدرجة:</span>{' '}
            <span className="font-medium">{evaluation.directSupervisorJobOrGrade || '................................'}</span>
          </p>
          <p className="pt-2 m-0">
            <span className="font-bold">التوقيع:</span> ................................
          </p>
        </div>

        {/* Higher Supervisor (General Manager) */}
        <div className="border border-black p-1.5 bg-white space-y-0.5">
          <div className="font-black text-center border-b border-black pb-0.5 text-[9.5px]">
            المدير العام
          </div>
          <p className="m-0 pt-0.5">
            <span className="font-bold">الاسم:</span>{' '}
            <span className="font-extrabold">{gmName}</span>
          </p>
          <p className="m-0">
            <span className="font-bold">الوظيفة:</span>{' '}
            <span className="font-medium">{evaluation.higherSupervisorJobOrGrade || 'مدير عام مصرف الدم المركزي المرج'}</span>
          </p>
          <p className="pt-2 m-0">
            <span className="font-bold">التوقيع:</span> ................................
          </p>
        </div>

        {/* HR Preparation & Official Stamp */}
        <div className="border border-black p-1.5 bg-white flex flex-col justify-between">
          <div>
            <div className="font-black text-center border-b border-black pb-0.5 text-[9.5px]">
              إعداد شؤون الموظفين
            </div>
            <div className="space-y-0.5 text-[8.5px] pt-0.5">
              <p className="m-0">
                <span className="font-bold">الاسم:</span>{' '}
                <span>{evaluation.hrPreparerName || '............................'}</span>
              </p>
              <p className="m-0">
                <span className="font-bold">التاريخ:</span>{' '}
                <span>{evaluation.hrPreparationDate || '..... / ..... / .........'}</span>
              </p>
              <p className="m-0">
                <span className="font-bold">التوقيع:</span> ............................
              </p>
            </div>
          </div>

          {/* Official Stamp Area */}
          <div className="mt-1 border border-dashed border-slate-500 rounded p-0.5 text-center bg-slate-50">
            <div className="text-[7.5px] font-black text-slate-700 tracking-wider">
              ختم مكتب شؤون الموظفين
            </div>
            <div className="h-4 flex items-center justify-center text-[7px] text-slate-400">
              (مكان وضع الختم الرسمي)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
