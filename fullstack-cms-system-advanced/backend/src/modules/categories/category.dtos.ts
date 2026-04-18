import { IsString, IsNotEmpty, IsOptional, MinLength, MaxLength, Matches } from 'class-validator';

export class CreateCategoryDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(100)
  name!: string;

  @IsString()
  @IsOptional()
  @MinLength(3)
  @MaxLength(100)
  // Regex for URL-friendly slug (lowercase, alphanumeric, hyphens, no leading/trailing hyphens)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, { message: 'Slug must be URL-friendly (lowercase, alphanumeric, hyphens)' })
  slug?: string; // If not provided, will be generated from name

  @IsString()
  @IsOptional()
  @MaxLength(255)
  description?: string;
}

export class UpdateCategoryDto {
  @IsString()
  @IsOptional()
  @MinLength(3)
  @MaxLength(100)
  name?: string;

  @IsString()
  @IsOptional()
  @MinLength(3)
  @MaxLength(100)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, { message: 'Slug must be URL-friendly (lowercase, alphanumeric, hyphens)' })
  slug?: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  description?: string;
}