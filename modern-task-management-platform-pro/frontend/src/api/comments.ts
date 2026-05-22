```typescript
import axiosInstance from './axiosInstance';
import { Comment, PaginatedResponse, ApiResponse } from 'types';

interface CreateCommentPayload {
  content: string;
}

interface UpdateCommentPayload {
  content?: string;
}

export const createComment = async (taskId: string, payload: CreateCommentPayload): Promise<ApiResponse<Comment>> => {
  const response = await axiosInstance.post<ApiResponse<Comment>>(`/tasks/${taskId}/comments`, payload);
  return response.data;
};

export const getCommentsByTask = async (taskId: string, page: number = 1, limit: number = 10): Promise<ApiResponse<PaginatedResponse<Comment>>> => {
  const response = await axiosInstance.get<ApiResponse<PaginatedResponse<Comment>>>(`/tasks/${taskId}/comments?page=${page}&limit=${limit}`);
  return response.data;
};

export const getCommentById = async (commentId: string): Promise<ApiResponse<Comment>> => {
  const response = await axiosInstance.get<ApiResponse<Comment>>(`/tasks/any/comments/${commentId}`); // The taskId param is merged
  return response.data;
};

export const updateComment = async (commentId: string, payload: UpdateCommentPayload): Promise<ApiResponse<Comment>> => {
  const response = await axiosInstance.patch<ApiResponse<Comment>>(`/tasks/any/comments/${commentId}`, payload);
  return response.data;
};

export const deleteComment = async (commentId: string): Promise<ApiResponse<null>> => {
  const response = await axiosInstance.delete<ApiResponse<null>>(`/tasks/any/comments/${commentId}`);
  return response.data;
};
```