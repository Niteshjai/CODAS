import { Pool } from 'pg';
import PDFDocument from 'pdfkit';
import { AssetSnapshotModel } from '../models/assetSnapshot';
import { ConsentModel } from '../models/consent';
import { getLandRecordsByUser } from '../db/queries/landRecords';
import { decryptPII } from '../utils/encryption';

// ─────────────────────────────────────────────────────
// Consolidated asset report — built from exactly the sources the dashboard's
// net worth uses (AA snapshots of the latest active consent, land records when the
// consent covers them, manual assets included in net worth), so the PDF total
// always matches what the user sees. No sample/fallback data: an empty portfolio
// produces an honest "nothing linked yet" report.
// ─────────────────────────────────────────────────────

export interface ReportData {
  name: string;
  generatedAt: Date;
  dataAsOf: string | null;
  totalRupees: number;
  allocation: { label: string; count: number; rupees: number }[];
  accounts: { institution: string; type: string; account: string; rupees: number }[];
  properties: { reference: string; location: string; area: string; rupees: number | null; valuationSource: string | null }[];
  otherAssets: { name: string; category: string; rupees: number }[];
}

const FI_LABELS: Record<string, string> = {
  DEPOSIT: 'Bank deposits',
  TERM_DEPOSIT: 'Fixed deposits',
  RECURRING_DEPOSIT: 'Recurring deposits',
  EQUITY: 'Stocks & shares',
  MUTUAL_FUND: 'Mutual funds',
  INSURANCE_POLICIES: 'Insurance policies',
  NPS: 'National Pension System',
  EPF: 'EPF',
  PPF: 'PPF',
  GSTN: 'GST records',
};
const fiLabel = (t: string) => FI_LABELS[t] ?? t.replace(/_/g, ' ').toLowerCase().replace(/^\w/, c => c.toUpperCase());

const safeDecrypt = (v: string | null | undefined) => {
  if (!v) return null;
  try { return decryptPII(v); } catch { return null; }
};

/** Last 4 characters only — reports are often shared or printed. */
export function maskAccount(ref: string | null | undefined): string {
  const tail = (ref ?? '').replace(/[^0-9A-Za-z]/g, '').slice(-4);
  return tail ? `XXXX${tail}` : '—';
}

const titleCase = (s: string) => s.toLowerCase().replace(/(^|[\s_-])\w/g, m => m.toUpperCase()).replace(/_/g, ' ');

