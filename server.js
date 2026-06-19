require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/auth');
const moduleRoutes = require('./routes/modules');
const labRoutes = require('./routes/labs');
const aiRoutes = require('./routes/ai');
const userRoutes = require('./routes/users');

const app = express();

// ----- Security & parsing middleware -----
app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || '*',
    credentials: true,
  })
);
app.use(express.json({ limit: '1mb' }));

// Giới hạn tốc độ chung cho toàn bộ API để chống brute-force/spam
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Bạn đã gửi quá nhiều yêu cầu. Vui lòng thử lại sau ít phút.' },
});
app.use('/api', apiLimiter);

// Giới hạn riêng, nghiêm ngặt hơn cho đăng nhập/đăng ký (chống brute-force mật khẩu)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Quá nhiều lần thử đăng nhập/đăng ký. Vui lòng thử lại sau.' },
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// ----- Routes -----
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/modules', moduleRoutes);
app.use('/api/labs', labRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/users', userRoutes);

// ----- 404 handler -----
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'Không tìm thấy endpoint API này.' });
});

// ----- Global error handler -----
app.use((err, req, res, next) => {
  console.error('Lỗi không xử lý được:', err);
  res.status(500).json({ error: 'Đã xảy ra lỗi server không mong muốn.' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🛡️  InfoSec Academy API đang chạy tại http://localhost:${PORT}`);
  console.log(`   Môi trường: ${process.env.NODE_ENV || 'development'}`);
  console.log(`   AI mode: ${process.env.ANTHROPIC_API_KEY ? 'Anthropic API thật' : 'Offline (chưa cấu hình API key)'}`);
});
