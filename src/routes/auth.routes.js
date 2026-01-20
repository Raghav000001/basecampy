import e from "express";
import { registerUser } from "../controllers/auth.controllers.js";

const router = e.Router()

router.route("/register").post( registerUser)


export default router