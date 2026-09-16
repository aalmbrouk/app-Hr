import React, { useState, useEffect } from 'react';
import { 
  Employee, 
  LeaveTransaction, 
  IncrementRecord, 
  PromotionRecord, 
  StatusSettlementRecord, 
  GeneralProcedure 
} from '../types';
import { calculateEmployeeIncrementBreakdown } from '../utils/incrementUtils';
import { formatDateDisplay } from '../utils/dateUtils';
import { getGenderFromEmployee } from '../utils/nationalIdUtils';
import { 
  X, 
  User, 
  Briefcase, 
  Calendar, 
  Award, 
  Zap, 
  Edit3, 
  Printer, 
  Trash2, 
  ChevronDown, 
  ChevronUp, 
  FileText, 
  Upload, 
  Download, 
  Eye, 
  Clock, 
  Building2, 
  ShieldAlert, 
  CheckCircle2, 
  Info,
  Paperclip,
  Phone,
  Mail,
  MapPin,
  FileSpreadsheet,
  AlertTriangle,
  FileCheck,
  ExternalLink,
  Layers,
  Sparkles,
  MoreVertical
} from 'lucide-react';

interface EmployeeSideDrawerProps {
  employee: Employee | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenEdit: (emp: Employee) => void;
  onPrintCard: (emp: Employee) => void;
  onDeleteEmployee: (id: number) => void;
  onOpenLeaveModal: (empId: number) => void;
  onOpenIncrementDetails: (emp: Employee) => void;
  onUpdateEmployee: (emp: Employee) => void;
  leaves?: LeaveTransaction[];
  increments?: IncrementRecord[];
  promotions?: PromotionRecord[];
  settlements?: StatusSettlementRecord[];
  generalProcedures?: GeneralProcedure[];
}

