import { Router, Request, Response, NextFunction } from 'express';
import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import bcrypt from 'bcrypt';
import { db } from '../db';
import { users, insertUserSchema } from '../../shared/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const router = Router();

// Passport configuration
passport.use(new LocalStrategy(
  { usernameField: 'email' },
  async (email, password, done) => {
    try {
      const userResults = await db.select().from(users).where(eq(users.email, email));
      
      if (userResults.length === 0) {
        return done(null, false, { message: 'Incorrect email or password.' });
      }
      
      const user = userResults[0];
      const isValidPassword = await bcrypt.compare(password, user.passwordHash);
      
      if (!isValidPassword) {
        return done(null, false, { message: 'Incorrect email or password.' });
      }
      
      return done(null, user);
    } catch (error) {
      return done(error);
    }
  }
));

// Serialize and deserialize user
passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: number, done) => {
  try {
    const userResults = await db.select().from(users).where(eq(users.id, id));
    
    if (userResults.length === 0) {
      return done(null, false);
    }
    
    // Don't send the password hash to the client
    const { passwordHash, ...userWithoutPassword } = userResults[0];
    return done(null, userWithoutPassword);
  } catch (error) {
    return done(error);
  }
});

// Get current user
router.get('/user', (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  
  const user = req.user;
  return res.json(user);
});

// Login route
router.post('/login', (req: Request, res: Response, next: NextFunction) => {
  passport.authenticate('local', (err: Error, user: any, info: any) => {
    if (err) {
      return next(err);
    }
    
    if (!user) {
      return res.status(401).json({ error: info.message || 'Authentication failed' });
    }
    
    req.logIn(user, async (err) => {
      if (err) {
        return next(err);
      }
      
      // Update last login time
      await db.update(users)
        .set({ lastLogin: new Date() })
        .where(eq(users.id, user.id));
      
      // Don't send the password hash to the client
      const { passwordHash, ...userWithoutPassword } = user;
      return res.json(userWithoutPassword);
    });
  })(req, res, next);
});

// Logout route
router.post('/logout', (req: Request, res: Response) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ error: 'Logout failed' });
    }
    res.json({ message: 'Logged out successfully' });
  });
});

// Registration route
router.post('/register', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Validate input
    const validatedData = insertUserSchema.parse(req.body);
    
    // Check if email already exists
    const existingUser = await db.select().from(users).where(eq(users.email, validatedData.email));
    if (existingUser.length > 0) {
      return res.status(400).json({ error: 'Email already in use' });
    }
    
    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(validatedData.password, saltRounds);
    
    // Create user
    const result = await db.insert(users).values({
      name: validatedData.name,
      email: validatedData.email,
      passwordHash,
      role: validatedData.role || 'user',
      venueId: validatedData.venueId || null
    }).returning();
    
    if (!result || result.length === 0) {
      return res.status(500).json({ error: 'Failed to create user' });
    }
    
    const newUser = result[0];
    
    // Automatically log in the user after registration
    req.login(newUser, (err) => {
      if (err) {
        return next(err);
      }
      
      // Don't send the password hash to the client
      const { passwordHash, ...userWithoutPassword } = newUser;
      return res.status(201).json(userWithoutPassword);
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    next(error);
  }
});

export default router;