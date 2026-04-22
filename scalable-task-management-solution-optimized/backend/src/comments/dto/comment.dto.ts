import { IsString, IsNotEmpty, IsUUID, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCommentDto {
  @ApiProperty({ description: 'Content of the comment', minLength: 1, maxLength: 2000 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  content: string;

  @ApiProperty({ description: 'ID of the task this comment belongs to' })
  @IsUUID()
  @IsNotEmpty()
  taskId: string;
}

export class UpdateCommentDto {
  @ApiProperty({ description: 'Updated content of the comment', required: false, minLength: 1, maxLength: 2000 })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  content?: string;
}