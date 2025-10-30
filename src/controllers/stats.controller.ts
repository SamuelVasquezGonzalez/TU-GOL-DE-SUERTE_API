import { Request, Response } from 'express'
import { StatsService } from '@/services/stats.service'
import { ResponseError } from '@/utils/errors.util'
import { RequestUser } from '@/contracts/types/global.type'

export class StatsController {
  private stats_service = new StatsService()

  /**
   * Obtener estadísticas del usuario autenticado
   */
  public getUserStats = async (req: Request, res: Response) => {
    try {
      const user = (req as RequestUser).user
      if (!user) {
        throw new ResponseError(401, 'Usuario no autenticado')
      }

      const stats = await this.stats_service.getUserStats(user._id)

      res.status(200).json({
        success: true,
        message: 'Estadísticas del usuario obtenidas exitosamente',
        data: stats,
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
          message: 'Error al obtener estadísticas del usuario',
        })
      }
    }
  }

  /**
   * Obtener estadísticas de un usuario específico (admin/staff)
   */
  public getUserStatsById = async (req: Request, res: Response) => {
    try {
      const { user_id } = req.params

      const stats = await this.stats_service.getUserStats(user_id)

      res.status(200).json({
        success: true,
        message: 'Estadísticas del usuario obtenidas exitosamente',
        data: stats,
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
          message: 'Error al obtener estadísticas del usuario',
        })
      }
    }
  }

  /**
   * Obtener estadísticas del staff en sesión
   */
  public getStaffStats = async (req: Request, res: Response) => {
    try {
      const user = (req as RequestUser).user
      if (!user) {
        throw new ResponseError(401, 'Usuario no autenticado')
      }

      const stats = await this.stats_service.getStaffStats(user._id)

      res.status(200).json({
        success: true,
        message: 'Estadísticas del staff obtenidas exitosamente',
        data: stats,
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
          message: 'Error al obtener estadísticas del staff',
        })
      }
    }
  }

  /**
   * Obtener estadísticas de un staff específico (admin)
   */
  public getStaffStatsById = async (req: Request, res: Response) => {
    try {
      const { staff_id } = req.params

      const stats = await this.stats_service.getStaffStats(staff_id)

      res.status(200).json({
        success: true,
        message: 'Estadísticas del staff obtenidas exitosamente',
        data: stats,
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
          message: 'Error al obtener estadísticas del staff',
        })
      }
    }
  }

  /**
   * Obtener estadísticas generales del sistema (admin/staff)
   */
  public getGeneralStats = async (req: Request, res: Response) => {
    try {
      const stats = await this.stats_service.getGeneralStats()

      res.status(200).json({
        success: true,
        message: 'Estadísticas generales obtenidas exitosamente',
        data: stats,
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
          message: 'Error al obtener estadísticas generales',
        })
      }
    }
  }
}

