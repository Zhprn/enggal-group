import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import type { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBody,
  ApiConsumes,
  ApiTags,
  ApiPropertyOptional,
} from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';
import { MembershipService } from './membership.service';
import { RequestMembershipCreateDto } from 'src/api/membership/dto/requests/create.dto';
import { RequestMembershipUpdateDto } from 'src/api/membership/dto/requests/update.dto';
import { MembershipListQueryDto } from 'src/api/membership/dto/requests/list.query.dto';
import { uploadDiskStorage } from 'src/api/upload/upload.storage';
import type { StoredFile } from 'src/api/upload/upload.types';

class RequestMembershipTemplateConfigDto {
  @ApiPropertyOptional({ example: '#333333' })
  @IsOptional()
  @IsString()
  textColor?: string;

  @ApiPropertyOptional({ example: 12 })
  @IsOptional()
  @IsNumber()
  fontSize?: number;
}

@ApiTags('membership')
@Controller('membership')
export class MembershipController {
  constructor(private readonly service: MembershipService) {}

  @Post()
  async create(@Body() dto: RequestMembershipCreateDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll(@Query() query: MembershipListQueryDto) {
    const page = Math.max(1, parseInt(query.page ?? '1', 10) || 1);
    const limitRaw = parseInt(query.limit ?? '10', 10) || 10;
    const limit = Math.min(Math.max(1, limitRaw), 100);
    let startDate = query.startDate ? new Date(query.startDate) : undefined;
    let endDate = query.endDate ? new Date(query.endDate) : undefined;

    if (startDate && Number.isNaN(startDate.getTime())) {
      throw new BadRequestException('Invalid startDate');
    }

    if (endDate && Number.isNaN(endDate.getTime())) {
      throw new BadRequestException('Invalid endDate');
    }

    if (startDate && !query.startDate?.includes('T')) {
      startDate.setUTCHours(0, 0, 0, 0);
    }

    if (endDate && !query.endDate?.includes('T')) {
      endDate.setUTCHours(23, 59, 59, 999);
    }

    if (startDate && endDate && startDate > endDate) {
      throw new BadRequestException(
        'startDate must be before or equal to endDate',
      );
    }

    // Validate sortOrder
    const sortOrder = query.sortOrder === 'asc' ? 'asc' : 'desc';

    return this.service.findAll({
      page,
      limit,
      startDate,
      endDate,
      sortBy: query.sortBy,
      sortOrder,
    });
  }

  @Get('template')
  getTemplate() {
    return this.service.getTemplate();
  }

  @Get('template/config')
  async getConfig() {
    return this.service.getConfig();
  }

  @Post('template/config')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        textColor: {
          type: 'string',
          example: '#333333',
          description: 'Text color in hex format (e.g., #333333)',
        },
        fontSize: {
          type: 'number',
          example: 12,
          description: 'Font size in pixels',
        },
      },
    },
  })
  async updateConfig(@Body() dto: RequestMembershipTemplateConfigDto) {
    return this.service.updateConfig(dto);
  }

  @Get('export/excel')
  async exportExcel(
    @Query() query: MembershipListQueryDto,
    @Res() res: Response,
  ) {
    let startDate = query.startDate ? new Date(query.startDate) : undefined;
    let endDate = query.endDate ? new Date(query.endDate) : undefined;

    if (startDate && Number.isNaN(startDate.getTime())) {
      throw new BadRequestException('Invalid startDate');
    }

    if (endDate && Number.isNaN(endDate.getTime())) {
      throw new BadRequestException('Invalid endDate');
    }

    if (startDate && !query.startDate?.includes('T')) {
      startDate.setUTCHours(0, 0, 0, 0);
    }

    if (endDate && !query.endDate?.includes('T')) {
      endDate.setUTCHours(23, 59, 59, 999);
    }

    if (startDate && endDate && startDate > endDate) {
      throw new BadRequestException(
        'startDate must be before or equal to endDate',
      );
    }

    const sortOrder = query.sortOrder === 'asc' ? 'asc' : 'desc';

    const buffer = await this.service.exportExcel({
      startDate,
      endDate,
      sortBy: query.sortBy,
      sortOrder,
    });

    const timestamp = new Date().toISOString().slice(0, 10);
    const filename = `data-membership-${timestamp}.xlsx`;

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${filename}"`,
    );

    res.send(buffer);
  }
  
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: RequestMembershipUpdateDto,
  ) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  @Post('template/front')
  @UseInterceptors(
    FileInterceptor('frontImage', { storage: uploadDiskStorage }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        frontImage: { type: 'string', format: 'binary' },
      },
      required: ['frontImage'],
    },
  })
  async uploadFrontTemplate(@UploadedFile() file: StoredFile) {
    if (!file) {
      throw new BadRequestException('frontImage file is required');
    }
    return this.service.updateFrontTemplate(file);
  }

  @Post('template/back')
  @UseInterceptors(FileInterceptor('backImage', { storage: uploadDiskStorage }))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        backImage: { type: 'string', format: 'binary' },
      },
      required: ['backImage'],
    },
  })
  async uploadBackTemplate(@UploadedFile() file: StoredFile) {
    if (!file) {
      throw new BadRequestException('backImage file is required');
    }
    return this.service.updateBackTemplate(file);
  }
}
