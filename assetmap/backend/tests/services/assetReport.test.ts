import { describe, it, expect, beforeAll, afterAll } from '../testFramework';
import { buildReportData, renderReportPdf, maskAccount, formatRs, reportFileName, type ReportData } from '../../src/services/assetReport';
import { pool } from '../../src/db/connection';
import crypto from 'crypto';

// pdfkit writes one "/Type /Page" dictionary per page (the tree root is "/Type /Pages")
const pageCount = (pdf: Buffer) => (pdf.toString('latin1').match(/\/Type \/Page\b(?!s)/g) ?? []).length;

const sample = (overrides: Partial<ReportData> = {}): ReportData => ({
  name: 'Test User',
  generatedAt: new Date('2026-11-01T06:00:00Z'),
  dataAsOf: '2026-11-01T05:00:00Z',
  totalRupees: 0,
  allocation: [],
  accounts: [],
  properties: [],
  otherAssets: [],
  ...overrides,
});

export function registerAssetReportTests() {
  describe('assetReport (PDF asset report)', () => {
    let emptyUserId: string;

    beforeAll(async () => {
      const r = await pool.query(
        'INSERT INTO users (aadhaar_hash, name_encrypted) VALUES ($1, NULL) RETURNING id',
        [crypto.randomBytes(16).toString('hex')]
      );
      emptyUserId = r.rows[0].id;
    });

    afterAll(async () => {
      if (emptyUserId) await pool.query('DELETE FROM users WHERE id = $1', [emptyUserId]);
    });

    it('never invents holdings for a user with nothing linked', async () => {
      const data = await buildReportData(pool, emptyUserId);
      expect(data.totalRupees).toBe(0);
      expect(data.allocation.length).toBe(0);
      expect(data.accounts.length).toBe(0);
      expect(data.properties.length).toBe(0);
      expect(data.name).toBe('Account holder');
    });

    it('masks account numbers to the last 4 characters', () => {
      expect(maskAccount('123456789012')).toBe('XXXX9012');
      expect(maskAccount('XXXXXXXX1234')).toBe('XXXX1234');
      expect(maskAccount('')).toBe('—');
      expect(maskAccount(null)).toBe('—');
    });

    it('formats rupees with Indian grouping and dates the file in IST', () => {
      expect(formatRs(2535500050 / 100)).toBe('Rs. 2,53,55,001');
      expect(reportFileName(new Date('2026-10-31T20:00:00Z'))).toBe('Codas-Asset-Report-2026-11-01.pdf');
    });

    it('renders a valid single-page PDF without blank trailing pages', async () => {
      const pdf = await renderReportPdf(sample({
        totalRupees: 605001,
        allocation: [{ label: 'Bank deposits', count: 2, rupees: 605001 }],
        accounts: [
          { institution: 'HDFC Bank', type: 'Bank deposits', account: 'XXXX1234', rupees: 450001 },
          { institution: 'State Bank of India', type: 'Bank deposits', account: 'XXXX8877', rupees: 155000 },
        ],
      }));
      expect(pdf.subarray(0, 5).toString()).toBe('%PDF-');
      expect(pageCount(pdf)).toBe(1);
    });

    it('renders the empty-portfolio report on one page', async () => {
      const pdf = await renderReportPdf(sample());
      expect(pageCount(pdf)).toBe(1);
    });

    it('paginates long account lists instead of overflowing', async () => {
      const accounts = Array.from({ length: 70 }, (_, i) => ({
        institution: `Bank ${i + 1}`, type: 'Bank deposits', account: `XXXX${String(1000 + i)}`, rupees: 1000 * (i + 1),
      }));
      const pdf = await renderReportPdf(sample({
        totalRupees: accounts.reduce((s, a) => s + a.rupees, 0),
        allocation: [{ label: 'Bank deposits', count: 70, rupees: accounts.reduce((s, a) => s + a.rupees, 0) }],
        accounts,
      }));
      const pages = pageCount(pdf);
      // ~24pt rows on A4 → 70 rows need 3 pages; anything above 4 means blank pages crept in
      expect(pages >= 2 && pages <= 4).toBe(true);
    });
  });
}
