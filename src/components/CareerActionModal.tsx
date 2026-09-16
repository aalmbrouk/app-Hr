import React, { useState, useEffect, useMemo } from 'react';
import { 
  Employee, 
  CareerPromotionRecord, 
  CareerActionType 
} from '../types';
import { JOB_GRADES, HIRING_ENTITIES } from '../data/initialData';
import { getCareerActionMeta, isValidJobGrade, sanitizeAllowancesCount, getGeneralNumericalRank } from '../utils/careerUtils';
import { 
  X, 
  Award, 
  Zap, 
  ShieldAlert, 
  Check, 
  FileText, 
  Building2, 
  Calendar, 
  HelpCircle,
  TrendingUp,
  UserCheck,
  AlertTriangle,
  Info,
  Clock,
  Briefcase,
  Layers,
  FileCheck2,
  MapPin,
  ArrowRightLeft,
  UserPlus,
  Compass,
  FileSpreadsheet
} from 'lucide-react';
import { formatDateDisplay } from '../utils/dateUtils';

interface CareerActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  employees: Employee[];
  initialEmployeeId?: number;
  initialActionType?: CareerActionType;
  recordToEdit?: CareerPromotionRecord | null;
  onSubmit: (record: CareerPromotionRecord) => void;
  currentUser?: string;
}

export const CAREER_ACTION_CATEGORIES = [
  { id: 'all', name: 'جميع الحركات' },
  { id: 'promotions', name: 'الترقيات والعلاوات' },
  { id: 'assignments', name: 'التكليفات والمهام' },
  { id: 'transfers', name: 'النقل ومقر العمل' },
  { id: 'titles', name: 'المسميات والإجراءات' }
] as const;

export const CAREER_ACTION_TYPES_CONFIG: { type: CareerActionType; category: 'promotions' | 'assignments' | 'transfers' | 'titles'; isGradeChanging: boolean }[] = [
  // ترقيات وعلاوات
  { type: 'ترقية', category: 'promotions', isGradeChanging: true },
  { type: 'علاوة سنوية', category: 'promotions', isGradeChanging: false },
  { type: 'ترقية استثنائية', category: 'promotions', isGradeChanging: true },
  { type: 'تسوية وضع', category: 'promotions', isGradeChanging: true },
  { type: 'ندب على درجة', category: 'promotions', isGradeChanging: true },
  { type: 'تحويل من اللائحة 418 إلى نظام الدرجات العامة', category: 'promotions', isGradeChanging: true },

  // تكليفات
  { type: 'تكليف', category: 'assignments', isGradeChanging: false },
  { type: 'إنهاء تكليف', category: 'assignments', isGradeChanging: false },

  // نقل وأماكن عمل
  { type: 'نقل', category: 'transfers', isGradeChanging: false },
  { type: 'تغيير مكان العمل', category: 'transfers', isGradeChanging: false },
  { type: 'ندب', category: 'transfers', isGradeChanging: false },
  { type: 'انتهاء الندب', category: 'transfers', isGradeChanging: false },
  { type: 'العودة من الندب', category: 'transfers', isGradeChanging: false },
  { type: 'إعارة / نقل خارجي', category: 'transfers', isGradeChanging: false },

  // مسميات وحركات أخرى
  { type: 'تغيير المسمى الوظيفي', category: 'titles', isGradeChanging: false },
  { type: 'حركة وظيفية أخرى', category: 'titles', isGradeChanging: false },
];

