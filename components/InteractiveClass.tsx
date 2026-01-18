import React, { useState, useEffect, useRef } from 'react';
import { ClassSession, User, UserRole, ChatMessage, SharedFile } from '../types';
import { Send, Paperclip, X, FileText, Image, User as UserIcon, MoreVertical, CheckCircle, Upload, LogOut, MessageSquare, Users } from 'lucide-react';

interface InteractiveClassProps {
  sessionData: { cls: ClassSession; topic: string };
  currentUser: User;
  onEndSession: () => void;
}

export const InteractiveClass: React.FC<InteractiveClassProps> = ({ sessionData, currentUser, onEndSession }) => {
  const { cls, topic } = sessionData;
  const isTeacher = currentUser.role === UserRole.TEACHER;

  // Mock Data States
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [files, setFiles] = useState<SharedFile[]>([]);
  const [inputText, setInputText] = useState('');
  const [isAttendanceDone, setIsAttendanceDone] = useState(false);
  
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Initial Mock Data
  useEffect(() => {
    // Initial welcome message
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
            text: "Selamat pagi semuanya! Silakan unduh materi yang sudah saya bagikan di panel kiri ya.",
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isTeacher: true,
            role: UserRole.TEACHER
        }])
    ]);

    setFiles([
        { id: 'f1', name: 'Modul_Pembelajaran_Bab1.pdf', type: 'pdf', url: '#', uploadedBy: cls.teacherId, createdAt: '08:05' },
        { id: 'f2', name: 'Slide_Presentasi.pptx', type: 'other', url: '#', uploadedBy: cls.teacherId, createdAt: '08:06' }
    ]);
  }, [cls, topic, isTeacher]);

  // Auto-scroll chat
  useEffect(() => {
    if (chatContainerRef.current) {
        chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

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

    setMessages([...messages, newMessage]);
    setInputText('');
  };

  const handleFileUpload = () => {
    // Mock file upload
    const newFile: SharedFile = {
        id: `f${Date.now()}`,
        name: `Materi_Tambahan_${files.length + 1}.pdf`,
        type: 'pdf',
        url: '#',
        uploadedBy: currentUser.id,
        createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setFiles([...files, newFile]);
    
    // Auto send notification message
    const uploadMsg: ChatMessage = {
        id: Date.now().toString(),
        senderId: currentUser.id,
        senderName: currentUser.name,
        text: `📎 Membagikan file: ${newFile.name}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isTeacher: currentUser.role === UserRole.TEACHER,
        role: currentUser.role
    };
    setMessages(prev => [...prev, uploadMsg]);
  };

  const handleQuickAttendance = () => {
    if(window.confirm("Lakukan absensi otomatis untuk seluruh siswa yang hadir online?")) {
        setIsAttendanceDone(true);
        const sysMsg: ChatMessage = {
            id: Date.now().toString(),
            senderId: 'system',
            senderName: 'System',
            text: "✅ Absensi telah berhasil direkap oleh Guru.",
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isTeacher: false,
            role: UserRole.ADMIN
        };
        setMessages(prev => [...prev, sysMsg]);
    }
  };

  return (
    <div className="h-[calc(100vh-100px)] flex flex-col bg-white rounded-xl shadow-lg overflow-hidden border border-slate-200">
      
      {/* Header */}
      <div className="bg-indigo-600 text-white p-4 flex justify-between items-center shadow-md z-10">
         <div>
            <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold">{cls.className}</h2>
                <span className="px-2 py-0.5 bg-indigo-500 rounded text-xs text-indigo-100 border border-indigo-400">Live</span>
            </div>
            <p className="text-indigo-100 text-sm opacity-90">{cls.subject} • {topic}</p>
         </div>
         <div className="flex items-center gap-3">
            <div className="flex -space-x-2 mr-2">
                {[1,2,3,4].map(i => (
                    <div key={i} className="w-8 h-8 rounded-full bg-indigo-200 border-2 border-indigo-600 flex items-center justify-center text-xs font-bold text-indigo-700">
                        S{i}
                    </div>
                ))}
                <div className="w-8 h-8 rounded-full bg-slate-700 border-2 border-indigo-600 flex items-center justify-center text-xs text-white">
                    +{cls.studentCount - 4}
                </div>
            </div>
            {isTeacher && (
                <button 
                    onClick={onEndSession}
                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
                >
                    <LogOut size={16} /> Akhiri Sesi
                </button>
            )}
         </div>
      </div>

      {/* Main Content Split */}
      <div className="flex-1 flex overflow-hidden">
         
         {/* Left Panel: Files & Tools */}
         <div className="w-80 bg-slate-50 border-r border-slate-200 flex flex-col">
            
            {/* Action Buttons for Teacher */}
            {isTeacher && (
                <div className="p-4 border-b border-slate-200 space-y-2">
                    <button 
                        onClick={handleQuickAttendance}
                        disabled={isAttendanceDone}
                        className={`w-full py-2 px-4 rounded-lg flex items-center justify-center gap-2 text-sm font-medium transition-colors ${isAttendanceDone ? 'bg-green-100 text-green-700 cursor-default' : 'bg-white border border-slate-300 hover:bg-blue-50 text-slate-700'}`}
                    >
                        {isAttendanceDone ? <CheckCircle size={16}/> : <Users size={16}/>}
                        {isAttendanceDone ? 'Absensi Selesai' : 'Cek Absensi'}
                    </button>
                    <button 
                        onClick={handleFileUpload}
                        className="w-full py-2 px-4 bg-indigo-100 text-indigo-700 rounded-lg flex items-center justify-center gap-2 text-sm font-medium hover:bg-indigo-200 transition-colors"
                    >
                        <Upload size={16}/> Upload Materi Baru
                    </button>
                </div>
            )}

            <div className="p-4 flex-1 overflow-y-auto">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">File Dibagikan</h3>
                <div className="space-y-2">
                    {files.map(file => (
                        <div key={file.id} className="bg-white p-3 rounded-lg border border-slate-200 hover:shadow-sm transition-shadow flex items-start gap-3 group cursor-pointer">
                            <div className={`p-2 rounded-lg ${file.type === 'pdf' ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-500'}`}>
                                <FileText size={20} />
                            </div>
                            <div className="overflow-hidden">
                                <p className="text-sm font-medium text-slate-700 truncate">{file.name}</p>
                                <p className="text-xs text-slate-400">{file.createdAt} • Oleh Guru</p>
                            </div>
                        </div>
                    ))}
                    {files.length === 0 && (
                        <p className="text-center text-sm text-slate-400 py-4 italic">Belum ada file dibagikan.</p>
                    )}
                </div>
            </div>
         </div>

         {/* Right Panel: Chat Stream */}
         <div className="flex-1 flex flex-col bg-[#e5e7eb] relative">
            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={chatContainerRef}>
                {messages.map((msg) => {
                    const isMe = msg.senderId === currentUser.id;
                    const isSystem = msg.senderId === 'system';

                    if (isSystem) {
                        return (
                            <div key={msg.id} className="flex justify-center my-2">
                                <span className="bg-slate-200 text-slate-600 text-xs px-3 py-1 rounded-full">{msg.text}</span>
                            </div>
                        );
                    }

                    return (
                        <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                            <div className={`flex max-w-[70%] ${isMe ? 'flex-row-reverse' : 'flex-row'} gap-2`}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                                    msg.isTeacher ? 'bg-indigo-100 text-indigo-700 border border-indigo-200' : 'bg-white text-slate-600 border border-slate-200'
                                }`}>
                                    {msg.isTeacher ? <UserIcon size={14}/> : msg.senderName.charAt(0)}
                                </div>
                                <div>
                                    <div className={`flex items-baseline gap-2 ${isMe ? 'justify-end' : ''}`}>
                                        <span className="text-xs text-slate-500 font-semibold">{msg.senderName}</span>
                                        <span className="text-[10px] text-slate-400">{msg.timestamp}</span>
                                    </div>
                                    <div className={`mt-1 p-3 rounded-xl text-sm shadow-sm ${
                                        isMe 
                                          ? 'bg-indigo-600 text-white rounded-tr-none' 
                                          : msg.isTeacher 
                                            ? 'bg-white border-l-4 border-indigo-500 text-slate-800 rounded-tl-none'
                                            : 'bg-white text-slate-800 rounded-tl-none'
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
            <div className="p-4 bg-white border-t border-slate-200">
                <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                    <button 
                        type="button" 
                        onClick={handleFileUpload}
                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-full transition-colors"
                    >
                        <Paperclip size={20} />
                    </button>
                    <input 
                        className="flex-1 bg-slate-100 border-0 rounded-full px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                        placeholder="Ketik pesan untuk kelas..."
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                    />
                    <button 
                        type="submit" 
                        disabled={!inputText.trim()}
                        className="p-2.5 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                    >
                        <Send size={18} />
                    </button>
                </form>
            </div>
         </div>
      </div>
    </div>
  );
};