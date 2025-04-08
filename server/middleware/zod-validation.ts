import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { fromZodError } from 'zod-validation-error';

/**
 * Middleware to validate request body against a Zod schema
 * @param schema Zod schema to validate against
 */
export const zodValidationMiddleware = (schema: z.ZodType<any, any>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = schema.safeParse(req.body);
      if (!result.success) {
        const validationError = fromZodError(result.error);
        return res.status(400).json({ 
          error: validationError.message,
          details: result.error.errors
        });
      }
      req.body = result.data;
      next();
    } catch (error) {
      return res.status(500).json({ error: 'Validation error occurred' });
    }
  };
};

/**
 * Middleware to validate query parameters against a Zod schema
 * @param schema Zod schema to validate against
 */
export const zodQueryValidationMiddleware = (schema: z.ZodType<any, any>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = schema.safeParse(req.query);
      if (!result.success) {
        const validationError = fromZodError(result.error);
        return res.status(400).json({ 
          error: validationError.message,
          details: result.error.errors
        });
      }
      req.query = result.data;
      next();
    } catch (error) {
      return res.status(500).json({ error: 'Query validation error occurred' });
    }
  };
};