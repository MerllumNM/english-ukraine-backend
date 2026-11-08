const express = require('express');
const cors = require('cors');
const teacherRoutes = require('./routes/teachers');
const schoolRoutes = require('./routes/schools');
const courseRoutes = require('./routes/courses');
const favoriteRoutes = require('./routes/favorites');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3000;

// Налаштування CORS під фронтенд
const allowedOrigins = process.env.CLIENT_URL 
  ? process.env.CLIENT_URL.split(',') 
  : ['http://localhost:3000', 'http://localhost:5173'];

app.use(cors({
  origin: function (origin, callback) {
    // Дозволяємо запити без origin (наприклад, Postman, PowerShell чи локальні файли) або з дозволених списків
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS політика забороняє доступ з цього джерела'));
    }
  },
  credentials: true,
}));

app.use(express.json());
app.use(express.static('public'));

// Логування запитів у консоль
app.use((req, res, next) => {
  console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
  next();
});

// Роути
app.use('/api/auth', authRoutes);
app.use('/api/teachers', teacherRoutes);
app.use('/api/schools', schoolRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/favorites', favoriteRoutes);

// Базовий тестовий роут
app.get('/', (req, res) => {
  res.json({ message: 'API працює успішно!' });
});

// Централізована обробка помилок (має бути в самому кінці)
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Сервер запущено на порту ${PORT}`);
});