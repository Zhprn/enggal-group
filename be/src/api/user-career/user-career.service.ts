import { Injectable, NotFoundException, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { Prisma } from "@prisma/client";
import { PrismaService } from "src/prisma/prisma.service";
import { GoogleSheetsService } from "src/common/google-sheets/google-sheets.service";
import { GoogleDriveService } from "src/common/google-drive/google-drive.service";
import { RequestUserCareerCreateDto } from "src/api/user-career/dto/requests/create.dto";
import { RequestUserCareerUpdateDto } from "src/api/user-career/dto/requests/update.dto";
import { Workbook } from 'exceljs';

@Injectable()
export class UserCareerService {
  private readonly logger = new Logger(UserCareerService.name);

  constructor(
    private prisma: PrismaService,
    private googleSheets: GoogleSheetsService,
    private googleDrive: GoogleDriveService,
    private configService: ConfigService,
  ) {}

  async create(dto: RequestUserCareerCreateDto) {
    const createdCareer = await this.prisma.userCareer.create({
      data: {
        tanggal: new Date(dto.tanggal),
        nama: dto.nama,
        no_hp: dto.no_hp,
        email: dto.email,
        alamat: dto.alamat,
        cv_link: dto.cv_link,
        status: dto.status,
        jenis_kelamin: dto.jenis_kelamin,
        kota: dto.kota,
        tanggal_lahir: dto.tanggal_lahir
          ? new Date(dto.tanggal_lahir)
          : new Date(),
      },
    });

    this.appendToGoogleSheets(createdCareer).catch((error) => {
      this.logger.error("Failed to append to Google Sheets", error);
    });

    return createdCareer;
  }

  private async appendToGoogleSheets(career: any) {
    const spreadsheetId = this.configService.get<string>(
      "GOOGLE_SHEETS_CAREER_SPREADSHEET_ID",
    );
    const range =
      this.configService.get<string>("GOOGLE_SHEETS_CAREER_RANGE") ||
      "Sheet1!A:K";

    if (!spreadsheetId) {
      this.logger.warn(
        "Google Sheets spreadsheet ID not configured, skipping append",
      );
      return;
    }

    const row = [
      [
        career.id,
        `${String(career.tanggal.getMonth() + 1).padStart(2, "0")}-${String(career.tanggal.getDate()).padStart(2, "0")}-${career.tanggal.getFullYear()}`,
        career.nama,
        `0${career.no_hp}`,
        career.email,
        career.alamat,
        career.cv_link,
        career.status,
        career.jenis_kelamin,
        career.kota,
        `${String(career.tanggal_lahir.getMonth() + 1).padStart(2, "0")}-${String(career.tanggal_lahir.getDate()).padStart(2, "0")}-${career.tanggal_lahir.getFullYear()}`,
      ],
    ];

    await this.googleSheets.appendRowToTable(spreadsheetId, range, row);
    this.logger.log(
      `Career application appended to Google Sheets: ${career.id}`,
    );
  }

  private async updateGoogleSheets(career: any): Promise<void> {
    const spreadsheetId = this.configService.get<string>(
      "GOOGLE_SHEETS_CAREER_SPREADSHEET_ID",
    );
    const range =
      this.configService.get<string>("GOOGLE_SHEETS_CAREER_RANGE") ||
      "Sheet1!A:K";

    if (!spreadsheetId) {
      this.logger.warn(
        "Google Sheets spreadsheet ID not configured, skipping update",
      );
      return;
    }

    try {
      const rowIndex = await this.googleSheets.findRowById(
        spreadsheetId,
        range,
        career.id,
      );

      if (rowIndex === -1) {
        this.logger.warn(
          `Row not found for career ID: ${career.id}, will append as new row`,
        );
        await this.appendToGoogleSheets(career);
        return;
      }

      const updatedRow = [
        `${String(career.tanggal.getMonth() + 1).padStart(2, "0")}-${String(career.tanggal.getDate()).padStart(2, "0")}-${career.tanggal.getFullYear()}`,
        career.nama,
        `0${career.no_hp}`,
        career.email,
        career.alamat,
        career.cv_link,
        career.status,
        career.jenis_kelamin,
        career.kota,
        `${String(career.tanggal_lahir.getMonth() + 1).padStart(2, "0")}-${String(career.tanggal_lahir.getDate()).padStart(2, "0")}-${career.tanggal_lahir.getFullYear()}`,
      ];

      await this.googleSheets.updateRow(
        spreadsheetId,
        range,
        rowIndex,
        updatedRow,
      );
      this.logger.log(
        `Career application updated in Google Sheets: ${career.id}`,
      );
    } catch (error) {
      this.logger.error("Failed to update Google Sheets", error);
    }
  }

  async findAll({
    page = 1,
    limit = 10,
    startDate,
    endDate,
    status,
    sortBy,
    sortOrder = 'desc',
  }: {
    page?: number;
    limit?: number;
    startDate?: Date;
    endDate?: Date;
    status?: any;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    const skip = (page - 1) * limit;
    const where: Prisma.UserCareerWhereInput = {};

    if (startDate || endDate) {
      where.tanggal = {};
      if (startDate) {
        where.tanggal.gte = startDate;
      }
      if (endDate) {
        where.tanggal.lte = endDate;
      }
    }

    if (status) {
      where.status = status;
    }

    // Build orderBy clause dynamically
    const orderBy: Prisma.UserCareerOrderByWithRelationInput = {};
    if (sortBy) {
      // Map frontend field names to Prisma fields if needed
      const validSortFields = ['tanggal', 'nama', 'no_hp', 'email', 'status', 'jenis_kelamin', 'kota', 'tanggal_lahir'];
      if (validSortFields.includes(sortBy)) {
        orderBy[sortBy as keyof Prisma.UserCareerOrderByWithRelationInput] = sortOrder;
      } else {
        orderBy.tanggal = 'desc'; // Fallback to default
      }
    } else {
      orderBy.tanggal = 'desc'; // Default sorting
    }

    const [total, data] = await this.prisma.$transaction([
      this.prisma.userCareer.count({ where }),
      this.prisma.userCareer.findMany({
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
    const item = await this.prisma.userCareer.findUnique({ where: { id } });
    if (!item) {
      throw new NotFoundException("UserCareer not found");
    }
    return item;
  }

  async update(id: string, dto: RequestUserCareerUpdateDto) {
    const existing = await this.prisma.userCareer.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException("UserCareer not found");
    }

    const updatedCareer = await this.prisma.userCareer.update({
      where: { id },
      data: {
        tanggal: dto.tanggal ? new Date(dto.tanggal) : undefined,
        nama: dto.nama ?? undefined,
        no_hp: dto.no_hp ?? undefined,
        email: dto.email ?? undefined,
        alamat: dto.alamat ?? undefined,
        cv_link: dto.cv_link ?? undefined,
        status: dto.status ?? undefined,
      },
    });

    this.updateGoogleSheets(updatedCareer).catch((error) => {
      this.logger.error("Failed to update Google Sheets", error);
    });

    return updatedCareer;
  }

  async remove(id: string) {
    const existing = await this.prisma.userCareer.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException("UserCareer not found");
    }

    try {
      await this.deleteFromGoogleSheets(existing.id);

      if (existing.cv_link) {
        await this.deleteFromGoogleDrive(existing.cv_link);
      }

      await this.prisma.userCareer.delete({ where: { id } });

      this.logger.log(`UserCareer ${id} deleted successfully from all sources`);
      return { success: true };
    } catch (error) {
      this.logger.error(`Failed to delete UserCareer ${id} completely`, error);
      throw error;
    }
  }

  async exportExcel({
    startDate,
    endDate,
    status,
    sortBy,
    sortOrder = 'desc',
  }: {
    startDate?: Date;
    endDate?: Date;
    status?: any;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<Buffer> {
    const where: Prisma.UserCareerWhereInput = {};

    if (startDate || endDate) {
      where.tanggal = {};
      if (startDate) {
        where.tanggal.gte = startDate;
      }
      if (endDate) {
        where.tanggal.lte = endDate;
      }
    }

    if (status) {
      where.status = status;
    }

    const orderBy: Prisma.UserCareerOrderByWithRelationInput = {};
    if (sortBy) {
      const validSortFields = [
        'tanggal',
        'nama',
        'no_hp',
        'email',
        'status',
        'jenis_kelamin',
        'kota',
        'tanggal_lahir',
      ];
      if (validSortFields.includes(sortBy)) {
        orderBy[sortBy as keyof Prisma.UserCareerOrderByWithRelationInput] = sortOrder;
      } else {
        orderBy.tanggal = 'desc';
      }
    } else {
      orderBy.tanggal = 'desc';
    }

    const data = await this.prisma.userCareer.findMany({
      where,
      orderBy,
    });

    const workbook = new Workbook();
    const worksheet = workbook.addWorksheet('Data Pelamar');

    worksheet.mergeCells('A1:J1');
    const titleRow = worksheet.getCell('A1');
    titleRow.value = 'DATA LAPORAN PELAMAR KARIR';
    titleRow.font = { name: 'Calibri', size: 16, bold: true, color: { argb: 'FF9C1A1C' } };
    titleRow.alignment = { vertical: 'middle', horizontal: 'center' };
    worksheet.getRow(1).height = 30;

    titleRow.border = {
      top: { style: 'medium', color: { argb: 'FF9C1A1C' } },
      left: { style: 'medium', color: { argb: 'FF9C1A1C' } },
      right: { style: 'medium', color: { argb: 'FF9C1A1C' } },
    };

    worksheet.mergeCells('A2:J2');
    const subTitleRow = worksheet.getCell('A2');
    subTitleRow.value = `Tanggal Export: ${new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}`;
    subTitleRow.font = { name: 'Calibri', size: 10, italic: true, color: { argb: 'FF555555' } };
    subTitleRow.alignment = { vertical: 'middle', horizontal: 'center' };
    worksheet.getRow(2).height = 20;

    subTitleRow.border = {
      left: { style: 'medium', color: { argb: 'FF9C1A1C' } },
      bottom: { style: 'medium', color: { argb: 'FF9C1A1C' } },
      right: { style: 'medium', color: { argb: 'FF9C1A1C' } },
    };

    worksheet.getRow(3).height = 10;

    const headers = [
      { header: 'NO', key: 'no', width: 8 },
      { header: 'TANGGAL DAFTAR', key: 'tanggal', width: 18 },
      { header: 'NAMA LENGKAP', key: 'nama', width: 28 },
      { header: 'NO. HANDPHONE', key: 'no_hp', width: 20 },
      { header: 'EMAIL', key: 'email', width: 28 },
      { header: 'KOTA', key: 'kota', width: 18 },
      { header: 'JENIS KELAMIN', key: 'jenis_kelamin', width: 16 },
      { header: 'TANGGAL LAHIR', key: 'tanggal_lahir', width: 18 },
      { header: 'STATUS', key: 'status', width: 16 },
      { header: 'LINK CV', key: 'cv_link', width: 30 },
    ];

    const headerRowNumber = 4;
    const headerRow = worksheet.getRow(headerRowNumber);
    headerRow.height = 26;

    headers.forEach((h, idx) => {
      worksheet.getColumn(idx + 1).width = h.width;
      const cell = headerRow.getCell(idx + 1);
      cell.value = h.header;
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF9C1A1C' },
      };
      cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
      cell.border = {
        top: { style: 'medium', color: { argb: 'FF000000' } },
        left: { style: 'thin', color: { argb: 'FFFFFFFF' } },
        bottom: { style: 'medium', color: { argb: 'FF000000' } },
        right: { style: 'thin', color: { argb: 'FFFFFFFF' } },
      };
    });

    data.forEach((item, index) => {
      const rowIndex = headerRowNumber + 1 + index;
      const row = worksheet.getRow(rowIndex);
      row.height = 22;

      row.values = [
        index + 1,
        item.tanggal
          ? `${String(item.tanggal.getDate()).padStart(2, '0')}-${String(item.tanggal.getMonth() + 1).padStart(2, '0')}-${item.tanggal.getFullYear()}`
          : '-',
        item.nama,
        `0${item.no_hp}`,
        item.email,
        item.kota,
        item.jenis_kelamin === 'LAKI_LAKI' ? 'Laki-laki' : 'Perempuan',
        item.tanggal_lahir
          ? `${String(item.tanggal_lahir.getDate()).padStart(2, '0')}-${String(item.tanggal_lahir.getMonth() + 1).padStart(2, '0')}-${item.tanggal_lahir.getFullYear()}`
          : '-',
        item.status,
        item.cv_link ? 'Buka CV' : '-',
      ];

      for (let col = 1; col <= headers.length; col++) {
        const cell = row.getCell(col);

        cell.border = {
          top: { style: 'thin', color: { argb: 'FFBFBFBF' } },
          left: { style: 'thin', color: { argb: 'FFBFBFBF' } },
          bottom: { style: 'thin', color: { argb: 'FFBFBFBF' } },
          right: { style: 'thin', color: { argb: 'FFBFBFBF' } },
        };

        if (index % 2 === 1) {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF5F6F8' },
          };
        }

        const centerCols = [1, 2, 4, 6, 7, 8, 9, 10];
        cell.alignment = {
          vertical: 'middle',
          horizontal: centerCols.includes(col) ? 'center' : 'left',
        };

        if (col === 10 && item.cv_link) {
          cell.value = {
            text: 'Buka CV',
            hyperlink: item.cv_link,
          };
          cell.font = { color: { argb: 'FF1A73E8' }, underline: true };
        }
      }
    });

    const arrayBuffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(arrayBuffer);
  }

  private async deleteFromGoogleSheets(dbId: string): Promise<void> {
    try {
      const spreadsheetId = this.configService.get<string>(
        "GOOGLE_SHEETS_CAREER_SPREADSHEET_ID",
      );
      const range =
        this.configService.get<string>("GOOGLE_SHEETS_CAREER_RANGE") ||
        "Sheet1!A:K";

      if (!spreadsheetId) {
        this.logger.warn(
          "Google Sheets spreadsheet ID not configured, skipping sheet deletion",
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
          `Row not found for career ID: ${dbId} in Google Sheets`,
        );
        return;
      }

      await this.googleSheets.deleteRow(spreadsheetId, range, rowIndex);
      this.logger.log(`Career application deleted from Google Sheets: ${dbId}`);
    } catch (error) {
      this.logger.error("Failed to delete from Google Sheets", error);
    }
  }

  private async deleteFromGoogleDrive(cvLink: string): Promise<void> {
    try {
      const fileId = this.googleDrive.extractFileIdFromUrl(cvLink);

      if (!fileId) {
        this.logger.warn(`Could not extract file ID from CV link: ${cvLink}`);
        return;
      }

      const fileName = await this.googleDrive.getFileNameById(fileId);

      if (!fileName) {
        this.logger.warn(`Could not get filename for file ID: ${fileId}`);
        return;
      }

      await this.googleDrive.deleteFile(fileName);
      this.logger.log(
        `CV file deleted from Google Drive: ${fileName} (${fileId})`,
      );
    } catch (error) {
      this.logger.error("Failed to delete CV file from Google Drive", error);
    }
  }
}
