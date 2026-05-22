```typescript
import { UserRepository } from './user.repository';
import { User } from './user.entity';
import { AppError } from '../../utils/appError';

export class UserService {
  private userRepository: UserRepository;

  constructor() {
    this.userRepository = new UserRepository();
  }

  async createUser(userData: Partial<User>): Promise<User> {
    const existingUser = await this.userRepository.findByEmail(userData.email!);
    if (existingUser) {
      throw new AppError('User with that email already exists', 409);
    }
    return this.userRepository.create(userData);
  }

  async getUserById(id: string): Promise<User> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new AppError('User not found', 404);
    }
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return this.userRepository.findAll();
  }

  async updateUser(id: string, userData: Partial<User>): Promise<User> {
    const updatedUser = await this.userRepository.update(id, userData);
    if (!updatedUser) {
      throw new AppError('User not found', 404);
    }
    return updatedUser;
  }

  async deleteUser(id: string): Promise<void> {
    await this.userRepository.delete(id);
  }
}
```