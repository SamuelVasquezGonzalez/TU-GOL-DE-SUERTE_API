import { Router } from "express";
import { UserController } from "@/controllers/user.controller";
import { admin_auth } from "@/auth/admin.auth";
import { upload_files } from "@/middlewares/upload_files";
import { staff_auth } from "@/auth/staff.auth";
import { authorize } from "@/auth/role.auth";

const router = Router();
const user_controller = new UserController();

// ==================== GET ROUTES ====================

// Rutas admin/staff
router.get("/", staff_auth, user_controller.get_all_users); // Admin/Staff
router.get("/search", staff_auth, user_controller.search_users); // Admin/Staff
router.get("/:id", staff_auth, user_controller.get_user_by_id); // Admin/Staff

// Rutas autenticadas
router.get("/profile/me", authorize("customer", "staff", "admin"), user_controller.get_user_profile);
router.get("/staff/profile/me", staff_auth, user_controller.get_user_profile);

// ==================== POST ROUTES ====================

// Registro público: SIEMPRE crea un "customer" (no acepta role del body)
router.post("/register", user_controller.create_user);

// Creación de staff/admin: solo un admin autenticado
router.post("/admin", admin_auth, user_controller.create_user_by_admin);

router.post("/login", user_controller.login_user);

router.post("/forgot-password", user_controller.forgot_password);

router.post("/verify-code", user_controller.verify_recovery_code);

// ==================== PUT ROUTES ====================

// Rutas autenticadas (cualquier usuario sobre su propio perfil)
router.put("/profile", authorize("customer", "staff", "admin"), upload_files.single("image"), user_controller.update_user_profile);
router.put("/change-password", authorize("customer", "staff", "admin"), user_controller.change_password);
router.put("/profile/image", authorize("customer", "staff", "admin"), upload_files.single("image"), user_controller.upload_profile_image);

// Completar recuperación de contraseña vía código (público, igual que forgot-password / verify-code)
router.put("/reset-password", user_controller.reset_password);

// ==================== DELETE ROUTES ====================

// Rutas admin
router.delete("/:id", admin_auth, user_controller.delete_user);
router.delete("/profile/image", authorize("customer", "staff", "admin"), user_controller.delete_profile_image);

export { router as userRoutes };
