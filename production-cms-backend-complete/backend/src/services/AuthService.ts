import { User, UserRole } from "../entities/User";
import { UserRepository } from "../repositories/UserRepository";
import { CustomError } from "../middlewares/errorHandler";
import { generateToken } from "../utils/jwtHelper";
import { CreateUserDto, LoginUserDto } from "../utils/validation";
import { logger } from "../config/logger";

export class AuthService {
    private userRepository = UserRepository;

    async register(userData: CreateUserDto): Promise<{ user: User; token: string }> {
        const existingUser = await this.userRepository.findByEmail(userData.email);
        if (existingUser) {
            throw new CustomError(400, "User with this email already exists.");
        }

        const newUser = new User();
        newUser.email = userData.email;
        newUser.password = userData.password;
        newUser.role = userData.role as UserRole || UserRole.VIEWER; // Default role

        await newUser.hashPassword();
        await this.userRepository.save(newUser);

        const token = generateToken(newUser);
        logger.info(`User registered: ${newUser.email} with role ${newUser.role}`);
        return { user: newUser, token };
    }

    async login(loginData: LoginUserDto): Promise<{ user: User; token: string }> {
        const user = await this.userRepository.findByEmail(loginData.email);
        if (!user || !user.isActive) {
            throw new CustomError(401, "Invalid credentials or account is inactive.");
        }

        const isMatch = await user.comparePassword(loginData.password);
        if (!isMatch) {
            throw new CustomError(401, "Invalid credentials.");
        }

        const token = generateToken(user);
        logger.info(`User logged in: ${user.email}`);
        return { user, token };
    }

    async getUserProfile(userId: string): Promise<User | null> {
        return this.userRepository.findOne({
            where: { id: userId },
            select: ["id", "email", "role", "isActive", "createdAt", "updatedAt"] // Exclude password
        });
    }

    async getUsers(page: number, limit: number): Promise<[User[], number]> {
        const skip = (page - 1) * limit;
        return this.userRepository.findAndCount({
            skip,
            take: limit,
            select: ["id", "email", "role", "isActive", "createdAt", "updatedAt"]
        });
    }

    async updateUser(userId: string, updateData: Partial<User>): Promise<User | null> {
        const user = await this.userRepository.findOneBy({ id: userId });
        if (!user) {
            throw new CustomError(404, "User not found.");
        }

        Object.assign(user, updateData);
        if (updateData.password) {
            await user.hashPassword();
        }
        await this.userRepository.save(user);
        logger.info(`User updated: ${user.email}`);
        return user;
    }

    async deleteUser(userId: string): Promise<void> {
        const result = await this.userRepository.delete(userId);
        if (result.affected === 0) {
            throw new CustomError(404, "User not found.");
        }
        logger.info(`User deleted: ${userId}`);
    }
}