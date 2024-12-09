const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { v4: uuidv4 } = require('uuid');

// Token expiration times
const ACCESS_TOKEN_EXPIRY = '15m';  // 15 minutes
const REFRESH_TOKEN_EXPIRY = '7d';  // 7 days

class TokenService {
    static generateTokens(user) {
        // Generate access token
        const accessToken = jwt.sign(
            {
                userId: user._id,
                email: user.email,
                role: user.role,
                organizationId: user.organizationId
            },
            process.env.JWT_SECRET,
            { expiresIn: ACCESS_TOKEN_EXPIRY }
        );

        // Generate refresh token
        const refreshToken = jwt.sign(
            {
                userId: user._id,
                tokenId: uuidv4()
            },
            process.env.JWT_REFRESH_SECRET,
            { expiresIn: REFRESH_TOKEN_EXPIRY }
        );

        return { accessToken, refreshToken };
    }

    static async saveRefreshToken(userId, refreshToken) {
        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
        
        // Calculate expiry date
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now

        await User.findByIdAndUpdate(userId, {
            $push: {
                refreshTokens: {
                    token: refreshToken,
                    expiresAt,
                    tokenId: decoded.tokenId
                }
            }
        });
    }

    static async revokeRefreshToken(userId, refreshToken) {
        await User.findByIdAndUpdate(userId, {
            $pull: { refreshTokens: { token: refreshToken } }
        });
    }

    static async refreshAccessToken(refreshToken) {
        try {
            // Verify refresh token
            const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
            
            // Find user and check if refresh token exists and is valid
            const user = await User.findOne({
                _id: decoded.userId,
                'refreshTokens.token': refreshToken,
                'refreshTokens.isRevoked': false,
                'refreshTokens.expiresAt': { $gt: new Date() }
            });

            if (!user) {
                throw new Error('Invalid refresh token');
            }

            // Generate new tokens
            const tokens = this.generateTokens(user);

            // Save new refresh token
            await this.saveRefreshToken(user._id, tokens.refreshToken);

            // Remove old refresh token
            await this.revokeRefreshToken(user._id, refreshToken);

            return tokens;
        } catch (error) {
            throw new Error('Failed to refresh token');
        }
    }

    static async revokeAllUserTokens(userId) {
        await User.findByIdAndUpdate(userId, {
            $set: { refreshTokens: [] }
        });
    }

    static verifyAccessToken(token) {
        try {
            return jwt.verify(token, process.env.JWT_SECRET);
        } catch (error) {
            throw new Error('Invalid access token');
        }
    }
}

module.exports = TokenService;
