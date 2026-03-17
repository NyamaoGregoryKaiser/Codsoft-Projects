import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const JWT_SECRET = process.env.JWT_SECRET || "supersecretjwtkeythatshouldbechangedinproduction";
export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1h";