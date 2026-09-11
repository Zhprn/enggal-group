import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { Status } from '@prisma/client';

export class PromoListQueryDto {
  @ApiPropertyOptional({ description: 'Page number (1-based)' })
  @IsOptional()
  @IsString()
  page?: string;

  @ApiPropertyOptional({ description: 'Items per page' })
  @IsOptional()
  @IsString()
  limit?: string;

  @ApiPropertyOptional({
    description: 'Filter by brand ID',
    example: '9b62c4d3-5f25-4f8f-83cf-3f49a6b8fd7c',
  })
  @IsOptional()
  @IsUUID()
  brandId?: string;
  @ApiPropertyOptional({
    enum: Status,
    description: 'Filter status aktif or archive',
    example: 'aktif',
  })
  @IsOptional()
  @IsEnum(Status, {
    message: 'Status most aktif or archive',
  })
  status?: Status;

  @ApiPropertyOptional({
    description:
      'Filter by berlakuHingga greater than or equal to this ISO date',
    example: '2024-01-01',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'Filter by berlakuHingga less than or equal to this ISO date',
    example: '2024-12-31',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Sort by field (title, berlakuHingga, brand.nama, etc.)',
    example: 'berlakuHingga',
  })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional({
    enum: ['asc', 'desc'],
    description: 'Sort order',
    example: 'desc',
  })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';

  constructor(dto: PromoListQueryDto) {
    Object.assign(this, dto);
  }
}