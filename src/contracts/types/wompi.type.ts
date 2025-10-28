// Tipos para la integración con Wompi
export type PaymentStatus = 'PENDING' | 'APPROVED' | 'DECLINED' | 'VOIDED' | 'REFUNDED'
export type PaymentMethod = 'CARD' | 'NEQUI' | 'BANCOLOMBIA_TRANSFER' | 'PSE'

export interface WompiPaymentRequest {
  amount_in_cents: number
  currency: string
  customer_email: string
  payment_method: {
    type: PaymentMethod
    installments?: number
  }
  reference: string
  customer_data?: {
    phone_number?: string
    full_name?: string
  }
  shipping_address?: {
    address_line_1: string
    city: string
    region: string
    country: string
    postal_code: string
  }
  redirect_url?: string
}

export interface WompiPaymentResponse {
  data: {
    id: string
    created_at: string
    amount_in_cents: number
    reference: string
    customer_email: string
    currency: string
    payment_method_type: string
    payment_method: {
      type: string
      extra: any
    }
    shipping_address?: any
    redirect_url?: string
    payment_source_id?: number
    payment_link_id?: string
    status: PaymentStatus
    status_message?: string
    merchant: {
      name: string
      legal_name: string
      contact_name: string
      phone_number: string
      logo_url?: string
    }
    taxes: any[]
    tip_in_cents: number
    discount_in_cents: number
    final_amount_in_cents: number
    currency_conversion?: any
  }
  meta: {
    platform_id: string
    platform_transaction_id: string
    unique_id: string
  }
}

export interface WompiTransactionResponse {
  data: {
    id: string
    created_at: string
    finalized_at?: string
    amount_in_cents: number
    reference: string
    customer_email: string
    currency: string
    payment_method_type: string
    payment_method: {
      type: string
      extra: any
    }
    status: PaymentStatus
    status_message?: string
    shipping_address?: any
    payment_source_id?: number
    payment_link_id?: string
    taxes: any[]
    tip_in_cents: number
    discount_in_cents: number
    final_amount_in_cents: number
    currency_conversion?: any
  }
  meta: {
    platform_id: string
    platform_transaction_id: string
    unique_id: string
  }
}

export interface WompiWebhookPayload {
  event: string
  data: {
    transaction: WompiTransactionResponse['data']
  }
  meta: {
    platform_id: string
    platform_transaction_id: string
    unique_id: string
  }
}
