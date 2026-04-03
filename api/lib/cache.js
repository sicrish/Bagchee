/**
 * Simple in-memory TTL cache.
 * Usage:
 *   const result = await cache.get('key', ttlMs, () => expensiveQuery());
 *   cache.invalidate('key');        // single key
 *   cache.invalidatePrefix('filter'); // all keys starting with prefix
 */

const store = new Map();

export const cache = {
    async get(key, ttlMs, fetcher) {
        const entry = store.get(key);
        if (entry && Date.now() < entry.expiresAt) {
            return entry.data;
        }
        const data = await fetcher();
        store.set(key, { data, expiresAt: Date.now() + ttlMs });
        return data;
    },

    invalidate(key) {
        store.delete(key);
    },

    invalidatePrefix(prefix) {
        for (const key of store.keys()) {
            if (key.startsWith(prefix)) store.delete(key);
        }
    },
};
