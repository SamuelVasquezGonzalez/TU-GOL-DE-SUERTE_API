import Redis from 'ioredis'
import { GLOBAL_ENV } from '@/shared/contants'

// Cliente Redis principal para cache y operaciones generales
export const redisClient = new Redis({
  host: GLOBAL_ENV.REDIS_HOST || process.env.REDIS_HOST || 'localhost',
  port: Number(GLOBAL_ENV.REDIS_PORT || process.env.REDIS_PORT || 6379),
  password: GLOBAL_ENV.REDIS_PASSWORD || process.env.REDIS_PASSWORD || undefined,
  retryStrategy: (times: number) => {
    const delay = Math.min(times * 50, 2000)
    return delay
  },
  maxRetriesPerRequest: 3,
})

// Cliente Redis para pub/sub (Socket.io adapter)
export const redisPubClient = redisClient.duplicate()
export const redisSubClient = redisClient.duplicate()

// Manejo de errores
redisClient.on('error', (err: Error) => {
  console.error('❌ Redis Client Error:', err)
})

redisPubClient.on('error', (err: Error) => {
  console.error('❌ Redis Pub Client Error:', err)
})

redisSubClient.on('error', (err: Error) => {
  console.error('❌ Redis Sub Client Error:', err)
})

// Conectar a Redis (solo si está disponible, si no, funciona sin cache)
export async function connectRedis(): Promise<void> {
  try {
    const redisHost = GLOBAL_ENV.REDIS_HOST || process.env.REDIS_HOST || 'localhost'
    const redisPort = Number(GLOBAL_ENV.REDIS_PORT || process.env.REDIS_PORT || 6379)
    
    // Si Redis no está configurado explícitamente, no intentar conectar
    // Esto permite que la app funcione sin Redis
    if (!GLOBAL_ENV.REDIS_HOST && !process.env.REDIS_HOST && redisHost === 'localhost') {
      console.log('ℹ️ Redis no configurado, funcionando sin cache (opcional)')
      return
    }
    
    // ioredis se conecta automáticamente, solo verificamos con un ping
    // Verificar conexión con timeout
    const pingPromise = redisClient.ping()
    
    await Promise.race([
      pingPromise,
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Redis connection timeout')), 5000)
      )
    ])
    
    console.log(`✅ Connected to Redis (${redisHost}:${redisPort})`)
  } catch (error) {
    console.warn('⚠️ Redis no disponible, funcionando sin cache:', (error as Error).message)
    // No lanzamos error, la app puede funcionar sin Redis
  }
}

// Verificar si Redis está conectado
export function isRedisConnected(): boolean {
  return redisClient.status === 'ready'
}

// Helper para cache con fallback
export async function getCached<T>(key: string): Promise<T | null> {
  if (!isRedisConnected()) return null
  
  try {
    const data = await redisClient.get(key)
    if (!data) return null
    return JSON.parse(data) as T
  } catch (error) {
    console.error('Error getting cache:', error)
    return null
  }
}

export async function setCached(key: string, value: any, ttlSeconds?: number): Promise<boolean> {
  if (!isRedisConnected()) return false
  
  try {
    const data = JSON.stringify(value)
    if (ttlSeconds) {
      await redisClient.setex(key, ttlSeconds, data)
    } else {
      await redisClient.set(key, data)
    }
    return true
  } catch (error) {
    console.error('Error setting cache:', error)
    return false
  }
}

export async function deleteCached(key: string): Promise<boolean> {
  if (!isRedisConnected()) return false
  
  try {
    await redisClient.del(key)
    return true
  } catch (error) {
    console.error('Error deleting cache:', error)
    return false
  }
}

// Invalidar cache de stats de usuario
export async function invalidateUserStatsCache(user_id: string): Promise<void> {
  const cacheKey = `user_stats:${user_id}`
  await deleteCached(cacheKey)
}

// Invalidar cache de stats de staff
export async function invalidateStaffStatsCache(staff_id: string): Promise<void> {
  const cacheKey = `staff_stats:${staff_id}`
  await deleteCached(cacheKey)
}

// Invalidar cache de datos generales (juegos, torneos, equipos)
export async function invalidateGeneralDataCache(): Promise<void> {
  await deleteCached('games:all')
  await deleteCached('tournaments:all')
  await deleteCached('teams:all')
  // También invalidar todos los stats de usuarios/staff (pueden usar datos generales)
  // Nota: Invalidar todos los stats sería muy costoso, mejor dejarlos expirar naturalmente
}

