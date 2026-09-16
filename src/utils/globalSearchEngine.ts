import { Employee, CareerPromotionRecord } from '../types';

export interface GlobalSearchResult {
  employee: Employee;
  score: number;
  matchType: 
    | 'exact_national_id'
    | 'exact_job_number'
    | 'exact_name'
    | 'name_prefix'
    | 'name_partial'
    | 'department_location_assignment'
    | 'other_data';
  matchDescription?: string;
}

/**
 * Normalize Arabic text for robust search (removes diacritics, unifies alef, teh marbuta, etc.)
 */
export function normalizeArabicSearchText(str: string | number | undefined | null): string {
  if (str === undefined || str === null) return '';
  let s = String(str).trim().toLowerCase();

  // Convert eastern arabic numerals to western if present
  const easternNumerals = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  for (let i = 0; i < 10; i++) {
    s = s.split(easternNumerals[i]).join(String(i));
  }

  // Remove diacritics / tashkeel
  s = s.replace(/[\u064B-\u065F\u0670]/g, '');

  // Normalize alef variants
  s = s.replace(/[أإآآ]/g, 'ا');

  // Normalize teh marbuta & heh
  s = s.replace(/ة/g, 'ه');

  // Normalize yaa variants
  s = s.replace(/ى/g, 'ي');

  // Normalize redundant spaces
  s = s.replace(/\s+/g, ' ');

  return s;
}

/**
 * Universal Global Employee Search Engine
 * Adheres strictly to matching priorities:
 * 1. Exact National ID
 * 2. Exact Job/File Number
 * 3. Exact employee name
 * 4. Name beginning with the search text
 * 5. Partial name
 * 6. Department / workplace / assignment matches
 * 7. Other relevant data matches (Job title, Decision numbers, etc.)
 */
