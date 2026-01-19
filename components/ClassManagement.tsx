import React, { useState, useEffect } from 'react';
import { MOCK_CLASSES, MOCK_USERS, INDONESIAN_HOLIDAYS_2025 } from '../constants';
import { UserRole, ClassSession, Assignment, User, Curriculum } from '../types';
import { Plus, Users, Calendar, MoreVertical, X, Save, Trash2, BookOpen, CheckSquare, Edit3, TrendingUp, GraduationCap, Clock, AlertCircle, CheckCircle, FilePlus, MessageSquare, PlayCircle, ChevronRight, Search, Filter, Link as LinkIcon, ExternalLink, Award, User as UserIcon } from 'lucide-react';

interface StudentGrade {
  id: number;
  name: string;
  assignment: number;
  midExam: number;
  finalExam: number;
  feedback: string;
}

interface StudentAttendance {
  id: number;
  name: string;
  status: 'present' | 'permission' | 'alpha';
}

interface StudentClassReport {
    id: string;
    className: string;
    subject: string;
    grade: number;
    attendance: number;
    teacher: string;
}

interface StudentDetail {
  id: number;
  name: string;
  overallGpa: number;
  attendanceRate: number;
  completedCredits: number;
  recentActivities: string[];
  classReports: StudentClassReport[];
}

interface ClassProgressSummary {
    studentId: string;
    name: string;
    avatar: string;
    attendancePct: number;
    avgGrade: number;
    assignmentsCompleted: number;
    totalAssignments: number;
    status: 'Excellent' | 'Good' | 'Warning' | 'Critical';
}

interface ClassManagementProps {
  currentUser: User;
  onStartSession?: (cls: ClassSession, topic: string) => void;
}

const calculateAutoProgress = (startDate: string, dayOfWeek: number, totalMeetings: number): number => {
    if (!startDate || !totalMeetings || totalMeetings <= 0) return 0;
    let meetingsPassed = 0;
    let validMeetingsFound = 0;
    let current = new Date(startDate);
    const today = new Date();
    today.setHours(23, 59, 59, 999); 

    while (current.getDay() !== dayOfWeek) {
        current.setDate(current.getDate() + 1);
    }
    let safety = 0;
    while (validMeetingsFound < totalMeetings && safety < 100) {
        const dateStr = current.toISOString().split('T')[0];
        const isHoliday = INDONESIAN_HOLIDAYS_2025.some(h => h.date === dateStr);
        if (!isHoliday) {
            validMeetingsFound++;
            if (current <= today) {
                meetingsPassed++;
            }
        }
        current.setDate(current.getDate() + 7);
        safety++;
    }
    return Math.min(Math.round((meetingsPassed / totalMeetings) * 100), 100);
};

const AnimatedProgressBar = ({ value }: { value: number }) => {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const timer = setTimeout(() => { setWidth(value); }, 300);
    return () => clearTimeout(timer);
  }, [value]);
  return (
    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
      <div className="bg-blue-500 h-2 rounded-full transition-all duration-1000 ease-out" style={{width: `${width}%`}}></div>
    </div>
  );
};

