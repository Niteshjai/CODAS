import * as winston from 'winston';

// ─────────────────────────────────────────────
// PII Masking — redact Aadhaar, PAN, mobile
// ─────────────────────────────────────────────

function maskPII(message: string): string {
  // Mask Aadhaar numbers (12 digits) - skip phone numbers ('+') and UUID segments ('-')
  message = message.replace(/(?<![+\-\w])\d{4}\s?\d{4}\s?\d{4}(?![\-\w])/g, 'XXXX-XXXX-XXXX');
  // Mask PAN numbers (ABCDE1234F pattern, any case)
  message = message.replace(/\b[A-Za-z]{5}\d{4}[A-Za-z]\b/g, 'XXXXX****X');
  // Mask mobile numbers (10 digits starting with 6-9, optional +91 / 91 / 0 prefix)
  message = message.replace(/(?<!\d)(?:\+?91[\s-]?|0)?[6-9]\d{9}(?!\d)/g, 'XXXXXX****');
  // Mask remaining long digit runs (bank account numbers), keeping the last 4 for support
  message = message.replace(/(?<![\-\w.])\d{5,14}(\d{4})(?![\-\w.])/g, 'XXXX$1');
  return message;
}

// Keys whose values are always sensitive, whatever their format
const SENSITIVE_KEY = /^(pan(_?(number|no|enc))?|aadhaar.*|mobile.*|phone.*|account_?(number|no|ref)|email.*|otp|.*token|password|.*secret|authorization|cookie)$/i;

function maskValue(value: unknown, seen: WeakSet<object>): unknown {
  if (typeof value === 'string') return maskPII(value);
  if (!value || typeof value !== 'object' || seen.has(value)) return value;
  seen.add(value);
  for (const key of Object.keys(value)) {
    const v = (value as Record<string, unknown>)[key];
    (value as Record<string, unknown>)[key] =
      SENSITIVE_KEY.test(key) && v != null && v !== '' ? '[REDACTED]' : maskValue(v, seen);
  }
  return value;
}

// Walks every string-keyed field (message, stack, top-level meta, nested objects).
// Winston's internal Symbol keys and level/timestamp are left alone.
const piiMaskFormat = winston.format((info) => {
  const seen = new WeakSet<object>();
  seen.add(info);
  for (const key of Object.keys(info)) {
    if (key === 'level' || key === 'timestamp') continue;
    const v = info[key];
    info[key] = SENSITIVE_KEY.test(key) && v != null && v !== '' ? '[REDACTED]' : maskValue(v, seen);
  }
  return info;
});

// ─────────────────────────────────────────────
// Logger Configuration
// ─────────────────────────────────────────────

export const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
    winston.format.errors({ stack: true }),
    piiMaskFormat(),
    winston.format.json()
  ),
  defaultMeta: {
    service: 'assetmap-backend',
  },
  transports: [
    new winston.transports.Console({
      format:
        process.env.NODE_ENV === 'production'
          ? winston.format.json()
          : winston.format.combine(
              winston.format.colorize(),
              winston.format.printf(({ timestamp, level, message, ...meta }) => {
                const metaStr = Object.keys(meta).length > 1 ? ` ${JSON.stringify(meta)}` : '';
                return `${timestamp} [${level}]: ${message}${metaStr}`;
              })
            ),
    }),
    new winston.transports.File({ 
      filename: 'logs/backend-error.log', 
      level: 'error',
      format: winston.format.json()
    }),
  ],
});

// ─────────────────────────────────────────────
// Frontend Error Logger
// ─────────────────────────────────────────────
export const frontendLogger = winston.createLogger({
  level: 'error',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
    piiMaskFormat(),
    winston.format.json()
  ),
  defaultMeta: {
    service: 'assetmap-frontend-client',
  },
  transports: [
    new winston.transports.File({ 
      filename: 'logs/frontend-error.log'
    }),
    // Optionally log to console as well for dev visibility
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
          return `${timestamp} [FRONTEND ${level}]: ${message} ${JSON.stringify(meta)}`;
        })
      )
    })
  ],
});
