export const EMAIL_CONFIG = {
  SMTP_HOST: process.env.SMTP_HOST || 'mx6.mailspace.id',
  SMTP_PORT: Number(process.env.SMTP_PORT) || 465,
  SMTP_USER: process.env.SMTP_USER || 'contact@enggalgroup.id',
  SMTP_PASSWORD: process.env.SMTP_PASSWORD || process.env.SMTP_PASS, 
  EMAIL_FROM: process.env.EMAIL_FROM || '"Enggal Group" <contact@enggalgroup.id>',
};