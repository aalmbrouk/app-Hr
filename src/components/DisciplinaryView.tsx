import React, { useState, useMemo } from 'react';
import { Employee, DisciplinaryRecord } from '../types';
import { 
  AlertTriangle, 
  Plus, 
  ShieldAlert, 
  FileText, 
  Printer, 
  Eye, 
  Edit3, 
  Trash2, 
  Search, 
  Filter, 
  CheckCircle2,
  Calendar,
  DollarSign,
  FileDown,
  User
} from 'lucide-react';
import { getTodayDateStorage, getCurrentTimestamp, formatDateDisplay } from '../utils/dateUtils';
import { OfficialDisciplinaryLetterModal } from './OfficialDisciplinaryLetterModal';

interface DisciplinaryViewProps {
  employees: Employee[];
  disciplinaryRecords: DisciplinaryRecord[];
  onAddRecord: (record: DisciplinaryRecord) => void;
  onUpdateRecord?: (record: DisciplinaryRecord) => void;
  onDeleteRecord?: (id: string) => void;
  currentUser?: string;
  generalManagerName?: string;
  officialLogoUrl?: string;
}

export const DisciplinaryView: React.FC<DisciplinaryViewProps> = ({
  employees = [],
  disciplinaryRecords = [],
  onAddRecord,
  onUpdateRecord,
  onDeleteRecord,
  currentUser = 'المستخدم الحالي',
  generalManagerName = 'نجيب صالح سالم',
  officialLogoUrl
}) => {
  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [activeLetterRecord, setActiveLetterRecord] = useState<DisciplinaryRecord | null>(null);
  const [letterModalMode, setLetterModalMode] = useState<'preview' | 'edit'>('preview');

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('الكل');

  // New Record Form states
  const [formEmpId, setFormEmpId] = useState<number>(employees[0]?.id || 1001);
  const [formType, setFormType] = useState<DisciplinaryRecord['recordType']>('إنذار كتابي');
  const [formDecisionNo, setFormDecisionNo] = useState('');
  const [formDecisionDate, setFormDecisionDate] = useState(getTodayDateStorage());
  const [formLetterNo, setFormLetterNo] = useState('');
  const [formReason, setFormReason] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formDays, setFormDays] = useState<number>(1);
  const [formAmount, setFormAmount] = useState<number>(0);
  const [formIssuingAuth, setFormIssuingAuth] = useState('إدارة الشؤون الإدارية والخدمات');
  const [openLetterDirectly, setOpenLetterDirectly] = useState(true);

  // Filtered list
  const filteredRecords = useMemo(() => {
    return (disciplinaryRecords || []).filter((d) => {
      const recType = d.recordType || d.actionType || d.penaltyType || '';
      if (selectedTypeFilter !== 'الكل' && recType !== selectedTypeFilter) {
        return false;
      }
      if (!searchQuery.trim()) return true;
      const q = searchQuery.trim().toLowerCase();
      const emp = (employees || []).find((e) => e.id === d.employeeId);
      return (
        d.id.toLowerCase().includes(q) ||
        (d.decisionNumber && d.decisionNumber.toLowerCase().includes(q)) ||
        (d.letterNumber && d.letterNumber.toLowerCase().includes(q)) ||
        (d.reason && d.reason.toLowerCase().includes(q)) ||
        (d.description && d.description.toLowerCase().includes(q)) ||
        (emp && emp.fullName.toLowerCase().includes(q)) ||
        (emp && emp.jobNumber.toLowerCase().includes(q)) ||
        (emp && emp.nationalId.includes(q))
      );
    });
  }, [disciplinaryRecords, employees, searchQuery, selectedTypeFilter]);

  // Statistics
  const stats = useMemo(() => {
    let warnings = 0;
    let deductions = 0;
    let penalties = 0;
    let alerts = 0;

    (disciplinaryRecords || []).forEach((d) => {
      const type = (d.recordType || d.actionType || d.penaltyType || '').trim();
      if (type.includes('إنذار')) warnings++;
      else if (type.includes('خصم')) deductions++;
      else if (type.includes('جزاء') || type.includes('عقوبة')) penalties++;
      else alerts++;
    });

    return {
      total: disciplinaryRecords.length,
      warnings,
      deductions,
      penalties,
      alerts
    };
  }, [disciplinaryRecords]);

  // Handle Form Submit
  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const emp = employees.find((x) => x.id === formEmpId);
    if (!emp) return;

    const nextNumber = disciplinaryRecords.length + 1;
    const generatedLetterNo = formLetterNo.trim() || `م د م / ${new Date().getFullYear()} / ${String(nextNumber).padStart(3, '0')}`;
    const generatedDecisionNo = formDecisionNo.trim() || `مذكرة إدارية رقم ${nextNumber}/${new Date().getFullYear()}`;

    const newRecord: DisciplinaryRecord = {
      id: `DIS-${new Date().getFullYear()}-${String(nextNumber).padStart(3, '0')}`,
      employeeId: formEmpId,
      recordType: formType,
      actionType: formType,
      penaltyType: formType,
      letterNumber: generatedLetterNo,
      letterDate: formDecisionDate || getTodayDateStorage(),
      letterTitle: formType === 'خصم من المرتب' ? 'خطاب خصم من المرتب' : formType === 'إنذار كتابي' ? 'خطاب إنذار رسمي' : 'خطاب جزاء وإجراء إداري',
      decisionNumber: generatedDecisionNo,
      decisionDate: formDecisionDate || getTodayDateStorage(),
      effectiveDate: formDecisionDate || getTodayDateStorage(),
      actionDate: formDecisionDate || getTodayDateStorage(),
      numberOfDays: formType === 'خصم من المرتب' ? formDays : undefined,
      deductionDays: formType === 'خصم من المرتب' ? formDays : undefined,
      deductionAmount: formType === 'خصم من المرتب' && formAmount > 0 ? formAmount : undefined,
      reason: formReason.trim() || 'عدم الالتزام بضوابط العمل والدوام',
      description: formDesc.trim(),
      violationDetails: formDesc.trim(),
      issuingAuthority: formIssuingAuth.trim(),
      issuingOfficial: formIssuingAuth.trim(),
      status: 'ساري',
      notes: 'تم توثيق الإجراء الانضباطي وتوليد الخطاب الرسمي',
      createdBy: currentUser,
      createdAt: getCurrentTimestamp()
    };

    onAddRecord(newRecord);
    setIsCreateModalOpen(false);

    if (openLetterDirectly) {
      setActiveLetterRecord(newRecord);
      setLetterModalMode('preview');
    }

    // Reset Form
    setFormReason('');
    setFormDesc('');
    setFormDecisionNo('');
    setFormLetterNo('');
  };

  // Open Letter Modal for viewing / editing
  const handleOpenLetter = (record: DisciplinaryRecord, mode: 'preview' | 'edit') => {
    setActiveLetterRecord(record);
    setLetterModalMode(mode);
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-rose-700 font-bold text-xs mb-1">
            <AlertTriangle className="w-4 h-4" />
            <span>وحدة الشؤون القانونية والمتابعة الانضباطية</span>
          </div>
          <h2 className="text-xl font-black text-slate-900">سجل الجزاءات والخصومات والإنذارات</h2>
          <p className="text-xs text-slate-500 mt-1">
            توثيق العقوبات الإدارية والإنذارات الرسمية والخصومات المالية مع إمكانية طباعة الخطابات الرسمية المعتمدة
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsCreateModalOpen(true)}
          className="px-5 py-2.5 rounded-xl bg-red-800 hover:bg-red-900 text-white font-black text-xs shadow-md flex items-center gap-2 transition cursor-pointer"
        >
          <Plus className="w-4 h-4 text-white" />
          <span>تسجيل إجراء / خصم / إنذار جديد</span>
        </button>
      </div>

      {/* 2. Statistical Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs">
          <div className="flex justify-between items-center text-slate-500 mb-1">
            <span className="font-bold">إجمالي الإجراءات</span>
            <ShieldAlert className="w-4 h-4 text-slate-600" />
          </div>
          <span className="text-xl font-black text-slate-900 font-mono">{stats.total}</span>
        </div>

        <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3.5 shadow-2xs">
          <div className="flex justify-between items-center text-amber-800 mb-1">
            <span className="font-bold">الإنذارات الكتابية</span>
            <AlertTriangle className="w-4 h-4 text-amber-700" />
          </div>
          <span className="text-xl font-black text-amber-950 font-mono">{stats.warnings}</span>
        </div>

        <div className="bg-rose-50/70 border border-rose-200 rounded-xl p-3.5 shadow-2xs">
          <div className="flex justify-between items-center text-rose-800 mb-1">
            <span className="font-bold">الخصومات من المرتب</span>
            <DollarSign className="w-4 h-4 text-rose-700" />
          </div>
          <span className="text-xl font-black text-rose-950 font-mono">{stats.deductions}</span>
        </div>

        <div className="bg-red-50/70 border border-red-200 rounded-xl p-3.5 shadow-2xs">
          <div className="flex justify-between items-center text-red-800 mb-1">
            <span className="font-bold">الجزاءات والعقوبات</span>
            <ShieldAlert className="w-4 h-4 text-red-700" />
          </div>
          <span className="text-xl font-black text-red-950 font-mono">{stats.penalties}</span>
        </div>

        <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-3.5 shadow-2xs">
          <div className="flex justify-between items-center text-blue-800 mb-1">
            <span className="font-bold">التنبيهات الإدارية</span>
            <FileText className="w-4 h-4 text-blue-700" />
          </div>
          <span className="text-xl font-black text-blue-950 font-mono">{stats.alerts}</span>
        </div>
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="البحث باسم الموظف، الرقم الوظيفي، رقم القرار، أو السبب..."
              className="w-full pr-9 pl-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-red-600 outline-none"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-500" />
          <span className="font-bold text-slate-700">تصفية حسب النوع:</span>
          <select
            value={selectedTypeFilter}
            onChange={(e) => setSelectedTypeFilter(e.target.value)}
            className="py-1.5 px-3 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold focus:ring-2 focus:ring-red-600 outline-none"
          >
            <option value="الكل">كافة أنواع الإجراءات ({disciplinaryRecords.length})</option>
            <option value="إنذار كتابي">إنذار كتابي</option>
            <option value="خصم من المرتب">خصم من المرتب</option>
            <option value="تنبيه">تنبيه</option>
            <option value="عقوبة إدارية">عقوبة / جزاء إداري</option>
          </select>
        </div>
      </div>

      {/* 4. Disciplinary Records Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-red-700" />
            <span>قائمة السجلات والخطابات الانضباطية</span>
          </h3>
          <span className="text-xs text-slate-500 font-mono">النتائج: {filteredRecords.length}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs border-collapse">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="p-3 w-28">رقم السجل</th>
                <th className="p-3">الموظف المعني</th>
                <th className="p-3 w-32">نوع الإجراء</th>
                <th className="p-3 w-36">رقم الكتاب / القرار</th>
                <th className="p-3 w-24 text-center">الخصم / الأيام</th>
                <th className="p-3">السبب والداعي</th>
                <th className="p-3 w-28">التاريخ</th>
                <th className="p-3 w-52 text-center">الخطاب الرسمي والإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">
                    لا توجد سجلات تطابق معايير البحث المحددة
                  </td>
                </tr>
              ) : (
                filteredRecords.map((d) => {
                  const emp = employees.find((e) => e.id === d.employeeId);
                  const type = d.recordType || d.actionType || d.penaltyType || 'تنبيه';
                  return (
                    <tr key={d.id} className="hover:bg-slate-50 text-slate-800 transition">
                      <td className="p-3 font-mono font-bold text-red-800">{d.id}</td>
                      <td className="p-3">
                        <div className="font-bold text-slate-900">{emp ? emp.fullName : `موظف #${d.employeeId}`}</div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          {emp?.jobNumber ? `ملف: ${emp.jobNumber}` : ''} {emp?.department ? `• ${emp.department}` : ''}
                        </div>
                      </td>
                      <td className="p-3">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                          type === 'خصم من المرتب'
                            ? 'bg-rose-100 text-rose-900 border-rose-300'
                            : type === 'إنذار كتابي'
                            ? 'bg-amber-100 text-amber-900 border-amber-300'
                            : type === 'عقوبة إدارية'
                            ? 'bg-red-100 text-red-900 border-red-300'
                            : 'bg-blue-100 text-blue-900 border-blue-300'
                        }`}>
                          {type}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="font-mono text-slate-800">{d.letterNumber || d.decisionNumber || '—'}</div>
                        {d.decisionNumber && d.letterNumber && d.letterNumber !== d.decisionNumber && (
                          <div className="text-[10px] text-slate-500">{d.decisionNumber}</div>
                        )}
                      </td>
                      <td className="p-3 font-mono font-black text-slate-900 text-center">
                        {d.numberOfDays || d.deductionDays
                          ? `${d.numberOfDays || d.deductionDays} يوم`
                          : d.deductionAmount
                          ? `${d.deductionAmount} د.ل`
                          : '—'}
                      </td>
                      <td className="p-3 text-slate-700 max-w-[200px] truncate" title={d.reason}>
                        {d.reason || '—'}
                      </td>
                      <td className="p-3 font-mono text-slate-600">
                        {formatDateDisplay(d.effectiveDate || d.actionDate || d.decisionDate)}
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Print Letter Button */}
                          <button
                            type="button"
                            onClick={() => handleOpenLetter(d, 'preview')}
                            className="px-2.5 py-1 bg-red-700 hover:bg-red-800 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 shadow-2xs transition cursor-pointer"
                            title="طباعة الخطاب الرسمي المعتمد A4"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>طباعة خطاب</span>
                          </button>

                          {/* Preview Button */}
                          <button
                            type="button"
                            onClick={() => handleOpenLetter(d, 'preview')}
                            className="p-1 text-slate-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                            title="معاينة"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Edit Button */}
                          <button
                            type="button"
                            onClick={() => handleOpenLetter(d, 'edit')}
                            className="p-1 text-slate-600 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition cursor-pointer"
                            title="تعديل الخطاب"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          {/* Delete Button */}
                          {onDeleteRecord && (
                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm(`هل أنت متأكد من حذف السجل رقم (${d.id})؟`)) {
                                  onDeleteRecord(d.id);
                                }
                              }}
                              className="p-1 text-slate-400 hover:text-red-700 hover:bg-red-50 rounded-lg transition cursor-pointer"
                              title="حذف السجل"
                            >
                              <Trash2 className="w-4 h-4" />
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

      {/* 5. Create Disciplinary Record Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto" dir="rtl">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-red-400" />
                <h3 className="font-black text-sm">تسجيل إجراء تأديبي / خصم / إنذار جديد</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-white font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-5 space-y-4 text-xs">
              {/* Employee Selection */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">الموظف المعني بالإجراء *</label>
                <select
                  value={formEmpId}
                  onChange={(e) => setFormEmpId(Number(e.target.value))}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-red-600 outline-none"
                  required
                >
                  {employees.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.fullName} (رقم الملف: {e.jobNumber}) — {e.department} ({e.jobGrade})
                    </option>
                  ))}
                </select>
              </div>

              {/* Action Type & Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">نوع الإجراء الوظيفي *</label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as any)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-red-600 outline-none"
                  >
                    <option value="إنذار كتابي">إنذار كتابي رسمي</option>
                    <option value="خصم من المرتب">خصم من المرتب</option>
                    <option value="تنبيه">تنبيه إداري</option>
                    <option value="عقوبة إدارية">عقوبة / جزاء إداري</option>
                    <option value="أخرى">إجراء إداري آخر</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">تاريخ الإجراء والسريان *</label>
                  <input
                    type="date"
                    value={formDecisionDate}
                    onChange={(e) => setFormDecisionDate(e.target.value)}
                    required
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-red-600 outline-none font-mono"
                  />
                </div>
              </div>

              {/* Document Number & Decision Number */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">رقم الخطاب / الكتاب (اختياري)</label>
                  <input
                    type="text"
                    value={formLetterNo}
                    onChange={(e) => setFormLetterNo(e.target.value)}
                    placeholder="م د م / 2026 / ..."
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-red-600 outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">رقم القرار / المذكرة (إن وجد)</label>
                  <input
                    type="text"
                    value={formDecisionNo}
                    onChange={(e) => setFormDecisionNo(e.target.value)}
                    placeholder="مذكرة رقم 14 لسنة 2026"
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-red-600 outline-none"
                  />
                </div>
              </div>

              {/* Deduction Fields (if applicable) */}
              {formType === 'خصم من المرتب' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-rose-50 p-3 rounded-xl border border-rose-200">
                  <div>
                    <label className="block font-bold text-rose-900 mb-1">عدد أيام الخصم</label>
                    <input
                      type="number"
                      min={1}
                      max={30}
                      value={formDays}
                      onChange={(e) => setFormDays(Number(e.target.value))}
                      className="w-full p-2 bg-white border border-rose-300 rounded-xl font-bold text-rose-950 focus:ring-2 focus:ring-rose-600 outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-rose-900 mb-1">القيمة المالية للخصم (د.ل) - اختياري</label>
                    <input
                      type="number"
                      min={0}
                      step={10}
                      value={formAmount}
                      onChange={(e) => setFormAmount(Number(e.target.value))}
                      placeholder="0"
                      className="w-full p-2 bg-white border border-rose-300 rounded-xl font-bold text-rose-950 focus:ring-2 focus:ring-rose-600 outline-none font-mono"
                    />
                  </div>
                </div>
              )}

              {/* Reason */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">سبب الجزاء أو الخصم *</label>
                <input
                  type="text"
                  value={formReason}
                  onChange={(e) => setFormReason(e.target.value)}
                  placeholder="مثال: الغياب غير المبرر عن العمل / عدم التقيد بالتعليمات المهنية"
                  required
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-red-600 outline-none font-medium"
                />
              </div>

              {/* Violation Description */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">وصف المخالفة والتفاصيل</label>
                <textarea
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  rows={2}
                  placeholder="شرح موجز لواقعة المخالفة أو تاريخ المحضر..."
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-red-600 outline-none"
                />
              </div>

              {/* Issuing Authority */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">الجهة / المسؤول الذي أصدر الإجراء</label>
                <input
                  type="text"
                  value={formIssuingAuth}
                  onChange={(e) => setFormIssuingAuth(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-red-600 outline-none"
                />
              </div>

              {/* Option to view printable letter directly */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="openLetterDirectly"
                  checked={openLetterDirectly}
                  onChange={(e) => setOpenLetterDirectly(e.target.checked)}
                  className="rounded text-red-700 focus:ring-red-600 cursor-pointer"
                />
                <label htmlFor="openLetterDirectly" className="font-bold text-slate-700 cursor-pointer">
                  فتح ومعاينة الخطاب الرسمي المعتمد (A4) مباشرة بعد الحفظ
                </label>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer transition"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-red-800 hover:bg-red-900 text-white font-bold rounded-xl shadow cursor-pointer transition flex items-center gap-1.5"
                >
                  <Printer className="w-4 h-4" />
                  <span>حفظ وتسجيل الإجراء</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Printable Official Letter Modal */}
      {activeLetterRecord && (
        <OfficialDisciplinaryLetterModal
          record={activeLetterRecord}
          employee={employees.find((e) => e.id === activeLetterRecord.employeeId)}
          onClose={() => setActiveLetterRecord(null)}
          onSave={(updated) => {
            if (onUpdateRecord) {
              onUpdateRecord(updated);
            }
            setActiveLetterRecord(updated);
          }}
          currentUser={currentUser}
          generalManagerName={generalManagerName}
          officialLogoUrl={officialLogoUrl}
          initialMode={letterModalMode}
        />
      )}
    </div>
  );
};
