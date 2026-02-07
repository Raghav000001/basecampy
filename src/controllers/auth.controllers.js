import { User } from '../models/user.modal.js'
import { ApiError } from '../utils/api_error.js'
import { ApiResponse } from '../utils/api_response.js'
import { emailVerificationMailContent, sendEmail } from '../utils/mailer.js'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'

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
        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    req.user,
                    'current user fetched successfully'
                )
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
            throw new ApiError(
                401,
                'sorry we can not process your request further'
            )
        }

        const isOldPassValid = user.isPasswordCorrect(oldPassword)
        if (!isOldPassValid) {
            throw new ApiError(
                401,
                { error: 'old password is not correct' },
                'please enter correct old password'
            )
        }

        user.password = newPassword
        await user.save({ validateBeforeSave: false })

        return res
            .status(200)
            .json(new ApiResponse(200, {}, 'password changed successfully'))
    } catch (error) {
        throw new ApiError(
            500,
            { error: error.message },
            'error in change password api controller'
        )
    }
}

const verifyEmail = async (req, res) => {
    try {
        const { verificationToken } = req.params

        if (!verificationToken) {
            throw new ApiError(400, {}, 'email verification token is missing')
        }

        let hashed = crypto
            .createHash('sha256')
            .update(verificationToken)
            .digest('hex')

        const user = await User.findOne({
            emailVerificatiomToken: hashed,
            emailVerificatiomTokenExpiry: { $gt: Date.now() },
        })

        if (!user) {
            throw new ApiError(400, {}, 'invalid or expired token')
        }

        user.emailVerificatiomToken = undefined
        user.emailVerificatiomTokenExpiry = undefined

        user.isEmailVerified = true

        await user.save({ validateBeforeSave: false })

        return res
            .status(200)
            .json(
                200,
                { isEmailVerified: true },
                'email is verified successfully'
            )
    } catch (error) {
        console.log(error)
        if (error instanceof ApiError) {
            throw error
        }
        throw new ApiError(500, {}, 'error in verify email controller')
    }
}

const resendVerificationEmail = async (req, res) => {
    try {
        const user = await User.findById(req.user?._id)
        if (!user) {
            throw new ApiError(404, {}, 'user does not exists')
        }

        if (user.isEmailVerified) {
            throw new ApiError(400, {}, 'user is already verified')
        }

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

        return res
            .status(200)
            .json(
                new ApiResponse(200, {}, 'Mail has been sent to your email ID')
            )
    } catch (error) {
        console.log(error)
        throw new ApiError(
            500,
            { err: error.message },
            'error in resendVerificationEmail api controller'
        )
    }
}

const resetPasswordRequest = async (req, res) => {}

const resetPassword = async (req, res) => {}

// just for the demo purpose
const deleteAllUser = async (req, res) => {
    try {
        await User.deleteMany({}) // empty filter = sab delete
        res.status(200).json({ message: 'All users deleted successfully' })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}

const softDelete = async (req, res) => {
    try {
        const { id } = req.body
        const user = await User.findById(id)
        if (!user) {
            res.status(401).json({ error: 'user does not exists' })
        }
        await user.softDelete()
        return res
            .status(200)
            .json({ message: `${user.fullName} got soft deleted successfully` })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}

const restoreSoftDeletedUser = async (req, res) => {
    try {
        const { id } = req.body
        const user = await User.findById(id).setOptions({
            includeSoftDeleted: true,
        })
        if (!user) {
            res.status(401).json({ error: 'user does not exists' })
        }
        await user.restore()
        return res
            .status(200)
            .json({ message: `${user.fullName} got restored successfully` })
    } catch (error) {
    }
}

const getAllUser = async (req, res) => {
    const users = await User.find({})
    return res.status(200).json({ users })
}

// bulk operations
const setUserStatusActiveInBulk = async function (req,res) {
    try {
       const result = await User.updateMany(
        {
           fullName:{
              $regex:/^T/
           }
        },
        {
            $set:{
                status:"Active"
            }
        }
    ) 

       return res.status(200).json({message:result.modifiedCount+" "+"documents updated"})
   

    } catch (error) {
     res.status(500).json({ error: error.message })   
    }
}


const mixBulk = async function (req,res) {
    try {
       const result =  await User.bulkWrite([
    { updateMany: { filter: { status: 'Active' }, update: { $set: { status: 'inactive' } } } },
    { deleteOne: { filter: { fullName: 'Test User 4' } } }  // Mix delete
   ]);
   return res.status(200).json({message:`${result.modifiedCount} doc's updated and ${result.deletedCount} doc's deleted`})
    } catch (error) {
         res.status(500).json({ error: error.message })   
    }
}



export {
    registerUser,
    generateAccessAndRefreshToken,
    loginUser,
    logoutUser,
    verifyEmail,
    resendVerificationEmail,
    refreshAccessToken,
    getCurrentUser,
    changeCurrentPassword,
    resetPasswordRequest,
    resetPassword,
    deleteAllUser,
    softDelete,
    getAllUser,
    restoreSoftDeletedUser,
    setUserStatusActiveInBulk,
    mixBulk
}
