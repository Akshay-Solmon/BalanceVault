/**
 * BalanceVault Money Utilities
 * Rule: Never use floating point math on money in the UI.
 * All internal ledger values represent integer paise (1 Rupee = 100 Paise).
 */

/**
 * Format integer paise into Rupee currency string (₹ XX,XXX.XX)
 * Uses Indian numbering format (or standard financial) with exact integer string formatting.
 */
export function formatPaise(
  paise: number | bigint,
  options: {
    showSign?: boolean;
    hideCurrency?: boolean;
    spaceAfterSymbol?: boolean;
  } = {}
): string {
  const isNegative = typeof paise === 'bigint' ? paise < 0n : paise < 0;
  const absPaise = typeof paise === 'bigint' ? (isNegative ? -paise : paise) : Math.abs(Math.round(paise));

  const absPaiseNum = Number(absPaise);
  const rupees = Math.floor(absPaiseNum / 100);
  const remainderPaise = absPaiseNum % 100;

  // Format integer rupees with commas
  const rupeesFormatted = rupees.toLocaleString('en-IN');
  const paiseFormatted = remainderPaise.toString().padStart(2, '0');

  const symbol = options.hideCurrency ? '' : (options.spaceAfterSymbol ? '₹ ' : '₹');
  const sign = isNegative ? '-' : options.showSign ? '+' : '';

  return `${sign}${symbol}${rupeesFormatted}.${paiseFormatted}`;
}

/**
 * Parse a user input string (e.g. "1500.50" or "500") into exact integer paise.
 * Never uses parseFloat() to avoid IEEE 754 float precision loss.
 */
export function parseRupeesToPaise(input: string): {
  paise: number;
  valid: boolean;
  error?: string;
} {
  const trimmed = input.trim();
  if (!trimmed) {
    return { paise: 0, valid: false, error: 'Amount is required' };
  }

  // Sanitize out currency symbol if user typed it
  const clean = trimmed.replace(/^₹\s*/, '').replace(/,/g, '');

  if (!/^\d+(\.\d{1,2})?$/.test(clean)) {
    return {
      paise: 0,
      valid: false,
      error: 'Please enter a valid amount with up to 2 decimal places (e.g. 500.00)',
    };
  }

  const parts = clean.split('.');
  const wholePart = parseInt(parts[0], 10);
  if (isNaN(wholePart) || wholePart < 0) {
    return { paise: 0, valid: false, error: 'Invalid amount' };
  }

  let fractionPart = 0;
  if (parts.length > 1) {
    fractionPart = parseInt(parts[1].padEnd(2, '0').slice(0, 2), 10);
  }

  const totalPaise = wholePart * 100 + fractionPart;

  if (totalPaise <= 0) {
    return { paise: 0, valid: false, error: 'Amount must be greater than zero' };
  }

  if (totalPaise > 100_000_000_00) { // Max 10 Crore ₹
    return { paise: 0, valid: false, error: 'Amount exceeds maximum permitted single transaction limit' };
  }

  return { paise: totalPaise, valid: true };
}

/**
 * Convert backend float / number to integer paise safely
 * Backend Prisma currently stores balance as float (e.g. 1000.0 = 100,000 paise).
 */
export function floatToPaise(val: number | null | undefined): number {
  if (val === null || val === undefined || isNaN(val)) return 0;
  return Math.round(val * 100);
}

/**
 * Convert integer paise to backend float if required for API compatibility
 */
export function paiseToFloat(paise: number): number {
  return Math.round(paise) / 100;
}
