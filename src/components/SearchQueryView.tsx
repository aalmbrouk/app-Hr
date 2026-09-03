import React, { useState, useMemo } from 'react';
import { Employee, AssignmentCategory } from '../types';
import { DEPARTMENTS, QUALIFICATIONS, HIRING_ENTITIES } from '../data/initialData';
import { Search, Filter, RefreshCw, UserCheck, Paperclip, Printer, Eye, User, FileText, Calendar } from 'lucide-react';

interface SearchQueryViewProps {
  employees: Employee[];
  onSelectEmployee: (emp: Employee) => void;
  onPrintCard: (emp: Employee) => void;
}

export const SearchQueryView: React.FC<SearchQueryViewProps> = ({
  employees,
  onSelectEmployee,
  onPrintCard
}) => {
  // Requirement #22: Prominent Search by Employee Name with partial matching
  const [nameQuery, setNameQuery] = useState<string>('');
  const [nationalIdQuery, setNationalIdQuery] = useState<string>('');
  const [jobNumberQuery, setJobNumberQuery] = useState<string>('');
  const [cadreQuery, setCadreQuery] = useState<string>('');
  const [categoryQuery, setCategoryQuery] = useState<'الكل' | AssignmentCategory>('الكل');
  const [deptQuery, setDeptQuery] = useState<string>('الكل');
  const [qualQuery, setQualQuery] = useState<string>('الكل');
  const [gradeQuery, setGradeQuery] = useState<string>('');
  const [statusQuery, setStatusQuery] = useState<string>('الكل');
  const [hiringEntityQuery, setHiringEntityQuery] = useState<string>('الكل');

  const [selectedEmp, setSelectedEmp] = useState<Employee | null>(null);

  const filteredResults = useMemo(() => {
    return employees.filter((emp) => {
      // Partial name match
      if (nameQuery.trim() && !emp.fullName.toLowerCase().includes(nameQuery.trim().toLowerCase())) return false;
      if (nationalIdQuery.trim() && !emp.nationalId.includes(nationalIdQuery.trim())) return false;
      if (jobNumberQuery.trim() && !emp.jobNumber.toLowerCase().includes(jobNumberQuery.trim().toLowerCase())) return false;
      if (cadreQuery.trim() && !emp.cadreNumber.toLowerCase().includes(cadreQuery.trim().toLowerCase())) return false;
      if (categoryQuery !== 'الكل' && emp.assignmentCategory !== categoryQuery) return false;
      if (deptQuery !== 'الكل' && emp.department !== deptQuery) return false;
      if (qualQuery !== 'الكل' && emp.qualification !== qualQuery) return false;
      if (gradeQuery.trim() && !emp.jobGrade.toLowerCase().includes(gradeQuery.trim().toLowerCase())) return false;
      if (statusQuery !== 'الكل' && emp.status !== statusQuery) return false;
      if (hiringEntityQuery !== 'الكل' && !emp.hiringEntity.toLowerCase().includes(hiringEntityQuery.trim().toLowerCase())) return false;

      return true;
    });
  }, [
    employees,
    nameQuery,
    nationalIdQuery,
    jobNumberQuery,
    cadreQuery,
    categoryQuery,
    deptQuery,
    qualQuery,
    gradeQuery,
    statusQuery,
    hiringEntityQuery
  ]);

  const handleResetFilters = () => {
    setNameQuery('');
    setNationalIdQuery('');
    setJobNumberQuery('');
    setCadreQuery('');
    setCategoryQuery('الكل');
    setDeptQuery('الكل');
    setQualQuery('الكل');
    setGradeQuery('');
    setStatusQuery('الكل');
    setHiringEntityQuery('الكل');
    setSelectedEmp(null);
  };

  return (
    <div className="space-y-6">
      
      {/* Title Header */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-red-50 text-red-700 border border-red-200">
            <Search className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-gray-900">
              محرك البحث والاستعلام السريع المطور (Search Engine)
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              استعلام فوري بالأجزاء والمقاطع، تصفية الموظفين حسب الكادر، الرقم الوظيفي، الدرجة، والمباشرة
            </p>
          </div>
        </div>

        <button
          onClick={handleResetFilters}
          className="px-4 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs flex items-center gap-2 transition-colors border border-gray-300"
        >
          <RefreshCw className="w-4 h-4" />
          <span>إعادة ضبط الحقول</span>
        </button>
      </div>

      {/* Requirement #22: Prominent Search by Employee Name input */}
      <div className="bg-white border-2 border-red-200 rounded-2xl p-6 shadow-sm space-y-4">
        <div>
          <label className="block text-sm font-extrabold text-red-900 mb-1.5 flex items-center gap-2">
            <User className="w-5 h-5 text-red-700" />
            البحث المباشر باسم الموظف (يدعم البحث الجزئي والمرن):
          </label>
          <div className="relative">
            <Search className="w-5 h-5 absolute right-3.5 top-3.5 text-gray-400" />
            <input
              type="text"
              value={nameQuery}
              onChange={(e) => setNameQuery(e.target.value)}
              className="w-full bg-red-50/30 border border-red-300 rounded-xl pr-11 pl-4 py-3 text-base font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-600 focus:bg-white"
              placeholder="ادخل جزءاً من اسم الموظف..."
            />
          </div>
        </div>

        {/* Multi-Criteria Advanced Filters */}
        <div className="text-xs font-bold text-gray-800 flex items-center gap-2 border-t border-gray-100 pt-3">
          <Filter className="w-4 h-4 text-red-700" />
          <span>مرشحات استعلام إضافية متقدمة:</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div>
            <label className="block text-gray-600 font-bold mb-1">الرقم الوظيفي / رقم الملف</label>
            <input
              type="text"
              value={jobNumberQuery}
              onChange={(e) => setJobNumberQuery(e.target.value)}
              className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 text-gray-900 font-bold focus:outline-none focus:border-red-600"
              placeholder="مثال: 1001/م"
            />
          </div>

          <div>
            <label className="block text-gray-600 font-bold mb-1">الرقم الوطني</label>
            <input
              type="text"
              value={nationalIdQuery}
              onChange={(e) => setNationalIdQuery(e.target.value)}
              className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 text-gray-900 font-mono focus:outline-none focus:border-red-600"
              placeholder="1198XXXXXXX"
            />
          </div>

          <div>
            <label className="block text-gray-600 font-bold mb-1">الكادر / التصنيف الوظيفي</label>
            <select
              value={categoryQuery}
              onChange={(e) => setCategoryQuery(e.target.value as any)}
              className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 text-gray-900 font-bold focus:outline-none focus:border-red-600"
            >
              <option value="الكل">جميع الكوادر</option>
              <option value="إداري">إداري</option>
              <option value="طبي">طبي</option>
            </select>
          </div>

          <div>
            <label className="block text-gray-600 font-bold mb-1">الإدارة / القسم</label>
            <select
              value={deptQuery}
              onChange={(e) => setDeptQuery(e.target.value)}
              className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 text-gray-900 focus:outline-none focus:border-red-600"
            >
              <option value="الكل">جميع الأقسام</option>
              {DEPARTMENTS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-gray-600 font-bold mb-1">الدرجة الحالية</label>
            <input
              type="text"
              value={gradeQuery}
              onChange={(e) => setGradeQuery(e.target.value)}
              className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 text-gray-900 focus:outline-none focus:border-red-600"
              placeholder="الدرجة العاشرة..."
            />
          </div>

          <div>
            <label className="block text-gray-600 font-bold mb-1">الوضع الوظيفي</label>
            <select
              value={statusQuery}
              onChange={(e) => setStatusQuery(e.target.value)}
              className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 text-gray-900 focus:outline-none focus:border-red-600 font-bold"
            >
              <option value="الكل">جميع الحالات الوظيفية</option>
              <option value="على رأس العمل">على رأس العمل (نشط)</option>
              <option value="إجازة">في إجازة</option>
              <option value="منتدب">منتدب</option>
              <option value="منقول خارجياً">منقول خارجياً (خارج الملاك)</option>
              <option value="مستقيل">مستقيل (خارج الملاك)</option>
              <option value="منهي خدماته">منهي خدماته (خارج الملاك)</option>
              <option value="متقاعد">متقاعد (خارج الملاك)</option>
              <option value="متوفى">متوفى (خارج الملاك)</option>
            </select>
          </div>

          <div>
            <label className="block text-gray-600 font-bold mb-1">المؤهل العلمي</label>
            <select
              value={qualQuery}
              onChange={(e) => setQualQuery(e.target.value)}
              className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 text-gray-900 focus:outline-none focus:border-red-600"
            >
              <option value="الكل">جميع المؤهلات</option>
              {QUALIFICATIONS.map((q) => (
                <option key={q} value={q}>{q}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-gray-600 font-bold mb-1">جهة التعيين</label>
            <input
              type="text"
              value={hiringEntityQuery}
              onChange={(e) => setHiringEntityQuery(e.target.value)}
              className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 text-gray-900 focus:outline-none focus:border-red-600"
              placeholder="وزارة الصحة..."
            />
          </div>
        </div>
      </div>

      {/* Results Header */}
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-gray-200 shadow-sm text-sm font-bold">
        <span className="text-gray-800">نتائج الاستعلام ({filteredResults.length} موظف)</span>
        <span className="text-xs text-gray-500 font-normal">اضغط على أي موظف لمعاينة البطاقة السريعة</span>
      </div>

      {/* Results Grid / Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-700 font-bold">
              <tr>
                <th className="py-3 px-4">الرقم الوظيفي</th>
                <th className="py-3 px-4">اسم الموظف</th>
                <th className="py-3 px-4">الرقم الوطني</th>
                <th className="py-3 px-4">التصنيف</th>
                <th className="py-3 px-4">القسم / الإدارة</th>
                <th className="py-3 px-4">الوظيفة</th>
                <th className="py-3 px-4">الدرجة والعلاوة</th>
                <th className="py-3 px-4">تاريخ المباشرة بنك الدم</th>
                <th className="py-3 px-4 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredResults.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-gray-500">
                    لا توجد نتائج تطابق محددات الاستعلام.
                  </td>
                </tr>
              ) : (
                filteredResults.map((emp) => (
                  <tr key={emp.id} className="hover:bg-red-50/40 transition-colors">
                    <td className="py-3 px-4 font-bold text-red-900">{emp.jobNumber}</td>
                    <td className="py-3 px-4 font-extrabold text-gray-900">{emp.fullName}</td>
                    <td className="py-3 px-4 font-mono text-gray-700">{emp.nationalId}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${emp.assignmentCategory === 'طبي' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'}`}>
                        {emp.assignmentCategory}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-800">{emp.department}</td>
                    <td className="py-3 px-4 font-semibold text-gray-800">{emp.jobTitle}</td>
                    <td className="py-3 px-4 text-gray-800">{emp.jobGrade} (علاوة {emp.currentIncrement})</td>
                    <td className="py-3 px-4 text-gray-700">{emp.bloodBankStartDate}</td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => onSelectEmployee(emp)}
                          className="p-1.5 bg-gray-100 hover:bg-red-100 text-red-800 rounded-lg text-xs font-bold"
                          title="عرض الملف"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onPrintCard(emp)}
                          className="p-1.5 bg-gray-100 hover:bg-red-100 text-red-800 rounded-lg text-xs font-bold"
                          title="بطاقة موظف"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
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
