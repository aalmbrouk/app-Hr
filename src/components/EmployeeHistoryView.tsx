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
  StatusSettlementRecord 
} from '../types';
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
  Building
} from 'lucide-react';

interface TimelineEvent {
  id: string;
  type: 'تعيين' | 'مباشرة' | 'ترقية' | 'علاوة' | 'تسوية' | 'ندب' | 'نقل' | 'إجازة' | 'جزاء' | 'استقالة';
  date: string;
  title: string;
  details: string;
  badgeColor: string;
  icon: React.ReactNode;
}

interface EmployeeHistoryViewProps {
  employees: Employee[];
  leaves: LeaveTransaction[];
  promotions: PromotionRecord[];
  increments: IncrementRecord[];
  secondments: SecondmentRecord[];
  transfers: TransferRecord[];
  disciplinary: DisciplinaryRecord[];
  resignations: ResignationRecord[];
  settlements: StatusSettlementRecord[];
}

export const EmployeeHistoryView: React.FC<EmployeeHistoryViewProps> = ({
  employees,
  leaves,
  promotions,
  increments,
  secondments,
  transfers,
  disciplinary,
  resignations,
  settlements
}) => {
  const [selectedEmpId, setSelectedEmpId] = useState<number>(employees[0]?.id || 1001);
  const [filterType, setFilterType] = useState<string>('all');

  const selectedEmp = employees.find((e) => e.id === selectedEmpId) || employees[0];

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

    // 3. Promotions
    promotions
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

    // 4. Increments
    increments
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

    // 5. Settlements
    settlements
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

    // 6. Secondments
    secondments
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

    // 7. Transfers
    transfers
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

    // 8. Leaves
    leaves
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

    // 9. Disciplinary
    disciplinary
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

    // 10. Resignation
    resignations
      .filter((r) => r.employeeId === selectedEmp.id)
      .forEach((r) => {
        events.push({
          id: r.id,
          type: 'استقالة',
          date: r.resignationDate,
          title: `إنهاء خدمة: ${r.finalStatus}`,
          details: `القرار: ${r.decisionNumber} | السبب: ${r.reason}`,
          badgeColor: 'bg-slate-200 text-slate-900 border-slate-300',
          icon: <UserX className="w-4 h-4 text-slate-800" />
        });
      });

    // Sort descending by date
    return events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [selectedEmp, leaves, promotions, increments, secondments, transfers, disciplinary, resignations, settlements]);

  const filteredEvents = timelineEvents.filter((ev) => filterType === 'all' || ev.type === filterType);

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-red-700 font-bold text-xs mb-1">
            <History className="w-4 h-4" />
            <span>السجل التاريخي الشامل للموظف (Unified Career History)</span>
          </div>
          <h2 className="text-xl font-black text-slate-900">سجل الأحداث والحركات الوظيفية المتسلسلة</h2>
          <p className="text-xs text-slate-500 mt-1">
            عرض تسلسلي لجميع القرارات، الترقيات، العلاوات، الندب، النقل، الإجازات، والجزاءات منذ المباشرة
          </p>
        </div>

        {/* Employee Picker */}
        <div className="w-full md:w-80">
          <label className="block text-[11px] font-bold text-slate-500 mb-1">اختر الموظف لعرض السجل:</label>
          <select
            value={selectedEmpId}
            onChange={(e) => setSelectedEmpId(Number(e.target.value))}
            className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 shadow-sm"
          >
            {employees.map((e) => (
              <option key={e.id} value={e.id}>
                {e.fullName} ({e.jobNumber} - {e.department})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Selected Employee Bio Card */}
      {selectedEmp && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm grid grid-cols-2 md:grid-cols-5 gap-4 text-xs">
          <div>
            <span className="text-slate-400 block mb-0.5">الاسم الرباعي</span>
            <span className="font-black text-slate-900 text-sm">{selectedEmp.fullName}</span>
          </div>

          <div>
            <span className="text-slate-400 block mb-0.5">الرقم الوظيفي / الملاك</span>
            <span className="font-mono font-bold text-slate-800">{selectedEmp.jobNumber}</span>
          </div>

          <div>
            <span className="text-slate-400 block mb-0.5">الدرجة الحالية</span>
            <span className="font-bold text-red-700">{selectedEmp.jobGrade}</span>
          </div>

          <div>
            <span className="text-slate-400 block mb-0.5">تاريخ المباشرة</span>
            <span className="font-mono text-slate-800">{selectedEmp.directingDate || selectedEmp.hireDate}</span>
          </div>

          <div>
            <span className="text-slate-400 block mb-0.5">الحالة الوظيفية</span>
            <span className="font-bold text-emerald-700">{selectedEmp.status}</span>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
        <span className="text-xs font-bold text-slate-500 flex items-center gap-1 ml-2">
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span>تصفية الأحداث:</span>
        </span>

        {[
          { key: 'all', label: 'كل الأحداث' },
          { key: 'ترقية', label: 'الترقيات' },
          { key: 'علاوة', label: 'العلاوات' },
          { key: 'إجازة', label: 'الإجازات' },
          { key: 'ندب', label: 'الندب' },
          { key: 'نقل', label: 'النقل' },
          { key: 'جزاء', label: 'الجزاءات' }
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setFilterType(t.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              filterType === t.key
                ? 'bg-red-700 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Timeline Tree */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        {filteredEvents.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            لا توجد أحداث مسجلة مطابقة لتصفية هذا الموظف
          </div>
        ) : (
          <div className="relative border-r-2 border-slate-200 mr-4 space-y-6 pr-6">
            {filteredEvents.map((ev) => (
              <div key={ev.id} className="relative group">
                
                {/* Timeline Dot Icon */}
                <div className="absolute -right-[35px] top-1.5 w-8 h-8 rounded-full bg-white border-2 border-slate-300 flex items-center justify-center shadow-sm group-hover:border-red-600 transition-colors">
                  {ev.icon}
                </div>

                {/* Event Card */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 transition-all hover:bg-white hover:shadow-md">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${ev.badgeColor}`}>
                        {ev.type}
                      </span>
                      <h4 className="text-xs font-black text-slate-900">{ev.title}</h4>
                    </div>

                    <span className="font-mono text-[11px] font-bold text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200 w-fit">
                      {ev.date}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 font-medium">{ev.details}</p>
                </div>

              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
