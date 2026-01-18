import React, { useState, useEffect } from 'react';
import { generateLessonMaterial } from '../services/geminiService';
import { GeneratedMaterial, Curriculum, User, UserRole } from '../types';
import { BookOpen, FileText, CheckCircle, HelpCircle, Loader2, PlayCircle, List, Edit3, Printer, Mail, X, Send, Award, GraduationCap } from 'lucide-react';

interface MaterialGeneratorProps {
  currentUser?: User;
}

export const MaterialGenerator: React.FC<MaterialGeneratorProps> = ({ currentUser }) => {
  const isStudent = currentUser?.role === UserRole.STUDENT;

  const [topic, setTopic] = useState('');
  const [level, setLevel] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GeneratedMaterial | null>(null);
  const [activeTab, setActiveTab] = useState<'content' | 'quiz'>('content');

  // New States for Curriculum Source
  const [sourceMode, setSourceMode] = useState<'manual' | 'curriculum'>('manual');
  const [savedCurriculums, setSavedCurriculums] = useState<Curriculum[]>([]);
  const [selectedCurriculumId, setSelectedCurriculumId] = useState('');
  const [selectedTopicIndex, setSelectedTopicIndex] = useState<number | ''>('');

  // Email States
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailRecipient, setEmailRecipient] = useState('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  // Quiz States for Students
  const [studentAnswers, setStudentAnswers] = useState<Record<number, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState(0);

  // Load saved curriculums on mount and handle Student Mode enforcement
  useEffect(() => {
    const saved = localStorage.getItem('edu_curriculums');
    if (saved) {
      setSavedCurriculums(JSON.parse(saved));
    }

    if (isStudent) {
      setSourceMode('curriculum');
    }
  }, [isStudent]);

  const handleCurriculumChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setSelectedCurriculumId(id);
    setSelectedTopicIndex('');
    
    // Auto-fill level based on selected curriculum
    const curr = savedCurriculums.find(c => c.id === id);
    if (curr) {
      setLevel(curr.level);
    } else {
      setLevel('');
    }
  };

  const handleTopicSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const idx = Number(e.target.value);
    setSelectedTopicIndex(idx);
    
    const curr = savedCurriculums.find(c => c.id === selectedCurriculumId);
    if (curr && curr.modules[idx]) {
      // Auto-fill topic based on selection
      setTopic(curr.modules[idx].topic);
    }
  };

  const handleGenerate = async () => {
    setLoading(true);
    setResult(null);
    setStudentAnswers({});
    setQuizSubmitted(false);
    setQuizScore(0);
    
    try {
      const data = await generateLessonMaterial(topic, level);
      setResult(data);
    } catch (e) {
      alert("Gagal memuat materi. Pastikan koneksi internet lancar.");
    } finally {
      setLoading(false);
    }
  };

  // Student Quiz Interaction
  const handleStudentAnswer = (questionIdx: number, optionIdx: number) => {
    if (quizSubmitted) return; // Lock answers after submit
    setStudentAnswers(prev => ({
      ...prev,
      [questionIdx]: optionIdx
    }));
  };

  const submitQuiz = () => {
    if (!result) return;
    let correctCount = 0;
    result.quiz.forEach((q, idx) => {
      if (studentAnswers[idx] === q.correctAnswer) {
        correctCount++;
      }
    });
    const score = Math.round((correctCount / result.quiz.length) * 100);
    setQuizScore(score);
    setQuizSubmitted(true);
  };

  const handlePrint = () => {
    if (!result) return;
    const printWindow = window.open('', '', 'width=800,height=600');
    if (!printWindow) return;

    let contentToPrint = '';
    if (activeTab === 'content') {
        contentToPrint = `
            <h1>${result.topic}</h1>
            <div class="content">${result.content}</div>
        `;
    } else {
        const quizHtml = result.quiz.map((q, idx) => `
            <div class="quiz-item">
                <p><strong>${idx + 1}. ${q.question}</strong></p>
                <ul class="options">
                    ${q.options.map((opt, i) => `<li class="${i === q.correctAnswer ? 'correct' : ''}">${String.fromCharCode(65 + i)}. ${opt}</li>`).join('')}
                </ul>
            </div>
        `).join('');
        contentToPrint = `
            <h1>Kuis: ${result.topic}</h1>
            ${quizHtml}
            <div style="margin-top: 30px; font-size: 12px; color: #666;">*Kunci Jawaban Guru</div>
        `;
    }

    const doc = `
      <html>
        <head>
          <title>Cetak - ${result.topic}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; line-height: 1.6; }
            h1 { color: #1e40af; border-bottom: 2px solid #eee; padding-bottom: 10px; }
            .content { margin-top: 20px; }
            .quiz-item { margin-bottom: 20px; page-break-inside: avoid; }
            .options { list-style-type: none; padding-left: 0; }
            .options li { padding: 5px 0; }
            .correct { color: green; font-weight: bold; }
          </style>
        </head>
        <body>
          ${contentToPrint}
          <script>
            window.onload = function() { window.print(); window.close(); }
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(doc);
    printWindow.document.close();
  };

  const handleSendEmail = () => {
    if (!emailRecipient) return alert("Mohon masukkan alamat email.");
    setIsSendingEmail(true);
    setTimeout(() => {
        setIsSendingEmail(false);
        setShowEmailModal(false);
        setEmailRecipient('');
        alert(`Materi "${result?.topic}" berhasil dikirim ke ${emailRecipient}!`);
    }, 1500);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-100px)] relative">
      {/* Left: Input Panel */}
      <div className="lg:col-span-1 space-y-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <BookOpen className="text-indigo-600" />
            {isStudent ? 'Pusat Pembelajaran' : 'Buat Materi Ajar'}
          </h2>

          {/* Source Toggle - Hidden for Students */}
          {!isStudent && (
            <div className="flex p-1 bg-slate-100 rounded-lg mb-6">
              <button
                onClick={() => setSourceMode('manual')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-all ${sourceMode === 'manual' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-indigo-600'}`}
              >
                <Edit3 size={16} /> Manual
              </button>
              <button
                onClick={() => setSourceMode('curriculum')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-all ${sourceMode === 'curriculum' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-indigo-600'}`}
              >
                <List size={16} /> Dari Kurikulum
              </button>
            </div>
          )}

          <div className="space-y-4">
            {sourceMode === 'curriculum' ? (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Pilih Mata Pelajaran/Kurikulum</label>
                  <select
                    className="w-full border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                    value={selectedCurriculumId}
                    onChange={handleCurriculumChange}
                  >
                    <option value="">-- Pilih Kurikulum --</option>
                    {savedCurriculums.map(c => (
                      <option key={c.id} value={c.id}>{c.name} ({c.subject})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Pilih Topik / Pertemuan</label>
                  <select
                    className="w-full border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 outline-none bg-white disabled:bg-slate-100 disabled:text-slate-400"
                    value={selectedTopicIndex}
                    onChange={handleTopicSelect}
                    disabled={!selectedCurriculumId}
                  >
                    <option value="">-- Pilih Materi --</option>
                    {selectedCurriculumId && savedCurriculums
                      .find(c => c.id === selectedCurriculumId)
                      ?.modules.filter(m => !m.isHoliday)
                      .map((m, idx) => (
                        <option key={idx} value={savedCurriculums.find(c => c.id === selectedCurriculumId)?.modules.indexOf(m)}>
                           Pertemuan {m.day}: {m.topic.substring(0, 40)}{m.topic.length > 40 ? '...' : ''}
                        </option>
                    ))}
                  </select>
                </div>

                {/* Preview of auto-filled topic */}
                {topic && (
                   <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-lg text-xs text-indigo-800">
                      <span className="font-bold block mb-1">Topik Terpilih:</span>
                      {topic}
                   </div>
                )}
              </div>
            ) : (
              <div className="animate-in fade-in slide-in-from-top-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Topik Spesifik</label>
                <textarea
                  className="w-full border border-slate-300 rounded-lg p-3 h-32 resize-none focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="Misal: Hukum Newton 1 dan 2 beserta contoh penerapannya dalam kehidupan sehari-hari."
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                />
              </div>
            )}

            {!isStudent && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Target Peserta / Level</label>
                <input
                  type="text"
                  className="w-full border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="Misal: Mahasiswa Semester 1"
                  value={level}
                  onChange={(e) => setLevel(e.target.value)}
                />
              </div>
            )}
            
            <button
              onClick={handleGenerate}
              disabled={loading || !topic}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50 mt-4"
            >
              {loading ? <Loader2 className="animate-spin" /> : (isStudent ? <BookOpen size={20} /> : <PlayCircle size={20} />)}
              {loading ? 'Memuat Materi...' : (isStudent ? 'Buka Materi Pembelajaran' : 'Mulai Generasi AI')}
            </button>
          </div>
        </div>

        {!isStudent && (
          <div className="bg-blue-50 p-6 rounded-xl border border-blue-100">
            <h3 className="font-semibold text-blue-800 mb-2">Fitur AI Termasuk:</h3>
            <ul className="space-y-2 text-sm text-blue-700">
              <li className="flex items-center gap-2"><CheckCircle size={16}/> Penjelasan Materi Terstruktur</li>
              <li className="flex items-center gap-2"><CheckCircle size={16}/> Kuis Evaluasi Otomatis</li>
              <li className="flex items-center gap-2"><CheckCircle size={16}/> Penyesuaian Tingkat Kesulitan</li>
            </ul>
          </div>
        )}
      </div>

      {/* Right: Output Panel */}
      <div className="lg:col-span-2 flex flex-col bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden relative">
        {!result ? (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8 text-center">
            <FileText size={64} className="mb-4 opacity-20" />
            <p>{isStudent ? 'Pilih materi pelajaran dari menu di sebelah kiri.' : 'Materi pembelajaran dan kuis akan muncul di sini.'}</p>
            {sourceMode === 'curriculum' && !selectedCurriculumId && (
                <p className="text-xs mt-2 text-indigo-500">Silakan pilih kurikulum di panel kiri.</p>
            )}
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center border-b border-slate-200 pr-2">
                <div className="flex flex-1">
                    <button
                        onClick={() => setActiveTab('content')}
                        className={`px-6 py-4 font-medium text-sm flex items-center justify-center gap-2 transition-colors ${activeTab === 'content' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50' : 'text-slate-600 hover:bg-slate-50'}`}
                    >
                        <FileText size={18} /> Materi Pelajaran
                    </button>
                    <button
                        onClick={() => setActiveTab('quiz')}
                        className={`px-6 py-4 font-medium text-sm flex items-center justify-center gap-2 transition-colors ${activeTab === 'quiz' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50' : 'text-slate-600 hover:bg-slate-50'}`}
                    >
                        <HelpCircle size={18} /> {isStudent ? 'Kerjakan Tugas/Kuis' : 'Evaluasi / Kuis'}
                    </button>
                </div>
                {!isStudent && (
                  <div className="flex gap-2">
                      <button 
                          onClick={handlePrint}
                          className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg hover:text-indigo-600 transition-colors"
                          title="Cetak Materi/Kuis"
                      >
                          <Printer size={18} />
                      </button>
                      <button 
                          onClick={() => setShowEmailModal(true)}
                          className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg hover:text-indigo-600 transition-colors"
                          title="Kirim via Email"
                      >
                          <Mail size={18} />
                      </button>
                  </div>
                )}
            </div>

            <div className="flex-1 overflow-y-auto p-8">
              {activeTab === 'content' ? (
                <div className="prose max-w-none text-slate-800">
                  <div className="mb-4 flex items-center gap-2 text-sm text-slate-500">
                     <GraduationCap size={16} /> 
                     <span>Materi Level: {level}</span>
                  </div>
                  <h1 className="text-3xl font-bold mb-6 text-slate-900">{result.topic}</h1>
                  <div dangerouslySetInnerHTML={{ __html: result.content }} />
                  {isStudent && (
                    <div className="mt-8 p-4 bg-indigo-50 rounded-lg flex justify-center">
                        <button 
                           onClick={() => setActiveTab('quiz')}
                           className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
                        >
                           Lanjut ke Tugas Kuis &rarr;
                        </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-8 max-w-2xl mx-auto">
                   <div className="flex justify-between items-center mb-6">
                      <h2 className="text-2xl font-bold">Latihan Evaluasi</h2>
                      {quizSubmitted && (
                         <div className="px-4 py-2 bg-yellow-100 text-yellow-800 rounded-lg font-bold flex items-center gap-2">
                            <Award size={20}/> Nilai Kamu: {quizScore} / 100
                         </div>
                      )}
                   </div>
                   
                   {result.quiz.map((q, idx) => (
                     <div key={idx} className="bg-slate-50 p-6 rounded-lg border border-slate-200">
                       <p className="font-semibold text-lg mb-4 text-slate-800">{idx + 1}. {q.question}</p>
                       <div className="space-y-3">
                         {q.options.map((opt, optIdx) => {
                           // Logic visual jawaban
                           let containerClass = 'bg-white border-slate-200';
                           let markerClass = 'border-slate-300 text-slate-500';
                           let textClass = 'text-slate-700';

                           if (isStudent) {
                              const isSelected = studentAnswers[idx] === optIdx;
                              if (quizSubmitted) {
                                  if (optIdx === q.correctAnswer) {
                                      containerClass = 'bg-green-50 border-green-200';
                                      markerClass = 'bg-green-500 border-green-500 text-white';
                                      textClass = 'text-green-800 font-medium';
                                  } else if (isSelected && optIdx !== q.correctAnswer) {
                                      containerClass = 'bg-red-50 border-red-200';
                                      markerClass = 'bg-red-500 border-red-500 text-white';
                                      textClass = 'text-red-800 line-through';
                                  }
                              } else if (isSelected) {
                                  containerClass = 'bg-indigo-50 border-indigo-300 ring-1 ring-indigo-300';
                                  markerClass = 'bg-indigo-600 border-indigo-600 text-white';
                                  textClass = 'text-indigo-800 font-medium';
                              }
                           } else {
                              // Teacher View: Show Correct Answer
                              if (optIdx === q.correctAnswer) {
                                  containerClass = 'bg-green-50 border-green-200';
                                  markerClass = 'bg-green-500 border-green-500 text-white';
                                  textClass = 'text-green-800 font-medium';
                              }
                           }

                           return (
                             <div 
                                key={optIdx} 
                                onClick={() => isStudent && !quizSubmitted && handleStudentAnswer(idx, optIdx)}
                                className={`p-3 rounded-md border flex items-center gap-3 transition-all ${containerClass} ${isStudent && !quizSubmitted ? 'cursor-pointer hover:border-indigo-300' : ''}`}
                             >
                               <div className={`w-6 h-6 rounded-full border flex items-center justify-center text-xs ${markerClass}`}>
                                 {String.fromCharCode(65 + optIdx)}
                               </div>
                               <span className={textClass}>{opt}</span>
                             </div>
                           );
                         })}
                       </div>
                     </div>
                   ))}

                   {isStudent && !quizSubmitted && (
                      <button 
                        onClick={submitQuiz}
                        disabled={Object.keys(studentAnswers).length < result.quiz.length}
                        className="w-full bg-indigo-600 text-white py-3 rounded-lg font-bold text-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Kumpulkan Jawaban
                      </button>
                   )}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Email Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm animate-in fade-in zoom-in duration-200">
             <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-xl">
               <h3 className="font-bold text-slate-800 flex items-center gap-2">
                 <Mail size={18} className="text-indigo-600"/> Kirim Materi
               </h3>
               <button onClick={() => setShowEmailModal(false)} className="text-slate-400 hover:text-slate-600">
                 <X size={20} />
               </button>
             </div>
             <div className="p-6 space-y-4">
                <p className="text-sm text-slate-600">
                    Materi <strong>{activeTab === 'content' ? 'Pelajaran' : 'Kuis'}</strong> akan dikirimkan ke alamat email di bawah ini.
                </p>
                <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">Email Penerima</label>
                   <input 
                     type="email"
                     className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none"
                     placeholder="nama@sekolah.id"
                     value={emailRecipient}
                     onChange={(e) => setEmailRecipient(e.target.value)}
                   />
                </div>
                <div className="pt-2 flex justify-end gap-2">
                  <button onClick={() => setShowEmailModal(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm">Batal</button>
                  <button 
                    onClick={handleSendEmail} 
                    disabled={isSendingEmail || !emailRecipient}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2 text-sm disabled:opacity-50"
                  >
                    {isSendingEmail ? <Loader2 size={16} className="animate-spin"/> : <Send size={16}/>}
                    {isSendingEmail ? 'Mengirim...' : 'Kirim'}
                  </button>
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};