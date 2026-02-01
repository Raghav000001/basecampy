import User from "../models/user.modal.js"
import {ApiError} from "../utils/api_error.js"
import jwt from "jsonwebtoken"


  export const verifyJWT = async (req,res,next)=> {
       const token = req.cookies?.AccessToken || req.header("Authorization")?.replace("Bearer ","")
       if(!token) return res.status(401).json(new ApiError(401,{},"Unauthorized request"))
        try {
            const decodedToken = jwt.verify(token,process.env.ACCESS_TOKEN_SECRET)
            if(!decodedToken) return res.status(401).json(new ApiError(401,{},"Unauthorized request"))
            const user = await User.findById(decodedToken._id).select("-password -forgotPasswordToken -forgotPasswordTokenExpire")
            if(!user) return res.status(401).json(new ApiError(401,{},"Unauthorized request"))
            req.user = user
            next()     
        } catch (error) {
            console.log(error,"error in auth middleware");
            return res.status(401).json(new ApiError(401,{},"Invalid Access Token"))
        }
  } 
  