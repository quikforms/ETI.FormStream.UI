export class CustomerField {
  constructor(
    public fieldName: string = '',
    public fieldValue: string = ''
  ) {}

  static fromRaw = (raw: any): CustomerField =>
    new CustomerField(raw.fieldName || '', raw.fieldValue || '');
}

export class CustomerData {
  constructor(
    public formId: string = '',
    public formInstance: number = 0,
    public fields: CustomerField[] = []
  ) {}

  static fromRaw = (raw: any): CustomerData =>
    new CustomerData(
      raw.formId || '', raw.formInstance || 0,
      (raw.fields || []).map((f: any) => CustomerField.fromRaw(f))
    );
}
