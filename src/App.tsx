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
  EmploymentStatus,
  BulkOperationRecord,
  CareerPromotionRecord,
  EmployeeQualificationRecord,
  AnnualPerformanceEvaluation,
  UnlinkedHistoricalCareerRecord,
  PromotionRule
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
  INITIAL_BULK_OPERATIONS,
  INITIAL_CAREER_RECORDS,
  DEMO_QUALIFICATIONS,
  INITIAL_QUALIFICATIONS,
  INITIAL_ANNUAL_EVALUATIONS,
  DEMO_ANNUAL_EVALUATIONS,
  generateLargeDataset 
} from './data/initialData';
import { DEFAULT_PROMOTION_RULES } from './utils/promotionEngine';
import { validateEmployeeIdentityStrict } from './utils/fakeRecordDetection';
import { FullAppDatabase } from './utils/storageTypes';
import { loadAppDatabase, saveAppDatabase } from './utils/storageService';
import { MigrationCommitResult } from './utils/excelMigrationUtils';
import { registerActiveDatabaseRecords, recalculateCurrentGrade } from './utils/gradeCalculationEngine';

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
import { BackupModal } from './components/BackupModal';
import { ExcelImportValidationCenter } from './components/ExcelImportValidationCenter';
import { HistoricalCareerAuditView } from './components/HistoricalCareerAuditView';

// HR Module Components
import { LeaveManagementView } from './components/LeaveManagementView';
import { PromotionsIncrementsView } from './components/PromotionsIncrementsView';
import { PerformanceEvaluationView } from './components/evaluations/PerformanceEvaluationView';
import { SecondmentsView } from './components/SecondmentsView';
import { TransfersView } from './components/TransfersView';
import { DisciplinaryView } from './components/DisciplinaryView';
import { ResignationsView } from './components/ResignationsView';
import { EmployeeHistoryView } from './components/EmployeeHistoryView';
import { HrRulesSettingsView } from './components/HrRulesSettingsView';
import { GeneralProceduresView } from './components/GeneralProceduresView';
import { OrgStructureView } from './components/OrgStructureView';
import { GlobalSearchResult } from './utils/globalSearchEngine';

