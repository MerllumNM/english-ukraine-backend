const express = require('express');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/schools — Список шкіл із пагінацією та пошуком
router.get('/', async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const { search, city } = req.query;

    const where = {};
    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }
    if (city) {
      where.city = { contains: city, mode: 'insensitive' };
    }

    if (prisma.school) {
      const [schools, total] = await Promise.all([
        prisma.school.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
        prisma.school.count({ where }),
      ]);

      return res.status(200).json({
        data: schools,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      });
    }

    // Резервна відповідь, якщо модель у базі ще не заповнена
    res.status(200).json({
      data: [
        { id: 1, name: 'Lviv English Academy', city: 'Львів', address: 'вул. Франка, 12', rating: 4.9 },
        { id: 2, name: 'Green Forest', city: 'Львів', address: 'вул. Коперника, 5', rating: 4.8 },
      ],
      pagination: { total: 2, page: 1, limit: 10, totalPages: 1 },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/schools/:id — Профіль школи
router.get('/:id', async (req, res, next) => {
  try {
    const schoolId = parseInt(req.params.id);
    if (isNaN(schoolId)) {
      return res.status(400).json({ error: 'Некоректний ідентифікатор школи' });
    }

    if (prisma.school) {
      const school = await prisma.school.findUnique({
        where: { id: schoolId },
      });

      if (!school) {
        return res.status(404).json({ error: 'Школу не знайдено' });
      }
      return res.status(200).json({ school });
    }

    if (schoolId === 1) {
      return res.status(200).json({
        school: { id: 1, name: 'Lviv English Academy', city: 'Львів', address: 'вул. Франка, 12', rating: 4.9 },
      });
    }

    res.status(404).json({ error: 'Школу не знайдено' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;