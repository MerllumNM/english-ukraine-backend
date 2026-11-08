const express = require('express');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/teachers/top — Отримання топ-3 викладачів для головної сторінки (BE-18)
router.get('/top', async (req, res, next) => {
  try {
    if (prisma.teacher) {
      try {
        const topTeachers = await prisma.teacher.findMany({
          take: 3,
          orderBy: [
            { rating: 'desc' },
            { reviewsCount: 'desc' },
            { id: 'asc' },
          ],
        });
        if (topTeachers && topTeachers.length > 0) {
          return res.status(200).json({ data: topTeachers });
        }
      } catch (dbError) {
        console.log('[Top Teachers]: Бд ще не готова, повертаємо мок-дані');
      }
    }

    // Резервні мок-дані топ-3 викладачів
    const mockTopTeachers = [
      {
        id: 1,
        name: 'Олена Ковальчук',
        rating: 4.9,
        reviewsCount: 24,
        bio: 'Викладач із 8-річним досвідом підготовки до Spoken English.',
        avatar: 'https://via.placeholder.com/150',
      },
      {
        id: 2,
        name: 'Ігор Петренко',
        rating: 4.8,
        reviewsCount: 18,
        bio: 'Спеціаліст із розмовної англійської та Business English.',
        avatar: 'https://via.placeholder.com/150',
      },
      {
        id: 3,
        name: 'Марія Бойко',
        rating: 4.7,
        reviewsCount: 15,
        bio: 'Сертифікований викладач IELTS/TOEFL підготовки.',
        avatar: 'https://via.placeholder.com/150',
      },
    ];

    res.status(200).json({ data: mockTopTeachers });
  } catch (error) {
    next(error);
  }
});

// GET /api/teachers — Отримання списку викладачів із пагінацією та фільтрацією
router.get('/', async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const { search, subject, sortBy = 'createdAt', order = 'desc' } = req.query;
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

    try {
      if (prisma.teacher) {
        const [teachers, total] = await Promise.all([
          prisma.teacher.findMany({
            where,
            skip,
            take: limit,
            orderBy: { [sortBy]: order.toLowerCase() === 'asc' ? 'asc' : 'desc' },
          }),
          prisma.teacher.count({ where }),
        ]);

        return res.status(200).json({
          data: teachers,
          pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
          },
        });
      }
    } catch (dbErr) {
      console.log('[Teachers List]: БД ще не заповнена, вертаємо список');
    }

    const fallbackTeachers = [
      { id: 1, name: 'Олена Ковальчук', bio: 'Викладач із 8-річним досвідом підготовки до Spoken English.' },
      { id: 2, name: 'Ігор Петренко', bio: 'Спеціаліст із розмовної англійської та Business English.' },
    ];

    res.status(200).json({
      data: fallbackTeachers,
      pagination: { total: 2, page, limit, totalPages: 1 },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/teachers/:id — Отримання детальної інформації про викладача
router.get('/:id', async (req, res, next) => {
  try {
    const teacherId = parseInt(req.params.id);

    if (isNaN(teacherId)) {
      return res.status(400).json({ error: 'Некоректний ідентифікатор викладача' });
    }

    try {
      if (prisma.teacher) {
        const teacher = await prisma.teacher.findUnique({ where: { id: teacherId } });
        if (teacher) return res.status(200).json({ teacher });
      }
    } catch (dbErr) {
      // Ігноруємо помилку БД
    }

    if (teacherId === 1) {
      return res.status(200).json({
        teacher: { id: 1, name: 'Олена Ковальчук', bio: 'Викладач із 8-річним досвідом підготовки до Spoken English.' },
      });
    }

    res.status(404).json({ error: 'Викладача не знайдено' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;