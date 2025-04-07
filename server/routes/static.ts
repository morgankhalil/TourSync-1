import { Router, Request, Response } from 'express';
import path from 'path';
import express from 'express';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Correctly set up ESM compatible __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = Router();

// Demo page HTML content
const POSTER_DEMO_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Poster Field Test Page</title>
  <style>
    body { font-family: sans-serif; max-width: 1200px; margin: 0 auto; padding: 20px; }
    h1 { text-align: center; }
    .events { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px; }
    .event { border: 1px solid #ddd; border-radius: 8px; overflow: hidden; }
    .poster { height: 200px; background: #f5f5f5; overflow: hidden; }
    .poster img { width: 100%; height: 100%; object-fit: cover; }
    .details { padding: 15px; }
    .error { color: red; text-align: center; padding: 20px; }
    #log { margin-top: 30px; border: 1px solid #ddd; padding: 10px; background: #f9f9f9; display: none; }
    .loading { text-align: center; padding: 20px; }
  </style>
</head>
<body>
  <h1>Empty Bottle Events</h1>
  <div id="content" class="loading">Loading events...</div>
  <div id="log"></div>

  <script>
    const log = document.getElementById('log');
    
    function showLog(message) {
      log.style.display = 'block';
      log.innerHTML += '<p>' + message + '</p>';
    }
    
    // Error handling
    window.onerror = function(message, source, lineno) {
      showLog('Error: ' + message + ' at ' + source + ':' + lineno);
    };
    
    async function loadEvents() {
      const content = document.getElementById('content');
      
      try {
        showLog('Fetching from ' + window.location.origin + '/api/venues/45/dates');
        const response = await fetch('/api/venues/45/dates');
        
        if (!response.ok) {
          throw new Error('API request failed: ' + response.status);
        }
        
        const events = await response.json();
        showLog('Received ' + events.length + ' events');
        
        if (!events || events.length === 0) {
          content.innerHTML = '<div class="error">No events found</div>';
          return;
        }
        
        // Build HTML for events
        content.className = 'events';
        content.innerHTML = events.map(event => {
          const date = new Date(event.date).toLocaleDateString();
          return \`
            <div class="event">
              <div class="poster">
                \${event.poster ? 
                  \`<img src="\${event.poster}" alt="Event poster">\` : 
                  'No poster available'}
              </div>
              <div class="details">
                <h3>Event #\${event.id}</h3>
                <p>Date: \${date}</p>
                <p>Venue: \${event.venueName || 'Unknown'}</p>
                <p>Status: \${event.status}</p>
              </div>
            </div>
          \`;
        }).join('');
        
      } catch (error) {
        content.innerHTML = '<div class="error">Error: ' + error.message + '</div>';
        showLog('Error: ' + error.message);
      }
    }
    
    // Start loading when page is ready
    document.addEventListener('DOMContentLoaded', loadEvents);
  </script>
</body>
</html>`;

const SIMPLE_DEMO_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Simple Poster Test</title>
  <style>
    body { font-family: sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
    h1 { text-align: center; }
    .event { border: 1px solid #ddd; margin-bottom: 15px; padding: 15px; border-radius: 5px; }
    .event img { max-width: 100%; max-height: 200px; display: block; margin: 10px 0; }
    .error { color: red; text-align: center; }
  </style>
</head>
<body>
  <h1>Tour Dates with Posters</h1>
  <div id="content">Loading...</div>
  
  <script>
    fetch('/api/venues/45/dates')
      .then(response => {
        if (!response.ok) throw new Error('HTTP error ' + response.status);
        return response.json();
      })
      .then(events => {
        if (!events || events.length === 0) {
          document.getElementById('content').innerHTML = '<p class="error">No events found</p>';
          return;
        }
        
        document.getElementById('content').innerHTML = events.map(event => \`
          <div class="event">
            <h2>Tour Date #\${event.id}</h2>
            <p>Date: \${new Date(event.date).toLocaleDateString()}</p>
            <p>Venue: \${event.venueName || 'Unknown'}</p>
            <p>Status: \${event.status}</p>
            \${event.poster ? \`<img src="\${event.poster}" alt="Event poster">\` : '<p>No poster available</p>'}
          </div>
        \`).join('');
      })
      .catch(error => {
        document.getElementById('content').innerHTML = '<p class="error">Error: ' + error.message + '</p>';
        console.error('Error:', error);
      });
  </script>
</body>
</html>`;

// Direct serving of demo pages - sending the HTML directly rather than serving files
router.get('/api/demo/poster', (_req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/html');
  res.send(POSTER_DEMO_HTML);
});

router.get('/api/demo/simple', (_req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/html');
  res.send(SIMPLE_DEMO_HTML);
});

export default router;