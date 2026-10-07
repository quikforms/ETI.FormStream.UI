import { EsignData } from '../../Response/esign-data.model';
import { DisplaySigner } from '../display-signer.model';
import { buildDisplaySigners } from '../signer-display.builder';

// Test fixtures: fictional recipients, shaped as the launch data carries them.

export const recipient = (name: string, overrides: Record<string, unknown> = {}) => ({
  order: 1, name, mail: `${name.toLowerCase().replace(/\s+/g, '.')}@example.com`, phone: '',
  sendType: 'EmailToSign', identityCheck: 0, role: 'Signer', roleID: 'R1', ...overrides
});

// The display signers the Send for Signature modal would build from these recipients.
export const signersFrom = (...recipients: Record<string, unknown>[]): DisplaySigner[] =>
  buildDisplaySigners(new EsignData('Docusign', { Recipients: recipients }));
