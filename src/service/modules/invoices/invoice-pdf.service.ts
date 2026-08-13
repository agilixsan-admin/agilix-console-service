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
  private readonly W = 595.28; // A4 width pt
  private readonly H = 841.89; // A4 height pt
  private readonly ML = 50;    // margin left
  private readonly MR = 50;    // margin right
  private readonly CW = 595.28 - 100; // content width

  generate(data: InvoicePdfData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        size: 'A4',
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
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
    ];
    return `${months[parseInt(month, 10) - 1]} ${year}`;
  }

  private draw(doc: PDFKit.PDFDocument, data: InvoicePdfData): void {
    // ── Header bar ──────────────────────────────────────────────────────────
    doc.rect(0, 0, this.W, 8).fill(this.BRAND_DARK);

    // Brand
    doc.fillColor(this.BRAND_DARK).fontSize(20).font('Helvetica-Bold')
      .text('AGILIX.id', this.ML, 28);
    doc.fillColor(this.TEXT_GRAY).fontSize(8).font('Helvetica')
      .text('SaaS Monitoring Tenant POS', this.ML, 52);

    // Invoice title
    doc.fillColor(this.BRAND_DARK).fontSize(20).font('Helvetica-Bold')
      .text('INVOICE', 0, 28, { align: 'right', width: this.W - this.MR });
    doc.fillColor(this.TEXT_GRAY).fontSize(9).font('Helvetica')
      .text(data.invoiceNumber, 0, 52, { align: 'right', width: this.W - this.MR });

    // Status badge
    const statusColor =
      data.status === 'PAID' ? '#27AE60' :
      data.status === 'OVERDUE' ? '#E74C3C' : '#FEB45E';
    doc.roundedRect(this.W - this.MR - 70, 64, 70, 18, 3).fill(statusColor);
    doc.fillColor('#FFFFFF').fontSize(8).font('Helvetica-Bold')
      .text(data.status, this.W - this.MR - 70, 69, { width: 70, align: 'center' });

    // ── Divider ─────────────────────────────────────────────────────────────
    this.divider(doc, 96);

    // ── Billing info ─────────────────────────────────────────────────────────
    const bY = 108;

    doc.fillColor(this.BRAND_DARK).fontSize(8).font('Helvetica-Bold')
      .text('TAGIHAN KEPADA', this.ML, bY);
    doc.fillColor(this.TEXT_GRAY).fontSize(10).font('Helvetica-Bold')
      .text(data.businessName, this.ML, bY + 14);
    doc.font('Helvetica').fontSize(9)
      .text(data.ownerName,   this.ML, bY + 28)
      .text(data.ownerEmail,  this.ML, bY + 41)
      .text(data.ownerPhone ?? '-', this.ML, bY + 54)
      .text(`Paket: ${data.planType} | ${data.outletCount} Outlet`, this.ML, bY + 67);

    // Detail invoice kanan
    const rX = 360;
    doc.fillColor(this.BRAND_DARK).fontSize(8).font('Helvetica-Bold')
      .text('DETAIL INVOICE', rX, bY);

    const details: [string, string][] = [
      ['Tanggal Terbit    :', data.issuedAt],
      ['Periode Tagihan   :', this.formatBillingPeriod(data.billingPeriod)],
      ['Jatuh Tempo       :', data.dueDate],
    ];
    details.forEach(([label, value], i) => {
      const ry = bY + 14 + i * 16;
      doc.fillColor(this.TEXT_GRAY).fontSize(9).font('Helvetica')
        .text(label, rX, ry)
        .text(value, rX + 110, ry);
    });

    // ── Divider ─────────────────────────────────────────────────────────────
    this.divider(doc, 196);

    // ── Invoice table ────────────────────────────────────────────────────────
    const tY = 208;

    // Header
    doc.rect(this.ML, tY, this.CW, 22).fill(this.BRAND_DARK);
    doc.fillColor('#FFFFFF').fontSize(8).font('Helvetica-Bold')
      .text('DESKRIPSI',  this.ML + 8,  tY + 7)
      .text('PERIODE',    this.ML + 260, tY + 7)
      .text('JUMLAH', 0,  tY + 7, { align: 'right', width: this.W - this.MR });

    // Row
    const rY = tY + 22;
    doc.rect(this.ML, rY, this.CW, 26).fill(this.BRAND_LIGHT);
    doc.fillColor(this.TEXT_GRAY).fontSize(9).font('Helvetica')
      .text(`Langganan Agilix - ${data.planType}`, this.ML + 8, rY + 9)
      .text(this.formatBillingPeriod(data.billingPeriod), this.ML + 260, rY + 9);
    doc.fillColor(this.BRAND_DARK).font('Helvetica-Bold')
      .text(
        `Rp ${Number(data.amount).toLocaleString('id-ID')}`,
        0, rY + 9,
        { align: 'right', width: this.W - this.MR },
      );

    // Total bar
    const totY = rY + 38;
    doc.rect(this.ML + 260, totY, this.CW - 260, 28).fill(this.BRAND_DARK);
    doc.fillColor('#FFFFFF').fontSize(9).font('Helvetica-Bold')
      .text('TOTAL', this.ML + 268, totY + 10)
      .text(
        `Rp ${Number(data.amount).toLocaleString('id-ID')}`,
        0, totY + 10,
        { align: 'right', width: this.W - this.MR },
      );

    // Notes
    if (data.notes) {
      doc.fillColor(this.TEXT_GRAY).fontSize(8).font('Helvetica')
        .text(`Catatan: ${data.notes}`, this.ML, totY + 44, { width: this.CW });
    }

    // ── Divider ─────────────────────────────────────────────────────────────
    this.divider(doc, 310);

    // ── Stamp area ───────────────────────────────────────────────────────────
    const sY = 322;
    doc.rect(this.ML, sY, 160, 80).strokeColor(this.BORDER).lineWidth(0.5).stroke();
    doc.fillColor(this.TEXT_GRAY).fontSize(8).font('Helvetica')
      .text('Tanda Tangan & Stempel', this.ML + 8, sY + 8)
      .text('Agilix', this.ML + 8, sY + 66);

    // ── Footer ───────────────────────────────────────────────────────────────
    const fY = this.H - 50;
    doc.rect(this.ML, fY - 4, this.CW, 1).fill(this.BRAND_DARK);
    doc.fillColor(this.TEXT_GRAY).fontSize(7.5).font('Helvetica')
      .text(
        'Dokumen ini digenerate secara otomatis oleh sistem Agilix. Mohon tidak membalas email ini.',
        this.ML, fY + 4,
        { align: 'center', width: this.CW },
      )
      .text(
        '© 2026 Agilix. All rights reserved.',
        this.ML, fY + 16,
        { align: 'center', width: this.CW },
      );
  }

  private divider(doc: PDFKit.PDFDocument, y: number): void {
    doc.moveTo(this.ML, y)
      .lineTo(this.W - this.MR, y)
      .strokeColor(this.BORDER)
      .lineWidth(0.5)
      .stroke();
  }
}
