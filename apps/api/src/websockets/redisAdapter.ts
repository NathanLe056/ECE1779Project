import { createClient, RedisClientType } from 'redis';
import { TournamentEvent } from './wsManager';

class RedisAdapter {
  private publisher: RedisClientType | null = null;
  private subscriber: RedisClientType | null = null;
  private messageHandler: ((channel: string, event: TournamentEvent) => void) | null = null;
  private readonly redisUrl: string | undefined;

  constructor() {
    this.redisUrl = process.env.REDIS_URL;
  }

  async connect(): Promise<void> {
    if (!this.redisUrl) {
      console.warn(
        '[Redis] REDIS_URL not set — WebSocket broadcasts limited to single pod. ' +
        'Set REDIS_URL for multi-pod Kubernetes deployments.',
      );
      return;
    }

    try {
      this.publisher = createClient({ url: this.redisUrl }) as RedisClientType;
      this.subscriber = createClient({ url: this.redisUrl }) as RedisClientType;

      this.publisher.on('error', (err) => console.error('[Redis] publisher error', err));
      this.subscriber.on('error', (err) => console.error('[Redis] subscriber error', err));

      await this.publisher.connect();
      await this.subscriber.connect();

      await (this.subscriber as any).pSubscribe(
        'tournament:*',
        (message: string, channel: string) => {
          if (!this.messageHandler) return;
          try {
            const event = JSON.parse(message) as TournamentEvent;
            this.messageHandler(channel, event);
          } catch (err) {
            console.error('[Redis] failed to parse message on channel', channel, err);
          }
        },
      );

      console.log('[Redis] pub/sub adapter connected →', this.redisUrl);
    } catch (err) {
      console.error('[Redis] connection failed — falling back to no-op adapter', err);
      this.publisher = null;
      this.subscriber = null;
    }
  }

  publish(tournamentId: string, event: TournamentEvent): void {
    if (!this.publisher) return; // no-op in single-pod mode
    const channel = `tournament:${tournamentId}`;
    this.publisher.publish(channel, JSON.stringify(event)).catch((err) => {
      console.error('[Redis] publish error on', channel, err);
    });
  }

  onMessage(handler: (channel: string, event: TournamentEvent) => void): void {
    this.messageHandler = handler;
  }

  async disconnect(): Promise<void> {
    await this.subscriber?.disconnect();
    await this.publisher?.disconnect();
  }

  get isConnected(): boolean {
    return !!(this.publisher?.isOpen && this.subscriber?.isOpen);
  }
}

export const redisAdapter = new RedisAdapter();
