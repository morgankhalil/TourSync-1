import express, { type Request, Response, NextFunction } from "express";
import cache from "express-cache-controller";
import { registerRoutes } from "./routes";
import calendarRoutes from "./routes/calendar";
import { setupVite, serveStatic, log } from "./vite";
import { WebSocketServer } from 'ws';

const app = express();
app.use(express.json());

// Create WebSocket server with proper error handling
const wss = new WebSocketServer({ 
  noServer: true,
  perMessageDeflate: false // Disable compression to avoid potential frame errors
});

wss.on('error', (error) => {
  console.error('WebSocket Server Error:', error);
});

// Handle process termination
function shutdownGracefully() {
  console.log('Shutting down gracefully...');
  wss.close(() => {
    console.log('WebSocket server closed');
    process.exit(0);
  });
}

process.on('SIGTERM', shutdownGracefully);
process.on('SIGINT', shutdownGracefully);

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    const server = app.listen(PORT, '0.0.0.0', () => {
      log(`Server running at http://0.0.0.0:${PORT}`);
    });

    server.on('upgrade', (request, socket, head) => {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    });

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

    // Request logging middleware
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

    // Register routes and handle errors
    await registerRoutes(app);

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

    return server;
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

startServer();