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
// the three always agree on what the number is. A number without a leading + is read as a US number
// (dialing out with 011 also works); an international number needs the +. Digits without a + are never
// guessed as international: a US number with a digit too many or too few (20255501911, 3125550) is also
// a real number somewhere else (+20, +31), and a wrong guess sends the passcode to the wrong country.
// Pure.
export function normalizeSignerPhone(input: string): PhoneNormalizationResult {
  const raw = (input || '').trim();
  const unusable: PhoneNormalizationResult = { display: raw, nationalNumber: '', countryCallingCode: '', isValid: false };
  if (!raw || /[A-Za-z]/.test(raw)) { return unusable; }

  const phoneNumber = parsePhoneNumberFromString(raw, raw.startsWith('+') ? undefined : DEFAULT_COUNTRY);
  if (!phoneNumber?.isPossible()) { return unusable; }

  return {
    display: phoneNumber.country === DEFAULT_COUNTRY ? phoneNumber.formatNational() : phoneNumber.formatInternational(),
    nationalNumber: phoneNumber.nationalNumber,
    countryCallingCode: phoneNumber.countryCallingCode,
    isValid: true
  };
}
