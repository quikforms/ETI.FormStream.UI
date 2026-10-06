import { CountryCode, parsePhoneNumberFromString } from 'libphonenumber-js';

// The country calling code of US numbers.
export const US_COUNTRY_CALLING_CODE = '1';

// Numbers without a leading + are read as US numbers first.
const DEFAULT_COUNTRY: CountryCode = 'US';

// A phone number split into the parts the e-sign request needs, plus its display form.
export interface PhoneNormalizationResult {
  // Formatted for display (national format for US numbers, international otherwise) when the number is
  // usable; otherwise the input exactly as typed, so that reading it again gives the same answer.
  display: string;
  // The number without its country calling code (digits only).
  nationalNumber: string;
  // Country calling code without the + (1-3 digits).
  countryCallingCode: string;
  // Whether the input has a possible length for its country. This is a length check, not proof that the
  // number is in service; empty input is not valid.
  isValid: boolean;
}

// The one way a signer's phone number is read, shared by validation, display and the request builder so
// the three always agree on what the number is. Digit-only input that is not a possible US number is
// retried as an international number, so a full number typed without the + (e.g. 442079460958) is still
// understood. Pure.
export function normalizeSignerPhone(input: string): PhoneNormalizationResult {
  const raw = (input || '').trim();
  const unusable: PhoneNormalizationResult = { display: raw, nationalNumber: '', countryCallingCode: '', isValid: false };
  if (!raw || /[A-Za-z]/.test(raw)) { return unusable; }

  const hasPlus = raw.startsWith('+');
  let phoneNumber = parsePhoneNumberFromString(raw, hasPlus ? undefined : DEFAULT_COUNTRY);
  if (!phoneNumber?.isPossible() && !hasPlus && /^\d+$/.test(raw)) {
    const asInternational = parsePhoneNumberFromString('+' + raw);
    if (asInternational?.isPossible()) { phoneNumber = asInternational; }
  }

  if (!phoneNumber?.isPossible()) { return unusable; }

  return {
    display: phoneNumber.country === DEFAULT_COUNTRY ? phoneNumber.formatNational() : phoneNumber.formatInternational(),
    nationalNumber: phoneNumber.nationalNumber,
    countryCallingCode: phoneNumber.countryCallingCode,
    isValid: true
  };
}
