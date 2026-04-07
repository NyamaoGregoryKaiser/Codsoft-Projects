import { api } from './index';
import { Database, DatabaseCreate, DatabaseUpdate } from '@types';

export const databasesApi = {
  getDatabases: () =>
    api.get<Database[]>('/databases'),
  getDatabaseById: (dbId: number) =>
    api.get<Database>(`/databases/${dbId}`),
  createDatabase: (data: DatabaseCreate) =>
    api.post<Database, DatabaseCreate>('/databases/', data),
  updateDatabase: (dbId: number, data: DatabaseUpdate) =>
    api.put<Database, DatabaseUpdate>(`/databases/${dbId}`, data),
  deleteDatabase: (dbId: number) =>
    api.delete<Database>(`/databases/${dbId}`),
};