export function normalizeEthiopianPhone(input: string): string {
  if (!input) return '';
  let cleaned = input.replace(/[\s\-\(\)]/g, '');

  if (cleaned.startsWith('+251')) {
    cleaned = '0' + cleaned.slice(4);
  } else if (cleaned.startsWith('251')) {
    cleaned = '0' + cleaned.slice(3);
  }

  if (cleaned.length === 9 && (cleaned.startsWith('9') || cleaned.startsWith('7'))) {
    cleaned = '0' + cleaned;
  }

  return cleaned;
}

export function isValidEthiopianPhone(phone: string): boolean {
  const normalized = normalizeEthiopianPhone(phone);
  return /^(09|07)\d{8}$/.test(normalized);
}
