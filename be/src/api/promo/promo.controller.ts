import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { PromoService } from 'src/api/promo/promo.service';
import { RequestPromoCreateDto } from 'src/api/promo/dto/requests/create.dto';
import { RequestPromoUpdateDto } from 'src/api/promo/dto/requests/update.dto';
import { PromoListQueryDto } from 'src/api/promo/dto/requests/list.query.dto';
import { uploadDiskStorage } from 'src/api/upload/upload.storage';
import type { StoredFile } from 'src/api/upload/upload.types';
import { JwtAuthGuard } from '../auth/guard/jwt-guard.auth';
import { Status } from '@prisma/client';

@ApiTags('promo')
@Controller('promo')
export class PromoController {
  constructor(private readonly promoService: PromoService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'image', maxCount: 1 },
        { name: 'banner', maxCount: 1 },
      ],
      { storage: uploadDiskStorage },
    ),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string', example: 'Promo Spesial Akhir Tahun' },
        subtitle: {
          type: 'string',
          example: 'Diskon hingga 50% untuk semua produk',
        },
        description: {
          type: 'string',
          example:
            'Nikmati potongan harga besar untuk berbagai produk pilihan selama periode promo.',
        },
        syaratKetentuan: {
          type: 'string',
          example:
            'Berlaku untuk pembelian minimal Rp500.000 dan tidak dapat digabung dengan promo lain.',
        },
        berlakuHingga: { type: 'string', example: '2024-12-31' },
        brandId: { type: 'string', format: 'uuid' },
        image: { type: 'string', format: 'binary' },
        banner: { type: 'string', format: 'binary' },
        showBanner: { type: 'boolean', example: false },
      },
      required: [
        'title',
        'subtitle',
        'description',
        'syaratKetentuan',
        'berlakuHingga',
        'brandId',
        'image',
      ],
    },
  })
  create(
    @Body() dto: RequestPromoCreateDto,
    @UploadedFiles()
    files?: {
      image?: StoredFile[];
      banner?: StoredFile[];
    },
  ) {
    if (!files?.image?.[0]) {
      throw new BadRequestException('Image file is required');
    }

    const payload: RequestPromoCreateDto = {
      ...dto,
      image: `/uploads/${files.image[0].filename}`,
      ...(files.banner?.[0]
        ? { banner: `/uploads/${files.banner[0].filename}` }
        : {}),
    };

    return this.promoService.create(payload);
  }

  @Get()
  findAll(@Query() query: PromoListQueryDto) {
    const page = Math.max(1, parseInt(query.page ?? '1', 10) || 1);
    const limitRaw = parseInt(query.limit ?? '10', 10) || 10;
    const limit = Math.min(Math.max(1, limitRaw), 100);
    const startDate = query.startDate ? new Date(query.startDate) : undefined;
    const endDate = query.endDate ? new Date(query.endDate) : undefined;

    // Validate sortOrder
    const sortOrder = query.sortOrder === 'asc' ? 'asc' : 'desc';

    return this.promoService.findAll({
      page,
      limit,
      brandId: query.brandId,
      status: query.status,
      startDate,
      endDate,
      sortBy: query.sortBy,
      sortOrder,
    });
  }

  @Get('banner/list')
  findBanners() {
    return this.promoService.findBanners();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.promoService.findOne(id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'image', maxCount: 1 },
        { name: 'banner', maxCount: 1 },
      ],
      { storage: uploadDiskStorage },
    ),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string', example: 'Promo Spesial Akhir Tahun' },
        subtitle: {
          type: 'string',
          example: 'Diskon hingga 50% untuk semua produk',
        },
        description: {
          type: 'string',
          example:
            'Nikmati potongan harga besar untuk berbagai produk pilihan selama periode promo.',
        },
        syaratKetentuan: {
          type: 'string',
          example:
            'Berlaku untuk pembelian minimal Rp500.000 dan tidak dapat digabung dengan promo lain.',
        },
        berlakuHingga: { type: 'string', example: '2024-12-31' },
        brandId: { type: 'string', format: 'uuid' },
        image: { type: 'string', format: 'binary' },
        banner: { type: 'string', format: 'binary' },
        showBanner: { type: 'boolean', example: false },
      },
    },
  })
  update(
    @Param('id') id: string,
    @Body() dto: RequestPromoUpdateDto,
    @UploadedFiles()
    files?: {
      image?: StoredFile[];
      banner?: StoredFile[];
    },
  ) {
    const payload: RequestPromoUpdateDto = {
      ...dto,
      ...(files?.image?.[0] ? { image: `/uploads/${files.image[0].filename}` } : {}),
      ...(files?.banner?.[0] ? { banner: `/uploads/${files.banner[0].filename}` } : {}),
    };
    return this.promoService.update(id, payload);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard)
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', enum: ['aktif', 'archive'], example: 'archive' },
      },
      required: ['status'],
    },
  })
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: Status,
  ) {
    return this.promoService.updateStatus(id, status);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string) {
    return this.promoService.remove(id);
  }
}
