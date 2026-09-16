import React, { useMemo } from 'react';
import { Employee } from '../types';
import { BarChart3, Users, Award, Briefcase, Building2, Calendar, UserCheck, UserX, ArrowLeftRight } from 'lucide-react';
import { isEmployeeActiveInCadre, isOutsideCadreStatus } from '../utils/hrCalculations';
import { getGenderFromEmployee } from '../utils/nationalIdUtils';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';

interface StatisticsViewProps {
  employees: Employee[];
}

const PALETTE = ['#8B0000', '#991B1B', '#B91C1C', '#DC2626', '#EF4444', '#F87171', '#FCA5A5', '#7F1D1D'];

export const StatisticsView: React.FC<StatisticsViewProps> = ({ employees = [] }) => {
  // Statistics Computations
  const totalCount = employees.length;
  const activeInCadreCount = (employees || []).filter((e) => isEmployeeActiveInCadre(e)).length;
  const outsideCadreCount = (employees || []).filter((e) => isOutsideCadreStatus(e.status)).length;
  const maleCount = (employees || []).filter((e) => getGenderFromEmployee(e) === 'ذكر').length;
  const femaleCount = (employees || []).filter((e) => getGenderFromEmployee(e) === 'أنثى').length;

  // By Dept
  const deptData = useMemo(() => {
    const map: Record<string, number> = {};
    (employees || []).forEach((e) => {
      const d = e.department.replace('قسم ', '');
      map[d] = (map[d] || 0) + 1;
    });
    return Object.entries(map).map(([name, count]) => ({ name, count }));
  }, [employees]);

  // By Qualification
  const qualData = useMemo(() => {
    const map: Record<string, number> = {};
    (employees || []).forEach((e) => {
      const q = (e.qualification || 'غير محدد').split('/')[0].trim();
      map[q] = (map[q] || 0) + 1;
    });
    return Object.entries(map).map(([name, count]) => ({ name, count }));
  }, [employees]);

  // By Job Title
  const jobTitleData = useMemo(() => {
    const map: Record<string, number> = {};
    employees.forEach((e) => {
      map[e.jobTitle] = (map[e.jobTitle] || 0) + 1;
    });
    return Object.entries(map)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 7);
  }, [employees]);

  // By Hiring Entity
  const entityData = useMemo(() => {
    const map: Record<string, number> = {};
    employees.forEach((e) => {
      map[e.hiringEntity] = (map[e.hiringEntity] || 0) + 1;
    });
    return Object.entries(map).map(([name, count]) => ({ name, count }));
  }, [employees]);

  // By Directing Year
  const yearData = useMemo(() => {
    const map: Record<string, number> = {};
    employees.forEach((e) => {
      if (e.directingDate) {
        const yr = e.directingDate.split('-')[0];
        if (yr) map[yr] = (map[yr] || 0) + 1;
      }
    });
    return Object.entries(map)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [employees]);

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-red-950 text-red-400 border border-red-800">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-black text-white">
              لوحة الإحصاءات والتحليلات الرسمية (Analytical Charts)
            </h2>
            <p className="text-xs text-slate-400">
              مؤشرات وتوزيع القوى العاملة لمصرف الدم المركزي المرج - ليبيا
            </p>
          </div>
        </div>
        <div className="text-xs font-mono font-bold text-red-300 bg-red-950 px-3 py-1.5 rounded-xl border border-red-800">
          إجمالي الكادر: {totalCount.toLocaleString('ar-LY')}
        </div>
      </div>

      {/* Quick Cadre Metrics Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">داخل الملاك النشط</span>
            <UserCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-xl font-black text-emerald-400 mt-1">{activeInCadreCount}</p>
          <span className="text-[10px] text-slate-500">على رأس العمل / إجازات / انتداب</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">خارج الملاك الوظيفي</span>
            <UserX className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-xl font-black text-amber-400 mt-1">{outsideCadreCount}</p>
          <span className="text-[10px] text-slate-500">نقل خارجي / استقالة / إنهاء خدمة</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">ذكور</span>
            <Users className="w-4 h-4 text-sky-400" />
          </div>
          <p className="text-xl font-black text-sky-400 mt-1">{maleCount}</p>
          <span className="text-[10px] text-slate-500">{totalCount > 0 ? ((maleCount / totalCount) * 100).toFixed(1) : 0}% من الإجمالي</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">إناث</span>
            <Users className="w-4 h-4 text-pink-400" />
          </div>
          <p className="text-xl font-black text-pink-400 mt-1">{femaleCount}</p>
          <span className="text-[10px] text-slate-500">{totalCount > 0 ? ((femaleCount / totalCount) * 100).toFixed(1) : 0}% من الإجمالي</span>
        </div>
      </div>

      {/* Grid Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Chart 1: Departments */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <h3 className="text-xs font-bold text-white mb-4 pb-2 border-b border-slate-800 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-red-500" />
            <span>الموظفون بحسب أقسام المصرف</span>
          </h3>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deptData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} angle={-15} textAnchor="end" />
                <YAxis stroke="#94a3b8" fontSize={10} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff' }}
                  formatter={(v: any) => [`${v} موظف`, 'العدد']}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {deptData.map((_, idx) => (
                    <Cell key={idx} fill={PALETTE[idx % PALETTE.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Qualifications */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <h3 className="text-xs font-bold text-white mb-4 pb-2 border-b border-slate-800 flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-500" />
            <span>الموظفون بحسب المؤهلات العلمية</span>
          </h3>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={qualData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} angle={-15} textAnchor="end" />
                <YAxis stroke="#94a3b8" fontSize={10} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff' }}
                  formatter={(v: any) => [`${v} موظف`, 'العدد']}
                />
                <Bar dataKey="count" fill="#D97706" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Directing Year Timeline */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <h3 className="text-xs font-bold text-white mb-4 pb-2 border-b border-slate-800 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-emerald-500" />
            <span>توزيع الموظفين بحسب سنة المباشرة بالمصرف</span>
          </h3>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={yearData} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} />
                <YAxis stroke="#94a3b8" fontSize={10} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff' }}
                  formatter={(v: any) => [`${v} موظف`, 'العدد']}
                />
                <Bar dataKey="count" fill="#059669" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 4: Hiring Entity */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <h3 className="text-xs font-bold text-white mb-4 pb-2 border-b border-slate-800 flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-sky-500" />
            <span>الموظفون بحسب جهة التعيين</span>
          </h3>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={entityData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="count"
                  label={({ name }) => name}
                >
                  {entityData.map((_, idx) => (
                    <Cell key={idx} fill={PALETTE[idx % PALETTE.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff' }}
                  formatter={(v: any) => [`${v} موظف`, 'العدد']}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

    </div>
  );
};
