import { Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { EmailService } from './email.service';
import { EMAIL_CONFIG } from './email.constants';

@Module({
  imports: [
    MailerModule.forRoot({
      transport: {
        host: EMAIL_CONFIG.SMTP_HOST,
        port: EMAIL_CONFIG.SMTP_PORT,
        secure: EMAIL_CONFIG.SMTP_PORT === 465,
        auth: {
          user: EMAIL_CONFIG.SMTP_USER,
          pass: EMAIL_CONFIG.SMTP_PASSWORD,
        },
        tls: {
          rejectUnauthorized: false,
        },
      },
      defaults: {
        from: EMAIL_CONFIG.EMAIL_FROM,
      },
      template: {
        dir: process.cwd() + '/templates/',
        adapter: new HandlebarsAdapter(),
        options: {
          strict: true,
        },
      },
    }),
  ],
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule {}
