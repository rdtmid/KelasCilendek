import { GoogleGenAI, Type } from "@google/genai";
import { GeneratedMaterial, QuizQuestion } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateCurriculumTopics = async (
  subject: string,
  level: string,
  days: number,
  additionalContext: string,
  previousTopics: string = "" // Parameter baru untuk materi sebelumnya
): Promise<{ topic: string; description: string; sessionCount: number }[]> => {
  try {
    let promptText = `Buatkan daftar topik kurikulum untuk mata pelajaran "${subject}".`;

    // Cek apakah level mengandung indikator multi-stage (panah ->)
    if (level.includes('->')) {
        promptText += `\nKURIKULUM BERTINGKAT (Multi-Stage):
        Tingkatan yang diminta: ${level}.
        
        Instruksi Penting:
        1. Bagi total ${days} pertemuan ke dalam tingkatan-tingkatan tersebut secara proporsional.
        2. Materi harus berkesinambungan (continuous flow).`;
    } else {
        promptText += `\nTingkat Target: "${level}". Dirancang untuk ${days} pertemuan efektif.`;
    }

    // Logika untuk konteks manual (Advanced Mode)
    if (previousTopics && previousTopics.trim().length > 0) {
      promptText += `\n\nREFERENSI MATERI TERDAHULU (PREREQUISITE):
      Berikut adalah konteks/daftar topik yang SUDAH dipelajari sebelumnya:
      "${previousTopics}"

      INSTRUKSI KELANJUTAN (PENTING):
      1. JANGAN mengulang materi di atas secara mendalam (cukup review singkat di awal jika perlu).
      2. Materi baru HARUS merupakan kelanjutan logis (next step) dari materi referensi di atas.
      3. Pastikan tingkat kesulitan (Difficulty Curve) meningkat dari materi sebelumnya.`;
    }

    promptText += `\n\nKonteks tambahan/Instruksi khusus: ${additionalContext}.
    
    ATURAN DURASI TOPIK (PENTING):
    - Tidak semua topik harus selesai dalam 1 pertemuan.
    - Jika topik kompleks (seperti Coding Project, Praktikum Lab, atau Analisis Kasus), pecah menjadi beberapa sesi (misal: 2 atau 3 sesi).
    - Berikan properti 'sessionCount' (integer) untuk menentukan berapa kali pertemuan topik tersebut dibahas.
    - Pastikan total akumulasi 'sessionCount' dari semua topik mendekati ${days} hari.
    
    Output JSON Array harus berisi objek dengan:
    - topic: Judul topik
    - description: Penjelasan singkat
    - sessionCount: Jumlah pertemuan untuk topik ini (default: 1).`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: promptText,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              topic: { type: Type.STRING },
              description: { type: Type.STRING },
              sessionCount: { type: Type.INTEGER, description: "Number of meetings required for this topic" },
            },
            required: ["topic", "description", "sessionCount"],
          },
        },
      },
    });

    if (response.text) {
      return JSON.parse(response.text);
    }
    return [];
  } catch (error) {
    console.error("Error generating curriculum:", error);
    throw error;
  }
};

export const generateLessonMaterial = async (
  topic: string,
  level: string
): Promise<GeneratedMaterial> => {
  const prompt = `Buatkan materi pembelajaran lengkap untuk topik "${topic}" tingkat "${level}".
  Output harus mencakup konten penjelasan (sekitar 300 kata) dan 3 soal kuis pilihan ganda.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview', // Using Pro for better reasoning/content quality
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            topic: { type: Type.STRING },
            content: { type: Type.STRING, description: "Materi penjelasan dalam format HTML sederhana (gunakan tag p, ul, li, strong, h3)" },
            quiz: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  question: { type: Type.STRING },
                  options: { type: Type.ARRAY, items: { type: Type.STRING } },
                  correctAnswer: { type: Type.INTEGER, description: "Index of the correct answer (0-3)" },
                },
                required: ["question", "options", "correctAnswer"],
              },
            },
          },
          required: ["topic", "content", "quiz"],
        },
      },
    });

    if (response.text) {
      return JSON.parse(response.text) as GeneratedMaterial;
    }
    throw new Error("Empty response");
  } catch (error) {
    console.error("Error generating material:", error);
    throw error;
  }
};