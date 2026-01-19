# 🎓 DidacticBoard
**Sistem Manajemen Kurikulum & Pembelajaran Cerdas Berbasis AI**

---

## 📋 Tentang Aplikasi

**DidacticBoard** adalah platform *Learning Management System* (LMS) modern yang dirancang untuk merevolusi cara lembaga pendidikan mengelola kurikulum dan kegiatan belajar mengajar.

Aplikasi ini mengintegrasikan kecerdasan buatan (**Google Gemini AI**) untuk mengotomatisasi tugas-tugas administratif yang memakan waktu, memungkinkan tenaga pendidik untuk lebih fokus pada interaksi dengan siswa.

### Mengapa DidacticBoard?
Dalam sistem konvensional, pembuatan silabus, penyusunan materi ajar, dan pembuatan soal kuis membutuhkan waktu berjam-jam bahkan berhari-hari. DidacticBoard memangkas proses ini menjadi hitungan detik. Selain itu, fitur kelas interaktif memungkinkan pembelajaran jarak jauh (PJJ) terasa seperti tatap muka langsung.

### Fitur Unggulan

1.  **🤖 AI Curriculum Generator**
    *   Membuat silabus/kurikulum bertingkat (Basic ➔ Expert) secara otomatis berdasarkan topik mata pelajaran.
    *   Menyesuaikan jadwal secara cerdas dengan **Kalender Libur Nasional Indonesia 2025**.
    *   Memperhitungkan durasi Jam Pelajaran (JP) dan kontinuitas materi.

2.  **📚 AI Material & Quiz Maker**
    *   Guru cukup memasukkan topik, AI akan membuatkan materi bacaan lengkap.
    *   Secara otomatis men-generate soal kuis pilihan ganda beserta kunci jawabannya.
    *   Materi dapat dikirim langsung ke email siswa atau dicetak.

3.  **🔴 Interactive Live Class**
    *   Ruang kelas virtual real-time.
    *   Fitur **Absensi Digital** (Hadir/Izin/Alpha).
    *   **Live Polling** untuk evaluasi pemahaman siswa secara instan.
    *   Berbagi file materi (PDF/PPT) dan simulasi presentasi layar.

4.  **📊 Dashboard Analitik & Transkrip**
    *   Monitoring progress siswa secara visual (grafik nilai & kehadiran).
    *   Cetak Transkrip Nilai Akademik lengkap dengan satu klik.
    *   Manajemen tugas dan pengumpulan tugas siswa.

---

## 🛠️ Teknologi yang Digunakan

*   **Frontend**: React.js (Vite), TypeScript, Tailwind CSS.
*   **Backend**: Node.js, Express.js.
*   **AI Engine**: Google Gemini API (`@google/genai`).
*   **Icons & Charts**: Lucide React, Recharts.
*   **Persistence**: LocalStorage (Demo Mode) / Siap integrasi Database.

---

## 🚀 Panduan Instalasi di Server Linux (Ubuntu/Debian)

Panduan ini akan menuntun Anda mulai dari server kosong hingga aplikasi berjalan di production.

