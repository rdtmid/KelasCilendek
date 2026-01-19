import React, { useState, useRef, useEffect } from 'react';
import { UserRole, User } from '../types';
import { Mail, Shield, Trash2, Edit2, Plus, X, Save, User as UserIcon, Download, Upload, FileDown, ChevronDown, Loader2, Phone, Key } from 'lucide-react';

export const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTemplateMenuOpen, setIsTemplateMenuOpen] = useState(false); 
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const templateMenuRef = useRef<HTMLDivElement>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: UserRole.STUDENT as UserRole,
    phone: '',
    password: ''
  });

  // Fetch Users on Mount
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
        const res = await fetch('/api/users');
        if (res.ok) {
            const data = await res.json();
            setUsers(data);
        }
    } catch (error) {
        console.error("Failed to fetch users", error);
    } finally {
        setIsLoading(false);
    }
  };

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
  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Apakah anda yakin ingin menghapus user ${name}?`)) {
      try {
        await fetch(`/api/users/${id}`, { method: 'DELETE' });
        setUsers(prev => prev.filter(u => u.id !== id));
      } catch(e) { alert("Gagal menghapus user"); }
    }
  };

  const handleOpenAdd = () => {
    setEditingUser(null);
    setFormData({ name: '', email: '', role: UserRole.STUDENT, phone: '', password: '' });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (user: User) => {
    setEditingUser(user);
    // Don't fill password on edit for security visual, only if they want to change it
    setFormData({ name: user.name, email: user.email, role: user.role, phone: user.phone || '', password: '' });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.email) return alert("Nama dan Email wajib diisi");

    const payload: any = {
        name: formData.name,
        email: formData.email,
        role: formData.role,
        phone: formData.phone,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.name)}&background=random`
    };

    // Only send password if it's new user or user typed a new one
    if (formData.password) {
        payload.password = formData.password;
    }

    try {
        if (editingUser) {
          // Update
          await fetch(`/api/users/${editingUser.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ ...payload, bio: editingUser.bio })
          });
          setUsers(prev => prev.map(u => u.id === editingUser.id ? { ...u, ...payload, password: formData.password || u.password } : u));
        } else {
          // Create
          if (!formData.password) return alert("Password wajib diisi untuk user baru.");
          const newId = `usr-${Date.now()}`;
          const newUser = { id: newId, ...payload, bio: '' };
          await fetch('/api/users', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(newUser)
          });
          setUsers([...users, newUser]);
        }
        setIsModalOpen(false);
    } catch (e) {
        alert("Gagal menyimpan data.");
    }
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
    const headers = ['ID,Nama,Email,Telepon,Role'];
    const rows = users.map(u => `${u.id},"${u.name}",${u.email},"${u.phone || ''}",${u.role}`);
    const csvContent = [headers, ...rows].join('\n');
    downloadCSV(csvContent, `data-users-${new Date().toISOString().split('T')[0]}.csv`);
  };

  const handleDownloadTemplate = (type: 'student' | 'teacher' | 'admin') => {
    const headers = ['Nama,Email,Telepon,Password,Role'];
    let content = '';
    let filename = '';

    switch (type) {
      case 'student':
        content = [
          headers,
          `"Siswa Contoh 1",siswa1@sekolah.id,08123456789,123456,${UserRole.STUDENT}`,
          `"Siswa Contoh 2",siswa2@sekolah.id,08987654321,123456,${UserRole.STUDENT}`
        ].join('\n');
        filename = 'template-peserta-didik.csv';
        break;
      
      case 'teacher':
        content = [
          headers,
          `"Guru Fisika",guru.fisika@sekolah.id,08111222333,guru123,${UserRole.TEACHER}`,
          `"Dosen Biologi",dosen.bio@kampus.id,08555666777,dosen123,${UserRole.TEACHER}`
        ].join('\n');
        filename = 'template-tenaga-pendidik.csv';
        break;

      case 'admin':
        content = [
          headers,
          `"Operator Utama",admin.utama@sekolah.id,0810002000,admin123,${UserRole.ADMIN}`,
          `"Staf TU",staf.tu@sekolah.id,0820003000,staf123,${UserRole.ADMIN}`
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
    event.target.value = '';
  };

  const processCSV = async (csvText: string) => {
    try {
      const lines = csvText.split('\n');
      if (lines.length < 2) return alert("File kosong atau format salah.");

      const newUsers: User[] = [];
      let successCount = 0;

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const parts = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
        const cols = parts ? parts.map(p => p.replace(/^"|"$/g, '').trim()) : line.split(',');

        // Expected CSV: Name, Email, Phone, Password, Role
        if (cols.length >= 5) {
          const name = cols[0];
          const email = cols[1];
          const phone = cols[2];
          const password = cols[3];
          let roleRaw = cols[4];
          
          let role = UserRole.STUDENT;
          if (roleRaw.includes('Pendidik') || roleRaw.includes('Guru') || roleRaw.includes('TEACHER')) role = UserRole.TEACHER;
          if (roleRaw.includes('Operator') || roleRaw.includes('Admin') || roleRaw.includes('ADMIN')) role = UserRole.ADMIN;

          const newUser = {
            id: `imp-${Date.now()}-${i}`,
            name: name,
            email: email,
            phone: phone,
            password: password,
            role: role,
            avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`,
            bio: ''
          };
          
          // Save to DB
          await fetch('/api/users', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(newUser)
          });

          newUsers.push(newUser);
          successCount++;
        }
      }

      if (successCount > 0) {
        setUsers(prev => [...prev, ...newUsers]);
        alert(`Berhasil mengimpor ${successCount} pengguna baru.`);
      }

    } catch (error) {
      alert("Gagal memproses file CSV. Pastikan format: Nama,Email,Telepon,Password,Role");
    }
  };

  return (
    <div className="space-y-6 relative">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
           <h2 className="text-2xl font-bold text-slate-800">Manajemen Pengguna</h2>
           <p className="text-slate-500">Kelola akses, password, dan kontak untuk semua civitas.</p>
        </div>
        
        <div className="flex flex-wrap gap-2">
           <div className="relative" ref={templateMenuRef}>
             <button 
              onClick={() => setIsTemplateMenuOpen(!isTemplateMenuOpen)}
              className={`bg-white border border-slate-300 text-slate-600 hover:bg-slate-50 px-3 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors ${isTemplateMenuOpen ? 'ring-2 ring-blue-100 border-blue-400' : ''}`}
            >
              <FileDown size={16} /> Template <ChevronDown size={14} />
            </button>
            
            {isTemplateMenuOpen && (
              <div className="absolute top-full right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-slate-100 z-20 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="p-1">
                  <button onClick={() => handleDownloadTemplate('student')} className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 text-slate-700">Peserta Didik</button>
                  <button onClick={() => handleDownloadTemplate('teacher')} className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 text-slate-700">Tenaga Pendidik</button>
                  <button onClick={() => handleDownloadTemplate('admin')} className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 text-slate-700">Operator</button>
                </div>
              </div>
            )}
           </div>
          
          <button onClick={handleExport} className="bg-white border border-slate-300 text-slate-600 hover:bg-slate-50 px-3 py-2 rounded-lg flex items-center gap-2 text-sm font-medium">
            <Download size={16} /> Export
          </button>

          <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".csv" className="hidden" />
          <button onClick={handleImportClick} className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-lg flex items-center gap-2 text-sm font-medium">
            <Upload size={16} /> Import CSV
          </button>

          <button onClick={handleOpenAdd} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg flex items-center gap-2 text-sm font-medium">
            <Plus size={16} /> Tambah
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {isLoading ? (
            <div className="p-12 flex justify-center"><Loader2 className="animate-spin text-blue-600" size={32} /></div>
        ) : (
            <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="p-4 text-sm font-semibold text-slate-600">Nama Lengkap</th>
                  <th className="p-4 text-sm font-semibold text-slate-600 hidden md:table-cell">Kontak</th>
                  <th className="p-4 text-sm font-semibold text-slate-600">Role / Jabatan</th>
                  <th className="p-4 text-sm font-semibold text-slate-600">Password</th>
                  <th className="p-4 text-sm font-semibold text-slate-600 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.length === 0 ? (
                  <tr><td colSpan={5} className="p-8 text-center text-slate-400">Tidak ada user ditemukan.</td></tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4 flex items-center gap-3">
                        <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full bg-slate-200 object-cover" />
                        <span className="font-medium text-slate-800">{user.name}</span>
                      </td>
                      <td className="p-4 text-slate-600 hidden md:table-cell">
                        <div className="flex flex-col gap-1 text-sm">
                           <div className="flex items-center gap-2">
                             <Mail size={14} className="text-slate-400" /> {user.email}
                           </div>
                           <div className="flex items-center gap-2">
                             <Phone size={14} className="text-slate-400" /> {user.phone || '-'}
                           </div>
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
                      <td className="p-4 text-slate-500 font-mono text-sm">
                        ••••••
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => handleOpenEdit(user)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg" title="Edit Data & Password">
                            <Edit2 size={16} />
                          </button>
                          <button onClick={() => handleDelete(user.id, user.name)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
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
        )}
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
             <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">Nama Lengkap</label>
                   <input 
                     className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
                     value={formData.name}
                     onChange={e => setFormData({...formData, name: e.target.value})}
                   />
                </div>
                <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                   <input 
                     type="email"
                     className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
                     value={formData.email}
                     onChange={e => setFormData({...formData, email: e.target.value})}
                   />
                </div>
                <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">Nomor Telepon</label>
                   <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Phone size={16} className="text-slate-400"/></div>
                        <input 
                            type="text"
                            className="pl-10 w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="08..."
                            value={formData.phone}
                            onChange={e => setFormData({...formData, phone: e.target.value})}
                        />
                   </div>
                </div>
                <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">{editingUser ? 'Password Baru (Opsional)' : 'Password'}</label>
                   <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Key size={16} className="text-slate-400"/></div>
                        <input 
                            type="text"
                            className="pl-10 w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder={editingUser ? "Kosongkan jika tidak diubah" : "Masukkan password"}
                            value={formData.password}
                            onChange={e => setFormData({...formData, password: e.target.value})}
                        />
                   </div>
                   {editingUser && <p className="text-xs text-slate-400 mt-1">Biarkan kosong jika tidak ingin mengubah password.</p>}
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
                  <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
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