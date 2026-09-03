import React, { useState } from 'react';
import { 
  History, 
  Search, 
  Undo2, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Calendar, 
  User, 
  Database, 
  Eye, 
  ShieldCheck, 
  Printer 
} from 'lucide-react';
import { BulkOperationRecord } from '../../types';
import { formatDateDisplay } from '../../utils/dateUtils';

interface GeneralActionsLogTableProps {
  operations: BulkOperationRecord[];
  onSelectUndo: (operation: BulkOperationRecord) => void;
  onViewReport: (operation: BulkOperationRecord) => void;
}

export const GeneralActionsLogTable: React.FC<GeneralActionsLogTableProps> = ({
  operations,
  onSelectUndo,
  onViewReport
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [selectedOpDetails, setSelectedOpDetails] = useState<BulkOperationRecord | null>(null);

  const filteredOps = operations.filter((op) => {
    const matchesSearch = 
      op.operationCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      op.actionName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      op.executedBy.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = 
      filterType === 'ALL' || 
      (filterType === 'INCREMENT' && op.actionType.includes('INCREMENT')) ||
      (filterType === 'LEAVE' && op.actionType.includes('LEAVE')) ||
      (filterType === 'UNDO' && (op.actionType.includes('UNDO') || op.undone));

    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-4 text-xs">
      
      {/* Controls Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-red-700" />
          <div>
            <h3 className="font-extrabold text-sm text-gray-900">سجل الرقابة والعمليات الإدارية الجماعية</h3>
            <p className="text-[11px] text-gray-500">توثيق شامل لكافة العمليات الجماعية، النسخ الاحتياطية وإمكانية الاسترجاع</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Search input */}
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute right-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="بحث برقم العملية أو الاسم..."
              className="pr-9 pl-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs font-bold text-gray-900 focus:bg-white"
            />
          </div>

          {/* Filter Type */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="p-2 bg-gray-50 border border-gray-300 rounded-xl text-xs font-bold text-gray-800"
          >
            <option value="ALL">كافة العمليات ({operations.length})</option>
            <option value="INCREMENT">العلاوات السنوية</option>
            <option value="LEAVE">أرصدة الإجازات</option>
            <option value="UNDO">عمليات التراجع</option>
          </select>
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 border-b border-gray-200 text-gray-700 font-extrabold">
              <tr>
                <th className="py-3 px-4">رقم العملية</th>
                <th className="py-3 px-4">نوع الإجراء الجماعي</th>
                <th className="py-3 px-4">تاريخ ووقت التنفيذ</th>
                <th className="py-3 px-4">المستخدم المسؤول</th>
                <th className="py-3 px-4 text-center">المتأثرون</th>
                <th className="py-3 px-4">النسخة الاحتياطية</th>
                <th className="py-3 px-4">حالة العملية / التراجع</th>
                <th className="py-3 px-4 text-center">الإجراءات والتحكم</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredOps.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-gray-500 font-bold">
                    لا توجد عمليات مسجلة مطابقة لمعايير البحث
                  </td>
                </tr>
              ) : (
                filteredOps.map((op) => {
                  const isUndone = op.undone === true || op.status === 'REVERTED';
                  const isUndoOp = op.actionType === 'UNDO_OPERATION';

                  return (
                    <tr key={op.id} className={`hover:bg-gray-50/80 transition-colors ${isUndone ? 'bg-amber-50/20 opacity-90' : ''}`}>
                      
                      {/* Operation Code */}
                      <td className="py-3 px-4 font-mono font-extrabold text-red-950">
                        {op.operationCode}
                      </td>

                      {/* Action Name */}
                      <td className="py-3 px-4">
                        <div className="font-extrabold text-gray-900">{op.actionName}</div>
                        <div className="text-[10px] text-gray-500 font-mono">{op.actionType}</div>
                      </td>

                      {/* Executed At */}
                      <td className="py-3 px-4 font-mono text-gray-700 dir-ltr text-right">
                        {formatDateDisplay(op.executedAt)}
                      </td>

                      {/* Executed By */}
                      <td className="py-3 px-4 font-bold text-gray-800">
                        <div className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-gray-400" />
                          <span>{op.executedBy}</span>
                        </div>
                      </td>

                      {/* Affected Count */}
                      <td className="py-3 px-4 text-center">
                        <span className="font-mono font-extrabold px-2.5 py-1 rounded-lg bg-blue-50 text-blue-900 border border-blue-200">
                          {op.affectedCount} موظف
                        </span>
                      </td>

                      {/* Backup */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1 text-[11px] text-emerald-800 font-mono">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span className="truncate max-w-[140px]" title={op.backupFileName}>
                            {op.backupFileName || 'نسخة مؤمنة'}
                          </span>
                        </div>
                      </td>

                      {/* Status & Undo State */}
                      <td className="py-3 px-4">
                        {isUndone ? (
                          <div className="space-y-0.5">
                            <span className="bg-amber-100 text-amber-900 font-black px-2 py-0.5 rounded-full text-[10px] inline-flex items-center gap-1">
                              <Undo2 className="w-3 h-3" />
                              <span>تم التراجع عن الإجراء</span>
                            </span>
                            {op.undoReason && (
                              <div className="text-[10px] text-amber-900 truncate max-w-[160px]" title={op.undoReason}>
                                السبب: {op.undoReason}
                              </div>
                            )}
                          </div>
                        ) : isUndoOp ? (
                          <span className="bg-purple-100 text-purple-900 font-black px-2 py-0.5 rounded-full text-[10px] inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>عملية استعادة معتمدة</span>
                          </span>
                        ) : (
                          <span className="bg-emerald-100 text-emerald-900 font-black px-2 py-0.5 rounded-full text-[10px] inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>سارية ومكتملة</span>
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-1.5">
                          
                          {/* View Report */}
                          <button
                            type="button"
                            onClick={() => onViewReport(op)}
                            title="معاينة وطباعة التقرير"
                            className="p-1.5 rounded-lg bg-gray-100 hover:bg-slate-800 hover:text-white text-gray-700 transition-colors cursor-pointer"
                          >
                            <FileText className="w-4 h-4" />
                          </button>

                          {/* View Details */}
                          <button
                            type="button"
                            onClick={() => setSelectedOpDetails(op)}
                            title="تفاصيل السجل والمستفيدين"
                            className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-600 hover:text-white text-blue-700 transition-colors cursor-pointer"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Undo Button (Enabled only if not already undone and not an undo operation itself) */}
                          {!isUndone && !isUndoOp && (
                            <button
                              type="button"
                              onClick={() => onSelectUndo(op)}
                              title="التراجع عن هذا الإجراء واستعادة البيانات"
                              className="px-2 py-1 rounded-lg bg-red-50 hover:bg-red-700 text-red-700 hover:text-white font-bold text-[11px] flex items-center gap-1 transition-colors border border-red-200 cursor-pointer"
                            >
                              <Undo2 className="w-3.5 h-3.5" />
                              <span>تراجع</span>
                            </button>
                          )}
                        </div>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Details Modal */}
      {selectedOpDetails && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-4 border border-gray-200 text-xs">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-black text-sm text-gray-900 flex items-center gap-2">
                <History className="w-4 h-4 text-red-700" />
                <span>تفاصيل العملية ({selectedOpDetails.operationCode})</span>
              </h3>
              <button onClick={() => setSelectedOpDetails(null)} className="p-1 text-gray-400 hover:text-gray-700">
                ✕
              </button>
            </div>

            <div className="space-y-2 bg-gray-50 p-4 rounded-xl border">
              <div><strong>اسم الإجراء:</strong> {selectedOpDetails.actionName}</div>
              <div><strong>نوع الإجراء:</strong> {selectedOpDetails.actionType}</div>
              <div><strong>تاريخ التنفيذ:</strong> {formatDateDisplay(selectedOpDetails.executedAt)}</div>
              <div><strong>المستخدم:</strong> {selectedOpDetails.executedBy}</div>
              <div><strong>عدد الموظفين:</strong> {selectedOpDetails.affectedCount}</div>
              <div><strong>النسخة الاحتياطية:</strong> {selectedOpDetails.backupFileName || '—'}</div>
              <div><strong>الحالة:</strong> {selectedOpDetails.status}</div>
              {selectedOpDetails.undone && (
                <div className="text-amber-900 bg-amber-100 p-2 rounded-lg font-bold">
                  تم التراجع عن هذه العملية بواسطة {selectedOpDetails.undoneBy} بتاريخ {formatDateDisplay(selectedOpDetails.undoneAt || '')}
                  {selectedOpDetails.undoReason && <div>السبب: {selectedOpDetails.undoReason}</div>}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <button
                type="button"
                onClick={() => {
                  const op = selectedOpDetails;
                  setSelectedOpDetails(null);
                  onViewReport(op);
                }}
                className="px-4 py-2 bg-gray-800 text-white rounded-xl font-bold flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4 text-amber-400" />
                <span>عرض وطباعة التقرير</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedOpDetails(null)}
                className="px-4 py-2 border border-gray-300 rounded-xl font-bold"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
