import { Router } from "express";
import { GamesController } from "@/controllers/games.controller";
import { staff_auth } from "@/auth/staff.auth";

const router = Router();
const games_controller = new GamesController();

// ==================== GET ROUTES ====================

// Rutas públicas
router.get("/", games_controller.get_all_games);

router.get("/search/date", games_controller.get_game_by_date);

router.get("/:id", games_controller.get_game_by_id);
router.get("/tournament/:tournament", games_controller.get_game_by_tournament);
router.get("/:game_id/curva/:curva_id", games_controller.get_curva_by_id);

// ==================== POST ROUTES ====================

// Rutas admin
router.post("/", staff_auth, games_controller.create_game);
router.post("/:game_id/curva", staff_auth, games_controller.open_new_curva);

// ==================== PUT ROUTES ====================

// Rutas admin
router.put("/:game_id/score", staff_auth, games_controller.update_game_score);
router.put("/:game_id/curva/:curva_id", staff_auth, games_controller.update_curva_results);
router.put("/:game_id/curva/:curva_id/close", staff_auth, games_controller.close_curva);
router.put("/:game_id/end", staff_auth, games_controller.end_game);

export { router as gamesRoutes };

