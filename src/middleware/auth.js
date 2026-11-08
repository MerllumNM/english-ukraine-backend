const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  // Перевіряємо наявність заголовка Authorization з формативанням Bearer <token>
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Доступ заборонено. Токен відсутній або невірний формат' });
  }

  const token = authHeader.split(' ')[1];

  try {
    // Розшифровуємо токен за допомогою секретного ключа
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Передаємо дані користувача (id, role) далі в контролер
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Недійсний або прострочений токен' });
  }
};

module.exports = authMiddleware;