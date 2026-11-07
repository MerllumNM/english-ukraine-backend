# English-Ukraine Backend

## Налаштування та запуск БД (Prisma + PostgreSQL)

1. **Створіть файл `.env`** у корені проєкту на основі шаблону `.env.example`:
   Вкажіть у своєму `.env` локальні дані підключення до PostgreSQL у змінній `DATABASE_URL`.

2. **Встановіть залежності та згенеруйте Prisma Client:**
   ```bash
   npm install
   .\node_modules\.bin\prisma generate