const bcryptUtil = require('../utils/bcrypt');
const jwtUtil = require('../utils/jwt');
const User = require('../models/user.model');
const { UnauthorizedError, ConflictError } = require('../utils/errorHandler');
const logger = require('../config/logger');

class AuthService {
    static async register(username, email, password) {
        const existingUser = await User.findByUsername(username);
        if (existingUser) {
            throw new ConflictError('Username already taken.');
        }

        const existingEmail = await User.findByEmail(email);
        if (existingEmail) {
            throw new ConflictError('Email already registered.');
        }

        const hashedPassword = await bcryptUtil.hashPassword(password);
        const user = await User.create({ username, email, password: hashedPassword });

        const token = jwtUtil.generateToken({
            id: user.id,
            username: user.username,
            role: user.role
        });

        logger.info(`User registered: ${user.username}`);
        return { user: { id: user.id, username: user.username, email: user.email, role: user.role }, token };
    }

    static async login(username, password) {
        const user = await User.findByUsername(username);
        if (!user) {
            throw new UnauthorizedError('Invalid username or password.');
        }

        const isPasswordValid = await bcryptUtil.comparePassword(password, user.password);
        if (!isPasswordValid) {
            throw new UnauthorizedError('Invalid username or password.');
        }

        const token = jwtUtil.generateToken({
            id: user.id,
            username: user.username,
            role: user.role
        });

        logger.info(`User logged in: ${user.username}`);
        return { user: { id: user.id, username: user.username, email: user.email, role: user.role }, token };
    }
}

module.exports = AuthService;