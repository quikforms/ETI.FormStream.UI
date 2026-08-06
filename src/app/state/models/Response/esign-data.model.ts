// The e-signature baseline block produced by the launcher backend and carried inside the
// FormStreamData payload (sibling of customerData). It is a vendor-agnostic container: a `vendor`
// discriminator plus the vendor-shaped sign/print payloads, kept opaque here and consumed at send time.
export class EsignData {
  constructor(
    public vendor: string = '',
    public signData: any = null,
    public printData: any = null,
    public signSettings: any = null,
    public defaultIdentityCheckMethod: string = ''
  ) {}

  static fromRaw = (raw: any): EsignData =>
    new EsignData(
      raw.vendor || '',
      raw.signData ?? null,
      raw.printData ?? null,
      raw.signSettings ?? null,
      raw.defaultIdentityCheckMethod ?? ''
    );
}
