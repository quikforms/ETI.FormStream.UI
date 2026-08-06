import { DocusignSendType } from './esign-send-type.model';

// A single signing role for a recipient, mapped from esignData.signData.Recipients[]. FormStream is
// single-package, so the multi-package role map is omitted; a person (DisplaySigner) may hold several
// of these roles.
export interface ESignSigner {
  order: number;
  name: string;
  mail: string;
  phone: string;
  sendType: DocusignSendType;
  idCheck: string;
  role: string;
  roleID: string;
  signingGroup?: string;
}
