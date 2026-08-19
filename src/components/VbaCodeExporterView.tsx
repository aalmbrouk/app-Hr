import React, { useState } from 'react';
import { VBA_MODULES, VbaModule } from '../data/vbaCodeStore';
import { FileCode, Copy, Check, Download, BookOpen, Layers, Code, Sparkles, Terminal, FileCheck } from 'lucide-react';

export const VbaCodeExporterView: React.FC = () => {
  const [selectedModuleId, setSelectedModuleId] = useState<string>(VBA_MODULES[0].id);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const activeModule = VBA_MODULES.find((m) => m.id === selectedModuleId) || VBA_MODULES[0];

  const handleCopyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDownloadFile = (mod: VbaModule) => {
    const blob = new Blob([mod.code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = mod.filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadAllGuide = () => {
    let combinedText = `===============================================================================\n`;
    combinedText += `   مصرف الدم المركزي بلدية المرج - ليبيا | دليل التشييد البرمجي وأكواد VBA الكاملة\n`;
    combinedText += `===============================================================================\n\n`;

    VBA_MODULES.forEach((mod) => {
      combinedText += `\n' --- FILE: ${mod.filename} (${mod.title}) ---\n`;
      combinedText += mod.code + `\n\n`;
    });

    const blob = new Blob([combinedText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `VBA_Complete_SourceCode_BloodBank_Marj.bas`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-amber-950 via-slate-900 to-amber-950 border border-amber-800/80 rounded-2xl p-6 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-amber-500 text-slate-950 shadow-lg font-black">
            <FileCode className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl font-black text-amber-200">
              مركز أكواد Microsoft Excel VBA الكاملة (Source Code Repository)
            </h2>
            <p className="text-xs text-amber-100/80 mt-1 max-w-2xl leading-relaxed">
              جميع الوحدات النمطية (Modules)، الفئات (Classes)، النماذج (UserForms)، والماكرو جاهزة تماماً للنسخ والتنفيذ المباشر داخل برنامج Excel 2016 / 2019 / 2021 / Office 365.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <button
            onClick={handleDownloadAllGuide}
            className="w-full md:w-auto px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-xl transition-all border border-amber-300 flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>تنزيل جميع الأكواد في ملف واحد (.bas)</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Code Navigation & Viewer */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Left: Files List Sidebar */}
        <div className="space-y-2 bg-slate-900 border border-slate-800 rounded-2xl p-3 shadow-xl">
          <div className="p-2 text-xs font-bold text-amber-400 border-b border-slate-800 mb-2 flex items-center gap-2">
            <Layers className="w-4 h-4" />
            <span>ملفات وحدات VBA</span>
          </div>

          <div className="space-y-1">
            {VBA_MODULES.map((mod) => {
              const isSelected = selectedModuleId === mod.id;
              return (
                <button
                  key={mod.id}
                  onClick={() => setSelectedModuleId(mod.id)}
                  className={`w-full text-right p-3 rounded-xl text-xs font-bold transition-all border flex items-center justify-between ${
                    isSelected
                      ? 'bg-amber-500/20 text-amber-200 border-amber-500/50 shadow-md'
                      : 'bg-slate-950/60 hover:bg-slate-800 text-slate-400 border-slate-800 hover:text-slate-200'
                  }`}
                >
                  <div className="truncate">
                    <p className="font-mono text-white text-[11px] font-extrabold">{mod.filename}</p>
                    <p className="text-[10px] text-slate-400 truncate">{mod.type}</p>
                  </div>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                    {mod.type}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Code Display Window */}
        <div className="lg:col-span-3 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
          
          {/* Header toolbar for current code file */}
          <div className="bg-slate-950 px-5 py-3 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Code className="w-5 h-5 text-amber-400" />
              <div>
                <h3 className="text-sm font-extrabold text-white font-mono">{activeModule.filename}</h3>
                <p className="text-[11px] text-slate-400">{activeModule.title}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleCopyCode(activeModule.code, activeModule.id)}
                className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold text-xs border border-amber-500/40 flex items-center gap-1.5 transition-colors"
              >
                {copiedId === activeModule.id ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>تم النسخ!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>نسخ الكود</span>
                  </>
                )}
              </button>

              <button
                onClick={() => handleDownloadFile(activeModule)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 flex items-center gap-1.5 transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-sky-400" />
                <span>تحميل</span>
              </button>
            </div>
          </div>

          {/* Description banner */}
          <div className="p-3 bg-slate-950/60 border-b border-slate-800 text-xs text-slate-300 flex items-center gap-2">
            <Terminal className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>{activeModule.description}</span>
          </div>

          {/* Code Viewer Textarea */}
          <div className="p-4 bg-slate-950 text-emerald-400 font-mono text-xs overflow-x-auto leading-relaxed dir-ltr max-h-[500px]">
            <pre className="whitespace-pre">{activeModule.code}</pre>
          </div>

        </div>

      </div>

      {/* Step-by-Step Excel VBA Deployment Manual in Arabic */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <h3 className="text-sm font-black text-amber-300 flex items-center gap-2 border-b border-slate-800 pb-3">
          <BookOpen className="w-5 h-5 text-amber-400" />
          <span>شرح وتوجيهات تشغيل مشروع "مصرف الدم المركزي المرج" داخل Microsoft Excel</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-300 leading-relaxed">
          
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <h4 className="font-extrabold text-white flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-red-900 text-red-200 flex items-center justify-center text-[10px] font-black">1</span>
              <span>تجهيز ملف Excel XLSM</span>
            </h4>
            <p>
              افتح مصنف Excel جديد واقتطع شاشة التطوير بالضغط على <kbd className="bg-slate-800 px-1 py-0.5 rounded text-amber-300 font-mono">Alt + F11</kbd> لفتح محرّر Visual Basic for Applications. أحفظ الملف بصيغة Excel Macro-Enabled Workbook (*.xlsm).
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <h4 className="font-extrabold text-white flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-red-900 text-red-200 flex items-center justify-center text-[10px] font-black">2</span>
              <span>استيراد الوحدات والفئات والنماذج</span>
            </h4>
            <p>
              من قائمة <code className="bg-slate-800 text-sky-300 px-1 py-0.5 rounded">Insert</code> قم بإضافة Module واستنسخ أكواد <code className="text-amber-300">modMain</code>, <code className="text-amber-300">modSecurity</code>, <code className="text-amber-300">modBackup</code>. ثم أنشئ Class Modules لكود <code className="text-amber-300">clsEmployee</code> و <code className="text-amber-300">clsDatabase</code>.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <h4 className="font-extrabold text-white flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-red-900 text-red-200 flex items-center justify-center text-[10px] font-black">3</span>
              <span>تشييد الهيكل والأوراق المخفية تلقائياً</span>
            </h4>
            <p>
              قم بتشغيل الماكرو <code className="bg-slate-800 text-emerald-300 px-1 py-0.5 rounded">SetupHiddenDatabaseSheets</code> المرفق بالأعلى لتشييد أوراق البيانات <code className="text-emerald-400">DB_Employees</code> و <code className="text-emerald-400">DB_Users</code> و <code className="text-emerald-400">DB_Log</code> وحمايتها وإخفائها تلقائياً!
            </p>
          </div>

        </div>
      </div>

    </div>
  );
};
