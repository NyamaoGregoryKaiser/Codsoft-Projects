```typescript
import jwt from 'jsonwebtoken';
import { AppDataSource } from '../../database/data-source';
import { User, UserRole } from '../../database/entities/user.entity';
import { CreateUserDto, LoginUserDto } from './auth.dto';
import { config } from '../../config/config';
import { ConflictError, UnauthorizedError, BadRequestError } from '../../utils/errors';
import logger from '../../utils/logger';

const userRepository = AppDataSource.getRepository(User);

export const signToken = (id: string): string => {
  return jwt.sign({ id }, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  });
};

export const getJwtCookieExpiration = (): number => {
  return config.jwt.cookieExpiresIn;
};

export const registerUser = async (createUserDto: CreateUserDto): Promise<User> => {
  const { email, password, firstName, lastName } = createUserDto;

  // Check if user already exists
  const existingUser = await userRepository.findOneBy({ email });
  if (existingUser) {
    throw new ConflictError('User with this email already exists.');
  }

  const newUser = new User();
  newUser.email = email;
  newUser.firstName = firstName;
  newUser.lastName = lastName;
  newUser.password = password; // Raw password, will be hashed by entity method
  newUser.role = UserRole.MEMBER; // Default role for new registrations

  await newUser.hashPassword(); // Hash the password before saving

  try {
    const savedUser = await userRepository.save(newUser);
    logger.info(`User registered successfully: ${savedUser.email}`);
    return savedUser;
  } catch (error: any) {
    logger.error(`Error registering user ${email}:`, error);
    // Handle potential database errors (e.g., unique constraint violation for email, though checked above)
    throw new BadRequestError('Could not register user. Please try again.');
  }
};

export const loginUser = async (loginUserDto: LoginUserDto): Promise<User> => {
  const { email, password } = loginUserDto;

  if (!email || !password) {
    throw new BadRequestError('Please provide email and password.');
  }

  const user = await userRepository.findOne({
    where: { email },
    select: ['id', 'email', 'firstName', 'lastName', 'password', 'role', 'createdAt', 'updatedAt'], // Explicitly select password
  });

  if (!user || !(await user.comparePassword(password))) {
    throw new UnauthorizedError('Incorrect email or password.');
  }

  logger.info(`User logged in successfully: ${user.email}`);
  return user;
};
```