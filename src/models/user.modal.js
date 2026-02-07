import mongoose, { Schema } from 'mongoose'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'

const userSchema = new Schema(
    {
        avatar: {
            type: { url: String, localPath: String },
            default: { url: 'https://placehold.co/200x200.png', localPath: '' },
        },
        fullName: {
            type: String,
            trim: true,
            minLength: 3,
            maxLength: 30,
        },
        userName: {
            type: String,
            required: true,
            trim: true,
            unique: true,
            index: true,
        },
        email: {
            type: String,
            required: true,
            trim: true,
            unique: true,
        },
        password: {
            type: String,
            required: [true, 'Please provide a password'],
            trim: true,
        },
        isEmailVerified: {
            type: Boolean,
            default: false,
        },
        refreshToken: { type: String },
        forgotPasswordToken: { type: String },
        forgotPasswordTokenExpiry: { type: Date },
        emailVerificatiomToken: { type: String },
        emailVerificatiomTokenExpiry: { type: Date },
        isDeleted: {
            type: Boolean,
            default: false,
        },
        deletedAt: {
            type: Date,
            default: null,
        },
        status: { type: String, default: 'inactive' },
    },
    { timestamps: true }
)

// hash the password
userSchema.pre('save', async function () {
    if (!this.isModified('password')) return
    const salt = await bcrypt.genSalt(10)
    this.password = await bcrypt.hash(this.password, salt)
})

// Find queries mein deleted hide karo
userSchema.pre(/^find/, function () {
    if (!this.getOptions().includeSoftDeleted) {
        this.where({ isDeleted: false })
    }
})

// Count mein bhi
userSchema.pre('countDocuments', function () {
    if (!this.getOptions().includeSoftDeleted) {
        // Yeh naya check
        this.where({ isDeleted: false })
    }
})

// compare the password
userSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password)
}

// TOKENS = PAYLOAD OBJECT , SECRET , EXPIRESIN (THAT'S IT NIGG)
userSchema.methods.generateAccessToken = function () {
    const token = jwt.sign(
        {
            _id: this._id,
            email: this.email,
            userName: this.userName,
        },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: process.env.ACCESS_TOKEN_EXPIRY }
    )
    return token
}

userSchema.methods.generateRefreshToken = function () {
    const token = jwt.sign(
        {
            _id: this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: process.env.REFRESH_TOKEN_EXPIRY }
    )

    return token
}

userSchema.methods.generateTemporaryToken = function () {
    const unHashedToken = crypto.randomBytes(10).toString('hex')
    const hashedToken = crypto
        .createHash('sha-256')
        .update(unHashedToken)
        .digest('hex')
    const tokenExpiry = Date.now() + 20 * 60 * 1000

    return { unHashedToken, hashedToken, tokenExpiry }
}

// soft delete methods
userSchema.methods.softDelete = async function () {
    this.isDeleted = true
    this.deletedAt = new Date()
    await this.save()
}

// restore soft deleted
userSchema.methods.restore = async function () {
    this.isDeleted = false
    this.deletedAt = null
    await this.save()
}

export const User = mongoose.model('User', userSchema)
