import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
});

// Enforce append-only integrity at the application runtime level:
// Prevent any update, delete, or bulk deletion on AuditLog
prisma.$use(async (params, next) => {
  if (params.model === 'AuditLog') {
    if (['update', 'updateMany', 'delete', 'deleteMany', 'upsert'].includes(params.action)) {
      throw new Error(`SECURITY_VIOLATION: AuditLog is append-only. Action '${params.action}' is forbidden.`);
    }
  }
  return next(params);
});

export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    return false;
  }
}
