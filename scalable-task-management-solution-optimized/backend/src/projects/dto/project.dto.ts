import { IsString, IsNotEmpty, IsBoolean, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateProjectDto {
  @ApiProperty({ description: 'Name of the project', minLength: 1, maxLength: 255 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiProperty({ description: 'Description of the project', required: false, maxLength: 1000 })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;
}

export class UpdateProjectDto {
  @ApiProperty({ description: 'Updated name of the project', required: false, minLength: 1, maxLength: 255 })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name?: string;

  @ApiProperty({ description: 'Updated description of the project', required: false, maxLength: 1000 })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiProperty({ description: 'Project completion status', required: false })
  @IsOptional()
  @IsBoolean()
  isCompleted?: boolean;
}