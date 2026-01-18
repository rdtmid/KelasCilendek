import React, { useState, useRef, useEffect } from 'react';
import { MOCK_USERS } from '../constants';
import { UserRole, User } from '../types';
import { Mail, Shield, Trash2, Edit2, Plus, X, Save, User as UserIcon, Download, Upload, FileDown, ChevronDown } from 'lucide-react';

export const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>(MOCK_USERS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTemplateMenuOpen, setIsTemplateMenuOpen] = useState(false); // State untuk dropdown template
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const templateMenuRef = useRef<HTMLDivElement>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: UserRole.STUDENT as UserRole
  });

  // Close template menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (templateMenuRef.current && !templateMenuRef.current.contains(event.target as Node)) {
        setIsTemplateMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // --- Handlers CRUD ---
  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Apakah anda yakin ingin menghapus user ${name}?`)) {
      setUsers(prev => prev.filter(u => u.id !== id));
    }
  };

  const handleOpenAdd = () => {
    setEditingUser(null);
    setFormData({ name: '', email: '', role: UserRole.STUDENT });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (user: User) => {
    setEditingUser(user);
    setFormData({ name: user.name, email: user.email, role: user.role });
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!formData.name || !formData.email) return alert("Nama dan Email wajib diisi");

    if (editingUser) {
      // Update existing
      setUsers(prev => prev.map(u => u.id === editingUser.id ? { ...u, ...formData } : u));
    } else {
      // Create new
      const newUser: User = {
        id: Date.now().toString(),
        name: formData.name,
        email: formData.email,
        role: formData.role,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.name)}&background=random`
      };
      setUsers([...users, newUser]);
    }
    setIsModalOpen(false);
  };

  // --- Handlers Import / Export ---

  const downloadCSV = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExport = () => {
    const headers = ['ID,Nama,Email,Role'];
    const rows = users.map(u => `${u.id},"${u.name}",${u.email},${u.role}`);
    const csvContent = [headers, ...rows].join('\n');
    downloadCSV(csvContent, `data-users-${new Date().toISOString().split('T')[0]}.csv`);
  };

  const handleDownloadTemplate = (type: 'student' | 'teacher' | 'admin') => {
    const headers = ['Nama,Email,Role'];
    let content = '';
    let filename = '';

    switch (type) {
      case 'student':
        content = [
          headers,
          `"Siswa Contoh 1",siswa1@sekolah.id,${UserRole.STUDENT}`,
          `"Siswa Contoh 2",siswa2@sekolah.id,${UserRole.STUDENT}`
        ].join('\n');
        filename = 'template-peserta-didik.csv';
        break;
      
      case 'teacher':
        content = [
          headers,
          `"Guru Fisika",guru.fisika@sekolah.id,${UserRole.TEACHER}`,
          `"Dosen Biologi",dosen.bio@kampus.id,${UserRole.TEACHER}`
        ].join('\n');
        filename = 'template-tenaga-pendidik.csv';
        break;

      case 'admin':
        content = [
          headers,
          `"Operator Utama",admin.utama@sekolah.id,${UserRole.ADMIN}`,
          `"Staf TU",staf.tu@sekolah.id,${UserRole.ADMIN}`
        ].join('\n');
        filename = 'template-operator.csv';
        break;
    }

    downloadCSV(content, filename);
    setIsTemplateMenuOpen(false);
  };

  const handleImportClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (content) {
        processCSV(content);
      }
    };
    reader.readAsText(file);
    // Reset input agar bisa upload file yang sama jika perlu
    event.target.value = '';
  };

  const processCSV = (csvText: string) => {
    try {
      const lines = csvText.split('\n');
      if (lines.length < 2) return alert("File kosong atau format salah.");

      const newUsers: User[] = [];
      let successCount = 0;

      // Skip header (index 0), start from 1
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const parts = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
        const cols = parts ? parts.map(p => p.replace(/^"|"$/g, '').trim()) : line.split(',');

        if (cols.length >= 3) {
          const name = cols[0];
          const email = cols[1];
          let roleRaw = cols[2];
          
          // Normalisasi Role yang fleksibel
          let role = UserRole.STUDENT;
          if (roleRaw.includes('Pendidik') || roleRaw.includes('Guru') || roleRaw.includes('Dosen') || roleRaw.includes('TEACHER')) role = UserRole.TEACHER;
          if (roleRaw.includes('Operator') || roleRaw.includes('Admin') || roleRaw.includes('Staf') || roleRaw.includes('ADMIN')) role = UserRole.ADMIN;
          if (roleRaw.includes('Siswa') || roleRaw.includes('Mahasiswa') || roleRaw.includes('Peserta') || roleRaw.includes('STUDENT')) role = UserRole.STUDENT;

          newUsers.push({
            id: `imp-${Date.now()}-${i}`,
            name: name,
            email: email,
            role: role,
            avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`
          });
          successCount++;
        }
      }

      if (successCount > 0) {
        setUsers(prev => [...prev, ...newUsers]);
        alert(`Berhasil mengimpor ${successCount} pengguna baru.`);
      } else {
        alert("Tidak ada data valid yang ditemukan.");
      }

    } catch (error) {
      console.error(error);
      alert("Gagal memproses file CSV. Pastikan format sesuai template.");
    }
  };

  return (
    <div className="space-y-6 relative">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
           <h2 className="text-2xl font-bold text-slate-800">Manajemen Pengguna</h2>
           <p className="text-slate-500">Kelola akses untuk Dosen, Operator, dan Peserta Didik.</p>
        </div>
        
        <div className="flex flex-wrap gap-2">
           {/* Dropdown Template Button */}
           <div className="relative" ref={templateMenuRef}>
             <button 
              onClick={() => setIsTemplateMenuOpen(!isTemplateMenuOpen)}
              className={`bg-white border border-slate-300 text-slate-600 hover:bg-slate-50 px-3 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors ${isTemplateMenuOpen ? 'ring-2 ring-blue-100 border-blue-400' : ''}`}
              title="Download Template Excel/CSV"
            >
              <FileDown size={16} /> Template <ChevronDown size={14} />
            </button>
            
            {isTemplateMenuOpen && (
              <div className="absolute top-full right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-slate-100 z-20 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="p-2 border-b border-slate-50 bg-slate-50">
                  <span className="text-xs font-semibold text-slate-500 uppercase px-2">Pilih Jenis Template</span>
                </div>
                <div className="p-1">
                  <button 
                    onClick={() => handleDownloadTemplate('student')}
                    className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-700 rounded-md transition-colors flex items-center gap-2"
                  >
                    <UserIcon size={14} /> Peserta Didik / Siswa
                  </button>
                  <button 
                    onClick={() => handleDownloadTemplate('teacher')}
                    className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-700 rounded-md transition-colors flex items-center gap-2"
                  >
                    <Shield size={14} /> Dosen / Tenaga Pendidik
                  </button>
                  <button 
                    onClick={() => handleDownloadTemplate('admin')}
                    className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-700 rounded-md transition-colors flex items-center gap-2"
                  >
                    <Shield size={14} className="text-purple-500" /> Operator / Admin
                  </button>
                </div>
              </div>
            )}
           </div>
          
          <button 
            onClick={handleExport}
            className="bg-white border border-slate-300 text-slate-600 hover:bg-slate-50 px-3 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors"
          >
            <Download size={16} /> Export Data
          </button>

          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept=".csv" 
            className="hidden" 
          />
          <button 
            onClick={handleImportClick}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors"
          >
            <Upload size={16} /> Import CSV
          </button>

          <button 
            onClick={handleOpenAdd}
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors"
          >
            <Plus size={16} /> Tambah Manual
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="p-4 text-sm font-semibold text-slate-600">Nama Lengkap</th>
              <th className="p-4 text-sm font-semibold text-slate-600 hidden md:table-cell">Email</th>
              <th className="p-4 text-sm font-semibold text-slate-600">Role / Jabatan</th>
              <th className="p-4 text-sm font-semibold text-slate-600 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.length === 0 ? (
              <tr><td colSpan={4} className="p-8 text-center text-slate-400">Tidak ada user ditemukan.</td></tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4 flex items-center gap-3">
                    <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full bg-slate-200 object-cover" />
                    <span className="font-medium text-slate-800">{user.name}</span>
                  </td>
                  <td className="p-4 text-slate-600 hidden md:table-cell">
                    <div className="flex items-center gap-2">
                      <Mail size={14} className="text-slate-400" /> {user.email}
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
                      user.role === UserRole.ADMIN ? 'bg-purple-100 text-purple-700' :
                      user.role === UserRole.TEACHER ? 'bg-blue-100 text-blue-700' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      <Shield size={12} />
                      {user.role}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button 
                          onClick={() => handleOpenEdit(user)}
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit User"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                          onClick={() => handleDelete(user.id, user.name)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Hapus User"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md animate-in fade-in zoom-in duration-200">
             <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-xl">
               <h3 className="font-bold text-slate-800 flex items-center gap-2">
                 <UserIcon size={20} className="text-blue-600"/> 
                 {editingUser ? 'Edit User' : 'Tambah User Baru'}
               </h3>
               <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                 <X size={20} />
               </button>
             </div>
             <div className="p-6 space-y-4">
                <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">Nama Lengkap</label>
                   <input 
                     className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
                     value={formData.name}
                     onChange={e => setFormData({...formData, name: e.target.value})}
                     placeholder="Masukkan nama lengkap"
                   />
                </div>
                <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                   <input 
                     type="email"
                     className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
                     value={formData.email}
                     onChange={e => setFormData({...formData, email: e.target.value})}
                     placeholder="contoh@sekolah.id"
                   />
                </div>
                <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">Role / Jabatan</label>
                   <select 
                     className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                     value={formData.role}
                     onChange={e => setFormData({...formData, role: e.target.value as UserRole})}
                   >
                     {Object.values(UserRole).map(role => (
                       <option key={role} value={role}>{role}</option>
                     ))}
                   </select>
                </div>

                <div className="pt-4 flex justify-end gap-2">
                  <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Batal</button>
                  <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 shadow-sm shadow-blue-200">
                    <Save size={18} /> Simpan
                  </button>
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};