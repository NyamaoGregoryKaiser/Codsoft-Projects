import { AppDataSource } from '../database/data-source';
import { User } from '../entities/User';
import { hashPassword, comparePassword } from '../utils/password';
import { generateToken } from '../utils/jwt';
import { Logger } from '../config/winston';

export class AuthService {
  private userRepository = AppDataSource.getRepository(User);

  async registerUser(username: string, email: string, password: string) {
    // Check if user already exists
    const existingUser = await this.userRepository.findOne({ where: [{ email }, { username }] });
    if (existingUser) {
      const error = new Error('User with that email or username already exists') as any;
      error.statusCode = 409; // Conflict
      throw error;
    }

    const passwordHash = await hashPassword(password);

    const user = this.userRepository.create({ username, email, passwordHash });
    await this.userRepository.save(user);

    const token = generateToken(user.id);
    Logger.info(`User registered: ${user.email}`);
    return { user: { id: user.id, username: user.username, email: user.email }, token };
  }

  async loginUser(email: string, password: string) {
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      const error = new Error('Invalid credentials') as any;
      error.statusCode = 401;
      throw error;
    }

    const isMatch = await comparePassword(password, user.passwordHash);
    if (!isMatch) {
      const error = new Error('Invalid credentials') as any;
      error.statusCode = 401;
      throw error;
    }

    const token = generateToken(user.id);
    Logger.info(`User logged in: ${user.email}`);
    return { user: { id: user.id, username: user.username, email: user.email }, token };
  }

  async findUserById(id: string) {
    return this.userRepository.findOne({
      where: { id },
      select: ['id', 'username', 'email', 'createdAt', 'updatedAt'],
    });
  }
}