export const EmployeeSideDrawer: React.FC<EmployeeSideDrawerProps> = ({
  employee,
  isOpen,
  onClose,
  onOpenEdit,
  onPrintCard,
  onDeleteEmployee,
  onOpenLeaveModal,
  onOpenIncrementDetails,
  onUpdateEmployee,
  leaves = [],
  increments = [],
  promotions = [],
  settlements = [],
  generalProcedures = []
}) => {
  // Collapsible section states (Personal and Job open by default)
  const [openSections, setOpenSections] = useState<{ [key: string]: boolean }>({
    personal: true,
    job: true,
    increments: false,
    leaves: false,
    promotions: false,
    careerChange: false,
    disciplinary: false,
    documents: false,
    notes: false
  });

  const [showMoreActions, setShowMoreActions] = useState(false);
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !employee) return null;

  const toggleSection = (sectionKey: string) => {
    setOpenSections((prev) => ({
      ...prev,
      [sectionKey]: !prev[sectionKey]
    }));
  };

  const isLibyan = employee.nationality === 'ليبي' || !employee.nationality;

  // Calculate increment sources breakdown
  const breakdown = calculateEmployeeIncrementBreakdown(
    employee,
    increments,
    promotions,
    settlements,
    generalProcedures
  );

  const employeeLeaves = (leaves || []).filter((l) => l.employeeId === employee.id);
  const employeePromos = (promotions || []).filter((p) => p.employeeId === employee.id);
  const employeeSettles = (settlements || []).filter((s) => s.employeeId === employee.id);
  const employeeProcedures = (generalProcedures || []).filter((g) => g.employeeId === employee.id);

  // Handle PDF upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingDoc(true);
    const reader = new FileReader();
    reader.onload = () => {
      const base64Data = reader.result as string;
      onUpdateEmployee({
        ...employee,
        pdfPath: base64Data,
        pdfFileName: file.name
      });
      setIsUploadingDoc(false);
    };
    reader.onerror = () => {
      alert('حدث خطأ أثناء قراءة المستند.');
      setIsUploadingDoc(false);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveDoc = () => {
    if (window.confirm('هل أنت متأكد من رغبتك في إزالة المستند المرفق للموظف؟')) {
      onUpdateEmployee({
        ...employee,
        pdfPath: '',
        pdfFileName: ''
      });
    }
  };

  return (
    <>
      {/* Backdrop for mobile / medium screens */}
      <div 
        onClick={onClose}
        className="fixed inset-0 bg-black/40 backdrop-blur-xs z-40 lg:hidden transition-opacity"
        aria-hidden="true"
      />

      {/* Side Drawer Panel (Sliding in from Right for RTL) */}
      <div 
        className="fixed top-0 bottom-0 right-0 z-50 w-full sm:w-[420px] lg:w-[440px] max-w-[95vw] lg:max-w-[42vw] bg-white border-l border-gray-200 shadow-2xl flex flex-col transition-transform duration-300 ease-in-out text-right select-text overflow-hidden"
        dir="rtl"
      >
        {/* 1. TOP STICKY DRAWER HEADER */}
        <div className="bg-gradient-to-b from-gray-50 to-white p-4 border-b border-gray-200 shrink-0">
          <div className="flex items-center justify-between gap-2 mb-2.5">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold text-red-800 bg-red-100/90 px-2 py-0.5 rounded border border-red-200">
                بطاقة بيانات الموظف
              </span>
              <span className="text-[11px] font-mono text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                #{employee.id}
              </span>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
              title="إغلاق اللوحة الجانبية (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Prominent Employee Name */}
          <div className="mb-2">
            <h2 className="text-[18px] sm:text-[19px] font-bold text-gray-950 leading-snug break-words">
              {employee.fullName}
            </h2>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-600 mt-1">
              <span className="font-semibold text-gray-900 bg-gray-100 px-1.5 py-0.5 rounded">
                ملف: {employee.jobNumber}
              </span>
              <span className="text-gray-300">|</span>
              <span className="font-mono text-gray-700">
                {isLibyan ? `الوطني: ${employee.nationalId || '-'}` : `جواز: ${employee.passportNumber || employee.nationalId}`}
              </span>
              <span className="text-gray-300">|</span>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${
                employee.status === 'على رأس العمل'
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  : employee.status.includes('إجازة')
                  ? 'bg-amber-100 text-amber-900 border border-amber-200'
                  : 'bg-gray-100 text-gray-800 border border-gray-200'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${
                  employee.status === 'على رأس العمل' ? 'bg-emerald-600' : 'bg-amber-600'
                }`} />
                {employee.status}
              </span>
            </div>
          </div>

          {/* Quick Action Toolbar */}
          <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-gray-100 text-xs">
            <button
              type="button"
              onClick={() => onOpenEdit(employee)}
              className="flex items-center gap-1 bg-blue-50 hover:bg-blue-100 text-blue-800 px-2.5 py-1.5 rounded-lg font-bold border border-blue-200 transition cursor-pointer shadow-2xs"
              title="تعديل بيانات الموظف"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>تعديل</span>
            </button>

            <button
              type="button"
              onClick={() => onPrintCard(employee)}
              className="flex items-center gap-1 bg-red-700 hover:bg-red-800 text-white px-2.5 py-1.5 rounded-lg font-bold transition cursor-pointer shadow-2xs"
              title="طباعة بطاقة التعريف الرسمية"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>طباعة الملف</span>
            </button>

            <button
              type="button"
              onClick={() => onOpenLeaveModal(employee.id)}
              className="flex items-center gap-1 bg-amber-50 hover:bg-amber-100 text-amber-900 px-2.5 py-1.5 rounded-lg font-bold border border-amber-300 transition cursor-pointer shadow-2xs"
              title="تسجيل إجازة للموظف"
            >
              <Calendar className="w-3.5 h-3.5 text-amber-700" />
              <span>إجازة</span>
            </button>

            <button
              type="button"
              onClick={() => onOpenIncrementDetails(employee)}
              className="flex items-center gap-1 bg-orange-50 hover:bg-orange-100 text-orange-900 px-2.5 py-1.5 rounded-lg font-bold border border-orange-200 transition cursor-pointer shadow-2xs"
              title="تفصيل العلاوات والمراجع"
            >
              <Zap className="w-3.5 h-3.5 text-amber-600" />
              <span>العلاوات (+{employee.currentIncrement || 1})</span>
            </button>

            <div className="relative inline-block">
              <button
                type="button"
                onClick={() => setShowMoreActions(!showMoreActions)}
                className="p-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg border border-gray-300 transition cursor-pointer"
                title="المزيد من الإجراءات"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {showMoreActions && (
                <div 
                  className="absolute left-0 mt-1 w-44 bg-white border border-gray-200 rounded-xl shadow-lg z-50 py-1 text-right text-xs"
                  onClick={() => setShowMoreActions(false)}
                >
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(`هل أنت متأكد من حذف الموظف (${employee.fullName}) نهائياً؟`)) {
                        onDeleteEmployee(employee.id);
                        onClose();
                      }
                    }}
                    className="w-full text-right px-3 py-2 text-rose-700 hover:bg-rose-50 font-bold flex items-center gap-2"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>حذف الموظف</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 2. SCROLLABLE COLLAPSIBLE ACCORDION BODY */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2.5 scrollbar-thin bg-gray-50/70">
          
          {/* SECTION 1: البيانات الشخصية */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-2xs overflow-hidden">
            <button
              type="button"
              onClick={() => toggleSection('personal')}
              className="w-full p-3 flex items-center justify-between bg-gray-50/80 hover:bg-gray-100 transition-colors text-right cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-red-700" />
                <span className="text-xs font-bold text-gray-900">البيانات الشخصية</span>
              </div>
              {openSections.personal ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
            </button>

            {openSections.personal && (
              <div className="p-3 border-t border-gray-100 grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 bg-gray-50 rounded border border-gray-100 col-span-2">
                  <span className="text-gray-400 block text-[10px]">الاسم الكامل:</span>
                  <span className="font-bold text-gray-900">{employee.fullName}</span>
                </div>
                <div className="p-2 bg-gray-50 rounded border border-gray-100">
                  <span className="text-gray-400 block text-[10px]">اسم الأم:</span>
                  <span className="font-semibold text-gray-800">{employee.motherName || 'غير مسجل'}</span>
                </div>
                <div className="p-2 bg-gray-50 rounded border border-gray-100">
                  <span className="text-gray-400 block text-[10px]">الجنسية:</span>
                  <span className="font-bold text-gray-800">{employee.nationality || 'ليبي'}</span>
                </div>
                <div className="p-2 bg-gray-50 rounded border border-gray-100">
                  <span className="text-gray-400 block text-[10px]">{isLibyan ? 'الرقم الوطني:' : 'رقم الجواز:'}</span>
                  <span className="font-mono font-bold text-gray-800">{isLibyan ? (employee.nationalId || '-') : (employee.passportNumber || employee.nationalId)}</span>
                </div>
                <div className="p-2 bg-gray-50 rounded border border-gray-100">
                  <span className="text-gray-400 block text-[10px]">تاريخ الميلاد:</span>
                  <span className="font-medium text-gray-800">{formatDateDisplay(employee.birthDate)}</span>
                </div>
                <div className="p-2 bg-gray-50 rounded border border-gray-100">
                  <span className="text-gray-400 block text-[10px]">مكان الميلاد:</span>
                  <span className="font-medium text-gray-800">{employee.birthPlace || '-'}</span>
                </div>
                <div className="p-2 bg-gray-50 rounded border border-gray-100">
                  <span className="text-gray-400 block text-[10px]">الجنس / الحالة:</span>
                  <span className="font-medium text-gray-800">{getGenderFromEmployee(employee)} ({employee.maritalStatus || 'متزوج'})</span>
                </div>
                <div className="p-2 bg-gray-50 rounded border border-gray-100">
                  <span className="text-gray-400 block text-[10px]">رقم الهاتف:</span>
                  <span className="font-mono text-gray-800">{employee.phone || '-'}</span>
                </div>
                <div className="p-2 bg-gray-50 rounded border border-gray-100 col-span-2">
                  <span className="text-gray-400 block text-[10px]">البريد الإلكتروني:</span>
                  <span className="font-mono text-gray-700 text-[11px] truncate block">{employee.email || 'غير مسجل'}</span>
                </div>
              </div>
            )}
          </div>

          {/* SECTION 2: بيانات التعيين والمباشرة */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-2xs overflow-hidden">
            <button
              type="button"
              onClick={() => toggleSection('appointment')}
              className="w-full p-3 flex items-center justify-between bg-gray-50/80 hover:bg-gray-100 transition-colors text-right cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-emerald-700" />
                <span className="text-xs font-bold text-gray-900">بيانات التعيين والمباشرة</span>
              </div>
              {openSections.appointment ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
            </button>

            {openSections.appointment && (
              <div className="p-3 border-t border-gray-100 grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 bg-gray-50 rounded border border-gray-100">
                  <span className="text-gray-400 block text-[10px]">تاريخ التعيين الأول:</span>
                  <span className="font-bold text-gray-900">{formatDateDisplay(employee.hireDate)}</span>
                </div>
                <div className="p-2 bg-gray-50 rounded border border-gray-100">
                  <span className="text-gray-400 block text-[10px]">تاريخ المباشرة:</span>
                  <span className="font-bold text-gray-900">{formatDateDisplay(employee.directingDate)}</span>
                </div>
                <div className="p-2 bg-gray-50 rounded border border-gray-100">
                  <span className="text-gray-400 block text-[10px]">بدء العمل بالمصرف:</span>
                  <span className="font-semibold text-gray-800">{formatDateDisplay(employee.bloodBankStartDate)}</span>
                </div>
                <div className="p-2 bg-gray-50 rounded border border-gray-100 col-span-2">
                  <span className="text-gray-400 block text-[10px]">نظام الدرجة المعين عليها:</span>
                  <span className="font-semibold text-gray-800">{employee.appointmentSalarySystem || 'جدول مرتبات القانون 15'}</span>
                </div>
                <div className="p-2 bg-gray-50 rounded border border-gray-100">
                  <span className="text-gray-400 block text-[10px]">الدرجة عند التعيين:</span>
                  <span className="font-bold text-amber-900">{employee.appointmentGrade || '-'}</span>
                </div>
                <div className="p-2 bg-gray-50 rounded border border-gray-100">
                  <span className="text-gray-400 block text-[10px]">علاوات التعيين:</span>
                  <span className="font-semibold text-gray-800">{employee.appointmentIncrements ?? 0} علاوات</span>
                </div>
                <div className="p-2 bg-gray-50 rounded border border-gray-100 col-span-2">
                  <span className="text-gray-400 block text-[10px]">جهة التعيين:</span>
                  <span className="font-medium text-gray-800">{employee.hiringEntity || '-'}</span>
                </div>
                <div className="p-2 bg-gray-50 rounded border border-gray-100">
                  <span className="text-gray-400 block text-[10px]">قرار التعيين:</span>
                  <span className="font-mono text-gray-800">{employee.appointmentDecisionNumber || '-'}</span>
                </div>
                <div className="p-2 bg-gray-50 rounded border border-gray-100">
                  <span className="text-gray-400 block text-[10px]">نوع العملية الإدارية:</span>
                  <span className="font-semibold text-gray-800">{employee.transactionType || '-'}</span>
                </div>
              </div>
            )}
          </div>

          {/* SECTION 3: البيانات الوظيفية والملاك */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-2xs overflow-hidden">
            <button
              type="button"
              onClick={() => toggleSection('job')}
              className="w-full p-3 flex items-center justify-between bg-gray-50/80 hover:bg-gray-100 transition-colors text-right cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-blue-700" />
                <span className="text-xs font-bold text-gray-900">البيانات الوظيفية والملاك</span>
              </div>
              {openSections.job ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
            </button>

            {openSections.job && (
              <div className="p-3 border-t border-gray-100 grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 bg-gray-50 rounded border border-gray-100 col-span-2">
                  <span className="text-gray-400 block text-[10px]">القسم / الإدارة:</span>
                  <span className="font-bold text-gray-900">{employee.department}</span>
                </div>
                <div className="p-2 bg-gray-50 rounded border border-gray-100 col-span-2">
                  <span className="text-gray-400 block text-[10px]">المسمى الوظيفي:</span>
                  <span className="font-bold text-gray-900">{employee.jobTitle}</span>
                </div>
                <div className="p-2 bg-gray-50 rounded border border-gray-100">
                  <span className="text-gray-400 block text-[10px]">الكادر الوظيفي:</span>
                  <span className={`font-bold px-1.5 py-0.5 rounded text-[11px] ${
                    employee.assignmentCategory === 'طبي' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                  }`}>
                    {employee.assignmentCategory || 'إداري'}
                  </span>
                </div>
                <div className="p-2 bg-gray-50 rounded border border-gray-100">
                  <span className="text-gray-400 block text-[10px]">رقم الملاك / المالي:</span>
                  <span className="font-mono font-bold text-gray-800">{employee.cadreNumber || '-'}</span>
                </div>
                <div className="p-2 bg-gray-50 rounded border border-gray-100 col-span-2">
                  <span className="text-gray-400 block text-[10px]">المؤهل والتخصص:</span>
                  <span className="font-medium text-gray-800">{employee.qualification} {employee.specialization ? `(${employee.specialization})` : ''}</span>
                </div>
                <div className="p-2 bg-gray-50 rounded border border-gray-100 col-span-2">
                  <span className="text-gray-400 block text-[10px]">جدول المرتبات:</span>
                  <span className="font-medium text-gray-700">{employee.salaryScale || 'جدول المرتبات الموحد'}</span>
                </div>
              </div>
            )}
          </div>

          {/* SECTION 4: الدرجة والعلاوات */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-2xs overflow-hidden">
            <button
              type="button"
              onClick={() => toggleSection('increments')}
              className="w-full p-3 flex items-center justify-between bg-gray-50/80 hover:bg-gray-100 transition-colors text-right cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-600" />
                <span className="text-xs font-bold text-gray-900">
                  الدرجة والعلاوات (+{employee.currentIncrement || 1})
                </span>
              </div>
              {openSections.increments ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
            </button>

            {openSections.increments && (
              <div className="p-3 border-t border-gray-100 space-y-2 text-xs">
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2 bg-red-50 rounded border border-red-200">
                    <span className="text-red-600 block text-[10px] font-bold">الدرجة الحالية:</span>
                    <span className="font-black text-red-950 text-sm">{employee.jobGrade}</span>
                  </div>
                  <div className="p-2 bg-amber-50 rounded border border-amber-200">
                    <span className="text-amber-700 block text-[10px] font-bold">رصيد العلاوات:</span>
                    <span className="font-black text-amber-950 text-sm">+{employee.currentIncrement || 1} علاوة</span>
                  </div>
                </div>

                <div className="p-2 bg-gray-50 rounded border border-gray-100">
                  <span className="text-gray-500 block text-[10px] font-bold mb-1">تفصيل مصادر العلاوات النشطة:</span>
                  <div className="grid grid-cols-3 gap-1.5 text-center">
                    <div className="p-1 bg-white rounded border border-gray-200">
                      <span className="text-[10px] text-gray-400 block">سنوية:</span>
                      <span className="font-bold text-gray-800">{breakdown.annualAutoIncrements}</span>
                    </div>
                    <div className="p-1 bg-white rounded border border-gray-200">
                      <span className="text-[10px] text-gray-400 block">ترقية:</span>
                      <span className="font-bold text-emerald-700">{breakdown.promotionIncrements}</span>
                    </div>
                    <div className="p-1 bg-white rounded border border-gray-200">
                      <span className="text-[10px] text-gray-400 block">تسويات:</span>
                      <span className="font-bold text-blue-700">{breakdown.settlementIncrements}</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onOpenIncrementDetails(employee)}
                  className="w-full py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg text-xs font-bold text-center border border-gray-300 transition cursor-pointer"
                >
                  فتح سجل ومراجع العلاوات الكامل
                </button>
              </div>
            )}
          </div>

          {/* SECTION 5: الإجازات */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-2xs overflow-hidden">
            <button
              type="button"
              onClick={() => toggleSection('leaves')}
              className="w-full p-3 flex items-center justify-between bg-gray-50/80 hover:bg-gray-100 transition-colors text-right cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-amber-700" />
                <span className="text-xs font-bold text-gray-900">
                  سجل الإجازات ({employeeLeaves.length})
                </span>
              </div>
              {openSections.leaves ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
            </button>

            {openSections.leaves && (
              <div className="p-3 border-t border-gray-100 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">إجمالي الحركات: {employeeLeaves.length}</span>
                  <button
                    type="button"
                    onClick={() => onOpenLeaveModal(employee.id)}
                    className="text-xs bg-amber-600 hover:bg-amber-700 text-white font-bold px-2 py-1 rounded transition"
                  >
                    + تسجيل إجازة
                  </button>
                </div>

                {employeeLeaves.length === 0 ? (
                  <p className="text-center text-gray-400 py-3 text-xs">لا توجد إجازات مسجلة للموظف.</p>
                ) : (
                  <div className="space-y-1.5 max-h-36 overflow-y-auto scrollbar-thin">
                    {employeeLeaves.map((l) => (
                      <div key={l.id} className="p-2 bg-gray-50 rounded border border-gray-200 flex justify-between items-center text-[11px]">
                        <div>
                          <span className="font-bold text-gray-800 block">{l.leaveType} ({l.daysCount} يوم)</span>
                          <span className="text-gray-400 text-[10px]">{formatDateDisplay(l.startDate)} إلى {formatDateDisplay(l.endDate)}</span>
                        </div>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          l.status === 'معتمدة' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {l.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* SECTION 6: الترقيات والتسويات */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-2xs overflow-hidden">
            <button
              type="button"
              onClick={() => toggleSection('promotions')}
              className="w-full p-3 flex items-center justify-between bg-gray-50/80 hover:bg-gray-100 transition-colors text-right cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-purple-700" />
                <span className="text-xs font-bold text-gray-900">
                  الترقيات والتسويات ({employeePromos.length + employeeSettles.length})
                </span>
              </div>
              {openSections.promotions ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
            </button>

            {openSections.promotions && (
              <div className="p-3 border-t border-gray-100 space-y-2 text-xs">
                {employeePromos.length === 0 && employeeSettles.length === 0 ? (
                  <p className="text-center text-gray-400 py-3 text-xs">لا توجد سجلات ترقية سابقة.</p>
                ) : (
                  <div className="space-y-1.5 max-h-36 overflow-y-auto scrollbar-thin">
                    {employeePromos.map((p) => (
                      <div key={p.id} className="p-2 bg-purple-50/50 rounded border border-purple-200 text-[11px]">
                        <span className="font-bold text-purple-900 block">ترقية إلى: {p.toGrade}</span>
                        <span className="text-gray-500 text-[10px]">قرار: {p.decisionNumber || '-'} بتاريخ {formatDateDisplay(p.effectiveDate)}</span>
                      </div>
                    ))}
                    {employeeSettles.map((s) => (
                      <div key={s.id} className="p-2 bg-blue-50/50 rounded border border-blue-200 text-[11px]">
                        <span className="font-bold text-blue-900 block">تسوية: {s.settlementType}</span>
                        <span className="text-gray-500 text-[10px]">قرار: {s.decisionNumber || '-'} بتاريخ {formatDateDisplay(s.effectiveDate)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* SECTION 7: الوثائق والمستندات الرسمية PDF */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-2xs overflow-hidden">
            <button
              type="button"
              onClick={() => toggleSection('documents')}
              className="w-full p-3 flex items-center justify-between bg-gray-50/80 hover:bg-gray-100 transition-colors text-right cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Paperclip className="w-4 h-4 text-red-700" />
                <span className="text-xs font-bold text-gray-900">
                  الوثائق والأرشيف PDF {employee.pdfPath ? '(1 مستند)' : '(0)'}
                </span>
              </div>
              {openSections.documents ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
            </button>

            {openSections.documents && (
              <div className="p-3 border-t border-gray-100 space-y-2.5 text-xs">
                {employee.pdfPath ? (
                  <div className="p-3 bg-red-50/70 border border-red-200 rounded-xl space-y-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="w-5 h-5 text-red-700 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <span className="font-bold text-gray-900 text-xs block truncate">
                          {employee.pdfFileName || 'ملف_الموظف_المرفق.pdf'}
                        </span>
                        <span className="text-[10px] text-gray-500">ملف PDF مرفق بالسجل</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      <a
                        href={employee.pdfPath}
                        download={employee.pdfFileName || `ملف_موظف_${employee.jobNumber}.pdf`}
                        className="px-2.5 py-1 bg-red-700 hover:bg-red-800 text-white rounded text-[11px] font-bold flex items-center gap-1 transition"
                      >
                        <Download className="w-3 h-3" />
                        <span>تحميل</span>
                      </a>
                      <button
                        type="button"
                        onClick={handleRemoveDoc}
                        className="px-2 py-1 bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 rounded text-[11px] font-semibold transition"
                      >
                        إزالة
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 border-2 border-dashed border-gray-300 rounded-xl text-center space-y-2">
                    <Paperclip className="w-6 h-6 text-gray-400 mx-auto" />
                    <p className="text-gray-500 text-xs">لا يوجد ملف PDF مرفق بهذا الموظف</p>
                    <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-700 hover:bg-red-800 text-white rounded-lg text-xs font-bold cursor-pointer transition shadow-2xs">
                      <Upload className="w-3.5 h-3.5" />
                      <span>{isUploadingDoc ? 'جارِ الرفع...' : 'رفع وثيقة PDF'}</span>
                      <input
                        type="file"
                        accept="application/pdf"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* SECTION 8: الملاحظات والإجراءات العامة */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-2xs overflow-hidden">
            <button
              type="button"
              onClick={() => toggleSection('notes')}
              className="w-full p-3 flex items-center justify-between bg-gray-50/80 hover:bg-gray-100 transition-colors text-right cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-gray-600" />
                <span className="text-xs font-bold text-gray-900">الملاحظات والقرارات الإدارية</span>
              </div>
              {openSections.notes ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
            </button>

            {openSections.notes && (
              <div className="p-3 border-t border-gray-100 space-y-2 text-xs">
                {employee.notes ? (
                  <div className="p-2.5 bg-amber-50/60 rounded border border-amber-200 text-amber-950 font-medium text-xs leading-relaxed">
                    {employee.notes}
                  </div>
                ) : (
                  <p className="text-gray-400 text-xs">لا توجد ملاحظات خاصة مسجلة.</p>
                )}

                {employeeProcedures.length > 0 && (
                  <div className="mt-2 space-y-1">
                    <span className="text-[10px] font-bold text-gray-500 block">الإجراءات العامة المسجلة:</span>
                    {employeeProcedures.map((proc) => (
                      <div key={proc.id} className="p-2 bg-gray-50 rounded border border-gray-200 text-[11px]">
                        <span className="font-bold text-gray-800">{proc.procedureName}</span>
                        <span className="text-gray-400 text-[10px] block">قرار: {proc.decisionNumber || '-'} ({formatDateDisplay(proc.executionDate)})</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

        </div>

        {/* 3. BOTTOM FOOTER */}
        <div className="p-3 bg-gray-50 border-t border-gray-200 shrink-0 flex items-center justify-between text-xs">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-bold transition cursor-pointer"
          >
            إغلاق اللوحة
          </button>

          <span className="text-[11px] text-gray-400">
            مصرف الدم المركزي بلدية المرج
          </span>
        </div>
      </div>
    </>
  );
};
