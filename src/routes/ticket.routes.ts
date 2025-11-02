import { Router } from "express";
import { TicketController } from "@/controllers/ticket.controller";
import { customer_auth } from "@/auth/customer.auth";
import { staff_auth } from "@/auth/staff.auth";

const router = Router();
const ticket_controller = new TicketController();

// ==================== GET ROUTES ====================

// Rutas autenticadas para usuarios
router.get("/my-tickets", customer_auth, ticket_controller.get_my_tickets);

router.get("/my-last-ticket", customer_auth, ticket_controller.get_my_last_ticket_by_user_id);

router.get("/:id", customer_auth, ticket_controller.get_ticket_by_id);

// Rutas admin
router.get("/", staff_auth, ticket_controller.get_all_tickets);
router.get("/user/:user_id", staff_auth, ticket_controller.get_tickets_by_user);
router.get("/game/:game_id", staff_auth, ticket_controller.get_tickets_by_game);
router.get("/curva/:curva_id", staff_auth, ticket_controller.get_tickets_by_curva);

// ==================== POST ROUTES ====================

// Rutas autenticadas para usuarios
router.post("/", customer_auth, ticket_controller.create_ticket);

// Rutas admin
router.post("/admin", staff_auth, ticket_controller.create_ticket_admin);

// ==================== PUT ROUTES ====================

// Rutas admin
router.put("/:id/status", staff_auth, ticket_controller.change_ticket_status);


// ==================== DELETE ROUTES ====================

// Rutas autenticadas para usuarios
  

export { router as ticketRoutes };