export default function App() {
  // Authentication state
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(INITIAL_USERS[0]);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);

  // Active Tab Navigation
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');

  // Selected employee for quick profile opening from global search
  const [selectedEmployeeForProfileId, setSelectedEmployeeForProfileId] = useState<number | null>(null);

  const handleSelectEmployeeFromSearch = (emp: Employee) => {
    setSelectedEmployeeForProfileId(emp.id);
    setActiveTab('employees');
  };

  const handleSelectGlobalSearchResult = (result: GlobalSearchResult) => {
    if (result.category === 'employees' && result.employee) {
      handleSelectEmployeeFromSearch(result.employee);
      return;
    }

    if (result.actionType === 'open_modal' && result.id === 'tool_system_backup') {
      setIsBackupModalOpen(true);
      return;
    }

    if (result.actionType === 'open_modal' && result.id === 'report_employee_badge') {
      setActiveTab('employees');
      if (employees.length > 0) {
        setPrintCardEmp(employees[0]);
      }
      return;
    }

    if (result.targetTab) {
      setActiveTab(result.targetTab);
    }
  };

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
  const [bulkOperations, setBulkOperations] = useState<BulkOperationRecord[]>(INITIAL_BULK_OPERATIONS);
  const [careerRecords, setCareerRecords] = useState<CareerPromotionRecord[]>(INITIAL_CAREER_RECORDS);
  const [qualifications, setQualifications] = useState<EmployeeQualificationRecord[]>(DEMO_QUALIFICATIONS || []);
  const [annualEvaluations, setAnnualEvaluations] = useState<AnnualPerformanceEvaluation[]>(DEMO_ANNUAL_EVALUATIONS || INITIAL_ANNUAL_EVALUATIONS);
  const [unlinkedHistoricalRecords, setUnlinkedHistoricalRecords] = useState<UnlinkedHistoricalCareerRecord[]>([]);
  const [promotionRules, setPromotionRules] = useState<PromotionRule[]>(DEFAULT_PROMOTION_RULES);

  // UI Dialog / Modal States
  const [printCardEmp, setPrintCardEmp] = useState<Employee | null>(null);
  const [openAddModal, setOpenAddModal] = useState<boolean>(false);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState<boolean>(false);

  // Initial Load from Persistence Layer (Electron / Storage)
  useEffect(() => {
    let isMounted = true;
    loadAppDatabase().then((res) => {
      if (!isMounted) return;
      if (res.data) {
        if (res.data.employees) setEmployees(res.data.employees);
        if (res.data.users) setUsers(res.data.users);
        if (res.data.logs) {
          const seenIds = new Set<string>();
          let fallbackCounter = 1000;
          const sanitizedLogs = res.data.logs.map((log) => {
            let id = log.id;
            if (!id || seenIds.has(id)) {
              fallbackCounter++;
              id = `LOG-${fallbackCounter}`;
              while (seenIds.has(id)) {
                fallbackCounter++;
                id = `LOG-${fallbackCounter}`;
              }
            }
            seenIds.add(id);
            return { ...log, id };
          });
          setLogs(sanitizedLogs);
        }
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
        if (res.data.bulkOperations) setBulkOperations(res.data.bulkOperations);
        if (res.data.careerRecords) setCareerRecords(res.data.careerRecords);
        if (res.data.qualifications && res.data.qualifications.length > 0) {
          setQualifications(res.data.qualifications);
        }
        if (res.data.annualEvaluations && res.data.annualEvaluations.length > 0) {
          setAnnualEvaluations(res.data.annualEvaluations);
        }
        if (res.data.unlinkedHistoricalRecords && res.data.unlinkedHistoricalRecords.length > 0) {
          setUnlinkedHistoricalRecords(res.data.unlinkedHistoricalRecords);
        }
        if (res.data.promotionRules && res.data.promotionRules.length > 0) {
          setPromotionRules(res.data.promotionRules);
        }
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
    hrRules,
    bulkOperations,
    careerRecords,
    qualifications,
    annualEvaluations,
    unlinkedHistoricalRecords,
    promotionRules
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
    hrRules,
    bulkOperations,
    careerRecords,
    qualifications,
    annualEvaluations,
    unlinkedHistoricalRecords,
    promotionRules
  ]);

  // Synchronize active database state into gradeCalculationEngine single source of truth
  useEffect(() => {
    registerActiveDatabaseRecords({
      employees,
      careerRecords,
      promotions,
      increments,
      settlements,
      generalProcedures
    });
  }, [employees, careerRecords, promotions, increments, settlements, generalProcedures]);

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
    setLogs((prev) => {
      let maxNum = 1000;
      prev.forEach((l) => {
        const num = parseInt(l.id.replace(/\D/g, ''), 10);
        if (!isNaN(num) && num > maxNum) maxNum = num;
      });
      const uniqueId = `LOG-${maxNum + 1}`;
      const newLog: AuditLog = {
        id: uniqueId,
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
        user: currentUser ? currentUser.username : 'النظام',
        action,
        details,
        targetId
      };
      return [newLog, ...prev];
    });
  };

  // CRUD Handlers
  const handleAddEmployee = (newEmp: Employee) => {
    const valResult = validateEmployeeIdentityStrict(newEmp);
    if (!valResult.isValid) {
      console.error('Refused to add invalid employee:', valResult.error);
      return;
    }
    setEmployees((prev) => [newEmp, ...prev]);
    logAction('إضافة', `تمت إضافة موظف جديد: ${newEmp.fullName} (رقم: ${newEmp.id})`, newEmp.id);
  };

  const handleUpdateEmployee = (updatedEmp: Employee) => {
    const valResult = validateEmployeeIdentityStrict(updatedEmp);
    if (!valResult.isValid) {
      console.error('Refused to update invalid employee:', valResult.error);
      return;
    }
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
      nationalId: '' // Never generate fake sequential National ID; keep empty until verified
    };
    setEmployees((prev) => [duplicated, ...prev]);
    logAction('إضافة', `نسخ موظف من ${emp.fullName} إلى ${duplicated.fullName}`, duplicated.id);
  };

  // Atomic Excel Historical Migration Handler
  const handleImportMigrationResult = (result: MigrationCommitResult) => {
    setEmployees(result.employees);
    setCareerRecords(result.careerRecords);
    setPromotions(result.promotions);
    setIncrements(result.increments);
    setSettlements(result.settlements);
    logAction(
      'إضافة', 
      `ترحيل بيانات وسجلات تاريخية من Excel (منظومة جوجل مدمج): تم تسجيل/تحديث ${result.importedEmployeesCount + result.updatedEmployeesCount} موظف و ${result.importedHistoricalRecordsCount} حركة وظيفية تاريخية (نسخة احتياطية: ${result.backupKey})`
    );
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

  // Helper to synchronize employee current grade & status upon any career record change
  const syncEmployeeCareerStatus = (
    employeeId: number,
    updatedCareerRecords: CareerPromotionRecord[],
    updatedPromos: PromotionRecord[] = promotions,
    updatedIncs: IncrementRecord[] = increments,
    updatedSetts: StatusSettlementRecord[] = settlements
  ) => {
    const emp = employees.find((e) => e.id === employeeId);
    if (!emp) return;

    const { updatedEmployee } = recalculateCurrentGrade(
      emp,
      updatedCareerRecords,
      updatedPromos,
      updatedIncs,
      updatedSetts,
      generalProcedures
    );

    // Keep Original Appointment Data strictly unchanged (Requirement 1 & 7)
    const preservedEmp: Employee = {
      ...updatedEmployee,
      hireDate: emp.hireDate,
      appointmentGrade: emp.appointmentGrade,
      appointmentIncrements: emp.appointmentIncrements,
      appointmentSalarySystem: emp.appointmentSalarySystem,
      hiringEntity: emp.hiringEntity,
      directingDate: emp.directingDate
    };

    setEmployees((prev) => prev.map((e) => (e.id === employeeId ? preservedEmp : e)));
  };

  // Career Promotion & Increment & Secondment Records (Unified Architecture)
  const handleAddCareerRecord = (record: CareerPromotionRecord) => {
    const nextCareerRecords = [record, ...careerRecords];
    setCareerRecords(nextCareerRecords);

    let nextPromos = promotions;
    let nextIncs = increments;
    let nextSetts = settlements;

    // Keep individual module collections synchronized
    if (record.actionType === 'ترقية' || record.actionType === 'ترقية استثنائية') {
      const promo: PromotionRecord = {
        id: record.id,
        employeeId: record.employeeId,
        fileNumber: record.fileNumber,
        previousGrade: record.previousGrade,
        previousIncrement: record.previousIncrement,
        newGrade: record.newGrade,
        newIncrement: record.newIncrement,
        promotionType: record.actionType === 'ترقية استثنائية' ? 'ترقية استثنائية' : 'ترقية عادية',
        decisionNumber: record.decisionNumber,
        decisionDate: record.decisionDate,
        effectiveDate: record.actionDate,
        reason: record.notes || 'ترقية مسجلة بالمنظومة',
        notes: record.notes,
        createdBy: currentUser?.displayName || currentUser?.username || 'المستخدم',
        createdAt: record.createdAt
      };
      nextPromos = [promo, ...promotions];
      setPromotions(nextPromos);
    } else if (record.actionType === 'علاوة دورية' || record.actionType === 'علاوة سنوية') {
      const inc: IncrementRecord = {
        id: record.id,
        employeeId: record.employeeId,
        fileNumber: record.fileNumber,
        previousGrade: record.previousGrade,
        previousIncrement: record.previousIncrement,
        newIncrement: record.newIncrement,
        effectiveDate: record.actionDate,
        incrementType: 'تلقائية',
        decisionNumber: record.decisionNumber,
        notes: record.notes,
        createdBy: currentUser?.displayName || currentUser?.username || 'المستخدم',
        createdAt: record.createdAt
      };
      nextIncs = [inc, ...increments];
      setIncrements(nextIncs);
    } else if (record.actionType === 'تسوية وضع') {
      const setRecord: StatusSettlementRecord = {
        id: record.id,
        employeeId: record.employeeId,
        financialStatus: 'تسوية وضع وظيفي',
        grade: record.newGrade,
        jobTitle: 'تسوية مؤهل',
        effectiveDate: record.actionDate,
        decisionNumber: record.decisionNumber,
        reason: record.notes || 'تسوية وضع',
        notes: record.notes,
        createdBy: currentUser?.displayName || currentUser?.username || 'المستخدم',
        createdAt: record.createdAt
      };
      nextSetts = [setRecord, ...settlements];
      setSettlements(nextSetts);
    }

    // Recalculate employee current grade based on updated career timeline (Requirement 7)
    syncEmployeeCareerStatus(record.employeeId, nextCareerRecords, nextPromos, nextIncs, nextSetts);

    logAction(
      'إضافة', 
      `تسجيل إجراء وظيفي (${record.actionType}) للموظف (${record.employeeName || record.employeeId}) - قرار: ${record.decisionNumber} [الدرجة: ${record.newGrade} - علاوة ${record.newIncrement}]`, 
      record.employeeId
    );
  };

  const handleAddCareerRecords = (records: CareerPromotionRecord[]) => {
    if (!records || records.length === 0) return;
    const nextCareerRecords = [...records, ...careerRecords];
    setCareerRecords(nextCareerRecords);

    const newPromos: PromotionRecord[] = [];
    const newIncs: IncrementRecord[] = [];
    const newSetts: StatusSettlementRecord[] = [];

    records.forEach((record) => {
      if (record.actionType === 'ترقية' || record.actionType === 'ترقية استثنائية') {
        newPromos.push({
          id: record.id,
          employeeId: record.employeeId,
          fileNumber: record.fileNumber,
          previousGrade: record.previousGrade,
          previousIncrement: record.previousIncrement,
          newGrade: record.newGrade,
          newIncrement: record.newIncrement,
          promotionType: record.actionType === 'ترقية استثنائية' ? 'ترقية استثنائية' : 'ترقية عادية',
          decisionNumber: record.decisionNumber,
          decisionDate: record.decisionDate,
          effectiveDate: record.actionDate,
          reason: record.notes || 'ترقية مسجلة بالمنظومة',
          notes: record.notes,
          createdBy: currentUser?.displayName || currentUser?.username || 'المستخدم',
          createdAt: record.createdAt
        });
      } else if (record.actionType === 'علاوة دورية' || record.actionType === 'علاوة سنوية') {
        newIncs.push({
          id: record.id,
          employeeId: record.employeeId,
          fileNumber: record.fileNumber,
          previousGrade: record.previousGrade,
          previousIncrement: record.previousIncrement,
          newGrade: record.newGrade || record.previousGrade,
          newIncrement: record.newIncrement,
          incrementType: 'علاوة دورية',
          decisionNumber: record.decisionNumber,
          decisionDate: record.decisionDate,
          effectiveDate: record.actionDate,
          date: record.actionDate,
          notes: record.notes,
          createdBy: currentUser?.displayName || currentUser?.username || 'المستخدم',
          createdAt: record.createdAt
        });
      } else if (record.actionType === 'تسوية وضع') {
        newSetts.push({
          id: record.id,
          employeeId: record.employeeId,
          financialStatus: 'تسوية وضع وظيفي',
          grade: record.newGrade,
          jobTitle: 'تسوية مؤهل',
          effectiveDate: record.actionDate,
          decisionNumber: record.decisionNumber,
          reason: record.notes || 'تسوية وضع',
          notes: record.notes,
          createdBy: currentUser?.displayName || currentUser?.username || 'المستخدم',
          createdAt: record.createdAt
        });
      }
    });

    if (newPromos.length > 0) {
      setPromotions((prev) => [...newPromos, ...prev]);
    }
    if (newIncs.length > 0) {
      setIncrements((prev) => [...newIncs, ...prev]);
    }
    if (newSetts.length > 0) {
      setSettlements((prev) => [...newSetts, ...prev]);
    }

    logAction(
      'إضافة', 
      `تسجيل (${records.length}) درجات/حركات وظيفية بينية للموظف (${records[0].employeeName || records[0].employeeId})`, 
      records[0].employeeId
    );
  };

  const handleUpdateCareerRecord = (updatedRecord: CareerPromotionRecord) => {
    const prevRec = careerRecords.find((r) => r.id === updatedRecord.id);
    const nextCareerRecords = careerRecords.map((r) => (r.id === updatedRecord.id ? updatedRecord : r));
    setCareerRecords(nextCareerRecords);

    const nextPromos = promotions.map((p) => p.id === updatedRecord.id ? {
      ...p,
      previousGrade: updatedRecord.previousGrade,
      newGrade: updatedRecord.newGrade,
      previousIncrement: updatedRecord.previousIncrement,
      newIncrement: updatedRecord.newIncrement,
      effectiveDate: updatedRecord.actionDate,
      decisionDate: updatedRecord.decisionDate,
      decisionNumber: updatedRecord.decisionNumber,
      notes: updatedRecord.notes
    } : p);
    setPromotions(nextPromos);

    const nextIncs = increments.map((i) => i.id === updatedRecord.id ? {
      ...i,
      previousGrade: updatedRecord.previousGrade,
      newIncrement: updatedRecord.newIncrement,
      effectiveDate: updatedRecord.actionDate,
      decisionNumber: updatedRecord.decisionNumber,
      notes: updatedRecord.notes
    } : i);
    setIncrements(nextIncs);

    const nextSetts = settlements.map((s) => s.id === updatedRecord.id ? {
      ...s,
      grade: updatedRecord.newGrade,
      effectiveDate: updatedRecord.actionDate,
      decisionNumber: updatedRecord.decisionNumber,
      notes: updatedRecord.notes
    } : s);
    setSettlements(nextSetts);

    // Automatically recalculate employee current status upon edit (Requirement 6 & 7)
    syncEmployeeCareerStatus(updatedRecord.employeeId, nextCareerRecords, nextPromos, nextIncs, nextSetts);

    logAction(
      'تعديل', 
      `تعديل السجل الوظيفي (${updatedRecord.actionType} - قرار: ${updatedRecord.decisionNumber}) للموظف ${updatedRecord.employeeName || updatedRecord.employeeId} (الدرجة: ${prevRec?.newGrade || ''} ← ${updatedRecord.newGrade} - علاوة: ${prevRec?.newIncrement || 0} ← ${updatedRecord.newIncrement})`, 
      updatedRecord.employeeId
    );
  };

  const handleDeleteCareerRecord = (recordId: string) => {
    const rec = careerRecords.find((r) => r.id === recordId);
    const nextCareerRecords = careerRecords.filter((r) => r.id !== recordId);
    setCareerRecords(nextCareerRecords);

    const nextPromos = promotions.filter((p) => p.id !== recordId);
    setPromotions(nextPromos);
    const nextIncs = increments.filter((i) => i.id !== recordId);
    setIncrements(nextIncs);
    const nextSetts = settlements.filter((s) => s.id !== recordId);
    setSettlements(nextSetts);

    if (rec) {
      syncEmployeeCareerStatus(rec.employeeId, nextCareerRecords, nextPromos, nextIncs, nextSetts);
    }

    logAction('حذف', `حذف سجل وظيفي (${rec?.actionType || recordId} - قرار: ${rec?.decisionNumber || '—'})`, rec?.employeeId);
  };

  const handleAddPromotion = (promo: PromotionRecord) => {
    setPromotions((prev) => [promo, ...prev]);
    const emp = employees.find(e => e.id === promo.employeeId);
    logAction('تعديل', `تسجيل ترقية للموظف ${emp?.fullName || promo.employeeId} إلى ${promo.newGrade}`, promo.employeeId);
  };

  const handleAddIncrement = (inc: IncrementRecord) => {
    setIncrements((prev) => [inc, ...prev]);
    const emp = employees.find(e => e.id === inc.employeeId);
    logAction(
      'تعديل', 
      `منح علاوة سنوية (${inc.newIncrement}) للموظف ${emp?.fullName || inc.employeeId} - [تاريخ الدرجة الحالية محفوظ: ${emp?.gradeEntryDate || 'غير محدد'}]`, 
      inc.employeeId
    );
  };

  const handleAddSettlement = (settle: StatusSettlementRecord) => {
    setSettlements((prev) => [settle, ...prev]);
    const emp = employees.find(e => e.id === settle.employeeId);
    logAction('تعديل', `تسوية وضع وظيفي للموظف ${emp?.fullName || settle.employeeId} إلى ${settle.grade}`, settle.employeeId);
  };

  // Promotion / Grade change: updates grade and sets the new grade effective date
  const handleUpdateEmployeeGrade = (
    employeeId: number, 
    newGrade: string, 
    newIncrement: number, 
    newGradeDate?: string
  ) => {
    const today = new Date().toISOString().slice(0, 10);
    const effectiveDate = newGradeDate || today;
    setEmployees((prev) =>
      prev.map((e) => {
        if (e.id !== employeeId) return e;
        const isGradeChanged = e.jobGrade !== newGrade;
        return {
          ...e,
          jobGrade: newGrade,
          financialGrade: newGrade,
          currentIncrement: newIncrement,
          // Only update gradeEntryDate if the job grade actually changed or explicit new date was supplied
          gradeEntryDate: isGradeChanged ? effectiveDate : (e.gradeEntryDate || effectiveDate),
          currentGradeDateStorage: isGradeChanged ? effectiveDate : (e.currentGradeDateStorage || e.gradeEntryDate || effectiveDate)
        };
      })
    );
  };

  // Dedicated Annual Increment update: strictly READ-ONLY regarding historical gradeEntryDate
  const handleUpdateEmployeeIncrement = (
    employeeId: number, 
    newIncrement: number, 
    nextEligibilityDate?: string
  ) => {
    setEmployees((prev) =>
      prev.map((e) => {
        if (e.id !== employeeId) return e;
        return {
          ...e,
          currentIncrement: newIncrement,
          eligibilityDate: nextEligibilityDate || e.eligibilityDate
          // CORE RULE: gradeEntryDate and currentGradeDateStorage MUST REMAIN COMPLETELY UNTOUCHED!
        };
      })
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
    logAction('تعديل', `تسجيل إجراء إداري (${record.recordType || record.actionType}) للموظف ${record.employeeId}`, record.employeeId);
  };

  const handleUpdateDisciplinary = (record: DisciplinaryRecord) => {
    setDisciplinary((prev) => prev.map((d) => (d.id === record.id ? record : d)));
    logAction('تعديل', `تعديل/تحديث خطاب أو إجراء إداري (${record.recordType || record.actionType}) للموظف ${record.employeeId}`, record.employeeId);
  };

  const handleDeleteDisciplinary = (id: string) => {
    setDisciplinary((prev) => prev.filter((d) => d.id !== id));
    logAction('حذف', `حذف سجل إجراء تأديبي/خصم رقم ${id}`);
  };

  const handleAddResignation = (resignation: ResignationRecord) => {
    setResignations((prev) => [resignation, ...prev]);
    const emp = employees.find((e) => e.id === resignation.employeeId);
    const actionLabel = resignation.actionType || (resignation.finalStatus === 'منقول خارجياً' ? 'نقل خارجي' : 'إنهاء خدمة');
    const destText = resignation.destinationEntity ? ` إلى (${resignation.destinationEntity})` : '';
    logAction(
      'تعديل', 
      `تسجيل ${actionLabel} للموظف (${emp?.fullName || resignation.employeeId})${destText} - الحالة: (${resignation.finalStatus}) [خارج الملاك الوظيفي]`, 
      resignation.employeeId
    );
  };

  const handleUpdateEmployeeStatus = (
    employeeId: number, 
    status: EmploymentStatus,
    extraData?: Partial<Employee>
  ) => {
    setEmployees((prev) =>
      prev.map((e) => {
        if (e.id !== employeeId) return e;
        return {
          ...e,
          status,
          isOutsideCadre: status === 'منقول خارجياً' || status === 'مستقيل' || status === 'منهي خدماته' || status === 'متقاعد' || status === 'متوفى',
          ...(extraData || {})
        };
      })
    );
  };

  const handleRevertResignation = (
    resignationId: string,
    employeeId: number,
    reason: string,
    restoredStatus: EmploymentStatus = 'على رأس العمل'
  ) => {
    const emp = employees.find((e) => e.id === employeeId);
    const now = new Date().toISOString();
    const user = currentUser?.displayName || currentUser?.username || 'المسؤول';

    setResignations((prev) =>
      prev.map((r) => {
        if (r.id === resignationId) {
          return {
            ...r,
            isReversed: true,
            reversedAt: now,
            reversedBy: user,
            reversalReason: reason
          };
        }
        return r;
      })
    );

    setEmployees((prev) =>
      prev.map((e) => {
        if (e.id === employeeId) {
          return {
            ...e,
            status: restoredStatus,
            isOutsideCadre: false,
            transferredTo: undefined
          };
        }
        return e;
      })
    );

    logAction(
      'تراجع',
      `التراجع عن الإجراء (${resignationId}) واستعادة الموظف (${emp?.fullName || employeeId}) إلى الملاك النشط بحالة (${restoredStatus}) - السبب: ${reason}`,
      employeeId
    );
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

  // Quick Backup (Opens the dedicated Backup & Restore Center Modal)
  const handleQuickBackup = () => {
    setIsBackupModalOpen(true);
  };

  // Full Database Restore Completion Handler
  const handleRestoreComplete = (restoredDb: FullAppDatabase, _message: string) => {
    if (restoredDb.employees) setEmployees(restoredDb.employees);
    if (restoredDb.users) setUsers(restoredDb.users);
    if (restoredDb.leaves) setLeaves(restoredDb.leaves);
    if (restoredDb.promotions) setPromotions(restoredDb.promotions);
    if (restoredDb.increments) setIncrements(restoredDb.increments);
    if (restoredDb.secondments) setSecondments(restoredDb.secondments);
    if (restoredDb.transfers) setTransfers(restoredDb.transfers);
    if (restoredDb.disciplinary) setDisciplinary(restoredDb.disciplinary);
    if (restoredDb.resignations) setResignations(restoredDb.resignations);
    if (restoredDb.settlements) setSettlements(restoredDb.settlements);
    if (restoredDb.generalProcedures) setGeneralProcedures(restoredDb.generalProcedures);
    if (restoredDb.orgUnits) setOrgUnits(restoredDb.orgUnits);
    if (restoredDb.jobTitles) setJobTitles(restoredDb.jobTitles);
    if (restoredDb.hrRules) setHrRules(restoredDb.hrRules);
    if (restoredDb.settings) setSettings(restoredDb.settings);
    if (restoredDb.logs) setLogs(restoredDb.logs);
    if (restoredDb.careerRecords) setCareerRecords(restoredDb.careerRecords);
    if (restoredDb.qualifications) setQualifications(restoredDb.qualifications);
    if (restoredDb.unlinkedHistoricalRecords) setUnlinkedHistoricalRecords(restoredDb.unlinkedHistoricalRecords);
    if (restoredDb.promotionRules) setPromotionRules(restoredDb.promotionRules);

    // Save immediately to persistent storage
    saveAppDatabase(restoredDb);
  };

  const handleUpdatePromotionRules = (rules: PromotionRule[]) => {
    setPromotionRules(rules);
    logAction('تعديل', `تحديث جدول قواعد وضوابط الترقيات الإدارية (${rules.length} قواعد)`);
  };

  // Qualification Handlers
  const handleAddQualification = (record: EmployeeQualificationRecord) => {
    setQualifications((prev) => [record, ...prev]);
    logAction('إضافة', `إضافة ${record.recordType} (${record.title}) للموظف ${record.employeeName}`, record.employeeId);
  };

  const handleUpdateQualification = (record: EmployeeQualificationRecord) => {
    setQualifications((prev) => prev.map((q) => q.id === record.id ? record : q));
    logAction('تعديل', `تعديل ${record.recordType} (${record.title}) للموظف ${record.employeeName}`, record.employeeId);
  };

  const handleDeleteQualification = (id: string) => {
    const qual = qualifications.find((q) => q.id === id);
    setQualifications((prev) => prev.filter((q) => q.id !== id));
    if (qual) {
      logAction('حذف', `حذف ${qual.recordType} (${qual.title}) للموظف ${qual.employeeName}`, qual.employeeId);
    }
  };

  const handleBatchUpdateEmployees = (updatedEmployees: Employee[]) => {
    setEmployees(updatedEmployees);
  };

  const handleRecordBulkOperation = (op: BulkOperationRecord) => {
    setBulkOperations((prev) => [op, ...prev]);
    logAction('إجراء جماعي', `تنفيذ عملية جماعية: ${op.actionName} (${op.operationCode})`);
  };

  const handleRevertBulkOperation = (
    operation: BulkOperationRecord, 
    restoredEmployees: Employee[], 
    undoRecord: BulkOperationRecord, 
    reason: string
  ) => {
    setEmployees(restoredEmployees);
    setBulkOperations((prev) => [
      undoRecord,
      ...prev.map((op) => (op.id === operation.id ? { ...op, undone: true, undoneAt: undoRecord.executedAt, undoneBy: undoRecord.executedBy, undoReason: reason, status: 'REVERTED' as const } : op))
    ]);
    logAction('تراجع', `التراجع عن العملية الجماعية (${operation.operationCode}): ${reason}`);
  };

  // Annual Performance Evaluation Handlers
  const handleSaveAnnualEvaluation = (evaluation: AnnualPerformanceEvaluation) => {
    setAnnualEvaluations((prev) => {
      const idx = prev.findIndex((e) => e.id === evaluation.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = evaluation;
        return next;
      }
      return [evaluation, ...prev];
    });
    logAction('تقرير كفاءة سنوي', `حفظ تقرير كفاءة سنوي للموظف ${evaluation.employeeName} لسنة ${evaluation.evaluationYear}`, evaluation.employeeId);
  };

  const handleBatchSaveAnnualEvaluations = (newEvals: AnnualPerformanceEvaluation[]) => {
    setAnnualEvaluations((prev) => {
      const existingMap = new Map(prev.map(e => [e.id, e]));
      for (const ev of newEvals) {
        existingMap.set(ev.id, ev);
      }
      return Array.from(existingMap.values());
    });
    logAction('تقرير كفاءة سنوي', `توليد تقارير كفاءة سنوية مجمعة لعدد ${newEvals.length} موظف`);
  };

  const handleDeleteAnnualEvaluation = (id: string) => {
    const target = annualEvaluations.find(e => e.id === id);
    setAnnualEvaluations((prev) => prev.filter((e) => e.id !== id));
    logAction('حذف', `حذف تقرير كفاءة سنوي: ${id}`, target?.employeeId);
  };

  // Update Password
  const handleUpdatePassword = (username: string, newPass: string) => {
    setUsers((prev) =>
      prev.map((u) => (u.username === username ? { ...u, password: newPass } : u))
    );
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
        employees={employees}
        careerRecords={careerRecords}
        onSelectEmployee={handleSelectEmployeeFromSearch}
        onSelectResult={handleSelectGlobalSearchResult}
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
              onUpdateLeaveStatus={handleUpdateLeaveStatus}
              onUpdateEmployeeStatus={handleUpdateEmployeeStatus}
              onAddAuditLog={(act, det, id) => logAction(act as any, det, id)}
            />
          )}

          {activeTab === 'employees' && (
            <EmployeeManagerView
              employees={employees}
              leaves={leaves}
              increments={increments}
              promotions={promotions}
              settlements={settlements}
              generalProcedures={generalProcedures}
              careerRecords={careerRecords}
              qualifications={qualifications}
              evaluations={annualEvaluations}
              transfers={transfers}
              secondments={secondments}
              disciplinary={disciplinary}
              resignations={resignations}
              rules={hrRules}
              fullDatabase={currentFullDb}
              onCleanupComplete={handleRestoreComplete}
              onAddEmployee={handleAddEmployee}
              onUpdateEmployee={handleUpdateEmployee}
              onDeleteEmployee={handleDeleteEmployee}
              onDuplicateEmployee={handleDuplicateEmployee}
              onPrintCard={(emp) => setPrintCardEmp(emp)}
              onOpenAddModal={openAddModal}
              setOpenAddModal={setOpenAddModal}
              onGenerateHighVolume={handleGenerateHighVolume}
              onAddLeave={handleAddLeave}
              onAddIncrement={handleAddIncrement}
              onUpdateEmployeeIncrement={handleUpdateEmployeeIncrement}
              onAddQualification={handleAddQualification}
              onUpdateQualification={handleUpdateQualification}
              onDeleteQualification={handleDeleteQualification}
              onSaveEvaluation={handleSaveAnnualEvaluation}
              onDeleteEvaluation={handleDeleteAnnualEvaluation}
              onAddCareerRecord={handleAddCareerRecord}
              onAddCareerRecords={handleAddCareerRecords}
              onUpdateCareerRecord={handleUpdateCareerRecord}
              onDeleteCareerRecord={handleDeleteCareerRecord}
              onImportComplete={handleImportMigrationResult}
              onNavigateToTab={(t) => setActiveTab(t as any)}
              currentUser={currentUser?.fullName || currentUser?.displayName || currentUser?.username || 'المستخدم الحالي'}
              generalManagerName={settings.generalManagerName || 'نجيب صالح سالم'}
              officialLogoUrl={settings.officialLogoUrl}
              selectedEmployeeId={selectedEmployeeForProfileId}
              onClearSelectedEmployee={() => setSelectedEmployeeForProfileId(null)}
            />
          )}

          {activeTab === 'annual_evaluations' && (
            <PerformanceEvaluationView
              employees={employees}
              evaluations={annualEvaluations}
              careerRecords={careerRecords}
              promotions={promotions}
              generalManagerName={settings.generalManagerName || 'نجيب صالح سالم'}
              officialLogoUrl={settings.officialLogoUrl}
              currentUser={currentUser?.displayName || currentUser?.username || 'المسؤول'}
              onSaveEvaluation={handleSaveAnnualEvaluation}
              onBatchSaveEvaluations={handleBatchSaveAnnualEvaluations}
              onDeleteEvaluation={handleDeleteAnnualEvaluation}
              onAddAuditLog={(action, details, employeeId) => logAction(action, details, employeeId)}
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
              careerRecords={careerRecords}
              rules={hrRules}
              promotionRules={promotionRules}
              annualEvaluations={annualEvaluations}
              onUpdatePromotionRules={handleUpdatePromotionRules}
              onAddPromotion={handleAddPromotion}
              onAddIncrement={handleAddIncrement}
              onAddSettlement={handleAddSettlement}
              onAddCareerRecord={handleAddCareerRecord}
              onUpdateCareerRecord={handleUpdateCareerRecord}
              onDeleteCareerRecord={handleDeleteCareerRecord}
              onUpdateEmployeeGrade={handleUpdateEmployeeGrade}
              onUpdateEmployeeIncrement={handleUpdateEmployeeIncrement}
              onImportComplete={handleImportMigrationResult}
              generalManagerName={settings.hospitalName ? 'نجيب صالح سالم' : 'نجيب صالح سالم'}
              officialLogoUrl={settings.logoUrl}
              currentUser={currentUser?.fullName || currentUser?.displayName || currentUser?.username || 'المستخدم الحالي'}
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
              onUpdateRecord={handleUpdateDisciplinary}
              onDeleteRecord={handleDeleteDisciplinary}
              currentUser={currentUser?.displayName || currentUser?.username || 'شؤون الموظفين'}
              generalManagerName={settings.hospitalName ? 'نجيب صالح سالم' : 'نجيب صالح سالم'}
              officialLogoUrl={settings.logoUrl}
            />
          )}

          {activeTab === 'resignations' && (
            <ResignationsView
              employees={employees}
              resignations={resignations}
              onAddResignation={handleAddResignation}
              onUpdateEmployeeStatus={handleUpdateEmployeeStatus}
              onRevertResignation={handleRevertResignation}
              onAddAuditLog={(log) => setLogs((prev) => [log, ...prev])}
              currentUser={currentUser?.displayName || currentUser?.username || 'المسؤول'}
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
              careerRecords={careerRecords}
            />
          )}

          {activeTab === 'general_procedures' && (
            <GeneralProceduresView
              employees={employees}
              procedures={generalProcedures}
              increments={increments}
              careerRecords={careerRecords}
              promotions={promotions}
              settlements={settlements}
              secondments={secondments}
              transfers={transfers}
              leaves={leaves}
              disciplinary={disciplinary}
              resignations={resignations}
              qualifications={qualifications}
              evaluations={annualEvaluations}
              bulkOperations={bulkOperations}
              fullDatabase={currentFullDb}
              users={users}
              currentUser={currentUser?.displayName || currentUser?.username || 'المستخدم الحالي'}
              onAddProcedure={(proc) => {
                setGeneralProcedures((prev) => [proc, ...prev]);
                logAction('إضافة', `تسجيل إجراء إداري عام: ${proc.description || proc.procedureNumber}`, proc.employeeId);
              }}
              onDeleteProcedure={(id) => {
                setGeneralProcedures((prev) => prev.filter((p) => p.id !== id));
                logAction('حذف', `حذف إجراء إداري عام: ${id}`);
              }}
              onAddIncrement={handleAddIncrement}
              onUpdateEmployeeIncrement={handleUpdateEmployeeIncrement}
              onBatchUpdateEmployees={handleBatchUpdateEmployees}
              onRecordBulkOperation={handleRecordBulkOperation}
              onRevertBulkOperation={handleRevertBulkOperation}
              onAddAuditLog={(log) => setLogs((prev) => [log, ...prev])}
              onUpdateEmployee={handleUpdateEmployee}
              onCleanupComplete={handleRestoreComplete}
              onImportComplete={handleImportMigrationResult}
              onQuickBackup={handleQuickBackup}
              onOpenBackupModal={() => setIsBackupModalOpen(true)}
              onNavigateToTab={(tabName) => setActiveTab(tabName as any)}
            />
          )}

          {activeTab === 'historical_418' && (
            <HistoricalCareerAuditView
              employees={employees}
              careerRecords={careerRecords}
              unlinkedHistoricalRecords={unlinkedHistoricalRecords}
              fullDatabase={currentFullDb}
              onUpdateDatabase={(updatedDb) => {
                handleRestoreComplete(updatedDb, 'ترحيل وتثبيت سجلات اللائحة 418 التاريخية');
                logAction('إضافة', 'ترحيل وتثبيت سجلات المسار الوظيفي التاريخية / اللائحة 418');
              }}
              onNavigateToEmployee={(empId) => {
                setActiveTab('employees');
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
            <ReportsView
              employees={employees}
              leaves={leaves}
              promotions={promotions}
              increments={increments}
              secondments={secondments}
              transfers={transfers}
              disciplinary={disciplinary}
              resignations={resignations}
              settlements={settlements}
              careerRecords={careerRecords}
              qualifications={qualifications}
              generalProcedures={generalProcedures}
              hrRules={hrRules}
              settings={settings}
              officialLogoUrl={settings?.officialLogoUrl}
              currentUser={currentUser?.displayName || currentUser?.username || 'المسؤول'}
              onAddAuditLog={(action, details, employeeId) => logAction(action, details, employeeId)}
              onNavigateToTab={(tab) => setActiveTab(tab)}
            />
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
              onOpenBackupModal={() => setIsBackupModalOpen(true)}
              onRestoreComplete={handleRestoreComplete}
              onLogAudit={logAction}
              currentUsername={currentUser ? currentUser.username : 'النظام'}
              onCommitImport={(newDb, logMsg) => {
                handleRestoreComplete(newDb, logMsg);
              }}
            />
          )}

          {activeTab === 'excel_validation' && (
            <ExcelImportValidationCenter
              fullDatabase={currentFullDb}
              onCommitImport={(newDb, logMsg) => {
                handleRestoreComplete(newDb, logMsg);
              }}
              onLogAudit={logAction}
              currentUsername={currentUser ? currentUser.username : 'النظام'}
            />
          )}

          {activeTab === 'vba_code' && (
            <VbaCodeExporterView />
          )}

        </main>

      </div>

      {/* Dedicated Comprehensive Backup & Restore Center Modal */}
      <BackupModal
        isOpen={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
        fullDatabase={currentFullDb}
        currentUsername={currentUser ? currentUser.username : 'النظام'}
        onRestoreComplete={handleRestoreComplete}
        onLogAudit={logAction}
      />

      {/* Printable Badge Card Dialog */}
      <EmployeePrintCard
        employee={printCardEmp}
        onClose={() => setPrintCardEmp(null)}
      />

    </div>
  );
}
