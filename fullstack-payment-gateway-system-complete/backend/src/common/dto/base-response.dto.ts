import { ApiProperty } from '@nestjs/swagger';

export class BaseResponseDto {
  @ApiProperty({ description: 'Indicates if the operation was successful' })
  success: boolean;

  @ApiProperty({ description: 'A message describing the result of the operation' })
  message: string;
}

export class PaginatedResponseDto<T> extends BaseResponseDto {
  @ApiProperty({ description: 'The current page number' })
  page: number;

  @ApiProperty({ description: 'The number of items per page' })
  limit: number;

  @ApiProperty({ description: 'The total number of items available' })
  totalItems: number;

  @ApiProperty({ description: 'The total number of pages available' })
  totalPages: number;

  @ApiProperty({ isArray: true, description: 'The array of items for the current page' })
  data: T[];
}