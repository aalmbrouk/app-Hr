import React, { useState, useMemo } from 'react';
import {
  Employee,
  CareerPromotionRecord,
  UnlinkedHistoricalCareerRecord,
  HistoricalDryRunReport,
  HistoricalCareerClassification,
  FullAppDatabase
} from '../types';
import {
  generateHistoricalDryRunReport,
  commitHistoricalCareerMigration,
  runHistoricalMigrationAcceptanceTests,
  RawHistoricalCareerRow
} from '../utils/historicalCareerMigrationEngine';
import {
  History,
  ShieldCheck,
  AlertTriangle,
  FileSpreadsheet,
  Download,
  Filter,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  Database,
  Lock,
  Layers,
  Sparkles,
  UploadCloud,
  FileCheck2,
  RefreshCw,
  Eye,
  Info
} from 'lucide-react';
import * as XLSX from 'xlsx';

interface HistoricalCareerAuditViewProps {
  employees: Employee[];
  careerRecords: CareerPromotionRecord[];
  unlinkedHistoricalRecords?: UnlinkedHistoricalCareerRecord[];
  fullDatabase: FullAppDatabase;
  onUpdateDatabase: (updatedDb: FullAppDatabase) => void;
  onNavigateToEmployee?: (empId: number) => void;
}

