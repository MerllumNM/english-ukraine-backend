const express = require('express');
const { PrismaClient } = require('@prisma/client');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Резервне сховище для відгуків у пам'яті
const reviewsStore = [
  {
    id: 1,
    teacherId: 1,
    userId: 2,
    rating: 5,
    comment: 'Чудовий викладач! Пояснює тему дуже зрозуміло та цікаво.',
    createdAt: new Date().toISOString(),
  },
];

// GET /api/reviews/teacher/:teacherId — Отримати список відгуків про викладача
router.get('/teacher/:teacherId', async (req, res, next) => {
  try {
    const teacherId = parseInt(req.params.teacherId);

    if (isNaN(teacherId)) {
      return res.status(400).json({ error: 'Некоректний ідентифікатор викладача' });
    }

    if (prisma.review) {
      const reviews = await prisma.review.findMany({
        where: { teacherId },
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { id: true, name: true },
          },
        },
      });
      return res.status(200).json({ data: reviews });
    }

    const teacherReviews = reviewsStore.filter((r) => r.teacherId === teacherId);
    res.status(200).json({ data: teacherReviews });
  } catch (error) {
    next(error);
  }
});

// POST /api/reviews — Створити новий відгук (Захищений роут)
router.post('/', authMiddleware, async (req, res, next) => {
  try {
    const userId = req.user.id; // Автор береться суворо з перевіреного токена
    const { teacherId, rating, comment } = req.body;

    const parsedTeacherId = parseInt(teacherId);
    const parsedRating = parseInt(rating);

    if (isNaN(parsedTeacherId)) {
      return res.status(400).json({ error: 'Некоректний або відсутній teacherId' });
    }

    // Перевірка коректності оцінки (від 1 до 5)
    if (isNaN(parsedRating) || parsedRating < 1 || parsedRating > 5) {
      return res.status(400).json({ error: 'Оцінка повинна бути цілим числом від 1 до 5' });
    }

    // Валідація текстового вмісту відгуку
    if (!comment || typeof comment !== 'string' || comment.trim().length < 3) {
      return res.status(400).json({ error: 'Текст відгуку повинен містити не менше 3 символів' });
    }

    // Перевірка повторного відгуку від цього ж користувача
    if (prisma.review) {
      const existingReview = await prisma.review.findFirst({
        where: { userId, teacherId: parsedTeacherId },
      });

      if (existingReview) {
        return res.status(400).json({ error: 'Ви вже залишали відгук для цього викладача' });
      }

      const newReview = await prisma.review.create({
        data: {
          userId,
          teacherId: parsedTeacherId,
          rating: parsedRating,
          comment: comment.trim(),
        },
      });

      return res.status(201).json({
        message: 'Відгук успішно збережено',
        data: newReview,
      });
    }

    const existingInStore = reviewsStore.find(
      (r) => r.userId === userId && r.teacherId === parsedTeacherId
    );

    if (existingInStore) {
      return res.status(400).json({ error: 'Ви вже залишали відгук для цього викладача' });
    }

    const newReviewStore = {
      id: Date.now(),
      teacherId: parsedTeacherId,
      userId,
      rating: parsedRating,
      comment: comment.trim(),
      createdAt: new Date().toISOString(),
    };

    reviewsStore.push(newReviewStore);

    res.status(201).json({
      message: 'Відгук успішно збережено',
      data: newReviewStore,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;