import { AppDataSource } from '../database/data-source';
import { User } from '../entities/User';
import { Logger } from '../config/winston';
import { hashPassword } from '../utils/password';

export class UserService {
  private userRepository = AppDataSource.getRepository(User);

  async getUserById(id: string) {
    const user = await this.userRepository.findOne({
      where: { id },
      select: ['id', 'username', 'email', 'createdAt', 'updatedAt'],
    });
    if (!user) {
      const error = new Error('User not found') as any;
      error.statusCode = 404;
      throw error;
    }
    return user;
  }

  async updateUser(id: string, updates: Partial<User>) {
    const user = await this.userRepository.findOneBy({ id });
    if (!user) {
      const error = new Error('User not found') as any;
      error.statusCode = 404;
      throw error;
    }

    if (updates.passwordHash) {
      updates.passwordHash = await hashPassword(updates.passwordHash); // Ensure password is hashed
    }

    Object.assign(user, updates);
    await this.userRepository.save(user);
    Logger.info(`User updated: ${user.id}`);
    return { id: user.id, username: user.username, email: user.email }; // Return sanitized user object
  }

  async deleteUser(id: string) {
    const result = await this.userRepository.delete(id);
    if (result.affected === 0) {
      const error = new Error('User not found') as any;
      error.statusCode = 404;
      throw error;
    }
    Logger.info(`User deleted: ${id}`);
    return { message: 'User deleted successfully' };
  }
}