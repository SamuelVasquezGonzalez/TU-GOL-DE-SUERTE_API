import { Router } from "express";
import { UserController } from "@/controllers/user.controller";
import { admin_auth } from "@/auth/admin.auth";
import { customer_auth } from "@/auth/customer.auth";
import { upload_files } from "@/middlewares/upload_files";

const router = Router();
const user_controller = new UserController();

// ==================== GET ROUTES ====================

// Rutas públicas
router.get("/", user_controller.get_all_users); // Admin solo
router.get("/search", user_controller.search_users); // Admin solo
router.get("/:id", user_controller.get_user_by_id); // Admin solo

// Rutas autenticadas
router.get("/profile/me", customer_auth, user_controller.get_user_profile);

// ==================== POST ROUTES ====================

// Rutas públicas
router.post("/register", user_controller.create_user);

router.post("/login", user_controller.login_user);

router.post("/forgot-password", user_controller.forgot_password);

router.post("/verify-code", user_controller.verify_recovery_code);

// ==================== PUT ROUTES ====================

// Rutas autenticadas
router.put("/profile", customer_auth, upload_files.single("image"), user_controller.update_user_profile);
router.put("/change-password", customer_auth, user_controller.change_password);
router.put("/reset-password", user_controller.reset_password);
router.put("/profile/image", customer_auth, upload_files.single("image"), user_controller.upload_profile_image);

// ==================== DELETE ROUTES ====================

// Rutas admin
router.delete("/:id", admin_auth, user_controller.delete_user);
router.delete("/profile/image", customer_auth, user_controller.delete_profile_image);

export { router as userRoutes };

