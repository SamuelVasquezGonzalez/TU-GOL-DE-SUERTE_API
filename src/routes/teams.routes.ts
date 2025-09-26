import { Router } from "express";
import { TeamsController } from "@/controllers/teams.controller";
import { upload_files } from "@/middlewares/upload_files";
import { staff_auth } from "@/auth/staff.auth";

const router = Router();
const teams_controller = new TeamsController();

// ==================== GET ROUTES ====================

// Rutas públicas
router.get("/", teams_controller.get_all_teams);
router.get("/search", teams_controller.search_teams);
router.get("/:id", teams_controller.get_team_by_id);

// ==================== POST ROUTES ====================

// Rutas admin
router.post("/", staff_auth, upload_files.single("image"), teams_controller.create_team);

// ==================== PUT ROUTES ====================

// Rutas admin
router.put("/:id", staff_auth, upload_files.single("image"), teams_controller.update_team);

// ==================== DELETE ROUTES ====================

// Rutas admin
router.delete("/:id", staff_auth, teams_controller.delete_team);

export { router as teamsRoutes };

