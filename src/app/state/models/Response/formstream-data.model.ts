import { Transaction } from './transaction.model';
import { Form } from './form.model';
import { CustomerData } from './customer-data.model';
import { EsignData } from './esign-data.model';

export class FormStreamData {
  constructor(
    public transaction: Transaction = new Transaction(),
    public schemaVersion: string = '',
    public forms: Form[] = [],
    public customerData: CustomerData[] = [],
    public esignData: EsignData | null = null
  ) {}

  static fromRaw = (raw: any): FormStreamData =>
    new FormStreamData(
      Transaction.fromRaw(raw.transaction || {}),
      raw.schemaVersion || '',
      (raw.forms || []).map((f: any) => Form.fromRaw(f)),
      (raw.customerData || []).map((c: any) => CustomerData.fromRaw(c)),
      raw.esignData ? EsignData.fromRaw(raw.esignData) : null
    );

  // Host-agnostic intake: accepts either the full API envelope ({ resultData: {...} })
  // or the resultData content directly, and a string or an already-parsed object
  // (also handles a double-stringified resultData).
  static fromHostPayload = (raw: any): FormStreamData => {
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    let content = parsed?.resultData ?? parsed;
    if (typeof content === 'string') {
      content = JSON.parse(content);
    }
    return FormStreamData.fromRaw(content || {});
  };
}
