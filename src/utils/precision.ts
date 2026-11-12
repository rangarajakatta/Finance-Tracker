/**
 * Financial precision utilities to prevent IEEE 754 floating point rounding drift
 * (e.g., prevents 1500 from becoming 1499.97 or 1500.0000000000002) and format
 * monetary numbers cleanly without decimals, in absolute values with commas.
 */

export const roundTo2Decimals = (num: number): number => {
  if (isNaN(num) || !isFinite(num)) return 0;
  return Math.round((num + Number.EPSILON) * 100) / 100;
};

export const parseAmountInput = (val: string | number | undefined | null): number => {
  if (val === undefined || val === null || val === '') return 0;
  if (typeof val === 'number') {
    return roundTo2Decimals(val);
  }
  // Strip commas, currency symbols, and extra spaces
  const cleaned = val.toString().replace(/,/g, '').replace(/[^0-9.-]/g, '').trim();
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : roundTo2Decimals(parsed);
};

export const calculateRemaining = (totalAmount: number, paidAmount: number = 0): number => {
  const total = roundTo2Decimals(totalAmount);
  const paid = roundTo2Decimals(paidAmount);
  return Math.max(0, roundTo2Decimals(total - paid));
};

/**
 * Formats a monetary number in its absolute value, without any decimals,
 * and with commas according to Indian Rupee (en-IN) numbering.
 * Example: 1500.5 -> "1,501", 100000 -> "1,00,000", -250 -> "250"
 */
export const formatAmount = (num: number | undefined | null): string => {
  if (num === undefined || num === null || isNaN(num) || !isFinite(num)) return '0';
  const roundedAbs = Math.round(Math.abs(num));
  return roundedAbs.toLocaleString('en-IN');
};

