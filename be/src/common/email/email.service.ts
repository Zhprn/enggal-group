import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private resend: Resend;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('RESEND_API_KEY');
    this.resend = new Resend(apiKey);
  }

  async sendMembershipEmail(
    membership: {
      membershipId: string;
      nama: string;
      email: string;
      no_hp: string;
      jenis_kelamin: string;
      kota: string;
      tanggal_lahir: Date;
      createdAt: Date;
    },
    pdfBuffer: Buffer,
  ): Promise<void> {
    try {
      const fromEmail =
        this.configService.get<string>('EMAIL_FROM') ||
        '"Enggal Group" <contact@enggalgroup.id>';

      const { data, error } = await this.resend.emails.send({
        from: fromEmail,
        to: [membership.email],
        subject: 'Selamat Datang di Membership Enggal Group Indonesia!',
        html: this.getMembershipEmailTemplate(membership),
        attachments: [
          {
            filename: `membership-card-${membership.membershipId}.pdf`,
            content: pdfBuffer,
          },
        ],
      });

      if (error) {
        throw new Error(error.message);
      }

      this.logger.log(
        `Membership email sent successfully via Resend to: ${membership.email} (ID: ${data?.id})`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send membership email to: ${membership.email}`,
        error,
      );
      throw error;
    }
  }

  private getMembershipEmailTemplate(membership: {
    membershipId: string;
    nama: string;
    email: string;
    no_hp: string;
    jenis_kelamin: string;
    kota: string;
    tanggal_lahir: Date;
    createdAt: Date;
  }): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Selamat Datang di Membership Enggal Group Indonesia!</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            text-align: center;
            padding: 20px 0;
            border-bottom: 2px solid #A71D28;
          }
          .content {
            padding: 20px 0;
          }
          .membership-info {
            background-color: #FFF9E6;
            border-left: 4px solid #FFB835;
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
          }
          .footer {
            text-align: center;
            padding: 20px 0;
            border-top: 1px solid #ddd;
            font-size: 12px;
            color: #666;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Selamat Datang di Membership Enggal Group Indonesia!</h1>
          <p>Membership Anda telah berhasil dibuat.</p>
        </div>

        <div class="content">
          <p>Halo <strong>${membership.nama}</strong>,</p>

          <p>Terima kasih telah bergabung dengan Membership Enggal Group Indonesia! Kami sangat senang menyambut Anda sebagai bagian dari kami.</p>

          <div class="membership-info">
            <h3>Detail Membership Anda:</h3>
            <p><strong>ID Member:</strong> ${membership.membershipId}</p>
            <p><strong>Nama:</strong> ${membership.nama}</p>
            <p><strong>Email:</strong> ${membership.email}</p>
            <p><strong>No. HP:</strong> ${membership.no_hp}</p>
            <p><strong>Jenis Kelamin:</strong> ${membership.jenis_kelamin === 'LAKI_LAKI' ? 'Laki-laki' : 'Perempuan'}</p>
            <p><strong>Kota:</strong> ${membership.kota}</p>
            <p><strong>Tanggal Lahir:</strong> ${new Date(membership.tanggal_lahir).toLocaleDateString('id-ID')}</p>
            <p><strong>Tanggal Bergabung:</strong> ${new Date(membership.createdAt).toLocaleDateString('id-ID')}</p>
          </div>

          <p>Kartu membership resmi Anda terlampir dalam email ini sebagai file PDF. Tunjukkan kartu tersebut saat berbelanja di outlet Enggal Group Indonesia.</p>

          <p>Jika Anda memiliki pertanyaan atau membutuhkan bantuan, jangan ragu untuk menghubungi kami.</p>

          <p>Salam,<br>
          Tim Enggal Group Indonesia</p>
        </div>

        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} Enggal Group. Hak Cipta Dilindungi.</p>
          <p>Email ini dikirimkan ke ${membership.email} karena Anda telah mendaftar keanggotaan.</p>
        </div>
      </body>
      </html>
    `;
  }
}
