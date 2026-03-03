export interface CacheOptions {
    EX?: number; // Expire time in seconds
    PX?: number; // Expire time in milliseconds
    NX?: boolean; // Only set if key does not exist
    XX?: boolean; // Only set if key already exists
    KEEPTTL?: boolean; // Retain the time to live associated with the key
}

export interface CacheClient {
    get(key: string): Promise<string | null>;
    set(key: string, value: string, options?: CacheOptions): Promise<string | null>;
    del(key: string | string[]): Promise<number>;
    // Add more methods as needed, e.g., for hashes, lists, etc.
}