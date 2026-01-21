import e from "express";
import { registerUser,loginUser } from "../controllers/auth.controllers.js";
import { userLoginValidator, userRegisterValidator } from "../validators/validator.js";
import { validate } from "../middleware/validator.middleware.js";

const router = e.Router()

router.route("/register").post(userRegisterValidator(),validate,registerUser)
router.route("/login").post(userLoginValidator(),validate,loginUser)




export default router