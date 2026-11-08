const express = require('express');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/courses — Список курсів із пагінацією та фільтром
router.get('/', async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const { search, level, schoolId } = req.query;

    const where = {};
    if (search) {
      where.title = { contains: search, mode: 'insensitive' };
    }
    if (level) {
      where.level = { equals: level, mode: 'insensitive' };
    }
    if (schoolId) {
      where.schoolId = parseInt(schoolId);
    }

    if (prisma.course) {
      const [courses, total] = await Promise.all([
        prisma.course.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
        prisma.course.count({ where }),
      ]);

      return res.status(200).json({
        data: courses,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      });
    }

    res.status(200).json({
      data: [
        { id: 1, title: 'General English B2', level: 'B2', price: 3500, schoolId: 1 },
        { id: 2, title: 'IELTS Preparation', level: 'C1', price: 4500, schoolId: 1 },
      ],
      pagination: { total: 2, page: 1, limit: 10, totalPages: 1 },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/courses/:id — Деталі конкретного курсу
router.get('/:id', async (req, res, next) => {
  try {
    const courseId = parseInt(req.params.id);
    if (isNaN(courseId)) {
      return res.status(400).json({ error: 'Некоректний ідентифікатор курсу' });
    }

    if (prisma.course) {
      const course = await prisma.course.findUnique({
        where: { id: courseId },
      });

      if (!course) {
        return res.status(404).json({ error: 'Курс не знайдено' });
      }
      return res.status(200).json({ course });
    }

    if (courseId === 1) {
      return res.status(200).json({
        course: { id: 1, title: 'General English B2', level: 'B2', price: 3500, schoolId: 1 },
      });
    }

    res.status(404).json({ error: 'Курс не знайдено' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;