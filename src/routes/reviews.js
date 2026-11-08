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

// Допоміжна функція для розрахунку середнього рейтингу
const calculateRatingStats = (reviewsList) => {
  if (!reviewsList || reviewsList.length === 0) {
    return { averageRating: 0, reviewsCount: 0 };
  }
  const sum = reviewsList.reduce((acc, r) => acc + r.rating, 0);
  const avg = sum / reviewsList.length;
  return {
    averageRating: Math.round(avg * 10) / 10, // Округлення до 1 десяткового знака
    reviewsCount: reviewsList.length,
  };
};

// GET /api/reviews/teacher/:teacherId/rating — Отримати розрахований рейтинг викладача
router.get('/teacher/:teacherId/rating', async (req, res, next) => {
  try {
    const teacherId = parseInt(req.params.teacherId);

    if (isNaN(teacherId)) {
      return res.status(400).json({ error: 'Некоректний ідентифікатор викладача' });
    }

    if (prisma.review) {
      const aggregations = await prisma.review.aggregate({
        where: { teacherId },
        _avg: { rating: true },
        _count: { rating: true },
      });

      const avg = aggregations._avg.rating || 0;
      const count = aggregations._count.rating || 0;

      return res.status(200).json({
        teacherId,
        averageRating: Math.round(avg * 10) / 10,
        reviewsCount: count,
      });
    }

    const teacherReviews = reviewsStore.filter((r) => r.teacherId === teacherId);
    const stats = calculateRatingStats(teacherReviews);

    res.status(200).json({
      teacherId,
      ...stats,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/reviews/teacher/:teacherId — Отримати список відгуків із підсумковим рейтингом
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

      const aggregations = await prisma.review.aggregate({
        where: { teacherId },
        _avg: { rating: true },
        _count: { rating: true },
      });

      const avg = aggregations._avg.rating || 0;
      const count = aggregations._count.rating || 0;

      return res.status(200).json({
        ratingStats: {
          averageRating: Math.round(avg * 10) / 10,
          reviewsCount: count,
        },
        data: reviews,
      });
    }

    const teacherReviews = reviewsStore.filter((r) => r.teacherId === teacherId);
    const stats = calculateRatingStats(teacherReviews);

    res.status(200).json({
      ratingStats: stats,
      data: teacherReviews,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/reviews — Створити новий відгук (Сервер сам перераховує рейтинг)
router.post('/', authMiddleware, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { teacherId, rating, comment } = req.body;

    const parsedTeacherId = parseInt(teacherId);
    const parsedRating = parseInt(rating);

    if (isNaN(parsedTeacherId)) {
      return res.status(400).json({ error: 'Некоректний або відсутній teacherId' });
    }

    // Валідація оцінки (від 1 до 5)
    if (isNaN(parsedRating) || parsedRating < 1 || parsedRating > 5) {
      return res.status(400).json({ error: 'Оцінка повинна бути цілим числом від 1 до 5' });
    }

    if (!comment || typeof comment !== 'string' || comment.trim().length < 3) {
      return res.status(400).json({ error: 'Текст відгуку повинен містити не менше 3 символів' });
    }

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

      const aggregations = await prisma.review.aggregate({
        where: { teacherId: parsedTeacherId },
        _avg: { rating: true },
        _count: { rating: true },
      });

      return res.status(201).json({
        message: 'Відгук успішно збережено',
        data: newReview,
        updatedRating: {
          averageRating: Math.round((aggregations._avg.rating || 0) * 10) / 10,
          reviewsCount: aggregations._count.rating || 0,
        },
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

    const updatedTeacherReviews = reviewsStore.filter((r) => r.teacherId === parsedTeacherId);
    const updatedStats = calculateRatingStats(updatedTeacherReviews);

    res.status(201).json({
      message: 'Відгук успішно збережено',
      data: newReviewStore,
      updatedRating: updatedStats,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;