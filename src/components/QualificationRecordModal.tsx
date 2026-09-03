import React, { useState, useEffect } from 'react';
import { Employee, EmployeeQualificationRecord, QualificationRecordType } from '../types';
import { QUALIFICATION_RECORD_TYPES, EDUCATION_TYPES, EDUCATIONAL_DEGREES } from '../data/initialData';
import { 
  X, 
  GraduationCap, 
  Award, 
  Upload, 
  FileText, 
  Trash2, 
  Calendar, 
  Building2, 
  CheckCircle2, 
  AlertTriangle 
} from 'lucide-react';

interface QualificationRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee;
  recordToEdit?: EmployeeQualificationRecord | null;
  onSave: (record: EmployeeQualificationRecord) => void;
  currentUser?: string;
}

export const QualificationRecordModal: React.FC<QualificationRecordModalProps> = ({
  isOpen,
  onClose,
  employee,
  recordToEdit,
  onSave,
  currentUser = 'النظام'
}) => {
  const [formData, setFormData] = useState<Partial<EmployeeQualificationRecord>>({
    recordType: 'مؤهل علمي',
    title: '',
    specialization: '',
    issuingAuthority: '',
    executor: '',
    universityOrInstitute: '',
    educationType: 'جامعة عامة',
    graduationYear: new Date().getFullYear().toString(),
    completionDate: '',
    duration: '',
    certificateNumber: '',
    notes: '',
    documentPath: '',
    documentFileName: ''
  });

  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (recordToEdit) {
      setFormData({ ...recordToEdit });
    } else {
      setFormData({
        recordType: 'مؤهل علمي',
        title: '',
        specialization: employee.specialization || '',
        issuingAuthority: '',
        executor: '',
        universityOrInstitute: employee.university || '',
        educationType: (employee.educationType as any) || 'جامعة عامة',
        graduationYear: employee.graduationYear?.toString() || new Date().getFullYear().toString(),
        completionDate: '',
        duration: '',
        certificateNumber: '',
        notes: '',
        documentPath: '',
        documentFileName: ''
      });
    }
    setError(null);
  }, [recordToEdit, employee, isOpen]);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = () => {
      setFormData((prev) => ({
        ...prev,
        documentPath: reader.result as string,
        documentFileName: file.name
      }));
      setIsUploading(false);
    };
    reader.onerror = () => {
      setError('حدث خطأ أثناء تحميل الملف.');
      setIsUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveFile = () => {
    setFormData((prev) => ({
      ...prev,
      documentPath: '',
      documentFileName: ''
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title?.trim()) {
      setError('يرجى كتابة اسم المؤهل أو اسم الدورة التدريبية');
      return;
    }

    const record: EmployeeQualificationRecord = {
      id: formData.id || `QUAL-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      employeeId: employee.id,
      employeeName: employee.fullName,
      fileNumber: employee.jobNumber,
      recordType: formData.recordType || 'مؤهل علمي',
      title: formData.title.trim(),
      specialization: formData.specialization?.trim() || '',
      issuingAuthority: formData.issuingAuthority?.trim() || '',
      executor: formData.executor?.trim() || '',
      universityOrInstitute: formData.universityOrInstitute?.trim() || '',
      educationType: formData.educationType || 'غير منطبق',
      graduationYear: formData.graduationYear?.trim() || '',
      completionDate: formData.completionDate || '',
      duration: formData.duration?.trim() || '',
      certificateNumber: formData.certificateNumber?.trim() || '',
      notes: formData.notes?.trim() || '',
      documentPath: formData.documentPath || '',
      documentFileName: formData.documentFileName || '',
      createdBy: formData.createdBy || currentUser,
      createdAt: formData.createdAt || new Date().toISOString().replace('T', ' ').slice(0, 19),
      updatedAt: new Date().toISOString().replace('T', ' ').slice(0, 19)
    };

    onSave(record);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 overflow-y-auto animate-fadeIn text-right" dir="rtl">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-red-800 to-red-950 text-white flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/10 rounded-xl">
              <GraduationCap className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="font-extrabold text-base">
                {recordToEdit ? 'تعديل بيانات المؤهل / الدورة' : 'إضافة مؤهل علمي أو دورة تدريبية جديدة'}
              </h3>
              <p className="text-[11px] text-red-200">
                الموظف: <strong className="text-white">{employee.fullName}</strong> ({employee.jobNumber})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3 bg-red-50 border-b border-red-200 text-red-800 text-xs font-bold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 text-xs">
          {/* Record Type Selector */}
          <div>
            <label className="block font-bold text-gray-700 mb-1.5">
              نوع السجل *
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {QUALIFICATION_RECORD_TYPES.map((type) => (
                <button
                  type="button"
                  key={type}
                  onClick={() => setFormData({ ...formData, recordType: type })}
                  className={`py-2 px-2.5 rounded-xl border text-center font-bold text-xs transition cursor-pointer ${
                    formData.recordType === type
                      ? 'bg-red-700 text-white border-red-800 shadow-xs'
                      : 'bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-300'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
            {/* Title / Name */}
            <div className="sm:col-span-2">
              <label className="block font-bold text-gray-700 mb-1">
                {formData.recordType === 'دورة تدريبية' || formData.recordType === 'برنامج تدريبي'
                  ? 'اسم الدورة / البرنامج التدريبي *'
                  : 'اسم المؤهل العلمي / الشهادة *'}
              </label>
              <input
                type="text"
                required
                value={formData.title || ''}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder={
                  formData.recordType === 'دورة تدريبية'
                    ? 'مثال: دورة إدارة وتأكيد جودة بنوك الدم المتقدمة...'
                    : 'مثال: بكالوريوس تقنية مختبرات طبية / دبلوم عالي...'
                }
                className="w-full p-2.5 border rounded-lg font-bold bg-white text-gray-900 focus:ring-2 focus:ring-red-600 outline-none"
              />
            </div>

            {/* Specialization */}
            <div>
              <label className="block font-bold text-gray-700 mb-1">التخصص الدقيق</label>
              <input
                type="text"
                value={formData.specialization || ''}
                onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                placeholder="مثال: أمراض الدم، نقل الدم، محاسبة، تمريض..."
                className="w-full p-2.5 border rounded-lg bg-white focus:ring-2 focus:ring-red-600 outline-none"
              />
            </div>

            {/* University / Institute */}
            <div>
              <label className="block font-bold text-gray-700 mb-1">
                {formData.recordType === 'دورة تدريبية' || formData.recordType === 'برنامج تدريبي'
                  ? 'الجهة المنفذة / مكان التدريب'
                  : 'اسم الجامعة / الكلية / المعهد'}
              </label>
              <input
                type="text"
                value={formData.universityOrInstitute || formData.executor || ''}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  universityOrInstitute: e.target.value,
                  executor: e.target.value 
                })}
                placeholder="مثال: جامعة بنغازي / المركز الوطني لتطوير النظام الصحي..."
                className="w-full p-2.5 border rounded-lg bg-white focus:ring-2 focus:ring-red-600 outline-none"
              />
            </div>

            {/* Issuing Authority */}
            <div>
              <label className="block font-bold text-gray-700 mb-1">الجهة المانحة / المصدرة</label>
              <input
                type="text"
                value={formData.issuingAuthority || ''}
                onChange={(e) => setFormData({ ...formData, issuingAuthority: e.target.value })}
                placeholder="مثال: وزارة التعليم العالي / منظمة الصحة العالمية..."
                className="w-full p-2.5 border rounded-lg bg-white focus:ring-2 focus:ring-red-600 outline-none"
              />
            </div>

            {/* Education Type (for degrees) */}
            <div>
              <label className="block font-bold text-gray-700 mb-1">نوع التعليم</label>
              <select
                value={formData.educationType || 'جامعة عامة'}
                onChange={(e) => setFormData({ ...formData, educationType: e.target.value })}
                className="w-full p-2.5 border rounded-lg bg-white focus:ring-2 focus:ring-red-600 outline-none font-semibold"
              >
                {EDUCATION_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            {/* Graduation / Course Year */}
            <div>
              <label className="block font-bold text-gray-700 mb-1">
                {formData.recordType === 'دورة تدريبية' ? 'سنة إتمام الدورة' : 'سنة التخرج (4 أرقام)'}
              </label>
              <input
                type="text"
                maxLength={4}
                value={formData.graduationYear || ''}
                onChange={(e) => setFormData({ ...formData, graduationYear: e.target.value.replace(/\D/g, '') })}
                placeholder="مثال: 2023"
                className="w-full p-2.5 border rounded-lg font-mono bg-white focus:ring-2 focus:ring-red-600 outline-none"
              />
            </div>

            {/* Completion Date */}
            <div>
              <label className="block font-bold text-gray-700 mb-1">تاريخ الحصول عليه / تاريخ الانتهاء</label>
              <input
                type="date"
                value={formData.completionDate || ''}
                onChange={(e) => setFormData({ ...formData, completionDate: e.target.value })}
                className="w-full p-2.5 border rounded-lg bg-white focus:ring-2 focus:ring-red-600 outline-none font-mono"
              />
            </div>

            {/* Duration (For courses) */}
            <div>
              <label className="block font-bold text-gray-700 mb-1">المدة / عدد الساعات</label>
              <input
                type="text"
                value={formData.duration || ''}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                placeholder="مثال: 4 أسابيع (60 ساعة)، 3 أشهر..."
                className="w-full p-2.5 border rounded-lg bg-white focus:ring-2 focus:ring-red-600 outline-none"
              />
            </div>

            {/* Certificate / Document Number */}
            <div>
              <label className="block font-bold text-gray-700 mb-1">رقم الإفادة / رقم الشهادة</label>
              <input
                type="text"
                value={formData.certificateNumber || ''}
                onChange={(e) => setFormData({ ...formData, certificateNumber: e.target.value })}
                placeholder="مثال: CERT-2023-881"
                className="w-full p-2.5 border rounded-lg font-mono bg-white focus:ring-2 focus:ring-red-600 outline-none"
              />
            </div>

            {/* Notes */}
            <div className="sm:col-span-2">
              <label className="block font-bold text-gray-700 mb-1">ملاحظات إضافية</label>
              <input
                type="text"
                value={formData.notes || ''}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="تقدير التخرج، معادلة الشهادة، تفاصيل إضافية..."
                className="w-full p-2.5 border rounded-lg bg-white focus:ring-2 focus:ring-red-600 outline-none"
              />
            </div>
          </div>

          {/* Document Attachment Box */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2.5">
            <div className="flex justify-between items-center">
              <span className="font-bold text-gray-800 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-red-700" />
                <span>إرفاق وثيقة الشهادة أو إفادة التخرج / الدورة (PDF أو صورة)</span>
              </span>
              
              <label className="px-3 py-1.5 bg-red-700 hover:bg-red-800 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-xs cursor-pointer transition">
                <Upload className="w-3.5 h-3.5" />
                <span>{isUploading ? 'جاري التحميل...' : 'اختر ملف'}</span>
                <input
                  type="file"
                  accept=".pdf,image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={isUploading}
                />
              </label>
            </div>

            {formData.documentPath ? (
              <div className="flex items-center justify-between p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg">
                <div className="flex items-center gap-2 text-emerald-950 font-bold truncate">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="truncate">{formData.documentFileName || 'وثيقة_المؤهل_المرفقة.pdf'}</span>
                </div>
                <button
                  type="button"
                  onClick={handleRemoveFile}
                  className="text-rose-700 hover:text-rose-900 p-1 rounded hover:bg-rose-100 transition cursor-pointer"
                  title="إزالة الملف"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <p className="text-[11px] text-gray-500">
                لم يتم إرفاق مستند بعد. يمكنك إرفاق نسخة ضوئية من الإفادة أو الشهادة الرسمية.
              </p>
            )}
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-2.5 pt-3 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-red-700 hover:bg-red-800 text-white rounded-xl text-xs font-bold shadow-md transition cursor-pointer flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{recordToEdit ? 'حفظ التعديلات' : 'إضافة إلى السجل'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
