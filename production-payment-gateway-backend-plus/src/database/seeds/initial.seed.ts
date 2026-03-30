```typescript
import { AppDataSource } from "../data-source";
import { User, UserRole } from "../../entities/User";
import { Merchant } from "../../entities/Merchant";
import { hashPassword } from "../../services/hashing.service";
import logger from "../../config/logger";
import { v4 as uuidv4 } from 'uuid';

export const seedDatabase = async () => {
  await AppDataSource.initialize();
  logger.info("Database connection established for seeding.");

  const userRepository = AppDataSource.getRepository(User);
  const merchantRepository = AppDataSource.getRepository(Merchant);

  // Clear existing data (optional, useful for development)
  // await merchantRepository.delete({});
  // await userRepository.delete({});

  // Check if admin user already exists
  let adminUser = await userRepository.findOneBy({ email: "admin@example.com" });
  if (!adminUser) {
    const hashedPassword = await hashPassword("adminpassword");
    adminUser = userRepository.create({
      email: "admin@example.com",
      password: hashedPassword,
      role: UserRole.ADMIN,
    });
    await userRepository.save(adminUser);
    logger.info("Created Admin User: admin@example.com");
  } else {
    logger.info("Admin User already exists.");
  }

  // Check if merchant user already exists
  let merchantUser = await userRepository.findOneBy({ email: "merchant@example.com" });
  if (!merchantUser) {
    const hashedPassword = await hashPassword("merchantpassword");
    merchantUser = userRepository.create({
      email: "merchant@example.com",
      password: hashedPassword,
      role: UserRole.MERCHANT,
    });
    await userRepository.save(merchantUser);
    logger.info("Created Merchant User: merchant@example.com");
  } else {
    logger.info("Merchant User already exists.");
  }

  // Check if merchant account already exists for merchant user
  let merchantAccount = await merchantRepository.findOne({ where: { ownerUser: { id: merchantUser.id } } });
  if (!merchantAccount && merchantUser) {
    merchantAccount = merchantRepository.create({
      name: "Acme Corp",
      apiKey: uuidv4(), // Generate a unique API key
      contactEmail: merchantUser.email,
      ownerUser: merchantUser,
    });
    await merchantRepository.save(merchantAccount);
    // Link merchant to user
    merchantUser.merchant = merchantAccount;
    await userRepository.save(merchantUser);
    logger.info("Created Merchant Account: Acme Corp");
  } else {
    logger.info("Merchant Account already exists for merchant@example.com.");
  }

  await AppDataSource.destroy();
  logger.info("Seeding complete.");
};

if (require.main === module) {
  seedDatabase().catch((error) => {
    logger.error("Database seeding failed:", error);
    process.exit(1);
  });
}
```