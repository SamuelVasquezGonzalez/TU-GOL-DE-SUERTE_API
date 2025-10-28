// Configuración de Wompi

// Configuración de Wompi
export const WOMPI_CONFIG = {
  // Configuración de entorno
  IS_PRODUCTION: process.env.NODE_ENV === 'production',

  // Llaves de API
  PUBLIC_KEY: process.env.WOMPI_PUBLIC_KEY || 'pub_test_IN9ihFSDyUzOnn4kTtBCeri0KM5qzbs7',
  PRIVATE_KEY: process.env.WOMPI_PRIVATE_KEY || 'prv_test_DffjCAQ1xDEGjmiA4UhtaRHm3rB7elns',

  // Secretos para integración técnica
  EVENTS_SECRET: process.env.WOMPI_EVENTS_SECRET || 'test_events_EyaHOhcAQxsdmacyhOO77zakYr8wnM6t',
  INTEGRITY_SECRET:
    process.env.WOMPI_INTEGRITY_SECRET || 'test_integrity_47RWZVz1jlyqjExacxFzLOiavAOzJdo3',

  // URLs de la API
  BASE_URL: process.env.WOMPI_BASE_URL || 'https://sandbox.wompi.co/v1',

  // Configuración del comercio
  MERCHANT_NAME: 'Tu Gol de Suerte',
  MERCHANT_EMAIL: 'contacto@tugoldesuerte.com',
  MERCHANT_PHONE: '+573001234567',

  // Configuración de pagos
  CURRENCY: 'COP',
  COUNTRY: 'CO',

  // URLs de retorno
  SUCCESS_URL: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/customer/payment/success`,
  CANCEL_URL: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/customer/payment/cancel`,
  PENDING_URL: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/customer/payment/pending`,

  // Configuración de webhooks
  WEBHOOK_URL: `${process.env.BACKEND_URL || 'http://localhost:3000'}/api/webhooks/wompi`,
} as const

// Estados de pago
export const PAYMENT_STATUS = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  DECLINED: 'DECLINED',
  VOIDED: 'VOIDED',
  REFUNDED: 'REFUNDED',
} as const

// Eventos de webhook
export const WEBHOOK_EVENTS = {
  'transaction.updated': 'Estado de transacción actualizado',
  'transaction.created': 'Nueva transacción creada',
  'payment.created': 'Nuevo pago creado',
  'payment.updated': 'Estado de pago actualizado',
} as const
