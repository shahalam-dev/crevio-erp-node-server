import type { TelegramProvider, TelegramUpdate } from './providers/telegram.provider';

export class TelegramPollingService {
  private running = false;
  private offset = 0;
  private timeoutId: NodeJS.Timeout | undefined = undefined;

  constructor(
    private provider: TelegramProvider,
    private onUpdate: (update: TelegramUpdate) => Promise<void>
  ) {}

  start(): void {
    this.running = true;
    void this.poll();
  }

  stop(): void {
    this.running = false;
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = undefined;
    }
  }

  private async poll(): Promise<void> {
    if (!this.running) {
      return;
    }

    try {
      const updates = await this.provider.getUpdates(this.offset, 100);
      for (const update of updates) {
        this.offset = update.update_id + 1;
        await this.onUpdate(update);
      }
    } catch (error) {
      console.error('Telegram polling error:', error);
    }

    this.timeoutId = setTimeout(() => {
      void this.poll();
    }, 1000);
  }
}
