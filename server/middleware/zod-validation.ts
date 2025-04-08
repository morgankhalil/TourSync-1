import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
import { fromZodError } from 'zod-validation-error';

/**
 * Middleware for validating request body with zod schemas
 */
export function zodValidationMiddleware<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = schema.parse(req.body);
      req.body = validatedData;
      next();
    } catch (error: any) {
      const validationError = fromZodError(error);
      return res.status(400).json({ 
        error: 'Validation error', 
        details: validationError.message 
      });
    }
  };
}

/**
 * Middleware for validating query parameters with zod schemas
 */
export function zodQueryValidationMiddleware<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = schema.parse(req.query);
      req.query = validatedData as any;
      next();
    } catch (error: any) {
      const validationError = fromZodError(error);
      return res.status(400).json({ 
        error: 'Invalid query parameters', 
        details: validationError.message 
      });
    }
  };
}