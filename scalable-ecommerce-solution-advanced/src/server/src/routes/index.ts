import { Router } from 'express';
import authRoutes from './auth.routes';
import productRoutes from './product.routes';
// Import other routes (category, user, cart, order etc.)

const router = Router();

router.use('/auth', authRoutes);
router.use('/products', productRoutes);
// router.use('/categories', categoryRoutes);
// router.use('/users', userRoutes);
// router.use('/cart', cartRoutes);
// router.use('/orders', orderRoutes);

export default router;