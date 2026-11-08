const express = require('express');
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

// Ендпоінт реєстрації: POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    // 1. Валідація вхідних даних
    if (!email || !password) {
      return res.status(400).json({ error: 'Email та пароль є обов’язковими' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Пароль має містити як мінімум 6 символів' });
    }

    // 2. Перевірка унікальності email
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Користувач із таким email вже існує' });
    }

    // 3. Хешування пароля
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4. Створення нового користувача в базі
    const newUser = await prisma.user.create({
      data: {
        email,
        passwordHash: hashedPassword,
        name: name || null,
      },
    });

    // 5. Безпечна відповідь без передачі пароля
    res.status(201).json({
      message: 'Користувача успішно зареєстровано',
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
        createdAt: newUser.createdAt,
      },
    });
  } catch (error) {
    console.error('Помилка реєстрації:', error);
    res.status(500).json({ error: 'Внутрішня помилка сервера' });
  }
});

module.exports = router;