import { Request, Response, NextFunction } from 'express';

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ 
      error: 'Unauthorized',
      message: 'No authorization header'
    });
  }

  // For now, just check if header exists
  // You can add more robust token validation later
  next();
}