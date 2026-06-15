import { Router } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import targetDatabaseRoutes from './targetDatabase.routes';
import analysisReportRoutes from './analysisReport.routes';
import recommendationRoutes from './recommendation.routes';
import config from '../config';

const router = Router();

const defaultRoutes = [
  { path: '/auth', route: authRoutes },
  { path: '/users', route: userRoutes },
  { path: '/target-databases', route: targetDatabaseRoutes },
  { path: '/analysis-reports', route: analysisReportRoutes },
  { path: '/recommendations', route: recommendationRoutes },
];

defaultRoutes.forEach((route) => {
  router.use(route.path, route.route);
});

export default router;
```