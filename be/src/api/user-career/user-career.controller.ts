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
import { ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { UserCareerService } from './user-career.service';
import { RequestUserCareerCreateDto } from 'src/api/user-career/dto/requests/create.dto';
import { RequestUserCareerUpdateDto } from 'src/api/user-career/dto/requests/update.dto';
import { UserCareerListQueryDto } from 'src/api/user-career/dto/requests/list.query.dto';
import { GoogleDriveService } from 'src/common/google-drive/google-drive.service';

@ApiTags('user-career')
@Controller('user-career')
export class UserCareerController {
  constructor(
    private readonly service: UserCareerService,
    private readonly googleDrive: GoogleDriveService,
  ) { }

  @Post()
  @UseInterceptors(FileInterceptor('cv'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        tanggal: { type: 'string', example: '2024-05-20' },
        nama: { type: 'string', example: 'Budi Santoso' },
        no_hp: { type: 'string', example: '081234567890' },
        email: { type: 'string', example: 'budi@example.com' },
        alamat: { type: 'string', example: 'Jl. Merdeka No. 123, Jakarta' },
        status: { type: 'string', enum: ['PENDING', 'INTERVIEW', 'HIRED', 'REJECT'], example: 'PENDING' },
        jenis_kelamin: { type: 'string', enum: ['LAKI_LAKI', 'PEREMPUAN'], example: 'LAKI_LAKI' },
        kota: { type: 'string', example: 'Jakarta' },
        tanggal_lahir: { type: 'string', example: '1995-05-20' },
        cv: { type: 'string', format: 'binary' },
      },
      required: ['tanggal', 'nama', 'no_hp', 'email', 'alamat', 'jenis_kelamin', 'kota', 'cv'],
    },
  })
  async create(@Body() dto: RequestUserCareerCreateDto, @UploadedFile() cv?: Express.Multer.File) {
    if (!cv) {
      throw new BadRequestException('CV file is required');
    }

    // Validate file is PDF
    if (cv.mimetype !== 'application/pdf') {
      throw new BadRequestException('CV file must be a PDF');
    }

    // Generate unique filename
    const timestamp = Date.now();
    const sanitizedName = dto.nama.replace(/[^a-zA-Z0-9]/g, '_');
    const filename = `CV_${sanitizedName}_${timestamp}.pdf`;

    // Upload to Google Drive
    const driveFile = await this.googleDrive.uploadFile(
      cv.buffer,
      filename,
      cv.mimetype,
    );

    const payload: RequestUserCareerCreateDto = {
      ...dto,
      cv_link: driveFile.webViewLink,
    };

    return this.service.create(payload);
  }

  @Get()
  findAll(@Query() query: UserCareerListQueryDto) {
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
      status: query.status,
      sortBy: query.sortBy,
      sortOrder,
    });
  }

  @Get('export/excel')
  async exportExcel(
    @Query() query: UserCareerListQueryDto,
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
      status: query.status,
      sortBy: query.sortBy,
      sortOrder,
    });

    const timestamp = new Date().toISOString().slice(0, 10);
    const filename = `data-pelamar-${timestamp}.xlsx`;

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
  @UseInterceptors(FileInterceptor('cv'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        tanggal: { type: 'string', example: '2024-05-20' },
        nama: { type: 'string', example: 'Budi Santoso' },
        no_hp: { type: 'string', example: '081234567890' },
        email: { type: 'string', example: 'budi@example.com' },
        alamat: { type: 'string', example: 'Jl. Merdeka No. 123, Jakarta' },
        status: { type: 'string', enum: ['PENDING', 'INTERVIEW', 'HIRED', 'REJECT'], example: 'PENDING' },
        jenis_kelamin: { type: 'string', enum: ['LAKI_LAKI', 'PEREMPUAN'], example: 'LAKI_LAKI' },
        kota: { type: 'string', example: 'Jakarta' },
        tanggal_lahir: { type: 'string', example: '1995-05-20' },
        cv: { type: 'string', format: 'binary' },
      },
    },
  })
  async update(
    @Param('id') id: string,
    @Body() dto: RequestUserCareerUpdateDto,
    @UploadedFile() cv?: Express.Multer.File,
  ) {
    // Validate file is PDF if uploaded
    if (cv && cv.mimetype !== 'application/pdf') {
      throw new BadRequestException('CV file must be a PDF');
    }

    let cvLink: string | undefined;

    if (cv) {
      // Generate unique filename
      const timestamp = Date.now();
      const sanitizedName = dto.nama || 'Unknown';
      const filename = `CV_${sanitizedName.replace(/[^a-zA-Z0-9]/g, '_')}_${timestamp}.pdf`;

      // Upload to Google Drive
      const driveFile = await this.googleDrive.uploadFile(
        cv.buffer,
        filename,
        cv.mimetype,
      );

      cvLink = driveFile.webViewLink;
    }

    const payload: RequestUserCareerUpdateDto = {
      ...dto,
      ...(cvLink ? { cv_link: cvLink } : {}),
    };

    return this.service.update(id, payload);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
