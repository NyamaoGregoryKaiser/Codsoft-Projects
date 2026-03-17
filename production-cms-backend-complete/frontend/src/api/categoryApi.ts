import axiosInstance from './axiosInstance';
import { Category, ApiResponse, PaginationMeta } from '../types';

interface CreateCategoryData {
  name: string;
  description?: string;
}

interface UpdateCategoryData {
  name?: string;
  description?: string;
}

export const fetchCategories = async (page: number = 1, limit: number = 10): Promise<ApiResponse<Category[]>> => {
  const response = await axiosInstance.get<ApiResponse<Category[]>>(`/categories?page=${page}&limit=${limit}`);
  return response.data;
};

export const fetchCategoryById = async (id: string): Promise<ApiResponse<Category>> => {
  const response = await axiosInstance.get<ApiResponse<Category>>(`/categories/${id}`);
  return response.data;
};

export const createCategory = async (data: CreateCategoryData): Promise<ApiResponse<Category>> => {
  const response = await axiosInstance.post<ApiResponse<Category>>('/categories', data);
  return response.data;
};

export const updateCategory = async (id: string, data: UpdateCategoryData): Promise<ApiResponse<Category>> => {
  const response = await axiosInstance.put<ApiResponse<Category>>(`/categories/${id}`, data);
  return response.data;
};

export const deleteCategory = async (id: string): Promise<ApiResponse<void>> => {
  const response = await axiosInstance.delete<ApiResponse<void>>(`/categories/${id}`);
  return response.data;
};