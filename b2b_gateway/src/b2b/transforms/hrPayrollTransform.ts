import { Pool } from 'pg'
import { z }    from 'zod'

export const HRPayrollResponseSchema = z.object({
  requestId:    z.string(),
  userId:       z.string(),
  generatedAt:  z.string(),

  // Employment verification
  employmentProfile: z.object({
    salaryCreditsDetected:      z.boolean(),
    averageMonthlySalaryPaise:  z.number(),
    salaryConsistencyScore:     z.number(),
    monthsOfSalaryHistory:      z.number(),
    estimatedEmployerType:      z.string(),
    lastSalaryCreditDate:       z.string().optional(),
    salaryRangeLabel:           z.string(),
  }),

  // PF / NPS / insurance (employer-linked)
  employerBenefits: z.object({
    hasPF:          z.boolean(),
    hasNPS:         z.boolean(),
    hasGratuity:    z.boolean(),
    pfBalance:      z.string().optional(),
    npsBalance:     z.string().optional(),
  }),

  // Financial health (for ESOP / salary advance eligibility)
  financialHealth: z.object({
    netWorthRange:         z.string(),
    hasOutstandingLoans:   z.boolean(),
    monthlyObligations:    z.string(),
    savingsRatePct:        z.number(),
  }),

  disclaimer: z.string(),
})

export type HRPayrollResponse = z.infer<typeof HRPayrollResponseSchema>

export async function transformForHRPayroll(
  pool:      Pool,
  userId:    string,
  requestId: string
): Promise<HRPayrollResponse> {

  // AA transactions live in the backend's `transactions` table (migrations 020 + 033):
  // date TIMESTAMPTZ, narration, type 'CREDIT'/'DEBIT' (older rows may say CR/DR), and
  // amount DECIMAL in rupees. Salary is summed in integer paise like every other figure here.
  const [txResult, assetsResult] = await Promise.all([
    pool.query(`
      SELECT
        COUNT(*)            AS months,
        AVG(monthly_total)  AS avg_salary,
        MAX(last_credit)    AS last_credit
      FROM (
        SELECT
          DATE_TRUNC('month', t.date)               AS month_date,
          MAX(t.date)                               AS last_credit,
          SUM(ROUND(ABS(t.amount) * 100))::BIGINT   AS monthly_total
        FROM transactions t
        WHERE t.user_id = $1
        AND UPPER(t.type) IN ('CREDIT', 'CR')
        AND COALESCE(t.narration, '') ILIKE ANY(
          ARRAY['%salary%','%sal%','%payroll%','%neft%']
        )
        AND t.date >= NOW() - INTERVAL '12 months'
        GROUP BY DATE_TRUNC('month', t.date)
      ) monthly
    `, [userId]),

    pool.query(`
      SELECT asset_class, current_value_paise
      FROM canonical_assets
      WHERE user_id = $1 AND is_active = true
    `, [userId])
  ])

  const txRow    = txResult.rows[0]
  const assets   = assetsResult.rows

  const avgSalary    = parseFloat(txRow.avg_salary) || 0
  const monthsHistory= parseInt(txRow.months) || 0
  const hasSalary    = avgSalary > 0
  const lastCredit   = txRow.last_credit ? new Date(txRow.last_credit).toISOString() : undefined

  const valueOf = (a: { current_value_paise: string | null }) =>
    parseInt(a.current_value_paise ?? '0', 10) || 0
  const sumClass = (cls: string) =>
    assets.filter(a => a.asset_class === cls).reduce((s, a) => s + valueOf(a), 0)

  // Net worth counts holdings only: insurance values are cover or surrender values, unclaimed
  // registry money isn't recovered yet, and ancestral-search land has no valuation.
  const NOT_HOLDINGS = new Set(['INSURANCE_LIFE', 'INSURANCE_HEALTH', 'INSURANCE_OTHER', 'UNCLAIMED', 'AGRICULTURAL_LAND_MANUAL'])
  const totalAssets  = assets
    .filter(a => !NOT_HOLDINGS.has(a.asset_class))
    .reduce((s, a) => s + valueOf(a), 0)
  const hasPF = assets.some(a => a.asset_class === 'EPF')
  const hasNPS= assets.some(a => a.asset_class === 'NPS')

  const netWorthLabel = (paise: number): string => {
    const v = paise / 100
    if (v < 500000)   return 'Under ₹5L'
    if (v < 2000000)  return '₹5L–₹20L'
    if (v < 10000000) return '₹20L–₹1Cr'
    return 'Above ₹1Cr'
  }

  const salaryLabel = (paise: number): string => {
    const v = paise / 100
    if (v < 30000)  return 'Under ₹30K/month'
    if (v < 75000)  return '₹30K–₹75K/month'
    if (v < 150000) return '₹75K–₹1.5L/month'
    if (v < 500000) return '₹1.5L–₹5L/month'
    return 'Above ₹5L/month'
  }

  return {
    requestId,
    userId,
    generatedAt: new Date().toISOString(),

    employmentProfile: {
      salaryCreditsDetected:     hasSalary,
      averageMonthlySalaryPaise: Math.round(avgSalary),
      salaryConsistencyScore:    monthsHistory >= 12 ? 95 :
                                 monthsHistory >= 9  ? 80 :
                                 monthsHistory >= 6  ? 65 :
                                 monthsHistory >= 3  ? 45 : 20,
      monthsOfSalaryHistory:     monthsHistory,
      estimatedEmployerType:     avgSalary > 500000 ? 'corporate' :
                                 avgSalary > 100000 ? 'mid_size' : 'sme',
      lastSalaryCreditDate:      lastCredit,
      salaryRangeLabel:          salaryLabel(avgSalary),
    },

    employerBenefits: {
      hasPF,
      hasNPS,
      hasGratuity: false,
      pfBalance:   hasPF  ? netWorthLabel(sumClass('EPF')) : undefined,
      npsBalance:  hasNPS ? netWorthLabel(sumClass('NPS')) : undefined,
    },

    financialHealth: {
      netWorthRange:       netWorthLabel(totalAssets),
      hasOutstandingLoans: false,
      monthlyObligations:  'Not determined',
      savingsRatePct:      0,
    },

    disclaimer:
      'This verification is based on user-consented Account Aggregator data. ' +
      'Salary values are estimated from transaction patterns — not a formal ' +
      'payslip verification. Use for indicative purposes only.',
  }
}
