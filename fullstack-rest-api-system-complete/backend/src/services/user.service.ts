import { AppDataSource } from '../config/database';
import { User } from '../models/User.entity';
import { UpdateUserDto } from '../validators/user.validator';
import { HttpException } from '../utils/http-exception';
import logger from '../utils/logger';

export class UserService {
  private userRepository = AppDataSource.getRepository(User);

  public async findAllUsers() {
    try {
      const users = await this.userRepository.find({
        select: ['id', 'email', 'firstName', 'lastName', 'role', 'createdAt', 'updatedAt'],
      });
      return users;
    } catch (error) {
      logger.error(`UserService - findAllUsers failed: ${error.message}`, error.stack);
      throw new HttpException(500, 'Failed to retrieve users.');
    }
  }

  public async findUserById(id: string) {
    try {
      const user = await this.userRepository.findOne({
        where: { id },
        select: ['id', 'email', 'firstName', 'lastName', 'role', 'createdAt', 'updatedAt'],
      });
      if (!user) {
        throw new HttpException(404, `User with ID ${id} not found.`);
      }
      return user;
    } catch (error) {
      logger.error(`UserService - findUserById failed: ${error.message}`, error.stack);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(500, 'Failed to retrieve user.');
    }
  }

  public async updateUser(id: string, updateData: UpdateUserDto) {
    try {
      const user = await this.userRepository.findOneBy({ id });
      if (!user) {
        throw new HttpException(404, `User with ID ${id} not found.`);
      }

      // Check for unique email during update, excluding current user's email
      if (updateData.email && updateData.email !== user.email) {
        const existingUser = await this.userRepository.findOne({ where: { email: updateData.email } });
        if (existingUser) {
          throw new HttpException(409, 'Email already in use by another user.');
        }
      }

      Object.assign(user, updateData);
      await this.userRepository.save(user);

      logger.info(`User updated: ${user.id}`);
      return { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role };
    } catch (error) {
      logger.error(`UserService - updateUser failed: ${error.message}`, error.stack);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(500, 'Failed to update user.');
    }
  }

  public async deleteUser(id: string) {
    try {
      const result = await this.userRepository.delete(id);
      if (result.affected === 0) {
        throw new HttpException(404, `User with ID ${id} not found.`);
      }
      logger.info(`User deleted: ${id}`);
    } catch (error) {
      logger.error(`UserService - deleteUser failed: ${error.message}`, error.stack);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(500, 'Failed to delete user.');
    }
  }
}