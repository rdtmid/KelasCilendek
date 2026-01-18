import React, { useState } from 'react';
import { MOCK_USERS } from '../constants';
import { User } from '../types';
import { Loader2, Lock, Mail, LogIn, AlertCircle } from 'lucide-react';

interface LoginProps {
  onLogin: (user: User) => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Simulate API delay
    setTimeout(() => {
      const user = MOCK_USERS.find(u => u.email.toLowerCase() === email.toLowerCase());
      
      if (user) {
        // Simple mock password check
        if (password === '123456') {
          onLogin(user);
        } else {
          setError('Password salah. (Gunakan: 123456)');
          setLoading(false);
        }
      } else {
        setError('Email tidak terdaftar.');
        setLoading(false);
      }
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col md:flex-row">
        <div className="w-full p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-100 text-blue-600 mb-4">
              <Lock size={24} />
            </div>
            <h1 className="text-2xl font-bold text-slate-800">Selamat Datang</h1>
            <p className="text-slate-500 text-sm mt-1">Silakan masuk ke EduKurikulum AI</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email Sekolah</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail size={18} className="text-slate-400" />
                </div>
                <input
                  type="email"
                  required
                  className="pl-10 w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  placeholder="nama@sekolah.id"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock size={18} className="text-slate-400" />
                </div>
                <input
                  type="password"
                  required
                  className="pl-10 w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
                <AlertCircle size={16} /> {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg flex items-center justify-center gap-2 transition-all disabled:opacity-70 mt-2"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : <LogIn size={20} />}
              {loading ? 'Memproses...' : 'Masuk Akun'}
            </button>
          </form>

          <div className="mt-8 text-center">
             <p className="text-xs text-slate-400">
               Demo Credentials:<br/>
               budi@sekolah.id (Admin)<br/>
               siti@sekolah.id (Guru)<br/>
               dewi@student.id (Siswa)<br/>
               Pass: 123456
             </p>
          </div>
        </div>
      </div>
    </div>
  );
};