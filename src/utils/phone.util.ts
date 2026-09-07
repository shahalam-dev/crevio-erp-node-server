import { isValidPhoneNumber, parsePhoneNumber, type CountryCode } from 'libphonenumber-js';

import { CustomError } from '../exceptions/CustomError';

export const normalizePhone = (phone: string, countryCode?: string): string => {
  const trimmedPhone = phone.trim();
  const country = countryCode ? (countryCode.toUpperCase() as CountryCode) : undefined;

  if (!isValidPhoneNumber(trimmedPhone, country)) {
    throw new CustomError('Invalid phone number', 400);
  }

  const parsed = parsePhoneNumber(trimmedPhone, country);
  if (!parsed) {
    throw new CustomError('Invalid phone number', 400);
  }

  return parsed.format('E.164');
};
