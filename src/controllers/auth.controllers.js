import { User } from '../models/user.modal.js'
import { ApiError } from '../utils/api_error.js'
import { ApiResponse } from '../utils/api_response.js'
import { emailVerificationMailContent, sendEmail } from '../utils/mailer.js'
import jwt from 'jsonwebtoken'

const generateAccessAndRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId)
        if (!user) {
            throw new ApiError(404, {}, 'invalid user id')
        }
        const AccessToken = user.generateAccessToken()
        const RefreshToken = user.generateRefreshToken()

        user.refreshToken = RefreshToken
        await user.save({ validateBeforeSave: false })
        return { AccessToken, RefreshToken }
    } catch (error) {
        console.log(
            error,
            'error in generating access and refresh token method in auth controller'
        )
        throw new ApiError(500, {}, 'error in generating AT,RT')
    }
}

const registerUser = async (req, res) => {
    try {
        const { userName, email, password, role, fullName } = req.body
        const existingUser = await User.findOne({
            $or: [{ email }, { userName }],
        })

        if (existingUser) {
            throw new ApiError(
                409,
                'user already exists with same email or username'
            )
        }

        const user = await User.create({
            userName,
            email,
            password,
            fullName,
            isEmailVerified: false,
        })

        const { unHashedToken, hashedToken, tokenExpiry } =
            user.generateTemporaryToken()

        user.emailVerificatiomToken = hashedToken
        user.emailVerificatiomTokenExpiry = tokenExpiry

        await user.save({ validateBeforeSave: false })

        await sendEmail({
            email: user?.email,
            subject: 'Please Verify Your Email',
            mailGenContent: emailVerificationMailContent(
                user.userName,
                `${req.protocol}://${req.get('host')}/api/v1/users/verify-email/${unHashedToken}`
            ),
        })

        const createdUser = await User.findById(user._id).select(
            '-password -refreshToken -emailVerificationToken -emailVerificationExpiry'
        )
        if (!createdUser) {
            throw new ApiError(
                500,
                'something went wrong while creating the user'
            )
        }

        return res
            .status(201)
            .json(
                new ApiResponse(
                    200,
                    { user: createdUser },
                    'User registered successfully and verification email has been sent on your email'
                )
            )
    } catch (error) {
        console.log(error, 'error in user registration api')
        return res
            .status(500)
            .json(
                new ApiError(500, {}, error.message || 'something went wrong')
            )
    }
}

const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body
        if (!email) {
            throw new ApiError(400, {}, 'Email is required')
        }
        const user = await User.findOne({ email })
        if (!user) {
            throw new ApiError(400, {}, 'could not find user with this email')
        }

        const isPasswordValid = await user.isPasswordCorrect(password)
        if (!isPasswordValid) {
            throw new ApiError(400, {}, 'INVALID PASSWORD')
        }

        const { AccessToken, RefreshToken } =
            await generateAccessAndRefreshToken(user._id)

        const loggedInUser = await User.findById(user._id).select(
            '-password -refreshToken -emailVerificationToken -emailVerificationExpiry'
        )

        const options = {
            httpOnly: true,
            secure: true,
        }

        return res
            .status(200)
            .cookie('AccessToken', AccessToken, options)
            .cookie('RefreshToken', RefreshToken, options)
            .json(
                new ApiResponse(
                    200,
                    {
                        user: loggedInUser,
                        AccessToken,
                        RefreshToken,
                    },
                    'User logged in successfully'
                )
            )
    } catch (error) {
        console.log(error, 'error in user login api')
        return res
            .status(500)
            .json(new ApiError(500, {}, error.message || 'login failed'))
    }
}

const logoutUser = async (req, res) => {
    try {
        const userId = req.user._id
        const user = await User.findByIdAndUpdate(
            userId,
            {
                $set: {
                    refreshToken: null,
                },
            },
            {
                new: true,
            }
        )
        const options = {
            httpOnly: true,
            secure: true,
        }

        return res
            .status(200)
            .cookie('AccessToken', null, options)
            .cookie('RefreshToken', null, options)
            .json(new ApiResponse(200, {}, 'User logged out successfully'))
    } catch (error) {
        console.log(error, 'error in logout api controller')
        return res
            .status(500)
            .json(new ApiError(500, {}, 'could not logout user'))
    }
}

const refreshAccessToken = async (req, res) => {
    try {
        const incomingToken = req.cookie?.RefreshToken
        if (!incomingToken) {
            throw new ApiError(401, {}, 'unauthorized access')
        }

        const decodedToken = jwt.verify(
            incomingToken,
            process.env.REFRESH_TOKEN_EXPIRY
        )

        const user = await User.findById(decodedToken._id)
        if (!user) {
            throw new ApiError(401, {}, 'invalid refresh token')
        }

        if (incomingToken !== user.refreshToken) {
            throw new ApiError(401, {}, 'refresh token expired')
        }

        const { AccessToken, RefreshToken } =
            await generateAccessAndRefreshToken(user._id)

        const options = {
            httpOnly: true,
            secure: true,
        }

        user.refreshToken = RefreshToken
        await user.save()

        return res
            .status(200)
            .cookie('AccessToken', AccessToken, options)
            .cookie('RefreshToken', RefreshToken, options)
            .json(
                new ApiResponse(
                    200,
                    {
                        AccessToken,
                        RefreshToken,
                    },
                    'Access Token Refreshed successfully'
                )
            )
    } catch (error) {
        console.log(error)
        throw new ApiError(500, {}, 'error in the refreshAccessToken api')
    }
}

const getCurrentUser = async (req, res) => {
    try {
        return new ApiResponse(
            200,
            req.user,
            'current user fetched successfully'
        )
    } catch (error) {
        console.log(error)
        throw new ApiError(500, {}, 'error in get current user api controller')
    }
}

const changeCurrentPassword = async (req, res) => {
    try {
        const { oldPassword, newPassword } = req.body
        if (!oldPassword && !newPassword) {
            throw new ApiError(401, 'both old and new password are required')
        }
        
        const user = await User.findById(req.user?._id)
        if (!user) {
            throw new ApiError(401, 'sorry we can not process your request further')
        }
        
        const isOldPassValid = user.isPasswordCorrect(oldPassword)
        if (!isOldPassValid) {
            throw new ApiError(401, {error:"old password is not correct"} , 'please enter correct old password')
        }

        user.password = newPassword
        await user.save({validateBeforeSave:false})

        return res.status(200).json(new ApiResponse(200, {}, "password changed successfully"))

    } catch (error) {
        throw new ApiError(
            500,
            { error: error.message },
            'error in change password api controller'
        )
    }
}


const resetPasswordRequest = async (req,res) => {
      
}

const resetPassword = async (req,res) => {
   
}

export {
    registerUser,
    generateAccessAndRefreshToken,
    loginUser,
    logoutUser,
    refreshAccessToken,
    getCurrentUser,
    changeCurrentPassword,
    resetPasswordRequest,
    resetPassword
}
