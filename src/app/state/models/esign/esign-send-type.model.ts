import { EsignOption } from './esign-option.model';

// DocuSign send-type codes. These match the values the engine emits in
// esignData.signData.Recipients[].sendType and the values selected in the signers table.
export enum DocusignSendType {
  None = 'None',
  EmailToSign = 'ETS',
  SendCopy = 'SC',
  InPersonSigner = 'IPS',
  Agent = 'AG',
  CertifiedDeliveries = 'CD',
  Editor = 'ED'
}

// Dropdown options for the SEND TYPE column. "Email To Sign" is the default selection.
export const SEND_TYPE_OPTIONS: EsignOption<DocusignSendType>[] = [
  { keyName: DocusignSendType.None, name: '' },
  { keyName: DocusignSendType.EmailToSign, name: 'Email To Sign', selected: true },
  { keyName: DocusignSendType.SendCopy, name: 'Send Copy' },
  { keyName: DocusignSendType.InPersonSigner, name: 'In Person Signer' },
  { keyName: DocusignSendType.Agent, name: 'Agent' },
  { keyName: DocusignSendType.CertifiedDeliveries, name: 'Certified Deliveries' },
  { keyName: DocusignSendType.Editor, name: 'Editor' }
];
