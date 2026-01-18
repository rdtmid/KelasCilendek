import React, { useState, useEffect } from 'react';
import { generateCurriculumTopics } from '../services/geminiService';
import { INDONESIAN_HOLIDAYS_2025 } from '../constants';
import { CurriculumModule, Curriculum } from '../types';
import { CalendarDays, Sparkles, AlertTriangle, Check, Loader2, GitBranch, History, Edit3, Save, Clock, Trash2, List, Plus, Layers, ArrowRight, CornerDownRight, Link, Eye, X, Info, Printer, Mail, Send } from 'lucide-react';

const LEVEL_STAGES = [
  { id: 'Basic', label: '1. Basic', desc: 'Dasar & Pengenalan', color: 'bg-emerald-50 border-emerald-200 text-emerald-700 checked:bg-emerald-600' },
  { id: 'Intermediate', label: '2. Intermediate', desc: 'Menengah & Praktik', color: 'bg-blue-50 border-blue-200 text-blue-700 checked:bg-blue-600' },
  { id: 'Advance', label: '3. Advance', desc: 'Lanjutan & Analisis', color: 'bg-purple-50 border-purple-200 text-purple-700 checked:bg-purple-600' },
  { id: 'Expert', label: '4. Expert', desc: 'Ahli & Studi Kasus Kompleks', color: 'bg-rose-50 border-rose-200 text-rose-700 checked:bg-rose-600' },
];

