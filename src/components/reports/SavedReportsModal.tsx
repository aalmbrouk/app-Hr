import React, { useState } from 'react';
import { SavedReportTemplate } from '../../types/reportBuilderTypes';
import { 
  loadSavedReportTemplates, 
  deleteReportTemplate, 
  duplicateReportTemplate,
  saveReportTemplate 
} from '../../utils/reportBuilderEngine';
import { Bookmark, Play, Copy, Trash2, X, Plus, Clock, FileText, CheckCircle2 } from 'lucide-react';
import { formatDateDisplay } from '../../utils/dateUtils';

interface SavedReportsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadTemplate: (template: SavedReportTemplate) => void;
  onSaveCurrentAsTemplate?: (name: string, description: string) => void;
  mode?: 'manage' | 'save_prompt';
}

export const SavedReportsModal: React.FC<SavedReportsModalProps> = ({
  isOpen,
  onClose,
  onLoadTemplate,
  onSaveCurrentAsTemplate,
  mode = 'manage'
}) => {
  const [templates, setTemplates] = useState<SavedReportTemplate[]>(loadSavedReportTemplates());
  const [searchQuery, setSearchQuery] = useState('');
  const [templateName, setTemplateName] = useState('');
  const [templateDesc, setTemplateDesc] = useState('');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleRefresh = () => {
    setTemplates(loadSavedReportTemplates());
  };

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`هل أنت متأكد من رغبتك في حذف النموذج المحفوظ (${name})؟`)) {
      const updated = deleteReportTemplate(id);
      setTemplates(updated);
    }
  };

  const handleDuplicate = (id: string) => {
    duplicateReportTemplate(id);
    handleRefresh();
  };

  const handleSaveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!templateName.trim()) return;

    if (onSaveCurrentAsTemplate) {
      onSaveCurrentAsTemplate(templateName.trim(), templateDesc.trim());
      setSaveSuccessMsg('تم حفظ نموذج التقرير بنجاح!');
      setTimeout(() => {
        setSaveSuccessMsg('');
        onClose();
      }, 1200);
    }
  };

  const filteredTemplates = templates.filter(t => 
    t.name.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
    (t.description && t.description.toLowerCase().includes(searchQuery.toLowerCase().trim()))
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-right">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-red-950/80 text-red-400 border border-red-800">
              <Bookmark className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">
                {mode === 'save_prompt' ? 'حفظ إعدادات التقرير كنموذج' : 'النماذج والتقارير المحفوظة'}
              </h3>
              <p className="text-xs text-slate-400">
                {mode === 'save_prompt' 
                  ? 'احفظ معايير وتخصيصات التقرير الحالية لإعادة استخدامها فورياً لاحقاً' 
                  : 'فتح وإدارة النماذج المحفوظة وتشغيلها على البيانات الحالية مباشرة'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Save Form Mode */}
        {mode === 'save_prompt' ? (
          <form onSubmit={handleSaveSubmit} className="p-6 space-y-4">
            {saveSuccessMsg ? (
              <div className="p-4 bg-emerald-950/60 border border-emerald-800 rounded-2xl text-center text-emerald-300 font-bold flex items-center justify-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span>{saveSuccessMsg}</span>
              </div>
            ) : (
              <>
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-300">
                    اسم النموذج <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: موظفو قسم الأطباء على رأس العمل"
                    value={templateName}
                    onChange={e => setTemplateName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500 font-bold"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-300">
                    وصف مختصر (اختياري)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="توضيح الغرض من التقرير أو المعايير المستخدمة..."
                    value={templateDesc}
                    onChange={e => setTemplateDesc(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
                  />
                </div>

                <div className="pt-4 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all cursor-pointer"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 rounded-xl bg-red-700 hover:bg-red-600 text-white text-xs font-bold shadow-lg transition-all border border-red-500 cursor-pointer flex items-center gap-2"
                  >
                    <Bookmark className="w-4 h-4" />
                    <span>حفظ النموذج الآن</span>
                  </button>
                </div>
              </>
            )}
          </form>
        ) : (
          /* Manage Templates Mode */
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Search */}
            <div className="p-4 border-b border-slate-800 bg-slate-900/60">
              <input
                type="text"
                placeholder="ابحث في النماذج المحفوظة..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
              />
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2.5 max-h-[50vh]">
              {filteredTemplates.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <Bookmark className="w-10 h-10 mx-auto text-slate-600 mb-2 opacity-50" />
                  <p className="text-xs">لا توجد نماذج تقارير محفوظة مطابقة.</p>
                </div>
              ) : (
                filteredTemplates.map(tmpl => (
                  <div
                    key={tmpl.id}
                    className="bg-slate-950/80 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-red-400 shrink-0" />
                        <h4 className="text-xs font-black text-white">{tmpl.name}</h4>
                      </div>
                      {tmpl.description && (
                        <p className="text-[11px] text-slate-400 pr-6">{tmpl.description}</p>
                      )}
                      <div className="text-[10px] text-slate-500 flex items-center gap-2 pr-6 pt-1 font-mono">
                        <Clock className="w-3 h-3 text-slate-600" />
                        <span>تحديث: {formatDateDisplay(tmpl.updatedAt?.slice(0, 10))}</span>
                        <span>•</span>
                        <span>الفلاتر: {tmpl.filterConditions?.length || 0}</span>
                        <span>•</span>
                        <span>الأعمدة: {tmpl.selectedColumnIds?.length || 0}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                      <button
                        type="button"
                        onClick={() => {
                          onLoadTemplate(tmpl);
                          onClose();
                        }}
                        className="px-3 py-1.5 rounded-xl bg-red-800 hover:bg-red-700 text-white font-bold text-xs transition-all flex items-center gap-1 cursor-pointer shadow-sm border border-red-600"
                        title="تشغيل التقرير على البيانات الحالية"
                      >
                        <Play className="w-3.5 h-3.5" />
                        <span>تشغيل</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDuplicate(tmpl.id)}
                        className="p-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 hover:text-white hover:border-slate-500 transition-all cursor-pointer"
                        title="نسخ النموذج"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete(tmpl.id, tmpl.name)}
                        className="p-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-400 hover:text-red-400 hover:border-red-900/60 transition-all cursor-pointer"
                        title="حذف النموذج"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
