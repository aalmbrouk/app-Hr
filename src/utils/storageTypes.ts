import { 
  Employee, 
  UserAccount, 
  AuditLog, 
  SystemSettings,
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
  PromotionRule,
  BulkOperationRecord,
  CareerPromotionRecord,
  EmployeeQualificationRecord,
  AnnualPerformanceEvaluation,
  UnlinkedHistoricalCareerRecord
} from '../types';

export interface FullAppDatabase {
  version: number;
  lastUpdated: string;
  employees: Employee[];
  users: UserAccount[];
  logs: AuditLog[];
  settings: SystemSettings;
  leaves: LeaveTransaction[];
  promotions: PromotionRecord[];
  increments: IncrementRecord[];
  secondments: SecondmentRecord[];
  transfers: TransferRecord[];
  disciplinary: DisciplinaryRecord[];
  resignations: ResignationRecord[];
  settlements: StatusSettlementRecord[];
  generalProcedures: GeneralProcedure[];
  orgUnits: OrganizationalUnit[];
  jobTitles: JobTitle[];
  hrRules: HrRule[];
  promotionRules?: PromotionRule[];
  bulkOperations?: BulkOperationRecord[];
  careerRecords?: CareerPromotionRecord[];
  qualifications?: EmployeeQualificationRecord[];
  annualEvaluations?: AnnualPerformanceEvaluation[];
  unlinkedHistoricalRecords?: UnlinkedHistoricalCareerRecord[];
}

export interface ElectronStorageAPI {
  loadData: () => Promise<{ success: boolean; data?: FullAppDatabase; isFirstRun?: boolean; error?: string; corrupted?: boolean }>;
  saveData: (data: FullAppDatabase) => Promise<{ success: boolean; error?: string }>;
  exportBackup: (defaultFileName?: string, data?: FullAppDatabase) => Promise<{ success: boolean; filePath?: string; canceled?: boolean; error?: string }>;
  getAppInfo?: () => Promise<{ isElectron: boolean; userDataPath?: string }>;
}

declare global {
  interface Window {
    electronAPI?: ElectronStorageAPI;
  }
}