export function globalEmployeeSearch(
  query: string,
  employees: Employee[],
  careerRecords: CareerPromotionRecord[] = [],
  maxResults: number = 12
): GlobalSearchResult[] {
  if (!query || !query.trim()) {
    return [];
  }

  const rawTrimmed = query.trim();
  const normalizedQuery = normalizeArabicSearchText(rawTrimmed);
  if (!normalizedQuery) return [];

  // Group career records by employeeId for fast assignment / decision matching
  const careerByEmpId = new Map<number, CareerPromotionRecord[]>();
  for (const cr of careerRecords) {
    const list = careerByEmpId.get(cr.employeeId) || [];
    list.push(cr);
    careerByEmpId.set(cr.employeeId, list);
  }

  const results: GlobalSearchResult[] = [];

  for (const emp of employees) {
    const rawNatId = (emp.nationalId || '').trim();
    const rawJobNum = String(emp.jobNumber || '').trim();
    const normalizedName = normalizeArabicSearchText(emp.fullName);
    const normalizedDept = normalizeArabicSearchText(emp.department);
    const normalizedLoc = normalizeArabicSearchText(emp.workLocation);
    const normalizedTitle = normalizeArabicSearchText(emp.jobTitle);
    const normalizedQual = normalizeArabicSearchText(emp.qualification);
    const empCareer = careerByEmpId.get(emp.id) || [];

    let score = 0;
    let matchType: GlobalSearchResult['matchType'] | null = null;
    let matchDescription: string | undefined = undefined;

    // 1. Exact National ID
    if (rawNatId && rawNatId === rawTrimmed) {
      score = 1000;
      matchType = 'exact_national_id';
      matchDescription = `تطابق رقم وطني تام: ${rawNatId}`;
    }
    // 2. Exact Job/File Number
    else if (rawJobNum && rawJobNum === rawTrimmed) {
      score = 900;
      matchType = 'exact_job_number';
      matchDescription = `تطابق رقم وظيفي تام: ${rawJobNum}`;
    }
    // 3. Exact employee name
    else if (normalizedName === normalizedQuery) {
      score = 800;
      matchType = 'exact_name';
      matchDescription = 'تطابق تام للاسم';
    }
    // 4. Name beginning with the search text
    else if (normalizedName.startsWith(normalizedQuery)) {
      score = 700;
      matchType = 'name_prefix';
      matchDescription = 'يبدأ باسم الموظف';
    }
    // 5. Partial name (or all words in query present in name)
    else if (normalizedName.includes(normalizedQuery)) {
      score = 600;
      matchType = 'name_partial';
      matchDescription = 'اسم الموظف';
    } else {
      // Check multi-word name search (e.g. "أحمد علي" matches "أحمد محمد علي")
      const queryWords = normalizedQuery.split(' ').filter(Boolean);
      if (queryWords.length > 1 && queryWords.every(w => normalizedName.includes(w))) {
        score = 550;
        matchType = 'name_partial';
        matchDescription = 'تطابق كلمات الاسم';
      }
    }

    // If not matched by name or exact ID, check partial National ID or partial Job Number
    if (!matchType) {
      if (rawNatId && rawNatId.includes(rawTrimmed)) {
        score = 500;
        matchType = 'exact_national_id';
        matchDescription = `مطابقة جزئية للرقم الوطني: ${rawNatId}`;
      } else if (rawJobNum && rawJobNum.includes(rawTrimmed)) {
        score = 450;
        matchType = 'exact_job_number';
        matchDescription = `مطابقة جزئية للرقم الوظيفي: ${rawJobNum}`;
      }
    }

    // 6. Department / workplace / assignment matches
    if (!matchType) {
      if (normalizedDept.includes(normalizedQuery)) {
        score = 400;
        matchType = 'department_location_assignment';
        matchDescription = `القسم: ${emp.department}`;
      } else if (normalizedLoc.includes(normalizedQuery)) {
        score = 380;
        matchType = 'department_location_assignment';
        matchDescription = `مكان العمل: ${emp.workLocation}`;
      } else {
        // Check assignment in career records
        const assignmentRecord = empCareer.find(cr => 
          normalizeArabicSearchText(cr.assignmentTitle).includes(normalizedQuery) ||
          normalizeArabicSearchText(cr.assignmentRole).includes(normalizedQuery) ||
          normalizeArabicSearchText(cr.secondmentEntity).includes(normalizedQuery) ||
          normalizeArabicSearchText(cr.newWorkLocation).includes(normalizedQuery)
        );
        if (assignmentRecord) {
          score = 350;
          matchType = 'department_location_assignment';
          matchDescription = `التكليف/الجهة: ${assignmentRecord.assignmentTitle || assignmentRecord.secondmentEntity || assignmentRecord.newWorkLocation}`;
        }
      }
    }

    // 7. Other relevant data matches (Job Title, Decision Number, Qualification)
    if (!matchType) {
      if (normalizedTitle.includes(normalizedQuery)) {
        score = 300;
        matchType = 'other_data';
        matchDescription = `المسمى الوظيفي: ${emp.jobTitle}`;
      } else if (normalizedQual.includes(normalizedQuery)) {
        score = 280;
        matchType = 'other_data';
        matchDescription = `المؤهل: ${emp.qualification}`;
      } else {
        // Check decision numbers in career records
        const matchedDecision = empCareer.find(cr => 
          normalizeArabicSearchText(cr.decisionNumber).includes(normalizedQuery) ||
          normalizeArabicSearchText(cr.notes).includes(normalizedQuery)
        );
        if (matchedDecision) {
          score = 250;
          matchType = 'other_data';
          matchDescription = `قرار: ${matchedDecision.decisionNumber} (${matchedDecision.actionType})`;
        }
      }
    }

    if (matchType && score > 0) {
      results.push({
        employee: emp,
        score,
        matchType,
        matchDescription
      });
    }
  }

  // Sort by score descending (Priority 1 down to 7)
  results.sort((a, b) => b.score - a.score);

  return results.slice(0, maxResults);
}
