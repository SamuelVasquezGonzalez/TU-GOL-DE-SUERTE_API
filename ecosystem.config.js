/**
 * Configuración de PM2
 * Uso: pm2 start ecosystem.config.js
 * 
 * IMPORTANTE: En Windows, usar modo 'fork' en vez de 'cluster'
 * 'cluster' mode causa problemas en Windows (múltiples ventanas PowerShell)
 */
module.exports = {
  apps: [
    {
      name: 'tu-gol-de-suerte-api',
      script: './dist/index.js',
      // Modo 'fork' para Windows (más estable)
      // En Linux/Mac producción, puedes usar 'cluster' con múltiples instancias
      instances: 1,
      exec_mode: 'fork', // Cambiar a 'cluster' solo en Linux/Mac producción
      env: {
        NODE_ENV: 'production',
        PORT: process.env.PORT || '3001',
      },
      env_development: {
        NODE_ENV: 'development',
        PORT: process.env.PORT || '3001',
      },
      // Opciones de reinicio automático
      watch: false, // No observar cambios en producción
      max_memory_restart: '1G', // Reiniciar si supera 1GB de RAM
      // Logs
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      // Auto-reinicio
      autorestart: true,
      // Estrategia de reinicio
      restart_delay: 4000,
      max_restarts: 10,
      min_uptime: '10s',
    },
  ],
}

