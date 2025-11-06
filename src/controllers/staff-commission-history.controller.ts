import { Request, Response } from 'express'
import { StaffCommissionHistoryService } from '@/services/staff-commission-history.service'
import { ResponseError } from '@/utils/errors.util'
import { RequestUser } from '@/contracts/types/global.type'

export class StaffCommissionHistoryController {
  private commission_service = new StaffCommissionHistoryService()

  /**
   * Obtener todas las comisiones del staff autenticado
   */
  public get_my_commissions = async (req: Request, res: Response) => {
    try {
      const user = (req as RequestUser).user
      if (!user) {
        throw new ResponseError(401, 'Usuario no autenticado')
      }

      const result = await this.commission_service.get_staff_commissions({
        staff_id: user._id,
      })

      res.status(200).json({
        success: true,
        message: 'Comisiones del staff obtenidas exitosamente',
        data: result,
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
          message: 'Error al obtener las comisiones del staff',
        })
      }
    }
  }

  /**
   * Obtener comisión del staff autenticado por partido específico
   */
  public get_my_commission_by_game = async (req: Request, res: Response) => {
    try {
      const user = (req as RequestUser).user
      if (!user) {
        throw new ResponseError(401, 'Usuario no autenticado')
      }

      const { game_id } = req.params

      if (!game_id) {
        throw new ResponseError(400, 'El ID del partido es requerido')
      }

      const commission = await this.commission_service.get_staff_commission_by_game({
        staff_id: user._id,
        game_id: game_id,
      })

      res.status(200).json({
        success: true,
        message: 'Comisión del staff por partido obtenida exitosamente',
        data: commission,
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
          message: 'Error al obtener la comisión del staff por partido',
        })
      }
    }
  }

  /**
   * Obtener todas las comisiones de todos los staff (admin)
   */
  public get_all_commissions = async (req: Request, res: Response) => {
    try {
      const { game_id } = req.query

      const result = await this.commission_service.get_all_commissions({
        game_id: game_id as string | undefined,
      })

      res.status(200).json({
        success: true,
        message: 'Todas las comisiones obtenidas exitosamente',
        data: result,
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
          message: 'Error al obtener todas las comisiones',
        })
      }
    }
  }

  /**
   * Obtener comisiones agrupadas por partido (admin)
   */
  public get_commissions_by_game = async (req: Request, res: Response) => {
    try {
      const { game_id } = req.params

      if (!game_id) {
        throw new ResponseError(400, 'El ID del partido es requerido')
      }

      const result = await this.commission_service.get_commissions_by_game({
        game_id: game_id,
      })

      res.status(200).json({
        success: true,
        message: 'Comisiones por partido obtenidas exitosamente',
        data: result,
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
          message: 'Error al obtener las comisiones por partido',
        })
      }
    }
  }

  /**
   * Obtener comisiones de un staff específico (admin)
   */
  public get_staff_commissions_by_id = async (req: Request, res: Response) => {
    try {
      const { staff_id } = req.params

      if (!staff_id) {
        throw new ResponseError(400, 'El ID del staff es requerido')
      }

      const result = await this.commission_service.get_staff_commissions({
        staff_id: staff_id,
      })

      res.status(200).json({
        success: true,
        message: 'Comisiones del staff obtenidas exitosamente',
        data: result,
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
          message: 'Error al obtener las comisiones del staff',
        })
      }
    }
  }
}

