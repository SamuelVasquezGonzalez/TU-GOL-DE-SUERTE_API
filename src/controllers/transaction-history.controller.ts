import { Request, Response } from 'express'
import { TransactionHistoryService } from '@/services/transaction-history.service'
import { ResponseError } from '@/utils/errors.util'

export class TransactionHistoryController {
  private transaction_history_service = new TransactionHistoryService()

  /**
   * Obtener todas las transacciones del historial
   */
  public get_all_transactions = async (req: Request, res: Response) => {
    try {
      const transactions = await this.transaction_history_service.get_all_transactions()

      res.status(200).json({
        success: true,
        message: 'Historial de transacciones obtenido exitosamente',
        data: transactions,
      })
    } catch (err) {
      if (err instanceof ResponseError) {
        res.status(err.statusCode).json({
          success: false,
          message: err.message,
        })
      } else {
        res.status(500).json({
          success: false,
          message: 'Error al obtener el historial de transacciones',
        })
      }
    }
  }

  /**
   * Eliminar una transacción del historial por ID
   */
  public delete_transaction = async (req: Request, res: Response) => {
    try {
      const { id } = req.params

      if (!id) {
        throw new ResponseError(400, 'El ID de la transacción es requerido')
      }

      const result = await this.transaction_history_service.delete_transaction_by_id({ id })

      res.status(200).json({
        success: true,
        message: result.message,
      })
    } catch (err) {
      if (err instanceof ResponseError) {
        res.status(err.statusCode).json({
          success: false,
          message: err.message,
        })
      } else {
        res.status(500).json({
          success: false,
          message: 'Error al eliminar la transacción del historial',
        })
      }
    }
  }
}






