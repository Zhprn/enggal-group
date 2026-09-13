import {
  Injectable,
  NotFoundException,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { EmailService } from 'src/common/email/email.service';
import { PdfService } from 'src/common/pdf/pdf.service';
import { GoogleSheetsService } from 'src/common/google-sheets/google-sheets.service';
import { RequestMembershipCreateDto } from 'src/api/membership/dto/requests/create.dto';
import { RequestMembershipUpdateDto } from 'src/api/membership/dto/requests/update.dto';
import { MEMBERSHIP_TEMPLATE } from './membership-template.constants';
import type { StoredFile } from 'src/api/upload/upload.types';
import type { MembershipTemplateConfig } from './membership-template.types';
import { Workbook } from 'exceljs';
import * as fs from 'fs/promises';
import * as path from 'path';

@Injectable()
export class MembershipService {
  private readonly logger = new Logger(MembershipService.name);

  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
    private pdfService: PdfService,
    private googleSheets: GoogleSheetsService,
    private configService: ConfigService,
  ) {}

  private async generateMembershipId(): Promise<string> {
    const year = new Date().getFullYear();

    const totalMemberships = await this.prisma.membership.count();

    const sequenceNumber = totalMemberships + 1;

    const paddedSequence = sequenceNumber.toString().padStart(4, '0');

    return `EGI-${year}-${paddedSequence}`;
  }

  private async appendToGoogleSheets(membership: any) {
    const spreadsheetId = this.configService.get<string>(
      'GOOGLE_SHEETS_MEMBERSHIP_SPREADSHEET_ID',
    );
    const range =
      this.configService.get<string>('GOOGLE_SHEETS_MEMBERSHIP_RANGE') ||
      'Sheet1!A:H';

    if (!spreadsheetId) {
      this.logger.warn(
        'Google Sheets spreadsheet ID not configured, skipping append',
      );
      return;
    }

    const row = [
      [
        membership.id,
        membership.membershipId,
        membership.nama,
        membership.kota,
        `0${membership.no_hp}`,
        membership.email,
        `${String(membership.tanggal_lahir.getMonth() + 1).padStart(2, '0')}-${String(membership.tanggal_lahir.getDate()).padStart(2, '0')}-${membership.tanggal_lahir.getFullYear()}`,
        membership.jenis_kelamin,
      ],
    ];

    await this.googleSheets.appendRowToTable(spreadsheetId, range, row);
    this.logger.log(
      `Membership appended to Google Sheets: ${membership.membershipId}`,
    );
  }

  private async updateGoogleSheets(membership: any): Promise<void> {
    const spreadsheetId = this.configService.get<string>(
      'GOOGLE_SHEETS_MEMBERSHIP_SPREADSHEET_ID',
    );
    const range =
      this.configService.get<string>('GOOGLE_SHEETS_MEMBERSHIP_RANGE') ||
      'Sheet1!A:H';

    if (!spreadsheetId) {
      this.logger.warn(
        'Google Sheets spreadsheet ID not configured, skipping update',
      );
      return;
    }

    try {
      const rowIndex = await this.googleSheets.findRowById(
        spreadsheetId,
        range,
        membership.id,
      );

      if (rowIndex === -1) {
        this.logger.warn(
          `Row not found for membership ID: ${membership.id}, will append as new row`,
        );
        await this.appendToGoogleSheets(membership);
        return;
      }

      const updatedRow = [
        membership.membershipId,
        membership.nama,
        membership.kota,
        `0${membership.no_hp}`,
        membership.email,
        `${String(membership.tanggal_lahir.getMonth() + 1).padStart(2, '0')}-${String(membership.tanggal_lahir.getDate()).padStart(2, '0')}-${membership.tanggal_lahir.getFullYear()}`,
        membership.jenis_kelamin,
      ];

      await this.googleSheets.updateRow(
        spreadsheetId,
        range,
        rowIndex,
        updatedRow,
      );
      this.logger.log(
        `Membership updated in Google Sheets: ${membership.membershipId}`,
      );
    } catch (error) {
      this.logger.error('Failed to update Google Sheets', error);
    }
  }

  private async deleteFromGoogleSheets(dbId: string): Promise<void> {
    try {
      const spreadsheetId = this.configService.get<string>(
        'GOOGLE_SHEETS_MEMBERSHIP_SPREADSHEET_ID',
      );
      const range =
        this.configService.get<string>('GOOGLE_SHEETS_MEMBERSHIP_RANGE') ||
        'Sheet1!A:H';

      if (!spreadsheetId) {
        this.logger.warn(
          'Google Sheets spreadsheet ID not configured, skipping sheet deletion',
        );
        return;
      }

      const rowIndex = await this.googleSheets.findRowById(
        spreadsheetId,
        range,
        dbId,
      );

      if (rowIndex === -1) {
        this.logger.warn(
          `Row not found for membership ID: ${dbId} in Google Sheets`,
        );
        return;
      }

      await this.googleSheets.deleteRow(spreadsheetId, range, rowIndex);
      this.logger.log(`Membership deleted from Google Sheets: ${dbId}`);
    } catch (error) {
      this.logger.error('Failed to delete from Google Sheets', error);
    }
  }

  async create(dto: RequestMembershipCreateDto) {
    const membershipId = await this.generateMembershipId();

    const membership = await this.prisma.membership.create({
      data: {
        membershipId,
        nama: dto.nama,
        email: dto.email,
        jenis_kelamin: dto.jenis_kelamin as 'LAKI_LAKI' | 'PEREMPUAN',
        kota: dto.kota,
        no_hp: dto.no_hp,
        tanggal_lahir: dto.tanggal_lahir,
      },
    });

    try {
      const pdfBuffer =
        await this.pdfService.generateMembershipCard(membership);
      await this.emailService.sendMembershipEmail(membership, pdfBuffer);
      this.logger.log(`Membership created and email sent: ${membershipId}`);
    } catch (error) {
      this.logger.error(
        `Failed to send email for membership ${membershipId}`,
        error,
      );
    }

    // Append to Google Sheets in the background
    this.appendToGoogleSheets(membership).catch((error) => {
      this.logger.error('Failed to append to Google Sheets', error);
    });

    return membership;
  }

  async findAll({
    page = 1,
    limit = 10,
    startDate,
    endDate,
    sortBy,
    sortOrder = 'desc',
  }: {
    page?: number;
    limit?: number;
    startDate?: Date;
    endDate?: Date;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    const skip = (page - 1) * limit;
    const where: Prisma.MembershipWhereInput = {};

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = startDate;
      }
      if (endDate) {
        where.createdAt.lte = endDate;
      }
    }

    // Build orderBy clause dynamically
    const orderBy: Prisma.MembershipOrderByWithRelationInput = {};
    if (sortBy) {
      // Map frontend field names to Prisma fields if needed
      const validSortFields = ['createdAt', 'nama', 'membershipId', 'jenis_kelamin', 'kota', 'tanggal_lahir', 'no_hp', 'email'];
      if (validSortFields.includes(sortBy)) {
        orderBy[sortBy as keyof Prisma.MembershipOrderByWithRelationInput] = sortOrder;
      } else {
        orderBy.createdAt = 'desc'; // Fallback to default
      }
    } else {
      orderBy.createdAt = 'desc'; // Default sorting
    }

    const [total, data] = await this.prisma.$transaction([
      this.prisma.membership.count({ where }),
      this.prisma.membership.findMany({
        skip,
        take: limit,
        orderBy,
        where,
      }),
    ]);

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }

  async findOne(id: string) {
    const item = await this.prisma.membership.findUnique({ where: { id } });
    if (!item) {
      throw new NotFoundException('Membership not found');
    }
    return item;
  }

  async update(id: string, dto: RequestMembershipUpdateDto) {
    const existing = await this.prisma.membership.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Membership not found');
    }

    const updatedMembership = await this.prisma.membership.update({
      where: { id },
      data: {
        nama: dto.nama ?? undefined,
        email: dto.email ?? undefined,
        no_hp: dto.no_hp ?? undefined,
        jenis_kelamin: dto.jenis_kelamin as
          | 'LAKI_LAKI'
          | 'PEREMPUAN'
          | undefined,
        kota: dto.kota ?? undefined,
        tanggal_lahir: dto.tanggal_lahir ?? undefined,
      },
    });

    // Update Google Sheets in background
    this.updateGoogleSheets(updatedMembership).catch((error) => {
      this.logger.error('Failed to update Google Sheets', error);
    });

    return updatedMembership;
  }

  async remove(id: string) {
    const existing = await this.prisma.membership.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Membership not found');
    }

    try {
      // Delete from Google Sheets
      await this.deleteFromGoogleSheets(existing.id);

      // Finally delete from database
      await this.prisma.membership.delete({ where: { id } });

      this.logger.log(`Membership ${id} deleted successfully from all sources`);
      return { success: true };
    } catch (error) {
      this.logger.error(`Failed to delete membership ${id} completely`, error);
      throw error;
    }
  }

  async updateFrontTemplate(file: StoredFile) {
    const targetPath = path.join(
      process.cwd(),
      'uploads',
      'membership-card-front.png',
    );
    const sourcePath = path.join(process.cwd(), 'uploads', file.filename);

    try {
      await fs.unlink(targetPath).catch(() => {});
      await fs.rename(sourcePath, targetPath);

      return {
        frontImage: MEMBERSHIP_TEMPLATE.FRONT_IMAGE,
        message: 'Front template updated successfully',
      };
    } catch (error) {
      this.logger.error('Failed to update front template', error);
      throw new BadRequestException('Failed to update template');
    }
  }

  async updateBackTemplate(file: StoredFile) {
    const targetPath = path.join(
      process.cwd(),
      'uploads',
      'membership-card-back.png',
    );
    const sourcePath = path.join(process.cwd(), 'uploads', file.filename);

    try {
      await fs.unlink(targetPath).catch(() => {});
      await fs.rename(sourcePath, targetPath);

      return {
        backImage: MEMBERSHIP_TEMPLATE.BACK_IMAGE,
        message: 'Back template updated successfully',
      };
    } catch (error) {
      this.logger.error('Failed to update back template', error);
      throw new BadRequestException('Failed to update template');
    }
  }

  async getTemplate() {
    return {
      frontImage: MEMBERSHIP_TEMPLATE.FRONT_IMAGE,
      backImage: MEMBERSHIP_TEMPLATE.BACK_IMAGE,
    };
  }

  async getConfig(): Promise<MembershipTemplateConfig> {
    try {
      const configContent = await fs.readFile(
        MEMBERSHIP_TEMPLATE.CONFIG_FILE,
        'utf-8',
      );
      return JSON.parse(configContent) as MembershipTemplateConfig;
    } catch {
      return { ...MEMBERSHIP_TEMPLATE.DEFAULT_CONFIG };
    }
  }

  async updateConfig(
    config: Partial<MembershipTemplateConfig>,
  ): Promise<MembershipTemplateConfig> {
    try {
      await fs.mkdir(path.dirname(MEMBERSHIP_TEMPLATE.CONFIG_FILE), {
        recursive: true,
      });
    } catch {
      // Directory already exists
    }

    const currentConfig = await this.getConfig();
    const newConfig: MembershipTemplateConfig = {
      textColor: config.textColor ?? currentConfig.textColor,
      fontSize: config.fontSize ?? currentConfig.fontSize,
    };

    await fs.writeFile(
      MEMBERSHIP_TEMPLATE.CONFIG_FILE,
      JSON.stringify(newConfig, null, 2),
      'utf-8',
    );

    return newConfig;
  }

  async exportExcel({
    startDate,
    endDate,
    sortBy,
    sortOrder = 'desc',
  }: {
    startDate?: Date;
    endDate?: Date;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<Buffer> {
    const where: Prisma.MembershipWhereInput = {};

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = startDate;
      }
      if (endDate) {
        where.createdAt.lte = endDate;
      }
    }

    const orderBy: Prisma.MembershipOrderByWithRelationInput = {};
    if (sortBy) {
      const validSortFields = [
        'createdAt',
        'nama',
        'membershipId',
        'jenis_kelamin',
        'kota',
        'tanggal_lahir',
        'no_hp',
        'email',
      ];
      if (validSortFields.includes(sortBy)) {
        orderBy[sortBy as keyof Prisma.MembershipOrderByWithRelationInput] = sortOrder;
      } else {
        orderBy.createdAt = 'desc';
      }
    } else {
      orderBy.createdAt = 'desc';
    }

    const data = await this.prisma.membership.findMany({
      where,
      orderBy,
    });

    const workbook = new Workbook();
    const worksheet = workbook.addWorksheet('Data Membership');

    worksheet.columns = [
      { header: 'No', key: 'no', width: 6 },
      { header: 'ID Membership', key: 'membershipId', width: 20 },
      { header: 'Nama Lengkap', key: 'nama', width: 25 },
      { header: 'Email', key: 'email', width: 25 },
      { header: 'No. Handphone', key: 'no_hp', width: 18 },
      { header: 'Kota', key: 'kota', width: 18 },
      { header: 'Jenis Kelamin', key: 'jenis_kelamin', width: 16 },
      { header: 'Tanggal Lahir', key: 'tanggal_lahir', width: 16 },
      { header: 'Tanggal Bergabung', key: 'createdAt', width: 20 },
    ];

    worksheet.getRow(1).font = { bold: true };

    data.forEach((item, index) => {
      worksheet.addRow({
        no: index + 1,
        membershipId: item.membershipId,
        nama: item.nama,
        email: item.email,
        no_hp: `0${item.no_hp}`,
        kota: item.kota,
        jenis_kelamin: item.jenis_kelamin === 'LAKI_LAKI' ? 'Laki-laki' : 'Perempuan',
        tanggal_lahir: item.tanggal_lahir
          ? `${String(item.tanggal_lahir.getDate()).padStart(2, '0')}-${String(item.tanggal_lahir.getMonth() + 1).padStart(2, '0')}-${item.tanggal_lahir.getFullYear()}`
          : '-',
        createdAt: item.createdAt
          ? `${String(item.createdAt.getDate()).padStart(2, '0')}-${String(item.createdAt.getMonth() + 1).padStart(2, '0')}-${item.createdAt.getFullYear()}`
          : '-',
      });
    });

    const arrayBuffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(arrayBuffer);
  }
}
