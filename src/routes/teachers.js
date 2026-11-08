const express = require('express');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/teachers — Отримання списку викладачів із пагінацією, пошуком та фільтрацією
router.get('/', async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const { search, subject, sortBy = 'createdAt', order = 'desc' } = req.query;

    // Формуємо умови фільтрації
    const where = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (subject) {
      where.subject = { contains: subject, mode: 'insensitive' };
    }

    // Отримуємо викладачів (із виключенням чутливих даних)
    const [teachers, total] = await Promise.all([
      prisma.teacher
        ? prisma.teacher.findMany({
            where,
            skip,
            take: limit,
            orderBy: { [sortBy]: order.toLowerCase() === 'asc' ? 'asc' : 'desc' },
          })
        : prisma.user.findMany({
            where: { ...where, role: 'TEACHER' },
            skip,
            take: limit,
            orderBy: { [sortBy]: order.toLowerCase() === 'asc' ? 'asc' : 'desc' },
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              createdAt: true,
            },
          }),
      prisma.teacher
        ? prisma.teacher.count({ where })
        : prisma.user.count({ where: { ...where, role: 'TEACHER' } }),
    ]);

    res.status(200).json({
      data: teachers,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/teachers/:id — Отримання детальної інформації про одного викладача
router.get('/:id', async (req, res, next) => {
  try {
    const teacherId = parseInt(req.params.id);

    if (isNaN(teacherId)) {
      return res.status(400).json({ error: 'Некоректний ідентифікатор викладача' });
    }

    let teacher = null;

    if (prisma.teacher) {
      teacher = await prisma.teacher.findUnique({ where: { id: teacherId } });
    } else {
      teacher = await prisma.user.findFirst({
        where: { id: teacherId, role: 'TEACHER' },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
        },
      });
    }

    if (!teacher) {
      return res.status(404).json({ error: 'Викладача не знайдено' });
    }

    res.status(200).json({ teacher });
  } catch (error) {
    next(error);
  }
});

module.exports = router;