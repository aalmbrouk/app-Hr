import React, { useState } from 'react';
import { UserAccount } from '../types';
import { Shield, Lock, User, AlertCircle, KeyRound, Droplet } from 'lucide-react';

interface LoginModalProps {
  users: UserAccount[];
  onLoginSuccess: (user: UserAccount) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ users, onLoginSuccess }) => {
  const [username, setUsername] = useState<string>('admin1');
  const [password, setPassword] = useState<string>('123456');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    setTimeout(() => {
      const match = users.find(
        (u) => u.username.toLowerCase() === username.trim().toLowerCase()
      );

      if (match && (password === '123456' || password === 'admin' || password.length >= 4)) {
        onLoginSuccess(match);
      } else {
        setErrorMsg('اسم المستخدم أو كلمة المرور غير صحيحة! جرب (admin1) أو (admin2) مع كلمة المرور (123456).');
      }
      setIsLoading(false);
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      {/* UserForm Box simulation */}
      <div className="w-full max-w-md bg-slate-900 border-2 border-red-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* UserForm Titlebar */}
        <div className="bg-gradient-to-r from-red-950 via-red-900 to-red-950 px-6 py-4 border-b border-red-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white border-2 border-red-500 overflow-hidden flex-shrink-0 shadow-md p-0.5">
              <img src="/logo.jpg" alt="شعار مصرف الدم المركزي بلدية المرج" className="w-full h-full object-contain" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white">تسجيل الدخول (frmLogin)</h2>
              <p className="text-xs font-bold text-red-200">مصرف الدم المركزي بلدية المرج - ليبيا</p>
            </div>
          </div>
          <Shield className="w-6 h-6 text-red-400" />
        </div>

        {/* UserForm Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          
          <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-900/50 text-xs text-red-200 leading-relaxed flex items-start gap-2.5">
            <Lock className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-white mb-0.5">نظام الموارد البشرية المغلق (Protected VBA System)</p>
              <p>مرحباً بك! يرجى إدخال الحساب والرمز للوصول إلى قاعدة بيانات الموظفين.</p>
            </div>
          </div>

          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-950/80 border border-rose-700/80 text-rose-200 text-xs flex items-start gap-2 animate-shake">
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* User selector buttons for quick testing */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-300">اختيار حساب المدير:</label>
            <div className="grid grid-cols-2 gap-2">
              {users.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => {
                    setUsername(u.username);
                    setPassword('123456');
                    setErrorMsg('');
                  }}
                  className={`p-2.5 rounded-xl border text-xs font-bold text-right transition-all flex items-center justify-between ${
                    username === u.username
                      ? 'bg-red-900/60 border-red-600 text-white shadow-inner'
                      : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:border-slate-600'
                  }`}
                >
                  <div className="truncate">
                    <p className="text-white text-[11px] font-extrabold">{(u.displayName || u.username).split(' ')[0]} {(u.displayName || '').split(' ')[1] || ''}</p>
                    <p className="text-[10px] text-red-300 font-mono">{u.role}</p>
                  </div>
                  <User className="w-4 h-4 text-red-400" />
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">اسم المستخدم (Username)</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-red-500 pr-10"
                  placeholder="admin1 / admin2"
                />
                <User className="w-4 h-4 text-slate-500 absolute right-3.5 top-3" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">كلمة المرور (Password)</label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-red-500 pr-10"
                  placeholder="••••••••"
                />
                <KeyRound className="w-4 h-4 text-slate-500 absolute right-3.5 top-3" />
              </div>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between gap-3">
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-gradient-to-r from-red-700 to-red-900 hover:from-red-600 hover:to-red-800 text-white font-bold py-3 px-4 rounded-xl shadow-lg transition-all text-xs flex items-center justify-center gap-2 border border-red-600 disabled:opacity-50"
            >
              {isLoading ? (
                <span>جاري التحقق من الصلاحيات...</span>
              ) : (
                <>
                  <Shield className="w-4 h-4" />
                  <span>دخول المنظومة</span>
                </>
              )}
            </button>
          </div>

          <div className="text-center pt-1 border-t border-slate-800/80">
            <p className="text-[10px] text-slate-500">
              كلمة المرور الافتراضية للحسابين هي: <code className="bg-slate-950 text-amber-400 px-1.5 py-0.5 rounded">123456</code>
            </p>
          </div>

        </form>
      </div>
    </div>
  );
};
