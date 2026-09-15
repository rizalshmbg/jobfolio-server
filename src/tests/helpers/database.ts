import prisma from "../../config/prisma.js";

export const cleanDatabase = async () => {
  await prisma.user.deleteMany();
}

export const disconnectDatabase = async () => {
  await prisma.$disconnect();
}