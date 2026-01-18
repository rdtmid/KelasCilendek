export enum UserRole {
  ADMIN = 'Operator',
  TEACHER = 'Tenaga Pendidik',
  STUDENT = 'Peserta Didik'
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  password?: string; // For mock auth
  bio?: string; // New field for profile
}

export interface Curriculum {
  id: string;
  name: string;
  subject: string;
  level: string;
  totalDays: number;
  startDate: string;
  modules: CurriculumModule[];
  createdAt?: string;
}

export interface CurriculumModule {
  day: number;
  date: string; // ISO Date
  topic: string;
  description: string;
  isHoliday?: boolean;
  holidayName?: string;
  duration?: number; // Jam Pelajaran (JP), e.g., 2 JP
}

export interface ClassSession {
  id: string;
  className: string;
  teacherId: string;
  schedule: string;
  subject: string;
  studentCount: number;
  progress?: number; // 0 - 100 percentage
  startDate?: string;
  dayOfWeek?: number; // 1 (Mon) - 6 (Sat), 0 (Sun)
  totalMeetings?: number;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number; // Index
}

export interface GeneratedMaterial {
  topic: string;
  content: string; // HTML or Markdown content
  quiz: QuizQuestion[];
}

export interface Holiday {
  date: string; // YYYY-MM-DD
  name: string;
}

export interface Assignment {
  id: string;
  classId: string;
  title: string;
  description: string;
  deadline: string; // YYYY-MM-DD
  type: 'Tugas' | 'Kuis' | 'Proyek';
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: string;
  isTeacher: boolean;
  role: UserRole;
}

export interface SharedFile {
  id: string;
  name: string;
  type: 'pdf' | 'doc' | 'image' | 'other';
  url: string;
  uploadedBy: string;
  createdAt: string;
}