import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppDataSource } from '../database/data-source';
import { User } from '../entities/User';
import { Application } from '../entities/Application';
import { env } from '../config/env';
import { Logger } from '../config/winston';
import bcrypt from 'bcryptjs';

// --- JWT Authentication Middleware ---
export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded: any = jwt.verify(token, env.JWT_SECRET);

      const userRepository = AppDataSource.getRepository(User);
      const user = await userRepository.findOne({
        where: { id: decoded.id },
        select: ['id', 'username', 'email'], // Select specific fields, exclude passwordHash
      });

      if (!user) {
        res.status(401).json({ message: 'Not authorized, user not found' });
        return;
      }

      req.user = user;
      next();
    } catch (error) {
      Logger.error('JWT authentication error:', error);
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};

// --- API Key Authentication Middleware for Performance Data Ingestion ---
export const authenticateApiKey = async (req: Request, res: Response, next: NextFunction) => {
  const apiKey = req.headers['x-api-key'] as string;

  if (!apiKey) {
    Logger.warn('Attempted performance data ingestion without API key');
    return res.status(401).json({ message: 'API Key is required' });
  }

  try {
    const applicationRepository = AppDataSource.getRepository(Application);
    // Find application by hashed API key. We hash the incoming key to compare with the stored hash.
    // This assumes API_KEY_SECRET is used as a salt or part of the hashing process.
    // For simplicity, let's assume `apiKey` in DB is the raw key for this example,
    // but in a real-world scenario, you'd hash the provided API key and compare it to a stored hash.
    // Example: const hashedIncomingApiKey = await bcrypt.hash(apiKey, stored_salt);
    // For this example, we'll store and compare plain text, but strongly recommend hashing.
    const application = await applicationRepository.findOne({
      where: { apiKey: apiKey }, // In real app, this would be `hashedApiKey: hashedPasswordOfIncomingKey`
      select: ['id', 'ownerId', 'apiKey'], // Ensure apiKey is selectable for hashing logic
    });

    if (!application) {
      Logger.warn(`Invalid API Key provided: ${apiKey.substring(0, 10)}...`);
      return res.status(401).json({ message: 'Invalid API Key' });
    }

    // In a production setup, you would hash the incoming API key and compare it to a stored hash.
    // For instance, if application.apiKey stores a bcrypt hash of the actual key:
    // const isMatch = await bcrypt.compare(apiKey, application.apiKey);
    // if (!isMatch) { return res.status(401).json({ message: 'Invalid API Key' }); }
    // As per the Application entity, we store the raw key for simplicity here, but this is less secure.

    req.apiKeyApplication = {
      id: application.id,
      ownerId: application.ownerId,
    };
    next();
  } catch (error) {
    Logger.error('API Key authentication error:', error);
    res.status(500).json({ message: 'Server error during API Key authentication' });
  }
};

// --- Authorization Middleware ---
export const authorizeApplicationOwner = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  const applicationId = req.params.applicationId || req.body.applicationId;
  if (!applicationId) {
    return res.status(400).json({ message: 'Application ID is required' });
  }

  try {
    const applicationRepository = AppDataSource.getRepository(Application);
    const application = await applicationRepository.findOne({ where: { id: applicationId } });

    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    if (application.ownerId !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to access this application' });
    }

    next();
  } catch (error) {
    Logger.error('Authorization error:', error);
    res.status(500).json({ message: 'Server error during authorization' });
  }
};