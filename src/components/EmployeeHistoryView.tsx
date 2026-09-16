import React, { useState, useMemo } from 'react';
import { 
  Employee, 
  LeaveTransaction, 
  PromotionRecord, 
  IncrementRecord, 
  SecondmentRecord, 
  TransferRecord, 
  DisciplinaryRecord, 
  ResignationRecord, 
  StatusSettlementRecord,
  CareerPromotionRecord
} from '../types';
import { formatDateDisplay } from '../utils/dateUtils';
import { 
  History, 
  Calendar, 
  Award, 
  Zap, 
  ArrowLeftRight, 
  AlertTriangle, 
  UserCheck, 
  UserX, 
  SlidersHorizontal,
  FileText,
  Building,
  Building2,
  Printer
} from 'lucide-react';
import { EmployeeCareerReportModal } from './EmployeeCareerReportModal';

interface TimelineEvent {
  id: string;
  type: 'تعيين' | 'مباشرة' | 'ترقية' | 'علاوة' | 'تسوية' | 'ندب' | 'ندب على درجة' | 'نقل' | 'إجازة' | 'جزاء' | 'استقالة';
  date: string;
  title: string;
  details: string;
  badgeColor: string;
  icon: React.ReactNode;
}

interface EmployeeHistoryViewProps {
  employees?: Employee[];
  leaves?: LeaveTransaction[];
  promotions?: PromotionRecord[];
  increments?: IncrementRecord[];
  secondments?: SecondmentRecord[];
  transfers?: TransferRecord[];
  disciplinary?: DisciplinaryRecord[];
  resignations?: ResignationRecord[];
  settlements?: StatusSettlementRecord[];
  careerRecords?: CareerPromotionRecord[];
}