export async function buildReportData(pool: Pool, userId: string): Promise<ReportData> {
  const [summary, snapshots, consents, userRow, manualRows] = await Promise.all([
    AssetSnapshotModel.getSummary(userId),
    AssetSnapshotModel.findByUserId(userId),
    ConsentModel.getActiveConsents(userId),
    pool.query('SELECT name_encrypted FROM users WHERE id = $1', [userId]),
    pool.query(`
      SELECT asset_name, asset_category, current_value_paise
        FROM manual_assets
       WHERE user_id = $1 AND is_active = true AND include_in_networth = true
       ORDER BY current_value_paise DESC NULLS LAST
    `, [userId]),
  ]);

  // Same rule as GET /api/assets/summary: land counts only when the active consent covers it
  const hasLandConsent = consents[0]?.fiTypes?.includes('LAND_RECORDS') ?? false;
  const land = hasLandConsent ? await getLandRecordsByUser(pool, userId) : [];

  const accounts = snapshots
    .map(s => ({ institution: s.institutionName || 'Unknown institution', type: fiLabel(s.fiType), account: maskAccount(s.accountRef), rupees: s.balance || 0 }))
    .sort((a, b) => b.rupees - a.rupees);

  const properties = land.map((r: any) => {
    // Registry identifiers sometimes already carry their own label ("SURVEY-101", "PLOT-45")
    const label = (prefix: string, v: string) => /^[0-9]/.test(v) ? `${prefix} ${v}` : v;
    const ref = r.surveyNumber ? label('Survey', r.surveyNumber) : r.khasraNumber ? label('Khasra', r.khasraNumber) : r.plotNumber ? label('Plot', r.plotNumber) : 'Land record';
    const location = [r.village, r.district, r.state].filter(Boolean).join(', ') || '—';
    const area = r.area_value ? `${Number(r.area_value).toLocaleString('en-IN', { maximumFractionDigits: 2 })} ${r.area_unit ?? ''}`.trim() : '—';
    const paise = r.estimated_value_paise != null ? Number(r.estimated_value_paise) : null;
    return { reference: ref, location, area, rupees: paise != null ? paise / 100 : null, valuationSource: r.valuation_source ?? null };
  });

  const otherAssets = manualRows.rows.map((r: any) => ({
    name: r.asset_name || 'Unnamed asset',
    category: titleCase(String(r.asset_category || 'Other')),
    rupees: Number(r.current_value_paise || 0) / 100,
  }));

  const allocation: ReportData['allocation'] = summary.categoryBreakdown.map(c => ({
    label: fiLabel(c.fiType), count: c.count, rupees: c.totalValue,
  }));
  const landRupees = properties.reduce((s, p) => s + (p.rupees ?? 0), 0);
  if (properties.length) allocation.push({ label: 'Land & property (estimated)', count: properties.length, rupees: landRupees });
  const otherRupees = otherAssets.reduce((s, a) => s + a.rupees, 0);
  if (otherAssets.length) allocation.push({ label: 'Other assets (added by you)', count: otherAssets.length, rupees: otherRupees });
  allocation.sort((a, b) => b.rupees - a.rupees);

  return {
    name: safeDecrypt(userRow.rows[0]?.name_encrypted) || 'Account holder',
    generatedAt: new Date(),
    dataAsOf: summary.lastFetchedAt,
    totalRupees: summary.totalNetWorth + landRupees + otherRupees,
    allocation,
    accounts,
    properties,
    otherAssets,
  };
}

// ── PDF rendering ─────────────────────────────────────

// Helvetica has no ₹ glyph, so amounts use "Rs." with Indian digit grouping
export const formatRs = (rupees: number) =>
  `Rs. ${Math.round(rupees).toLocaleString('en-IN')}`;

const istDateTime = (d: Date) =>
  d.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'long', year: 'numeric', hour: 'numeric', minute: '2-digit' }) + ' IST';

const C = { ink: '#0f172a', body: '#334155', muted: '#64748b', faint: '#94a3b8', line: '#e2e8f0', band: '#0f172a', zebra: '#f8fafc', accent: '#a3e635', headRow: '#1e293b' };
const M = 50;

