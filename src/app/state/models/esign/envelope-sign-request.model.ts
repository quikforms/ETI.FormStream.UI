// The DocuSign envelope-sign request posted to formstream/docusign/envelope/sign. Mirrors the backend
// DocusignEnvelopeData contract. The vendor-shaped PrintData / SignData / SignSettings are opaque
// pass-throughs — built from the launch baseline with the modal's recipients/messaging merged in — so
// they stay typed as `any` here (their exact shape is the engine's, consumed as-is by the send).
export interface EnvelopeSignRequest {
  CustomerID: string;
  SignSettings: any;
  PackagesData: EnvelopePackageData[];
  EnableInternationalPhoneNumber: boolean;
}

// One package's data in the envelope. FormStream is single-package, so PackagesData holds one entry.
export interface EnvelopePackageData {
  PackageId: string | number;
  PrintData: any;
  SignData: any;
}
