import React, { useState, useMemo } from 'react';
import { Employee, EmploymentStatus, Gender, AssignmentCategory, LeaveTransaction, HrRule } from '../types';
import { ExcelImportModal } from './ExcelImportModal';
import { LeaveModal } from './LeaveModal';
import { OfficialLeavePrintModal } from './OfficialLeavePrintModal';
import { 
  DEPARTMENTS, 
  DEPT_CATEGORIES,
  JOBS_BY_DEPT, 
  QUALIFICATIONS, 
  HIRING_ENTITIES,
  SALARY_SCALES,
  JOB_GRADES,
  ASSIGNMENT_CATEGORIES
} from '../data/initialData';
import { parseGradeNumber } from '../utils/hrCalculations';
import { 
  UserPlus, 
  Edit3, 
  Trash2, 
  Copy, 
  FileText, 
  Search, 
  Filter, 
  Paperclip, 
  Printer, 
  Eye, 
  CheckCircle2, 
  X, 
  Sparkles, 
  Zap, 
  AlertTriangle,
  FolderOpen,
  FileSpreadsheet,
  Building2,
  Calendar,
  Briefcase,
  UserCheck,
  ShieldAlert,
  Award,
  Clock,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';

interface EmployeeManagerViewProps {
  employees: Employee[];
  leaves?: LeaveTransaction[];
  rules?: HrRule[];
  onAddEmployee: (emp: Employee) => void;
  onUpdateEmployee: (emp: Employee) => void;
  onDeleteEmployee: (id: number) => void;
  onDuplicateEmployee: (emp: Employee) => void;
  onPrintCard: (emp: Employee) => void;
  onOpenAddModal: boolean;
  setOpenAddModal: (open: boolean) => void;
  onGenerateHighVolume: (count: number) => void;
  onAddLeave?: (leave: LeaveTransaction) => void;
  currentUser?: string;
}

export const EmployeeManagerView: React.FC<EmployeeManagerViewProps> = ({
  employees,
  leaves = [],
  rules = [],
  onAddEmployee,
  onUpdateEmployee,
  onDeleteEmployee,
  onDuplicateEmployee,
  onPrintCard,
  onOpenAddModal,
  setOpenAddModal,
  onGenerateHighVolume,
  onAddLeave,
  currentUser = 'المستخدم الحالي'
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<'الكل' | AssignmentCategory>('الكل');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>('الكل');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('الكل');
  const [selectedQualFilter, setSelectedQualFilter] = useState<string>('الكل');
  
  // Selection
  const [selectedEmpId, setSelectedEmpId] = useState<number | null>(employees[0]?.id || null);

  // Modal states
  const [isFormOpen, setIsFormOpen] = useState<boolean>(onOpenAddModal);
  const [editingEmp, setEditingEmp] = useState<Employee | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);

  // Leave Modal State for specific employee
  const [leaveModalEmpId, setLeaveModalEmpId] = useState<number | null>(null);
  const [printLeaveRecord, setPrintLeaveRecord] = useState<LeaveTransaction | null>(null);

  // Profile Sub-tab State (Requirement #20)
  const [profileTab, setProfileTab] = useState<
    'personal' | 'employment' | 'assignment' | 'grade' | 'promotions' | 'leaves' | 'disciplinary' | 'transfers' | 'secondments' | 'resignation' | 'procedures' | 'documents' | 'history'
  >('personal');

  // PDF Preview Modal
  const [pdfPreviewEmp, setPdfPreviewEmp] = useState<Employee | null>(null);

  // Pagination for high performance
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 20;

  // Selected Employee
  const selectedEmployee = useMemo(() => {
    return employees.find((e) => e.id === selectedEmpId) || employees[0] || null;
  }, [employees, selectedEmpId]);

  // Sync prop modal open
  React.useEffect(() => {
    if (onOpenAddModal) {
      handleOpenCreate();
      setOpenAddModal(false);
    }
  }, [onOpenAddModal]);

  // Filtered employees
  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      // Category filter (Administrative vs Medical)
      if (selectedCategoryFilter !== 'الكل' && emp.assignmentCategory !== selectedCategoryFilter) return false;
      // Dept filter
      if (selectedDeptFilter !== 'الكل' && emp.department !== selectedDeptFilter) return false;
      // Status filter
      if (selectedStatusFilter !== 'الكل' && emp.status !== selectedStatusFilter) return false;
      // Qualification filter
      if (selectedQualFilter !== 'الكل' && emp.qualification !== selectedQualFilter) return false;

      // Instant Search
      if (!searchQuery.trim()) return true;
      const q = searchQuery.trim().toLowerCase();
      return (
        emp.fullName.toLowerCase().includes(q) ||
        emp.nationalId.includes(q) ||
        emp.jobNumber.toLowerCase().includes(q) ||
        emp.cadreNumber.toLowerCase().includes(q) ||
        emp.department.toLowerCase().includes(q) ||
        emp.jobTitle.toLowerCase().includes(q) ||
        emp.qualification.toLowerCase().includes(q) ||
        emp.phone.includes(q)
      );
    });
  }, [employees, searchQuery, selectedCategoryFilter, selectedDeptFilter, selectedStatusFilter, selectedQualFilter]);

  // Paginated dataset
  const totalPages = Math.ceil(filteredEmployees.length / pageSize) || 1;
  const paginatedEmployees = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredEmployees.slice(start, start + pageSize);
  }, [filteredEmployees, currentPage, pageSize]);

  // Open Form for Create
  const handleOpenCreate = () => {
    const nextId = employees.length > 0 ? Math.max(...employees.map((e) => e.id)) + 1 : 1001;
    const defaultDept = DEPARTMENTS[0];
    const defaultCategory = DEPT_CATEGORIES[defaultDept] || 'إداري';
    const defaultJobs = JOBS_BY_DEPT[defaultDept] || ['موظف إداري'];

    setEditingEmp({
      id: nextId,
      jobNumber: `${nextId}/م`,
      nationalId: '',
      fullName: '',
      motherName: '',
      birthDate: '1992-01-01',
      birthPlace: 'المرج',
      gender: 'ذكر',
      maritalStatus: 'متزوج',
      status: 'على رأس العمل',
      hireDate: '2020-01-01',
      directingDate: '2020-02-01',
      bloodBankStartDate: '2020-02-01',
      appointmentGrade: 'الدرجة السادسة',
      salaryScale: 'جدول المرتبات الموحد',
      jobGrade: 'الدرجة السابعة',
      currentIncrement: 1,
      gradeEntryDate: '',
      transactionType: 'تعيين جديد',
      eligibilityDate: '2026-01-01',
      qualification: QUALIFICATIONS[2] || 'بكالوريوس تقنية مختبرات طبية',
      specialization: 'مختبرات بنك الدم',
      cadreNumber: `MLK-${nextId}`,
      hiringEntity: HIRING_ENTITIES[0] || 'وزارة الصحة - ليبيا',
      assignmentCategory: defaultCategory,
      department: defaultDept,
      jobTitle: defaultJobs[0] || 'أخصائي مختبرات',
      phone: '0910000000',
      email: '',
      pdfPath: '',
      pdfFileName: '',
      notes: ''
    });
    setIsFormOpen(true);
  };

  // Helper to match / normalize stored grade to one of the 15 JOB_GRADES
  const normalizeGradeToOption = (rawGrade?: string): string => {
    if (!rawGrade) return '';
    if (JOB_GRADES.includes(rawGrade)) return rawGrade;
    const gradeNum = parseGradeNumber(rawGrade);
    if (gradeNum >= 1 && gradeNum <= 15 && JOB_GRADES[gradeNum - 1]) {
      return JOB_GRADES[gradeNum - 1];
    }
    return '';
  };

  // Open Form for Edit
  const handleOpenEdit = (emp: Employee) => {
    const matchedGrade = normalizeGradeToOption(emp.jobGrade);
    setEditingEmp({
      ...emp,
      jobGrade: matchedGrade || emp.jobGrade || ''
    });
    setIsFormOpen(true);
  };

  // Save Employee Form
  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEmp) return;

    if (!editingEmp.fullName.trim() || !editingEmp.nationalId.trim()) {
      alert('يرجى كتابة اسم الموظف ورقم هويته الوطنية على الأقل!');
      return;
    }

    const exists = employees.some((e) => e.id === editingEmp.id);
    if (exists) {
      onUpdateEmployee(editingEmp);
    } else {
      onAddEmployee(editingEmp);
    }

    setIsFormOpen(false);
    setSelectedEmpId(editingEmp.id);
  };

  // Handle Department Change in Form (dynamic jobs update)
  const handleFormDeptChange = (dept: string) => {
    if (!editingEmp) return;
    const category = DEPT_CATEGORIES[dept] || 'إداري';
    const jobs = JOBS_BY_DEPT[dept] || ['موظف عام'];
    setEditingEmp({
      ...editingEmp,
      department: dept,
      assignmentCategory: category,
      jobTitle: jobs[0] || 'موظف عام'
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-gray-900">سجل إدارة ملفات وموظفي بنك الدم</h1>
            <span className="bg-red-100 text-red-800 text-xs px-3 py-1 rounded-full font-bold border border-red-200">
              إجمالي {employees.length} موظف
            </span>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            إدارة الكادرين الإداري والطبي، تتبع التكاليف والترقيات والإجازات، والأرشيف الإلكتروني
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 bg-red-700 hover:bg-red-800 text-white px-4 py-2.5 rounded-xl font-bold shadow-sm transition-colors text-sm"
          >
            <UserPlus className="w-4 h-4" />
            إضافة موظف جديد
          </button>

          <button
            onClick={() => setIsImportModalOpen(true)}
            className="flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2.5 rounded-xl font-bold shadow-sm transition-colors text-sm"
          >
            <FileSpreadsheet className="w-4 h-4" />
            استيراد ملف إكسل
          </button>

          <button
            onClick={() => onGenerateHighVolume(50)}
            className="flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2.5 rounded-xl font-semibold text-xs border border-gray-300"
            title="توليد 50 موظف لاختبار الأداء العالي"
          >
            <Zap className="w-3.5 h-3.5 text-amber-600" />
            توليد 50 عينة
          </button>
        </div>
      </div>

      {/* Category Tabs (Requirement #5) */}
      <div className="flex border-b border-gray-200 bg-white px-4 pt-3 rounded-t-xl">
        <button
          onClick={() => { setSelectedCategoryFilter('الكل'); setCurrentPage(1); }}
          className={`pb-3 px-4 font-bold text-sm border-b-2 transition-all ${
            selectedCategoryFilter === 'الكل'
              ? 'border-red-700 text-red-800'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          كافة الكوادر ({employees.length})
        </button>
        <button
          onClick={() => { setSelectedCategoryFilter('إداري'); setCurrentPage(1); }}
          className={`pb-3 px-4 font-bold text-sm border-b-2 transition-all ${
            selectedCategoryFilter === 'إداري'
              ? 'border-blue-700 text-blue-800'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          الكادر الإداري ({employees.filter((e) => e.assignmentCategory === 'إداري').length})
        </button>
        <button
          onClick={() => { setSelectedCategoryFilter('طبي'); setCurrentPage(1); }}
          className={`pb-3 px-4 font-bold text-sm border-b-2 transition-all ${
            selectedCategoryFilter === 'طبي'
              ? 'border-emerald-700 text-emerald-800'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          الكادر الطبي والمساعد ({employees.filter((e) => e.assignmentCategory === 'طبي').length})
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 absolute right-3 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="بحث بالاسم، الرقم الوظيفي، الهوية، القسم..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            className="w-full pr-9 pl-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-red-600 outline-none"
          />
        </div>

        <div>
          <select
            value={selectedDeptFilter}
            onChange={(e) => { setSelectedDeptFilter(e.target.value); setCurrentPage(1); }}
            className="w-full py-2 px-3 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-red-600 outline-none"
          >
            <option value="الكل">جميع الأقسام والإدارات</option>
            {DEPARTMENTS.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={selectedStatusFilter}
            onChange={(e) => { setSelectedStatusFilter(e.target.value); setCurrentPage(1); }}
            className="w-full py-2 px-3 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-red-600 outline-none"
          >
            <option value="الكل">جميع الحالات الوظيفية</option>
            <option value="على رأس العمل">على رأس العمل</option>
            <option value="إجازة سنوية">إجازة سنوية</option>
            <option value="إجازة مرضية">إجازة مرضية</option>
            <option value="إجازة بدون مرتب">إجازة بدون مرتب</option>
            <option value="منتدب للخارج">منتدب للخارج</option>
            <option value="مستقيل">مستقيل</option>
            <option value="متقاعد">متقاعد</option>
          </select>
        </div>

        <div>
          <select
            value={selectedQualFilter}
            onChange={(e) => { setSelectedQualFilter(e.target.value); setCurrentPage(1); }}
            className="w-full py-2 px-3 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-red-600 outline-none"
          >
            <option value="الكل">جميع المؤهلات العلميّة</option>
            {QUALIFICATIONS.map((q) => (
              <option key={q} value={q}>{q}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Split Layout: Employees List (Right) & Detailed Profile (Left) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* RIGHT COLUMN: Employees List Table (5 Cols) */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col h-[750px]">
          <div className="p-3 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
            <span className="font-bold text-xs text-gray-800">
              قائمة الموظفين ({filteredEmployees.length})
            </span>
            <span className="text-[11px] text-gray-500">
              صفحة {currentPage} من {totalPages}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
            {paginatedEmployees.length === 0 ? (
              <div className="p-8 text-center text-gray-500 text-xs">
                لا يوجد موظفون يطابقون محددات البحث
              </div>
            ) : (
              paginatedEmployees.map((emp) => {
                const isSelected = selectedEmployee?.id === emp.id;
                return (
                  <div
                    key={emp.id}
                    onClick={() => setSelectedEmpId(emp.id)}
                    className={`p-3 cursor-pointer transition-colors border-r-4 ${
                      isSelected
                        ? 'bg-red-50/80 border-red-700 shadow-inner'
                        : 'hover:bg-gray-50 border-transparent'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        {/* Requirement #2: Prominent Job Number / File Number, small System ID */}
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-gray-900">{emp.fullName}</span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setLeaveModalEmpId(emp.id);
                            }}
                            className="px-2 py-0.5 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-md text-[10px] font-extrabold border border-amber-300/80 flex items-center gap-1 transition-colors shadow-2xs"
                            title="تسجيل إجازة سريعة للموظف"
                          >
                            <Calendar className="w-3 h-3 text-amber-700" />
                            <span>إجازة</span>
                          </button>
                        </div>
                        <div className="text-xs text-gray-600 font-mono mt-0.5 flex items-center gap-2">
                          <span className="font-bold text-red-900 bg-red-100/80 px-1.5 py-0.5 rounded text-[11px]">
                            الرقم الوظيفي: {emp.jobNumber}
                          </span>
                          <span className="text-[10px] text-gray-400">#السيستم: {emp.id}</span>
                        </div>
                      </div>

                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                          emp.assignmentCategory === 'طبي'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {emp.assignmentCategory}
                      </span>
                    </div>

                    <div className="mt-2 grid grid-cols-2 text-[11px] text-gray-600 gap-1 border-t border-gray-100 pt-1.5">
                      <div><span className="text-gray-400">القسم:</span> {emp.department}</div>
                      <div><span className="text-gray-400">الدرجة:</span> {emp.jobGrade}</div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Pagination Controls */}
          <div className="p-2.5 bg-gray-50 border-t border-gray-200 flex justify-between items-center text-xs">
            <button
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="p-1.5 rounded border border-gray-300 disabled:opacity-40 hover:bg-gray-100"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <span className="text-gray-600">
              {currentPage} / {totalPages}
            </span>
            <button
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="p-1.5 rounded border border-gray-300 disabled:opacity-40 hover:bg-gray-100"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* LEFT COLUMN: Redesigned Tabbed Employee Profile (Requirement #20) (7 Cols) */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {selectedEmployee ? (
            <div>
              {/* Profile Top Banner */}
              <div className="bg-gradient-to-r from-red-900 to-red-800 p-5 text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-white/20 text-white px-2.5 py-0.5 rounded-full font-bold">
                      {selectedEmployee.assignmentCategory}
                    </span>
                    <span className="text-xs bg-emerald-500/30 text-emerald-100 px-2.5 py-0.5 rounded-full font-bold">
                      {selectedEmployee.status}
                    </span>
                  </div>
                  <h2 className="text-xl font-bold mt-1">{selectedEmployee.fullName}</h2>
                  {/* Requirement #2: File number prominent, System ID small */}
                  <div className="text-xs text-red-200 mt-0.5 flex items-center gap-3 font-mono">
                    <span>الرقم الوظيفي / رقم الملف: <strong className="text-white bg-white/10 px-1.5 py-0.5 rounded">{selectedEmployee.jobNumber}</strong></span>
                    <span>الرقم الوطني: <strong>{selectedEmployee.nationalId}</strong></span>
                    <span className="text-red-300">النظام الداخلي: #{selectedEmployee.id}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setLeaveModalEmpId(selectedEmployee.id)}
                    className="p-2 bg-amber-500/30 hover:bg-amber-500/50 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition-colors border border-amber-300/40 shadow-sm"
                    title="تسجيل إجازة للموظف"
                  >
                    <Calendar className="w-4 h-4 text-amber-300" />
                    <span>إجازة</span>
                  </button>
                  <button
                    onClick={() => handleOpenEdit(selectedEmployee)}
                    className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                    title="تعديل الموظف"
                  >
                    <Edit3 className="w-4 h-4" />
                    تعديل
                  </button>
                  <button
                    onClick={() => onPrintCard(selectedEmployee)}
                    className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                    title="طباعة بطاقة وظيفية"
                  >
                    <Printer className="w-4 h-4" />
                    البطاقة
                  </button>
                  <button
                    onClick={() => onDeleteEmployee(selectedEmployee.id)}
                    className="p-2 bg-red-600/50 hover:bg-red-600 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                    title="حذف الموظف"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Requirement #20: 13 Profile Sub-tabs */}
              <div className="flex border-b border-gray-200 bg-gray-50 overflow-x-auto text-xs font-bold scrollbar-none">
                {[
                  { id: 'personal', label: 'البيانات الشخصية' },
                  { id: 'employment', label: 'البيانات الوظيفية' },
                  { id: 'assignment', label: 'التكليف (إداري/طبي)' },
                  { id: 'grade', label: 'الدرجة والعلاوات' },
                  { id: 'promotions', label: 'سجل الترقيات' },
                  { id: 'leaves', label: 'الإجازات والرصيد' },
                  { id: 'disciplinary', label: 'الجزاءات والخصم' },
                  { id: 'transfers', label: 'النقل الداخلي' },
                  { id: 'secondments', label: 'الإعارات والندب' },
                  { id: 'resignation', label: 'إنهاء الخدمة' },
                  { id: 'procedures', label: 'الإجراءات العامة' },
                  { id: 'documents', label: 'الأرشيف والمستندات' },
                  { id: 'history', label: 'السجل التراكمي' }
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setProfileTab(t.id as any)}
                    className={`py-3 px-3 border-b-2 whitespace-nowrap transition-colors ${
                      profileTab === t.id
                        ? 'border-red-700 text-red-800 bg-white'
                        : 'border-transparent text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Sub-tab Content Area */}
              <div className="p-6 min-h-[420px] text-sm text-gray-800">
                
                {/* 1. PERSONAL */}
                {profileTab === 'personal' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <span className="text-xs text-gray-500 block">الاسم الرباعي</span>
                      <span className="font-bold text-gray-900">{selectedEmployee.fullName}</span>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <span className="text-xs text-gray-500 block">إسم الأم</span>
                      <span className="font-semibold text-gray-900">{selectedEmployee.motherName || 'غير مسجل'}</span>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <span className="text-xs text-gray-500 block">الرقم الوطني</span>
                      <span className="font-mono font-bold text-gray-900">{selectedEmployee.nationalId}</span>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <span className="text-xs text-gray-500 block">تاريخ ومكان الميلاد</span>
                      <span className="font-semibold text-gray-900">{selectedEmployee.birthDate} - {selectedEmployee.birthPlace || 'المرج'}</span>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <span className="text-xs text-gray-500 block">الجنس والحالة الاجتماعية</span>
                      <span className="font-semibold text-gray-900">{selectedEmployee.gender} | {selectedEmployee.maritalStatus}</span>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <span className="text-xs text-gray-500 block">رقم الهاتف</span>
                      <span className="font-mono font-bold text-gray-900">{selectedEmployee.phone || 'غير مسجل'}</span>
                    </div>
                  </div>
                )}

                {/* 2. EMPLOYMENT */}
                {profileTab === 'employment' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <span className="text-xs text-gray-500 block">الرقم الوظيفي / رقم الملف</span>
                      <span className="font-bold text-red-900">{selectedEmployee.jobNumber}</span>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <span className="text-xs text-gray-500 block">رقم الملاك الوظيفي</span>
                      <span className="font-mono font-bold text-gray-900">{selectedEmployee.cadreNumber}</span>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <span className="text-xs text-gray-500 block">جهة التعيين (مفتوح)</span>
                      <span className="font-semibold text-gray-900">{selectedEmployee.hiringEntity}</span>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <span className="text-xs text-gray-500 block">تاريخ التعيين والمباشرة</span>
                      <span className="font-semibold text-gray-900">التعيين: {selectedEmployee.hireDate} | المباشرة: {selectedEmployee.directingDate}</span>
                    </div>
                    <div className="p-3 bg-red-50 rounded-lg border border-red-200 col-span-2">
                      <span className="text-xs text-red-700 block font-bold">تاريخ المباشرة في مصرف الدم (تُحسب منها الخدمة الفعلية)</span>
                      <span className="font-extrabold text-red-900">{selectedEmployee.bloodBankStartDate || selectedEmployee.directingDate}</span>
                    </div>
                  </div>
                )}

                {/* 3. ASSIGNMENT */}
                {profileTab === 'assignment' && (
                  <div className="space-y-4">
                    <div className="p-4 bg-gray-50 border rounded-lg space-y-2">
                      <div className="text-xs text-gray-500">التصنيف الوظيفي الحالي:</div>
                      <div className="text-base font-extrabold text-gray-900 flex items-center gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-extrabold ${selectedEmployee.assignmentCategory === 'طبي' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'}`}>
                          {selectedEmployee.assignmentCategory}
                        </span>
                        <span>{selectedEmployee.department}</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-gray-50 border rounded-lg">
                        <span className="text-xs text-gray-500 block">الوظيفة المعتمدة:</span>
                        <span className="font-bold text-gray-900">{selectedEmployee.jobTitle}</span>
                      </div>
                      <div className="p-3 bg-gray-50 border rounded-lg">
                        <span className="text-xs text-gray-500 block">المؤهل والتخصص:</span>
                        <span className="font-bold text-gray-900">{selectedEmployee.qualification} ({selectedEmployee.specialization})</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* 4. GRADE */}
                {profileTab === 'grade' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-gray-50 border rounded-lg">
                      <span className="text-xs text-gray-500 block">الدرجة المعين عليها</span>
                      <span className="font-bold text-gray-900">{selectedEmployee.appointmentGrade}</span>
                    </div>
                    <div className="p-3 bg-gray-50 border rounded-lg">
                      <span className="text-xs text-gray-500 block">جدول المرتبات</span>
                      <span className="font-bold text-gray-900">{selectedEmployee.salaryScale}</span>
                    </div>
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <span className="text-xs text-red-700 block font-bold">اسم الدرجة الحالية</span>
                      <span className="font-extrabold text-red-900 text-base">{selectedEmployee.jobGrade}</span>
                    </div>
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <span className="text-xs text-red-700 block font-bold">عدد العلاوات الحالية</span>
                      <span className="font-extrabold text-red-900 text-base">{selectedEmployee.currentIncrement} علاوة</span>
                    </div>
                    <div className="p-3 bg-gray-50 border rounded-lg">
                      <span className="text-xs text-gray-500 block">تاريخ الحصول على الدرجة الحالية</span>
                      <span className="font-bold text-gray-900">{selectedEmployee.gradeEntryDate}</span>
                    </div>
                    <div className="p-3 bg-gray-50 border rounded-lg">
                      <span className="text-xs text-gray-500 block">تاريخ استحقاق الترقية القادمة</span>
                      <span className="font-bold text-gray-900">{selectedEmployee.eligibilityDate}</span>
                    </div>
                  </div>
                )}

                {/* 5-13: Standard summary place-holders */}
                {['promotions', 'leaves', 'disciplinary', 'transfers', 'secondments', 'resignation', 'procedures', 'documents', 'history'].includes(profileTab) && (
                  <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 text-center space-y-2">
                    <FolderOpen className="w-8 h-8 text-red-700 mx-auto" />
                    <h4 className="font-bold text-gray-800">سجلات الموظف التراكمية في قسم ({profileTab})</h4>
                    <p className="text-xs text-gray-500 max-w-sm mx-auto">
                      جميع العمليات التاريخية الخاصة بالموظف مسجلة في جداول الحركة والتغييرات المستقلة مع الأرشفة الإلكترونية الكاملة.
                    </p>
                  </div>
                )}

              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-gray-400 text-sm">
              اختر موظفاً من القائمة الجانبية لعرض الملف الشامل
            </div>
          )}
        </div>

      </div>

      {/* Employee Add/Edit Modal */}
      {isFormOpen && editingEmp && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full p-6 space-y-4 border border-gray-200">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-extrabold text-lg text-gray-900">
                {editingEmp.id && employees.some((e) => e.id === editingEmp.id) ? 'تعديل بيانات موظف' : 'إضافة موظف جديد'}
              </h3>
              <button onClick={() => setIsFormOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveForm} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">الرقم الوظيفي / رقم الملف *</label>
                  <input
                    type="text"
                    required
                    value={editingEmp.jobNumber}
                    onChange={(e) => setEditingEmp({ ...editingEmp, jobNumber: e.target.value })}
                    className="w-full p-2 border rounded-lg font-bold text-red-900"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">الرقم الوطني *</label>
                  <input
                    type="text"
                    required
                    value={editingEmp.nationalId}
                    onChange={(e) => setEditingEmp({ ...editingEmp, nationalId: e.target.value })}
                    className="w-full p-2 border rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">الاسم الرباعي الكامل *</label>
                  <input
                    type="text"
                    required
                    value={editingEmp.fullName}
                    onChange={(e) => setEditingEmp({ ...editingEmp, fullName: e.target.value })}
                    className="w-full p-2 border rounded-lg font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">إسم الأم</label>
                  <input
                    type="text"
                    value={editingEmp.motherName}
                    onChange={(e) => setEditingEmp({ ...editingEmp, motherName: e.target.value })}
                    className="w-full p-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">تاريخ الميلاد</label>
                  <input
                    type="date"
                    value={editingEmp.birthDate}
                    onChange={(e) => setEditingEmp({ ...editingEmp, birthDate: e.target.value })}
                    className="w-full p-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">مكان الميلاد</label>
                  <input
                    type="text"
                    value={editingEmp.birthPlace}
                    onChange={(e) => setEditingEmp({ ...editingEmp, birthPlace: e.target.value })}
                    className="w-full p-2 border rounded-lg"
                  />
                </div>

                {/* Requirement #6: Dynamic Dept & Job dropdown */}
                <div>
                  <label className="block font-bold text-gray-700 mb-1">القسم / الإدارة *</label>
                  <select
                    value={editingEmp.department}
                    onChange={(e) => handleFormDeptChange(e.target.value)}
                    className="w-full p-2 border rounded-lg font-semibold"
                  >
                    {DEPARTMENTS.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">المسمى الوظيفي *</label>
                  <select
                    value={editingEmp.jobTitle}
                    onChange={(e) => setEditingEmp({ ...editingEmp, jobTitle: e.target.value })}
                    className="w-full p-2 border rounded-lg font-semibold"
                  >
                    {(JOBS_BY_DEPT[editingEmp.department] || ['موظف عام']).map((j) => (
                      <option key={j} value={j}>{j}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">التصنيف الوظيفي</label>
                  <input
                    type="text"
                    disabled
                    value={editingEmp.assignmentCategory}
                    className="w-full p-2 border bg-gray-100 rounded-lg font-bold text-gray-600"
                  />
                </div>

                {/* Requirement #3: Open text Hiring Entity */}
                <div>
                  <label className="block font-bold text-gray-700 mb-1">جهة التعيين (مفتوح)</label>
                  <input
                    type="text"
                    value={editingEmp.hiringEntity}
                    onChange={(e) => setEditingEmp({ ...editingEmp, hiringEntity: e.target.value })}
                    placeholder="اكتب جهة التعيين..."
                    className="w-full p-2 border rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">تاريخ المباشرة بمصرف الدم *</label>
                  <input
                    type="date"
                    value={editingEmp.bloodBankStartDate}
                    onChange={(e) => setEditingEmp({ ...editingEmp, bloodBankStartDate: e.target.value })}
                    className="w-full p-2 border rounded-lg font-bold text-red-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">جدول المرتبات</label>
                  <select
                    value={editingEmp.salaryScale}
                    onChange={(e) => setEditingEmp({ ...editingEmp, salaryScale: e.target.value })}
                    className="w-full p-2 border rounded-lg"
                  >
                    {SALARY_SCALES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">اسم الدرجة الحالية *</label>
                  <select
                    required
                    value={editingEmp.jobGrade}
                    onChange={(e) => setEditingEmp({ ...editingEmp, jobGrade: e.target.value })}
                    className={`w-full p-2 border rounded-lg font-bold ${
                      !JOB_GRADES.includes(editingEmp.jobGrade) ? 'border-amber-500 bg-amber-50 text-amber-900' : ''
                    }`}
                  >
                    {!JOB_GRADES.includes(editingEmp.jobGrade) && (
                      <option value="">-- اختر الدرجة الوظيفية (غير محددة) --</option>
                    )}
                    {JOB_GRADES.map((g) => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                  {!JOB_GRADES.includes(editingEmp.jobGrade) && (
                    <p className="text-xs text-amber-700 mt-1 font-semibold flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      تنبيه: القيمة السابقة ({editingEmp.jobGrade || 'فارغة'}) غير مطابقة للقائمة القياسية. يرجى اختيار الدرجة يدوياً.
                    </p>
                  )}
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">عدد العلاوات</label>
                  <input
                    type="number"
                    min={0}
                    max={15}
                    value={editingEmp.currentIncrement}
                    onChange={(e) => setEditingEmp({ ...editingEmp, currentIncrement: Number(e.target.value) })}
                    className="w-full p-2 border rounded-lg font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">تاريخ الدرجة الحالية</label>
                  <input
                    type="date"
                    value={editingEmp.gradeEntryDate}
                    onChange={(e) => setEditingEmp({ ...editingEmp, gradeEntryDate: e.target.value })}
                    className="w-full p-2 border rounded-lg"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 border rounded-lg text-gray-700"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-red-700 hover:bg-red-800 text-white rounded-lg font-bold"
                >
                  حفظ البيانات
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Excel Import Wizard Modal */}
      <ExcelImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportEmployees={(newEmps) => {
          newEmps.forEach((ne) => {
            const exists = employees.some((e) => e.id === ne.id);
            if (exists) onUpdateEmployee(ne);
            else onAddEmployee(ne);
          });
        }}
        existingEmployees={employees}
      />

      {/* Quick Leave Modal for Employee */}
      {leaveModalEmpId !== null && (
        <LeaveModal
          isOpen={leaveModalEmpId !== null}
          onClose={() => setLeaveModalEmpId(null)}
          employees={employees}
          initialEmpId={leaveModalEmpId}
          leaves={leaves}
          rules={rules}
          onAddLeave={(newLeave) => {
            if (onAddLeave) onAddLeave(newLeave);
          }}
          onPrintLeaveDirectly={(l) => setPrintLeaveRecord(l)}
          currentUser={currentUser}
        />
      )}

      {/* Official Leave Print Preview Modal */}
      {printLeaveRecord && (
        <OfficialLeavePrintModal
          leave={printLeaveRecord}
          employee={employees.find((e) => e.id === printLeaveRecord.employeeId)}
          onClose={() => setPrintLeaveRecord(null)}
        />
      )}
    </div>
  );
};
