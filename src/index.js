const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Роути
app.use('/api/auth', authRoutes);

// Базовий перевірочний ендпоінт
app.get('/', (req, res) => {
  res.send('API працює успішно!');
});

app.listen(PORT, () => {
  console.log(`Сервер запущено на порту ${PORT}`);
});