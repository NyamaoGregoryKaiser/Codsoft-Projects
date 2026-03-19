import prisma from '../src/config/prismaClient';

export default async () => {
  await prisma.$disconnect();
};