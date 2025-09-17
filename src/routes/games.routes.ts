import { Router } from "express";
import { GamesController } from "@/controllers/games.controller";
import { admin_auth } from "@/auth/admin.auth";

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
router.post("/", admin_auth, games_controller.create_game);
router.post("/:game_id/curva", admin_auth, games_controller.open_new_curva);

// ==================== PUT ROUTES ====================

// Rutas admin
router.put("/:game_id/score", admin_auth, games_controller.update_game_score);
router.put("/:game_id/curva/:curva_id", admin_auth, games_controller.update_curva_results);
router.put("/:game_id/curva/:curva_id/close", admin_auth, games_controller.close_curva);
router.put("/:game_id/end", admin_auth, games_controller.end_game);

export { router as gamesRoutes };

