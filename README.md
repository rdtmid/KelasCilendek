# 🎓 DidacticBoard

**Sistem Manajemen Kurikulum & Pembelajaran Cerdas Berbasis AI**

---

## 📋 Tentang Aplikasi

**DidacticBoard** adalah platform *Learning Management System* (LMS) modern yang dirancang untuk merevolusi cara lembaga pendidikan mengelola kurikulum dan kegiatan belajar mengajar.

Aplikasi ini mengintegrasikan kecerdasan buatan (**Google Gemini AI**) untuk mengotomatisasi tugas-tugas administratif yang memakan waktu, memungkinkan tenaga pendidik untuk lebih fokus pada interaksi dengan siswa.

### Mengapa DidacticBoard?

Dalam sistem konvensional, pembuatan silabus, penyusunan materi ajar, dan pembuatan soal kuis membutuhkan waktu berjam-jam bahkan berhari-hari. DidacticBoard memangkas proses ini menjadi hitungan detik. Selain itu, fitur kelas interaktif memungkinkan pembelajaran jarak jauh (PJJ) terasa seperti tatap muka langsung.

### ✨ Fitur Unggulan

1.  **🤖 AI Curriculum Generator**
    *   Membuat silabus/kurikulum bertingkat (Basic ➔ Expert) secara otomatis berdasarkan topik mata pelajaran.
    *   Menyesuaikan jadwal secara cerdas dengan **Kalender Libur Nasional Indonesia 2025**.
    *   Memperhitungkan durasi Jam Pelajaran (JP) dan kontinuitas materi.

2.  **📚 AI Material & Quiz Maker**
    *   Guru cukup memasukkan topik, AI akan membuatkan materi bacaan lengkap.
    *   Secara otomatis men-generate soal kuis pilihan ganda beserta kunci jawabannya.
    *   Materi dapat dikirim langsung ke email siswa atau dicetak.

3.  **🔴 Interactive Live Class**
    *   Ruang kelas virtual real-time dengan fitur **Absensi Digital**.
    *   **Live Polling** untuk evaluasi pemahaman siswa secara instan.
    *   Berbagi file materi (PDF/PPT) dan simulasi presentasi layar.

4.  **📊 Dashboard Analitik & Transkrip**
    *   Monitoring progress siswa secara visual (grafik nilai & kehadiran).
    *   Cetak Transkrip Nilai Akademik lengkap dengan satu klik.

---

## 🛠️ Teknologi

*   **Frontend**: React.js (Vite), TypeScript, Tailwind CSS.
*   **Backend**: Node.js, Express.js (Serving Static & API Proxy).
*   **AI Engine**: Google Gemini API (`@google/genai`).
*   **UI Components**: Lucide React (Icons), Recharts (Grafik).

---

## 🚀 Panduan Instalasi di Server Linux

Panduan ini untuk deployment ke VPS (Ubuntu/Debian).

### Prasyarat
*   Server VPS (Ubuntu 20.04/22.04 LTS).
*   Akses root atau sudo.
*   **API Key Google Gemini** (Dapatkan di [aistudio.google.com](https://aistudio.google.com/)).

### Langkah 1: Persiapan Sistem
Update paket server.
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install curl git unzip build-essential -y
```

### Langkah 2: Instalasi Node.js (v20)
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
# Verifikasi
node -v
npm -v
```

### Langkah 3: Setup Project
Upload atau clone source code ke server.
```bash
# Asumsi folder project bernama 'didactic-board'
cd didactic-board
npm install
```

### Langkah 4: Konfigurasi Environment
Buat file `.env`.
```bash
nano .env
```
Isi dengan konfigurasi berikut:
```env
PORT=3000
API_KEY=MASUKKAN_GOOGLE_GEMINI_API_KEY_ANDA_DISINI
NODE_ENV=production
```

### Langkah 5: Build & Run
Build aplikasi frontend dan jalankan server menggunakan PM2.
```bash
# Build Frontend
npm run build

# Install PM2 & Jalankan Server
sudo npm install -g pm2
pm2 start server.js --name "didactic-board"
pm2 startup
pm2 save
```

### Langkah 6: Konfigurasi Nginx (Opsional)
Agar dapat diakses via domain/port 80.
```nginx
server {
    listen 80;
    server_name domain-anda.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 📘 Panduan Penggunaan

Gunakan akun demo berikut untuk masuk ke sistem:

| Role | Email | Password | Fitur Utama |
| :--- | :--- | :--- | :--- |
| **Operator** | `budi@sekolah.id` | `123456` | Manajemen User, Generator Kurikulum |
| **Guru** | `siti@sekolah.id` | `123456` | Manajemen Kelas, Buat Materi AI, Live Class |
| **Siswa** | `dewi@student.id` | `123456` | Mengerjakan Tugas, Transkrip Nilai |

### Skenario 1: Membuat Kurikulum (Admin)
1.  Login sebagai **Operator**.
2.  Buka menu **Kurikulum**.
3.  Pilih Level, Mata Pelajaran, dan Total Pertemuan.
4.  Klik **Generate Kurikulum**. AI akan menyusun silabus otomatis.
5.  Klik **Simpan**.

### Skenario 2: Mengajar Kelas Live (Guru)
1.  Login sebagai **Guru**.
2.  Buka **Manajemen Kelas** > **Mulai Sesi Kelas**.
3.  Pilih Topik.
4.  Di dalam kelas, gunakan fitur **Absensi**, **Upload File**, atau **Polling**.

---

## 📞 Support
Dikembangkan oleh **EduAI Corp** (2025).
