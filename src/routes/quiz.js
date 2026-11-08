const express = require('express');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

// Мок-дані запитань для визначення рівня англійської мови
const mockQuestions = [
  {
    id: 1,
    question: 'She ___ to the gym every Tuesday.',
    options: [
      { id: 'a', text: 'go' },
      { id: 'b', text: 'goes' },
      { id: 'c', text: 'going' },
      { id: 'd', text: 'gone' },
    ],
  },
  {
    id: 2,
    question: 'If I ___ enough money, I would buy a new laptop.',
    options: [
      { id: 'a', text: 'have' },
      { id: 'b', text: 'had' },
      { id: 'c', text: 'will have' },
      { id: 'd', text: 'would have' },
    ],
  },
  {
    id: 3,
    question: 'The project must be finished ___ Friday at the latest.',
    options: [
      { id: 'a', text: 'until' },
      { id: 'b', text: 'by' },
      { id: 'c', text: 'on' },
      { id: 'd', text: 'for' },
    ],
  },
];

// GET /api/quiz/questions — Отримання списку запитань без правильних відповідей
router.get('/questions', async (req, res, next) => {
  try {
    if (prisma.question) {
      const questions = await prisma.question.findMany({
        select: {
          id: true,
          question: true,
          options: {
            select: {
              id: true,
              text: true,
              // Поле isCorrect свідомо НЕ вибираємо
            },
          },
        },
        orderBy: { id: 'asc' },
      });

      if (questions && questions.length > 0) {
        return res.status(200).json({ data: questions });
      }
    }

    // Якщо таблиця в БД ще порожня — повертаємо безпечні мок-дані
    res.status(200).json({ data: mockQuestions });
  } catch (error) {
    next(error);
  }
});

module.exports = router;