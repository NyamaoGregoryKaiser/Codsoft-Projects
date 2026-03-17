import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/AuthService';
import { CustomError } from '../middlewares/errorHandler';
import { UserRole } from '../entities/User';
import { CreateUserDto, LoginUserDto } from '../utils/validation';

export class AuthController {
    private authService = new AuthService();

    async register(req: Request, res: Response, next: NextFunction) {
        try {
            const { email, password, role } = req.body as CreateUserDto;
            // Admins can set roles, otherwise default to VIEWER/EDITOR
            let assignedRole = UserRole.VIEWER;
            if (req.user && req.user.role === UserRole.ADMIN && role) {
                if (Object.values(UserRole).includes(role as UserRole)) {
                    assignedRole = role as UserRole;
                }
            } else if (req.user && req.user.role === UserRole.ADMIN && !role) {
                 // If admin is creating a user but doesn't specify role, default to EDITOR
                assignedRole = UserRole.EDITOR;
            } else if (!req.user && !role) {
                // Public registration defaults to VIEWER
                assignedRole = UserRole.VIEWER;
            } else if (!req.user && role && role !== UserRole.VIEWER) {
                // Public cannot register as admin/editor
                throw new CustomError(403, "Cannot register with this role without admin privileges.");
            }

            const { user, token } = await this.authService.register({
                email,
                password,
                role: assignedRole
            });
            res.status(201).json({
                success: true,
                message: 'User registered successfully',
                data: {
                    user: {
                        id: user.id,
                        email: user.email,
                        role: user.role,
                    },
                    token,
                },
            });
        } catch (error) {
            next(error);
        }
    }

    async login(req: Request, res: Response, next: NextFunction) {
        try {
            const { email, password } = req.body as LoginUserDto;
            const { user, token } = await this.authService.login({ email, password });
            res.status(200).json({
                success: true,
                message: 'Logged in successfully',
                data: {
                    user: {
                        id: user.id,
                        email: user.email,
                        role: user.role,
                    },
                    token,
                },
            });
        } catch (error) {
            next(error);
        }
    }

    async getMe(req: Request, res: Response, next: NextFunction) {
        try {
            if (!req.user) {
                return next(new CustomError(401, "User not authenticated."));
            }
            const user = await this.authService.getUserProfile(req.user.id);
            if (!user) {
                return next(new CustomError(404, "User profile not found."));
            }
            res.status(200).json({
                success: true,
                data: user,
            });
        } catch (error) {
            next(error);
        }
    }

    async getUsers(req: Request, res: Response, next: NextFunction) {
        try {
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 10;
            const [users, total] = await this.authService.getUsers(page, limit);
            res.status(200).json({
                success: true,
                data: users,
                meta: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                },
            });
        } catch (error) {
            next(error);
        }
    }

    async getUserById(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const user = await this.authService.getUserProfile(id);
            if (!user) {
                return next(new CustomError(404, "User not found."));
            }
            res.status(200).json({
                success: true,
                data: user,
            });
        } catch (error) {
            next(error);
        }
    }

    async updateUser(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const updateData = req.body; // Add DTO validation if needed
            const updatedUser = await this.authService.updateUser(id, updateData);
            if (!updatedUser) {
                return next(new CustomError(404, "User not found."));
            }
            res.status(200).json({
                success: true,
                message: 'User updated successfully',
                data: updatedUser,
            });
        } catch (error) {
            next(error);
        }
    }

    async deleteUser(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            await this.authService.deleteUser(id);
            res.status(204).json({
                success: true,
                message: 'User deleted successfully',
            });
        } catch (error) {
            next(error);
        }
    }
}