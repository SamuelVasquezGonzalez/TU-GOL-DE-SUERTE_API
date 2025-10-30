import { TransactionHistoryModel } from '@/models/transaction-history.model'
import { ResponseError } from '@/utils/errors.util'

export class TransactionHistoryService {
  /**
   * Obtener todas las transacciones del historial
   */
  public async get_all_transactions() {
    try {
      const transactions = await TransactionHistoryModel.find()
        .sort({ created_at: -1 }) // Ordenar por fecha de creación descendente (más recientes primero)
        .lean()

      return transactions || []
    } catch (err) {
      if (err instanceof ResponseError) throw err
      throw new ResponseError(500, 'Error al obtener el historial de transacciones')
    }
  }

  /**
   * Eliminar una transacción del historial por ID
   */
  public async delete_transaction_by_id({ id }: { id: string }) {
    try {
      const transaction = await TransactionHistoryModel.findById(id)

      if (!transaction) {
        throw new ResponseError(404, 'No se encontró la transacción en el historial')
      }

      await TransactionHistoryModel.findByIdAndDelete(id)

      return { message: 'Transacción eliminada exitosamente del historial' }
    } catch (err) {
      if (err instanceof ResponseError) throw err
      throw new ResponseError(500, 'Error al eliminar la transacción del historial')
    }
  }
}


