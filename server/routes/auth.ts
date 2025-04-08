import express, { Request, Response, NextFunction } from 'express';
import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import { db } from '../db';
import { users, venues } from '../../shared/schema';
import { eq, sql } from 'drizzle-orm';

const router = express.Router();

// Validation schemas
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
  rememberMe: z.boolean().optional().default(false),
});

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  userType: z.enum(['artist', 'venue', 'fan']),
  existingVenueId: z.number().optional(),
});

// Setup passport local strategy
passport.use(
  new LocalStrategy(
    { usernameField: 'email' },
    async (email, password, done) => {
      try {
        // Find user by email
        const userResults = await db.select().from(users).where(eq(users.email, email)).limit(1);
        const user = userResults[0];

        if (!user) {
          return done(null, false, { message: 'Invalid email or password' });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.passwordHash);
        if (!isMatch) {
          return done(null, false, { message: 'Invalid email or password' });
        }

        // Return user without password hash
        const { passwordHash, ...userWithoutPassword } = user;
        return done(null, userWithoutPassword);
      } catch (error) {
        return done(error);
      }
    }
  )
);

// Serialize user to session
passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id: string, done) => {
  try {
    const userResults = await db.select().from(users).where(sql`${users.id} = ${Number(id)}`).limit(1);
    const user = userResults[0];
    
    if (!user) {
      return done(null, false);
    }
    
    // Return user without password hash
    const { passwordHash, ...userWithoutPassword } = user;
    done(null, userWithoutPassword);
  } catch (error) {
    done(error);
  }
});

// Login route
router.post('/login', (req: Request, res: Response, next: NextFunction) => {
  try {
    // Validate request data
    const validatedData = loginSchema.parse(req.body);
    
    // Set session cookie expiration based on "remember me" option
    if (req.session) {
      if (validatedData.rememberMe) {
        // Set to 30 days
        req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000;
      } else {
        // Set to browser session
        req.session.cookie.expires = undefined;
      }
    }

    // Authenticate using passport
    passport.authenticate('local', (err: any, user: any, info: any) => {
      if (err) {
        return next(err);
      }
      
      if (!user) {
        return res.status(401).json({
          success: false,
          message: info?.message || 'Invalid email or password',
        });
      }
      
      // Log in the user
      req.login(user, (err) => {
        if (err) {
          return next(err);
        }
        
        return res.status(200).json({
          success: true,
          message: 'Login successful',
          user,
        });
      });
    })(req, res, next);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors,
      });
    }
    next(error);
  }
});

// Import the user role service
import { userRoleService } from '../services/userRoleService';

// Register route
router.post('/register', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Validate request data
    const validatedData = registerSchema.parse(req.body);
    
    // Check if user already exists
    const existingUserResults = await db.select().from(users).where(eq(users.email, validatedData.email)).limit(1);
    
    if (existingUserResults.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Email already in use',
      });
    }
    
    // Hash password
    const passwordHash = await bcrypt.hash(validatedData.password, 10);
    
    // Create new user
    const newUser = {
      name: validatedData.name,
      email: validatedData.email,
      passwordHash,
      userType: validatedData.userType,
    };
    
    const [createdUser] = await db.insert(users).values(newUser).returning();
    
    if (!createdUser) {
      throw new Error('Failed to create user');
    }

    // Get existing venue ID if provided for venue staff
    const existingVenueId = validatedData.existingVenueId;
    
    // Log venue assignment info
    if (validatedData.userType === 'venue' && existingVenueId) {
      console.log(`Assigning user to existing venue ID: ${existingVenueId}`);
    }

    // Create role-specific profile based on user type
    const { user, artistId, venueId } = await userRoleService.assignUserRole(
      createdUser, 
      existingVenueId
    );
    
    // Remove password hash before sending to client
    const { passwordHash: _, ...userWithoutPassword } = user;
    
    // Log in the new user
    req.login(userWithoutPassword, (err) => {
      if (err) {
        return next(err);
      }
      
      return res.status(201).json({
        success: true,
        message: 'Registration successful',
        user: userWithoutPassword,
        artistId,
        venueId
      });
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors,
      });
    }
    console.error('Registration error:', error);
    next(error);
  }
});

// Logout route
router.post('/logout', (req: Request, res: Response) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Logout failed',
      });
    }
    
    req.session?.destroy((err) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: 'Session destruction failed',
        });
      }
      
      res.clearCookie('connect.sid');
      return res.status(200).json({
        success: true,
        message: 'Logout successful',
      });
    });
  });
});

// Get venue options for registration
router.get('/venue-options', async (req: Request, res: Response) => {
  try {
    // Fetch venues from the database using db service
    const result = await db.select({
      id: venues.id,
      name: venues.name
    }).from(venues);
    
    return res.status(200).json({
      success: true,
      venues: result
    });
  } catch (error) {
    console.error('Error fetching venue options:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch venue options'
    });
  }
});

// Get current user route
router.get('/me', (req: Request, res: Response) => {
  if (!req.isAuthenticated() || !req.user) {
    return res.status(401).json({
      success: false,
      message: 'Not authenticated',
    });
  }
  
  return res.status(200).json({
    success: true,
    user: req.user,
  });
});

// Middleware to check if user is authenticated
export const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  if (req.isAuthenticated()) {
    return next();
  }
  
  res.status(401).json({
    success: false,
    message: 'Authentication required',
  });
};

export default router;