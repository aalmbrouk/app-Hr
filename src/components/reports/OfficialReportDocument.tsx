import React from 'react';
import { ExtendedReportRow, GroupedReportSection, formatColumnValue } from '../../utils/reportBuilderEngine';
import { ReportColumnConfig } from '../../types/reportBuilderTypes';
import { formatDateDisplay } from '../../utils/dateUtils';

interface OfficialReportDocumentProps {
  id?: string;
  reportTitle: string;
  groupedSections: GroupedReportSection[];
  totalRowCount: number;
  selectedColumns: ReportColumnConfig[];
  criteriaSummaryText?: string;
  generatedBy?: string;
  officialLogoUrl?: string;
  isGrouped: boolean;
}

export const OfficialReportDocument: React.FC<OfficialReportDocumentProps> = ({
  id = 'OFFICIAL_REPORT_DOCUMENT',
  reportTitle,
  groupedSections,
  totalRowCount,
  selectedColumns,
  criteriaSummaryText,
  generatedBy = 'قسم الشؤون الإدارية والموارد البشرية',
  officialLogoUrl,
  isGrouped
}) => {
  const activeColumns = selectedColumns.filter(c => c.selected);
  const todayStr = formatDateDisplay(new Date().toISOString().slice(0, 10));
  const logoSrc = officialLogoUrl || '/logo.jpg';

  return (
    <div
      id={id}
      className="bg-white text-slate-900 rounded-3xl p-8 shadow-2xl border border-slate-200 space-y-6 print:p-0 print:border-none print:shadow-none print:rounded-none w-full max-w-full overflow-hidden"
    >
      {/* 1. Official Header (Letterhead) */}
      <div className="border-b-2 border-red-800 pb-4 flex items-center justify-between gap-4">
        {/* Right Info */}
        <div className="text-right space-y-0.5">
          <h3 className="text-xs font-black text-red-900">دولة ليبيا</h3>
          <h4 className="text-sm font-black text-slate-900">وزارة الصحة</h4>
          <h2 className="text-base font-black text-red-800">مصرف الدم المركزي بلدية المرج</h2>
          <p className="text-[11px] font-bold text-slate-600">قسم الشؤون الوظيفية والموارد البشرية</p>
        </div>

        {/* Center Logo */}
        <div className="text-center shrink-0">
          <div className="w-20 h-20 mx-auto rounded-2xl bg-white border-2 border-red-800 p-1 overflow-hidden shadow-sm flex items-center justify-center">
            <img
              src={logoSrc}
              alt="شعار مصرف الدم المركزي بلدية المرج"
              className="w-full h-full object-contain"
              referrerPolicy="no-referrer"
              onError={(e) => {
                // Fallback if logo fails
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          </div>
          <p className="text-[10px] font-black text-red-900 mt-1">بلدية المرج - ليبيا</p>
        </div>

        {/* Left Meta Info */}
        <div className="text-left font-mono text-[11px] text-slate-600 space-y-0.5">
          <p><strong>تاريخ التقرير:</strong> {todayStr}</p>
          <p><strong>إجمالي السجلات:</strong> <span className="font-bold text-red-800">{totalRowCount}</span></p>
          <p><strong>حالة المستند:</strong> <span className="text-emerald-700 font-bold">معتمد رسمي</span></p>
          <p><strong>المُعِدّ:</strong> {generatedBy}</p>
        </div>
      </div>

      {/* 2. Report Document Title Box */}
      <div className="text-center bg-red-50 border border-red-200 rounded-2xl py-3.5 px-4 shadow-sm">
        <h1 className="text-base font-black text-red-900 tracking-wide">{reportTitle}</h1>
        {criteriaSummaryText && (
          <p className="text-[11px] text-slate-600 mt-1 font-medium max-w-4xl mx-auto">
            <strong className="text-red-950 font-bold">معايير التصفية والبحث: </strong>
            <span>{criteriaSummaryText}</span>
          </p>
        )}
      </div>

      {/* 3. Empty State Check */}
      {totalRowCount === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-2xl p-6 text-slate-500 font-bold text-sm">
          لا توجد بيانات مطابقة لمعايير البحث والتصفية المحددة.
        </div>
      ) : (
        /* 4. Report Tables (Grouped or Flat) */
        <div className="space-y-6">
          {groupedSections.map((section, secIdx) => {
            let globalRowIndexOffset = 0;
            for (let i = 0; i < secIdx; i++) {
              globalRowIndexOffset += groupedSections[i].rows.length;
            }

            return (
              <div key={section.groupKey} className="space-y-2 break-inside-avoid">
                {/* Group Section Header (if grouped) */}
                {isGrouped && (
                  <div className="bg-slate-100 border-r-4 border-red-800 px-4 py-2 rounded-xl flex items-center justify-between text-xs font-black text-slate-800">
                    <span>{section.groupLabel}</span>
                    <span className="text-[11px] font-bold text-slate-500 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                      عدد السجلات: {section.count}
                    </span>
                  </div>
                )}

                {/* Table */}
                <div className="overflow-x-auto rounded-xl border border-slate-300 shadow-sm print:overflow-visible">
                  <table className="w-full text-right text-xs border-collapse border border-slate-300">
                    <thead>
                      <tr className="bg-red-900 text-white font-bold text-[11px]">
                        {activeColumns.map((col) => (
                          <th
                            key={col.id}
                            style={{ width: col.width }}
                            className={`border border-red-800 p-2 text-${col.align || 'center'} font-bold whitespace-nowrap`}
                          >
                            {col.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 font-medium">
                      {section.rows.map((row, rowIdx) => {
                        const globalIdx = globalRowIndexOffset + rowIdx;
                        return (
                          <tr
                            key={row.employee.id}
                            className={rowIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50/70 hover:bg-red-50/30'}
                          >
                            {activeColumns.map((col) => (
                              <td
                                key={col.id}
                                className={`border border-slate-300 p-2 text-${col.align || 'center'} text-slate-800 ${
                                  col.id === 'jobNumber' || col.id === 'nationalId' ? 'font-mono' : ''
                                } ${col.id === 'fullName' ? 'font-black text-slate-900' : ''} ${
                                  col.id === 'jobGrade' ? 'font-bold text-red-950' : ''
                                }`}
                              >
                                {formatColumnValue(col.id, row, globalIdx)}
                              </td>
                            ))}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 5. Report Official Footer & Signatures */}
      <div className="pt-8 border-t-2 border-slate-300 grid grid-cols-2 text-center text-xs font-bold text-slate-800 break-inside-avoid">
        <div>
          <p className="text-slate-900 font-black">رئيس قسم الشؤون الوظيفية والموارد البشرية</p>
          <p className="text-slate-500 text-[10px] mt-0.5">مصرف الدم المركزي بلدية المرج</p>
          <div className="mt-10 text-slate-300 font-normal">........................................</div>
        </div>
        <div>
          <p className="text-slate-900 font-black">مدير عام مصرف الدم المركزي بلدية المرج</p>
          <p className="text-slate-500 text-[10px] mt-0.5">الاعتماد والختم الرسمي</p>
          <div className="mt-10 text-slate-300 font-normal">........................................</div>
        </div>
      </div>
    </div>
  );
};
