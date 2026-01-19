import React, { useState, useEffect } from 'react';
import { generateLessonMaterial } from '../services/geminiService';
import { GeneratedMaterial, Curriculum, User, UserRole } from '../types';
import { BookOpen, FileText, CheckCircle, HelpCircle, Loader2, PlayCircle, List, Edit3, Printer, Mail, X, Send, Award, GraduationCap, Eye, ArrowRight } from 'lucide-react';

interface MaterialGeneratorProps { currentUser?: User; }

export const MaterialGenerator: React.FC<MaterialGeneratorProps> = ({ currentUser }) => {
  const isStudent = currentUser?.role === UserRole.STUDENT;
  const [topic, setTopic] = useState('');
  const [level, setLevel] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GeneratedMaterial | null>(null);
  const [activeTab, setActiveTab] = useState<'content' | 'quiz'>('content');
  const [sourceMode, setSourceMode] = useState<'manual' | 'curriculum'>('manual');
  const [savedCurriculums, setSavedCurriculums] = useState<Curriculum[]>([]);
  const [selectedCurriculumId, setSelectedCurriculumId] = useState('');
  const [selectedTopicIndex, setSelectedTopicIndex] = useState<number | ''>('');
  const [viewingCurriculum, setViewingCurriculum] = useState<Curriculum | null>(null);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailRecipient, setEmailRecipient] = useState('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [studentAnswers, setStudentAnswers] = useState<Record<number, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState(0);

  useEffect(() => {
    fetchCurriculums();
    if (isStudent) setSourceMode('curriculum');
  }, [isStudent]);

  const fetchCurriculums = async () => {
    try {
        const res = await fetch('/api/curriculums');
        if (res.ok) setSavedCurriculums(await res.json());
    } catch(e) { console.error(e); }
  };

  const handleCurriculumChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setSelectedCurriculumId(id);
    setSelectedTopicIndex('');
    const curr = savedCurriculums.find(c => c.id === id);
    if (curr) setLevel(curr.level); else setLevel('');
  };

  const handleTopicSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const idx = Number(e.target.value);
    setSelectedTopicIndex(idx);
    const curr = savedCurriculums.find(c => c.id === selectedCurriculumId);
    if (curr && curr.modules[idx]) setTopic(curr.modules[idx].topic);
  };

  const handleQuickSelectTopic = (index: number) => {
    if (!viewingCurriculum) return;
    if (selectedCurriculumId !== viewingCurriculum.id) {
        setSelectedCurriculumId(viewingCurriculum.id);
        setLevel(viewingCurriculum.level);
    }
    setSelectedTopicIndex(index);
    setTopic(viewingCurriculum.modules[index].topic);
    setViewingCurriculum(null);
  };

  const handleGenerate = async () => {
    setLoading(true); setResult(null); setStudentAnswers({}); setQuizSubmitted(false); setQuizScore(0);
    try {
      const data = await generateLessonMaterial(topic, level);
      setResult(data);
    } catch (e) { alert("Gagal memuat materi."); } finally { setLoading(false); }
  };

  const handleStudentAnswer = (questionIdx: number, optionIdx: number) => {
    if (quizSubmitted) return;
    setStudentAnswers(prev => ({ ...prev, [questionIdx]: optionIdx }));
  };

  const submitQuiz = () => {
    if (!result) return;
    let correctCount = 0;
    result.quiz.forEach((q, idx) => { if (studentAnswers[idx] === q.correctAnswer) correctCount++; });
    const score = Math.round((correctCount / result.quiz.length) * 100);
    setQuizScore(score); setQuizSubmitted(true);
  };

  const handleSendEmail = () => {
    if (!emailRecipient) return alert("Mohon masukkan email.");
    setIsSendingEmail(true);
    setTimeout(() => { setIsSendingEmail(false); setShowEmailModal(false); setEmailRecipient(''); alert(`Terkirim ke ${emailRecipient}!`); }, 1500);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-100px)] relative">
      <div className="lg:col-span-1 space-y-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><BookOpen className="text-indigo-600" /> {isStudent ? 'Pusat Pembelajaran' : 'Buat Materi Ajar'}</h2>
          {!isStudent && (
            <div className="flex p-1 bg-slate-100 rounded-lg mb-6">
              <button onClick={() => setSourceMode('manual')} className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md ${sourceMode === 'manual' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}><Edit3 size={16} /> Manual</button>
              <button onClick={() => setSourceMode('curriculum')} className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md ${sourceMode === 'curriculum' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}><List size={16} /> Dari Kurikulum</button>
            </div>
          )}
          <div className="space-y-4">
            {sourceMode === 'curriculum' ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Pilih Kurikulum</label>
                  <select className="w-full border border-slate-300 rounded-lg p-3" value={selectedCurriculumId} onChange={handleCurriculumChange}>
                    <option value="">-- Pilih Kurikulum --</option>
                    {savedCurriculums.map(c => <option key={c.id} value={c.id}>{c.name} ({c.subject})</option>)}
                  </select>
                  {selectedCurriculumId && <button onClick={() => { const curr = savedCurriculums.find(c => c.id === selectedCurriculumId); setViewingCurriculum(curr || null); }} className="text-xs text-indigo-600 font-medium flex items-center gap-1 mt-2 hover:underline"><Eye size={12} /> Lihat Detail</button>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Pilih Topik</label>
                  <select className="w-full border border-slate-300 rounded-lg p-3" value={selectedTopicIndex} onChange={handleTopicSelect} disabled={!selectedCurriculumId}>
                    <option value="">-- Pilih Materi --</option>
                    {selectedCurriculumId && savedCurriculums.find(c => c.id === selectedCurriculumId)?.modules.filter(m => !m.isHoliday).map((m, idx) => (<option key={idx} value={savedCurriculums.find(c => c.id === selectedCurriculumId)?.modules.indexOf(m)}>Pertemuan {m.day}: {m.topic}</option>))}
                  </select>
                </div>
              </div>
            ) : (
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Topik Spesifik</label><textarea className="w-full border border-slate-300 rounded-lg p-3 h-32" value={topic} onChange={(e) => setTopic(e.target.value)} /></div>
            )}
            {!isStudent && <div><label className="block text-sm font-medium text-slate-700 mb-1">Target Level</label><input type="text" className="w-full border border-slate-300 rounded-lg p-3" value={level} onChange={(e) => setLevel(e.target.value)} /></div>}
            <button onClick={handleGenerate} disabled={loading || !topic} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 mt-4">{loading ? <Loader2 className="animate-spin" /> : (isStudent ? <BookOpen size={20} /> : <PlayCircle size={20} />)} {loading ? 'Memuat Materi...' : 'Generate AI'}</button>
          </div>
        </div>
      </div>
      <div className="lg:col-span-2 flex flex-col bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden relative">
        {!result ? (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8 text-center"><FileText size={64} className="mb-4 opacity-20" /><p>{isStudent ? 'Pilih materi pelajaran.' : 'Materi pembelajaran dan kuis akan muncul di sini.'}</p></div>
        ) : (
          <>
            <div className="flex justify-between items-center border-b border-slate-200 pr-2">
                <div className="flex flex-1">
                    <button onClick={() => setActiveTab('content')} className={`px-6 py-4 font-medium text-sm flex items-center justify-center gap-2 ${activeTab === 'content' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50' : 'text-slate-600'}`}><FileText size={18} /> Materi</button>
                    <button onClick={() => setActiveTab('quiz')} className={`px-6 py-4 font-medium text-sm flex items-center justify-center gap-2 ${activeTab === 'quiz' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50' : 'text-slate-600'}`}><HelpCircle size={18} /> Evaluasi</button>
                </div>
                {!isStudent && <div className="flex gap-2"><button onClick={() => setShowEmailModal(true)} className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg"><Mail size={18} /></button></div>}
            </div>
            <div className="flex-1 overflow-y-auto p-8">
              {activeTab === 'content' ? (
                <div className="prose max-w-none text-slate-800"><h1 className="text-3xl font-bold mb-6 text-slate-900">{result.topic}</h1><div dangerouslySetInnerHTML={{ __html: result.content }} /></div>
              ) : (
                <div className="space-y-8 max-w-2xl mx-auto">
                   <div className="flex justify-between items-center mb-6"><h2 className="text-2xl font-bold">Latihan Evaluasi</h2>{quizSubmitted && <div className="px-4 py-2 bg-yellow-100 text-yellow-800 rounded-lg font-bold flex items-center gap-2"><Award size={20}/> Nilai: {quizScore}</div>}</div>
                   {result.quiz.map((q, idx) => (
                     <div key={idx} className="bg-slate-50 p-6 rounded-lg border border-slate-200">
                       <p className="font-semibold text-lg mb-4 text-slate-800">{idx + 1}. {q.question}</p>
                       <div className="space-y-3">
                         {q.options.map((opt, optIdx) => (
                           <div key={optIdx} onClick={() => isStudent && !quizSubmitted && handleStudentAnswer(idx, optIdx)} className={`p-3 rounded-md border flex items-center gap-3 transition-all ${isStudent && quizSubmitted ? (optIdx === q.correctAnswer ? 'bg-green-50 border-green-200 text-green-800 font-bold' : studentAnswers[idx] === optIdx ? 'bg-red-50 border-red-200 text-red-800 line-through' : 'bg-white') : (studentAnswers[idx] === optIdx ? 'bg-indigo-50 border-indigo-300 ring-1 ring-indigo-300' : 'bg-white border-slate-200')}`}>
                               <div className="w-6 h-6 rounded-full border flex items-center justify-center text-xs">{String.fromCharCode(65 + optIdx)}</div><span>{opt}</span>
                           </div>
                         ))}
                       </div>
                     </div>
                   ))}
                   {isStudent && !quizSubmitted && <button onClick={submitQuiz} className="w-full bg-indigo-600 text-white py-3 rounded-lg font-bold text-lg hover:bg-indigo-700">Kumpulkan Jawaban</button>}
                </div>
              )}
            </div>
          </>
        )}
      </div>
      {showEmailModal && <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"><div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6"><h3 className="font-bold mb-4">Kirim Materi</h3><input type="email" className="w-full border rounded p-2 mb-4" placeholder="Email" value={emailRecipient} onChange={e=>setEmailRecipient(e.target.value)} /><div className="flex justify-end gap-2"><button onClick={()=>setShowEmailModal(false)} className="px-4 py-2 text-slate-600">Batal</button><button onClick={handleSendEmail} className="bg-indigo-600 text-white px-4 py-2 rounded">{isSendingEmail ? '...' : 'Kirim'}</button></div></div></div>}
      {viewingCurriculum && <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"><div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] p-6 overflow-y-auto"><h3 className="font-bold text-lg mb-4">{viewingCurriculum.name}</h3><table className="w-full text-left text-sm"><tbody>{viewingCurriculum.modules.map((m,i)=>(<tr key={i} className="hover:bg-slate-50"><td className="p-3">{m.topic}</td><td className="p-3"><button onClick={()=>handleQuickSelectTopic(viewingCurriculum.modules.indexOf(m))} className="text-indigo-600 flex items-center gap-1">Pilih <ArrowRight size={12}/></button></td></tr>))}</tbody></table><button onClick={()=>setViewingCurriculum(null)} className="mt-4 px-4 py-2 bg-slate-100 rounded">Tutup</button></div></div>}
    </div>
  );
};