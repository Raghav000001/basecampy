   import { ApiResponse } from "../utils/api_response.js";
import { asyncHandler } from "../utils/async_handler.js";


  const healthCheck = async (req,res)=> {
      try {
        return res.status(200).json(new ApiResponse(200,{},"app is all good and running"))
      } catch (error) {
             console.log(error,"error in the health check route");  
        }
      }
    
//     const healthCheck = asyncHandler(async function (req,res) {
//          res.status(200).json(new ApiResponse(200,{message:"app is all good and running"}))   
//    })


  export {healthCheck}