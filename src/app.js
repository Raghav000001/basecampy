import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"

const app = express()


// basic middlewares
app.use(express.json({limit:"16kb"}))
app.use(express.urlencoded({limit:"16kb",extended:true}))
app.use(express.static("public"))
app.use(cookieParser())

// cors middleware
app.use(cors({
     origin:process.env.CORS_ORIGN,
     credentials:true,
     methods:["GET","POST","PUT","DELETE","PATCH"],
     allowedHeaders:["Content-Type","Authorization"]
}))

// import routes
 import { healthRouter } from "./routes/healthCheck.route.js"
 import authRouter from "./routes/auth.routes.js"



//  use routes
 app.use("/api/v1/healthcheck",healthRouter)
 app.use("/api/auth/v1/",authRouter)



export default app;