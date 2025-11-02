import dotenv from 'dotenv'
dotenv.config()

export const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://localhost:4000',
  'http://localhost:8080',
  'https://tu-gol-de-suerte-react-app-j2bq.vercel.app',
  'https://tu-gol-de-suerte-react-app.vercel.app',
  'https://www.tugoldesuerte.com',
  'https://tugoldesuerte.com',
  'https://api.tugoldesuerte.com', // Para webhooks de Wompi
]
export const ALLOWED_METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']

export const GLOBAL_ENV = {
  MONGODB_URI: process.env.MONGODB_URI as string,

  PORT: process.env.PORT as string,

  CLOUD_NAME: process.env.CLOUD_NAME as string,
  API_KEY_CLOUDINARY: process.env.API_KEY_CLOUDINARY as string,
  API_SECRET_CLOUDINARY: process.env.API_SECRET_CLOUDINARY as string,

  JWT_SECTRET: process.env.JWT_SECTRET as string,
  RESEND_API_KEY: process.env.RESEND_API_KEY as string,

  FRONT_DOMAIN: process.env.FRONT_DOMAIN as string,

  // Variables de Wompi
  WOMPI_PUBLIC_KEY: process.env.WOMPI_PUBLIC_KEY as string,
  WOMPI_PRIVATE_KEY: process.env.WOMPI_PRIVATE_KEY as string,
  WOMPI_EVENTS_SECRET: process.env.WOMPI_EVENTS_SECRET as string,
  WOMPI_INTEGRITY_SECRET: process.env.WOMPI_INTEGRITY_SECRET as string,
  WOMPI_BASE_URL: process.env.WOMPI_BASE_URL as string,
  FRONTEND_URL: process.env.FRONTEND_URL as string,
  BACKEND_URL: process.env.BACKEND_URL as string,

  REDIS_HOST: process.env.REDIS_HOST as string,
  REDIS_PORT: process.env.REDIS_PORT as string,
  REDIS_PASSWORD: process.env.REDIS_PASSWORD as string,
}

export const DEFAULT_PROFILE_AVATAR = {
  url: 'https://res.cloudinary.com/dym9kg3vx/image/upload/v1725175200/default_profile_avatar.png',
  public_id: '',
}
