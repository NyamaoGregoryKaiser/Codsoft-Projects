import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import dashboardReducer from './dashboardSlice';
import dataSourceReducer from './dataSourceSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    dashboards: dashboardReducer,
    dataSources: dataSourceReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;