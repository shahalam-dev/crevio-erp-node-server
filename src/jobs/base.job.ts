export interface Job<T = any> {
  name: string;
  data: T;
  options?: {
    delay?: number;
    attempts?: number;
    backoff?: {
      type: 'fixed' | 'exponential';
      delay: number;
    };
  };
}

export abstract class BaseJob<T = any> {
  abstract name: string;
  abstract handle(data: T): Promise<void>;

  async execute(data: T): Promise<void> {
    try {
      console.log(`📦 Executing job: ${this.name}`);
      await this.handle(data);
      console.log(`✅ Job completed: ${this.name}`);
    } catch (error) {
      console.error(`❌ Job failed: ${this.name}`, error);
      throw error;
    }
  }
}