export const CurriculumGenerator: React.FC = () => {
  // Views: 'generator' | 'saved-list'
  const [activeView, setActiveView] = useState<'generator' | 'saved-list'>('generator');

  // Input States
  const [subject, setSubject] = useState('');
  
  // Level State (Multi-select)
  const [selectedLevels, setSelectedLevels] = useState<string[]>([]);
  
  const [days, setDays] = useState(14);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [defaultDuration, setDefaultDuration] = useState(2); // Default 2 JP per meeting
  
  // Validation & Info States
  const [dateError, setDateError] = useState<string | null>(null);
  const [estimatedEndDate, setEstimatedEndDate] = useState<string | null>(null);

  // Advanced Feature States
  const [isAdvancedMode, setIsAdvancedMode] = useState(false);
  const [previousTopics, setPreviousTopics] = useState(''); // Manual text input
  const [refCurriculumId, setRefCurriculumId] = useState(''); // Selected Saved Curriculum ID
  
  const [isEditing, setIsEditing] = useState(false); // To toggle table edit mode
  
  const [loading, setLoading] = useState(false);
  const [generatedModules, setGeneratedModules] = useState<CurriculumModule[]>([]);
  
  // State to track editing of an existing saved curriculum (null if creating new)
  const [editingCurriculumId, setEditingCurriculumId] = useState<string | null>(null);

  // State for viewing details modal
  const [viewingCurriculum, setViewingCurriculum] = useState<Curriculum | null>(null);

  // Email Modal State
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailRecipient, setEmailRecipient] = useState('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  // Storage State (Simulating Backend)
  const [savedCurriculums, setSavedCurriculums] = useState<Curriculum[]>(() => {
    const saved = localStorage.getItem('edu_curriculums');
    return saved ? JSON.parse(saved) : [];
  });

  // Effect to save to localStorage whenever savedCurriculums changes
  useEffect(() => {
    localStorage.setItem('edu_curriculums', JSON.stringify(savedCurriculums));
  }, [savedCurriculums]);

  // Validation & Calculation Effect
  useEffect(() => {
    if (!startDate || days <= 0) {
        setEstimatedEndDate(null);
        return;
    }

    const startObj = new Date(startDate);
    const today = new Date();
    today.setHours(0,0,0,0);
    startObj.setHours(0,0,0,0); // Normalize time

    // 1. Validate Past Date
    if (startObj < today) {
        setDateError("Tanggal mulai tidak boleh di masa lalu.");
        setEstimatedEndDate(null);
        return;
    }

    // 2. Validate Next Holiday
    // Find the nearest upcoming holiday relative to TODAY
    const sortedHolidays = [...INDONESIAN_HOLIDAYS_2025]
        .map(h => ({ ...h, dateObj: new Date(h.date) }))
        .filter(h => h.dateObj > today)
        .sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());
    
    const nextHoliday = sortedHolidays[0];

    if (nextHoliday && startObj >= nextHoliday.dateObj) {
        setDateError(`Tanggal mulai tidak boleh melewati libur terdekat: ${nextHoliday.name} (${new Date(nextHoliday.date).toLocaleDateString('id-ID')})`);
        setEstimatedEndDate(null);
        return;
    }

    setDateError(null);

    // 3. Calculate Estimated End Date
    let meetingsCounted = 0;
    let currentCalcDate = new Date(startObj);
    let safetyLoop = 0;

    // Simulate the schedule generation loop
    while (meetingsCounted < days && safetyLoop < 365) {
        const dateStr = currentCalcDate.toISOString().split('T')[0];
        const dayOfWeek = currentCalcDate.getDay();
        const isHoliday = INDONESIAN_HOLIDAYS_2025.some(h => h.date === dateStr);
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

        if (!isHoliday && !isWeekend) {
            meetingsCounted++;
            // If this is the last meeting, don't increment date yet (this is the end date)
            if (meetingsCounted === days) {
                break;
            }
        }
        
        currentCalcDate.setDate(currentCalcDate.getDate() + 1);
        safetyLoop++;
    }

    setEstimatedEndDate(currentCalcDate.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }));

  }, [startDate, days]);

  const handleLevelToggle = (levelId: string) => {
    setSelectedLevels(prev => {
      if (prev.includes(levelId)) {
        return prev.filter(id => id !== levelId);
      } else {
        // Sort based on the defined order in LEVEL_STAGES
        const newSelection = [...prev, levelId];
        return LEVEL_STAGES.filter(stage => newSelection.includes(stage.id)).map(stage => stage.id);
      }
    });
  };

  const handleGenerate = async () => {
    if (dateError) return; // Prevent generation if error exists

    setLoading(true);
    setGeneratedModules([]);
    setIsEditing(false);
    setEditingCurriculumId(null); // Reset edit ID when generating new

    const levelString = selectedLevels.join(' -> ');

    try {
      // Logic to combine manual context and previous curriculum topics
      let finalPreviousContext = previousTopics;
      
      if (refCurriculumId) {
        const refCurr = savedCurriculums.find(c => c.id === refCurriculumId);
        if (refCurr) {
            // Extract topics from the referenced curriculum
            const existingTopics = refCurr.modules
                .filter(m => !m.isHoliday)
                .map(m => `- ${m.topic}`)
                .join('\n');
            
            finalPreviousContext = `\n[REFERENSI DARI KURIKULUM SEBELUMNYA (${refCurr.name})]:\n${existingTopics}\n\n[CATATAN TAMBAHAN]: ${previousTopics}`;
        }
      }

      // 1. Get raw topics from AI
      const topics = await generateCurriculumTopics(
        subject, 
        levelString, 
        days, 
        `Pastikan materi urut dari dasar ke mahir sesuai tahapan: ${levelString}. Alokasi waktu default per pertemuan adalah ${defaultDuration} Jam Pelajaran (JP).`,
        isAdvancedMode ? finalPreviousContext : ""
      );
      
      // 2. Map topics to calendar with Multi-day support
      let currentModules: CurriculumModule[] = [];
      let currentDate = new Date(startDate);
      
      let topicIndex = 0;
      let currentTopicSession = 1; // Track session number for multi-day topics
      
      let dayCounter = 1;
      let loopLimit = 0;
      
      // Loop until we run out of topics OR hit the max 365 days safety limit
      while (topicIndex < topics.length && loopLimit < 365) {
        loopLimit++;
        const dateString = currentDate.toISOString().split('T')[0];
        const dayOfWeek = currentDate.getDay(); // 0 = Sun, 6 = Sat
        
        const holiday = INDONESIAN_HOLIDAYS_2025.find(h => h.date === dateString);
        
        if (holiday) {
          currentModules.push({
            day: 0,
            date: dateString,
            topic: `LIBUR NASIONAL: ${holiday.name}`,
            description: 'Tidak ada kegiatan belajar mengajar.',
            isHoliday: true,
            holidayName: holiday.name,
            duration: 0
          });
        } else if (dayOfWeek === 0 || dayOfWeek === 6) {
          // Skip Weekend
        } else {
          // Process current topic
          const currentTopicData = topics[topicIndex];
          const totalSessionsForTopic = currentTopicData.sessionCount || 1;

          // Format topic name based on session
          let displayTopic = currentTopicData.topic;
          let displayDesc = currentTopicData.description;

          if (totalSessionsForTopic > 1) {
            displayTopic = `${currentTopicData.topic} (Part ${currentTopicSession})`;
            if (currentTopicSession === 1) displayDesc = `${currentTopicData.description} (Pengenalan/Teori)`;
            else if (currentTopicSession === totalSessionsForTopic) displayDesc = `${currentTopicData.description} (Finalisasi/Evaluasi)`;
            else displayDesc = `${currentTopicData.description} (Praktek/Lanjutan)`;
          }

          currentModules.push({
            day: dayCounter,
            date: dateString,
            topic: displayTopic,
            description: displayDesc,
            duration: defaultDuration
          });

          // Logic to advance topic or session
          if (currentTopicSession < totalSessionsForTopic) {
             currentTopicSession++; // Stay on same topic, next session
          } else {
             topicIndex++; // Move to next topic
             currentTopicSession = 1; // Reset session counter
          }

          dayCounter++;
        }
        currentDate.setDate(currentDate.getDate() + 1);
      }

      setGeneratedModules(currentModules);

    } catch (error) {
      alert("Gagal membuat kurikulum. Pastikan API KEY valid.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    if (generatedModules.length === 0) return;
    
    if (editingCurriculumId) {
        // Update Existing
        setSavedCurriculums(prev => prev.map(c => c.id === editingCurriculumId ? {
            ...c,
            name: `Kurikulum ${subject} (${selectedLevels.join(', ')})`,
            subject,
            level: selectedLevels.join(' -> '),
            totalDays: days,
            startDate,
            modules: generatedModules,
            // Keep original createdAt
        } : c));
        alert("Perubahan kurikulum berhasil disimpan!");
    } else {
        // Create New
        const newCurriculum: Curriculum = {
            id: `curr-${Date.now()}`,
            name: `Kurikulum ${subject} (${selectedLevels.join(', ')})`,
            subject,
            level: selectedLevels.join(' -> '),
            totalDays: days,
            startDate,
            modules: generatedModules,
            createdAt: new Date().toISOString()
        };
        setSavedCurriculums([newCurriculum, ...savedCurriculums]);
        alert("Kurikulum berhasil disimpan!");
    }

    setGeneratedModules([]); 
    setEditingCurriculumId(null);
    setActiveView('saved-list'); 
  };

  const handleModuleChange = (index: number, field: keyof CurriculumModule, value: string | number) => {
    const updated = [...generatedModules];
    updated[index] = { ...updated[index], [field]: value };
    setGeneratedModules(updated);
  };

  const handleDeleteSaved = (id: string) => {
    if (confirm("Apakah Anda yakin ingin menghapus kurikulum ini secara permanen?")) {
        setSavedCurriculums(prev => prev.filter(c => c.id !== id));
    }
  };

  const handleEditSaved = (curr: Curriculum) => {
    // Populate form with saved data
    setSubject(curr.subject);
    
    // Attempt to reconstruct selected levels from string "Basic -> Intermediate"
    const levels = curr.level.split(' -> ').filter(l => LEVEL_STAGES.some(s => s.id === l));
    setSelectedLevels(levels.length > 0 ? levels : []);
    
    setDays(curr.totalDays);
    setStartDate(curr.startDate);
    setGeneratedModules(curr.modules);
    
    // Set Edit Mode
    setEditingCurriculumId(curr.id);
    setIsEditing(true); // Automatically enable table editing
    
    // Switch view
    setActiveView('generator');
  };

  // --- PRINT & EMAIL FUNCTIONALITY ---

  const handlePrint = (curriculumName: string = "Kurikulum") => {
    if (generatedModules.length === 0) return;

    const printWindow = window.open('', '', 'width=800,height=600');
    if (!printWindow) return;

    const tableRows = generatedModules.map(mod => `
      <tr style="${mod.isHoliday ? 'background-color: #fee2e2;' : ''}">
        <td style="padding: 8px; border: 1px solid #ddd;">${mod.isHoliday ? '-' : mod.day}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${new Date(mod.date).toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'})}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${!mod.isHoliday && mod.duration ? mod.duration + ' JP' : '-'}</td>
        <td style="padding: 8px; border: 1px solid #ddd;"><strong>${mod.topic}</strong>${mod.isHoliday ? ` (${mod.holidayName})` : ''}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${mod.description}</td>
      </tr>
    `).join('');

    const content = `
      <html>
        <head>
          <title>Cetak - ${curriculumName}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { color: #1e40af; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { background-color: #f3f4f6; padding: 10px; border: 1px solid #ddd; text-align: left; }
            .meta { margin-bottom: 20px; color: #555; }
          </style>
        </head>
        <body>
          <h1>${curriculumName}</h1>
          <div class="meta">
            <p><strong>Mata Pelajaran:</strong> ${subject}</p>
            <p><strong>Level:</strong> ${selectedLevels.join(' -> ')}</p>
            <p><strong>Total Pertemuan:</strong> ${generatedModules.filter(m => !m.isHoliday).length} Hari</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>No</th>
                <th>Tanggal</th>
                <th>Durasi</th>
                <th>Topik</th>
                <th>Deskripsi</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
          </table>
          <script>
            window.onload = function() { window.print(); window.close(); }
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(content);
    printWindow.document.close();
  };

  const handleSendEmail = () => {
    if (!emailRecipient) return alert("Mohon masukkan alamat email.");
    
    setIsSendingEmail(true);
    // Simulating API Call
    setTimeout(() => {
        setIsSendingEmail(false);
        setShowEmailModal(false);
        setEmailRecipient('');
        alert(`Kurikulum berhasil dikirim ke ${emailRecipient}!`);
    }, 1500);
  };

  // --- Views ---

  if (activeView === 'saved-list') {
    return (
        <div className="max-w-5xl mx-auto space-y-6">
            <header className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                    <List className="text-blue-600" /> Kurikulum Tersimpan
                    </h2>
                    <p className="text-slate-500">Daftar kurikulum yang telah dibuat dan disesuaikan.</p>
                </div>
                <button 
                    onClick={() => {
                        setEditingCurriculumId(null);
                        setGeneratedModules([]);
                        setSubject('');
                        setSelectedLevels([]);
                        setRefCurriculumId('');
                        setPreviousTopics('');
                        setActiveView('generator');
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium"
                >
                    <Plus size={18}/> Buat Kurikulum Baru
                </button>
            </header>

            <div className="grid gap-6">
                {savedCurriculums.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-300">
                        <p className="text-slate-500">Belum ada kurikulum yang disimpan.</p>
                    </div>
                ) : (
                    savedCurriculums.map(curr => (
                        <div key={curr.id} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                            <div className="flex flex-col md:flex-row justify-between items-start mb-4 gap-4">
                                <div>
                                    <h3 className="text-xl font-bold text-slate-800">{curr.name}</h3>
                                    <p className="text-sm text-slate-500">Dibuat pada: {new Date(curr.createdAt || '').toLocaleDateString('id-ID')}</p>
                                </div>
                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => setViewingCurriculum(curr)}
                                        className="text-slate-600 bg-slate-50 hover:bg-slate-100 px-3 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors"
                                    >
                                        <Eye size={16}/> Detail
                                    </button>
                                    <button 
                                        onClick={() => handleEditSaved(curr)}
                                        className="text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors"
                                    >
                                        <Edit3 size={16}/> Edit
                                    </button>
                                    <button 
                                        onClick={() => handleDeleteSaved(curr.id)} 
                                        className="text-red-500 bg-red-50 hover:bg-red-100 px-3 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors"
                                    >
                                        <Trash2 size={16}/> Hapus
                                    </button>
                                </div>
                            </div>
                            <div className="flex gap-4 mb-4 text-sm text-slate-600 bg-slate-50 p-3 rounded-lg">
                                <span className="flex items-center gap-1"><CalendarDays size={14}/> {curr.totalDays} Pertemuan</span>
                                <span className="flex items-center gap-1"><Clock size={14}/> Mulai: {new Date(curr.startDate).toLocaleDateString('id-ID')}</span>
                            </div>
                            
                            {/* Mini Preview of Modules */}
                            <div className="border border-slate-100 rounded-lg overflow-hidden">
                                <div className="bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-500">Topik Pembelajaran</div>
                                <div className="divide-y divide-slate-100 max-h-40 overflow-y-auto">
                                    {curr.modules.filter(m => !m.isHoliday).map((m, idx) => (
                                        <div key={idx} className="px-3 py-2 text-sm flex justify-between items-center hover:bg-slate-50">
                                            <div className="flex items-center gap-2 flex-1">
                                                {m.topic.includes('Part') && <CornerDownRight size={12} className="text-slate-400 ml-1" />}
                                                <span className="truncate">{m.topic}</span>
                                            </div>
                                            <span className="text-slate-400 text-xs ml-2 whitespace-nowrap">{m.duration} JP</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Modal Detail View */}
            {viewingCurriculum && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
                        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h3 className="font-bold text-slate-800 text-lg">{viewingCurriculum.name}</h3>
                            <button onClick={() => setViewingCurriculum(null)} className="text-slate-400 hover:text-slate-600">
                                <X size={24} />
                            </button>
                        </div>
                        
                        <div className="p-6 overflow-y-auto">
                            {/* Metadata */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 bg-slate-50 p-4 rounded-lg border border-slate-100">
                                <div>
                                    <span className="text-xs text-slate-500 block">Mata Pelajaran</span>
                                    <span className="font-semibold text-slate-800">{viewingCurriculum.subject}</span>
                                </div>
                                <div>
                                    <span className="text-xs text-slate-500 block">Level</span>
                                    <span className="font-semibold text-slate-800">{viewingCurriculum.level}</span>
                                </div>
                                <div>
                                    <span className="text-xs text-slate-500 block">Total Pertemuan</span>
                                    <span className="font-semibold text-slate-800">{viewingCurriculum.totalDays} Hari</span>
                                </div>
                                <div>
                                    <span className="text-xs text-slate-500 block">Tanggal Mulai</span>
                                    <span className="font-semibold text-slate-800">{new Date(viewingCurriculum.startDate).toLocaleDateString('id-ID')}</span>
                                </div>
                            </div>

                            {/* Table */}
                            <table className="w-full text-left text-sm border border-slate-200 rounded-lg overflow-hidden">
                                <thead className="bg-slate-100 text-slate-600 font-semibold">
                                    <tr>
                                        <th className="p-3 w-12">No</th>
                                        <th className="p-3 w-32">Tanggal</th>
                                        <th className="p-3 w-24">Durasi</th>
                                        <th className="p-3">Topik</th>
                                        <th className="p-3">Deskripsi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {viewingCurriculum.modules.map((mod, idx) => (
                                        <tr key={idx} className={mod.isHoliday ? "bg-red-50" : "hover:bg-slate-50"}>
                                            <td className="p-3 text-slate-500">{mod.isHoliday ? '-' : mod.day}</td>
                                            <td className="p-3 whitespace-nowrap">{new Date(mod.date).toLocaleDateString('id-ID', {day: 'numeric', month: 'short'})}</td>
                                            <td className="p-3">{!mod.isHoliday && (mod.duration ? `${mod.duration} JP` : '-')}</td>
                                            <td className="p-3">
                                                {mod.isHoliday ? (
                                                    <span className="text-red-600 font-medium flex items-center gap-2"><AlertTriangle size={14}/> {mod.holidayName}</span>
                                                ) : (
                                                    <span className="font-medium text-slate-800">{mod.topic}</span>
                                                )}
                                            </td>
                                            <td className="p-3 text-slate-600">{mod.description}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        
                        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-2">
                            <button 
                                onClick={() => {
                                    handleEditSaved(viewingCurriculum);
                                    setViewingCurriculum(null);
                                }}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 text-sm font-medium"
                            >
                                <Edit3 size={16}/> Edit Kurikulum Ini
                            </button>
                            <button onClick={() => setViewingCurriculum(null)} className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 text-sm font-medium">
                                Tutup
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
  }

  // Default Generator View
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <header className="flex justify-between items-center">
        <div>
            <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <CalendarDays className="text-blue-600" /> {editingCurriculumId ? 'Edit Kurikulum' : 'Generator Kurikulum Bertingkat'}
            </h2>
            <p className="text-slate-500">
                {editingCurriculumId 
                    ? 'Mode Edit: Ubah detail pertemuan secara manual atau generate ulang.' 
                    : 'Buat jadwal belajar berjenjang (Basic hingga Expert) secara otomatis.'}
            </p>
        </div>
        <button 
            onClick={() => setActiveView('saved-list')}
            className="text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-lg flex items-center gap-2 font-medium"
        >
            <List size={18}/> Lihat Tersimpan
        </button>
      </header>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        
        {/* Form Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="md:col-span-3">
             <label className="block text-sm font-medium text-slate-700 mb-3 flex items-center gap-2">
                <Layers size={16} className="text-blue-600"/> Pilih Tingkatan Level (Bisa pilih lebih dari satu)
             </label>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {LEVEL_STAGES.map((stage) => (
                    <label 
                        key={stage.id} 
                        className={`relative flex flex-col p-4 border rounded-xl cursor-pointer transition-all hover:shadow-md ${selectedLevels.includes(stage.id) ? stage.color + ' ring-2 ring-offset-1 ring-blue-500' : 'border-slate-200 hover:border-blue-300'}`}
                    >
                        <div className="flex items-center justify-between mb-2">
                             <span className="font-bold text-sm">{stage.label}</span>
                             <input 
                                type="checkbox" 
                                className="w-5 h-5 accent-blue-600"
                                checked={selectedLevels.includes(stage.id)}
                                onChange={() => handleLevelToggle(stage.id)}
                             />
                        </div>
                        <span className="text-xs opacity-80">{stage.desc}</span>
                    </label>
                ))}
             </div>
             {selectedLevels.length > 0 && (
                 <div className="mt-3 text-sm text-slate-600 bg-slate-50 p-3 rounded-lg flex items-center gap-2 animate-in fade-in">
                    <span className="font-semibold text-slate-700">Alur Kurikulum:</span> 
                    {selectedLevels.map((lvl, idx) => (
                        <React.Fragment key={lvl}>
                           <span className="px-2 py-1 bg-white border border-slate-200 rounded text-xs font-bold text-blue-700">{lvl}</span>
                           {idx < selectedLevels.length - 1 && <ArrowRight size={14} className="text-slate-400"/>}
                        </React.Fragment>
                    ))}
                 </div>
             )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Mata Pelajaran</label>
            <input 
              type="text" 
              className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Contoh: Digital Marketing"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Total Pertemuan (Semua Level)</label>
            <input 
              type="number" 
              className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
            />
            {estimatedEndDate && !dateError && (
                 <p className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                    <Check size={12}/> Estimasi Selesai: {estimatedEndDate}
                 </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Tanggal Mulai</label>
            <input 
              type="date" 
              className={`w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none ${dateError ? 'border-red-500 bg-red-50 text-red-700' : 'border-slate-300'}`}
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            {dateError && (
                <p className="text-xs text-red-600 mt-1 flex items-center gap-1 animate-in slide-in-from-top-1">
                    <AlertTriangle size={12}/> {dateError}
                </p>
            )}
          </div>
        </div>

        {/* Section Advanced / Lanjutan */}
        <div className="space-y-4">
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                     <div className="flex items-center gap-3">
                        <button 
                            onClick={() => setIsAdvancedMode(!isAdvancedMode)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isAdvancedMode ? 'bg-blue-600' : 'bg-slate-300'}`}
                        >
                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${isAdvancedMode ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                        <div>
                            <label className="text-sm font-semibold text-slate-700 flex items-center gap-2 cursor-pointer" onClick={() => setIsAdvancedMode(!isAdvancedMode)}>
                                <GitBranch size={16} className="text-blue-600"/> Lanjutan / Prerequisite
                            </label>
                            <p className="text-xs text-slate-500">Hubungkan dengan kurikulum sebelumnya (Continuation).</p>
                        </div>
                     </div>

                     <div className="flex items-center gap-2">
                        <label className="text-sm font-medium text-slate-700 flex items-center gap-1">
                            <Clock size={14} /> Durasi Default (JP):
                        </label>
                        <input 
                            type="number" 
                            className="w-16 border border-slate-300 rounded p-1.5 text-sm text-center"
                            value={defaultDuration}
                            onChange={(e) => setDefaultDuration(Number(e.target.value))}
                        />
                     </div>
                </div>
                
                {isAdvancedMode && (
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2 duration-200">
                        <div>
                            <label className="block text-sm font-medium text-slate-600 mb-1 flex items-center gap-2">
                                <Link size={14} /> Hubungkan Kurikulum Sebelumnya
                            </label>
                            <select 
                                className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                                value={refCurriculumId}
                                onChange={(e) => setRefCurriculumId(e.target.value)}
                            >
                                <option value="">-- Pilih Kurikulum (Opsional) --</option>
                                {savedCurriculums.map(c => (
                                    <option key={c.id} value={c.id}>{c.name} ({c.totalDays} hari)</option>
                                ))}
                            </select>
                            <p className="text-xs text-slate-500 mt-1">
                                AI akan membaca topik dari kurikulum ini dan membuat kelanjutannya.
                            </p>
                        </div>
                        
                        <div>
                             <label className="block text-sm font-medium text-slate-600 mb-1 flex items-center gap-2">
                                <History size={14} /> Konteks Manual (Opsional)
                             </label>
                             <textarea 
                                 className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none h-20"
                                 placeholder="Tambahkan catatan khusus, misal: 'Siswa kesulitan di bagian Aljabar, tolong review sedikit'."
                                 value={previousTopics}
                                 onChange={(e) => setPreviousTopics(e.target.value)}
                             />
                        </div>
                    </div>
                )}
            </div>
        </div>

        <button 
          onClick={handleGenerate}
          disabled={loading || !subject || selectedLevels.length === 0 || !!dateError}
          className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50"
        >
          {loading ? <Loader2 className="animate-spin" /> : <Sparkles size={20} />}
          {loading ? (editingCurriculumId ? 'Sedang Re-Generate Kurikulum...' : 'Generate Kurikulum') : (editingCurriculumId ? 'Re-Generate dengan AI (Overwrite)' : 'Generate Kurikulum')}
        </button>
        {editingCurriculumId && (
            <p className="text-center text-xs text-amber-600 mt-2">
                *Klik tombol di atas akan menimpa data edit saat ini dengan hasil AI baru.
            </p>
        )}
      </div>

      {generatedModules.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
                <h3 className="font-semibold text-slate-800">Preview Jadwal Kurikulum</h3>
                <span className="text-xs text-slate-500">Total {generatedModules.filter(m => !m.isHoliday).length} pertemuan efektif.</span>
            </div>
            
            <div className="flex gap-2">
                <button 
                    onClick={() => handlePrint(`Kurikulum - ${subject}`)}
                    className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 border border-slate-300"
                    title="Cetak Kurikulum"
                >
                    <Printer size={18} />
                </button>
                <button 
                    onClick={() => setShowEmailModal(true)}
                    className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 border border-slate-300"
                    title="Kirim via Email"
                >
                    <Mail size={18} />
                </button>
                <div className="w-px h-8 bg-slate-300 mx-1"></div>
                <button 
                    onClick={() => setIsEditing(!isEditing)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors ${isEditing ? 'bg-amber-100 text-amber-700 border border-amber-200' : 'bg-white border border-slate-300 text-slate-600 hover:bg-slate-50'}`}
                >
                    <Edit3 size={16} /> {isEditing ? 'Selesai Edit' : 'Edit'}
                </button>
                <button 
                    onClick={handleSave}
                    className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-6 rounded-lg flex items-center gap-2 transition-colors shadow-sm"
                >
                    <Save size={18} /> {editingCurriculumId ? 'Simpan' : 'Simpan'}
                </button>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 uppercase font-medium">
                <tr>
                  <th className="p-4 w-16">Ke-</th>
                  <th className="p-4 w-32">Tanggal</th>
                  <th className="p-4 w-24">Durasi</th>
                  <th className="p-4">Topik / Kegiatan</th>
                  <th className="p-4">Deskripsi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {generatedModules.map((mod, idx) => (
                  <tr key={idx} className={mod.isHoliday ? "bg-red-50" : "hover:bg-slate-50 transition-colors"}>
                    <td className="p-4 font-medium text-slate-600">
                      {mod.isHoliday ? '-' : `${mod.day}`}
                    </td>
                    <td className="p-4 text-slate-600 whitespace-nowrap">
                       {isEditing && !mod.isHoliday ? (
                           <input 
                             type="date"
                             className="border border-slate-300 rounded px-2 py-1 w-full"
                             value={mod.date}
                             onChange={(e) => handleModuleChange(idx, 'date', e.target.value)}
                           />
                       ) : (
                           new Date(mod.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
                       )}
                    </td>
                    <td className="p-4">
                        {isEditing && !mod.isHoliday ? (
                            <div className="flex items-center gap-1">
                                <input 
                                    type="number"
                                    className="border border-slate-300 rounded px-2 py-1 w-12 text-center"
                                    value={mod.duration || defaultDuration}
                                    onChange={(e) => handleModuleChange(idx, 'duration', Number(e.target.value))}
                                /> JP
                            </div>
                        ) : (
                            !mod.isHoliday && <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-medium"><Clock size={12}/> {mod.duration || defaultDuration} JP</span>
                        )}
                    </td>
                    <td className="p-4">
                      {mod.isHoliday ? (
                        <span className="flex items-center gap-2 text-red-600 font-bold">
                          <AlertTriangle size={16} /> {mod.topic}
                        </span>
                      ) : isEditing ? (
                        <input 
                            type="text"
                            className="border border-slate-300 rounded px-2 py-1 w-full font-semibold text-slate-800"
                            value={mod.topic}
                            onChange={(e) => handleModuleChange(idx, 'topic', e.target.value)}
                        />
                      ) : (
                        <span className="font-semibold text-slate-800 flex items-center gap-2">
                             {mod.topic}
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-slate-600">
                        {isEditing && !mod.isHoliday ? (
                             <textarea 
                                className="border border-slate-300 rounded px-2 py-1 w-full text-xs h-16"
                                value={mod.description}
                                onChange={(e) => handleModuleChange(idx, 'description', e.target.value)}
                             />
                        ) : mod.description}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Email Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm animate-in fade-in zoom-in duration-200">
             <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-xl">
               <h3 className="font-bold text-slate-800 flex items-center gap-2">
                 <Mail size={18} className="text-blue-600"/> Kirim Kurikulum
               </h3>
               <button onClick={() => setShowEmailModal(false)} className="text-slate-400 hover:text-slate-600">
                 <X size={20} />
               </button>
             </div>
             <div className="p-6 space-y-4">
                <p className="text-sm text-slate-600">Kurikulum akan dikirimkan ke alamat email di bawah ini.</p>
                <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">Email Penerima</label>
                   <input 
                     type="email"
                     className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
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
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 text-sm disabled:opacity-50"
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