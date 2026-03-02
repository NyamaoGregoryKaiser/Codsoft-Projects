import { DataSource } from 'typeorm';
import { User } from '../../entities/User';
import { hashPassword } from '../../utils/password';
import { Logger } from '../../config/winston';

export class UserSeeder {
  public async run(dataSource: DataSource): Promise<void> {
    const userRepository = dataSource.getRepository(User);

    const existingUser = await userRepository.findOneBy({ email: 'admin@example.com' });
    if (!existingUser) {
      const hashedPassword = await hashPassword('password123');
      const adminUser = userRepository.create({
        username: 'admin',
        email: 'admin@example.com',
        password_hash: hashedPassword,
      });
      await userRepository.save(adminUser);
      Logger.info('Admin user seeded: admin@example.com');
    } else {
      Logger.info('Admin user already exists, skipping seed.');
    }
  }
}