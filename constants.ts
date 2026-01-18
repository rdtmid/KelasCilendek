import { Holiday, User, UserRole, ClassSession } from './types';

export const INDONESIAN_HOLIDAYS_2025: Holiday[] = [
  { date: '2025-01-01', name: 'Tahun Baru Masehi' },
  { date: '2025-01-29', name: 'Tahun Baru Imlek' },
  { date: '2025-03-29', name: 'Hari Raya Nyepi' },
  { date: '2025-03-31', name: 'Idul Fitri' },
  { date: '2025-04-01', name: 'Cuti Bersama Idul Fitri' },
  { date: '2025-05-01', name: 'Hari Buruh Internasional' },
  { date: '2025-05-12', name: 'Hari Raya Waisak' },
  { date: '2025-05-29', name: 'Kenaikan Isa Almasih' },
  { date: '2025-06-01', name: 'Hari Lahir Pancasila' },
  { date: '2025-06-07', name: 'Idul Adha' },
  { date: '2025-06-27', name: 'Tahun Baru Islam' },
  { date: '2025-08-17', name: 'Hari Kemerdekaan RI' },
  { date: '2025-09-05', name: 'Maulid Nabi Muhammad SAW' },
  { date: '2025-12-25', name: 'Hari Raya Natal' },
];

export const MOCK_USERS: User[] = [
  { id: '1', name: 'Budi Santoso', email: 'budi@sekolah.id', role: UserRole.ADMIN, avatar: 'https://picsum.photos/100/100?random=1' },
  { id: '2', name: 'Siti Aminah', email: 'siti@sekolah.id', role: UserRole.TEACHER, avatar: 'https://picsum.photos/100/100?random=2' },
  { id: '3', name: 'Ahmad Dani', email: 'ahmad@sekolah.id', role: UserRole.TEACHER, avatar: 'https://picsum.photos/100/100?random=3' },
  { id: '4', name: 'Dewi Lestari', email: 'dewi@student.id', role: UserRole.STUDENT, avatar: 'https://picsum.photos/100/100?random=4' },
];

export const MOCK_CLASSES: ClassSession[] = [
  { 
    id: 'c1', 
    className: 'X-IPA-1', 
    teacherId: '2', 
    subject: 'Fisika Dasar', 
    schedule: 'Senin, 08:00', 
    studentCount: 32, 
    progress: 45,
    startDate: '2025-01-06',
    dayOfWeek: 1,
    totalMeetings: 16
  },
  { 
    id: 'c2', 
    className: 'XI-IPS-2', 
    teacherId: '3', 
    subject: 'Sejarah Indonesia', 
    schedule: 'Selasa, 10:00', 
    studentCount: 28, 
    progress: 70,
    startDate: '2025-01-07',
    dayOfWeek: 2,
    totalMeetings: 14
  },
  { 
    id: 'c3', 
    className: 'XII-BHS', 
    teacherId: '2', 
    subject: 'Bahasa Inggris', 
    schedule: 'Rabu, 09:00', 
    studentCount: 30, 
    progress: 20,
    startDate: '2025-02-05',
    dayOfWeek: 3,
    totalMeetings: 12
  },
];