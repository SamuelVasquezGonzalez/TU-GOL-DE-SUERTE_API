import { TicketModel } from '@/models/ticket.model'
import { SoccerGameModel } from '@/models/soccer_games.model'
import { UserModel } from '@/models/user.model'
import { TransactionHistoryModel } from '@/models/transaction-history.model'

/**
 * Script para crear índices críticos en MongoDB
 * Ejecutar una vez o cuando se necesite actualizar índices
 */
export async function createMongoDBIndexes(): Promise<void> {
  try {
    console.log('📊 Creando índices de MongoDB...')

    // Índices para Tickets (CRÍTICOS)
    await TicketModel.collection.createIndex({ user_id: 1 })
    console.log('✅ Índice: TicketModel.user_id')

    await TicketModel.collection.createIndex({ soccer_game_id: 1 })
    console.log('✅ Índice: TicketModel.soccer_game_id')

    await TicketModel.collection.createIndex({ sell_by: 1 })
    console.log('✅ Índice: TicketModel.sell_by')

    await TicketModel.collection.createIndex({ status: 1 })
    console.log('✅ Índice: TicketModel.status')

    await TicketModel.collection.createIndex({ created_date: -1 })
    console.log('✅ Índice: TicketModel.created_date (descendente)')

    await TicketModel.collection.createIndex({ payment_reference: 1 }, { unique: true, sparse: true })
    console.log('✅ Índice único: TicketModel.payment_reference')

    await TicketModel.collection.createIndex({ payment_status: 1 })
    console.log('✅ Índice: TicketModel.payment_status')

    // Índice compuesto para stats de usuario
    await TicketModel.collection.createIndex({ user_id: 1, status: 1 })
    console.log('✅ Índice compuesto: TicketModel.user_id + status')

    // Índice compuesto para stats de staff
    await TicketModel.collection.createIndex({ sell_by: 1, payment_status: 1 })
    console.log('✅ Índice compuesto: TicketModel.sell_by + payment_status')

    // Índices para SoccerGame
    await SoccerGameModel.collection.createIndex({ status: 1 })
    console.log('✅ Índice: SoccerGameModel.status')

    await SoccerGameModel.collection.createIndex({ start_date: -1 })
    console.log('✅ Índice: SoccerGameModel.start_date (descendente)')

    // Índices para TransactionHistory
    await TransactionHistoryModel.collection.createIndex({ successful_purchase: 1, payment_status: 1 })
    console.log('✅ Índice compuesto: TransactionHistory.successful_purchase + payment_status')

    await TransactionHistoryModel.collection.createIndex({ created_at: -1 })
    console.log('✅ Índice: TransactionHistory.created_at (descendente)')

    await TransactionHistoryModel.collection.createIndex({ soccer_game_id: 1 })
    console.log('✅ Índice: TransactionHistory.soccer_game_id')

    // Índices para User
    await UserModel.collection.createIndex({ email: 1 }, { unique: true })
    console.log('✅ Índice único: UserModel.email')

    await UserModel.collection.createIndex({ role: 1 })
    console.log('✅ Índice: UserModel.role')

    console.log('✅ Todos los índices creados exitosamente')
  } catch (error) {
    console.error('❌ Error creando índices:', error)
    // No lanzamos error para no bloquear el inicio de la app
    // Los índices se pueden crear manualmente después
  }
}

/**
 * Verificar índices existentes
 */
export async function checkMongoDBIndexes(): Promise<void> {
  try {
    const ticketIndexes = await TicketModel.collection.indexes()
    console.log('📊 Índices de TicketModel:', ticketIndexes.map(i => i.name))
  } catch (error) {
    console.error('Error verificando índices:', error)
  }
}

