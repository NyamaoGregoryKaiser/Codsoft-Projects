export interface Product {
    id: string;
    name: string;
    description?: string;
    price: number;
    stock: number;
    imageUrl?: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: 'CUSTOMER' | 'ADMIN';
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface AuthResponse {
    token: string;
    user: User;
}

export interface CartItem {
    id: string;
    productId: string;
    product?: Product; // Populated from backend
    quantity: number;
}

export interface Cart {
    id: string;
    userId: string;
    items: CartItem[];
}

export interface OrderItem {
    id: string;
    productId: string;
    product?: Product;
    quantity: number;
    price: number; // Price at the time of order
}

export interface Order {
    id: string;
    userId: string;
    user?: User;
    totalAmount: number;
    status: 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
    shippingAddress?: string;
    billingAddress?: string;
    paymentIntentId?: string;
    createdAt: string;
    updatedAt: string;
    items: OrderItem[];
}