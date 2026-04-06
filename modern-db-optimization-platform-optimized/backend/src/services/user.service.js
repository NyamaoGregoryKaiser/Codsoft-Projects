const User = require('../models/user.model');
const { NotFoundError } = require('../utils/errorHandler');
const logger = require('../config/logger');

class UserService {
    static async getUserProfile(userId) {
        const user = await User.findById(userId);
        if (!user) {
            throw new NotFoundError('User not found.');
        }
        // Exclude sensitive information like password
        const { password, ...userProfile } = user;
        return userProfile;
    }

    static async updateUserProfile(userId, updateData) {
        // For simplicity, we are not allowing password changes via this method
        // Password changes should go through a dedicated endpoint
        if (updateData.password) {
            delete updateData.password;
        }

        const updatedUser = await User.update(userId, updateData);
        if (!updatedUser) {
            throw new NotFoundError('User not found.');
        }
        logger.info(`User ${userId} updated profile.`);
        const { password, ...userProfile } = updatedUser;
        return userProfile;
    }
}

module.exports = UserService;