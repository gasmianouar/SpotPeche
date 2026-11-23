/** Le strict nécessaire des types Cloudflare Workers (évite une dépendance de plus). */
interface CacheStorage {
  /** Cache partagé du centre de données Cloudflare. */
  readonly default: Cache;
}

interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
}
