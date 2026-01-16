import { Redis } from 'ioredis';
import { env } from './utils/env';

// env.REDIS_URL is guaranteed to be defined (has default) via utils/env

console.log(`[Redis] Connecting to: ${env.REDIS_URL.replace(/:[^@]+@/, ':****@')}`); 

export const redisConnection = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: null, // Required by BullMQ
  family: 0, // Auto-detect IP family
  // Upstash requires TLS. If the URL starts with 'rediss://', ioredis handles it.
  // We also force TLS if the host is upstash.io, because they require it even if protocol says redis://
  tls: (env.REDIS_URL.startsWith('rediss://') || env.REDIS_URL.includes('upstash.io')) ? {
    rejectUnauthorized: false 
  } : undefined
});

redisConnection.on('error', (err) => console.error('[Redis] Error:', err));
redisConnection.on('connect', () => console.log('[Redis] Connected successfully!'));
