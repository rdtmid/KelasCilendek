import React, { useState, useEffect, useRef } from 'react';
import { ClassSession, User, UserRole, ChatMessage, SharedFile, PollData, PollOption } from '../types';
import { Send, Paperclip, FileText, User as UserIcon, CheckCircle, Upload, LogOut, Users, Download, X, Loader2, MoreVertical, Trash2, MonitorPlay, StopCircle, Cast, Maximize, BarChart2, PlusCircle, MinusCircle } from 'lucide-react';
import { MOCK_USERS } from '../constants';

interface InteractiveClassProps {
  sessionData: { cls: ClassSession; topic: string };
  currentUser: User;
  onEndSession: () => void;
}

interface Participant {
  id: string;
  name: string;
  status: 'online' | 'offline';
  role: UserRole;
  avatar: string;
  attendance?: 'present' | 'permission' | 'alpha' | 'none';
}

export const InteractiveClass: React.FC<InteractiveClassProps> = ({ sessionData, currentUser, onEndSession }) => {
  const { cls, topic } = sessionData;
  const isTeacher = currentUser.role === UserRole.TEACHER;

  // --- States ---
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [files, setFiles] = useState<SharedFile[]>([]);
  const [inputText, setInputText] = useState('');
  const [isAttendanceDone, setIsAttendanceDone] = useState(false);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isPresenting, setIsPresenting] = useState(false); // Presentation State
  
  // UI States
  const [activeTab, setActiveTab] = useState<'files' | 'participants'>('files');
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  // Poll States
  const [isPollModalOpen, setIsPollModalOpen] = useState(false);
  const [newPollQuestion, setNewPollQuestion] = useState('');
  const [newPollOptions, setNewPollOptions] = useState<string[]>(['Ya', 'Tidak']);

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Initialization ---
  useEffect(() => {
    // 1. Initialize Messages
    setMessages([
        {
            id: '1',
            senderId: 'system',
            senderName: 'System',
            text: `Sesi kelas ${cls.className} dimulai. Topik: ${topic}`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isTeacher: false,
            role: UserRole.ADMIN
        },
        ...(isTeacher ? [] : [{
            id: '2',
            senderId: cls.teacherId,
            senderName: 'Guru',
            text: "Selamat pagi semuanya! Silakan unduh materi yang sudah saya bagikan.",
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isTeacher: true,
            role: UserRole.TEACHER
        }])
    ]);

    // 2. Initialize Dummy Files
    setFiles([
        { id: 'f1', name: 'Modul_Pembelajaran_Bab1.pdf', type: 'pdf', url: '#', uploadedBy: cls.teacherId, createdAt: '08:05' },
        { id: 'f2', name: 'Slide_Presentasi.pptx', type: 'other', url: '#', uploadedBy: cls.teacherId, createdAt: '08:06' }
    ]);

    // 3. Initialize Participants (Mock based on MOCK_USERS + Random generation for student count)
    const mockParticipants: Participant[] = MOCK_USERS
      .filter(u => u.role === UserRole.STUDENT)
      .map(u => ({
          id: u.id,
          name: u.name,
          role: UserRole.STUDENT,
          status: 'online',
          attendance: 'none',
          avatar: u.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&background=random`
      }));
    
    // Fill up to studentCount
    const extraCount = Math.max(0, cls.studentCount - mockParticipants.length);
    for(let i=0; i<extraCount; i++) {
        mockParticipants.push({
            id: `stu-mock-${i}`,
            name: `Siswa Peserta ${i+1}`,
            status: Math.random() > 0.1 ? 'online' : 'offline', // 90% online chance
            role: UserRole.STUDENT,
            avatar: `https://ui-avatars.com/api/?name=Siswa+${i+1}&background=random`,
            attendance: 'none'
        });
    }

    setParticipants(mockParticipants);
  }, [cls, topic, isTeacher]);

  // Auto-scroll chat
  useEffect(() => {
    if (chatContainerRef.current) {
        chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // --- Handlers ---

  const handleSendMessage = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputText.trim()) return;

    const newMessage: ChatMessage = {
        id: Date.now().toString(),
        senderId: currentUser.id,
        senderName: currentUser.name,
        text: inputText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isTeacher: currentUser.role === UserRole.TEACHER,
        role: currentUser.role
    };

    setMessages(prev => [...prev, newMessage]);
    setInputText('');
  };

  // Trigger Hidden File Input
  const triggerFileUpload = () => {
    if (fileInputRef.current) {
        fileInputRef.current.click();
    }
  };

  // Handle Actual File Selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);

    // Simulate Network Delay
    setTimeout(() => {
        const fileType = file.name.endsWith('.pdf') ? 'pdf' : file.name.match(/\.(jpg|jpeg|png)$/) ? 'image' : 'other';
        
        const newFile: SharedFile = {
            id: `f${Date.now()}`,
            name: file.name,
            type: fileType as 'pdf'|'image'|'other',
            url: URL.createObjectURL(file), // Create local blob URL for demo
            uploadedBy: currentUser.id,
            createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        setFiles(prev => [...prev, newFile]);
        setIsUploading(false);

        // Notify Chat
        const uploadMsg: ChatMessage = {
            id: Date.now().toString(),
            senderId: currentUser.id,
            senderName: currentUser.name,
            text: `📎 Membagikan file: ${file.name}`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isTeacher: currentUser.role === UserRole.TEACHER,
            role: currentUser.role
        };
        setMessages(prev => [...prev, uploadMsg]);

        // Reset input
        if (fileInputRef.current) fileInputRef.current.value = '';
    }, 1500);
  };

  const handleDeleteFile = (fileId: string) => {
     if(window.confirm("Hapus file ini?")) {
         setFiles(prev => prev.filter(f => f.id !== fileId));
     }
  };

  // Attendance Handlers
  const openAttendance = () => {
      // Auto-mark online students as 'present' if not set
      setParticipants(prev => prev.map(p => ({
          ...p,
          attendance: p.attendance === 'none' && p.status === 'online' ? 'present' : (p.attendance === 'none' ? 'alpha' : p.attendance)
      })));
      setIsAttendanceModalOpen(true);
  };

  const toggleAttendanceStatus = (id: string) => {
      setParticipants(prev => prev.map(p => {
          if (p.id !== id) return p;
          
          const currentStatus = p.attendance === 'none' ? 'present' : (p.attendance || 'present');
          let nextStatus: 'present' | 'permission' | 'alpha' = 'present';

          // Cycle: Present -> Permission -> Alpha -> Present
          switch (currentStatus) {
              case 'present': nextStatus = 'permission'; break;
              case 'permission': nextStatus = 'alpha'; break;
              case 'alpha': nextStatus = 'present'; break;
              default: nextStatus = 'present';
          }

          return { ...p, attendance: nextStatus };
      }));
  };

  const submitAttendance = () => {
      setIsAttendanceModalOpen(false);
      setIsAttendanceDone(true);
      
      const presentCount = participants.filter(p => p.attendance === 'present').length;
      const total = participants.length;

      const sysMsg: ChatMessage = {
          id: Date.now().toString(),
          senderId: 'system',
          senderName: 'System',
          text: `✅ Rekap Absensi Selesai: ${presentCount}/${total} Siswa Hadir.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isTeacher: false,
          role: UserRole.ADMIN
      };
      setMessages(prev => [...prev, sysMsg]);
  };

  const togglePresentation = () => {
      const newState = !isPresenting;
      setIsPresenting(newState);

      // System Notification
      const sysMsg: ChatMessage = {
          id: Date.now().toString(),
          senderId: 'system',
          senderName: 'System',
          text: newState 
            ? '📺 Guru memulai presentasi layar.' 
            : '⏹️ Presentasi dihentikan.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isTeacher: false,
          role: UserRole.ADMIN
      };
      setMessages(prev => [...prev, sysMsg]);
  };

  // --- POLL HANDLERS ---
  const handleOpenPollModal = () => {
      setNewPollQuestion('');
      setNewPollOptions(['Ya', 'Tidak']);
      setIsPollModalOpen(true);
  };

  const addPollOption = () => {
      if (newPollOptions.length < 5) {
          setNewPollOptions([...newPollOptions, '']);
      }
  };

  const removePollOption = (idx: number) => {
      if (newPollOptions.length > 2) {
          setNewPollOptions(newPollOptions.filter((_, i) => i !== idx));
      }
  };

  const updatePollOption = (idx: number, val: string) => {
      const updated = [...newPollOptions];
      updated[idx] = val;
      setNewPollOptions(updated);
  };

  const createPoll = () => {
      if (!newPollQuestion || newPollOptions.some(o => !o.trim())) return alert("Isi pertanyaan dan semua opsi.");

      const pollData: PollData = {
          question: newPollQuestion,
          totalVotes: 0,
          isActive: true,
          options: newPollOptions.map((opt, i) => ({
              id: `opt-${i}`,
              text: opt,
              count: 0
          }))
      };

      const pollMsg: ChatMessage = {
          id: `poll-${Date.now()}`,
          senderId: currentUser.id,
          senderName: currentUser.name,
          text: '📊 Polling Baru',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isTeacher: true,
          role: UserRole.TEACHER,
          pollData: pollData
      };

      setMessages(prev => [...prev, pollMsg]);
      setIsPollModalOpen(false);
  };

  const handleVote = (msgId: string, optionId: string) => {
      setMessages(prev => prev.map(msg => {
          if (msg.id !== msgId || !msg.pollData) return msg;
          if (msg.pollData.userVotedOptionId) return msg; // Prevent double voting

          // Simulate Vote Update (In real app, send to backend)
          const updatedOptions = msg.pollData.options.map(opt => 
              opt.id === optionId ? { ...opt, count: opt.count + 1 } : opt
          );

          return {
              ...msg,
              pollData: {
                  ...msg.pollData,
                  options: updatedOptions,
                  totalVotes: msg.pollData.totalVotes + 1,
                  userVotedOptionId: optionId
              }
          };
      }));
  };

  const onlineCount = participants.filter(p => p.status === 'online').length;

  return (
    <div className="h-[calc(100vh-100px)] flex flex-col bg-white rounded-xl shadow-lg overflow-hidden border border-slate-200">
      
      {/* Header */}
      <div className="bg-indigo-600 text-white p-4 flex justify-between items-center shadow-md z-10 shrink-0">
         <div>
            <div className="flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </span>
                <h2 className="text-xl font-bold">{cls.className}</h2>
                <span className="px-2 py-0.5 bg-indigo-500 rounded text-xs text-indigo-100 border border-indigo-400 font-mono">LIVE</span>
            </div>
            <p className="text-indigo-100 text-sm opacity-90">{cls.subject} • {topic}</p>
         </div>
         <div className="flex items-center gap-3">
            {isPresenting && (
                <div className="flex items-center gap-2 px-3 py-1 bg-red-500/20 rounded-lg border border-red-400/50 animate-pulse">
                    <Cast size={16} className="text-white" />
                    <span className="text-sm font-bold text-white">Sharing Screen</span>
                </div>
            )}
            <div className="flex items-center gap-2 px-3 py-1 bg-indigo-700/50 rounded-lg border border-indigo-500/30">
                <Users size={16} className="text-indigo-200" />
                <span className="text-sm font-bold">{onlineCount} / {cls.studentCount} Online</span>
            </div>
            {isTeacher && (
                <button 
                    onClick={onEndSession}
                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors shadow-sm"
                >
                    <LogOut size={16} /> Akhiri Sesi
                </button>
            )}
         </div>
      </div>

      {/* Main Content Split */}
      <div className="flex-1 flex overflow-hidden">
         
         {/* LEFT AREA: Either Tools Panel OR Presentation Stage */}
         {isPresenting ? (
             <div className="flex-1 bg-slate-900 flex flex-col relative overflow-hidden group">
                 {/* Presentation Content Simulation */}
                 <div className="flex-1 flex items-center justify-center p-8">
                     <div className="bg-white aspect-video w-full max-w-4xl rounded-lg shadow-2xl flex flex-col overflow-hidden">
                         {/* Mock Slide Content */}
                         <div className="bg-indigo-600 p-4 flex justify-between items-center text-white">
                             <span className="font-bold tracking-widest text-sm">EDU-SLIDES</span>
                             <span className="text-xs opacity-75">{topic}</span>
                         </div>
                         <div className="flex-1 flex flex-col items-center justify-center p-12 bg-gradient-to-br from-slate-50 to-slate-200">
                             <h1 className="text-3xl md:text-5xl font-extrabold text-slate-800 text-center mb-6">{topic}</h1>
                             <div className="flex gap-4">
                                 <div className="w-32 h-2 bg-indigo-500 rounded-full"></div>
                                 <div className="w-16 h-2 bg-slate-300 rounded-full"></div>
                             </div>
                             <p className="mt-8 text-slate-500 font-medium">Halaman 1 dari 12</p>
                         </div>
                     </div>
                 </div>

                 {/* Teacher Overlay Controls */}
                 {isTeacher && (
                     <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-slate-800/90 text-white px-6 py-3 rounded-full shadow-xl flex items-center gap-4 border border-slate-700 backdrop-blur-sm z-20">
                         <div className="flex flex-col items-start">
                             <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Status</span>
                             <span className="text-sm font-bold text-green-400 flex items-center gap-1"><span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span> Live Presenting</span>
                         </div>
                         <div className="h-8 w-px bg-slate-600 mx-2"></div>
                         <button 
                            onClick={togglePresentation}
                            className="bg-red-600 hover:bg-red-700 text-white px-4 py-1.5 rounded-full text-sm font-bold flex items-center gap-2 transition-all shadow-lg shadow-red-900/20"
                         >
                             <StopCircle size={16} /> Hentikan Presentasi
                         </button>
                     </div>
                 )}
                 
                 {/* Student View Overlay */}
                 {!isTeacher && (
                     <div className="absolute top-4 right-4 bg-black/50 text-white px-3 py-1 rounded text-xs backdrop-blur-md border border-white/10 flex items-center gap-2">
                         <Maximize size={12} /> Layar Penuh Guru
                     </div>
                 )}
             </div>
         ) : (
             <div className="w-80 bg-slate-50 border-r border-slate-200 flex flex-col shrink-0">
                {/* Teacher Actions (Only visible in normal mode) */}
                {isTeacher && (
                    <div className="p-4 border-b border-slate-200 bg-white space-y-2 shadow-sm z-10">
                        <button 
                            onClick={togglePresentation}
                            className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg flex items-center justify-center gap-2 text-sm font-bold transition-all shadow-sm shadow-indigo-200"
                        >
                            <MonitorPlay size={18}/> Mulai Presentasi
                        </button>
                        <div className="grid grid-cols-2 gap-2">
                            <button 
                                onClick={openAttendance}
                                className={`py-2 px-3 rounded-lg flex items-center justify-center gap-2 text-xs font-medium transition-colors border ${isAttendanceDone ? 'bg-green-50 text-green-700 border-green-200' : 'bg-white border-slate-300 hover:bg-slate-50 text-slate-700'}`}
                            >
                                {isAttendanceDone ? <CheckCircle size={14}/> : <Users size={14}/>}
                                {isAttendanceDone ? 'Rekap' : 'Absensi'}
                            </button>
                            <button 
                                onClick={triggerFileUpload}
                                disabled={isUploading}
                                className="py-2 px-3 bg-white text-indigo-700 border border-indigo-200 rounded-lg flex items-center justify-center gap-2 text-xs font-medium hover:bg-indigo-50 transition-colors"
                            >
                                {isUploading ? <Loader2 size={14} className="animate-spin"/> : <Upload size={14}/>}
                                Upload
                            </button>
                        </div>
                        <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                    </div>
                )}

                {/* Tabs (Files vs Participants) */}
                <div className="flex border-b border-slate-200 bg-slate-50">
                    <button 
                        onClick={() => setActiveTab('files')}
                        className={`flex-1 py-3 text-xs font-bold uppercase tracking-wide transition-colors ${activeTab === 'files' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-white' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        File ({files.length})
                    </button>
                    <button 
                        onClick={() => setActiveTab('participants')}
                        className={`flex-1 py-3 text-xs font-bold uppercase tracking-wide transition-colors ${activeTab === 'participants' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-white' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Siswa ({participants.length})
                    </button>
                </div>

                {/* List Content */}
                <div className="flex-1 overflow-y-auto p-2 bg-slate-50/50">
                    {activeTab === 'files' ? (
                        <div className="space-y-2">
                            {files.map(file => (
                                <div key={file.id} className="bg-white p-3 rounded-lg border border-slate-200 hover:shadow-md transition-all group relative">
                                    <div className="flex items-start gap-3">
                                        <div className={`p-2 rounded-lg shrink-0 ${file.type === 'pdf' ? 'bg-red-50 text-red-500' : file.type === 'image' ? 'bg-purple-50 text-purple-500' : 'bg-blue-50 text-blue-500'}`}>
                                            <FileText size={20} />
                                        </div>
                                        <div className="overflow-hidden min-w-0 flex-1">
                                            <p className="text-sm font-medium text-slate-700 truncate" title={file.name}>{file.name}</p>
                                            <p className="text-xs text-slate-400 mt-0.5">{file.createdAt} • {file.uploadedBy === cls.teacherId ? 'Guru' : 'Siswa'}</p>
                                        </div>
                                    </div>
                                    <div className="mt-3 flex gap-2 pt-2 border-t border-slate-50">
                                        <a 
                                            href={file.url} 
                                            download={file.name}
                                            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium text-slate-600 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600 rounded transition-colors"
                                        >
                                            <Download size={12} /> Download
                                        </a>
                                        {isTeacher && (
                                            <button 
                                                onClick={() => handleDeleteFile(file.id)}
                                                className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {files.length === 0 && (
                                <div className="flex flex-col items-center justify-center py-8 text-slate-400">
                                    <FileText size={32} className="mb-2 opacity-20"/>
                                    <p className="text-xs">Belum ada file dibagikan.</p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {participants.sort((a,b) => (a.status === 'online' ? -1 : 1)).map(p => (
                                <div key={p.id} className="flex items-center gap-3 p-2 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-slate-200">
                                    <div className="relative">
                                        <img src={p.avatar} alt={p.name} className="w-8 h-8 rounded-full bg-slate-200" />
                                        <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white ${p.status === 'online' ? 'bg-green-500' : 'bg-slate-400'}`}></span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-slate-700 truncate">{p.name}</p>
                                        <div className="flex items-center gap-2">
                                            <span className={`text-[10px] uppercase font-bold tracking-wider ${p.status === 'online' ? 'text-green-600' : 'text-slate-400'}`}>
                                                {p.status}
                                            </span>
                                            {isAttendanceDone && (
                                                <span className={`text-[10px] px-1.5 rounded ${
                                                    p.attendance === 'present' ? 'bg-green-100 text-green-700' :
                                                    p.attendance === 'permission' ? 'bg-yellow-100 text-yellow-700' :
                                                    'bg-red-100 text-red-700'
                                                }`}>
                                                    {p.attendance === 'present' ? 'Hadir' : p.attendance === 'permission' ? 'Izin' : 'Alpha'}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
             </div>
         )}

         {/* Right Panel: Chat Stream */}
         {/* If presenting, maybe make chat smaller? For now, we keep it standard flex-1 logic but let the left side grow */}
         <div className={`${isPresenting ? 'w-80 border-l border-slate-800' : 'flex-1'} flex flex-col bg-[#eef2f6] relative transition-all duration-300`}>
            
            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3" ref={chatContainerRef}>
                {messages.map((msg) => {
                    const isMe = msg.senderId === currentUser.id;
                    const isSystem = msg.senderId === 'system';

                    if (isSystem) {
                        return (
                            <div key={msg.id} className="flex justify-center my-4 animate-in fade-in zoom-in duration-300">
                                <span className="bg-slate-200/80 backdrop-blur-sm text-slate-600 text-xs px-3 py-1 rounded-full shadow-sm border border-slate-300">
                                    {msg.text}
                                </span>
                            </div>
                        );
                    }

                    // --- POLL MESSAGE RENDERING ---
                    if (msg.pollData) {
                        const hasVoted = msg.pollData.userVotedOptionId !== undefined;
                        // Show results if user voted OR user is Teacher
                        const showResults = hasVoted || isTeacher;

                        return (
                            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2`}>
                                <div className={`flex max-w-[90%] md:max-w-[70%] ${isMe ? 'flex-row-reverse' : 'flex-row'} gap-3`}>
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold shadow-sm ${
                                        msg.isTeacher ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white' : 'bg-white text-slate-600 border border-slate-200'
                                    }`}>
                                        {msg.isTeacher ? <UserIcon size={14}/> : msg.senderName.charAt(0)}
                                    </div>
                                    <div className="flex flex-col flex-1">
                                        <div className={`flex items-baseline gap-2 px-1 ${isMe ? 'flex-row-reverse' : ''}`}>
                                            <span className={`text-xs font-bold ${msg.isTeacher ? 'text-indigo-600' : 'text-slate-600'}`}>{msg.senderName}</span>
                                            <span className="text-[10px] text-slate-400">{msg.timestamp}</span>
                                        </div>
                                        
                                        <div className="mt-1 bg-white border border-indigo-100 rounded-xl shadow-md overflow-hidden">
                                            <div className="bg-indigo-50 px-4 py-3 border-b border-indigo-100 flex items-start gap-3">
                                                <BarChart2 className="text-indigo-600 mt-1 shrink-0" size={20} />
                                                <div>
                                                    <h4 className="font-bold text-slate-800 text-sm">{msg.pollData.question}</h4>
                                                    <p className="text-xs text-slate-500 mt-0.5">
                                                        {msg.pollData.totalVotes} Suara • {showResults ? 'Hasil Sementara' : 'Silakan pilih jawaban'}
                                                    </p>
                                                </div>
                                            </div>
                                            
                                            <div className="p-3 space-y-2">
                                                {msg.pollData.options.map(opt => {
                                                    const percent = msg.pollData!.totalVotes > 0 
                                                        ? Math.round((opt.count / msg.pollData!.totalVotes) * 100) 
                                                        : 0;
                                                    
                                                    const isSelected = msg.pollData!.userVotedOptionId === opt.id;

                                                    if (showResults) {
                                                        // RESULT VIEW (Bar Chart)
                                                        return (
                                                            <div key={opt.id} className="space-y-1">
                                                                <div className="flex justify-between text-xs mb-1">
                                                                    <span className={`font-medium ${isSelected ? 'text-indigo-600' : 'text-slate-700'}`}>
                                                                        {opt.text} {isSelected && '(Pilihanmu)'}
                                                                    </span>
                                                                    <span className="font-bold text-slate-500">{percent}% ({opt.count})</span>
                                                                </div>
                                                                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                                                                    <div 
                                                                        className={`h-full rounded-full transition-all duration-500 ${isSelected ? 'bg-indigo-500' : 'bg-slate-400'}`} 
                                                                        style={{ width: `${percent}%` }}
                                                                    />
                                                                </div>
                                                            </div>
                                                        );
                                                    } else {
                                                        // VOTING VIEW (Buttons)
                                                        return (
                                                            <button 
                                                                key={opt.id}
                                                                onClick={() => handleVote(msg.id, opt.id)}
                                                                className="w-full text-left px-4 py-3 rounded-lg border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50 transition-all text-sm font-medium text-slate-700 flex justify-between items-center group"
                                                            >
                                                                {opt.text}
                                                                <div className="w-4 h-4 rounded-full border-2 border-slate-300 group-hover:border-indigo-500"></div>
                                                            </button>
                                                        );
                                                    }
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    }

                    return (
                        <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2`}>
                            <div className={`flex max-w-[85%] ${isMe ? 'flex-row-reverse' : 'flex-row'} gap-3`}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold shadow-sm ${
                                    msg.isTeacher ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white' : 'bg-white text-slate-600 border border-slate-200'
                                }`}>
                                    {msg.isTeacher ? <UserIcon size={14}/> : msg.senderName.charAt(0)}
                                </div>
                                <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                    <div className="flex items-baseline gap-2 px-1">
                                        <span className={`text-xs font-bold ${msg.isTeacher ? 'text-indigo-600' : 'text-slate-600'}`}>{msg.senderName}</span>
                                        <span className="text-[10px] text-slate-400">{msg.timestamp}</span>
                                    </div>
                                    <div className={`mt-1 p-3 text-sm shadow-md ${
                                        isMe 
                                          ? 'bg-indigo-600 text-white rounded-2xl rounded-tr-sm' 
                                          : msg.isTeacher 
                                            ? 'bg-white border-l-4 border-indigo-500 text-slate-800 rounded-2xl rounded-tl-sm'
                                            : 'bg-white text-slate-800 rounded-2xl rounded-tl-sm'
                                    }`}>
                                        {msg.text}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-slate-200 shrink-0">
                <form onSubmit={handleSendMessage} className="flex items-end gap-2 bg-slate-100 p-2 rounded-2xl border border-slate-200 focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all">
                    {isTeacher && (
                        <button 
                            type="button" 
                            onClick={handleOpenPollModal}
                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-full transition-colors shrink-0"
                            title="Buat Polling / Kuis Cepat"
                        >
                            <BarChart2 size={20} />
                        </button>
                    )}
                    <button 
                        type="button" 
                        onClick={triggerFileUpload}
                        disabled={isUploading}
                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-full transition-colors shrink-0"
                        title="Upload File"
                    >
                        <Paperclip size={20} />
                    </button>
                    <textarea 
                        className="flex-1 bg-transparent border-0 px-2 py-2.5 focus:ring-0 outline-none text-sm resize-none max-h-24"
                        placeholder="Ketik pesan..."
                        rows={1}
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onKeyDown={(e) => {
                            if(e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSendMessage();
                            }
                        }}
                    />
                    <button 
                        type="submit" 
                        disabled={!inputText.trim()}
                        className="p-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm shrink-0"
                    >
                        <Send size={18} />
                    </button>
                </form>
            </div>
         </div>
      </div>

      {/* Attendance Modal */}
      {isAttendanceModalOpen && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[85vh]">
                  <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                      <h3 className="font-bold text-slate-800 flex items-center gap-2">
                          <CheckCircle size={20} className="text-green-600"/> Rekap Absensi
                      </h3>
                      <button onClick={() => setIsAttendanceModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
                  </div>
                  
                  <div className="p-4 flex items-center justify-between bg-blue-50 border-b border-blue-100">
                      <div className="text-sm text-blue-800">
                          <span className="font-bold">{participants.filter(p => p.status === 'online').length}</span> Siswa Online
                      </div>
                      <div className="text-xs text-blue-600 italic">
                          *Siswa online otomatis ditandai hadir
                      </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-4 space-y-2">
                      {participants.map(p => (
                          <div key={p.id} className="flex items-center justify-between p-3 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                              <div className="flex items-center gap-3">
                                  <div className="relative">
                                      <img src={p.avatar} className="w-8 h-8 rounded-full bg-slate-200"/>
                                      <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 border-2 border-white rounded-full ${p.status === 'online' ? 'bg-green-500' : 'bg-slate-300'}`}></span>
                                  </div>
                                  <div>
                                      <p className="text-sm font-semibold text-slate-700">{p.name}</p>
                                      <p className="text-[10px] text-slate-400 uppercase tracking-wider">{p.status}</p>
                                  </div>
                              </div>
                              <button 
                                  onClick={() => toggleAttendanceStatus(p.id)}
                                  title="Klik untuk mengubah status (Hadir -> Izin -> Alpha)"
                                  className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all w-24 text-center cursor-pointer select-none ${
                                      p.attendance === 'present' ? 'bg-green-100 text-green-700 hover:bg-green-200 border border-green-200' :
                                      p.attendance === 'permission' ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200 border border-yellow-200' :
                                      'bg-red-100 text-red-700 hover:bg-red-200 border border-red-200'
                                  }`}
                              >
                                  {p.attendance === 'present' ? 'HADIR' : p.attendance === 'permission' ? 'IZIN' : 'ALPHA'}
                              </button>
                          </div>
                      ))}
                  </div>

                  <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-2">
                      <button onClick={() => setIsAttendanceModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-medium">Batal</button>
                      <button onClick={submitAttendance} className="px-4 py-2 bg-green-600 text-white hover:bg-green-700 rounded-lg text-sm font-bold shadow-sm">
                          Simpan & Bagikan
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* Poll Creation Modal */}
      {isPollModalOpen && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-xl shadow-xl w-full max-w-sm animate-in fade-in zoom-in duration-200">
                  <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-xl">
                      <h3 className="font-bold text-slate-800 flex items-center gap-2">
                          <BarChart2 size={20} className="text-indigo-600"/> Buat Polling / Kuis
                      </h3>
                      <button onClick={() => setIsPollModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
                  </div>
                  <div className="p-6 space-y-4">
                      <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Pertanyaan</label>
                          <input 
                              className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none"
                              placeholder="Misal: Apakah materi hari ini jelas?"
                              value={newPollQuestion}
                              onChange={e => setNewPollQuestion(e.target.value)}
                              autoFocus
                          />
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Opsi Jawaban</label>
                          <div className="space-y-2">
                              {newPollOptions.map((opt, idx) => (
                                  <div key={idx} className="flex gap-2">
                                      <input 
                                          className="flex-1 border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                          value={opt}
                                          onChange={e => updatePollOption(idx, e.target.value)}
                                          placeholder={`Opsi ${idx + 1}`}
                                      />
                                      {newPollOptions.length > 2 && (
                                          <button 
                                              onClick={() => removePollOption(idx)}
                                              className="text-slate-400 hover:text-red-500 p-2"
                                          >
                                              <MinusCircle size={18} />
                                          </button>
                                      )}
                                  </div>
                              ))}
                          </div>
                          {newPollOptions.length < 5 && (
                              <button 
                                  onClick={addPollOption}
                                  className="mt-2 text-xs font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                              >
                                  <PlusCircle size={14} /> Tambah Opsi
                              </button>
                          )}
                      </div>
                      
                      <button 
                          onClick={createPoll}
                          className="w-full bg-indigo-600 text-white py-2 rounded-lg font-bold hover:bg-indigo-700 shadow-sm mt-2"
                      >
                          Bagikan ke Chat
                      </button>
                  </div>
              </div>
          </div>
      )}

    </div>
  );
};