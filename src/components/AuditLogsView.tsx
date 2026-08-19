import React, { useState } from 'react';
import { AuditLog } from '../types';
import { History, ShieldAlert, Filter, Search } from 'lucide-react';

interface AuditLogsViewProps {
  logs: AuditLog[];
}

export const AuditLogsView: React.FC<AuditLogsViewProps> = ({ logs }) => {
  const [filterUser, setFilterUser] = useState<string>('الكل');
  const [filterAction, setFilterAction] = useState<string>('الكل');
  const [searchDetails, setSearchDetails] = useState<string>('');

  const filteredLogs = logs.filter((log) => {
    if (filterUser !== 'الكل' && log.user !== filterUser) return false;
    if (filterAction !== 'الكل' && log.action !== filterAction) return false;
    if (searchDetails.trim() && !log.details.toLowerCase().includes(searchDetails.trim().toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      
      {/* Title Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-red-950 text-red-400 border border-red-800">
            <History className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-black text-white">
              سجل الحركات الأمني الكامل (DB_Log Audit Viewer)
            </h2>
            <p className="text-xs text-slate-400">
              توثيق جميع الإضافات، التعديلات، الحذف، والنسخ الاحتياطية تلقائياً
            </p>
          </div>
        </div>

        <div className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950 px-3 py-1.5 rounded-xl border border-emerald-800">
          إجمالي الحركات: {logs.length}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          
          <div>
            <label className="block text-slate-400 font-bold mb-1">تصفية حسب المستخدم</label>
            <select
              value={filterUser}
              onChange={(e) => setFilterUser(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
            >
              <option value="الكل">جميع المستخدمين</option>
              <option value="admin1">admin1 (Administrator 1)</option>
              <option value="admin2">admin2 (Administrator 2)</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-400 font-bold mb-1">نوع الحركة</label>
            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
            >
              <option value="الكل">جميع أنواع الحركات</option>
              <option value="إضافة">إضافة موظف</option>
              <option value="تعديل">تعديل موظف</option>
              <option value="حذف">حذف موظف</option>
              <option value="تسجيل دخول">تسجيل دخول</option>
              <option value="نسخة احتياطية">نسخة احتياطية</option>
              <option value="عرض PDF">عرض PDF</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-400 font-bold mb-1">بحث في تفاصيل الحركة</label>
            <input
              type="text"
              value={searchDetails}
              onChange={(e) => setSearchDetails(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
              placeholder="ابحث بالاسم أو الرقم..."
            />
          </div>

        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-950 text-slate-400 font-bold border-b border-slate-800">
              <tr>
                <th className="p-3 w-28">معرف الحركة</th>
                <th className="p-3 w-40">التاريخ والوقت</th>
                <th className="p-3 w-28">المستخدم</th>
                <th className="p-3 w-28">نوع العملية</th>
                <th className="p-3">تفاصيل الحركة والأثر</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 font-medium">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-slate-500">
                    لا توجد حركات تسجّل تطابق الفلترة المحددة.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/60">
                    <td className="p-3 font-mono text-red-400 font-bold">{log.id}</td>
                    <td className="p-3 font-mono text-slate-400 dir-ltr">{log.timestamp}</td>
                    <td className="p-3 font-bold text-white">{log.user}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                        {log.action}
                      </span>
                    </td>
                    <td className="p-3 text-slate-200">{log.details}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
