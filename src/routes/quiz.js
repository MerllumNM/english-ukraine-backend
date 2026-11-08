const express = require('express');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

// Еталонні запитання із правильними відповідями (зберігаються ЛИШЕ на сервері)
const quizData = [
  {
    id: 1,
    question: 'She ___ to the gym every Tuesday.',
    options: [
      { id: 'a', text: 'go' },
      { id: 'b', text: 'goes' },
      { id: 'c', text: 'going' },
      { id: 'd', text: 'gone' },
    ],
    correctOptionId: 'b',
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
    correctOptionId: 'b',
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
    correctOptionId: 'b',
  },
];

// GET /api/quiz/questions — Отримання списку запитань без правильних відповідей
router.get('/questions', async (req, res, next) => {
  try {
    const publicQuestions = quizData.map((q) => ({
      id: q.id,
      question: q.question,
      options: q.options,
    }));

    res.status(200).json({ data: publicQuestions });
  } catch (error) {
    next(error);
  }
});

// POST /api/quiz/submit — Перевірка відповідей та розрахунок балу на сервері
router.post('/submit', async (req, res, next) => {
  try {
    const { answers } = req.body;

    if (!answers || !Array.isArray(answers)) {
      return res.status(400).json({ error: 'Масив відповідей `answers` є обов’язковим' });
    }

    // Видаляємо дублікати запитань (залишаємо тільки першу відповідь на кожне questionId)
    const uniqueAnswersMap = new Map();
    answers.forEach((ans) => {
      if (ans.questionId && ans.optionId && !uniqueAnswersMap.has(ans.questionId)) {
        uniqueAnswersMap.set(ans.questionId, ans.optionId);
      }
    });

    let score = 0;
    const details = [];

    quizData.forEach((q) => {
      const userAnswerId = uniqueAnswersMap.get(q.id);
      const isCorrect = userAnswerId === q.correctOptionId;

      if (isCorrect) score += 1;

      details.push({
        questionId: q.id,
        userOptionId: userAnswerId || null,
        correctOptionId: q.correctOptionId,
        isCorrect,
      });
    });

    const total = quizData.length;
    const percentage = Math.round((score / total) * 100);

    // Визначення рівня за набраним балом
    let level = 'A2 (Elementary)';
    if (percentage >= 80) level = 'C1 (Advanced)';
    else if (percentage >= 50) level = 'B2 (Upper-Intermediate)';
    else if (percentage >= 30) level = 'B1 (Intermediate)';

    res.status(200).json({
      score,
      total,
      percentage,
      level,
      details,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;