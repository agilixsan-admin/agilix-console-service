import { DataSource } from 'typeorm';
import { EmailTemplate } from '../models/email-template.model';

const templates = [
  {
    slug: 'welcome',
    subject: 'Selamat Datang di Agilix, {{ownerName}}!',
    template: `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <title>Selamat Datang di Agilix</title>
  <style type="text/css">
    @import url("https://fonts.googleapis.com/css?family=Nunito+Sans:400,700&display=swap");
    body { width:100%!important; height:100%; margin:0; -webkit-text-size-adjust:none; background-color:#F2F4F6; font-family:"Nunito Sans",Helvetica,Arial,sans-serif; }
    a { color:#1A3A5C; }
    td { word-break:break-word; }
    h1 { margin-top:0; color:#1A3A5C; font-size:22px; font-weight:bold; }
    h2 { margin-top:0; color:#1A3A5C; font-size:16px; font-weight:bold; }
    p { margin:.4em 0 1.1875em; font-size:14px; line-height:1.625; color:#51545E; }
    .email-wrapper { width:100%; margin:0; padding:0; background-color:#F2F4F6; }
    .email-body_inner { width:570px; margin:0 auto; padding:0; background-color:#FFFFFF; border-radius:8px; overflow:hidden; }
    .email-footer { width:570px; margin:0 auto; padding:20px 0; text-align:center; }
    .email-footer p { color:#A8AAAF; font-size:12px; }
    .masthead { background-color:#1A3A5C; padding:30px 45px; text-align:center; }
    .masthead-title { color:#FFFFFF; font-size:24px; font-weight:bold; letter-spacing:2px; margin:0; }
    .masthead-subtitle { color:#A8C4E0; font-size:12px; margin:4px 0 0 0; }
    .content-cell { padding:45px; }
    .divider { border:none; border-top:1px solid #EAEAEC; margin:24px 0; }
    .info-table { width:100%; border-collapse:collapse; margin:20px 0; }
    .info-table td { padding:10px 14px; font-size:14px; color:#51545E; }
    .info-table tr:nth-child(odd) td { background-color:#F8F9FB; }
    .info-table .label { font-weight:bold; color:#1A3A5C; width:40%; }
    .badge { display:inline-block; background-color:#E8F0F8; color:#1A3A5C; font-size:12px; font-weight:bold; padding:4px 12px; border-radius:20px; }
    .footer-bar { background-color:#1A3A5C; height:6px; }
    @media only screen and (max-width:600px) { .email-body_inner,.email-footer { width:100%!important; } .content-cell { padding:24px!important; } }
  </style>
</head>
<body style="margin:0;padding:0;">
  <table class="email-wrapper" width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center" style="padding:40px 0;">
      <table class="email-body_inner" width="570" cellpadding="0" cellspacing="0">
        <tr><td class="masthead">
          <p class="masthead-title">AGILIX</p>
          <p class="masthead-subtitle">SaaS Monitoring Tenant POS</p>
        </td></tr>
        <tr><td class="content-cell">
          <h1>Selamat Datang, {{ownerName}}! 🎉</h1>
          <p>Terima kasih telah bergabung dengan <strong>Agilix</strong>. Akun bisnis Anda telah berhasil didaftarkan dan siap digunakan.</p>
          <hr class="divider" />
          <h2>Detail Akun Bisnis</h2>
          <table class="info-table" cellpadding="0" cellspacing="0">
            <tr><td class="label">Nama Bisnis</td><td>{{businessName}}</td></tr>
            <tr><td class="label">Nama Pemilik</td><td>{{ownerName}}</td></tr>
            <tr><td class="label">Paket Langganan</td><td><span class="badge">{{planType}}</span></td></tr>
            <tr><td class="label">Jumlah Outlet</td><td>{{outletCount}} outlet</td></tr>
            <tr><td class="label">Berlaku Hingga</td><td>{{expiryDate}}</td></tr>
          </table>
          <hr class="divider" />
          <p>Jika Anda memiliki pertanyaan atau membutuhkan bantuan, jangan ragu untuk menghubungi tim support kami.</p>
          <p>Salam,<br /><strong>Tim Agilix</strong></p>
        </td></tr>
        <tr><td class="footer-bar"></td></tr>
      </table>
      <table class="email-footer" width="570" cellpadding="0" cellspacing="0">
        <tr><td>
          <p>Email ini dikirim secara otomatis oleh sistem Agilix. Mohon tidak membalas email ini.</p>
          <p>© 2026 Agilix. All rights reserved.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
  },
  {
    slug: 'invoice-reminder',
    subject: 'Pengingat: Tagihan {{billingPeriod}} jatuh tempo {{dueDate}}',
    template: `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <title>Pengingat Tagihan Agilix</title>
  <style type="text/css">
    @import url("https://fonts.googleapis.com/css?family=Nunito+Sans:400,700&display=swap");
    body { width:100%!important; height:100%; margin:0; -webkit-text-size-adjust:none; background-color:#F2F4F6; font-family:"Nunito Sans",Helvetica,Arial,sans-serif; }
    a { color:#1A3A5C; } td { word-break:break-word; }
    h1 { margin-top:0; color:#1A3A5C; font-size:22px; font-weight:bold; }
    h2 { margin-top:0; color:#1A3A5C; font-size:16px; font-weight:bold; }
    p { margin:.4em 0 1.1875em; font-size:14px; line-height:1.625; color:#51545E; }
    .email-wrapper { width:100%; margin:0; padding:0; background-color:#F2F4F6; }
    .email-body_inner { width:570px; margin:0 auto; padding:0; background-color:#FFFFFF; border-radius:8px; overflow:hidden; }
    .email-footer { width:570px; margin:0 auto; padding:20px 0; text-align:center; }
    .email-footer p { color:#A8AAAF; font-size:12px; }
    .masthead { background-color:#1A3A5C; padding:30px 45px; text-align:center; }
    .masthead-title { color:#FFFFFF; font-size:24px; font-weight:bold; letter-spacing:2px; margin:0; }
    .masthead-subtitle { color:#A8C4E0; font-size:12px; margin:4px 0 0 0; }
    .alert-bar { background-color:#FEB45E; padding:12px 45px; text-align:center; }
    .alert-bar p { color:#FFFFFF; font-weight:bold; font-size:14px; margin:0; }
    .content-cell { padding:45px; }
    .divider { border:none; border-top:1px solid #EAEAEC; margin:24px 0; }
    .info-table { width:100%; border-collapse:collapse; margin:20px 0; }
    .info-table td { padding:10px 14px; font-size:14px; color:#51545E; }
    .info-table tr:nth-child(odd) td { background-color:#F8F9FB; }
    .info-table .label { font-weight:bold; color:#1A3A5C; width:40%; }
    .amount-box { background-color:#EBF3FB; border-left:4px solid #1A3A5C; padding:16px 20px; border-radius:4px; margin:20px 0; }
    .amount-box p { margin:0; color:#1A3A5C; font-size:14px; }
    .amount-box .amount { font-size:24px; font-weight:bold; color:#1A3A5C; margin:4px 0 0 0; }
    .due-date-box { background-color:#FFF8EE; border-left:4px solid #FEB45E; padding:16px 20px; border-radius:4px; margin:20px 0; }
    .due-date-box p { margin:0; color:#8A6000; font-size:14px; }
    .due-date-box .date { font-size:18px; font-weight:bold; color:#8A6000; margin:4px 0 0 0; }
    .footer-bar { background-color:#1A3A5C; height:6px; }
    @media only screen and (max-width:600px) { .email-body_inner,.email-footer { width:100%!important; } .content-cell { padding:24px!important; } }
  </style>
</head>
<body style="margin:0;padding:0;">
  <table class="email-wrapper" width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center" style="padding:40px 0;">
      <table class="email-body_inner" width="570" cellpadding="0" cellspacing="0">
        <tr><td class="masthead">
          <p class="masthead-title">AGILIX</p>
          <p class="masthead-subtitle">SaaS Monitoring Tenant POS</p>
        </td></tr>
        <tr><td class="alert-bar"><p>⏰ Pengingat: Tagihan Anda akan segera jatuh tempo</p></td></tr>
        <tr><td class="content-cell">
          <h1>Halo, {{ownerName}}</h1>
          <p>Kami mengingatkan bahwa tagihan langganan Agilix untuk bisnis <strong>{{businessName}}</strong> akan segera jatuh tempo.</p>
          <hr class="divider" />
          <h2>Detail Tagihan</h2>
          <table class="info-table" cellpadding="0" cellspacing="0">
            <tr><td class="label">Nomor Invoice</td><td>{{invoiceNumber}}</td></tr>
            <tr><td class="label">Nama Bisnis</td><td>{{businessName}}</td></tr>
            <tr><td class="label">Periode Tagihan</td><td>{{billingPeriod}}</td></tr>
          </table>
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td width="48%" style="padding-right:8px;">
                <div class="amount-box"><p>Total Tagihan</p><p class="amount">Rp {{amount}}</p></div>
              </td>
              <td width="48%" style="padding-left:8px;">
                <div class="due-date-box"><p>Jatuh Tempo</p><p class="date">{{dueDate}}</p></div>
              </td>
            </tr>
          </table>
          <hr class="divider" />
          <p>Jika Anda sudah melakukan pembayaran, abaikan email ini.</p>
          <p>Salam,<br /><strong>Tim Agilix</strong></p>
        </td></tr>
        <tr><td class="footer-bar"></td></tr>
      </table>
      <table class="email-footer" width="570" cellpadding="0" cellspacing="0">
        <tr><td>
          <p>Email ini dikirim secara otomatis oleh sistem Agilix. Mohon tidak membalas email ini.</p>
          <p>© 2026 Agilix. All rights reserved.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
  },
  {
    slug: 'invoice-overdue',
    subject: 'PENTING: Tagihan {{invoiceNumber}} Telah Melewati Jatuh Tempo',
    template: `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <title>Tagihan Jatuh Tempo Agilix</title>
  <style type="text/css">
    @import url("https://fonts.googleapis.com/css?family=Nunito+Sans:400,700&display=swap");
    body { width:100%!important; height:100%; margin:0; -webkit-text-size-adjust:none; background-color:#F2F4F6; font-family:"Nunito Sans",Helvetica,Arial,sans-serif; }
    a { color:#1A3A5C; } td { word-break:break-word; }
    h1 { margin-top:0; color:#C0392B; font-size:22px; font-weight:bold; }
    h2 { margin-top:0; color:#1A3A5C; font-size:16px; font-weight:bold; }
    p { margin:.4em 0 1.1875em; font-size:14px; line-height:1.625; color:#51545E; }
    .email-wrapper { width:100%; margin:0; padding:0; background-color:#F2F4F6; }
    .email-body_inner { width:570px; margin:0 auto; padding:0; background-color:#FFFFFF; border-radius:8px; overflow:hidden; }
    .email-footer { width:570px; margin:0 auto; padding:20px 0; text-align:center; }
    .email-footer p { color:#A8AAAF; font-size:12px; }
    .masthead { background-color:#1A3A5C; padding:30px 45px; text-align:center; }
    .masthead-title { color:#FFFFFF; font-size:24px; font-weight:bold; letter-spacing:2px; margin:0; }
    .masthead-subtitle { color:#A8C4E0; font-size:12px; margin:4px 0 0 0; }
    .alert-bar { background-color:#E74C3C; padding:12px 45px; text-align:center; }
    .alert-bar p { color:#FFFFFF; font-weight:bold; font-size:14px; margin:0; }
    .content-cell { padding:45px; }
    .divider { border:none; border-top:1px solid #EAEAEC; margin:24px 0; }
    .info-table { width:100%; border-collapse:collapse; margin:20px 0; }
    .info-table td { padding:10px 14px; font-size:14px; color:#51545E; }
    .info-table tr:nth-child(odd) td { background-color:#F8F9FB; }
    .info-table .label { font-weight:bold; color:#1A3A5C; width:40%; }
    .amount-box { background-color:#FDEDEC; border-left:4px solid #E74C3C; padding:16px 20px; border-radius:4px; margin:20px 0; }
    .amount-box p { margin:0; color:#922B21; font-size:14px; }
    .amount-box .amount { font-size:24px; font-weight:bold; color:#922B21; margin:4px 0 0 0; }
    .overdue-box { background-color:#FDEDEC; border:1px solid #E74C3C; padding:16px 20px; border-radius:4px; margin:20px 0; text-align:center; }
    .overdue-box p { margin:0; color:#922B21; font-size:14px; font-weight:bold; }
    .warning-text { color:#C0392B; font-weight:bold; }
    .footer-bar { background-color:#E74C3C; height:6px; }
    @media only screen and (max-width:600px) { .email-body_inner,.email-footer { width:100%!important; } .content-cell { padding:24px!important; } }
  </style>
</head>
<body style="margin:0;padding:0;">
  <table class="email-wrapper" width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center" style="padding:40px 0;">
      <table class="email-body_inner" width="570" cellpadding="0" cellspacing="0">
        <tr><td class="masthead">
          <p class="masthead-title">AGILIX</p>
          <p class="masthead-subtitle">SaaS Monitoring Tenant POS</p>
        </td></tr>
        <tr><td class="alert-bar"><p>🚨 Tagihan Anda telah melewati batas jatuh tempo</p></td></tr>
        <tr><td class="content-cell">
          <h1>Halo, {{ownerName}}</h1>
          <p>Tagihan langganan Agilix untuk bisnis <strong>{{businessName}}</strong> telah <span class="warning-text">melewati batas jatuh tempo</span>. Mohon segera lakukan pembayaran untuk menghindari penangguhan layanan.</p>
          <div class="overdue-box"><p>⚠️ Tagihan ini telah jatuh tempo sejak {{dueDate}}</p></div>
          <hr class="divider" />
          <h2>Detail Tagihan</h2>
          <table class="info-table" cellpadding="0" cellspacing="0">
            <tr><td class="label">Nomor Invoice</td><td>{{invoiceNumber}}</td></tr>
            <tr><td class="label">Nama Bisnis</td><td>{{businessName}}</td></tr>
            <tr><td class="label">Periode Tagihan</td><td>{{billingPeriod}}</td></tr>
            <tr><td class="label">Tanggal Jatuh Tempo</td><td><span class="warning-text">{{dueDate}}</span></td></tr>
          </table>
          <div class="amount-box">
            <p>Total Tagihan yang Harus Dibayar</p>
            <p class="amount">Rp {{amount}}</p>
          </div>
          <hr class="divider" />
          <p>Jika pembayaran tidak dilakukan segera, layanan Anda berisiko ditangguhkan.</p>
          <p>Salam,<br /><strong>Tim Agilix</strong></p>
        </td></tr>
        <tr><td class="footer-bar"></td></tr>
      </table>
      <table class="email-footer" width="570" cellpadding="0" cellspacing="0">
        <tr><td>
          <p>Email ini dikirim secara otomatis oleh sistem Agilix. Mohon tidak membalas email ini.</p>
          <p>© 2026 Agilix. All rights reserved.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
  },
];

export async function seedEmailTemplates(
  dataSource: DataSource,
): Promise<void> {
  const repo = dataSource.getRepository(EmailTemplate);

  for (const t of templates) {
    const existing = await repo.findOne({ where: { slug: t.slug } });
    if (existing) {
      console.log(`✓ Email template "${t.slug}" already exists, skipping`);
      continue;
    }
    await repo.save(repo.create(t));
    console.log(`✓ Email template "${t.slug}" created`);
  }
}
