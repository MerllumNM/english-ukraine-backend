const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Початок заповнення бази тестовими даними...');

  // 1. Очищаємо таблиці від старих даних у правильному порядку
  await prisma.testResult.deleteMany();
  await prisma.favorite.deleteMany();
  await prisma.review.deleteMany();
  await prisma.course.deleteMany();
  await prisma.teacher.deleteMany();
  await prisma.school.deleteMany();
  await prisma.testQuestion.deleteMany();
  await prisma.user.deleteMany();

  // 2. Створюємо тестову школу
  const school = await prisma.school.create({
    data: {
      name: 'English Excellence Academy',
      description: 'Школа вивчення англійської мови для студентів та IT-фахівців',
      location: 'Львів',
      website: 'https://example.com',
    },
  });

  // 3. Створюємо тестового викладача
  const teacher = await prisma.teacher.create({
    data: {
      name: 'Олена Ковальчук',
      bio: 'Викладач із 8-річним досвідом підготовки до Spoken English',
      avatarUrl: 'https://via.placeholder.com/150',
      schoolId: school.id,
    },
  });

  // 4. Створюємо тестовий курс
  await prisma.course.create({
    data: {
      title: 'English for IT & Software Engineering',
      description: 'Інтенсивний курс технічної англійської мови',
      price: 2500.0,
      schoolId: school.id,
    },
  });

  // 5. Створюємо тестове запитання для тестування
  await prisma.testQuestion.create({
    data: {
      question: 'Choose the correct form: "She ___ to the office every day."',
      options: ['go', 'goes', 'going', 'gone'],
      correctAnswer: 'goes',
      level: 'A2',
    },
  });

  // 6. Створюємо тестового користувача
  await prisma.user.create({
    data: {
      email: 'student@example.com',
      passwordHash: '$2b$10$hashedpasswordexample1234567890',
      name: 'Тестовий Студент',
      role: 'USER',
    },
  });

  console.log('Базу даних успішно наповнено тестовими даними!');
}

main()
  .catch((e) => {
    console.error('Помилка під час seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });