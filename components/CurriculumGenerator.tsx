import React, { useState, useEffect } from 'react';
import { generateCurriculumTopics } from '../services/geminiService';
import { INDONESIAN_HOLIDAYS_2025 } from '../constants';
import { CurriculumModule, Curriculum } from '../types';
import { CalendarDays, Sparkles, AlertTriangle, Check, Loader2, GitBranch, History, Edit3, Save, Clock, Trash2, List, Plus, Layers, ArrowRight, CornerDownRight, Link, Eye, X, Info, Printer, Mail, Send, BookOpen, GraduationCap } from 'lucide-react';

const LEVEL_STAGES = [
  { id: 'Basic', label: '1. Basic', desc: 'Dasar & Pengenalan', color: 'bg-emerald-50 border-emerald-200 text-emerald-700 checked:bg-emerald-600' },
  { id: 'Intermediate', label: '2. Intermediate', desc: 'Menengah & Praktik', color: 'bg-blue-50 border-blue-200 text-blue-700 checked:bg-blue-600' },
  { id: 'Advance', label: '3. Advance', desc: 'Lanjutan & Analisis', color: 'bg-purple-50 border-purple-200 text-purple-700 checked:bg-purple-600' },
  { id: 'Expert', label: '4. Expert', desc: 'Ahli & Studi Kasus Kompleks', color: 'bg-rose-50 border-rose-200 text-rose-700 checked:bg-rose-600' },
];

interface CurriculumGeneratorProps {
    onNavigate?: (tab: string) => void;
}

