import { IsEnum } from 'class-validator';
import { Status } from '@prisma/client';

export class UpdatePromoStatusDto {
  @IsEnum(Status, {
    message: 'Status must Aktif or Archive',
  })
  status: Status;
}