import request from 'supertest';
import app from '../app'; // Your express app
import prisma from '../models/prisma';
import { generateToken } from '../utils/jwt';
import { UserRole, Product } from '../types';

// Mock prisma for tests
jest.mock('../models/prisma', () => ({
    product: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
    },
    // Mock user for auth middleware if needed
    user: {
        findUnique: jest.fn(),
    },
    $connect: jest.fn(),
    $disconnect: jest.fn(),
}));

// Mock cache for tests
jest.mock('../utils/cache');
jest.mock('../config/logger'); // Mock logger

const mockPrisma = prisma as jest.Mocked<typeof prisma>;

describe('Product API Integration Tests', () => {
    const adminToken = generateToken('adminId', UserRole.ADMIN);
    const customerToken = generateToken('customerId', UserRole.CUSTOMER);

    const mockProducts: Product[] = [
        { id: 'p1', name: 'Product A', description: 'Desc A', price: 10.00, stock: 5, imageUrl: '', isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: 'p2', name: 'Product B', description: 'Desc B', price: 20.00, stock: 10, imageUrl: '', isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    ];

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('GET /api/products', () => {
        it('should return all products for a public user', async () => {
            mockPrisma.product.findMany.mockResolvedValueOnce(mockProducts);

            const res = await request(app).get('/api/products');

            expect(res.statusCode).toEqual(200);
            expect(res.body).toEqual(mockProducts);
            expect(mockPrisma.product.findMany).toHaveBeenCalledTimes(1);
        });

        it('should filter products by name', async () => {
            mockPrisma.product.findMany.mockResolvedValueOnce([mockProducts[0]]);

            const res = await request(app).get('/api/products?name=Product A');

            expect(res.statusCode).toEqual(200);
            expect(res.body).toEqual([mockProducts[0]]);
            expect(mockPrisma.product.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { name: { contains: 'Product A', mode: 'insensitive' } },
                })
            );
        });
    });

    describe('GET /api/products/:id', () => {
        it('should return a single product by id for a public user', async () => {
            mockPrisma.product.findUnique.mockResolvedValueOnce(mockProducts[0]);

            const res = await request(app).get(`/api/products/${mockProducts[0].id}`);

            expect(res.statusCode).toEqual(200);
            expect(res.body).toEqual(mockProducts[0]);
            expect(mockPrisma.product.findUnique).toHaveBeenCalledWith({ where: { id: mockProducts[0].id } });
        });

        it('should return 404 if product not found', async () => {
            mockPrisma.product.findUnique.mockResolvedValueOnce(null);

            const res = await request(app).get('/api/products/nonexistent');

            expect(res.statusCode).toEqual(404);
            expect(res.body).toHaveProperty('message', 'Product not found.');
        });
    });

    describe('POST /api/products', () => {
        const newProductData = {
            name: 'New Gadget',
            description: 'A cool new gadget.',
            price: 250.00,
            stock: 30,
            imageUrl: 'http://example.com/new-gadget.jpg'
        };

        it('should allow admin to create a new product', async () => {
            mockPrisma.product.create.mockResolvedValueOnce({ ...mockProducts[0], ...newProductData, id: 'p3' });

            const res = await request(app)
                .post('/api/products')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(newProductData);

            expect(res.statusCode).toEqual(201);
            expect(res.body).toHaveProperty('name', newProductData.name);
            expect(mockPrisma.product.create).toHaveBeenCalledWith({ data: newProductData });
        });

        it('should deny customer from creating a product', async () => {
            const res = await request(app)
                .post('/api/products')
                .set('Authorization', `Bearer ${customerToken}`)
                .send(newProductData);

            expect(res.statusCode).toEqual(403);
            expect(res.body).toHaveProperty('message', 'Authorization failed: You do not have permission to perform this action');
            expect(mockPrisma.product.create).not.toHaveBeenCalled();
        });

        it('should deny unauthenticated user from creating a product', async () => {
            const res = await request(app)
                .post('/api/products')
                .send(newProductData);

            expect(res.statusCode).toEqual(401);
            expect(res.body).toHaveProperty('message', 'Authentication required: No token provided');
        });
    });

    // Similar tests for PUT /api/products/:id and DELETE /api/products/:id
});