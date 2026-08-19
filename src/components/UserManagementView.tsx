import React, { useState } from 'react';
import { UserAccount } from '../types';
import { ShieldCheck, User, KeyRound, CheckCircle2, Lock } from 'lucide-react';

interface UserManagementViewProps {
  users: UserAccount[];
  onUpdatePassword: (username: string, newPass: string) => void;
}

export const UserManagementView: React.FC<UserManagementViewProps> = ({
  users,
  onUpdatePassword
}) => {
  const [selectedUsername, setSelectedUsername] = useState<string>('admin1');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg('');

    if (!newPassword || newPassword.length < 4) {
      alert('يرجى إدخال كلمة مرور تتكون من 4 خانات على الأقل!');
      return;
    }
    if (newPassword !== confirmPassword) {
      alert('كلمتا المرور غير متطابقتين!');
      return;
    }

    onUpdatePassword(selectedUsername, newPassword);
    setSuccessMsg(`تم تحديث كلمة المرور للحساب (${selectedUsername}) بنجاح!`);
    setNewPassword('');
    setConfirmPassword('');
  };

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-red-950 text-red-400 border border-red-800">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-black text-white">
              إدارة حسابات المستخدمين والصلاحيات (DB_Users Control)
            </h2>
            <p className="text-xs text-slate-400">
              النظام يحتوي على مستخدمَيْنِ رئيسيَيْنِ بحقوق كاملة وفق مواصفات المشروع
            </p>
          </div>
        </div>
      </div>

      {/* Users List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {users.map((u) => (
          <div
            key={u.id}
            className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-3 relative overflow-hidden"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-950 border border-red-800 flex items-center justify-center text-red-400 font-extrabold text-sm">
                  {u.role.includes('1') ? 'A1' : 'A2'}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">{u.displayName}</h3>
                  <p className="text-xs text-red-300 font-mono">{u.role}</p>
                </div>
              </div>

              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                صلاحية كاملة (Full Access)
              </span>
            </div>

            <div className="pt-2 border-t border-slate-800 text-xs space-y-1 text-slate-400 font-mono">
              <p>اسم المستخدم: <strong className="text-white">{u.username}</strong></p>
              <p>آخر تسجيل دخول: <strong className="text-slate-200">{u.lastLogin || 'الآن'}</strong></p>
            </div>
          </div>
        ))}
      </div>

      {/* Change Password Form */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4 max-w-xl">
        <h3 className="text-sm font-bold text-white border-b border-slate-800 pb-3 flex items-center gap-2">
          <KeyRound className="w-4 h-4 text-amber-400" />
          <span>تغيير كلمة المرور للحسابات الحالية</span>
        </h3>

        {successMsg && (
          <div className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-700 text-emerald-200 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handlePasswordChange} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-bold mb-1.5">اختر الحساب المراد تغييره</label>
            <select
              value={selectedUsername}
              onChange={(e) => setSelectedUsername(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white font-bold"
            >
              {users.map((u) => (
                <option key={u.id} value={u.username}>
                  {u.displayName} ({u.username})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-300 font-bold mb-1.5">كلمة المرور الجديدة</label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white font-mono"
              placeholder="••••••••"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-bold mb-1.5">تأكيد كلمة المرور الجديدة</label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white font-mono"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-red-800 hover:from-red-500 text-white font-bold text-xs shadow-lg border border-red-500"
          >
            تحديث كلمة المرور
          </button>
        </form>
      </div>

    </div>
  );
};
