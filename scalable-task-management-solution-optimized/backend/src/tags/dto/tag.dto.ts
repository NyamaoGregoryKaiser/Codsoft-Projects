import { IsString, IsNotEmpty, IsOptional, Matches, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTagDto {
  @ApiProperty({ description: 'Unique name of the tag (case-insensitive)', minLength: 1, maxLength: 50 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  name: string;

  @ApiProperty({ description: 'Hex color code for the tag (e.g., #FF0000)', required: false, pattern: '^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$' })
  @IsOptional()
  @IsString()
  @Matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, { message: 'Color must be a valid hex code (e.g., #RRGGBB or #RGB)' })
  color?: string;
}

export class UpdateTagDto {
  @ApiProperty({ description: 'Updated unique name of the tag (case-insensitive)', required: false, minLength: 1, maxLength: 50 })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  name?: string;

  @ApiProperty({ description: 'Updated hex color code for the tag', required: false, pattern: '^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$' })
  @IsOptional()
  @IsString()
  @Matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, { message: 'Color must be a valid hex code (e.g., #RRGGBB or #RGB)' })
  color?: string;
}