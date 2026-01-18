import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, AreaChart, Area } from 'recharts';
import { ClassSession, User, UserRole, Assignment } from '../types';
import { Users, BookOpen, CheckCircle, AlertCircle, Clock, Calendar, GraduationCap, TrendingUp, Award, List, Edit2, Camera, Upload, Send, X, MessageSquare, Check, FileText, ArrowRight } from 'lucide-react';

interface DashboardProps {
  classes: ClassSession[];
  currentUser: User;
  onNavigate?: (tab: string) => void;
}

const dataPerformance = [
  { name: 'Minggu 1', completion: 85 },
  { name: 'Minggu 2', completion: 78 },
  { name: 'Minggu 3', completion: 92 },
  { name: 'Minggu 4', completion: 88 },
];

const dataSubjectDist = [
  { name: 'Sains', value: 400 },
  { name: 'Sosial', value: 300 },
  { name: 'Bahasa', value: 300 },
  { name: 'Seni', value: 200 },
];

const dataStudentGrades = [
  { subject: 'Fisika', nilai: 85, feedback: "Pemahaman konsep sangat baik, pertahankan!" },
  { subject: 'Sejarah', nilai: 78, feedback: "Perbanyak membaca literasi sejarah periode kemerdekaan." },
  { subject: 'B. Inggris', nilai: 92, feedback: "Excellent speaking skills." },
  { subject: 'Kimia', nilai: 88, feedback: "Laporan praktikum sangat rapi dan detail." },
  { subject: 'Matematika', nilai: 75, feedback: "Perlu latihan lebih banyak di aljabar." },
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export const Dashboard: React.FC<DashboardProps> = ({ classes, currentUser, onNavigate }) => {
  
  // --- ADMIN DASHBOARD ---
  const AdminDashboard = () => {
    const totalStudents = classes.reduce((acc, curr) => acc + curr.studentCount, 0);
    
    return (
      <div className="space-y-6">
        <header className="mb-6">
          <h2 className="text-2xl font-bold text-slate-800">Dashboard Administrator</h2>
          <p className="text-slate-500">Ringkasan performa sekolah dan kurikulum secara keseluruhan.</p>
        </header>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-slate-500 text-sm font-medium">Total Siswa</h3>
              <Users className="text-blue-500" size={20} />
            </div>
            <p className="text-3xl font-bold text-slate-800">{totalStudents}</p>
            <span className="text-xs text-green-500 flex items-center mt-2">+5% dari bulan lalu</span>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-slate-500 text-sm font-medium">Kelas Aktif</h3>
              <BookOpen className="text-indigo-500" size={20} />
            </div>
            <p className="text-3xl font-bold text-slate-800">{classes.length}</p>
            <span className="text-xs text-slate-400 mt-2">Sedang berjalan</span>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-slate-500 text-sm font-medium">Tingkat Kelulusan</h3>
              <CheckCircle className="text-green-500" size={20} />
            </div>
            <p className="text-3xl font-bold text-slate-800">94%</p>
            <span className="text-xs text-green-500 mt-2">Sangat Baik</span>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-slate-500 text-sm font-medium">Perlu Evaluasi</h3>
              <AlertCircle className="text-orange-500" size={20} />
            </div>
            <p className="text-3xl font-bold text-slate-800">3</p>
            <span className="text-xs text-orange-500 mt-2">Kurikulum perlu revisi</span>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h3 className="text-lg font-semibold text-slate-800 mb-6">Progress Kurikulum Nasional</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dataPerformance}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <Tooltip cursor={{ fill: '#F1F5F9' }} />
                  <Bar dataKey="completion" fill="#3B82F6" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h3 className="text-lg font-semibold text-slate-800 mb-6">Distribusi Mata Pelajaran</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={dataSubjectDist}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {dataSubjectDist.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-4 mt-4">
              {dataSubjectDist.map((entry, index) => (
                <div key={index} className="flex items-center text-xs text-slate-500">
                  <div className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                  {entry.name}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // --- TEACHER DASHBOARD ---
  const TeacherDashboard = () => {
    // Filter classes owned by this teacher
    const myClasses = classes.filter(c => c.teacherId === currentUser.id);
    const totalStudents = myClasses.reduce((acc, curr) => acc + curr.studentCount, 0);
    const today = new Date().getDay(); // 0-6
    const todaysClasses = myClasses.filter(c => c.dayOfWeek === today);

    return (
        <div className="space-y-6">
            <header className="mb-6 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-8 text-white">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h2 className="text-3xl font-bold">Halo, {currentUser.name}! 👋</h2>
                        <p className="text-blue-100 mt-1">Siap mengajar hari ini? Anda memiliki {todaysClasses.length} kelas jadwal hari ini.</p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-lg border border-white/20">
                        <span className="text-sm font-medium">Tahun Ajaran 2024/2025</span>
                    </div>
                </div>
            </header>

             {/* Stats Row */}
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                        <GraduationCap size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-slate-500">Kelas Diampu</p>
                        <p className="text-2xl font-bold text-slate-800">{myClasses.length}</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                        <Users size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-slate-500">Total Siswa Aktif</p>
                        <p className="text-2xl font-bold text-slate-800">{totalStudents}</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
                        <BookOpen size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-slate-500">Rata-rata Progress</p>
                        <p className="text-2xl font-bold text-slate-800">
                            {myClasses.length > 0 ? Math.round(myClasses.reduce((a,b) => a + (b.progress || 0), 0) / myClasses.length) : 0}%
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Jadwal Hari Ini */}
                <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                        <h3 className="font-bold text-slate-800 flex items-center gap-2">
                            <Clock className="text-blue-500"/> Jadwal Mengajar Hari Ini
                        </h3>
                        <span className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-600">
                             {new Date().toLocaleDateString('id-ID', {weekday: 'long', day: 'numeric', month: 'long'})}
                        </span>
                    </div>
                    <div className="p-6">
                        {todaysClasses.length === 0 ? (
                            <div className="text-center py-8 text-slate-400 bg-slate-50 rounded-lg border border-dashed">
                                <p>Tidak ada jadwal mengajar hari ini. Nikmati waktu Anda!</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {todaysClasses.map(cls => (
                                    <div key={cls.id} className="flex items-center p-4 bg-slate-50 rounded-lg border border-slate-200 hover:border-blue-300 transition-colors">
                                        <div className="flex-1">
                                            <h4 className="font-bold text-slate-800">{cls.className}</h4>
                                            <p className="text-sm text-slate-600">{cls.subject}</p>
                                        </div>
                                        <div className="text-right px-4 border-l border-slate-200">
                                            <p className="text-sm font-semibold text-blue-600">{cls.schedule.split(',')[1] || '08:00'}</p>
                                            <p className="text-xs text-slate-400">WIB</p>
                                        </div>
                                        <div className="ml-4">
                                            <button className="px-3 py-1 bg-blue-600 text-white text-xs font-medium rounded hover:bg-blue-700">Masuk Kelas</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Daftar Kelas */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200">
                    <div className="p-6 border-b border-slate-100">
                        <h3 className="font-bold text-slate-800 flex items-center gap-2">
                            <List className="text-indigo-500"/> Daftar Kelas Anda
                        </h3>
                    </div>
                    <div className="p-4 space-y-3">
                        {myClasses.map(cls => (
                            <div key={cls.id} className="p-3 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer group">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="font-semibold text-sm text-slate-700">{cls.className}</span>
                                    <span className="text-xs text-slate-400">{cls.studentCount} Siswa</span>
                                </div>
                                <div className="w-full bg-slate-100 rounded-full h-1.5">
                                    <div className="bg-indigo-500 h-1.5 rounded-full" style={{width: `${cls.progress || 0}%`}}></div>
                                </div>
                                <p className="text-xs text-slate-400 mt-1 flex justify-between">
                                    <span>{cls.subject}</span>
                                    <span className="group-hover:text-indigo-600">{cls.progress}% Selesai</span>
                                </p>
                            </div>
                        ))}
                        {myClasses.length === 0 && <p className="text-sm text-slate-400 text-center py-4">Belum ada kelas yang ditugaskan.</p>}
                    </div>
                </div>
            </div>
        </div>
    );
  };

  // --- STUDENT DASHBOARD ---
  const StudentDashboard = () => {
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const [isTranscriptModalOpen, setIsTranscriptModalOpen] = useState(false);
    const [selectedTask, setSelectedTask] = useState<any>(null); // For submission
    
    const [profileData, setProfileData] = useState({
        name: currentUser.name,
        email: currentUser.email,
        bio: currentUser.bio || 'Siswa rajin dan berprestasi.'
    });

    // Mock Task Submission State
    const [submissionText, setSubmissionText] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Mock Tasks Data (Stateful so we can update status)
    const [tasks, setTasks] = useState([
        { id: 1, title: 'Laporan Praktikum Fisika', due: 'Besok', type: 'Tugas', status: 'pending', subject: 'Fisika Dasar' },
        { id: 2, title: 'Kuis Sejarah Indonesia', due: '2 Hari lagi', type: 'Kuis', status: 'graded', score: 85, subject: 'Sejarah Indonesia' },
        { id: 3, title: 'Presentasi B. Inggris', due: 'Minggu depan', type: 'Proyek', status: 'pending', subject: 'Bahasa Inggris' }
    ]);

    // Mocking student's enrolled classes (In real app, filter by enrollment)
    const myClasses = classes.slice(0, 3); 
    const gpa = 3.85;
    const credits = 42;
    const today = new Date().getDay();
    const todaysClasses = myClasses.filter(c => c.dayOfWeek === today || (c.dayOfWeek === undefined && Math.random() > 0.5)); 

    const handleUpdateProfile = () => {
        // Here we would call API to update user
        alert("Profil berhasil diperbarui!");
        // Update local storage just for demo continuity
        const updatedUser = { ...currentUser, ...profileData };
        localStorage.setItem('edu_user', JSON.stringify(updatedUser));
        window.location.reload(); // Simple reload to reflect changes in parent
    };

    const openTaskSubmission = (task: any) => {
        setSelectedTask(task);
        setIsTaskModalOpen(true);
        setSubmissionText('');
    };

    const handleSubmitTask = () => {
        setIsSubmitting(true);
        setTimeout(() => {
            setTasks(prev => prev.map(t => t.id === selectedTask.id ? { ...t, status: 'submitted' } : t));
            setIsSubmitting(false);
            setIsTaskModalOpen(false);
            alert(`Tugas "${selectedTask.title}" berhasil diserahkan!`);
        }, 1500);
    };

    return (
        <div className="space-y-6">
            <header className="mb-6 bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-6 items-center">
                <div className="relative group">
                    <img src={currentUser.avatar} alt="Profile" className="w-20 h-20 rounded-full border-4 border-blue-100 object-cover" />
                    <button 
                        onClick={() => setIsProfileModalOpen(true)}
                        className="absolute bottom-0 right-0 bg-blue-600 text-white p-1.5 rounded-full hover:bg-blue-700 transition-colors shadow-sm"
                    >
                        <Edit2 size={12} />
                    </button>
                </div>
                <div className="flex-1 text-center md:text-left">
                    <h2 className="text-2xl font-bold text-slate-800">{profileData.name}</h2>
                    <p className="text-slate-500">Peserta Didik • {profileData.email}</p>
                    <p className="text-xs text-slate-400 mt-1 italic">"{profileData.bio}"</p>
                    <div className="flex gap-4 mt-3 justify-center md:justify-start">
                        <div className="flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm font-medium border border-green-200">
                             <TrendingUp size={16} /> IPK: {gpa}
                        </div>
                        <div className="flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium border border-blue-200">
                             <Award size={16} /> SKS: {credits}
                        </div>
                    </div>
                </div>
                <div className="w-full md:w-64 bg-slate-50 p-4 rounded-lg border border-slate-100">
                    <p className="text-xs text-slate-500 mb-2">Kehadiran Semester Ini</p>
                    <div className="flex items-end gap-2">
                        <span className="text-2xl font-bold text-slate-800">96%</span>
                        <span className="text-xs text-green-500 mb-1">Sangat Baik</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2 mt-2">
                         <div className="bg-green-500 h-2 rounded-full" style={{width: '96%'}}></div>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    {/* Jadwal Kuliah */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200">
                        <div className="p-5 border-b border-slate-100 flex justify-between items-center">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                <Calendar className="text-indigo-500"/> Jadwal Pelajaran Anda
                            </h3>
                        </div>
                        <div className="p-5">
                            {todaysClasses.length > 0 ? (
                                <div className="space-y-4">
                                     {todaysClasses.map((cls, idx) => (
                                         <div 
                                            key={idx} 
                                            onClick={() => onNavigate && onNavigate('materials')}
                                            className="flex gap-4 items-start p-3 rounded-lg hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-200 cursor-pointer group"
                                            title="Klik untuk lihat materi"
                                         >
                                             <div className="w-16 text-center bg-blue-50 text-blue-700 rounded-lg py-2 group-hover:bg-blue-100 transition-colors">
                                                 <span className="block text-xs font-bold">JAM</span>
                                                 <span className="block font-bold">{cls.schedule.split(',')[1]?.trim() || '08:00'}</span>
                                             </div>
                                             <div>
                                                 <h4 className="font-bold text-slate-800 group-hover:text-blue-600 transition-colors">{cls.subject}</h4>
                                                 <p className="text-sm text-slate-500">{cls.className} • {cls.teacherId === '2' ? 'Ibu Siti Aminah' : 'Bapak Budi Santoso'}</p>
                                             </div>
                                             <div className="ml-auto self-center flex items-center gap-2">
                                                 <ArrowRight size={16} className="text-slate-300 group-hover:text-blue-500 opacity-0 group-hover:opacity-100 transition-all"/>
                                                 <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded">Hadir</span>
                                             </div>
                                         </div>
                                     ))}
                                </div>
                            ) : (
                                <p className="text-slate-500 text-center italic py-4">Tidak ada jadwal kuliah hari ini.</p>
                            )}
                            <button className="w-full mt-4 py-2 text-sm text-blue-600 font-medium hover:bg-blue-50 rounded-lg transition-colors">
                                Lihat Jadwal Lengkap Minggu Ini
                            </button>
                        </div>
                    </div>

                    {/* Grafik Nilai */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                <TrendingUp className="text-emerald-500"/> Tren Nilai Akademik
                            </h3>
                            <button 
                                onClick={() => setIsTranscriptModalOpen(true)}
                                className="text-sm text-blue-600 hover:text-blue-700 font-medium bg-blue-50 px-3 py-1.5 rounded-lg transition-colors"
                            >
                                Lihat Transkrip & Evaluasi
                            </button>
                        </div>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={dataStudentGrades}>
                                    <defs>
                                        <linearGradient id="colorNilai" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="subject" axisLine={false} tickLine={false} tick={{fontSize: 12}} />
                                    <YAxis hide domain={[0, 100]} />
                                    <Tooltip />
                                    <Area type="monotone" dataKey="nilai" stroke="#10b981" fillOpacity={1} fill="url(#colorNilai)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Sidebar Kanan (Tugas) */}
                <div className="space-y-6">
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200">
                        <div className="p-4 border-b border-slate-100 bg-orange-50 rounded-t-xl">
                            <h3 className="font-bold text-orange-800 text-sm">Tugas & Evaluasi</h3>
                        </div>
                        <div className="divide-y divide-slate-100">
                            {tasks.map((task, i) => (
                                <div key={i} className="p-4 hover:bg-slate-50 transition-colors">
                                    <div className="flex justify-between items-start mb-1">
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide ${
                                            task.type === 'Kuis' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
                                        }`}>{task.type}</span>
                                        <span className="text-xs text-slate-400">{task.due}</span>
                                    </div>
                                    <h4 className="text-sm font-semibold text-slate-800">{task.title}</h4>
                                    <p className="text-xs text-slate-500 mb-2">{task.subject}</p>
                                    
                                    {task.status === 'submitted' ? (
                                        <span className="mt-2 text-xs font-medium text-green-600 flex items-center gap-1">
                                            <Check size={12} /> Diserahkan
                                        </span>
                                    ) : task.status === 'graded' ? (
                                        <div className="mt-2 flex items-center gap-2">
                                            <span className="text-xs font-medium text-slate-600 flex items-center gap-1">
                                                <Award size={12} /> Dinilai
                                            </span>
                                            <span className="text-xs font-bold text-slate-800 bg-slate-100 px-2 rounded">
                                                {task.score}/100
                                            </span>
                                        </div>
                                    ) : (
                                        <button 
                                            onClick={() => openTaskSubmission(task)}
                                            className="mt-2 text-xs font-medium text-blue-600 hover:text-blue-800 hover:underline"
                                        >
                                            Kerjakan Sekarang &rarr;
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-xl p-6 text-white text-center">
                        <BookOpen size={32} className="mx-auto mb-3 opacity-80" />
                        <h3 className="font-bold text-lg">Perpustakaan Digital</h3>
                        <p className="text-indigo-100 text-sm mb-4">Akses ribuan materi pelajaran dan buku digital.</p>
                        <button className="bg-white text-indigo-700 px-4 py-2 rounded-lg text-sm font-bold hover:bg-indigo-50 transition-colors w-full">
                            Buka Perpustakaan
                        </button>
                    </div>
                </div>
            </div>

            {/* Profile Edit Modal */}
            {isProfileModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md animate-in fade-in zoom-in duration-200">
                        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h3 className="font-bold text-slate-800">Edit Profil</h3>
                            <button onClick={() => setIsProfileModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
                        </div>
                        <div className="p-6 space-y-4">
                             <div className="flex justify-center mb-4">
                                <div className="relative">
                                    <img src={currentUser.avatar} className="w-24 h-24 rounded-full border-4 border-slate-100"/>
                                    <div className="absolute bottom-0 right-0 bg-slate-800 text-white p-1 rounded-full border-2 border-white cursor-pointer"><Camera size={14}/></div>
                                </div>
                             </div>
                             <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Nama Lengkap</label>
                                <input className="w-full border rounded-lg p-2" value={profileData.name} onChange={e => setProfileData({...profileData, name: e.target.value})} />
                             </div>
                             <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Bio Singkat</label>
                                <textarea className="w-full border rounded-lg p-2" value={profileData.bio} onChange={e => setProfileData({...profileData, bio: e.target.value})} />
                             </div>
                             <button onClick={handleUpdateProfile} className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700">Simpan Perubahan</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Assignment Submission Modal */}
            {isTaskModalOpen && selectedTask && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-lg animate-in fade-in zoom-in duration-200">
                        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                <Upload size={18} className="text-blue-600"/> Penyerahan Tugas
                            </h3>
                            <button onClick={() => setIsTaskModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
                        </div>
                        <div className="p-6">
                             <div className="mb-4 bg-slate-50 p-3 rounded-lg border border-slate-100">
                                 <h4 className="font-bold text-slate-800 mb-1">{selectedTask.title}</h4>
                                 <p className="text-sm text-slate-500">Mata Pelajaran: {selectedTask.subject}</p>
                                 <p className="text-xs text-slate-400 mt-1">Tenggat: {selectedTask.due}</p>
                             </div>

                             <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Jawaban / Catatan</label>
                                    <textarea 
                                        className="w-full border rounded-lg p-3 h-32 focus:ring-2 focus:ring-blue-500 outline-none" 
                                        placeholder="Ketik jawaban Anda di sini..."
                                        value={submissionText}
                                        onChange={(e) => setSubmissionText(e.target.value)}
                                    />
                                </div>
                                
                                <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:bg-slate-50 transition-colors cursor-pointer">
                                    <Upload size={24} className="mx-auto text-slate-400 mb-2"/>
                                    <p className="text-sm font-medium text-slate-600">Upload File Tugas (PDF/DOCX)</p>
                                    <p className="text-xs text-slate-400 mt-1">Maks 10MB</p>
                                </div>

                                <div className="bg-blue-50 p-3 rounded-lg flex items-start gap-3">
                                    <MessageSquare size={18} className="text-blue-600 mt-1 shrink-0"/>
                                    <div>
                                        <p className="text-xs font-bold text-blue-800">Pesan untuk Guru:</p>
                                        <p className="text-xs text-blue-600">Anda dapat berdiskusi atau bertanya mengenai tugas ini setelah diserahkan.</p>
                                    </div>
                                </div>
                             </div>

                             <div className="mt-6 flex justify-end gap-2">
                                 <button onClick={() => setIsTaskModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Batal</button>
                                 <button 
                                    onClick={handleSubmitTask} 
                                    disabled={isSubmitting || !submissionText}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50"
                                 >
                                    {isSubmitting ? 'Mengirim...' : <><Send size={16}/> Serahkan Tugas</>}
                                 </button>
                             </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Transcript Modal */}
            {isTranscriptModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl animate-in fade-in zoom-in duration-200">
                        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                <FileText size={18} className="text-blue-600"/> Transkrip Nilai & Umpan Balik
                            </h3>
                            <button onClick={() => setIsTranscriptModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
                        </div>
                        <div className="p-6">
                             <div className="flex items-center gap-4 mb-6">
                                <div className="bg-blue-100 text-blue-700 px-4 py-2 rounded-lg text-center">
                                    <span className="block text-xs font-bold uppercase">IPK Smt</span>
                                    <span className="block text-xl font-bold">3.85</span>
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-800">Semester Ganjil 2024/2025</h4>
                                    <p className="text-sm text-slate-500">Total SKS Diambil: 21</p>
                                </div>
                             </div>

                             <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                                {dataStudentGrades.map((grade, idx) => (
                                    <div key={idx} className="border border-slate-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                                        <div className="flex justify-between items-start mb-2">
                                            <h5 className="font-bold text-slate-800">{grade.subject}</h5>
                                            <span className={`px-2 py-1 rounded text-xs font-bold ${
                                                grade.nilai >= 85 ? 'bg-green-100 text-green-700' :
                                                grade.nilai >= 75 ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'
                                            }`}>
                                                Nilai: {grade.nilai} (A)
                                            </span>
                                        </div>
                                        <div className="bg-slate-50 p-3 rounded text-sm text-slate-600">
                                            <p className="font-semibold text-xs text-slate-400 mb-1 flex items-center gap-1">
                                                <MessageSquare size={10} /> Catatan Guru:
                                            </p>
                                            "{grade.feedback}"
                                        </div>
                                    </div>
                                ))}
                             </div>
                             
                             <div className="mt-6 flex justify-end">
                                 <button onClick={() => setIsTranscriptModalOpen(false)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200">Tutup</button>
                             </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
  };

  // --- RENDER SWITCHER ---
  if (currentUser.role === UserRole.TEACHER) {
      return <TeacherDashboard />;
  }
  
  if (currentUser.role === UserRole.STUDENT) {
      return <StudentDashboard />;
  }

  // Default to Admin
  return <AdminDashboard />;
};