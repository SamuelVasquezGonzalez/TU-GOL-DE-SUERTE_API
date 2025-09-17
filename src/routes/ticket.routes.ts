import { Router } from "express";
import { TicketController } from "@/controllers/ticket.controller";
import { admin_auth } from "@/auth/admin.auth";
import { customer_auth } from "@/auth/customer.auth";

const router = Router();
const ticket_controller = new TicketController();

// ==================== GET ROUTES ====================

// Rutas autenticadas para usuarios
router.get("/my-tickets", customer_auth, ticket_controller.get_my_tickets);

router.get("/:id", customer_auth, ticket_controller.get_ticket_by_id);

// Rutas admin
router.get("/", admin_auth, ticket_controller.get_all_tickets);
router.get("/user/:user_id", admin_auth, ticket_controller.get_tickets_by_user);
router.get("/game/:game_id", admin_auth, ticket_controller.get_tickets_by_game);
router.get("/curva/:curva_id", admin_auth, ticket_controller.get_tickets_by_curva);

// ==================== POST ROUTES ====================

// Rutas autenticadas para usuarios
router.post("/", customer_auth, ticket_controller.create_ticket);

// Rutas admin
router.post("/admin", admin_auth, ticket_controller.create_ticket_admin);

// ==================== PUT ROUTES ====================

// Rutas admin
router.put("/:id/status", admin_auth, ticket_controller.change_ticket_status);

// ==================== DELETE ROUTES ====================

// Rutas autenticadas para usuarios
  

export { router as ticketRoutes };

