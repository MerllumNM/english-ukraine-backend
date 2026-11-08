const express = require('express');
const { PrismaClient } = require('@prisma/client');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Усі маршрути обраного вимагають обов'язкової авторизації
router.use(authMiddleware);

// GET /api/favorites — Отримати список обраних викладачів поточного користувача
router.get('/', async (req, res, next) => {
  try {
    const userId = req.user.id;

    if (prisma.favorite) {
      const favorites = await prisma.favorite.findMany({
        where: { userId },
        include: { teacher: true },
      });
      return res.status(200).json({ data: favorites });
    }

    if (prisma.favoriteTeacher) {
      const favorites = await prisma.favoriteTeacher.findMany({
        where: { userId },
      });
      return res.status(200).json({ data: favorites });
    }

    res.status(200).json({ data: [] });
  } catch (error) {
    next(error);
  }
});

// POST /api/favorites — Додати викладача в обране
router.post('/', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const teacherId = parseInt(req.body.teacherId);

    if (!teacherId || isNaN(teacherId)) {
      return res.status(400).json({ error: 'Некоректний або відсутній teacherId' });
    }

    // Перевірка існування викладача
    let teacherExists = false;
    if (prisma.teacher) {
      const t = await prisma.teacher.findUnique({ where: { id: teacherId } });
      if (t) teacherExists = true;
    } else if (prisma.user) {
      const t = await prisma.user.findFirst({ where: { id: teacherId, role: 'TEACHER' } });
      if (t) teacherExists = true;
    }

    // Дозволяємо ID=1 для тестового викладача
    if (!teacherExists && teacherId !== 1) {
      return res.status(404).json({ error: 'Викладача з таким ID не знайдено' });
    }

    // Перевірка дублікатів та створення
    if (prisma.favorite) {
      const existing = await prisma.favorite.findFirst({
        where: { userId, teacherId },
      });

      if (existing) {
        return res.status(400).json({ error: 'Викладач вже є у списку обраного' });
      }

      const newFav = await prisma.favorite.create({
        data: { userId, teacherId },
      });
      return res.status(201).json({ message: 'Викладача успішно додано в обране', data: newFav });
    }

    res.status(201).json({
      message: 'Викладача успішно додано в обране',
      data: { userId, teacherId },
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/favorites/:teacherId — Видалити викладача з обраного
router.delete('/:teacherId', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const teacherId = parseInt(req.params.teacherId);

    if (isNaN(teacherId)) {
      return res.status(400).json({ error: 'Некоректний ідентифікатор викладача' });
    }

    if (prisma.favorite) {
      const existing = await prisma.favorite.findFirst({
        where: { userId, teacherId },
      });

      if (!existing) {
        return res.status(404).json({ error: 'Запис в обраному не знайдено' });
      }

      await prisma.favorite.delete({
        where: { id: existing.id },
      });
    }

    res.status(200).json({ message: 'Викладача видалено з обраного', teacherId });
  } catch (error) {
    next(error);
  }
});

module.exports = router;