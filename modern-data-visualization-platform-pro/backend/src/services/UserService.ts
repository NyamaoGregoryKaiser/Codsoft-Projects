import { Repository } from 'typeorm';
import { User } from '@models/User';
import { AppDataSource } from '@db/data-source';
import bcrypt from 'bcryptjs';
import { AppError } from '@utils/app-error';
import logger from '@config/logger';

/**
 * @class UserService
 * @description Provides business logic for user-related operations.
 */
export class UserService {
  private userRepository: Repository<User>;

  constructor() {
    this.userRepository = AppDataSource.getRepository(User);
  }

  /**
   * Registers a new user with a hashed password.
   * @param username - The user's chosen username.
   * @param email - The user's email address.
   * @param password - The user's plaintext password.
   * @returns The newly created user object, excluding the password hash.
   * @throws {AppError} If a user with the given email or username already exists.
   */
  public async registerUser(username: string, email: string, password_plain: string): Promise<User> {
    const existingUserByEmail = await this.userRepository.findOne({ where: { email } });
    if (existingUserByEmail) {
      throw new AppError('User with this email already exists', 400);
    }

    const existingUserByUsername = await this.userRepository.findOne({ where: { username } });
    if (existingUserByUsername) {
      throw new AppError('User with this username already exists', 400);
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password_plain, salt);

    const newUser = this.userRepository.create({
      username,
      email,
      passwordHash,
    });

    await this.userRepository.save(newUser);
    logger.info(`New user registered: ${email}`);
    // Return user without the password hash
    const { passwordHash: _, ...userWithoutHash } = newUser;
    return userWithoutHash as User;
  }

  /**
   * Authenticates a user by checking email and password.
   * @param email - The user's email address.
   * @param password_plain - The user's plaintext password.
   * @returns The authenticated user object, excluding the password hash.
   * @throws {AppError} If authentication fails due to invalid credentials.
   */
  public async loginUser(email: string, password_plain: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { email } });

    if (!user) {
      throw new AppError('Invalid credentials', 401);
    }

    const isMatch = await bcrypt.compare(password_plain, user.passwordHash);

    if (!isMatch) {
      throw new AppError('Invalid credentials', 401);
    }

    logger.info(`User logged in: ${email}`);
    // Return user without the password hash
    const { passwordHash: _, ...userWithoutHash } = user;
    return userWithoutHash as User;
  }

  /**
   * Retrieves a user by their ID.
   * @param id - The UUID of the user.
   * @returns The user object, excluding the password hash, or null if not found.
   */
  public async getUserById(id: string): Promise<User | null> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      return null;
    }
    const { passwordHash: _, ...userWithoutHash } = user;
    return userWithoutHash as User;
  }

  /**
   * Retrieves a user by their email.
   * This method might return the password hash internally for comparison during login,
   * but the returned object should ideally omit it for public use.
   * @param email - The user's email.
   * @returns The user object including password hash (for internal use) or null if not found.
   */
  public async getUserByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  /**
   * Deletes a user by their ID.
   * @param id - The UUID of the user.
   * @returns True if the user was deleted, false otherwise.
   */
  public async deleteUser(id: string): Promise<boolean> {
    const result = await this.userRepository.delete(id);
    if (result.affected && result.affected > 0) {
      logger.info(`User deleted: ${id}`);
      return true;
    }
    return false;
  }
}