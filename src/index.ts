/**
 * Domain Renewal Reminder Service
 * Main entry point for Cloudflare Workers
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import authRoutes from './routes/auth';
import domainRoutes from './routes/domains';
import adminRoutes from './routes/admin';

// Environment bindings interface
export interface Env {
  DB: D1Database;
  KV: KVNamespace;
  ADMIN_PASSWORD: string;
  ENCRYPTION_KEY: string;
}

// Initialize Hono app
const app = new Hono();

// Enable CORS
app.use('*', cors());

// Health check endpoint
app.get('/', (c) => {
  return c.json({
    success: true,
    message: 'Domain Renewal Reminder Service',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/health', (c) => {
  return c.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
  });
});

// Mount routes
app.route('/api/auth', authRoutes);
app.route('/api/domains', domainRoutes);
app.route('/api/admin', adminRoutes);

// Scheduled event handler for cron triggers
export default {
  fetch: app.fetch,
  
  async scheduled(
    event: ScheduledEvent,
    env: Env,
    _ctx: ExecutionContext
  ): Promise<void> {
    console.log('Cron trigger fired at:', new Date(event.scheduledTime).toISOString());
    
    try {
      const { ReminderService } = await import('./services/reminder');
      const reminderService = new ReminderService(env.DB, env.KV, env.ENCRYPTION_KEY);
      
      const result = await reminderService.checkReminders();
      
      if (result.success) {
        console.log('Reminder check completed:', result.message);
      } else {
        console.error('Reminder check failed:', result.error);
      }
    } catch (error) {
      console.error('Cron handler error:', error);
    }
  },
};