export const ClassManagement: React.FC<ClassManagementProps> = ({ currentUser, onStartSession }) => {
  const isAdmin = currentUser.role === UserRole.ADMIN;
  const isTeacher = currentUser.role === UserRole.TEACHER;

  const [classes, setClasses] = useState<ClassSession[]>(MOCK_CLASSES);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'add' | 'edit' | 'grades' | 'attendance' | 'studentDetail' | 'createAssignment' | 'startSession' | 'classProgress'>('add');
  const [selectedClass, setSelectedClass] = useState<ClassSession | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<StudentDetail | null>(null);
  
  // State for session start
  const [sessionTopic, setSessionTopic] = useState('');
  const [availableTopics, setAvailableTopics] = useState<string[]>([]);
  const [useCustomTopic, setUseCustomTopic] = useState(false);

  // State for Class Progress
  const [classProgressData, setClassProgressData] = useState<ClassProgressSummary[]>([]);
  const [progressSearch, setProgressSearch] = useState('');

  // Saved Curriculums State
  const [savedCurriculums, setSavedCurriculums] = useState<Curriculum[]>([]);

  // States for CRUD & Grading... (Keep existing states)
  const [formData, setFormData] = useState({
    className: '', subject: '', teacherId: '', schedule: '', studentCount: 30, progress: 0, curriculumId: ''
  });
  const [assignmentData, setAssignmentData] = useState<Partial<Assignment>>({
    title: '', description: '', deadline: '', type: 'Tugas'
  });
  const [scheduleConfig, setScheduleConfig] = useState({
    startDate: new Date().toISOString().split('T')[0], dayOfWeek: 1, totalMeetings: 16
  });
  const [projectedDates, setProjectedDates] = useState<{date: string, isHoliday: boolean, holidayName?: string, meetingNo: number}[]>([]);
  const [tempGrades, setTempGrades] = useState<StudentGrade[]>([]);
  const [tempAttendance, setTempAttendance] = useState<StudentAttendance[]>([]);

  const teachers = MOCK_USERS.filter(u => u.role === UserRole.TEACHER);

  useEffect(() => {
    // Load curriculums
    const saved = localStorage.getItem('edu_curriculums');
    if (saved) {
        setSavedCurriculums(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    if ((modalType === 'add' || modalType === 'edit') && scheduleConfig.startDate) {
      calculateSchedule();
    }
  }, [scheduleConfig, modalType]);

  const calculateSchedule = () => {
    // ... (Keep existing schedule calc logic)
    const dates = [];
    let currentDate = new Date(scheduleConfig.startDate);
    let meetingCounter = 1;
    let attempts = 0;
    while (currentDate.getDay() !== Number(scheduleConfig.dayOfWeek) && attempts < 7) {
      currentDate.setDate(currentDate.getDate() + 1);
      attempts++;
    }
    while (dates.length < scheduleConfig.totalMeetings && attempts < 100) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const holiday = INDONESIAN_HOLIDAYS_2025.find(h => h.date === dateStr);
      if (holiday) {
        dates.push({ date: dateStr, isHoliday: true, holidayName: holiday.name, meetingNo: 0 });
      } else {
        dates.push({ date: dateStr, isHoliday: false, meetingNo: meetingCounter });
        meetingCounter++;
      }
      currentDate.setDate(currentDate.getDate() + 7);
      attempts++;
    }
    setProjectedDates(dates);
  };

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

  const handleSaveClass = () => {
    // ... (Keep existing save logic)
    if (!formData.className || !formData.subject) return alert("Mohon lengkapi nama kelas dan mata pelajaran");
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const newSchedule = `${days[scheduleConfig.dayOfWeek]}, 08:00 WIB`;
    const calculatedProgress = calculateAutoProgress(scheduleConfig.startDate, scheduleConfig.dayOfWeek, scheduleConfig.totalMeetings);

    if (modalType === 'edit' && selectedClass) {
      setClasses(prev => prev.map(c => c.id === selectedClass.id ? { 
        ...c, ...formData, schedule: newSchedule, studentCount: Number(formData.studentCount), progress: calculatedProgress, startDate: scheduleConfig.startDate, dayOfWeek: scheduleConfig.dayOfWeek, totalMeetings: scheduleConfig.totalMeetings
      } : c));
    } else {
      const newId = `c${Date.now()}`;
      const cls: ClassSession = {
        id: newId, ...formData, schedule: newSchedule, studentCount: Number(formData.studentCount), progress: calculatedProgress, startDate: scheduleConfig.startDate, dayOfWeek: scheduleConfig.dayOfWeek, totalMeetings: scheduleConfig.totalMeetings
      };
      setClasses([...classes, cls]);
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
     if (window.confirm("Yakin hapus?")) setClasses(prev => prev.filter(c => c.id !== id));
  };

  // --- Start Session Logic ---
  const handleInitiateSession = (cls: ClassSession) => {
    setSelectedClass(cls);
    
    // Fetch topics from Saved Curriculums
    const savedCurriculumsRaw = localStorage.getItem('edu_curriculums');
    const savedCurriculums: Curriculum[] = savedCurriculumsRaw ? JSON.parse(savedCurriculumsRaw) : [];
    
    // Logic 1: Use explicitly linked curriculum
    let matchingCurr = savedCurriculums.find(c => c.id === cls.curriculumId);
    
    // Logic 2: Fallback to subject matching
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

  // --- Handlers for Grades/Attendance/Tasks (Keep existing) ---
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

  const handleSaveAssignment = () => {
      if(!assignmentData.title) return;
      alert("Tugas dibuat!"); setIsModalOpen(false);
  };

  const handleViewStudentDetail = (id: number, name: string) => {
     // Generate random mock report for other classes
     const enrolledClasses: StudentClassReport[] = classes.map(cls => ({
         id: cls.id,
         className: cls.className,
         subject: cls.subject,
         grade: Math.floor(Math.random() * (95 - 65) + 65), // Random 65-95
         attendance: Math.floor(Math.random() * (100 - 70) + 70), // Random 70-100%
         teacher: MOCK_USERS.find(u => u.id === cls.teacherId)?.name || 'Guru Pengampu'
     }));

     // Calculate Overall Stats based on generated data
     const avgGrade = enrolledClasses.reduce((acc, curr) => acc + curr.grade, 0) / enrolledClasses.length;
     const avgAtt = enrolledClasses.reduce((acc, curr) => acc + curr.attendance, 0) / enrolledClasses.length;

     setSelectedStudent({ 
         id, 
         name, 
         overallGpa: Number((avgGrade / 25).toFixed(2)), // Rough GPA Conv
         attendanceRate: Math.round(avgAtt), 
         completedCredits: enrolledClasses.length * 3, // Mock credits
         recentActivities: ['Menyerahkan Tugas', 'Hadir di Kelas', 'Mengikuti Kuis'],
         classReports: enrolledClasses
     });
     setModalType('studentDetail');
  };

  const handleDownloadTranscript = () => {
    if (!selectedStudent) return;

    const printWindow = window.open('', '', 'width=800,height=600');
    if (!printWindow) return;

    const tableRows = selectedStudent.classReports.map((report, i) => `
        <tr>
            <td style="padding: 8px; border: 1px solid #ddd;">${i + 1}</td>
            <td style="padding: 8px; border: 1px solid #ddd;">${report.subject}</td>
            <td style="padding: 8px; border: 1px solid #ddd;">${report.className}</td>
            <td style="padding: 8px; border: 1px solid #ddd;">${report.teacher}</td>
            <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${report.grade}</td>
            <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${report.grade >= 85 ? 'A' : report.grade >= 75 ? 'B' : report.grade >= 60 ? 'C' : 'D'}</td>
        </tr>
    `).join('');

    const content = `
      <html>
        <head>
          <title>Transkrip Nilai - ${selectedStudent.name}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; }
            h1 { color: #1e40af; margin-bottom: 5px; }
            .header { margin-bottom: 30px; border-bottom: 2px solid #eee; padding-bottom: 20px; }
            .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 14px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { background-color: #f3f4f6; padding: 10px; border: 1px solid #ddd; text-align: left; }
            td { font-size: 14px; }
            .footer { margin-top: 40px; text-align: right; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>DidacticBoard - Transkrip Akademik</h1>
            <div class="meta-grid">
                <div>
                    <p><strong>Nama Siswa:</strong> ${selectedStudent.name}</p>
                    <p><strong>ID Siswa:</strong> ${selectedStudent.id}</p>
                </div>
                <div>
                    <p><strong>IPK Kumulatif:</strong> ${selectedStudent.overallGpa}</p>
                    <p><strong>Tingkat Kehadiran:</strong> ${selectedStudent.attendanceRate}%</p>
                </div>
            </div>
          </div>

          <h3>Rincian Hasil Studi</h3>
          <table>
            <thead>
              <tr>
                <th style="width: 40px">No</th>
                <th>Mata Pelajaran</th>
                <th>Kelas</th>
                <th>Guru Pengampu</th>
                <th style="width: 60px; text-align: center;">Nilai</th>
                <th style="width: 60px; text-align: center;">Grade</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
          </table>

          <div class="footer">
            <p>Dicetak pada: ${new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            <p>Dokumen ini digenerate secara otomatis oleh sistem DidacticBoard.</p>
          </div>
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(content);
    printWindow.document.close();
  };

  // --- NEW: Class Progress Handler ---
  const handleViewClassProgress = (cls: ClassSession) => {
      setSelectedClass(cls);
      setProgressSearch('');
      setModalType('classProgress');
      
      // Generate Mock Progress Data for this specific class
      const mockData: ClassProgressSummary[] = Array.from({ length: cls.studentCount }, (_, i) => {
          const attendancePct = Math.floor(Math.random() * (100 - 60) + 60); // Random 60-100%
          const avgGrade = Math.floor(Math.random() * (100 - 50) + 50); // Random 50-100
          const totalAssignments = 10;
          const assignmentsCompleted = Math.floor(Math.random() * 10) + 1;

          let status: 'Excellent' | 'Good' | 'Warning' | 'Critical' = 'Good';
          if (attendancePct > 90 && avgGrade > 85) status = 'Excellent';
          else if (attendancePct < 70 || avgGrade < 60) status = 'Warning';
          if (attendancePct < 50 || avgGrade < 40) status = 'Critical';

          return {
              studentId: `stu-${i}`,
              name: `Siswa Peserta ${i + 1}`,
              avatar: `https://ui-avatars.com/api/?name=Siswa+${i+1}&background=random`,
              attendancePct,
              avgGrade,
              assignmentsCompleted,
              totalAssignments,
              status
          };
      });

      // Sort by status priority (Critical first) to help teacher focus
      mockData.sort((a, b) => {
          const priority = { 'Critical': 0, 'Warning': 1, 'Good': 2, 'Excellent': 3 };
          return priority[a.status] - priority[b.status];
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
                    <div className="bg-white p-2 rounded-lg text-indigo-600">
                        <GraduationCap size={24} />
                    </div>
                    <div>
                        <h4 className="font-bold text-indigo-900">{selectedClass.className}</h4>
                        <p className="text-sm text-indigo-700">{selectedClass.subject}</p>
                        <p className="text-xs text-indigo-500 mt-1 flex items-center gap-1"><Clock size={12}/> Jadwal: {selectedClass.schedule}</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <label className="block text-sm font-medium text-slate-700">Materi Pembelajaran Hari Ini</label>
                    
                    {!useCustomTopic && availableTopics.length > 0 ? (
                        <div className="space-y-3">
                            <select 
                                className="w-full border border-slate-300 rounded-lg p-3 bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                value={sessionTopic}
                                onChange={(e) => setSessionTopic(e.target.value)}
                            >
                                <option value="">-- Pilih Topik dari Kurikulum --</option>
                                {availableTopics.map((topic, idx) => (
                                    <option key={idx} value={topic}>{topic}</option>
                                ))}
                            </select>
                            <div className="text-center">
                                <span className="text-xs text-slate-400 uppercase font-semibold tracking-wider">- ATAU -</span>
                            </div>
                            <button 
                                onClick={() => { setUseCustomTopic(true); setSessionTopic(''); }}
                                className="w-full py-2 border border-dashed border-slate-300 rounded-lg text-slate-500 hover:text-indigo-600 hover:border-indigo-300 text-sm font-medium transition-colors"
                            >
                                Input Materi Baru / Tambahan
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-3">
                             <input 
                                className="w-full border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 outline-none"
                                placeholder="Masukkan Judul Materi..."
                                value={sessionTopic}
                                onChange={(e) => setSessionTopic(e.target.value)}
                                autoFocus
                             />
                             {availableTopics.length > 0 && (
                                <button 
                                    onClick={() => { setUseCustomTopic(false); setSessionTopic(''); }}
                                    className="text-sm text-indigo-600 hover:underline"
                                >
                                    &larr; Kembali pilih dari Kurikulum
                                </button>
                             )}
                        </div>
                    )}
                </div>

                <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-100 text-xs text-yellow-800 flex gap-2">
                    <AlertCircle size={16} className="shrink-0"/>
                    <p>Setelah memulai, Anda dapat melakukan absensi, berbagi file materi, dan berdiskusi dengan siswa secara interaktif.</p>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                    <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium">Batal</button>
                    <button 
                        onClick={confirmStartSession} 
                        disabled={!sessionTopic}
                        className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2 font-bold shadow-md shadow-indigo-200 disabled:opacity-50 disabled:shadow-none"
                    >
                        <PlayCircle size={18} /> Mulai Kelas
                    </button>
                </div>
            </div>
        );
    }

    if (modalType === 'classProgress' && selectedClass) {
        const filteredData = classProgressData.filter(d => d.name.toLowerCase().includes(progressSearch.toLowerCase()));
        
        return (
            <div className="flex flex-col h-full max-h-[75vh]">
                <div className="mb-4 bg-slate-50 p-4 rounded-lg border border-slate-200 flex flex-col md:flex-row justify-between gap-4">
                    <div>
                        <h4 className="font-bold text-slate-800 text-lg">{selectedClass.className}</h4>
                        <p className="text-sm text-slate-500">{selectedClass.subject}</p>
                    </div>
                    <div className="flex gap-4">
                         <div className="bg-white px-3 py-2 rounded border border-slate-200 shadow-sm text-center">
                             <span className="block text-xs text-slate-400 font-bold uppercase">Rata-rata Kelas</span>
                             <span className="block font-bold text-blue-600 text-lg">
                                 {Math.round(classProgressData.reduce((a,b) => a + b.avgGrade, 0) / classProgressData.length) || 0}
                             </span>
                         </div>
                         <div className="bg-white px-3 py-2 rounded border border-slate-200 shadow-sm text-center">
                             <span className="block text-xs text-slate-400 font-bold uppercase">Kehadiran</span>
                             <span className="block font-bold text-green-600 text-lg">
                                 {Math.round(classProgressData.reduce((a,b) => a + b.attendancePct, 0) / classProgressData.length) || 0}%
                             </span>
                         </div>
                    </div>
                </div>

                <div className="relative mb-4">
                    <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
                    <input 
                        className="w-full border border-slate-300 rounded-lg pl-10 pr-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder="Cari nama siswa..."
                        value={progressSearch}
                        onChange={(e) => setProgressSearch(e.target.value)}
                    />
                </div>

                <div className="flex-1 overflow-y-auto border border-slate-200 rounded-lg">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-100 text-slate-600 font-semibold sticky top-0 z-10">
                            <tr>
                                <th className="p-3">Siswa</th>
                                <th className="p-3">Kehadiran</th>
                                <th className="p-3">Nilai Rata-rata</th>
                                <th className="p-3">Tugas Selesai</th>
                                <th className="p-3">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredData.map(student => (
                                <tr key={student.studentId} className="hover:bg-slate-50">
                                    <td className="p-3 flex items-center gap-3">
                                        <img src={student.avatar} className="w-8 h-8 rounded-full bg-slate-200" />
                                        <button 
                                            onClick={() => handleViewStudentDetail(1, student.name)}
                                            className="font-medium text-blue-700 hover:text-blue-900 hover:underline text-left"
                                        >
                                            {student.name}
                                        </button>
                                    </td>
                                    <td className="p-3">
                                        <div className="flex items-center gap-2">
                                            <div className="flex-1 w-20 bg-slate-200 rounded-full h-1.5">
                                                <div 
                                                    className={`h-1.5 rounded-full ${student.attendancePct < 70 ? 'bg-red-500' : 'bg-green-500'}`} 
                                                    style={{ width: `${student.attendancePct}%` }}
                                                ></div>
                                            </div>
                                            <span className="text-xs font-medium">{student.attendancePct}%</span>
                                        </div>
                                    </td>
                                    <td className="p-3">
                                        <span className={`font-bold ${student.avgGrade < 60 ? 'text-red-600' : 'text-slate-700'}`}>
                                            {student.avgGrade}
                                        </span>
                                    </td>
                                    <td className="p-3 text-slate-600">
                                        {student.assignmentsCompleted} / {student.totalAssignments}
                                    </td>
                                    <td className="p-3">
                                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                                            student.status === 'Excellent' ? 'bg-green-100 text-green-700' :
                                            student.status === 'Good' ? 'bg-blue-100 text-blue-700' :
                                            student.status === 'Warning' ? 'bg-yellow-100 text-yellow-700' :
                                            'bg-red-100 text-red-700'
                                        }`}>
                                            {student.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    }
    
    // Fallback for other modals (Simplified for brevity, assuming existing render logic handles them based on modalType)
    if (modalType === 'createAssignment') { /* ... existing assignment form ... */ return (
        <div className="space-y-4">
             <input className="w-full border rounded p-2" placeholder="Judul Tugas" value={assignmentData.title} onChange={e=>setAssignmentData({...assignmentData, title:e.target.value})} />
             <textarea className="w-full border rounded p-2" placeholder="Deskripsi" value={assignmentData.description} onChange={e=>setAssignmentData({...assignmentData, description:e.target.value})} />
             <div className="flex justify-end"><button onClick={handleSaveAssignment} className="bg-blue-600 text-white px-4 py-2 rounded">Simpan</button></div>
        </div>
    )}
    
    // GRADES MODAL - Updated to have clickable names
    if (modalType === 'grades') { 
        return (
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                        <tr>
                            <th className="p-3">Nama Siswa</th>
                            <th className="p-3 text-center">Tugas</th>
                            <th className="p-3 text-center">UTS</th>
                            <th className="p-3 text-center">UAS</th>
                            <th className="p-3">Catatan</th>
                        </tr>
                    </thead>
                    <tbody>
                        {tempGrades.map((s, idx) => (
                            <tr key={idx} className="border-b border-slate-50 hover:bg-slate-50">
                                <td className="p-3">
                                    <button 
                                        onClick={() => handleViewStudentDetail(s.id, s.name)}
                                        className="font-medium text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-2"
                                    >
                                        <UserIcon size={14}/> {s.name}
                                    </button>
                                </td>
                                <td className="p-3 text-center">{s.assignment}</td>
                                <td className="p-3 text-center">{s.midExam}</td>
                                <td className="p-3 text-center">{s.finalExam}</td>
                                <td className="p-3 text-slate-500 italic">{s.feedback || '-'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        ); 
    }

    // ATTENDANCE MODAL - Updated to have clickable names
    if (modalType === 'attendance') { 
        return (
             <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                        <tr>
                            <th className="p-3">Nama Siswa</th>
                            <th className="p-3 text-center">Status Kehadiran</th>
                            <th className="p-3 text-center">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {tempAttendance.map((s, idx) => (
                            <tr key={idx} className="border-b border-slate-50 hover:bg-slate-50">
                                <td className="p-3">
                                    <button 
                                        onClick={() => handleViewStudentDetail(s.id, s.name)}
                                        className="font-medium text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-2"
                                    >
                                        <UserIcon size={14}/> {s.name}
                                    </button>
                                </td>
                                <td className="p-3 text-center">
                                    <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${s.status === 'present' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                        {s.status}
                                    </span>
                                </td>
                                <td className="p-3 text-center">
                                    <button className="text-xs bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded transition-colors">Ubah</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
             </div>
        ); 
    }

    // STUDENT DETAIL MODAL - Enhanced cross-class view
    if (modalType === 'studentDetail' && selectedStudent) { 
        return (
            <div className="space-y-6">
                <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="w-16 h-16 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-2xl font-bold">
                        {selectedStudent.name.charAt(0)}
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">{selectedStudent.name}</h2>
                        <p className="text-sm text-slate-500">ID: {selectedStudent.id} • Peserta Didik Aktif</p>
                        <div className="flex gap-3 mt-2">
                             <div className="text-xs bg-white border border-slate-200 px-2 py-1 rounded flex items-center gap-1">
                                 <Award size={12} className="text-yellow-500"/> IPK: <span className="font-bold">{selectedStudent.overallGpa}</span>
                             </div>
                             <div className="text-xs bg-white border border-slate-200 px-2 py-1 rounded flex items-center gap-1">
                                 <CheckCircle size={12} className="text-green-500"/> Kehadiran: <span className="font-bold">{selectedStudent.attendanceRate}%</span>
                             </div>
                        </div>
                    </div>
                </div>

                <div>
                    <h3 className="font-bold text-slate-700 mb-3 flex items-center gap-2">
                        <BookOpen size={18} className="text-blue-600"/> Laporan Akademik Lintas Mata Pelajaran
                    </h3>
                    <div className="border border-slate-200 rounded-lg overflow-hidden">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                                <tr>
                                    <th className="p-3">Mata Pelajaran</th>
                                    <th className="p-3">Kelas</th>
                                    <th className="p-3">Guru</th>
                                    <th className="p-3 text-center">Nilai Akhir</th>
                                    <th className="p-3 text-center">Kehadiran</th>
                                    <th className="p-3 text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {selectedStudent.classReports.map((report, i) => (
                                    <tr key={i} className="hover:bg-slate-50">
                                        <td className="p-3 font-medium text-slate-700">{report.subject}</td>
                                        <td className="p-3 text-slate-500 text-xs">{report.className}</td>
                                        <td className="p-3 text-slate-500 text-xs">{report.teacher}</td>
                                        <td className="p-3 text-center font-bold">{report.grade}</td>
                                        <td className="p-3 text-center">
                                            <div className="w-full bg-slate-200 rounded-full h-1.5 mb-1">
                                                <div className="bg-green-500 h-1.5 rounded-full" style={{width: `${report.attendance}%`}}></div>
                                            </div>
                                            <span className="text-xs">{report.attendance}%</span>
                                        </td>
                                        <td className="p-3 text-center">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                                report.grade >= 85 ? 'bg-green-100 text-green-700' :
                                                report.grade >= 70 ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'
                                            }`}>
                                                {report.grade >= 85 ? 'Lulus (A)' : report.grade >= 70 ? 'Lulus (B)' : 'Remedial'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
                
                <div className="flex justify-end">
                    <button 
                        onClick={handleDownloadTranscript}
                        className="flex items-center gap-2 text-sm text-slate-500 hover:text-blue-600 transition-colors"
                    >
                        <ExternalLink size={14} /> Download Transkrip Lengkap
                    </button>
                </div>
            </div>
        );
    }

    // Default Add/Edit Class Form
    return (
        <div className="space-y-4">
             <div>
                <label className="block text-sm font-medium text-slate-700">Nama Kelas</label>
                <input className="w-full border rounded p-2" placeholder="X-IPA-1" value={formData.className} onChange={e=>setFormData({...formData, className:e.target.value})} />
             </div>
             <div>
                <label className="block text-sm font-medium text-slate-700">Mata Pelajaran</label>
                <input className="w-full border rounded p-2" placeholder="Fisika" value={formData.subject} onChange={e=>setFormData({...formData, subject:e.target.value})} />
             </div>
             
             {/* Curriculum Dropdown */}
             <div>
                <label className="block text-sm font-medium text-slate-700 flex items-center gap-2">
                    <LinkIcon size={14} className="text-blue-600" /> Tautkan Kurikulum (Opsional)
                </label>
                <select 
                    className="w-full border border-slate-300 rounded p-2 text-sm bg-white"
                    value={formData.curriculumId}
                    onChange={(e) => {
                        const selectedId = e.target.value;
                        const selectedCurr = savedCurriculums.find(c => c.id === selectedId);
                        setFormData(prev => ({
                            ...prev,
                            curriculumId: selectedId,
                            // Optional: Auto-fill subject if linked
                            subject: selectedCurr ? selectedCurr.subject : prev.subject
                        }));
                    }}
                >
                    <option value="">-- Tidak Ada Kurikulum --</option>
                    {savedCurriculums.map(curr => (
                        <option key={curr.id} value={curr.id}>{curr.name} ({curr.subject})</option>
                    ))}
                </select>
                <p className="text-xs text-slate-500 mt-1">
                    Menautkan kurikulum memudahkan guru memilih topik saat memulai sesi kelas.
                </p>
             </div>

             <div>
                <label className="block text-sm font-medium text-slate-700">Guru Pengampu</label>
                <select className="w-full border rounded p-2 bg-white" value={formData.teacherId} onChange={e=>setFormData({...formData, teacherId:e.target.value})}>
                    {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
             </div>
             <div className="flex justify-end"><button onClick={handleSaveClass} className="bg-blue-600 text-white px-4 py-2 rounded">Simpan</button></div>
        </div>
    );
  };

  return (
    <div className="space-y-6 relative">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Manajemen Kelas</h2>
          <p className="text-slate-500">Atur jadwal, tenaga pendidik, dan progress pembelajaran.</p>
        </div>
        {isAdmin && (
          <button onClick={handleOpenAddModal} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors">
            <Plus size={18} /> Tambah Kelas Baru
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {classes.map((cls) => {
            const currentProgress = cls.startDate ? calculateAutoProgress(cls.startDate, cls.dayOfWeek || 1, cls.totalMeetings || 16) : cls.progress || 0;
            const linkedCurriculum = savedCurriculums.find(c => c.id === cls.curriculumId);

            return (
              <div key={cls.id} className="bg-white rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-all duration-200 group flex flex-col">
                <div className="p-6 flex-1">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-slate-800">{cls.className}</h3>
                      <p className="text-sm text-blue-600 font-medium">{cls.subject}</p>
                    </div>
                    {isAdmin && (
                      <div className="flex gap-1">
                        <button onClick={() => handleOpenEditModal(cls)} className="text-slate-300 hover:text-blue-500 p-1"><Edit3 size={18} /></button>
                        <button onClick={() => handleDelete(cls.id)} className="text-slate-300 hover:text-red-500 p-1"><Trash2 size={18} /></button>
                      </div>
                    )}
                  </div>
                  
                  {/* Info Grid */}
                  <div className="space-y-3 mb-6">
                     <div className="flex items-center gap-3 text-slate-600"><Users size={18} className="text-slate-400" /><span className="text-sm">{cls.studentCount} Peserta Didik</span></div>
                     <div className="flex items-center gap-3 text-slate-600"><Calendar size={18} className="text-slate-400" /><span className="text-sm">{cls.schedule}</span></div>
                     {linkedCurriculum && (
                         <div className="flex items-center gap-3 text-indigo-600 bg-indigo-50 p-2 rounded-lg">
                             <LinkIcon size={14} />
                             <span className="text-xs font-semibold truncate max-w-[200px]" title={linkedCurriculum.name}>
                                 Kurikulum: {linkedCurriculum.name}
                             </span>
                         </div>
                     )}
                  </div>

                  {/* Progress */}
                  <div className="mb-4">
                    <div className="flex justify-between items-center text-xs mb-1">
                      <span className="text-slate-500 flex items-center gap-1"><TrendingUp size={12}/> Progress</span>
                      <span className="font-semibold text-slate-700">{currentProgress}%</span>
                    </div>
                    <AnimatedProgressBar value={currentProgress} />
                  </div>
                  
                  {/* Teacher Action: Start Session */}
                  {isTeacher && currentUser.id === cls.teacherId && (
                      <button 
                        onClick={() => handleInitiateSession(cls)}
                        className="w-full mt-2 bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg flex items-center justify-center gap-2 font-semibold shadow-sm transition-all animate-in fade-in"
                      >
                         <PlayCircle size={18} /> Mulai Sesi Kelas
                      </button>
                  )}
                </div>

                <div className="bg-slate-50 p-3 rounded-b-xl border-t border-slate-100 flex flex-col gap-2">
                    <div className="flex gap-2">
                        <button onClick={() => handleViewGrades(cls)} className="flex-1 py-1.5 text-xs font-medium text-slate-600 hover:bg-white hover:text-blue-600 rounded flex items-center justify-center gap-1"><BookOpen size={14} /> Nilai</button>
                        <button onClick={() => handleAttendance(cls)} className="flex-1 py-1.5 text-xs font-medium text-slate-600 hover:bg-white hover:text-green-600 rounded flex items-center justify-center gap-1"><CheckSquare size={14} /> Absensi</button>
                        <button onClick={() => handleCreateAssignment(cls)} className="flex-1 py-1.5 text-xs font-medium text-slate-600 hover:bg-white hover:text-purple-600 rounded flex items-center justify-center gap-1"><FilePlus size={14} /> Tugas</button>
                    </div>
                    <button 
                        onClick={() => handleViewClassProgress(cls)}
                        className="w-full py-1.5 text-xs font-bold text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 rounded flex items-center justify-center gap-1.5 transition-all"
                    >
                        <TrendingUp size={14} /> Monitor Progress Siswa
                    </button>
                </div>
              </div>
            );
        })}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className={`bg-white rounded-xl shadow-xl w-full ${modalType === 'classProgress' || modalType === 'studentDetail' ? 'max-w-4xl' : 'max-w-lg'} overflow-hidden animate-in fade-in zoom-in duration-200`}>
             <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
               <h3 className="font-bold text-slate-800">
                  {modalType === 'startSession' ? 'Persiapan Sesi Kelas' : 
                   modalType === 'classProgress' ? 'Analitik Akademik Kelas' : 
                   modalType === 'studentDetail' ? 'Profil Akademik Siswa' : 'Menu Kelas'}
               </h3>
               <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
             </div>
             <div className="p-6 max-h-[80vh] overflow-y-auto">
               {renderModalContent()}
             </div>
          </div>
        </div>
      )}
    </div>
  );
};