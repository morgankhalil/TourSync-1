import express, { Request, Response, NextFunction } from 'express';
import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import bcrypt from 'bcrypt';
import { storage } from '../storage';
import { User, insertUserSchema } from '../../shared/schema';
import { userRoleService } from '../services/userRoleService-replit';

const router = express.Router();

// Configure passport to use local strategy
passport.use(new LocalStrategy(
  {
    usernameField: 'email',
    passwordField: 'password'
  },
  async (email, password, done) => {
    try {
      const user = await storage.getUserByEmail(email);
      
      if (!user) {
        return done(null, false, { message: 'Invalid email or password' });
      }
      
      const isMatch = await bcrypt.compare(password, user.password);
      
      if (!isMatch) {
        return done(null, false, { message: 'Invalid email or password' });
      }
      
      return done(null, user);
    } catch (error) {
      return done(error);
    }
  }
));

// Define how to serialize user into session
passport.serializeUser((user: User, done) => {
  done(null, user.id);
});

// Define how to deserialize user from session
passport.deserializeUser(async (id: number, done) => {
  try {
    const user = await storage.getUserById(id);
    
    if (!user) {
      return done(new Error(`User with ID ${id} not found`));
    }
    
    done(null, user);
  } catch (error) {
    done(error);
  }
});

// Middleware to check if user is authenticated
export function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: 'Unauthorized' });
}

// Middleware to check if a user is a venue
export function isVenue(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated() && req.user && (req.user as User).userType === 'venue') {
    return next();
  }
  res.status(403).json({ message: 'Access denied. Venue access required.' });
}

// Middleware to check if a user is an artist
export function isArtist(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated() && req.user && (req.user as User).userType === 'artist') {
    return next();
  }
  res.status(403).json({ message: 'Access denied. Artist access required.' });
}

// Get current authenticated user
router.get('/me', isAuthenticated, (req: Request, res: Response) => {
  // Remove sensitive data before returning user
  const user = { ...req.user as User };
  delete (user as any).password;
  res.json(user);
});

// Login
router.post('/login', (req: Request, res: Response, next: NextFunction) => {
  passport.authenticate('local', (err: Error | null, user: User | false, info: { message: string } | undefined) => {
    if (err) {
      return next(err);
    }
    if (!user) {
      return res.status(401).json({ 
        message: info ? info.message : 'Authentication failed' 
      });
    }
    
    req.logIn(user, (err) => {
      if (err) {
        return next(err);
      }
      
      // Remove sensitive data before returning user
      const safeUser = { ...user };
      delete (safeUser as any).password;
      
      return res.json({ 
        message: 'Login successful',
        user: safeUser
      });
    });
  })(req, res, next);
});

// Register new user
router.post('/register', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, email, password, userType, existingVenueId } = req.body;
    
    // Validate required fields
    if (!name || !email || !password || !userType) {
      return res.status(400).json({ 
        message: 'Missing required fields' 
      });
    }
    
    // Check if email already exists
    const existingUser = await storage.getUserByEmail(email);
    
    if (existingUser) {
      return res.status(409).json({ 
        message: 'Email already registered' 
      });
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Create user with validated data
    const newUserData = {
      name,
      email,
      password: hashedPassword,
      userType,
    };
    
    // Validate with schema
    insertUserSchema.parse(newUserData);
    
    const user = await storage.createUser(newUserData);
    
    // Create appropriate profile based on user type
    const result = await userRoleService.assignUserRole(
      user, 
      existingVenueId ? parseInt(existingVenueId) : undefined
    );
    
    // Auto-login the new user
    req.logIn(result.user, (err) => {
      if (err) {
        return next(err);
      }
      
      // Remove sensitive data before returning user
      const safeUser = { ...result.user };
      delete (safeUser as any).password;
      
      return res.status(201).json({
        message: 'Registration successful',
        user: safeUser,
        artistId: result.artistId,
        venueId: result.venueId
      });
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      message: error instanceof Error ? error.message : 'Registration failed' 
    });
  }
});

// Logout
router.post('/logout', (req: Request, res: Response, next: NextFunction) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    res.json({ message: 'Logout successful' });
  });
});

// Get all venues (for venue selection during registration)
router.get('/venues', async (_req: Request, res: Response) => {
  try {
    const venues = await storage.getAllVenues();
    const venueOptions = venues.map(venue => ({
      id: venue.id,
      name: venue.name,
      address: venue.address,
      city: venue.city,
      state: venue.state
    }));
    
    res.json(venueOptions);
  } catch (error) {
    console.error('Error fetching venues:', error);
    res.status(500).json({ message: 'Failed to fetch venues' });
  }
});

export default router;