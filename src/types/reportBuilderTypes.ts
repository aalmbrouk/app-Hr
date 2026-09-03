import { AssignmentCategory, EmploymentStatus, Gender } from '../types';

export type ReportType =
  | 'employees'              // تقرير الموظفين
  | 'career'                 // التقرير الوظيفي
  | 'promotions'             // تقرير الترقيات
  | 'increments'             // تقرير العلاوات الدورية
  | 'promotions_increments'  // تقرير الترقيات والعلاوات
  | 'secondment_grade'       // تقرير الندب على درجة
  | 'promotion_eligibility'  // تقرير استحقاق الترقيات
  | 'leaves'                 // تقرير الإجازات
  | 'qualifications'         // تقرير المؤهلات والدورات
  | 'outside_cadre'          // تقرير خارج الملاك الوظيفي
  | 'transfers'              // تقرير النقل
  | 'resignations'           // تقرير الاستقالات
  | 'end_of_service'         // تقرير نهاية الخدمة
  | 'disciplinary'           // تقرير الخصومات والإنذارات
  | 'general_procedures'     // تقرير الإجراءات العامة
  | 'custom';                // تقرير مخصص

export type EmployeeSelectionMode =
  | 'all'             // جميع الموظفين
  | 'specific'        // موظفون محددون
  | 'criteria'        // تحديد حسب معايير
  | 'all_except';     // الكل مع استثناء موظفين

export type FilterFieldType = 'text' | 'number' | 'date' | 'select' | 'boolean';

export type TextOperator =
  | 'equals'          // يساوي
  | 'not_equals'      // لا يساوي
  | 'contains'        // يحتوي على
  | 'starts_with'     // يبدأ بـ
  | 'ends_with';      // ينتهي بـ

export type NumberOperator =
  | 'equals'          // يساوي
  | 'greater_than'    // أكبر من
  | 'greater_equal'   // أكبر من أو يساوي
  | 'less_than'       // أصغر من
  | 'less_equal'      // أصغر من أو يساوي
  | 'between';        // بين قيمتين

export type DateOperator =
  | 'equals'          // يساوي
  | 'before'          // قبل
  | 'after'           // بعد
  | 'between'         // بين تاريخين
  | 'in_year'         // خلال السنة
  | 'in_month'        // خلال الشهر
  | 'last_30_days'    // آخر 30 يوم
  | 'last_90_days'    // آخر 90 يوم
  | 'current_year'    // السنة الحالية
  | 'previous_year';  // السنة السابقة

export type SelectOperator = 'equals' | 'not_equals' | 'in';

export interface FilterCondition {
  id: string;
  field: string;
  fieldType: FilterFieldType;
  operator: string;
  value: any;
  secondValue?: any; // For "between" ranges
  logicOperatorWithNext?: 'AND' | 'OR'; // الربط مع الشرط التالي
}

export interface ReportColumnConfig {
  id: string;
  label: string;
  category: 'personal' | 'job' | 'career' | 'qualifications' | 'leave' | 'admin';
  selected: boolean;
  order: number;
  width?: string;
  align?: 'right' | 'center' | 'left';
}

export interface SortCriteria {
  field: string;
  direction: 'asc' | 'desc';
}

export type GroupByField =
  | 'none'
  | 'department'
  | 'jobTitle'
  | 'jobGrade'
  | 'status'
  | 'hiringEntity'
  | 'qualification'
  | 'assignmentCategory';

export interface SavedReportTemplate {
  id: string;
  name: string;
  description?: string;
  reportType: ReportType;
  employeeSelectionMode: EmployeeSelectionMode;
  selectedEmployeeIds: number[];
  excludedEmployeeIds: number[];
  filterConditions: FilterCondition[];
  groupLogic: 'AND' | 'OR';
  selectedColumnIds: string[];
  sortCriteria: SortCriteria[];
  groupBy: GroupByField;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
}

export interface ReportSummaryStats {
  totalMatchingEmployees: number;
  activeFiltersCount: number;
  reportTypeName: string;
  dateRangeText?: string;
  selectedColumnsCount: number;
  groupedSectionsCount?: number;
}
