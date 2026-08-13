import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';

export interface InvoicePdfData {
  invoiceNumber: string;
  billingPeriod: string;
  dueDate: string;
  amount: number;
  status: string;
  notes: string | null;
  businessName: string;
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string | null;
  planType: string;
  outletCount: number;
  issuedAt: string;
}

@Injectable()
export class InvoicePdfService {
  private readonly BRAND_DARK = '#1A3A5C';
  private readonly BRAND_LIGHT = '#EBF3FB';
  private readonly TEXT_GRAY = '#51545E';
  private readonly BORDER = '#EAEAEC';

  // A5 landscape: 595.28 x 419.53 pt
  private readonly W = 595.28;
  private readonly H = 419.53;
  private readonly ML = 36;
  private readonly MR = 36;
  private readonly MT = 20; // margin top
  private readonly CW = 595.28 - 72; // 523.28

  generate(data: InvoicePdfData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        size: 'A5',
        layout: 'landscape',
        margin: 0,
        autoFirstPage: true,
      });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      this.draw(doc, data);

      doc.end();
    });
  }

  private formatBillingPeriod(period: string): string {
    const [year, month] = period.split('-');
    const months = [
      'Januari',
      'Februari',
      'Maret',
      'April',
      'Mei',
      'Juni',
      'Juli',
      'Agustus',
      'September',
      'Oktober',
      'November',
      'Desember',
    ];
    return `${months[parseInt(month, 10) - 1]} ${year}`;
  }

  private draw(doc: PDFKit.PDFDocument, data: InvoicePdfData): void {
    // ── Header bar ──────────────────────────────────────────────────────────
    doc.rect(0, 0, this.W, 6).fill(this.BRAND_DARK);

    // Brand kiri
    doc
      .fillColor(this.BRAND_DARK)
      .fontSize(16)
      .font('Helvetica-Bold')
      .text('AGILIX.id', this.ML, this.MT + 16);
    doc
      .fillColor(this.TEXT_GRAY)
      .fontSize(7)
      .font('Helvetica')
      .text('SaaS Monitoring Tenant POS', this.ML, this.MT + 36);

    // Invoice title kanan
    doc
      .fillColor(this.BRAND_DARK)
      .fontSize(16)
      .font('Helvetica-Bold')
      .text('INVOICE', 0, this.MT + 16, {
        align: 'right',
        width: this.W - this.MR,
      });
    doc
      .fillColor(this.TEXT_GRAY)
      .fontSize(8)
      .font('Helvetica')
      .text(data.invoiceNumber, 0, this.MT + 36, {
        align: 'right',
        width: this.W - this.MR,
      });

    // Status badge
    const statusColor =
      data.status === 'PAID'
        ? '#27AE60'
        : data.status === 'OVERDUE'
          ? '#E74C3C'
          : '#FEB45E';
    doc
      .roundedRect(this.W - this.MR - 60, this.MT + 48, 60, 16, 3)
      .fill(statusColor);
    doc
      .fillColor('#FFFFFF')
      .fontSize(7)
      .font('Helvetica-Bold')
      .text(data.status, this.W - this.MR - 60, this.MT + 53, {
        width: 60,
        align: 'center',
      });

    // ── Divider ─────────────────────────────────────────────────────────────
    this.divider(doc, this.MT + 72);

    // ── Billing info (2 kolom) ───────────────────────────────────────────────
    const bY = this.MT + 82;
    const col2X = 300;

    // Kolom kiri — Tagihan Kepada
    doc
      .fillColor(this.BRAND_DARK)
      .fontSize(7)
      .font('Helvetica-Bold')
      .text('TAGIHAN KEPADA', this.ML, bY);
    doc
      .fillColor(this.TEXT_GRAY)
      .fontSize(9)
      .font('Helvetica-Bold')
      .text(data.businessName, this.ML, bY + 12);
    doc
      .font('Helvetica')
      .fontSize(8)
      .text(data.ownerName, this.ML, bY + 24)
      .text(data.ownerEmail, this.ML, bY + 35)
      .text(data.ownerPhone ?? '-', this.ML, bY + 46)
      .text(
        `Paket: ${data.planType} | ${data.outletCount} Outlet`,
        this.ML,
        bY + 57,
      );

    // Kolom kanan — Detail Invoice
    doc
      .fillColor(this.BRAND_DARK)
      .fontSize(7)
      .font('Helvetica-Bold')
      .text('DETAIL INVOICE', col2X, bY);

    const details: [string, string][] = [
      ['Tanggal Terbit', data.issuedAt],
      ['Periode Tagihan', this.formatBillingPeriod(data.billingPeriod)],
      ['Jatuh Tempo', data.dueDate],
    ];
    details.forEach(([label, value], i) => {
      const ry = bY + 12 + i * 14;
      doc
        .fillColor(this.TEXT_GRAY)
        .fontSize(8)
        .font('Helvetica')
        .text(label, col2X, ry, { width: 100 })
        .text(value, col2X + 105, ry);
    });

    // ── Divider ─────────────────────────────────────────────────────────────
    this.divider(doc, this.MT + 158);

    // ── Invoice table ────────────────────────────────────────────────────────
    const tY = this.MT + 167;

    // Header tabel
    doc.rect(this.ML, tY, this.CW, 18).fill(this.BRAND_DARK);
    doc
      .fillColor('#FFFFFF')
      .fontSize(7.5)
      .font('Helvetica-Bold')
      .text('DESKRIPSI', this.ML + 6, tY + 5)
      .text('PERIODE', this.ML + 240, tY + 5)
      .text('JUMLAH', 0, tY + 5, { align: 'right', width: this.W - this.MR });

    // Row item
    const rY = tY + 18;
    doc.rect(this.ML, rY, this.CW, 22).fill(this.BRAND_LIGHT);
    doc
      .fillColor(this.TEXT_GRAY)
      .fontSize(8)
      .font('Helvetica')
      .text(`Langganan Agilix - ${data.planType}`, this.ML + 6, rY + 7)
      .text(
        this.formatBillingPeriod(data.billingPeriod),
        this.ML + 240,
        rY + 7,
      );
    doc
      .fillColor(this.BRAND_DARK)
      .font('Helvetica-Bold')
      .text(`Rp ${Number(data.amount).toLocaleString('id-ID')}`, 0, rY + 7, {
        align: 'right',
        width: this.W - this.MR,
      });

    // Total bar
    const totY = rY + 28;
    doc.rect(this.ML + 240, totY, this.CW - 240, 22).fill(this.BRAND_DARK);
    doc
      .fillColor('#FFFFFF')
      .fontSize(8)
      .font('Helvetica-Bold')
      .text('TOTAL', this.ML + 248, totY + 7)
      .text(`Rp ${Number(data.amount).toLocaleString('id-ID')}`, 0, totY + 7, {
        align: 'right',
        width: this.W - this.MR,
      });

    // Notes
    if (data.notes) {
      doc
        .fillColor(this.TEXT_GRAY)
        .fontSize(7)
        .font('Helvetica')
        .text(`Catatan: ${data.notes}`, this.ML, totY + 30, { width: this.CW });
    }

    // ── Stamp area ───────────────────────────────────────────────────────────
    const sY = this.MT + 270;
    doc
      .rect(this.ML, sY, 130, 60)
      .strokeColor(this.BORDER)
      .lineWidth(0.5)
      .stroke();
    doc
      .fillColor(this.TEXT_GRAY)
      .fontSize(7)
      .font('Helvetica')
      .text('Tanda Tangan & Stempel', this.ML + 6, sY + 6)
      .text('Agilix', this.ML + 6, sY + 50);

    // ── Footer ───────────────────────────────────────────────────────────────
    const fY = this.H - 36;
    doc.rect(this.ML, fY - 3, this.CW, 0.5).fill(this.BRAND_DARK);
    doc
      .fillColor(this.TEXT_GRAY)
      .fontSize(6.5)
      .font('Helvetica')
      .text(
        'Dokumen ini digenerate secara otomatis oleh sistem Agilix. Mohon tidak membalas email ini.',
        this.ML,
        fY + 4,
        { align: 'center', width: this.CW },
      )
      .text('© 2026 Agilix. All rights reserved.', this.ML, fY + 15, {
        align: 'center',
        width: this.CW,
      });
  }

  private divider(doc: PDFKit.PDFDocument, y: number): void {
    doc
      .moveTo(this.ML, y)
      .lineTo(this.W - this.MR, y)
      .strokeColor(this.BORDER)
      .lineWidth(0.5)
      .stroke();
  }
}
