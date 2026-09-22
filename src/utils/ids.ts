const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

export const generateShortId = (prefix: string, length = 4): string => {
  let code = '';
  for (let i = 0; i < length; i++) {
    code += CHARS.charAt(Math.floor(Math.random() * CHARS.length));
  }
  return `TTM-${prefix}${code}`;
};

export const generateSaleId = (): string => generateShortId('S');

export const generateDeliveryTicketId = (): string => generateShortId('D');
