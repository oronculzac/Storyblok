import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient();

export const ensureDatabaseConnection = async (): Promise<void> => {
  await prisma.$connect();
};