export function renderReportPdf(data: ReportData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: M, bufferPages: true, info: { Title: 'Consolidated Asset Report', Author: 'Codas' } });
    const chunks: Buffer[] = [];
    const stream = doc as unknown as NodeJS.ReadableStream;
    stream.on('data', (c: Buffer | Uint8Array) => chunks.push(Buffer.from(c)));
    stream.on('end', () => resolve(Buffer.concat(chunks)));
    stream.on('error', reject);

    const W = doc.page.width;
    const H = doc.page.height;
    const contentW = W - M * 2;
    const bottom = H - 70;   // keep clear of the footer

    // Header band (first page)
    doc.rect(0, 0, W, 110).fill(C.band);
    doc.fillColor(C.accent).font('Helvetica-Bold').fontSize(26).text('CODAS', M, 34);
    doc.fillColor(C.faint).font('Helvetica-Bold').fontSize(9).text('WEALTH MANAGEMENT', M, 64, { characterSpacing: 2 });
    doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(17).text('Consolidated Asset Report', M, 36, { width: contentW, align: 'right' });
    doc.fillColor(C.faint).font('Helvetica').fontSize(9).text(`Generated ${istDateTime(data.generatedAt)}`, M, 60, { width: contentW, align: 'right' });

    let y = 135;
    doc.fillColor(C.muted).font('Helvetica').fontSize(10).text('Prepared for ', M, y, { continued: true }).fillColor(C.ink).font('Helvetica-Bold').text(data.name);
    if (data.dataAsOf) {
      doc.fillColor(C.muted).font('Helvetica').fontSize(9).text(`Account data as of ${istDateTime(new Date(data.dataAsOf))}`, M, y + 16);
    }

    y += 46;
    doc.fillColor(C.muted).font('Helvetica-Bold').fontSize(9).text('TOTAL NET WORTH', M, y, { characterSpacing: 1 });
    doc.fillColor(C.ink).font('Helvetica-Bold').fontSize(28).text(formatRs(data.totalRupees), M, y + 14);
    y += 58;

    const ensureSpace = (needed: number, redrawHeader?: () => void) => {
      if (y + needed > bottom) {
        doc.addPage();
        y = M;
        redrawHeader?.();
      }
    };

    const sectionTitle = (title: string, subtitle?: string) => {
      ensureSpace(60);
      y += 14;
      doc.fillColor(C.ink).font('Helvetica-Bold').fontSize(13).text(title, M, y);
      y += 18;
      if (subtitle) {
        doc.fillColor(C.muted).font('Helvetica').fontSize(8.5).text(subtitle, M, y, { width: contentW });
        y += doc.heightOfString(subtitle, { width: contentW }) + 4;
      }
      y += 4;
    };

    // Generic table with page-break-aware header redraw
    const table = (cols: { label: string; width: number; align?: 'left' | 'right' }[], rows: string[][], totalRow?: string[]) => {
      const rowH = 24;
      const header = () => {
        doc.rect(M, y, contentW, rowH).fill(C.headRow);
        let x = M;
        doc.font('Helvetica-Bold').fontSize(8.5).fillColor('#ffffff');
        for (const c of cols) {
          doc.text(c.label.toUpperCase(), x + 10, y + 8, { width: c.width - 20, align: c.align ?? 'left', characterSpacing: 0.5 });
          x += c.width;
        }
        y += rowH;
      };
      ensureSpace(rowH * 2);
      header();
      rows.forEach((r, i) => {
        ensureSpace(rowH, header);
        if (i % 2 === 0) doc.rect(M, y, contentW, rowH).fill(C.zebra);
        let x = M;
        r.forEach((cell, ci) => {
          doc.font(ci === 0 ? 'Helvetica-Bold' : 'Helvetica').fontSize(9).fillColor(ci === 0 ? C.ink : C.body);
          doc.text(cell, x + 10, y + 7.5, { width: cols[ci].width - 20, align: cols[ci].align ?? 'left', lineBreak: false, ellipsis: true });
          x += cols[ci].width;
        });
        y += rowH;
      });
      if (totalRow) {
        ensureSpace(rowH);
        doc.rect(M, y, contentW, rowH).fill('#eef2f7');
        doc.moveTo(M, y).lineTo(M + contentW, y).lineWidth(1).strokeColor('#cbd5e1').stroke();
        let x = M;
        totalRow.forEach((cell, ci) => {
          doc.font('Helvetica-Bold').fontSize(9.5).fillColor(C.ink).text(cell, x + 10, y + 7.5, { width: cols[ci].width - 20, align: cols[ci].align ?? 'left', lineBreak: false });
          x += cols[ci].width;
        });
        y += rowH;
      }
      y += 6;
    };

    const empty = data.allocation.length === 0;

    if (empty) {
      sectionTitle('No assets linked yet');
      const msg = 'This report has nothing to list because no accounts, property records or manual assets are linked to your Codas account yet. Link your bank and investment accounts through the Account Aggregator, search your land records, or add assets manually — then generate this report again.';
      doc.fillColor(C.body).font('Helvetica').fontSize(10).text(msg, M, y, { width: contentW, lineGap: 3 });
      y += doc.heightOfString(msg, { width: contentW, lineGap: 3 }) + 10;
    } else {
      sectionTitle('Asset allocation');
      table(
        [{ label: 'Asset class', width: contentW * 0.46 }, { label: 'Items', width: contentW * 0.12, align: 'right' }, { label: 'Value', width: contentW * 0.26, align: 'right' }, { label: 'Share', width: contentW * 0.16, align: 'right' }],
        data.allocation.map(a => [a.label, String(a.count), formatRs(a.rupees), data.totalRupees > 0 ? `${((a.rupees / data.totalRupees) * 100).toFixed(1)}%` : '—']),
        ['Total', String(data.allocation.reduce((s, a) => s + a.count, 0)), formatRs(data.totalRupees), '100%'],
      );

      if (data.accounts.length) {
        sectionTitle('Financial accounts', 'Balances shared by your institutions through the Account Aggregator (read-only). Account numbers are masked.');
        table(
          [{ label: 'Institution', width: contentW * 0.36 }, { label: 'Type', width: contentW * 0.24 }, { label: 'Account', width: contentW * 0.16 }, { label: 'Balance', width: contentW * 0.24, align: 'right' }],
          data.accounts.map(a => [a.institution, a.type, a.account, formatRs(a.rupees)]),
        );
      }

      if (data.properties.length) {
        sectionTitle('Land & property', 'From state land registries. Values are estimates for information only — not a certified valuation.');
        table(
          [{ label: 'Record', width: contentW * 0.24 }, { label: 'Location', width: contentW * 0.38 }, { label: 'Area', width: contentW * 0.16 }, { label: 'Est. value', width: contentW * 0.22, align: 'right' }],
          data.properties.map(p => [p.reference, p.location, p.area, p.rupees != null ? formatRs(p.rupees) : 'Not valued']),
        );
      }

      if (data.otherAssets.length) {
        sectionTitle('Other assets', 'Assets you added yourself, at the value you entered.');
        table(
          [{ label: 'Asset', width: contentW * 0.48 }, { label: 'Category', width: contentW * 0.28 }, { label: 'Value', width: contentW * 0.24, align: 'right' }],
          data.otherAssets.map(a => [a.name, a.category, formatRs(a.rupees)]),
        );
      }
    }

    // Disclaimer
    const disclaimer = 'This report is generated automatically from data you have linked to Codas: account balances shared by your financial institutions through the RBI Account Aggregator framework, land records from state registries, and assets you added manually. Property values are estimates. It is for your information only and does not constitute tax, legal or financial advice. Keep this document private — it summarises your financial position.';
    ensureSpace(80);
    y += 12;
    doc.moveTo(M, y).lineTo(M + contentW, y).lineWidth(0.5).strokeColor(C.line).stroke();
    y += 10;
    doc.fillColor(C.faint).font('Helvetica').fontSize(7.5).text(disclaimer, M, y, { width: contentW, align: 'justify', lineGap: 2 });

    // Footer on every page
    const range = doc.bufferedPageRange();
    for (let i = range.start; i < range.start + range.count; i++) {
      doc.switchToPage(i);
      // Writing inside the bottom margin would make pdfkit start a new (blank) page
      const savedBottom = doc.page.margins.bottom;
      doc.page.margins.bottom = 0;
      const fy = H - 40;
      doc.fillColor(C.faint).font('Helvetica').fontSize(7.5)
        .text(`Confidential · Prepared for ${data.name}`, M, fy, { width: contentW / 2, lineBreak: false })
        .text(`Page ${i - range.start + 1} of ${range.count}`, M + contentW / 2, fy, { width: contentW / 2, align: 'right', lineBreak: false });
      doc.page.margins.bottom = savedBottom;
    }

    doc.end();
  });
}

export const reportFileName = (d: Date) =>
  `Codas-Asset-Report-${d.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })}.pdf`;
