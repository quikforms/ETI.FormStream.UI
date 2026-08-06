import { EsignData } from '../Response/esign-data.model';
import { DisplaySigner } from './display-signer.model';
import { ESignSigner } from './esign-signer.model';
import { DocusignSendType } from './esign-send-type.model';
import { DocusignAuthType } from './esign-auth-type.model';

// UI defaults applied when the baseline does not carry an explicit value.
const DEFAULT_SEND_TYPE = DocusignSendType.EmailToSign;
const DEFAULT_ID_CHECK = String(DocusignAuthType.NoIDCheck);

const SEND_TYPE_VALUES: ReadonlySet<string> = new Set(Object.values(DocusignSendType));

// Builds the signers-table rows from the engine-produced e-sign baseline.
//
// Each recipient in esignData.signData.Recipients is one signing role; recipients that belong to the
// same person (matched by name + email) are grouped into a single DisplaySigner holding all of that
// person's roles. Rows are ordered by signing order. Pure — no Angular dependencies, so it is trivially
// unit-testable and free of side effects.
export function buildDisplaySigners(esignData: EsignData | null | undefined): DisplaySigner[] {
  const roles = readRecipients(esignData).map(toSigner);
  return roles.length ? groupByPerson(roles) : [];
}

// Reads the recipients array from the baseline (esignData.signData.Recipients). Guards against a
// missing or malformed block by always returning an array.
function readRecipients(esignData: EsignData | null | undefined): any[] {
  const recipients = esignData?.signData?.Recipients;
  return Array.isArray(recipients) ? recipients : [];
}

// Maps one raw baseline recipient onto an ESignSigner, applying the UI defaults for missing values.
function toSigner(raw: any): ESignSigner {
  return {
    order: Number(raw?.order) || 0,
    name: (raw?.name ?? '').toString(),
    mail: (raw?.mail ?? '').toString(),
    phone: (raw?.phone || raw?.phoneNumber || '').toString(),
    sendType: coerceSendType(raw?.sendType),
    idCheck: coerceIdCheck(raw?.identityCheck),
    role: (raw?.role ?? '').toString(),
    roleID: (raw?.roleID ?? '').toString(),
    signingGroup: raw?.signingGroup ? raw.signingGroup.toString() : undefined
  };
}

// A recognized non-None code is kept; anything else (None, empty, unknown) falls back to the default.
function coerceSendType(code: unknown): DocusignSendType {
  const value = (code ?? '').toString();
  return value && value !== DocusignSendType.None && SEND_TYPE_VALUES.has(value)
    ? (value as DocusignSendType)
    : DEFAULT_SEND_TYPE;
}

// The baseline carries identityCheck as a number; the UI carries it as its string form.
function coerceIdCheck(identityCheck: unknown): string {
  const value = Number(identityCheck);
  return Number.isFinite(value) ? value.toString() : DEFAULT_ID_CHECK;
}

// Groups roles into one DisplaySigner per person, preserving signing order.
function groupByPerson(roles: ESignSigner[]): DisplaySigner[] {
  const groups = new Map<string, ESignSigner[]>();
  roles.forEach((role, index) => {
    const key = personKey(role, index);
    const group = groups.get(key);
    if (group) { group.push(role); } else { groups.set(key, [role]); }
  });

  const signers: DisplaySigner[] = [];
  groups.forEach((group, key) => {
    const [first] = group;
    signers.push({
      key,
      order: Math.min(...group.map(role => role.order)),
      name: first.name,
      mail: first.mail,
      phone: first.phone,
      sendType: first.sendType,
      idCheck: first.idCheck,
      signingGroup: first.signingGroup,
      signingRoles: group,
      isManuallyAdded: false
    });
  });

  return signers.sort((a, b) => a.order - b.order);
}

// Groups by person (name + email). Unassigned roles (no name or email) have no person identity, so
// each stays its own row — keyed by position so two distinct unassigned recipients never collapse.
function personKey(role: ESignSigner, index: number): string {
  const name = role.name.trim().toLowerCase();
  const mail = role.mail.trim().toLowerCase();
  return name || mail ? `${name}|${mail}` : `unassigned:${index}`;
}
