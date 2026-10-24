import { db } from './db.js';

export interface WebhookPayload {
  event: 'clip.generated' | 'clip.approved' | 'clip.scheduled' | 'video.published' | 'pipeline.completed';
  timestamp: string;
  data: any;
}

export class WebhookService {
  /**
   * Dispatches a webhook payload to the user-configured automation endpoint
   */
  public async dispatch(event: WebhookPayload['event'], data: any): Promise<boolean> {
    const settings = db.getSettings();
    if (!settings.webhookEnabled || !settings.webhookUrl || settings.webhookUrl.trim() === '') {
      return false;
    }

    const payload: WebhookPayload = {
      event,
      timestamp: new Date().toISOString(),
      data
    };

    try {
      console.log(`[Webhook] Dispatching event "${event}" to ${settings.webhookUrl}...`);
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'User-Agent': 'ClipGenius-AI-Webhook/1.0'
      };

      if (settings.webhookSecret && settings.webhookSecret.trim() !== '') {
        headers['X-ClipGenius-Secret'] = settings.webhookSecret.trim();
      }

      const response = await fetch(settings.webhookUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });

      console.log(`[Webhook] Dispatched "${event}" - Response status ${response.status}`);
      return response.ok;
    } catch (err: any) {
      console.warn(`[Webhook] Failed to dispatch event "${event}":`, err.message);
      return false;
    }
  }
}

export const webhookService = new WebhookService();
