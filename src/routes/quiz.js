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

// GET /api/quiz/questions — Отримання списку запитань без правильних відповідей (BE-12)
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

// POST /api/quiz/submit — Перевірка відповідей та розрахунок балу на сервері (BE-13)
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

// POST /api/quiz/recommendations — Алгоритм рекомендацій за результатом тесту (BE-14)
router.post('/recommendations', async (req, res, next) => {
  try {
    const { level } = req.body;

    if (!level) {
      return res.status(400).json({ error: 'Параметр level є обов’язковим' });
    }

    // Базові правила відповідності рівням та спеціалізаціям
    const recommendationsMap = {
      'A2': {
        courses: [{ id: 101, title: 'English Grammar & Basics A2', level: 'A2', price: 2800 }],
        schools: [{ id: 1, name: 'Lviv English Academy', matchReason: 'Найкраща програма підготовки з нуля та A2' }],
        teachers: [{ id: 1, name: 'Олена Ковальчук', specialization: 'Spoken English & Grammar A1-A2' }],
        reason: 'Рекомендовано для закріплення базової граматики та подолання мовного бар’єру на рівні A2.'
      },
      'B1': {
        courses: [{ id: 102, title: 'Intermediate Conversation Club B1', level: 'B1', price: 3200 }],
        schools: [{ id: 2, name: 'Green Forest', matchReason: 'Інтенсивні розмовні клуби для рівня B1' }],
        teachers: [{ id: 2, name: 'Ігор Петренко', specialization: 'Intermediate Speaking & Vocabulary' }],
        reason: 'Рекомендовано для розширення словникового запасу та вільного повсякденного спілкування.'
      },
      'B2': {
        courses: [{ id: 1, title: 'English for IT & Software Engineering', level: 'B2', price: 3500 }],
        schools: [{ id: 1, name: 'Lviv English Academy', matchReason: 'Спеціалізовані IT-курси для рівня B2' }],
        teachers: [{ id: 1, name: 'Олена Ковальчук', specialization: 'Business & Tech English B2-C1' }],
        reason: 'Рекомендовано для професійного розвитку, підготовки до IT-співбесід та рівня B2.'
      },
      'C1': {
        courses: [{ id: 2, title: 'IELTS Preparation & Advanced C1', level: 'C1', price: 4500 }],
        schools: [{ id: 2, name: 'Green Forest', matchReason: 'Підготовка до міжнародних іспитів C1-C2' }],
        teachers: [{ id: 3, name: 'Марія Бойко', specialization: 'IELTS & Academic English' }],
        reason: 'Рекомендовано для академічної мови, підготовки до складання IELTS та рівня C1.'
      }
    };

    // Шукаємо збіг рівня (наприклад, з "B2 (Upper-Intermediate)" робимо збіг із "B2")
    let matchedKey = Object.keys(recommendationsMap).find((k) => level.includes(k));
    let matched = matchedKey ? recommendationsMap[matchedKey] : null;

    // Фолбек при відсутності збігу
    if (!matched) {
      matched = {
        courses: recommendationsMap['B2'].courses,
        schools: recommendationsMap['B2'].schools,
        teachers: recommendationsMap['B2'].teachers,
        reason: 'Точний рівень не визначено або недостатньо вузьких курсів. Рекомендовано універсальну програму B2.'
      };
    }

    res.status(200).json({
      requestedLevel: level,
      recommendations: matched
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;