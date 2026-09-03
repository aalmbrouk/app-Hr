import { AnnualPerformanceEvaluation } from '../types';
import { EVALUATION_CATEGORIES, EVALUATION_RATING_GUIDE } from './evaluationUtils';

/**
 * Generates the clean, standalone HTML for an Annual Performance Evaluation (A4 Portrait)
 */
export function generateEvaluationPrintHtml(
  evaluation: AnnualPerformanceEvaluation,
  officialLogoUrl: string = '/logo.jpg',
  generalManagerName: string = 'نجيب صالح بوحسن'
): string {
  const isElectronic = evaluation.mode === 'إلكتروني';
  const gmName = evaluation.higherSupervisorName || generalManagerName || 'نجيب صالح بوحسن';

  // Build Table Rows
  const tableRowsHtml = EVALUATION_CATEGORIES.map((cat, catIdx) => {
    const categoryHeaderRow = `
      <tr style="background-color: #f1f5f9; font-weight: 800; border: 1px solid #000000;">
        <td style="border: 1px solid #000000; text-align: center; font-size: 10px; padding: 2px;">${catIdx + 1}</td>
        <td style="border: 1px solid #000000; font-size: 10.5px; font-weight: 800; padding: 2px 6px;">${cat.title}</td>
        <td style="border: 1px solid #000000; text-align: center; font-weight: 800; font-size: 10.5px; padding: 2px;">${cat.weight}%</td>
        <td style="border: 1px solid #000000; background-color: #f8fafc;"></td>
        <td style="border: 1px solid #000000; background-color: #f8fafc;"></td>
        <td style="border: 1px solid #000000; background-color: #f8fafc;"></td>
        <td style="border: 1px solid #000000; background-color: #f8fafc;"></td>
      </tr>
    `;

    const subItemRows = cat.items.map((item, itemIdx) => {
      const itemScore = isElectronic ? evaluation.scores?.[item.id]?.score || '' : '';
      const itemNotes = isElectronic ? evaluation.scores?.[item.id]?.notes || '' : '';

      return `
        <tr style="border: 1px solid #000000; height: 18px;">
          <td style="border: 1px solid #000000; text-align: center; font-size: 9px; color: #475569; padding: 1px 2px;">${catIdx + 1}/${itemIdx + 1}</td>
          <td style="border: 1px solid #000000; font-size: 9.5px; padding: 1px 6px;">${item.name}</td>
          <td style="border: 1px solid #000000; text-align: center; font-size: 9px; color: #334155; padding: 1px 2px;">${item.weight}%</td>
          <td style="border: 1px solid #000000; text-align: center; font-size: 9.5px; font-weight: bold; font-family: monospace; padding: 1px 2px;">${itemScore}</td>
          <td style="border: 1px solid #000000; font-size: 9px; padding: 1px 4px;">${itemNotes}</td>
          <td style="border: 1px solid #000000; text-align: center; font-size: 9.5px; font-weight: bold; font-family: monospace; padding: 1px 2px;"></td>
          <td style="border: 1px solid #000000; font-size: 9px; padding: 1px 4px;"></td>
        </tr>
      `;
    }).join('');

    return categoryHeaderRow + subItemRows;
  }).join('');

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>تقرير كفاءة الموظف - ${evaluation.employeeName} (${evaluation.evaluationYear})</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 5mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      margin: 0;
      padding: 0;
      background-color: #ffffff;
      color: #000000;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      font-size: 10px;
      line-height: 1.2;
      direction: rtl;
      text-align: right;
    }
    .page-container {
      width: 200mm;
      max-width: 200mm;
      margin: 0 auto;
      padding: 4mm 2mm;
      background: #ffffff;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      border: 1.5px solid #000000;
    }
    th, td {
      border: 1px solid #000000;
      padding: 2px 4px;
    }
    .header-box {
      border-bottom: 2px solid #000000;
      padding-bottom: 3px;
      margin-bottom: 4px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .header-text-right {
      text-align: center;
      width: 180px;
      line-height: 1.25;
      font-size: 10.5px;
    }
    .header-logo {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }
    .header-meta-left {
      text-align: right;
      width: 180px;
      font-size: 10px;
      line-height: 1.3;
    }
    .title-banner {
      text-align: center;
      margin: 2px 0 4px 0;
      padding-bottom: 2px;
      border-bottom: 1.5px solid #000000;
    }
    .title-text {
      font-size: 15px;
      font-weight: 900;
      margin: 0 0 2px 0;
      letter-spacing: 0.5px;
    }
    .period-badge {
      display: inline-block;
      border: 1px solid #334155;
      background: #f8fafc;
      padding: 1px 12px;
      border-radius: 4px;
      font-size: 9.5px;
      font-weight: bold;
    }
    .section-header {
      background-color: #e2e8f0;
      border: 1px solid #000000;
      font-weight: 900;
      font-size: 10px;
      padding: 2px 6px;
      margin-top: 3px;
      margin-bottom: 2px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .checkbox-box {
      display: inline-block;
      width: 13px;
      height: 13px;
      border: 1.5px solid #000000;
      text-align: center;
      line-height: 11px;
      font-weight: 900;
      font-size: 11px;
      margin-left: 4px;
      vertical-align: middle;
    }
    .signature-grid {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 4px;
      margin-top: 3px;
    }
    .signature-card {
      border: 1.5px solid #000000;
      padding: 4px;
      background: #ffffff;
      font-size: 9px;
      line-height: 1.35;
    }
    .stamp-box {
      border: 1.5px dashed #475569;
      padding: 2px;
      text-align: center;
      margin-top: 2px;
      background: #f8fafc;
      border-radius: 3px;
    }
    @media print {
      body {
        margin: 0 !important;
        padding: 0 !important;
      }
      .no-print {
        display: none !important;
      }
      .page-container {
        width: 100% !important;
        max-width: 100% !important;
        padding: 0 !important;
      }
    }
  </style>
</head>
<body>
  <!-- Print Trigger Bar (Hidden during actual print) -->
  <div class="no-print" style="background: #0f172a; color: #ffffff; padding: 8px 16px; display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #334155; font-family: system-ui;">
    <div style="font-weight: bold; font-size: 13px;">
      معاينة طباعة تقرير الكفاءة السنوي (A4) - ${evaluation.employeeName}
    </div>
    <div style="display: flex; gap: 8px;">
      <button onclick="window.print()" style="background: #059669; color: #ffffff; border: none; padding: 6px 16px; border-radius: 6px; font-weight: bold; font-size: 12px; cursor: pointer; display: flex; align-items: center; gap: 6px;">
        <span>🖨️ طباعة الآن (Print)</span>
      </button>
      <button onclick="window.close()" style="background: #334155; color: #ffffff; border: none; padding: 6px 14px; border-radius: 6px; font-weight: bold; font-size: 12px; cursor: pointer;">
        إغلاق النافذة
      </button>
    </div>
  </div>

  <div class="page-container">
    <!-- 1. OFFICIAL HEADER -->
    <div class="header-box">
      <div class="header-text-right">
        <div style="font-weight: 900; font-size: 11.5px;">دولة ليبيا</div>
        <div style="font-weight: 800; font-size: 11px;">وزارة الصحة</div>
        <div style="font-weight: 900; font-size: 11.5px;">مصرف الدم المركزي المرج</div>
      </div>

      <div class="header-logo">
        <img src="${officialLogoUrl}" alt="شعار مصرف الدم المركزي المرج" style="width: 50px; height: 50px; object-fit: contain;" onerror="this.style.display='none'" />
      </div>

      <div class="header-meta-left">
        <div><strong>القطاع:</strong> <span>${evaluation.sector || 'الصحة'}</span></div>
        <div><strong>رقم الملف:</strong> <span style="font-family: monospace; font-weight: 900; font-size: 11.5px;">${evaluation.fileNumber}</span></div>
        <div style="font-size: 8.5px; color: #475569;">رمز الوثيقة: <span style="font-family: monospace;">${evaluation.id}</span></div>
      </div>
    </div>

    <!-- 2. REPORT TITLE & PERIOD -->
    <div class="title-banner">
      <h1 class="title-text">تقرير كفاءة الموظف</h1>
      <div class="period-badge">
        ${evaluation.periodText || `للمدة التي تبتدئ من 01/01/${evaluation.evaluationYear} وتنتهي في 31/12/${evaluation.evaluationYear}`}
      </div>
    </div>

    <!-- 3. SECTION ONE: GENERAL INFORMATION -->
    <div class="section-header">
      <span>القسم الأول: معلومات عامة</span>
      <span style="font-size: 8.5px; font-weight: normal; color: #334155;">بيانات السجل الوظيفي المعتمدة</span>
    </div>

    <table style="font-size: 9.5px; margin-bottom: 3px;">
      <tbody>
        <tr>
          <td style="width: 80px; background: #f8fafc; font-weight: bold;">الاسم واللقب:</td>
          <td colspan="3" style="font-weight: 900; font-size: 10.5px;">${evaluation.employeeName}</td>
          <td style="width: 95px; background: #f8fafc; font-weight: bold;">تاريخ ومكان الميلاد:</td>
          <td style="width: 140px;">${evaluation.birthDateAndPlace || '...........................................'}</td>
        </tr>
        <tr>
          <td style="background: #f8fafc; font-weight: bold;">تاريخ التعيين:</td>
          <td style="width: 100px;">${evaluation.hireDate || '...........................................'}</td>
          <td style="width: 75px; background: #f8fafc; font-weight: bold;">المؤهل العلمي:</td>
          <td>${evaluation.qualification || '...........................................'}</td>
          <td style="background: #f8fafc; font-weight: bold;">تاريخ الحصول عليه:</td>
          <td>${evaluation.qualificationDate || '...........................................'}</td>
        </tr>
        <tr>
          <td style="background: #f8fafc; font-weight: bold;">الوظيفة الحالية:</td>
          <td colspan="3" style="font-weight: 600;">${evaluation.currentJobTitle || '...........................................'}</td>
          <td style="background: #f8fafc; font-weight: bold;">مكان العمل الحالي:</td>
          <td>${evaluation.workplace || 'مصرف الدم المركزي المرج'}</td>
        </tr>
        <tr>
          <td style="background: #f8fafc; font-weight: bold;">الدرجة الحالية:</td>
          <td style="font-weight: bold;">${evaluation.currentGrade || '...........................................'}</td>
          <td style="background: #f8fafc; font-weight: bold;">تاريخ نيلها:</td>
          <td>${evaluation.gradeDate || '...........................................'}</td>
          <td style="background: #f8fafc; font-weight: bold;">الجنسية:</td>
          <td>${evaluation.nationality || 'ليبي'}</td>
        </tr>
      </tbody>
    </table>

    <!-- 4. SECTION TWO: PERFORMANCE & PERSONAL QUALITIES -->
    <div class="section-header">
      <span>القسم الثاني: كفاءة الأداء والصفات الشخصية</span>
      <span style="font-size: 8.5px; font-weight: normal; color: #334155;">تعبئة يدوية بواسطة الرئيس المباشر</span>
    </div>

    <table style="font-size: 9px; margin-bottom: 2px;">
      <thead>
        <tr style="background: #f1f5f9; text-align: center; font-weight: bold;">
          <th style="width: 25px;">م</th>
          <th style="text-align: right; padding-right: 6px;">عنصر التقييم</th>
          <th style="width: 45px;">النسبة</th>
          <th style="width: 55px;">درجة الكفاءة</th>
          <th style="width: 140px;">مبررات الحكم على الكفاءة</th>
          <th style="width: 60px;">درجة الكفاءة المعدلة</th>
          <th style="width: 140px;">مبررات تعديل درجة الكفاءة</th>
        </tr>
      </thead>
      <tbody>
        ${tableRowsHtml}
        <!-- Total Row -->
        <tr style="background-color: #e2e8f0; font-weight: 900; font-size: 9.5px;">
          <td colspan="2" style="text-align: center;">المجمــــوع الكلـــــي</td>
          <td style="text-align: center; font-weight: 900;">100%</td>
          <td style="text-align: center; font-family: monospace; font-size: 10.5px;">${isElectronic && evaluation.totalScore ? evaluation.totalScore : ''}</td>
          <td style="text-align: center; font-size: 8.5px;">${isElectronic && evaluation.performanceRating ? `التقدير: ${evaluation.performanceRating}` : ''}</td>
          <td style="text-align: center; font-family: monospace; font-size: 10.5px;">${isElectronic && evaluation.adjustedScore ? evaluation.adjustedScore : ''}</td>
          <td style="font-size: 8.5px;">${isElectronic && evaluation.adjustedScoreJustification ? evaluation.adjustedScoreJustification : ''}</td>
        </tr>
      </tbody>
    </table>

    <!-- Rating Classification Guide -->
    <div style="border: 1px solid #000000; background: #f8fafc; padding: 2px 6px; display: flex; justify-content: space-between; font-size: 8px; margin-bottom: 3px;">
      <span style="font-weight: 900;">دليل تقييم الكفاءة:</span>
      ${EVALUATION_RATING_GUIDE.map(g => `<span style="font-weight: 600;"><strong>${g.rating}:</strong> (${g.range})</span>`).join('')}
    </div>

    <!-- 5. SECTION THREE: RECOMMENDATIONS -->
    <div class="section-header">
      <span>القسم الثالث: إبداء الرئيس رأيه صراحة في مرؤوسه</span>
      <span style="font-size: 8.5px; font-weight: normal; color: #334155;">توصيات واقتراحات الرئيس المباشر</span>
    </div>

    <div style="border: 1.5px solid #000000; padding: 3px 6px; background: #ffffff; font-size: 8.8px; line-height: 1.35; margin-bottom: 3px;">
      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px dotted #cbd5e1; padding-bottom: 2px;">
        <span>1- توصية بمنحه مكافأة أو علاوة استثنائية وفقاً للقوانين واللوائح.</span>
        <div style="font-weight: bold;">
          <span>نعم</span> <span class="checkbox-box">${evaluation.recommendations?.exceptionalBonusOrAllowance === 'نعم' ? '✓' : ''}</span>
          <span style="margin-right: 8px;">لا</span> <span class="checkbox-box">${evaluation.recommendations?.exceptionalBonusOrAllowance === 'لا' ? '✓' : ''}</span>
        </div>
      </div>

      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px dotted #cbd5e1; padding-top: 1px; padding-bottom: 2px;">
        <span>2- ترشيحه للترقية إلى وظيفة من درجة أعلى.</span>
        <div style="font-weight: bold;">
          <span>نعم</span> <span class="checkbox-box">${evaluation.recommendations?.nominationForPromotion === 'نعم' ? '✓' : ''}</span>
          <span style="margin-right: 8px;">لا</span> <span class="checkbox-box">${evaluation.recommendations?.nominationForPromotion === 'لا' ? '✓' : ''}</span>
        </div>
      </div>

      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px dotted #cbd5e1; padding-top: 1px; padding-bottom: 2px;">
        <div>
          <span>3- حاجته إلى التدريب في مجالات يتم تحديدها.</span>
          <span style="font-size: 8px; color: #334155; margin-right: 4px;">(المجال: ${evaluation.recommendations?.trainingDetails || '...........................................'})</span>
        </div>
        <div style="font-weight: bold;">
          <span>نعم</span> <span class="checkbox-box">${evaluation.recommendations?.trainingNeeds === 'نعم' ? '✓' : ''}</span>
          <span style="margin-right: 8px;">لا</span> <span class="checkbox-box">${evaluation.recommendations?.trainingNeeds === 'لا' ? '✓' : ''}</span>
        </div>
      </div>

      <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 1px;">
        <div>
          <span>4- التوصية بنقله إلى وظيفة أخرى تتناسب مع قدرته وإمكانياته.</span>
          <span style="font-size: 8px; color: #334155; margin-right: 4px;">(الوظيفة المقترحة: ${evaluation.recommendations?.transferDetails || '...........................................'})</span>
        </div>
        <div style="font-weight: bold;">
          <span>نعم</span> <span class="checkbox-box">${evaluation.recommendations?.transferToAnotherJob === 'نعم' ? '✓' : ''}</span>
          <span style="margin-right: 8px;">لا</span> <span class="checkbox-box">${evaluation.recommendations?.transferToAnotherJob === 'لا' ? '✓' : ''}</span>
        </div>
      </div>
    </div>

    <!-- 6. SIGNATURES & OFFICIAL APPROVALS -->
    <div class="signature-grid">
      <!-- Direct Supervisor -->
      <div class="signature-card">
        <div style="font-weight: 900; text-align: center; border-bottom: 1px solid #000000; padding-bottom: 2px; font-size: 9.5px; margin-bottom: 3px;">
          الرئيس المباشر
        </div>
        <div><strong>الاسم:</strong> <span>${evaluation.directSupervisorName || '................................'}</span></div>
        <div><strong>الوظيفة/الدرجة:</strong> <span>${evaluation.directSupervisorJobOrGrade || '................................'}</span></div>
        <div style="padding-top: 6px;"><strong>التوقيع:</strong> <span>................................</span></div>
      </div>

      <!-- Higher Supervisor (General Manager) -->
      <div class="signature-card">
        <div style="font-weight: 900; text-align: center; border-bottom: 1px solid #000000; padding-bottom: 2px; font-size: 9.5px; margin-bottom: 3px;">
          المدير العام
        </div>
        <div><strong>الاسم:</strong> <span style="font-weight: 900;">${gmName}</span></div>
        <div><strong>الوظيفة:</strong> <span>${evaluation.higherSupervisorJobOrGrade || 'مدير عام مصرف الدم المركزي المرج'}</span></div>
        <div style="padding-top: 6px;"><strong>التوقيع:</strong> <span>................................</span></div>
      </div>

      <!-- HR Preparation & Official Stamp -->
      <div class="signature-card" style="display: flex; flex-direction: column; justify-content: space-between;">
        <div>
          <div style="font-weight: 900; text-align: center; border-bottom: 1px solid #000000; padding-bottom: 2px; font-size: 9.5px; margin-bottom: 3px;">
            إعداد شؤون الموظفين
          </div>
          <div><strong>الاسم:</strong> <span>${evaluation.hrPreparerName || '................................'}</span></div>
          <div><strong>التاريخ:</strong> <span>${evaluation.hrPreparationDate || '..... / ..... / .........'}</span></div>
          <div><strong>التوقيع:</strong> <span>................................</span></div>
        </div>

        <div class="stamp-box">
          <div style="font-size: 8px; font-weight: 900; color: #1e293b;">ختم مكتب شؤون الموظفين</div>
          <div style="height: 18px; display: flex; align-items: center; justify-content: center; font-size: 7.5px; color: #94a3b8;">
            (مكان الختم الرسمي)
          </div>
        </div>
      </div>
    </div>
  </div>

  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 400);
    };
  </script>
</body>
</html>`;
}

/**
 * Robustly opens a clean standalone printable window containing ONLY the official evaluation A4 document
 */
export function openPrintableEvaluationWindow(
  evaluation: AnnualPerformanceEvaluation,
  officialLogoUrl: string = '/logo.jpg',
  generalManagerName: string = 'نجيب صالح بوحسن'
): boolean {
  try {
    const printHtml = generateEvaluationPrintHtml(evaluation, officialLogoUrl, generalManagerName);
    const printWindow = window.open('', '_blank', 'width=900,height=900,menubar=no,toolbar=no,location=no,status=no');
    
    if (!printWindow) {
      return false;
    }

    printWindow.document.open();
    printWindow.document.write(printHtml);
    printWindow.document.close();
    return true;
  } catch (err) {
    console.error('Error opening printable evaluation window:', err);
    return false;
  }
}
