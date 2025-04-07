
import { Request, Response, NextFunction } from 'express';

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const userId = req.headers['x-replit-user-id'];
  const userName = req.headers['x-replit-user-name'];
  
  if (!userId || !userName) {
    return res.status(401).json({ 
      error: 'Unauthorized',
      message: 'You must be logged in to access this endpoint' 
    });
  }

  // Add user info to request for use in route handlers
  req.user = {
    id: userId as string,
    name: userName as string
  };

  next();
}
