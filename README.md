# DidacticBoard - Documentation & Installation Guide

Berikut adalah dokumentasi lengkap penggunaan dan panduan instalasi server Linux dalam format HTML. Anda dapat membuka file ini di browser atau menyalin kode di bawah ini.

```html
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>DidacticBoard - Dokumentasi & Instalasi</title>
    <style>
        :root {
            --primary: #2563eb;
            --secondary: #1e40af;
            --bg: #f8fafc;
            --text: #334155;
            --code-bg: #1e293b;
            --code-text: #e2e8f0;
        }
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: var(--text); background: var(--bg); margin: 0; padding: 0; }
        .container { max-width: 900px; margin: 0 auto; padding: 40px 20px; }
        header { background: linear-gradient(135deg, var(--primary), var(--secondary)); color: white; padding: 40px 0; text-align: center; margin-bottom: 40px; }
        h1 { margin: 0; font-size: 2.5rem; }
        h2 { border-bottom: 2px solid var(--primary); padding-bottom: 10px; margin-top: 40px; color: var(--secondary); }
        h3 { color: var(--primary); margin-top: 25px; }
        p { margin-bottom: 15px; }
        
        /* Code Block Styling */
        pre { background: var(--code-bg); color: var(--code-text); padding: 15px; border-radius: 8px; overflow-x: auto; font-family: 'Consolas', 'Monaco', monospace; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
        code { font-family: 'Consolas', 'Monaco', monospace; }
        .cmd { color: #4ade80; }
        .comment { color: #94a3b8; font-style: italic; }
        
        /* Components */
        .step { background: white; padding: 20px; border-radius: 8px; border-left: 5px solid var(--primary); margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
        .badge { display: inline-block; padding: 2px 8px; background: #e0f2fe; color: #0369a1; border-radius: 4px; font-size: 0.8em; font-weight: bold; }
        
        .nav-links { display: flex; justify-content: center; gap: 20px; margin-top: 20px; }
        .nav-links a { color: white; text-decoration: none; font-weight: bold; border-bottom: 2px solid transparent; transition: 0.3s; }
        .nav-links a:hover { border-bottom: 2px solid white; }

        table { width: 100%; border-collapse: collapse; margin-top: 20px; background: white; }
        th, td { border: 1px solid #cbd5e1; padding: 12px; text-align: left; }
        th { background: #f1f5f9; }
    </style>
</head>
<body>

<header>
    <div class="container">
        <h1>DidacticBoard</h1>
        <p>Sistem Manajemen Kurikulum & Pembelajaran Berbasis AI</p>
        <div class="nav-links">
            <a href="#about">Tentang</a>
            <a href="#install">Instalasi Server Linux</a>
            <a href="#usage">Panduan Pengguna</a>
        </div>
    </div>
</header>

<div class="container">

    <section id="about">
        <h2>📂 Tentang Aplikasi</h2>
        <p><strong>DidacticBoard</strong> adalah platform modern untuk lembaga pendidikan yang mengintegrasikan manajemen kelas, pembuatan kurikulum otomatis dengan AI (Gemini), dan kelas interaktif real-time.</p>
        
        <h3>Fitur Utama:</h3>
        <ul>
            <li>✨ <strong>AI Curriculum Generator:</strong> Membuat silabus bertingkat (Basic -> Expert) secara otomatis.</li>
            <li>📚 <strong>Material & Quiz AI:</strong> Generate materi ajar dan soal kuis dalam hitungan detik.</li>
            <li>🏫 <strong>Manajemen Kelas:</strong> Absensi, nilai, dan monitoring progress siswa.</li>
            <li>🎥 <strong>Interactive Class:</strong> Chat, polling, dan file sharing real-time (Simulasi).</li>
            <li>📄 <strong>Transkrip Otomatis:</strong> Cetak hasil studi siswa dengan satu klik.</li>
        </ul>
        
        <div class="step">
            <strong>Catatan Teknis:</strong> Aplikasi ini menggunakan <em>Local Storage</em> browser untuk menyimpan data (Mock Data Persistence) dan Node.js Express sebagai server aplikasi. Untuk penggunaan skala besar (Enterprise), disarankan mengintegrasikan Database seperti PostgreSQL atau MongoDB.
        </div>
    </section>

    <section id="install">
        <h2>🚀 Panduan Instalasi di Server Linux (Ubuntu/Debian)</h2>
        <p>Ikuti langkah-langkah berikut untuk men-deploy aplikasi ini ke VPS (Virtual Private Server) seperti AWS, DigitalOcean, atau Google Cloud.</p>

        <h3>Langkah 1: Persiapan Server</h3>
        <p>Login ke server Anda via SSH dan update paket sistem.</p>
        <pre>
<span class="cmd">ssh</span> root@ip-server-anda
<span class="cmd">sudo apt update && sudo apt upgrade -y</span>
<span class="cmd">sudo apt install curl git unzip -y</span></pre>

        <h3>Langkah 2: Instalasi Node.js (Versi 18/20 LTS)</h3>
        <pre>
<span class="comment"># Mengambil setup script NodeSource</span>
<span class="cmd">curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -</span>

<span class="comment"># Install Node.js dan NPM</span>
<span class="cmd">sudo apt install -y nodejs</span>

<span class="comment"># Verifikasi instalasi</span>
<span class="cmd">node -v</span>  <span class="comment"># Output harus v20.x.x</span>
<span class="cmd">npm -v</span></pre>

        <h3>Langkah 3: Upload & Setup Project</h3>
        <p>Upload file source code Anda ke server (bisa via SCP, FileZilla, atau Git Clone). Asumsikan folder project bernama <code>didactic-board</code>.</p>
        <pre>
<span class="comment"># Masuk ke direktori project</span>
<span class="cmd">cd didactic-board</span>

<span class="comment"># Install dependencies</span>
<span class="cmd">npm install</span>

<span class="comment"># Buat file Environment Variable</span>
<span class="cmd">nano .env</span></pre>
        <p>Isi file <code>.env</code> dengan konfigurasi berikut (Simpan dengan CTRL+O, Enter, CTRL+X):</p>
        <pre>
PORT=3000
API_KEY=MASUKKAN_GOOGLE_GEMINI_API_KEY_ANDA_DISINI</pre>

        <h3>Langkah 4: Build Aplikasi</h3>
        <p>Kompilasi kode React TypeScript menjadi static files yang siap produksi.</p>
        <pre><span class="cmd">npm run build</span></pre>
        <p><em>(Pastikan folder <code>dist</code> terbentuk setelah proses ini selesai).</em></p>

        <h3>Langkah 5: Menjalankan Server (Production Mode)</h3>
        <p>Gunakan <strong>PM2</strong> (Process Manager) agar aplikasi tetap berjalan di background dan auto-restart jika server reboot.</p>
        <pre>
<span class="comment"># Install PM2 secara global</span>
<span class="cmd">sudo npm install -g pm2</span>

<span class="comment"># Jalankan server</span>
<span class="cmd">pm2 start server.js --name "didactic-board"</span>

<span class="comment"># Simpan konfigurasi agar auto-start saat boot</span>
<span class="cmd">pm2 startup</span>
<span class="cmd">pm2 save</span></pre>

        <h3>Langkah 6: Konfigurasi Nginx (Reverse Proxy) - Opsional tapi Disarankan</h3>
        <p>Agar aplikasi bisa diakses via Domain (port 80/443) tanpa mengetik port 3000.</p>
        <pre>
<span class="cmd">sudo apt install nginx -y</span>
<span class="cmd">sudo nano /etc/nginx/sites-available/didactic</span></pre>
        
        <p>Isi konfigurasi Nginx:</p>
        <pre>
server {
    listen 80;
    server_name domain-anda.com www.domain-anda.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}</pre>
        <pre>
<span class="comment"># Aktifkan site dan restart Nginx</span>
<span class="cmd">sudo ln -s /etc/nginx/sites-available/didactic /etc/nginx/sites-enabled/</span>
<span class="cmd">sudo nginx -t</span>
<span class="cmd">sudo systemctl restart nginx</span></pre>

        <div class="step">
            ✅ <strong>Selesai!</strong> Akses aplikasi di <code>http://ip-server-anda</code> atau <code>http://domain-anda.com</code>.
        </div>
    </section>

    <section id="usage">
        <h2>📘 Panduan Penggunaan</h2>

        <h3>1. Login & Hak Akses</h3>
        <p>Gunakan kredensial demo berikut untuk masuk:</p>
        <table>
            <thead>
                <tr>
                    <th>Role</th>
                    <th>Email</th>
                    <th>Password</th>
                    <th>Akses Fitur</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td><span class="badge">Operator / Admin</span></td>
                    <td>budi@sekolah.id</td>
                    <td>123456</td>
                    <td>Kurikulum Generator, Manajemen User, Dashboard Admin</td>
                </tr>
                <tr>
                    <td><span class="badge">Guru</span></td>
                    <td>siti@sekolah.id</td>
                    <td>123456</td>
                    <td>Manajemen Kelas, Buat Materi AI, Mulai Kelas Live</td>
                </tr>
                <tr>
                    <td><span class="badge">Siswa</span></td>
                    <td>dewi@student.id</td>
                    <td>123456</td>
                    <td>Dashboard Siswa, Lihat Materi, Kerjakan Kuis, Transkrip</td>
                </tr>
            </tbody>
        </table>

        <h3>2. Cara Membuat Kurikulum (Admin)</h3>
        <ol>
            <li>Masuk sebagai <strong>Admin</strong>.</li>
            <li>Buka menu <strong>Kurikulum</strong>.</li>
            <li>Pilih level (Basic/Intermediate/etc), masukkan mata pelajaran, dan total pertemuan.</li>
            <li>Klik <strong>"Generate Kurikulum"</strong>. AI akan membuatkan silabus lengkap.</li>
            <li>Klik <strong>Simpan</strong> untuk masuk ke Pustaka Kurikulum.</li>
        </ol>

        <h3>3. Cara Mengajar & Kelas Live (Guru)</h3>
        <ol>
            <li>Masuk sebagai <strong>Guru</strong>.</li>
            <li>Buka menu <strong>Manajemen Kelas</strong>.</li>
            <li>Pada kartu kelas, klik <strong>"Mulai Sesi Kelas"</strong>.</li>
            <li>Pilih topik dari kurikulum yang sudah ditautkan atau ketik manual.</li>
            <li>Di dalam kelas live, Anda bisa melakukan <strong>Absensi</strong>, membuat <strong>Polling</strong>, dan <strong>Upload File</strong>.</li>
        </ol>

        <h3>4. Cara Download Transkrip (Siswa)</h3>
        <ol>
            <li>Masuk sebagai <strong>Siswa</strong>.</li>
            <li>Di Dashboard, klik tombol <strong>"Lihat Transkrip & Evaluasi"</strong> di kanan atas grafik nilai.</li>
            <li>Pop-up akan muncul, klik <strong>"Download Transkrip Lengkap"</strong> di bagian bawah untuk mencetak PDF.</li>
        </ol>
    </section>

    <footer>
        <hr>
        <p style="text-align: center; color: #64748b; font-size: 0.9em;">&copy; 2025 DidacticBoard. All Rights Reserved.</p>
    </footer>

</div>

</body>
</html>
```