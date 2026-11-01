// ─────────────────────────────────────────────
// Alert Service
// Fires alerts when anomalies, dormant accounts,
// or missing nominees are detected.
// Wire to MSG91 / Firebase / Twilio when ready.
// ─────────────────────────────────────────────

interface Alert {
  userId:       string
  alertType:    string
  severity:     'info' | 'warning' | 'critical'
  title:        string
  message:      string
  metadata?:    Record<string, any>
  channels?:    ('push' | 'sms' | 'email' | 'whatsapp')[]
}

class AlertService {
  async send(alert: Alert): Promise<void> {
    console.log(`[Alert] ${alert.severity.toUpperCase()} — ${alert.title}`, {
      userId:    alert.userId,
      type:      alert.alertType,
      message:   alert.message,
      channels:  alert.channels ?? ['push'],
      timestamp: new Date().toISOString(),
    })

    // TODO: Wire to actual notification channels
    // - MSG91 for SMS/WhatsApp
    // - Firebase for push notifications
    // - Twilio as fallback
  }

  async sendBulk(alerts: Alert[]): Promise<void> {
    for (const alert of alerts) {
      await this.send(alert)
    }
  }

  async sendAnomalyAlert(
    userId: string,
    assetClass: string,
    institution: string,
    reason: string
  ): Promise<void> {
    await this.send({
      userId,
      alertType:  'anomaly_detected',
      severity:   'warning',
      title:      `Anomaly in ${assetClass}`,
      message:    `Unusual activity detected in your ${assetClass} at ${institution}: ${reason}`,
      channels:   ['push', 'sms'],
    })
  }

  async sendDormantAlert(
    userId: string,
    accountName: string,
    dormantMonths: number
  ): Promise<void> {
    await this.send({
      userId,
      alertType:  'dormant_account',
      severity:   'info',
      title:      'Dormant Account Found',
      message:    `Your account "${accountName}" has been inactive for ${dormantMonths} months. Consider reviewing.`,
      channels:   ['push'],
    })
  }

  async sendNomineeAlert(
    userId: string,
    assetsWithoutNominee: number
  ): Promise<void> {
    await this.send({
      userId,
      alertType:  'missing_nominee',
      severity:   'warning',
      title:      'Nominee Missing',
      message:    `${assetsWithoutNominee} of your assets don't have a nominee assigned. This is important for estate planning.`,
      channels:   ['push'],
    })
  }
}

export const alertService = new AlertService()
