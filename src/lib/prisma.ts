import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

// Handle connection errors gracefully
prisma.$connect().catch((error) => {
  console.error('Failed to connect to database:', error.message);
  console.error('Please make sure DATABASE_URL is set in your .env file');
});

export default prisma;

