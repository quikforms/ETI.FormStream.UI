import { DocusignSendType } from './esign-send-type.model';
import { ESignSigner } from './esign-signer.model';

// One row of the signers table: a person who signs, holding one or more signing roles. Built from the
// baseline recipients by grouping roles that belong to the same person (see the signer-display builder).
export interface DisplaySigner {
  key: string;
  order: number;
  name: string;
  mail: string;
  phone: string;
  sendType: DocusignSendType;
  idCheck: string;
  signingGroup?: string;
  signingRoles: ESignSigner[];
  isManuallyAdded?: boolean;
}
