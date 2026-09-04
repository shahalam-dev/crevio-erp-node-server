import { BaseEventEmitter } from './base.event';

interface UserCreatedData {
  userId: string;
  email: string;
  name: string;
}

export class UserEventEmitter extends BaseEventEmitter {
  async emitUserCreated(data: UserCreatedData): Promise<void> {
    await this.emit({
      name: 'user.created',
      data,
      timestamp: new Date(),
    });
  }
}

// Create singleton instance
export const userEvents = new UserEventEmitter();
