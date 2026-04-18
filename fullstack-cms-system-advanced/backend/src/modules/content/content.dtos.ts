import { IsString, IsNotEmpty, IsOptional, MinLength, MaxLength, IsEnum, IsUUID, Matches, IsArray } from 'class-validator';
import { Type } from 'class-transformer';
import { ContentStatus } from '../../entities/Content';

export class CreateContentDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  @MaxLength(255)
  title!: string;

  @IsString()
  @IsOptional()
  @MinLength(5)
  @MaxLength(255)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, { message: 'Slug must be URL-friendly (lowercase, alphanumeric, hyphens)' })
  slug?: string;

  @IsString()
  @IsNotEmpty()
  body!: string;

  @IsEnum(ContentStatus)
  @IsOptional()
  status?: ContentStatus = ContentStatus.DRAFT;

  @IsString()
  @IsUUID()
  @IsOptional() // In a real app, this might be required, but for this demo, the author is from req.user
  authorId?: string;

  @IsString()
  @IsUUID()
  @IsOptional()
  categoryId?: string;

  @IsArray()
  @IsString({ each: true })
  @IsUUID('4', { each: true })
  @IsOptional()
  tagIds?: string[];
}

export class UpdateContentDto {
  @IsString()
  @IsOptional()
  @MinLength(5)
  @MaxLength(255)
  title?: string;

  @IsString()
  @IsOptional()
  @MinLength(5)
  @MaxLength(255)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, { message: 'Slug must be URL-friendly (lowercase, alphanumeric, hyphens)' })
  slug?: string;

  @IsString()
  @IsOptional()
  body?: string;

  @IsEnum(ContentStatus)
  @IsOptional()
  status?: ContentStatus;

  @IsString()
  @IsUUID()
  @IsOptional()
  categoryId?: string | null; // Allow null to remove category

  @IsArray()
  @IsString({ each: true })
  @IsUUID('4', { each: true })
  @IsOptional()
  tagIds?: string[];
}