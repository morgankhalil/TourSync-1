import axios from 'axios';
import { Band, Tour, TourDate, Venue } from '@shared/schema';
import { storage } from '../storage';
import { format } from 'date-fns';
import { WebSocket, WebSocketServer } from 'ws';

export class BandsintownIntegration {
    private apiKey: string;
    private baseUrl = 'https://rest.bandsintown.com';
    private websocketClients: Map<string, WebSocket[]> = new Map();

    constructor(apiKey: string) {
        this.apiKey = apiKey;
        this.initializeWebSocketServer();
    }

    private initializeWebSocketServer() {
        const wss = new WebSocketServer({ 
            port: 8080,
            host: '0.0.0.0',
            clientTracking: true
        });

        wss.on('connection', (ws) => {
            ws.on('message', (message) => {
                const data = JSON.parse(message.toString());
                if (data.type === 'subscribe' && data.artistName) {
                    this.subscribeToArtist(data.artistName, ws);
                }
            });

            ws.on('close', () => {
                this.removeWebSocketClient(ws);
            });
        });
    }

    private subscribeToArtist(artistName: string, ws: WebSocket) {
        if (!this.websocketClients.has(artistName)) {
            this.websocketClients.set(artistName, []);
            this.startArtistPolling(artistName);
        }
        this.websocketClients.get(artistName)?.push(ws);
    }

    private removeWebSocketClient(ws: WebSocket) {
        this.websocketClients.forEach((clients, artistName) => {
            const index = clients.indexOf(ws);
            if (index > -1) {
                clients.splice(index, 1);
                if (clients.length === 0) {
                    this.websocketClients.delete(artistName);
                }
            }
        });
    }

    private startArtistPolling(artistName: string) {
        const pollInterval = 5 * 60 * 1000; // Poll every 5 minutes

        const poll = async () => {
            if (!this.websocketClients.has(artistName)) {
                return; // Stop polling if no subscribers
            }

            try {
                const [artist, events] = await Promise.all([
                    this.getArtist(artistName),
                    this.getArtistEvents(artistName)
                ]);

                const clients = this.websocketClients.get(artistName) || [];
                const update = { artist, events, timestamp: new Date() };

                clients.forEach(client => {
                    if (client.readyState === WebSocket.OPEN) {
                        client.send(JSON.stringify(update));
                    }
                });
            } catch (error) {
                console.error(`Error polling artist ${artistName}:`, error);
            }
        };

        poll(); // Initial poll
        setInterval(poll, pollInterval);
    }

    async getArtist(artistName: string) {
        try {
            const response = await axios.get(
                `${this.baseUrl}/artists/${encodeURIComponent(artistName)}`,
                { params: { app_id: this.apiKey } }
            );
            return response.data;
        } catch (error) {
            console.error(`Error fetching artist data for ${artistName}:`, error);
            return null;
        }
    }

    async getArtistEvents(artistName: string) {
        try {
            const response = await axios.get(
                `${this.baseUrl}/artists/${encodeURIComponent(artistName)}/events`,
                { params: { app_id: this.apiKey } }
            );
            return response.data;
        } catch (error) {
            console.error(`Error fetching events for ${artistName}:`, error);
            return [];
        }
    }
}

// Helper function to create an integration instance
export function createBandsintownIntegration(apiKey: string): BandsintownIntegration {
    return new BandsintownIntegration(apiKey);
}