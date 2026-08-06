import { AttachedFile, PayloadAttachment } from '../attached-file.model';

export class Transaction {
  constructor(
    public sessionId: number = 0,
    public unid: string = '',
    public customerId: string = '',
    public userId: number = 0,
    public productLicenseId: number = 0,
    public packageId: string = '',
    public expires: string = '',
    public copyright: string = '',
    public company: string = '',
    public brand: string = '',
    public product: string = '',
    public productVersion: string = '',
    public eSignTransactionId: string = '',
    public eSignEnvironmentId: string = '',
    public badFormIds: string[] = [],
    public authToken: string = '',
    public refreshToken: string = '',
    public formPackageName: string = '',
    public attachments: AttachedFile[] = []
  ) {}

  static fromRaw = (raw: any): Transaction =>
    new Transaction(
      raw.sessionId || 0, raw.unid || '', raw.customerId || '', raw.userId || 0,
      raw.productLicenseId || 0, raw.packageId || '', raw.expires || '',
      raw.copyright || '', raw.company || '', raw.brand || '', raw.product || '',
      raw.productVersion || '', raw.eSignTransactionId || '', raw.eSignEnvironmentId || '',
      raw.badFormIds || [], raw.authToken || '', raw.refreshToken || '',
      raw.formPackageName || '',
      (raw.attachments || []).map((a: PayloadAttachment) => AttachedFile.fromPayload(a))
    );
}
