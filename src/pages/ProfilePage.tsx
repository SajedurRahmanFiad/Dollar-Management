import React, { useEffect, useState } from 'react';
import { Check, Eye, EyeOff, KeyRound, Save, UserRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const ProfilePage: React.FC = () => {
  const { user, updateProfile, updatePassword } = useAuth();
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;
    setName(user.name);
    setPhone(user.phone || user.username);
    setCompanyName(user.companyName || '');
  }, [user]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    try {
      await updateProfile({ name, phone, companyName });
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2500);
    } catch (profileError) {
      setError(profileError instanceof Error ? profileError.message : 'Unable to update profile');
    }
  };

  const handlePasswordSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (password.length < 6) return;
    setError('');
    try {
      await updatePassword(password);
      setPassword('');
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2500);
    } catch (profileError) {
      setError(profileError instanceof Error ? profileError.message : 'Unable to update profile');
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-5 animate-in fade-in duration-150">
      <div>
        <h1 className="text-xl font-black tracking-tight text-slate-900">Profile</h1>
        <p className="mt-1 text-xs text-slate-500">Manage your account details and login password.</p>
      </div>

      <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-xs sm:p-6">
        <div className="flex items-center gap-4 border-b border-slate-100 pb-5">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-800 text-2xl font-black text-white">
            {user?.name.charAt(0)}
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900">{user?.name}</h2>
            <p className="mt-1 text-xs text-slate-500">{user?.role === 'customer' ? 'Client account' : 'Admin account'}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-4 border-t border-slate-100 pt-5 sm:grid-cols-2">
          {[
            ['Full Name', name, setName],
            ['Phone Number', phone, setPhone],
            ['Company Name', companyName, setCompanyName],
          ].map(([label, value, setter]) => (
            <label key={label as string} className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              {label as string}
              <input value={value as string} onChange={(event) => (setter as (value: string) => void)(event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-medium normal-case tracking-normal text-slate-900 outline-none focus:border-slate-900" />
            </label>
          ))}
          <div className="flex items-center gap-3 sm:col-span-2">
            <button type="submit" className="flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800"><Save className="h-3.5 w-3.5" /> Save Profile</button>
            {saved && <span className="flex items-center gap-1 text-xs font-semibold text-emerald-700"><Check className="h-3.5 w-3.5" /> Profile updated</span>}
          </div>
        </form>

        <form onSubmit={handlePasswordSubmit} className="border-t border-slate-100 pt-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <label className="block flex-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Set New Password
              <div className="relative mt-1.5">
                <KeyRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  minLength={6}
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter a new password"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-10 text-xs text-slate-900 outline-none focus:border-slate-900"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((visible) => !visible)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-900"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </label>
            <button type="submit" className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white hover:bg-slate-800 sm:w-1/5">
              <UserRound className="h-3.5 w-3.5" />
              Update
            </button>
          </div>
        </form>
        {error && <p className="mt-3 text-xs font-semibold text-red-600">{error}</p>}
      </div>
    </div>
  );
};
