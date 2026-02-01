import { validationResult } from "express-validator";
import {ApiError} from "../utils/api_error.js"


   const validate = (req,res,next)=> {
          const errors = validationResult(req)
          if (errors.isEmpty()) {
              return next()
          }  
          const extractedErrors = []
        errors.array().map(err=> extractedErrors.push({
             [err.path]:err.msg
        }))

        return next(new ApiError(422,extractedErrors,"received data is not valid")) 

   }

   export {validate}