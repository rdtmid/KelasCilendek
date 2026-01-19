import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import cors from 'cors';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

// Load env vars
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Increase limit for large curriculum data

// Database Setup
let db;

// Mock Data for Seeding
const SEED_USERS = [
  { id: '1', name: 'Budi Santoso', email: 'budi@sekolah.id', role: 'Operator', avatar: 'https://picsum.photos/100/100?random=1', phone: '081234567890', password: 'admin' },
  { id: '2', name: 'Siti Aminah', email: 'siti@sekolah.id', role: 'Tenaga Pendidik', avatar: 'https://picsum.photos/100/100?random=2', phone: '081298765432', password: 'guru' },
  { id: '3', name: 'Ahmad Dani', email: 'ahmad@sekolah.id', role: 'Tenaga Pendidik', avatar: 'https://picsum.photos/100/100?random=3', phone: '081355556666', password: 'guru' },
  { id: '4', name: 'Dewi Lestari', email: 'dewi@student.id', role: 'Peserta Didik', avatar: 'https://picsum.photos/100/100?random=4', phone: '085711112222', password: 'siswa' },
];

const SEED_CLASSES = [
  { 
    id: 'c1', className: 'X-IPA-1', teacherId: '2', subject: 'Fisika Dasar', 
    schedule: 'Senin, 08:00 WIB', studentCount: 32, progress: 45,
    startDate: '2025-01-06', dayOfWeek: 1, totalMeetings: 16, curriculumId: ''
  },
  { 
    id: 'c2', className: 'XI-IPS-2', teacherId: '3', subject: 'Sejarah Indonesia', 
    schedule: 'Selasa, 10:00 WIB', studentCount: 28, progress: 70,
    startDate: '2025-01-07', dayOfWeek: 2, totalMeetings: 14, curriculumId: ''
  }
];

