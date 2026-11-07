const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

prisma.$connect()
  .then(() => {
    console.log(' Successfully connected to PostgreSQL via Prisma');
  })
  .catch((error) => {
    console.error(' Database connection error:', error.message);
  });

module.exports = prisma;