export const HistoricalCareerAuditView: React.FC<HistoricalCareerAuditViewProps> = ({
  employees,
  careerRecords = [],
  unlinkedHistoricalRecords = [],
  fullDatabase,
  onUpdateDatabase,
  onNavigateToEmployee
}) => {
  // Navigation tabs inside the Audit Screen
  const [activeSubTab, setActiveSubTab] = useState<'records' | 'unlinked' | 'dryrun' | 'tests'>('records');

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNationalId, setSelectedNationalId] = useState('');
  const [selectedHistoricalTitle, setSelectedHistoricalTitle] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [classificationFilter, setClassificationFilter] = useState<'ALL' | HistoricalCareerClassification>('ALL');
  const [onlyRegulation418, setOnlyRegulation418] = useState(false);
  const [only2023Transition, setOnly2023Transition] = useState(false);
  const [onlyNeedsReview, setOnlyNeedsReview] = useState(false);

  // Dry-Run State
  const [dryRunReport, setDryRunReport] = useState<HistoricalDryRunReport | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string>('');
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [commitMessage, setCommitMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isCommitting, setIsCommitting] = useState(false);

  // Test Suite Runner State
  const [testResults, setTestResults] = useState<ReturnType<typeof runHistoricalMigrationAcceptanceTests> | null>(null);

  // Selected Record Modal Details
  const [selectedRecordForDetail, setSelectedRecordForDetail] = useState<CareerPromotionRecord | null>(null);

  // Gather all historical/career records merged with employee details
  const enrichedCareerRecords = useMemo(() => {
    return careerRecords.map(record => {
      const emp = employees.find(e => e.id === record.employeeId || (record.fileNumber && e.jobNumber === record.fileNumber));
      return {
        ...record,
        empName: emp ? emp.fullName : record.employeeName || 'غير مسجل',
        empJobNumber: emp ? emp.jobNumber : record.fileNumber || '-',
        empNationalId: emp ? emp.nationalId : record.nationalId || '-',
        empCategory: emp ? emp.assignmentCategory : 'طبي',
        empCurrentGrade: emp ? emp.jobGrade : '-'
      };
    });
  }, [careerRecords, employees]);

  // Filtered records list
  const filteredRecords = useMemo(() => {
    return enrichedCareerRecords.filter(item => {
      // 1. Search Query (Name, File No, Notes, Decision)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = item.empName.toLowerCase().includes(q);
        const matchesJob = item.empJobNumber.toLowerCase().includes(q);
        const matchesDec = (item.decisionNumber || '').toLowerCase().includes(q);
        const matchesTitle = (item.historicalJobTitle || item.newGrade || '').toLowerCase().includes(q);
        if (!matchesName && !matchesJob && !matchesDec && !matchesTitle) return false;
      }

      // 2. National ID
      if (selectedNationalId.trim()) {
        if (!item.empNationalId.includes(selectedNationalId.trim())) return false;
      }

      // 3. Historical Title
      if (selectedHistoricalTitle.trim()) {
        const title = (item.historicalJobTitle || item.newGrade || '').trim();
        if (!title.includes(selectedHistoricalTitle.trim())) return false;
      }

      // 4. Date Range
      if (dateFrom && (item.actionDate || '') < dateFrom) return false;
      if (dateTo && (item.actionDate || '') > dateTo) return false;

      // 5. Classification
      if (classificationFilter !== 'ALL') {
        if (item.historicalClassification !== classificationFilter) return false;
      }

      // 6. Only Regulation 418
      if (onlyRegulation418) {
        if (
          item.historicalClassification !== 'REGULATION_418_HISTORICAL' &&
          !((item.actionDate || '').slice(0, 4) < '2023' && item.empCategory === 'طبي')
        ) {
          return false;
        }
      }

      // 7. Only 2023 Transition
      if (only2023Transition) {
        if (
          item.historicalClassification !== 'GENERAL_GRADE_TRANSITION' &&
          !(item.actionType && item.actionType.includes('تحويل'))
        ) {
          return false;
        }
      }

      return true;
    });
  }, [
    enrichedCareerRecords,
    searchQuery,
    selectedNationalId,
    selectedHistoricalTitle,
    dateFrom,
    dateTo,
    classificationFilter,
    onlyRegulation418,
    only2023Transition
  ]);

  // Statistics
  const stats = useMemo(() => {
    const totalRecords = careerRecords.length;
    const reg418Records = careerRecords.filter(c => 
      c.historicalClassification === 'REGULATION_418_HISTORICAL' ||
      ((c.actionDate || '').slice(0, 4) < '2023' && (c.historicalJobTitle?.includes('فني') || c.newGrade?.includes('فني')))
    ).length;
    const transition2023Records = careerRecords.filter(c => 
      c.historicalClassification === 'GENERAL_GRADE_TRANSITION' ||
      c.actionType?.includes('تحويل')
    ).length;
    const unlinkedCount = unlinkedHistoricalRecords.length;
    const medicalEmployeesCount = employees.filter(e => e.assignmentCategory === 'طبي').length;

    return {
      totalRecords,
      reg418Records,
      transition2023Records,
      unlinkedCount,
      medicalEmployeesCount,
      activeEmployeesTotal: employees.length
    };
  }, [careerRecords, unlinkedHistoricalRecords, employees]);

  // Handle Excel file upload for Historical Dry-Run
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingFile(true);
    setUploadedFileName(file.name);
    setCommitMessage(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = evt.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonRows: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        // Normalize raw rows
        const rawRows: RawHistoricalCareerRow[] = jsonRows.map((row, idx) => {
          return {
            rowNumber: idx + 2,
            sourceFile: file.name,
            nationalId: String(row['الرقم الوطني'] || row['الرقم_الوطني'] || row['national_id'] || '').trim(),
            jobNumber: String(row['الرقم الوظيفي'] || row['رقم الموظف'] || row['job_number'] || '').trim(),
            employeeName: String(row['اسم الموظف'] || row['الاسم'] || row['name'] || '').trim(),
            actionType: String(row['نوع الحركة'] || row['الإجراء'] || row['نوع العملية'] || '').trim(),
            historicalJobTitle: String(row['المسمى الوظيفي التاريخي'] || row['الوظيفة'] || row['المسمى'] || '').trim(),
            grade: String(row['الدرجة'] || row['الدرجة التاريخية'] || '').trim(),
            increment: row['العلاوة'] || row['عدد العلاوات'] || 0,
            effectiveDate: String(row['تاريخ النفاذ'] || row['تاريخ السريان'] || row['تاريخ الدرجة'] || '').trim(),
            decisionNumber: String(row['رقم القرار'] || row['القرار'] || '').trim(),
            decisionDate: String(row['تاريخ القرار'] || '').trim(),
            issuingAuthority: String(row['الجهة المصدرة'] || '').trim(),
            notes: String(row['ملاحظات'] || '').trim()
          };
        });

        const report = generateHistoricalDryRunReport(
          rawRows,
          file.name,
          employees,
          fullDatabase.careerRecords || [],
          fullDatabase.promotions || [],
          fullDatabase.increments || [],
          fullDatabase.settlements || [],
          fullDatabase.generalProcedures || []
        );

        setDryRunReport(report);
        setActiveSubTab('dryrun');
      } catch (err: any) {
        setCommitMessage({
          type: 'error',
          text: `فشل قراءة ملف الإكسل: ${err?.message || 'خطأ غير معروف'}`
        });
      } finally {
        setIsProcessingFile(false);
      }
    };

    reader.readAsBinaryString(file);
  };

  // Load Built-in Medical Archives Dataset for 89 Medical Staff
  const handleLoadMedicalSampleArchives = () => {
    setIsProcessingFile(true);
    setUploadedFileName('medical_regulation418_archives.xlsx');
    setCommitMessage(null);

    setTimeout(() => {
      const medicalStaff = employees.filter(e => e.assignmentCategory === 'طبي');
      const rawRows: RawHistoricalCareerRow[] = [];
      let rowCounter = 1;

      medicalStaff.forEach((emp) => {
        const hireYear = parseInt((emp.hireDate || '2016').slice(0, 4), 10) || 2016;

        // 1. Initial 418 Appointment
        rawRows.push({
          rowNumber: rowCounter++,
          sourceFile: 'سجلات_الأرشيف_الطبي_418.xlsx',
          nationalId: emp.nationalId,
          jobNumber: emp.jobNumber,
          employeeName: emp.fullName,
          actionType: 'تعيين على كادر اللائحة 418',
          historicalJobTitle: emp.appointmentGrade || 'فني صحي ثاني',
          grade: emp.appointmentGrade || 'فني صحي ثاني',
          increment: 0,
          effectiveDate: emp.hireDate || `${hireYear}-05-01`,
          decisionNumber: `DEC-418-${hireYear}/101`,
          decisionDate: emp.hireDate || `${hireYear}-05-01`,
          issuingAuthority: 'وزارة الصحة',
          notes: 'تعيين أولي وفق توصيف اللائحة 418 للعناصر الطبية'
        });

        // 2. Intermediate 418 Promotion if hired before 2020
        if (hireYear <= 2019) {
          rawRows.push({
            rowNumber: rowCounter++,
            sourceFile: 'سجلات_الأرشيف_الطبي_418.xlsx',
            nationalId: emp.nationalId,
            jobNumber: emp.jobNumber,
            employeeName: emp.fullName,
            actionType: 'ترقية على اللائحة 418',
            historicalJobTitle: 'فني صحي أول',
            grade: 'فني صحي أول',
            increment: 1,
            effectiveDate: `${hireYear + 4}-01-01`,
            decisionNumber: `PROMO-418-${hireYear + 4}/204`,
            decisionDate: `${hireYear + 4}-01-01`,
            issuingAuthority: 'إدارة الشؤون الصحية',
            notes: 'ترقية دورية وفق التدرج الطبي 418'
          });
        }

        // 3. 2023 General Grade Transition Record
        rawRows.push({
          rowNumber: rowCounter++,
          sourceFile: 'سجلات_الأرشيف_الطبي_418.xlsx',
          nationalId: emp.nationalId,
          jobNumber: emp.jobNumber,
          employeeName: emp.fullName,
          actionType: 'تحويل من اللائحة 418 إلى نظام الدرجات العامة',
          historicalJobTitle: emp.jobTitle,
          grade: emp.jobGrade,
          increment: emp.currentIncrement,
          effectiveDate: '2023-01-01',
          decisionNumber: 'TRANS-2023/418-GEN',
          decisionDate: '2023-01-01',
          issuingAuthority: 'وزارة الخدمة المدنية / وزارة الصحة',
          notes: 'تسوية الوضع والانتقال إلى جدول المرتبات الموحد للدرجات العامة'
        });
      });

      const report = generateHistoricalDryRunReport(
        rawRows,
        'سجلات_الأرشيف_الطبي_418.xlsx',
        employees,
        fullDatabase.careerRecords || [],
        fullDatabase.promotions || [],
        fullDatabase.increments || [],
        fullDatabase.settlements || [],
        fullDatabase.generalProcedures || []
      );

      setDryRunReport(report);
      setActiveSubTab('dryrun');
      setIsProcessingFile(false);
    }, 400);
  };

  // Run Automated Acceptance Tests
  const handleRunAcceptanceTests = () => {
    const results = runHistoricalMigrationAcceptanceTests();
    setTestResults(results);
    setActiveSubTab('tests');
  };

  // Execute Commit
  const handleExecuteCommit = async () => {
    if (!dryRunReport || !dryRunReport.canCommitSafely) return;

    if (!window.confirm(`هل أنت متأكد من تثبيت (${dryRunReport.validHistoricalRecordsCount}) سجلاً وظيفياً تاريخياً؟\nسيتم أخذ نسخة احتياطية إجبارية تلقائياً قبل الحفظ.`)) {
      return;
    }

    setIsCommitting(true);
    setCommitMessage(null);

    try {
      const commitRes = await commitHistoricalCareerMigration(
        dryRunReport,
        fullDatabase,
        'مسؤول الموارد البشرية'
      );

      if (commitRes.success && commitRes.updatedDatabase) {
        onUpdateDatabase(commitRes.updatedDatabase);
        setCommitMessage({
          type: 'success',
          text: commitRes.message
        });
        setDryRunReport(null);
        setActiveSubTab('records');
      }
    } catch (err: any) {
      setCommitMessage({
        type: 'error',
        text: `فشل تثبيت الترحيل: ${err?.message || 'خطأ غير متوقع'}`
      });
    } finally {
      setIsCommitting(false);
    }
  };

  // Export Table to Excel
  const handleExportFilteredToExcel = () => {
    const dataToExport = filteredRecords.map((r, i) => ({
      'م': i + 1,
      'رقم الملف': r.empJobNumber,
      'اسم الموظف': r.empName,
      'الرقم الوطني': r.empNationalId,
      'المسمى الوظيفي التاريخي': r.historicalJobTitle || r.newGrade,
      'نوع الإجراء': r.actionType,
      'الدرجة الممنوحة': r.newGrade,
      'العلاوة': r.newIncrement,
      'تاريخ النفاذ': r.actionDate,
      'رقم القرار': r.decisionNumber,
      'تاريخ القرار': r.decisionDate,
      'الجهة المصدرة': r.issuingAuthority,
      'التصنيف النظامي': r.historicalClassification || 'STANDARD_CAREER_ACTION',
      'حالة الربط': 'مرتبط بالملاك',
      'المصدر': r.sourceFile || 'قاعدة البيانات المعتمدة',
      'ملاحظات': r.notes
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'السجلات التاريخية');
    XLSX.writeFile(wb, `سجلات_المسار_التاريخي_418_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return (
    <div className="space-y-6 pb-12" dir="rtl">
      {/* Top Banner & Title */}
      <div className="bg-gradient-to-l from-slate-900 via-indigo-950 to-slate-900 border border-indigo-900/60 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 text-xs font-bold">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
              <span>نظام التدقيق والترحيل التاريخي الآمن — اللائحة 418</span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
              <History className="w-7 h-7 text-indigo-400" />
              <span>سجلات المسار الوظيفي التاريخية / اللائحة 418</span>
            </h1>
            <p className="text-sm text-slate-300 max-w-3xl leading-relaxed">
              تدقيق ومراجعة كافة السجلات التاريخية الطبية لما قبل تسوية 2023 وربطها بالملاك المعتمد (142 موظفاً) 
              مع الحفاظ الصارم على الدرجات الحالية دون خلق أي موظفين وهميين.
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleRunAcceptanceTests}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-200 border border-slate-700 font-bold text-xs flex items-center gap-2 transition-all shadow-md active:scale-95"
            >
              <FileCheck2 className="w-4 h-4 text-emerald-400" />
              <span>فحص اختبارات القبول (6/6)</span>
            </button>

            <button
              onClick={handleLoadMedicalSampleArchives}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-2 transition-all shadow-lg shadow-indigo-600/30 active:scale-95"
            >
              <Sparkles className="w-4 h-4 text-yellow-300" />
              <span>محاكاة سجلات الـ 89 كادراً طبياً</span>
            </button>

            <label className="px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs flex items-center gap-2 transition-all shadow-lg shadow-emerald-700/30 cursor-pointer active:scale-95">
              <UploadCloud className="w-4 h-4" />
              <span>رفع ملف Excel تاريخي</span>
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={handleFileUpload}
              />
            </label>
          </div>
        </div>

        {/* Global Key Metrics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-6 pt-6 border-t border-indigo-900/40">
          <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/50">
            <span className="text-[11px] text-slate-400 block font-semibold">الملاك الأساسي المعتمد</span>
            <span className="text-xl font-black text-white">{stats.activeEmployeesTotal} موظفاً</span>
          </div>

          <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/50">
            <span className="text-[11px] text-slate-400 block font-semibold">الكوادر الطبية المستهدفة</span>
            <span className="text-xl font-black text-emerald-400">{stats.medicalEmployeesCount} كادراً</span>
          </div>

          <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/50">
            <span className="text-[11px] text-slate-400 block font-semibold">السجلات التاريخية المسجلة</span>
            <span className="text-xl font-black text-indigo-300">{stats.totalRecords} سجلاً</span>
          </div>

          <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/50">
            <span className="text-[11px] text-slate-400 block font-semibold">سجلات اللائحة 418</span>
            <span className="text-xl font-black text-amber-300">{stats.reg418Records} حركة</span>
          </div>

          <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/50">
            <span className="text-[11px] text-slate-400 block font-semibold">حركات تحويل 2023</span>
            <span className="text-xl font-black text-cyan-300">{stats.transition2023Records} تسوية</span>
          </div>

          <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/50">
            <span className="text-[11px] text-slate-400 block font-semibold">السجلات المعزولة (Quarantine)</span>
            <span className="text-xl font-black text-rose-300">{stats.unlinkedCount} سجلات</span>
          </div>
        </div>
      </div>

      {/* Notifications / Feedback */}
      {commitMessage && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between gap-3 text-sm font-bold ${
            commitMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
              : 'bg-rose-50 text-rose-900 border-rose-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {commitMessage.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-rose-600" />
            )}
            <span>{commitMessage.text}</span>
          </div>
          <button
            onClick={() => setCommitMessage(null)}
            className="text-xs px-2 py-1 bg-white/60 hover:bg-white rounded border"
          >
            إغلاق
          </button>
        </div>
      )}

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-slate-200 bg-white rounded-t-xl px-4 pt-2 gap-2 shadow-sm">
        <button
          onClick={() => setActiveSubTab('records')}
          className={`px-4 py-3 text-sm font-black border-b-2 flex items-center gap-2 transition-all ${
            activeSubTab === 'records'
              ? 'border-indigo-600 text-indigo-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>سجلات المسار الوظيفي المربوطة ({enrichedCareerRecords.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('unlinked')}
          className={`px-4 py-3 text-sm font-black border-b-2 flex items-center gap-2 transition-all ${
            activeSubTab === 'unlinked'
              ? 'border-amber-600 text-amber-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <AlertTriangle className="w-4 h-4 text-amber-500" />
          <span>السجلات المعزولة والمحجوبة ({unlinkedHistoricalRecords.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('dryrun')}
          className={`px-4 py-3 text-sm font-black border-b-2 flex items-center gap-2 transition-all ${
            activeSubTab === 'dryrun'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
          <span>مركز المحاكاة والتدقيق المسبق (Dry-Run)</span>
          {dryRunReport && (
            <span className="px-2 py-0.5 text-[10px] rounded-full bg-emerald-100 text-emerald-800 font-black">
              جاهز للعرض
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveSubTab('tests')}
          className={`px-4 py-3 text-sm font-black border-b-2 flex items-center gap-2 transition-all ${
            activeSubTab === 'tests'
              ? 'border-indigo-600 text-indigo-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-indigo-600" />
          <span>اختبارات القبول والنزاهة الآلية (6)</span>
        </button>
      </div>

      {/* ----------------- SUB-TAB 1: LINKED HISTORICAL RECORDS ----------------- */}
      {activeSubTab === 'records' && (
        <div className="bg-white rounded-b-xl rounded-t-none border border-t-0 border-slate-200 p-5 shadow-sm space-y-5">
          {/* Advanced Filter Toolbar */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <span className="text-xs font-black text-slate-700 flex items-center gap-1.5">
                <Filter className="w-4 h-4 text-indigo-600" />
                <span>خيارات التصفية والبحث في السجلات التاريخية</span>
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedNationalId('');
                    setSelectedHistoricalTitle('');
                    setDateFrom('');
                    setDateTo('');
                    setClassificationFilter('ALL');
                    setOnlyRegulation418(false);
                    setOnly2023Transition(false);
                  }}
                  className="text-xs text-slate-500 hover:text-slate-800 underline font-bold"
                >
                  إعادة ضبط الفلاتر
                </button>
                <button
                  onClick={handleExportFilteredToExcel}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>تصدير النتائج (Excel)</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Search Name/Job */}
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">اسم الموظف أو رقم الملف</label>
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="ابحث بالاسم أو رقم الملف أو القرار..."
                    className="w-full text-xs pr-8 pl-3 py-2 border rounded-lg bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none font-medium"
                  />
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5" />
                </div>
              </div>

              {/* National ID */}
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">الرقم الوطني</label>
                <input
                  type="text"
                  value={selectedNationalId}
                  onChange={(e) => setSelectedNationalId(e.target.value)}
                  placeholder="12 خانة رقمية..."
                  className="w-full text-xs px-3 py-2 border rounded-lg bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none font-medium"
                />
              </div>

              {/* Historical Title */}
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">المسمى الوظيفي التاريخي</label>
                <input
                  type="text"
                  value={selectedHistoricalTitle}
                  onChange={(e) => setSelectedHistoricalTitle(e.target.value)}
                  placeholder="فني صحي أول، طبيب ثالث..."
                  className="w-full text-xs px-3 py-2 border rounded-lg bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none font-medium"
                />
              </div>

              {/* Classification */}
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">التصنيف النظامي</label>
                <select
                  value={classificationFilter}
                  onChange={(e) => setClassificationFilter(e.target.value as any)}
                  className="w-full text-xs px-3 py-2 border rounded-lg bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none font-bold"
                >
                  <option value="ALL">جميع التصنيفات</option>
                  <option value="REGULATION_418_HISTORICAL">اللائحة 418 (تاريخي قبل 2023)</option>
                  <option value="GENERAL_GRADE_TRANSITION">انتقال وتسوية 2023</option>
                  <option value="PROMOTION">ترقية عادية / استثنائية</option>
                  <option value="ANNUAL_INCREMENT">علاوة دورية سنوية</option>
                  <option value="STATUS_SETTLEMENT">تسوية وضع</option>
                  <option value="STANDARD_CAREER_ACTION">إجراء عام</option>
                </select>
              </div>
            </div>

            {/* Quick Filter Chips */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-200/60">
              <span className="text-[11px] font-bold text-slate-500">فلاتر سريعة:</span>
              <button
                onClick={() => setOnlyRegulation418(!onlyRegulation418)}
                className={`px-2.5 py-1 rounded-full text-xs font-bold transition-all border ${
                  onlyRegulation418
                    ? 'bg-amber-100 text-amber-900 border-amber-400'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                سجلات اللائحة 418 فقط
              </button>

              <button
                onClick={() => setOnly2023Transition(!only2023Transition)}
                className={`px-2.5 py-1 rounded-full text-xs font-bold transition-all border ${
                  only2023Transition
                    ? 'bg-cyan-100 text-cyan-900 border-cyan-400'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                حركات انتقال 2023 فقط
              </button>
            </div>
          </div>

          {/* Records Table */}
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-100 text-slate-700 font-black border-b border-slate-200">
                <tr>
                  <th className="p-3">رقم الملف</th>
                  <th className="p-3">اسم الموظف</th>
                  <th className="p-3">الرقم الوطني</th>
                  <th className="p-3">المسمى الوظيفي التاريخي</th>
                  <th className="p-3">نوع الإجراء</th>
                  <th className="p-3">الدرجة الممنوحة</th>
                  <th className="p-3">العلاوة</th>
                  <th className="p-3">تاريخ النفاذ</th>
                  <th className="p-3">رقم القرار</th>
                  <th className="p-3">تاريخ القرار</th>
                  <th className="p-3">التصنيف</th>
                  <th className="p-3 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={12} className="p-8 text-center text-slate-400">
                      <History className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                      <p className="font-bold text-sm text-slate-600">لا توجد سجلات تاريخية تطابق معايير البحث الحالية.</p>
                      <p className="text-xs text-slate-400 mt-1">
                        يمكنك استيراد سجلات اللائحة 418 للأطباء والكوادر الطبية عبر زر "محاكاة سجلات الـ 89 كادراً طبياً" أو رفع ملف إكسل.
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((rec) => {
                    const is418 = rec.historicalClassification === 'REGULATION_418_HISTORICAL';
                    const isTrans = rec.historicalClassification === 'GENERAL_GRADE_TRANSITION';

                    return (
                      <tr key={rec.id} className="hover:bg-indigo-50/40 transition-colors font-medium">
                        <td className="p-3 font-bold text-slate-800">{rec.empJobNumber}</td>
                        <td className="p-3 font-bold text-indigo-950">
                          <button
                            onClick={() => onNavigateToEmployee && onNavigateToEmployee(rec.employeeId)}
                            className="hover:underline text-right"
                          >
                            {rec.empName}
                          </button>
                        </td>
                        <td className="p-3 text-slate-600 font-mono">{rec.empNationalId}</td>
                        <td className="p-3 font-bold text-slate-800">
                          {rec.historicalJobTitle || rec.newGrade}
                        </td>
                        <td className="p-3 text-slate-700">{rec.actionType}</td>
                        <td className="p-3 font-bold text-indigo-700">{rec.newGrade}</td>
                        <td className="p-3 text-slate-700">{rec.newIncrement}</td>
                        <td className="p-3 font-mono text-slate-700">{rec.actionDate || '-'}</td>
                        <td className="p-3 text-slate-700">{rec.decisionNumber || '-'}</td>
                        <td className="p-3 font-mono text-slate-700">{rec.decisionDate || '-'}</td>
                        <td className="p-3">
                          {is418 ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-300">
                              اللائحة 418
                            </span>
                          ) : isTrans ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-cyan-100 text-cyan-900 border border-cyan-300">
                              انتقال 2023
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-800">
                              {rec.historicalClassification || 'عام'}
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-center">
                          <button
                            onClick={() => setSelectedRecordForDetail(rec)}
                            className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-600 transition-colors"
                            title="عرض تفاصيل السجل"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ----------------- SUB-TAB 2: UNLINKED HISTORICAL RECORDS ----------------- */}
      {activeSubTab === 'unlinked' && (
        <div className="bg-white rounded-b-xl rounded-t-none border border-t-0 border-slate-200 p-5 shadow-sm space-y-4">
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs leading-relaxed font-bold flex items-start gap-3">
            <Lock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-black text-sm">مستودع العزل المحمي للسجلات التاريخية غير المطابقة (Quarantine)</p>
              <p className="font-normal mt-0.5 text-amber-800">
                أي سجل في ملفات الإكسل التاريخية لم يتم التعرف على صاحبه بالرقم الوطني أو رقم الملف أو الاسم المطابق بنسبة 100%،
                يتم عزله هنا مع سبب عدم الربط، لضمان عدم ضياع أي بيانات تاريخية ومنع إنشاء أي موظف وهمي منعاً باتاً.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-100 text-slate-700 font-black border-b border-slate-200">
                <tr>
                  <th className="p-3">م</th>
                  <th className="p-3">رقم الصف بالمصدر</th>
                  <th className="p-3">الاسم الوارد بالإكسل</th>
                  <th className="p-3">الرقم الوطني الوارد</th>
                  <th className="p-3">رقم الملف الوارد</th>
                  <th className="p-3">المسمى / الدرجة الواردة</th>
                  <th className="p-3">الإجراء الوارد</th>
                  <th className="p-3">تاريخ النفاذ</th>
                  <th className="p-3">سبب العزل وعدم الربط</th>
                  <th className="p-3">ملف المصدر</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {unlinkedHistoricalRecords.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="p-8 text-center text-slate-400 font-bold">
                      <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-500 mb-2" />
                      <p className="text-sm text-slate-700">لا توجد سجلات تاريخية معزولة أو مجهولة.</p>
                      <p className="text-xs text-slate-400 mt-0.5">كافة السجلات المستوردة تم ربطها بنجاح مع الملاك المعتمد.</p>
                    </td>
                  </tr>
                ) : (
                  unlinkedHistoricalRecords.map((u, i) => (
                    <tr key={u.id} className="hover:bg-amber-50/50 transition-colors">
                      <td className="p-3 font-bold text-slate-700">{i + 1}</td>
                      <td className="p-3 font-mono font-bold text-slate-800">الصف {u.sourceRow}</td>
                      <td className="p-3 font-bold text-rose-900">{u.rawEmployeeName || '-'}</td>
                      <td className="p-3 font-mono text-slate-700">{u.rawNationalId || '-'}</td>
                      <td className="p-3 text-slate-700">{u.rawJobNumber || '-'}</td>
                      <td className="p-3 font-bold text-slate-800">{u.rawGradeOrTitle || '-'}</td>
                      <td className="p-3 text-slate-700">{u.rawActionType || '-'}</td>
                      <td className="p-3 font-mono text-slate-700">{u.rawEffectiveDate || '-'}</td>
                      <td className="p-3 font-bold text-rose-700">{u.rejectionReason}</td>
                      <td className="p-3 text-slate-500 font-mono text-[11px]">{u.sourceFile}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ----------------- SUB-TAB 3: DRY-RUN SIMULATION CENTER ----------------- */}
      {activeSubTab === 'dryrun' && (
        <div className="bg-white rounded-b-xl rounded-t-none border border-t-0 border-slate-200 p-5 shadow-sm space-y-6">
          {!dryRunReport ? (
            <div className="p-12 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50 space-y-4">
              <FileSpreadsheet className="w-12 h-12 mx-auto text-indigo-500" />
              <div className="max-w-md mx-auto space-y-1">
                <h3 className="font-black text-slate-800 text-base">مركز المحاكاة والتدقيق المسبق قبل الترحيل (Dry-Run)</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  قم برفع ملف إكسل تاريخي أو اضغط زر المحاكاة التلقائية للأطباء لإنشاء تقرير فحص ومطابقة شامل 
                  يعرض الدرجات الحالية قبل وبعد الاستيراد ويمنع الترحيل في حال وجود أي تغيير غير متوقع.
                </p>
              </div>
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  onClick={handleLoadMedicalSampleArchives}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs shadow-lg shadow-indigo-600/20 active:scale-95"
                >
                  محاكاة سجلات اللائحة 418 الطبية
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Report Header & Safety Lock Banner */}
              <div className="p-5 rounded-2xl border bg-slate-900 text-white flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    {dryRunReport.canCommitSafely ? (
                      <span className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400 text-emerald-300 text-xs font-black flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>اجتاز الفحص الأمني (100% متطابق وجاهز للترحيل)</span>
                      </span>
                    ) : (
                      <span className="px-3 py-1 rounded-full bg-rose-500/20 border border-rose-400 text-rose-300 text-xs font-black flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>الترحيل محظور — تم اكتشاف محاذير أمنية</span>
                      </span>
                    )}
                    <span className="text-xs text-slate-400 font-mono">الملف: {dryRunReport.sourceFileName}</span>
                  </div>
                  <h3 className="text-lg font-black text-white">
                    تقرير الفحص والمحاكاة المسبق (Dry-Run Report Summary)
                  </h3>
                  <p className="text-xs text-slate-300">
                    تمت معالجة وترتيب الحركات الوظيفية زمنياً بصرف النظر عن ترتيب الصفوف بالإكسل.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setDryRunReport(null)}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold"
                  >
                    إلغاء التقرير
                  </button>

                  <button
                    disabled={!dryRunReport.canCommitSafely || isCommitting}
                    onClick={handleExecuteCommit}
                    className={`px-5 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 transition-all shadow-lg ${
                      dryRunReport.canCommitSafely
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30 active:scale-95'
                        : 'bg-slate-700 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    <Lock className="w-4 h-4" />
                    <span>{isCommitting ? 'جاري النسخ الاحتياطي والترحيل...' : 'تثبيت الترحيل وأخذ نسخة احتياطية'}</span>
                  </button>
                </div>
              </div>

              {/* 10 Dry Run Checkpoints Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                <div className="p-3 bg-slate-50 border rounded-xl">
                  <span className="text-[11px] text-slate-500 font-bold block">إجمالي صفوف المصدر</span>
                  <span className="text-lg font-black text-slate-800">{dryRunReport.totalExcelRows}</span>
                </div>

                <div className="p-3 bg-slate-50 border rounded-xl">
                  <span className="text-[11px] text-slate-500 font-bold block">سجلات تاريخية صحيحة</span>
                  <span className="text-lg font-black text-indigo-600">{dryRunReport.validHistoricalRecordsCount}</span>
                </div>

                <div className="p-3 bg-slate-50 border rounded-xl">
                  <span className="text-[11px] text-slate-500 font-bold block">مطابقة بنجاح لموظفين</span>
                  <span className="text-lg font-black text-emerald-600">{dryRunReport.successfullyMatchedRecordsCount}</span>
                </div>

                <div className="p-3 bg-slate-50 border rounded-xl">
                  <span className="text-[11px] text-slate-500 font-bold block">سجلات معزولة (غير مطابقة)</span>
                  <span className="text-lg font-black text-amber-600">{dryRunReport.unmatchedRecordsCount}</span>
                </div>

                <div className="p-3 bg-slate-50 border rounded-xl">
                  <span className="text-[11px] text-slate-500 font-bold block">سجلات مكررة مستبعدة</span>
                  <span className="text-lg font-black text-slate-600">{dryRunReport.duplicateRecordsCount}</span>
                </div>

                <div className="p-3 bg-slate-50 border rounded-xl">
                  <span className="text-[11px] text-slate-500 font-bold block">موظفون يستقبلون تاريخاً</span>
                  <span className="text-lg font-black text-indigo-700">{dryRunReport.employeesReceivingHistoryCount}</span>
                </div>

                <div className="p-3 bg-slate-50 border rounded-xl">
                  <span className="text-[11px] text-slate-500 font-bold block">موظفون بدون سجلات جديدة</span>
                  <span className="text-lg font-black text-slate-700">{dryRunReport.employeesWithNoHistoryCount}</span>
                </div>

                <div className="p-3 bg-slate-50 border rounded-xl">
                  <span className="text-[11px] text-slate-500 font-bold block">حركات اللائحة 418</span>
                  <span className="text-lg font-black text-amber-700">{dryRunReport.regulation418RecordsCount}</span>
                </div>

                <div className="p-3 bg-slate-50 border rounded-xl">
                  <span className="text-[11px] text-slate-500 font-bold block">حركات تحويل 2023</span>
                  <span className="text-lg font-black text-cyan-700">{dryRunReport.transition2023RecordsCount}</span>
                </div>

                <div className="p-3 bg-slate-50 border rounded-xl">
                  <span className="text-[11px] text-slate-500 font-bold block">تغيرات غير متوقعة في الدرجة</span>
                  <span className={`text-lg font-black ${dryRunReport.unexpectedGradeChangesCount === 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {dryRunReport.unexpectedGradeChangesCount}
                  </span>
                </div>
              </div>

              {/* Before vs After Table for every matched employee */}
              <div className="space-y-2">
                <h4 className="font-black text-sm text-slate-800 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-indigo-600" />
                  <span>جدول التحقق الشامل للدرجات الحالية قبل وبعد الترحيل (Employee Before vs After Verification)</span>
                </h4>

                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-slate-100 text-slate-700 font-black border-b border-slate-200">
                      <tr>
                        <th className="p-3">رقم الملف</th>
                        <th className="p-3">اسم الموظف</th>
                        <th className="p-3">الرقم الوطني</th>
                        <th className="p-3">أقدم سجل تاريخي</th>
                        <th className="p-3">أحدث سجل تاريخي</th>
                        <th className="p-3 text-center">الدرجة قبل الترحيل</th>
                        <th className="p-3 text-center">الدرجة بعد الترحيل</th>
                        <th className="p-3 text-center">عدد السجلات المضافة</th>
                        <th className="p-3 text-center">النتيجة المتوقعة</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 font-medium">
                      {dryRunReport.matchedEmployeesSummary.map((empSum) => (
                        <tr key={empSum.employeeId} className="hover:bg-indigo-50/30">
                          <td className="p-3 font-bold text-slate-800">{empSum.jobNumber}</td>
                          <td className="p-3 font-bold text-indigo-950">{empSum.fullName}</td>
                          <td className="p-3 font-mono text-slate-600">{empSum.nationalId}</td>
                          <td className="p-3 text-slate-700">
                            <span className="font-mono font-bold text-slate-900">{empSum.earliestHistoricalRecordDate}</span>
                            <span className="text-[10px] text-slate-500 block">{empSum.earliestHistoricalTitle}</span>
                          </td>
                          <td className="p-3 text-slate-700">
                            <span className="font-mono font-bold text-slate-900">{empSum.latestHistoricalRecordDate}</span>
                            <span className="text-[10px] text-slate-500 block">{empSum.latestHistoricalTitle}</span>
                          </td>
                          <td className="p-3 text-center font-bold text-slate-800 bg-slate-50">
                            {empSum.currentGradeBefore}
                          </td>
                          <td className="p-3 text-center font-bold text-indigo-700 bg-indigo-50/50">
                            {empSum.currentGradeAfter}
                          </td>
                          <td className="p-3 text-center font-bold text-slate-800">
                            {empSum.recordsToAddCount}
                          </td>
                          <td className="p-3 text-center">
                            {empSum.isGradeChanged ? (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-rose-100 text-rose-900 border border-rose-300">
                                محظور (تغيرت الدرجة)
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-900 border border-emerald-300">
                                متطابق وسليم (100%)
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ----------------- SUB-TAB 4: AUTOMATED INTEGRITY TESTS ----------------- */}
      {activeSubTab === 'tests' && (
        <div className="bg-white rounded-b-xl rounded-t-none border border-t-0 border-slate-200 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <div>
              <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-indigo-600" />
                <span>حزمة اختبارات القبول والنزاهة الآلية (Automated Acceptance Test Suite)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                تطبيق وتحقق فوري لكافة القواعد والضوابط العشرة لترحيل اللائحة 418.
              </p>
            </div>
            <button
              onClick={handleRunAcceptanceTests}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs flex items-center gap-1.5 shadow-md active:scale-95"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>إعادة تشغيل الاختبارات الآلية</span>
            </button>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {(testResults || runHistoricalMigrationAcceptanceTests()).map((test, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-xl border flex items-start justify-between gap-4 ${
                  test.passed
                    ? 'bg-emerald-50/60 border-emerald-200'
                    : 'bg-rose-50/60 border-rose-200'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    {test.passed ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    )}
                    <span className="font-black text-xs text-slate-900">{test.testName}</span>
                  </div>
                  <p className="text-xs text-slate-600 pr-6 font-medium">{test.details}</p>
                </div>

                <span
                  className={`px-3 py-1 rounded-full text-[10px] font-black shrink-0 ${
                    test.passed
                      ? 'bg-emerald-200 text-emerald-900'
                      : 'bg-rose-200 text-rose-900'
                  }`}
                >
                  {test.passed ? 'ناجح (PASSED)' : 'فشل (FAILED)'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Record Detail Modal */}
      {selectedRecordForDetail && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl border" dir="rtl">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Info className="w-5 h-5 text-indigo-600" />
                <span>تفاصيل السجل الوظيفي التاريخي</span>
              </h3>
              <button
                onClick={() => setSelectedRecordForDetail(null)}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-400"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-2.5 bg-slate-50 rounded-lg">
                <span className="text-slate-400 block text-[10px]">الموظف</span>
                <span className="font-bold text-slate-900">{selectedRecordForDetail.employeeName}</span>
              </div>

              <div className="p-2.5 bg-slate-50 rounded-lg">
                <span className="text-slate-400 block text-[10px]">رقم الملف</span>
                <span className="font-bold text-slate-900">{selectedRecordForDetail.fileNumber}</span>
              </div>

              <div className="p-2.5 bg-slate-50 rounded-lg">
                <span className="text-slate-400 block text-[10px]">المسمى التاريخي</span>
                <span className="font-bold text-indigo-700">{selectedRecordForDetail.historicalJobTitle || selectedRecordForDetail.newGrade}</span>
              </div>

              <div className="p-2.5 bg-slate-50 rounded-lg">
                <span className="text-slate-400 block text-[10px]">نوع الإجراء</span>
                <span className="font-bold text-slate-900">{selectedRecordForDetail.actionType}</span>
              </div>

              <div className="p-2.5 bg-slate-50 rounded-lg">
                <span className="text-slate-400 block text-[10px]">تاريخ النفاذ</span>
                <span className="font-bold text-slate-900 font-mono">{selectedRecordForDetail.actionDate}</span>
              </div>

              <div className="p-2.5 bg-slate-50 rounded-lg">
                <span className="text-slate-400 block text-[10px]">رقم وتاريخ القرار</span>
                <span className="font-bold text-slate-900">{selectedRecordForDetail.decisionNumber} ({selectedRecordForDetail.decisionDate})</span>
              </div>

              <div className="p-2.5 bg-slate-50 rounded-lg col-span-2">
                <span className="text-slate-400 block text-[10px]">الجهة المصدرة للقرار</span>
                <span className="font-bold text-slate-900">{selectedRecordForDetail.issuingAuthority}</span>
              </div>

              <div className="p-2.5 bg-slate-50 rounded-lg col-span-2">
                <span className="text-slate-400 block text-[10px]">ملاحظات المصدر</span>
                <span className="font-medium text-slate-700">{selectedRecordForDetail.notes || 'لا توجد ملاحظات إضافية'}</span>
              </div>
            </div>

            <div className="pt-3 border-t flex justify-end">
              <button
                onClick={() => setSelectedRecordForDetail(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
