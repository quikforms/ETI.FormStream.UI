import { EsignData } from '../Response/esign-data.model';

// The initial envelope messaging shown in the modal: an email subject and body the user can edit.
export interface EsignMessaging {
  subject: string;
  body: string;
}

// Used when the launch baseline does not carry a subject.
const DEFAULT_SUBJECT = 'Please e-sign these forms';

// Builds the initial messaging: the values delivered in the launch baseline
// (signSettings.MailSubject / MailBody) when present, otherwise sensible defaults. The default body
// lists the launched form names, mirroring the reference component. Pure — no side effects.
export function buildEsignMessaging(
  esignData: EsignData | null | undefined,
  formNames: string[]
): EsignMessaging {
  const settings = esignData?.signSettings;
  return {
    subject: nonBlank(settings?.MailSubject) ?? DEFAULT_SUBJECT,
    body: nonBlank(settings?.MailBody) ?? buildDefaultBody(formNames)
  };
}

// Returns the trimmed value when it carries text, otherwise undefined (so the caller can fall back).
function nonBlank(value: unknown): string | undefined {
  const text = (value ?? '').toString();
  return text.trim() ? text : undefined;
}

// The default body: an intro line, a bullet list of the form names, and a closing line.
function buildDefaultBody(formNames: string[]): string {
  const bullets = formNames
    .map(name => name.trim())
    .filter(Boolean)
    .map(name => `• ${name}`)
    .join('\n');

  return [
    'The following forms were completed and prepared for you to sign.',
    bullets,
    'Please sign these forms by clicking the link.'
  ]
    .filter(Boolean)
    .join('\n\n');
}