async function initializeDb() {
  db = await open({
    filename: 'database.sqlite',
    driver: sqlite3.Database
  });

  // Create Users Table (Updated with phone and password)
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT,
      email TEXT,
      role TEXT,
      avatar TEXT,
      bio TEXT,
      phone TEXT,
      password TEXT
    )
  `);

  // MIGRATION: Add columns if they don't exist (for existing databases)
  try {
    await db.exec("ALTER TABLE users ADD COLUMN phone TEXT");
    console.log("Migrated: Added 'phone' column to users.");
  } catch (e) { /* Column likely exists, ignore */ }

  try {
    await db.exec("ALTER TABLE users ADD COLUMN password TEXT");
    console.log("Migrated: Added 'password' column to users.");
    // Set default password for existing users
    await db.exec("UPDATE users SET password = '123' WHERE password IS NULL");
  } catch (e) { /* Column likely exists, ignore */ }

  // Create Curriculums Table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS curriculums (
      id TEXT PRIMARY KEY,
      name TEXT,
      subject TEXT,
      level TEXT,
      totalDays INTEGER,
      startDate TEXT,
      modules TEXT, -- Stored as JSON string
      createdAt TEXT
    )
  `);

  // Create Classes Table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS classes (
      id TEXT PRIMARY KEY,
      className TEXT,
      teacherId TEXT,
      subject TEXT,
      schedule TEXT,
      studentCount INTEGER,
      progress INTEGER,
      startDate TEXT,
      dayOfWeek INTEGER,
      totalMeetings INTEGER,
      curriculumId TEXT
    )
  `);

  // Seed Users if empty
  const userCount = await db.get('SELECT count(*) as count FROM users');
  if (userCount.count === 0) {
    console.log('Seeding initial users...');
    for (const user of SEED_USERS) {
      await db.run(
        'INSERT INTO users (id, name, email, role, avatar, bio, phone, password) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        user.id, user.name, user.email, user.role, user.avatar, '', user.phone, user.password
      );
    }
  }

  // Seed Classes if empty
  const classCount = await db.get('SELECT count(*) as count FROM classes');
  if (classCount.count === 0) {
    console.log('Seeding initial classes...');
    for (const cls of SEED_CLASSES) {
      await db.run(
        'INSERT INTO classes (id, className, teacherId, subject, schedule, studentCount, progress, startDate, dayOfWeek, totalMeetings, curriculumId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        cls.id, cls.className, cls.teacherId, cls.subject, cls.schedule, cls.studentCount, cls.progress, cls.startDate, cls.dayOfWeek, cls.totalMeetings, cls.curriculumId
      );
    }
  }

  console.log('Database initialized.');
}

initializeDb().catch(err => console.error('DB Init Error:', err));

// --- API ENDPOINTS ---

// USERS
app.get('/api/users', async (req, res) => {
  try {
    const users = await db.all('SELECT * FROM users');
    res.json(users);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/users', async (req, res) => {
  const { id, name, email, role, avatar, bio, phone, password } = req.body;
  try {
    await db.run(
      'INSERT INTO users (id, name, email, role, avatar, bio, phone, password) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      id, name, email, role, avatar, bio, phone || '', password || '123456'
    );
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/users/:id', async (req, res) => {
  const { name, email, role, avatar, bio, phone, password } = req.body;
  try {
    // If password provided, update it, otherwise keep old one
    if (password && password.trim() !== '') {
        await db.run(
            'UPDATE users SET name = ?, email = ?, role = ?, avatar = ?, bio = ?, phone = ?, password = ? WHERE id = ?',
            name, email, role, avatar, bio, phone, password, req.params.id
        );
    } else {
        await db.run(
            'UPDATE users SET name = ?, email = ?, role = ?, avatar = ?, bio = ?, phone = ? WHERE id = ?',
            name, email, role, avatar, bio, phone, req.params.id
        );
    }
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/users/:id', async (req, res) => {
  try {
    await db.run('DELETE FROM users WHERE id = ?', req.params.id);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// CURRICULUMS
app.get('/api/curriculums', async (req, res) => {
  try {
    const rows = await db.all('SELECT * FROM curriculums ORDER BY createdAt DESC');
    // Parse modules JSON string back to object
    const curriculums = rows.map(r => ({ ...r, modules: JSON.parse(r.modules) }));
    res.json(curriculums);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/curriculums', async (req, res) => {
  const { id, name, subject, level, totalDays, startDate, modules, createdAt } = req.body;
  try {
    await db.run(
      'INSERT INTO curriculums (id, name, subject, level, totalDays, startDate, modules, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      id, name, subject, level, totalDays, startDate, JSON.stringify(modules), createdAt
    );
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/curriculums/:id', async (req, res) => {
  const { name, subject, level, totalDays, startDate, modules } = req.body;
  try {
    await db.run(
      'UPDATE curriculums SET name = ?, subject = ?, level = ?, totalDays = ?, startDate = ?, modules = ? WHERE id = ?',
      name, subject, level, totalDays, startDate, JSON.stringify(modules), req.params.id
    );
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/curriculums/:id', async (req, res) => {
  try {
    await db.run('DELETE FROM curriculums WHERE id = ?', req.params.id);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// CLASSES
app.get('/api/classes', async (req, res) => {
  try {
    const classes = await db.all('SELECT * FROM classes');
    res.json(classes);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/classes', async (req, res) => {
  const { id, className, teacherId, subject, schedule, studentCount, progress, startDate, dayOfWeek, totalMeetings, curriculumId } = req.body;
  try {
    await db.run(
      'INSERT INTO classes (id, className, teacherId, subject, schedule, studentCount, progress, startDate, dayOfWeek, totalMeetings, curriculumId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      id, className, teacherId, subject, schedule, studentCount, progress, startDate, dayOfWeek, totalMeetings, curriculumId || ''
    );
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/classes/:id', async (req, res) => {
  const { className, teacherId, subject, schedule, studentCount, progress, startDate, dayOfWeek, totalMeetings, curriculumId } = req.body;
  try {
    await db.run(
      'UPDATE classes SET className = ?, teacherId = ?, subject = ?, schedule = ?, studentCount = ?, progress = ?, startDate = ?, dayOfWeek = ?, totalMeetings = ?, curriculumId = ? WHERE id = ?',
      className, teacherId, subject, schedule, studentCount, progress, startDate, dayOfWeek, totalMeetings, curriculumId || '', req.params.id
    );
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/classes/:id', async (req, res) => {
  try {
    await db.run('DELETE FROM classes WHERE id = ?', req.params.id);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// LOGIN AUTH (Checking DB with password)
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        // Query to check email AND password
        const user = await db.get('SELECT * FROM users WHERE email = ? AND password = ?', email, password);
        
        if (user) {
            res.json(user);
        } else {
            // Fallback for simple error message
            const emailCheck = await db.get('SELECT * FROM users WHERE email = ?', email);
            if (emailCheck) {
                res.status(401).json({ error: "Password salah." });
            } else {
                res.status(404).json({ error: "Email tidak terdaftar." });
            }
        }
    } catch(e) {
        res.status(500).json({ error: e.message });
    }
});

// Serve Static Files (Hasil Build Vite)
app.use(express.static(path.join(__dirname, 'dist')));

// Handle React Routing (SPA Fallback)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Start Server
app.listen(PORT, () => {
  console.log(`
  ================================================
  🚀 DidacticBoard Server Running (with SQLite)
  ================================================
  ► Local:      http://localhost:${PORT}
  ► Database:   Connected to database.sqlite
  ================================================
  `);
});