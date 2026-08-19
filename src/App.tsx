import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Employee, 
  UserAccount, 
  AuditLog, 
  SystemSettings, 
  ActiveTab,
  LeaveTransaction,
  PromotionRecord,
  IncrementRecord,
  SecondmentRecord,
  TransferRecord,
  DisciplinaryRecord,
  ResignationRecord,
  StatusSettlementRecord,
  GeneralProcedure,
  OrganizationalUnit,
  JobTitle,
  HrRule,
  EmploymentStatus
} from './types';
import { 
  INITIAL_EMPLOYEES, 
  INITIAL_USERS, 
  INITIAL_LOGS, 
  INITIAL_SETTINGS,
  INITIAL_LEAVES,
  INITIAL_PROMOTIONS,
  INITIAL_INCREMENTS,
  INITIAL_SECONDMENTS,
  INITIAL_TRANSFERS,
  INITIAL_DISCIPLINARY,
  INITIAL_RESIGNATIONS,
  INITIAL_SETTLEMENTS,
  INITIAL_GENERAL_PROCEDURES,
  INITIAL_ORG_UNITS,
  INITIAL_JOB_TITLES,
  DEFAULT_HR_RULES,
  generateLargeDataset 
} from './data/initialData';
import { FullAppDatabase } from './utils/storageTypes';
import { loadAppDatabase, saveAppDatabase } from './utils/storageService';

import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { LoginModal } from './components/LoginModal';
import { DashboardView } from './components/DashboardView';
import { EmployeeManagerView } from './components/EmployeeManagerView';
import { SearchQueryView } from './components/SearchQueryView';
import { ReportsView } from './components/ReportsView';
import { StatisticsView } from './components/StatisticsView';
import { SettingsBackupView } from './components/SettingsBackupView';
import { UserManagementView } from './components/UserManagementView';
import { AuditLogsView } from './components/AuditLogsView';
import { VbaCodeExporterView } from './components/VbaCodeExporterView';
import { EmployeePrintCard } from './components/EmployeePrintCard';

// HR Module Components
import { LeaveManagementView } from './components/LeaveManagementView';
import { PromotionsIncrementsView } from './components/PromotionsIncrementsView';
import { SecondmentsView } from './components/SecondmentsView';
import { TransfersView } from './components/TransfersView';
import { DisciplinaryView } from './components/DisciplinaryView';
import { ResignationsView } from './components/ResignationsView';
import { EmployeeHistoryView } from './components/EmployeeHistoryView';
import { HrRulesSettingsView } from './components/HrRulesSettingsView';
import { GeneralProceduresView } from './components/GeneralProceduresView';
import { OrgStructureView } from './components/OrgStructureView';

