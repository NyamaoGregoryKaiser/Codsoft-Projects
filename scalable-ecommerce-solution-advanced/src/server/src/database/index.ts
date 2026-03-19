import { DataSource } from 'typeorm';
import { DB_HOST, DB_PORT, DB_USERNAME, DB_PASSWORD, DB_DATABASE } from '../config/env';
import { User } from './entities/User.entity';
import { Product } from './entities/Product.entity';
import { Category } from './entities/Category.entity';
import { Cart } from './entities/Cart.entity';
import { CartItem } from './entities/CartItem.entity';
import { Order } from './entities/Order.entity';
import { OrderItem } from './entities/OrderItem.entity';
import path from 'path';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: DB_HOST,
  port: DB_PORT,
  username: DB_USERNAME,
  password: DB_PASSWORD,
  database: DB_DATABASE,
  synchronize: false, // Set to true only for development, use migrations for production
  logging: ['query', 'error'],
  entities: [User, Product, Category, Cart, CartItem, Order, OrderItem],
  migrations: [path.join(__dirname, 'migrations/*.ts')],
  subscribers: [],
});