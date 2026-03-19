// In-memory Redis replacement for local development (no Docker needed)
// Drop-in replacement with same API surface used in the codebase

class MemoryStore {
  private store = new Map<string, any>();
  private ttls = new Map<string, NodeJS.Timeout>();

  async hmset(key: string, data: Record<string, string>) {
    const existing = this.store.get(key) || {};
    this.store.set(key, { ...existing, ...data });
  }

  async hgetall(key: string): Promise<Record<string, string>> {
    return this.store.get(key) || {};
  }

  async expire(key: string, seconds: number) {
    if (this.ttls.has(key)) clearTimeout(this.ttls.get(key)!);
    this.ttls.set(
      key,
      setTimeout(() => {
        this.store.delete(key);
        this.ttls.delete(key);
      }, seconds * 1000)
    );
  }

  async zadd(key: string, score: number, member: string) {
    const set: Map<string, number> = this.store.get(key) || new Map();
    set.set(member, score);
    this.store.set(key, set);
  }

  async zrem(key: string, member: string) {
    const set: Map<string, number> = this.store.get(key);
    if (set) set.delete(member);
  }

  on(_event: string, _cb: (...args: any[]) => void) {
    // no-op for compatibility
  }
}

export const redis = new MemoryStore();
export const redisPub = new MemoryStore();
export const redisSub = new MemoryStore();

console.log("Using in-memory store (no Redis required)");
