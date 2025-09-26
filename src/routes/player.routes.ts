import { Router } from "express";
import { PlayerController } from "@/controllers/player.controller";
import { staff_auth } from "@/auth/staff.auth";

const router = Router();
const player_controller = new PlayerController();

// ==================== GET ROUTES ====================

// Rutas públicas
router.get("/", player_controller.get_all_players);
router.get("/search", player_controller.search_players);
router.get("/team/:team_id", player_controller.get_players_by_team);
router.get("/:id", player_controller.get_player_by_id);

// ==================== POST ROUTES ====================

// Rutas admin
router.post("/", staff_auth, player_controller.create_player);

// ==================== PUT ROUTES ====================

// Rutas admin
router.put("/:id", staff_auth, player_controller.update_player);

// ==================== DELETE ROUTES ====================

// Rutas admin
router.delete("/:id", staff_auth, player_controller.delete_player);
router.delete("/team/:team_id", staff_auth, player_controller.delete_players_by_team);

export { router as playerRoutes };
