import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { RequestPromoCreateDto } from 'src/api/promo/dto/requests/create.dto';
import { RequestPromoUpdateDto } from 'src/api/promo/dto/requests/update.dto';
import { Status } from '@prisma/client';

@Injectable()
export class PromoService {
  constructor(private prisma: PrismaService) { }

  async create(dto: RequestPromoCreateDto) {
    if (!dto.brandId) {
      throw new BadRequestException('brandId is required');
    }

    const brand = await this.prisma.brand.findUnique({
      where: { id: dto.brandId },
    });
    if (!brand) {
      throw new NotFoundException('Brand not found');
    }

    if (!dto.image) {
      throw new BadRequestException('image is required');
    }

    return this.prisma.promo.create({
      data: {
        title: dto.title,
        subtitle: dto.subtitle,
        description: dto.description,
        syaratKetentuan: dto.syaratKetentuan,
        berlakuHingga: new Date(dto.berlakuHingga),
        brandId: dto.brandId,
        image: dto.image,
        banner: dto.banner,
        showBanner: dto.showBanner ?? false,
        status: Status.aktif,
      },
      include: { brand: true },
    });
  }

  async findAll({
    page = 1,
    limit = 10,
    brandId,
    status,
    startDate,
    endDate,
    sortBy,
    sortOrder = 'desc',
  }: {
    page?: number;
    limit?: number;
    brandId?: string;
    status?: Status;
    startDate?: Date;
    endDate?: Date;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    const skip = (page - 1) * limit;
    const where: Prisma.PromoWhereInput = {};

    if (brandId) {
      where.brandId = brandId;
    }
    if (status) {
      where.status = status;
    }

    if (startDate || endDate) {
      const berlakuHinggaFilter: Prisma.DateTimeFilter = {};
      if (startDate) {
        berlakuHinggaFilter.gte = startDate;
      }
      if (endDate) {
        berlakuHinggaFilter.lte = endDate;
      }
      where.berlakuHingga = berlakuHinggaFilter;
    }

    const orderBy: any = {};
    if (sortBy) {
      if (sortBy === 'brand.nama') {
        orderBy.brand = { nama: sortOrder };
      } else {
        const validSortFields = [
          'title',
          'subtitle',
          'status',
          'berlakuHingga',
          'description',
          'syaratKetentuan',
          'image',
          'banner',
          'showBanner',
        ];
        if (validSortFields.includes(sortBy)) {
          orderBy[sortBy] = sortOrder;
        } else {
          orderBy.berlakuHingga = 'desc';
        }
      }
    } else {
      orderBy.berlakuHingga = 'desc';
    }

    const [total, rows] = await this.prisma.$transaction([
      this.prisma.promo.count({ where }),
      this.prisma.promo.findMany({
        skip,
        take: limit,
        orderBy,
        where,
        select: {
          id: true,
          title: true,
          subtitle: true,
          status: true,
          description: true,
          syaratKetentuan: true,
          berlakuHingga: true,
          brandId: true,
          image: true,
          banner: true,
          showBanner: true,
          brand: {
            select: { id: true, nama: true },
          },
        },
      }),
    ]);

    return {
      data: rows,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }

  async findBanners() {
    const promos = await this.prisma.promo.findMany({
      where: {
        status: Status.aktif,
        showBanner: true,
        banner: { not: null },
      },
      select: {
        id: true,
        title: true,
        banner: true,
        status: true,
        berlakuHingga: true,
        brand: {
          select: { id: true, nama: true },
        },
      },
      orderBy: { berlakuHingga: 'desc' },
    });

    return { data: promos };
  }

  async findOne(id: string) {
    const promo = await this.prisma.promo.findUnique({
      where: { id },
      include: { brand: true },
    });
    if (!promo) {
      throw new NotFoundException('Promo not found');
    }
    return promo;
  }

  async update(id: string, dto: RequestPromoUpdateDto & { status?: Status }) {
    const existing = await this.prisma.promo.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Promo not found');
    }

    if (dto.brandId) {
      const brand = await this.prisma.brand.findUnique({
        where: { id: dto.brandId },
      });
      if (!brand) {
        throw new NotFoundException('Brand not found');
      }
    }

    return this.prisma.promo.update({
      where: { id },
      data: {
        title: dto.title ?? undefined,
        subtitle: dto.subtitle ?? undefined,
        description: dto.description ?? undefined,
        syaratKetentuan: dto.syaratKetentuan ?? undefined,
        berlakuHingga: dto.berlakuHingga
          ? new Date(dto.berlakuHingga)
          : undefined,
        brandId: dto.brandId ?? undefined,
        image: dto.image ?? undefined,
        banner: dto.banner ?? undefined,
        showBanner: dto.showBanner ?? undefined,
        status: dto.status ?? undefined,
      },
      include: { brand: true },
    });
  }

  async updateStatus(id: string, status: Status) {
    const existing = await this.prisma.promo.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Promo not found');
    }

    return this.prisma.promo.update({
      where: { id },
      data: { status },
      include: {
        brand: {
          select: { id: true, nama: true },
        },
      },
    });
  }

  async remove(id: string) {
    const existing = await this.prisma.promo.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Promo not found');
    }
    await this.prisma.promo.delete({ where: { id } });
    return { success: true };
  }
}