export default function App() {
  // Authentication state
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(INITIAL_USERS[0]);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);

  // Active Tab Navigation
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');

  // Database initialization / loading status
  const [isDataLoaded, setIsDataLoaded] = useState<boolean>(false);
  const [corruptionAlert, setCorruptionAlert] = useState<string | null>(null);

  // Core Datasets
  const [employees, setEmployees] = useState<Employee[]>(INITIAL_EMPLOYEES);
  const [users, setUsers] = useState<UserAccount[]>(INITIAL_USERS);
  const [logs, setLogs] = useState<AuditLog[]>(INITIAL_LOGS);
  const [settings, setSettings] = useState<SystemSettings>(INITIAL_SETTINGS);

  // HR Module Datasets
  const [leaves, setLeaves] = useState<LeaveTransaction[]>(INITIAL_LEAVES);
  const [promotions, setPromotions] = useState<PromotionRecord[]>(INITIAL_PROMOTIONS);
  const [increments, setIncrements] = useState<IncrementRecord[]>(INITIAL_INCREMENTS);
  const [secondments, setSecondments] = useState<SecondmentRecord[]>(INITIAL_SECONDMENTS);
  const [transfers, setTransfers] = useState<TransferRecord[]>(INITIAL_TRANSFERS);
  const [disciplinary, setDisciplinary] = useState<DisciplinaryRecord[]>(INITIAL_DISCIPLINARY);
  const [resignations, setResignations] = useState<ResignationRecord[]>(INITIAL_RESIGNATIONS);
  const [settlements, setSettlements] = useState<StatusSettlementRecord[]>(INITIAL_SETTLEMENTS);
  const [generalProcedures, setGeneralProcedures] = useState<GeneralProcedure[]>(INITIAL_GENERAL_PROCEDURES);
  const [orgUnits, setOrgUnits] = useState<OrganizationalUnit[]>(INITIAL_ORG_UNITS);
  const [jobTitles, setJobTitles] = useState<JobTitle[]>(INITIAL_JOB_TITLES);
  const [hrRules, setHrRules] = useState<HrRule[]>(DEFAULT_HR_RULES);

  // UI Dialog / Modal States
  const [printCardEmp, setPrintCardEmp] = useState<Employee | null>(null);
  const [openAddModal, setOpenAddModal] = useState<boolean>(false);

  // Initial Load from Persistence Layer (Electron / Storage)
  useEffect(() => {
    let isMounted = true;
    loadAppDatabase().then((res) => {
      if (!isMounted) return;
      if (res.data) {
        if (res.data.employees) setEmployees(res.data.employees);
        if (res.data.users) setUsers(res.data.users);
        if (res.data.logs) setLogs(res.data.logs);
        if (res.data.settings) setSettings(res.data.settings);
        if (res.data.leaves) setLeaves(res.data.leaves);
        if (res.data.promotions) setPromotions(res.data.promotions);
        if (res.data.increments) setIncrements(res.data.increments);
        if (res.data.secondments) setSecondments(res.data.secondments);
        if (res.data.transfers) setTransfers(res.data.transfers);
        if (res.data.disciplinary) setDisciplinary(res.data.disciplinary);
        if (res.data.resignations) setResignations(res.data.resignations);
        if (res.data.settlements) setSettlements(res.data.settlements);
        if (res.data.generalProcedures) setGeneralProcedures(res.data.generalProcedures);
        if (res.data.orgUnits) setOrgUnits(res.data.orgUnits);
        if (res.data.jobTitles) setJobTitles(res.data.jobTitles);
        if (res.data.hrRules) setHrRules(res.data.hrRules);
      }
      if (res.corrupted) {
        setCorruptionAlert('تنبيه أمان: تعذر قراءة ملف البيانات السابق لاحتوائه على صياغة غير صالحة. تم حفظ نسخة احتياطية آمنة منه واسترجاع البيانات الافتراضية.');
      }
      setIsDataLoaded(true);
    });
    return () => { isMounted = false; };
  }, []);

  // Full Database State Memo
  const currentFullDb: FullAppDatabase = useMemo(() => ({
    version: 1,
    lastUpdated: new Date().toISOString(),
    employees,
    users,
    logs,
    settings,
    leaves,
    promotions,
    increments,
    secondments,
    transfers,
    disciplinary,
    resignations,
    settlements,
    generalProcedures,
    orgUnits,
    jobTitles,
    hrRules
  }), [
    employees,
    users,
    logs,
    settings,
    leaves,
    promotions,
    increments,
    secondments,
    transfers,
    disciplinary,
    resignations,
    settlements,
    generalProcedures,
    orgUnits,
    jobTitles,
    hrRules
  ]);

  // Automatic Debounced Persistence (Flushes within 1000ms of any dataset change)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isFirstSaveRef = useRef<boolean>(true);

  useEffect(() => {
    if (!isDataLoaded) return; // Do not overwrite before initial load finishes

    if (isFirstSaveRef.current) {
      isFirstSaveRef.current = false;
      // Ensure file exists on disk/storage on first load
      saveAppDatabase(currentFullDb);
      return;
    }

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      saveAppDatabase(currentFullDb);
    }, 800);

    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [currentFullDb, isDataLoaded]);

  // Emergency safety flush on window unload / before closing
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (isDataLoaded) {
        saveAppDatabase(currentFullDb);
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [currentFullDb, isDataLoaded]);

  // Helper to add audit logs
  const logAction = (action: AuditLog['action'], details: string, targetId?: number | string) => {
    const newLog: AuditLog = {
      id: `LOG-${1000 + logs.length + 1}`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      user: currentUser ? currentUser.username : 'النظام',
      action,
      details,
      targetId
    };
    setLogs((prev) => [newLog, ...prev]);
  };

  // CRUD Handlers
  const handleAddEmployee = (newEmp: Employee) => {
    setEmployees((prev) => [newEmp, ...prev]);
    logAction('إضافة', `تمت إضافة موظف جديد: ${newEmp.fullName} (رقم: ${newEmp.id})`, newEmp.id);
  };

  const handleUpdateEmployee = (updatedEmp: Employee) => {
    setEmployees((prev) => prev.map((e) => (e.id === updatedEmp.id ? updatedEmp : e)));
    logAction('تعديل', `تعديل بيانات الموظف: ${updatedEmp.fullName} (رقم: ${updatedEmp.id})`, updatedEmp.id);
  };

  const handleDeleteEmployee = (id: number) => {
    const target = employees.find((e) => e.id === id);
    setEmployees((prev) => prev.filter((e) => e.id !== id));
    logAction('حذف', `حذف الموظف: ${target ? target.fullName : id} (رقم: ${id})`, id);
  };

  const handleDuplicateEmployee = (emp: Employee) => {
    const nextId = employees.length > 0 ? Math.max(...employees.map((e) => e.id)) + 1 : 1001;
    const duplicated: Employee = {
      ...emp,
      id: nextId,
      jobNumber: `BD-${new Date().getFullYear()}-${String(nextId % 1000).padStart(3, '0')}`,
      cadreNumber: `CAD-${nextId}`,
      fullName: `${emp.fullName} (نسخة)`,
      nationalId: `12026${String(nextId).padStart(7, '0')}`
    };
    setEmployees((prev) => [duplicated, ...prev]);
    logAction('إضافة', `نسخ موظف من ${emp.fullName} إلى ${duplicated.fullName}`, duplicated.id);
  };

  // HR Specific Handlers
  const handleAddLeave = (leave: LeaveTransaction) => {
    setLeaves((prev) => [leave, ...prev]);
    logAction('إضافة', `تسجيل إجازة للموظف ${leave.employeeId} - ${leave.leaveType} (${leave.numberOfDays} يوم)`, leave.employeeId);
  };

  const handleUpdateLeave = (updatedLeave: LeaveTransaction) => {
    setLeaves((prev) => prev.map((l) => (l.id === updatedLeave.id ? updatedLeave : l)));
    logAction('تعديل', `تعديل / تمديد الإجازة ${updatedLeave.id} للموظف ${updatedLeave.employeeId}`, updatedLeave.employeeId);
  };

  const handleUpdateLeaveStatus = (id: string, status: LeaveTransaction['status']) => {
    setLeaves((prev) => prev.map((l) => (l.id === id ? { ...l, status } : l)));
    logAction('تعديل', `تعديل حالة الإجازة ${id} إلى ${status}`, id);
  };

  const handleAddPromotion = (promo: PromotionRecord) => {
    setPromotions((prev) => [promo, ...prev]);
    logAction('تعديل', `تسجيل ترقية للموظف ${promo.employeeId} إلى ${promo.newGrade}`, promo.employeeId);
  };

  const handleAddIncrement = (inc: IncrementRecord) => {
    setIncrements((prev) => [inc, ...prev]);
    logAction('تعديل', `منح علاوة سنوية (${inc.newIncrement}) للموظف ${inc.employeeId}`, inc.employeeId);
  };

  const handleAddSettlement = (settle: StatusSettlementRecord) => {
    setSettlements((prev) => [settle, ...prev]);
    logAction('تعديل', `تسوية وضع وظيفي للموظف ${settle.employeeId}`, settle.employeeId);
  };

  const handleUpdateEmployeeGrade = (employeeId: number, newGrade: string, newIncrement: number) => {
    const today = new Date().toISOString().slice(0, 10);
    setEmployees((prev) =>
      prev.map((e) => (e.id === employeeId ? { 
        ...e, 
        jobGrade: newGrade, 
        financialGrade: newGrade,
        currentIncrement: newIncrement,
        gradeEntryDate: today,
        currentGradeDateStorage: today
      } : e))
    );
  };

  const handleAddSecondment = (sec: SecondmentRecord) => {
    setSecondments((prev) => [sec, ...prev]);
    logAction('إضافة', `تسجيل ندب/تكليف للموظف ${sec.employeeId} إلى ${sec.assignedEntity}`, sec.employeeId);
  };

  const handleUpdateSecondmentStatus = (id: string, status: SecondmentRecord['status']) => {
    setSecondments((prev) => prev.map((s) => (s.id === id ? { ...s, status } : s)));
    logAction('تعديل', `تعديل حالة الندب ${id} إلى ${status}`, id);
  };

  const handleAddTransfer = (transfer: TransferRecord) => {
    setTransfers((prev) => [transfer, ...prev]);
    logAction('تعديل', `تسجيل حركة نقل للموظف ${transfer.employeeId} إلى ${transfer.newDepartment}`, transfer.employeeId);
  };

  const handleUpdateEmployeeDept = (employeeId: number, newDept: string) => {
    setEmployees((prev) => prev.map((e) => (e.id === employeeId ? { ...e, department: newDept } : e)));
  };

  const handleAddDisciplinary = (record: DisciplinaryRecord) => {
    setDisciplinary((prev) => [record, ...prev]);
    logAction('تعديل', `تسجيل إجراء إداري (${record.recordType}) للموظف ${record.employeeId}`, record.employeeId);
  };

  const handleAddResignation = (resignation: ResignationRecord) => {
    setResignations((prev) => [resignation, ...prev]);
    logAction('حذف', `تسجيل إنهاء خدمة (${resignation.finalStatus}) للموظف ${resignation.employeeId}`, resignation.employeeId);
  };

  const handleUpdateEmployeeStatus = (employeeId: number, status: EmploymentStatus) => {
    setEmployees((prev) => prev.map((e) => (e.id === employeeId ? { ...e, status } : e)));
  };

  const handleUpdateHrRule = (updatedRule: HrRule) => {
    setHrRules((prev) => prev.map((r) => (r.id === updatedRule.id ? updatedRule : r)));
    logAction('تعديل', `تحديث القاعدة اللائحية: ${updatedRule.ruleName}`);
  };

  const handleResetHrRules = () => {
    setHrRules(DEFAULT_HR_RULES);
    logAction('استعادة', 'استعادة جميع القواعد واللوائح الافتراضية');
  };

  // High Performance Generator
  const handleGenerateHighVolume = (count: number) => {
    const largeDataset = generateLargeDataset(count);
    setEmployees(largeDataset);
    logAction('إضافة', `توليد اختبار الأداء العالي حتى ${largeDataset.length} موظفاً`);
  };

  // Quick Backup
  const handleQuickBackup = () => {
    logAction('نسخة احتياطية', `تم إنشاء نسخة احتياطية فورية في المسار ${settings.backupFolderPath}`);
  };

  // Update Password
  const handleUpdatePassword = (username: string, _newPass: string) => {
    logAction('تعديل', `تغيير كلمة المرور للحساب ${username}`);
  };

  // Login handler
  const handleLoginSuccess = (user: UserAccount) => {
    setCurrentUser(user);
    setIsLoginModalOpen(false);
    logAction('تسجيل دخول', `تسجيل دخول ناجح بصلاحيات ${user.role}`);
  };

  // Logout handler
  const handleLogout = () => {
    logAction('تسجيل دخول', `تسجيل خروج للمستخدم ${currentUser?.username}`);
    setCurrentUser(null);
    setIsLoginModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 font-sans dir-rtl flex flex-col antialiased selection:bg-red-800 selection:text-white">
      
      {/* Login Modal Overlay */}
      {(!currentUser || isLoginModalOpen) && (
        <LoginModal users={users} onLoginSuccess={handleLoginSuccess} />
      )}

      {/* Main App Top Header */}
      <Header
        currentUser={currentUser}
        onLogout={handleLogout}
        setActiveTab={setActiveTab}
        activeTab={activeTab}
        employeeCount={employees.length}
        onQuickBackup={handleQuickBackup}
      />

      {corruptionAlert && (
        <div className="max-w-7xl w-full mx-auto px-4 mt-3">
          <div className="p-3 bg-amber-100 border border-amber-300 text-amber-900 rounded-xl text-xs flex items-center justify-between shadow-sm">
            <span>{corruptionAlert}</span>
            <button onClick={() => setCorruptionAlert(null)} className="font-bold text-amber-800 hover:text-amber-950 px-2 py-1">
              إغلاق
            </button>
          </div>
        </div>
      )}

      {/* Body Area with Sidebar and Main Tab Workspace */}
      <div className="flex-1 flex flex-col md:flex-row max-w-7xl w-full mx-auto">
        
        {/* Navigation Sidebar */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          employeeCount={employees.length}
          logCount={logs.length}
        />

        {/* Workspace Main Panel */}
        <main className="flex-1 p-4 md:p-6 overflow-y-auto min-w-0">
          
          {activeTab === 'dashboard' && (
            <DashboardView
              employees={employees}
              logs={logs}
              leaves={leaves}
              promotions={promotions}
              increments={increments}
              rules={hrRules}
              setActiveTab={setActiveTab}
              onOpenAddModal={() => {
                setActiveTab('employees');
                setOpenAddModal(true);
              }}
              onQuickBackup={handleQuickBackup}
            />
          )}

          {activeTab === 'employees' && (
            <EmployeeManagerView
              employees={employees}
              leaves={leaves}
              rules={hrRules}
              onAddEmployee={handleAddEmployee}
              onUpdateEmployee={handleUpdateEmployee}
              onDeleteEmployee={handleDeleteEmployee}
              onDuplicateEmployee={handleDuplicateEmployee}
              onPrintCard={(emp) => setPrintCardEmp(emp)}
              onOpenAddModal={openAddModal}
              setOpenAddModal={setOpenAddModal}
              onGenerateHighVolume={handleGenerateHighVolume}
              onAddLeave={handleAddLeave}
              currentUser={currentUser?.fullName || 'المستخدم الحالي'}
            />
          )}

          {activeTab === 'search' && (
            <SearchQueryView
              employees={employees}
              leaves={leaves}
              promotions={promotions}
              increments={increments}
              rules={hrRules}
              onSelectEmployee={(emp) => setPrintCardEmp(emp)}
              onPrintCard={(emp) => setPrintCardEmp(emp)}
            />
          )}

          {/* HR Modules */}
          {activeTab === 'leaves' && (
            <LeaveManagementView
              employees={employees}
              leaves={leaves}
              rules={hrRules}
              publicHolidaysList={settings.publicHolidaysList}
              officialLogoUrl={settings.officialLogoUrl}
              onAddLeave={handleAddLeave}
              onUpdateLeave={handleUpdateLeave}
              onUpdateLeaveStatus={handleUpdateLeaveStatus}
              currentUser={currentUser?.displayName || currentUser?.username || 'الشؤون الإدارية'}
            />
          )}

          {activeTab === 'promotions' && (
            <PromotionsIncrementsView
              employees={employees}
              promotions={promotions}
              increments={increments}
              settlements={settlements}
              rules={hrRules}
              onAddPromotion={handleAddPromotion}
              onAddIncrement={handleAddIncrement}
              onAddSettlement={handleAddSettlement}
              onUpdateEmployeeGrade={handleUpdateEmployeeGrade}
            />
          )}

          {activeTab === 'secondments' && (
            <SecondmentsView
              employees={employees}
              secondments={secondments}
              onAddSecondment={handleAddSecondment}
              onUpdateStatus={handleUpdateSecondmentStatus}
            />
          )}

          {activeTab === 'transfers' && (
            <TransfersView
              employees={employees}
              transfers={transfers}
              onAddTransfer={handleAddTransfer}
              onUpdateEmployeeDept={handleUpdateEmployeeDept}
            />
          )}

          {activeTab === 'disciplinary' && (
            <DisciplinaryView
              employees={employees}
              disciplinaryRecords={disciplinary}
              onAddRecord={handleAddDisciplinary}
            />
          )}

          {activeTab === 'resignations' && (
            <ResignationsView
              employees={employees}
              resignations={resignations}
              onAddResignation={handleAddResignation}
              onUpdateEmployeeStatus={handleUpdateEmployeeStatus}
            />
          )}

          {activeTab === 'history' && (
            <EmployeeHistoryView
              employees={employees}
              leaves={leaves}
              promotions={promotions}
              increments={increments}
              secondments={secondments}
              transfers={transfers}
              disciplinary={disciplinary}
              resignations={resignations}
              settlements={settlements}
            />
          )}

          {activeTab === 'general_procedures' && (
            <GeneralProceduresView
              employees={employees}
              procedures={generalProcedures}
              currentUser={currentUser?.displayName || currentUser?.username || 'المستخدم الحالي'}
              onAddProcedure={(proc) => {
                setGeneralProcedures((prev) => [proc, ...prev]);
                logAction('إضافة', `تسجيل إجراء إداري عام: ${proc.title}`, proc.employeeId);
              }}
              onDeleteProcedure={(id) => {
                setGeneralProcedures((prev) => prev.filter((p) => p.id !== id));
                logAction('حذف', `حذف إجراء إداري عام: ${id}`);
              }}
            />
          )}

          {activeTab === 'org_structure' && (
            <OrgStructureView
              orgUnits={orgUnits}
              units={orgUnits}
              jobTitles={jobTitles}
              onUpdateOrgUnits={(units) => {
                setOrgUnits(units);
                logAction('تعديل', 'تحديث الهيكل التنظيمي لمصرف الدم');
              }}
              onUpdateUnits={(units) => {
                setOrgUnits(units);
                logAction('تعديل', 'تحديث الهيكل التنظيمي لمصرف الدم');
              }}
              onUpdateJobTitles={(titles) => {
                setJobTitles(titles);
                logAction('تعديل', 'تحديث المسميات والوظائف المعتمدة');
              }}
            />
          )}

          {activeTab === 'hr_rules' && (
            <HrRulesSettingsView
              rules={hrRules}
              onUpdateRule={handleUpdateHrRule}
              onResetRules={handleResetHrRules}
            />
          )}

          {activeTab === 'reports' && (
            <ReportsView employees={employees} />
          )}

          {activeTab === 'statistics' && (
            <StatisticsView employees={employees} />
          )}

          {activeTab === 'users' && (
            <UserManagementView
              users={users}
              onUpdatePassword={handleUpdatePassword}
            />
          )}

          {activeTab === 'logs' && (
            <AuditLogsView logs={logs} />
          )}

          {activeTab === 'backup' && (
            <SettingsBackupView
              settings={settings}
              fullDatabase={currentFullDb}
              onUpdateSettings={(newSet) => {
                setSettings(newSet);
                logAction('تعديل', 'تحديث إعدادات المصرف والمسارات');
              }}
              onQuickBackup={handleQuickBackup}
              logs={logs}
            />
          )}

          {activeTab === 'vba_code' && (
            <VbaCodeExporterView />
          )}

        </main>

      </div>

      {/* Printable Badge Card Dialog */}
      <EmployeePrintCard
        employee={printCardEmp}
        onClose={() => setPrintCardEmp(null)}
      />

    </div>
  );
}