export const CurriculumGenerator: React.FC<CurriculumGeneratorProps> = ({ onNavigate }) => {
  // Input States
  const [subject, setSubject] = useState('');
  const [selectedLevels, setSelectedLevels] = useState<string[]>([]);
  const [days, setDays] = useState(14);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [defaultDuration, setDefaultDuration] = useState(2); 
  const [dateError, setDateError] = useState<string | null>(null);
  const [estimatedEndDate, setEstimatedEndDate] = useState<string | null>(null);
  const [isAdvancedMode, setIsAdvancedMode] = useState(false);
  const [previousTopics, setPreviousTopics] = useState(''); 
  const [refCurriculumId, setRefCurriculumId] = useState(''); 
  const [isEditing, setIsEditing] = useState(false); 
  const [loading, setLoading] = useState(false);
  const [generatedModules, setGeneratedModules] = useState<CurriculumModule[]>([]);
  const [editingCurriculumId, setEditingCurriculumId] = useState<string | null>(null);
  const [viewingCurriculum, setViewingCurriculum] = useState<Curriculum | null>(null);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailRecipient, setEmailRecipient] = useState('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [deleteModal, setDeleteModal] = useState<{isOpen: boolean, id: string | null, name: string}>({
      isOpen: false, id: null, name: ''
  });

  const [savedCurriculums, setSavedCurriculums] = useState<Curriculum[]>([]);

  // FETCH CURRICULUMS FROM API
  useEffect(() => {
    fetchCurriculums();
  }, []);

  const fetchCurriculums = async () => {
    try {
        const res = await fetch('/api/curriculums');
        if (res.ok) {
            const data = await res.json();
            setSavedCurriculums(data);
        }
    } catch (e) {
        console.error("Fetch curriculums failed", e);
    }
  };

  // Validation & Calculation Effect (Same as before)
  useEffect(() => {
    if (!startDate || days <= 0) {
        setEstimatedEndDate(null);
        return;
    }
    const startObj = new Date(startDate);
    const today = new Date();
    today.setHours(0,0,0,0);
    startObj.setHours(0,0,0,0); 

    if (startObj < today) {
        setDateError("Tanggal mulai tidak boleh di masa lalu.");
        setEstimatedEndDate(null);
        return;
    }
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
    let meetingsCounted = 0;
    let currentCalcDate = new Date(startObj);
    let safetyLoop = 0;
    while (meetingsCounted < days && safetyLoop < 365) {
        const dateStr = currentCalcDate.toISOString().split('T')[0];
        const dayOfWeek = currentCalcDate.getDay();
        const isHoliday = INDONESIAN_HOLIDAYS_2025.some(h => h.date === dateStr);
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
        if (!isHoliday && !isWeekend) {
            meetingsCounted++;
            if (meetingsCounted === days) { break; }
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
        const newSelection = [...prev, levelId];
        return LEVEL_STAGES.filter(stage => newSelection.includes(stage.id)).map(stage => stage.id);
      }
    });
  };

  const handleGenerate = async () => {
    if (dateError) return; 
    setLoading(true);
    setGeneratedModules([]);
    setIsEditing(false);
    setEditingCurriculumId(null); 

    const levelString = selectedLevels.join(' -> ');

    try {
      let finalPreviousContext = previousTopics;
      if (refCurriculumId) {
        const refCurr = savedCurriculums.find(c => c.id === refCurriculumId);
        if (refCurr) {
            const existingTopics = refCurr.modules
                .filter(m => !m.isHoliday)
                .map(m => `- ${m.topic}`)
                .join('\n');
            finalPreviousContext = `\n[REFERENSI KURIKULUM SEBELUMNYA]:\n${existingTopics}\n\n[CATATAN]: ${previousTopics}`;
        }
      }

      const topics = await generateCurriculumTopics(
        subject, 
        levelString, 
        days, 
        `Alokasi waktu default per pertemuan: ${defaultDuration} JP.`,
        isAdvancedMode ? finalPreviousContext : ""
      );
      
      let currentModules: CurriculumModule[] = [];
      let currentDate = new Date(startDate);
      let topicIndex = 0;
      let currentTopicSession = 1; 
      let dayCounter = 1;
      let loopLimit = 0;
      
      while (topicIndex < topics.length && loopLimit < 365) {
        loopLimit++;
        const dateString = currentDate.toISOString().split('T')[0];
        const dayOfWeek = currentDate.getDay(); 
        const holiday = INDONESIAN_HOLIDAYS_2025.find(h => h.date === dateString);
        
        if (holiday) {
          currentModules.push({
            day: 0, date: dateString, topic: `LIBUR: ${holiday.name}`, description: 'Tidak ada KBM.', isHoliday: true, holidayName: holiday.name, duration: 0
          });
        } else if (dayOfWeek === 0 || dayOfWeek === 6) {
          // Skip Weekend
        } else {
          const currentTopicData = topics[topicIndex];
          const totalSessionsForTopic = currentTopicData.sessionCount || 1;
          let displayTopic = currentTopicData.topic;
          let displayDesc = currentTopicData.description;
          if (totalSessionsForTopic > 1) {
            displayTopic = `${currentTopicData.topic} (Part ${currentTopicSession})`;
            if (currentTopicSession === 1) displayDesc = `${currentTopicData.description} (Pengenalan)`;
            else displayDesc = `${currentTopicData.description} (Lanjutan)`;
          }
          currentModules.push({
            day: dayCounter, date: dateString, topic: displayTopic, description: displayDesc, duration: defaultDuration
          });
          if (currentTopicSession < totalSessionsForTopic) { currentTopicSession++; } else { topicIndex++; currentTopicSession = 1; }
          dayCounter++;
        }
        currentDate.setDate(currentDate.getDate() + 1);
      }
      setGeneratedModules(currentModules);

    } catch (error) {
      alert("Gagal membuat kurikulum. Cek koneksi API.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (generatedModules.length === 0) return;
    
    const payload: Curriculum = {
        id: editingCurriculumId || `curr-${Date.now()}`,
        name: `Kurikulum ${subject} (${selectedLevels.join(', ')})`,
        subject,
        level: selectedLevels.join(' -> '),
        totalDays: days,
        startDate,
        modules: generatedModules,
        createdAt: new Date().toISOString()
    };

    try {
        if (editingCurriculumId) {
            await fetch(`/api/curriculums/${editingCurriculumId}`, {
                method: 'PUT', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(payload)
            });
        } else {
            await fetch('/api/curriculums', {
                method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(payload)
            });
        }
        alert("Kurikulum berhasil disimpan!");
        fetchCurriculums(); // Refresh list
        setGeneratedModules([]); 
        setEditingCurriculumId(null);
    } catch(e) { alert("Gagal menyimpan."); }
  };

  const handleModuleChange = (index: number, field: keyof CurriculumModule, value: string | number) => {
    const updated = [...generatedModules];
    updated[index] = { ...updated[index], [field]: value };
    setGeneratedModules(updated);
  };

  const handleDeleteClick = (id: string, name: string) => {
    setDeleteModal({ isOpen: true, id, name });
  };

  const handleConfirmDelete = async () => {
    if (deleteModal.id) {
        try {
            await fetch(`/api/curriculums/${deleteModal.id}`, { method: 'DELETE' });
            fetchCurriculums();
            setDeleteModal({ isOpen: false, id: null, name: '' });
        } catch(e) { alert("Gagal menghapus."); }
    }
  };

  const handleEditSaved = (curr: Curriculum) => {
    setSubject(curr.subject);
    const levels = curr.level.split(' -> ').filter(l => LEVEL_STAGES.some(s => s.id === l));
    setSelectedLevels(levels.length > 0 ? levels : []);
    setDays(curr.totalDays);
    setStartDate(curr.startDate);
    setGeneratedModules(curr.modules);
    setEditingCurriculumId(curr.id);
    setIsEditing(true); 
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleResetForm = () => {
        setEditingCurriculumId(null);
        setGeneratedModules([]);
        setSubject('');
        setSelectedLevels([]);
        setRefCurriculumId('');
        setPreviousTopics('');
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
    printWindow.document.write(`<html><body><h1>${curriculumName}</h1><table><thead><tr><th>No</th><th>Tanggal</th><th>Durasi</th><th>Topik</th><th>Deskripsi</th></tr></thead><tbody>${tableRows}</tbody></table><script>window.onload=function(){window.print();window.close();}</script></body></html>`);
    printWindow.document.close();
  };

  const handleSendEmail = () => {
    if (!emailRecipient) return alert("Mohon masukkan alamat email.");
    setIsSendingEmail(true);
    setTimeout(() => { setIsSendingEmail(false); setShowEmailModal(false); setEmailRecipient(''); alert(`Kurikulum berhasil dikirim!`); }, 1500);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-12 pb-12">
      {/* SECTION 1: GENERATOR */}
      <section className="space-y-6">
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
            {editingCurriculumId && (
                <button 
                    onClick={handleResetForm}
                    className="text-slate-500 hover:text-slate-700 hover:bg-slate-100 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                    <X size={16} className="inline mr-1"/> Batal Edit
                </button>
            )}
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
                <label className="block text-sm font-medium text-slate-700 mb-1">Total Pertemuan</label>
                <input 
                type="number" 
                className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
                value={days}
                onChange={(e) => setDays(Number(e.target.value))}
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tanggal Mulai</label>
                <input 
                type="date" 
                className={`w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none ${dateError ? 'border-red-500 bg-red-50 text-red-700' : 'border-slate-300'}`}
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                />
                {dateError && <p className="text-xs text-red-600 mt-1">{dateError}</p>}
            </div>
            </div>

            {/* Section Advanced */}
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
                        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
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
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-1 flex items-center gap-2">
                                    <History size={14} /> Konteks Manual (Opsional)
                                </label>
                                <textarea 
                                    className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none h-20"
                                    placeholder="Tambahkan catatan khusus..."
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
            {loading ? 'Sedang Re-Generate Kurikulum...' : 'Generate Kurikulum'}
            </button>
        </div>

        {/* Generated Result Preview */}
        {generatedModules.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h3 className="font-semibold text-slate-800">Preview Jadwal Kurikulum</h3>
                    <span className="text-xs text-slate-500">Total {generatedModules.filter(m => !m.isHoliday).length} pertemuan efektif.</span>
                </div>
                
                <div className="flex gap-2">
                    <button onClick={() => handlePrint(`Kurikulum - ${subject}`)} className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 border border-slate-300"><Printer size={18} /></button>
                    <button onClick={() => setShowEmailModal(true)} className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 border border-slate-300"><Mail size={18} /></button>
                    <button 
                        onClick={() => setIsEditing(!isEditing)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors ${isEditing ? 'bg-amber-100 text-amber-700 border border-amber-200' : 'bg-white border border-slate-300 text-slate-600 hover:bg-slate-50'}`}
                    >
                        <Edit3 size={16} /> {isEditing ? 'Selesai Edit' : 'Edit'}
                    </button>
                    <button onClick={handleSave} className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-6 rounded-lg flex items-center gap-2 transition-colors shadow-sm">
                        <Save size={18} /> {editingCurriculumId ? 'Simpan Perubahan' : 'Simpan Kurikulum'}
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
                        <td className="p-4 font-medium text-slate-600">{mod.isHoliday ? '-' : `${mod.day}`}</td>
                        <td className="p-4 text-slate-600 whitespace-nowrap">
                        {isEditing && !mod.isHoliday ? (
                            <input type="date" className="border border-slate-300 rounded px-2 py-1 w-full" value={mod.date} onChange={(e) => handleModuleChange(idx, 'date', e.target.value)}/>
                        ) : new Date(mod.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="p-4">
                            {isEditing && !mod.isHoliday ? (
                                <input type="number" className="border border-slate-300 rounded px-2 py-1 w-12 text-center" value={mod.duration || defaultDuration} onChange={(e) => handleModuleChange(idx, 'duration', Number(e.target.value))}/>
                            ) : !mod.isHoliday && <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-medium">{mod.duration || defaultDuration} JP</span>}
                        </td>
                        <td className="p-4">
                        {mod.isHoliday ? (
                            <span className="flex items-center gap-2 text-red-600 font-bold"><AlertTriangle size={16} /> {mod.topic}</span>
                        ) : isEditing ? (
                            <input type="text" className="border border-slate-300 rounded px-2 py-1 w-full font-semibold text-slate-800" value={mod.topic} onChange={(e) => handleModuleChange(idx, 'topic', e.target.value)}/>
                        ) : mod.topic}
                        </td>
                        <td className="p-4 text-slate-600">
                            {isEditing && !mod.isHoliday ? (
                                <textarea className="border border-slate-300 rounded px-2 py-1 w-full text-xs h-16" value={mod.description} onChange={(e) => handleModuleChange(idx, 'description', e.target.value)}/>
                            ) : mod.description}
                        </td>
                    </tr>
                    ))}
                </tbody>
                </table>
            </div>
            </div>
        )}
      </section>

      {/* SECTION 2: SAVED LIST */}
      <section className="border-t border-slate-200 pt-10">
          <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                    <List className="text-indigo-600" /> Pustaka Kurikulum
                    </h2>
                </div>
          </div>

          <div className="grid gap-6">
                {savedCurriculums.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-300">
                        <List size={48} className="mx-auto text-slate-300 mb-4"/>
                        <p className="text-slate-500 font-medium">Belum ada kurikulum tersimpan.</p>
                    </div>
                ) : (
                    savedCurriculums.map(curr => (
                        <div key={curr.id} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                            <div className="flex flex-col md:flex-row justify-between items-start mb-4 gap-4">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="text-xl font-bold text-slate-800">{curr.name}</h3>
                                        {curr.id === editingCurriculumId && (
                                            <span className="bg-amber-100 text-amber-700 text-xs px-2 py-0.5 rounded font-bold">Sedang Diedit</span>
                                        )}
                                    </div>
                                    <div className="flex gap-4 text-sm text-slate-500">
                                        <span className="flex items-center gap-1"><CalendarDays size={14}/> {curr.totalDays} Pertemuan</span>
                                        <span className="flex items-center gap-1"><Clock size={14}/> Mulai: {new Date(curr.startDate).toLocaleDateString('id-ID')}</span>
                                    </div>
                                </div>
                                <div className="flex flex-wrap gap-2 justify-end">
                                    <button onClick={() => onNavigate && onNavigate('materials')} className="text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors border border-indigo-100"><BookOpen size={16}/> Buat Materi</button>
                                    <div className="w-px h-8 bg-slate-200 mx-1"></div>
                                    <button onClick={() => setViewingCurriculum(curr)} className="text-slate-600 bg-slate-50 hover:bg-slate-100 px-3 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors"><Eye size={16}/> Detail</button>
                                    <button onClick={() => handleEditSaved(curr)} className="text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors"><Edit3 size={16}/> Edit</button>
                                    <button onClick={() => handleDeleteClick(curr.id, curr.name)} className="text-red-500 bg-red-50 hover:bg-red-100 px-3 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors"><Trash2 size={16}/></button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
      </section>

      {/* Delete Modal */}
      {deleteModal.isOpen && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-xl shadow-xl w-full max-w-sm animate-in fade-in zoom-in duration-200">
                    <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-red-50 rounded-t-xl">
                        <h3 className="font-bold text-red-800 flex items-center gap-2"><AlertTriangle size={18} className="text-red-600"/> Hapus Kurikulum?</h3>
                        <button onClick={() => setDeleteModal({isOpen: false, id: null, name: ''})} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
                    </div>
                    <div className="p-6 text-center">
                        <p className="text-slate-600 text-sm mb-2">Anda akan menghapus kurikulum:</p>
                        <p className="font-bold text-slate-800 text-lg mb-4">{deleteModal.name}</p>
                    </div>
                    <div className="p-4 border-t border-slate-100 flex justify-end gap-2 bg-slate-50 rounded-b-xl">
                        <button onClick={() => setDeleteModal({isOpen: false, id: null, name: ''})} className="px-4 py-2 text-slate-600 rounded-lg text-sm font-medium">Batal</button>
                        <button onClick={handleConfirmDelete} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-bold">Ya, Hapus</button>
                    </div>
                </div>
            </div>
      )}

      {/* Modal Detail */}
      {viewingCurriculum && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
                    <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                        <h3 className="font-bold text-slate-800 text-lg">{viewingCurriculum.name}</h3>
                        <button onClick={() => setViewingCurriculum(null)} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
                    </div>
                    <div className="p-6 overflow-y-auto">
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
                                        <td className="p-3">{mod.topic}</td>
                                        <td className="p-3 text-slate-600">{mod.description}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
      )}
    </div>
  );
};