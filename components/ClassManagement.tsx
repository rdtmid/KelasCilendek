import React, { useState, useEffect } from 'react';
import { MOCK_USERS, INDONESIAN_HOLIDAYS_2025 } from '../constants';
import { UserRole, ClassSession, Assignment, User, Curriculum } from '../types';
import { Plus, Users, Calendar, X, Trash2, BookOpen, CheckSquare, Edit3, TrendingUp, GraduationCap, Clock, PlayCircle, Link as LinkIcon, ExternalLink, Award, User as UserIcon } from 'lucide-react';

interface StudentGrade { id: number; name: string; assignment: number; midExam: number; finalExam: number; feedback: string; }
interface StudentAttendance { id: number; name: string; status: 'present' | 'permission' | 'alpha'; }
interface StudentClassReport { id: string; className: string; subject: string; grade: number; attendance: number; teacher: string; }
interface StudentDetail { id: number; name: string; overallGpa: number; attendanceRate: number; completedCredits: number; recentActivities: string[]; classReports: StudentClassReport[]; }
interface ClassProgressSummary { studentId: string; name: string; avatar: string; attendancePct: number; avgGrade: number; assignmentsCompleted: number; totalAssignments: number; status: 'Excellent' | 'Good' | 'Warning' | 'Critical'; }
interface ClassManagementProps { currentUser: User; onStartSession?: (cls: ClassSession, topic: string) => void; }

const calculateAutoProgress = (startDate: string, dayOfWeek: number, totalMeetings: number): number => {
    if (!startDate || !totalMeetings || totalMeetings <= 0) return 0;
    let meetingsPassed = 0;
    let validMeetingsFound = 0;
    let current = new Date(startDate);
    const today = new Date();
    today.setHours(23, 59, 59, 999); 
    while (current.getDay() !== dayOfWeek) { current.setDate(current.getDate() + 1); }
    let safety = 0;
    while (validMeetingsFound < totalMeetings && safety < 100) {
        const dateStr = current.toISOString().split('T')[0];
        const isHoliday = INDONESIAN_HOLIDAYS_2025.some(h => h.date === dateStr);
        if (!isHoliday) {
            validMeetingsFound++;
            if (current <= today) { meetingsPassed++; }
        }
        current.setDate(current.getDate() + 7);
        safety++;
    }
    return Math.min(Math.round((meetingsPassed / totalMeetings) * 100), 100);
};

