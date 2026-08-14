import { Injectable, Logger } from '@nestjs/common';
import * as https from 'https';
import * as http from 'http';

export type WebhookEvent =
  | 'tenant.created'
  | 'tenant.locked'
  | 'tenant.unlocked'
  | 'tenant.deleted'
  | 'device.locked'
  | 'device.unlocked';

export interface WebhookPayload {
  event: WebhookEvent;
  timestamp: string;
  data: Record<string, unknown>;
}

export interface WebhookTarget {
  url: string;
  apiKey: string;
}

@Injectable()
export class WebhookDispatcherService {
  private readonly logger = new Logger(WebhookDispatcherService.name);
  private readonly defaultTimeout = 5000;

  /**
   * Dispatch event ke ERP tenant via HTTP POST.
   * Fire-and-forget — tidak throw error supaya tidak ganggu flow utama.
   *
   * @param target  - URL dan API key milik tenant (dari DB)
   * @param event   - Nama event
   * @param data    - Payload data
   */
  async dispatch(
    target: WebhookTarget,
    event: WebhookEvent,
    data: Record<string, unknown>,
  ): Promise<void> {
    if (!target.url) {
      this.logger.debug(
        `[Webhook] erpWebhookUrl not set for this tenant, skipping event "${event}"`,
      );
      return;
    }

    if (!target.apiKey) {
      this.logger.warn(
        `[Webhook] erpWebhookKey not set for this tenant, skipping event "${event}"`,
      );
      return;
    }

    const payload: WebhookPayload = {
      event,
      timestamp: new Date().toISOString(),
      data,
    };

    try {
      await this.sendRequest(target, payload);
      this.logger.log(
        `[Webhook] ✅ Event "${event}" dispatched to ${target.url}`,
      );
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.warn(
        `[Webhook] ⚠️  Failed to dispatch event "${event}" to ${target.url}: ${msg}`,
      );
    }
  }

  private sendRequest(
    target: WebhookTarget,
    payload: WebhookPayload,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const body = JSON.stringify(payload);
      const url = new URL(target.url);
      const isHttps = url.protocol === 'https:';
      const transport = isHttps ? https : http;

      const options = {
        hostname: url.hostname,
        port: url.port || (isHttps ? 443 : 80),
        path: url.pathname + url.search,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
          'X-Api-Key': target.apiKey,
          'X-Source': 'agilix-console',
        },
        timeout: this.defaultTimeout,
      };

      const req = transport.request(options, (res) => {
        res.resume();
        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
          resolve();
        } else {
          reject(
            new Error(`ERP returned HTTP ${res.statusCode ?? 'unknown'}`),
          );
        }
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new Error(`Request timed out after ${this.defaultTimeout}ms`));
      });

      req.on('error', (err) => reject(err));

      req.write(body);
      req.end();
    });
  }
}
