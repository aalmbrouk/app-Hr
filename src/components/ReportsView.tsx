import React, { useState, useMemo, useEffect } from 'react';
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
  CareerPromotionRecord, 
  EmployeeQualificationRecord, 
  GeneralProcedure,
  HrRule,
  SystemSettings
} from '../types';
import { 
  ReportType, 
  EmployeeSelectionMode, 
  FilterCondition, 
  ReportColumnConfig, 
  SortCriteria, 
  GroupByField, 
  SavedReportTemplate 
} from '../types/reportBuilderTypes';
import { 
  REPORT_TYPES, 
  MASTER_COLUMNS, 
  getDefaultColumnsForReport, 
  filterEmployeesForReport, 
  sortReportRows, 
  groupReportRows, 
  exportReportToExcel, 
  exportReportToWord, 
  saveReportTemplate, 
  ExtendedReportRow 
} from '../utils/reportBuilderEngine';
import { FilterConditionRow } from './reports/FilterConditionRow';
import { ColumnReorderList } from './reports/ColumnReorderList';
import { EmployeeSelectorModal } from './reports/EmployeeSelectorModal';
import { SavedReportsModal } from './reports/SavedReportsModal';
import { OfficialReportDocument } from './reports/OfficialReportDocument';
import { exportElementToPdf } from '../utils/pdfExport';
import { 
  FileSpreadsheet, 
  Download, 
  Printer, 
  FileText, 
  Filter, 
  CheckCircle2, 
  Building2, 
  FileDown, 
  Loader2, 
  Bookmark, 
  Sparkles, 
  RotateCcw, 
  Plus, 
  Layers, 
  ArrowUpDown, 
  Eye, 
  Sliders, 
  Users, 
  UserCheck, 
  Award, 
  Briefcase, 
  Calendar, 
  GraduationCap, 
  UserX, 
  Check, 
  TrendingUp, 
  AlertTriangle, 
  FileCode2,
  FileBox,
  ChevronDown,
  Info
} from 'lucide-react';
import { DEPARTMENTS } from '../data/initialData';

