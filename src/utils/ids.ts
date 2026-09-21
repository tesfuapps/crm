const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

export const generateShortId = (prefix: string, length = 6): string => {
  let code = '';
  for (let i = 0; i < length; i++) {
    code += CHARS.charAt(Math.floor(Math.random() * CHARS.length));
  }
  return `TTM-${prefix}${code}`;
};

export const generateSaleId = (): string => generateShortId('SAL');

export const generateDeliveryTicketId = (): string => generateShortId('DLV');
