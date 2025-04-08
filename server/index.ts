import express, { type Request, Response, NextFunction } from "express";
import cache from "express-cache-controller";
import dotenv from "dotenv";
import session from "express-session";
import passport from "passport";
import { registerRoutes } from "./routes";
import calendarRoutes from "./routes/calendar";
import venuesApiRoutes from "./routes/venues-api";
import venueRoutes from "./routes/venue-routes";
import { registerTourRoutes } from "./routes/tours";
import { registerConfigRoutes } from "./routes/config";
import authRouter from "./routes/auth";
import { setupVite, serveStatic, log } from "./vite";

// Load environment variables
dotenv.config();

// Make sure SKIP_SAMPLE_DATA is available globally
if (process.env.SKIP_SAMPLE_DATA !== 'true') {
  console.log('Sample data will be initialized if no existing data is found');
} else {
  console.log('SKIP_SAMPLE_DATA=true, will not initialize sample data');
}

const app = express();
app.use(express.json());
app.use(cache({
  maxAge: 60 // Cache responses for 60 seconds by default
}));

// Import PostgreSQL session store
import connectPgSimple from "connect-pg-simple";
const PgSession = connectPgSimple(session);

// Session configuration with PostgreSQL store
app.use(session({
  store: new PgSession({
    conString: process.env.DATABASE_URL,
    tableName: 'session', // Optional. Default is 'session'
    createTableIfMissing: true // Create the table if it doesn't exist
  }),
  secret: process.env.SESSION_SECRET || 'venue-network-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Initialize Passport and session
app.use(passport.initialize());
app.use(passport.session());

// Register auth routes
app.use('/api/auth', authRouter);
app.use('/api/calendar', calendarRoutes);
app.use('/api/venues-direct', venuesApiRoutes);
app.use(express.urlencoded({ extended: false }));

// Disable caching
app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-store');
  next();
});

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        const sanitizedResponse = { ...capturedJsonResponse };
        if (sanitizedResponse.apiKey) {
          sanitizedResponse.apiKey = '***masked***';
        }
        logLine += ` :: ${JSON.stringify(sanitizedResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Register tour routes
  registerTourRoutes(app);

  // Register config routes for API keys
  registerConfigRoutes(app);

  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    console.error('Error:', err);
    if (!res.headersSent) {
      res.status(status).json({ message });
    }
  });

  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();