import { EsignOption } from './esign-option.model';

// DocuSign identity-check types. The engine emits the numeric value in
// esignData.signData.Recipients[].identityCheck; the UI carries it as its string form.
export enum DocusignAuthType {
  NoIDCheck = 0,
  IDCheck = 1,
  SMS = 2,
  Phone = 3,
  LiveID = 4,
  Facebook = 5,
  LinkedIn = 6,
  Google = 7,
  Salesforce = 8,
  Twitter = 9,
  Yahoo = 10,
  OpenID = 11
}

// Dropdown options for the ID CHECK column. "No Identity Check" is the default selection. The
// phone-based checks (SMS, Phone) are what reveal the PHONE column. Social providers are part of
// the enum but omitted from the default option list until a use case requires them.
export const ID_CHECK_OPTIONS: EsignOption<DocusignAuthType>[] = [
  { keyName: DocusignAuthType.NoIDCheck, name: 'No Identity Check', selected: true },
  { keyName: DocusignAuthType.IDCheck, name: 'ID Check' },
  { keyName: DocusignAuthType.SMS, name: 'SMS' },
  { keyName: DocusignAuthType.Phone, name: 'Phone' }
];

// The identity checks that require a phone number (and therefore reveal the PHONE column). Kept with
// the model so this domain rule lives in one place rather than being hardcoded in the UI.
const PHONE_ID_CHECKS: ReadonlySet<string> = new Set([
  DocusignAuthType.SMS.toString(),
  DocusignAuthType.Phone.toString()
]);

export function isPhoneBasedIdCheck(idCheck: string): boolean {
  return PHONE_ID_CHECKS.has(idCheck);
}

// Normalizes a stored/admin-default identity-check value — a numeric auth-type code, or an option name
// such as "SMS" — to the string form of its DocusignAuthType code. Empty or unrecognized values fall
// back to "No Identity Check", so an absent default keeps the current behavior.
export function normalizeIdCheck(value: string | null | undefined): string {
  const raw = (value ?? '').trim();
  if (!raw) { return DocusignAuthType.NoIDCheck.toString(); }
  const match = ID_CHECK_OPTIONS.find(option =>
    option.keyName.toString() === raw || option.name.toLowerCase() === raw.toLowerCase());
  return (match ? match.keyName : DocusignAuthType.NoIDCheck).toString();
}
