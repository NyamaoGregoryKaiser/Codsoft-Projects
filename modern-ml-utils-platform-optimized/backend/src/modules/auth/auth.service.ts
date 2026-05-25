import * as bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import httpStatus from 'http-status';
import ApiError from '../../shared/errors/ApiError';
import config from '../../config';
import AppDataSource from '../../database/datasource';
import { User } from '../users/entities/User';
import { RegisterUserDTO, LoginUserDTO } from './auth.dto';

const userRepository = AppDataSource.getRepository(User);

export const registerUser = async (userData: RegisterUserDTO): Promise<User> => {
  if (await userRepository.findOne({ where: { email: userData.email } })) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Email already taken');
  }
  const hashedPassword = await bcrypt.hash(userData.password, 10);
  const user = userRepository.create({ ...userData, password: hashedPassword });
  await userRepository.save(user);
  return user;
};

export const loginUser = async (email: string, password: string): Promise<User> => {
  const user = await userRepository.findOne({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Incorrect email or password');
  }
  return user;
};

export const generateAuthToken = (userId: string): string => {
  const payload = { id: userId };
  return jwt.sign(payload, config.jwt.secret, { expiresIn: config.jwt.expiresIn });
};