const AnimatedProgressBar = ({ value }: { value: number }) => {
  const [width, setWidth] = useState(0);
  useEffect(() => { const timer = setTimeout(() => { setWidth(value); }, 300); return () => clearTimeout(timer); }, [value]);
  return (<div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden"><div className="bg-blue-500 h-2 rounded-full transition-all duration-1000 ease-out" style={{width: `${width}%`}}></div></div>);
};

export const ClassManagement: React.FC<ClassManagementProps> = ({ currentUser, onStartSession }) => {
  const isAdmin = currentUser.role === UserRole.ADMIN;
  const isTeacher = currentUser.role === UserRole.TEACHER;

  const [classes, setClasses] = useState<ClassSession[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [savedCurriculums, setSavedCurriculums] = useState<Curriculum[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'add' | 'edit' | 'grades' | 'attendance' | 'studentDetail' | 'createAssignment' | 'startSession' | 'classProgress'>('add');
  const [selectedClass, setSelectedClass] = useState<ClassSession | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<StudentDetail | null>(null);
  
  const [sessionTopic, setSessionTopic] = useState('');
  const [availableTopics, setAvailableTopics] = useState<string[]>([]);
  const [useCustomTopic, setUseCustomTopic] = useState(false);

  const [classProgressData, setClassProgressData] = useState<ClassProgressSummary[]>([]);
  const [progressSearch, setProgressSearch] = useState('');

  const [formData, setFormData] = useState({
    className: '', subject: '', teacherId: '', schedule: '', studentCount: 30, progress: 0, curriculumId: ''
  });
  const [assignmentData, setAssignmentData] = useState<Partial<Assignment>>({
    title: '', description: '', deadline: '', type: 'Tugas'
  });
  const [scheduleConfig, setScheduleConfig] = useState({
    startDate: new Date().toISOString().split('T')[0], dayOfWeek: 1, totalMeetings: 16
  });
  const [tempGrades, setTempGrades] = useState<StudentGrade[]>([]);
  const [tempAttendance, setTempAttendance] = useState<StudentAttendance[]>([]);

  // FETCH DATA FROM API
  useEffect(() => {
    fetchClasses();
    fetchUsers();
    fetchCurriculums();
  }, []);

  const fetchClasses = async () => {
    try {
        const res = await fetch('/api/classes');
        if (res.ok) setClasses(await res.json());
    } catch(e) { console.error(e); }
  };

  const fetchUsers = async () => {
    try {
        const res = await fetch('/api/users');
        if (res.ok) setUsers(await res.json());
    } catch(e) { console.error(e); }
  };

  const fetchCurriculums = async () => {
    try {
        const res = await fetch('/api/curriculums');
        if (res.ok) setSavedCurriculums(await res.json());
    } catch(e) { console.error(e); }
  };

  const teachers = users.filter(u => u.role === UserRole.TEACHER);

  const handleOpenAddModal = () => {
    setModalType('add');
    setFormData({ className: '', subject: '', teacherId: teachers[0]?.id || '', schedule: '', studentCount: 30, progress: 0, curriculumId: '' });
    setScheduleConfig({ startDate: new Date().toISOString().split('T')[0], dayOfWeek: 1, totalMeetings: 16 });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (cls: ClassSession) => {
    setModalType('edit');
    setSelectedClass(cls);
    setFormData({
      className: cls.className, 
      subject: cls.subject, 
      teacherId: cls.teacherId, 
      schedule: cls.schedule, 
      studentCount: cls.studentCount, 
      progress: cls.progress || 0,
      curriculumId: cls.curriculumId || ''
    });
    setScheduleConfig({ startDate: cls.startDate || new Date().toISOString().split('T')[0], dayOfWeek: cls.dayOfWeek || 1, totalMeetings: cls.totalMeetings || 16 });
    setIsModalOpen(true);
  };

  const handleSaveClass = async () => {
    if (!formData.className || !formData.subject) return alert("Mohon lengkapi nama kelas dan mata pelajaran");
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const newSchedule = `${days[scheduleConfig.dayOfWeek]}, 08:00 WIB`;
    const calculatedProgress = calculateAutoProgress(scheduleConfig.startDate, scheduleConfig.dayOfWeek, scheduleConfig.totalMeetings);

    const payload = {
        className: formData.className,
        subject: formData.subject,
        teacherId: formData.teacherId,
        schedule: newSchedule,
        studentCount: Number(formData.studentCount),
        progress: calculatedProgress,
        startDate: scheduleConfig.startDate,
        dayOfWeek: Number(scheduleConfig.dayOfWeek),
        totalMeetings: Number(scheduleConfig.totalMeetings),
        curriculumId: formData.curriculumId
    };

    try {
        if (modalType === 'edit' && selectedClass) {
            await fetch(`/api/classes/${selectedClass.id}`, {
                method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify(payload)
            });
        } else {
            const newId = `c${Date.now()}`;
            await fetch('/api/classes', {
                method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({id: newId, ...payload})
            });
        }
        fetchClasses();
        setIsModalOpen(false);
    } catch(e) { alert("Gagal menyimpan kelas"); }
  };

  const handleDelete = async (id: string) => {
     if (window.confirm("Yakin hapus kelas ini?")) {
        try {
            await fetch(`/api/classes/${id}`, { method: 'DELETE' });
            fetchClasses();
        } catch(e) { alert("Gagal menghapus"); }
     }
  };

  // --- Start Session Logic ---
  const handleInitiateSession = (cls: ClassSession) => {
    setSelectedClass(cls);
    // Find matching curriculum from state
    let matchingCurr = savedCurriculums.find(c => c.id === cls.curriculumId);
    if (!matchingCurr) {
        matchingCurr = savedCurriculums.find(c => c.subject.toLowerCase().includes(cls.subject.toLowerCase()) || cls.subject.toLowerCase().includes(c.subject.toLowerCase()));
    }
    
    if (matchingCurr) {
        setAvailableTopics(matchingCurr.modules.filter(m => !m.isHoliday).map(m => m.topic));
    } else {
        setAvailableTopics([]);
    }
    setSessionTopic('');
    setUseCustomTopic(false);
    setModalType('startSession');
    setIsModalOpen(true);
  };

  const confirmStartSession = () => {
    if (!sessionTopic) return alert("Pilih atau isi topik pembelajaran.");
    if (selectedClass && onStartSession) {
        onStartSession(selectedClass, sessionTopic);
    }
    setIsModalOpen(false);
  };

  // --- MOCK LOGIC PRESERVED FOR DEMO (Grades, Attendance, etc.) ---
  const generateMockStudents = (count: number) => Array.from({ length: 5 }, (_, i) => ({ id: i + 1, name: `Siswa ${String.fromCharCode(65 + i)}` }));
  const handleViewGrades = (cls: ClassSession) => {
    setSelectedClass(cls); setModalType('grades');
    const students = generateMockStudents(5);
    setTempGrades(students.map(s => ({ ...s, assignment: 80, midExam: 75, finalExam: 85, feedback: '' })));
    setIsModalOpen(true);
  };
  const handleAttendance = (cls: ClassSession) => {
    setSelectedClass(cls); setModalType('attendance');
    const students = generateMockStudents(5);
    setTempAttendance(students.map(s => ({ ...s, status: 'present' })));
    setIsModalOpen(true);
  };
  const handleCreateAssignment = (cls: ClassSession) => {
    setSelectedClass(cls); setModalType('createAssignment');
    setAssignmentData({ title: '', description: '', deadline: new Date().toISOString().split('T')[0], type: 'Tugas' });
    setIsModalOpen(true);
  };
  const handleSaveAssignment = () => { if(!assignmentData.title) return; alert("Tugas dibuat!"); setIsModalOpen(false); };
  
  const handleViewStudentDetail = (id: number, name: string) => {
     const enrolledClasses: StudentClassReport[] = classes.map(cls => ({
         id: cls.id, className: cls.className, subject: cls.subject,
         grade: Math.floor(Math.random() * (95 - 65) + 65),
         attendance: Math.floor(Math.random() * (100 - 70) + 70),
         teacher: users.find(u => u.id === cls.teacherId)?.name || 'Guru'
     }));
     const avgGrade = enrolledClasses.reduce((acc, curr) => acc + curr.grade, 0) / enrolledClasses.length;
     const avgAtt = enrolledClasses.reduce((acc, curr) => acc + curr.attendance, 0) / enrolledClasses.length;
     setSelectedStudent({ 
         id, name, overallGpa: Number((avgGrade / 25).toFixed(2)), attendanceRate: Math.round(avgAtt), 
         completedCredits: enrolledClasses.length * 3, recentActivities: ['Menyerahkan Tugas', 'Hadir'], classReports: enrolledClasses
     });
     setModalType('studentDetail');
  };

  const handleViewClassProgress = (cls: ClassSession) => {
      setSelectedClass(cls); setProgressSearch(''); setModalType('classProgress');
      const mockData: ClassProgressSummary[] = Array.from({ length: cls.studentCount }, (_, i) => {
          const attendancePct = Math.floor(Math.random() * (100 - 60) + 60);
          const avgGrade = Math.floor(Math.random() * (100 - 50) + 50);
          let status: 'Excellent' | 'Good' | 'Warning' | 'Critical' = 'Good';
          if (attendancePct > 90 && avgGrade > 85) status = 'Excellent';
          else if (attendancePct < 70 || avgGrade < 60) status = 'Warning';
          if (attendancePct < 50 || avgGrade < 40) status = 'Critical';
          return {
              studentId: `stu-${i}`, name: `Siswa Peserta ${i + 1}`, avatar: `https://ui-avatars.com/api/?name=Siswa+${i+1}&background=random`,
              attendancePct, avgGrade, assignmentsCompleted: 8, totalAssignments: 10, status
          };
      });
      setClassProgressData(mockData);
      setIsModalOpen(true);
  };

  // --- Render Modals ---
  const renderModalContent = () => {
    if (modalType === 'startSession' && selectedClass) {
        return (
            <div className="space-y-6">
                <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 flex gap-4 items-start">
                    <div className="bg-white p-2 rounded-lg text-indigo-600"><GraduationCap size={24} /></div>
                    <div>
                        <h4 className="font-bold text-indigo-900">{selectedClass.className}</h4>
                        <p className="text-sm text-indigo-700">{selectedClass.subject}</p>
                    </div>
                </div>
                <div className="space-y-4">
                    <label className="block text-sm font-medium text-slate-700">Materi Pembelajaran Hari Ini</label>
                    {!useCustomTopic && availableTopics.length > 0 ? (
                        <div className="space-y-3">
                            <select className="w-full border border-slate-300 rounded-lg p-3" value={sessionTopic} onChange={(e) => setSessionTopic(e.target.value)}>
                                <option value="">-- Pilih Topik dari Kurikulum --</option>
                                {availableTopics.map((topic, idx) => ( <option key={idx} value={topic}>{topic}</option> ))}
                            </select>
                            <button onClick={() => { setUseCustomTopic(true); setSessionTopic(''); }} className="w-full py-2 border border-dashed text-sm">Input Materi Baru</button>
                        </div>
                    ) : (
                        <div className="space-y-3">
                             <input className="w-full border rounded-lg p-3" placeholder="Masukkan Judul Materi..." value={sessionTopic} onChange={(e) => setSessionTopic(e.target.value)}/>
                             {availableTopics.length > 0 && <button onClick={() => { setUseCustomTopic(false); setSessionTopic(''); }} className="text-sm text-indigo-600">&larr; Kembali ke Kurikulum</button>}
                        </div>
                    )}
                </div>
                <div className="flex justify-end gap-2 pt-2">
                    <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600">Batal</button>
                    <button onClick={confirmStartSession} disabled={!sessionTopic} className="px-6 py-2 bg-indigo-600 text-white rounded-lg flex items-center gap-2"><PlayCircle size={18} /> Mulai Kelas</button>
                </div>
            </div>
        );
    }

    if (modalType === 'add' || modalType === 'edit') {
        return (
            <div className="space-y-4">
                 <div><label className="block text-sm font-medium">Nama Kelas</label><input className="w-full border rounded p-2" value={formData.className} onChange={e=>setFormData({...formData, className:e.target.value})} /></div>
                 <div><label className="block text-sm font-medium">Mata Pelajaran</label><input className="w-full border rounded p-2" value={formData.subject} onChange={e=>setFormData({...formData, subject:e.target.value})} /></div>
                 <div>
                    <label className="block text-sm font-medium flex gap-2"><LinkIcon size={14}/> Tautkan Kurikulum</label>
                    <select className="w-full border rounded p-2" value={formData.curriculumId} onChange={(e) => {
                        const selectedId = e.target.value;
                        const curr = savedCurriculums.find(c => c.id === selectedId);
                        setFormData(prev => ({ ...prev, curriculumId: selectedId, subject: curr ? curr.subject : prev.subject }));
                    }}>
                        <option value="">-- Tidak Ada --</option>
                        {savedCurriculums.map(c => <option key={c.id} value={c.id}>{c.name} ({c.subject})</option>)}
                    </select>
                 </div>
                 <div>
                    <label className="block text-sm font-medium">Guru Pengampu</label>
                    <select className="w-full border rounded p-2" value={formData.teacherId} onChange={e=>setFormData({...formData, teacherId:e.target.value})}>
                        {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                 </div>
                 <div className="flex justify-end"><button onClick={handleSaveClass} className="bg-blue-600 text-white px-4 py-2 rounded">Simpan</button></div>
            </div>
        );
    }

    // Existing Placeholders for other modals
    return <div className="text-center p-4">Fitur ini tersedia dalam demo lengkap.</div>;
  };

  return (
    <div className="space-y-6 relative">
      <div className="flex justify-between items-center">
        <div><h2 className="text-2xl font-bold text-slate-800">Manajemen Kelas</h2></div>
        {isAdmin && <button onClick={handleOpenAddModal} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"><Plus size={18} /> Tambah Kelas</button>}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {classes.map((cls) => {
            const currentProgress = cls.startDate ? calculateAutoProgress(cls.startDate, cls.dayOfWeek || 1, cls.totalMeetings || 16) : cls.progress || 0;
            const linkedCurriculum = savedCurriculums.find(c => c.id === cls.curriculumId);
            return (
              <div key={cls.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col">
                  <div className="flex justify-between items-start mb-4">
                    <div><h3 className="text-xl font-bold text-slate-800">{cls.className}</h3><p className="text-sm text-blue-600 font-medium">{cls.subject}</p></div>
                    {isAdmin && <div className="flex gap-1"><button onClick={() => handleOpenEditModal(cls)} className="text-slate-300 hover:text-blue-500 p-1"><Edit3 size={18} /></button><button onClick={() => handleDelete(cls.id)} className="text-slate-300 hover:text-red-500 p-1"><Trash2 size={18} /></button></div>}
                  </div>
                  <div className="space-y-3 mb-6">
                     <div className="flex items-center gap-3 text-slate-600"><Users size={18} /><span className="text-sm">{cls.studentCount} Siswa</span></div>
                     {linkedCurriculum && <div className="flex items-center gap-3 text-indigo-600 bg-indigo-50 p-2 rounded-lg"><LinkIcon size={14} /><span className="text-xs font-semibold truncate">Kurikulum: {linkedCurriculum.name}</span></div>}
                  </div>
                  <div className="mb-4"><div className="flex justify-between items-center text-xs mb-1"><span>Progress</span><span className="font-semibold">{currentProgress}%</span></div><AnimatedProgressBar value={currentProgress} /></div>
                  {isTeacher && currentUser.id === cls.teacherId && <button onClick={() => handleInitiateSession(cls)} className="w-full bg-indigo-600 text-white py-2 rounded-lg flex items-center justify-center gap-2 font-semibold"><PlayCircle size={18} /> Mulai Sesi</button>}
              </div>
            );
        })}
      </div>
      {isModalOpen && <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"><div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6"><h3 className="font-bold mb-4">Menu Kelas</h3>{renderModalContent()}</div></div>}
    </div>
  );
};