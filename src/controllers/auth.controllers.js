import { User } from "../models/user.modal.js"
import { ApiError } from "../utils/api_error.js";
import { ApiResponse } from "../utils/api_response.js";
import { emailVerificationMailContent, sendEmail } from "../utils/mailer.js";
   
     const registerUser = async (req,res) => {
        try {
            const {userName,email,password,role,fullName} = req.body
            const existingUser = await User.findOne({
                $or:[{email},{userName}]
            })
         
            if (existingUser) {
                throw new ApiError(409,"user already exists with same email or username")
            }

          const user = await User.create({
                  userName,
                  email,
                  password,
                  fullName,
                  isEmailVerified:false
            })

            const {unHashedToken,hashedToken,tokenExpiry} = user.generateTemporaryToken()

            user.emailVerificatiomToken = hashedToken
            user.emailVerificatiomTokenExpiry = tokenExpiry

             await user.save({validateBeforeSave:false})

            await sendEmail({
                 email:user?.email,
                 subject:"Please Verify Your Email",
                 mailGenContent:emailVerificationMailContent(
                    user.userName,
                    `${req.protocol}://${req.get("host")}/api/v1/users/verify-email/${unHashedToken}`
                 )
            })

         const createdUser = await User.findById(user._id).select("-password -refreshToken -emailVerificationToken -emailVerificationExpiry")
         if (!createdUser) {
          throw new ApiError(500,"something went wrong while creating the user")    
         }

        return res
           .status(201)
           .json(new ApiResponse(200,{user:createdUser},"User registered successfully and verification email has been sent on your email"))
        } catch (error) {
          console.log(error,"error in user registration api");
          throw new ApiError(500,error.message)
             
        }
     }



     export {registerUser}