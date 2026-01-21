import { User } from "../models/user.modal.js"
import { ApiError } from "../utils/api_error.js";
import { ApiResponse } from "../utils/api_response.js";
import { emailVerificationMailContent, sendEmail } from "../utils/mailer.js";

     const generateAccessAndRefreshToken = async (userId) => {
         try {
            const user = await User.findById(userId)
            if (!user) {
               throw new ApiError(404,{},"invalid user id")
            }
            const AccessToken = user.generateAccessToken()
            const RefreshToken = user.generateRefreshToken()

            user.refreshToken = RefreshToken
            await user.save({validateBeforeSave:false})
            return {AccessToken,RefreshToken}
         } catch (error) {
             console.log(error,"error in generating access and refresh token method in auth controller");
             throw new ApiError(500,{},"error in generating AT,RT")
         }
      
     }
   
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

     const loginUser = async (req,res) => {
        try {
         const {email,password} = req.body
          if (!email) {
             throw new ApiError(400,{},"Email is required")
            }
            const user = await User.findOne({email})
            if (!user) {
               throw new ApiError(400,{},"could not find user with this email")
            }
            
            const isPasswordValid = await user.isPasswordCorrect(password)
            if (!isPasswordValid) {
             throw new ApiError(400,{},"INVALID PASSWORD")
          }

         const {AccessToken,RefreshToken} = await generateAccessAndRefreshToken(user._id)
          
         const loggedInUser = await User.findById(user._id).select("-password -refreshToken -emailVerificationToken -emailVerificationExpiry")

          const options = {
              httpOnly:true,
              secure:true
          }

           return res
                   .status(200)
                   .cookie("AccessToken",AccessToken,options)
                   .cookie("RefreshToken",RefreshToken,options)
                   .json(
                      new ApiResponse(
                        200,
                        {
                           user:loggedInUser,
                           AccessToken,
                           RefreshToken
                        }
                        ,"User logged in successfully"
                     )
                   )

          

 
        } catch (error) {
           console.log(error,"error in user login api controller");
           throw new ApiError(500,{err:error.message},"error in the login api controller")
        }
      
     }





     export {registerUser,generateAccessAndRefreshToken,loginUser}