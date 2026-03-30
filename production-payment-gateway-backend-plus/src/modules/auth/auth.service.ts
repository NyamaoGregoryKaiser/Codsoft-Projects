```typescript
import { User } from "../../entities/User";
import { AppDataSource } from "../../database/data-source";
import { hashPassword } from "../../services/hashing.service";
import { generateToken } from "../../services/jwt.service";
import { ApiError } from "../../utils/api.error";
import { comparePassword } from "../../services/hashing.service";
import { CreateUserDto, LoginUserDto } from "./auth.validation";
import logger from "../../config/logger";

const userRepository = AppDataSource.getRepository(User);

export const register = async (userData: CreateUserDto): Promise<User> => {
  const { email, password, role } = userData;

  let user = await userRepository.findOneBy({ email });
  if (user) {
    throw new ApiError(400, "User with this email already exists");
  }

  const hashedPassword = await hashPassword(password);

  user = userRepository.create({
    email,
    password: hashedPassword,
    role,
  });

  await userRepository.save(user);
  logger.info(`User registered: ${user.email} with role ${user.role}`);
  return user;
};

export const login = async (email: string, passwordReq: string): Promise<{ user: User; token: string }> => {
  const user = await userRepository.findOne({
    where: { email },
    relations: ["merchant"], // Load merchant if user is a merchant
  });

  if (!user || !(await comparePassword(passwordReq, user.password))) {
    throw new ApiError(401, "Invalid credentials");
  }

  const token = generateToken({ id: user.id, email: user.email, role: user.role, merchantId: user.merchant?.id });
  logger.info(`User logged in: ${user.email}`);
  return { user, token };
};

export const getMe = async (userId: string): Promise<User> => {
  const user = await userRepository.findOne({
    where: { id: userId },
    relations: ["merchant"],
  });

  if (!user) {
    throw new ApiError(404, "User not found");
  }
  return user;
};
```