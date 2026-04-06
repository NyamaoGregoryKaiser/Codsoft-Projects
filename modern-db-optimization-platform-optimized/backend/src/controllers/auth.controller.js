const AuthService = require('../services/auth.service');
const { validationSchema } = require('../utils/validation');

class AuthController {
    static async register(req, res, next) {
        try {
            await validationSchema.register.validateAsync(req.body);
            const { username, email, password } = req.body;
            const result = await AuthService.register(username, email, password);
            res.status(201).json({ status: 'success', data: result });
        } catch (error) {
            next(error);
        }
    }

    static async login(req, res, next) {
        try {
            await validationSchema.login.validateAsync(req.body);
            const { username, password } = req.body;
            const result = await AuthService.login(username, password);
            res.status(200).json({ status: 'success', data: result });
        } catch (error) {
            next(error);
        }
    }

    static async getProfile(req, res, next) {
        try {
            const user = req.user; // User data from JWT payload
            res.status(200).json({ status: 'success', data: { id: user.id, username: user.username, email: user.email, role: user.role } });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = AuthController;