export const EmployeeHistoryView: React.FC<EmployeeHistoryViewProps> = ({
  employees = [],
  leaves = [],
  promotions = [],
  increments = [],
  secondments = [],
  transfers = [],
  disciplinary = [],
  resignations = [],
  settlements = [],
  careerRecords = []
}) => {
  const [selectedEmpId, setSelectedEmpId] = useState<number>(employees[0]?.id || 1001);
  const [filterType, setFilterType] = useState<string>('all');
  const [isCareerReportOpen, setIsCareerReportOpen] = useState(false);

  const selectedEmp = (employees || []).find((e) => e.id === selectedEmpId) || employees[0];

  // Construct comprehensive chronological timeline
  const timelineEvents = useMemo(() => {
    if (!selectedEmp) return [];

    const events: TimelineEvent[] = [];

    // 1. Appointment Date
    if (selectedEmp.hireDate) {
      events.push({
        id: `EVT-HIRE-${selectedEmp.id}`,
        type: 'تعيين',
        date: selectedEmp.hireDate,
        title: 'التعيين الأصلي بالدولة',
        details: `الجهة: ${selectedEmp.hiringEntity || 'وزارة الصحة'} - المسمى: ${selectedEmp.jobTitle}`,
        badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
        icon: <Building className="w-4 h-4 text-blue-700" />
      });
    }

    // 2. Directing Date at Blood Bank
    if (selectedEmp.directingDate) {
      events.push({
        id: `EVT-DIR-${selectedEmp.id}`,
        type: 'مباشرة',
        date: selectedEmp.directingDate,
        title: 'المباشرة الفعلية بمصرف الدم المركزى - المرج',
        details: `بدء احتساب سنوات الخدمة المعتمدة ببنك الدم (${selectedEmp.department})`,
        badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        icon: <Calendar className="w-4 h-4 text-emerald-700" />
      });
    }

    // 3. Secondment to Grade (ندب على درجة) and custom career records
    (careerRecords || [])
      .filter((c) => c.employeeId === selectedEmp.id)
      .forEach((c) => {
        if (c.actionType === 'ندب على درجة') {
          events.push({
            id: c.id,
            type: 'ندب على درجة',
            date: c.actionDate || c.decisionDate,
            title: `ندب على درجة: ${c.newGrade} (علاوة ${c.newIncrement})`,
            details: `الجهة المصدرة: ${c.issuingAuthority || 'وزارة الصحة'} | القرار: ${c.decisionNumber} | ${c.notes || ''}`,
            badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-300',
            icon: <Building2 className="w-4 h-4 text-emerald-700" />
          });
        }
      });

    // 4. Promotions
    (promotions || [])
      .filter((p) => p.employeeId === selectedEmp.id)
      .forEach((p) => {
        events.push({
          id: p.id,
          type: 'ترقية',
          date: p.effectiveDate || p.decisionDate,
          title: `ترقية إلى ${p.newGrade} (${p.promotionType})`,
          details: `من ${p.previousGrade} | القرار: ${p.decisionNumber} | السبب: ${p.reason}`,
          badgeColor: 'bg-red-100 text-red-800 border-red-200',
          icon: <Award className="w-4 h-4 text-red-700" />
        });
      });

    // 5. Increments
    (increments || [])
      .filter((i) => i.employeeId === selectedEmp.id)
      .forEach((i) => {
        events.push({
          id: i.id,
          type: 'علاوة',
          date: i.effectiveDate,
          title: `منح علاوة سنوية (${i.newIncrement})`,
          details: `علاوة ${i.incrementType} | القرار: ${i.decisionNumber}`,
          badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
          icon: <Zap className="w-4 h-4 text-amber-700" />
        });
      });

    // 6. Settlements
    (settlements || [])
      .filter((s) => s.employeeId === selectedEmp.id)
      .forEach((s) => {
        events.push({
          id: s.id,
          type: 'تسوية',
          date: s.effectiveDate,
          title: `تسوية وضع وظيفي - ${s.financialStatus}`,
          details: `الدرجة: ${s.grade} | المسمى: ${s.jobTitle} | القرار: ${s.decisionNumber}`,
          badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
          icon: <FileText className="w-4 h-4 text-purple-700" />
        });
      });

    // 7. Secondments
    (secondments || [])
      .filter((sec) => sec.employeeId === selectedEmp.id)
      .forEach((sec) => {
        events.push({
          id: sec.id,
          type: 'ندب',
          date: sec.startDate,
          title: `ندب / تكليف إلى ${sec.assignedEntity}`,
          details: `القسم الأصلي: ${sec.originalDepartment} | القرار: ${sec.decisionNumber}`,
          badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-200',
          icon: <UserCheck className="w-4 h-4 text-indigo-700" />
        });
      });

    // 8. Transfers
    (transfers || [])
      .filter((t) => t.employeeId === selectedEmp.id)
      .forEach((t) => {
        events.push({
          id: t.id,
          type: 'نقل',
          date: t.effectiveDate,
          title: `نقل وظيفي (${t.transferType})`,
          details: `من ${t.previousDepartment} إلى ${t.newDepartment} | القرار: ${t.decisionNumber}`,
          badgeColor: 'bg-cyan-100 text-cyan-800 border-cyan-200',
          icon: <ArrowLeftRight className="w-4 h-4 text-cyan-700" />
        });
      });

    // 9. Leaves
    (leaves || [])
      .filter((l) => l.employeeId === selectedEmp.id)
      .forEach((l) => {
        events.push({
          id: l.id,
          type: 'إجازة',
          date: l.startDate,
          title: `${l.leaveType} (${l.numberOfDays} يوماً)`,
          details: `من ${l.startDate} إلى ${l.endDate} | القرار: ${l.approvalNumber}`,
          badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
          icon: <Calendar className="w-4 h-4 text-emerald-700" />
        });
      });

    // 10. Disciplinary
    (disciplinary || [])
      .filter((d) => d.employeeId === selectedEmp.id)
      .forEach((d) => {
        events.push({
          id: d.id,
          type: 'جزاء',
          date: d.effectiveDate,
          title: `إجراء إداري: ${d.recordType}`,
          details: `السبب: ${d.reason} | المذكرة: ${d.decisionNumber}`,
          badgeColor: 'bg-rose-100 text-rose-800 border-rose-200',
          icon: <AlertTriangle className="w-4 h-4 text-rose-700" />
        });
      });

    // 11. Resignations / End of Service
    (resignations || [])
      .filter((r) => r.employeeId === selectedEmp.id)
      .forEach((r) => {
        events.push({
          id: r.id,
          type: 'استقالة',
          date: r.effectiveDate || r.decisionDate,
          title: `إنهاء خدمة (${r.finalStatus || 'مستقيل'})`,
          details: `السبب: ${r.reason || 'بناء على طلبه'} | القرار: ${r.decisionNumber}`,
          badgeColor: 'bg-gray-200 text-gray-800 border-gray-300',
          icon: <UserX className="w-4 h-4 text-gray-700" />
        });
      });

    // Sort chronologically (Newest first)
    return events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [selectedEmp, leaves, promotions, increments, secondments, transfers, disciplinary, resignations, settlements, careerRecords]);

  // Filter events
  const filteredEvents = useMemo(() => {
    if (filterType === 'all') return timelineEvents;
    return timelineEvents.filter((e) => e.type === filterType);
  }, [timelineEvents, filterType]);

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-red-700 font-bold text-xs mb-1">
            <History className="w-4 h-4" />
            <span>السجل التاريخي والمسار المهني</span>
          </div>
          <h1 className="text-xl font-extrabold text-gray-900">سجل التاريخ الوظيفي والأحداث الشاملة</h1>
          <p className="text-xs text-gray-600 mt-1">
            عرض تسلسلي زمني دقيق لكافة الإجراءات والترقيات والعلاوات والندب على الدرجة والإجازات
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsCareerReportOpen(true)}
            className="px-4 py-2 bg-red-700 hover:bg-red-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm cursor-pointer transition"
          >
            <Printer className="w-4 h-4 text-amber-300" />
            <span>طباعة سجل الترقيات للموظف</span>
          </button>
        </div>
      </div>

      {/* Employee Selector Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        <div className="md:col-span-2">
          <label className="block font-bold text-gray-700 mb-1">اختر الموظف لعرض سجله التاريخي:</label>
          <select
            value={selectedEmpId}
            onChange={(e) => setSelectedEmpId(Number(e.target.value))}
            className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-xl font-bold text-gray-900 text-xs focus:ring-2 focus:ring-red-600"
          >
            {employees.map((e) => (
              <option key={e.id} value={e.id}>
                {e.fullName} ({e.jobNumber}) — {e.jobGrade} — {e.department}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block font-bold text-gray-700 mb-1">تصفية نوع الحدث:</label>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-xl font-bold text-gray-900 text-xs"
          >
            <option value="all">كافة الأحداث ({timelineEvents.length})</option>
            <option value="ندب على درجة">ندب على درجة</option>
            <option value="ترقية">ترقيات</option>
            <option value="علاوة">علاوات سنوية</option>
            <option value="تسوية">تسويات وضع</option>
            <option value="ندب">ندب وتكليف</option>
            <option value="نقل">حركات نقل</option>
            <option value="إجازة">إجازات</option>
            <option value="جزاء">إجراءات إدارية وجزاءات</option>
            <option value="استقالة">إنهاء خدمة</option>
          </select>
        </div>
      </div>

      {/* Selected Employee Summary Banner */}
      {selectedEmp && (
        <div className="bg-gradient-to-l from-slate-900 via-slate-800 to-red-900 text-white p-5 rounded-2xl shadow-md flex flex-wrap justify-between items-center gap-4 text-xs">
          <div className="space-y-1">
            <span className="text-amber-300 text-[11px] font-bold">الملف الوظيفي المختار</span>
            <h2 className="text-lg font-black">{selectedEmp.fullName}</h2>
            <div className="flex flex-wrap items-center gap-3 text-slate-300 text-[11px]">
              <span>الرقم الوظيفي: <strong className="text-white font-mono">{selectedEmp.jobNumber}</strong></span>
              <span>•</span>
              <span>القسم: <strong className="text-white">{selectedEmp.department}</strong></span>
              <span>•</span>
              <span>المسمى: <strong className="text-white">{selectedEmp.jobTitle}</strong></span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-white/10 px-4 py-2 rounded-xl text-center border border-white/10">
              <span className="text-[10px] text-slate-300 block">الدرجة الحالية</span>
              <strong className="text-sm font-bold text-amber-300">{selectedEmp.jobGrade}</strong>
            </div>
            <div className="bg-white/10 px-4 py-2 rounded-xl text-center border border-white/10">
              <span className="text-[10px] text-slate-300 block">العلاوات</span>
              <strong className="text-sm font-bold text-emerald-300">+{selectedEmp.currentIncrement || 1}</strong>
            </div>
            <div className="bg-white/10 px-4 py-2 rounded-xl text-center border border-white/10">
              <span className="text-[10px] text-slate-300 block">تاريخ المباشرة</span>
              <strong className="text-xs font-mono text-white">{formatDateDisplay(selectedEmp.directingDate || selectedEmp.hireDate)}</strong>
            </div>
          </div>
        </div>
      )}

      {/* Chronological Timeline Container */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
        {filteredEvents.length === 0 ? (
          <div className="p-12 text-center text-gray-500 text-xs">
            لا توجد أحداث مسجلة لهذا الموظف وفق الفلترة المختارة.
          </div>
        ) : (
          <div className="relative border-r-2 border-red-200 mr-4 space-y-6">
            {filteredEvents.map((evt) => (
              <div key={evt.id} className="relative pr-6 group">
                {/* Dot / Icon on line */}
                <div className="absolute -right-3 top-1.5 w-6 h-6 rounded-full bg-white border-2 border-red-600 flex items-center justify-center shadow-xs">
                  <div className="w-2 h-2 rounded-full bg-red-600"></div>
                </div>

                {/* Content Box */}
                <div className="bg-gray-50 hover:bg-red-50/30 transition-colors p-4 rounded-xl border border-gray-200 space-y-2">
                  <div className="flex flex-wrap justify-between items-center gap-2">
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 ${evt.badgeColor}`}>
                        {evt.icon}
                        <span>{evt.type}</span>
                      </span>
                      <h3 className="text-xs font-black text-gray-900">{evt.title}</h3>
                    </div>

                    <div className="flex items-center gap-1 text-[11px] font-mono text-gray-500 bg-white px-2 py-0.5 rounded border">
                      <Calendar className="w-3 h-3 text-red-600" />
                      <span>{formatDateDisplay(evt.date)}</span>
                    </div>
                  </div>

                  <p className="text-[11px] text-gray-600 leading-relaxed font-medium">
                    {evt.details}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Printable Modal */}
      {selectedEmp && (
        <EmployeeCareerReportModal
          isOpen={isCareerReportOpen}
          onClose={() => setIsCareerReportOpen(false)}
          employee={selectedEmp}
          careerRecords={careerRecords}
          promotions={promotions}
          increments={increments}
          settlements={settlements}
        />
      )}
    </div>
  );
};