### Prasyarat
*   Server VPS (Ubuntu 20.04/22.04 LTS direkomendasikan).
*   Akses root atau user dengan hak `sudo`.
*   Domain (opsional, tapi disarankan).
*   **API Key Google Gemini** (Dapatkan di [aistudio.google.com](https://aistudio.google.com/)).

### Langkah 1: Persiapan Sistem Server
Update repositori paket server Anda untuk memastikan keamanan dan kompatibilitas.

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install curl git unzip build-essential -y
```

### Langkah 2: Instalasi Node.js
Aplikasi ini membutuhkan Node.js versi terbaru (LTS). Kita akan menggunakan versi 20.x.

```bash
# Tambahkan repositori NodeSource
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -

# Install Node.js
sudo apt install -y nodejs

# Verifikasi instalasi
node -v  # Harus tampil v20.x.x
npm -v   # Harus tampil 10.x.x
```

### Langkah 3: Upload / Clone Aplikasi
Anda bisa menggunakan `git clone` jika kode ada di GitHub, atau upload file manual menggunakan SCP/FileZilla. Asumsikan folder aplikasi bernama `didactic-board`.

```bash
# Contoh jika menggunakan git (ganti URL dengan repo Anda)
# git clone https://github.com/rdtmid/KelasCilendek.git
# cd KelasCilendek

# Jika upload manual, ekstrak dan masuk folder
cd /path/to/KelasCilendek
```

### Langkah 4: Instalasi Dependencies & Konfigurasi
Install semua library yang dibutuhkan oleh aplikasi.

```bash
npm install
```

Buat file konfigurasi environment (`.env`):

```bash
nano .env
```

Salin dan tempel konfigurasi berikut (Ganti `API_KEY` dengan milik Anda):

```env
PORT=3000
API_KEY=AIzaSyDxxxxxxxxxxxxxxxxxxxxxxxxxxxx
NODE_ENV=production
```
*Tekan `CTRL+O`, `Enter` untuk menyimpan, dan `CTRL+X` untuk keluar.*

### Langkah 5: Build Aplikasi Frontend
Kompilasi kode React TypeScript menjadi file statis HTML/CSS/JS yang optimal.

```bash
npm run build
```
*Setelah selesai, pastikan folder `dist` muncul.*

### Langkah 6: Menjalankan Server dengan PM2
Gunakan PM2 agar aplikasi tetap berjalan di background dan otomatis restart jika server reboot.

```bash
# Install PM2 Global
sudo npm install -g pm2

# Jalankan server
pm2 start server.js --name "didactic-board"

# Pastikan aplikasi berjalan saat startup
pm2 startup
pm2 save
```

### Langkah 7: Setup Nginx Reverse Proxy (Disarankan)
Agar aplikasi bisa diakses melalui port 80 (HTTP) atau domain tanpa mengetik `:3000`.

1.  Install Nginx:
    ```bash
    sudo apt install nginx -y
    ```

2.  Buat konfigurasi server block:
    ```bash
    sudo nano /etc/nginx/sites-available/didactic
    ```

3.  Isi dengan konfigurasi berikut (Ganti `domain-anda.com` atau gunakan IP Server jika belum ada domain):
    ```nginx
    server {
        listen 80;
        server_name domain-anda.com www.domain-anda.com; # Atau IP_SERVER

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

4.  Aktifkan konfigurasi:
    ```bash
    sudo ln -s /etc/nginx/sites-available/didactic /etc/nginx/sites-enabled/
    sudo nginx -t # Cek error syntax
    sudo systemctl restart nginx
    ```

✅ **Selesai!** Aplikasi sekarang dapat diakses di `http://domain-anda.com` atau `http://IP-SERVER`.

---

## 📘 Panduan Penggunaan

Aplikasi ini memiliki 3 hak akses (Role) berbeda. Gunakan akun demo berikut untuk login:

### 🔑 Akun Demo

| Role | Email | Password | Deskripsi Akses |
| :--- | :--- | :--- | :--- |
| **Operator (Admin)** | `budi@sekolah.id` | `123456` | Kontrol penuh sistem, manajemen user, dan pembuatan kurikulum master. |
| **Guru** | `siti@sekolah.id` | `123456` | Manajemen kelas, membuat materi ajar dengan AI, memulai kelas live. |
| **Siswa** | `dewi@student.id` | `123456` | Mengerjakan tugas/kuis, melihat materi, download transkrip nilai. |

### 1. Skenario: Membuat Kurikulum Baru (Admin)
1.  Login sebagai **Operator**.
2.  Masuk ke menu **Kurikulum**.
3.  Pilih **Level** yang diinginkan (misal: Basic -> Intermediate).
4.  Masukkan **Mata Pelajaran** (misal: "Pemrograman Web") dan **Total Pertemuan** (misal: 14 hari).
5.  Klik **Generate Kurikulum**. AI akan menyusun topik per pertemuan.
6.  Anda bisa mengedit manual hasil generate jika perlu.
7.  Klik **Simpan**. Kurikulum ini sekarang tersedia untuk digunakan oleh Guru.

### 2. Skenario: Menyiapkan Materi Ajar (Guru)
1.  Login sebagai **Guru**.
2.  Masuk ke menu **Materi & AI**.
3.  Pilih Mode: **"Dari Kurikulum"**.
4.  Pilih kurikulum yang sudah dibuat Admin tadi.
5.  Pilih pertemuan/topik spesifik.
6.  Klik **Buka Materi Pembelajaran**.
7.  AI akan membuatkan **Artikel Materi Lengkap** dan **Soal Kuis** secara instan.

### 3. Skenario: Mengajar Kelas Live (Guru)
1.  Masuk ke menu **Manajemen Kelas**.
2.  Pilih kelas yang Anda ampu, klik **Mulai Sesi Kelas**.
3.  Pilih topik hari ini.
4.  Di dalam kelas:
    *   Klik **Absensi** untuk merekap kehadiran.
    *   Gunakan kolom chat untuk diskusi.
    *   Klik icon **BarChart** di chat untuk membuat Polling dadakan.
    *   Klik **Upload** untuk membagikan PDF/PPT materi.

### 4. Skenario: Melihat Nilai (Siswa)
1.  Login sebagai **Siswa**.
2.  Di Dashboard, lihat grafik **Tren Nilai Akademik**.
3.  Klik tombol **Lihat Transkrip & Evaluasi**.
4.  Klik **Download Transkrip Lengkap** di bagian bawah pop-up untuk mencetak laporan hasil belajar.

---

## 📞 Support & Lisensi
Dikembangkan oleh **RedTeam.ID**.
Versi Aplikasi: 1.1.0

Jika mengalami kendala teknis, silakan cek log server dengan perintah:
```bash
pm2 logs didactic-board
```
