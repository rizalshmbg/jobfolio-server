import { Router } from "express";

import { registerController } from "../controllers/auth.controller.js";
import { validate } from "../middlewares/validate.middleware.js";
import { registerSchema } from "../validations/auth.validations.js";

const router = Router();

router.post("/register", validate(registerSchema), registerController);

export default router;