interface ReportsViewProps {
  employees: Employee[];
  leaves?: LeaveTransaction[];
  promotions?: PromotionRecord[];
  increments?: IncrementRecord[];
  secondments?: SecondmentRecord[];
  transfers?: TransferRecord[];
  disciplinary?: DisciplinaryRecord[];
  resignations?: ResignationRecord[];
  settlements?: StatusSettlementRecord[];
  careerRecords?: CareerPromotionRecord[];
  qualifications?: EmployeeQualificationRecord[];
  generalProcedures?: GeneralProcedure[];
  hrRules?: HrRule[];
  settings?: SystemSettings;
  officialLogoUrl?: string;
  currentUser?: string;
  onAddAuditLog?: (action: any, details: string, employeeId?: number) => void;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  employees = [],
  leaves = [],
  promotions = [],
  increments = [],
  secondments = [],
  transfers = [],
  disciplinary = [],
  resignations = [],
  settlements = [],
  careerRecords = [],
  qualifications = [],
  generalProcedures = [],
  hrRules = [],
  settings,
  officialLogoUrl,
  currentUser = 'مسؤول الموارد البشرية',
  onAddAuditLog
}) => {
  // ----------------------------------------------------
  // BUILDER STATE
  // ----------------------------------------------------
  const [activeStepTab, setActiveStepTab] = useState<'type' | 'employees' | 'filters' | 'columns' | 'sort' | 'preview'>('filters');
  const [reportType, setReportType] = useState<ReportType>('employees');
  const [customReportTitle, setCustomReportTitle] = useState<string>('');

  // Employee Selection
  const [selectionMode, setSelectionMode] = useState<EmployeeSelectionMode>('all');
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<number[]>([]);
  const [excludedEmployeeIds, setExcludedEmployeeIds] = useState<number[]>([]);
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
  const [employeeModalMode, setEmployeeModalMode] = useState<'include' | 'exclude'>('include');

  // Filter Conditions & Group Logic
  const [filterConditions, setFilterConditions] = useState<FilterCondition[]>([]);
  const [groupLogic, setGroupLogic] = useState<'AND' | 'OR'>('AND');

  // Columns Configuration
  const [columns, setColumns] = useState<ReportColumnConfig[]>(() => {
    const defaultIds = new Set(getDefaultColumnsForReport('employees'));
    return MASTER_COLUMNS.map(c => ({
      ...c,
      selected: defaultIds.has(c.id)
    }));
  });

  // Sorting & Grouping
  const [sortField1, setSortField1] = useState<string>('department');
  const [sortDir1, setSortDir1] = useState<'asc' | 'desc'>('asc');
  const [sortField2, setSortField2] = useState<string>('fullName');
  const [sortDir2, setSortDir2] = useState<'asc' | 'desc'>('asc');
  const [groupBy, setGroupBy] = useState<GroupByField>('none');

  // Modals & Export Status
  const [isSavedModalOpen, setIsSavedModalOpen] = useState(false);
  const [savedModalMode, setSavedModalMode] = useState<'manage' | 'save_prompt'>('manage');
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  // ----------------------------------------------------
  // AUTO UPDATE COLUMNS & FILTERS WHEN REPORT TYPE CHANGES
  // ----------------------------------------------------
  const handleReportTypeChange = (newType: ReportType) => {
    setReportType(newType);
    const defaultColIds = new Set(getDefaultColumnsForReport(newType));
    setColumns(prev => prev.map(c => ({
      ...c,
      selected: defaultColIds.has(c.id)
    })));

    // Set intelligent default filter presets according to type
    if (newType === 'promotion_eligibility') {
      setFilterConditions([
        { id: 'c_status', field: 'status', fieldType: 'select', operator: 'equals', value: 'على رأس العمل', logicOperatorWithNext: 'AND' },
        { id: 'c_inc', field: 'currentIncrement', fieldType: 'number', operator: 'greater_equal', value: 4 }
      ]);
      setGroupBy('department');
    } else if (newType === 'outside_cadre') {
      setFilterConditions([
        { id: 'c_out', field: 'isOutsideCadre', fieldType: 'boolean', operator: 'equals', value: 'نعم' }
      ]);
      setGroupBy('department');
    } else if (newType === 'resignations') {
      setFilterConditions([
        { id: 'c_res', field: 'status', fieldType: 'select', operator: 'equals', value: 'مستقيل' }
      ]);
    } else if (newType === 'end_of_service') {
      setFilterConditions([
        { id: 'c_eos', field: 'status', fieldType: 'select', operator: 'not_equals', value: 'على رأس العمل' }
      ]);
    }
  };

  // ----------------------------------------------------
  // QUICK REPORTS SHORTCUTS
  // ----------------------------------------------------
  const handleApplyQuickReport = (preset: string) => {
    switch (preset) {
      case 'all':
        setReportType('employees');
        setSelectionMode('all');
        setFilterConditions([]);
        setGroupBy('none');
        setColumns(prev => {
          const defaults = new Set(getDefaultColumnsForReport('employees'));
          return prev.map(c => ({ ...c, selected: defaults.has(c.id) }));
        });
        break;

      case 'active':
        setReportType('employees');
        setSelectionMode('criteria');
        setFilterConditions([
          { id: 'q_active', field: 'status', fieldType: 'select', operator: 'equals', value: 'على رأس العمل' }
        ]);
        setGroupBy('department');
        break;

      case 'outside_cadre':
        setReportType('outside_cadre');
        setSelectionMode('criteria');
        setFilterConditions([
          { id: 'q_out', field: 'isOutsideCadre', fieldType: 'boolean', operator: 'equals', value: 'نعم' }
        ]);
        setGroupBy('department');
        break;

      case 'promo_eligible':
        setReportType('promotion_eligibility');
        setSelectionMode('criteria');
        setFilterConditions([
          { id: 'q_p1', field: 'status', fieldType: 'select', operator: 'equals', value: 'على رأس العمل', logicOperatorWithNext: 'AND' },
          { id: 'q_p2', field: 'currentIncrement', fieldType: 'number', operator: 'greater_equal', value: 4 }
        ]);
        setGroupBy('department');
        setColumns(prev => {
          const cols = new Set(['index', 'jobNumber', 'fullName', 'department', 'jobTitle', 'jobGrade', 'currentIncrement', 'gradeEntryDate', 'lastIncrementDate', 'status']);
          return prev.map(c => ({ ...c, selected: cols.has(c.id) }));
        });
        break;

      case 'increments_due':
        setReportType('increments');
        setSelectionMode('criteria');
        setFilterConditions([
          { id: 'q_inc_stat', field: 'status', fieldType: 'select', operator: 'equals', value: 'على رأس العمل' }
        ]);
        setGroupBy('department');
        break;

      case 'year_promotions':
        setReportType('promotions');
        setSelectionMode('criteria');
        setFilterConditions([
          { id: 'q_yr_p', field: 'gradeEntryDate', fieldType: 'date', operator: 'current_year', value: '' }
        ]);
        setGroupBy('department');
        break;

      case 'current_leaves':
        setReportType('leaves');
        setSelectionMode('criteria');
        setFilterConditions([
          { id: 'q_lv_stat', field: 'status', fieldType: 'select', operator: 'equals', value: 'إجازة' }
        ]);
        setGroupBy('department');
        break;

      case 'qualifications':
        setReportType('qualifications');
        setSelectionMode('all');
        setFilterConditions([]);
        setGroupBy('qualification');
        break;

      case 'training':
        setReportType('qualifications');
        setSelectionMode('criteria');
        setFilterConditions([
          { id: 'q_tr', field: 'qualRecordType', fieldType: 'select', operator: 'equals', value: 'دورة تدريبية' }
        ]);
        setGroupBy('department');
        break;

      default:
        break;
    }
  };

  // ----------------------------------------------------
  // EVALUATION & FILTERING ENGINE
  // ----------------------------------------------------
  const filteredRows = useMemo(() => {
    return filterEmployeesForReport(
      employees,
      selectionMode,
      selectedEmployeeIds,
      excludedEmployeeIds,
      filterConditions,
      groupLogic,
      {
        leaves,
        promotions,
        increments,
        secondments,
        transfers,
        disciplinary,
        resignations,
        qualifications,
        generalProcedures
      }
    );
  }, [
    employees,
    selectionMode,
    selectedEmployeeIds,
    excludedEmployeeIds,
    filterConditions,
    groupLogic,
    leaves,
    promotions,
    increments,
    secondments,
    transfers,
    disciplinary,
    resignations,
    qualifications,
    generalProcedures
  ]);

  // Sorting
  const sortedRows = useMemo(() => {
    const sorts: SortCriteria[] = [];
    if (sortField1) sorts.push({ field: sortField1, direction: sortDir1 });
    if (sortField2 && sortField2 !== sortField1) sorts.push({ field: sortField2, direction: sortDir2 });
    return sortReportRows(filteredRows, sorts);
  }, [filteredRows, sortField1, sortDir1, sortField2, sortDir2]);

  // Grouping
  const groupedSections = useMemo(() => {
    return groupReportRows(sortedRows, groupBy);
  }, [sortedRows, groupBy]);

  // Calculated Report Title
  const computedReportTitle = useMemo(() => {
    if (customReportTitle.trim()) return customReportTitle.trim();
    const typeObj = REPORT_TYPES.find(t => t.id === reportType);
    const baseName = typeObj?.label || 'تقرير الموظفين';
    return `${baseName} - مصرف الدم المركزي بلدية المرج`;
  }, [customReportTitle, reportType]);

  // Criteria Summary String
  const criteriaSummaryText = useMemo(() => {
    const parts: string[] = [];

    // Mode
    if (selectionMode === 'specific') {
      parts.push(`موظفون محددون يدوياً (${selectedEmployeeIds.length} موظف)`);
    } else if (selectionMode === 'all_except') {
      parts.push(`جميع الموظفين باستثناء (${excludedEmployeeIds.length} موظف)`);
    }

    // Conditions
    filterConditions.forEach(cond => {
      if (cond.field && cond.value !== undefined && cond.value !== '') {
        const valStr = cond.operator === 'between' 
          ? `بين ${cond.value} و ${cond.secondValue || ''}`
          : String(cond.value);
        parts.push(`${cond.field}: ${cond.operator} [${valStr}]`);
      }
    });

    // Grouping
    if (groupBy !== 'none') {
      parts.push(`مجمع حسب: ${groupBy}`);
    }

    return parts.length > 0 ? parts.join(' | ') : 'كافة السجلات دون قيود إضافية';
  }, [selectionMode, selectedEmployeeIds, excludedEmployeeIds, filterConditions, groupBy]);

  // ----------------------------------------------------
  // FILTER CONDITIONS HANDLERS
  // ----------------------------------------------------
  const handleAddCondition = () => {
    const newCond: FilterCondition = {
      id: `c_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      field: 'department',
      fieldType: 'select',
      operator: 'equals',
      value: DEPARTMENTS[0],
      logicOperatorWithNext: 'AND'
    };
    setFilterConditions(prev => [...prev, newCond]);
  };

  const handleUpdateCondition = (index: number, updated: FilterCondition) => {
    setFilterConditions(prev => prev.map((c, i) => i === index ? updated : c));
  };

  const handleDeleteCondition = (index: number) => {
    setFilterConditions(prev => prev.filter((_, i) => i !== index));
  };

  const handleResetFilters = () => {
    setFilterConditions([]);
    setSelectionMode('all');
    setSelectedEmployeeIds([]);
    setExcludedEmployeeIds([]);
    setGroupBy('none');
  };

  // ----------------------------------------------------
  // TEMPLATES HANDLERS
  // ----------------------------------------------------
  const handleSaveCurrentTemplate = (name: string, description: string) => {
    const activeColIds = columns.filter(c => c.selected).map(c => c.id);
    saveReportTemplate({
      name,
      description,
      reportType,
      employeeSelectionMode: selectionMode,
      selectedEmployeeIds,
      excludedEmployeeIds,
      filterConditions,
      groupLogic,
      selectedColumnIds: activeColIds,
      sortCriteria: [
        { field: sortField1, direction: sortDir1 },
        { field: sortField2, direction: sortDir2 }
      ],
      groupBy
    });

    if (onAddAuditLog) {
      onAddAuditLog('إضافة', `حفظ نموذج تقرير جديد: ${name}`);
    }
  };

  const handleLoadTemplate = (template: SavedReportTemplate) => {
    setReportType(template.reportType);
    setSelectionMode(template.employeeSelectionMode || 'all');
    setSelectedEmployeeIds(template.selectedEmployeeIds || []);
    setExcludedEmployeeIds(template.excludedEmployeeIds || []);
    setFilterConditions(template.filterConditions || []);
    setGroupLogic(template.groupLogic || 'AND');
    setGroupBy(template.groupBy || 'none');

    if (template.sortCriteria && template.sortCriteria[0]) {
      setSortField1(template.sortCriteria[0].field);
      setSortDir1(template.sortCriteria[0].direction);
    }
    if (template.sortCriteria && template.sortCriteria[1]) {
      setSortField2(template.sortCriteria[1].field);
      setSortDir2(template.sortCriteria[1].direction);
    }

    if (template.selectedColumnIds) {
      const idSet = new Set(template.selectedColumnIds);
      setColumns(prev => prev.map(c => ({
        ...c,
        selected: idSet.has(c.id)
      })));
    }

    if (onAddAuditLog) {
      onAddAuditLog('استعلام', `تشغيل نموذج التقرير المحفوظ: ${template.name}`);
    }
  };

  // ----------------------------------------------------
  // EXPORT ACTIONS
  // ----------------------------------------------------
  const handleExportExcel = () => {
    exportReportToExcel(sortedRows, columns, computedReportTitle);
    if (onAddAuditLog) {
      onAddAuditLog('تصدير', `تصدير تقرير (${computedReportTitle}) بصيغة Excel بعدد ${sortedRows.length} سجل`);
    }
  };

  const handleExportWord = () => {
    exportReportToWord(sortedRows, columns, computedReportTitle, criteriaSummaryText);
    if (onAddAuditLog) {
      onAddAuditLog('تصدير', `تصدير تقرير (${computedReportTitle}) بصيغة Word بعدد ${sortedRows.length} سجل`);
    }
  };

  const handleExportPdf = async () => {
    setIsExportingPdf(true);
    setExportSuccess(false);
    const safeTitle = computedReportTitle.replace(/[/\\?%*:|"<>]/g, '_').slice(0, 40);
    const fileName = `${safeTitle}_${Date.now()}`;

    try {
      const success = await exportElementToPdf('OFFICIAL_REPORT_DOCUMENT', fileName, {
        orientation: 'landscape',
        margin: 6,
        scale: 2.2
      });

      if (success) {
        setExportSuccess(true);
        setTimeout(() => setExportSuccess(false), 3000);
        if (onAddAuditLog) {
          onAddAuditLog('تصدير', `تصدير تقرير (${computedReportTitle}) بصيغة PDF بعدد ${sortedRows.length} سجل`);
        }
      }
    } catch (err) {
      console.error('Failed to export PDF:', err);
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handlePrint = () => {
    window.print();
    if (onAddAuditLog) {
      onAddAuditLog('طباعة', `طباعة تقرير (${computedReportTitle}) بعدد ${sortedRows.length} سجل`);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* 1. Top Workspace Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4 print:hidden">
        
        {/* Title & Stats */}
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-red-950 to-red-900 text-red-400 border border-red-800 shadow-md">
            <FileSpreadsheet className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-white tracking-wide">
                مركز التقارير والتصدير
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-red-950/80 text-red-300 border border-red-800">
                Advanced Report Builder
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              بيئة عمل احترافية لبناء وتخصيص التقارير متعددة المعايير وتصديرها بصيغ رسمية
            </p>
          </div>
        </div>

        {/* Live Counter & Primary Actions */}
        <div className="flex flex-wrap items-center gap-2 w-full xl:w-auto justify-end">
          {/* Live Matching Count Badge */}
          <div className="bg-slate-950 border border-slate-700/80 px-3.5 py-2 rounded-2xl flex items-center gap-2 text-xs">
            <span className="text-slate-400 font-medium">عدد الموظفين المطابقين:</span>
            <span className="text-red-400 font-mono font-black text-sm">{sortedRows.length}</span>
            <span className="text-slate-500 font-mono">/ {employees.length}</span>
          </div>

          {/* Save Template Button */}
          <button
            type="button"
            onClick={() => {
              setSavedModalMode('save_prompt');
              setIsSavedModalOpen(true);
            }}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <Bookmark className="w-4 h-4 text-red-400" />
            <span>حفظ النموذج</span>
          </button>

          {/* Saved Templates List Button */}
          <button
            type="button"
            onClick={() => {
              setSavedModalMode('manage');
              setIsSavedModalOpen(true);
            }}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <FileBox className="w-4 h-4 text-amber-400" />
            <span>التقارير المحفوظة</span>
          </button>

          {/* Excel Export Button */}
          <button
            type="button"
            onClick={handleExportExcel}
            className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs shadow-lg transition-all flex items-center gap-1.5 border border-emerald-500 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Excel (.xlsx)</span>
          </button>

          {/* Word Export Button */}
          <button
            type="button"
            onClick={handleExportWord}
            className="px-3.5 py-2 rounded-xl bg-blue-800 hover:bg-blue-700 text-white font-bold text-xs shadow-lg transition-all flex items-center gap-1.5 border border-blue-600 cursor-pointer"
          >
            <FileText className="w-4 h-4 text-blue-200" />
            <span>Word (.doc)</span>
          </button>

          {/* PDF Export Button */}
          <button
            type="button"
            onClick={handleExportPdf}
            disabled={isExportingPdf}
            className={`px-4 py-2 rounded-xl text-white font-bold text-xs shadow-lg transition-all flex items-center gap-1.5 border ${
              exportSuccess
                ? 'bg-emerald-600 border-emerald-400'
                : 'bg-slate-800 hover:bg-slate-700 border-slate-600'
            } disabled:opacity-50 cursor-pointer`}
          >
            {isExportingPdf ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-red-300" />
                <span>جاري إنشاء PDF...</span>
              </>
            ) : exportSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                <span>تم التصدير!</span>
              </>
            ) : (
              <>
                <FileDown className="w-4 h-4 text-red-400" />
                <span>PDF</span>
              </>
            )}
          </button>

          {/* Print Document Button */}
          <button
            type="button"
            onClick={handlePrint}
            className="px-4 py-2 rounded-xl bg-red-700 hover:bg-red-600 text-white font-bold text-xs transition-all flex items-center gap-1.5 border border-red-500 cursor-pointer shadow-lg"
          >
            <Printer className="w-4 h-4" />
            <span>طباعة المستند</span>
          </button>
        </div>

      </div>

      {/* 2. Quick Reports Presets Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 shadow-xl space-y-2 print:hidden">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>التقارير السريعة ونماذج الاختصار (Quick Reports):</span>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <button
            type="button"
            onClick={() => handleApplyQuickReport('all')}
            className="px-3 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-200 border border-slate-800 hover:border-slate-700 transition-all font-bold cursor-pointer"
          >
            جميع الموظفين
          </button>
          <button
            type="button"
            onClick={() => handleApplyQuickReport('active')}
            className="px-3 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-emerald-300 border border-slate-800 hover:border-emerald-800/60 transition-all font-bold cursor-pointer"
          >
            على رأس العمل
          </button>
          <button
            type="button"
            onClick={() => handleApplyQuickReport('outside_cadre')}
            className="px-3 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-amber-300 border border-slate-800 hover:border-amber-800/60 transition-all font-bold cursor-pointer"
          >
            خارج الملاك
          </button>
          <button
            type="button"
            onClick={() => handleApplyQuickReport('promo_eligible')}
            className="px-3 py-1.5 rounded-xl bg-red-950/60 hover:bg-red-900 text-red-300 border border-red-800 transition-all font-bold cursor-pointer flex items-center gap-1"
          >
            <UserCheck className="w-3.5 h-3.5 text-red-400" />
            <span>المستحقون للترقية (4+ علاوات)</span>
          </button>
          <button
            type="button"
            onClick={() => handleApplyQuickReport('increments_due')}
            className="px-3 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-200 border border-slate-800 hover:border-slate-700 transition-all font-bold cursor-pointer"
          >
            العلاوات المستحقة
          </button>
          <button
            type="button"
            onClick={() => handleApplyQuickReport('year_promotions')}
            className="px-3 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-200 border border-slate-800 hover:border-slate-700 transition-all font-bold cursor-pointer"
          >
            الترقيات خلال السنة
          </button>
          <button
            type="button"
            onClick={() => handleApplyQuickReport('current_leaves')}
            className="px-3 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-blue-300 border border-slate-800 hover:border-blue-800/60 transition-all font-bold cursor-pointer"
          >
            الإجازات الحالية
          </button>
          <button
            type="button"
            onClick={() => handleApplyQuickReport('qualifications')}
            className="px-3 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-200 border border-slate-800 hover:border-slate-700 transition-all font-bold cursor-pointer"
          >
            المؤهلات العلمية
          </button>
          <button
            type="button"
            onClick={() => handleApplyQuickReport('training')}
            className="px-3 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-200 border border-slate-800 hover:border-slate-700 transition-all font-bold cursor-pointer"
          >
            الدورات التدريبية
          </button>
        </div>
      </div>

      {/* 3. Step Builder Navigation Tabs */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-3 shadow-xl print:hidden">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-xs font-bold">
          
          <button
            type="button"
            onClick={() => setActiveStepTab('type')}
            className={`p-3 rounded-2xl border transition-all flex flex-col items-center gap-1.5 cursor-pointer ${
              activeStepTab === 'type'
                ? 'bg-red-900/60 border-red-600 text-white shadow-inner'
                : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-slate-800 text-[10px] flex items-center justify-center font-mono">1</span>
              <span>نوع التقرير</span>
            </div>
            <span className="text-[10px] text-slate-400 font-normal truncate max-w-[120px]">
              {REPORT_TYPES.find(t => t.id === reportType)?.label || 'الموظفين'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveStepTab('employees')}
            className={`p-3 rounded-2xl border transition-all flex flex-col items-center gap-1.5 cursor-pointer ${
              activeStepTab === 'employees'
                ? 'bg-red-900/60 border-red-600 text-white shadow-inner'
                : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-slate-800 text-[10px] flex items-center justify-center font-mono">2</span>
              <span>اختيار الموظفين</span>
            </div>
            <span className="text-[10px] text-slate-400 font-normal">
              {selectionMode === 'all' ? 'جميع الموظفين' : selectionMode === 'specific' ? `${selectedEmployeeIds.length} محدد` : 'حسب معايير'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveStepTab('filters')}
            className={`p-3 rounded-2xl border transition-all flex flex-col items-center gap-1.5 cursor-pointer ${
              activeStepTab === 'filters'
                ? 'bg-red-900/60 border-red-600 text-white shadow-inner'
                : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-slate-800 text-[10px] flex items-center justify-center font-mono">3</span>
              <span>معايير التصفية</span>
            </div>
            <span className="text-[10px] text-slate-400 font-normal">
              {filterConditions.length} شروط نشطة
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveStepTab('columns')}
            className={`p-3 rounded-2xl border transition-all flex flex-col items-center gap-1.5 cursor-pointer ${
              activeStepTab === 'columns'
                ? 'bg-red-900/60 border-red-600 text-white shadow-inner'
                : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-slate-800 text-[10px] flex items-center justify-center font-mono">4</span>
              <span>الحقول والأعمدة</span>
            </div>
            <span className="text-[10px] text-slate-400 font-normal">
              {columns.filter(c => c.selected).length} عمود مختار
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveStepTab('sort')}
            className={`p-3 rounded-2xl border transition-all flex flex-col items-center gap-1.5 cursor-pointer ${
              activeStepTab === 'sort'
                ? 'bg-red-900/60 border-red-600 text-white shadow-inner'
                : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-slate-800 text-[10px] flex items-center justify-center font-mono">5</span>
              <span>الترتيب والتجميع</span>
            </div>
            <span className="text-[10px] text-slate-400 font-normal">
              {groupBy === 'none' ? 'بدون تجميع' : `تجميع: ${groupBy}`}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveStepTab('preview')}
            className={`p-3 rounded-2xl border transition-all flex flex-col items-center gap-1.5 cursor-pointer ${
              activeStepTab === 'preview'
                ? 'bg-red-900/60 border-red-600 text-white shadow-inner'
                : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-slate-800 text-[10px] flex items-center justify-center font-mono">6</span>
              <span>المعاينة المباشرة</span>
            </div>
            <span className="text-[10px] text-red-400 font-mono font-bold">
              {sortedRows.length} سجل مطابق
            </span>
          </button>

        </div>
      </div>

      {/* 4. Active Step Content Area */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6 print:hidden">

        {/* STEP 1: REPORT TYPE */}
        {activeStepTab === 'type' && (
          <div className="space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-black text-white">الخطوة 1: اختيار نوع التقرير</h3>
                <p className="text-xs text-slate-400">حدد نوع ومصدر بيانات التقرير المطلوب استخراجه</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {REPORT_TYPES.map(t => {
                const isSelected = reportType === t.id;
                return (
                  <div
                    key={t.id}
                    onClick={() => handleReportTypeChange(t.id)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                      isSelected
                        ? 'bg-red-950/50 border-red-600 text-white shadow-md ring-1 ring-red-500'
                        : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-950'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="font-black text-xs text-white">{t.label}</span>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-red-400 shrink-0" />}
                      </div>
                      <p className="text-[11px] text-slate-400 line-clamp-2">{t.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
              <div className="w-full max-w-md">
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  تعديل عنوان التقرير يدوياً (اختياري):
                </label>
                <input
                  type="text"
                  placeholder="عنوان مخصص للتقرير الرسمي المطبوع..."
                  value={customReportTitle}
                  onChange={e => setCustomReportTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500 font-bold"
                />
              </div>

              <button
                type="button"
                onClick={() => setActiveStepTab('employees')}
                className="px-5 py-2 rounded-xl bg-red-700 hover:bg-red-600 text-white text-xs font-bold transition-all cursor-pointer"
              >
                التالي: اختيار الموظفين ←
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: EMPLOYEE SELECTION */}
        {activeStepTab === 'employees' && (
          <div className="space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-black text-white">الخطوة 2: اختيار نطاق الموظفين</h3>
                <p className="text-xs text-slate-400">تحديد هل يشمل التقرير جميع الموظفين، موظفين محددين، أو مع استثناءات</p>
              </div>
            </div>

            {/* Selection Mode Radios */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <label
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                  selectionMode === 'all'
                    ? 'bg-red-950/40 border-red-600 text-white'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <input
                  type="radio"
                  name="selectionMode"
                  checked={selectionMode === 'all'}
                  onChange={() => setSelectionMode('all')}
                  className="mt-0.5 text-red-600 focus:ring-red-500"
                />
                <div>
                  <span className="font-bold text-white block">جميع الموظفين</span>
                  <span className="text-[11px] text-slate-400">تضمين كافة سجلات الموظفين المسجلين</span>
                </div>
              </label>

              <label
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                  selectionMode === 'specific'
                    ? 'bg-red-950/40 border-red-600 text-white'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <input
                  type="radio"
                  name="selectionMode"
                  checked={selectionMode === 'specific'}
                  onChange={() => {
                    setSelectionMode('specific');
                    setEmployeeModalMode('include');
                    setIsEmployeeModalOpen(true);
                  }}
                  className="mt-0.5 text-red-600 focus:ring-red-500"
                />
                <div>
                  <span className="font-bold text-white block">موظفون محددون</span>
                  <span className="text-[11px] text-slate-400">اختيار يدوي لموظف أو مجموعة موظفين</span>
                </div>
              </label>

              <label
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                  selectionMode === 'criteria'
                    ? 'bg-red-950/40 border-red-600 text-white'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <input
                  type="radio"
                  name="selectionMode"
                  checked={selectionMode === 'criteria'}
                  onChange={() => setSelectionMode('criteria')}
                  className="mt-0.5 text-red-600 focus:ring-red-500"
                />
                <div>
                  <span className="font-bold text-white block">تحديد حسب معايير</span>
                  <span className="text-[11px] text-slate-400">تطبيق شروط وفلاتر متقدمة (الأقسام، الدرجات...)</span>
                </div>
              </label>

              <label
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                  selectionMode === 'all_except'
                    ? 'bg-red-950/40 border-red-600 text-white'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <input
                  type="radio"
                  name="selectionMode"
                  checked={selectionMode === 'all_except'}
                  onChange={() => {
                    setSelectionMode('all_except');
                    setEmployeeModalMode('exclude');
                    setIsEmployeeModalOpen(true);
                  }}
                  className="mt-0.5 text-red-600 focus:ring-red-500"
                />
                <div>
                  <span className="font-bold text-white block">الكل مع استثناء</span>
                  <span className="text-[11px] text-slate-400">تضمين الجميع واستبعاد موظفين محددين</span>
                </div>
              </label>
            </div>

            {/* Manual Selected List Manager */}
            {selectionMode === 'specific' && (
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
                    <UserCheck className="w-4 h-4 text-emerald-400" />
                    <span>قائمة الموظفين المحددين ({selectedEmployeeIds.length} موظف):</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setEmployeeModalMode('include');
                        setIsEmployeeModalOpen(true);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-red-800 hover:bg-red-700 text-white font-bold text-xs transition-all cursor-pointer"
                    >
                      + فتح محدد الموظفين
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedEmployeeIds([])}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-all cursor-pointer"
                    >
                      إزالة الكل
                    </button>
                  </div>
                </div>

                {selectedEmployeeIds.length === 0 ? (
                  <div className="text-center py-6 text-slate-500 text-xs font-medium">
                    لم يتم اختيار أي موظف بعد. اضغط على "+ فتح محدد الموظفين" لاختيار الموظفين بالاسم أو الرقم الوطني.
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-1">
                    {selectedEmployeeIds.map(id => {
                      const emp = employees.find(e => e.id === id);
                      if (!emp) return null;
                      return (
                        <div
                          key={id}
                          className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white flex items-center gap-2"
                        >
                          <span className="font-bold">{emp.fullName}</span>
                          <span className="font-mono text-[10px] text-red-400">#{emp.jobNumber || emp.id}</span>
                          <button
                            type="button"
                            onClick={() => setSelectedEmployeeIds(prev => prev.filter(item => item !== id))}
                            className="text-slate-400 hover:text-red-400 cursor-pointer text-xs"
                          >
                            ×
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Excluded List Manager */}
            {selectionMode === 'all_except' && (
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
                    <UserX className="w-4 h-4 text-amber-400" />
                    <span>الموظفون المستبعدون من التقرير ({excludedEmployeeIds.length} موظف):</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setEmployeeModalMode('exclude');
                      setIsEmployeeModalOpen(true);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-all cursor-pointer"
                  >
                    + تعديل قائمة المستبعدين
                  </button>
                </div>

                {excludedEmployeeIds.length === 0 ? (
                  <div className="text-center py-4 text-slate-500 text-xs">
                    لا يوجد موظفون مستبعدون حالياً.
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-1">
                    {excludedEmployeeIds.map(id => {
                      const emp = employees.find(e => e.id === id);
                      if (!emp) return null;
                      return (
                        <div
                          key={id}
                          className="bg-red-950/40 border border-red-800 rounded-xl px-3 py-1.5 text-xs text-red-200 flex items-center gap-2"
                        >
                          <span>{emp.fullName}</span>
                          <button
                            type="button"
                            onClick={() => setExcludedEmployeeIds(prev => prev.filter(item => item !== id))}
                            className="text-red-400 hover:text-white cursor-pointer"
                          >
                            ×
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            <div className="pt-4 border-t border-slate-800 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setActiveStepTab('filters')}
                className="px-5 py-2 rounded-xl bg-red-700 hover:bg-red-600 text-white text-xs font-bold transition-all cursor-pointer"
              >
                التالي: معايير التصفية ←
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: ADVANCED FILTERS & AND/OR LOGIC */}
        {activeStepTab === 'filters' && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between border-b border-slate-800 pb-3 gap-2">
              <div>
                <h3 className="text-sm font-black text-white">الخطوة 3: معايير التصفية والشروط المتعددة</h3>
                <p className="text-xs text-slate-400">إضافة شروط دقيقة (AND / OR) والبحث بالمدى والتواريخ</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="px-3 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-red-400 border border-slate-800 text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>مسح جميع الفلاتر</span>
                </button>

                <button
                  type="button"
                  onClick={handleAddCondition}
                  className="px-4 py-1.5 rounded-xl bg-red-700 hover:bg-red-600 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-md border border-red-500"
                >
                  <Plus className="w-4 h-4" />
                  <span>إضافة شرط جديد</span>
                </button>
              </div>
            </div>

            {/* Filter Conditions List */}
            {filterConditions.length === 0 ? (
              <div className="bg-slate-950 border border-dashed border-slate-800 rounded-3xl p-8 text-center space-y-3">
                <Filter className="w-10 h-10 mx-auto text-slate-600 opacity-60" />
                <div>
                  <h4 className="text-xs font-bold text-slate-300">لا توجد فلاتر مخصصة مفعلة</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    سيتم استخراج التقرير لجميع الموظفين وفق نطاق الاختيار المحدد
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddCondition}
                  className="px-4 py-2 rounded-xl bg-red-950/80 hover:bg-red-900 text-red-300 border border-red-800 text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>إضافة أول شرط تصفية</span>
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {filterConditions.map((cond, idx) => (
                  <FilterConditionRow
                    key={cond.id}
                    condition={cond}
                    index={idx}
                    isLast={idx === filterConditions.length - 1}
                    onUpdate={updated => handleUpdateCondition(idx, updated)}
                    onDelete={() => handleDeleteCondition(idx)}
                    onAddNext={handleAddCondition}
                  />
                ))}
              </div>
            )}

            {/* Summary & Next */}
            <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
              <div className="text-xs font-bold text-slate-300">
                <span>المطابق للشروط حالياً: </span>
                <span className="text-red-400 font-mono text-sm mr-1">{sortedRows.length}</span>
                <span className="text-slate-500"> موظف</span>
              </div>

              <button
                type="button"
                onClick={() => setActiveStepTab('columns')}
                className="px-5 py-2 rounded-xl bg-red-700 hover:bg-red-600 text-white text-xs font-bold transition-all cursor-pointer"
              >
                التالي: الحقول والأعمدة ←
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: COLUMNS & FIELDS SELECTION */}
        {activeStepTab === 'columns' && (
          <div className="space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-black text-white">الخطوة 4: الحقول التي ستظهر في التقرير وترتيبها</h3>
                <p className="text-xs text-slate-400">حدد الأعمدة المطلوبة واستخدم أسهم الترتيب لتغيير تسلسل ظهورها</p>
              </div>
            </div>

            <ColumnReorderList
              columns={columns}
              onChangeColumns={setColumns}
              onResetDefault={() => {
                const defaults = new Set(getDefaultColumnsForReport(reportType));
                setColumns(MASTER_COLUMNS.map(c => ({ ...c, selected: defaults.has(c.id) })));
              }}
            />

            <div className="pt-4 border-t border-slate-800 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setActiveStepTab('sort')}
                className="px-5 py-2 rounded-xl bg-red-700 hover:bg-red-600 text-white text-xs font-bold transition-all cursor-pointer"
              >
                التالي: الترتيب والتجميع ←
              </button>
            </div>
          </div>
        )}

        {/* STEP 5: SORTING & GROUPING */}
        {activeStepTab === 'sort' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-black text-white">الخطوة 5: ترتيب وتجميع نتائج التقرير</h3>
                <p className="text-xs text-slate-400">تنظيم عرض البيانات حسب الأقسام، المسميات الوظيفية، والترتيب الأبجدي</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              
              {/* Sorting Block */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4">
                <div className="flex items-center gap-2 font-bold text-white border-b border-slate-800 pb-2">
                  <ArrowUpDown className="w-4 h-4 text-red-500" />
                  <span>ترتيب النتائج (Sorting):</span>
                </div>

                {/* Sort Level 1 */}
                <div className="space-y-2">
                  <label className="block text-slate-400 font-medium">الترتيب الأساسي الأول:</label>
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={sortField1}
                      onChange={e => setSortField1(e.target.value)}
                      className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold"
                    >
                      <option value="department">القسم / الإدارة</option>
                      <option value="fullName">اسم الموظف (أبجدي)</option>
                      <option value="jobNumber">الرقم الوظيفي / الملف</option>
                      <option value="jobGrade">الدرجة الحالية</option>
                      <option value="currentIncrement">عدد العلاوات</option>
                      <option value="directingDate">تاريخ المباشرة</option>
                      <option value="hireDate">تاريخ التعيين</option>
                      <option value="status">الوضع الوظيفي</option>
                    </select>

                    <select
                      value={sortDir1}
                      onChange={e => setSortDir1(e.target.value as 'asc' | 'desc')}
                      className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-red-300 font-bold"
                    >
                      <option value="asc">تصاعدي (أ ← ي / الأقدم)</option>
                      <option value="desc">تنازلي (ي ← أ / الأحدث)</option>
                    </select>
                  </div>
                </div>

                {/* Sort Level 2 */}
                <div className="space-y-2 pt-2 border-t border-slate-800/80">
                  <label className="block text-slate-400 font-medium">الترتيب الثانوي الثاني (ثم):</label>
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={sortField2}
                      onChange={e => setSortField2(e.target.value)}
                      className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold"
                    >
                      <option value="fullName">اسم الموظف (أبجدي)</option>
                      <option value="jobNumber">الرقم الوظيفي / الملف</option>
                      <option value="jobGrade">الدرجة الحالية</option>
                      <option value="currentIncrement">عدد العلاوات</option>
                      <option value="directingDate">تاريخ المباشرة</option>
                    </select>

                    <select
                      value={sortDir2}
                      onChange={e => setSortDir2(e.target.value as 'asc' | 'desc')}
                      className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-red-300 font-bold"
                    >
                      <option value="asc">تصاعدي (أ ← ي / الأقدم)</option>
                      <option value="desc">تنازلي (ي ← أ / الأحدث)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Grouping Block */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4">
                <div className="flex items-center gap-2 font-bold text-white border-b border-slate-800 pb-2">
                  <Layers className="w-4 h-4 text-amber-500" />
                  <span>تجميع النتائج في أقسام (Grouping):</span>
                </div>

                <div className="space-y-2">
                  <label className="block text-slate-400 font-medium">تجميع التقرير حسب:</label>
                  <select
                    value={groupBy}
                    onChange={e => setGroupBy(e.target.value as GroupByField)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white font-bold"
                  >
                    <option value="none">بدون تجميع (جدول واحد شامل)</option>
                    <option value="department">القسم / الإدارة (Department)</option>
                    <option value="jobTitle">الوظيفة / المسمى الوظيفي</option>
                    <option value="jobGrade">الدرجة المالية الحالية</option>
                    <option value="status">الوضع الوظيفي</option>
                    <option value="hiringEntity">جهة التعيين</option>
                    <option value="qualification">المؤهل العلمي</option>
                    <option value="assignmentCategory">التصنيف الوظيفي (إداري / طبي)</option>
                  </select>
                </div>

                <div className="p-3.5 bg-slate-900/60 border border-slate-800 rounded-xl text-[11px] text-slate-400 space-y-1">
                  <p className="font-bold text-slate-300">ملاحظة التجميع:</p>
                  <p>عند تفعيل التجميع، يتم تقسيم التقرير الرسمي إلى جداول فرعية لكل قسم أو تصنيف مع إحصائية فرعية.</p>
                </div>
              </div>

            </div>

            <div className="pt-4 border-t border-slate-800 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setActiveStepTab('preview')}
                className="px-5 py-2 rounded-xl bg-red-700 hover:bg-red-600 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-2"
              >
                <Eye className="w-4 h-4" />
                <span>معاينة التقرير النهائي ←</span>
              </button>
            </div>
          </div>
        )}

        {/* STEP 6: PREVIEW & EXPORT WORKSPACE */}
        {activeStepTab === 'preview' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between border-b border-slate-800 pb-3 gap-2">
              <div>
                <h3 className="text-sm font-black text-white">الخطوة 6: ملخص ومعاينة المستند الرسمي</h3>
                <p className="text-xs text-slate-400">معاينة التقرير قبل الطباعة والتصدير</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveStepTab('filters')}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all cursor-pointer"
                >
                  العودة لتعديل الفلاتر
                </button>
                <button
                  type="button"
                  onClick={handlePrint}
                  className="px-4 py-1.5 rounded-xl bg-red-700 hover:bg-red-600 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border border-red-500 shadow-md"
                >
                  <Printer className="w-4 h-4" />
                  <span>طباعة فورية</span>
                </button>
              </div>
            </div>

            {/* Summary Box */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-slate-500 block text-[10px]">نوع التقرير</span>
                <span className="text-white font-black">{REPORT_TYPES.find(t => t.id === reportType)?.label}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">الموظفون المطابقون</span>
                <span className="text-red-400 font-mono font-black text-sm">{sortedRows.length} موظف</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">عدد الأعمدة المختارة</span>
                <span className="text-white font-mono font-bold">{columns.filter(c => c.selected).length} عمود</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">التجميع والترتيب</span>
                <span className="text-slate-300 font-medium truncate block">
                  {groupBy === 'none' ? 'بدون تجميع' : `مجمع حسب ${groupBy}`}
                </span>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* 5. Official Printable Document View Container */}
      <OfficialReportDocument
        reportTitle={computedReportTitle}
        groupedSections={groupedSections}
        totalRowCount={sortedRows.length}
        selectedColumns={columns}
        criteriaSummaryText={criteriaSummaryText}
        generatedBy={currentUser}
        officialLogoUrl={officialLogoUrl || settings?.officialLogoUrl}
        isGrouped={groupBy !== 'none'}
      />

      {/* 6. Employee Multi-Selection Modal */}
      <EmployeeSelectorModal
        isOpen={isEmployeeModalOpen}
        onClose={() => setIsEmployeeModalOpen(false)}
        employees={employees}
        selectedEmployeeIds={employeeModalMode === 'include' ? selectedEmployeeIds : excludedEmployeeIds}
        onApply={newIds => {
          if (employeeModalMode === 'include') {
            setSelectedEmployeeIds(newIds);
          } else {
            setExcludedEmployeeIds(newIds);
          }
        }}
        title={employeeModalMode === 'include' ? 'تحديد الموظفين يدوياً' : 'استبعاد موظفين من التقرير'}
        description={
          employeeModalMode === 'include'
            ? 'ابحث وحدد الموظفين المطلوب إدراجهم بالتقرير'
            : 'حدد الموظفين المراد استثناؤهم واستبعادهم من نتائج التقرير'
        }
      />

      {/* 7. Saved Reports Modal */}
      <SavedReportsModal
        isOpen={isSavedModalOpen}
        onClose={() => setIsSavedModalOpen(false)}
        onLoadTemplate={handleLoadTemplate}
        onSaveCurrentAsTemplate={handleSaveCurrentTemplate}
        mode={savedModalMode}
      />

    </div>
  );
};
