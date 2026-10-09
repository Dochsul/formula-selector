export function calculateEanCheckDigit(digitsWithoutCheck: string): number {
  if (!digitsWithoutCheck || !/^\d+$/.test(digitsWithoutCheck)) {
    throw new Error('В строке должны быть только цифры');
  }

  const len = digitsWithoutCheck.length;
  let sum = 0;

  for (let i = 0; i < len; i++) {
    const digit = Number.parseInt(digitsWithoutCheck[i], 10);
    const weight = len === 12 ? (i % 2 === 0 ? 1 : 3) : i % 2 === 0 ? 3 : 1;
    sum += digit * weight;
  }

  const remainder = sum % 10;
  return remainder === 0 ? 0 : 10 - remainder;
}

export function isValidBarcode(barcode: string): {
  valid: boolean;
  format?: 'EAN-13' | 'EAN-8';
  error?: string;
} {
  const clean = barcode.trim();

  if (!clean) {
    return { valid: false, error: 'Штрихкод не может быть пустым' };
  }

  if (!/^\d+$/.test(clean)) {
    return { valid: false, error: 'Штрихкод должен содержать только цифры' };
  }

  if (clean.length === 13) {
    const payload = clean.slice(0, 12);
    const expected = calculateEanCheckDigit(payload);
    const actual = Number.parseInt(clean[12], 10);

    return expected === actual
      ? { valid: true, format: 'EAN-13' }
      : {
          valid: false,
          error: `Неверная контрольная цифра (ожидается ${expected}, получена ${actual})`
        };
  }

  if (clean.length === 8) {
    const payload = clean.slice(0, 7);
    const expected = calculateEanCheckDigit(payload);
    const actual = Number.parseInt(clean[7], 10);

    return expected === actual
      ? { valid: true, format: 'EAN-8' }
      : {
          valid: false,
          error: `Неверная контрольная цифра (ожидается ${expected}, получена ${actual})`
        };
  }

  return {
    valid: false,
    error: 'Длина штрихкода должна составлять 8 или 13 цифр'
  };
}
