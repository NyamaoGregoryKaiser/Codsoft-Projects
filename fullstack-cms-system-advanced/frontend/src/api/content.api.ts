import axiosInstance from './axiosInstance';
import { Content, CreateContentDto, UpdateContentDto, Category, Tag } from '../types';

// Public access
export const getPublishedContent = async (): Promise<Content[]> => {
  const response = await axiosInstance.get('/content');
  return response.data;
};

export const getPublishedContentByIdOrSlug = async (idOrSlug: string): Promise<Content> => {
  const response = await axiosInstance.get(`/content/${idOrSlug}`);
  return response.data;
};

// Admin/Editor access
export const getAllContentAdmin = async (): Promise<Content[]> => {
  const response = await axiosInstance.get('/content/admin/all');
  return response.data;
};

export const getContentAdminByIdOrSlug = async (idOrSlug: string): Promise<Content> => {
  const response = await axiosInstance.get(`/content/admin/${idOrSlug}`);
  return response.data;
};

export const createContent = async (data: CreateContentDto): Promise<Content> => {
  const response = await axiosInstance.post('/content', data);
  return response.data;
};

export const updateContent = async (id: string, data: UpdateContentDto): Promise<Content> => {
  const response = await axiosInstance.put(`/content/${id}`, data);
  return response.data;
};

export const deleteContent = async (id: string): Promise<void> => {
  await axiosInstance.delete(`/content/${id}`);
};

// Categories
export const getCategories = async (): Promise<Category[]> => {
  const response = await axiosInstance.get('/categories');
  return response.data;
};

// Tags
export const getTags = async (): Promise<Tag[]> => {
  const response = await axiosInstance.get('/tags');
  return response.data;
};