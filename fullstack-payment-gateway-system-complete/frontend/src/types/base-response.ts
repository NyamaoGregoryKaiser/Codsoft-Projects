export interface BaseResponseDto {
  success: boolean;
  message: string;
}

export interface PaginatedResponseDto<T> extends BaseResponseDto {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  data: T[];
}