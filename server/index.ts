import express, { type Request, Response, NextFunction } from "express";
import cache from "express-cache-controller";
import { registerRoutes } from "./routes";
import calendarRoutes from "./routes/calendar";
import { setupVite, serveStatic, log } from "./vite";
import { WebSocketServer } from 'ws';

const app = express();
app.use(express.json());

// Handle process termination
process.on('SIGTERM', () => {
  console.log('Received SIGTERM. Performing graceful shutdown...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('Received SIGINT. Performing graceful shutdown...');
  process.exit(0);
});

// Create WebSocket server
const wss = new WebSocketServer({ noServer: true });

// Handle WebSocket upgrade
const PORT = 5000;

function shutdownGracefully() {
  console.log('Shutting down gracefully...');
  process.exit(0);
}

process.on('SIGTERM', shutdownGracefully);
process.on('SIGINT', shutdownGracefully);

const server = app.listen(PORT, '0.0.0.0', () => {
  log(`Server running at http://0.0.0.0:${PORT}`);
}).on('error', (err: any) => {
  if (err.code === 'EADDRINUSE') {
    log(`Port ${PORT} is busy, trying to close existing process...`);
    shutdownGracefully();
  } else {
    console.error('Server error:', err);
  }
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

  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const port = process.env.PORT || 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`Server running at http://0.0.0.0:${port}`);
  });
})();