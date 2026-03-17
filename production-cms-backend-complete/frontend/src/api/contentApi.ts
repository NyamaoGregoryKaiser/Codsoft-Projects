import axiosInstance from './axiosInstance';
import { Content, ContentStatus, ApiResponse, PaginationMeta } from '../types';

interface CreateContentData {
  title: string;
  body: string;
  categoryId: string;
  thumbnailUrl?: string;
  status?: ContentStatus;
  isFeatured?: boolean;
}

interface UpdateContentData {
  title?: string;
  body?: string;
  categoryId?: string;
  thumbnailUrl?: string;
  status?: ContentStatus;
  isFeatured?: boolean;
}

interface FetchContentParams {
  page?: number;
  limit?: number;
  status?: ContentStatus;
  search?: string;
}

export const fetchContent = async (params?: FetchContentParams): Promise<ApiResponse<Content[]>> => {
  const queryString = new URLSearchParams();
  if (params?.page) queryString.append('page', params.page.toString());
  if (params?.limit) queryString.append('limit', params.limit.toString());
  if (params?.status) queryString.append('status', params.status);
  if (params?.search) queryString.append('search', params.search);

  const response = await axiosInstance.get<ApiResponse<Content[]>>(`/content?${queryString.toString()}`);
  return response.data;
};

export const fetchContentById = async (id: string): Promise<ApiResponse<Content>> => {
  const response = await axiosInstance.get<ApiResponse<Content>>(`/content/${id}`);
  return response.data;
};

export const createContent = async (data: CreateContentData): Promise<ApiResponse<Content>> => {
  const response = await axiosInstance.post<ApiResponse<Content>>('/content', data);
  return response.data;
};

export const updateContent = async (id: string, data: UpdateContentData): Promise<ApiResponse<Content>> => {
  const response = await axiosInstance.put<ApiResponse<Content>>(`/content/${id}`, data);
  return response.data;
};

export const deleteContent = async (id: string): Promise<ApiResponse<void>> => {
  const response = await axiosInstance.delete<ApiResponse<void>>(`/content/${id}`);
  return response.data;
};