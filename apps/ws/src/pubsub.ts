// Optional Redis pub/sub layer. With REDIS_URL set, room broadcasts are
// published so other ws replicas can re-deliver to their own clients. Without
// it, the WS server runs single-node and broadcasts stay in-process.

type Listener = (roomId: string, message: string) => void;
type AllListener = (message: string) => void;

export interface PubSub {
  init(): Promise<void>;
  publish(roomId: string, message: string): void;
  publishAll(message: string): void;
  onRoomMessage(listener: Listener): void;
  onBroadcastAll(listener: AllListener): void;
  enabled(): boolean;
}

const CHANNEL_PREFIX = 'chess4nerds:game:';
const ALL_CHANNEL = 'chess4nerds:all';

class NoopPubSub implements PubSub {
  async init() {}
  publish() {}
  publishAll() {}
  onRoomMessage() {}
  onBroadcastAll() {}
  enabled() {
    return false;
  }
}

class RedisPubSub implements PubSub {
  private pub: any;
  private sub: any;
  private roomListeners: Listener[] = [];
  private allListeners: AllListener[] = [];
  private ready = false;

  constructor(private url: string) {}

  async init() {
    if (this.ready) return;
    // Wrap the module name in a template literal so esbuild can't statically
    // resolve it — keeps redis as an optional runtime dep.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { createClient } = require(`${'redis'}`);
    this.pub = createClient({ url: this.url });
    this.sub = createClient({ url: this.url });

    this.pub.on('error', (err: Error) => console.error('Redis pub error:', err.message));
    this.sub.on('error', (err: Error) => console.error('Redis sub error:', err.message));

    await Promise.all([this.pub.connect(), this.sub.connect()]);

    await this.sub.pSubscribe(`${CHANNEL_PREFIX}*`, (message: string, channel: string) => {
      const roomId = channel.slice(CHANNEL_PREFIX.length);
      for (const listener of this.roomListeners) listener(roomId, message);
    });

    await this.sub.subscribe(ALL_CHANNEL, (message: string) => {
      for (const listener of this.allListeners) listener(message);
    });

    this.ready = true;
    console.log('Redis pub/sub connected:', this.url);
  }

  publish(roomId: string, message: string) {
    if (!this.ready) return;
    this.pub.publish(`${CHANNEL_PREFIX}${roomId}`, message).catch((err: Error) => {
      console.error('Redis publish failed:', err.message);
    });
  }

  publishAll(message: string) {
    if (!this.ready) return;
    this.pub.publish(ALL_CHANNEL, message).catch((err: Error) => {
      console.error('Redis publishAll failed:', err.message);
    });
  }

  onRoomMessage(listener: Listener) {
    this.roomListeners.push(listener);
  }

  onBroadcastAll(listener: AllListener) {
    this.allListeners.push(listener);
  }

  enabled() {
    return true;
  }
}

let instance: PubSub | null = null;

export async function getPubSub(): Promise<PubSub> {
  if (instance) return instance;

  const url = process.env.REDIS_URL;
  if (!url) {
    instance = new NoopPubSub();
    return instance;
  }

  const redis = new RedisPubSub(url);
  try {
    await redis.init();
    instance = redis;
  } catch (err) {
    console.error('Redis pub/sub init failed, falling back to in-process broadcasts:', err);
    instance = new NoopPubSub();
  }
  return instance;
}
