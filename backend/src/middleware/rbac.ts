import { Request, Response, NextFunction } from 'express';
import { recordAuditLog } from './audit.js';

export function requireRole(...allowedRoles: Array<'ACCOUNT_HOLDER' | 'ADMIN'>) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      res.status(401).json({
        error: 'UNAUTHORIZED',
        message: 'Authentication required before role verification.',
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      // Audit log the unauthorized attempt (FR-13, FR-3)
      await recordAuditLog({
        req,
        action: 'ACCESS_DENIED_ROLE_CHECK',
        targetType: 'SYSTEM',
        targetId: req.originalUrl,
        outcome: 'DENIED',
        metadata: {
          attemptedPath: req.originalUrl,
          requiredRoles: allowedRoles,
          actualRole: req.user.role,
        },
      });

      res.status(403).json({
        error: 'FORBIDDEN',
        message: 'Access denied: caller does not possess the required administrative privileges.',
      });
      return;
    }

    next();
  };
}
