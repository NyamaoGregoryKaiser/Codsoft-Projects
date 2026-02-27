import { User as PrismaUser, Product as PrismaProduct, Order as PrismaOrder, OrderItem as PrismaOrderItem, Cart as PrismaCart, CartItem as PrismaCartItem } from '@prisma/client';

export interface User extends PrismaUser {
    password?: string; // Optional for security, should not be returned by API
}

export interface Product extends PrismaProduct {}

export interface CartItem extends PrismaCartItem {
    product?: Product;
}

export interface Cart extends PrismaCart {
    items?: CartItem[];
}

export interface OrderItem extends PrismaOrderItem {
    product?: Product;
}

export interface Order extends PrismaOrder {
    items?: OrderItem[];
    user?: User;
}

export enum UserRole {
    CUSTOMER = 'CUSTOMER',
    ADMIN = 'ADMIN',
}

export interface AuthRequest extends Request {
    userId?: string;
    userRole?: UserRole;
}

export interface JwtPayload {
    userId: string;
    role: UserRole;
}

// DTOs (Data Transfer Objects) for request validation
export type CreateProductDTO = {
    name: string;
    description: string;
    price: number;
    stock: number;
    imageUrl?: string;
};

export type UpdateProductDTO = Partial<CreateProductDTO>;

export type RegisterUserDTO = Pick<User, 'email' | 'password' | 'firstName' | 'lastName'>;
export type LoginUserDTO = Pick<User, 'email' | 'password'>;