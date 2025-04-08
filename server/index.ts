import express, { type Request, Response, NextFunction } from "express";
import cache from "express-cache-controller";
import { registerRoutes } from "./routes";
import calendarRoutes from "./routes/calendar";
import { setupVite, serveStatic, log } from "./vite";
import { config } from "dotenv";

config();

const envVars = Object.keys(process.env).filter(key => key.startsWith('VITE_'));
console.log('Loaded environment variables: ', envVars);

const app = express();
app.use(express.json());
app.use(cache({
  maxAge: 60 // Cache responses for 60 seconds by default
}));
app.use('/api/calendar', calendarRoutes);
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
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    console.error('Error:', err);
    if (!res.headersSent) {
      res.status(status).json({ message });
    }
  });

  // Setup Vite for development or serve static files for production
  console.log("Setting up Vite for server");
  await setupVite(app, server);

  const port = parseInt(process.env.PORT || '5000');
  server.listen(port, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${port}`);
  });
})();