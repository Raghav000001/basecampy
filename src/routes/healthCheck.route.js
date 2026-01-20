import e from "express";
import { healthCheck } from "../controllers/healthCheck.controller.js";


 const healthRouter = e.Router()

 healthRouter.route("/").get(healthCheck)


 export {healthRouter}