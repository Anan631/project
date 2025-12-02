const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const compression = require('compression'); // <-- تمت إضافته
const helmet = require('helmet');       // <-- تمت إضافته
require('dotenv').config();

const app = express();

/* ----------------------- Middlewares ----------------------- */

// CORS مع إعدادات خفيفة للأداء
app.use(cors({ origin: ['http://localhost:3000', 'http://localhost:5000'], credentials: true }));

// JSON Parsing أسرع (مع limit لتقليل الهجمات)
app.use(express.json({ limit: '1mb' }));

// ضغط الاستجابات لتسريع النقل
app.use(compression());

// حماية أساسية
app.use(helmet());

/* -------------------------- Routes -------------------------- */

app.use('/api', require('./routes/auth'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/users', require('./routes/users'));
app.use('/api/logs', require('./routes/logs'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/password', require('./routes/password'));
app.use('/api/calculations', require('./routes/calculations')); // تم تصحيح الكتابة من calculations
app.use('/api/admin', require('./routes/admin'));

/* ------------------- Database Connection -------------------- */

if (!process.env.MONGO_URI) {
  console.error('❌ Missing MONGO_URI in .env');
  process.exit(1);
}

mongoose.connect(process.env.MONGO_URI, {
  serverSelectionTimeoutMS: 5000,  // تحسين سرعة الكشف عن المشاكل
  socketTimeoutMS: 45000
})
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

/* ------------------------- Health --------------------------- */

app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    time: new Date(),
    port: PORT
  });
});

/* ------------------------- Server ---------------------------- */

// لقد ذكرت أن الخادم يعمل على 5000، من الأفضل جعل هذا هو الافتراضي
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🟢 http://localhost:${PORT}/api`);
});