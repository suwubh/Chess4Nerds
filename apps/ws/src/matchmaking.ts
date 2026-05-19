import { User } from './types';
import { db } from './db';

interface QueueEntry {
  user: User;
  rating: number;
  joinedAt: number;
}

const INITIAL_BAND = 100;
const BAND_EXPANSION_PER_SECOND = 25;
const MAX_BAND = 600;

export class Matchmaker {
  private queue: QueueEntry[] = [];

  async enqueue(user: User): Promise<{ opponent: User } | { waiting: true }> {
    const rating = await this.getRating(user.userId);

    const now = Date.now();
    for (let i = 0; i < this.queue.length; i++) {
      const candidate = this.queue[i];
      if (candidate.user.userId === user.userId) continue;

      const band = this.bandFor(candidate.joinedAt, now);
      if (Math.abs(candidate.rating - rating) <= band) {
        this.queue.splice(i, 1);
        return { opponent: candidate.user };
      }
    }

    this.queue.push({ user, rating, joinedAt: now });
    return { waiting: true };
  }

  remove(userId: string) {
    this.queue = this.queue.filter((e) => e.user.userId !== userId);
  }

  size() {
    return this.queue.length;
  }

  private bandFor(joinedAt: number, now: number): number {
    const waitedSeconds = Math.max(0, (now - joinedAt) / 1000);
    return Math.min(MAX_BAND, INITIAL_BAND + waitedSeconds * BAND_EXPANSION_PER_SECOND);
  }

  private async getRating(userId: string): Promise<number> {
    try {
      const rating = await db.playerRating.findUnique({ where: { userId } });
      if (rating?.currentRating != null) return rating.currentRating;

      const user = await db.user.findUnique({ where: { id: userId } });
      return user?.rating ?? 1200;
    } catch {
      return 1200;
    }
  }
}