export const CareerActionModal: React.FC<CareerActionModalProps> = ({
  isOpen,
  onClose,
  employees,
  initialEmployeeId,
  initialActionType = 'ترقية',
  recordToEdit = null,
  onSubmit,
  currentUser = 'المستخدم الحالي'
}) => {
  const [selectedEmpId, setSelectedEmpId] = useState<number>(
    recordToEdit?.employeeId || initialEmployeeId || employees[0]?.id || 1001
  );
  const [actionType, setActionType] = useState<CareerActionType>(
    recordToEdit?.actionType || initialActionType
  );
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  // Grade & Increment Information
  const [previousGrade, setPreviousGrade] = useState<string>(recordToEdit?.previousGrade || '');
  const [newGrade, setNewGrade] = useState<string>(
    recordToEdit?.newGrade || JOB_GRADES[6] || 'الدرجة السابعة'
  );
  const [previousIncrement, setPreviousIncrement] = useState<number>(
    recordToEdit?.previousIncrement ?? 0
  );
  const [newIncrement, setNewIncrement] = useState<number>(
    recordToEdit?.newIncrement !== undefined ? recordToEdit.newIncrement : 1
  );
  const [salaryScale, setSalaryScale] = useState<string>(
    recordToEdit?.salaryScale || 'جدول المرتبات الموحد'
  );

  // Official Decision Information
  const [decisionNumber, setDecisionNumber] = useState<string>(
    recordToEdit?.decisionNumber || ''
  );
  const [decisionDate, setDecisionDate] = useState<string>(
    recordToEdit?.decisionDate || new Date().toISOString().slice(0, 10)
  );
  const [actionDate, setActionDate] = useState<string>(
    recordToEdit?.actionDate || recordToEdit?.effectiveDate || new Date().toISOString().slice(0, 10)
  );
  const [startDate, setStartDate] = useState<string>(
    recordToEdit?.startDate || recordToEdit?.actionDate || new Date().toISOString().slice(0, 10)
  );
  const [endDate, setEndDate] = useState<string>(
    recordToEdit?.endDate || ''
  );
  const [entitlementDate, setEntitlementDate] = useState<string>(
    recordToEdit?.entitlementDate || ''
  );
  const [issuingAuthority, setIssuingAuthority] = useState<string>(
    recordToEdit?.issuingAuthority || 'وزارة الصحة - ليبيا'
  );
  const [reason, setReason] = useState<string>(recordToEdit?.reason || '');
  const [notes, setNotes] = useState<string>(recordToEdit?.notes || '');

  // Work Location & Transfer Fields
  const [previousWorkLocation, setPreviousWorkLocation] = useState<string>(
    recordToEdit?.previousWorkLocation || ''
  );
  const [newWorkLocation, setNewWorkLocation] = useState<string>(
    recordToEdit?.newWorkLocation || recordToEdit?.workLocation || ''
  );
  const [previousDepartment, setPreviousDepartment] = useState<string>(
    recordToEdit?.previousDepartment || ''
  );
  const [newDepartment, setNewDepartment] = useState<string>(
    recordToEdit?.newDepartment || recordToEdit?.department || ''
  );
  const [previousEntity, setPreviousEntity] = useState<string>(
    recordToEdit?.previousEntity || ''
  );
  const [newEntity, setNewEntity] = useState<string>(
    recordToEdit?.newEntity || ''
  );

  // Assignment Fields
  const [assignmentTitle, setAssignmentTitle] = useState<string>(
    recordToEdit?.assignmentTitle || ''
  );
  const [assignmentType, setAssignmentType] = useState<string>(
    recordToEdit?.assignmentType || 'رئاسة قسم / وحدة'
  );
  const [assignmentRole, setAssignmentRole] = useState<string>(
    recordToEdit?.assignmentRole || ''
  );
  const [linkedAssignmentId, setLinkedAssignmentId] = useState<string>(
    recordToEdit?.linkedAssignmentId || ''
  );

  // Secondment Fields
  const [secondmentEntity, setSecondmentEntity] = useState<string>(
    recordToEdit?.secondmentEntity || ''
  );
  const [secondmentType, setSecondmentType] = useState<string>(
    recordToEdit?.secondmentType || 'محدد المدة'
  );

  // Job Title Fields
  const [previousJobTitle, setPreviousJobTitle] = useState<string>(
    recordToEdit?.previousJobTitle || ''
  );
  const [newJobTitle, setNewJobTitle] = useState<string>(
    recordToEdit?.newJobTitle || recordToEdit?.jobTitle || ''
  );

  // Competency Report Information (Optional)
  const [competencyEvaluation, setCompetencyEvaluation] = useState<string>(
    recordToEdit?.competencyEvaluation || 'غير متوفر'
  );
  const [evaluationYear, setEvaluationYear] = useState<string>(
    recordToEdit?.evaluationYear ? String(recordToEdit.evaluationYear) : ''
  );
  const [evaluationResult, setEvaluationResult] = useState<string>(
    recordToEdit?.evaluationResult || ''
  );

  const [errors, setErrors] = useState<string[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [showConfirmEdit, setShowConfirmEdit] = useState<boolean>(false);

  const selectedEmp = employees.find((e) => e.id === selectedEmpId) || employees[0];

  const currentActionConfig = useMemo(() => {
    return CAREER_ACTION_TYPES_CONFIG.find(c => c.type === actionType) || {
      type: actionType,
      category: 'promotions' as const,
      isGradeChanging: false
    };
  }, [actionType]);

  const isGradeAffecting = currentActionConfig.isGradeChanging;
  const isIncrementOnly = actionType === 'علاوة سنوية' || actionType === 'علاوة دورية';
  const isAssignmentAction = actionType === 'تكليف' || actionType === 'إنهاء تكليف';
  const isTransferOrLocationAction = actionType === 'نقل' || actionType === 'تغيير مكان العمل';
  const isSecondmentAction = actionType === 'ندب' || actionType === 'انتهاء الندب' || actionType === 'العودة من الندب' || actionType === 'إعارة / نقل خارجي';
  const isJobTitleAction = actionType === 'تغيير المسمى الوظيفي';

  useEffect(() => {
    if (!isOpen) {
      setShowConfirmEdit(false);
      setErrors([]);
      setWarnings([]);
      return;
    }

    if (recordToEdit) {
      setSelectedEmpId(recordToEdit.employeeId);
      setActionType(recordToEdit.actionType);
      setPreviousGrade(recordToEdit.previousGrade || '');
      setNewGrade(recordToEdit.newGrade || '');
      setPreviousIncrement(recordToEdit.previousIncrement ?? 0);
      setNewIncrement(recordToEdit.newIncrement ?? 0);
      setSalaryScale(recordToEdit.salaryScale || 'جدول المرتبات الموحد');
      setDecisionNumber(recordToEdit.decisionNumber || '');
      setDecisionDate(recordToEdit.decisionDate || recordToEdit.decisionIssueDate || new Date().toISOString().slice(0, 10));
      setActionDate(recordToEdit.actionDate || recordToEdit.effectiveDate || new Date().toISOString().slice(0, 10));
      setStartDate(recordToEdit.startDate || recordToEdit.actionDate || new Date().toISOString().slice(0, 10));
      setEndDate(recordToEdit.endDate || '');
      setEntitlementDate(recordToEdit.entitlementDate || '');
      setIssuingAuthority(recordToEdit.issuingAuthority || 'وزارة الصحة - ليبيا');
      setReason(recordToEdit.reason || '');
      setNotes(recordToEdit.notes || '');

      setPreviousWorkLocation(recordToEdit.previousWorkLocation || '');
      setNewWorkLocation(recordToEdit.newWorkLocation || recordToEdit.workLocation || '');
      setPreviousDepartment(recordToEdit.previousDepartment || '');
      setNewDepartment(recordToEdit.newDepartment || recordToEdit.department || '');
      setPreviousEntity(recordToEdit.previousEntity || '');
      setNewEntity(recordToEdit.newEntity || '');

      setAssignmentTitle(recordToEdit.assignmentTitle || '');
      setAssignmentType(recordToEdit.assignmentType || 'رئاسة قسم / وحدة');
      setAssignmentRole(recordToEdit.assignmentRole || '');
      setLinkedAssignmentId(recordToEdit.linkedAssignmentId || '');

      setSecondmentEntity(recordToEdit.secondmentEntity || '');
      setSecondmentType(recordToEdit.secondmentType || 'محدد المدة');

      setPreviousJobTitle(recordToEdit.previousJobTitle || '');
      setNewJobTitle(recordToEdit.newJobTitle || recordToEdit.jobTitle || '');

      setCompetencyEvaluation(recordToEdit.competencyEvaluation || 'غير متوفر');
      setEvaluationYear(recordToEdit.evaluationYear ? String(recordToEdit.evaluationYear) : '');
      setEvaluationResult(recordToEdit.evaluationResult || '');
    } else {
      const empId = initialEmployeeId || employees[0]?.id || 1001;
      setSelectedEmpId(empId);
      setActionType(initialActionType);
      const emp = employees.find((e) => e.id === empId);
      if (emp) {
        setPreviousGrade(emp.jobGrade || 'الدرجة السابعة');
        setNewGrade(emp.jobGrade || 'الدرجة السابعة');
        setPreviousIncrement(emp.currentIncrement ?? 0);
        setNewIncrement(emp.currentIncrement ?? 0);
        setSalaryScale(emp.salaryScale || 'جدول المرتبات الموحد');
        setDecisionNumber('');
        setDecisionDate(new Date().toISOString().slice(0, 10));
        setActionDate(new Date().toISOString().slice(0, 10));
        setStartDate(new Date().toISOString().slice(0, 10));
        setEndDate('');
        setEntitlementDate('');
        setIssuingAuthority('وزارة الصحة - ليبيا');
        setReason('');
        setNotes('');

        setPreviousWorkLocation(emp.workLocation || emp.hiringEntity || 'مصرف الدم المركزي المرج');
        setNewWorkLocation(emp.workLocation || emp.hiringEntity || 'مصرف الدم المركزي المرج');
        setPreviousDepartment(emp.department || 'الشؤون الإدارية والخدمات');
        setNewDepartment(emp.department || 'الشؤون الإدارية والخدمات');
        setPreviousEntity(emp.hiringEntity || 'وزارة الصحة');
        setNewEntity(emp.hiringEntity || 'وزارة الصحة');

        setAssignmentTitle('');
        setAssignmentType('رئاسة قسم / وحدة');
        setAssignmentRole('');
        setLinkedAssignmentId('');

        setSecondmentEntity('');
        setSecondmentType('محدد المدة');

        setPreviousJobTitle(emp.jobTitle || '');
        setNewJobTitle(emp.jobTitle || '');

        setCompetencyEvaluation('غير متوفر');
        setEvaluationYear(String(new Date().getFullYear()));
        setEvaluationResult('');

        if (initialActionType === 'علاوة سنوية' || initialActionType === 'علاوة دورية') {
          setNewGrade(emp.jobGrade);
          setNewIncrement(Math.min(15, (emp.currentIncrement || 0) + 1));
        } else if (initialActionType === 'ترقية') {
          const rank = getGeneralNumericalRank(emp.jobGrade);
          if (rank !== null && rank < 15) {
            const nextG = JOB_GRADES[rank] || emp.jobGrade;
            setNewGrade(nextG);
          } else {
            setNewGrade(emp.jobGrade);
          }
          setNewIncrement(1);
        } else if (initialActionType === 'ندب على درجة') {
          setNewGrade(emp.jobGrade);
          setNewIncrement(emp.currentIncrement || 0);
        }
      }
    }
  }, [isOpen, initialEmployeeId, initialActionType, recordToEdit, employees]);

  // Dynamic conflict detection (Jumping grades, effective date before hire date)
  useEffect(() => {
    if (!selectedEmp || !isOpen) return;
    const warns: string[] = [];

    // Check effective date vs hire date
    if (selectedEmp.hireDate && actionDate && actionDate < selectedEmp.hireDate) {
      warns.push('هذا السجل يحتاج إلى مراجعة قبل اعتماده: تاريخ النفاذ والسريان يسبق تاريخ التعيين الأول للموظف (' + formatDateDisplay(selectedEmp.hireDate) + ').');
    }

    // Check dates logic for assignments/secondments
    if (startDate && endDate && endDate < startDate) {
      warns.push('تنبيه منطقي: تاريخ الانتهاء المحدد يسبق تاريخ البدء.');
    }

    // Check grade jump for standard promotion
    if (actionType === 'ترقية') {
      const prevRank = getGeneralNumericalRank(previousGrade);
      const newRank = getGeneralNumericalRank(newGrade);
      if (prevRank !== null && newRank !== null) {
        if (newRank - prevRank > 1) {
          warns.push('هذا السجل يحتاج إلى مراجعة قبل اعتماده: الترقية تتجاوز درجة واحدة مباشرة دون قرار ترقية استثنائية.');
        } else if (newRank < prevRank) {
          warns.push('هذا السجل يحتاج إلى مراجعة قبل اعتماده: الدرجة الجديدة أدنى من الدرجة السابقة المسجلة.');
        }
      }
    }

    setWarnings(warns);
  }, [selectedEmp, actionType, previousGrade, newGrade, actionDate, startDate, endDate, isOpen]);

  if (!isOpen || !selectedEmp) return null;

  const currentMeta = getCareerActionMeta(actionType);

  const handleEmpChange = (empId: number) => {
    setSelectedEmpId(empId);
    const emp = employees.find((e) => e.id === empId);
    if (!emp) return;

    setPreviousGrade(emp.jobGrade);
    setPreviousIncrement(emp.currentIncrement || 0);
    setPreviousWorkLocation(emp.workLocation || emp.hiringEntity || 'مصرف الدم المركزي المرج');
    setPreviousDepartment(emp.department || '');
    setPreviousJobTitle(emp.jobTitle || '');

    if (actionType === 'علاوة سنوية' || actionType === 'علاوة دورية') {
      setNewGrade(emp.jobGrade);
      setNewIncrement(Math.min(15, (emp.currentIncrement || 0) + 1));
    } else if (actionType === 'ترقية') {
      const rank = getGeneralNumericalRank(emp.jobGrade);
      if (rank !== null && rank < 15) {
        setNewGrade(JOB_GRADES[rank] || emp.jobGrade);
      } else {
        setNewGrade(emp.jobGrade);
      }
      setNewIncrement(1);
    } else {
      setNewGrade(emp.jobGrade);
      setNewIncrement(emp.currentIncrement || 0);
    }
  };

  const handleActionTypeChange = (type: CareerActionType) => {
    setActionType(type);
    if (type === 'علاوة سنوية' || type === 'علاوة دورية') {
      setNewGrade(previousGrade || selectedEmp.jobGrade);
      setNewIncrement(Math.min(15, (previousIncrement || selectedEmp.currentIncrement || 0) + 1));
    } else if (type === 'ترقية') {
      const rank = getGeneralNumericalRank(previousGrade || selectedEmp.jobGrade);
      if (rank !== null && rank < 15) {
        setNewGrade(JOB_GRADES[rank] || selectedEmp.jobGrade);
      }
      setNewIncrement(1);
    } else {
      // Non-grade movements default to retaining current grade
      setNewGrade(previousGrade || selectedEmp.jobGrade);
      setNewIncrement(previousIncrement ?? selectedEmp.currentIncrement ?? 0);
    }
  };

  const validateForm = (): boolean => {
    const errs: string[] = [];

    if (!selectedEmpId) {
      errs.push('يرجى اختيار الموظف المعني.');
    }

    if (!actionDate || actionDate.trim() === '') {
      errs.push('تاريخ النفاذ والسريان إلزامي ولا يمكن تركه فارغاً.');
    }

    if (!decisionNumber.trim()) {
      errs.push('رقم القرار إلزامي لتوثيق القرارات والإجراءات الرسمية.');
    }

    if (!issuingAuthority.trim()) {
      errs.push('الجهة المصدرة للقرار إلزامية لتوثيق السجل الوظيفي.');
    }

    // Specific validation based on action category
    if (isGradeAffecting) {
      if (!newGrade || !isValidJobGrade(newGrade)) {
        errs.push('الدرجة الجديدة إلزامية ويجب اختيارها من قائمة الدرجات الرسمية المعتمدة.');
      }
      if (newIncrement === undefined || isNaN(newIncrement) || newIncrement < 0) {
        errs.push('عدد العلاوات يجب أن يكون رقماً صحيحاً غير سالب (0 فما فوق).');
      }
    }

    if (actionType === 'تكليف') {
      if (!assignmentTitle.trim()) {
        errs.push('مسمى التكليف إلزامي عند تسجيل حركة تكليف.');
      }
      if (startDate && endDate && endDate < startDate) {
        errs.push('تاريخ انتهاء التكليف لا يمكن أن يسبق تاريخ البدء.');
      }
    }

    if (actionType === 'إنهاء تكليف') {
      if (!assignmentTitle.trim() && !reason.trim()) {
        errs.push('يرجى تحديد مسمى التكليف المنتهي أو كتابة وصف التكليف.');
      }
    }

    if (actionType === 'نقل' || actionType === 'تغيير مكان العمل') {
      if (!newWorkLocation.trim() && !newDepartment.trim()) {
        errs.push('يرجى تحديد مكان العمل الجديد أو الإدارة الجديدة على الأقل.');
      }
    }

    if (actionType === 'ندب' || actionType === 'إعارة / نقل خارجي') {
      if (!secondmentEntity.trim()) {
        errs.push('جهة الندب أو الإعارة إلزامية.');
      }
      if (startDate && endDate && endDate < startDate) {
        errs.push('تاريخ انتهاء الندب لا يمكن أن يسبق تاريخ البدء.');
      }
    }

    if (actionType === 'تغيير المسمى الوظيفي') {
      if (!newJobTitle.trim()) {
        errs.push('المسمى الوظيفي الجديد إلزامي.');
      }
    }

    setErrors(errs);
    return errs.length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    if (recordToEdit && !showConfirmEdit) {
      setShowConfirmEdit(true);
      return;
    }

    const todayStr = new Date().toISOString().slice(0, 10);
    const sanitizedIncrement = sanitizeAllowancesCount(newIncrement);

    const record: CareerPromotionRecord = {
      id: recordToEdit?.id || `CAR-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`,
      employeeId: selectedEmp.id,
      fileNumber: selectedEmp.jobNumber,
      employeeName: selectedEmp.fullName,
      actionType,
      movementType: actionType,
      previousGrade: previousGrade || selectedEmp.jobGrade,
      previousIncrement: previousIncrement,
      previousIncrementCount: previousIncrement,
      newGrade: newGrade || previousGrade || selectedEmp.jobGrade,
      newIncrement: sanitizedIncrement,
      newIncrementCount: sanitizedIncrement,
      salaryScale: salaryScale.trim() || 'جدول المرتبات الموحد',
      actionDate: actionDate || todayStr,
      effectiveDate: actionDate || todayStr,
      startDate: startDate || actionDate || todayStr,
      endDate: endDate || undefined,
      decisionDate: decisionDate || todayStr,
      decisionIssueDate: decisionDate || todayStr,
      entitlementDate: entitlementDate || undefined,
      decisionNumber: decisionNumber.trim(),
      issuingAuthority: issuingAuthority.trim() || 'وزارة الصحة - ليبيا',
      
      // Work Location & Transfer details
      previousWorkLocation: previousWorkLocation.trim() || undefined,
      newWorkLocation: newWorkLocation.trim() || undefined,
      workLocation: newWorkLocation.trim() || undefined,
      previousDepartment: previousDepartment.trim() || undefined,
      newDepartment: newDepartment.trim() || undefined,
      department: newDepartment.trim() || undefined,
      previousEntity: previousEntity.trim() || undefined,
      newEntity: newEntity.trim() || undefined,

      // Assignment details
      assignmentTitle: assignmentTitle.trim() || undefined,
      assignmentType: assignmentType.trim() || undefined,
      assignmentRole: assignmentRole.trim() || undefined,
      linkedAssignmentId: linkedAssignmentId.trim() || undefined,

      // Secondment details
      secondmentEntity: secondmentEntity.trim() || undefined,
      secondmentType: secondmentType.trim() || undefined,

      // Job title details
      previousJobTitle: previousJobTitle.trim() || undefined,
      newJobTitle: newJobTitle.trim() || undefined,
      jobTitle: newJobTitle.trim() || undefined,

      reason: reason.trim() || undefined,
      competencyEvaluation: competencyEvaluation !== 'غير متوفر' ? competencyEvaluation : undefined,
      evaluationYear: evaluationYear ? parseInt(evaluationYear, 10) : undefined,
      evaluationResult: evaluationResult.trim() || undefined,
      notes: notes.trim(),
      createdBy: recordToEdit?.createdBy || currentUser,
      createdAt: recordToEdit?.createdAt || new Date().toISOString().replace('T', ' ').slice(0, 19),
      updatedBy: recordToEdit ? currentUser : undefined,
      updatedAt: recordToEdit ? new Date().toISOString().replace('T', ' ').slice(0, 19) : undefined
    };

    onSubmit(record);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto" dir="rtl">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full border border-gray-200 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* TOP MODAL HEADER */}
        <div className={`p-4 sm:p-5 text-white flex justify-between items-center shrink-0 ${
          actionType === 'ترقية' ? 'bg-gradient-to-r from-red-900 via-red-800 to-rose-950' :
          actionType === 'علاوة سنوية' || actionType === 'علاوة دورية' ? 'bg-gradient-to-r from-blue-900 via-blue-800 to-slate-900' :
          actionType === 'ترقية استثنائية' ? 'bg-gradient-to-r from-amber-800 via-amber-700 to-orange-950' :
          actionType === 'ندب على درجة' ? 'bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-950' :
          'bg-gradient-to-r from-slate-900 via-purple-900 to-slate-950'
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
              <Award className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold bg-white/20 text-white px-2 py-0.5 rounded">
                  {recordToEdit ? 'تعديل حركة وظيفية مسجلة' : 'إضافة حركة وظيفية جديدة'}
                </span>
                <span className="text-[10px] font-mono text-amber-300">
                  {recordToEdit?.id ? `ID: ${recordToEdit.id}` : 'سجل ديناميكي جديد'}
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-black mt-0.5">
                {recordToEdit ? `تعديل إجراء: ${actionType}` : `تسجيل حركة وظيفية: ${actionType}`}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* PROMINENT EMPLOYEE IDENTITY BANNER (MANDATORY REQUIREMENT 14) */}
        <div className="bg-slate-100 border-b border-slate-200 px-5 py-3 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-slate-800 text-white font-bold flex items-center justify-center text-xs shrink-0">
              {selectedEmp.fullName.slice(0, 2)}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-slate-950 truncate">
                  {selectedEmp.fullName}
                </span>
                <span className="text-[11px] font-mono font-black text-red-900 bg-red-100 px-2 py-0.5 rounded border border-red-200">
                  رقم الملف: {selectedEmp.jobNumber}
                </span>
              </div>
              <p className="text-[10px] text-slate-500 truncate">
                {selectedEmp.jobTitle} • {selectedEmp.department} • الدرجة المسجلة: {selectedEmp.jobGrade} (علاوة {selectedEmp.currentIncrement || 0})
              </p>
            </div>
          </div>

          {!recordToEdit && (
            <div className="w-full sm:w-auto">
              <select
                value={selectedEmpId}
                onChange={(e) => handleEmpChange(Number(e.target.value))}
                className="w-full sm:w-64 p-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-800"
              >
                {employees.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.fullName} ({e.jobNumber}) - {e.jobGrade}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* FORM CONTENT */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto text-xs scrollbar-thin">
          
          {/* Validation Errors Alert */}
          {errors.length > 0 && (
            <div className="bg-red-50 border-r-4 border-red-600 p-3 rounded-xl text-red-900 space-y-1 animate-fadeIn">
              <div className="flex items-center gap-1.5 font-black text-xs">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <span>يرجى تصحيح الأخطاء التالية قبل الاعتماد:</span>
              </div>
              <ul className="list-disc list-inside text-[11px] pr-2 space-y-0.5">
                {errors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Conflict Detection Warnings Alert */}
          {warnings.length > 0 && (
            <div className="bg-amber-50 border-r-4 border-amber-500 p-3 rounded-xl text-amber-950 space-y-1 animate-fadeIn">
              <div className="flex items-center gap-1.5 font-black text-xs text-amber-900">
                <ShieldAlert className="w-4 h-4 text-amber-600" />
                <span>تنبيه تدقيق وتعارض البيانات:</span>
              </div>
              <ul className="list-disc list-inside text-[11px] pr-2 space-y-0.5 text-amber-900">
                {warnings.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
              <p className="text-[10px] text-amber-800 font-bold mt-1">
                تنبيه: يمكنك الحفظ إذا كان القرار معتمداً رسمياً بالفعل، وسيتم إدراجه في سجل التدقيق.
              </p>
            </div>
          )}

          {/* 1. MOVEMENT TYPE SELECTOR */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-black text-slate-900 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-700"></span>
                <span>نوع الحركة الوظيفية *</span>
              </label>
              <span className="text-[10px] text-slate-500">
                اختر نوع الحركة لتطبيق القواعد الإدارية والمالية المناسبة
              </span>
            </div>

            {/* Category Filter Tabs */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 border-b border-slate-200">
              {CAREER_ACTION_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold whitespace-nowrap transition cursor-pointer ${
                    selectedCategory === cat.id
                      ? 'bg-slate-800 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            {/* Movement Type Buttons Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1.5 pt-1">
              {CAREER_ACTION_TYPES_CONFIG
                .filter(cfg => selectedCategory === 'all' || cfg.category === selectedCategory)
                .map((cfg) => {
                  const isSelected = actionType === cfg.type;
                  return (
                    <button
                      key={cfg.type}
                      type="button"
                      onClick={() => handleActionTypeChange(cfg.type)}
                      className={`py-2 px-2.5 rounded-lg border text-right font-bold transition flex flex-col justify-center cursor-pointer ${
                        isSelected 
                          ? 'bg-slate-900 text-white border-slate-900 shadow-xs' 
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <span className="text-[11px] font-black truncate">{cfg.type}</span>
                      <span className={`text-[9px] ${isSelected ? 'text-slate-300' : 'text-slate-400'}`}>
                        {cfg.isGradeChanging ? 'يؤثر على الدرجة' : 'حركة إدارية / تنظيمية'}
                      </span>
                    </button>
                  );
                })}
            </div>
            <div className="flex items-center justify-between text-[10px] bg-slate-50 p-2 rounded-lg border border-slate-200">
              <span className="text-slate-600 font-bold">{currentMeta.description}</span>
              <span className="px-2 py-0.5 rounded text-[9px] font-black bg-white border border-slate-200 text-slate-700">
                التصنيف: {currentActionConfig.category === 'promotions' ? 'ترقيات وعلاوات' : currentActionConfig.category === 'assignments' ? 'تكليفات ومهام' : currentActionConfig.category === 'transfers' ? 'نقل ومواقع عمل' : 'مسميات وإجراءات'}
              </span>
            </div>
          </div>

          {/* 2. OFFICIAL DECISION INFORMATION */}
          <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center gap-2 border-b border-slate-200 pb-1.5 text-slate-900 font-bold text-xs">
              <FileText className="w-4 h-4 text-slate-700" />
              <span>بيانات القرار الرسمي المعتمد</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Decision Number */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  رقم القرار <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: ق/2024/18 أو 45/2023"
                  value={decisionNumber}
                  onChange={(e) => setDecisionNumber(e.target.value)}
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg font-bold text-slate-900 font-mono text-xs focus:ring-2 focus:ring-red-600"
                />
              </div>

              {/* Decision Issue Date */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">تاريخ صدور القرار</label>
                <input
                  type="date"
                  value={decisionDate}
                  onChange={(e) => setDecisionDate(e.target.value)}
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg font-bold text-slate-900 text-xs"
                />
              </div>

              {/* Effective Date (Action Date) */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  تاريخ النفاذ / السريان <span className="text-red-600">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={actionDate}
                  onChange={(e) => {
                    setActionDate(e.target.value);
                    if (!startDate || startDate === actionDate) {
                      setStartDate(e.target.value);
                    }
                  }}
                  className="w-full p-2 bg-white border border-red-300 rounded-lg font-bold text-red-950 text-xs focus:ring-2 focus:ring-red-600"
                />
                <span className="text-[9px] text-slate-500 mt-0.5 block">
                  التاريخ الحاكم لتسلسل السجل في الخط الزمني الوظيفي
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Entitlement Date */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">تاريخ الاستحقاق (إن وجد)</label>
                <input
                  type="date"
                  value={entitlementDate}
                  onChange={(e) => setEntitlementDate(e.target.value)}
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg font-bold text-slate-900 text-xs"
                />
              </div>

              {/* Issuing Authority */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  الجهة المصدرة للقرار <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: وزارة الصحة، مصرف الدم المركزي..."
                  value={issuingAuthority}
                  onChange={(e) => setIssuingAuthority(e.target.value)}
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg font-bold text-slate-900 text-xs"
                />
                <div className="flex flex-wrap gap-1 mt-1">
                  {[
                    'وزارة الصحة - ليبيا',
                    'مصرف الدم المركزي المرج',
                    'مجلس الوزراء الليبي',
                    'وزارة الخدمة المدنية'
                  ].map((sug) => (
                    <button
                      key={sug}
                      type="button"
                      onClick={() => setIssuingAuthority(sug)}
                      className="text-[9px] bg-slate-200 hover:bg-slate-300 text-slate-800 px-1.5 py-0.5 rounded cursor-pointer"
                    >
                      {sug}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 3. CONDITIONAL MODULE: ASSIGNMENT DETAILS (FOR تكليف OR إنهاء تكليف) */}
          {isAssignmentAction && (
            <div className="bg-indigo-50/60 p-3.5 rounded-xl border border-indigo-200 space-y-3">
              <div className="flex items-center justify-between border-b border-indigo-200 pb-1.5 text-indigo-950 font-bold text-xs">
                <div className="flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-indigo-700" />
                  <span>بيانات التكليف والمهام الإدارية</span>
                </div>
                <span className="text-[10px] bg-indigo-100 text-indigo-800 font-black px-2 py-0.5 rounded">
                  {actionType === 'تكليف' ? 'تسجيل تكليف جديد' : 'إنهاء تكليف قائم'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Assignment Title */}
                <div>
                  <label className="block font-bold text-indigo-950 mb-1">
                    مسمى التكليف / المهمة <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: رئيس قسم المختبرات، منسق الجودة..."
                    value={assignmentTitle}
                    onChange={(e) => setAssignmentTitle(e.target.value)}
                    className="w-full p-2 bg-white border border-indigo-300 rounded-lg font-bold text-slate-900 text-xs focus:ring-2 focus:ring-indigo-600"
                  />
                  <div className="flex flex-wrap gap-1 mt-1">
                    {['رئيس قسم المختبرات', 'منسق الجودة وسلامة المرضى', 'رئيس وحدة الصرف', 'عضو لجنة المشتريات'].map(s => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setAssignmentTitle(s)}
                        className="text-[9px] bg-indigo-100 hover:bg-indigo-200 text-indigo-900 px-1.5 py-0.5 rounded cursor-pointer"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Assignment Type */}
                <div>
                  <label className="block font-bold text-indigo-950 mb-1">طبيعة / نوع التكليف</label>
                  <select
                    value={assignmentType}
                    onChange={(e) => setAssignmentType(e.target.value)}
                    className="w-full p-2 bg-white border border-indigo-300 rounded-lg font-bold text-slate-900 text-xs"
                  >
                    <option value="رئاسة قسم / وحدة">رئاسة قسم / وحدة</option>
                    <option value="إشرافي وإداري">إشرافي وإداري</option>
                    <option value="فني وتخصصي">فني وتخصصي</option>
                    <option value="عضوية لجنة">عضوية لجنة</option>
                    <option value="منسق مهام">منسق مهام</option>
                    <option value="أخرى">أخرى</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Start Date */}
                <div>
                  <label className="block font-bold text-indigo-950 mb-1">تاريخ بدء التكليف</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full p-2 bg-white border border-indigo-300 rounded-lg font-bold text-slate-900 text-xs"
                  />
                </div>

                {/* End Date */}
                <div>
                  <label className="block font-bold text-indigo-950 mb-1">
                    {actionType === 'إنهاء تكليف' ? 'تاريخ انتهاء / إلغاء التكليف' : 'تاريخ الانتهاء المحدد (اختياري)'}
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full p-2 bg-white border border-indigo-300 rounded-lg font-bold text-slate-900 text-xs"
                  />
                </div>
              </div>

              {/* Assignment Role / Duties */}
              <div>
                <label className="block font-bold text-indigo-950 mb-1">المهام والاختصاصات الموكلة بالتكليف</label>
                <input
                  type="text"
                  placeholder="مثال: الإشراف الفني والإداري على فريق العمل وتقارير الفحص المخبري..."
                  value={assignmentRole}
                  onChange={(e) => setAssignmentRole(e.target.value)}
                  className="w-full p-2 bg-white border border-indigo-200 rounded-lg text-xs"
                />
              </div>

              <div className="flex items-center gap-1.5 p-2 bg-indigo-100/70 border border-indigo-200 rounded-lg text-[10px] text-indigo-950 font-bold">
                <Info className="w-3.5 h-3.5 text-indigo-700 shrink-0" />
                <span>التكليف إجراء تنظيمي مستقل لا يغير الدرجة الوظيفية للموظف أو تاريخ استحقاقها المالي.</span>
              </div>
            </div>
          )}

          {/* 4. CONDITIONAL MODULE: WORK LOCATION & TRANSFER (FOR نقل OR تغيير مكان العمل) */}
          {isTransferOrLocationAction && (
            <div className="bg-emerald-50/60 p-3.5 rounded-xl border border-emerald-200 space-y-3">
              <div className="flex items-center justify-between border-b border-emerald-200 pb-1.5 text-emerald-950 font-bold text-xs">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-emerald-700" />
                  <span>بيانات مقر العمل والتنقل الإداري</span>
                </div>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-black px-2 py-0.5 rounded">
                  {actionType === 'نقل' ? 'نقل إداري' : 'تغيير موقع العمل'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Previous Location */}
                <div>
                  <label className="block font-bold text-emerald-950 mb-1">مكان العمل السابق</label>
                  <input
                    type="text"
                    value={previousWorkLocation}
                    onChange={(e) => setPreviousWorkLocation(e.target.value)}
                    placeholder="مثال: المقر الرئيسي - المرج"
                    className="w-full p-2 bg-white border border-emerald-300 rounded-lg font-bold text-slate-800 text-xs"
                  />
                </div>

                {/* New Location */}
                <div>
                  <label className="block font-bold text-emerald-950 mb-1">
                    مكان العمل الجديد المعتمد <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newWorkLocation}
                    onChange={(e) => setNewWorkLocation(e.target.value)}
                    placeholder="مثال: مصرف الدم المركزي المرج، فرع البيضاء..."
                    className="w-full p-2 bg-white border border-emerald-400 rounded-lg font-bold text-slate-900 text-xs focus:ring-2 focus:ring-emerald-600"
                  />
                  <div className="flex flex-wrap gap-1 mt-1">
                    {[
                      'مصرف الدم المركزي المرج',
                      'مستشفى المرج التعليمي',
                      'عيادة المرج المركزية',
                      'فرع بنغازي',
                      'الإدارة العامة - طرابلس'
                    ].map(sug => (
                      <button
                        key={sug}
                        type="button"
                        onClick={() => setNewWorkLocation(sug)}
                        className="text-[9px] bg-emerald-100 hover:bg-emerald-200 text-emerald-900 px-1.5 py-0.5 rounded cursor-pointer"
                      >
                        {sug}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Previous Department */}
                <div>
                  <label className="block font-bold text-emerald-950 mb-1">الإدارة / القسم السابق</label>
                  <input
                    type="text"
                    value={previousDepartment}
                    onChange={(e) => setPreviousDepartment(e.target.value)}
                    placeholder="مثال: الشؤون الإدارية والخدمات"
                    className="w-full p-2 bg-white border border-emerald-200 rounded-lg text-xs"
                  />
                </div>

                {/* New Department */}
                <div>
                  <label className="block font-bold text-emerald-950 mb-1">الإدارة / القسم الجديد</label>
                  <input
                    type="text"
                    value={newDepartment}
                    onChange={(e) => setNewDepartment(e.target.value)}
                    placeholder="مثال: إدارة المختبرات وبنوك الدم"
                    className="w-full p-2 bg-white border border-emerald-200 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center gap-1.5 p-2 bg-emerald-100/70 border border-emerald-200 rounded-lg text-[10px] text-emerald-950 font-bold">
                <Info className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                <span>سيتم تحديث مقر العمل الحالي للموظف تلقائياً وفق أحدث تاريخ سريان مسجل.</span>
              </div>
            </div>
          )}

          {/* 5. CONDITIONAL MODULE: SECONDMENT (FOR ندب OR انتهاء الندب OR العودة من الندب) */}
          {isSecondmentAction && (
            <div className="bg-amber-50/60 p-3.5 rounded-xl border border-amber-200 space-y-3">
              <div className="flex items-center justify-between border-b border-amber-200 pb-1.5 text-amber-950 font-bold text-xs">
                <div className="flex items-center gap-2">
                  <ArrowRightLeft className="w-4 h-4 text-amber-700" />
                  <span>بيانات الندب والإعارة</span>
                </div>
                <span className="text-[10px] bg-amber-100 text-amber-800 font-black px-2 py-0.5 rounded">
                  {actionType}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Secondment Entity */}
                <div>
                  <label className="block font-bold text-amber-950 mb-1">
                    جهة الندب / الإعارة <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={secondmentEntity}
                    onChange={(e) => setSecondmentEntity(e.target.value)}
                    placeholder="مثال: وزارة الحكم المحلي، مستشفى الثورة التعليمي..."
                    className="w-full p-2 bg-white border border-amber-300 rounded-lg font-bold text-slate-900 text-xs focus:ring-2 focus:ring-amber-600"
                  />
                </div>

                {/* Secondment Type */}
                <div>
                  <label className="block font-bold text-amber-950 mb-1">نوع الندب / الإعارة</label>
                  <select
                    value={secondmentType}
                    onChange={(e) => setSecondmentType(e.target.value)}
                    className="w-full p-2 bg-white border border-amber-300 rounded-lg font-bold text-slate-900 text-xs"
                  >
                    <option value="محدد المدة">محدد المدة (سنة قابلة للتجديد)</option>
                    <option value="مفتوح / مستمر">مفتوح / غير محدد المدة</option>
                    <option value="تمديد ندب">تمديد ندب سابق</option>
                    <option value="إعارة خارجية">إعارة خارجية</option>
                    <option value="إنهاء ندب وعودة">إنهاء ندب وعودة للعمل الأصلي</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Start Date */}
                <div>
                  <label className="block font-bold text-amber-950 mb-1">تاريخ بدء الندب</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full p-2 bg-white border border-amber-300 rounded-lg font-bold text-slate-900 text-xs"
                  />
                </div>

                {/* End Date */}
                <div>
                  <label className="block font-bold text-amber-950 mb-1">تاريخ انتهاء الندب</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full p-2 bg-white border border-amber-300 rounded-lg font-bold text-slate-900 text-xs"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 6. CONDITIONAL MODULE: JOB TITLE CHANGE */}
          {isJobTitleAction && (
            <div className="bg-purple-50/60 p-3.5 rounded-xl border border-purple-200 space-y-3">
              <div className="flex items-center justify-between border-b border-purple-200 pb-1.5 text-purple-950 font-bold text-xs">
                <div className="flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-purple-700" />
                  <span>تغيير المسمى الوظيفي المعتمد</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Previous Job Title */}
                <div>
                  <label className="block font-bold text-purple-950 mb-1">المسمى الوظيفي السابق</label>
                  <input
                    type="text"
                    value={previousJobTitle}
                    onChange={(e) => setPreviousJobTitle(e.target.value)}
                    placeholder="مثال: فني مختبرات"
                    className="w-full p-2 bg-white border border-purple-200 rounded-lg font-bold text-slate-800 text-xs"
                  />
                </div>

                {/* New Job Title */}
                <div>
                  <label className="block font-bold text-purple-950 mb-1">
                    المسمى الوظيفي الجديد <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newJobTitle}
                    onChange={(e) => setNewJobTitle(e.target.value)}
                    placeholder="مثال: أخصائي مختبرات طبية أول"
                    className="w-full p-2 bg-white border border-purple-300 rounded-lg font-bold text-slate-900 text-xs focus:ring-2 focus:ring-purple-600"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 7. GRADE & INCREMENT INFORMATION (ADAPTIVE BASED ON ACTION TYPE) */}
          {isGradeAffecting || isIncrementOnly ? (
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 pb-1.5 text-slate-900 font-bold text-xs">
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-700" />
                  <span>بيانات الدرجة والعلاوات والجدول المالي</span>
                </div>
                {isGradeAffecting && (
                  <span className="text-[10px] bg-red-100 text-red-800 px-2 py-0.5 rounded font-black border border-red-200">
                    إجراء مرقي للدرجة
                  </span>
                )}
                {isIncrementOnly && (
                  <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-black border border-blue-200">
                    علاوة سنوية دورية
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                {/* Previous Grade */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">الدرجة السابقة</label>
                  <select
                    value={previousGrade}
                    onChange={(e) => setPreviousGrade(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-bold text-slate-700 text-xs"
                  >
                    <option value="">— غير محددة —</option>
                    {JOB_GRADES.map((g) => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>

                {/* New Grade */}
                <div>
                  <label className="block font-bold text-slate-900 mb-1">
                    الدرجة المعتمدة <span className="text-red-600">*</span>
                  </label>
                  <select
                    required
                    value={newGrade}
                    onChange={(e) => setNewGrade(e.target.value)}
                    className="w-full p-2 bg-white border border-red-300 rounded-lg font-black text-red-950 text-xs focus:ring-2 focus:ring-red-600"
                  >
                    {JOB_GRADES.map((g) => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>

                {/* Previous Increment Count */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">عدد العلاوات السابقة</label>
                  <input
                    type="number"
                    min={0}
                    max={25}
                    value={previousIncrement}
                    onChange={(e) => setPreviousIncrement(Math.max(0, parseInt(e.target.value, 10) || 0))}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-bold text-slate-700 font-mono text-xs"
                  />
                </div>

                {/* New Increment Count */}
                <div>
                  <label className="block font-bold text-slate-900 mb-1">
                    عدد العلاوات الجديدة <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={25}
                    required
                    value={newIncrement}
                    onChange={(e) => setNewIncrement(Math.max(0, parseInt(e.target.value, 10) || 0))}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg font-black text-blue-950 font-mono text-xs focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              {/* Salary Scale */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">جدول المرتبات المالي المعتمد</label>
                <select
                  value={salaryScale}
                  onChange={(e) => setSalaryScale(e.target.value)}
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg font-bold text-slate-800 text-xs"
                >
                  <option value="جدول المرتبات الموحد">جدول المرتبات الموحد</option>
                  <option value="جدول مرتبات القانون 15">جدول مرتبات القانون 15</option>
                  <option value="اللائحة 418 – العناصر الطبية">اللائحة 418 – العناصر الطبية</option>
                  <option value="كادر مالي خاص">كادر مالي خاص</option>
                </select>
              </div>
            </div>
          ) : (
            /* NON-GRADE AFFECTING ACTION: Informational card retaining current grade */
            <div className="p-3 bg-slate-100 rounded-xl border border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-slate-500" />
                <div>
                  <span className="font-bold text-slate-800 text-xs block">
                    الدرجة المالية المسجلة: {newGrade || selectedEmp.jobGrade} (علاوة {newIncrement ?? selectedEmp.currentIncrement ?? 0})
                  </span>
                  <span className="text-[10px] text-slate-500">
                    هذه الحركة إدارية/تنظيمية ولا تغير الدرجة المالية للموظف، وسيتم الاحتفاظ بها في السجل.
                  </span>
                </div>
              </div>
              <span className="text-[10px] font-bold bg-white text-slate-600 px-2 py-1 rounded border border-slate-200">
                درجة ثابتة
              </span>
            </div>
          )}

          {/* 4. COMPETENCY REPORT (OPTIONAL) */}
          <div className="bg-slate-50/60 p-3.5 rounded-xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-xs">
                <FileCheck2 className="w-4 h-4 text-emerald-700" />
                <span>تقرير الكفاءة السنوي المقترن بالإجراء (اختياري)</span>
              </div>
              <span className="text-[10px] text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-bold">
                اختياري
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Evaluation Rating */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">التقدير في التقرير</label>
                <select
                  value={competencyEvaluation}
                  onChange={(e) => setCompetencyEvaluation(e.target.value)}
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg font-bold text-slate-800 text-xs"
                >
                  <option value="غير متوفر">غير متوفر</option>
                  <option value="ممتاز">ممتاز</option>
                  <option value="جيد جداً">جيد جداً</option>
                  <option value="جيد">جيد</option>
                  <option value="متوسط">متوسط</option>
                  <option value="ضعيف">ضعيف</option>
                </select>
              </div>

              {/* Evaluation Year */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">سنة التقييم</label>
                <input
                  type="number"
                  min={1980}
                  max={2035}
                  placeholder="مثال: 2024"
                  value={evaluationYear}
                  onChange={(e) => setEvaluationYear(e.target.value)}
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg font-bold text-slate-800 text-xs"
                />
              </div>

              {/* Evaluation Result / Score */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">النتيجة / النسبة المئوية</label>
                <input
                  type="text"
                  placeholder="مثال: 94% أو ممتاز مرتفع"
                  value={evaluationResult}
                  onChange={(e) => setEvaluationResult(e.target.value)}
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg font-bold text-slate-800 text-xs"
                />
              </div>
            </div>

            {/* MANDATORY GENTLE NOTE (Requirement 3) */}
            <div className="flex items-center gap-1.5 p-2 bg-blue-50/80 border border-blue-200 rounded-lg text-[10px] text-blue-900 font-bold">
              <Info className="w-3.5 h-3.5 text-blue-700 shrink-0" />
              <span>ملاحظة: تقرير الكفاءة اختياري ولا يمنع اعتماد القرار الرسمي للترقية أو الإجراء.</span>
            </div>
          </div>

          {/* 5. REASON & NOTES */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">السبب أو الوصف الإداري</label>
              <input
                type="text"
                placeholder="مثال: استيفاء المدة القانونية، تسوية مؤهل علمي..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">ملاحظات إضافية</label>
              <input
                type="text"
                placeholder="أي إشارات مرجعية أو أرقام ملفات أخرى..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs"
              />
            </div>
          </div>

          {/* Confirmation Warning on Edit */}
          {showConfirmEdit && (
            <div className="bg-amber-50 border border-amber-300 p-3.5 rounded-xl text-amber-900 space-y-2 animate-fadeIn">
              <div className="flex items-center gap-2 font-black">
                <ShieldAlert className="w-5 h-5 text-amber-600" />
                <span>تأكيد تعديل السجل الوظيفي في مكانه:</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                سيتم تحديث هذا السجل الوظيفي مباشرة (دون تكرار السجلات) وإعادة احتساب الدرجة النافذة الحالية وتاريخ استحقاقها للموظف <strong>({selectedEmp.fullName})</strong> تلقائياً وفق التواريخ الزمنية المعتمدة.
              </p>
            </div>
          )}

          {/* ACTIONS FOOTER */}
          <div className="flex justify-between items-center pt-3 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 font-bold hover:bg-slate-50 cursor-pointer"
            >
              إلغاء
            </button>

            <div className="flex items-center gap-2">
              {showConfirmEdit ? (
                <>
                  <button
                    type="button"
                    onClick={() => setShowConfirmEdit(false)}
                    className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl font-bold cursor-pointer"
                  >
                    رجوع
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-amber-700 hover:bg-amber-800 text-white rounded-xl font-black shadow-md cursor-pointer flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    <span>تأكيد وحفظ التعديلات</span>
                  </button>
                </>
              ) : (
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-red-800 hover:bg-red-900 text-white rounded-xl font-black shadow-md cursor-pointer flex items-center gap-2"
                >
                  <Award className="w-4 h-4 text-amber-300" />
                  <span>{recordToEdit ? 'متابعة حفظ التعديل' : 'حفظ وتسجيل الحركة الوظيفية'}</span>
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
