import { Router } from "express";
import * as controller from "./auth.controller.js";
import { authMiddleware } from "../../middleware/auth.middleware.js";



const router = Router();

router.post("/register", controller.register);
router.post("/login", controller.login);
router.post("/logout", controller.logout); 
router.get("/me", authMiddleware, controller.me);
router.post("/refresh", controller.refresh);

export default router;
